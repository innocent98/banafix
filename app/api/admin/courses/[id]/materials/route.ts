import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { isNonNegativeInt } from '@/lib/admin-validation'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/admin/courses/[id]/materials
export const GET = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id } = await context.params
    const materials = await prisma.material.findMany({ where: { courseId: id }, orderBy: { createdAt: 'asc' } })
    return createResponse({ materials })
  } catch (error) {
    console.error('Get materials error:', error)
    return createErrorResponse('Failed to fetch materials', 500)
  }
})

// POST /api/admin/courses/[id]/materials - {name, price, required?, isActive?}
export const POST = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id: courseId } = await context.params
    const body = await req.json()

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return createErrorResponse('Name is required', 400)
    if (!isNonNegativeInt(body.price)) return createErrorResponse('Price must be a non-negative whole number', 400)

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
    if (!course) return createErrorResponse('Course not found', 404)

    const material = await prisma.material.create({
      data: {
        courseId,
        name,
        price: body.price,
        required: body.required ?? false,
        isActive: body.isActive ?? true,
      },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'material.create',
      entityType: 'material',
      entityId: material.id,
      metadata: { courseId, after: material },
    })

    return createResponse({ material }, 201)
  } catch (error) {
    console.error('Create material error:', error)
    return createErrorResponse('Failed to create material', 500)
  }
})
