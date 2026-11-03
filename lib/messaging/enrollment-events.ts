import type { Prisma } from '@prisma/client'
import { baseVars, composeMessages, recipientVars, type NewMessage } from './compose'
import { ENROLLMENT_EVENTS, type EnrollmentEvent } from './events'
import { arrangementPhrase, formatLagosDate, formatLagosTime, formatNaira, planSummary } from './format'
import { enrollmentScope } from './idempotency'
import { enqueueMessages, scheduleDrainAfterResponse } from './outbox'
import { enrollmentRecipients } from './recipients'
import { getTemplate } from './templates'

export type EnrollmentEventDb = Pick<
  Prisma.TransactionClient,
  'enrollment' | 'messageTemplate' | 'outboundMessage'
>

const FEEDBACK_DELAY_DAYS = 30

export function isEnrollmentEvent(value: string): value is EnrollmentEvent {
  return (ENROLLMENT_EVENTS as readonly string[]).includes(value)
}

/**
 * THE emitter for enrollment lifecycle messages (spec C6/C7). Called from `transitionEnrollment` on a won
 * compare-and-set (so only one writer enqueues), and directly for the two events that are not status
 * moves: `application_received` and an assessment reschedule. Idempotent via the outbox keys, so a
 * replay is a no-op. Never throws a rendering problem into the caller; returns how many rows were new.
 */
export async function emitEnrollmentEvent(db: EnrollmentEventDb, enrollmentId: string, event: EnrollmentEvent): Promise<number> {
  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: true,
      course: { select: { title: true } },
      location: { select: { name: true } },
      assessments: { orderBy: { updatedAt: 'desc' }, take: 5 },
    },
  })
  if (!enrollment) return 0

  const template = await getTemplate(db, event)
  if (!template.isActive || template.channels.length === 0) return 0

  const assessment =
    event === 'assessment_scheduled'
      ? (enrollment.assessments.find((a) => a.status === 'scheduled' && a.scheduledAt) ?? null)
      : (enrollment.assessments[0] ?? null)

  // A reschedule must re-notify (new slot), a replay of the same slot must not.
  let discriminator: string | undefined
  if (event === 'assessment_scheduled') {
    if (!assessment?.scheduledAt) return 0 // nothing to tell them yet
    discriminator = `${assessment.id}:${assessment.scheduledAt.toISOString()}`
  } else if (event === 'assessed' && assessment) {
    discriminator = assessment.id
  }

  const recipients = enrollmentRecipients({
    studentId: enrollment.studentId,
    firstName: enrollment.firstName ?? enrollment.student.firstName,
    lastName: enrollment.lastName ?? enrollment.student.lastName,
    email: enrollment.email ?? enrollment.student.email,
    phone: enrollment.phone ?? enrollment.student.phone,
    guardianName: enrollment.guardianName,
    guardianEmail: enrollment.guardianEmail,
    guardianPhone: enrollment.guardianPhone,
  })

  const common = {
    ...baseVars(),
    courseTitle: enrollment.course.title,
    locationName: enrollment.location?.name ?? '',
    enrollmentId: enrollment.id,
    assessmentFee: enrollment.applicationFeeAmount ? formatNaira(enrollment.applicationFeeAmount) : 'the assessment fee',
    assessmentDate: assessment?.scheduledAt ? formatLagosDate(assessment.scheduledAt) : '',
    assessmentTime: assessment?.scheduledAt ? formatLagosTime(assessment.scheduledAt) : '',
    assessmentArrangement: arrangementPhrase(assessment?.arrangement),
    planSummary: planSummary({
      plannedClasses: enrollment.plannedClasses,
      durationMins: enrollment.durationMins,
      classesPerWeek: enrollment.classesPerWeek,
      ratePerClass: enrollment.ratePerClass,
    }),
  }

  const rows: NewMessage[] = []
  for (const recipient of recipients) {
    rows.push(
      ...composeMessages({
        template,
        recipient,
        vars: { ...common, ...recipientVars(recipient) },
        scope: enrollmentScope(enrollmentId, event, discriminator),
        consent: [enrollment.consentToEmails],
        enrollmentId,
      }),
    )
  }

  // Enrolment also schedules the one-off feedback request, 30 days out (never for legacy rows:
  // they never pass through this emitter).
  if (event === 'enrolled') {
    const feedback = await getTemplate(db, 'feedback_request')
    if (feedback.isActive && feedback.channels.length > 0) {
      const when = new Date(Date.now() + FEEDBACK_DELAY_DAYS * 24 * 60 * 60 * 1000)
      const base = String(baseVars().siteUrl).replace(/\/$/, '')
      for (const recipient of recipients) {
        rows.push(
          ...composeMessages({
            template: feedback,
            recipient,
            vars: {
              ...common,
              ...recipientVars(recipient),
              feedbackUrl: `${base}/feedback`,
              feedbackEmail: process.env.FEEDBACK_EMAIL || process.env.SUPPORT_EMAIL || 'support@banafix.com',
            },
            scope: enrollmentScope(enrollmentId, 'feedback_request'),
            consent: [enrollment.consentToEmails],
            enrollmentId,
            scheduledFor: when,
          }),
        )
      }
    }
  }

  const { created } = await enqueueMessages(db, rows)
  if (created > 0) scheduleDrainAfterResponse()
  return created
}
