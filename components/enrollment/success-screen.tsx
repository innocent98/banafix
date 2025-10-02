"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Download, Calendar, User, Mail, Phone } from "lucide-react"

interface SuccessScreenProps {
  formData: any
  selectedCourseData: any
}

export function SuccessScreen({ formData, selectedCourseData }: SuccessScreenProps) {
  const receiptNumber = `BNX-2024-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  return (
    <div className="text-center space-y-8">
      {/* Success Animation */}
      <div className="relative">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>

        {/* Confetti Animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-3xl animate-bounce delay-100">🎉</div>
          <div className="text-2xl animate-pulse ml-12 mt-4">🎵</div>
          <div className="text-xl animate-bounce mr-12 mt-8 delay-200">🎶</div>
          <div className="text-2xl animate-pulse ml-8 -mt-4 delay-300">🎸</div>
          <div className="text-xl animate-bounce mr-8 -mt-8 delay-100">🎹</div>
        </div>
      </div>

      {/* Success Message */}
      <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-8 lg:p-12">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-green-900 mb-4">
            Enrollment Successful! 🎊
          </h2>
          <p className="text-lg text-green-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Welcome to Banafix! Your musical journey begins now. We're excited to help you achieve your musical goals.
          </p>

          {/* Receipt Information */}
          <div className="p-6 bg-white/80 backdrop-blur-sm border border-green-200 rounded-2xl mb-8 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg text-green-900">Payment Confirmed</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-medium">Receipt Number:</span>
                <span className="font-mono font-bold text-green-900">{receiptNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-medium">Course:</span>
                <span className="font-semibold text-green-900 text-right">{selectedCourseData?.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-medium">Student:</span>
                <span className="font-semibold text-green-900">{formData.firstName} {formData.lastName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-medium">Confirmation sent to:</span>
                <span className="font-semibold text-green-900 text-right break-all">{formData.email}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-white/60 rounded-2xl">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Check Your Email</h4>
              <p className="text-sm text-slate-600">Confirmation and course details sent to your inbox</p>
            </div>
            <div className="p-6 bg-white/60 rounded-2xl">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Instructor Contact</h4>
              <p className="text-sm text-slate-600">Your instructor will reach out within 24 hours</p>
            </div>
          </div>

          {/* Status Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Enrollment Confirmed", icon: "✅" },
              { label: "Payment Processed", icon: "✅" },
              { label: "Course Materials Ready", icon: "✅" },
              { label: "Instructor Assigned", icon: "✅" },
            ].map((item, index) => (
              <div key={index} className="p-4 bg-white/60 rounded-2xl text-center">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-sm font-semibold text-slate-900">{item.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <Button
          size="lg"
          className="h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold text-lg transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          <User className="h-5 w-5 mr-3" />
          Go to Dashboard
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="h-14 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-2xl font-semibold text-lg transform hover:scale-105 transition-all duration-300"
        >
          <Download className="h-5 w-5 mr-3" />
          Download Receipt
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="h-14 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-2xl font-semibold text-lg transform hover:scale-105 transition-all duration-300"
        >
          <Calendar className="h-5 w-5 mr-3" />
          Add to Calendar
        </Button>
      </div>

      {/* Additional Information */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white max-w-3xl mx-auto">
        <CardContent className="p-6 lg:p-8">
          <h3 className="font-heading font-bold text-xl text-slate-900 mb-6">What Happens Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Instructor Introduction</h4>
                  <p className="text-sm text-slate-600">Your instructor will call or email you to introduce themselves and discuss your goals.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Schedule First Session</h4>
                  <p className="text-sm text-slate-600">Choose a convenient time for your first lesson based on your preferences.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Access Course Materials</h4>
                  <p className="text-sm text-slate-600">Login to your dashboard to access lesson materials and practice exercises.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-amber-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Begin Your Journey</h4>
                  <p className="text-sm text-slate-600">Start learning and practicing with your dedicated instructor's guidance.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <div className="p-6 bg-slate-50 rounded-3xl max-w-2xl mx-auto">
        <h4 className="font-semibold text-slate-900 mb-3">Need Help?</h4>
        <p className="text-sm text-slate-600 mb-4">
          Our support team is here to help you get started. Contact us anytime if you have questions about your enrollment or course.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" size="sm" className="rounded-full">
            💬 Live Chat Support
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            📧 Email Support
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            📞 Call Support
          </Button>
        </div>
      </div>
    </div>
  )
}