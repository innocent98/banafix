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
