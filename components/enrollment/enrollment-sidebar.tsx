"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield, Clock, MapPin, User, Users, Award, CheckCircle } from "lucide-react"
import { calculateApplicationFee } from "@/lib/application-fee"

interface EnrollmentSidebarProps {
  selectedCourseData: any
  formData: any
  currentStep: number
}

export function EnrollmentSidebar({ selectedCourseData, formData, currentStep }: EnrollmentSidebarProps) {
  const hasDiscount = formData.couponCode
  
  // Calculate application fee based on course location
  const applicationFee = selectedCourseData ? calculateApplicationFee(selectedCourseData.location).amount : 2000
  
  const totalPrice = selectedCourseData ?
    (selectedCourseData.price + applicationFee + Math.round(selectedCourseData.price * 0.075) - (hasDiscount ? 5000 : 0)) : 0

  return (
    <div className="sticky top-6 space-y-6">
      {/* Course Summary */}
      <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            Enrollment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedCourseData ? (
            <>
              {/* Course Info */}
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">{selectedCourseData.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{selectedCourseData.instructor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{selectedCourseData.duration}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{selectedCourseData.type}</span>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="p-4 bg-slate-50 rounded-2xl">
                {selectedCourseData.unlimitedSeats ? (
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-green-600">
                    <Users className="h-4 w-4" />
                    Unlimited seats available
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-slate-600 font-medium">Seats Available:</span>
                      <span className="font-bold text-amber-600">
                        {selectedCourseData.seatsLeft}/{selectedCourseData.totalSeats}
                      </span>
                    </div>
                    <Progress
                      value={((selectedCourseData.totalSeats - selectedCourseData.seatsLeft) / selectedCourseData.totalSeats) * 100}
                      className="h-2 bg-slate-200"
                    />
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      {Math.round(((selectedCourseData.totalSeats - selectedCourseData.seatsLeft) / selectedCourseData.totalSeats) * 100)}% enrolled
                    </p>
                  </>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Price Breakdown</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Course Fee:</span>
                    <span className="font-semibold text-slate-900">₦{selectedCourseData.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Registration Fee:</span>
                    <span className="font-semibold text-slate-900">₦{applicationFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">VAT (7.5%):</span>
                    <span className="font-semibold text-slate-900">₦{Math.round(selectedCourseData.price * 0.075).toLocaleString()}</span>
                  </div>

                  {hasDiscount && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Discount ({formData.couponCode}):</span>
                      <span className="font-semibold">-₦5,000</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-bold text-lg border-t border-slate-200 pt-3">
                    <span className="text-slate-900">Total:</span>
                    <span className="text-amber-600">₦{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              Please select a course to see enrollment details
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security Badge */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Secure Payment</h3>
              <p className="text-sm text-green-700">256-bit SSL encryption</p>
            </div>
          </div>
          <p className="text-xs text-green-600 leading-relaxed">
            Your payment information is encrypted and secure. We never store your card details.
          </p>
        </CardContent>
      </Card>

      {/* Step Progress */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Enrollment Progress</h3>
          <div className="space-y-3">
            {[
              { step: 1, title: "Student Details", completed: currentStep > 1 },
              { step: 2, title: "Policies & Terms", completed: currentStep > 2 },
              { step: 3, title: "Review & Confirm", completed: currentStep > 3 },
              { step: 4, title: "Payment", completed: currentStep > 4 },
              { step: 5, title: "Complete", completed: currentStep >= 5 },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    item.completed
                      ? "bg-green-500 text-white"
                      : currentStep === item.step
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {item.completed ? <CheckCircle className="h-3 w-3" /> : item.step}
                </div>
                <span
                  className={`text-sm ${
                    item.completed || currentStep === item.step
                      ? "text-slate-900 font-medium"
                      : "text-slate-500"
                  }`}
                >
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Features */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">What's Included</h3>
          <div className="space-y-3">
            {[
              "Flexible scheduling & makeup sessions",
              // "Certificate of completion",
              // "6 months material access",
              "Performance opportunities",
              "Alumni network access",
              "24/7 student support",
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Money Back Guarantee */}
      {/* <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-blue-900 mb-2">30-Day Money Back Guarantee</h3>
          <p className="text-sm text-blue-700 leading-relaxed">
            Not satisfied with your first month? Get a full refund, no questions asked.
          </p>
        </CardContent>
      </Card> */}
    </div>
  )
}