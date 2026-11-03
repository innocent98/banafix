import { createResponse, createErrorResponse } from '@/lib/middleware'
import { getActiveLocations } from '@/lib/offerings'

// GET /api/locations - Public: active locations in display order (physical and online-kind together)
export async function GET() {
  try {
    const locations = await getActiveLocations()
    return createResponse({ locations })
  } catch (error) {
    console.error('Get public locations error:', error)
    return createErrorResponse('Failed to fetch locations', 500)
  }
}
