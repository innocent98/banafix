/**
 * Pure identity helpers for registration (Stream 6): email / phone normalisation, age, and the
 * guardian-derived address a minor without an email of their own is keyed on.
 * No database access here; see parents.ts / student.ts for that.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
}

export function isValidEmail(raw: unknown): boolean {
  return EMAIL_REGEX.test(normalizeEmail(raw))
}

/** The mailbox an address delivers to, ignoring a `+tag` in the local part (`mum+ada@x.com` -> `mum@x.com`). */
export function canonicalEmail(raw: unknown): string {
  const email = normalizeEmail(raw)
  const at = email.lastIndexOf('@')
  if (at < 1) return email
  return `${email.slice(0, at).split('+')[0]}${email.slice(at)}`
}

/** True when two addresses deliver to the same mailbox (identical, or differing only by a +tag). */
export function sameMailbox(a: unknown, b: unknown): boolean {
  const ca = canonicalEmail(a)
  return ca !== '' && ca === canonicalEmail(b)
}

/** Digits only. */
export function phoneDigits(raw: unknown): string {
  return typeof raw === 'string' ? raw.replace(/\D/g, '') : ''
}

/**
 * Comparison key for a phone number: its last 10 digits, so `0903 856 3822`, `+234 903 856 3822` and
 * `2349038563822` are one number. Null when there are fewer than 10 digits (too short to trust).
 */
export function phoneKey(raw: unknown): string | null {
  const digits = phoneDigits(raw)
  return digits.length >= 10 ? digits.slice(-10) : null
}

const ADULT_AGE = 18

/** Whole years between `dob` and `now` (UTC calendar dates). */
export function ageInYears(dob: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear()
  const beforeBirthday =
    now.getUTCMonth() < dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

export function isMinorDob(dob: Date, now: Date = new Date()): boolean {
  return ageInYears(dob, now) < ADULT_AGE
}

export function parseDob(raw: unknown): Date | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function slug(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

/**
 * The address a child with no email of their own is keyed on: a +tag on the guardian's mailbox, so mail
 * reaches the guardian and every child of one guardian still has a distinct `Student.email` (which is
 * unique). Deterministic for the same child (first + last name), so a second course for the same child
 * finds the same student. `extra` disambiguates (birth date or a counter).
 */
export function guardianAliasEmail(
  guardianEmail: string,
  firstName: string,
  lastName: string,
  extra?: string,
): string {
  const email = normalizeEmail(guardianEmail)
  const at = email.lastIndexOf('@')
  const base = email.slice(0, at).split('+')[0]
  const domain = email.slice(at + 1)
  const name = [slug(firstName), slug(lastName)].filter(Boolean).join('-') || 'child'
  return `${base}+${name}${extra ? `-${extra}` : ''}@${domain}`
}

/** Candidate aliases for one child, most natural first. */
export function aliasCandidates(
  guardianEmail: string,
  firstName: string,
  lastName: string,
  dob: Date | null,
): string[] {
  const out = [guardianAliasEmail(guardianEmail, firstName, lastName)]
  if (dob) out.push(guardianAliasEmail(guardianEmail, firstName, lastName, ymd(dob)))
  for (let n = 2; n <= 5; n++) out.push(guardianAliasEmail(guardianEmail, firstName, lastName, String(n)))
  return out
}

/**
 * Is the stored student plausibly the same child as the incoming registration? First names match
 * (siblings share a surname, so surname is not compared) and the birth dates do not contradict.
 */
export function sameChild(
  existing: { firstName: string; dateOfBirth: Date | null },
  incoming: { firstName: string; dateOfBirth: Date | null },
): boolean {
  if (existing.firstName.trim().toLowerCase() !== incoming.firstName.trim().toLowerCase()) return false
  if (existing.dateOfBirth && incoming.dateOfBirth) {
    return ymd(existing.dateOfBirth) === ymd(incoming.dateOfBirth)
  }
  return true
}
