"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  AlertCircle,
  Calendar,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from "lucide-react"

interface DashboardStats {
  totalCourses: number
  publishedCourses: number
  totalEnrollments: number
  totalRevenue: number
  registrationsThisWeek: number
  seatsFilled: number
  waitlisted: number
  activeInstructors: number
}

interface RecentActivity {
  id: string
  type: "enrollment" | "course_created" | "payment" | "instructor_assigned"
  title: string
  description: string
  timestamp: string
  amount?: number
}

interface QuickStat {
  label: string
  value: string | number
  change: number
  trend: "up" | "down" | "neutral"
  icon: any
  color: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    registrationsThisWeek: 0,
    seatsFilled: 0,
    waitlisted: 0,
    activeInstructors: 0
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }

      const response = await fetch("/api/admin/dashboard/stats", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentActivity(data.recentActivity)
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const quickStats: QuickStat[] = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: 12.5,
      trend: "up",
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      label: "Active Students",
      value: stats.totalEnrollments,
      change: 8.2,
      trend: "up",
      icon: Users,
      color: "bg-blue-500"
    },
    {
      label: "Course Completion",
      value: `${stats.seatsFilled}%`,
      change: -2.1,
      trend: "down",
      icon: Target,
      color: "bg-orange-500"
    },
    {
      label: "New This Week",
      value: stats.registrationsThisWeek,
      change: 15.3,
      trend: "up",
      icon: TrendingUp,
      color: "bg-purple-500"
    }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your platform today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/admin/courses')}>
              <BookOpen className="h-4 w-4 mr-2" />
              View All Courses
            </Button>
            <Button onClick={() => router.push('/admin/courses/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight

            return (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        <TrendIcon className={`h-3 w-3 ${
                          stat.trend === "up" ? "text-green-600" : "text-red-600"
                        }`} />
                        <span className={`text-xs ${
                          stat.trend === "up" ? "text-green-600" : "text-red-600"
                        }`}>
                          {stat.change > 0 ? "+" : ""}{stat.change}%
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Courses</span>
                      <span className="font-semibold">{stats.totalCourses}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Published</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{stats.publishedCourses}</span>
                        <Badge variant="default" className="text-xs">Live</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Drafts</span>
                      <span className="font-semibold">{stats.totalCourses - stats.publishedCourses}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Enrollment Rate</span>
                      <span className="font-semibold">{stats.seatsFilled}%</span>
                    </div>
                    <Progress value={stats.seatsFilled} className="h-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Instructors</span>
                      <span className="font-semibold">{stats.activeInstructors}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Quick Actions</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push('/admin/courses')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View All
                      </Button>
                      <Button size="sm" onClick={() => router.push('/admin/courses/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Course
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enrollment Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Enrollment Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalEnrollments}</p>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{stats.registrationsThisWeek}</p>
                      <p className="text-sm text-muted-foreground">This Week</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{stats.waitlisted}</p>
                      <p className="text-sm text-muted-foreground">Waitlisted</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                      <div className="text-center">
                        <Activity className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Enrollment trends chart</p>
                        <p className="text-xs">Coming soon</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        {activity.amount && (
                          <p className="text-xs font-medium text-green-600 mt-1">
                            {formatCurrency(activity.amount)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" onClick={() => router.push('/admin/courses/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Course
                  </Button>
                  {/* <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/sessions')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Sessions
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/payments')}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    View Payments
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/settings')}>
                    <Clock className="h-4 w-4 mr-2" />
                    Platform Settings
                  </Button> */}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Platform Health</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Gateway</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Service</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}