import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeaders, AdminPayload } from './auth'

export function withAuth(handler: (req: NextRequest, admin: AdminPayload, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const token = getTokenFromHeaders(req.headers)

      if (!token) {
        return NextResponse.json(
          { error: 'No token provided' },
          { status: 401 }
        )
      }

      const admin = verifyToken(token)
      if (!admin) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }

      return handler(req, admin, context)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

export function createResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export function createErrorResponse(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}