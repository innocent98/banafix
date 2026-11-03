"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageSquareQuote, Plus, Star, Quote, Loader2 } from "lucide-react"

type Status = "new" | "reviewed" | "archived"
type Source = "EMAIL" | "WEB" | "WHATSAPP" | "ADMIN"

interface FeedbackRow {
  id: string
  authorName: string
  relationship: string | null
  email: string | null
  rating: number | null
  text: string
  source: Source
  allowTestimonial: boolean
  status: Status
  testimonialId: string | null
  createdAt: string
}

interface Counts {
  new: number
  reviewed: number
  archived: number
}

const SOURCE_LABEL: Record<string, string> = {
  EMAIL: "Email",
  WEB: "Website form",
  WHATSAPP: "WhatsApp",
  ADMIN: "Added by admin",
}

const STATUS_TABS: { value: Status | "all"; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
]

const ANY = "any"
const NONE = "none"

const emptyForm = {
  authorName: "",
  relationship: "",
  email: "",
  rating: NONE,
  text: "",
  source: "EMAIL" as "EMAIL" | "WHATSAPP" | "ADMIN",
  allowTestimonial: false,
}

export default function FeedbackPage() {
  const router = useRouter()
  const [items, setItems] = useState<FeedbackRow[]>([])
  const [counts, setCounts] = useState<Counts>({ new: 0, reviewed: 0, archived: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<Status | "all">("new")
  const [sourceFilter, setSourceFilter] = useState(ANY)
  const [quotableOnly, setQuotableOnly] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit): Promise<Response | null> => {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return null
      }
      const res = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
      })
      if (res.status === 401) {
        router.push("/admin/login")
        return null
      }
      return res
    },
    [router],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (statusFilter !== "all") qs.set("status", statusFilter)
      if (sourceFilter !== ANY) qs.set("source", sourceFilter)
      if (quotableOnly) qs.set("testimonial", "1")
      const res = await authedFetch(`/api/admin/feedback?${qs.toString()}`)
      if (!res) return
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to load feedback")
        return
      }
      setItems(data.feedback ?? [])
      setCounts(data.counts ?? { new: 0, reviewed: 0, archived: 0 })
    } catch (err) {
      console.error("Failed to load feedback:", err)
    } finally {
      setLoading(false)
    }
  }, [authedFetch, statusFilter, sourceFilter, quotableOnly])

  useEffect(() => {
    load()
  }, [load])

  const patch = async (f: FeedbackRow, body: { status?: Status; allowTestimonial?: boolean }) => {
    setBusyId(f.id)
    try {
      const res = await authedFetch(`/api/admin/feedback/${f.id}`, { method: "PATCH", body: JSON.stringify(body) })
      if (!res) return
      if (res.ok) await load()
      else alert((await res.json()).error || "Failed to update feedback")
    } catch {
      alert("Failed to update feedback")
    } finally {
      setBusyId(null)
    }
  }

  const togglePermission = (f: FeedbackRow, on: boolean) => {
    if (on && !confirm("Only turn this on if the author has agreed to be quoted publicly. Continue?")) return
    patch(f, { allowTestimonial: on })
  }

  const promote = async (f: FeedbackRow) => {
    setBusyId(f.id)
    try {
      const res = await authedFetch(`/api/admin/feedback/${f.id}/promote`, { method: "POST" })
      if (!res) return
      if (res.ok) await load()
      else {
        const data = await res.json().catch(() => ({}))
        alert(
          data.error ||
            (res.status === 501 ? "The testimonials feature is not live yet." : "Failed to create testimonial"),
        )
      }
    } catch {
      alert("Failed to create testimonial")
    } finally {
      setBusyId(null)
    }
  }

  const openAdd = () => {
    setForm(emptyForm)
    setFieldErrors({})
    setDialogOpen(true)
  }

  const submitAdd = async () => {
    setSaving(true)
    setFieldErrors({})
    try {
      const res = await authedFetch("/api/admin/feedback", {
        method: "POST",
        body: JSON.stringify({
          authorName: form.authorName,
          relationship: form.relationship || undefined,
          email: form.email || undefined,
          rating: form.rating === NONE ? undefined : Number(form.rating),
          text: form.text,
          allowTestimonial: form.allowTestimonial,
          source: form.source,
        }),
      })
      if (!res) return
      const data = await res.json().catch(() => ({}))
      if (res.status === 201) {
        setDialogOpen(false)
        await load()
      } else if (data.fields) {
        setFieldErrors(data.fields)
      } else {
        alert(data.error || "Failed to add feedback")
      }
    } catch {
      alert("Failed to add feedback")
    } finally {
      setSaving(false)
    }
  }

  const countFor = (v: Status | "all") => (v === "all" ? counts.new + counts.reviewed + counts.archived : counts[v])

  const FieldError = ({ name }: { name: string }) =>
    fieldErrors[name] ? <p className="text-xs text-destructive">{fieldErrors[name]}</p> : null

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MessageSquareQuote className="h-6 w-6" />
              Feedback
            </h1>
            <p className="text-sm text-muted-foreground">
              What parents and students tell us through the feedback form. Review it, record whether the author agreed
              to be quoted, and turn the best comments into testimonials. Feedback can also arrive at the feedback email
              address. Until inbound email is automated, copy it in with Add feedback (choose Email as the source).
            </p>
          </div>
          <Button onClick={openAdd} className="w-full sm:w-auto">
            <Plus className="mr-1 h-4 w-4" />
            Add feedback
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((t) => (
              <Button
                key={t.value}
                size="sm"
                variant={statusFilter === t.value ? "default" : "outline"}
                onClick={() => setStatusFilter(t.value)}
              >
                {t.label}
                <span className="ml-1.5 text-xs opacity-80">{countFor(t.value)}</span>
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-52" aria-label="Filter by source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All sources</SelectItem>
                <SelectItem value="WEB">Website form</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="ADMIN">Added by admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox id="quotable" checked={quotableOnly} onCheckedChange={(v) => setQuotableOnly(v === true)} />
              <Label htmlFor="quotable" className="text-sm font-normal">
                Can be quoted as testimonial
              </Label>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <MessageSquareQuote className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p>No feedback yet. Share the link /feedback with parents and students.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((f) => {
              const busy = busyId === f.id
              return (
                <Card key={f.id} className={f.status === "archived" ? "opacity-70" : ""}>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words font-semibold">{f.authorName}</p>
                        <p className="break-words text-sm text-muted-foreground">
                          {[f.relationship, f.email].filter(Boolean).join(" · ") || "No details given"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {f.rating != null && (
                          <span className="flex items-center gap-1 text-sm font-medium">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {f.rating}/5
                          </span>
                        )}
                        <Badge variant="secondary">{SOURCE_LABEL[f.source] ?? f.source}</Badge>
                        {f.status !== "new" && (
                          <Badge variant="outline">{f.status === "reviewed" ? "Reviewed" : "Archived"}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(f.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm">{f.text}</p>

                    <div className="flex flex-wrap items-center gap-2">
                      {f.allowTestimonial ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">OK to quote</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          No permission to quote
                        </Badge>
                      )}
                      {f.testimonialId && (
                        <Badge variant="secondary" title="Unpublished until you review it under Testimonials">
                          Testimonial created
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:flex-wrap sm:items-center">
                      <div className="flex flex-wrap gap-2">
                        {f.status !== "reviewed" && (
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => patch(f, { status: "reviewed" })}>
                            Mark reviewed
                          </Button>
                        )}
                        {f.status !== "archived" ? (
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => patch(f, { status: "archived" })}>
                            Archive
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => patch(f, { status: "new" })}>
                            Move back to New
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`perm-${f.id}`}
                          checked={f.allowTestimonial}
                          disabled={busy}
                          onCheckedChange={(v) => togglePermission(f, v)}
                        />
                        <Label htmlFor={`perm-${f.id}`} className="text-sm font-normal">
                          Permission to quote
                        </Label>
                      </div>
                      {!f.testimonialId && (
                        <div className="flex flex-col gap-1 sm:ml-auto sm:items-end">
                          <Button
                            size="sm"
                            disabled={busy || !f.allowTestimonial}
                            onClick={() => promote(f)}
                            title="Creates an unpublished testimonial. Review it before it appears on the site."
                          >
                            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Quote className="mr-1 h-4 w-4" />}
                            Promote to testimonial
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            {f.allowTestimonial
                              ? "Creates an unpublished testimonial for you to review first."
                              : "Turn on permission to quote first."}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add feedback</DialogTitle>
            <DialogDescription>
              Record feedback that arrived by forwarded email, WhatsApp, or in person.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fb-name">Name</Label>
              <Input
                id="fb-name"
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                aria-invalid={!!fieldErrors.authorName}
              />
              <FieldError name="authorName" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fb-rel">Relationship (optional)</Label>
                <Input
                  id="fb-rel"
                  placeholder="e.g. Parent of a student"
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                />
                <FieldError name="relationship" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fb-email">Email (optional)</Label>
                <Input
                  id="fb-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <FieldError name="email" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Rating (optional)</Label>
                <Select value={form.rating} onValueChange={(v) => setForm({ ...form, rating: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No rating</SelectItem>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} / 5
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError name="rating" />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) => setForm({ ...form, source: v as typeof form.source })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="ADMIN">In person / other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-text">Feedback</Label>
              <Textarea
                id="fb-text"
                rows={5}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                aria-invalid={!!fieldErrors.text}
              />
              <FieldError name="text" />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="fb-allow"
                checked={form.allowTestimonial}
                onCheckedChange={(v) => setForm({ ...form, allowTestimonial: v === true })}
                className="mt-0.5"
              />
              <Label htmlFor="fb-allow" className="text-sm font-normal leading-snug">
                The author agreed to be quoted publicly. Only tick this if they have said so.
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitAdd} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Add feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
