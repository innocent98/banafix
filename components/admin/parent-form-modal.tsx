"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Users, X, Search } from "lucide-react"

interface Child {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface ParentFormModalProps {
  parentId: string | null // null = create
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const EMPTY = { name: "", email: "", phone: "", address: "", birthdayMonth: "", birthdayDay: "" }

export function ParentFormModal({ parentId, isOpen, onClose, onSaved }: ParentFormModalProps) {
  const [form, setForm] = useState({ ...EMPTY })
  const [children, setChildren] = useState<Child[]>([])
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Child[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const token = () => (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null)

  useEffect(() => {
    if (!isOpen) return
    setForm({ ...EMPTY })
    setChildren([])
    setQuery("")
    setResults([])
    setError("")
    if (parentId) {
      fetch(`/api/admin/parents/${parentId}`, { headers: { Authorization: `Bearer ${token()}` } })
        .then((r) => r.json())
        .then((d) => {
          const p = d.parent
          if (!p) return
          setForm({
            name: p.name ?? "",
            email: p.email ?? "",
            phone: p.phone ?? "",
            address: p.address ?? "",
            birthdayMonth: p.birthdayMonth != null ? String(p.birthdayMonth) : "",
            birthdayDay: p.birthdayDay != null ? String(p.birthdayDay) : "",
          })
          setChildren(p.children ?? [])
        })
        .catch(() => setError("Failed to load parent"))
    }
  }, [isOpen, parentId])

  // Search enrolled students for the child picker.
  useEffect(() => {
    if (!isOpen) return
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    let cancelled = false
    fetch(`/api/admin/students?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setResults(d.students ?? [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [query, isOpen])

  const addChild = (c: Child) => {
    if (!children.some((x) => x.id === c.id)) setChildren((prev) => [...prev, c])
    setQuery("")
    setResults([])
  }
  const removeChild = (id: string) => setChildren((prev) => prev.filter((c) => c.id !== id))

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required")
      return
    }
    const hasMonth = form.birthdayMonth !== ""
    const hasDay = form.birthdayDay !== ""
    if (hasMonth !== hasDay) {
      setError("Provide both birthday month and day, or neither")
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        birthdayMonth: hasMonth ? Number(form.birthdayMonth) : null,
        birthdayDay: hasDay ? Number(form.birthdayDay) : null,
        childIds: children.map((c) => c.id),
      }
      const res = await fetch(parentId ? `/api/admin/parents/${parentId}` : "/api/admin/parents", {
        method: parentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (res.ok) {
        onSaved()
        onClose()
      } else {
        setError(d.message || d.error || "Failed to save parent")
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
            <Users className="h-5 w-5" />
            {parentId ? "Edit Parent" : "Add Parent"}
          </DialogTitle>
          <DialogDescription>
            Parent/guardian details and the enrolled students they are responsible for.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={set("name")} required />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={set("phone")} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={set("address")} />
            </div>
          </div>

          <div>
            <Label>Birthday (month &amp; day only)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={12}
                placeholder="MM"
                className="w-24"
                value={form.birthdayMonth}
                onChange={set("birthdayMonth")}
              />
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                min={1}
                max={31}
                placeholder="DD"
                className="w-24"
                value={form.birthdayDay}
                onChange={set("birthdayDay")}
              />
            </div>
          </div>

          {/* Children picker */}
          <div>
            <Label>Children (enrolled students)</Label>
            {children.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {children.map((c) => (
                  <Badge key={c.id} variant="secondary" className="flex items-center gap-1">
                    {c.firstName} {c.lastName}
                    <button type="button" onClick={() => removeChild(c.id)} aria-label={`Remove ${c.firstName}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search enrolled students by name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {results.length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-md border">
                {results
                  .filter((r) => !children.some((c) => c.id === r.id))
                  .map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => addChild(r)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span>{r.firstName} {r.lastName}</span>
                      <span className="text-xs text-muted-foreground">{r.email}</span>
                    </button>
                  ))}
              </div>
            )}
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
              {saving ? "Saving…" : parentId ? "Save Changes" : "Add Parent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
