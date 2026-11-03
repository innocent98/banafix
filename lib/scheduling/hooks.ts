// Notification seams for Stream 7 (communications). Intentionally NO-OPS today.
// TODO(S7): wire these to the channel-agnostic outbox ("class scheduled", "class rescheduled", "class cancelled/missed").
// They are called AFTER the transaction commits and must never throw into the request.

export interface SessionsScheduledEvent { enrollmentId: string; sessionIds: string[] }
export interface SessionRescheduledEvent { enrollmentId: string; fromSessionId: string; toSessionId: string }
export interface SessionStatusEvent { enrollmentId: string; sessionId: string; from: string; to: string }

export async function onSessionsScheduled(_e: SessionsScheduledEvent): Promise<void> {
  // TODO(S7): notify the student (and guardian/parent) that classes were scheduled.
}
export async function onSessionRescheduled(_e: SessionRescheduledEvent): Promise<void> {
  // TODO(S7): notify the student that a class moved.
}
export async function onSessionStatusChanged(_e: SessionStatusEvent): Promise<void> {
  // TODO(S7): notify on cancelled / missed.
}
