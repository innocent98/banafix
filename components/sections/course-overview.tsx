"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Play, Target, BookOpen } from "lucide-react"

interface CourseOverviewProps {
  courseDetails: {
    image: string
    title: string
    outcomes: string[]
    equipment: string[]
  }
}

export function CourseOverview({ courseDetails }: CourseOverviewProps) {
  return (
    <div className="space-y-8">
      {/* Course Image */}
      <div className="relative aspect-video bg-slate-100 rounded-3xl overflow-hidden shadow-lg">
        <img
          src={courseDetails.image || "/placeholder.svg"}
          alt={courseDetails.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            className="w-20 h-20 rounded-full bg-white/90 hover:bg-white text-slate-900 hover:text-slate-900 shadow-2xl backdrop-blur-sm transform hover:scale-110 transition-all duration-300"
          >
            <Play className="h-8 w-8 ml-1" />
          </Button>
        </div>

        {/* Course Preview Label */}
        <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <p className="text-sm font-semibold text-slate-900">Course Preview</p>
        </div>
      </div>

      {/* Learning Outcomes */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl font-heading font-bold text-slate-900">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mr-4">
              <Target className="h-6 w-6 text-amber-600" />
            </div>
            What You'll Learn
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4">
            {courseDetails.outcomes.map((outcome, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-slate-700 font-medium leading-relaxed">{outcome}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Needed */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl font-heading font-bold text-slate-900">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            Equipment & Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {courseDetails.equipment.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-slate-700 font-medium">{item}</span>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <h4 className="font-semibold text-blue-900 mb-2">Don't have equipment?</h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              No worries! We offer instrument rental services and starter kits for beginners.
              Contact our support team to learn more about equipment options.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sample Lesson Preview */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
        <CardHeader>
          <CardTitle className="text-xl font-heading font-bold text-slate-900">
            Sample Lesson Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-white ml-1" />
              </div>
              <p className="text-slate-600 font-medium mb-4">Preview: Your First Guitar Lesson</p>
              <Button
                variant="outline"
                className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 rounded-full px-6 py-2 font-semibold"
              >
                <Play className="h-4 w-4 mr-2" />
                Watch Preview (3:45)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}