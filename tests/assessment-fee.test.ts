import { describe, expect, it } from 'vitest'
import { AssessmentFeeError, getAssessmentFee } from '../lib/assessment-fee'

const db = (row: { assessmentFee: number; isActive: boolean } | null) => ({
  location: { findUnique: async () => row },
})

describe('getAssessmentFee', () => {
  it('returns the admin-set fee verbatim', async () => {
    expect(await getAssessmentFee(db({ assessmentFee: 8000, isActive: true }), 'loc')).toBe(8000)
  })
  it('allows a zero fee (admin may waive it)', async () => {
    expect(await getAssessmentFee(db({ assessmentFee: 0, isActive: true }), 'loc')).toBe(0)
  })
  it('throws for a missing location', async () => {
    await expect(getAssessmentFee(db(null), 'loc')).rejects.toBeInstanceOf(AssessmentFeeError)
  })
  it('throws for an inactive location', async () => {
    await expect(getAssessmentFee(db({ assessmentFee: 5000, isActive: false }), 'loc')).rejects.toBeInstanceOf(AssessmentFeeError)
  })
})
