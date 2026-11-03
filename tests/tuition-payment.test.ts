import { describe, expect, it } from 'vitest'
import { settleTuitionPayment, tuitionMetadataMatches } from '../lib/tuition-payment'

/** Stubbed db: `claimCount` for the payment claim, `moveCount` for the plan_agreed -> enrolled CAS. */
function stubDb(opts: { claimCount: number; moveCount?: number; status?: string }) {
  const calls: string[] = []
  const tx = {
    tuitionPayment: {
      updateMany: async (a: any) => {
        calls.push('claim:' + JSON.stringify(a.where.status))
        return { count: opts.claimCount }
      },
    },
    enrollment: {
      updateMany: async (a: any) => {
        calls.push(`move:${a.where.status}->${a.data.status}`)
        return { count: opts.moveCount ?? 0 }
      },
      findUnique: async () => ({ status: opts.status ?? 'unknown' }),
    },
  }
  return { calls, db: { $transaction: async (fn: any) => fn(tx) } as any }
}

describe('settleTuitionPayment', () => {
  const args = { paymentId: 'p1', enrollmentId: 'e1', paystack: { paid_at: '2026-11-03T10:00:00Z', channel: 'card' } }

  it('replay / concurrent loser: claim count 0 => already_processed and NO enrollment write', async () => {
    const { db, calls } = stubDb({ claimCount: 0 })
    expect(await settleTuitionPayment(db, args)).toEqual({ kind: 'already_processed' })
    expect(calls).toHaveLength(1)
  })
  it('claims only pending/failed/cancelled rows', async () => {
    const { db, calls } = stubDb({ claimCount: 1, moveCount: 1 })
    await settleTuitionPayment(db, args)
    expect(calls[0]).toBe('claim:{"in":["pending","failed","cancelled"]}')
  })
  it('plan_agreed -> enrolled by compare-and-set => moved', async () => {
    const { db, calls } = stubDb({ claimCount: 1, moveCount: 1 })
    expect(await settleTuitionPayment(db, args)).toEqual({ kind: 'moved' })
    expect(calls[1]).toBe('move:plan_agreed->enrolled')
  })
  it('already enrolled => settled (money recorded, no move)', async () => {
    const { db } = stubDb({ claimCount: 1, moveCount: 0, status: 'enrolled' })
    expect(await settleTuitionPayment(db, args)).toEqual({ kind: 'settled' })
  })
  it('cancelled while paying => unexpected_state, never moved', async () => {
    const { db } = stubDb({ claimCount: 1, moveCount: 0, status: 'cancelled' })
    expect(await settleTuitionPayment(db, args)).toEqual({ kind: 'unexpected_state', status: 'cancelled' })
  })
})

describe('tuitionMetadataMatches', () => {
  const row = { id: 'p1', enrollmentId: 'e1' }
  it('absent / empty metadata is fine (the reference lookup is the authority)', () => {
    expect(tuitionMetadataMatches(undefined, row)).toBe(true)
    expect(tuitionMetadataMatches({}, row)).toBe(true)
    expect(tuitionMetadataMatches('x', row)).toBe(true)
  })
  it('agreeing metadata passes', () => {
    expect(tuitionMetadataMatches({ payment_type: 'tuition', enrollment_id: 'e1', tuition_payment_id: 'p1' }, row)).toBe(true)
  })
  it('a different enrollment, row or payment type fails', () => {
    expect(tuitionMetadataMatches({ enrollment_id: 'other' }, row)).toBe(false)
    expect(tuitionMetadataMatches({ tuition_payment_id: 'other' }, row)).toBe(false)
    expect(tuitionMetadataMatches({ payment_type: 'application_fee' }, row)).toBe(false)
  })
})
