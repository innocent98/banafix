import type { Recipient } from './types'
import { sameMailbox } from '@/lib/registration/identity'

export interface EnrollmentContact {
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  guardianName?: string | null
  guardianEmail?: string | null
  guardianPhone?: string | null
}

/** The student, plus the guardian recorded on the enrollment when they are a different contact. */
export function enrollmentRecipients(c: EnrollmentContact): Recipient[] {
  const name = `${c.firstName} ${c.lastName}`.trim() || c.email
  const out: Recipient[] = [{ type: 'student', id: c.studentId, name, email: c.email, phone: c.phone ?? null }]

  const gEmail = c.guardianEmail?.trim() || null
  const gPhone = c.guardianPhone?.trim() || null
  if (!gEmail && !gPhone) return out
  // Same mailbox, ignoring a +tag: a child registered without an email of their own is keyed on
  // `guardian+child@domain` (Stream 6), and the guardian must not get every message twice.
  const sameEmail = gEmail && sameMailbox(gEmail, c.email)
  const samePhone = !gEmail && gPhone && gPhone === c.phone
  if (sameEmail || samePhone) return out

  out.push({
    type: 'guardian',
    id: `${c.studentId}:guardian`,
    name: c.guardianName?.trim() || 'Parent/Guardian',
    email: gEmail,
    phone: gPhone,
  })
  return out
}
