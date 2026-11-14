import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/admin/students?q= - search students (child-picker for parents).
// Students with at least one live (non-cancelled) application are returned, so a child can be
// attached while still at the assessment stage (Stream 6); `status` is their furthest application.
export const GET = withAuth(async (req: NextRequest, admin) => {
  try {
    const q = new URL(req.url).searchParams.get('q')?.trim()
    const students = await prisma.student.findMany({
      where: {
        enrollments: { some: { status: { not: 'cancelled' } } },
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' as const } },
                { lastName: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        enrollments: { where: { status: { not: 'cancelled' } }, select: { status: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 25,
    })
    return createResponse({
      students: students.map(({ enrollments, ...st }) => ({ ...st, status: enrollments[0]?.status ?? null })),
    })
  } catch (error) {
    console.error('Search students error:', error)
    return createErrorResponse('Failed to fetch students', 500)
  }
})
