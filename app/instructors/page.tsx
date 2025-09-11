"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, Award, Users, MapPin, Calendar } from "lucide-react"

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
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Meet Our Expert Instructors</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Learn from certified professionals with years of experience and proven track records
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Expert Instructors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">3,200+</div>
              <div className="text-sm text-muted-foreground">Students Taught</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">4.8</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">20+</div>
              <div className="text-sm text-muted-foreground">Instruments Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search instructors or instruments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="Guitar">Guitar</SelectItem>
                  <SelectItem value="Piano">Piano</SelectItem>
                  <SelectItem value="Drums">Drums</SelectItem>
                  <SelectItem value="Vocals">Vocals</SelectItem>
                  <SelectItem value="Violin">Violin</SelectItem>
                  <SelectItem value="Music Production">Production</SelectItem>
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
                  <SelectItem value="Port Harcourt">Port Harcourt</SelectItem>
                  <SelectItem value="Enugu">Enugu</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredInstructors.length} of {instructorData.length} instructors
          </div>
        </div>
      </section>

      {/* Instructors Grid */}
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredInstructors.map((instructor) => (
              <Card key={instructor.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={instructor.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {instructor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {instructor.verified && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                          <Award className="h-3 w-3 text-accent-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {instructor.name}
                      </h3>
                      <div className="flex items-center mb-2">
                        <Star className="h-4 w-4 text-accent fill-current mr-1" />
                        <span className="text-sm font-medium">{instructor.rating}</span>
                        <span className="text-sm text-muted-foreground ml-1">({instructor.students} students)</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {instructor.specialties.slice(0, 2).map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {instructor.specialties.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{instructor.specialties.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{instructor.bio}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Experience
                      </div>
                      <span className="font-medium">{instructor.experience}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        Location
                      </div>
                      <span className="font-medium">{instructor.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        Courses
                      </div>
                      <span className="font-medium">{instructor.courses} active</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">From</div>
                      <div className="font-bold text-primary">₦{instructor.hourlyRate.toLocaleString()}/hr</div>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                      {instructor.availability}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" asChild>
                      <a href={`/instructors/${instructor.id}`}>View Profile</a>
                    </Button>
                    <Button variant="outline" size="sm">
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInstructors.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No instructors found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms to find more instructors.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
