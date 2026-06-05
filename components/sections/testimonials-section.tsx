"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Star } from "lucide-react"

const testimonials = [
  {
    content:
      "I've been interested in learning how to play the violin for a long time now. Thanks to Banafix, I can learn at a pace that's comfortable for me. I'm so glad I joined this bass program!",
    author: "Adunni Okafor",
    role: "Piano Student",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1501027874987-73e9c32f46a0?q=80&w=2070&auto=format&fit=crop",
  },
  {
    content:
      "The flexibility of home training made it possible for me to learn while managing my busy schedule. The instructors are patient and knowledgeable.",
    author: "Fatima Hassan",
    role: "Vocal Student",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop",
  },
  {
    content:
      "Banafix transformed my musical journey. The structured approach and expert guidance helped me progress faster than I ever imagined!",
    author: "James Okoro",
    role: "Guitar Graduate",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070&auto=format&fit=crop",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-12 lg:py-16 bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6 text-slate-900 tracking-tighter">
            What Our Members are saying...
          </h2>
          <p className="text-slate-600 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            Real experiences from our community of passionate musicians
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-white hover:shadow-xl transition-all duration-300 border border-slate-200 rounded-2xl"
            >
              <CardContent className="p-6 lg:p-8">
                {/* Star Rating */}
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Testimonial Content */}
                <p className="text-slate-700 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                {/* Author Info */}
                <div className="flex items-center">
                  <div className="relative w-12 h-12 mr-4 flex-shrink-0">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      fill
                      className="object-cover rounded-full"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
