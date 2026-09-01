import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/admin/students?q= - search enrolled students (child-picker for parents).
// Only students with at least one enrolled course are returned.
export const GET = withAuth(async (req: NextRequest, admin) => {
  try {
    const q = new URL(req.url).searchParams.get('q')?.trim()
    const students = await prisma.student.findMany({
      where: {
        enrollments: { some: { status: 'enrolled' } },
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
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 25,
    })
    return createResponse({ students })
  } catch (error) {
    console.error('Search students error:', error)
    return createErrorResponse('Failed to fetch students', 500)
  }
})
