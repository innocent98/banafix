"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  CreditCard,
  MessageCircle,
  Play,
  CheckCircle,
  TrendingUp,
  Award,
  Bell,
} from "lucide-react"

const mockUserData = {
  name: "Adunni Olatunji",
  email: "adunni.olatunji@email.com",
  avatar: "/student-avatar.jpg",
  joinDate: "March 2024",
  totalCourses: 2,
  completedLessons: 18,
  upcomingLessons: 3,
  achievements: 5,
}

const enrolledCourses = [
  {
    id: 1,
    title: "Guitar Fundamentals",
    instructor: "John Adebayo",
    progress: 75,
    totalLessons: 24,
    completedLessons: 18,
    nextLesson: "2024-01-15T14:00:00",
    status: "active",
    image: "/guitar-course.jpg",
  },
  {
    id: 2,
    title: "Music Theory Basics",
    instructor: "Sarah Okafor",
    progress: 40,
    totalLessons: 16,
    completedLessons: 6,
    nextLesson: "2024-01-17T16:00:00",
    status: "active",
    image: "/theory-course.jpg",
  },
]

const upcomingSessions = [
  {
    id: 1,
    course: "Guitar Fundamentals",
    instructor: "John Adebayo",
    date: "2024-01-15T14:00:00",
    duration: "1 hour",
    type: "One-on-One",
    location: "Online",
  },
  {
    id: 2,
    course: "Music Theory Basics",
    instructor: "Sarah Okafor",
    date: "2024-01-17T16:00:00",
    duration: "1 hour",
    type: "Group Session",
    location: "Lagos Studio",
  },
  {
    id: 3,
    course: "Guitar Fundamentals",
    instructor: "John Adebayo",
    date: "2024-01-20T14:00:00",
    duration: "1 hour",
    type: "One-on-One",
    location: "Online",
  },
]

const recentMessages = [
  {
    id: 1,
    from: "John Adebayo",
    subject: "Great progress on chord transitions!",
    preview: "I noticed significant improvement in your chord changes during our last session...",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    from: "Sarah Okafor",
    subject: "Music Theory Assignment",
    preview: "Please review the interval exercises we discussed and practice...",
    time: "1 day ago",
    unread: false,
  },
]

const paymentHistory = [
  {
    id: 1,
    course: "Guitar Fundamentals",
    amount: 25000,
    date: "2024-01-01",
    status: "paid",
    method: "Card",
  },
  {
    id: 2,
    course: "Music Theory Basics",
    amount: 18000,
    date: "2024-01-05",
    status: "paid",
    method: "Bank Transfer",
  },
]

const achievements = [
  { id: 1, title: "First Lesson Complete", icon: Play, earned: true },
  { id: 2, title: "Week 1 Champion", icon: Award, earned: true },
  { id: 3, title: "Practice Streak - 7 Days", icon: TrendingUp, earned: true },
  { id: 4, title: "Chord Master", icon: CheckCircle, earned: true },
  { id: 5, title: "Theory Explorer", icon: BookOpen, earned: false },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={mockUserData.avatar || "/placeholder.svg"} />
              <AvatarFallback>AO</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-heading font-bold">Welcome back, {mockUserData.name}!</h1>
              <p className="text-muted-foreground">Continue your musical journey</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{mockUserData.totalCourses}</div>
              <div className="text-sm text-muted-foreground">Active Courses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{mockUserData.completedLessons}</div>
              <div className="text-sm text-muted-foreground">Lessons Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{mockUserData.upcomingLessons}</div>
              <div className="text-sm text-muted-foreground">Upcoming Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{mockUserData.achievements}</div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Current Courses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    Current Courses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {enrolledCourses.map((course) => (
                    <div key={course.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <img
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{course.title}</h3>
                        <p className="text-xs text-muted-foreground">{course.instructor}</p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Continue
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Upcoming Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{session.course}</h3>
                        <p className="text-xs text-muted-foreground">{session.instructor}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(session.date)}
                        </div>
                      </div>
                      <Badge variant="outline">{session.type}</Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent" size="sm">
                    View All Sessions
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Messages & Achievements */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                    Recent Messages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{message.from}</span>
                        <span className="text-xs text-muted-foreground">{message.time}</span>
                      </div>
                      <h4 className="text-sm font-medium mb-1">{message.subject}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{message.preview}</p>
                      {message.unread && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-3">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="text-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                            achievement.earned ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <achievement.icon className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-medium">{achievement.title}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid gap-6">
              {enrolledCourses.map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <img
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                            <p className="text-muted-foreground">Instructor: {course.instructor}</p>
                          </div>
                          <Badge variant={course.status === "active" ? "default" : "secondary"}>{course.status}</Badge>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span>Course Progress</span>
                              <span>
                                {course.completedLessons}/{course.totalLessons} lessons
                              </span>
                            </div>
                            <Progress value={course.progress} className="h-3" />
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Next: {formatDate(course.nextLesson)}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button size="sm">Continue Learning</Button>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              Message Instructor
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{session.course}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{session.instructor}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(session.date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {session.duration}
                          </div>
                          <Badge variant="outline">{session.location}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Reschedule
                        </Button>
                        <Button size="sm">Join Session</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {message.from
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-semibold">{message.from}</span>
                            {message.unread && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{message.time}</span>
                      </div>
                      <h4 className="font-medium mb-2">{message.subject}</h4>
                      <p className="text-muted-foreground">{message.preview}</p>
                      <Button size="sm" variant="outline" className="mt-3 bg-transparent">
                        Reply
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-primary" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{payment.course}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString()} • {payment.method}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">₦{payment.amount.toLocaleString()}</div>
                        <Badge variant={payment.status === "paid" ? "default" : "secondary"}>{payment.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={mockUserData.avatar || "/placeholder.svg"} />
                    <AvatarFallback>AO</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button size="sm" variant="outline">
                      Change Photo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <input
                      type="text"
                      value={mockUserData.name}
                      className="w-full mt-1 p-2 border rounded-md"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email"
                      value={mockUserData.email}
                      className="w-full mt-1 p-2 border rounded-md"
                      readOnly
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button>Save Changes</Button>
                  <Button variant="outline">Change Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}
