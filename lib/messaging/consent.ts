import type { Category } from './types'

/**
 * Transactional messages (receipts, scheduling) always send. Marketing-type messages need at least
 * one consenting record for the person (a student's enrollments; a parent's children's enrollments).
 * `operational` is the admin's explicit "this is a notice, not marketing" override.
 */
export function canReceive(
  category: Category,
  consent: boolean[],
  operational = false,
): { ok: true } | { ok: false; reason: string } {
  if (category === 'TRANSACTIONAL' || operational) return { ok: true }
  return consent.some(Boolean) ? { ok: true } : { ok: false, reason: 'No email consent on record' }
}

/**
 * The consent flags that count for a PARENT: their linked children's enrollments, but only those past
 * the unconfirmed stage. A parent link can be created from the unauthenticated enrolment form, where
 * the guardian address is just text a stranger typed; an application that never reached the paid stage
 * (`pending`) or was abandoned (`cancelled`) must not opt a real person into marketing. A parent with no
 * linked child yields `[]`, so they are never marketed to (and `parentWhere` never selects them).
 */
export function parentConsentFlags(
  children: { enrollments: { consentToEmails: boolean; status: string }[] }[],
): boolean[] {
  return children.flatMap((c) =>
    c.enrollments.filter((e) => e.status !== 'pending' && e.status !== 'cancelled').map((e) => e.consentToEmails),
  )
}
