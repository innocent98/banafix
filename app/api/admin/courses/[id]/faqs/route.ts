import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/admin/courses/[id]/faqs - Get course FAQs
export const GET = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string } }) => {
  try {
    const { id } = params

    const faqs = await prisma.courseFAQ.findMany({
      where: { courseId: id },
      orderBy: { order: 'asc' },
    })

    return createResponse({ faqs })
  } catch (error) {
    console.error('Get FAQs error:', error)
    return createErrorResponse('Failed to fetch FAQs', 500)
  }
})

// POST /api/admin/courses/[id]/faqs - Add FAQ
export const POST = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string } }) => {
  try {
    const { id } = params
    const data = await req.json()

    const { question, answer, order } = data

    if (!question || !answer) {
      return createErrorResponse('Question and answer are required', 400)
    }

    // Get the next order number if not provided
    let faqOrder = order
    if (faqOrder === undefined) {
      const lastFAQ = await prisma.courseFAQ.findFirst({
        where: { courseId: id },
        orderBy: { order: 'desc' },
      })
      faqOrder = (lastFAQ?.order ?? 0) + 1
    }

    const faq = await prisma.courseFAQ.create({
      data: {
        courseId: id,
        question,
        answer,
        order: faqOrder,
      },
    })

    return createResponse({ faq }, 201)
  } catch (error) {
    console.error('Create FAQ error:', error)
    return createErrorResponse('Failed to create FAQ', 500)
  }
})