"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle, Clock, Users, Award, BookOpen, Calendar } from "lucide-react"
import Link from "next/link"

interface EnrollmentCardProps {
  courseDetails: {
    id: string
    modes: string[]
    prices: { [key: string]: number }
    totalSeats: number
    seatsLeft: number
    unlimitedSeats?: boolean
    sessionStartDate: string | Date | null
    sessions?: { date: string; time: string; available: boolean }[]
  }
}

export function EnrollmentCard({ courseDetails }: EnrollmentCardProps) {
  const [selectedMode, setSelectedMode] = useState(courseDetails.modes[0])
  const [homeAddress, setHomeAddress] = useState("")

  // Parse the start date, guarding against null/empty/invalid values.
  // `new Date(null)` yields the Unix epoch (Jan 1 1970), so we must check explicitly.
  const parseValidDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return null
    const date = new Date(dateInput)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const sessionStart = parseValidDate(courseDetails.sessionStartDate)

  const formatSessionDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const formatSessionTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

  const seatProgress = ((courseDetails.totalSeats - courseDetails.seatsLeft) / courseDetails.totalSeats) * 100
  const currentPrice = courseDetails.prices[selectedMode]

  return (
    <Card className="sticky top-6 border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
      <CardContent className="p-6 lg:p-8">
        {/* Price Section */}
        <div className="text-center mb-8">
          <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
            ₦{currentPrice?.toLocaleString()}
          </div>
          <div className="text-slate-500 font-medium mb-6">per complete course</div>

          {/* Seat Availability */}
          <div className="space-y-3">
            {courseDetails.unlimitedSeats ? (
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-green-600">
                <Users className="h-4 w-4" />
                Unlimited seats available
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Seats Available:</span>
                  <span className="font-bold text-amber-600">
                    {courseDetails.seatsLeft}/{courseDetails.totalSeats}
                  </span>
                </div>
                <Progress value={seatProgress} className="h-3 bg-slate-100" />
                <p className="text-xs text-slate-500 font-medium">
                  Only {courseDetails.seatsLeft} seats left! {Math.round(seatProgress)}% filled
                </p>
              </>
            )}
          </div>
        </div>

        {/* Training Mode Selection */}
        <div className="space-y-6 mb-8">
          <div>
            <Label className="text-base font-semibold text-slate-900 mb-4 block">
              Choose Training Mode
            </Label>
            <RadioGroup value={selectedMode} onValueChange={setSelectedMode} className="space-y-3">
              {courseDetails.modes.map((mode) => (
                <div key={mode} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                  <RadioGroupItem value={mode} id={mode} className="border-slate-300" />
                  <Label htmlFor={mode} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{mode}</span>
                      <span className="text-lg font-bold text-amber-600">
                        ₦{courseDetails.prices[mode]?.toLocaleString()}
                      </span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Session Information — only shown when a start date is configured */}
          {sessionStart && (
            <div>
              <Label className="text-base font-semibold text-slate-900 mb-4 block">
                Course Starts
              </Label>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      {formatSessionDate(sessionStart)}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">
                      at {formatSessionTime(sessionStart)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Home Training Address */}
          {selectedMode === "Home Training" && (
            <div>
              <Label className="text-base font-semibold text-slate-900 mb-4 block">
                Your Address
              </Label>
              <Input
                placeholder="Enter your full address"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                className="h-12 bg-slate-50 border-slate-200 rounded-2xl"
              />
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We cover Lagos mainland and island areas. Additional travel charges may apply for distant locations.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          {(courseDetails.unlimitedSeats || courseDetails.seatsLeft > 0) ? (
            <Link href={`/enroll?courseId=${encodeURIComponent(courseDetails.id)}`}>
              <Button
                size="lg"
                className="w-full h-14 bg-slate-900 cursor-pointer hover:bg-amber-500 text-white rounded-2xl font-semibold text-lg transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Enroll Now - ₦{currentPrice?.toLocaleString()}
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 bg-orange-500 text-white hover:bg-orange-600 rounded-2xl font-semibold text-lg border-orange-500"
            >
              Join Waitlist
            </Button>
          )}
          {/* <Button
            variant="outline"
            size="lg"
            className="w-full h-14 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-2xl font-semibold"
          >
            Book Free Trial Lesson
          </Button> */}
        </div>


        {/* Course Features */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 text-lg">What's Included</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-slate-700 font-medium">Flexible scheduling & makeup sessions</span>
            </div>
            {/* <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-slate-700 font-medium">Certificate of completion</span>
            </div> */}
            {/* <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-slate-700 font-medium">6 months material access</span>
            </div> */}
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-slate-700 font-medium">Performance opportunities</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-slate-700 font-medium">Lifetime alumni network access</span>
            </div>
          </div>
        </div>

        {/* Money Back Guarantee */}
        {/* <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
          <h5 className="font-semibold text-blue-900 mb-2">30-Day Money Back Guarantee</h5>
          <p className="text-sm text-blue-700 leading-relaxed">
            Not satisfied with your first month? Get a full refund, no questions asked.
          </p>
        </div> */}
      </CardContent>
    </Card>
  )
}