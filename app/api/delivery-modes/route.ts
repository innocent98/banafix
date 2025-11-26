import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/delivery-modes - Public endpoint to get active delivery modes
export async function GET() {
  try {
    const deliveryModes = await prisma.deliveryMode.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        order: true,
      },
    })

    return createResponse({ deliveryModes })
  } catch (error) {
    console.error('Get public delivery modes error:', error)
    return createErrorResponse('Failed to fetch delivery modes', 500)
  }
}