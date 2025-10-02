"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Award, Users, Calendar, MapPin, Verified } from "lucide-react"

interface InstructorProfileHeaderProps {
  instructor: {
    id: number
    name: string
    avatar: string
    coverImage?: string
    specialties: string[]
    experience: string
    rating: number
    totalReviews: number
    students: number
    location: string
    verified: boolean
  }
}

export function InstructorProfileHeader({ instructor }: InstructorProfileHeaderProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background with Gradient Overlay */}
      <div className="absolute inset-0">
        <div className="aspect-[21/9] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {instructor.coverImage && (
            <img
              src={instructor.coverImage}
              alt={`${instructor.name} cover`}
              className="w-full h-full object-cover mix-blend-overlay opacity-30"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl transform translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-2xl transform -translate-x-32 translate-y-32"></div>

      {/* Content */}
      <div className="relative">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-8">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="relative">
                <Avatar className="w-32 h-32 lg:w-40 lg:h-40 border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-300">
                  <AvatarImage src={instructor.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-bold">
                    {instructor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                {/* Verification Badge */}
                {instructor.verified && (
                  <div className="absolute -top-2 -right-2 lg:-top-3 lg:-right-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-pulse">
                      <Verified className="h-5 w-5 lg:h-6 lg:w-6 text-white fill-current" />
                    </div>
                  </div>
                )}

                {/* Award Badge */}
                <div className="absolute -bottom-2 -right-2 lg:-bottom-3 lg:-right-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
                    <Award className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="text-white flex-1 space-y-4">
              <div>
                <h1 className="text-4xl lg:text-6xl font-heading font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  {instructor.name}
                </h1>
                <p className="text-lg lg:text-xl text-blue-100 font-medium">
                  Professional Music Instructor
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                {/* Rating */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
                  <Star className="h-5 w-5 text-amber-400 fill-current" />
                  <span className="font-bold text-lg">{instructor.rating}</span>
                  <span className="text-white/80 text-sm">({instructor.totalReviews} reviews)</span>
                </div>

                {/* Students */}
                <div className="flex items-center gap-2 text-white/90">
                  <Users className="h-4 w-4" />
                  <span className="font-semibold">{instructor.students}</span>
                  <span className="text-white/70">students taught</span>
                </div>

                {/* Experience */}
                <div className="flex items-center gap-2 text-white/90">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">{instructor.experience}</span>
                  <span className="text-white/70">experience</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold">{instructor.location}</span>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-2">
                {instructor.specialties.map((specialty, index) => (
                  <Badge
                    key={specialty}
                    variant="secondary"
                    className={`
                      px-4 py-2 text-sm font-medium border-0 shadow-lg
                      ${index === 0 ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' :
                        index === 1 ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                        'bg-white/20 text-white border border-white/30 backdrop-blur-sm'}
                    `}
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Effect */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-8 lg:h-12"
        >
          <path
            d="M0,60 C300,120 500,0 800,60 C1000,120 1200,0 1200,60 L1200,120 L0,120 Z"
            className="fill-white"
          ></path>
        </svg>
      </div>
    </section>
  )
}