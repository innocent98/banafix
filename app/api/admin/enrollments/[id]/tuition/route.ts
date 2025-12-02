import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { generateTuitionReceiptPDF, generateReceiptNumber, TuitionReceiptData } from '@/lib/receipt'
import { sendTuitionReceipt } from '@/lib/email'

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
          where: {
            status: 'completed',
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

    // Create tuition payment record
    const tuitionPayment = await prisma.tuitionPayment.create({
      data: {
        enrollmentId,
        amount,
        paymentMethod,
        description,
        status: 'completed',
        paidAt: new Date(),
        receiptNumber,
        recordedBy: admin.id,
        receiptGenerated: false,
        receiptSent: false,
      },
    })

    // Calculate total paid so far
    const totalPaid = enrollment.tuitionPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0) + amount

    // Generate and send receipt if requested
    if (sendReceipt) {
      try {
        // Prepare receipt data
        const receiptData: TuitionReceiptData = {
          receiptNumber,
          enrollment: {
            id: enrollment.id,
            firstName: enrollment.firstName,
            lastName: enrollment.lastName,
            email: enrollment.email,
            phone: enrollment.phone || undefined,
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
            firstName: true,
            lastName: true,
            email: true,
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