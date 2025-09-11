import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  Guitar,
  Piano,
  Drum,
  Mic,
  Users,
  Award,
  Clock,
  Star,
  Play,
  ChevronRight,
  CheckCircle,
  Quote,
  ChevronDown,
  Network,
  BookOpen,
  Headphones,
  Home,
  Video,
  GraduationCap,
  CreditCard,
  MessageCircle,
} from "lucide-react"

export default function HomePage() {
  const instruments = [
    {
      name: "Guitar",
      icon: Guitar,
      levels: ["Beginner", "Intermediate"],
      price: "₦25,000",
      seats: 8,
      total: 20,
      image:
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      name: "Piano",
      icon: Piano,
      levels: ["Beginner", "Advanced"],
      price: "₦30,000",
      seats: 3,
      total: 15,
      image:
        "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      name: "Drums",
      icon: Drum,
      levels: ["Beginner", "Intermediate"],
      price: "₦35,000",
      seats: 12,
      total: 25,
      image:
        "https://images.unsplash.com/photo-1668275888208-76d57d3357f9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      name: "Vocals",
      icon: Mic,
      levels: ["All Levels"],
      price: "₦20,000",
      seats: 15,
      total: 30,
      image:
        "https://images.unsplash.com/photo-1703144569611-8196c083bbc0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      name: "Saxophone",
      icon: Mic,
      levels: ["Beginner", "Intermediate"],
      price: "₦40,000",
      seats: 5,
      total: 12,
      image:
        "https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      name: "Violin",
      icon: Guitar,
      levels: ["Beginner", "Advanced"],
      price: "₦35,000",
      seats: 7,
      total: 18,
      image:
        "https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ]

  const trainingModes = [
    {
      title: "One-on-One",
      description: "Personalized instruction tailored to your pace and goals",
      features: ["Custom curriculum", "Flexible scheduling", "Direct feedback"],
      icon: Users,
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "Online Classes",
      description: "Learn from anywhere with our interactive virtual sessions",
      features: ["Live streaming", "Recorded sessions", "Digital resources"],
      icon: Video,
      image:
        "https://images.unsplash.com/photo-1623076189461-f7706b741c04?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "Home Training",
      description: "Professional instructors come to your location",
      features: ["Convenient location", "Personal equipment", "Family discounts"],
      icon: Home,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ]

  const whyBanafix = [
    { title: "Certified Tutors", icon: Award, description: "Expert instructors with proven credentials" },
    { title: "Structured Curriculum", icon: BookOpen, description: "Progressive learning paths for all levels" },
    { title: "Performance Labs", icon: Star, description: "State-of-the-art practice facilities" },
    { title: "Flexible Schedule", icon: Clock, description: "Classes that fit your lifestyle" },
    { title: "Safe Payments", icon: CreditCard, description: "Secure and transparent billing" },
    { title: "Alumni Network", icon: Network, description: "Connect with 3,200+ graduates" },
    { title: "Digital Resources", icon: Headphones, description: "Access to exclusive learning materials" },
    { title: "Performance Opportunities", icon: GraduationCap, description: "Regular recitals and showcases" },
    { title: "24/7 Support", icon: MessageCircle, description: "Always here when you need help" },
  ]

  const upcomingSessions = [
    {
      course: "Guitar Fundamentals",
      instructor: "Sarah Johnson",
      date: "Dec 15",
      time: "2:00 PM",
      seats: 3,
      price: "₦25,000",
    },
    {
      course: "Piano Intermediate",
      instructor: "Michael Chen",
      date: "Dec 16",
      time: "4:00 PM",
      seats: 1,
      price: "₦30,000",
    },
    {
      course: "Vocal Training",
      instructor: "Grace Adebayo",
      date: "Dec 17",
      time: "10:00 AM",
      seats: 8,
      price: "₦20,000",
    },
    {
      course: "Drums Beginner",
      instructor: "David Wilson",
      date: "Dec 18",
      time: "3:00 PM",
      seats: 5,
      price: "₦35,000",
    },
  ]

  const testimonials = [
    {
      type: "quote",
      content:
        "Banafix transformed my musical journey. The structured approach and expert guidance helped me master piano in just 6 months!",
      author: "Adunni Okafor",
      role: "Piano Student",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1501027874987-73e9c32f46a0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      type: "video",
      thumbnail:
        "https://images.unsplash.com/photo-1501027874987-73e9c32f46a0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      author: "James Okoro",
      role: "Guitar Graduate",
      duration: "0:30",
    },
    {
      type: "quote",
      content:
        "The flexibility of home training made it possible for me to learn while managing my busy schedule. Highly recommend!",
      author: "Fatima Hassan",
      role: "Vocal Student",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ]

  const faqPreview = [
    {
      question: "How do I enroll in a course?",
      answer:
        "Simply browse our courses, select your preferred instrument and schedule, then complete the online enrollment process.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept bank transfers, card payments, USSD, and PayPal for your convenience.",
    },
    {
      question: "Can I switch between training modes?",
      answer: "Yes, you can upgrade or change your training mode at any time during your course.",
    },
    {
      question: "Do you offer trial sessions?",
      answer: "Yes, we offer free 30-minute trial sessions for new students to experience our teaching quality.",
    },
    {
      question: "What happens if I miss a session?",
      answer: "Missed sessions can be rescheduled within the same week, subject to instructor availability.",
    },
    {
      question: "Are instruments provided during classes?",
      answer: "Yes, all instruments and equipment are provided during on-campus and home training sessions.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] opacity-10"></div>
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="goldLines" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M0,20 Q50,10 100,20 L100,25 Q50,15 0,25 Z" fill="url(#goldLines)" />
            <path d="M0,60 Q50,50 100,60 L100,65 Q50,55 0,65 Z" fill="url(#goldLines)" />
          </svg>
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-balance">
                Master Your Sound with Banafix
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Professional music education platform offering expert instruction across 20+ instruments with certified
                tutors and structured curriculum.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300"
                >
                  Enroll Now
                </Button>
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300"
                >
                  Book Trial
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center bg-accent/20 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
                  <span className="text-accent font-medium">3,200+ Alumni</span>
                </div>
                <div className="flex items-center bg-accent/20 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
                  <span className="text-accent font-medium">20+ Instruments</span>
                </div>
                <div className="flex items-center bg-accent/20 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
                  <span className="text-accent font-medium">50+ Expert Tutors</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-blue-800 rounded-lg overflow-hidden group">
                <Image
                  src="https://images.unsplash.com/photo-1607004351911-c24a3f6d38ba?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Students learning various instruments"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="rounded-full w-16 h-16 bg-accent hover:bg-accent/90 hover:scale-110 transition-all duration-300"
                  >
                    <Play className="h-6 w-6 text-accent-foreground ml-1" />
                  </Button>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
            <div className="text-sm font-medium text-muted-foreground">Trusted by leading institutions</div>
            <Badge variant="outline" className="border-accent text-accent bg-accent/10">
              <Award className="w-3 h-3 mr-1" />
              Certified Partner
            </Badge>
            <Badge variant="outline" className="border-accent text-accent bg-accent/10">
              <Star className="w-3 h-3 mr-1" />
              Accredited Program
            </Badge>
            <Badge variant="outline" className="border-accent text-accent bg-accent/10">
              <GraduationCap className="w-3 h-3 mr-1" />
              Award Winner 2024
            </Badge>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Explore Instruments</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose from our wide range of instruments and start your musical journey today
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {instruments.map((instrument) => (
              <Card
                key={instrument.name}
                className="group hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
              >
                <div className="relative h-32 overflow-hidden">
                  <Image
                    src={instrument.image || "/placeholder.svg"}
                    alt={`${instrument.name} instrument`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <Badge
                    variant="secondary"
                    className="absolute top-2 right-2 text-xs bg-accent/90 text-accent-foreground"
                  >
                    {instrument.seats}/{instrument.total} seats
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <instrument.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{instrument.name}</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {instrument.levels.map((level) => (
                      <Badge key={level} variant="outline" className="text-xs">
                        {level}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-primary">From {instrument.price}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Seats Available</span>
                      <span>{instrument.seats} left</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(instrument.seats / instrument.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="outline" size="sm" className="w-full text-xs bg-transparent">
                      View Curriculum
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Choose Your Learning Style</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Flexible training options designed to fit your schedule and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {trainingModes.map((mode) => (
              <Card key={mode.title} className="text-center hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={mode.image || "/placeholder.svg"}
                    alt={`${mode.title} training mode`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <mode.icon className="h-8 w-8 mx-auto mb-2" />
                    <h3 className="font-semibold text-lg">{mode.title}</h3>
                  </div>
                </div>
                <CardContent className="p-8">
                  <p className="text-muted-foreground mb-6">{mode.description}</p>
                  <ul className="space-y-2 mb-6">
                    {mode.features.map((feature) => (
                      <li key={feature} className="flex items-center justify-center text-sm">
                        <CheckCircle className="h-4 w-4 text-accent mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full bg-transparent">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Compare All Training Modes
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2">Upcoming Sessions</h2>
              <p className="text-muted-foreground">Join these sessions starting soon</p>
            </div>
            <Button variant="outline">View All Sessions</Button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4">
            {upcomingSessions.map((session, index) => (
              <Card key={index} className="min-w-[280px] hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="bg-accent text-accent-foreground">{session.seats} seats left</Badge>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{session.date}</div>
                      <div>{session.time}</div>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{session.course}</h3>
                  <p className="text-sm text-muted-foreground mb-3">with {session.instructor}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">{session.price}</span>
                    <Button size="sm">Enroll</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">What Our Students Say</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real stories from our community of musicians
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {testimonial.type === "quote" ? (
                    <>
                      <Quote className="h-8 w-8 text-accent mb-4" />
                      <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="relative w-10 h-10 mr-3">
                            <Image
                              src={testimonial.avatar || "/placeholder.svg"}
                              alt={testimonial.author}
                              fill
                              sizes="40px"
                              className="object-cover rounded-full"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-primary">{testimonial.author}</div>
                            <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                          </div>
                        </div>
                        <div className="flex">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="relative">
                      <div className="aspect-video bg-muted rounded-lg mb-4 relative overflow-hidden">
                        <Image
                          src={testimonial.thumbnail || "/placeholder.svg"}
                          alt="Video testimonial thumbnail"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button size="sm" className="rounded-full w-12 h-12 bg-accent hover:bg-accent/90">
                            <Play className="h-4 w-4 text-accent-foreground ml-0.5" />
                          </Button>
                        </div>
                        <Badge className="absolute top-2 right-2 bg-black/70 text-white text-xs">
                          {testimonial.duration}
                        </Badge>
                      </div>
                      <div className="font-semibold text-primary">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Why Choose Banafix</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the difference with our comprehensive approach to music education
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyBanafix.map((item) => (
              <div key={item.title} className="text-center group">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
                  <item.icon className="h-8 w-8 text-primary group-hover:text-accent-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Quick answers to common questions about our programs
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4 mb-8">
            {faqPreview.map((faq, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-0">
                  <details className="group">
                    <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                      <span className="font-semibold">{faq.question}</span>
                      <ChevronDown className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-6 text-muted-foreground">{faq.answer}</div>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline">View All FAQs</Button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] opacity-5"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">Stay in Tune</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Get music tips, course updates, and early access to new programs delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="px-8 bg-primary text-primary-foreground hover:bg-primary/90">Subscribe</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
