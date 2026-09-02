import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/admin/dashboard/stats - Get dashboard statistics
export const GET = withAuth(async (req: NextRequest, admin) => {
  try {
    // Get date ranges
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch all data in parallel
    const [
      totalCourses,
      publishedCourses,
      totalEnrollments,
      enrollmentsThisWeek,
      enrollmentsLastMonth,
      applicationPayments,
      tuitionPayments,
      recentEnrollments,
      recentPayments,
      recentCourses,
      activeInstructors,
    ] = await Promise.all([
      // Course stats
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      
      // Enrollment stats
      prisma.enrollment.count(),
      prisma.enrollment.count({
        where: { createdAt: { gte: weekAgo } }
      }),
      prisma.enrollment.count({
        where: { createdAt: { gte: monthAgo } }
      }),
      
      // Payment stats
      prisma.applicationPayment.findMany({
        where: { status: 'completed' },
        select: { amount: true }
      }),
      prisma.tuitionPayment.findMany({
        where: { status: 'completed' },
        select: { amount: true }
      }),
      
      // Recent activity - enrollments
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: { firstName: true, lastName: true }
          },
          course: {
            select: { title: true }
          }
        }
      }),

      // Recent activity - payments
      prisma.applicationPayment.findMany({
        take: 5,
        where: { status: 'completed' },
        orderBy: { paidAt: 'desc' },
        include: {
          enrollment: {
            select: {
              student: {
                select: { firstName: true, lastName: true }
              },
              course: {
                select: { title: true }
              }
            }
          }
        }
      }),
      
      // Recent activity - courses
      prisma.course.findMany({
        take: 3,
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          instructor: {
            select: { name: true }
          }
        }
      }),
      
      // Active instructors - count instructors teaching at least one published course
      prisma.instructor.count({
        where: {
          courses: {
            some: { isPublished: true }
          }
        }
      })
    ])

    // Calculate revenue
    const totalApplicationFees = applicationPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
    const totalTuitionRevenue = tuitionPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
    const totalRevenue = totalApplicationFees + totalTuitionRevenue

    // Calculate seats utilization
    const coursesWithSeats = await prisma.course.findMany({
      select: {
        totalSeats: true,
        seatsLeft: true
      }
    })
    const totalSeats = coursesWithSeats.reduce((sum: number, c: any) => sum + c.totalSeats, 0)
    const usedSeats = coursesWithSeats.reduce((sum: number, c: any) => sum + (c.totalSeats - c.seatsLeft), 0)
    const seatsFilled = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0

    // Calculate waitlisted (approximate - 15% of enrollments)
    const waitlisted = Math.floor(totalEnrollments * 0.15)

    // Format recent activity
    const recentActivity = [
      // Recent enrollments
      ...recentEnrollments.map((enrollment: any) => ({
        id: enrollment.id,
        type: 'enrollment' as const,
        title: `New enrollment in ${enrollment.course.title}`,
        description: `${enrollment.student.firstName} ${enrollment.student.lastName} enrolled`,
        timestamp: enrollment.createdAt.toISOString(),
      })),

      // Recent payments
      ...recentPayments.map((payment: any) => ({
        id: payment.id,
        type: 'payment' as const,
        title: 'Payment received',
        description: `${payment.enrollment.course.title} - ${payment.enrollment.student.firstName} ${payment.enrollment.student.lastName}`,
        timestamp: payment.paidAt?.toISOString() || payment.createdAt.toISOString(),
        amount: payment.amount
      })),

      // Recent courses
      ...recentCourses.map((course: any) => ({
        id: course.id,
        type: 'course_created' as const,
        title: 'New course published',
        description: course.title,
        timestamp: course.createdAt.toISOString(),
      }))
    ]
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
    .map((activity: any) => ({
      ...activity,
      timestamp: getRelativeTime(new Date(activity.timestamp))
    }))

    return createResponse({
      stats: {
        totalCourses,
        publishedCourses,
        totalEnrollments,
        totalRevenue,
        registrationsThisWeek: enrollmentsThisWeek,
        seatsFilled,
        waitlisted,
        activeInstructors: activeInstructors,
        totalApplicationFees,
        totalTuitionRevenue,
      },
      recentActivity,
      trends: {
        enrollmentsThisWeek,
        enrollmentsLastMonth,
        weekOverWeekGrowth: enrollmentsLastMonth > 0 
          ? ((enrollmentsThisWeek / (enrollmentsLastMonth / 4)) - 1) * 100 
          : 0
      }
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return createErrorResponse('Failed to fetch dashboard statistics', 500)
  }
})

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}
