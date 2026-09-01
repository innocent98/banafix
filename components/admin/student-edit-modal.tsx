"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserCog } from "lucide-react"

interface StudentEditModalProps {
  studentId: string | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

interface StudentForm {
  email: string
  firstName: string
  lastName: string
  phone: string
  dateOfBirth: string
  address: string
  landmark: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
}

const EMPTY: StudentForm = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  landmark: "",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
}

export function StudentEditModal({ studentId, isOpen, onClose, onSaved }: StudentEditModalProps) {
  const [form, setForm] = useState<StudentForm>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!isOpen || !studentId) return
    setError("")
    setSuccess("")
    setLoading(true)
    const token = localStorage.getItem("admin_token")
    fetch(`/api/admin/students/${studentId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const s = d.student
        if (!s) {
          setError("Failed to load student")
          return
        }
        setForm({
          email: s.email ?? "",
          firstName: s.firstName ?? "",
          lastName: s.lastName ?? "",
          phone: s.phone ?? "",
          dateOfBirth: s.dateOfBirth ? String(s.dateOfBirth).slice(0, 10) : "",
          address: s.address ?? "",
          landmark: s.landmark ?? "",
          guardianName: s.guardianName ?? "",
          guardianPhone: s.guardianPhone ?? "",
          guardianEmail: s.guardianEmail ?? "",
        })
      })
      .catch(() => setError("Failed to load student"))
      .finally(() => setLoading(false))
  }, [isOpen, studentId])

  const set = (k: keyof StudentForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) return
    setError("")
    setSuccess("")
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required")
      return
    }
    setSaving(true)
    try {
      const token = localStorage.getItem("admin_token")
      // Never send email — it is immutable.
      const { email: _email, ...editable } = form
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editable),
      })
      const d = await res.json()
      if (res.ok) {
        setSuccess("Student updated")
        onSaved()
        setTimeout(() => {
          onClose()
          setSuccess("")
        }, 1000)
      } else {
        setError(d.message || d.error || "Failed to update student")
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
            <UserCog className="h-5 w-5" />
            Edit Student
          </DialogTitle>
          <DialogDescription>
            Update the student&apos;s record. Email is permanent and cannot be changed.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="email">Email (permanent)</Label>
              <Input id="email" value={form.email} disabled readOnly />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={form.firstName} onChange={set("firstName")} required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={form.lastName} onChange={set("lastName")} required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={set("phone")} />
              </div>
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={set("address")} />
            </div>
            <div>
              <Label htmlFor="landmark">Landmark</Label>
              <Input id="landmark" value={form.landmark} onChange={set("landmark")} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="gname">Guardian Name</Label>
                <Input id="gname" value={form.guardianName} onChange={set("guardianName")} />
              </div>
              <div>
                <Label htmlFor="gphone">Guardian Phone</Label>
                <Input id="gphone" value={form.guardianPhone} onChange={set("guardianPhone")} />
              </div>
              <div>
                <Label htmlFor="gemail">Guardian Email</Label>
                <Input id="gemail" value={form.guardianEmail} onChange={set("guardianEmail")} />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
