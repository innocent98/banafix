import type { Prisma } from '@prisma/client'
import { assertTransition, type EnrollmentStatus } from './enrollment-status'
import { emitEnrollmentEvent, isEnrollmentEvent, type EnrollmentEventDb } from './messaging/enrollment-events'

/** Minimal slice of a Prisma client / transaction client this helper needs. */
export interface EnrollmentWriter {
  enrollment: {
    updateMany(args: {
      where: Prisma.EnrollmentWhereInput
      data: Prisma.EnrollmentUpdateManyMutationInput
    }): Promise<{ count: number }>
  }
}

/**
 * Compare-and-set status move. Validates the edge with the guard, then updates only if the row
 * is STILL in `from`, so two concurrent writers (webhook retry + admin click) cannot both win.
 * Returns true iff this call performed the transition.
 */
export async function transitionEnrollment(
  tx: EnrollmentWriter,
  id: string,
  from: EnrollmentStatus,
  to: EnrollmentStatus,
  data: Prisma.EnrollmentUpdateManyMutationInput = {},
): Promise<boolean> {
  assertTransition(from, to)
  const result = await tx.enrollment.updateMany({
    where: { id, status: from },
    data: { ...data, status: to },
  })
  const won = result.count === 1
  // Communications (Stream 7): the single emit point for status-driven messages. Only the compare-and-set
  // winner enqueues, and it does so inside the caller's transaction, so replays and races enqueue once.
  // Plain fakes (unit tests) have no outbox delegates and are skipped. A non-DB failure in emitting
  // must never undo a status move.
  if (won && isEnrollmentEvent(to) && hasOutbox(tx)) {
    try {
      await emitEnrollmentEvent(tx, id, to)
    } catch (e) {
      if (isDbError(e)) throw e
      console.error(`Failed to enqueue '${to}' messages for enrollment ${id}:`, e)
    }
  }
  return won
}

function hasOutbox(tx: EnrollmentWriter): tx is EnrollmentWriter & EnrollmentEventDb {
  return typeof (tx as unknown as Partial<EnrollmentEventDb>).outboundMessage?.createMany === 'function'
}

// A failed statement aborts a Postgres transaction, so a database error must propagate (the move rolls back).
function isDbError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && typeof (e as { code: unknown }).code === 'string'
}
