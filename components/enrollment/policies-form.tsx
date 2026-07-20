"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Shield, AlertTriangle } from "lucide-react"

interface PoliciesFormProps {
  formData: any
  onInputChange: (field: string, value: boolean) => void
}

export function PoliciesForm({ formData, onInputChange }: PoliciesFormProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">Terms & Conditions</h2>
        <p className="text-slate-600">Please review and accept our policies to continue</p>
      </div>

      {/* Table of Contents */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="p-6 lg:p-8">
          <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "Enrollment Terms", number: "1" },
              { title: "Payment Policy", number: "2" },
              { title: "Attendance Policy", number: "3" },
              { title: "Refund Policy", number: "4" },
              { title: "Code of Conduct", number: "5" },
              { title: "Privacy Policy", number: "6" },
            ].map((item) => (
              <a
                key={item.number}
                href={`#section-${item.number}`}
                className="flex items-center gap-3 p-3 bg-white rounded-2xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold group-hover:bg-blue-200 transition-colors">
                  {item.number}
                </div>
                <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  {item.title}
                </span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Policies Content */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="h-96 overflow-y-auto p-6 lg:p-8">
            <div className="space-y-8">
              {/* Section 1: Enrollment Terms */}
              <div id="section-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h4 className="font-heading font-bold text-xl text-slate-900">Enrollment Terms</h4>
                </div>
                <div className="space-y-3 text-slate-700 ml-13">
                  <p>By enrolling in Banafix courses, you agree to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Attend all scheduled sessions punctually</li>
                    <li>Complete assigned practice tasks and homework</li>
                    <li>Respect course materials and intellectual property</li>
                    <li>Provide accurate information during enrollment</li>
                  </ul>
                  <p className="text-sm">
                    Course materials and platform access are provided for the duration of your enrollment
                    and remain property of Banafix.
                  </p>
                </div>
              </div>

              {/* Section 2: Payment Policy */}
              <div id="section-2" className="border-t border-slate-100 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h4 className="font-heading font-bold text-xl text-slate-900">Payment Policy</h4>
                </div>
                <div className="space-y-3 text-slate-700 ml-13">
                  <p><strong>Payment Terms:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Full payment required before course commencement</li>
                    <li>Installment plans available for courses above ₦50,000</li>
                    <li>Late payment fee of ₦2,000 applies for overdue installments</li>
                    <li>Payment methods: Card, Bank Transfer, USSD, PayPal</li>
                  </ul>
                  <p className="text-sm">
                    <strong>Currency:</strong> All fees are in Nigerian Naira (₦) unless otherwise stated.
                  </p>
                </div>
              </div>

              {/* Section 3: Attendance Policy */}
              {/* <div id="section-3" className="border-t border-slate-100 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h4 className="font-heading font-bold text-xl text-slate-900">Attendance Policy</h4>
                </div>
                <div className="space-y-3 text-slate-700 ml-13">
                  <p><strong>Attendance Requirements:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Minimum 80% attendance required for course completion certificate</li>
                    <li>Missed sessions can be rescheduled with 24-hour advance notice</li>
                    <li>Maximum 2 makeup sessions per course</li>
                    <li>Excessive absences may result in course termination</li>
                  </ul>
                  <p className="text-sm">
                    <strong>Punctuality:</strong> Sessions start promptly. Late arrivals ({">"}15 minutes)
                    may be considered absent.
                  </p>
                </div>
              </div> */}

              {/* Section 4: Refund Policy */}
              <div id="section-4" className="border-t border-slate-100 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <h4 className="font-heading font-bold text-xl text-slate-900">Refund Policy</h4>
                </div>
                <div className="space-y-3 text-slate-700 ml-13">
                  <p><strong>Refund Schedule:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>100% refund:</strong> Within 7 days of enrollment with no sessions attended</li>
                    <li><strong>75% refund:</strong> Within first 2 weeks with ≤2 sessions attended</li>
                    <li><strong>50% refund:</strong> Within first month with ≤25% course completion</li>
                    <li><strong>No refund:</strong> After 25% course completion or 1 month, whichever comes first</li>
                  </ul>
                  <p className="text-sm">
                    <strong>Processing:</strong> Refunds processed within 7-14 business days to original payment method.
                  </p>
                </div>
              </div>

              {/* Section 5: Code of Conduct */}
              <div id="section-5" className="border-t border-slate-100 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold">5</span>
                  </div>
                  <h4 className="font-heading font-bold text-xl text-slate-900">Code of Conduct</h4>
                </div>
                <div className="space-y-3 text-slate-700 ml-13">
                  <p><strong>Expected Behavior:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Maintain respectful behavior towards instructors and fellow students</li>
                    <li>Use appropriate language during sessions</li>
                    <li>Respect others' learning environment</li>
                    <li>Follow safety guidelines for instruments and equipment</li>
                  </ul>
                  <p className="text-sm">
                    <strong>Violations:</strong> Disruptive behavior may result in warnings, suspension, or
                    course termination without refund.
                  </p>
                </div>
              </div>

              {/* Section 6: Privacy Policy */}
              <div id="section-6" className="border-t border-slate-100 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold">6</span>
                  </div>
                  <h4 className="font-heading font-bold text-xl text-slate-900">Privacy Policy</h4>
                </div>
                <div className="space-y-3 text-slate-700 ml-13">
                  <p><strong>Data Collection:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Personal information used for course administration only</li>
                    <li>Payment data processed securely through certified providers</li>
                    <li>Session recordings may be used for quality improvement</li>
                    <li>Marketing communications only with explicit consent</li>
                  </ul>
                  <p className="text-sm">
                    Full privacy policy available at{" "}
                    <a href="/privacy" className="text-blue-600 hover:underline">
                      banafix.com/privacy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreement Checkboxes */}
      <div className="space-y-6">
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900">Required Agreements</h3>
                <p className="text-slate-600">Please confirm your acceptance of our policies</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-2xl">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => onInputChange("agreeToTerms", checked as boolean)}
                  className="border-slate-300 mt-1"
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed text-slate-700 cursor-pointer">
                  <span className="font-semibold">I agree to the Terms and Conditions, Privacy Policy, and Code of Conduct</span> outlined above. I understand my rights and responsibilities as a student. *
                </Label>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-2xl">
                <Checkbox
                  id="agreeToRefundPolicy"
                  checked={formData.agreeToRefundPolicy}
                  onCheckedChange={(checked) => onInputChange("agreeToRefundPolicy", checked as boolean)}
                  className="border-slate-300 mt-1"
                />
                <Label htmlFor="agreeToRefundPolicy" className="text-sm leading-relaxed text-slate-700 cursor-pointer">
                  <span className="font-semibold">I understand the refund terms and attendance requirements</span> for course completion. I acknowledge the refund schedule and attendance policy. *
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Notice */}
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Important Notice</h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                By proceeding, you acknowledge that you have read, understood, and agree to be bound by all the terms and conditions outlined above. These agreements form a legally binding contract between you and Banafix.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}