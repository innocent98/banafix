"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, Mail, MessageCircle, Sparkles, HeadphonesIcon } from "lucide-react"

export function ContactHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background with Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl transform translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-2xl transform -translate-x-32 translate-y-32"></div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-16 lg:py-20">
        <div className="text-center text-white mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <HeadphonesIcon className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-heading font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Get in Touch
            </h1>
          </div>
          <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-8">
            Have questions about our programs? Need help with enrollment? Our friendly team is here to help you start your musical journey.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-blue-200 mb-12">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Available 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Expert guidance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Quick response</span>
            </div>
          </div>
        </div>

        {/* Quick Contact Actions */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 group hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-3">Call Us Now</h3>
              <p className="text-blue-100 mb-6 text-sm">Speak directly with our admissions team</p>
              <Button
                variant="outline"
                className="w-full bg-white/20 border-white/30 text-white hover:bg-white hover:text-slate-900 transition-all duration-300 rounded-xl backdrop-blur-sm"
              >
                0903 856 3822
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 group hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-3">WhatsApp Chat</h3>
              <p className="text-blue-100 mb-6 text-sm">Get instant support via WhatsApp</p>
              <Button
                variant="outline"
                className="w-full bg-green-500/20 border-green-400/30 text-white hover:bg-green-500 hover:text-white transition-all duration-300 rounded-xl backdrop-blur-sm"
              >
                Chat Now
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 group hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-3">Email Support</h3>
              <p className="text-blue-100 mb-6 text-sm">Send us your detailed inquiries</p>
              <Button
                variant="outline"
                className="w-full bg-purple-500/20 border-purple-400/30 text-white hover:bg-purple-500 hover:text-white transition-all duration-300 rounded-xl backdrop-blur-sm"
              >
                info@banafix.com
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-8 lg:h-12">
          <path d="M0,60 C300,120 500,0 800,60 C1000,120 1200,0 1200,60 L1200,120 L0,120 Z" className="fill-slate-50"></path>
        </svg>
      </div>
    </section>
  )
}