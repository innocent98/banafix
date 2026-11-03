export const FEEDBACK_HONEYPOT_FIELD = 'company'
export const FEEDBACK_SOURCES = ['EMAIL', 'WEB', 'WHATSAPP', 'ADMIN'] as const
export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number]
export const FEEDBACK_STATUSES = ['new', 'reviewed', 'archived'] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export interface FeedbackInput {
  authorName: string
  relationship: string | null
  email: string | null
  rating: number | null
  text: string
  allowTestimonial: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export function validateFeedback(
  input: unknown,
): { ok: true; value: FeedbackInput } | { ok: false; errors: Record<string, string> } {
  const b = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const errors: Record<string, string> = {}

  const authorName = str(b.authorName)
  if (!authorName) errors.authorName = 'Please tell us your name.'
  else if (authorName.length > 100) errors.authorName = 'Name is too long.'

  const text = str(b.text)
  if (!text) errors.text = 'Please write your feedback.'
  else if (text.length > 2000) errors.text = 'Feedback must be 2000 characters or fewer.'

  const relationship = str(b.relationship) || null
  if (relationship && relationship.length > 100) errors.relationship = 'Relationship is too long.'

  const email = str(b.email) || null
  if (email && !EMAIL_RE.test(email)) errors.email = 'That email address does not look right.'

  let rating: number | null = null
  const rawRating = typeof b.rating === 'string' ? b.rating.trim() : b.rating
  if (rawRating !== undefined && rawRating !== null && rawRating !== '') {
    const n = Number(rawRating)
    if (!Number.isInteger(n) || n < 1 || n > 5) errors.rating = 'Rating must be a whole number from 1 to 5.'
    else rating = n
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    value: { authorName, relationship, email, rating, text, allowTestimonial: b.allowTestimonial === true },
  }
}
