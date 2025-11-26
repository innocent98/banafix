"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { InstructorFilters } from "@/components/instructors/instructor-filters"
import { InstructorCard } from "@/components/instructors/instructor-card"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Sparkles, TrendingUp, Target } from "lucide-react"

interface Instructor {
  id: string
  name: string
  avatar: string | null
  bio: string | null
  credentials: string[]
  rating: number
  experience: string
  availability: string | null
  verified: boolean
  course: {
    id: string
    title: string
    instrument: string
    level: string
    duration: string
    location: string
    image: string | null
  } | null
  specialties: string[]
  students: number
  location: string
  courses: number
  languages: string[]
  hourlyRate: number
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [sortBy, setSortBy] = useState("rating")

  useEffect(() => {
    loadInstructors()
  }, [])

  const loadInstructors = async () => {
    try {
      const response = await fetch('/api/instructors')

      if (response.ok) {
        const data = await response.json()
        setInstructors(data.instructors)
      } else {
        setError('Failed to load instructors')
      }
    } catch (err) {
      setError('Failed to load instructors')
      console.error('Error loading instructors:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredInstructors = instructors
    .filter((instructor) => {
      const matchesSearch =
        instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.specialties.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesSpecialty = selectedSpecialty === "all" || instructor.specialties.includes(selectedSpecialty)
      const matchesLocation = selectedLocation === "all" || instructor.location === selectedLocation

      return matchesSearch && matchesSpecialty && matchesLocation
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "experience":
          return Number.parseInt(b.experience) - Number.parseInt(a.experience)
        case "students":
          return b.students - a.students
        default:
          return 0
      }
    })

  // Calculate dynamic stats
  const totalInstructors = instructors.length
  const totalStudents = instructors.reduce((sum, instructor) => sum + instructor.students, 0)
  const averageRating = instructors.length > 0 ?
    (instructors.reduce((sum, instructor) => sum + instructor.rating, 0) / instructors.length).toFixed(1) :
    "0.0"
  const uniqueInstruments = new Set(instructors.flatMap(instructor => instructor.specialties)).size

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading instructors...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Unable to load instructors
            </h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={loadInstructors}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Navigation />

      {/* Enhanced Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl transform translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-2xl transform -translate-x-32 translate-y-32"></div>

        <div className="relative container mx-auto px-4 py-16 lg:py-20">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <Sparkles className="h-8 w-8 text-amber-400" />
              </div>
              <h1 className="text-4xl lg:text-6xl font-heading font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Meet Our Expert Instructors
              </h1>
            </div>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-8">
              Learn from certified professionals with years of experience and proven track records in music education
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-blue-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">All instructors verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Average 4.8★ rating</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">3,200+ students taught</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-8 lg:h-12">
            <path d="M0,60 C300,120 500,0 800,60 C1000,120 1200,0 1200,60 L1200,120 L0,120 Z" className="fill-slate-50"></path>
          </svg>
        </div>
      </section>

      {/* Enhanced Stats */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center group hover:scale-105 transition-transform duration-300">
              <div className="p-3 bg-blue-500 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-1">{totalInstructors}</div>
              <div className="text-sm font-medium text-blue-700">Expert Instructors</div>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 text-center group hover:scale-105 transition-transform duration-300">
              <div className="p-3 bg-purple-500 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-purple-600 transition-colors">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-1">{totalStudents}</div>
              <div className="text-sm font-medium text-purple-700">Students Taught</div>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 text-center group hover:scale-105 transition-transform duration-300">
              <div className="p-3 bg-amber-500 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-amber-600 transition-colors">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-amber-900 mb-1">{averageRating}★</div>
              <div className="text-sm font-medium text-amber-700">Average Rating</div>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-green-50 to-green-100 p-6 text-center group hover:scale-105 transition-transform duration-300">
              <div className="p-3 bg-green-500 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-green-900 mb-1">{uniqueInstruments}</div>
              <div className="text-sm font-medium text-green-700">Instruments Covered</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters */}
      <InstructorFilters
        searchTerm={searchTerm}
        selectedSpecialty={selectedSpecialty}
        selectedLocation={selectedLocation}
        sortBy={sortBy}
        onSearchChange={setSearchTerm}
        onSpecialtyChange={setSelectedSpecialty}
        onLocationChange={setSelectedLocation}
        onSortChange={setSortBy}
        resultsCount={filteredInstructors.length}
        totalCount={instructors.length}
      />

      {/* Instructors Grid */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredInstructors.map((instructor) => (
              <InstructorCard key={instructor.id} instructor={instructor} />
            ))}
          </div>

          {filteredInstructors.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-slate-900 mb-3">No instructors found</h3>
              <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                Try adjusting your filters or search terms to discover more amazing instructors.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}