"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Who can enroll?",
    answer:
      "Interested candidates: children, teenagers, and adults. Beginners are absolutely welcome.",
  },
  {
    question: "Do I need prior experience?",
    answer:
      "No. We specialize in discovering and developing raw musical potential.",
  },
  {
    question: "What learning options do you offer?",
    answer:
      "We offer flexible options: in-center classes, home lessons, and online sessions.",
  },
  {
    question: "Are online classes effective?",
    answer:
      "Yes, our online classes are interactive, personalized, and results-driven.",
  },
  {
    question: "How are classes scheduled?",
    answer:
      "Schedules are flexible and arranged to fit your availability.",
  },
  {
    question: "How do I enroll or get pricing?",
    answer:
      "Simply contact us via phone, WhatsApp, or the website to get started.",
  },
]

export function FAQSection() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6 text-slate-900 tracking-tighter">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about our programs and services
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-4 mb-12">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="bg-white border border-slate-200 hover:border-amber-200 transition-colors rounded-2xl"
            >
              <CardContent className="p-0">
                <details className="group">
                  <summary className="flex items-center justify-between p-5 lg:p-6 cursor-pointer hover:bg-slate-50 transition-colors rounded-2xl">
                    <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-5 lg:px-6 pb-5 lg:pb-6 text-slate-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            rounded="full"
            className="transform hover:scale-105"
          >
            View All FAQs
          </Button>
        </div>
      </div>
    </section>
  )
}
