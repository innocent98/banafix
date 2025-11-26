import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/courses/[id]/curriculum/[moduleId] - Update curriculum module
export const PUT = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string, moduleId: string } }) => {
  try {
    const { moduleId } = params
    const data = await req.json()

    const { module, title, weeks, outcomes, tasks, order } = data

    const updateData: any = {}
    if (module !== undefined) updateData.module = module
    if (title !== undefined) updateData.title = title
    if (weeks !== undefined) updateData.weeks = weeks
    if (outcomes !== undefined) updateData.outcomes = outcomes
    if (tasks !== undefined) updateData.tasks = tasks
    if (order !== undefined) updateData.order = order

    const curriculumModule = await prisma.curriculumModule.update({
      where: { id: moduleId },
      data: updateData,
    })

    return createResponse({ curriculumModule })
  } catch (error) {
    console.error('Update curriculum module error:', error)
    return createErrorResponse('Failed to update curriculum module', 500)
  }
})

// DELETE /api/admin/courses/[id]/curriculum/[moduleId] - Delete curriculum module
export const DELETE = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string, moduleId: string } }) => {
  try {
    const { moduleId } = params

    await prisma.curriculumModule.delete({
      where: { id: moduleId },
    })

    return createResponse({ message: 'Curriculum module deleted successfully' })
  } catch (error) {
    console.error('Delete curriculum module error:', error)
    return createErrorResponse('Failed to delete curriculum module', 500)
  }
})