"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus } from "lucide-react"

interface CourseLite {
  id: string
  title: string
  location?: string
  availableModes: string[]
}

interface StudentRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onRegistered: () => void
}

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  address: "",
  landmark: "",
  courseId: "",
  selectedMode: "",
  priorLevel: "",
  schedulePreference: "",
  musicExperience: "",
  goals: "",
  specialRequests: "",
}

const PRIOR_LEVELS = [
  { v: "complete-beginner", l: "Complete beginner" },
  { v: "some-experience", l: "Some experience" },
  { v: "intermediate", l: "Intermediate" },
  { v: "advanced", l: "Advanced" },
]

export function StudentRegistrationModal({ isOpen, onClose, onRegistered }: StudentRegistrationModalProps) {
  const [form, setForm] = useState({ ...EMPTY })
  const [feePaid, setFeePaid] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [consentToEmails, setConsentToEmails] = useState(false)
  const [courses, setCourses] = useState<CourseLite[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const token = () => (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null)

  useEffect(() => {
    if (!isOpen) return
    setForm({ ...EMPTY })
    setFeePaid(true)
    setPaymentMethod("cash")
    setConsentToEmails(false)
    setError("")
    fetch(`/api/admin/courses`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => setCourses(d.courses ?? d.data ?? []))
      .catch(() => {})
  }, [isOpen])

  const selectedCourse = courses.find((c) => c.id === form.courseId)
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.courseId || !form.selectedMode) {
      setError("First name, last name, email, course and delivery mode are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...form, feePaid, paymentMethod, consentToEmails }),
      })
      const d = await res.json()
      if (res.ok) {
        onRegistered()
        onClose()
      } else {
        setError(d.message || d.error || "Failed to register student")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Register Student (walk-in)
          </DialogTitle>
          <DialogDescription>
            Create a student and enrollment directly. Mark the application fee paid if it was collected in cash.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Student */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Student</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label htmlFor="firstName">First name *</Label><Input id="firstName" value={form.firstName} onChange={set("firstName")} required /></div>
              <div><Label htmlFor="lastName">Last name *</Label><Input id="lastName" value={form.lastName} onChange={set("lastName")} required /></div>
              <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={form.email} onChange={set("email")} required /></div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={set("phone")} /></div>
              <div><Label htmlFor="dateOfBirth">Date of birth</Label><Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} /></div>
            </div>
          </section>

          {/* Guardian */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Guardian (for minors)</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div><Label htmlFor="guardianName">Name</Label><Input id="guardianName" value={form.guardianName} onChange={set("guardianName")} /></div>
              <div><Label htmlFor="guardianPhone">Phone</Label><Input id="guardianPhone" value={form.guardianPhone} onChange={set("guardianPhone")} /></div>
              <div><Label htmlFor="guardianEmail">Email</Label><Input id="guardianEmail" type="email" value={form.guardianEmail} onChange={set("guardianEmail")} /></div>
            </div>
          </section>

          {/* Address */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Address</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label htmlFor="address">Address</Label><Input id="address" value={form.address} onChange={set("address")} /></div>
              <div><Label htmlFor="landmark">Landmark</Label><Input id="landmark" value={form.landmark} onChange={set("landmark")} /></div>
            </div>
          </section>

          {/* Course */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Course</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Course *</Label>
                <Select value={form.courseId} onValueChange={(v) => setForm((p) => ({ ...p, courseId: v, selectedMode: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}{c.location ? ` — ${c.location}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Delivery mode *</Label>
                <Select value={form.selectedMode} onValueChange={(v) => setForm((p) => ({ ...p, selectedMode: v }))} disabled={!selectedCourse}>
                  <SelectTrigger><SelectValue placeholder={selectedCourse ? "Select a mode" : "Pick a course first"} /></SelectTrigger>
                  <SelectContent>
                    {(selectedCourse?.availableModes ?? []).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prior level</Label>
                <Select value={form.priorLevel} onValueChange={(v) => setForm((p) => ({ ...p, priorLevel: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {PRIOR_LEVELS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="schedulePreference">Schedule preference</Label><Input id="schedulePreference" placeholder="e.g. weekday-afternoon" value={form.schedulePreference} onChange={set("schedulePreference")} /></div>
            </div>
            <div><Label htmlFor="goals">Goals</Label><Textarea id="goals" rows={2} value={form.goals} onChange={set("goals")} /></div>
            <div><Label htmlFor="musicExperience">Music experience</Label><Textarea id="musicExperience" rows={2} value={form.musicExperience} onChange={set("musicExperience")} /></div>
            <div><Label htmlFor="specialRequests">Special requests</Label><Textarea id="specialRequests" rows={2} value={form.specialRequests} onChange={set("specialRequests")} /></div>
          </section>

          {/* Payment */}
          <section className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Application fee paid (cash)</Label>
                <p className="text-xs text-muted-foreground">On — record a cash payment and enroll now. Off — leave pending; can be marked paid later.</p>
              </div>
              <Switch checked={feePaid} onCheckedChange={setFeePaid} />
            </div>
            {feePaid && (
              <div className="max-w-xs">
                <Label>Payment method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="pos">POS / Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={consentToEmails} onCheckedChange={setConsentToEmails} id="consent" />
              <Label htmlFor="consent" className="text-sm">Student consents to email updates</Label>
            </div>
          </section>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Registering…" : "Register Student"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
