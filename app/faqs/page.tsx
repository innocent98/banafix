"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, ChevronUp, MessageCircle, Phone } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export default function FAQsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [expandedItems, setExpandedItems] = useState<number[]>([])

  const categories = [
    { id: "all", name: "All FAQs", count: 14 },
    { id: "admissions", name: "Admissions", count: 3 },
    { id: "payments", name: "Payments", count: 2 },
    { id: "sessions", name: "Sessions", count: 4 },
    { id: "online-vs-home", name: "Online vs Home", count: 3 },
    { id: "policies", name: "Policies", count: 2 },
  ]

  const faqs = [
    {
      id: 1,
      category: "admissions",
      question: "Who can enroll?",
      answer:
        "Interested candidates: children, teenagers, and adults. Beginners are absolutely welcome.",
      tags: ["enroll", "age", "beginners"],
    },
    {
      id: 2,
      category: "admissions",
      question: "Do I need prior experience?",
      answer:
        "No. We specialize in discovering and developing raw musical potential.",
      tags: ["experience", "beginners"],
    },
    {
      id: 3,
      category: "sessions",
      question: "What learning options do you offer?",
      answer:
        "We offer flexible options: in-center classes, home lessons, and online sessions.",
      tags: ["in-center", "home", "online"],
    },
    {
      id: 4,
      category: "online-vs-home",
      question: "Are online classes effective?",
      answer:
        "Yes, our online classes are interactive, personalized, and results-driven.",
      tags: ["online", "effectiveness"],
    },
    {
      id: 5,
      category: "sessions",
      question: "How are classes scheduled?",
      answer:
        "Schedules are flexible and arranged to fit your availability.",
      tags: ["schedule", "flexibility"],
    },
    {
      id: 6,
      category: "admissions",
      question: "How do I enroll or get pricing?",
      answer:
        "Simply contact us via phone, WhatsApp, or the website to get started.",
      tags: ["enroll", "pricing", "contact"],
    },
    // {
    //   id: 7,
    //   category: "payments",
    //   question: "What payment methods do you accept?",
    //   answer:
    //     "We accept all major credit/debit cards, bank transfers, USSD payments, and PayPal. Payment plans are available for courses longer than 3 months.",
    //   tags: ["payment", "methods", "plans"],
    // },
    // {
    //   id: 8,
    //   category: "payments",
    //   question: "Can I get a refund if I'm not satisfied?",
    //   answer:
    //     "Yes! We offer a 14-day money-back guarantee for all courses. If you're not completely satisfied within the first two weeks, we'll provide a full refund.",
    //   tags: ["refund", "guarantee", "satisfaction"],
    // },
    // {
    //   id: 9,
    //   category: "sessions",
    //   question: "How long are the training sessions?",
    //   answer:
    //     "Session duration varies by course type: One-on-One sessions are 60 minutes, Group sessions are 90 minutes, and Online sessions are 45 minutes. Home training sessions are typically 75 minutes.",
    //   tags: ["duration", "session", "timing"],
    // },
    // {
    //   id: 10,
    //   category: "sessions",
    //   question: "Can I reschedule my sessions?",
    //   answer:
    //     "Yes, you can reschedule sessions up to 24 hours in advance through your student dashboard or by contacting your instructor directly. Emergency rescheduling may be accommodated on a case-by-case basis.",
    //   tags: ["reschedule", "flexibility", "dashboard"],
    // },
    // {
    //   id: 11,
    //   category: "online-vs-home",
    //   question: "What's the difference between Online and Home training?",
    //   answer:
    //     "Online training is conducted via video call with digital resources, perfect for theory and technique. Home training brings an instructor to your location with physical instruments, ideal for hands-on learning.",
    //   tags: ["online", "home", "difference"],
    // },
    // {
    //   id: 12,
    //   category: "online-vs-home",
    //   question: "Do I need my own instrument for online sessions?",
    //   answer:
    //     "For most instruments, yes. However, we provide digital alternatives for piano (virtual keyboard) and offer instrument rental programs. Vocal training requires no additional equipment.",
    //   tags: ["instrument", "equipment", "rental"],
    // },
    // {
    //   id: 13,
    //   category: "policies",
    //   question: "What is your attendance policy?",
    //   answer:
    //     "We require at least 80% attendance for course completion certification. Missed sessions can be made up within the course duration, subject to instructor availability.",
    //   tags: ["attendance", "policy", "certification"],
    // },
    // {
    //   id: 14,
    //   category: "policies",
    //   question: "Can I switch instructors during my course?",
    //   answer:
    //     "Yes, if you're not comfortable with your assigned instructor, we can arrange a switch within 48 hours. We want to ensure the best learning experience for every student.",
    //   tags: ["instructor", "switch", "comfort"],
    // },
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
      <Navigation />
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
        {/* <div className="flex flex-wrap gap-2 mb-8 justify-center">
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
        </div> */}

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
                <a
                  href="https://wa.me/2349038563822"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonVariants({ size: "lg" })} flex items-center gap-2`}
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat with Us
                </a>
                <a
                  href="https://wa.me/2349038563822"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonVariants({ size: "lg", variant: "outline" })} flex items-center gap-2 bg-transparent`}
                >
                  <Phone className="h-5 w-5" />
                  WhatsApp Support
                </a>
              </div>
              {/* <p className="text-sm text-muted-foreground mt-4">Average response time: Under 2 hours</p> */}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
