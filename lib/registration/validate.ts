/**
 * Server-side validation of who is registering (Stream 6, calls S6-2 / S6-3): adult or minor, and
 * whether a guardian is required. Pure; shared by the public enrolment route and the admin walk-in.
 */
import { isValidEmail, isMinorDob, normalizeEmail, parseDob, sameMailbox } from './identity'

export type RegisteringFor = 'self' | 'child'

export interface RegistrantInput {
  registeringFor?: unknown
  dateOfBirth?: unknown
  email?: unknown
  guardianName?: unknown
  guardianEmail?: unknown
  guardianPhone?: unknown
}

export interface GuardianContact {
  name: string
  /** Lower-cased; null only on the admin path when the guardian has just a phone. */
  email: string | null
  phone: string | null
}

export type RegistrantResult =
  | {
      ok: true
      minor: boolean
      /** The student's own address; null for a minor registering without one (a guardian-derived address is used). */
      ownEmail: string | null
      guardian: GuardianContact | null
      dateOfBirth: Date | null
    }
  | { ok: false; error: string }

export interface ValidateOptions {
  now?: Date
  /** Admin walk-in only: a guardian with a phone but no email is accepted for a minor (no Parent record is created). */
  allowGuardianWithoutEmail?: boolean
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export function validateRegistrant(input: RegistrantInput, opts: ValidateOptions = {}): RegistrantResult {
  const now = opts.now ?? new Date()
  const claim = input.registeringFor
  if (claim != null && claim !== '' && claim !== 'self' && claim !== 'child') {
    return { ok: false, error: 'registeringFor must be self or child' }
  }

  let dateOfBirth: Date | null = null
  if (str(input.dateOfBirth)) {
    dateOfBirth = parseDob(input.dateOfBirth)
    if (!dateOfBirth) return { ok: false, error: 'Invalid date of birth' }
    if (dateOfBirth.getTime() > now.getTime()) return { ok: false, error: 'Date of birth cannot be in the future' }
  }

  // A declared "child", or a birth date under 18, makes the registrant a minor. A birth date wins over
  // a claim of "myself": the server does not take an adult's word against its own record.
  const minor = claim === 'child' || (dateOfBirth !== null && isMinorDob(dateOfBirth, now))

  const gName = str(input.guardianName)
  const gEmailRaw = str(input.guardianEmail)
  const gPhone = str(input.guardianPhone)
  if (gEmailRaw && !isValidEmail(gEmailRaw)) return { ok: false, error: 'Invalid guardian email format' }
  const gEmail = gEmailRaw ? normalizeEmail(gEmailRaw) : null

  const ownRaw = str(input.email)
  if (ownRaw && !isValidEmail(ownRaw)) return { ok: false, error: 'Invalid email format' }
  let ownEmail: string | null = ownRaw ? normalizeEmail(ownRaw) : null

  if (minor) {
    const contact = opts.allowGuardianWithoutEmail ? Boolean(gEmail || gPhone) : Boolean(gEmail)
    if (!gName || !contact) {
      return {
        ok: false,
        error: opts.allowGuardianWithoutEmail
          ? 'A student under 18 needs a parent or guardian: their name and an email or phone number'
          : 'A student under 18 needs a parent or guardian: their name and email address',
      }
    }
    // The guardian's own address is not the child's: that would key two siblings to one student.
    if (ownEmail && gEmail && sameMailbox(ownEmail, gEmail)) ownEmail = null
    return {
      ok: true,
      minor: true,
      ownEmail,
      guardian: { name: gName, email: gEmail, phone: gPhone || null },
      dateOfBirth,
    }
  }

  if (!ownEmail) return { ok: false, error: 'Email is required' }

  // An adult may still name someone who handles lessons and payments. A guardian email needs a name
  // (a Parent record has both); a guardian who is the student's own mailbox is just the student.
  let guardian: GuardianContact | null = null
  if (gEmail || gName || gPhone) {
    if (gEmail && !gName) return { ok: false, error: 'Add the guardian name, or remove the guardian email' }
    if (!(gEmail && sameMailbox(gEmail, ownEmail))) {
      guardian = { name: gName, email: gEmail, phone: gPhone || null }
    }
  }
  return { ok: true, minor: false, ownEmail, guardian, dateOfBirth }
}
