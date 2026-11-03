import type { PrismaClient } from '@prisma/client'
import { collectBirthdayRecipients, todayInLagos } from '@/lib/birthdays'
import { prisma } from '@/lib/prisma'
import { resolveAudience } from './audience'
import { baseVars, composeMessages, recipientVars, type NewMessage } from './compose'
import { birthdayScope, monthScope } from './idempotency'
import { lagosMonthInfo } from './month'
import { drainOutbox, enqueueMessages, type DrainResult } from './outbox'
import { getTemplate } from './templates'

export interface RunSummary extends Pick<DrainResult, 'sent' | 'failed' | 'skipped'> {
  candidates: number
  /** Outbox rows newly written by this run (0 on a re-run: idempotent). */
  queued: number
}

/** Birthday cron core. Student + parent wishes via the outbox; the key carries the year, so a re-run is a no-op. */
export async function runBirthdays(now: Date = new Date(), db: PrismaClient = prisma as PrismaClient) {
  const { year, month, day } = todayInLagos(now)
  const candidates = await collectBirthdayRecipients(month, day, year)
  const [studentTpl, parentTpl] = await Promise.all([getTemplate(db, 'birthday_student'), getTemplate(db, 'birthday_parent')])

  const rows: NewMessage[] = []
  for (const c of candidates) {
    const template = c.type === 'parent' ? parentTpl : studentTpl
    if (!template.isActive) continue
    rows.push(
      ...composeMessages({
        template,
        recipient: { type: c.type, id: c.id, name: c.name, email: c.email, phone: c.phone },
        vars: { ...baseVars(), ...recipientVars({ name: c.name }) },
        scope: birthdayScope(year),
        consent: c.consent,
      }),
    )
  }
  const { created } = await enqueueMessages(db, rows)
  const drained = await drainOutbox({ db, budgetMs: 40_000 })
  const summary: RunSummary = { candidates: candidates.length, queued: created, sent: drained.sent, failed: drained.failed, skipped: drained.skipped }
  return { date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, ...summary }
}

/** New-month cron core: enrolled students and their parents, once per Lagos calendar month. */
export async function runNewMonth(now: Date = new Date(), db: PrismaClient = prisma as PrismaClient) {
  const { year, month, monthName, key } = lagosMonthInfo(now)
  const template = await getTemplate(db, 'new_month')
  if (!template.isActive) return { month: key, candidates: 0, queued: 0, sent: 0, failed: 0, skipped: 0 }

  const people = await resolveAudience(db, { scope: 'both' })
  const rows: NewMessage[] = []
  for (const p of people) {
    rows.push(
      ...composeMessages({
        template,
        recipient: p.recipient,
        vars: { ...baseVars(), ...recipientVars(p.recipient), monthName, year },
        scope: monthScope(year, month),
        consent: p.consent,
      }),
    )
  }
  const { created } = await enqueueMessages(db, rows)
  const drained = await drainOutbox({ db, budgetMs: 40_000 })
  return { month: key, candidates: people.length, queued: created, sent: drained.sent, failed: drained.failed, skipped: drained.skipped }
}
