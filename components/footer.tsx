"use client"

import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  const quickLinks = [
    { label: "About Us", href: "/about" },
    { label: "Our Tutors", href: "/tutors" },
    { label: "Testimonials", href: "/testimonials" },
    { label: "FAQs", href: "/faqs" },
  ]

  const courses = [
    { label: "Guitar", href: "/courses/guitar" },
    { label: "Piano", href: "/courses/piano" },
    { label: "Drums", href: "/courses/drums" },
    { label: "Vocals", href: "/courses/vocals" },
  ]

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  ]

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-16 lg:py-20">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <span className="font-heading text-2xl font-bold">Banafix</span>
            </Link>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Empowering musicians through quality education and personalized instruction since 2015.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 hover:bg-amber-500 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-amber-400 transition-colors duration-200 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-6">Our Courses</h3>
            <ul className="space-y-3">
              {courses.map((course) => (
                <li key={course.href}>
                  <Link
                    href={course.href}
                    className="text-slate-400 hover:text-amber-400 transition-colors duration-200 inline-block"
                  >
                    {course.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-6">Get In Touch</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
                <a href="tel:+2349038563822" className="text-slate-400 hover:text-amber-400 transition-colors">
                  0903 856 3822
                </a>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
                <a href="mailto:info@banafix.com" className="text-slate-400 hover:text-amber-400 transition-colors">
                  info@banafix.com
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-slate-400">
                  32, Road 8 Greenland Estate, Olokonla Bus Stop, Eti-Osa, Lekki, Lagos
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} Banafix. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
