"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"

interface CuratedPicksProps {
  curatedPicks: {
    id: number
    title: string
    courses: number[]
    badge: string
  }[]
  courseData: any[]
}

export function CuratedPicks({ curatedPicks, courseData }: CuratedPicksProps) {
  return (
    <div className="space-y-8">
      {/* Curated Course Collections */}
      {curatedPicks.map((pick) => (
        <Card key={pick.id} className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-bold text-lg text-slate-900">{pick.title}</h3>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-semibold px-3 py-1 rounded-full">
                {pick.badge}
              </Badge>
            </div>
            <div className="space-y-4">
              {pick.courses.map((courseId) => {
                const course = courseData.find((c) => c.id === courseId)
                if (!course) return null

                return (
                  <div
                    key={courseId}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      <course.icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate mb-1">
                        {course.title}
                      </div>
                      <div className="text-xs text-slate-500 mb-1">{course.instructor}</div>
                      <div className="text-sm font-bold text-amber-600">
                        ₦{course.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Promotion Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 rounded-3xl overflow-hidden shadow-lg">
        <CardContent className="p-6 lg:p-8 text-center">
          <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-heading font-bold text-xl text-slate-900 mb-3">New Year Special</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Get 20% off on all courses. Limited time offer! Start your musical journey with our expert instructors.
          </p>
          <Button
            size="lg"
            className="w-full bg-slate-900 hover:bg-amber-500 text-white rounded-full h-12 font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Learn More
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6 lg:p-8">
          <h3 className="font-heading font-bold text-lg text-slate-900 mb-6">Platform Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Total Students</span>
              <span className="font-bold text-xl text-slate-900">1,200+</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Courses Available</span>
              <span className="font-bold text-xl text-slate-900">25+</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Expert Instructors</span>
              <span className="font-bold text-xl text-slate-900">15+</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-600 font-medium">Success Rate</span>
              <span className="font-bold text-xl text-amber-600">95%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}