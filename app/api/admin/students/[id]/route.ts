import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'

const STUDENT_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  dateOfBirth: true,
  address: true,
  landmark: true,
  guardianName: true,
  guardianPhone: true,
  guardianEmail: true,
  createdAt: true,
  updatedAt: true,
} as const

// GET /api/admin/students/[id] - fetch a student (used to prefill the edit form)
export const GET = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const student = await prisma.student.findUnique({ where: { id }, select: STUDENT_SELECT })
    if (!student) return createErrorResponse('Student not found', 404)
    return createResponse({ student })
  } catch (error) {
    console.error('Get student error:', error)
    return createErrorResponse('Failed to fetch student', 500)
  }
})

// Fields an admin may edit. `email` and `id` are immutable and never updated here.
const EDITABLE_FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'dateOfBirth',
  'address',
  'landmark',
  'guardianName',
  'guardianPhone',
  'guardianEmail',
] as const

// PATCH /api/admin/students/[id] - edit a student record (email immutable)
export const PATCH = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json()

    const existing = await prisma.student.findUnique({ where: { id } })
    if (!existing) return createErrorResponse('Student not found', 404)

    // Email is immutable — reject an attempt to change it rather than silently dropping it.
    if (typeof body.email === 'string' && body.email.trim().toLowerCase() !== existing.email) {
      return createErrorResponse('Email cannot be changed', 400)
    }

    const data: Record<string, unknown> = {}
    const changedFields: string[] = []

    for (const key of EDITABLE_FIELDS) {
      if (!(key in body)) continue
      let value: unknown = body[key]
      if (key === 'dateOfBirth') {
        value = value ? new Date(value as string) : null
      } else if (typeof value === 'string') {
        const trimmed = value.trim()
        // Names stay as-is (required); other optional strings normalize empty -> null.
        value = key === 'firstName' || key === 'lastName' ? trimmed : trimmed === '' ? null : trimmed
      }
      data[key] = value

      const before = (existing as Record<string, unknown>)[key]
      const beforeCmp = before instanceof Date ? before.toISOString() : before ?? null
      const afterCmp = value instanceof Date ? (value as Date).toISOString() : value ?? null
      if (beforeCmp !== afterCmp) changedFields.push(key)
    }

    // Names are required — never allow them to be blanked.
    if (('firstName' in data && !data.firstName) || ('lastName' in data && !data.lastName)) {
      return createErrorResponse('First and last name are required', 400)
    }

    const student = await prisma.student.update({ where: { id }, data, select: STUDENT_SELECT })

    await logAdminAction({
      adminId: admin.id,
      action: 'student.update',
      entityType: 'student',
      entityId: id,
      metadata: { changedFields },
    })

    return createResponse({ student, message: 'Student updated successfully' })
  } catch (error) {
    console.error('Update student error:', error)
    return createErrorResponse('Failed to update student', 500)
  }
})
