"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { InstructorProfileHeader } from "@/components/instructors/instructor-profile-header"
import { InstructorProfileTabs } from "@/components/instructors/instructor-profile-tabs"
import { InstructorSidebar } from "@/components/instructors/instructor-sidebar"

// Mock instructor data - in real app this would come from API/database
const instructorDetails = {
  id: 1,
  name: "John Adebayo",
  avatar: "https://images.unsplash.com/photo-1624955032270-5fd19de8d36b?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Navigation />

      {/* Enhanced Hero Section */}
      <InstructorProfileHeader instructor={instructorDetails} />

      {/* Main Content */}
      <section className="py-12 lg:py-16 -mt-4 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <InstructorProfileTabs instructor={instructorDetails} reviews={reviews} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <InstructorSidebar instructor={instructorDetails} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
