"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin } from "lucide-react"

export interface LocationRow {
  id: string
  name: string
  slug: string
  kind: "PHYSICAL" | "ONLINE"
  assessmentFee: number
  isActive: boolean
  order: number
  address: string | null
  _count?: { offerings: number; enrollments: number }
}

interface LocationFormModalProps {
  location: LocationRow | null // null = create
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const EMPTY = { name: "", kind: "PHYSICAL", assessmentFee: "", order: "0", address: "", isActive: true }

export function LocationFormModal({ location, isOpen, onClose, onSaved }: LocationFormModalProps) {
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setError("")
    setForm(
      location
        ? {
            name: location.name,
            kind: location.kind,
            assessmentFee: String(location.assessmentFee),
            order: String(location.order),
            address: location.address ?? "",
            isActive: location.isActive,
          }
        : { ...EMPTY },
    )
  }, [isOpen, location])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const fee = Number(form.assessmentFee)
    if (!form.name.trim()) return setError("Name is required")
    if (form.assessmentFee === "" || !Number.isInteger(fee) || fee < 0) {
      return setError("Assessment fee must be a whole number of naira (0 or more)")
    }
    setSaving(true)
    try {
      const token = localStorage.getItem("admin_token")
      const res = await fetch(location ? `/api/admin/locations/${location.id}` : "/api/admin/locations", {
        method: location ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          kind: form.kind,
          assessmentFee: fee,
          order: Number(form.order) || 0,
          address: form.address,
          isActive: form.isActive,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        onSaved()
        onClose()
      } else {
        setError(d.error || "Failed to save location")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {location ? "Edit Location" : "Add Location"}
          </DialogTitle>
          <DialogDescription>
            Students pick a location first; the assessment fee below is charged at that location.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="loc-name">Name *</Label>
            <Input id="loc-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            {location && (
              <p className="mt-1 text-xs text-muted-foreground">
                Public URL key: <code>{location.slug}</code> (stays the same when you rename)
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="loc-kind">Kind</Label>
              <select
                id="loc-kind"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.kind}
                onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value }))}
              >
                <option value="PHYSICAL">Physical</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div>
              <Label htmlFor="loc-fee">Assessment fee (₦) *</Label>
              <Input
                id="loc-fee"
                type="number"
                min={0}
                step={1}
                value={form.assessmentFee}
                onChange={(e) => setForm((p) => ({ ...p, assessmentFee: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="loc-order">Display order</Label>
              <Input id="loc-order" type="number" step={1} value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Switch id="loc-active" checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
              <Label htmlFor="loc-active" className="cursor-pointer">Active (visible to students)</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="loc-address">Address (optional)</Label>
            <Input id="loc-address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
