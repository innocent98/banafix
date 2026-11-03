import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { isNonNegativeInt, slugify, uniqueSlug } from '@/lib/admin-validation'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/admin/locations/[id]
export const GET = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id } = await context.params
    const location = await prisma.location.findUnique({
      where: { id },
      include: { _count: { select: { offerings: true, enrollments: true } } },
    })
    if (!location) return createErrorResponse('Location not found', 404)
    return createResponse({ location })
  } catch (error) {
    console.error('Get location error:', error)
    return createErrorResponse('Failed to fetch location', 500)
  }
})

// PATCH /api/admin/locations/[id]
// Renaming keeps the slug (public URLs) unless `regenerateSlug: true` is sent.
export const PATCH = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id } = await context.params
    const body = await req.json()

    const before = await prisma.location.findUnique({ where: { id } })
    if (!before) return createErrorResponse('Location not found', 404)

    const data: Record<string, unknown> = {}

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name) return createErrorResponse('Name cannot be empty', 400)
      if (name !== before.name) {
        const clash = await prisma.location.findUnique({ where: { name } })
        if (clash) return createErrorResponse('A location with this name already exists', 409)
        data.name = name
      }
    }
    if (body.kind !== undefined) {
      if (body.kind !== 'PHYSICAL' && body.kind !== 'ONLINE') {
        return createErrorResponse('Kind must be PHYSICAL or ONLINE', 400)
      }
      data.kind = body.kind
    }
    if (body.assessmentFee !== undefined) {
      if (!isNonNegativeInt(body.assessmentFee)) {
        return createErrorResponse('Assessment fee must be a non-negative whole number', 400)
      }
      data.assessmentFee = body.assessmentFee
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') return createErrorResponse('isActive must be a boolean', 400)
      data.isActive = body.isActive
    }
    if (body.order !== undefined) {
      if (!Number.isInteger(body.order)) return createErrorResponse('Order must be a whole number', 400)
      data.order = body.order
    }
    if ('address' in body) {
      data.address = typeof body.address === 'string' && body.address.trim() ? body.address.trim() : null
    }

    if (body.regenerateSlug === true) {
      const baseSlug = slugify((data.name as string) ?? before.name)
      if (!baseSlug) return createErrorResponse('Name must contain letters or numbers', 400)
      const taken = new Set(
        (
          await prisma.location.findMany({
            where: { slug: { startsWith: baseSlug }, NOT: { id } },
            select: { slug: true },
          })
        ).map((l) => l.slug),
      )
      data.slug = uniqueSlug(baseSlug, taken)
    }

    const location = await prisma.location.update({ where: { id }, data })

    await logAdminAction({
      adminId: admin.id,
      action: 'location.update',
      entityType: 'location',
      entityId: id,
      metadata: { before, after: location },
    })

    return createResponse({ location })
  } catch (error) {
    console.error('Update location error:', error)
    return createErrorResponse('Failed to update location', 500)
  }
})

// DELETE /api/admin/locations/[id] - refused while any offering/enrollment references it
export const DELETE = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id } = await context.params
    const location = await prisma.location.findUnique({
      where: { id },
      include: { _count: { select: { offerings: true, enrollments: true, availability: true } } },
    })
    if (!location) return createErrorResponse('Location not found', 404)

    const { offerings, enrollments, availability } = location._count
    if (offerings > 0 || enrollments > 0 || availability > 0) {
      return createErrorResponse(
        `Cannot delete: ${offerings} offering(s), ${enrollments} enrollment(s) and ${availability} instructor availability window(s) reference this location. Deactivate it instead.`,
        409,
      )
    }

    await prisma.location.delete({ where: { id } })

    await logAdminAction({
      adminId: admin.id,
      action: 'location.delete',
      entityType: 'location',
      entityId: id,
      metadata: { before: location },
    })

    return createResponse({ message: 'Location deleted' })
  } catch (error) {
    console.error('Delete location error:', error)
    return createErrorResponse('Failed to delete location', 500)
  }
})
