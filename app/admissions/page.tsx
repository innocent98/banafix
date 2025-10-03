import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, FileText, Users, Calendar, Award, ArrowRight, Download, Phone } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"

export default function AdmissionsPage() {
  return (
    <div className="min-h-screen bg-background">
        <Navigation />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">Now Accepting Applications</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-sora">
                Start Your Musical Journey at Banafix
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Join thousands of students who have transformed their musical abilities through our comprehensive
                programs. Our admissions process is designed to match you with the perfect learning path.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/enroll">Apply Now</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10 bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Brochure
                </Button>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop"
                alt="Students in music class"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">5,000+ Students</p>
                    <p className="text-xs text-muted-foreground">Enrolled This Year</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-sora">
              Simple Application Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in just 4 easy steps. Our streamlined process ensures you can begin your musical journey
              quickly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Choose Your Path",
                description:
                  "Select your instrument and preferred learning mode (Online, Home Training, or One-on-One)",
                icon: <Calendar className="w-6 h-6" />,
              },
              {
                step: "02",
                title: "Submit Application",
                description: "Complete our simple online form with your details and musical background",
                icon: <FileText className="w-6 h-6" />,
              },
              {
                step: "03",
                title: "Assessment & Placement",
                description: "Take a brief skill assessment to ensure proper level placement",
                icon: <Award className="w-6 h-6" />,
              },
              {
                step: "04",
                title: "Start Learning",
                description: "Get matched with your instructor and begin your musical journey",
                icon: <CheckCircle className="w-6 h-6" />,
              },
            ].map((item, index) => (
              <Card key={index} className="relative border-2 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10 font-sora">{item.step}</div>
                  <CardTitle className="text-xl font-sora">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 font-sora">Admission Requirements</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Age Requirements</h3>
                    <p className="text-muted-foreground">
                      Minimum age of 8 years for individual lessons, 12 years for group sessions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Equipment</h3>
                    <p className="text-muted-foreground">
                      Access to instrument (rental options available) and reliable internet for online sessions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Commitment</h3>
                    <p className="text-muted-foreground">Minimum 4-week enrollment with regular practice schedule</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Documentation</h3>
                    <p className="text-muted-foreground">Valid ID and guardian consent for minors</p>
                  </div>
                </div>
              </div>
            </div>
            <Card className="border-2 border-accent/20">
              <CardHeader className="bg-accent/5">
                <CardTitle className="text-xl font-sora flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Application Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="font-medium">Spring Semester</span>
                    <Badge variant="outline">Jan 15, 2025</Badge>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="font-medium">Summer Intensive</span>
                    <Badge variant="outline">Apr 30, 2025</Badge>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="font-medium">Fall Semester</span>
                    <Badge variant="outline">Aug 15, 2025</Badge>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium">Rolling Admissions</span>
                    <Badge className="bg-accent/10 text-accent">Open Year-Round</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tuition & Financial Aid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-sora">Tuition & Financial Aid</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We believe music education should be accessible. Explore our flexible payment options and scholarship
              opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <CardTitle className="font-sora">Individual Lessons</CardTitle>
                <CardDescription>One-on-one instruction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-4">
                  ₦25,000<span className="text-lg text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />4 weekly sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Personalized curriculum
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Flexible scheduling
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary hover:border-primary/80 transition-colors relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle className="font-sora">Group Sessions</CardTitle>
                <CardDescription>Small group learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-4">
                  ₦15,000<span className="text-lg text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />4 weekly sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Max 6 students per group
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Peer learning benefits
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <CardTitle className="font-sora">Online Classes</CardTitle>
                <CardDescription>Virtual learning platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-4">
                  ₦12,000<span className="text-lg text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />4 weekly sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Interactive platform
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Recorded sessions
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto border-2 border-accent/20">
              <CardHeader className="bg-accent/5">
                <CardTitle className="font-sora">Financial Aid Available</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  We offer need-based scholarships covering up to 50% of tuition fees. Payment plans and sibling
                  discounts are also available.
                </p>
                <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 bg-transparent">
                  Learn About Financial Aid
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-sora">Ready to Begin Your Musical Journey?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join our community of passionate musicians and experienced instructors. Your musical dreams are just one
            application away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="primary" className="bg-white text-primary hover:bg-white/90">
              <Link href="/enroll">
                Apply Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
              <Phone className="w-4 h-4 mr-2" />
              Call Admissions: +234 801 234 5678
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
