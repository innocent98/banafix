import { prisma } from '@/lib/prisma'

export interface BirthdayRecipient {
  type: 'student' | 'parent'
  id: string
  name: string
  email: string
  phone?: string | null
  /** Consent flags that apply (students: their enrollments; parents: their children's enrollments). */
  consent: boolean[]
}

// Today's calendar month/day/year in Africa/Lagos (UTC+1, no DST).
export function todayInLagos(now: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

/**
 * Students (full DOB matched on month+day) and parents (stored month+day) whose
 * birthday is (month, day), EXCLUDING anyone the legacy `BirthdayEmailLog` shows as emailed in `year`
 * (that table is no longer written: the outbox's idempotency key is the dedup now, see lib/messaging/runs.ts).
 * Kept out of the route file so it can be imported and tested directly.
 */
export async function collectBirthdayRecipients(
  month: number,
  day: number,
  year: number,
): Promise<BirthdayRecipient[]> {
  const [studentsRaw, parents, alreadySent] = await Promise.all([
    prisma.student.findMany({
      where: { dateOfBirth: { not: null } },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true, dateOfBirth: true,
        enrollments: { select: { consentToEmails: true } },
      },
    }),
    prisma.parent.findMany({
      where: { birthdayMonth: month, birthdayDay: day },
      select: {
        id: true, name: true, email: true, phone: true,
        children: { select: { enrollments: { select: { consentToEmails: true } } } },
      },
    }),
    prisma.birthdayEmailLog.findMany({ where: { year }, select: { recipientType: true, recipientId: true } }),
  ])

  const sentKey = new Set(alreadySent.map((s) => `${s.recipientType}:${s.recipientId}`))

  const students: BirthdayRecipient[] = studentsRaw
    .filter(
      (s) => s.dateOfBirth && s.dateOfBirth.getUTCMonth() + 1 === month && s.dateOfBirth.getUTCDate() === day,
    )
    .map((s) => ({
      type: 'student' as const,
      id: s.id,
      name: `${s.firstName} ${s.lastName}`.trim(),
      email: s.email,
      phone: s.phone,
      consent: s.enrollments.map((e) => e.consentToEmails),
    }))

  const parentRecipients: BirthdayRecipient[] = parents.map((p) => ({
    type: 'parent' as const,
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    consent: p.children.flatMap((c) => c.enrollments.map((e) => e.consentToEmails)),
  }))

  return [...students, ...parentRecipients].filter((r) => !sentKey.has(`${r.type}:${r.id}`))
}
