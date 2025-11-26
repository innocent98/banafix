import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/courses/[id]/faqs/[faqId] - Update FAQ
export const PUT = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string, faqId: string } }) => {
  try {
    const { faqId } = params
    const data = await req.json()

    const { question, answer, order } = data

    const updateData: any = {}
    if (question !== undefined) updateData.question = question
    if (answer !== undefined) updateData.answer = answer
    if (order !== undefined) updateData.order = order

    const faq = await prisma.courseFAQ.update({
      where: { id: faqId },
      data: updateData,
    })

    return createResponse({ faq })
  } catch (error) {
    console.error('Update FAQ error:', error)
    return createErrorResponse('Failed to update FAQ', 500)
  }
})

// DELETE /api/admin/courses/[id]/faqs/[faqId] - Delete FAQ
export const DELETE = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string, faqId: string } }) => {
  try {
    const { faqId } = params

    await prisma.courseFAQ.delete({
      where: { id: faqId },
    })

    return createResponse({ message: 'FAQ deleted successfully' })
  } catch (error) {
    console.error('Delete FAQ error:', error)
    return createErrorResponse('Failed to delete FAQ', 500)
  }
})