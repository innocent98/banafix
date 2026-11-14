/**
 * Create-or-link a Parent for a registering student (Stream 6, calls S6-1 / S6-4 / S6-5).
 *
 * Matching, strongest identity first, never on name:
 *   1. the guardian's email (exact, lower-cased; Parent.email is unique)
 *   2. only when no email was given (admin walk-in): the phone, and only if exactly ONE parent has it
 * An existing parent's stored data is never overwritten from here (a public form must not be able to
 * edit a record); the admin path may fill a BLANK phone. Linking is idempotent.
 */
import type { Prisma } from '@prisma/client'
import { phoneKey, normalizeEmail } from './identity'
import type { GuardianContact } from './validate'

export type ParentDb = Pick<Prisma.TransactionClient, 'parent' | '$queryRaw'>

/** A public form may not attach unlimited children to one parent record (spam/spoof ceiling). */
export const MAX_PUBLIC_CHILDREN_PER_PARENT = 12

export type LinkOutcome =
  | { outcome: 'created' | 'linked' | 'already_linked'; parentId: string; matchedBy: 'email' | 'phone' | 'new'; filledPhone: boolean; samePhoneParentIds: string[] }
  | { outcome: 'none'; reason: 'no_email_no_unique_phone' | 'cap_reached' | 'parent_not_found'; samePhoneParentIds: string[] }

export interface LinkOptions {
  /** Admin picked an existing parent explicitly. Wins over matching; must exist. */
  parentId?: string | null
  /** Admin path: fill a blank phone on a matched parent. Never overwrites a value. */
  fillBlankPhone?: boolean
  /** Public path: refuse to link beyond this many children. */
  maxChildren?: number
}

/** Ids of parents whose phone has the same last-10-digits key. Raw SQL: stored phones are free text. */
export async function parentIdsByPhone(db: Pick<ParentDb, '$queryRaw'>, phone: string | null | undefined): Promise<string[]> {
  const key = phoneKey(phone)
  if (!key) return []
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM parents
    WHERE phone IS NOT NULL AND right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = ${key}
    LIMIT 5`
  return rows.map((r) => r.id)
}

export async function linkParentToStudent(
  db: ParentDb,
  studentId: string,
  guardian: GuardianContact,
  opts: LinkOptions = {},
): Promise<LinkOutcome> {
  const email = guardian.email ? normalizeEmail(guardian.email) : null
  const phoneIds = await parentIdsByPhone(db, guardian.phone)

  const connect = (parentId: string) => ({ children: { connect: { id: studentId } } }) satisfies Prisma.ParentUpdateInput
  const childCount = (parentId: string) => db.parent.findUnique({ where: { id: parentId }, select: { _count: { select: { children: true } } } })

  // The parent this registration belongs to, if any.
  let existing: { id: string; phone: string | null; matchedBy: 'email' | 'phone' } | null = null
  if (opts.parentId) {
    const p = await db.parent.findUnique({ where: { id: opts.parentId }, select: { id: true, phone: true } })
    if (!p) return { outcome: 'none', reason: 'parent_not_found', samePhoneParentIds: [] }
    existing = { ...p, matchedBy: 'email' }
  } else if (email) {
    const p = await db.parent.findUnique({ where: { email }, select: { id: true, phone: true } })
    if (p) existing = { ...p, matchedBy: 'email' }
  } else if (phoneIds.length === 1) {
    const p = await db.parent.findUnique({ where: { id: phoneIds[0] }, select: { id: true, phone: true } })
    if (p) existing = { ...p, matchedBy: 'phone' }
  }

  if (existing) {
    const already = await db.parent.findFirst({ where: { id: existing.id, children: { some: { id: studentId } } }, select: { id: true } })
    if (already) {
      return { outcome: 'already_linked', parentId: existing.id, matchedBy: existing.matchedBy, filledPhone: false, samePhoneParentIds: phoneIds.filter((id) => id !== existing!.id) }
    }
    if (opts.maxChildren != null) {
      const n = (await childCount(existing.id))?._count.children ?? 0
      if (n >= opts.maxChildren) return { outcome: 'none', reason: 'cap_reached', samePhoneParentIds: [] }
    }
    const fill = Boolean(opts.fillBlankPhone && !existing.phone && guardian.phone)
    await db.parent.update({
      where: { id: existing.id },
      data: { ...connect(existing.id), ...(fill ? { phone: guardian.phone } : {}) },
    })
    return { outcome: 'linked', parentId: existing.id, matchedBy: existing.matchedBy, filledPhone: fill, samePhoneParentIds: phoneIds.filter((id) => id !== existing!.id) }
  }

  // No match. A new Parent needs a name and an email (Parent.email is required and unique).
  if (!email || !guardian.name) {
    return { outcome: 'none', reason: 'no_email_no_unique_phone', samePhoneParentIds: phoneIds }
  }
  try {
    const created = await db.parent.create({
      data: { name: guardian.name, email, phone: guardian.phone, children: { connect: { id: studentId } } },
      select: { id: true },
    })
    return { outcome: 'created', parentId: created.id, matchedBy: 'new', filledPhone: false, samePhoneParentIds: phoneIds }
  } catch (e) {
    // Two simultaneous submits for one new guardian: the loser links to the winner's row.
    if ((e as { code?: string })?.code === 'P2002') {
      const p = await db.parent.findUnique({ where: { email }, select: { id: true } })
      if (p) {
        await db.parent.update({ where: { id: p.id }, data: connect(p.id) })
        return { outcome: 'linked', parentId: p.id, matchedBy: 'email', filledPhone: false, samePhoneParentIds: phoneIds.filter((id) => id !== p.id) }
      }
    }
    throw e
  }
}
