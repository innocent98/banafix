/**
 * Shared contract for the public contact form.
 *
 * Both the client form (`components/site/contact/contact-form.tsx`) and the
 * handler (`app/api/contact/route.ts`) import this, so the field names, the
 * allowed subjects and the validation rules cannot drift apart. Nothing here
 * touches React or Node — it is safe on both sides of the boundary.
 */

/** The disabled first <option>, exactly as the handoff writes it. */
export const CONTACT_SUBJECT_PLACEHOLDER = "What's this about?"

/**
 * The four real subject options, in the handoff's order. Banafix does not run
 * free trial lessons, so the handoff's "Booking a free trial" option is
 * replaced by the enquiry people actually send.
 */
export const CONTACT_SUBJECTS = [
  "Enrolling in a course",
  "Course fees",
  "Home training",
  "Instrument rental",
] as const

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]

/**
 * `/contact?subject=…` shortcuts, so a CTA elsewhere on the site can land on
 * the form with the right subject already chosen. Both spellings of enrol are
 * accepted, and `course` is kept as a plain-English synonym.
 *
 * Example: `/contact?subject=enrol` preselects "Enrolling in a course".
 */
const SUBJECT_ALIASES: Record<string, ContactSubject> = {
  enrol: "Enrolling in a course",
  enroll: "Enrolling in a course",
  course: "Enrolling in a course",
  fees: "Course fees",
  home: "Home training",
  rental: "Instrument rental",
}

/** Resolves a `?subject=` value to a real option, or "" when unrecognised. */
export function subjectFromParam(raw: string | string[] | undefined | null): ContactSubject | "" {
  const first = Array.isArray(raw) ? raw[0] : raw
  if (!first) return ""
  const key = first.trim().toLowerCase()
  const alias = SUBJECT_ALIASES[key]
  if (alias) return alias
  return CONTACT_SUBJECTS.find((s) => s.toLowerCase() === key) ?? ""
}

export interface ContactMessageInput {
  name: string
  phone: string
  email: string
  subject: string
  message: string
}

export type ContactField = keyof ContactMessageInput
export type ContactFieldErrors = Partial<Record<ContactField, string>>

/** Hidden field. A real person never fills it; bots fill everything. */
export const CONTACT_HONEYPOT_FIELD = "company"

export const CONTACT_LIMITS = {
  name: 120,
  phone: 40,
  email: 200,
  message: 4000,
  messageMin: 10,
} as const

/**
 * Deliberately permissive — it rejects the shapes that cannot be an address
 * rather than trying to encode RFC 5322. The real check is whether the reply
 * lands.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export type ContactValidation =
  | { ok: true; value: ContactMessageInput }
  | { ok: false; errors: ContactFieldErrors }

/**
 * Validates one submission. Name, email and message are required; phone and
 * subject are optional. Run on both sides: the client for instant feedback,
 * the server because the client can be bypassed.
 */
export function validateContactMessage(raw: Partial<Record<ContactField, unknown>>): ContactValidation {
  const value: ContactMessageInput = {
    name: str(raw.name),
    phone: str(raw.phone),
    email: str(raw.email),
    subject: str(raw.subject),
    message: str(raw.message),
  }

  const errors: ContactFieldErrors = {}

  if (!value.name) {
    errors.name = "Tell us your name so we know who we're replying to."
  } else if (value.name.length > CONTACT_LIMITS.name) {
    errors.name = `Please keep your name under ${CONTACT_LIMITS.name} characters.`
  }

  if (!value.email) {
    errors.email = "We need an email address to reply to."
  } else if (value.email.length > CONTACT_LIMITS.email || !EMAIL_RE.test(value.email)) {
    errors.email = "That doesn't look like a valid email address."
  }

  if (value.phone.length > CONTACT_LIMITS.phone) {
    errors.phone = `Please keep your phone number under ${CONTACT_LIMITS.phone} characters.`
  }

  // Optional, but if it is set it must be one we offer — a free-text subject
  // from a scripted POST is a spam vector.
  if (value.subject && !(CONTACT_SUBJECTS as readonly string[]).includes(value.subject)) {
    errors.subject = "Pick one of the listed subjects."
  }

  if (!value.message) {
    errors.message = "Let us know what you'd like to learn."
  } else if (value.message.length < CONTACT_LIMITS.messageMin) {
    errors.message = "A little more detail helps us point you at the right tutor."
  } else if (value.message.length > CONTACT_LIMITS.message) {
    errors.message = `Please keep your message under ${CONTACT_LIMITS.message} characters.`
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, value }
}
