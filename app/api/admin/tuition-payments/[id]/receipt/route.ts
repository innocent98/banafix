import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { generateTuitionReceiptPDF } from '@/lib/receipt'
import { sendTuitionReceipt } from '@/lib/email'
import { loadTuitionReceiptData } from '@/lib/tuition-receipt-data'

// Receipts are point-in-time (T13): a later top-up never changes what an old receipt says.

// GET /api/admin/tuition-payments/[id]/receipt - Download tuition payment receipt
export const GET = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const paymentId = params.id
    const download = new URL(req.url).searchParams.get('download') === 'true'

    const exists = await prisma.tuitionPayment.findUnique({ where: { id: paymentId }, select: { id: true, receiptGenerated: true, receiptNumber: true } })
    if (!exists) return createErrorResponse('Payment not found', 404)

    const receiptData = await loadTuitionReceiptData(prisma, paymentId)
    if (!receiptData) return createErrorResponse('Receipt can only be generated for recorded payments', 400)

    const pdfBuffer = generateTuitionReceiptPDF(receiptData)

    if (!exists.receiptGenerated) {
      await prisma.tuitionPayment.update({ where: { id: paymentId }, data: { receiptGenerated: true } })
    }

    if (download) {
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="tuition-receipt-${exists.receiptNumber}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })
    }

    return createResponse({ receiptData, message: 'Receipt data retrieved successfully' })
  } catch (error) {
    console.error('Get tuition receipt error:', error)
    return createErrorResponse('Failed to generate receipt', 500)
  }
})

// POST /api/admin/tuition-payments/[id]/receipt - Send tuition payment receipt email (student copy + admin copy)
export const POST = withAuth(async (_req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const paymentId = params.id

    const exists = await prisma.tuitionPayment.findUnique({ where: { id: paymentId }, select: { id: true, receiptNumber: true } })
    if (!exists) return createErrorResponse('Payment not found', 404)

    const receiptData = await loadTuitionReceiptData(prisma, paymentId)
    if (!receiptData) return createErrorResponse('Receipt can only be sent for recorded payments', 400)

    const pdfBuffer = generateTuitionReceiptPDF(receiptData)
    // TODO(S7): route this send through the communications outbox instead of calling lib/email.ts directly.
    const emailSent = await sendTuitionReceipt(receiptData, pdfBuffer)

    await prisma.tuitionPayment.update({
      where: { id: paymentId },
      data: { receiptGenerated: true, receiptSent: emailSent },
    })

    return createResponse({
      message: emailSent ? 'Receipt sent successfully' : 'Failed to send receipt email',
      receiptNumber: exists.receiptNumber,
      emailSent,
    })
  } catch (error) {
    console.error('Send tuition receipt error:', error)
    return createErrorResponse('Failed to send receipt', 500)
  }
})
