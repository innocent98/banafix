"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressIndicator } from "@/components/enrollment/progress-indicator"
import { StudentDetailsForm } from "@/components/enrollment/student-details-form"
import { PoliciesForm } from "@/components/enrollment/policies-form"
import { ReviewSection } from "@/components/enrollment/review-section"
import { PaymentForm } from "@/components/enrollment/payment-form"
import { SuccessScreen } from "@/components/enrollment/success-screen"
import { EnrollmentSidebar } from "@/components/enrollment/enrollment-sidebar"
import { WaitlistModal } from "@/components/enrollment/waitlist-modal"
import {
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  Eye,
  CreditCard,
  CheckCircle,
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
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 tracking-tighter">
              Enroll in Your <span className="text-amber-400">Course</span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Complete your enrollment in just a few simple steps and start your musical journey today.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} />

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
                    <StudentDetailsForm
                      formData={formData}
                      onInputChange={handleInputChange}
                      onPreferredDaysChange={handlePreferredDaysChange}
                      selectedCourseData={selectedCourseData}
                    />
                  )}

                  {/* Step 2: Policies */}
                  {currentStep === 2 && (
                    <PoliciesForm
                      formData={formData}
                      onInputChange={handleInputChange}
                    />
                  )}

                  {/* Step 3: Review */}
                  {currentStep === 3 && (
                    <ReviewSection
                      formData={formData}
                      selectedCourseData={selectedCourseData}
                      seatHoldTimer={seatHoldTimer}
                      formatTimer={formatTimer}
                    />
                  )}

                  {/* Step 4: Payment */}
                  {currentStep === 4 && (
                    <PaymentForm
                      formData={formData}
                      onInputChange={handleInputChange}
                      paymentError={paymentError}
                    />
                  )}

                  {/* Step 5: Done */}
                  {currentStep === 5 && (
                    <SuccessScreen
                      formData={formData}
                      selectedCourseData={selectedCourseData}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <EnrollmentSidebar
                selectedCourseData={selectedCourseData}
                formData={formData}
                currentStep={currentStep}
              />
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
              <Button>
                <a href="/">Continue</a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <WaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        selectedCourseData={selectedCourseData}
        formData={formData}
        onInputChange={handleInputChange}
      />

      <Footer />
    </div>
  )
}
