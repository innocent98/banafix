import type { Prisma } from '@prisma/client'
import { assertTransition, type EnrollmentStatus } from './enrollment-status'

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
  return result.count === 1
}
