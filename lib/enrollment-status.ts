/**
 * The single owner of `Enrollment.status` moves (spec: assessment-first admission).
 *
 *   pending -> assessment_paid -> assessment_scheduled -> assessed -> plan_agreed -> enrolled
 *   any non-terminal -> cancelled
 *
 * Builder addition (B5): `assessed -> assessment_scheduled` for a re-assessment (a new
 * Assessment row). `enrolled` and `cancelled` are terminal. Legacy `enrolled`/`pending`
 * rows keep their values; anything else (e.g. the retired `application_paid`) is unknown.
 */
export type EnrollmentStatus =
  | 'pending'
  | 'assessment_paid'
  | 'assessment_scheduled'
  | 'assessed'
  | 'plan_agreed'
  | 'enrolled'
  | 'cancelled'

export const ALLOWED_TRANSITIONS: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
  pending: ['assessment_paid', 'cancelled'],
  assessment_paid: ['assessment_scheduled', 'cancelled'],
  assessment_scheduled: ['assessed', 'cancelled'],
  assessed: ['plan_agreed', 'assessment_scheduled', 'cancelled'],
  plan_agreed: ['enrolled', 'cancelled'],
  enrolled: [],
  cancelled: [],
}

export const TERMINAL: readonly EnrollmentStatus[] = ['enrolled', 'cancelled']

/** Human labels for admin/UI. Legacy `enrolled` reads the same as a newly confirmed one. */
export const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending: 'Pending payment',
  assessment_paid: 'Assessment paid',
  assessment_scheduled: 'Assessment scheduled',
  assessed: 'Assessed',
  plan_agreed: 'Plan agreed',
  enrolled: 'Enrolled',
  cancelled: 'Cancelled',
}

export const STATUS_ORDER: readonly EnrollmentStatus[] = [
  'pending',
  'assessment_paid',
  'assessment_scheduled',
  'assessed',
  'plan_agreed',
  'enrolled',
  'cancelled',
]

export function isEnrollmentStatus(value: string): value is EnrollmentStatus {
  return Object.prototype.hasOwnProperty.call(ALLOWED_TRANSITIONS, value)
}

export function canTransition(from: string, to: string): boolean {
  if (!isEnrollmentStatus(from) || !isEnrollmentStatus(to)) return false
  return ALLOWED_TRANSITIONS[from].includes(to)
}

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Invalid enrollment status transition: ${from} -> ${to}`)
    this.name = 'InvalidTransitionError'
  }
}

export function assertTransition(from: string, to: string): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to)
}
