import type { Category, Channel } from './types'

/**
 * Every stored template, keyed. The registry is the single list of: what a template is called,
 * whether it is transactional or marketing (consent), which channels it uses out of the box,
 * and which `{{mergeFields}}` it may use (validated on save).
 */
export const TEMPLATE_KEYS = [
  'application_received',
  'assessment_paid',
  'assessment_scheduled',
  'assessed',
  'plan_agreed',
  'enrolled',
  'feedback_request',
  'birthday_student',
  'birthday_parent',
  'new_month',
  'feedback_admin_notice',
  'class_scheduled',
  'class_reminder',
] as const
export type TemplateKey = (typeof TEMPLATE_KEYS)[number]

/** Enrollment lifecycle events the emitter understands (a subset of template keys). */
export const ENROLLMENT_EVENTS = [
  'application_received',
  'assessment_paid',
  'assessment_scheduled',
  'assessed',
  'plan_agreed',
  'enrolled',
] as const
export type EnrollmentEvent = (typeof ENROLLMENT_EVENTS)[number]

const COMMON = ['firstName', 'lastName', 'fullName', 'academyName', 'supportEmail', 'siteUrl'] as const
const ENROLLMENT = [...COMMON, 'courseTitle', 'locationName', 'enrollmentId'] as const

export interface EventDef {
  name: string
  description: string
  category: Category
  /** Channels switched on for a brand-new template. SMS/WhatsApp are opt-in. */
  defaultChannels: Channel[]
  isActiveByDefault: boolean
  fields: readonly string[]
}

export const EVENTS: Record<TemplateKey, EventDef> = {
  application_received: {
    name: 'Application received',
    description: 'Sent when someone submits the enrolment form, before they pay the assessment fee.',
    category: 'TRANSACTIONAL',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: true,
    fields: [...ENROLLMENT, 'assessmentFee'],
  },
  assessment_paid: {
    name: 'Assessment fee received',
    description:
      'Sent when the assessment fee is confirmed. Email is OFF by default because the payment receipt (with PDF) already goes out from the payment webhook; switch on SMS/WhatsApp here once a provider exists.',
    category: 'TRANSACTIONAL',
    defaultChannels: [],
    isActiveByDefault: true,
    fields: [...ENROLLMENT],
  },
  assessment_scheduled: {
    name: 'Assessment scheduled',
    description: 'Sent when an assessment slot is set, and again if the slot is rescheduled.',
    category: 'TRANSACTIONAL',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: true,
    fields: [...ENROLLMENT, 'assessmentDate', 'assessmentTime', 'assessmentArrangement'],
  },
  assessed: {
    name: 'Assessment complete',
    description: 'Sent when the assessment result is recorded. It never includes the result itself.',
    category: 'TRANSACTIONAL',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: true,
    fields: [...ENROLLMENT],
  },
  plan_agreed: {
    name: 'Learning plan agreed',
    description: 'Sent when the plan (format, class length, classes per week, planned classes) is agreed.',
    category: 'TRANSACTIONAL',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: true,
    fields: [...ENROLLMENT, 'planSummary'],
  },
  enrolled: {
    name: 'Enrolled',
    description: 'Sent when enrolment is confirmed.',
    category: 'TRANSACTIONAL',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: true,
    fields: [...ENROLLMENT],
  },
  feedback_request: {
    name: 'Feedback request',
    description: 'Sent once, 30 days after enrolment is confirmed.',
    category: 'MARKETING',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: true,
    fields: [...ENROLLMENT, 'feedbackUrl', 'feedbackEmail'],
  },
  birthday_student: {
    name: 'Birthday: student',
    description: 'Sent on the student’s birthday (Lagos time).',
    category: 'MARKETING',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: true,
    fields: [...COMMON],
  },
  birthday_parent: {
    name: 'Birthday: parent',
    description: 'Sent on the parent’s birthday (month and day on their record).',
    category: 'MARKETING',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: true,
    fields: [...COMMON],
  },
  new_month: {
    name: 'New month message',
    description: 'Sent on the 1st of each month to enrolled students and their parents.',
    category: 'MARKETING',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: true,
    fields: [...COMMON, 'monthName', 'year'],
  },
  feedback_admin_notice: {
    name: 'New feedback (to admin)',
    description: 'Sent to the feedback inbox when someone submits the public feedback form.',
    category: 'TRANSACTIONAL',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: true,
    fields: [
      'academyName',
      'authorName',
      'relationship',
      'rating',
      'feedbackText',
      'source',
      'allowTestimonial',
      'adminUrl',
    ],
  },
  class_scheduled: {
    name: 'Class scheduled (reserved)',
    description: 'Reserved for Stream 4 (scheduling). Inactive until class events are emitted.',
    category: 'TRANSACTIONAL',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: false,
    fields: [...ENROLLMENT, 'classDate', 'classTime', 'instructorName'],
  },
  class_reminder: {
    name: 'Class reminder (reserved)',
    description: 'Reserved for Stream 4 (scheduling). Inactive until class events are emitted.',
    category: 'TRANSACTIONAL',
    defaultChannels: ['EMAIL'],
    isActiveByDefault: false,
    fields: [...ENROLLMENT, 'classDate', 'classTime', 'instructorName'],
  },
}

/** Merge fields available when composing an announcement (no stored template). */
export const ANNOUNCEMENT_FIELDS: readonly string[] = [...COMMON]

export function isTemplateKey(value: string): value is TemplateKey {
  return Object.prototype.hasOwnProperty.call(EVENTS, value)
}
