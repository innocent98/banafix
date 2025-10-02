import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ContactHero } from "@/components/contact/contact-hero"
import { ContactForm } from "@/components/contact/contact-form"
import { ContactInfoCards } from "@/components/contact/contact-info-cards"
import { LocationDetails } from "@/components/contact/location-details"
import { FAQSection } from "@/components/contact/faq-section"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Navigation />

      {/* Enhanced Hero Section */}
      <ContactHero />

      {/* Main Content Section */}
      <section className="py-10 lg:py-10 -mt-4 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 mb-20">
            {/* Contact Form */}
            <div>
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div>
              <ContactInfoCards />
            </div>
          </div>

          {/* Centered Campus Location Section */}
          {/* <div className="max-w-5xl mx-auto">
            <LocationDetails />
          </div> */}
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      <Footer />
    </div>
  )
}