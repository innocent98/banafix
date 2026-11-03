import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { transitionEnrollment } from '@/lib/enrollment-transition'
import { emitEnrollmentEvent } from '@/lib/messaging/enrollment-events'
import { isArrangement } from '@/lib/assessment-vocab'

type Ctx = { params: Promise<{ id: string }> }

const parseDate = (v: unknown): Date | null => {
  if (typeof v !== 'string' && typeof v !== 'number') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

async function assessorExists(assessorId: unknown): Promise<boolean> {
  if (assessorId == null || assessorId === '') return true
  if (typeof assessorId !== 'string') return false
  return Boolean(await prisma.instructor.findUnique({ where: { id: assessorId }, select: { id: true } }))
}

// POST /api/admin/enrollments/[id]/assessment - schedule (or reschedule / re-assess) an assessment.
//   assessment_paid      -> assessment_scheduled (uses the student's `requested` assessment if present)
//   assessed             -> assessment_scheduled (re-assessment: a NEW Assessment row)
//   assessment_scheduled -> reschedule in place, no status move
//   enrolled (legacy)    -> optional retroactive Assessment record, no status move
export const POST = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const scheduledAt = parseDate(body.scheduledAt)
    if (!scheduledAt) return createErrorResponse('A valid scheduledAt date/time is required', 400)
    if (body.arrangement !== undefined && !isArrangement(body.arrangement)) {
      return createErrorResponse('arrangement must be HOME, CENTRE or ONLINE', 400)
    }
    if (!(await assessorExists(body.assessorId))) return createErrorResponse('Assessor not found', 400)

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { assessments: { orderBy: { createdAt: 'desc' } } },
    })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)

    const status = enrollment.status
    const latest = enrollment.assessments[0]
    const fields = {
      status: 'scheduled',
      scheduledAt,
      ...(body.arrangement ? { arrangement: body.arrangement } : {}),
      ...(body.assessorId !== undefined ? { assessorId: body.assessorId || null } : {}),
      ...(body.address !== undefined ? { address: body.address || null } : {}),
      ...(body.landmark !== undefined ? { landmark: body.landmark || null } : {}),
    }
    const arrangement = body.arrangement ?? latest?.arrangement ?? 'CENTRE'

    if (status === 'pending') return createErrorResponse('The assessment fee must be paid before scheduling', 400)
    if (status === 'cancelled') return createErrorResponse('This enrollment is cancelled', 400)

    const result = await prisma.$transaction(async (tx) => {
      // Reschedule in place.
      if (status === 'assessment_scheduled' && latest && latest.status === 'scheduled') {
        const updated = await tx.assessment.update({ where: { id: latest.id }, data: fields })
        // Not a status move, so the transition hook does not fire: re-notify for the new slot (same slot = no-op).
        await emitEnrollmentEvent(tx, id, 'assessment_scheduled')
        return { assessment: updated, transitioned: false, action: 'assessment.reschedule' }
      }
      if (status === 'assessment_paid' || status === 'assessed') {
        const reuse = status === 'assessment_paid' && latest && latest.status === 'requested'
        const assessment = reuse
          ? await tx.assessment.update({ where: { id: latest.id }, data: fields })
          : await tx.assessment.create({ data: { enrollmentId: id, arrangement, ...fields } })
        const moved = await transitionEnrollment(tx, id, status, 'assessment_scheduled')
        if (!moved) throw new Error('STATE_CHANGED')
        return { assessment, transitioned: true, action: 'assessment.schedule' }
      }
      if (status === 'enrolled' || status === 'plan_agreed') {
        // Legacy / post-assessment rows: record-keeping only, never moves the status backwards.
        const assessment = await tx.assessment.create({ data: { enrollmentId: id, arrangement, ...fields } })
        return { assessment, transitioned: false, action: 'assessment.schedule_record_only' }
      }
      throw new Error('STATE_CHANGED')
    })

    await logAdminAction({
      adminId: admin.id,
      action: result.action,
      entityType: 'enrollment',
      entityId: id,
      metadata: {
        assessmentId: result.assessment.id,
        scheduledAt: scheduledAt.toISOString(),
        fromStatus: status,
        toStatus: result.transitioned ? 'assessment_scheduled' : status,
      },
    })
    return createResponse({ assessment: result.assessment })
  } catch (error: any) {
    if (error?.message === 'STATE_CHANGED') {
      return createErrorResponse('The enrollment changed while you were editing; refresh and try again', 409)
    }
    console.error('Schedule assessment error:', error)
    return createErrorResponse('Failed to schedule assessment', 500)
  }
})

// PATCH /api/admin/enrollments/[id]/assessment - record the result, or edit it afterwards.
//   assessment_scheduled -> assessed (records result, completes the latest scheduled assessment)
//   already completed assessment -> result edited IN PLACE, no status move, before/after audited
//   enrolled (legacy)    -> record the result on a standalone assessment, no status move
export const PATCH = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    if (typeof body.resultLevel !== 'string' || !body.resultLevel.trim()) {
      return createErrorResponse('resultLevel is required', 400)
    }
    if (!(await assessorExists(body.assessorId))) return createErrorResponse('Assessor not found', 400)
    const completedAt = body.completedAt === undefined ? new Date() : parseDate(body.completedAt)
    if (!completedAt) return createErrorResponse('completedAt is not a valid date', 400)

    if (body.recommendedOfferingId) {
      const rec = await prisma.courseOffering.findUnique({ where: { id: body.recommendedOfferingId }, select: { courseId: true } })
      const enr = await prisma.enrollment.findUnique({ where: { id }, select: { courseId: true } })
      if (!rec || !enr || rec.courseId !== enr.courseId) {
        return createErrorResponse('recommendedOfferingId must be an offering of this course', 400)
      }
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { assessments: { orderBy: { createdAt: 'desc' } } },
    })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)

    const target = body.assessmentId
      ? enrollment.assessments.find((a) => a.id === body.assessmentId)
      : enrollment.assessments[0]
    const result = {
      resultLevel: body.resultLevel.trim(),
      resultNotes: body.resultNotes ?? null,
      recommendedOfferingId: body.recommendedOfferingId || null,
      ...(body.assessorId !== undefined ? { assessorId: body.assessorId || null } : {}),
    }

    // Edit a completed result in place.
    if (target && target.status === 'completed') {
      const updated = await prisma.assessment.update({ where: { id: target.id }, data: result })
      await logAdminAction({
        adminId: admin.id,
        action: 'assessment.edit_result',
        entityType: 'enrollment',
        entityId: id,
        metadata: {
          assessmentId: target.id,
          before: { resultLevel: target.resultLevel, resultNotes: target.resultNotes, recommendedOfferingId: target.recommendedOfferingId },
          after: { resultLevel: updated.resultLevel, resultNotes: updated.resultNotes, recommendedOfferingId: updated.recommendedOfferingId },
        },
      })
      return createResponse({ assessment: updated })
    }

    if (enrollment.status === 'assessment_scheduled' && target && target.status === 'scheduled') {
      const updated = await prisma.$transaction(async (tx) => {
        const a = await tx.assessment.update({ where: { id: target.id }, data: { ...result, status: 'completed', completedAt } })
        const moved = await transitionEnrollment(tx, id, 'assessment_scheduled', 'assessed')
        if (!moved) throw new Error('STATE_CHANGED')
        return a
      })
      await logAdminAction({
        adminId: admin.id,
        action: 'assessment.result',
        entityType: 'enrollment',
        entityId: id,
        metadata: { assessmentId: updated.id, resultLevel: updated.resultLevel, fromStatus: 'assessment_scheduled', toStatus: 'assessed' },
      })
      return createResponse({ assessment: updated })
    }

    if (enrollment.status === 'enrolled') {
      // Legacy retroactive record: complete the target (or create a standalone completed one).
      const data = { ...result, status: 'completed', completedAt }
      const updated = target
        ? await prisma.assessment.update({ where: { id: target.id }, data })
        : await prisma.assessment.create({ data: { enrollmentId: id, arrangement: 'CENTRE', ...data } })
      await logAdminAction({
        adminId: admin.id,
        action: 'assessment.result_record_only',
        entityType: 'enrollment',
        entityId: id,
        metadata: { assessmentId: updated.id, resultLevel: updated.resultLevel },
      })
      return createResponse({ assessment: updated })
    }

    return createErrorResponse('Schedule the assessment before recording a result', 400)
  } catch (error: any) {
    if (error?.message === 'STATE_CHANGED') {
      return createErrorResponse('The enrollment changed while you were editing; refresh and try again', 409)
    }
    console.error('Record assessment result error:', error)
    return createErrorResponse('Failed to record assessment result', 500)
  }
})
