import { describe, expect, it } from 'vitest'
import { assessmentFeeDue, classifyIncomingFeePayment } from '../lib/assessment-fee-rule'

describe('assessmentFeeDue (once per student)', () => {
  it('is due for a student with no payments', () => {
    expect(assessmentFeeDue([])).toBe(true)
  })
  it('is NOT due once any payment is completed, whatever else exists', () => {
    expect(assessmentFeeDue([{ status: 'completed' }])).toBe(false)
    expect(assessmentFeeDue([{ status: 'failed' }, { status: 'completed' }, { status: 'pending' }])).toBe(false)
  })
  it('only completed payments count: pending, failed, superseded, duplicate and refunded do not', () => {
    for (const status of ['pending', 'failed', 'superseded', 'duplicate', 'refunded']) {
      expect(assessmentFeeDue([{ status }])).toBe(true)
    }
  })
})

describe('classifyIncomingFeePayment', () => {
  it('settles a pending payment when the student has no completed fee', () => {
    expect(classifyIncomingFeePayment({ paymentStatus: 'pending', studentHasCompletedFee: false })).toBe('settle')
  })
  it('settles a payment that earlier reported failed (Paystack can report a later success)', () => {
    expect(classifyIncomingFeePayment({ paymentStatus: 'failed', studentHasCompletedFee: false })).toBe('settle')
  })
  it('is a replay when the payment is already completed (never a duplicate of itself)', () => {
    expect(classifyIncomingFeePayment({ paymentStatus: 'completed', studentHasCompletedFee: true })).toBe('already_processed')
    expect(classifyIncomingFeePayment({ paymentStatus: 'completed', studentHasCompletedFee: false })).toBe('already_processed')
  })
  it('flags money as a duplicate when the student already has a completed fee (two tabs, two applications)', () => {
    expect(classifyIncomingFeePayment({ paymentStatus: 'pending', studentHasCompletedFee: true })).toBe('duplicate')
    expect(classifyIncomingFeePayment({ paymentStatus: 'failed', studentHasCompletedFee: true })).toBe('duplicate')
  })
  it('flags money as a duplicate when cash superseded the payment, even with no other completed fee on record', () => {
    expect(classifyIncomingFeePayment({ paymentStatus: 'superseded', studentHasCompletedFee: false })).toBe('duplicate')
    expect(classifyIncomingFeePayment({ paymentStatus: 'superseded', studentHasCompletedFee: true })).toBe('duplicate')
  })
  it('does not re-process a payment already flagged duplicate or refunded (replay-safe)', () => {
    expect(classifyIncomingFeePayment({ paymentStatus: 'duplicate', studentHasCompletedFee: true })).toBe('already_processed')
    expect(classifyIncomingFeePayment({ paymentStatus: 'refunded', studentHasCompletedFee: true })).toBe('already_processed')
  })
  it('treats an unknown status conservatively as already processed (never settles by accident)', () => {
    expect(classifyIncomingFeePayment({ paymentStatus: 'weird', studentHasCompletedFee: false })).toBe('already_processed')
  })
})
