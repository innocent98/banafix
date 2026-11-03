/**
 * Assessment fee lookup (replaces the hardcoded `calculateApplicationFee`, D11).
 * The fee is admin data: `Location.assessmentFee`, whole naira, non-refundable.
 * (DB column/table names keep the legacy "application" wording; this is copy-only.)
 */
export class AssessmentFeeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssessmentFeeError'
  }
}

export interface LocationFeeReader {
  location: {
    findUnique(args: {
      where: { id: string }
      select: { assessmentFee: true; isActive: true }
    }): Promise<{ assessmentFee: number; isActive: boolean } | null>
  }
}

export const ASSESSMENT_FEE_CURRENCY = 'NGN'

export async function getAssessmentFee(db: LocationFeeReader, locationId: string): Promise<number> {
  const location = await db.location.findUnique({
    where: { id: locationId },
    select: { assessmentFee: true, isActive: true },
  })
  if (!location) throw new AssessmentFeeError('Location not found')
  if (!location.isActive) throw new AssessmentFeeError('Location is not currently open for applications')
  return location.assessmentFee
}
