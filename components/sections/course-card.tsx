"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Star, Calendar, Clock, MapPin } from "lucide-react"
import Link from "next/link"

interface CourseCardProps {
  course: {
    id: number
    title: string
    instrument: string
    level: string
    type: string
    duration: string
    price: number
    instructor: string
    rating: number
    students: number
    totalSeats: number
    seatsLeft: number
    location: string
    nextSessions: string[]
    image: string
    description: string
    icon: React.ComponentType<{ className?: string }>
  }
}

export function CourseCard({ course }: CourseCardProps) {
  const seatProgress = ((course.totalSeats - course.seatsLeft) / course.totalSeats) * 100

  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden bg-white rounded-3xl shadow-lg transform hover:scale-105 hover:-translate-y-2">
      {/* Course Image */}
      <div className="relative aspect-video bg-slate-100 rounded-t-3xl overflow-hidden">
        <img
          src={course.image || "/placeholder.svg"}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        {/* Level Badge */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-white/95 text-slate-900 backdrop-blur-sm text-sm font-semibold px-3 py-1.5 rounded-full shadow-lg">
            {course.level}
          </Badge>
        </div>

        {/* Course Icon */}
        <div className="absolute top-4 left-4 w-12 h-12 bg-amber-500/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
          <course.icon className="h-6 w-6 text-white" />
        </div>

        {/* Rating */}
        <div className="absolute bottom-4 right-4 flex items-center bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
          <Star className="h-4 w-4 text-amber-500 fill-current mr-1" />
          <span className="text-sm font-semibold text-slate-900">{course.rating}</span>
        </div>
      </div>

      <CardContent className="p-4 lg:p-4">
        {/* Course Title */}
        <div className="mb-4">
          <h3 className="font-heading font-bold text-xl lg:text-2xl text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
            {course.title}
          </h3>
          <p className="text-slate-500 font-medium">{course.description}</p>
        </div>

        {/* Course Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-slate-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center text-slate-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{'on-site'}</span>
            </div>
          </div>

          {/* <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Instructor:</span>
            <span className="font-semibold text-slate-900">{course.instructor}</span>
          </div> */}

          {/* <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Mode:</span>
            <span className="font-semibold text-slate-900">{course.type}</span>
          </div> */}
        </div>

        {/* Next Sessions */}
        <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center text-sm text-slate-600 mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-medium">Next Sessions:</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {course.nextSessions.slice(0, 2).join(", ")}
            {course.nextSessions.length > 2 && "..."}
          </div>
        </div>

        {/* Seat Availability */}
        {/* <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-slate-600 font-medium">Availability:</span>
            <span className="font-bold text-amber-600">
              {course.seatsLeft}/{course.totalSeats} seats left
            </span>
          </div>
          <Progress value={seatProgress} className="h-2 bg-slate-100" />
          <div className="text-xs text-slate-500 mt-2 text-center">
            {Math.round(((course.totalSeats - course.seatsLeft) / course.totalSeats) * 100)}% filled
          </div>
        </div> */}

        {/* Price and Actions */}
        <div className="flex items-center justify-between py-4 mb-6 border-t border-slate-100">
          <div>
            <div className="text-sm text-slate-500 mb-1 font-medium">Starting from</div>
            <div className="font-bold text-2xl text-slate-900">₦{course.price.toLocaleString()}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full h-12 font-semibold"
          >
            <Link href={`/courses/${course.id}`}>View Details</Link>
          </Button>
          {/* <Button
            className="flex-1 bg-slate-900 hover:bg-amber-500 text-white rounded-full h-12 font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
            asChild
          >
            <Link href={`/courses/${course.id}`}>Enroll Now</Link>
          </Button> */}
        </div>
      </CardContent>
    </Card>
  )
}