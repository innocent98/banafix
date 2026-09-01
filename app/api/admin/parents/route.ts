import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'

const CHILD_SELECT = { id: true, firstName: true, lastName: true, email: true } as const

// Validate optional birthday month/day. Returns an error message or null.
function validateBirthday(month: unknown, day: unknown): string | null {
  if (month == null && day == null) return null
  if (month == null || day == null) return 'Provide both birthday month and day, or neither'
  const m = Number(month)
  const d = Number(day)
  if (!Number.isInteger(m) || m < 1 || m > 12) return 'Birthday month must be 1-12'
  if (!Number.isInteger(d) || d < 1 || d > 31) return 'Birthday day must be 1-31'
  return null
}

// GET /api/admin/parents - list parents (optional ?q= search on name/email)
export const GET = withAuth(async (req: NextRequest, admin) => {
  try {
    const q = new URL(req.url).searchParams.get('q')?.trim()
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}
    const parents = await prisma.parent.findMany({
      where,
      include: { children: { select: CHILD_SELECT } },
      orderBy: { createdAt: 'desc' },
    })
    return createResponse({ parents })
  } catch (error) {
    console.error('List parents error:', error)
    return createErrorResponse('Failed to fetch parents', 500)
  }
})

// POST /api/admin/parents - create a parent, optionally attaching children
export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!name || !email) return createErrorResponse('Name and email are required', 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return createErrorResponse('Invalid email format', 400)

    const birthdayError = validateBirthday(body.birthdayMonth, body.birthdayDay)
    if (birthdayError) return createErrorResponse(birthdayError, 400)

    const childIds: string[] = Array.isArray(body.childIds) ? body.childIds : []

    const parent = await prisma.parent.create({
      data: {
        name,
        email,
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
        birthdayMonth: body.birthdayMonth != null ? Number(body.birthdayMonth) : null,
        birthdayDay: body.birthdayDay != null ? Number(body.birthdayDay) : null,
        children: childIds.length ? { connect: childIds.map((id) => ({ id })) } : undefined,
      },
      include: { children: { select: CHILD_SELECT } },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'parent.create',
      entityType: 'parent',
      entityId: parent.id,
      metadata: { childCount: parent.children.length },
    })

    return createResponse({ parent, message: 'Parent created' }, 201)
  } catch (error: any) {
    if (error?.code === 'P2002') return createErrorResponse('A parent with this email already exists', 409)
    if (error?.code === 'P2025') return createErrorResponse('One or more selected students were not found', 400)
    console.error('Create parent error:', error)
    return createErrorResponse('Failed to create parent', 500)
  }
})
