"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-12 lg:py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-hero-pattern bg-pattern"></div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-transparent to-transparent"></div>

      <div className="container mx-auto px-2 sm:px-4 lg:px-6 text-center relative z-10">
        <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 lg:mb-8 tracking-tighter">
          Ready to Start Your Musical Journey?
        </h2>
        <p className="text-slate-300 text-lg lg:text-xl mb-12 lg:mb-16 max-w-3xl mx-auto leading-relaxed font-light">
          Join thousands of students who have discovered their musical passion with Marviotone. Get started today with a free trial session.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button
            size="xl"
            variant="primary"
            rounded="full"
            className="shadow-2xl hover:shadow-glow transform hover:scale-105"
          >
            Book Free Trial
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
          <Button
            size="xl"
            className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transform hover:scale-105"
            rounded="full"
          >
            View All Courses
          </Button>
        </div>
      </div>
    </section>
  )
}
