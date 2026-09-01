import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'

const CHILD_SELECT = { id: true, firstName: true, lastName: true, email: true } as const

function validateBirthday(month: unknown, day: unknown): string | null {
  if (month == null && day == null) return null
  if (month == null || day == null) return 'Provide both birthday month and day, or neither'
  const m = Number(month)
  const d = Number(day)
  if (!Number.isInteger(m) || m < 1 || m > 12) return 'Birthday month must be 1-12'
  if (!Number.isInteger(d) || d < 1 || d > 31) return 'Birthday day must be 1-31'
  return null
}

// GET /api/admin/parents/[id]
export const GET = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: { children: { select: CHILD_SELECT } },
    })
    if (!parent) return createErrorResponse('Parent not found', 404)
    return createResponse({ parent })
  } catch (error) {
    console.error('Get parent error:', error)
    return createErrorResponse('Failed to fetch parent', 500)
  }
})

// PATCH /api/admin/parents/[id] - edit fields and/or replace the child set
export const PATCH = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json()

    const existing = await prisma.parent.findUnique({ where: { id } })
    if (!existing) return createErrorResponse('Parent not found', 404)

    const data: Record<string, unknown> = {}
    if (typeof body.name === 'string') {
      if (!body.name.trim()) return createErrorResponse('Name cannot be empty', 400)
      data.name = body.name.trim()
    }
    if (typeof body.email === 'string') {
      const email = body.email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return createErrorResponse('Invalid email format', 400)
      data.email = email
    }
    if ('phone' in body) data.phone = body.phone?.trim() || null
    if ('address' in body) data.address = body.address?.trim() || null

    if ('birthdayMonth' in body || 'birthdayDay' in body) {
      const month = body.birthdayMonth
      const day = body.birthdayDay
      const birthdayError = validateBirthday(month, day)
      if (birthdayError) return createErrorResponse(birthdayError, 400)
      data.birthdayMonth = month != null ? Number(month) : null
      data.birthdayDay = day != null ? Number(day) : null
    }

    // Replace the full child set only when childIds is explicitly provided.
    if (Array.isArray(body.childIds)) {
      data.children = { set: (body.childIds as string[]).map((cid) => ({ id: cid })) }
    }

    const parent = await prisma.parent.update({
      where: { id },
      data,
      include: { children: { select: CHILD_SELECT } },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'parent.update',
      entityType: 'parent',
      entityId: id,
      metadata: { childCount: parent.children.length },
    })

    return createResponse({ parent, message: 'Parent updated' })
  } catch (error: any) {
    if (error?.code === 'P2002') return createErrorResponse('A parent with this email already exists', 409)
    if (error?.code === 'P2025') return createErrorResponse('One or more selected students were not found', 400)
    console.error('Update parent error:', error)
    return createErrorResponse('Failed to update parent', 500)
  }
})

// DELETE /api/admin/parents/[id]
export const DELETE = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const existing = await prisma.parent.findUnique({ where: { id } })
    if (!existing) return createErrorResponse('Parent not found', 404)

    await prisma.parent.delete({ where: { id } })

    await logAdminAction({
      adminId: admin.id,
      action: 'parent.delete',
      entityType: 'parent',
      entityId: id,
      metadata: { email: existing.email },
    })

    return createResponse({ message: 'Parent deleted' })
  } catch (error) {
    console.error('Delete parent error:', error)
    return createErrorResponse('Failed to delete parent', 500)
  }
})
