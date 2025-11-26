"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Award, Users, MapPin, Calendar, Clock, MessageCircle } from "lucide-react"

interface InstructorCardProps {
  instructor: {
    id: string | number
    name: string
    avatar: string | null
    specialties: string[]
    experience: string
    rating: number
    students: number
    location: string
    bio: string | null
    courses: number
    availability: string | null
    hourlyRate: number
    verified: boolean
  }
}

export function InstructorCard({ instructor }: InstructorCardProps) {
  return (
    <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 shadow-lg rounded-3xl bg-white overflow-hidden">
      <CardContent className="p-0">
        {/* Header with Avatar and Verification */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 border-3 border-white shadow-lg">
                <AvatarImage src={instructor.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                  {instructor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {instructor.verified && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Award className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors mb-1 truncate">
                {instructor.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center bg-amber-100 px-2 py-1 rounded-full">
                  <Star className="h-3 w-3 text-amber-500 fill-current" />
                  <span className="text-sm font-semibold text-amber-700 ml-1">{instructor.rating}</span>
                </div>
                <span className="text-sm text-slate-500">({instructor.students} students)</span>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1">
                {instructor.specialties.slice(0, 2).map((specialty) => (
                  <Badge
                    key={specialty}
                    variant="secondary"
                    className="text-xs bg-white/60 text-slate-700 border-slate-200 hover:bg-white/80"
                  >
                    {specialty}
                  </Badge>
                ))}
                {instructor.specialties.length > 2 && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    +{instructor.specialties.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Bio */}
          <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {instructor.bio || "No biography available."}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Experience</div>
                <div className="font-semibold text-slate-700 text-sm">{instructor.experience}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <MapPin className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Location</div>
                <div className="font-semibold text-slate-700 text-sm">{instructor.location}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <Users className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Courses</div>
                <div className="font-semibold text-slate-700 text-sm">{instructor.courses} active</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <Clock className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Available</div>
                <div className="font-semibold text-slate-700 text-sm">{instructor.availability || "TBA"}</div>
              </div>
            </div>
          </div>

          {/* Price and Actions */}
          <div className="flex items-center justify-between mb-4">
            {/* <div className="text-left">
              <div className="text-xs text-slate-500">From</div>
              <div className="font-bold text-lg text-blue-600">₦{instructor.hourlyRate.toLocaleString()}</div>
              <div className="text-xs text-slate-500">per hour</div>
            </div> */}

            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 border-green-200 px-3 py-1"
            >
              Available
            </Badge>
          </div>

          {/* Action Buttons */}
          {/* <div className="flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-700 rounded-xl"
            >
              <a href={`/instructors/${instructor.id}`}>View Profile</a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3 border-slate-200 hover:bg-slate-50 rounded-xl"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div> */}
        </div>
      </CardContent>
    </Card>
  )
}