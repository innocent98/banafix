import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { calculateApplicationFee } from '@/lib/application-fee'
import { logAdminAction } from '@/lib/audit'

// POST /api/admin/enrollments - admin registers a student directly (walk-in).
// Captures the same info as the public enrollment form, and can mark the
// application fee paid in cash at registration (self-service uses Paystack).
export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const data = await req.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      guardianName,
      guardianPhone,
      guardianEmail,
      address,
      landmark,
      courseId,
      selectedMode,
      priorLevel,
      schedulePreference,
      preferredDays,
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

    if (!firstName || !lastName || !email || !courseId || !selectedMode) {
      return createErrorResponse('Required fields missing: firstName, lastName, email, courseId, selectedMode', 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return createErrorResponse('Invalid email format', 400)
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return createErrorResponse('Course not found', 404)
    if (!course.availableModes.includes(selectedMode)) {
      return createErrorResponse('Selected delivery mode is not available for this course', 400)
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Find-or-create the person. On an admin walk-in the admin is the authoritative
    // source, so provided fields refresh the stored record.
    const student = await prisma.student.upsert({
      where: { email: normalizedEmail },
      update: {
        firstName, lastName,
        phone: phone ?? undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address: address ?? undefined,
        landmark: landmark ?? undefined,
        guardianName: guardianName ?? undefined,
        guardianPhone: guardianPhone ?? undefined,
        guardianEmail: guardianEmail ?? undefined,
      },
      create: {
        email: normalizedEmail,
        firstName, lastName,
        phone, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address, landmark, guardianName, guardianPhone, guardianEmail,
      },
    })

    // Already enrolled in this course? Block. Clear any stale pending first.
    const existingEnrolled = await prisma.enrollment.findFirst({
      where: { studentId: student.id, courseId, status: 'enrolled' },
    })
    if (existingEnrolled) {
      return createErrorResponse('This student is already enrolled in this course', 400)
    }
    await prisma.enrollment.deleteMany({ where: { studentId: student.id, courseId, status: 'pending' } })

    const fee = calculateApplicationFee(course.location)

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId,
        selectedMode,
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
        applicationFeeAmount: fee.amount,
        applicationPaid: Boolean(feePaid),
        status: feePaid ? 'enrolled' : 'pending',
      },
    })

    // Record the cash application-fee payment when marked paid.
    if (feePaid) {
      await prisma.applicationPayment.create({
        data: {
          enrollmentId: enrollment.id,
          amount: fee.amount,
          currency: fee.currency,
          paymentMethod: paymentMethod || 'cash',
          paystackStatus: 'success',
          status: 'completed',
          paidAt: new Date(),
          receiptNumber: `APP-${Date.now()}-${enrollment.id.slice(-6)}`,
          billingEmail: normalizedEmail,
          billingName: `${firstName} ${lastName}`,
        },
      })
    }

    await logAdminAction({
      adminId: admin.id,
      action: 'enrollment.admin_create',
      entityType: 'enrollment',
      entityId: enrollment.id,
      metadata: { courseId, feePaid: Boolean(feePaid), paymentMethod: feePaid ? paymentMethod : null },
    })

    return createResponse({ enrollment, message: 'Student registered' }, 201)
  } catch (error: any) {
    console.error('Admin register student error:', error)
    return createErrorResponse('Failed to register student', 500)
  }
})
