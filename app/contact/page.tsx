import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, Shield, Car, Navigation,  ExternalLink } from "lucide-react"
import Link from "next/link"
// import Navigation from "@/components/navigation"
import { Footer } from "@/components/footer"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
        {/* <Navigation /> */}
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-sora">Get in Touch</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about our programs? Need help with enrollment? Our friendly team is here to help you start
              your musical journey.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-2 hover:border-primary/20 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Call Us</h3>
                <p className="text-sm text-muted-foreground mb-3">Speak directly with our team</p>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  +234 801 234 5678
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/20 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">WhatsApp</h3>
                <p className="text-sm text-muted-foreground mb-3">Quick chat support</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-accent text-accent hover:bg-accent/10 bg-transparent"
                >
                  Chat Now
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-sm text-muted-foreground mb-3">Send us a message</p>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  hello@banafix.com
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6 font-sora">Send us a Message</h2>
              <Card className="border-2">
                <CardContent className="pt-6">
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" placeholder="Enter your first name" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" placeholder="Enter your last name" className="mt-1" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" placeholder="your.email@example.com" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" placeholder="+234 800 000 0000" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input id="subject" placeholder="What can we help you with?" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your inquiry..."
                        className="mt-1 min-h-[120px]"
                      />
                    </div>

                    <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information & Map */}
            <div className="space-y-8">
              {/* Campus Hours */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-sora">
                    <Clock className="w-5 h-5 text-primary" />
                    Campus Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Monday - Friday</span>
                      <span>8:00 AM - 8:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Saturday</span>
                      <span>9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Sunday</span>
                      <span>12:00 PM - 5:00 PM</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Badge className="bg-accent/10 text-accent">Extended hours during exam periods</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-sora">
                    <MapPin className="w-5 h-5 text-primary" />
                    Visit Our Campus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Banafix Music Academy</p>
                      <p className="text-muted-foreground">
                        123 Harmony Street, Victoria Island
                        <br />
                        Lagos, Nigeria 101241
                      </p>
                    </div>

                    {/* Embedded Map Placeholder */}
                    <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Interactive Map</p>
                        <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                          <Navigation className="w-4 h-4 mr-2" />
                          Get Directions
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Google Maps
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Navigation className="w-4 h-4 mr-2" />
                        Apple Maps
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Safety & Parking */}
              <Card className="border-2 border-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-sora">
                    <Shield className="w-5 h-5 text-accent" />
                    Safety & Parking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Car className="w-5 h-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-medium">Free Parking Available</p>
                        <p className="text-sm text-muted-foreground">
                          Secure parking lot with 24/7 security. Visitor parking spaces available near the main
                          entrance.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-medium">Campus Security</p>
                        <p className="text-sm text-muted-foreground">
                          Our campus is monitored 24/7 with security personnel and CCTV systems for your safety.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Details */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="font-sora">Other Ways to Reach Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Admissions Office</p>
                        <p className="text-sm text-muted-foreground">+234 801 234 5678</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">General Inquiries</p>
                        <p className="text-sm text-muted-foreground">hello@banafix.com</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-medium">WhatsApp Support</p>
                        <p className="text-sm text-muted-foreground">+234 801 234 5679</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-sora">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Can't find what you're looking for? Check out our comprehensive FAQ section.
            </p>
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/faqs">
                View All FAQs
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
