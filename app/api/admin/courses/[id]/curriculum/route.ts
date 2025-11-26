import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/admin/courses/[id]/curriculum - Get course curriculum
export const GET = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string } }) => {
  try {
    const { id } = params

    const curriculum = await prisma.curriculumModule.findMany({
      where: { courseId: id },
      orderBy: { order: 'asc' },
    })

    return createResponse({ curriculum })
  } catch (error) {
    console.error('Get curriculum error:', error)
    return createErrorResponse('Failed to fetch curriculum', 500)
  }
})

// POST /api/admin/courses/[id]/curriculum - Add curriculum module
export const POST = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string } }) => {
  try {
    const { id } = params
    const data = await req.json()

    const { module, title, weeks, outcomes, tasks, order } = data

    if (!title || !weeks) {
      return createErrorResponse('Title and weeks are required', 400)
    }

    // Get the next order number if not provided
    let moduleOrder = order
    if (moduleOrder === undefined) {
      const lastModule = await prisma.curriculumModule.findFirst({
        where: { courseId: id },
        orderBy: { order: 'desc' },
      })
      moduleOrder = (lastModule?.order ?? 0) + 1
    }

    const curriculumModule = await prisma.curriculumModule.create({
      data: {
        courseId: id,
        module: module || moduleOrder,
        title,
        weeks,
        outcomes: outcomes || [],
        tasks: tasks || [],
        order: moduleOrder,
      },
    })

    return createResponse({ curriculumModule }, 201)
  } catch (error) {
    console.error('Create curriculum module error:', error)
    return createErrorResponse('Failed to create curriculum module', 500)
  }
})