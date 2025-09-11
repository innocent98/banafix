"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Plus,
  Edit,
  Eye,
  AlertCircle,
  Calendar,
  Mail,
  MessageSquare,
  HelpCircle,
  Settings,
  BarChart3,
  Copy,
  Archive,
  Download,
  Send,
  UserPlus,
  UserMinus,
} from "lucide-react"

const adminStats = {
  registrationsThisWeek: 47,
  seatsFilled: 78.5,
  revenue: 2450000,
  waitlisted: 23,
}

const sessionsData = [
  {
    id: 1,
    course: "Guitar Fundamentals",
    sessionName: "GF-2024-01",
    startDate: "2024-01-15",
    endDate: "2024-04-15",
    capacity: 20,
    enrolled: 18,
    remaining: 2,
    status: "Open",
    waitlistCount: 5,
    instrument: "Guitar",
    level: "Beginner",
    mode: ["Online", "Home Training"],
  },
  {
    id: 2,
    course: "Piano Mastery Program",
    sessionName: "PMP-2024-01",
    startDate: "2024-01-20",
    endDate: "2024-05-20",
    capacity: 15,
    enrolled: 15,
    remaining: 0,
    status: "Full",
    waitlistCount: 8,
    instrument: "Piano",
    level: "Intermediate",
    mode: ["One-on-One"],
  },
  {
    id: 3,
    course: "Advanced Drums",
    sessionName: "AD-2024-02",
    startDate: "2024-02-01",
    endDate: "2024-05-01",
    capacity: 12,
    enrolled: 8,
    remaining: 4,
    status: "Open",
    waitlistCount: 2,
    instrument: "Drums",
    level: "Advanced",
    mode: ["Online", "One-on-One"],
  },
]

const waitlistData = [
  {
    id: 1,
    student: "Kemi Adebayo",
    email: "kemi@email.com",
    course: "Piano Mastery Program",
    sessionId: "PMP-2024-01",
    position: 1,
    joinDate: "2024-01-12",
    priority: "High",
  },
  {
    id: 2,
    student: "Tunde Okafor",
    email: "tunde@email.com",
    course: "Piano Mastery Program",
    sessionId: "PMP-2024-01",
    position: 2,
    joinDate: "2024-01-14",
    priority: "Normal",
  },
  {
    id: 3,
    student: "Amina Hassan",
    email: "amina@email.com",
    course: "Guitar Fundamentals",
    sessionId: "GF-2024-01",
    position: 1,
    joinDate: "2024-01-16",
    priority: "Normal",
  },
]

const courseData = [
  {
    id: 1,
    title: "Guitar Fundamentals",
    instrument: "Guitar",
    level: "Beginner",
    modes: ["Online", "Home Training"],
    price: 25000,
    status: "Active",
  },
  {
    id: 2,
    title: "Piano Mastery Program",
    instrument: "Piano",
    level: "Intermediate",
    modes: ["One-on-One"],
    price: 30000,
    status: "Active",
  },
  {
    id: 3,
    title: "Advanced Drums",
    instrument: "Drums",
    level: "Advanced",
    modes: ["Online", "One-on-One"],
    price: 35000,
    status: "Draft",
  },
]

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("overview")
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [editingCapacity, setEditingCapacity] = useState<number | null>(null)

  const sidebarSections = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "sessions", label: "Sessions", icon: Calendar },
    { id: "waitlists", label: "Capacity & Waitlists", icon: Users },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "emails", label: "Emails", icon: Mail },
    { id: "testimonials", label: "Testimonials", icon: MessageSquare },
    { id: "faqs", label: "FAQs", icon: HelpCircle },
    { id: "policies", label: "Policies", icon: BookOpen },
    { id: "settings", label: "Settings", icon: Settings },
  ]

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

  const handleCapacityEdit = (sessionId: number, newCapacity: number) => {
    // Update capacity logic here
    setEditingCapacity(null)
  }

  const toggleSessionStatus = (sessionId: number) => {
    // Toggle session open/close logic here
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="flex">
        <div className="w-64 bg-card border-r min-h-screen p-4">
          <div className="mb-6">
            <h2 className="text-lg font-heading font-semibold">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Manage platform</p>
          </div>

          <nav className="space-y-2">
            {sidebarSections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{section.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-heading font-bold">Overview</h1>
                <p className="text-muted-foreground">Platform performance and key metrics</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Registrations This Week</p>
                        <p className="text-2xl font-bold">{adminStats.registrationsThisWeek}</p>
                        <p className="text-xs text-green-600">+12% from last week</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Seats Filled %</p>
                        <p className="text-2xl font-bold">{adminStats.seatsFilled}%</p>
                        <p className="text-xs text-blue-600">156/200 total seats</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-2xl font-bold">₦{(adminStats.revenue / 1000000).toFixed(1)}M</p>
                        <p className="text-xs text-green-600">+8% this month</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Waitlisted</p>
                        <p className="text-2xl font-bold">{adminStats.waitlisted}</p>
                        <p className="text-xs text-orange-600">Across 5 courses</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts and Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Seats Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      Chart placeholder - Seats filled over the last 30 days
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          student: "Adunni Olatunji",
                          course: "Guitar Fundamentals",
                          amount: 25000,
                          date: "2024-01-10",
                        },
                        { student: "Emeka Nwankwo", course: "Piano Mastery", amount: 30000, date: "2024-01-09" },
                        { student: "Fatima Abdullahi", course: "Advanced Drums", amount: 35000, date: "2024-01-08" },
                      ].map((payment, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{payment.student}</p>
                            <p className="text-sm text-muted-foreground">{payment.course}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(payment.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === "courses" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-heading font-bold">Courses</h1>
                  <p className="text-muted-foreground">Manage course catalog and settings</p>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Instrument</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Mode(s)</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseData.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.instrument}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {course.modes.map((mode) => (
                              <Badge key={mode} variant="secondary" className="text-xs">
                                {mode}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(course.price)}</TableCell>
                        <TableCell>
                          <Badge variant={course.status === "Active" ? "default" : "secondary"}>{course.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeSection === "sessions" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-heading font-bold">Sessions</h1>
                <p className="text-muted-foreground">Manage session capacity and enrollment control</p>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Session ID/Name</TableHead>
                      <TableHead>Start–End</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Waitlist</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionsData.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.course}</TableCell>
                        <TableCell>{session.sessionName}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(session.startDate)}</div>
                            <div className="text-muted-foreground">{formatDate(session.endDate)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingCapacity === session.id ? (
                            <Input
                              type="number"
                              defaultValue={session.capacity}
                              className="w-16"
                              onBlur={(e) => handleCapacityEdit(session.id, Number.parseInt(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleCapacityEdit(session.id, Number.parseInt(e.currentTarget.value))
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => setEditingCapacity(session.id)}
                              className="hover:bg-muted px-2 py-1 rounded"
                            >
                              {session.capacity}
                            </button>
                          )}
                        </TableCell>
                        <TableCell>{session.enrolled}</TableCell>
                        <TableCell>{session.remaining}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                session.status === "Open"
                                  ? "default"
                                  : session.status === "Full"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {session.status}
                            </Badge>
                            <Switch
                              checked={session.status === "Open"}
                              onCheckedChange={() => toggleSessionStatus(session.id)}
                              size="sm"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{session.waitlistCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedSession(session)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Session Details: {session.sessionName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Roster ({session.enrolled} students)</h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                      {["Adunni Olatunji", "Emeka Nwankwo", "Fatima Abdullahi"].map(
                                        (student, index) => (
                                          <div key={index} className="flex items-center justify-between text-sm">
                                            <span>{student}</span>
                                            <Button size="sm" variant="ghost">
                                              <UserMinus className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Quick Actions</h4>
                                    <div className="space-y-2">
                                      <Button size="sm" variant="outline" className="w-full bg-transparent">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Manual Add
                                      </Button>
                                      <Button size="sm" variant="outline" className="w-full bg-transparent">
                                        <Send className="h-4 w-4 mr-2" />
                                        Email Cohort
                                      </Button>
                                      <Button size="sm" variant="outline" className="w-full bg-transparent">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Roster
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeSection === "waitlists" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-heading font-bold">Capacity & Waitlists</h1>
                <p className="text-muted-foreground">Manage waitlists and capacity across all sessions</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Waitlist Queue</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course/Session</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlistData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.student}</div>
                            <div className="text-sm text-muted-foreground">{item.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.course}</div>
                            <div className="text-sm text-muted-foreground">{item.sessionId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">#{item.position}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.joinDate)}</TableCell>
                        <TableCell>
                          <Badge variant={item.priority === "High" ? "destructive" : "secondary"}>
                            {item.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeSection === "payments" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-heading font-bold">Payments</h1>
                <p className="text-muted-foreground">Financial transactions and revenue tracking</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Payments management interface coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "emails" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-heading font-bold">Email Management</h1>
                <p className="text-muted-foreground">Manage email campaigns and notifications</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Email management interface coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "testimonials" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-heading font-bold">Testimonials</h1>
                <p className="text-muted-foreground">Manage student testimonials and reviews</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Testimonials management interface coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "faqs" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-heading font-bold">FAQs Management</h1>
                <p className="text-muted-foreground">Manage frequently asked questions</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">FAQs management interface coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "policies" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-heading font-bold">Policies Management</h1>
                <p className="text-muted-foreground">Manage platform policies and terms</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Policies management interface coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-heading font-bold">Platform Settings</h1>
                <p className="text-muted-foreground">Configure platform-wide settings</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Settings interface coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
