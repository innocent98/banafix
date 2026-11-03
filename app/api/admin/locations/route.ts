import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { isNonNegativeInt, isPositiveInt, slugify, uniqueSlug } from '@/lib/admin-validation'

// GET /api/admin/locations - all locations (inactive included) with usage counts
export const GET = withAuth(async () => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { offerings: true, enrollments: true } } },
    })
    return createResponse({ locations })
  } catch (error) {
    console.error('Get locations error:', error)
    return createErrorResponse('Failed to fetch locations', 500)
  }
})

// POST /api/admin/locations - create (slug derived from the name, collision-safe)
export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return createErrorResponse('Name is required', 400)
    if (body.kind !== 'PHYSICAL' && body.kind !== 'ONLINE') {
      return createErrorResponse('Kind must be PHYSICAL or ONLINE', 400)
    }
    if (!isPositiveInt(body.assessmentFee)) {
      return createErrorResponse('Assessment fee must be a whole number of naira greater than 0', 400)
    }
    if (body.order !== undefined && !Number.isInteger(body.order)) {
      return createErrorResponse('Order must be a whole number', 400)
    }

    const baseSlug = slugify(name)
    if (!baseSlug) return createErrorResponse('Name must contain letters or numbers', 400)

    const existingName = await prisma.location.findUnique({ where: { name } })
    if (existingName) return createErrorResponse('A location with this name already exists', 409)

    const taken = new Set(
      (await prisma.location.findMany({ where: { slug: { startsWith: baseSlug } }, select: { slug: true } })).map(
        (l) => l.slug,
      ),
    )

    const location = await prisma.location.create({
      data: {
        name,
        slug: uniqueSlug(baseSlug, taken),
        kind: body.kind,
        assessmentFee: body.assessmentFee,
        isActive: body.isActive ?? true,
        order: body.order ?? 0,
        address: typeof body.address === 'string' && body.address.trim() ? body.address.trim() : null,
      },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'location.create',
      entityType: 'location',
      entityId: location.id,
      metadata: { after: location },
    })

    return createResponse({ location }, 201)
  } catch (error) {
    console.error('Create location error:', error)
    return createErrorResponse('Failed to create location', 500)
  }
})
