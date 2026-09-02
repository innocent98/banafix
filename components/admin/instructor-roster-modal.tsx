"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, X } from "lucide-react"

interface CourseLite {
  id: string
  title: string
  instrument?: string
  level?: string
}

interface InstructorRosterModalProps {
  instructorId: string | null // null = create
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const EMPTY = {
  name: "",
  bio: "",
  avatar: "",
  credentials: "",
  rating: "",
  experience: "",
  availability: "",
  verified: false,
}

export function InstructorRosterModal({ instructorId, isOpen, onClose, onSaved }: InstructorRosterModalProps) {
  const [form, setForm] = useState({ ...EMPTY })
  const [allCourses, setAllCourses] = useState<CourseLite[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const token = () => (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null)

  useEffect(() => {
    if (!isOpen) return
    setForm({ ...EMPTY })
    setSelectedCourseIds([])
    setError("")

    // Load all courses for the assignment picker.
    fetch(`/api/admin/courses`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => setAllCourses(d.courses ?? d.data ?? []))
      .catch(() => {})

    if (instructorId) {
      fetch(`/api/admin/instructors/${instructorId}`, { headers: { Authorization: `Bearer ${token()}` } })
        .then((r) => r.json())
        .then((d) => {
          const i = d.instructor
          if (!i) return
          setForm({
            name: i.name ?? "",
            bio: i.bio ?? "",
            avatar: i.avatar ?? "",
            credentials: (i.credentials ?? []).join(", "),
            rating: i.rating != null ? String(i.rating) : "",
            experience: i.experience ?? "",
            availability: i.availability ?? "",
            verified: Boolean(i.verified),
          })
          setSelectedCourseIds((i.courses ?? []).map((c: CourseLite) => c.id))
        })
        .catch(() => setError("Failed to load instructor"))
    }
  }, [isOpen, instructorId])

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const toggleCourse = (id: string) =>
    setSelectedCourseIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.name.trim()) {
      setError("Name is required")
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        avatar: form.avatar,
        credentials: form.credentials.split(",").map((c) => c.trim()).filter(Boolean),
        rating: form.rating === "" ? 0 : Number(form.rating),
        experience: form.experience,
        availability: form.availability,
        verified: form.verified,
        courseIds: selectedCourseIds,
      }
      const res = await fetch(instructorId ? `/api/admin/instructors/${instructorId}` : "/api/admin/instructors", {
        method: instructorId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (res.ok) {
        onSaved()
        onClose()
      } else {
        setError(d.message || d.error || "Failed to save instructor")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {instructorId ? "Edit Instructor" : "Add Instructor"}
          </DialogTitle>
          <DialogDescription>Roster instructor details and the courses they teach.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={set("name")} required />
            </div>
            <div>
              <Label htmlFor="experience">Experience</Label>
              <Input id="experience" placeholder="e.g. 15 years" value={form.experience} onChange={set("experience")} />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} value={form.bio} onChange={set("bio")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="credentials">Credentials (comma-separated)</Label>
              <Input id="credentials" placeholder="Grade 8, Diploma" value={form.credentials} onChange={set("credentials")} />
            </div>
            <div>
              <Label htmlFor="availability">Availability</Label>
              <Input id="availability" placeholder="Mon-Fri: 9AM-6PM" value={form.availability} onChange={set("availability")} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input id="avatar" value={form.avatar} onChange={set("avatar")} />
            </div>
            <div>
              <Label htmlFor="rating">Rating (0–5)</Label>
              <Input id="rating" type="number" min={0} max={5} step={0.1} value={form.rating} onChange={set("rating")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verified"
              checked={form.verified}
              onChange={(e) => setForm((prev) => ({ ...prev, verified: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="verified">Verified instructor</Label>
          </div>

          {/* Course assignment */}
          <div>
            <Label>Courses taught</Label>
            {allCourses.length === 0 ? (
              <p className="text-xs text-muted-foreground">No courses available.</p>
            ) : (
              <div className="mt-1 max-h-44 space-y-1 overflow-y-auto rounded-md border p-2">
                {allCourses.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.includes(c.id)}
                      onChange={() => toggleCourse(c.id)}
                      className="rounded border-gray-300"
                    />
                    <span>{c.title}</span>
                    {c.instrument && <span className="text-xs text-muted-foreground">· {c.instrument}</span>}
                  </label>
                ))}
              </div>
            )}
            {selectedCourseIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedCourseIds.map((id) => {
                  const c = allCourses.find((x) => x.id === id)
                  return c ? (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {c.title}
                      <button type="button" onClick={() => toggleCourse(id)} aria-label={`Remove ${c.title}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null
                })}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Assigning a course here replaces its current instructor (a course has one instructor).
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : instructorId ? "Save Changes" : "Add Instructor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
