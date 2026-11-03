"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Megaphone, Send, Loader2, ExternalLink, AlertTriangle } from "lucide-react"

type Channel = "EMAIL" | "SMS" | "WHATSAPP"
type Scope = "students" | "parents" | "both"

interface Progress4 {
  queued: number
  sent: number
  failed: number
  skipped: number
}

interface AnnouncementRow {
  id: string
  subject: string
  body: string
  channels: string[]
  category: string
  audience: {
    scope?: Scope
    locationId?: string | null
    courseId?: string | null
    includeApplicants?: boolean
  } | null
  recipientCount: number
  createdAt: string
  progress: Progress4
}

interface Preview {
  students: number
  parents: number
  channels: Record<string, { deliverable: number; skipped: number }>
}

interface DispatchResult {
  attempted: number
  sent: number
  failed: number
  skipped: number
  remaining: number
}

const CHANNELS: { value: Channel; label: string }[] = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
]

const CHANNEL_LABEL: Record<string, string> = { EMAIL: "Email", SMS: "SMS", WHATSAPP: "WhatsApp" }

const SCOPE_LABEL: Record<Scope, string> = {
  students: "Students",
  parents: "Parents only",
  both: "Students and parents",
}

const MERGE_FIELDS = ["{{firstName}}", "{{lastName}}", "{{fullName}}", "{{academyName}}", "{{supportEmail}}", "{{siteUrl}}"]

const ALL = "all"

export default function AnnouncementsPage() {
  const router = useRouter()

  // compose state
  const [scope, setScope] = useState<Scope>("both")
  const [locationId, setLocationId] = useState(ALL)
  const [courseId, setCourseId] = useState(ALL)
  const [includeApplicants, setIncludeApplicants] = useState(false)
  const [channels, setChannels] = useState<Channel[]>(["EMAIL"])
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [shortBody, setShortBody] = useState("")
  const [operational, setOperational] = useState(false)

  // reference data
  const [locations, setLocations] = useState<{ id: string; name: string; isActive?: boolean }[]>([])
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])

  // preview
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // sending
  const [sending, setSending] = useState(false)
  const [deliveredSoFar, setDeliveredSoFar] = useState(0)
  const [totalToDeliver, setTotalToDeliver] = useState(0)
  const [sendStatus, setSendStatus] = useState<string | null>(null)

  // history
  const [history, setHistory] = useState<AnnouncementRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [dispatchingId, setDispatchingId] = useState<string | null>(null)

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("admin_token")}` })

  // Returns the Response, or null after redirecting to login.
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

  const loadHistory = useCallback(async () => {
    try {
      const res = await authedFetch("/api/admin/announcements")
      if (!res) return
      const data = await res.json()
      setHistory(data.announcements ?? [])
    } catch (err) {
      console.error("Failed to load announcements:", err)
    } finally {
      setHistoryLoading(false)
    }
  }, [authedFetch])

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      router.push("/admin/login")
      return
    }
    loadHistory()
    ;(async () => {
      try {
        const [locRes, courseRes] = await Promise.all([
          fetch("/api/admin/locations", { headers: authHeaders() }),
          fetch("/api/admin/courses?limit=200", { headers: authHeaders() }),
        ])
        if (locRes.ok) {
          const d = await locRes.json()
          setLocations(d.locations ?? [])
        }
        if (courseRes.ok) {
          const d = await courseRes.json()
          setCourses((d.courses ?? []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })))
        }
      } catch (err) {
        console.error("Failed to load audience options:", err)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buildFilter = () => ({
    scope,
    ...(locationId !== ALL ? { locationId } : {}),
    ...(courseId !== ALL ? { courseId } : {}),
    includeApplicants,
  })

  // Debounced audience preview
  const reqSeq = useRef(0)
  useEffect(() => {
    if (channels.length === 0) {
      setPreview(null)
      setPreviewError(null)
      setPreviewLoading(false)
      return
    }
    setPreviewLoading(true)
    const seq = ++reqSeq.current
    const t = setTimeout(async () => {
      try {
        const res = await authedFetch("/api/admin/announcements/preview", {
          method: "POST",
          body: JSON.stringify({ channels, operational, filter: buildFilter() }),
        })
        if (!res || seq !== reqSeq.current) return
        const data = await res.json()
        if (!res.ok) {
          setPreview(null)
          setPreviewError(data.error || "Could not preview the audience")
        } else {
          setPreview(data.preview)
          setPreviewError(null)
        }
      } catch {
        if (seq === reqSeq.current) setPreviewError("Could not preview the audience")
      } finally {
        if (seq === reqSeq.current) setPreviewLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, locationId, courseId, includeApplicants, channels, operational])

  const toggleChannel = (c: Channel, on: boolean) =>
    setChannels((prev) => (on ? (prev.includes(c) ? prev : [...prev, c]) : prev.filter((x) => x !== c)))

  const previewSummary = () => {
    if (!preview) return null
    const people = `${preview.students} student${preview.students === 1 ? "" : "s"}, ${preview.parents} parent${preview.parents === 1 ? "" : "s"}`
    const perChannel = channels
      .map((c) => {
        const info = preview.channels?.[c]
        if (!info) return null
        return `${CHANNEL_LABEL[c]}: ${info.deliverable} will receive it, ${info.skipped} skipped (no consent or no address)`
      })
      .filter(Boolean)
      .join(". ")
    return perChannel ? `${people}. ${perChannel}` : people
  }

  const totalDeliverable = preview
    ? channels.reduce((n, c) => n + (preview.channels?.[c]?.deliverable ?? 0), 0)
    : 0

  // Calls dispatch until nothing remains. Returns total attempted.
  const drain = async (onProgress: (attemptedSoFar: number, remaining: number) => void): Promise<number> => {
    let attemptedTotal = 0
    for (let i = 0; i < 500; i++) {
      const res = await authedFetch("/api/admin/messages/dispatch", { method: "POST", body: JSON.stringify({ limit: 25 }) })
      if (!res) throw new Error("redirected")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Sending failed")
      const r = data as DispatchResult
      attemptedTotal += r.attempted
      onProgress(attemptedTotal, r.remaining)
      if (r.remaining === 0 || r.attempted === 0) break
    }
    return attemptedTotal
  }

  const canSend = !sending && subject.trim() !== "" && body.trim() !== "" && channels.length > 0

  const handleSend = async () => {
    const who = preview ? `${totalDeliverable} message${totalDeliverable === 1 ? "" : "s"}` : "the selected audience"
    const via = channels.map((c) => CHANNEL_LABEL[c]).join(", ")
    if (!confirm(`Send to ${who} on ${via}?`)) return
    setSending(true)
    setDeliveredSoFar(0)
    setTotalToDeliver(0)
    setSendStatus("Queuing announcement…")
    try {
      const res = await authedFetch("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          body,
          ...(shortBody.trim() ? { shortBody } : {}),
          channels,
          operational,
          filter: buildFilter(),
        }),
      })
      if (!res) return
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to send announcement")
        setSendStatus(null)
        return
      }
      const queued: number = data.queued ?? 0
      setTotalToDeliver(queued)
      setSendStatus("Delivering…")
      try {
        await drain((attempted, remaining) => {
          setDeliveredSoFar(attempted)
          setTotalToDeliver(Math.max(queued, attempted + remaining))
        })
        setSendStatus(`Done. ${data.recipients ?? 0} recipient(s) processed.`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sending failed"
        if (msg !== "redirected") {
          alert(`${msg}. The announcement is queued; use "Send now" in the history below to continue.`)
          setSendStatus("Paused. Some messages are still queued.")
        }
      }
      setSubject("")
      setBody("")
      setShortBody("")
      await loadHistory()
    } catch {
      alert("Failed to send announcement")
      setSendStatus(null)
    } finally {
      setSending(false)
    }
  }

  const handleSendNow = async (a: AnnouncementRow) => {
    setDispatchingId(a.id)
    try {
      await drain(() => {})
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sending failed"
      if (msg !== "redirected") alert(msg)
    } finally {
      setDispatchingId(null)
      loadHistory()
    }
  }

  const audienceSummary = (a: AnnouncementRow) => {
    const f = a.audience
    if (!f) return "-"
    const parts: string[] = [f.scope ? SCOPE_LABEL[f.scope] ?? f.scope : "Everyone"]
    if (f.locationId) parts.push(locations.find((l) => l.id === f.locationId)?.name ?? "one location")
    if (f.courseId) parts.push(courses.find((c) => c.id === f.courseId)?.title ?? "one course")
    if (f.includeApplicants) parts.push("incl. applicants")
    return parts.join(", ")
  }

  const pct = totalToDeliver > 0 ? Math.min(100, Math.round((deliveredSoFar / totalToDeliver) * 100)) : 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Megaphone className="h-6 w-6" />
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground">
            Send one message to a group of students and parents. Each person gets their own copy through the message
            outbox, so you can follow delivery per announcement below.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audience */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Audience</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Who</Label>
                  <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="parents">Parents only</SelectItem>
                      <SelectItem value="both">Students and parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All locations</SelectItem>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                          {l.isActive === false ? " (inactive)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Course</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All courses</SelectItem>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="includeApplicants"
                  checked={includeApplicants}
                  onCheckedChange={(v) => setIncludeApplicants(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="includeApplicants" className="text-sm font-normal leading-snug">
                  Also include applicants who are not enrolled yet
                </Label>
              </div>
            </section>

            {/* Channels */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Channels</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {CHANNELS.map((c) => (
                  <div key={c.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`ch-${c.value}`}
                      checked={channels.includes(c.value)}
                      onCheckedChange={(v) => toggleChannel(c.value, v === true)}
                    />
                    <Label htmlFor={`ch-${c.value}`} className="text-sm font-normal">
                      {c.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                SMS and WhatsApp deliver only once a provider is connected. Until then those messages are recorded as
                Skipped.
              </p>
            </section>

            {/* Content */}
            <section className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
                <p className="break-words text-xs text-muted-foreground">
                  Plain text. A blank line starts a new paragraph. Merge fields you can use:{" "}
                  {MERGE_FIELDS.map((f) => (
                    <code key={f} className="mr-1 rounded bg-muted px-1 py-0.5">
                      {f}
                    </code>
                  ))}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shortBody">Short version for SMS/WhatsApp (optional)</Label>
                <Textarea id="shortBody" value={shortBody} onChange={(e) => setShortBody(e.target.value)} rows={3} />
                <p className="text-xs text-muted-foreground">Used instead of the full message on SMS and WhatsApp.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="operational"
                    checked={operational}
                    onCheckedChange={(v) => setOperational(v === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="operational" className="text-sm font-normal leading-snug">
                    This is an operational notice (sends even to people who have not agreed to marketing emails, e.g. a
                    closure or schedule change)
                  </Label>
                </div>
                {operational && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Only use this for notices people need to receive. Promotions, offers and general news must not be
                      sent as operational.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Preview + send */}
            <section className="space-y-3 rounded-md border bg-muted/40 p-3">
              <h2 className="text-sm font-semibold">Audience preview</h2>
              <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
                {channels.length === 0
                  ? "Choose at least one channel to see who will receive this."
                  : previewLoading
                    ? "Checking audience…"
                    : previewError
                      ? previewError
                      : (previewSummary() ?? "")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={handleSend} disabled={!canSend} className="w-full sm:w-auto">
                  {sending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                  Send announcement
                </Button>
                {!canSend && !sending && (
                  <p className="text-xs text-muted-foreground">Needs a subject, a message and at least one channel.</p>
                )}
              </div>
              {(sending || sendStatus) && (
                <div className="space-y-1.5">
                  {sending && totalToDeliver > 0 && <Progress value={pct} />}
                  <p className="text-sm">
                    {sending && deliveredSoFar > 0 ? `Delivered ${deliveredSoFar} so far` : sendStatus}
                  </p>
                </div>
              )}
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>History</span>
              <Badge variant="outline">{history.length} recent</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="py-8 text-center text-muted-foreground">Loading…</p>
            ) : history.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Megaphone className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p>No announcements sent yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(a.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="min-w-40 max-w-64">
                          <p className="whitespace-normal font-medium">{a.subject}</p>
                          {a.category === "TRANSACTIONAL" && (
                            <Badge variant="outline" className="mt-1">
                              Operational
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="min-w-40 whitespace-normal text-sm text-muted-foreground">
                          {audienceSummary(a)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(a.channels ?? []).map((c) => CHANNEL_LABEL[c] ?? c).join(", ")}
                        </TableCell>
                        <TableCell>{a.recipientCount}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary">{a.progress.sent} sent</Badge>
                            {a.progress.failed > 0 && <Badge variant="destructive">{a.progress.failed} failed</Badge>}
                            {a.progress.skipped > 0 && <Badge variant="outline">{a.progress.skipped} skipped</Badge>}
                            {a.progress.queued > 0 && <Badge variant="outline">{a.progress.queued} queued</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {a.progress.queued > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={dispatchingId !== null}
                                onClick={() => handleSendNow(a)}
                              >
                                {dispatchingId === a.id ? (
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="mr-1 h-4 w-4" />
                                )}
                                Send now
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`/admin/messages?batchId=${a.id}`} title="View messages">
                                <ExternalLink className="mr-1 h-4 w-4" />
                                Messages
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
