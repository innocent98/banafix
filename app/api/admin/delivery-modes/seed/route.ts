import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const deliveryModes = [
      { name: 'On-site', isActive: true, order: 1 },
      { name: 'One-on-One', isActive: true, order: 2 },
      { name: 'Online', isActive: true, order: 3 },
      { name: 'Home Training', isActive: true, order: 4 },
    ]

    const results = []

    for (const mode of deliveryModes) {
      const result = await prisma.deliveryMode.upsert({
        where: { name: mode.name },
        update: { isActive: mode.isActive, order: mode.order },
        create: mode,
      })
      results.push(result)
    }

    return createResponse({ message: 'Delivery modes seeded successfully', modes: results })
  } catch (error) {
    console.error('Seed delivery modes error:', error)
    return createErrorResponse('Failed to seed delivery modes', 500)
  }
})
