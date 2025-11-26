import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/admin/delivery-modes - List all delivery modes
export const GET = withAuth(async (req: NextRequest, admin) => {
  try {
    const deliveryModes = await prisma.deliveryMode.findMany({
      orderBy: { order: 'asc' },
    })

    return createResponse({ deliveryModes })
  } catch (error) {
    console.error('Get delivery modes error:', error)
    return createErrorResponse('Failed to fetch delivery modes', 500)
  }
})

// POST /api/admin/delivery-modes - Create new delivery mode
export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const { name, isActive = true } = await req.json()

    if (!name) {
      return createErrorResponse('Name is required', 400)
    }

    // Check if delivery mode already exists
    const existing = await prisma.deliveryMode.findUnique({
      where: { name },
    })

    if (existing) {
      return createErrorResponse('Delivery mode with this name already exists', 400)
    }

    // Get the next order number
    const lastMode = await prisma.deliveryMode.findFirst({
      orderBy: { order: 'desc' },
    })
    const nextOrder = (lastMode?.order ?? 0) + 1

    const deliveryMode = await prisma.deliveryMode.create({
      data: {
        name,
        isActive,
        order: nextOrder,
      },
    })

    return createResponse({ deliveryMode }, 201)
  } catch (error) {
    console.error('Create delivery mode error:', error)
    return createErrorResponse('Failed to create delivery mode', 500)
  }
})