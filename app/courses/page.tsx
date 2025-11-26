"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { CourseFilter } from "@/components/sections/course-filter"
import { CourseGrid } from "@/components/sections/course-grid"
import { CuratedPicks } from "@/components/sections/curated-picks"
import {
  Guitar,
  Piano,
  Drum,
  Mic,
  AudioLines as Violin,
  Music,
} from "lucide-react"

// Icon mapping for instruments
const instrumentIcons = {
  Guitar: Guitar,
  Piano: Piano,
  Drums: Drum,
  Vocals: Mic,
  Violin: Violin,
  Production: Music,
}

interface Course {
  id: string
  title: string
  description: string
  instrument: string
  level: string
  duration: string
  location: string
  session: string
  sessionStartDate: string
  modes: string[]
  pricing: Record<string, number>
  price: number
  totalSeats: number
  seatsLeft: number
  outcomes: string[]
  equipment: string[]
  image: string | null
  instructor: {
    name: string
    rating: number
    experience: string
    verified: boolean
  } | null
  students: number
  rating: number
  createdAt: string
  updatedAt: string
}

interface DeliveryMode {
  id: string
  name: string
  order: number
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInstrument, setSelectedInstrument] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load courses and delivery modes in parallel
      const [coursesRes, modesRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/delivery-modes')
      ])

      if (coursesRes.ok && modesRes.ok) {
        const coursesData = await coursesRes.json()
        const modesData = await modesRes.json()

        // Transform courses to include icon and handle missing instructor
        const transformedCourses = coursesData.courses.map((course: Course) => ({
          ...course,
          type: course.modes[0] || 'Online', // Use first mode as primary type
          instructor: course.instructor,
          nextSessions: course.sessionStartDate
            ? [new Date(course.sessionStartDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })]
            : ['TBA'],
          icon: instrumentIcons[course.instrument as keyof typeof instrumentIcons] || Music,
          totalSeats: 20, // Default seat capacity
          seatsLeft: Math.floor(Math.random() * 15) + 5, // Random seats left between 5-19
        }))

        setCourses(transformedCourses)
        setDeliveryModes(modesData.deliveryModes)
      } else {
        setError('Failed to load courses')
      }
    } catch (err) {
      setError('Failed to load courses')
      console.error('Error loading courses:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter courses based on current filters
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.instructor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)

    const matchesInstrument = selectedInstrument === "all" || course.instrument === selectedInstrument
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel
    const matchesType = selectedType === "all" || course.modes.includes(selectedType)
    const matchesLocation = selectedLocation === "all" || course.location === selectedLocation

    return matchesSearch && matchesInstrument && matchesLevel && matchesType && matchesLocation
  })

  // Create curated picks based on available courses
  const curatedPicks = [
    {
      id: 1,
      title: "Most Popular This Month",
      courses: courses.slice(0, 3).map(c => c.id),
      badge: "🔥 Trending",
    },
    {
      id: 2,
      title: "Perfect for Beginners",
      courses: courses.filter(c => c.level === "Beginner").slice(0, 3).map(c => c.id),
      badge: "⭐ Recommended",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Courses</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 tracking-tighter">
              Explore Our <span className="text-amber-400">Courses</span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Discover the perfect course to advance your musical journey with expert instruction and personalized learning paths.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <CourseFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedInstrument={selectedInstrument}
        setSelectedInstrument={setSelectedInstrument}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        filteredCourses={filteredCourses}
        totalCourses={courses.length}
        deliveryModes={deliveryModes}
      />

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Course Grid */}
          <div className="lg:col-span-4">
            {filteredCourses.length > 0 ? (
              <CourseGrid courses={filteredCourses} />
            ) : (
              <div className="flex items-center justify-center w-full">
                <div className="text-center py-16">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses found</h3>
                  <p className="text-slate-600">Try adjusting your filters to see more courses.</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* <CuratedPicks curatedPicks={curatedPicks} courseData={courses} /> */}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}