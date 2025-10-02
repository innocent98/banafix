"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Do I need to own an instrument?",
    answer:
      "No, all instruments and equipment are provided during on-campus sessions. For home training, we can arrange instrument rental if needed.",
  },
  {
    question: "What styles of music do you teach?",
    answer:
      "We teach various styles including classical, jazz, pop, rock, and traditional African music. Our curriculum is flexible to match your interests.",
  },
  {
    question: "How do online lessons work?",
    answer:
      "Online lessons are conducted via video call with real-time feedback. You'll receive digital materials and recorded sessions for practice.",
  },
  {
    question: "Do you teach students with no prior experience?",
    answer:
      "Absolutely! We welcome complete beginners and have specialized programs designed for those just starting their musical journey.",
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
