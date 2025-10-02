"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Timer, CheckCircle, Clock, Users, Award, BookOpen } from "lucide-react"
import Link from "next/link"

interface EnrollmentCardProps {
  courseDetails: {
    modes: string[]
    prices: { [key: string]: number }
    totalSeats: number
    seatsLeft: number
    sessions: { date: string; time: string; available: boolean }[]
  }
}

export function EnrollmentCard({ courseDetails }: EnrollmentCardProps) {
  const [selectedMode, setSelectedMode] = useState(courseDetails.modes[0])
  const [selectedSession, setSelectedSession] = useState("")
  const [homeAddress, setHomeAddress] = useState("")

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

          {/* Session Selection */}
          <div>
            <Label className="text-base font-semibold text-slate-900 mb-4 block">
              Select Start Date & Time
            </Label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-2xl">
                <SelectValue placeholder="Choose your preferred schedule" />
              </SelectTrigger>
              <SelectContent>
                {courseDetails.sessions.map((session, index) => (
                  <SelectItem
                    key={index}
                    value={`${session.date}-${session.time}`}
                    disabled={!session.available}
                  >
                    {session.date} at {session.time}
                    {!session.available && " (Full)"}
                    {session.available && " (Available)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
          {courseDetails.seatsLeft > 0 ? (
            <Link href={'/enroll'}>
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

        {/* Seat Hold Timer */}
        {selectedSession && (
          <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="flex items-center text-amber-800 font-medium">
                <Timer className="h-4 w-4 mr-2" />
                Seat Hold Timer:
              </span>
              <span className="font-mono font-bold text-xl text-amber-600">09:45</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Your selected seat is reserved for 10 minutes. Complete enrollment to secure your spot.
            </p>
          </div>
        )}

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
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-slate-700 font-medium">Certificate of completion</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-slate-700 font-medium">6 months material access</span>
            </div>
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
        <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
          <h5 className="font-semibold text-blue-900 mb-2">30-Day Money Back Guarantee</h5>
          <p className="text-sm text-blue-700 leading-relaxed">
            Not satisfied with your first month? Get a full refund, no questions asked.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}