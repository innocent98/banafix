import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import {
  generateApplicationFeeReceiptPDF,
  ApplicationFeeReceiptData,
  generateReceiptNumber
} from '@/lib/receipt'
import { sendApplicationFeeReceipt } from '@/lib/email'

// GET /api/receipts/application-fee/[enrollmentId] - Generate and optionally send application fee receipt
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const params = await context.params
    const enrollmentId = params.enrollmentId
    const url = new URL(req.url)
    const sendEmail = url.searchParams.get('send') === 'true'
    const download = url.searchParams.get('download') === 'true'

    // Get enrollment with payment details
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
        applicationPayments: {
          where: {
            status: 'completed',
          },
          orderBy: {
            paidAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!enrollment) {
      return createErrorResponse('Enrollment not found', 404)
    }

    const completedPayment = enrollment.applicationPayments[0]
    if (!completedPayment) {
      return createErrorResponse('No completed application payment found', 404)
    }

    // Prepare receipt data
    const receiptData: ApplicationFeeReceiptData = {
      receiptNumber: completedPayment.receiptNumber,
      enrollment: {
        id: enrollment.id,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        email: enrollment.student.email,
        phone: enrollment.student.phone || undefined,
        createdAt: enrollment.createdAt.toISOString(),
      },
      course: {
        title: enrollment.course.title,
        instrument: enrollment.course.instrument,
        level: enrollment.course.level,
        duration: enrollment.course.duration,
        instructor: enrollment.course.instructor?.name,
        sessionStartDate: enrollment.course.sessionStartDate?.toISOString(),
      },
      payment: {
        amount: completedPayment.amount,
        paidAt: completedPayment.paidAt!.toISOString(),
        reference: completedPayment.paystackReference!,
        paymentMethod: completedPayment.paymentMethod,
      },
    }

    // Generate PDF
    const pdfBuffer = generateApplicationFeeReceiptPDF(receiptData)

    // Send email if requested
    if (sendEmail) {
      const emailSent = await sendApplicationFeeReceipt(receiptData, pdfBuffer)

      if (emailSent) {
        // Update receipt sent status
        await prisma.applicationPayment.update({
          where: { id: completedPayment.id },
          data: {
            receiptGenerated: true,
            receiptSent: true,
          },
        })
      }

      return createResponse({
        message: emailSent ? 'Receipt sent successfully' : 'Failed to send receipt email',
        receiptNumber: receiptData.receiptNumber,
        emailSent,
      })
    }

    // Return PDF for download if requested
    if (download) {
      return new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="application-fee-receipt-${receiptData.receiptNumber}.pdf"`,
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
    console.error('Generate application fee receipt error:', error)
    return createErrorResponse('Failed to generate receipt', 500)
  }
}

// POST /api/receipts/application-fee/[enrollmentId] - Regenerate and send receipt
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const params = await context.params
    const enrollmentId = params.enrollmentId

    // Get enrollment with payment details
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
        applicationPayments: {
          where: {
            status: 'completed',
          },
          orderBy: {
            paidAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!enrollment) {
      return createErrorResponse('Enrollment not found', 404)
    }

    const completedPayment = enrollment.applicationPayments[0]
    if (!completedPayment) {
      return createErrorResponse('No completed application payment found', 404)
    }

    // Prepare receipt data
    const receiptData: ApplicationFeeReceiptData = {
      receiptNumber: completedPayment.receiptNumber,
      enrollment: {
        id: enrollment.id,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        email: enrollment.student.email,
        phone: enrollment.student.phone || undefined,
        createdAt: enrollment.createdAt.toISOString(),
      },
      course: {
        title: enrollment.course.title,
        instrument: enrollment.course.instrument,
        level: enrollment.course.level,
        duration: enrollment.course.duration,
        instructor: enrollment.course.instructor?.name,
        sessionStartDate: enrollment.course.sessionStartDate?.toISOString(),
      },
      payment: {
        amount: completedPayment.amount,
        paidAt: completedPayment.paidAt!.toISOString(),
        reference: completedPayment.paystackReference!,
        paymentMethod: completedPayment.paymentMethod,
      },
    }

    // Generate PDF
    const pdfBuffer = generateApplicationFeeReceiptPDF(receiptData)

    // Send email
    const emailSent = await sendApplicationFeeReceipt(receiptData, pdfBuffer)

    if (emailSent) {
      // Update receipt sent status
      await prisma.applicationPayment.update({
        where: { id: completedPayment.id },
        data: {
          receiptGenerated: true,
          receiptSent: true,
        },
      })
    }

    return createResponse({
      message: emailSent ? 'Receipt regenerated and sent successfully' : 'Failed to send receipt email',
      receiptNumber: receiptData.receiptNumber,
      emailSent,
    })

  } catch (error) {
    console.error('Regenerate application fee receipt error:', error)
    return createErrorResponse('Failed to regenerate receipt', 500)
  }
}