"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Award, Users, MapPin, Calendar, Clock, Languages, MessageCircle, CheckCircle } from "lucide-react"

// Mock instructor data - in real app this would come from API/database
const instructorDetails = {
  id: 1,
  name: "John Adebayo",
  avatar: "https://images.unsplash.com/photo-1624955032270-5fd19de8d36b?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  coverImage: "https://images.unsplash.com/photo-1624955032270-5fd19de8d36b?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  specialties: ["Guitar", "Bass Guitar"],
  experience: "15 years",
  rating: 4.9,
  totalReviews: 156,
  students: 156,
  location: "Lagos, Nigeria",
  bio: "Professional guitarist with 15+ years of teaching experience. Specializes in acoustic and electric guitar across multiple genres including rock, jazz, blues, and Afrobeat. John has performed with numerous bands and has a passion for helping students discover their unique musical voice.",
  credentials: [
    "Certified Music Educator",
    "Berklee College of Music Graduate",
    "500+ Students Successfully Taught",
    "Professional Performer - 10+ Years",
    "Music Theory Specialist",
  ],
  courses: [
    {
      id: 1,
      title: "Guitar Fundamentals",
      level: "Beginner",
      students: 45,
      rating: 4.9,
      price: 25000,
      duration: "12 weeks",
    },
    {
      id: 2,
      title: "Advanced Guitar Techniques",
      level: "Advanced",
      students: 23,
      rating: 4.8,
      price: 35000,
      duration: "16 weeks",
    },
    {
      id: 3,
      title: "Bass Guitar Mastery",
      level: "Intermediate",
      students: 18,
      rating: 4.9,
      price: 30000,
      duration: "14 weeks",
    },
  ],
  languages: ["English", "Yoruba", "Pidgin"],
  availability: {
    schedule: "Monday - Friday",
    timeSlots: ["9:00 AM - 12:00 PM", "2:00 PM - 6:00 PM", "7:00 PM - 9:00 PM"],
    timezone: "WAT (West Africa Time)",
  },
  hourlyRate: 5000,
  verified: true,
  teachingStyle:
    "Patient and encouraging approach with focus on practical application. Combines traditional techniques with modern methods to keep lessons engaging and relevant.",
  achievements: [
    "Best Music Educator Award 2023",
    "Featured in Lagos Music Magazine",
    "Performed at major music festivals",
    "Produced 3 successful student albums",
  ],
  contact: {
    email: "john.adebayo@banafix.com",
    phone: "+234 801 234 5678",
  },
}

const reviews = [
  {
    id: 1,
    student: "Adunni Olatunji",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "John is an amazing instructor! His patience and teaching style helped me progress from complete beginner to playing my first song in just 6 weeks.",
    course: "Guitar Fundamentals",
  },
  {
    id: 2,
    student: "Emeka Nwankwo",
    rating: 5,
    date: "1 month ago",
    comment:
      "Excellent teacher with deep knowledge of music theory. The advanced techniques course really elevated my playing to the next level.",
    course: "Advanced Guitar Techniques",
  },
  {
    id: 3,
    student: "Fatima Abdullahi",
    rating: 4,
    date: "2 months ago",
    comment:
      "Great instructor who makes learning fun and engaging. The bass guitar course was exactly what I needed to join my band.",
    course: "Bass Guitar Mastery",
  },
]

export default function InstructorProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative">
        <div className="aspect-[21/9] bg-muted overflow-hidden">
          <img
            src={instructorDetails.coverImage || "/placeholder.svg"}
            alt={`${instructorDetails.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <div className="flex items-end gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white">
                  <AvatarImage src={instructorDetails.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">
                    {instructorDetails.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {instructorDetails.verified && (
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent rounded-full flex items-center justify-center border-4 border-white">
                    <Award className="h-5 w-5 text-accent-foreground" />
                  </div>
                )}
              </div>
              <div className="text-white flex-1">
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2">{instructorDetails.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-accent fill-current mr-1" />
                    <span className="font-semibold text-lg">{instructorDetails.rating}</span>
                    <span className="text-white/80 ml-1">({instructorDetails.totalReviews} reviews)</span>
                  </div>
                  <div className="flex items-center text-white/80">
                    <Users className="h-4 w-4 mr-1" />
                    {instructorDetails.students} students taught
                  </div>
                  <div className="flex items-center text-white/80">
                    <Calendar className="h-4 w-4 mr-1" />
                    {instructorDetails.experience} experience
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {instructorDetails.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="bg-white/20 text-white border-white/30">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {instructorDetails.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">{instructorDetails.bio}</p>

                    <div>
                      <h4 className="font-semibold mb-2">Teaching Style</h4>
                      <p className="text-muted-foreground">{instructorDetails.teachingStyle}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2 text-primary" />
                      Credentials & Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-3">Credentials</h4>
                        <ul className="space-y-2">
                          {instructorDetails.credentials.map((credential, index) => (
                            <li key={index} className="flex items-center text-sm">
                              <CheckCircle className="h-4 w-4 text-accent mr-2 flex-shrink-0" />
                              {credential}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Achievements</h4>
                        <ul className="space-y-2">
                          {instructorDetails.achievements.map((achievement, index) => (
                            <li key={index} className="flex items-center text-sm">
                              <Star className="h-4 w-4 text-accent mr-2 flex-shrink-0" />
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="courses" className="space-y-4">
                {instructorDetails.courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                          <div className="flex items-center gap-4 mb-2">
                            <Badge variant="outline">{course.level}</Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {course.duration}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="h-4 w-4 mr-1" />
                              {course.students} students
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-accent fill-current mr-1" />
                            <span className="text-sm font-medium">{course.rating}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-primary mb-2">₦{course.price.toLocaleString()}</div>
                          <Button size="sm" asChild>
                            <a href={`/courses/${course.id}`}>View Course</a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-semibold">{review.student}</div>
                          <div className="text-sm text-muted-foreground">{review.date}</div>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "text-accent fill-current" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-2">{review.comment}</p>
                      <Badge variant="outline" className="text-xs">
                        {review.course}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="schedule" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Schedule</h4>
                      <p className="text-muted-foreground">{instructorDetails.availability.schedule}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Available Time Slots</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {instructorDetails.availability.timeSlots.map((slot, index) => (
                          <Badge key={index} variant="outline" className="justify-center py-2">
                            {slot}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Timezone</h4>
                      <p className="text-muted-foreground">{instructorDetails.availability.timezone}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Contact Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-primary mb-2">
                      ₦{instructorDetails.hourlyRate.toLocaleString()}/hour
                    </div>
                    <p className="text-sm text-muted-foreground">Starting rate</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <Button className="w-full" size="lg">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Session
                    </Button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{instructorDetails.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Languages className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{instructorDetails.languages.join(", ")}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Usually responds within 2 hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Students</span>
                    <span className="font-semibold">{instructorDetails.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Courses</span>
                    <span className="font-semibold">{instructorDetails.courses.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Experience</span>
                    <span className="font-semibold">{instructorDetails.experience}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Rate</span>
                    <span className="font-semibold">98%</span>
                  </div>
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
