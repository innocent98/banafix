"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, ChevronUp, MessageCircle, Phone } from "lucide-react"

export default function FAQsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [expandedItems, setExpandedItems] = useState<number[]>([])

  const categories = [
    { id: "all", name: "All FAQs", count: 24 },
    { id: "admissions", name: "Admissions", count: 6 },
    { id: "payments", name: "Payments", count: 5 },
    { id: "sessions", name: "Sessions", count: 7 },
    { id: "online-vs-home", name: "Online vs Home", count: 4 },
    { id: "policies", name: "Policies", count: 2 },
  ]

  const faqs = [
    {
      id: 1,
      category: "admissions",
      question: "What are the admission requirements for Banafix courses?",
      answer:
        "No prior musical experience is required for beginner courses. For intermediate and advanced levels, we conduct a brief assessment to ensure proper placement. You must be at least 8 years old to enroll.",
      tags: ["requirements", "age", "assessment"],
    },
    {
      id: 2,
      category: "admissions",
      question: "How do I know which course level is right for me?",
      answer:
        "We offer a free 15-minute consultation where our instructors assess your current skill level and recommend the most suitable course. You can also take our online skill assessment quiz.",
      tags: ["level", "consultation", "assessment"],
    },
    {
      id: 3,
      category: "payments",
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit/debit cards, bank transfers, USSD payments, and PayPal. Payment plans are available for courses longer than 3 months.",
      tags: ["payment", "methods", "plans"],
    },
    {
      id: 4,
      category: "payments",
      question: "Can I get a refund if I'm not satisfied?",
      answer:
        "Yes! We offer a 14-day money-back guarantee for all courses. If you're not completely satisfied within the first two weeks, we'll provide a full refund.",
      tags: ["refund", "guarantee", "satisfaction"],
    },
    {
      id: 5,
      category: "sessions",
      question: "How long are the training sessions?",
      answer:
        "Session duration varies by course type: One-on-One sessions are 60 minutes, Group sessions are 90 minutes, and Online sessions are 45 minutes. Home training sessions are typically 75 minutes.",
      tags: ["duration", "session", "timing"],
    },
    {
      id: 6,
      category: "sessions",
      question: "Can I reschedule my sessions?",
      answer:
        "Yes, you can reschedule sessions up to 24 hours in advance through your student dashboard or by contacting your instructor directly. Emergency rescheduling may be accommodated on a case-by-case basis.",
      tags: ["reschedule", "flexibility", "dashboard"],
    },
    {
      id: 7,
      category: "online-vs-home",
      question: "What's the difference between Online and Home training?",
      answer:
        "Online training is conducted via video call with digital resources, perfect for theory and technique. Home training brings an instructor to your location with physical instruments, ideal for hands-on learning.",
      tags: ["online", "home", "difference"],
    },
    {
      id: 8,
      category: "online-vs-home",
      question: "Do I need my own instrument for online sessions?",
      answer:
        "For most instruments, yes. However, we provide digital alternatives for piano (virtual keyboard) and offer instrument rental programs. Vocal training requires no additional equipment.",
      tags: ["instrument", "equipment", "rental"],
    },
    {
      id: 9,
      category: "policies",
      question: "What is your attendance policy?",
      answer:
        "We require at least 80% attendance for course completion certification. Missed sessions can be made up within the course duration, subject to instructor availability.",
      tags: ["attendance", "policy", "certification"],
    },
    {
      id: 10,
      category: "policies",
      question: "Can I switch instructors during my course?",
      answer:
        "Yes, if you're not comfortable with your assigned instructor, we can arrange a switch within 48 hours. We want to ensure the best learning experience for every student.",
      tags: ["instructor", "switch", "comfort"],
    },
  ]

  const filteredFAQs = faqs.filter((faq) => {
    const categoryMatch = selectedCategory === "all" || faq.category === selectedCategory
    const searchMatch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return categoryMatch && searchMatch
  })

  const toggleExpanded = (id: number) => {
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Frequently Asked Questions</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Find answers to common questions about our courses, policies, and services
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              {category.name}
              <Badge variant="secondary" className="ml-1">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFAQs.map((faq) => (
            <Card key={faq.id} className="overflow-hidden">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full p-6 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                    <div className="flex flex-wrap gap-2">
                      {faq.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {expandedItems.includes(faq.id) ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground ml-4" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground ml-4" />
                  )}
                </button>

                {expandedItems.includes(faq.id) && (
                  <div className="px-6 pb-6 border-t">
                    <p className="text-muted-foreground leading-relaxed pt-4">{faq.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Escalation */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold font-sora mb-4">Still stuck?</h2>
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? Our support team is here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat with Us
                </Button>
                <Button size="lg" variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Phone className="h-5 w-5" />
                  WhatsApp Support
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Average response time: Under 2 hours</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
