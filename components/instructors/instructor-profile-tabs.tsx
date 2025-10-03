"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Award, CheckCircle, Clock, Users, Calendar } from "lucide-react"

interface Course {
  id: number
  title: string
  level: string
  students: number
  rating: number
  price: number
  duration: string
}

interface Review {
  id: number
  student: string
  rating: number
  date: string
  comment: string
  course: string
}

interface InstructorProfileTabsProps {
  instructor: {
    name: string
    bio: string
    teachingStyle: string
    credentials: string[]
    achievements: string[]
    courses: Course[]
    availability: {
      schedule: string
      timeSlots: string[]
      timezone: string
    }
  }
  reviews: Review[]
}

export function InstructorProfileTabs({ instructor, reviews }: InstructorProfileTabsProps) {
  return (
    <Tabs defaultValue="about" className="w-full">
      {/* Tab Navigation */}
      <TabsList className="grid w-full grid-cols-4 h-14 p-1 bg-slate-100/70 rounded-3xl border-0 shadow-inner">
        <TabsTrigger
          value="about"
          className="rounded-2xl font-semibold data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-200"
        >
          About
        </TabsTrigger>
        <TabsTrigger
          value="courses"
          className="rounded-2xl font-semibold data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-200"
        >
          Courses
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="rounded-2xl font-semibold data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-200"
        >
          Reviews
        </TabsTrigger>
        <TabsTrigger
          value="schedule"
          className="rounded-2xl font-semibold data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-200"
        >
          Schedule
        </TabsTrigger>
      </TabsList>

      {/* About Tab */}
      <TabsContent value="about" className="space-y-8 mt-8">
        {/* Bio Section */}
        <Card className="border-0 shadow-lg rounded-3xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-heading">About {instructor.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed text-base">{instructor.bio}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Teaching Philosophy
              </h4>
              <p className="text-slate-700 leading-relaxed">{instructor.teachingStyle}</p>
            </div>
          </CardContent>
        </Card>

        {/* Credentials & Achievements */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Credentials */}
          <Card className="border-0 shadow-lg rounded-3xl bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                Credentials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {instructor.credentials.map((credential, index) => (
                  <li key={index} className="flex items-start gap-3 group">
                    <div className="p-1 bg-green-100 rounded-full mt-0.5 group-hover:bg-green-200 transition-colors">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-slate-700 text-sm leading-relaxed flex-1">{credential}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-0 shadow-lg rounded-3xl bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {instructor.achievements.map((achievement, index) => (
                  <li key={index} className="flex items-start gap-3 group">
                    <div className="p-1 bg-amber-100 rounded-full mt-0.5 group-hover:bg-amber-200 transition-colors">
                      <Star className="h-3 w-3 text-amber-600 fill-current" />
                    </div>
                    <span className="text-slate-700 text-sm leading-relaxed flex-1">{achievement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Courses Tab */}
      <TabsContent value="courses" className="space-y-6 mt-8">
        {instructor.courses.map((course, index) => (
          <Card key={course.id} className="border-0 shadow-lg rounded-3xl bg-white hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-purple-500' : 'bg-green-500'
                    }`}></div>
                    <h3 className="font-heading font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 border-2 ${
                        course.level === 'Beginner' ? 'border-green-200 text-green-700 bg-green-50' :
                        course.level === 'Intermediate' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                        'border-purple-200 text-purple-700 bg-purple-50'
                      }`}
                    >
                      {course.level}
                    </Badge>

                    <div className="flex items-center gap-1 text-slate-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{course.duration}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-600">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">{course.students} students</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-amber-100 px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                      <span className="text-sm font-bold text-amber-700 ml-1">{course.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right lg:text-left lg:min-w-0">
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      ₦{course.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">Course fee</div>
                  </div>

                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl px-6"
                  >
                    <a href={`/courses/${course.id}`}>View Course</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* Reviews Tab */}
      <TabsContent value="reviews" className="space-y-6 mt-8">
        {reviews.map((review) => (
          <Card key={review.id} className="border-0 shadow-lg rounded-3xl bg-white">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold text-slate-900 text-lg">{review.student}</div>
                  <div className="text-sm text-slate-500 mt-1">{review.date}</div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? "text-amber-400 fill-current" : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-slate-700 leading-relaxed mb-4">{review.comment}</p>

              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {review.course}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* Schedule Tab */}
      <TabsContent value="schedule" className="space-y-8 mt-8">
        <Card className="border-0 shadow-lg rounded-3xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <h4 className="font-semibold text-slate-900 mb-3">Weekly Schedule</h4>
                <p className="text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {instructor.availability.schedule}
                </p>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-semibold text-slate-900 mb-3">Available Time Slots</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {instructor.availability.timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 text-center hover:shadow-md transition-shadow"
                    >
                      <Clock className="h-4 w-4 text-blue-600 mx-auto mb-2" />
                      <span className="font-medium text-slate-900">{slot}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1 bg-amber-200 rounded-full">
                  <Calendar className="h-4 w-4 text-amber-700" />
                </div>
                <h4 className="font-semibold text-amber-900">Timezone Information</h4>
              </div>
              <p className="text-amber-800">{instructor.availability.timezone}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}