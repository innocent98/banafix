import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { queueAnnouncement } from '@/lib/messaging/announce'
import { parseAudienceFilter, parseChannels } from '@/lib/messaging/admin-input'
import { validateTemplate } from '@/lib/messaging/template'

// GET /api/admin/announcements — history with delivery progress per announcement
export const GET = withAuth(async () => {
  try {
    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
    const groups = await prisma.outboundMessage.groupBy({
      by: ['batchId', 'status'],
      where: { batchId: { in: announcements.map((a) => a.id) } },
      _count: { _all: true },
    })
    const progress = new Map<string, Record<string, number>>()
    for (const g of groups) {
      if (!g.batchId) continue
      progress.set(g.batchId, { ...(progress.get(g.batchId) ?? {}), [g.status]: g._count._all })
    }
    return createResponse({
      announcements: announcements.map((a) => ({ ...a, progress: { queued: 0, sent: 0, failed: 0, skipped: 0, ...progress.get(a.id) } })),
    })
  } catch (error) {
    console.error('Get announcements error:', error)
    return createErrorResponse('Failed to fetch announcements', 500)
  }
})

// POST /api/admin/announcements { subject, body, shortBody?, channels, operational, filter } — queue to the audience
export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const b = await req.json().catch(() => ({}))
    if (typeof b.subject !== 'string' || !b.subject.trim()) return createErrorResponse('Subject is required', 400)
    if (typeof b.body !== 'string' || !b.body.trim()) return createErrorResponse('Message is required', 400)
    const channels = parseChannels(b.channels)
    if (!channels) return createErrorResponse('Choose at least one channel (EMAIL, SMS, WHATSAPP)', 400)
    const filter = parseAudienceFilter(b.filter)
    if (!filter) return createErrorResponse('Choose who should receive this', 400)
    const shortBody = typeof b.shortBody === 'string' && b.shortBody.trim() ? b.shortBody.trim() : null
    const check = validateTemplate('announcement', { subject: b.subject, body: b.body, shortBody })
    if (!check.ok) return createErrorResponse(`Unknown merge field: ${check.unknown.map((f) => `{{${f}}}`).join(', ')}`, 400)
    const operational = b.operational === true

    const announcement = await prisma.announcement.create({
      data: {
        subject: b.subject.trim(), body: b.body.trim(), channels,
        category: operational ? 'TRANSACTIONAL' : 'MARKETING',
        audience: filter as object, createdByAdminId: admin.id,
      },
    })
    const { recipients, created } = await queueAnnouncement(prisma, {
      announcementId: announcement.id, subject: announcement.subject, body: announcement.body, shortBody, channels, operational, filter,
    })
    await prisma.announcement.update({ where: { id: announcement.id }, data: { recipientCount: recipients } })
    await logAdminAction({
      adminId: admin.id, action: 'announcement.create', entityType: 'announcement', entityId: announcement.id,
      metadata: { channels, operational, filter, recipients, rows: created },
    })
    return createResponse({ announcement: { ...announcement, recipientCount: recipients }, recipients, queued: created }, 201)
  } catch (error) {
    console.error('Create announcement error:', error)
    return createErrorResponse('Failed to create announcement', 500)
  }
})
