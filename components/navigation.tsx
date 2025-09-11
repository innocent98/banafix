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
      <div className="bg-accent text-accent-foreground text-center py-2 px-4 text-sm font-medium">
        Fall Session – 5 seats left in Piano Beginner • Early Bird Discount Ends Soon!
      </div>

      {/* Main Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-heading font-bold text-primary">Banafix</div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="/" className="text-foreground hover:text-primary transition-colors">
                Home
              </a>

              {/* Courses Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center text-foreground hover:text-primary transition-colors"
                  onMouseEnter={() => setIsCoursesOpen(true)}
                  onMouseLeave={() => setIsCoursesOpen(false)}
                >
                  Courses <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {isCoursesOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-lg p-6"
                    onMouseEnter={() => setIsCoursesOpen(true)}
                    onMouseLeave={() => setIsCoursesOpen(false)}
                  >
                    <div className="grid grid-cols-3 gap-4">
                      {instruments.map((instrument) => (
                        <a
                          key={instrument}
                          href={`/courses/${instrument.toLowerCase()}`}
                          className="text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {instrument}
                        </a>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <a href="/courses" className="text-primary font-medium text-sm">
                        View all courses →
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <a href="/instructors" className="text-foreground hover:text-primary transition-colors">
                Instructors
              </a>
              <a href="/admissions" className="text-foreground hover:text-primary transition-colors">
                Admissions
              </a>
              <a href="/events" className="text-foreground hover:text-primary transition-colors">
                Events
              </a>
              <a href="/blog" className="text-foreground hover:text-primary transition-colors">
                Blog
              </a>
              <a href="/contact" className="text-foreground hover:text-primary transition-colors">
                Contact
              </a>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Search className="h-5 w-5" />
              </button>

              <div className="hidden md:flex items-center space-x-2">
                {/* <Button variant="ghost" size="sm">
                  Login
                </Button> */}
                <Link href='/enroll'>
                  <Button size="sm" className="cursor-pointer">Enroll Now</Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-border py-4">
              <div className="flex flex-col space-y-4">
                <a href="/" className="text-foreground hover:text-primary transition-colors">
                  Home
                </a>
                <a href="/courses" className="text-foreground hover:text-primary transition-colors">
                  Courses
                </a>
                <a href="/instructors" className="text-foreground hover:text-primary transition-colors">
                  Instructors
                </a>
                <a href="/admissions" className="text-foreground hover:text-primary transition-colors">
                  Admissions
                </a>
                <a href="/events" className="text-foreground hover:text-primary transition-colors">
                  Events
                </a>
                <a href="/blog" className="text-foreground hover:text-primary transition-colors">
                  Blog
                </a>
                <a href="/contact" className="text-foreground hover:text-primary transition-colors">
                  Contact
                </a>

                <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                  <Button size="sm">Enroll Now</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
