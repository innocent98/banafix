import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { initializePayment, createApplicationFeePayment, generatePaymentReference } from '@/lib/paystack'
import { isCourseExpired } from '@/lib/course-utils'
import { calculateApplicationFee } from '@/lib/application-fee'

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

      // Address Information (for home training)
      address,
      landmark,

      // Course Selection
      courseId,
      selectedMode,

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
    if (!firstName || !lastName || !email || !courseId || !selectedMode) {
      return createErrorResponse('Required fields missing: firstName, lastName, email, courseId, selectedMode', 400)
    }

    if (!agreeToTerms || !agreeToRefundPolicy) {
      return createErrorResponse('You must agree to the terms and conditions and refund policy', 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400)
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

    // Check if course has available seats (skipped for unlimited-capacity courses)
    if (!course.unlimitedSeats && course.seatsLeft <= 0) {
      return createErrorResponse('Course is fully booked', 400)
    }

    // Check if selected mode is available for the course
    if (!course.availableModes.includes(selectedMode)) {
      return createErrorResponse('Selected delivery mode is not available for this course', 400)
    }

    // Block only if the student has already paid or is enrolled. A leftover
    // `pending` enrollment (e.g. an abandoned payment where the student closed the
    // Paystack tab, so no webhook fired) must NOT block a retry.
    const paidEnrollment = await prisma.enrollment.findFirst({
      where: {
        email,
        courseId,
        status: {
          in: ['application_paid', 'enrolled'],
        },
      },
    })

    if (paidEnrollment) {
      return createErrorResponse('You are already enrolled in this course', 400)
    }

    // Clear any stale, unpaid pending enrollment for this student+course so the
    // retry starts clean. onDelete: Cascade removes the associated payment rows.
    await prisma.enrollment.deleteMany({
      where: { email, courseId, status: 'pending' },
    })

    // Create enrollment record
    const enrollment = await prisma.enrollment.create({
      data: {
        courseId,
        email,
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        guardianName,
        guardianPhone,
        guardianEmail,
        address,
        landmark,
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
        status: 'pending',
      },
    })

    // Calculate application fee based on course location
    const applicationFeeData = calculateApplicationFee(course.location)

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

    // Update application payment with Paystack access code
    await prisma.applicationPayment.update({
      where: { id: applicationPayment.id },
      data: {
        paystackStatus: 'pending',
      },
    })

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

// GET /api/enrollments - Get enrollments (with optional filters)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')
    const courseId = url.searchParams.get('courseId')
    const email = url.searchParams.get('email')

    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status
    if (courseId) where.courseId = courseId
    if (email) where.email = { contains: email, mode: 'insensitive' }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          course: {
            select: {
              title: true,
              instrument: true,
              level: true,
              sessionStartDate: true,
              instructor: {
                select: {
                  name: true,
                },
              },
            },
          },
          applicationPayments: {
            select: {
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
}