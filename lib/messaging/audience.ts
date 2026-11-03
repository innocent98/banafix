import type { Prisma } from '@prisma/client'
import type { Recipient } from './types'

export type AudienceScope = 'students' | 'parents' | 'both'

export interface AudienceFilter {
  scope: AudienceScope
  locationId?: string
  courseId?: string
  /** Also include students who have applied but are not enrolled yet (anyone not cancelled). */
  includeApplicants?: boolean
}

/** One matching enrollment decides membership; location and course must hold on the same row. */
export function studentWhere(f: AudienceFilter): Prisma.StudentWhereInput {
  return {
    enrollments: {
      some: {
        status: f.includeApplicants ? { not: 'cancelled' } : 'enrolled',
        ...(f.locationId ? { locationId: f.locationId } : {}),
        ...(f.courseId ? { courseId: f.courseId } : {}),
      },
    },
  }
}

/** Parents are the parents of matching students (an unlinked parent has no student to match). */
export function parentWhere(f: AudienceFilter): Prisma.ParentWhereInput {
  return { children: { some: studentWhere(f) } }
}

export interface AudiencePerson {
  recipient: Recipient
  /** Consent flags that apply to this person (see consent.ts). */
  consent: boolean[]
}

export type AudienceDb = Pick<Prisma.TransactionClient, 'student' | 'parent'>

export async function resolveAudience(db: AudienceDb, f: AudienceFilter): Promise<AudiencePerson[]> {
  const people: AudiencePerson[] = []

  if (f.scope === 'students' || f.scope === 'both') {
    const students = await db.student.findMany({
      where: studentWhere(f),
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        enrollments: { select: { consentToEmails: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    for (const s of students) {
      people.push({
        recipient: { type: 'student', id: s.id, name: `${s.firstName} ${s.lastName}`.trim() || s.email, email: s.email, phone: s.phone },
        consent: s.enrollments.map((e) => e.consentToEmails),
      })
    }
  }

  if (f.scope === 'parents' || f.scope === 'both') {
    const parents = await db.parent.findMany({
      where: parentWhere(f),
      select: {
        id: true, name: true, email: true, phone: true,
        children: { select: { enrollments: { select: { consentToEmails: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    })
    for (const p of parents) {
      people.push({
        recipient: { type: 'parent', id: p.id, name: p.name, email: p.email, phone: p.phone },
        consent: p.children.flatMap((c) => c.enrollments.map((e) => e.consentToEmails)),
      })
    }
  }
  return people
}
