import { NextRequest } from 'next/server'
import { withAuth, createResponse } from '@/lib/middleware'

export const GET = withAuth(async (req: NextRequest, admin) => {
  // If we reach here, the token is valid (checked by withAuth)
  return createResponse({ 
    valid: true,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email
    }
  })
})
