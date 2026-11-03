"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Pencil, Loader2, AlertTriangle } from "lucide-react"

type ChannelKey = "EMAIL" | "SMS" | "WHATSAPP"

interface TemplateRow {
  key: string
  name: string
  description: string
  category: "TRANSACTIONAL" | "MARKETING"
  channels: string[]
  subject: string
  body: string
  shortBody: string | null
  isActive: boolean
  customised: boolean
  fields: string[]
}

interface Preview {
  unknownFields: string[]
  subject: string
  text: string
  html: string
  sms: { text: string; encoding: "GSM" | "UNICODE"; length: number; segments: number }
}

type FieldName = "subject" | "body" | "shortBody"

const CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: "EMAIL", label: "Email" },
  { key: "SMS", label: "SMS" },
  { key: "WHATSAPP", label: "WhatsApp" },
]

const channelLabel = (c: string) => CHANNELS.find((x) => x.key === c)?.label ?? c

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)

  // Editor state
  const [channels, setChannels] = useState<string[]>([])
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [shortBody, setShortBody] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const subjectRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const shortBodyRef = useRef<HTMLTextAreaElement>(null)
  const lastFocused = useRef<FieldName>("body")
  const previewSeq = useRef(0)

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("admin_token")}` })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (!localStorage.getItem("admin_token")) {
        router.push("/admin/login")
        return
      }
      const res = await fetch("/api/admin/templates", { headers: authHeaders() })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const data = await res.json()
      setTemplates(data.templates ?? [])
    } catch (err) {
      console.error("Failed to load templates:", err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const editing = templates.find((t) => t.key === editingKey) ?? null

  const openEditor = (t: TemplateRow) => {
    setEditingKey(t.key)
    setChannels(t.channels)
    setSubject(t.subject)
    setBody(t.body)
    setShortBody(t.shortBody ?? "")
    setIsActive(t.isActive)
    setPreview(null)
    lastFocused.current = "body"
  }

  // Debounced live preview
  useEffect(() => {
    if (!editingKey) return
    const seq = ++previewSeq.current
    setPreviewLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/templates/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ key: editingKey, subject, body, shortBody }),
        })
        if (res.status === 401) {
          router.push("/admin/login")
          return
        }
        const data = await res.json()
        if (seq !== previewSeq.current) return
        if (res.ok) setPreview(data)
      } catch (err) {
        console.error("Preview failed:", err)
      } finally {
        if (seq === previewSeq.current) setPreviewLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingKey, subject, body, shortBody])

  const toggleChannel = (c: string, on: boolean) =>
    setChannels((prev) => (on ? (prev.includes(c) ? prev : [...prev, c]) : prev.filter((x) => x !== c)))

  const insertField = (field: string) => {
    const token = `{{${field}}}`
    const target = lastFocused.current
    const el = target === "subject" ? subjectRef.current : target === "body" ? bodyRef.current : shortBodyRef.current
    const current = target === "subject" ? subject : target === "body" ? body : shortBody
    const setter = target === "subject" ? setSubject : target === "body" ? setBody : setShortBody
    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length
    setter(current.slice(0, start) + token + current.slice(end))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  const applySaved = (t: TemplateRow) => {
    setTemplates((prev) => prev.map((x) => (x.key === t.key ? t : x)))
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/templates/${editing.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ channels, subject, body, shortBody: shortBody.trim() ? shortBody : null, isActive }),
      })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || "Failed to save template")
        return
      }
      applySaved(data.template)
      setEditingKey(null)
    } catch {
      alert("Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!editing) return
    if (!confirm(`Reset "${editing.name}" to the default wording? Your edits to this template will be lost.`)) return
    setResetting(true)
    try {
      const res = await fetch(`/api/admin/templates/${editing.key}`, { method: "DELETE", headers: authHeaders() })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || "Failed to reset template")
        return
      }
      applySaved(data.template)
      openEditor(data.template)
    } catch {
      alert("Failed to reset template")
    } finally {
      setResetting(false)
    }
  }

  const unknown = preview?.unknownFields ?? []

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="h-6 w-6" />
            Templates
          </h1>
          <p className="text-sm text-muted-foreground">
            The wording of every automatic message. Edit the text, choose which channels it goes out on, and preview it
            before saving.
          </p>
        </div>

        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading…</p>
        ) : templates.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>No templates found.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {templates.map((t) => (
              <Card key={t.key} className={t.isActive ? "" : "opacity-70"}>
                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{t.name}</p>
                      <Badge variant={t.category === "MARKETING" ? "outline" : "secondary"}>
                        {t.category === "MARKETING" ? "Marketing (needs email consent)" : "Transactional"}
                      </Badge>
                      {t.customised && <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">Edited</Badge>}
                      <Badge
                        variant="outline"
                        className={t.isActive ? "border-green-200 bg-green-50 text-green-800" : "bg-gray-100 text-gray-600"}
                      >
                        {t.isActive ? "Active" : "Off"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {t.channels.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No channels selected</span>
                      ) : (
                        t.channels.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            {channelLabel(c)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEditor(t)} className="shrink-0 self-start">
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && !saving && setEditingKey(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{editing.name}</DialogTitle>
                <DialogDescription>{editing.description}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Editor */}
                <div className="min-w-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Channels</Label>
                    <div className="flex flex-wrap gap-4">
                      {CHANNELS.map((c) => (
                        <label key={c.key} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox checked={channels.includes(c.key)} onCheckedChange={(v) => toggleChannel(c.key, v === true)} />
                          {c.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SMS and WhatsApp only deliver once a provider is connected. Until then those messages are recorded as
                      Skipped.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tpl-subject">Subject</Label>
                    <Input
                      id="tpl-subject"
                      ref={subjectRef}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      onFocus={() => (lastFocused.current = "subject")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tpl-body">Message</Label>
                    <Textarea
                      id="tpl-body"
                      ref={bodyRef}
                      rows={10}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      onFocus={() => (lastFocused.current = "body")}
                    />
                    <p className="text-xs text-muted-foreground">Plain text. A blank line starts a new paragraph.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tpl-short">Short version for SMS/WhatsApp (optional)</Label>
                    <Textarea
                      id="tpl-short"
                      ref={shortBodyRef}
                      rows={3}
                      value={shortBody}
                      onChange={(e) => setShortBody(e.target.value)}
                      onFocus={() => (lastFocused.current = "shortBody")}
                    />
                    <p className="text-xs text-muted-foreground">If left blank, the full message is used for SMS and WhatsApp.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Merge fields</Label>
                    <p className="text-xs text-muted-foreground">Click a field to insert it where your cursor was last.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {editing.fields.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => insertField(f)}
                          className="rounded-md border bg-muted px-2 py-1 font-mono text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {`{{${f}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch id="tpl-active" checked={isActive} onCheckedChange={setIsActive} />
                    <Label htmlFor="tpl-active">{isActive ? "Active: this message is sent" : "Off: this message is not sent"}</Label>
                  </div>
                </div>

                {/* Preview */}
                <div className="min-w-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Live preview (sample data)</Label>
                    {previewLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>

                  {unknown.length > 0 && (
                    <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Unknown merge field{unknown.length > 1 ? "s" : ""}: {unknown.map((f) => `{{${f}}}`).join(", ")}. The
                        template cannot be saved until {unknown.length > 1 ? "they are" : "it is"} removed.
                      </p>
                    </div>
                  )}

                  {!preview ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Rendering preview…</p>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Email subject</p>
                        <p className="break-words rounded-md border bg-muted/40 p-2 text-sm font-medium">{preview.subject || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                        <iframe
                          title="Email preview"
                          sandbox=""
                          srcDoc={preview.html}
                          className="h-80 w-full rounded-md border bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">SMS / WhatsApp</p>
                        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-2 font-sans text-sm">
                          {preview.sms.text}
                        </pre>
                        <p className="text-xs text-muted-foreground">
                          {preview.sms.length} characters, {preview.sms.segments} segment{preview.sms.segments === 1 ? "" : "s"},{" "}
                          {preview.sms.encoding}
                        </p>
                        {preview.sms.encoding === "UNICODE" && (
                          <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                            Contains characters like the naira sign that make SMS segments shorter (70 characters) and cost more.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={handleReset} disabled={saving || resetting}>
                  {resetting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Reset to default
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button variant="ghost" onClick={() => setEditingKey(null)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving || resetting || unknown.length > 0}>
                    {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
