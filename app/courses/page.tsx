"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Guitar,
  Piano,
  Drum,
  Mic,
  AudioLines as Violin,
  Music,
  Search,
  Filter,
  Star,
  Calendar,
  TrendingUp,
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
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Explore Our Courses</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Discover the perfect course to advance your musical journey with expert instruction
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses or instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Instrument" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instruments</SelectItem>
                  <SelectItem value="Guitar">Guitar</SelectItem>
                  <SelectItem value="Piano">Piano</SelectItem>
                  <SelectItem value="Drums">Drums</SelectItem>
                  <SelectItem value="Vocals">Vocals</SelectItem>
                  <SelectItem value="Violin">Violin</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="One-on-One">One-on-One</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Home Training">Home Training</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Lagos">Lagos</SelectItem>
                  <SelectItem value="Abuja">Abuja</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredCourses.length} of {courseData.length} courses
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Course Grid - Updated to 3 columns on desktop, 4 with sidebar */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const seatProgress = ((course.totalSeats - course.seatsLeft) / course.totalSeats) * 100

                return (
                  <Card key={course.id} className="group hover:shadow-lg transition-all duration-300">
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      <img
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <course.icon className="h-4 w-4 text-primary" />
                          <Badge variant="outline" className="text-xs">
                            {course.level}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Star className="h-3 w-3 text-accent fill-current mr-1" />
                          {course.rating}
                        </div>
                      </div>

                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>

                      <div className="mb-3">
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Next Sessions:</span>
                        </div>
                        <div className="text-sm font-medium">
                          {course.nextSessions.slice(0, 2).join(", ")}
                          {course.nextSessions.length > 2 && "..."}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Instructor:</span>
                          <span className="font-medium">{course.instructor}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Mode:</span>
                          <span>{course.type}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Availability:</span>
                          <span className="font-medium text-primary">
                            {course.seatsLeft}/{course.totalSeats} seats left
                          </span>
                        </div>
                        <Progress value={seatProgress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">From</div>
                          <div className="font-bold text-lg text-primary">₦{course.price.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 bg-transparent" asChild>
                          <a href={`/courses/${course.id}`}>View Course</a>
                        </Button>
                        <Button className="flex-1" asChild>
                          <a href={`/courses/${course.id}`}>Enroll</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms to find more courses.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-6">
              {curatedPicks.map((pick) => (
                <Card key={pick.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{pick.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {pick.badge}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {pick.courses.map((courseId) => {
                        const course = courseData.find((c) => c.id === courseId)
                        if (!course) return null

                        return (
                          <div
                            key={courseId}
                            className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                          >
                            <course.icon className="h-8 w-8 text-primary" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{course.title}</div>
                              <div className="text-xs text-muted-foreground">{course.instructor}</div>
                              <div className="text-xs font-medium text-primary">₦{course.price.toLocaleString()}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Promotion Card */}
              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">New Year Special</h3>
                  <p className="text-sm text-muted-foreground mb-4">Get 20% off on all courses. Limited time offer!</p>
                  <Button size="sm" className="w-full">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
