import { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { outboxCounts } from '@/lib/messaging/outbox'
import { CHANNELS, MESSAGE_STATUSES } from '@/lib/messaging/types'

// GET /api/admin/messages?status=&channel=&templateKey=&batchId=&q=&page=&pageSize= — the outbox log
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const status = sp.get('status')
    const channel = sp.get('channel')
    const templateKey = sp.get('templateKey')
    const batchId = sp.get('batchId')
    const q = sp.get('q')?.trim()
    if (status && !(MESSAGE_STATUSES as readonly string[]).includes(status)) return createErrorResponse('Unknown status', 400)
    if (channel && !(CHANNELS as readonly string[]).includes(channel)) return createErrorResponse('Unknown channel', 400)

    const page = Math.max(1, Number(sp.get('page')) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize')) || 25))
    const where: Prisma.OutboundMessageWhereInput = {
      ...(status ? { status } : {}),
      ...(channel ? { channel } : {}),
      ...(templateKey ? { templateKey } : {}),
      ...(batchId ? { batchId } : {}),
      ...(q
        ? { OR: [{ toAddress: { contains: q, mode: 'insensitive' } }, { toName: { contains: q, mode: 'insensitive' } }, { subject: { contains: q, mode: 'insensitive' } }] }
        : {}),
    }
    const [messages, total, counts, templateKeys] = await Promise.all([
      prisma.outboundMessage.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
        select: {
          id: true, channel: true, recipientType: true, toName: true, toAddress: true, templateKey: true, category: true,
          subject: true, body: true, status: true, provider: true, error: true, attempts: true, scheduledFor: true,
          sentAt: true, createdAt: true, lastAttemptAt: true,
        },
      }),
      prisma.outboundMessage.count({ where }),
      outboxCounts(prisma),
      prisma.outboundMessage.findMany({ distinct: ['templateKey'], select: { templateKey: true }, orderBy: { templateKey: 'asc' } }),
    ])
    return createResponse({ messages, total, page, pageSize, counts, templateKeys: templateKeys.map((t) => t.templateKey) })
  } catch (error) {
    console.error('Get messages error:', error)
    return createErrorResponse('Failed to fetch messages', 500)
  }
})
