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
import { UserPlus, Search, X } from "lucide-react"
import { ARRANGEMENTS, ARRANGEMENT_LABELS, TIME_BANDS, TIME_BAND_LABELS } from "@/lib/assessment-vocab"
import { formatNaira } from "@/lib/site"
import {
  EMPTY_SCHEDULE_PREFS,
  SchedulePreferencesFields,
  scheduleTimeError,
  schedulePrefsPayload,
  type SchedulePrefsValue,
} from "./schedule-preferences-fields"

interface CourseLite {
  id: string
  title: string
  instrument?: string
  level?: string
}

interface LocationLite {
  id: string
  name: string
  kind: string
  assessmentFee: number
  isActive: boolean
}

interface OfferingLite {
  id: string
  isActive: boolean
  location: { id: string; name: string }
  deliveryMode: { name: string }
}

const NO_OFFERING = "none"

export interface ParentLite {
  id: string
  name: string
  email: string
  phone?: string | null
}

interface StudentRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onRegistered: () => void
  /** Open pre-set to "add a child of this parent" (from /admin/parents). */
  initialParent?: ParentLite | null
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
  locationId: "",
  courseId: "",
  offeringId: "",
  arrangement: "CENTRE",
  preferredDate: "",
  preferredTimeBand: "",
  scheduleAssessmentAt: "",
  priorLevel: "",
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

export function StudentRegistrationModal({ isOpen, onClose, onRegistered, initialParent = null }: StudentRegistrationModalProps) {
  const [form, setForm] = useState({ ...EMPTY })
  const [feePaid, setFeePaid] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [consentToEmails, setConsentToEmails] = useState(false)
  const [prefs, setPrefs] = useState<SchedulePrefsValue>({ ...EMPTY_SCHEDULE_PREFS })
  const [courses, setCourses] = useState<CourseLite[]>([])
  const [locations, setLocations] = useState<LocationLite[]>([])
  const [offerings, setOfferings] = useState<OfferingLite[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [coveredNote, setCoveredNote] = useState("")
  // Stream 6: adult or minor, and the parent the child belongs to (an existing record, or typed below).
  const [registeringFor, setRegisteringFor] = useState<"self" | "child">("self")
  const [parent, setParent] = useState<ParentLite | null>(null)
  const [parentQuery, setParentQuery] = useState("")
  const [parentResults, setParentResults] = useState<ParentLite[]>([])

  const token = () => (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null)

  useEffect(() => {
    if (!isOpen) return
    setForm({ ...EMPTY })
    setFeePaid(true)
    setPaymentMethod("cash")
    setConsentToEmails(false)
    setPrefs({ ...EMPTY_SCHEDULE_PREFS })
    setError("")
    setCoveredNote("")
    setOfferings([])
    setRegisteringFor(initialParent ? "child" : "self")
    setParent(initialParent)
    setParentQuery("")
    setParentResults([])
    const headers = { Authorization: `Bearer ${token()}` }
    fetch(`/api/admin/locations`, { headers })
      .then((r) => r.json())
      .then((d) => setLocations((d.locations ?? []).filter((l: LocationLite) => l.isActive)))
      .catch(() => {})
    // Published + active courses only; the picker does not require an offering at the location.
    fetch(`/api/admin/courses?limit=200`, { headers })
      .then((r) => r.json())
      .then((d) =>
        setCourses((d.courses ?? d.data ?? []).filter((c: CourseLite & { isActive?: boolean; isPublished?: boolean }) => c.isActive !== false && c.isPublished !== false)),
      )
      .catch(() => {})
  }, [isOpen, initialParent])

  // Search existing parents for the child's guardian (Stream 6).
  useEffect(() => {
    const q = parentQuery.trim()
    if (!isOpen || !q) {
      setParentResults([])
      return
    }
    let cancelled = false
    fetch(`/api/admin/parents?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => !cancelled && setParentResults((d.parents ?? []).slice(0, 8)))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [parentQuery, isOpen])

  // Offerings of the chosen course (filtered to the chosen location below).
  useEffect(() => {
    setOfferings([])
    if (!isOpen || !form.courseId) return
    let cancelled = false
    fetch(`/api/admin/courses/${form.courseId}/offerings`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => (r.ok ? r.json() : { offerings: [] }))
      .then((d) => !cancelled && setOfferings(d.offerings ?? []))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isOpen, form.courseId])

  const selectedLocation = locations.find((l) => l.id === form.locationId)
  const locationOfferings = offerings.filter((o) => o.location.id === form.locationId)
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setCoveredNote("")
    const isChild = registeringFor === "child"
    if (!form.firstName.trim() || !form.lastName.trim() || !form.locationId || !form.courseId) {
      setError("First name, last name, location and course are required")
      return
    }
    if (!isChild && !form.email.trim()) {
      setError("Email is required for an adult student")
      return
    }
    if (isChild && !parent && !(form.guardianName.trim() && (form.guardianEmail.trim() || form.guardianPhone.trim()))) {
      setError("A student under 18 needs a parent or guardian: pick an existing parent, or enter their name and an email or phone")
      return
    }
    if (scheduleTimeError(prefs.preferredFromTime, prefs.preferredToTime)) {
      setError("The earliest class time must be before the latest")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          ...form,
          registeringFor,
          parentId: isChild && parent ? parent.id : undefined,
          ...schedulePrefsPayload(prefs),
          offeringId: form.offeringId || undefined,
          preferredDate: form.preferredDate || undefined,
          preferredTimeBand: form.preferredTimeBand || undefined,
          scheduleAssessmentAt: feePaid && form.scheduleAssessmentAt ? new Date(form.scheduleAssessmentAt).toISOString() : undefined,
          feePaid,
          paymentMethod,
          consentToEmails,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        onRegistered()
        const notes: string[] = []
        if (d.feeCovered) notes.push("Assessment fee already covered for this student, no fee recorded.")
        if (isChild && !d.parent) notes.push("No parent record was created or matched (the guardian has no email and no existing parent has that phone). Add or attach one from Parents.")
        if (d.parent?.outcome === "created") notes.push("A new parent record was created for the guardian.")
        if (d.parent?.outcome === "linked") notes.push("The child was added to the existing parent record (it was not changed).")
        if (d.feeCovered || (isChild && !d.parent)) {
          // Keep the dialog open so the note is read; the list behind it already refreshed.
          setCoveredNote(`Registered. ${notes.join(" ")}`)
        } else {
          onClose()
        }
      } else if (res.status === 409) {
        // Conflict (e.g. fee already paid): the server message says exactly what to do.
        setError(d.error || d.message || "This registration conflicts with an existing record")
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
            Register a student for an assessment. Mark the assessment fee paid if it was collected in cash.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Student */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Student</h3>
            <div className="flex gap-2" role="radiogroup" aria-label="Who is registering">
              <Button type="button" size="sm" variant={registeringFor === "self" ? "default" : "outline"} aria-pressed={registeringFor === "self"} onClick={() => setRegisteringFor("self")}>Adult (18+)</Button>
              <Button type="button" size="sm" variant={registeringFor === "child" ? "default" : "outline"} aria-pressed={registeringFor === "child"} onClick={() => setRegisteringFor("child")}>Child (under 18)</Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label htmlFor="firstName">First name *</Label><Input id="firstName" value={form.firstName} onChange={set("firstName")} required /></div>
              <div><Label htmlFor="lastName">Last name *</Label><Input id="lastName" value={form.lastName} onChange={set("lastName")} required /></div>
              <div>
                <Label htmlFor="email">{registeringFor === "child" ? "Student email (optional)" : "Email *"}</Label>
                <Input id="email" type="email" value={form.email} onChange={set("email")} required={registeringFor !== "child"} />
                {registeringFor === "child" && (
                  <p className="mt-1 text-xs text-muted-foreground">Leave blank if the child has none: they are registered under the guardian&apos;s mailbox.</p>
                )}
              </div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={set("phone")} /></div>
              <div><Label htmlFor="dateOfBirth">Date of birth</Label><Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} /></div>
            </div>
          </section>

          {/* Parent / guardian */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {registeringFor === "child" ? "Parent / guardian (required)" : "Guardian (optional)"}
            </h3>
            {parent ? (
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span>
                  Linked to existing parent <strong>{parent.name}</strong> ({parent.email}). Their record is not changed.
                </span>
                {!initialParent && (
                  <button type="button" onClick={() => setParent(null)} aria-label="Unlink parent"><X className="h-4 w-4" /></button>
                )}
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Find an existing parent by name or email…" value={parentQuery} onChange={(e) => setParentQuery(e.target.value)} />
                </div>
                {parentResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-md border">
                    {parentResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setParent(p)
                          setParentQuery("")
                          setParentResults([])
                          setRegisteringFor("child")
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span>{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Or enter the guardian below. An existing parent with the same email is matched automatically (a phone number alone is only used when no email is given); an existing parent&apos;s details are never overwritten, and a new parent is created otherwise.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div><Label htmlFor="guardianName">Name</Label><Input id="guardianName" value={form.guardianName} onChange={set("guardianName")} /></div>
                  <div><Label htmlFor="guardianPhone">Phone</Label><Input id="guardianPhone" value={form.guardianPhone} onChange={set("guardianPhone")} /></div>
                  <div><Label htmlFor="guardianEmail">Email</Label><Input id="guardianEmail" type="email" value={form.guardianEmail} onChange={set("guardianEmail")} /></div>
                </div>
              </>
            )}
          </section>

          {/* Address */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Address</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label htmlFor="address">Address</Label><Input id="address" value={form.address} onChange={set("address")} /></div>
              <div><Label htmlFor="landmark">Landmark</Label><Input id="landmark" value={form.landmark} onChange={set("landmark")} /></div>
            </div>
          </section>

          {/* Location, course, format */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Location and course</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Location *</Label>
                <Select value={form.locationId} onValueChange={(v) => setForm((p) => ({ ...p, locationId: v, offeringId: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name} ({l.kind === "ONLINE" ? "Online" : "Physical"})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Course *</Label>
                <Select value={form.courseId} onValueChange={(v) => setForm((p) => ({ ...p, courseId: v, offeringId: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Format (optional)</Label>
                <Select
                  value={form.offeringId || NO_OFFERING}
                  onValueChange={(v) => setForm((p) => ({ ...p, offeringId: v === NO_OFFERING ? "" : v }))}
                  disabled={!form.courseId || !form.locationId}
                >
                  <SelectTrigger><SelectValue placeholder={form.courseId && form.locationId ? "Decide at assessment" : "Pick a location and course first"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_OFFERING}>Decide at assessment</SelectItem>
                    {locationOfferings.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.deliveryMode.name}{o.isActive ? "" : " (inactive)"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.courseId && form.locationId && locationOfferings.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    This course has no offering at {selectedLocation?.name ?? "this location"} yet. You can still register the student; the format and rate are agreed after the assessment.
                  </p>
                )}
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
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">When would the student like classes?</h4>
              <SchedulePreferencesFields value={prefs} onChange={setPrefs} />
            </div>
            <div><Label htmlFor="goals">Goals</Label><Textarea id="goals" rows={2} value={form.goals} onChange={set("goals")} /></div>
            <div><Label htmlFor="musicExperience">Music experience</Label><Textarea id="musicExperience" rows={2} value={form.musicExperience} onChange={set("musicExperience")} /></div>
            <div><Label htmlFor="specialRequests">Special requests</Label><Textarea id="specialRequests" rows={2} value={form.specialRequests} onChange={set("specialRequests")} /></div>
          </section>

          {/* Assessment */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Assessment</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label>Arrangement</Label>
                <Select value={form.arrangement} onValueChange={(v) => setForm((p) => ({ ...p, arrangement: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ARRANGEMENTS.map((a) => <SelectItem key={a} value={a}>{ARRANGEMENT_LABELS[a]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="preferredDate">Preferred date</Label><Input id="preferredDate" type="date" value={form.preferredDate} onChange={set("preferredDate")} /></div>
              <div>
                <Label>Preferred time</Label>
                <Select value={form.preferredTimeBand || "any"} onValueChange={(v) => setForm((p) => ({ ...p, preferredTimeBand: v === "any" ? "" : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">No preference</SelectItem>
                    {TIME_BANDS.map((b) => <SelectItem key={b} value={b}>{TIME_BAND_LABELS[b]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.arrangement === "HOME" && (
              <p className="text-xs text-muted-foreground">The address and landmark above are used for the home visit.</p>
            )}
          </section>

          {/* Payment */}
          <section className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">
                  Assessment fee paid{selectedLocation ? ` (${formatNaira(selectedLocation.assessmentFee)})` : ""}
                </Label>
                <p className="text-xs text-muted-foreground">
                  On: record the payment and move to Assessment paid. Off: leave pending; mark it paid later. The fee is set per location and is non-refundable.
                </p>
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
            {feePaid && (
              <div className="max-w-xs">
                <Label htmlFor="scheduleAssessmentAt">Schedule assessment now (optional)</Label>
                <Input id="scheduleAssessmentAt" type="datetime-local" value={form.scheduleAssessmentAt} onChange={set("scheduleAssessmentAt")} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={consentToEmails} onCheckedChange={setConsentToEmails} id="consent" />
              <Label htmlFor="consent" className="text-sm">{registeringFor === "child" ? "Parent/guardian consents to email updates" : "Student consents to email updates"}</Label>
            </div>
          </section>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {coveredNote && <Alert><AlertDescription>{coveredNote}</AlertDescription></Alert>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{coveredNote ? "Close" : "Cancel"}</Button>
            {!coveredNote && <Button type="submit" disabled={saving}>{saving ? "Registering…" : "Register Student"}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
