import { after } from 'next/server'
import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { NewMessage } from './compose'
import { getProvider } from './providers'
import type { MessageStatus } from './types'

export type OutboxDb = Pick<Prisma.TransactionClient, 'outboundMessage'>

const MAX_ATTEMPTS = 3
const RETRY_AFTER_MS = 10 * 60 * 1000
const LOCK_LEASE_MS = 5 * 60 * 1000

/**
 * Writes rows with `skipDuplicates`: the unique `idempotencyKey` means a replayed webhook, a cron
 * re-run or a double click creates nothing new. Safe inside a transaction (no unique-violation abort).
 */
export async function enqueueMessages(db: OutboxDb, rows: NewMessage[]): Promise<{ created: number }> {
  if (rows.length === 0) return { created: 0 }
  const res = await db.outboundMessage.createMany({
    data: rows.map((r) => ({
      channel: r.channel,
      recipientType: r.recipientType,
      recipientId: r.recipientId,
      toName: r.toName,
      toAddress: r.toAddress,
      templateKey: r.templateKey,
      category: r.category,
      subject: r.subject,
      body: r.body,
      html: r.html,
      status: r.status,
      error: r.error,
      idempotencyKey: r.idempotencyKey,
      batchId: r.batchId,
      enrollmentId: r.enrollmentId,
      scheduledFor: r.scheduledFor,
    })),
    skipDuplicates: true,
  })
  return { created: res.count }
}

export interface DrainOptions {
  /** Max rows to attempt in this call. */
  limit?: number
  /** Stop starting new sends after this long (serverless time budget). */
  budgetMs?: number
  /** Only these rows (they must already be queued). */
  ids?: string[]
  db?: PrismaClient
}

export interface DrainResult {
  attempted: number
  sent: number
  failed: number
  skipped: number
  /** Queued rows still due after this call. */
  remaining: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Delivers due rows through the channel providers. A row is claimed with a `lockedAt` lease (a crashed
 * drain's lock expires), a `sent` row is never picked up again, failed rows retry up to 3 attempts 10
 * minutes apart, and a channel without a configured provider ends `skipped`, never `sent`.
 */
export async function drainOutbox(opts: DrainOptions = {}): Promise<DrainResult> {
  const db = opts.db ?? (prisma as PrismaClient)
  const limit = opts.limit ?? 50
  const budgetMs = opts.budgetMs ?? 25_000
  const started = Date.now()
  const now = new Date()
  const lease = new Date(now.getTime() - LOCK_LEASE_MS)
  const retryBefore = new Date(now.getTime() - RETRY_AFTER_MS)

  const due: Prisma.OutboundMessageWhereInput = {
    AND: [
      { OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }] },
      { OR: [{ lockedAt: null }, { lockedAt: { lt: lease } }] },
      opts.ids
        ? { id: { in: opts.ids }, status: 'queued' }
        : {
            OR: [
              { status: 'queued' },
              { status: 'failed', attempts: { lt: MAX_ATTEMPTS }, lastAttemptAt: { lt: retryBefore } },
            ],
          },
    ],
  }

  const candidates = await db.outboundMessage.findMany({ where: due, orderBy: { createdAt: 'asc' }, take: limit })
  const result: DrainResult = { attempted: 0, sent: 0, failed: 0, skipped: 0, remaining: 0 }
  const lastSendAt = new Map<string, number>()

  for (const msg of candidates) {
    if (Date.now() - started > budgetMs) break

    const claim = await db.outboundMessage.updateMany({
      where: {
        id: msg.id,
        status: msg.status,
        OR: [{ lockedAt: null }, { lockedAt: { lt: lease } }],
      },
      data: { lockedAt: new Date() },
    })
    if (claim.count !== 1) continue

    const provider = getProvider(msg.channel as 'EMAIL' | 'SMS' | 'WHATSAPP')
    if (provider.minIntervalMs) {
      const wait = (lastSendAt.get(provider.name) ?? 0) + provider.minIntervalMs - Date.now()
      if (wait > 0) await sleep(wait)
    }

    let outcome: Awaited<ReturnType<typeof provider.send>>
    if (!msg.toAddress) {
      outcome = { status: 'skipped', reason: 'No address on file' }
    } else {
      try {
        outcome = await provider.send({
          to: msg.toAddress,
          toName: msg.toName ?? undefined,
          subject: msg.subject ?? undefined,
          text: msg.body,
          html: msg.html ?? undefined,
        })
      } catch (e) {
        outcome = { status: 'failed', error: e instanceof Error ? e.message : String(e) }
      }
    }
    lastSendAt.set(provider.name, Date.now())

    const common = { lockedAt: null, lastAttemptAt: new Date(), attempts: { increment: 1 }, provider: provider.name }
    if (outcome.status === 'sent') {
      await db.outboundMessage.update({
        where: { id: msg.id },
        data: { ...common, status: 'sent', sentAt: new Date(), providerMessageId: outcome.providerMessageId ?? null, error: null },
      })
      result.sent++
    } else if (outcome.status === 'failed') {
      await db.outboundMessage.update({ where: { id: msg.id }, data: { ...common, status: 'failed', error: outcome.error } })
      result.failed++
    } else {
      await db.outboundMessage.update({ where: { id: msg.id }, data: { ...common, status: 'skipped', error: outcome.reason } })
      result.skipped++
    }
    result.attempted++
  }

  result.remaining = await db.outboundMessage.count({
    where: { status: 'queued', OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }] },
  })
  return result
}

/**
 * Admin retry. Resets `failed` rows (and, with `includeSkipped`, rows a provider skipped, e.g. after a
 * provider is finally configured) to `queued`. Rows skipped for data reasons (no consent, no phone
 * number) have no `provider` and are never re-queued: retrying them would bypass the check.
 */
export async function retryMessages(
  opts: { ids?: string[]; includeSkipped?: boolean; db?: PrismaClient } = {},
): Promise<number> {
  const db = opts.db ?? (prisma as PrismaClient)
  const statusClause: Prisma.OutboundMessageWhereInput[] = [{ status: 'failed' }]
  if (opts.includeSkipped) statusClause.push({ status: 'skipped', provider: { not: null } })
  const res = await db.outboundMessage.updateMany({
    where: { OR: statusClause, ...(opts.ids ? { id: { in: opts.ids } } : {}) },
    data: { status: 'queued', attempts: 0, error: null, lockedAt: null },
  })
  return res.count
}

export async function outboxCounts(db: PrismaClient = prisma as PrismaClient): Promise<Record<MessageStatus, number>> {
  const groups = await db.outboundMessage.groupBy({ by: ['status'], _count: { _all: true } })
  const counts: Record<MessageStatus, number> = { queued: 0, sent: 0, failed: 0, skipped: 0 }
  for (const g of groups) if (g.status in counts) counts[g.status as MessageStatus] = g._count._all
  return counts
}

/**
 * Sends after the response has gone out (and after any enclosing transaction has committed).
 * Outside a request scope (scripts, tests) `after()` throws; the rows then wait for the cron drain
 * or the admin "Send now" button, which is the intended fallback.
 */
export function scheduleDrainAfterResponse(): void {
  try {
    after(async () => {
      try {
        await drainOutbox({ budgetMs: 20_000 })
      } catch (e) {
        console.error('Outbox drain after response failed:', e)
      }
    })
  } catch {
    // not in a request scope
  }
}
