"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/sections/hero-section"
import { TrustBanner } from "@/components/sections/trust-banner"
import { CoursesSection } from "@/components/sections/courses-section"
import { WhyChooseSection } from "@/components/sections/why-choose-section"
import { TrainingModesSection } from "@/components/sections/training-modes-section"
import { TestimonialsSection } from "@/components/sections/testimonials-section"
import { FAQSection } from "@/components/sections/faq-section"
import { CTASection } from "@/components/sections/cta-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <TrustBanner />
      <CoursesSection />
      <WhyChooseSection />
      <TrainingModesSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
