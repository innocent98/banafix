"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Building, Smartphone, Globe, Shield, AlertCircle } from "lucide-react"

interface PaymentFormProps {
  formData: any
  onInputChange: (field: string, value: string) => void
  paymentError: string
}

export function PaymentForm({ formData, onInputChange, paymentError }: PaymentFormProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">Payment Information</h2>
        <p className="text-slate-600">Choose your payment method to complete enrollment</p>
      </div>

      {/* Payment Methods */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6 lg:p-8">
          <Label className="text-lg font-heading font-bold text-slate-900 mb-6 block">
            Payment Method *
          </Label>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value) => onInputChange("paymentMethod", value)}
            className="space-y-4"
          >
            {/* Credit/Debit Card - Only Option */}
            <div className="group">
              <div className="flex items-center space-x-2 p-6 border-2 border-blue-300 bg-blue-50/50 rounded-3xl shadow-lg">
                <RadioGroupItem value="card" id="card" className="border-slate-400" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-lg">Credit/Debit Card</div>
                        <p className="text-sm text-slate-500">Secure payment via Paystack</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">VISA</span>
                      </div>
                      <div className="w-10 h-6 bg-red-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">MC</span>
                      </div>
                      <div className="w-10 h-6 bg-orange-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">VV</span>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
          
          {/* Info Note */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All payments are processed securely through Paystack. We accept Visa, Mastercard, and Verve cards.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card Details Form */}
      {formData.paymentMethod === "card" && (
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-slate-900">Card Information</h3>
                <p className="text-slate-600">Enter your card details securely</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="cardNumber" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Card Number *
                </Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="h-12 bg-white border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry" className="text-sm font-semibold text-slate-900 mb-2 block">
                    Expiry Date *
                  </Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    maxLength={5}
                    className="h-12 bg-white border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv" className="text-sm font-semibold text-slate-900 mb-2 block">
                    CVV *
                  </Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={4}
                    className="h-12 bg-white border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cardName" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Name on Card *
                </Label>
                <Input
                  id="cardName"
                  placeholder="Full name as on card"
                  className="h-12 bg-white border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Billing Address */}
              <div className="border-t border-blue-200 pt-6">
                <Label className="text-lg font-heading font-bold text-slate-900 mb-4 block">
                  Billing Address
                </Label>
                <div className="space-y-4">
                  <Input
                    placeholder="Billing address"
                    value={formData.billingAddress}
                    onChange={(e) => onInputChange("billingAddress", e.target.value)}
                    className="h-12 bg-white border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="City"
                      value={formData.billingCity}
                      onChange={(e) => onInputChange("billingCity", e.target.value)}
                      className="h-12 bg-white border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Input
                      placeholder="State"
                      value={formData.billingState}
                      onChange={(e) => onInputChange("billingState", e.target.value)}
                      className="h-12 bg-white border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-900">Secured by 256-bit SSL encryption</p>
                    <p className="text-xs text-green-700">Powered by Paystack • Your data is safe</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  Please check your payment details and try again, or contact support if the issue persists.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}