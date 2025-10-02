"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Star, ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-hero-pattern bg-pattern"></div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-transparent to-transparent"></div>

      <div className="container mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8 lg:gap-12 items-center min-h-screen py-12 lg:py-16">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 backdrop-blur-sm px-6 py-2.5 text-sm font-medium rounded-full shadow-glow mb-8">
              🎵 Nigeria's Premier Music Academy
            </Badge>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 lg:mb-8 leading-tight tracking-tighter">
              Master Violin and String Instruments With{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500">
                Banafix
              </span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 mb-10 lg:mb-12 leading-relaxed max-w-3xl mx-auto lg:mx-0 font-light">
              Whether you're a complete beginner or looking to refine your skills, our expert tutors will guide you on every step of your musical journey.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 mb-12 lg:mb-16 justify-center lg:justify-start">
              <Button
                size="xl"
                variant="primary"
                rounded="full"
                className="transform hover:scale-105 shadow-2xl"
              >
                Get Started
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button
                size="xl"
                className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transform hover:scale-105"
                rounded="full"
              >
                View Courses
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 sm:gap-12 max-w-lg mx-auto lg:mx-0">
              <div className="text-center lg:text-left group">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-400 mb-2 group-hover:text-amber-300 transition-colors font-heading">
                  3.2K+
                </div>
                <div className="text-sm sm:text-base text-slate-300 font-medium">Alumni</div>
              </div>
              <div className="text-center lg:text-left group">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-400 mb-2 group-hover:text-amber-300 transition-colors font-heading">
                  20+
                </div>
                <div className="text-sm sm:text-base text-slate-300 font-medium">Instruments</div>
              </div>
              <div className="text-center lg:text-left group">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-400 mb-2 group-hover:text-amber-300 transition-colors font-heading">
                  50+
                </div>
                <div className="text-sm sm:text-base text-slate-300 font-medium">Expert Tutors</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative lg:justify-self-end lg:w-full flex justify-center lg:justify-end">
            <div className="relative h-[500px] lg:h-[600px] w-[300px] lg:w-[350px]">
              <Image
                src="/images/violin.png"
                alt="Elegant violin"
                fill
                priority
                className="object-contain object-center opacity-90"
                sizes="(max-width: 1024px) 300px, 350px"
                style={{
                  maskImage: 'radial-gradient(ellipse 70% 80% at center, black 30%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at center, black 30%, transparent 80%)'
                }}
              />
            </div>

            {/* Minimal floating card */}
            <div className="absolute bottom-8 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">4.9/5</div>
                  <div className="text-xs text-slate-600">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
