"use client"

import { useState } from "react"
import { Search, Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCoursesOpen, setIsCoursesOpen] = useState(false)

  const instruments = [
    "Guitar",
    "Piano",
    "Drums",
    "Saxophone",
    "Violin",
    "Bass Guitar",
    "Flute",
    "Trumpet",
    "Vocals",
    "Keyboard",
    "Cello",
    "Clarinet",
  ]

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-amber-500 text-white text-center py-2.5 px-2 text-xs sm:text-sm font-medium">
        <span className="inline-block">Fall Session – 5 seats left in Piano Beginner</span>
        <span className="hidden sm:inline"> • </span>
        <span className="inline-block">Early Bird Discount Ends Soon!</span>
      </div>

      {/* Main Navigation */}
      <nav className="border-b border-slate-200 sticky top-0 z-50 backdrop-blur-lg bg-white/95">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Banafix
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-8 xl:space-x-10">
              <Link 
                href="/" 
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors relative group"
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>

              {/* Courses Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors relative group"
                  onMouseEnter={() => setIsCoursesOpen(true)}
                  onMouseLeave={() => setIsCoursesOpen(false)}
                >
                  Courses 
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isCoursesOpen ? 'rotate-180' : ''}`} />
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
                </button>

                {isCoursesOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 animate-in fade-in slide-in-from-top-2 duration-200"
                    onMouseEnter={() => setIsCoursesOpen(true)}
                    onMouseLeave={() => setIsCoursesOpen(false)}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {instruments.map((instrument) => (
                        <Link
                          key={instrument}
                          href={`/courses/${instrument.toLowerCase().replace(' ', '-')}`}
                          className="text-sm text-slate-700 hover:text-amber-500 transition-colors py-1.5 hover:translate-x-1 transform transition-transform duration-200"
                        >
                          {instrument}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-5 pt-5 border-t border-slate-200">
                      <Link 
                        href="/courses" 
                        className="text-amber-500 hover:text-amber-600 font-semibold text-sm flex items-center group"
                      >
                        View all courses 
                        <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link 
                href="/instructors" 
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors relative group"
              >
                Instructors
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              
              {/* <Link 
                href="/admissions" 
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors relative group"
              >
                Admissions
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              
              <Link 
                href="/events" 
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors relative group"
              >
                Events
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
              </Link> */}
              
              <Link 
                href="/contact" 
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors relative group"
              >
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button 
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              <div className="hidden md:flex items-center space-x-3">
                <Link href='/courses'>
                  <Button 
                    size="sm" 
                    className="bg-slate-900 hover:bg-amber-500 text-white font-semibold px-6 rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Enroll Now
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 py-6 animate-in fade-in slide-in-from-top duration-200">
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/" 
                  className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors px-2 py-2 hover:bg-slate-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                
                <Link 
                  href="/courses" 
                  className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors px-2 py-2 hover:bg-slate-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Courses
                </Link>
                
                <Link 
                  href="/instructors" 
                  className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors px-2 py-2 hover:bg-slate-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Instructors
                </Link>
                
                {/* <Link 
                  href="/admissions" 
                  className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors px-2 py-2 hover:bg-slate-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admissions
                </Link>
                
                <Link 
                  href="/events" 
                  className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors px-2 py-2 hover:bg-slate-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Events
                </Link> */}
                
                <Link 
                  href="/contact" 
                  className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors px-2 py-2 hover:bg-slate-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>

                <div className="flex flex-col space-y-3 pt-4 border-t border-slate-200">
                  <Link href='/courses' onClick={() => setIsMenuOpen(false)}>
                    <Button 
                      size="lg" 
                      className="w-full bg-slate-900 hover:bg-amber-500 text-white font-semibold rounded-full transition-all duration-300"
                    >
                      Enroll Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}