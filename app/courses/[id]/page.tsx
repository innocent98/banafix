"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CourseOverview } from "@/components/sections/course-overview"
import { CourseCurriculum } from "@/components/sections/course-curriculum"
import { CourseInstructor } from "@/components/sections/course-instructor"
import { EnrollmentCard } from "@/components/sections/enrollment-card"
import {
  Guitar,
  Clock,
  Star,
  MapPin,
  Share2,
  Heart,
  HelpCircle,
  FileText,
} from "lucide-react"

// Mock course data - in real app this would come from API/database
const courseDetails = {
  id: 1,
  title: "Guitar Fundamentals",
  instrument: "Guitar",
  level: "Beginner",
  modes: ["One-on-One", "Online", "Home Training"],
  duration: "12 weeks",
  location: "Lagos",
  prices: {
    "One-on-One": 25000,
    Online: 20000,
    "Home Training": 30000,
  },
  instructor: {
    name: "John Adebayo",
    avatar: "/instructor-john.jpg",
    bio: "Professional guitarist with 15+ years of teaching experience. Specializes in acoustic and electric guitar across multiple genres.",
    credentials: ["Certified Music Educator", "Berklee Graduate", "500+ Students Taught"],
    rating: 4.9,
    experience: "15 years",
    verified: true,
    availability: "Mon-Fri: 9AM-6PM, Sat: 10AM-4PM",
  },
  rating: 4.9,
  students: 156,
  totalSeats: 20,
  seatsLeft: 8,
  image: "https://images.unsplash.com/photo-1613047747166-a7f33950fd4f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  description:
    "Master the fundamentals of guitar playing with our comprehensive beginner program. This course covers everything from basic chord progressions to your first complete songs.",
  outcomes: [
    "Learn 20+ essential chords and transitions",
    "Master 5+ strumming patterns and techniques",
    "Play 5 complete songs from start to finish",
    "Understand basic music theory and chord progressions",
    "Develop proper posture and finger techniques",
    "Gain confidence for live performance opportunities",
  ],
  equipment: [
    "Acoustic or electric guitar (rental available)",
    "Guitar picks (provided in starter kit)",
    "Digital tuner or tuning app",
    "Music stand (optional but recommended)",
  ],
  curriculum: [
    {
      module: 1,
      title: "Guitar Basics & First Chords",
      weeks: "Weeks 1-2",
      outcomes: ["Proper guitar posture and hand positioning", "Learn G, C, D, Em chords", "Basic strumming technique"],
      tasks: ["Daily 15-minute chord practice", "Memorize chord shapes", "Practice chord transitions"],
    },
    {
      module: 2,
      title: "Rhythm & Strumming Patterns",
      weeks: "Weeks 3-4",
      outcomes: ["Master down-up strumming", "Learn 3 essential patterns", "Play with metronome"],
      tasks: ["Rhythm exercises", "Pattern practice", "First simple songs"],
    },
    {
      module: 3,
      title: "Expanding Your Chord Vocabulary",
      weeks: "Weeks 5-7",
      outcomes: ["Add Am, F, Dm chords", "Barre chord introduction", "Chord progression patterns"],
      tasks: ["Chord transition drills", "Song practice", "Finger strength exercises"],
    },
    {
      module: 4,
      title: "Songs & Performance",
      weeks: "Weeks 8-10",
      outcomes: ["Play 3 complete songs", "Basic fingerpicking", "Performance techniques"],
      tasks: ["Song memorization", "Performance practice", "Recording exercises"],
    },
    {
      module: 5,
      title: "Advanced Techniques",
      weeks: "Weeks 11-12",
      outcomes: ["Advanced strumming", "Basic lead guitar", "Music theory application"],
      tasks: ["Solo practice", "Improvisation exercises", "Final performance preparation"],
    },
  ],
  sessions: [
    { date: "Jan 15, 2025", time: "10:00 AM", available: true },
    { date: "Jan 15, 2025", time: "2:00 PM", available: true },
    { date: "Jan 22, 2025", time: "10:00 AM", available: false },
    { date: "Jan 22, 2025", time: "2:00 PM", available: true },
    { date: "Feb 5, 2025", time: "10:00 AM", available: true },
    { date: "Feb 5, 2025", time: "4:00 PM", available: true },
  ],
  faqs: [
    {
      question: "Do I need my own guitar to start?",
      answer:
        "While having your own guitar is ideal for practice, we offer rental guitars for the first month to help you get started. This gives you time to find the right instrument for your needs.",
    },
    {
      question: "What if I miss a session?",
      answer:
        "We offer makeup sessions for missed classes. You can reschedule up to 24 hours in advance through your student dashboard or by contacting your instructor directly.",
    },
    {
      question: "Can I switch between training modes?",
      answer:
        "Yes, you can switch between One-on-One, Online, and Home Training modes during the course, subject to availability and any price differences.",
    },
  ],
  policies: {
    refund: "Full refund available within 7 days of course start. 50% refund available within 14 days.",
    attendance: "Minimum 80% attendance required for certification. Makeup sessions available for missed classes.",
    materials: "All course materials and recordings remain accessible for 6 months after course completion.",
  },
}

export default function CourseDetailPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Course Header */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <Guitar className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 rounded-full font-semibold">
                  {courseDetails.level}
                </Badge>
                {courseDetails.modes.map((mode) => (
                  <Badge key={mode} className="bg-amber-500/20 text-amber-200 border-amber-400/30 px-3 py-1 rounded-full font-medium text-xs">
                    {mode}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4 tracking-tighter">
                {courseDetails.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">{courseDetails.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span className="font-medium">{courseDetails.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-current" />
                  <span className="font-medium">{courseDetails.rating} ({courseDetails.students} students)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 font-semibold"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Course
              </Button>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 font-semibold"
              >
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Course Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-slate-100 rounded-2xl p-1 h-auto">
                <TabsTrigger value="overview" className="rounded-xl py-3 text-sm font-semibold">Overview</TabsTrigger>
                <TabsTrigger value="curriculum" className="rounded-xl py-3 text-sm font-semibold">Curriculum</TabsTrigger>
                <TabsTrigger value="instructors" className="rounded-xl py-3 text-sm font-semibold">Instructor</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-xl py-3 text-sm font-semibold">Reviews</TabsTrigger>
                <TabsTrigger value="faqs" className="rounded-xl py-3 text-sm font-semibold">FAQs</TabsTrigger>
                <TabsTrigger value="policies" className="rounded-xl py-3 text-sm font-semibold">Policies</TabsTrigger>
              </TabsList>

              <div className="mt-8">
                <TabsContent value="overview">
                  <CourseOverview courseDetails={courseDetails} />
                </TabsContent>

                <TabsContent value="curriculum">
                  <CourseCurriculum curriculum={courseDetails.curriculum} />
                </TabsContent>

                <TabsContent value="instructors">
                  <CourseInstructor instructor={courseDetails.instructor} />
                </TabsContent>

                <TabsContent value="reviews">
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Star className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-slate-900 mb-4">Reviews Coming Soon</h3>
                    <p className="text-slate-600 text-lg leading-relaxed">
                      Student reviews and testimonials will be displayed here once the course launches.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="faqs">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-heading font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
                      <p className="text-slate-600">Find answers to common questions about this course</p>
                    </div>

                    <Accordion type="single" collapsible className="w-full space-y-4">
                      {courseDetails.faqs.map((faq, index) => (
                        <AccordionItem
                          key={index}
                          value={`faq-${index}`}
                          className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white"
                        >
                          <AccordionTrigger className="text-left p-6 hover:no-underline">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <HelpCircle className="h-5 w-5 text-blue-600" />
                              </div>
                              <span className="font-semibold text-slate-900">{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                            <p className="text-slate-600 leading-relaxed pl-14">{faq.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    <div className="p-6 lg:p-8 bg-blue-50 border border-blue-200 rounded-3xl">
                      <h4 className="font-heading font-bold text-xl text-blue-900 mb-3">Still have questions?</h4>
                      <p className="text-blue-700 mb-6 leading-relaxed">
                        Can't find the answer you're looking for? Our support team is here to help you every step of the way.
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 font-semibold">
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="policies">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-heading font-bold text-slate-900 mb-4">Course Policies</h3>
                      <p className="text-slate-600">Important terms and conditions for this course</p>
                    </div>

                    <div className="grid gap-8">
                      {/* Refund Policy */}
                      <div className="p-6 lg:p-8 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-3xl">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="text-xl font-heading font-bold text-slate-900">Refund Policy</h4>
                        </div>
                        <div className="space-y-4 text-slate-700">
                          <p><strong>Full Refund (100%):</strong> Available within 7 days of course start with no sessions attended.</p>
                          <p><strong>Partial Refund (50%):</strong> Available within 14 days of course start with less than 25% completion.</p>
                          <p><strong>No Refund:</strong> After 25% course completion or 14 days from start date, whichever comes first.</p>
                          <p className="text-sm text-amber-700"><strong>Note:</strong> Refund processing takes 5-7 business days. Registration fees are non-refundable.</p>
                        </div>
                      </div>

                      {/* Additional Policies */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 bg-white border-2 border-slate-100 rounded-3xl">
                          <h5 className="font-semibold text-slate-900 mb-4">Attendance Requirements</h5>
                          <ul className="text-sm text-slate-600 space-y-2">
                            <li>• 80% attendance required for certification</li>
                            <li>• Makeup sessions available with 24h notice</li>
                            <li>• Late arrivals (15+ min) marked absent</li>
                          </ul>
                        </div>
                        <div className="p-6 bg-white border-2 border-slate-100 rounded-3xl">
                          <h5 className="font-semibold text-slate-900 mb-4">Course Materials</h5>
                          <ul className="text-sm text-slate-600 space-y-2">
                            <li>• 6 months post-completion access</li>
                            <li>• Online recordings for 30 days</li>
                            <li>• Students provide own instruments</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Enrollment Sidebar */}
          <div className="lg:col-span-1">
            <EnrollmentCard courseDetails={courseDetails} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
