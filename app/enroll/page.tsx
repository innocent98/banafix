"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  User,
  CreditCard,
  Clock,
  MapPin,
  Shield,
  FileText,
  Eye,
  Download,
  CalendarPlus,
  Info,
  AlertCircle,
  Smartphone,
  Building,
  Globe,
} from "lucide-react"

const steps = [
  { id: 1, title: "Details", icon: User },
  { id: 2, title: "Policies", icon: FileText },
  { id: 3, title: "Review", icon: Eye },
  { id: 4, title: "Pay", icon: CreditCard },
  { id: 5, title: "Done", icon: CheckCircle },
]

const mockCourses = [
  {
    id: 1,
    title: "Guitar Fundamentals",
    instructor: "John Adebayo",
    level: "Beginner",
    duration: "12 weeks",
    price: 25000,
    type: "One-on-One",
    schedule: "Flexible",
    seatsLeft: 8,
  },
  {
    id: 2,
    title: "Piano Mastery Program",
    instructor: "Sarah Okafor",
    level: "Intermediate",
    duration: "16 weeks",
    price: 30000,
    type: "Online",
    schedule: "Tue & Thu 6PM",
    seatsLeft: 3,
  },
]

export default function EnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCourse, setSelectedCourse] = useState<number | null>(1)
  const [seatHoldTimer, setSeatHoldTimer] = useState(600) // 10 minutes in seconds
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    priorLevel: "",
    schedulePreference: "",
    preferredDays: [] as string[],
    musicExperience: "",
    goals: "",
    specialRequests: "",
    couponCode: "",
    consentToEmails: false,

    // Payment & Billing
    paymentMethod: "",
    installmentPlan: false,
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingCountry: "Nigeria",

    // Policies
    agreeToTerms: false,
    agreeToRefundPolicy: false,
    agreeToMarketing: false,

    // Waitlist
    waitlistNotes: "",
  })

  useEffect(() => {
    if (currentStep === 3 && seatHoldTimer > 0) {
      const timer = setTimeout(() => setSeatHoldTimer(seatHoldTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [currentStep, seatHoldTimer])

  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePreferredDaysChange = (day: string, checked: boolean) => {
    const updatedDays = checked ? [...formData.preferredDays, day] : formData.preferredDays.filter((d) => d !== day)
    handleInputChange("preferredDays", updatedDays)
  }

  const handlePayment = async () => {
    setIsProcessingPayment(true)
    setPaymentError("")

    // Simulate payment processing
    setTimeout(() => {
      const success = Math.random() > 0.1 // 90% success rate for demo
      if (success) {
        setCurrentStep(5)
      } else {
        setPaymentError("Payment failed. Please check your details and try again.")
      }
      setIsProcessingPayment(false)
    }, 2000)
  }

  const selectedCourseData = mockCourses.find((course) => course.id === selectedCourse)

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isCourseFullSimulation = selectedCourseData?.seatsLeft === 0

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">Enroll in Your Course</h1>
            <p className="text-blue-100 max-w-2xl mx-auto">Complete your enrollment in just a few simple steps</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span
                key={step.id}
                className={`text-sm ${currentStep >= step.id ? "text-primary font-medium" : "text-muted-foreground"}`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5 mr-2 text-primary" })}
                    {steps[currentStep - 1].title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1: Details */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-semibold">Student Information</Label>
                        <p className="text-sm text-muted-foreground mb-4">Please provide your details for enrollment</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder="your.email@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="+234 801 234 5678"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <Label className="text-base font-semibold">Guardian Information</Label>
                        <p className="text-sm text-muted-foreground mb-4">Required if student is under 18 years old</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="guardianName">Guardian Full Name</Label>
                            <Input
                              id="guardianName"
                              value={formData.guardianName}
                              onChange={(e) => handleInputChange("guardianName", e.target.value)}
                              placeholder="Guardian's full name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="guardianPhone">Guardian Phone Number</Label>
                            <Input
                              id="guardianPhone"
                              value={formData.guardianPhone}
                              onChange={(e) => handleInputChange("guardianPhone", e.target.value)}
                              placeholder="+234 801 234 5678"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label htmlFor="guardianEmail">Guardian Email Address</Label>
                          <Input
                            id="guardianEmail"
                            type="email"
                            value={formData.guardianEmail}
                            onChange={(e) => handleInputChange("guardianEmail", e.target.value)}
                            placeholder="guardian@example.com"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <Label className="text-base font-semibold">Course Preferences</Label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label htmlFor="priorLevel">Prior Music Level *</Label>
                            <Select
                              value={formData.priorLevel}
                              onValueChange={(value) => handleInputChange("priorLevel", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="complete-beginner">Complete Beginner</SelectItem>
                                <SelectItem value="some-experience">Some Experience (1-2 years)</SelectItem>
                                <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                                <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="schedulePreference">Schedule Preference *</Label>
                            <Select
                              value={formData.schedulePreference}
                              onValueChange={(value) => handleInputChange("schedulePreference", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select preference" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekday-morning">Weekday Morning (9AM-12PM)</SelectItem>
                                <SelectItem value="weekday-afternoon">Weekday Afternoon (1PM-5PM)</SelectItem>
                                <SelectItem value="weekday-evening">Weekday Evening (6PM-9PM)</SelectItem>
                                <SelectItem value="weekend-morning">Weekend Morning (9AM-12PM)</SelectItem>
                                <SelectItem value="weekend-afternoon">Weekend Afternoon (1PM-5PM)</SelectItem>
                                <SelectItem value="flexible">Flexible</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {selectedCourseData?.type === "Home Training" && (
                        <div className="border-t pt-4">
                          <Label className="text-base font-semibold">Home Training Details</Label>

                          <div className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="address">Full Address *</Label>
                              <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleInputChange("address", e.target.value)}
                                placeholder="House number, street name, area"
                              />
                            </div>
                            <div>
                              <Label htmlFor="landmark">Nearest Landmark *</Label>
                              <Input
                                id="landmark"
                                value={formData.landmark}
                                onChange={(e) => handleInputChange("landmark", e.target.value)}
                                placeholder="e.g., Near Shoprite, Opposite First Bank"
                              />
                            </div>

                            <div>
                              <Label className="text-sm font-medium mb-3 block">Preferred Days for Home Training</Label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                                  (day) => (
                                    <div key={day} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={day}
                                        checked={formData.preferredDays.includes(day)}
                                        onCheckedChange={(checked) =>
                                          handlePreferredDaysChange(day, checked as boolean)
                                        }
                                      />
                                      <Label htmlFor={day} className="text-sm">
                                        {day}
                                      </Label>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-start">
                                <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                                <div>
                                  <h4 className="font-medium text-blue-900">Travel Coverage Information</h4>
                                  <p className="text-sm text-blue-700 mt-1">
                                    We provide home training services within Lagos Island, Victoria Island, Lekki, Ajah,
                                    and Ikeja. Additional travel charges of ₦2,000-₦5,000 may apply for locations beyond
                                    15km from our center. Our team will confirm coverage and any additional fees before
                                    your first session.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4 space-y-4">
                        <div>
                          <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                          <Input
                            id="couponCode"
                            value={formData.couponCode}
                            onChange={(e) => handleInputChange("couponCode", e.target.value)}
                            placeholder="Enter discount code"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="consentToEmails"
                            checked={formData.consentToEmails}
                            onCheckedChange={(checked) => handleInputChange("consentToEmails", checked as boolean)}
                          />
                          <Label htmlFor="consentToEmails" className="text-sm">
                            I consent to receive course updates, practice tips, and promotional emails from Banafix
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Policies */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-semibold">Terms & Conditions</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Please review and accept our policies to continue
                        </p>
                      </div>

                      <div className="border rounded-lg">
                        <div className="p-4 bg-muted border-b">
                          <h3 className="font-semibold mb-3">Table of Contents</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <a href="#enrollment" className="text-primary hover:underline flex items-center">
                              <span className="w-4 h-4 rounded-full bg-primary/20 text-xs flex items-center justify-center mr-2">
                                1
                              </span>
                              Enrollment Terms
                            </a>
                            <a href="#payment" className="text-primary hover:underline flex items-center">
                              <span className="w-4 h-4 rounded-full bg-primary/20 text-xs flex items-center justify-center mr-2">
                                2
                              </span>
                              Payment Policy
                            </a>
                            <a href="#attendance" className="text-primary hover:underline flex items-center">
                              <span className="w-4 h-4 rounded-full bg-primary/20 text-xs flex items-center justify-center mr-2">
                                3
                              </span>
                              Attendance Policy
                            </a>
                            <a href="#refund" className="text-primary hover:underline flex items-center">
                              <span className="w-4 h-4 rounded-full bg-primary/20 text-xs flex items-center justify-center mr-2">
                                4
                              </span>
                              Refund Policy
                            </a>
                            <a href="#conduct" className="text-primary hover:underline flex items-center">
                              <span className="w-4 h-4 rounded-full bg-primary/20 text-xs flex items-center justify-center mr-2">
                                5
                              </span>
                              Code of Conduct
                            </a>
                            <a href="#privacy" className="text-primary hover:underline flex items-center">
                              <span className="w-4 h-4 rounded-full bg-primary/20 text-xs flex items-center justify-center mr-2">
                                6
                              </span>
                              Privacy Policy
                            </a>
                          </div>
                        </div>

                        <div className="p-4 max-h-96 overflow-y-auto space-y-6 text-sm">
                          <div id="enrollment">
                            <h4 className="font-semibold text-primary text-base mb-2">1. Enrollment Terms</h4>
                            <div className="space-y-2 text-muted-foreground">
                              <p>By enrolling in Banafix courses, you agree to:</p>
                              <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Attend all scheduled sessions punctually</li>
                                <li>Complete assigned practice tasks and homework</li>
                                <li>Respect course materials and intellectual property</li>
                                <li>Provide accurate information during enrollment</li>
                              </ul>
                              <p>
                                Course materials and platform access are provided for the duration of your enrollment
                                and remain property of Banafix.
                              </p>
                            </div>
                          </div>

                          <div id="payment">
                            <h4 className="font-semibold text-primary text-base mb-2">2. Payment Policy</h4>
                            <div className="space-y-2 text-muted-foreground">
                              <p>
                                <strong>Payment Terms:</strong>
                              </p>
                              <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Full payment required before course commencement</li>
                                <li>Installment plans available for courses above ₦50,000</li>
                                <li>Late payment fee of ₦2,000 applies for overdue installments</li>
                                <li>Payment methods: Card, Bank Transfer, USSD, PayPal</li>
                              </ul>
                              <p>
                                <strong>Currency:</strong> All fees are in Nigerian Naira (₦) unless otherwise stated.
                              </p>
                            </div>
                          </div>

                          <div id="attendance">
                            <h4 className="font-semibold text-primary text-base mb-2">3. Attendance Policy</h4>
                            <div className="space-y-2 text-muted-foreground">
                              <p>
                                <strong>Attendance Requirements:</strong>
                              </p>
                              <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Minimum 80% attendance required for course completion certificate</li>
                                <li>Missed sessions can be rescheduled with 24-hour advance notice</li>
                                <li>Maximum 2 makeup sessions per course</li>
                                <li>Excessive absences may result in course termination</li>
                              </ul>
                              <p>
                                <strong>Punctuality:</strong> Sessions start promptly. Late arrivals (&gt;15 minutes)
                                may be considered absent.
                              </p>
                            </div>
                          </div>

                          <div id="refund">
                            <h4 className="font-semibold text-primary text-base mb-2">4. Refund Policy</h4>
                            <div className="space-y-2 text-muted-foreground">
                              <p>
                                <strong>Refund Schedule:</strong>
                              </p>
                              <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>
                                  <strong>100% refund:</strong> Within 7 days of enrollment with no sessions attended
                                </li>
                                <li>
                                  <strong>75% refund:</strong> Within first 2 weeks with ≤2 sessions attended
                                </li>
                                <li>
                                  <strong>50% refund:</strong> Within first month with ≤25% course completion
                                </li>
                                <li>
                                  <strong>No refund:</strong> After 25% course completion or 1 month, whichever comes
                                  first
                                </li>
                              </ul>
                              <p>
                                <strong>Processing:</strong> Refunds processed within 7-14 business days to original
                                payment method.
                              </p>
                            </div>
                          </div>

                          <div id="conduct">
                            <h4 className="font-semibold text-primary text-base mb-2">5. Code of Conduct</h4>
                            <div className="space-y-2 text-muted-foreground">
                              <p>
                                <strong>Expected Behavior:</strong>
                              </p>
                              <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Maintain respectful behavior towards instructors and fellow students</li>
                                <li>Use appropriate language during sessions</li>
                                <li>Respect others' learning environment</li>
                                <li>Follow safety guidelines for instruments and equipment</li>
                              </ul>
                              <p>
                                <strong>Violations:</strong> Disruptive behavior may result in warnings, suspension, or
                                course termination without refund.
                              </p>
                            </div>
                          </div>

                          <div id="privacy">
                            <h4 className="font-semibold text-primary text-base mb-2">6. Privacy Policy</h4>
                            <div className="space-y-2 text-muted-foreground">
                              <p>
                                <strong>Data Collection:</strong>
                              </p>
                              <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Personal information used for course administration only</li>
                                <li>Payment data processed securely through certified providers</li>
                                <li>Session recordings may be used for quality improvement</li>
                                <li>Marketing communications only with explicit consent</li>
                              </ul>
                              <p>
                                Full privacy policy available at{" "}
                                <a href="/privacy" className="text-primary hover:underline">
                                  banafix.com/privacy
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                          />
                          <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                            I agree to the Terms and Conditions, Privacy Policy, and Code of Conduct outlined above *
                          </Label>
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="agreeToRefundPolicy"
                            checked={formData.agreeToRefundPolicy}
                            onCheckedChange={(checked) => handleInputChange("agreeToRefundPolicy", checked as boolean)}
                          />
                          <Label htmlFor="agreeToRefundPolicy" className="text-sm leading-relaxed">
                            I understand the refund terms and attendance requirements for course completion *
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-semibold">Review Your Enrollment</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Please review your details before proceeding to payment
                        </p>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-amber-600 mr-2" />
                            <span className="font-medium text-amber-900">Seat Hold Timer</span>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`font-bold text-lg ${seatHoldTimer < 120 ? "text-red-600" : "text-amber-900"}`}
                            >
                              {formatTimer(seatHoldTimer)}
                            </span>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="ml-2 p-1">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Seat Hold Information</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 text-sm">
                                  <p>Your seat is temporarily reserved while you complete enrollment.</p>
                                  <div className="space-y-2">
                                    <p>
                                      <strong>Hold Duration:</strong> 10 minutes from review step
                                    </p>
                                    <p>
                                      <strong>What happens when timer expires:</strong>
                                    </p>
                                    <ul className="list-disc list-inside ml-4 space-y-1">
                                      <li>Your seat reservation is released</li>
                                      <li>You'll need to restart the enrollment process</li>
                                      <li>Seat availability may change</li>
                                    </ul>
                                  </div>
                                  <p className="text-primary font-medium">
                                    Complete payment to secure your enrollment permanently.
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <p className="text-sm text-amber-700 mt-2">
                          Your seat is reserved for 10 minutes. Complete payment to secure your enrollment.
                          {seatHoldTimer < 120 && (
                            <span className="font-medium text-red-600 ml-1">Hurry! Less than 2 minutes remaining.</span>
                          )}
                        </p>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Enrollment Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Course Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Course:</span>
                                  <span className="font-medium">{selectedCourseData?.title}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Instructor:</span>
                                  <span>{selectedCourseData?.instructor}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Duration:</span>
                                  <span>{selectedCourseData?.duration}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Mode:</span>
                                  <span>{selectedCourseData?.type}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Student Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Name:</span>
                                  <span>
                                    {formData.firstName} {formData.lastName}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Email:</span>
                                  <span>{formData.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Phone:</span>
                                  <span>{formData.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Level:</span>
                                  <span>{formData.priorLevel}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Fee Breakdown</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Course Fee:</span>
                                <span>₦{selectedCourseData?.price.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Registration Fee:</span>
                                <span>₦2,000</span>
                              </div>
                              <div className="flex justify-between">
                                <span>VAT (7.5%):</span>
                                <span>₦{Math.round((selectedCourseData?.price || 0) * 0.075).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Total:</span>
                                <span className="text-primary">
                                  ₦
                                  {(
                                    (selectedCourseData?.price || 0) +
                                    2000 +
                                    Math.round((selectedCourseData?.price || 0) * 0.075)
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Step 4: Payment */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-semibold">Payment Information</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Choose your payment method to complete enrollment
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">Payment Method *</Label>
                        <RadioGroup
                          value={formData.paymentMethod}
                          onValueChange={(value) => handleInputChange("paymentMethod", value)}
                        >
                          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                            <RadioGroupItem value="card" id="card" />
                            <Label htmlFor="card" className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <CreditCard className="h-5 w-5 mr-3 text-primary" />
                                  <div>
                                    <span className="font-medium">Credit/Debit Card</span>
                                    <p className="text-xs text-muted-foreground">Instant processing</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <img src="/visa-application-process.png" alt="Visa" className="h-6" />
                                  <img src="/mastercard-logo-abstract.png" alt="Mastercard" className="h-6" />
                                </div>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                            <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                            <Label htmlFor="bank-transfer" className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Building className="h-5 w-5 mr-3 text-primary" />
                                  <div>
                                    <span className="font-medium">Bank Transfer</span>
                                    <p className="text-xs text-muted-foreground">Direct bank payment</p>
                                  </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Instant verification
                                </span>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                            <RadioGroupItem value="ussd" id="ussd" />
                            <Label htmlFor="ussd" className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Smartphone className="h-5 w-5 mr-3 text-primary" />
                                  <div>
                                    <span className="font-medium">USSD Payment</span>
                                    <p className="text-xs text-muted-foreground">Pay with your mobile phone</p>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <div>*737# (GTBank)</div>
                                  <div>*894# (Access)</div>
                                </div>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                            <RadioGroupItem value="paypal" id="paypal" />
                            <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Globe className="h-5 w-5 mr-3 text-primary" />
                                  <div>
                                    <span className="font-medium">PayPal</span>
                                    <p className="text-xs text-muted-foreground">International payments accepted</p>
                                  </div>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Global</span>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {formData.paymentMethod === "card" && (
                        <div className="space-y-4 p-4 bg-muted rounded-lg">
                          <div>
                            <Label htmlFor="cardNumber">Card Number *</Label>
                            <Input id="cardNumber" placeholder="1234 5678 9012 3456" maxLength={19} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry">Expiry Date *</Label>
                              <Input id="expiry" placeholder="MM/YY" maxLength={5} />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV *</Label>
                              <Input id="cvv" placeholder="123" maxLength={4} />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="cardName">Name on Card *</Label>
                            <Input id="cardName" placeholder="Full name as on card" />
                          </div>

                          <div className="border-t pt-4">
                            <Label className="text-sm font-medium mb-3 block">Billing Address</Label>
                            <div className="space-y-3">
                              <Input
                                placeholder="Billing address"
                                value={formData.billingAddress}
                                onChange={(e) => handleInputChange("billingAddress", e.target.value)}
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  placeholder="City"
                                  value={formData.billingCity}
                                  onChange={(e) => handleInputChange("billingCity", e.target.value)}
                                />
                                <Input
                                  placeholder="State"
                                  value={formData.billingState}
                                  onChange={(e) => handleInputChange("billingState", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <div className="flex items-center">
                              <Shield className="h-4 w-4 text-green-600 mr-2" />
                              <span className="text-sm text-green-800">
                                Secured by 256-bit SSL encryption via Paystack
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                            <div>
                              <h4 className="font-medium text-red-900">Payment Failed</h4>
                              <p className="text-sm text-red-700 mt-1">{paymentError}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 5: Done */}
                  {currentStep === 5 && (
                    <div className="text-center space-y-6">
                      <div className="relative">
                        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-10 w-10 text-primary-foreground" />
                        </div>
                        {/* Confetti effect */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-2xl animate-bounce">🎉</div>
                          <div className="text-xl animate-pulse ml-8">🎵</div>
                          <div className="text-lg animate-bounce mr-8">🎶</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-6 border-2 border-blue-100">
                        <h2 className="text-2xl font-bold mb-2 text-blue-900">Enrollment Successful!</h2>
                        <p className="text-muted-foreground mb-4">
                          Welcome to Banafix! Your musical journey begins now.
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-blue-800">
                            <strong>Receipt Number:</strong> BNX-2024-
                            {Math.random().toString(36).substr(2, 9).toUpperCase()}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">Confirmation email sent to {formData.email}</p>
                        </div>

                        <div className="text-sm text-muted-foreground mb-6">
                          <p>✅ Enrollment confirmed</p>
                          <p>✅ Payment processed successfully</p>
                          <p>✅ Course materials will be available in your dashboard</p>
                          <p>✅ Instructor will contact you within 24 hours</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Go to Dashboard
                          </Button>
                          <Button
                            variant="outline"
                            className="flex items-center border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Receipt (PDF)
                          </Button>
                          <Button variant="outline" className="flex items-center bg-transparent">
                            <CalendarPlus className="h-4 w-4 mr-2" />
                            Add to Calendar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Enrollment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedCourseData ? (
                      <>
                        <div>
                          <h3 className="font-semibold mb-2">{selectedCourseData.title}</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{selectedCourseData.instructor}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{selectedCourseData.duration}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{selectedCourseData.type}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span>Course Fee:</span>
                            <span className="font-semibold">₦{selectedCourseData.price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span>Registration Fee:</span>
                            <span className="font-semibold">₦2,000</span>
                          </div>
                          <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span className="text-primary">₦{(selectedCourseData.price + 2000).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Shield className="h-4 w-4 mr-2 text-accent" />
                            <span className="text-sm font-medium">Secure Payment</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Your payment information is encrypted and secure
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">Please select a course to see enrollment details</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={currentStep === 4 ? handlePayment : handleNext}
                disabled={
                  (currentStep === 1 &&
                    (!formData.firstName ||
                      !formData.lastName ||
                      !formData.email ||
                      !formData.phone ||
                      !formData.priorLevel ||
                      !formData.schedulePreference)) ||
                  (currentStep === 2 && (!formData.agreeToTerms || !formData.agreeToRefundPolicy)) ||
                  (currentStep === 4 && (!formData.paymentMethod || isProcessingPayment))
                }
                className="flex items-center"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : currentStep === 4 ? (
                  "Complete Payment"
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button asChild>
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
              Course Full - Join Waitlist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                This course is currently full, but you can join our waitlist. We'll notify you immediately when a spot
                becomes available.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="waitlistName">Full Name *</Label>
                <Input id="waitlistName" placeholder="Your full name" />
              </div>
              <div>
                <Label htmlFor="waitlistEmail">Email Address *</Label>
                <Input id="waitlistEmail" type="email" placeholder="your.email@example.com" />
              </div>
              <div>
                <Label htmlFor="waitlistPhone">Phone Number *</Label>
                <Input id="waitlistPhone" placeholder="+234 801 234 5678" />
              </div>
              <div>
                <Label htmlFor="waitlistNotes">Interest Notes (Optional)</Label>
                <Textarea
                  id="waitlistNotes"
                  placeholder="Tell us about your interest in this course..."
                  value={formData.waitlistNotes}
                  onChange={(e) => handleInputChange("waitlistNotes", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowWaitlistModal(false)} className="flex-1">
                Join Waitlist
              </Button>
              <Button variant="outline" onClick={() => setShowWaitlistModal(false)}>
                Cancel
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>
                <strong>Notification Process:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>You'll receive email and SMS notifications when spots open</li>
                <li>You have 24 hours to confirm your enrollment</li>
                <li>Waitlist position is first-come, first-served</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
