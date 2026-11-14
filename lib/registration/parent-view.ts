/**
 * What the admin sees for a parent: each child with their applications, and whether the parent can be
 * sent marketing (derived, never stored: consent lives on the children's enrollments, see
 * `parentConsentFlags`). Shared by the list and detail routes.
 */
import type { Prisma } from '@prisma/client'
import { parentConsentFlags } from '@/lib/messaging/consent'

export const PARENT_CHILD_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  dateOfBirth: true,
  enrollments: {
    select: {
      id: true,
      status: true,
      consentToEmails: true,
      createdAt: true,
      course: { select: { title: true } },
      location: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.StudentSelect

type ChildRow = Prisma.StudentGetPayload<{ select: typeof PARENT_CHILD_SELECT }>

export function withMarketingFlag<P extends { children: ChildRow[] }>(parent: P) {
  return { ...parent, marketingConsent: parentConsentFlags(parent.children).some(Boolean) }
}
