/**
 * Which `Student` row a registration belongs to (Stream 6, call S6-3).
 *
 * `Student.email` is unique and identifies a person, so a minor with no email of their own cannot share
 * their guardian's address: the second sibling would be silently merged into the first. A minor without
 * an address of their own is keyed on a +tag of the guardian's mailbox (see `guardianAliasEmail`).
 * Adults are unchanged: their own email is the identity.
 */
import type { Prisma } from '@prisma/client'
import { aliasCandidates, sameChild } from './identity'
import type { RegistrantResult } from './validate'

type Ok = Extract<RegistrantResult, { ok: true }>

export async function chooseStudentEmail(
  db: Pick<Prisma.TransactionClient, 'student'>,
  v: Ok,
  child: { firstName: string; lastName: string },
): Promise<string> {
  if (!v.minor) return v.ownEmail as string
  const incoming = { firstName: child.firstName, dateOfBirth: v.dateOfBirth }

  // A minor's own address is honoured only if it is unclaimed or already this child's. A parent typing
  // their own (already registered) email into the child's box must not attach the child to themselves.
  if (v.ownEmail) {
    const existing = await db.student.findUnique({ where: { email: v.ownEmail }, select: { firstName: true, dateOfBirth: true } })
    if (!existing || sameChild(existing, incoming)) return v.ownEmail
  }

  const guardianEmail = v.guardian?.email
  if (!guardianEmail) {
    // Admin walk-in with a phone-only guardian and no child email: there is no mailbox to derive from.
    throw new NoStudentEmailError()
  }
  for (const candidate of aliasCandidates(guardianEmail, child.firstName, child.lastName, v.dateOfBirth)) {
    const existing = await db.student.findUnique({ where: { email: candidate }, select: { firstName: true, dateOfBirth: true } })
    if (!existing || sameChild(existing, incoming)) return candidate
  }
  // Six different children with one name under one guardian: a random tag keeps the record distinct.
  return aliasCandidates(guardianEmail, child.firstName, child.lastName, null)[0].replace('@', `-${Math.random().toString(36).slice(2, 6)}@`)
}

export class NoStudentEmailError extends Error {
  constructor() {
    super("A student under 18 needs an email address: the student's own, or the parent/guardian's")
  }
}
