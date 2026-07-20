"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BookOpen,
  Plus,
  Eye,
  Edit,
  Copy,
  Search,
  Filter,
  Download,
  Users,
  DollarSign,
  TrendingUp} from "lucide-react"

interface Course {
  id: string
  title: string
  instrument: string
  level: string
  duration: string
  totalSeats: number
  seatsLeft: number
  unlimitedSeats: boolean
  isPublished: boolean
  isActive: boolean
  sessionStartDate?: string | null
  isExpired?: boolean
  expirationDate?: string | null
  isPubliclyVisible?: boolean
  computedStatus?: string
  instructor?: {
    name: string
    id: string
  }
  _count: {
    curriculum: number
    faqs: number
    enrollments: number
  }
  createdAt: string
  updatedAt: string
}

interface CourseStats {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  totalEnrollments: number
  totalRevenue: number
  averageSeatsUtilization: number
}

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [instrumentFilter, setInstrumentFilter] = useState("all")
  const [stats, setStats] = useState<CourseStats>({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    averageSeatsUtilization: 0
  })

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, statusFilter, instrumentFilter])

  const loadCourses = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }

      const response = await fetch("/api/admin/courses", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses)
        calculateStats(data.courses)
      } else {
        console.error("Failed to load courses")
      }
    } catch (error) {
      console.error("Failed to load courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (coursesData: Course[]) => {
    const publishedCount = coursesData.filter(c => c.isPublished).length
    const draftCount = coursesData.filter(c => !c.isPublished).length
    const totalEnrollments = coursesData.reduce((sum, c) => sum + c._count.enrollments, 0)
    const totalSeats = coursesData.reduce((sum, c) => sum + c.totalSeats, 0)
    const usedSeats = coursesData.reduce((sum, c) => sum + (c.totalSeats - c.seatsLeft), 0)

    setStats({
      totalCourses: coursesData.length,
      publishedCourses: publishedCount,
      draftCourses: draftCount,
      totalEnrollments,
      totalRevenue: totalEnrollments * 25000, // Approximate
      averageSeatsUtilization: totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0
    })
  }

  const filterCourses = () => {
    let filtered = courses

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(course => {
        switch (statusFilter) {
          case "published":
            return course.isPublished && course.isActive && !course.isExpired
          case "draft":
            return !course.isPublished
          case "inactive":
            return !course.isActive
          case "expired":
            return course.isExpired
          default:
            return true
        }
      })
    }

    // Instrument filter
    if (instrumentFilter !== "all") {
      filtered = filtered.filter(course => course.instrument === instrumentFilter)
    }

    setFilteredCourses(filtered)
  }

  const getUniqueInstruments = () => {
    const instruments = courses.map(course => course.instrument)
    return [...new Set(instruments)]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatExpirationInfo = (course: Course) => {
    if (!course.sessionStartDate) return null

    if (course.isExpired && course.expirationDate) {
      return `Expired on ${formatDate(course.expirationDate)}`
    }

    if (course.expirationDate) {
      return `Expires on ${formatDate(course.expirationDate)}`
    }

    return null
  }

  const handleAction = (action: string, courseId: string) => {
    switch (action) {
      case "view":
        window.open(`/courses/${courseId}`, '_blank')
        break
      case "edit":
        router.push(`/admin/courses/${courseId}/edit`)
        break
      case "duplicate":
        // TODO: Implement course duplication
        console.log("Duplicate course:", courseId)
        break
      case "archive":
        // TODO: Implement course archiving
        console.log("Archive course:", courseId)
        break
    }
  }

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Course Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your course catalog, track performance, and monitor enrollments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/admin/courses/bulk-import')}>
              <Download className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => router.push('/admin/courses/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-3xl font-bold">{stats.totalCourses}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.publishedCourses} published, {stats.draftCourses} drafts
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Enrollments</p>
                  <p className="text-3xl font-bold">{stats.totalEnrollments}</p>
                  <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Seats Utilization</p>
                  <p className="text-3xl font-bold">{stats.averageSeatsUtilization}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Average across all courses</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-3xl font-bold">₦{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-green-600 mt-1">+8% from last month</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses, instructors, or instruments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by instrument" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instruments</SelectItem>
                  {getUniqueInstruments().map(instrument => (
                    <SelectItem key={instrument} value={instrument}>
                      {instrument}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Courses ({filteredCourses.length})</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {courses.length === 0 ? "No courses yet" : "No courses match your filters"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {courses.length === 0
                    ? "Get started by creating your first course"
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
                {courses.length === 0 && (
                  <Button onClick={() => router.push('/admin/courses/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {course.instrument} • {course.level} • {course.duration}
                            </p>
                            {formatExpirationInfo(course) && (
                              <p className={`text-xs mt-1 ${course.isExpired ? 'text-orange-600' : 'text-slate-500'}`}>
                                {formatExpirationInfo(course)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {course.instructor?.name || "No instructor assigned"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={course.isPublished ? "default" : "secondary"}>
                              {course.isPublished ? "Published" : "Draft"}
                            </Badge>
                            {!course.isActive && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                            {course.isExpired && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Expired
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {course.unlimitedSeats ? (
                              <p className="text-sm font-medium text-green-600">
                                {course._count.enrollments} / Unlimited
                              </p>
                            ) : (
                              <>
                                <p className="text-sm font-medium">
                                  {course._count.enrollments}/{course.totalSeats}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {Math.round((course._count.enrollments / course.totalSeats) * 100)}% filled
                                </p>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">
                            {formatCurrency(course._count.enrollments * 25000)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(course.updatedAt)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction("view", course.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction("edit", course.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction("duplicate", course.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}