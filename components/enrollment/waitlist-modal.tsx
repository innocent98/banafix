"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Clock, Mail, Phone } from "lucide-react"

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
  formData: any
  onInputChange: (field: string, value: string) => void
  selectedCourseData: any
}

export function WaitlistModal({
  isOpen,
  onClose,
  formData,
  onInputChange,
  selectedCourseData,
}: WaitlistModalProps) {
  const handleJoinWaitlist = () => {
    // In a real app, this would submit to an API
    console.log("Joining waitlist with data:", formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <div className="text-slate-900">Course Full - Join Waitlist</div>
              <div className="text-sm font-normal text-slate-600 mt-1">
                {selectedCourseData?.title}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Notice */}
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Course Currently Full</h4>
                <p className="text-sm text-amber-800 leading-relaxed">
                  This course is currently at capacity, but you can join our priority waitlist. We'll notify you immediately
                  when a spot becomes available, and you'll have 24 hours to secure your enrollment.
                </p>
              </div>
            </div>
          </div>

          {/* Waitlist Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="waitlistName" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Full Name *
                </Label>
                <Input
                  id="waitlistName"
                  placeholder="Your full name"
                  className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="waitlistPhone" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Phone Number *
                </Label>
                <Input
                  id="waitlistPhone"
                  placeholder="+234 801 234 5678"
                  className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="waitlistEmail" className="text-sm font-semibold text-slate-900 mb-2 block">
                Email Address *
              </Label>
              <Input
                id="waitlistEmail"
                type="email"
                placeholder="your.email@example.com"
                className="h-12 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
              />
            </div>

            <div>
              <Label htmlFor="waitlistNotes" className="text-sm font-semibold text-slate-900 mb-2 block">
                Why are you interested in this course? (Optional)
              </Label>
              <Textarea
                id="waitlistNotes"
                placeholder="Tell us about your musical goals and why you'd like to join this course..."
                value={formData.waitlistNotes}
                onChange={(e) => onInputChange("waitlistNotes", e.target.value)}
                className="min-h-24 bg-slate-50 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* How It Works */}
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-3xl">
            <h4 className="font-semibold text-blue-900 mb-4">How Our Waitlist Works</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Instant Notification</p>
                  <p className="text-xs text-blue-700">We'll email and text you when a spot opens up</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="text-sm text-blue-800 font-medium">24-Hour Priority</p>
                  <p className="text-xs text-blue-700">You have 24 hours to confirm your enrollment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Fair Queue System</p>
                  <p className="text-xs text-blue-700">First-come, first-served based on waitlist join time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <h5 className="font-semibold text-slate-900 mb-1">Email Alerts</h5>
              <p className="text-xs text-slate-600">Instant email when spots open</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <h5 className="font-semibold text-slate-900 mb-1">SMS Notifications</h5>
              <p className="text-xs text-slate-600">Text message alerts for faster response</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleJoinWaitlist}
              className="flex-1 h-12 bg-slate-900 hover:bg-amber-500 text-white rounded-2xl font-semibold transform hover:scale-105 transition-all duration-300"
            >
              <Clock className="h-4 w-4 mr-2" />
              Join Priority Waitlist
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-2xl font-semibold"
            >
              Maybe Later
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-slate-500 space-y-1">
            <p>By joining the waitlist, you agree to receive notifications about course availability.</p>
            <p>You can unsubscribe from waitlist notifications at any time.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}