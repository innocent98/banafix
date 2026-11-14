import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { getAssessmentFee, AssessmentFeeError, ASSESSMENT_FEE_CURRENCY } from '@/lib/assessment-fee'
import { logAdminAction } from '@/lib/audit'
import { transitionEnrollment } from '@/lib/enrollment-transition'
import {
  coverApplication,
  findCoveringFeePayment,
  lockStudent,
  recordCashAssessmentFee,
  FeeAlreadyPaidError,
  FeeNotSetError,
  FeeStateChangedError,
} from '@/lib/assessment-payment'

class LiveApplicationError extends Error {}
import { isArrangement, isTimeBand } from '@/lib/assessment-vocab'
import { validatePreferences } from '@/lib/scheduling/preferences'
import { validateRegistrant } from '@/lib/registration/validate'
import { chooseStudentEmail, NoStudentEmailError } from '@/lib/registration/student'
import { attachGuardian } from '@/lib/registration/attach'
import { parentIdsByPhone } from '@/lib/registration/parents'

const parseDate = (v: unknown): Date | null => {
  if (typeof v !== 'string' || !v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

// POST /api/admin/enrollments - admin registers a student directly (walk-in).
// Picker is location -> course -> optional offering (B7). Creates the enrollment, a requested
// Assessment, and (optionally) records the cash assessment fee and schedules the assessment now.
export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const data = await req.json()
    const {
      registeringFor, // optional 'self' | 'child'; without it the date of birth decides
      parentId, // optional: an existing Parent picked in the modal; the child is linked to it
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      guardianName: bodyGuardianName,
      guardianPhone: bodyGuardianPhone,
      guardianEmail: bodyGuardianEmail,
      address,
      landmark,
      courseId,
      locationId,
      offeringId,
      arrangement = 'CENTRE',
      preferredDate,
      preferredTimeBand,
      scheduleAssessmentAt, // optional: schedule the assessment immediately (needs feePaid)
      priorLevel,
      schedulePreference,
      preferredDays,
      preferredTimeBands,
      preferredFromTime,
      preferredToTime,
      preferredClassesPerWeek,
      musicExperience,
      goals,
      specialRequests,
      agreeToTerms = true,
      agreeToRefundPolicy = true,
      consentToEmails = false,
      couponCode,
      waitlistNotes,
      feePaid = false, // admin marks the application fee paid in cash
      paymentMethod = 'cash',
    } = data

    if (!firstName || !lastName || !courseId || !locationId) {
      return createErrorResponse('Required fields missing: firstName, lastName, locationId, courseId', 400)
    }

    // An existing parent picked by the admin supplies the guardian details (their stored record is
    // never edited from here, S6-5). A guardian given by phone alone resolves to an existing parent
    // only when exactly ONE parent has that number; several is ambiguous, so nobody is linked.
    let guardianName = bodyGuardianName
    let guardianEmail = bodyGuardianEmail
    let guardianPhone = bodyGuardianPhone
    let pickedParentId: string | null = parentId != null && parentId !== '' ? String(parentId) : null
    let resolvedByPhone = false
    if (!pickedParentId && !String(bodyGuardianEmail ?? '').trim() && String(bodyGuardianPhone ?? '').trim()) {
      const ids = await parentIdsByPhone(prisma, String(bodyGuardianPhone))
      if (ids.length === 1) {
        pickedParentId = ids[0]
        resolvedByPhone = true
      }
    }
    if (pickedParentId) {
      const picked = await prisma.parent.findUnique({ where: { id: pickedParentId } })
      if (!picked) return createErrorResponse('parentId does not match a parent', 400)
      guardianName = picked.name
      guardianEmail = picked.email
      guardianPhone = picked.phone ?? undefined
    }

    // Adult or minor, and whether a guardian is required (S6-2). An admin may register a minor whose
    // guardian has only a phone (no Parent record is created then unless one matches by phone).
    const who = validateRegistrant(
      { registeringFor, dateOfBirth, email, guardianName, guardianEmail, guardianPhone },
      { allowGuardianWithoutEmail: true },
    )
    if (!who.ok) return createErrorResponse(who.error, 400)
    if (!isArrangement(arrangement)) return createErrorResponse('arrangement must be HOME, CENTRE or ONLINE', 400)
    // Structured scheduling preferences (days, time bands, optional from/to, classes per week).
    const prefs = validatePreferences({ preferredDays, preferredTimeBands, preferredFromTime, preferredToTime, preferredClassesPerWeek })
    if (!prefs.ok) return createErrorResponse(prefs.error, 400)
    if (preferredTimeBand && !isTimeBand(preferredTimeBand)) {
      return createErrorResponse('preferredTimeBand must be morning, afternoon, evening or flexible', 400)
    }
    const preferredOn = preferredDate ? parseDate(preferredDate) : null
    if (preferredDate && !preferredOn) return createErrorResponse('preferredDate is not a valid date', 400)
    const scheduledAt = scheduleAssessmentAt ? parseDate(scheduleAssessmentAt) : null
    if (scheduleAssessmentAt && !scheduledAt) return createErrorResponse('scheduleAssessmentAt is not a valid date/time', 400)

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return createErrorResponse('Course not found', 404)

    let offering: { id: string; deliveryMode: { name: string } } | null = null
    if (offeringId) {
      offering = await prisma.courseOffering.findFirst({
        where: { id: offeringId, courseId, locationId },
        select: { id: true, deliveryMode: { select: { name: true } } },
      })
      if (!offering) {
        return createErrorResponse('offeringId must be an offering of this course at the selected location', 400)
      }
    }

    // The identity address: own email, or for a minor without one a +tag of the guardian's mailbox (S6-3).
    let normalizedEmail: string
    try {
      normalizedEmail = await chooseStudentEmail(prisma, who, { firstName, lastName })
    } catch (e) {
      if (e instanceof NoStudentEmailError) return createErrorResponse(e.message, 400)
      throw e
    }

    // Find-or-create the person. On an admin walk-in the admin is the authoritative
    // source, so provided fields refresh the stored record.
    const student = await prisma.student.upsert({
      where: { email: normalizedEmail },
      update: {
        firstName, lastName,
        phone: phone ?? undefined,
        dateOfBirth: who.dateOfBirth ?? undefined,
        address: address ?? undefined,
        landmark: landmark ?? undefined,
        guardianName: who.guardian?.name ?? undefined,
        guardianPhone: who.guardian?.phone ?? undefined,
        guardianEmail: who.guardian?.email ?? undefined,
      },
      create: {
        email: normalizedEmail,
        firstName, lastName,
        phone, dateOfBirth: who.dateOfBirth,
        address, landmark,
        guardianName: who.guardian?.name ?? null,
        guardianPhone: who.guardian?.phone ?? null,
        guardianEmail: who.guardian?.email ?? null,
      },
    })

    // Fee already paid by this student (once per student)? Then no fee is recorded or charged.
    const preCovering = await findCoveringFeePayment(prisma, student.id)
    if (preCovering && feePaid) {
      return createErrorResponse('This student has already paid the assessment fee; a second fee cannot be recorded.', 409)
    }
    if (scheduledAt && !feePaid && !preCovering) {
      return createErrorResponse('Mark the assessment fee paid to schedule the assessment now', 400)
    }

    // Live application (any paid stage / enrolled) for this course? Block. Clear any stale pending first.
    const existingLive = await prisma.enrollment.findFirst({
      where: { studentId: student.id, courseId, status: { notIn: ['pending', 'cancelled'] } },
    })
    if (existingLive) {
      return createErrorResponse('This student already has an application for this course', 400)
    }
    let feeAmount: number
    try {
      feeAmount = await getAssessmentFee(prisma, locationId)
    } catch (e) {
      if (e instanceof AssessmentFeeError) return createErrorResponse(e.message, 400)
      throw e
    }
    const fee = { amount: feeAmount, currency: ASSESSMENT_FEE_CURRENCY }

    // Enrollment + Assessment + (fee payment, status moves) in ONE transaction. The walk-in is
    // created `pending`, then moved by the guard so every step is a legal, compare-and-set move.
    let created
    try {
      created = await prisma.$transaction(async (tx) => {
      await lockStudent(tx, student.id)
      const covering = await findCoveringFeePayment(tx, student.id)
      if (covering && feePaid) throw new FeeAlreadyPaidError()
      const live = await tx.enrollment.findFirst({
        where: { studentId: student.id, courseId, status: { notIn: ['pending', 'cancelled'] } },
        select: { id: true },
      })
      if (live) throw new LiveApplicationError()

      // Stale unpaid application for this course is cancelled by this registration (not deleted: a
      // payment still in flight must keep its record; see the public POST).
      await tx.enrollment.updateMany({
        where: { studentId: student.id, courseId, status: 'pending' },
        data: { status: 'cancelled' },
      })

      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          courseId,
          locationId,
          offeringId: offering?.id ?? null,
          selectedMode: offering?.deliveryMode.name ?? '',
          priorLevel,
          schedulePreference,
          ...prefs.value,
          musicExperience,
          goals,
          specialRequests,
          agreeToTerms,
          agreeToRefundPolicy,
          consentToEmails,
          couponCode,
          waitlistNotes,
          applicationFeeAmount: fee.amount,
          applicationPaid: false,
          status: 'pending',
        },
      })
      let assessment = await tx.assessment.create({
        data: {
          enrollmentId: enrollment.id,
          status: 'requested',
          arrangement,
          preferredDate: preferredOn,
          preferredTimeBand: preferredTimeBand || null,
          address: arrangement === 'HOME' ? address || null : null,
          landmark: arrangement === 'HOME' ? landmark || null : null,
        },
      })
      let finalStatus = 'pending'

      const billing = {
        billingEmail: normalizedEmail,
        billingName: `${firstName} ${lastName}`,
      }
      if (covering) {
        // Fee already covered (once per student): no charge, the application starts at assessment_paid.
        await coverApplication(tx, enrollment.id, covering.id)
        finalStatus = 'assessment_paid'
      } else if (feePaid) {
        // Cash/offline fee: supersedes any pending Paystack payment, then pending -> assessment_paid.
        await recordCashAssessmentFee(tx, {
          enrollmentId: enrollment.id,
          studentId: student.id,
          amount: fee.amount,
          currency: fee.currency,
          paymentMethod: paymentMethod || 'cash',
          ...billing,
        })
        finalStatus = 'assessment_paid'
      }

      if (scheduledAt && finalStatus === 'assessment_paid') {
        assessment = await tx.assessment.update({ where: { id: assessment.id }, data: { status: 'scheduled', scheduledAt } })
        if (!(await transitionEnrollment(tx, enrollment.id, 'assessment_paid', 'assessment_scheduled'))) {
          throw new FeeStateChangedError()
        }
        finalStatus = 'assessment_scheduled'
      }
      return {
        enrollment: { ...enrollment, status: finalStatus, applicationPaid: finalStatus !== 'pending' },
        assessment,
        finalStatus,
        feeCovered: Boolean(covering),
      }
      })
    } catch (e) {
      if (e instanceof FeeAlreadyPaidError) return createErrorResponse(e.message, 409)
      if (e instanceof FeeNotSetError) return createErrorResponse(e.message, 400)
      if (e instanceof LiveApplicationError) return createErrorResponse('This student already has an application for this course', 400)
      if (e instanceof FeeStateChangedError) return createErrorResponse('The enrollment changed while registering; refresh and try again', 409)
      throw e
    }
    const { enrollment, assessment, finalStatus, feeCovered } = created

    // Create-or-link the Parent now the registration is committed (audited inside; never fails the request).
    const parentLink = await attachGuardian(who, student.id, {
      enrollmentId: enrollment.id,
      adminId: admin.id,
      parentId: pickedParentId,
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'enrollment.admin_create',
      entityType: 'enrollment',
      entityId: enrollment.id,
      metadata: {
        courseId,
        locationId,
        offeringId: offering?.id ?? null,
        feePaid: Boolean(feePaid),
        feeCovered,
        paymentMethod: feePaid && !feeCovered ? paymentMethod : null,
        minor: who.minor,
        parentResolvedByPhone: resolvedByPhone,
        parentId: parentLink && parentLink.outcome !== 'none' ? parentLink.parentId : null,
        toStatus: finalStatus === 'pending' ? 'pending' : 'assessment_paid',
      },
    })
    if (scheduledAt) {
      await logAdminAction({
        adminId: admin.id,
        action: 'assessment.schedule',
        entityType: 'enrollment',
        entityId: enrollment.id,
        metadata: { assessmentId: assessment.id, scheduledAt: scheduledAt.toISOString(), fromStatus: 'assessment_paid', toStatus: finalStatus },
      })
    }

    return createResponse(
      {
        enrollment,
        assessment,
        feeCovered,
        // Which parent the child is now under (null when there is no guardian, or a phone-only guardian matched nobody).
        parent: parentLink && parentLink.outcome !== 'none' ? { id: parentLink.parentId, outcome: parentLink.outcome } : null,
        message: feeCovered ? 'Student registered; assessment fee already covered' : 'Student registered',
      },
      201,
    )
  } catch (error: any) {
    console.error('Admin register student error:', error)
    return createErrorResponse('Failed to register student', 500)
  }
})
