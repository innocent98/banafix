"use client"

import { useState } from "react"
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

const courseData = [
  {
    id: 1,
    title: "Guitar Fundamentals",
    instrument: "Guitar",
    level: "Beginner",
    type: "One-on-One",
    duration: "12 weeks",
    price: 25000,
    instructor: "John Adebayo",
    rating: 4.9,
    students: 156,
    totalSeats: 20,
    seatsLeft: 8,
    location: "Lagos",
    nextSessions: ["Jan 15, 2025", "Jan 22, 2025", "Feb 5, 2025"],
    image: "https://images.unsplash.com/photo-1613047747166-a7f33950fd4f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "Master the basics of guitar playing with personalized instruction.",
    icon: Guitar,
  },
  {
    id: 2,
    title: "Piano Mastery Program",
    instrument: "Piano",
    level: "Intermediate",
    type: "Online",
    duration: "16 weeks",
    price: 30000,
    instructor: "Sarah Okafor",
    rating: 4.8,
    students: 89,
    totalSeats: 15,
    seatsLeft: 3,
    location: "Online",
    nextSessions: ["Jan 18, 2025", "Jan 25, 2025"],
    image: "https://images.unsplash.com/photo-1574302578477-6084176d6207?q=80&w=2032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "Advanced piano techniques and music theory for intermediate players.",
    icon: Piano,
  },
  {
    id: 3,
    title: "Drum Beats & Rhythms",
    instrument: "Drums",
    level: "Beginner",
    type: "Home Training",
    duration: "10 weeks",
    price: 35000,
    instructor: "Michael Eze",
    rating: 4.7,
    students: 67,
    totalSeats: 25,
    seatsLeft: 12,
    location: "Abuja",
    nextSessions: ["Jan 20, 2025", "Feb 3, 2025", "Feb 10, 2025"],
    image: "https://images.unsplash.com/photo-1611163959249-84ae47de5124?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "Learn fundamental drum patterns and develop your rhythm skills.",
    icon: Drum,
  },
  {
    id: 4,
    title: "Vocal Performance",
    instrument: "Vocals",
    level: "All Levels",
    type: "One-on-One",
    duration: "8 weeks",
    price: 20000,
    instructor: "Grace Nwosu",
    rating: 5.0,
    students: 234,
    totalSeats: 18,
    seatsLeft: 15,
    location: "Lagos",
    nextSessions: ["Jan 16, 2025", "Jan 23, 2025", "Jan 30, 2025"],
    image: "https://images.unsplash.com/photo-1703144569611-8196c083bbc0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "Develop your voice with professional vocal coaching techniques.",
    icon: Mic,
  },
  {
    id: 5,
    title: "Classical Violin",
    instrument: "Violin",
    level: "Advanced",
    type: "Online",
    duration: "20 weeks",
    price: 40000,
    instructor: "David Okonkwo",
    rating: 4.9,
    students: 45,
    totalSeats: 10,
    seatsLeft: 5,
    location: "Online",
    nextSessions: ["Jan 17, 2025", "Feb 7, 2025"],
    image: "https://images.unsplash.com/photo-1725547827077-28ba45265794?q=80&w=2026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "Master classical violin repertoire and advanced techniques.",
    icon: Violin,
  },
  {
    id: 6,
    title: "Music Production Basics",
    instrument: "Production",
    level: "Beginner",
    type: "Online",
    duration: "14 weeks",
    price: 45000,
    instructor: "Alex Taiwo",
    rating: 4.6,
    students: 178,
    totalSeats: 30,
    seatsLeft: 20,
    location: "Online",
    nextSessions: ["Jan 19, 2025", "Jan 26, 2025", "Feb 2, 2025"],
    image: "https://images.unsplash.com/photo-1644183740392-f3e394397683?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "Learn the fundamentals of music production and digital audio.",
    icon: Music,
  },
]

const curatedPicks = [
  {
    id: 1,
    title: "Most Popular This Month",
    courses: [1, 4, 6],
    badge: "🔥 Trending",
  },
  {
    id: 2,
    title: "Perfect for Beginners",
    courses: [1, 3, 6],
    badge: "⭐ Recommended",
  },
]

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInstrument, setSelectedInstrument] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")

  const filteredCourses = courseData.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesInstrument = selectedInstrument === "all" || course.instrument === selectedInstrument
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel
    const matchesType = selectedType === "all" || course.type === selectedType
    const matchesLocation = selectedLocation === "all" || course.location === selectedLocation

    return matchesSearch && matchesInstrument && matchesLevel && matchesType && matchesLocation
  })

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
        totalCourses={courseData.length}
      />

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Course Grid */}
          <div className="lg:col-span-3">
            <CourseGrid courses={filteredCourses} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CuratedPicks curatedPicks={curatedPicks} courseData={courseData} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
