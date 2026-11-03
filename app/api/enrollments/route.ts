import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { initializePayment, createApplicationFeePayment, generatePaymentReference } from '@/lib/paystack'
import { isCourseExpired } from '@/lib/course-utils'
import { getAssessmentFee, AssessmentFeeError, ASSESSMENT_FEE_CURRENCY } from '@/lib/assessment-fee'
import { isArrangement, isTimeBand } from '@/lib/assessment-vocab'
import { offerableOfferingWhere } from '@/lib/offerings'
import { sendEnrollmentConfirmation, sendApplicationFeeCovered } from '@/lib/email'
import { isThrottled } from '@/lib/throttle'
import { coverApplication, findCoveringFeePayment, lockStudent } from '@/lib/assessment-payment'
import type { Prisma } from '@prisma/client'

// POST /api/enrollments - Create new enrollment with payment initialization
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const {
      // Student Information
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,

      // Guardian Information
      guardianName,
      guardianPhone,
      guardianEmail,

      // Address Information (also the home-assessment address when arrangement is HOME)
      address,
      landmark,

      // Course + offering (location and format) selection
      courseId,
      offeringId,

      // Assessment arrangement
      arrangement,
      preferredDate,
      preferredTimeBand,

      // Course Preferences
      priorLevel,
      schedulePreference,
      preferredDays,
      musicExperience,
      goals,
      specialRequests,

      // Policy Agreements
      agreeToTerms,
      agreeToRefundPolicy,
      consentToEmails,

      // Additional Information
      couponCode,
      waitlistNotes,

      // Billing Information
      billingAddress,
      billingCity,
      billingState,
    } = data

    // Validation
    if (!firstName || !lastName || !email || !courseId || !offeringId) {
      return createErrorResponse('Required fields missing: firstName, lastName, email, courseId, offeringId', 400)
    }

    if (!isArrangement(arrangement)) {
      return createErrorResponse('Invalid assessment arrangement', 400)
    }
    if (arrangement === 'HOME' && !String(address ?? '').trim()) {
      return createErrorResponse('Home assessments need an address', 400)
    }
    if (preferredTimeBand != null && preferredTimeBand !== '' && !isTimeBand(preferredTimeBand)) {
      return createErrorResponse('Invalid preferred time', 400)
    }
    const preferredDateValue = preferredDate ? new Date(preferredDate) : null
    if (preferredDateValue && Number.isNaN(preferredDateValue.getTime())) {
      return createErrorResponse('Invalid preferred date', 400)
    }

    if (!agreeToTerms || !agreeToRefundPolicy) {
      return createErrorResponse('You must agree to the terms and conditions and refund policy', 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400)
    }

    // Unauthenticated and it can email an address and create applications: throttle per IP and per
    // email (best-effort, per instance), after validation so a typo does not burn the allowance.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const emailKey = String(email).trim().toLowerCase()
    if (isThrottled(`enrol:ip:${ip}`, 10, 10 * 60 * 1000) || isThrottled(`enrol:email:${emailKey}`, 5, 10 * 60 * 1000)) {
      return createErrorResponse('Too many applications. Please wait a few minutes and try again.', 429)
    }

    // Check if course exists and is available
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!course) {
      return createErrorResponse('Course not found', 404)
    }

    if (!course.isPublished || !course.isActive) {
      return createErrorResponse('Course is not available for enrollment', 400)
    }

    // Check if course is expired
    if (isCourseExpired(course.sessionStartDate)) {
      return createErrorResponse('Course enrollment has expired', 400)
    }

    // Seat counting is retired (D9): capacity is never enforced.

    // The offering must belong to this course and be offerable (B6): active offering, active
    // location, at least one per-class rate. Location and format both come from it.
    const offering = await prisma.courseOffering.findFirst({
      where: { id: String(offeringId), courseId, ...offerableOfferingWhere() },
      select: { id: true, locationId: true, deliveryMode: { select: { name: true } } },
    })
    if (!offering) {
      return createErrorResponse('This format is not currently open for enrolment at that location', 400)
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Find-or-create the person. Email is immutable and identifies the person.
    // O4 (reconciled with the edit-student module): on RE-enrollment we do NOT
    // overwrite an existing student's stored fields — the admin edit screen
    // (PATCH /api/admin/students/[id]) is the source of truth, so a returning
    // student's form can't silently clobber an admin correction. Only a brand-new
    // student's fields are written (the `create` branch).
    const student = await prisma.student.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        firstName, lastName,
        phone, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address, landmark, guardianName, guardianPhone, guardianEmail,
      },
    })

    // Block if this student already has a live application for THIS course (any paid stage or
    // enrolled). A stale `pending` or a `cancelled` one must not block a retry (B9).
    const liveEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, courseId, status: { notIn: ['pending', 'cancelled'] } },
      select: { status: true },
    })
    if (liveEnrollment) {
      return createErrorResponse(
        liveEnrollment.status === 'enrolled'
          ? 'You are already enrolled in this course'
          : 'You already have an application for this course in progress',
        400,
      )
    }
    // Older unpaid applications for this course are superseded by this one, but only AFTER the new
    // payment has been initialised (below): an unauthenticated request must not be able to cancel
    // anyone's application if it then fails validation or Paystack init. They are cancelled, not
    // deleted, so a bank-transfer/USSD payment still in flight keeps its record (a late webhook
    // for a cancelled enrollment is recorded + audited, never lost and never re-activated).
    const staleApplications = await prisma.enrollment.findMany({
      where: { studentId: student.id, courseId, status: 'pending' },
      select: { id: true },
    })

    // Everything an application row needs, shared by the fee-due and fee-covered paths.
    const enrollmentData: Prisma.EnrollmentUncheckedCreateInput = {
      studentId: student.id,
      courseId,
      locationId: offering.locationId,
      offeringId: offering.id,
      selectedMode: offering.deliveryMode.name,
      priorLevel,
      schedulePreference,
      preferredDays: preferredDays || [],
      musicExperience,
      goals,
      specialRequests,
      agreeToTerms,
      agreeToRefundPolicy,
      consentToEmails,
      couponCode,
      waitlistNotes,
      status: 'pending',
      // The assessment request is created with the enrollment (B4); the stale-pending cleanup
      // above cascades it, and so does the cleanup below if payment initialisation fails.
      assessments: {
        create: {
          status: 'requested',
          arrangement,
          preferredDate: preferredDateValue,
          preferredTimeBand: preferredTimeBand || null,
          address: arrangement === 'HOME' ? String(address).trim() : null,
          landmark: arrangement === 'HOME' && landmark ? String(landmark).trim() : null,
        },
      },
    }

    // The assessment fee is charged ONCE PER STUDENT. A student with a completed fee payment (an
    // earlier application, or a legacy student who paid under the old flow) is never charged again:
    // no Paystack, the application starts at assessment_paid. The server decides here; the wizard
    // never learns beforehand whether an email belongs to an existing student.
    if (await findCoveringFeePayment(prisma, student.id)) {
      const covered = await prisma.$transaction(async (tx) => {
        await lockStudent(tx, student.id)
        const covering = await findCoveringFeePayment(tx, student.id)
        if (!covering) return null
        // Re-check under the student lock: two simultaneous covered submits must not both create a
        // live application for one course.
        const live = await tx.enrollment.findFirst({
          where: { studentId: student.id, courseId, status: { notIn: ['pending', 'cancelled'] } },
          select: { id: true },
        })
        if (live) return 'live' as const
        // A covered application is created at assessment_paid with no payment, from an
        // unauthenticated request: it neither stores the request's home address (admin confirms the
        // address when scheduling) nor cancels the student's other applications.
        const created = await tx.enrollment.create({
          data: {
            ...enrollmentData,
            assessments: {
              create: {
                status: 'requested',
                arrangement,
                preferredDate: preferredDateValue,
                preferredTimeBand: preferredTimeBand || null,
              },
            },
          },
        })
        await coverApplication(tx, created.id, covering.id)
        return created
      })
      if (covered === 'live') {
        return createErrorResponse('You already have an application for this course in progress', 400)
      }
      if (covered) {
        try {
          // Greet by the STORED name, never the request body: this email goes to whatever address was typed in.
          await sendApplicationFeeCovered({ firstName: student.firstName, email: normalizedEmail, courseName: course.title })
        } catch (emailError) {
          console.error('Failed to send fee-covered email:', emailError)
        }
        return createResponse(
          {
            enrollment: {
              id: covered.id,
              status: 'assessment_paid',
              course: { title: course.title, instructor: course.instructor?.name, sessionStartDate: course.sessionStartDate },
            },
            feeCovered: true,
            applicationFee: { amount: 0 },
          },
          201,
        )
      }
    }

    let assessmentFee: number
    try {
      assessmentFee = await getAssessmentFee(prisma, offering.locationId)
    } catch (e) {
      if (e instanceof AssessmentFeeError) return createErrorResponse(e.message, 400)
      throw e
    }

    if (assessmentFee <= 0) {
      return createErrorResponse('The assessment fee for this location is not set. Please contact us to apply.', 400)
    }

    const enrollment = await prisma.enrollment.create({ data: enrollmentData })

    const applicationFeeData = { amount: assessmentFee, currency: ASSESSMENT_FEE_CURRENCY }

    // Generate unique receipt number for application payment
    const receiptNumber = `APP-${Date.now()}-${enrollment.id.slice(-6)}`

    // Create application payment record
    const applicationPayment = await prisma.applicationPayment.create({
      data: {
        enrollmentId: enrollment.id,
        amount: applicationFeeData.amount,
        currency: applicationFeeData.currency,
        paymentMethod: 'pending', // Will be updated after payment
        paystackReference: generatePaymentReference('app_fee'),
        receiptNumber,
        billingEmail: email,
        billingName: `${firstName} ${lastName}`,
        billingAddress,
        billingCity,
        billingState,
        status: 'pending',
      },
    })

    // Update enrollment with calculated application fee
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        applicationFeeAmount: applicationFeeData.amount,
      },
    })

    // Initialize Paystack payment
    const paymentData = createApplicationFeePayment({
      email,
      firstName,
      lastName,
      enrollmentId: enrollment.id,
      courseId,
      applicationFee: applicationFeeData.amount,
    })

    // Override the reference to use the one we created
    paymentData.reference = applicationPayment.paystackReference!

    const paystackResponse = await initializePayment(paymentData)

    if (!paystackResponse.status) {
      // If payment initialization fails, clean up the records
      await prisma.applicationPayment.delete({ where: { id: applicationPayment.id } })
      await prisma.enrollment.delete({ where: { id: enrollment.id } })

      return createErrorResponse('Failed to initialize payment. Please try again.', 500)
    }

    // The new application is live: retire the superseded unpaid ones (compare-and-set on `pending`).
    if (staleApplications.length > 0) {
      await prisma.enrollment.updateMany({
        where: { id: { in: staleApplications.map((e) => e.id) }, status: 'pending' },
        data: { status: 'cancelled' },
      })
    }

    // Update application payment with Paystack access code
    await prisma.applicationPayment.update({
      where: { id: applicationPayment.id },
      data: {
        paystackStatus: 'pending',
      },
    })

    // Best-effort "application received" acknowledgement to the student. Sent only
    // after payment has been successfully initialized, so it references a real,
    // resumable application. Transactional and guarded — a mail failure must not
    // fail the enrollment or delay the redirect to Paystack.
    try {
      await sendEnrollmentConfirmation({
        firstName,
        lastName,
        email,
        courseName: course.title,
        enrollmentId: enrollment.id,
        applicationFee: applicationFeeData.amount,
      })
    } catch (emailError) {
      console.error('Failed to send enrollment acknowledgement email:', emailError)
    }

    // Return enrollment details with payment URL
    return createResponse({
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        course: {
          title: course.title,
          instructor: course.instructor?.name,
          sessionStartDate: course.sessionStartDate,
        },
        applicationFee: {
          amount: applicationFeeData.amount,
          receiptNumber,
        },
      },
      payment: {
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        reference: paystackResponse.data.reference,
      },
    }, 201)

  } catch (error) {
    console.error('Enrollment creation error:', error)
    return createErrorResponse('Failed to create enrollment', 500)
  }
}

// GET /api/enrollments - admin list of enrollments (with optional filters). Admin-only: it returns
// student PII and assessment results (D5 partly closed here; this used to be unauthenticated).
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10') || 10, 1), 200)
    const status = url.searchParams.get('status')
    const courseId = url.searchParams.get('courseId')
    const email = url.searchParams.get('email')

    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status
    if (courseId) where.courseId = courseId
    if (email) where.student = { email: { contains: email, mode: 'insensitive' } }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          location: { select: { id: true, name: true } },
          offering: { select: { id: true, deliveryMode: { select: { name: true } } } },
          assessments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, status: true, arrangement: true, preferredDate: true, preferredTimeBand: true, scheduledAt: true, resultLevel: true },
          },
          student: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, dateOfBirth: true, address: true },
          },
          course: {
            select: {
              title: true,
              instrument: true,
              level: true,
              location: true,
              sessionStartDate: true,
              pricing: true,
              instructor: {
                select: {
                  name: true,
                },
              },
            },
          },
          applicationPayments: {
            select: {
              id: true,
              refundedAt: true,
              amount: true,
              status: true,
              receiptNumber: true,
              paidAt: true,
            },
          },
          tuitionPayments: {
            select: {
              amount: true,
              status: true,
              receiptNumber: true,
              paidAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ])

    return createResponse({
      enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error('Get enrollments error:', error)
    return createErrorResponse('Failed to fetch enrollments', 500)
  }
})
