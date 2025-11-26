import { NextRequest } from 'next/server'
import { authenticateAdmin, generateToken } from '@/lib/auth'
import { createResponse, createErrorResponse } from '@/lib/middleware'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    const admin = await authenticateAdmin(email, password)
    if (!admin) {
      return createErrorResponse('Invalid email or password', 401)
    }

    const token = generateToken(admin)

    return createResponse({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}