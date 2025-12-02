import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { generateTuitionReceiptPDF, TuitionReceiptData } from '@/lib/receipt'
import { sendTuitionReceipt } from '@/lib/email'

// GET /api/admin/tuition-payments/[id]/receipt - Download tuition payment receipt
export const GET = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const paymentId = params.id
    const url = new URL(req.url)
    const download = url.searchParams.get('download') === 'true'

    // Get payment with enrollment details
    const payment = await prisma.tuitionPayment.findUnique({
      where: { id: paymentId },
      include: {
        enrollment: {
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
                paidAt: {
                  lte: new Date(), // Only payments up to current payment
                },
              },
              orderBy: {
                paidAt: 'asc',
              },
            },
          },
        },
      },
    })

    if (!payment) {
      return createErrorResponse('Payment not found', 404)
    }

    if (payment.status !== 'completed') {
      return createErrorResponse('Receipt can only be generated for completed payments', 400)
    }

    // Calculate total paid up to this payment
    const totalPaid = payment.enrollment.tuitionPayments
      .filter((p: any) => p.paidAt && p.paidAt <= payment.paidAt!)
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    // Prepare receipt data
    const receiptData: TuitionReceiptData = {
      receiptNumber: payment.receiptNumber,
      enrollment: {
        id: payment.enrollment.id,
        firstName: payment.enrollment.firstName,
        lastName: payment.enrollment.lastName,
        email: payment.enrollment.email,
        phone: payment.enrollment.phone || undefined,
      },
      course: {
        title: payment.enrollment.course.title,
        instrument: payment.enrollment.course.instrument,
        level: payment.enrollment.course.level,
        instructor: payment.enrollment.course.instructor?.name,
      },
      payment: {
        amount: payment.amount,
        paidAt: payment.paidAt!.toISOString(),
        description: payment.description || undefined,
        paymentMethod: payment.paymentMethod,
      },
      totalPaid,
    }

    // Generate PDF
    const pdfBuffer = generateTuitionReceiptPDF(receiptData)

    // Update receipt generated status
    if (!payment.receiptGenerated) {
      await prisma.tuitionPayment.update({
        where: { id: paymentId },
        data: { receiptGenerated: true },
      })
    }

    if (download) {
      // Return PDF for download
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="tuition-receipt-${payment.receiptNumber}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })
    }

    // Return receipt data
    return createResponse({
      receiptData,
      message: 'Receipt data retrieved successfully',
    })

  } catch (error) {
    console.error('Get tuition receipt error:', error)
    return createErrorResponse('Failed to generate receipt', 500)
  }
})

// POST /api/admin/tuition-payments/[id]/receipt - Send tuition payment receipt email
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const paymentId = params.id

    // Get payment with enrollment details
    const payment = await prisma.tuitionPayment.findUnique({
      where: { id: paymentId },
      include: {
        enrollment: {
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
                paidAt: {
                  lte: new Date(),
                },
              },
              orderBy: {
                paidAt: 'asc',
              },
            },
          },
        },
      },
    })

    if (!payment) {
      return createErrorResponse('Payment not found', 404)
    }

    if (payment.status !== 'completed') {
      return createErrorResponse('Receipt can only be sent for completed payments', 400)
    }

    // Calculate total paid up to this payment
    const totalPaid = payment.enrollment.tuitionPayments
      .filter((p: any) => p.paidAt && p.paidAt <= payment.paidAt!)
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    // Prepare receipt data
    const receiptData: TuitionReceiptData = {
      receiptNumber: payment.receiptNumber,
      enrollment: {
        id: payment.enrollment.id,
        firstName: payment.enrollment.firstName,
        lastName: payment.enrollment.lastName,
        email: payment.enrollment.email,
        phone: payment.enrollment.phone || undefined,
      },
      course: {
        title: payment.enrollment.course.title,
        instrument: payment.enrollment.course.instrument,
        level: payment.enrollment.course.level,
        instructor: payment.enrollment.course.instructor?.name,
      },
      payment: {
        amount: payment.amount,
        paidAt: payment.paidAt!.toISOString(),
        description: payment.description || undefined,
        paymentMethod: payment.paymentMethod,
      },
      totalPaid,
    }

    // Generate PDF
    const pdfBuffer = generateTuitionReceiptPDF(receiptData)

    // Send email
    const emailSent = await sendTuitionReceipt(receiptData, pdfBuffer)

    // Update receipt status
    await prisma.tuitionPayment.update({
      where: { id: paymentId },
      data: {
        receiptGenerated: true,
        receiptSent: emailSent,
      },
    })

    return createResponse({
      message: emailSent ? 'Receipt sent successfully' : 'Failed to send receipt email',
      receiptNumber: payment.receiptNumber,
      emailSent,
    })

  } catch (error) {
    console.error('Send tuition receipt error:', error)
    return createErrorResponse('Failed to send receipt', 500)
  }
})