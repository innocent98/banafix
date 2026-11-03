import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { isNonNegativeInt } from '@/lib/admin-validation'

type Ctx = { params: Promise<{ id: string; materialId: string }> }

// PATCH /api/admin/courses/[id]/materials/[materialId]
export const PATCH = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id: courseId, materialId } = await context.params
    const body = await req.json()

    const before = await prisma.material.findFirst({ where: { id: materialId, courseId } })
    if (!before) return createErrorResponse('Material not found', 404)

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name) return createErrorResponse('Name cannot be empty', 400)
      data.name = name
    }
    if (body.price !== undefined) {
      if (!isNonNegativeInt(body.price)) return createErrorResponse('Price must be a non-negative whole number', 400)
      data.price = body.price
    }
    if (body.required !== undefined) {
      if (typeof body.required !== 'boolean') return createErrorResponse('required must be a boolean', 400)
      data.required = body.required
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') return createErrorResponse('isActive must be a boolean', 400)
      data.isActive = body.isActive
    }

    const material = await prisma.material.update({ where: { id: materialId }, data })

    await logAdminAction({
      adminId: admin.id,
      action: 'material.update',
      entityType: 'material',
      entityId: materialId,
      metadata: { courseId, before, after: material },
    })

    return createResponse({ material })
  } catch (error) {
    console.error('Update material error:', error)
    return createErrorResponse('Failed to update material', 500)
  }
})

// DELETE /api/admin/courses/[id]/materials/[materialId]
export const DELETE = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id: courseId, materialId } = await context.params
    const before = await prisma.material.findFirst({ where: { id: materialId, courseId } })
    if (!before) return createErrorResponse('Material not found', 404)

    await prisma.material.delete({ where: { id: materialId } })

    await logAdminAction({
      adminId: admin.id,
      action: 'material.delete',
      entityType: 'material',
      entityId: materialId,
      metadata: { courseId, before },
    })

    return createResponse({ message: 'Material deleted' })
  } catch (error) {
    console.error('Delete material error:', error)
    return createErrorResponse('Failed to delete material', 500)
  }
})
