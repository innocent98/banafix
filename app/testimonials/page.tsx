"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Play, Filter, Send } from "lucide-react"

export default function TestimonialsPage() {
  const [selectedInstrument, setSelectedInstrument] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)

  const testimonials = [
    {
      id: 1,
      type: "text",
      name: "Sarah Johnson",
      instrument: "Piano",
      level: "Intermediate",
      rating: 5,
      content:
        "Banafix transformed my piano skills completely. The structured approach and amazing instructors made learning enjoyable and effective.",
      image: "/student-avatar.jpg",
      course: "Advanced Piano Mastery",
    },
    {
      id: 2,
      type: "video",
      name: "Michael Chen",
      instrument: "Guitar",
      level: "Beginner",
      rating: 5,
      content: "From zero to hero in 6 months! Watch my journey.",
      thumbnail: "/guitar-course.jpg",
      videoUrl: "#",
      course: "Guitar Fundamentals",
    },
    {
      id: 3,
      type: "text",
      name: "Grace Adebayo",
      instrument: "Vocals",
      level: "Advanced",
      rating: 5,
      content:
        "The vocal training program helped me discover my true voice. I'm now performing professionally thanks to Banafix!",
      image: "/instructor-grace.jpg",
      course: "Professional Vocal Training",
    },
    {
      id: 4,
      type: "video",
      name: "David Williams",
      instrument: "Drums",
      level: "Intermediate",
      rating: 5,
      content: "My drumming performance after 3 months at Banafix",
      thumbnail: "/drums-course.jpg",
      videoUrl: "#",
      course: "Rhythm & Beats Mastery",
    },
    {
      id: 5,
      type: "text",
      name: "Alex Thompson",
      instrument: "Violin",
      level: "Beginner",
      rating: 5,
      content:
        "Never thought I could play violin at my age. Banafix proved me wrong with their patient and skilled instructors.",
      image: "/instructor-alex.jpg",
      course: "Violin for Adults",
    },
    {
      id: 6,
      type: "text",
      name: "Emma Rodriguez",
      instrument: "Piano",
      level: "Advanced",
      rating: 5,
      content: "The music production course opened up a whole new world for me. Now I'm creating my own compositions!",
      image: "/student-2.jpg",
      course: "Music Production & Composition",
    },
  ]

  const instruments = ["all", "Piano", "Guitar", "Drums", "Vocals", "Violin", "Production"]
  const levels = ["all", "Beginner", "Intermediate", "Advanced"]

  const filteredTestimonials = testimonials.filter((testimonial) => {
    const instrumentMatch = selectedInstrument === "all" || testimonial.instrument === selectedInstrument
    const levelMatch = selectedLevel === "all" || testimonial.level === selectedLevel
    return instrumentMatch && levelMatch
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Student Success Stories</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Hear from our amazing students who've transformed their musical journey with Banafix
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 p-6 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Filter by:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Instrument:</span>
            {instruments.map((instrument) => (
              <Button
                key={instrument}
                variant={selectedInstrument === instrument ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedInstrument(instrument)}
                className="capitalize"
              >
                {instrument}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Level:</span>
            {levels.map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel(level)}
                className="capitalize"
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Testimonials Masonry Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="break-inside-avoid mb-6 overflow-hidden">
              <CardContent className="p-6">
                {testimonial.type === "video" ? (
                  <div className="relative mb-4">
                    <img
                      src={testimonial.thumbnail || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                      <Button size="lg" className="rounded-full">
                        <Play className="h-6 w-6 mr-2" />
                        Play Video
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{testimonial.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{testimonial.instrument}</Badge>
                        <Badge variant="outline">{testimonial.level}</Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>

                <div className="text-sm text-muted-foreground">
                  Course: <span className="font-medium">{testimonial.course}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submission Form */}
        <div className="mt-16 bg-muted p-8 rounded-lg">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-sora mb-4">Share Your Success Story</h2>
            <p className="text-muted-foreground">
              Completed a course with us? We'd love to hear about your experience!
            </p>
          </div>

          {!showSubmissionForm ? (
            <div className="text-center">
              <Button onClick={() => setShowSubmissionForm(true)} size="lg">
                <Send className="h-5 w-5 mr-2" />
                Submit Your Testimonial
              </Button>
            </div>
          ) : (
            <form className="max-w-2xl mx-auto space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="Your Name" />
                <Input placeholder="Email Address" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Select Instrument</option>
                  <option>Piano</option>
                  <option>Guitar</option>
                  <option>Drums</option>
                  <option>Vocals</option>
                  <option>Violin</option>
                  <option>Production</option>
                </select>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Select Level</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <Input placeholder="Course Name" />
              <Textarea placeholder="Share your experience with Banafix..." rows={4} />
              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Submit Testimonial
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSubmissionForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
