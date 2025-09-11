import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="lg:col-span-1">
            <div className="text-2xl font-heading font-bold mb-4">Banafix</div>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              Empowering musicians through professional education and structured learning experiences.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-blue-100 hover:text-accent cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-blue-100 hover:text-accent cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-blue-100 hover:text-accent cursor-pointer transition-colors" />
              <Youtube className="h-5 w-5 text-blue-100 hover:text-accent cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/courses" className="text-blue-100 hover:text-accent transition-colors">
                  All Courses
                </a>
              </li>
              <li>
                <a href="/instructors" className="text-blue-100 hover:text-accent transition-colors">
                  Our Instructors
                </a>
              </li>
              <li>
                <a href="/admissions" className="text-blue-100 hover:text-accent transition-colors">
                  Admissions
                </a>
              </li>
              <li>
                <a href="/events" className="text-blue-100 hover:text-accent transition-colors">
                  Events
                </a>
              </li>
              <li>
                <a href="/blog" className="text-blue-100 hover:text-accent transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="/about" className="text-blue-100 hover:text-accent transition-colors">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-accent" />
                <span className="text-blue-100">Lagos, Nigeria</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-accent" />
                <span className="text-blue-100">+234 (0) 123 456 7890</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-accent" />
                <span className="text-blue-100">hello@banafix.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Stay Updated</h3>
            <p className="text-blue-100 text-sm mb-4">Get music tips and early access to new courses.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 text-sm bg-blue-800 border border-blue-700 rounded-l-md text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button className="px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-r-md hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-blue-100">
          <div className="flex flex-wrap gap-4 mb-4 md:mb-0">
            <a href="/privacy" className="hover:text-accent transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-accent transition-colors">
              Terms & Conditions
            </a>
            <a href="/refunds" className="hover:text-accent transition-colors">
              Refund Policy
            </a>
          </div>
          <div>© 2024 Banafix. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
