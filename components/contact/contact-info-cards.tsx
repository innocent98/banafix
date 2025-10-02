"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Shield, Car, Phone, Mail, MessageCircle } from "lucide-react"

export function ContactInfoCards() {
  return (
    <div className="space-y-8">
      {/* Campus Hours */}
      <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden group hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-heading">
            <div className="p-2 bg-blue-500 rounded-xl group-hover:bg-blue-600 transition-colors">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Campus Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-white/80">
              <span className="font-semibold text-slate-900">Monday - Friday</span>
              <span className="text-slate-700 font-medium">8:00 AM - 8:00 PM</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-white/80">
              <span className="font-semibold text-slate-900">Saturday</span>
              <span className="text-slate-700 font-medium">9:00 AM - 6:00 PM</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-white/80">
              <span className="font-semibold text-slate-900">Sunday</span>
              <span className="text-slate-700 font-medium">12:00 PM - 5:00 PM</span>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-200">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">
              Extended hours during exam periods
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Safety & Parking */}
      <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden group hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-heading">
            <div className="p-2 bg-green-500 rounded-xl group-hover:bg-green-600 transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            Safety & Parking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-white/80">
            <div className="p-2 bg-green-100 rounded-xl">
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-2">Free Parking Available</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                Secure parking lot with 24/7 security. Visitor parking spaces available near the main entrance with easy access to the building.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-white/80">
            <div className="p-2 bg-green-100 rounded-xl">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-2">Campus Security</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                Our campus is monitored 24/7 with professional security personnel and comprehensive CCTV systems for your complete safety and peace of mind.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden group hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-heading">
            <div className="p-2 bg-purple-500 rounded-xl group-hover:bg-purple-600 transition-colors">
              <Phone className="w-5 h-5 text-white" />
            </div>
            Other Ways to Reach Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-white/60 rounded-xl border border-white/80 hover:bg-white/80 transition-colors cursor-pointer">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900">Admissions Office</h4>
              <p className="text-sm text-slate-700">+234 801 234 5678</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/60 rounded-xl border border-white/80 hover:bg-white/80 transition-colors cursor-pointer">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900">General Inquiries</h4>
              <p className="text-sm text-slate-700">hello@banafix.com</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/60 rounded-xl border border-white/80 hover:bg-white/80 transition-colors cursor-pointer">
            <div className="p-2 bg-green-100 rounded-xl">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900">WhatsApp Support</h4>
              <p className="text-sm text-slate-700">+234 801 234 5679</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}