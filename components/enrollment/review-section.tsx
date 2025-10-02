"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Info, Eye, CheckCircle } from "lucide-react"

interface ReviewSectionProps {
  formData: any
  selectedCourseData: any
  seatHoldTimer: number
  formatTimer: (seconds: number) => string
}

export function ReviewSection({
  formData,
  selectedCourseData,
  seatHoldTimer,
  formatTimer,
}: ReviewSectionProps) {
  const isTimerCritical = seatHoldTimer < 120

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">Review Your Enrollment</h2>
        <p className="text-slate-600">Please review your details before proceeding to payment</p>
      </div>

      {/* Seat Hold Timer */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-amber-900">Seat Hold Timer</h3>
                <p className="text-amber-700 text-sm">Your seat is temporarily reserved</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center">
                <div
                  className={`text-3xl lg:text-4xl font-mono font-bold ${
                    isTimerCritical ? "text-red-600" : "text-amber-900"
                  }`}
                >
                  {formatTimer(seatHoldTimer)}
                </div>
                <div className="text-xs text-amber-700 font-medium">Time Remaining</div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/50 border-amber-300 text-amber-800 hover:bg-white/80 rounded-full"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      Seat Hold Information
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-slate-600">Your seat is temporarily reserved while you complete enrollment.</p>
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="font-semibold text-slate-900 mb-1">Hold Duration:</p>
                        <p className="text-sm text-slate-600">10 minutes from review step</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-2xl">
                        <p className="font-semibold text-red-900 mb-2">What happens when timer expires:</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li>• Your seat reservation is released</li>
                          <li>• You'll need to restart the enrollment process</li>
                          <li>• Seat availability may change</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl">
                      <p className="text-sm text-blue-800 font-medium">
                        💡 Complete payment to secure your enrollment permanently.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isTimerCritical && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-800 font-semibold text-center">
                ⚠️ Hurry! Less than 2 minutes remaining before your seat is released.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Summary */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            Enrollment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Course & Student Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Details */}
            <div className="space-y-6">
              <div>
                <h4 className="font-heading font-bold text-lg text-slate-900 mb-4">Course Details</h4>
                <div className="space-y-3">
                  {[
                    { label: "Course", value: selectedCourseData?.title },
                    { label: "Instructor", value: selectedCourseData?.instructor },
                    { label: "Duration", value: selectedCourseData?.duration },
                    { label: "Mode", value: selectedCourseData?.type },
                    { label: "Level", value: selectedCourseData?.level },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                      <span className="text-slate-600 font-medium">{item.label}:</span>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Details */}
            <div className="space-y-6">
              <div>
                <h4 className="font-heading font-bold text-lg text-slate-900 mb-4">Student Details</h4>
                <div className="space-y-3">
                  {[
                    { label: "Name", value: `${formData.firstName} ${formData.lastName}` },
                    { label: "Email", value: formData.email },
                    { label: "Phone", value: formData.phone },
                    { label: "Experience Level", value: formData.priorLevel?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) },
                    { label: "Schedule Preference", value: formData.schedulePreference?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                      <span className="text-slate-600 font-medium">{item.label}:</span>
                      <span className="font-semibold text-slate-900 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Home Training Details */}
          {selectedCourseData?.type === "Home Training" && formData.address && (
            <div className="p-6 bg-purple-50 border border-purple-200 rounded-3xl">
              <h4 className="font-heading font-bold text-lg text-slate-900 mb-4">Home Training Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Address:</span>
                  <span className="font-semibold text-slate-900 text-right max-w-xs">{formData.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Landmark:</span>
                  <span className="font-semibold text-slate-900 text-right max-w-xs">{formData.landmark}</span>
                </div>
                {formData.preferredDays.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Preferred Days:</span>
                    <span className="font-semibold text-slate-900 text-right max-w-xs">
                      {formData.preferredDays.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fee Breakdown */}
          <div className="border-t border-slate-200 pt-6">
            <h4 className="font-heading font-bold text-lg text-slate-900 mb-6">Fee Breakdown</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Course Fee:</span>
                <span className="text-lg font-semibold text-slate-900">
                  ₦{selectedCourseData?.price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Registration Fee:</span>
                <span className="text-lg font-semibold text-slate-900">₦2,000</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600 font-medium">VAT (7.5%):</span>
                <span className="text-lg font-semibold text-slate-900">
                  ₦{Math.round((selectedCourseData?.price || 0) * 0.075).toLocaleString()}
                </span>
              </div>

              {/* Discount if coupon applied */}
              {formData.couponCode && (
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-green-600 font-medium">Discount Applied ({formData.couponCode}):</span>
                  <span className="text-lg font-semibold text-green-600">-₦5,000</span>
                </div>
              )}

              <div className="flex justify-between items-center py-4 border-t-2 border-slate-900">
                <span className="text-xl font-heading font-bold text-slate-900">Total Amount:</span>
                <span className="text-2xl font-bold text-amber-600">
                  ₦{(
                    (selectedCourseData?.price || 0) +
                    2000 +
                    Math.round((selectedCourseData?.price || 0) * 0.075) -
                    (formData.couponCode ? 5000 : 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm font-semibold text-green-900 mt-1">Details Verified</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center">
              <div className="text-2xl font-bold text-blue-600">✓</div>
              <div className="text-sm font-semibold text-blue-900 mt-1">Policies Accepted</div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <div className="text-2xl font-bold text-amber-600">⏳</div>
              <div className="text-sm font-semibold text-amber-900 mt-1">Payment Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}