import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (req: NextRequest, admin) => {
  try {
    // Get fresh admin data from database
    const adminData = await prisma.admin.findUnique({
      where: { id: admin.id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!adminData || !adminData.isActive) {
      return createResponse({ error: 'Admin account not found or inactive' }, 401)
    }

    return createResponse({
      admin: adminData,
    })
  } catch (error) {
    console.error('Get admin error:', error)
    return createResponse({ error: 'Internal server error' }, 500)
  }
})