"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Calendar, MapPin, Languages, Clock, Users, Star, Award, Phone } from "lucide-react"

interface InstructorSidebarProps {
  instructor: {
    hourlyRate: number
    location: string
    languages: string[]
    students: number
    courses: any[]
    experience: string
    contact?: {
      phone: string
      email: string
    }
  }
}

export function InstructorSidebar({ instructor }: InstructorSidebarProps) {
  return (
    <div className="sticky top-8 space-y-6">
      {/* Contact & Booking Card */}
      <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
        <CardContent className="p-8">
          {/* Pricing */}
          <div className="text-center mb-8">
            <div className="relative">
              <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-2">
                ₦{instructor.hourlyRate.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 font-medium">per hour</div>
              <div className="absolute -top-2 -right-4 w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-20 blur-sm"></div>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-200 mt-2">
              Available Now
            </Badge>
          </div>

          {/* Action Buttons */}
          {/* <div className="space-y-3 mb-8">
            <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl font-semibold shadow-lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Send Message
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-blue-200 hover:bg-blue-50 rounded-2xl font-semibold"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book Trial Session
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-slate-200 hover:bg-slate-50 rounded-2xl font-semibold"
            >
              <Phone className="h-5 w-5 mr-2" />
              Request Call Back
            </Button>
          </div> */}

          {/* Contact Info */}
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-white/80">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700 font-medium">{instructor.location}</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-white/80">
              <Languages className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700 font-medium">{instructor.languages.join(", ")}</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-white/80">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700 font-medium">Usually responds within 2 hours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card className="border-0 shadow-lg rounded-3xl bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Total Students</span>
            </div>
            <span className="font-bold text-slate-900">{instructor.students}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Active Courses</span>
            </div>
            <span className="font-bold text-slate-900">{instructor.courses.length}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Experience</span>
            </div>
            <span className="font-bold text-slate-900">{instructor.experience}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Response Rate</span>
            </div>
            <span className="font-bold text-green-600">98%</span>
          </div>
        </CardContent>
      </Card>

      {/* Trust & Safety Card */}
      <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-green-900 mb-2">Verified Instructor</h3>
            <p className="text-sm text-green-700 leading-relaxed">
              Background checked, credentials verified, and approved by our team.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Identity verified
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Credentials checked
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Student safety trained
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guarantee Card */}
      <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-white fill-current" />
            </div>
            <h3 className="font-semibold text-amber-900 mb-2">100% Satisfaction</h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              Not happy with your first lesson? Get a full refund, no questions asked.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}