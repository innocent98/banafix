import { describe, expect, it } from 'vitest'
import { FEEDBACK_HONEYPOT_FIELD, validateFeedback } from './feedback'
import { toTestimonialInput } from './feedback-promotion'

const ok = { authorName: 'Mrs Obi', text: 'My daughter loves her piano lessons.' }

describe('validateFeedback', () => {
  it('accepts the minimum and defaults consent to false', () => {
    const r = validateFeedback(ok)
    expect(r).toEqual({
      ok: true,
      value: { authorName: 'Mrs Obi', relationship: null, email: null, rating: null, text: ok.text, allowTestimonial: false },
    })
  })
  it('keeps optional fields, trimmed', () => {
    const r = validateFeedback({ ...ok, relationship: ' Parent ', email: ' a@b.test ', rating: '4', allowTestimonial: true })
    expect(r).toMatchObject({ ok: true, value: { relationship: 'Parent', email: 'a@b.test', rating: 4, allowTestimonial: true } })
  })
  it('rejects empty name and empty text', () => {
    const r = validateFeedback({ authorName: ' ', text: '' })
    expect(r).toMatchObject({ ok: false, errors: { authorName: expect.any(String), text: expect.any(String) } })
  })
  it.each([0, 6, 2.5, 'x'])('rejects rating %j', (rating) => {
    expect(validateFeedback({ ...ok, rating })).toMatchObject({ ok: false, errors: { rating: expect.any(String) } })
  })
  it('treats an empty rating as not given', () => {
    expect(validateFeedback({ ...ok, rating: '' })).toMatchObject({ ok: true, value: { rating: null } })
  })
  it('rejects a malformed email and an over-long text', () => {
    expect(validateFeedback({ ...ok, email: 'nope' })).toMatchObject({ ok: false, errors: { email: expect.any(String) } })
    expect(validateFeedback({ ...ok, text: 'x'.repeat(2001) })).toMatchObject({ ok: false, errors: { text: expect.any(String) } })
  })
  it('exports the honeypot field name', () => {
    expect(FEEDBACK_HONEYPOT_FIELD).toBe('company')
  })
})

describe('toTestimonialInput', () => {
  const fb = { authorName: 'Mrs Obi', relationship: 'Parent', text: 'Great.', allowTestimonial: true }
  it('maps to an UNPUBLISHED testimonial carrying the consent', () => {
    expect(toTestimonialInput(fb)).toEqual({ name: 'Mrs Obi', role: 'Parent', quote: 'Great.', permissionToPublish: true, isPublished: false })
  })
  it('refuses without permission to quote', () => {
    expect(() => toTestimonialInput({ ...fb, allowTestimonial: false })).toThrow(/permission/i)
  })
  it('blank relationship becomes null', () => {
    expect(toTestimonialInput({ ...fb, relationship: '  ' }).role).toBeNull()
  })
})
