"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { InstructorFilters } from "@/components/instructors/instructor-filters"
import { InstructorCard } from "@/components/instructors/instructor-card"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Sparkles, TrendingUp, Target } from "lucide-react"

const instructorData = [
  {
    id: 1,
    name: "John Adebayo",
    avatar: "https://images.unsplash.com/photo-1624955032270-5fd19de8d36b?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    specialties: ["Guitar", "Bass Guitar"],
    experience: "15 years",
    rating: 4.9,
    students: 156,
    location: "Lagos",
    bio: "Professional guitarist with 15+ years of teaching experience. Specializes in acoustic and electric guitar across multiple genres.",
    credentials: ["Certified Music Educator", "Berklee Graduate", "500+ Students Taught"],
    courses: 8,
    languages: ["English", "Yoruba"],
    availability: "Mon-Fri",
    hourlyRate: 5000,
    verified: true,
  },
  {
    id: 2,
    name: "Sarah Okafor",
    avatar: "https://images.unsplash.com/photo-1624955032270-5fd19de8d36b?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    specialties: ["Piano", "Keyboard"],
    experience: "12 years",
    rating: 4.8,
    students: 89,
    location: "Abuja",
    bio: "Classical pianist turned contemporary music educator. Expert in both traditional and modern piano techniques.",
    credentials: ["Royal Academy Certified", "Jazz Performance Diploma", "300+ Students"],
    courses: 6,
    languages: ["English", "Hausa"],
    availability: "Tue-Sat",
    hourlyRate: 6000,
    verified: true,
  },
  {
    id: 3,
    name: "Michael Eze",
    avatar: "https://images.unsplash.com/photo-1624955032270-5fd19de8d36b?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    specialties: ["Drums", "Percussion"],
    experience: "10 years",
    rating: 4.7,
    students: 67,
    location: "Lagos",
    bio: "Dynamic drummer with expertise in Afrobeat, Jazz, and contemporary styles. Known for energetic teaching methods.",
    credentials: ["Percussion Institute Graduate", "Studio Session Pro", "200+ Students"],
    courses: 4,
    languages: ["English", "Igbo"],
    availability: "Mon-Sat",
    hourlyRate: 4500,
    verified: true,
  },
  {
    id: 4,
    name: "Grace Nwosu",
    avatar: "/instructor-grace.jpg",
    specialties: ["Vocals", "Voice Training"],
    experience: "18 years",
    rating: 5.0,
    students: 234,
    location: "Port Harcourt",
    bio: "Renowned vocal coach with extensive performance and teaching background. Specializes in contemporary and gospel vocals.",
    credentials: ["Voice Pedagogy Certified", "Professional Singer", "Gospel Music Award Winner"],
    courses: 10,
    languages: ["English", "Igbo"],
    availability: "Mon-Fri",
    hourlyRate: 7000,
    verified: true,
  },
  {
    id: 5,
    name: "David Okonkwo",
    avatar: "/instructor-david.jpg",
    specialties: ["Violin", "Viola"],
    experience: "20 years",
    rating: 4.9,
    students: 45,
    location: "Enugu",
    bio: "Classical violinist with international performance experience. Brings European conservatory training to Nigerian students.",
    credentials: ["Vienna Conservatory Graduate", "Orchestra Principal", "Chamber Music Specialist"],
    courses: 5,
    languages: ["English", "German", "Igbo"],
    availability: "Wed-Sun",
    hourlyRate: 8000,
    verified: true,
  },
  {
    id: 6,
    name: "Alex Taiwo",
    avatar: "https://images.unsplash.com/photo-1624955032270-5fd19de8d36b?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    specialties: ["Music Production", "Audio Engineering"],
    experience: "8 years",
    rating: 4.6,
    students: 178,
    location: "Lagos",
    bio: "Award-winning producer and audio engineer. Teaches modern production techniques and industry-standard workflows.",
    credentials: ["Audio Engineering Certified", "Grammy-Nominated Producer", "Industry Professional"],
    courses: 7,
    languages: ["English", "Yoruba"],
    availability: "Mon-Thu",
    hourlyRate: 10000,
    verified: true,
  },
]

export default function InstructorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [sortBy, setSortBy] = useState("rating")

  const filteredInstructors = instructorData
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
              <div className="text-3xl font-bold text-blue-900 mb-1">50+</div>
              <div className="text-sm font-medium text-blue-700">Expert Instructors</div>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 text-center group hover:scale-105 transition-transform duration-300">
              <div className="p-3 bg-purple-500 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-purple-600 transition-colors">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-1">3,200+</div>
              <div className="text-sm font-medium text-purple-700">Students Taught</div>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 text-center group hover:scale-105 transition-transform duration-300">
              <div className="p-3 bg-amber-500 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-amber-600 transition-colors">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-amber-900 mb-1">4.8★</div>
              <div className="text-sm font-medium text-amber-700">Average Rating</div>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-green-50 to-green-100 p-6 text-center group hover:scale-105 transition-transform duration-300">
              <div className="p-3 bg-green-500 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-green-900 mb-1">20+</div>
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
        totalCount={instructorData.length}
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