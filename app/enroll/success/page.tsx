"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, Clock, Calendar } from "lucide-react"

interface VerifyResult {
  status: "completed" | "pending" | "failed"
  amount: number
  receiptNumber: string
  enrollment: {
    firstName: string
    email: string
    course: {
      title: string
      instructor: string | null
      sessionStartDate: string | null
    }
  }
}

function formatDate(dateInput: string | null) {
  if (!dateInput) return null
  const date = new Date(dateInput)
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference") || searchParams.get("trxref")

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!reference) {
      setError("No payment reference found.")
      setLoading(false)
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/enrollments/verify?reference=${encodeURIComponent(reference)}`)
        const data = await res.json()
        if (res.ok) {
          setResult(data)
        } else {
          setError(data.error || "We couldn't verify your payment.")
        }
      } catch {
        setError("We couldn't verify your payment. Please contact support with your reference.")
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [reference])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-4" />
        <p className="text-slate-600 text-lg">Confirming your payment…</p>
      </div>
    )
  }

  // Error or unverifiable
  if (error || !result) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-3">We're confirming your payment</h1>
        <p className="text-slate-600 mb-6">
          {error || "Your payment is being processed."} If you completed payment, your enrollment will be confirmed
          shortly{reference ? <> (reference <span className="font-mono">{reference}</span>)</> : null}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/courses"><Button variant="outline">Browse Courses</Button></Link>
          <Link href="/contact"><Button>Contact Support</Button></Link>
        </div>
      </div>
    )
  }

  const startDate = formatDate(result.enrollment.course.sessionStartDate)

  if (result.status === "failed") {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-3">Payment not completed</h1>
        <p className="text-slate-600 mb-6">
          Your registration payment for <strong>{result.enrollment.course.title}</strong> didn't go through. You can
          try again — no charge was made.
        </p>
        <Link href={`/courses`}><Button>Try Again</Button></Link>
      </div>
    )
  }

  if (result.status === "pending") {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-3">Payment processing</h1>
        <p className="text-slate-600 mb-6">
          We've received your payment and are confirming it. You'll get an email once your spot in{" "}
          <strong>{result.enrollment.course.title}</strong> is secured.
        </p>
        <Link href="/courses"><Button variant="outline">Browse Courses</Button></Link>
      </div>
    )
  }

  // completed
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-3xl font-heading font-bold text-slate-900 mb-3">You're enrolled! 🎉</h1>
      <p className="text-slate-600 mb-8">
        Thanks, {result.enrollment.firstName}. Your registration for <strong>{result.enrollment.course.title}</strong>{" "}
        is confirmed. A receipt has been sent to {result.enrollment.email}.
      </p>

      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white text-left mb-8">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-slate-500">Course</span>
            <span className="font-semibold text-slate-900">{result.enrollment.course.title}</span>
          </div>
          {result.enrollment.course.instructor && (
            <div className="flex justify-between">
              <span className="text-slate-500">Instructor</span>
              <span className="font-semibold text-slate-900">{result.enrollment.course.instructor}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Registration Fee Paid</span>
            <span className="font-semibold text-slate-900">₦{result.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Receipt No.</span>
            <span className="font-mono text-sm text-slate-900">{result.receiptNumber}</span>
          </div>
          {startDate && (
            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
              <span className="text-slate-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Starts</span>
              <span className="font-semibold text-slate-900">{startDate}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/"><Button variant="outline">Back to Home</Button></Link>
        <Link href="/courses"><Button>Explore More Courses</Button></Link>
      </div>
    </div>
  )
}

export default function EnrollSuccessPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4">
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}
