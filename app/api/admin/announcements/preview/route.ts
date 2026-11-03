import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { previewAnnouncement } from '@/lib/messaging/announce'
import { parseAudienceFilter, parseChannels } from '@/lib/messaging/admin-input'

// POST /api/admin/announcements/preview { channels, operational, filter } — who would get it, nothing is queued
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const b = await req.json().catch(() => ({}))
    const channels = parseChannels(b.channels, { allowEmpty: true })
    const filter = parseAudienceFilter(b.filter)
    if (!channels || !filter) return createErrorResponse('Invalid audience', 400)
    return createResponse({ preview: await previewAnnouncement(prisma, filter, channels, b.operational === true) })
  } catch (error) {
    console.error('Preview announcement error:', error)
    return createErrorResponse('Failed to preview audience', 500)
  }
})
