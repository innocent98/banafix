import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/delivery-modes/[id] - Update delivery mode
export const PUT = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string } }) => {
  try {
    const { name, isActive, order } = await req.json()
    const { id } = params

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (isActive !== undefined) updateData.isActive = isActive
    if (order !== undefined) updateData.order = order

    const deliveryMode = await prisma.deliveryMode.update({
      where: { id },
      data: updateData,
    })

    return createResponse({ deliveryMode })
  } catch (error) {
    console.error('Update delivery mode error:', error)
    return createErrorResponse('Failed to update delivery mode', 500)
  }
})

// DELETE /api/admin/delivery-modes/[id] - Delete delivery mode
export const DELETE = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string } }) => {
  try {
    const { id } = params

    // Check if any courses are using this delivery mode
    const coursesUsingMode = await prisma.course.findMany({
      where: {
        availableModes: {
          has: await prisma.deliveryMode.findUnique({
            where: { id },
            select: { name: true }
          }).then(mode => mode?.name)
        }
      }
    })

    if (coursesUsingMode.length > 0) {
      return createErrorResponse(
        `Cannot delete delivery mode. It is being used by ${coursesUsingMode.length} course(s).`,
        400
      )
    }

    await prisma.deliveryMode.delete({
      where: { id },
    })

    return createResponse({ message: 'Delivery mode deleted successfully' })
  } catch (error) {
    console.error('Delete delivery mode error:', error)
    return createErrorResponse('Failed to delete delivery mode', 500)
  }
})