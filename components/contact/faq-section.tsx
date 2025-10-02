"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, HelpCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export function FAQSection() {
  const quickFAQs = [
    {
      question: "How do I enroll in a course?",
      answer: "You can enroll online through our enrollment page or visit our campus for in-person registration.",
    },
    {
      question: "What instruments do you teach?",
      answer: "We offer lessons in guitar, piano, drums, vocals, violin, and music production.",
    },
    {
      question: "Do you offer trial lessons?",
      answer: "Yes! We offer free 30-minute trial lessons for all new students.",
    },
  ]

  return (
    <section className="pb-16 pt-0 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-amber-100 rounded-2xl">
              <HelpCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-3xl lg:text-5xl font-heading font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Can't find what you're looking for? Check out our comprehensive FAQ section or reach out to our support team.
          </p>
        </div>

        {/* Quick FAQs Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {quickFAQs.map((faq, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg rounded-3xl bg-white hover:shadow-xl transition-all duration-300 group hover:scale-105"
            >
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${
                    index === 0 ? 'bg-blue-100' : index === 1 ? 'bg-purple-100' : 'bg-green-100'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-purple-500' : 'bg-green-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {faq.question}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
          <CardContent className="p-12 text-center text-white">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl lg:text-3xl font-heading font-bold mb-4">
                Still have questions?
              </h3>
              <p className="text-blue-100 mb-8 text-lg leading-relaxed">
                Browse our complete FAQ section with detailed answers to all your questions about courses, enrollment, pricing, and more.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-blue-600 border-white hover:bg-blue-50 rounded-xl font-semibold px-8 group"
                >
                  <Link href="/faqs">
                    View All FAQs
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600 rounded-xl font-semibold px-8"
                >
                  Contact Support
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}