"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Guitar,
  Clock,
  Star,
  MapPin,
  CheckCircle,
  Play,
  Award,
  BookOpen,
  Target,
  Share2,
  Heart,
  Download,
  Timer,
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
  const [selectedMode, setSelectedMode] = useState("One-on-One")
  const [selectedSession, setSelectedSession] = useState("")
  const [homeAddress, setHomeAddress] = useState("")

  const seatProgress = ((courseDetails.totalSeats - courseDetails.seatsLeft) / courseDetails.totalSeats) * 100
  const currentPrice = courseDetails.prices[selectedMode as keyof typeof courseDetails.prices]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Guitar className="h-5 w-5 text-primary" />
                <Badge variant="outline">{courseDetails.level}</Badge>
                {courseDetails.modes.map((mode) => (
                  <Badge key={mode} variant="secondary" className="text-xs">
                    {mode}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">{courseDetails.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {courseDetails.duration}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {courseDetails.location}
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-accent fill-current" />
                  {courseDetails.rating} ({courseDetails.students} students)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Updated to 2-column layout with sticky panel */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="instructors">Instructors</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="faqs">FAQs</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Course Image */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={courseDetails.image || "/placeholder.svg"}
                    alt={courseDetails.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2 text-primary" />
                      Learning Outcomes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {courseDetails.outcomes.map((outcome, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-accent mr-3 flex-shrink-0 mt-0.5" />
                          <span>{outcome}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-primary" />
                      Equipment Needed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {courseDetails.equipment.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sample Lesson</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Play className="h-12 w-12 text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground">Preview: First Guitar Lesson</p>
                        <Button variant="outline" className="mt-2 bg-transparent">
                          <Play className="h-4 w-4 mr-2" />
                          Watch Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="curriculum" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Course Curriculum</h3>
                  <Button
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Prospectus (PDF)
                  </Button>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {courseDetails.curriculum.map((module) => (
                    <AccordionItem key={module.module} value={`module-${module.module}`}>
                      <AccordionTrigger className="text-left">
                        <div>
                          <div className="font-semibold">
                            Module {module.module}: {module.title}
                          </div>
                          <div className="text-sm text-muted-foreground">{module.weeks}</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div>
                            <h4 className="font-medium mb-2">Learning Outcomes:</h4>
                            <ul className="space-y-1">
                              {module.outcomes.map((outcome, index) => (
                                <li key={index} className="flex items-center text-sm">
                                  <CheckCircle className="h-4 w-4 text-accent mr-2" />
                                  {outcome}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Practice Tasks:</h4>
                            <ul className="space-y-1">
                              {module.tasks.map((task, index) => (
                                <li key={index} className="flex items-center text-sm">
                                  <Target className="h-4 w-4 text-primary mr-2" />
                                  {task}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="instructors" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={courseDetails.instructor.avatar || "/placeholder.svg"} />
                          <AvatarFallback>JA</AvatarFallback>
                        </Avatar>
                        {courseDetails.instructor.verified && (
                          <div className="absolute -top-1 -right-1 bg-accent rounded-full p-1">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-semibold">{courseDetails.instructor.name}</h3>
                          {courseDetails.instructor.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-accent fill-current mr-1" />
                            <span className="font-medium">{courseDetails.instructor.rating}</span>
                          </div>
                          <div className="text-muted-foreground">{courseDetails.instructor.experience} experience</div>
                        </div>
                        <p className="text-muted-foreground mb-4">{courseDetails.instructor.bio}</p>
                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <span className="font-medium">Availability: </span>
                            <span className="text-muted-foreground">{courseDetails.instructor.availability}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {courseDetails.instructor.credentials.map((credential, index) => (
                            <Badge key={index} variant="outline" className="flex items-center">
                              <Award className="h-3 w-3 mr-1" />
                              {credential}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Reviews Coming Soon</h3>
                  <p className="text-muted-foreground">Student reviews and testimonials will be displayed here.</p>
                </div>
              </TabsContent>

              <TabsContent value="faqs" className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Frequently Asked Questions</h3>
                  <p className="text-sm text-muted-foreground">Course-specific questions and answers</p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {courseDetails.faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center">
                          <HelpCircle className="h-4 w-4 mr-2 text-primary" />
                          {faq.question}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground pl-6">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}

                  {/* Additional course-specific FAQs */}
                  <AccordionItem value="faq-additional-1">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 text-primary" />
                        How long are the individual sessions?
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground pl-6">
                        Each session is 60 minutes for One-on-One and Home Training modes, and 90 minutes for Online
                        group sessions. This includes time for practice, feedback, and Q&A.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-additional-2">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 text-primary" />
                        What happens after I complete the course?
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground pl-6">
                        You'll receive a certificate of completion and can enroll in our intermediate courses. We also
                        offer performance opportunities and continued mentorship programs.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-additional-3">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 text-primary" />
                        Are there any age restrictions for this course?
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground pl-6">
                        This course is suitable for ages 12 and above. For younger students (8-11), we recommend our
                        Kids Guitar Program which is specially designed for smaller hands and shorter attention spans.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Still have questions?</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Can't find the answer you're looking for? Our support team is here to help.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Contact Support
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="policies" className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Course Policies</h3>
                  <p className="text-sm text-muted-foreground">Important terms and conditions for this course</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      Refund & Attendance Policies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-l-4 border-accent pl-4">
                      <h4 className="font-semibold mb-2 text-accent">Refund Policy</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          <strong>Full Refund (100%):</strong> Available within 7 days of course start with no sessions
                          attended.
                        </p>
                        <p>
                          <strong>Partial Refund (50%):</strong> Available within 14 days of course start with less than
                          25% completion.
                        </p>
                        <p>
                          <strong>No Refund:</strong> After 25% course completion or 14 days from start date, whichever
                          comes first.
                        </p>
                        <p className="text-xs mt-2 text-amber-600">
                          <strong>Note:</strong> Refund processing takes 5-7 business days. Registration fees are
                          non-refundable.
                        </p>
                      </div>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold mb-2 text-primary">Attendance Requirements</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          <strong>Minimum Attendance:</strong> 80% attendance required for course completion
                          certificate.
                        </p>
                        <p>
                          <strong>Makeup Sessions:</strong> Available for missed classes with 24-hour advance notice.
                        </p>
                        <p>
                          <strong>Late Arrivals:</strong> Students arriving more than 15 minutes late may be marked
                          absent.
                        </p>
                        <p>
                          <strong>Rescheduling:</strong> Up to 2 session reschedules allowed per course, subject to
                          instructor availability.
                        </p>
                      </div>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold mb-2 text-blue-600">Course Materials & Access</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          <strong>Material Access:</strong> All course materials remain accessible for 6 months after
                          completion.
                        </p>
                        <p>
                          <strong>Recording Policy:</strong> Session recordings available for Online mode only,
                          accessible for 30 days.
                        </p>
                        <p>
                          <strong>Equipment:</strong> Students responsible for their own instruments. Rental options
                          available.
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Additional Terms</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Course schedules may be adjusted with 48-hour notice</li>
                        <li>• Instructor substitutions may occur due to unforeseen circumstances</li>
                        <li>• Students must maintain respectful behavior during sessions</li>
                        <li>• Banafix reserves the right to terminate enrollment for policy violations</li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" className="flex-1 bg-transparent">
                        <FileText className="h-4 w-4 mr-2" />
                        View Full Terms & Conditions
                      </Button>
                      <Button variant="outline" className="flex-1 bg-transparent">
                        <FileText className="h-4 w-4 mr-2" />
                        Privacy Policy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-2">₦{currentPrice.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground mb-4">per course</div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Seats Available:</span>
                      <span className="font-medium text-primary">
                        {courseDetails.seatsLeft}/{courseDetails.totalSeats}
                      </span>
                    </div>
                    <Progress value={seatProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">Only {courseDetails.seatsLeft} seats left!</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <Label className="text-sm font-medium">Training Mode</Label>
                    <RadioGroup value={selectedMode} onValueChange={setSelectedMode} className="mt-2">
                      {courseDetails.modes.map((mode) => (
                        <div key={mode} className="flex items-center space-x-2">
                          <RadioGroupItem value={mode} id={mode} />
                          <Label htmlFor={mode} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span>{mode}</span>
                              <span className="text-sm text-primary font-medium">
                                ₦{courseDetails.prices[mode as keyof typeof courseDetails.prices].toLocaleString()}
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Select Session</Label>
                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose date & time" />
                      </SelectTrigger>
                      <SelectContent>
                        {courseDetails.sessions.map((session, index) => (
                          <SelectItem
                            key={index}
                            value={`${session.date}-${session.time}`}
                            disabled={!session.available}
                          >
                            {session.date} at {session.time} {!session.available && "(Full)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedMode === "Home Training" && (
                    <div>
                      <Label className="text-sm font-medium">Your Address</Label>
                      <Input
                        placeholder="Enter your address"
                        value={homeAddress}
                        onChange={(e) => setHomeAddress(e.target.value)}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        We cover Lagos mainland and island. Additional charges may apply for distant locations.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {courseDetails.seatsLeft > 0 ? (
                    <Button className="w-full" size="lg" asChild>
                      <a href="/enroll">Proceed to Registration</a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full bg-orange-500 text-white hover:bg-orange-600" size="lg">
                      Join Waitlist
                    </Button>
                  )}
                  <Button variant="outline" className="w-full bg-transparent">
                    Book Free Trial
                  </Button>
                </div>

                {selectedSession && (
                  <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <Timer className="h-4 w-4 mr-1" />
                        Seat Hold Timer:
                      </span>
                      <span className="font-mono font-bold text-accent">10:00</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Your seat is reserved for 10 minutes</p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Course Features</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Flexible scheduling available</li>
                    <li>• Makeup sessions for missed classes</li>
                    <li>• Certificate of completion</li>
                    <li>• 6 months material access</li>
                    <li>• Performance opportunities</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
