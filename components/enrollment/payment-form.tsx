"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Shield, AlertCircle, Lock, CheckCircle } from "lucide-react"

interface PaymentFormProps {
  formData: any
  onInputChange: (field: string, value: string) => void
  paymentError: string
}

export function PaymentForm({ paymentError }: PaymentFormProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">Secure Payment</h2>
        <p className="text-slate-600">Complete your registration payment through Paystack</p>
      </div>

      {/* Paystack Redirect Notice */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">
                You'll be redirected to Paystack
              </h3>
              <p className="text-slate-600 leading-relaxed">
                When you click <strong>Complete Payment</strong>, we'll take you to Paystack's secure
                checkout to enter your card or bank details and confirm your registration payment. We never
                see or store your card information.
              </p>
            </div>
          </div>

          {/* Accepted methods */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">We accept:</span>
            <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div className="w-10 h-6 bg-red-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">MC</span>
            </div>
            <div className="w-10 h-6 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">VV</span>
            </div>
            <span className="text-sm text-slate-500 font-medium">& bank transfer</span>
          </div>
        </CardContent>
      </Card>

      {/* Reassurance points */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Shield, title: "256-bit SSL", text: "Bank-grade encryption" },
          { icon: CheckCircle, title: "PCI-DSS compliant", text: "Handled entirely by Paystack" },
          { icon: Lock, title: "No card storage", text: "We never see your details" },
        ].map((item) => (
          <div key={item.title} className="p-4 bg-green-50 border border-green-200 rounded-2xl text-center">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-green-900">{item.title}</p>
            <p className="text-xs text-green-700">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Payment Error */}
      {paymentError && (
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-red-50 border-red-200">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-red-900 mb-2">Payment Failed</h4>
                <p className="text-sm text-red-700 leading-relaxed">{paymentError}</p>
                <p className="text-xs text-red-600 mt-2">
                  Please try again, or contact support if the issue persists.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
