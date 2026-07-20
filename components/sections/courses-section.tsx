"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Guitar, Piano, Drum, Mic, ArrowRight } from "lucide-react"
import Link from "next/link"

const instruments = [
  {
    name: "Guitar",
    icon: Guitar,
    levels: ["Beginner", "Intermediate"],
    price: "₦25,000",
    seats: 8,
    total: 20,
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=2070&auto=format&fit=crop",
  },
  {
    name: "Piano",
    icon: Piano,
    levels: ["Beginner", "Advanced"],
    price: "₦30,000",
    seats: 3,
    total: 15,
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=2070&auto=format&fit=crop",
  },
  {
    name: "Drums",
    icon: Drum,
    levels: ["Beginner", "Intermediate"],
    price: "₦35,000",
    seats: 12,
    total: 25,
    image: "https://images.unsplash.com/photo-1668275888208-76d57d3357f9?q=80&w=2070&auto=format&fit=crop",
  },
  {
    name: "Vocals",
    icon: Mic,
    levels: ["All Levels"],
    price: "₦20,000",
    seats: 15,
    total: 30,
    image: "https://images.unsplash.com/photo-1703144569611-8196c083bbc0?q=80&w=2070&auto=format&fit=crop",
  },
]

export function CoursesSection() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6 text-slate-900 tracking-tighter">
            Courses for all skill levels
          </h2>
          <p className="text-slate-600 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            We offer a wide variety of instruments, so you can find the one that fits you best. Join us and kickstart your musical journey today.
          </p>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-16">
          {instruments.map((instrument, index) => (
            <Card
              key={instrument.name}
              className="group hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden bg-white rounded-3xl shadow-lg transform hover:scale-105 hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image Section */}
              <div className="relative h-44 lg:h-48 overflow-hidden">
                <Image
                  src={instrument.image}
                  alt={`${instrument.name} classes`}
                  fill
                  className="object-cover transition-transform duration-700 rounded-t-3xl group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Level Badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/95 text-slate-900 backdrop-blur-sm text-sm font-semibold px-3 py-1.5 rounded-full shadow-lg">
                    {instrument.levels[0]}
                  </Badge>
                </div>

                {/* Icon */}
                <div className="absolute top-4 left-4 w-12 h-12 bg-amber-500/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <instrument.icon className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Content Section */}
              <CardContent className="p-5">
                <div className="mb-3">
                  <h3 className="font-heading font-bold text-lg lg:text-xl text-slate-900 mb-1">
                    {instrument.name}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">Multiple skill levels</p>
                </div>

                {/* Enroll */}
                <div className="py-3 border-t border-slate-100">
                  <Link href={`/courses/${instrument.name.toLowerCase()}`} className="block cursor-pointer">
                    <Button
                      size="sm"
                      className="w-full bg-slate-900 hover:bg-amber-500 text-white transition-all duration-300 cursor-pointer rounded-full px-4 font-semibold shadow-lg"
                      >
                      Enroll
                    </Button>
                  </Link>
                </div>

                {/* Seats Progress */}
                {/* <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-sm text-slate-600 mb-3 font-medium">
                    <span>Available seats</span>
                    <span className="text-amber-600 font-bold">{instrument.seats} left</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(instrument.seats / instrument.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 font-medium">
                    {Math.round((instrument.seats / instrument.total) * 100)}% available
                  </div>
                </div> */}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link href={'/courses'}>
            <Button
              variant="outline"
              size="lg"
              rounded="full"
              className="transform hover:scale-105 shadow-xl hover:shadow-2xl cursor-pointer"
              >
              View All Courses
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
