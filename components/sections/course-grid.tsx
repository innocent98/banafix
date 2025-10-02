"use client"

import { CourseCard } from "./course-card"
import { Filter } from "lucide-react"

interface CourseGridProps {
  courses: any[]
}

export function CourseGrid({ courses }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Filter className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-2xl font-heading font-bold text-slate-900 mb-4">No courses found</h3>
        <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed">
          Try adjusting your filters or search terms to discover more courses that match your interests.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
      {courses.map((course, index) => (
        <div
          key={course.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CourseCard course={course} />
        </div>
      ))}
    </div>
  )
}