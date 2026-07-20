"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Users, Video, Home, CheckCircle, ArrowRight } from "lucide-react"

const trainingModes = [
  {
    title: "One-on-One",
    description: "Personalized instruction tailored to your pace and goals",
    features: ["Custom curriculum", "Flexible scheduling", "Direct feedback"],
    icon: Users,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "Online Classes",
    description: "Learn from anywhere with our interactive virtual sessions",
    features: ["Live streaming", "Recorded sessions", "Digital resources"],
    icon: Video,
    image: "https://images.unsplash.com/photo-1623076189461-f7706b741c04?q=80&w=2071&auto=format&fit=crop",
  },
  {
    title: "Home Training",
    description: "Professional instructors come to your location",
    features: ["Convenient location", "Personal equipment", "Family discounts"],
    icon: Home,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070&auto=format&fit=crop",
  },
]

export function TrainingModesSection() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6 text-slate-900 tracking-tighter">
            Learn From Anywhere
          </h2>
          <p className="text-slate-600 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            Choose the learning format that works best for you whether online, in-person, or at home
          </p>
        </div>

        {/* Training Mode Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {trainingModes.map((mode) => (
            <Card
              key={mode.title}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-amber-200 bg-white rounded-2xl"
            >
              <div className="relative h-56 lg:h-64 overflow-hidden">
                <Image
                  src={mode.image}
                  alt={`${mode.title} training`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <mode.icon className="h-10 w-10 mb-3" />
                  <h3 className="font-bold text-xl lg:text-2xl">{mode.title}</h3>
                </div>
              </div>

              <CardContent className="p-6 lg:p-8">
                <p className="text-slate-600 mb-6 leading-relaxed">{mode.description}</p>
                <ul className="space-y-3 mb-6">
                  {mode.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm">
                      <CheckCircle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                {/* <Button
                  variant="outline"
                  className="w-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-semibold rounded-full transition-all duration-300"
                >
                  Learn More
                </Button> */}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-4xl p-10 lg:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-hero-pattern bg-pattern"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
          <div className="relative">
            <h3 className="font-heading text-3xl lg:text-4xl font-bold mb-6 tracking-tighter">
              Over 58 students trust Banafix with their bass training
            </h3>
            <p className="text-slate-300 text-lg lg:text-xl mb-10 max-w-3xl mx-auto leading-relaxed font-light">
              Join thousands of satisfied students who have transformed their musical abilities with our expert guidance
            </p>
            <Button
              size="lg"
              variant="primary"
              rounded="full"
              className="shadow-2xl hover:shadow-glow transform hover:scale-105"
            >
              Start Your Journey
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
