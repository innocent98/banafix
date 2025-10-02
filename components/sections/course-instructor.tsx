"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, Star, Award, Calendar, MessageCircle, Clock } from "lucide-react"
import Link from "next/link"

interface CourseInstructorProps {
  instructor: {
    name: string
    avatar: string
    bio: string
    credentials: string[]
    rating: number
    experience: string
    verified: boolean
    availability: string
  }
}

export function CourseInstructor({ instructor }: CourseInstructorProps) {
  return (
    <div className="space-y-8">
      {/* Main Instructor Card */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Instructor Avatar */}
            <div className="relative">
              <Avatar className="w-24 h-24 lg:w-32 lg:h-32 border-4 border-white shadow-lg">
                <AvatarImage src={instructor.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl font-bold bg-amber-100 text-amber-800">
                  {instructor.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {instructor.verified && (
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            {/* Instructor Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900">
                      {instructor.name}
                    </h3>
                    {instructor.verified && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-semibold px-3 py-1 rounded-full">
                        Verified Expert
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-500 fill-current" />
                      <span className="font-bold text-lg text-slate-900">{instructor.rating}</span>
                      <span className="text-slate-500">rating</span>
                    </div>
                    <div className="text-slate-600 font-medium">
                      {instructor.experience} experience
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                  {/* <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-full px-6 py-2 font-semibold"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button> */}
                  <Link href={'/instructors/1'}>
                    <Button className="bg-slate-900 hover:bg-amber-500 text-white rounded-full px-6 py-2 font-semibold">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed mb-6 text-lg">{instructor.bio}</p>

              {/* Availability */}
              <div className="p-4 bg-slate-50 rounded-2xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-slate-600" />
                  <span className="font-semibold text-slate-900">Availability</span>
                </div>
                <p className="text-slate-600 font-medium">{instructor.availability}</p>
              </div>

              {/* Credentials */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <Award className="h-5 w-5 text-amber-500 mr-2" />
                  Qualifications & Achievements
                </h4>
                <div className="flex flex-wrap gap-3">
                  {instructor.credentials.map((credential, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-amber-50 border-amber-200 text-amber-800 px-4 py-2 rounded-full font-medium"
                    >
                      <Award className="h-3 w-3 mr-2" />
                      {credential}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teaching Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">500+</div>
            <div className="text-slate-600 font-medium">Students Taught</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">4.9</div>
            <div className="text-slate-600 font-medium">Average Rating</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">15+</div>
            <div className="text-slate-600 font-medium">Years Experience</div>
          </CardContent>
        </Card>
      </div>

      {/* Teaching Philosophy */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6 lg:p-8">
          <h4 className="text-xl font-heading font-bold text-slate-900 mb-4">Teaching Philosophy</h4>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed text-lg mb-4">
              "I believe every student has unique musical potential waiting to be unlocked. My approach combines
              traditional techniques with modern methods, ensuring each lesson is both educational and enjoyable."
            </p>
            <p className="text-slate-600 leading-relaxed text-lg">
              "Whether you're picking up an instrument for the first time or looking to refine your skills,
              I'm here to guide you on your musical journey with patience, expertise, and passion."
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Student Testimonials Preview */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="p-6 lg:p-8">
          <h4 className="text-xl font-heading font-bold text-slate-900 mb-6">What Students Say</h4>
          <div className="grid gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 text-amber-500 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-3">
                "John's teaching style is incredible. He makes complex concepts easy to understand and keeps
                lessons engaging. I went from complete beginner to playing my first song in just 4 weeks!"
              </p>
              <div className="font-semibold text-slate-900">- Sarah M., Beginner Guitar Student</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 text-amber-500 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-3">
                "Patient, knowledgeable, and genuinely cares about his students' progress. The best investment
                I've made in my musical journey."
              </p>
              <div className="font-semibold text-slate-900">- Michael T., Intermediate Student</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}