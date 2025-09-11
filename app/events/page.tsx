"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, Users, Plus, List, Filter } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = [
    { id: "all", name: "All Events" },
    { id: "workshops", name: "Workshops" },
    { id: "masterclasses", name: "Masterclasses" },
    { id: "recitals", name: "Recitals" },
    { id: "competitions", name: "Competitions" },
  ]

  const events = [
    {
      id: 1,
      title: "Piano Masterclass with Sarah Johnson",
      category: "masterclasses",
      date: "2024-12-28",
      time: "2:00 PM - 4:00 PM",
      location: "Main Studio, Victoria Island",
      price: "Free",
      seats: { total: 30, taken: 18 },
      instructor: "Sarah Johnson",
      description: "Advanced piano techniques and performance tips from our lead piano instructor.",
      image: "https://images.unsplash.com/photo-1704919262638-c801f6531c0a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "free",
    },
    {
      id: 2,
      title: "Guitar Workshop: Fingerpicking Fundamentals",
      category: "workshops",
      date: "2024-12-30",
      time: "10:00 AM - 12:00 PM",
      location: "Studio B, Lekki",
      price: "₦15,000",
      seats: { total: 15, taken: 12 },
      instructor: "Michael Chen",
      description: "Learn the basics of fingerpicking technique with hands-on practice.",
      image: "https://images.unsplash.com/photo-1704919262638-c801f6531c0a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "paid",
    },
    {
      id: 3,
      title: "Student Recital: Winter Showcase",
      category: "recitals",
      date: "2025-01-05",
      time: "6:00 PM - 8:00 PM",
      location: "Banafix Concert Hall",
      price: "Free",
      seats: { total: 100, taken: 45 },
      instructor: "Various Students",
      description: "Our students showcase their progress in this quarterly recital event.",
      image: "https://images.unsplash.com/photo-1704919262638-c801f6531c0a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "free",
    },
    {
      id: 4,
      title: "Vocal Technique Intensive",
      category: "workshops",
      date: "2025-01-08",
      time: "1:00 PM - 5:00 PM",
      location: "Vocal Studio, Ikeja",
      price: "₦25,000",
      seats: { total: 12, taken: 8 },
      instructor: "Grace Adebayo",
      description: "Intensive workshop covering breathing, projection, and vocal health.",
      image: "https://images.unsplash.com/photo-1704919262638-c801f6531c0a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "paid",
    },
    {
      id: 5,
      title: "Music Production Workshop",
      category: "workshops",
      date: "2025-01-12",
      time: "11:00 AM - 3:00 PM",
      location: "Digital Studio, Victoria Island",
      price: "₦30,000",
      seats: { total: 10, taken: 6 },
      instructor: "Alex Thompson",
      description: "Learn the fundamentals of digital music production and mixing.",
      image: "https://images.unsplash.com/photo-1704919262638-c801f6531c0a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "paid",
    },
    {
      id: 6,
      title: "Annual Music Competition",
      category: "competitions",
      date: "2025-01-20",
      time: "9:00 AM - 6:00 PM",
      location: "Banafix Concert Hall",
      price: "₦5,000 (Entry Fee)",
      seats: { total: 50, taken: 23 },
      instructor: "Panel of Judges",
      description: "Annual competition open to all students. Prizes for top performers.",
      image: "https://images.unsplash.com/photo-1704919262638-c801f6531c0a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "competition",
    },
  ]

  const filteredEvents = events.filter((event) => selectedCategory === "all" || event.category === selectedCategory)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getSeatStatus = (seats: { total: number; taken: number }) => {
    const available = seats.total - seats.taken
    const percentage = (seats.taken / seats.total) * 100

    if (percentage >= 90) return { status: "Almost Full", color: "destructive" }
    if (percentage >= 70) return { status: "Filling Fast", color: "warning" }
    return { status: `${available} seats left`, color: "default" }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Events & Workshops</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join our masterclasses, workshops, and special events to enhance your musical journey
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-start md:items-center">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Filter className="h-5 w-5 text-muted-foreground mt-2" />
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
          </div>
        </div>

        {/* Events List */}
        {viewMode === "list" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => {
              const seatStatus = getSeatStatus(event.seats)
              return (
                <Card key={event.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant={event.type === "free" ? "secondary" : "default"}>
                        {event.type === "free" ? "Free" : "Paid"}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-background/90">
                        {event.category}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">with {event.instructor}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {event.location}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">{event.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {event.seats.taken}/{event.seats.total}
                        </span>
                        <Badge variant={seatStatus.color as any} className="text-xs">
                          {seatStatus.status}
                        </Badge>
                      </div>
                      <div className="font-semibold text-primary">{event.price}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1">Register Now</Button>
                      <Button variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <Card>
            <CardHeader>
              <CardTitle>Events Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Calendar view coming soon!</p>
                <p className="text-sm">For now, please use the list view to browse events.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold font-sora mb-4">Want to host an event?</h2>
              <p className="text-muted-foreground mb-6">
                Are you an instructor or student interested in hosting a workshop or masterclass? We'd love to hear your
                ideas!
              </p>
              <Button size="lg">Propose an Event</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
