"use client"

import { Badge } from "@/components/ui/badge"
import { Award, Star, GraduationCap } from "lucide-react"

export function TrustBanner() {
  return (
    <section className="py-4 lg:py-6 bg-slate-50 border-b border-slate-200">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex flex-wrap justify-center items-center gap-4 lg:gap-8 text-center">
          <span className="text-xs sm:text-sm font-medium text-slate-600">
            Trusted by leading institutions
          </span>
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-600 bg-amber-50 text-xs"
          >
            <Award className="w-3 h-3 mr-1" />
            Certified
          </Badge>
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-600 bg-amber-50 text-xs"
          >
            <Star className="w-3 h-3 mr-1" />
            Accredited
          </Badge>
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-600 bg-amber-50 text-xs"
          >
            <GraduationCap className="w-3 h-3 mr-1" />
            Award Winner 2024
          </Badge>
        </div>
      </div>
    </section>
  )
}
