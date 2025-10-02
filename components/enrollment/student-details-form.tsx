"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Info, User, Home, MapPin } from "lucide-react"

interface StudentDetailsFormProps {
  formData: any
  onInputChange: (field: string, value: string | boolean | string[]) => void
  onPreferredDaysChange: (day: string, checked: boolean) => void
  selectedCourseData: any
}

export function StudentDetailsForm({
  formData,
  onInputChange,
  onPreferredDaysChange,
  selectedCourseData,
}: StudentDetailsFormProps) {
  return (
    <div className="space-y-8">
      {/* Student Information */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900">Student Information</h3>
              <p className="text-slate-600">Please provide your details for enrollment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName" className="text-sm font-semibold text-slate-900 mb-2 block">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => onInputChange("firstName", e.target.value)}
                placeholder="Enter your first name"
                className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-semibold text-slate-900 mb-2 block">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => onInputChange("lastName", e.target.value)}
                placeholder="Enter your last name"
                className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-slate-900 mb-2 block">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onInputChange("email", e.target.value)}
                placeholder="your.email@example.com"
                className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-slate-900 mb-2 block">
                Phone Number *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => onInputChange("phone", e.target.value)}
                placeholder="+234 801 234 5678"
                className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guardian Information */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <User className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900">Guardian Information</h3>
              <p className="text-slate-600">Required if student is under 18 years old</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="guardianName" className="text-sm font-semibold text-slate-900 mb-2 block">
                Guardian Full Name
              </Label>
              <Input
                id="guardianName"
                value={formData.guardianName}
                onChange={(e) => onInputChange("guardianName", e.target.value)}
                placeholder="Guardian's full name"
                className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <Label htmlFor="guardianPhone" className="text-sm font-semibold text-slate-900 mb-2 block">
                Guardian Phone Number
              </Label>
              <Input
                id="guardianPhone"
                value={formData.guardianPhone}
                onChange={(e) => onInputChange("guardianPhone", e.target.value)}
                placeholder="+234 801 234 5678"
                className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="guardianEmail" className="text-sm font-semibold text-slate-900 mb-2 block">
              Guardian Email Address
            </Label>
            <Input
              id="guardianEmail"
              type="email"
              value={formData.guardianEmail}
              onChange={(e) => onInputChange("guardianEmail", e.target.value)}
              placeholder="guardian@example.com"
              className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Course Preferences */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <Home className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900">Course Preferences</h3>
              <p className="text-slate-600">Tell us about your musical background and preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="priorLevel" className="text-sm font-semibold text-slate-900 mb-2 block">
                Prior Music Level *
              </Label>
              <Select
                value={formData.priorLevel}
                onValueChange={(value) => onInputChange("priorLevel", value)}
              >
                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500">
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
              <Label htmlFor="schedulePreference" className="text-sm font-semibold text-slate-900 mb-2 block">
                Schedule Preference *
              </Label>
              <Select
                value={formData.schedulePreference}
                onValueChange={(value) => onInputChange("schedulePreference", value)}
              >
                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500">
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
        </CardContent>
      </Card>

      {/* Home Training Details */}
      {selectedCourseData?.type === "Home Training" && (
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-slate-900">Home Training Details</h3>
                <p className="text-slate-600">Address and scheduling information</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="address" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Full Address *
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => onInputChange("address", e.target.value)}
                  placeholder="House number, street name, area"
                  className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="landmark" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Nearest Landmark *
                </Label>
                <Input
                  id="landmark"
                  value={formData.landmark}
                  onChange={(e) => onInputChange("landmark", e.target.value)}
                  placeholder="e.g., Near Shoprite, Opposite First Bank"
                  className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-900 mb-4 block">
                  Preferred Days for Home Training
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                    (day) => (
                      <div key={day} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                        <Checkbox
                          id={day}
                          checked={formData.preferredDays.includes(day)}
                          onCheckedChange={(checked) =>
                            onPreferredDaysChange(day, checked as boolean)
                          }
                          className="border-slate-300"
                        />
                        <Label htmlFor={day} className="text-sm font-medium text-slate-700 cursor-pointer">
                          {day}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="p-6 bg-blue-50 border border-blue-200 rounded-3xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Travel Coverage Information</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      We provide home training services within Lagos Island, Victoria Island, Lekki, Ajah,
                      and Ikeja. Additional travel charges of ₦2,000-₦5,000 may apply for locations beyond
                      15km from our center. Our team will confirm coverage and any additional fees before
                      your first session.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Options */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6 lg:p-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="couponCode" className="text-sm font-semibold text-slate-900 mb-2 block">
                Coupon Code (Optional)
              </Label>
              <Input
                id="couponCode"
                value={formData.couponCode}
                onChange={(e) => onInputChange("couponCode", e.target.value)}
                placeholder="Enter discount code"
                className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
              <Checkbox
                id="consentToEmails"
                checked={formData.consentToEmails}
                onCheckedChange={(checked) => onInputChange("consentToEmails", checked as boolean)}
                className="border-slate-300 mt-1"
              />
              <Label htmlFor="consentToEmails" className="text-sm leading-relaxed text-slate-700 cursor-pointer">
                I consent to receive course updates, practice tips, and promotional emails from Banafix
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}