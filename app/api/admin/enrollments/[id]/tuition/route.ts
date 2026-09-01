import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { generateTuitionReceiptPDF, generateReceiptNumber, TuitionReceiptData } from '@/lib/receipt'
import { sendTuitionReceipt } from '@/lib/email'
import { logAdminAction } from '@/lib/audit'

// POST /api/admin/enrollments/[id]/tuition - Record tuition payment
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const enrollmentId = params.id
    const data = await req.json()

    const {
      amount,
      paymentMethod,
      description,
      sendReceipt = true,
      paymentType = 'full', // 'full' | 'partial' — admin marker; balance is computed regardless
    } = data

    // Validation
    if (!amount || !paymentMethod) {
      return createErrorResponse('Amount and payment method are required', 400)
    }

    if (amount <= 0) {
      return createErrorResponse('Amount must be greater than 0', 400)
    }

    // Check if enrollment exists and application fee is paid
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, dateOfBirth: true, address: true },
        },
        course: {
          include: {
            instructor: {
              select: {
                name: true,
              },
            },
          },
        },
        tuitionPayments: {
          // Count everything already paid toward tuition (full + partial) for the balance.
          where: {
            status: { in: ['completed', 'partial'] },
          },
        },
      },
    })

    if (!enrollment) {
      return createErrorResponse('Enrollment not found', 404)
    }

    if (!enrollment.applicationPaid) {
      return createErrorResponse('Application fee must be paid before recording tuition payments', 400)
    }

    // Generate unique receipt number
    const receiptNumber = generateReceiptNumber('TUI')

    // Full payment settles the tuition (status 'completed'); partial leaves a balance.
    const status = paymentType === 'partial' ? 'partial' : 'completed'

    // Create tuition payment record
    const tuitionPayment = await prisma.tuitionPayment.create({
      data: {
        enrollmentId,
        amount,
        paymentMethod,
        description,
        status,
        paidAt: new Date(),
        receiptNumber,
        recordedBy: admin.id,
        receiptGenerated: false,
        receiptSent: false,
      },
    })

    // Total paid to date = all prior tuition payments (full + partial) + this one.
    const totalPaid = enrollment.tuitionPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0) + amount

    // Expected tuition = the course's price for the student's selected mode (D3).
    // If the course has no price for that mode, we simply omit the balance (never block).
    const pricing = (enrollment.course.pricing ?? null) as Record<string, number> | null
    const expectedTotal =
      pricing && enrollment.selectedMode ? pricing[enrollment.selectedMode] : undefined
    const remainingBalance =
      typeof expectedTotal === 'number' ? Math.max(0, expectedTotal - totalPaid) : undefined

    await logAdminAction({
      adminId: admin.id,
      action: 'tuition.record',
      entityType: 'tuition_payment',
      entityId: tuitionPayment.id,
      metadata: { enrollmentId, amount, paymentType: status, totalPaid, remainingBalance },
    })

    // Generate and send receipt if requested
    if (sendReceipt) {
      try {
        // Prepare receipt data
        const receiptData: TuitionReceiptData = {
          receiptNumber,
          enrollment: {
            id: enrollment.id,
            firstName: enrollment.student.firstName,
            lastName: enrollment.student.lastName,
            email: enrollment.student.email,
            phone: enrollment.student.phone || undefined,
          },
          course: {
            title: enrollment.course.title,
            instrument: enrollment.course.instrument,
            level: enrollment.course.level,
            instructor: enrollment.course.instructor?.name,
          },
          payment: {
            amount,
            paidAt: tuitionPayment.paidAt!.toISOString(),
            description,
            paymentMethod,
          },
          totalPaid,
          remainingBalance,
          paymentType: status,
        }

        // Generate PDF
        const pdfBuffer = generateTuitionReceiptPDF(receiptData)

        // Send email
        const emailSent = await sendTuitionReceipt(receiptData, pdfBuffer)

        // Update receipt status
        await prisma.tuitionPayment.update({
          where: { id: tuitionPayment.id },
          data: {
            receiptGenerated: true,
            receiptSent: emailSent,
          },
        })
      } catch (receiptError) {
        console.error('Failed to generate/send receipt:', receiptError)
        // Continue even if receipt fails - payment is still recorded
      }
    }

    // Return the created payment
    const createdPayment = await prisma.tuitionPayment.findUnique({
      where: { id: tuitionPayment.id },
      include: {
        enrollment: {
          select: {
            student: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    })

    return createResponse({
      payment: createdPayment,
      message: 'Tuition payment recorded successfully',
    }, 201)

  } catch (error) {
    console.error('Record tuition payment error:', error)
    return createErrorResponse('Failed to record tuition payment', 500)
  }
})

// GET /api/admin/enrollments/[id]/tuition - Get tuition payments for enrollment
export const GET = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const enrollmentId = params.id

    const tuitionPayments = await prisma.tuitionPayment.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'desc' },
    })

    return createResponse({
      payments: tuitionPayments,
    })

  } catch (error) {
    console.error('Get tuition payments error:', error)
    return createErrorResponse('Failed to fetch tuition payments', 500)
  }
})