"use client"

import { Award, BookOpen, Network, Clock, Star, GraduationCap } from "lucide-react"

const features = [
  {
    title: "Experienced Tutors",
    icon: Award,
    description: "Learn from certified professionals with years of expertise",
  },
  {
    title: "Structured Curriculum",
    icon: BookOpen,
    description: "Progressive learning paths designed for success",
  },
  {
    title: "Marketing Growth",
    icon: Network,
    description: "Build your network and grow as a musician",
  },
  {
    title: "Flexible Schedule",
    icon: Clock,
    description: "Classes that adapt to your lifestyle",
  },
  {
    title: "A Blend of Plans",
    icon: Star,
    description: "Choose from various training modes",
  },
  {
    title: "Positive-driven Teaching",
    icon: GraduationCap,
    description: "Encouraging environment for all levels",
  },
]

export function WhyChooseSection() {
  return (
    <section className="py-12 lg:py-16 bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6 text-slate-900 tracking-tighter">
            Why choose Marviotone?
          </h2>
          <p className="text-slate-600 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            Discover what makes us the preferred choice for music education in Nigeria
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center group animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white border-2 border-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:border-amber-400 group-hover:bg-amber-50 transition-all duration-500 shadow-lg group-hover:shadow-xl transform group-hover:scale-110">
                <feature.icon className="h-10 w-10 lg:h-12 lg:w-12 text-slate-700 group-hover:text-amber-500 transition-colors duration-300" />
              </div>
              <h3 className="font-heading font-bold text-xl lg:text-2xl mb-3 text-slate-900">
                {feature.title}
              </h3>
              <p className="text-base lg:text-lg text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
