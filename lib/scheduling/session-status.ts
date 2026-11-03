export type SessionStatus = 'scheduled' | 'held' | 'missed' | 'rescheduled' | 'cancelled'
export const SESSION_STATUSES: readonly SessionStatus[] = ['scheduled', 'held', 'missed', 'rescheduled', 'cancelled']

/** Blocks the instructor's and the student's time (mirrors the exclusion constraints' WHERE clause). */
export const ACTIVE_STATUSES: readonly SessionStatus[] = ['scheduled', 'held']
/** Occupies its per-enrollment sequence slot (mirrors the partial unique index). `missed` is consumed by design (S4). */
export const SLOT_STATUSES: readonly SessionStatus[] = ['scheduled', 'held', 'missed']

const MOVES: Record<SessionStatus, readonly SessionStatus[]> = {
  scheduled: ['held', 'missed', 'cancelled', 'rescheduled'],
  held: ['missed', 'scheduled'],
  missed: ['held', 'scheduled'],
  rescheduled: [],
  cancelled: [],
}

export const isSessionStatus = (s: unknown): s is SessionStatus =>
  typeof s === 'string' && (SESSION_STATUSES as readonly string[]).includes(s)

export function canMoveSession(from: string, to: string): boolean {
  return isSessionStatus(from) && isSessionStatus(to) && MOVES[from].includes(to)
}
