"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Eye, RotateCcw, Send, Loader2, Search } from "lucide-react"

type Status = "queued" | "sent" | "failed" | "skipped"
type Channel = "EMAIL" | "SMS" | "WHATSAPP"

interface MessageRow {
  id: string
  channel: Channel
  recipientType: string
  toName: string | null
  toAddress: string
  templateKey: string
  category: string
  subject: string | null
  body: string
  status: Status
  provider: string | null
  error: string | null
  attempts: number
  scheduledFor: string | null
  sentAt: string | null
  createdAt: string
  lastAttemptAt: string | null
}

interface Counts {
  queued: number
  sent: number
  failed: number
  skipped: number
}

const STATUS_STYLES: Record<Status, string> = {
  sent: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  queued: "bg-amber-100 text-amber-800 border-amber-200",
  skipped: "bg-gray-100 text-gray-700 border-gray-200",
}

const STATUS_LABELS: Record<Status, string> = {
  queued: "Queued",
  sent: "Sent",
  failed: "Failed",
  skipped: "Skipped",
}

const TILE_STYLES: Record<Status, string> = {
  queued: "text-amber-700",
  sent: "text-green-700",
  failed: "text-red-700",
  skipped: "text-gray-600",
}

const CHANNEL_LABELS: Record<Channel, string> = { EMAIL: "Email", SMS: "SMS", WHATSAPP: "WhatsApp" }

const PAGE_SIZE = 25
const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-44"

function fmt(date: string | null) {
  if (!date) return "—"
  return new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

function isFuture(date: string | null) {
  return !!date && new Date(date).getTime() > Date.now()
}

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [counts, setCounts] = useState<Counts>({ queued: 0, sent: 0, failed: 0, skipped: 0 })
  const [templateKeys, setTemplateKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [status, setStatus] = useState<"" | Status>("")
  const [channel, setChannel] = useState<"" | Channel>("")
  const [templateKey, setTemplateKey] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [q, setQ] = useState("")

  const [selected, setSelected] = useState<MessageRow | null>(null)
  const [busy, setBusy] = useState<string | null>(null) // "retry-all" | "requeue" | "send" | message id
  const [progress, setProgress] = useState("")
  const requestSeq = useRef(0)
  const qRef = useRef("")

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("admin_token")}` })

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const seq = ++requestSeq.current
      if (!opts?.silent) setLoading(true)
      try {
        if (!localStorage.getItem("admin_token")) {
          router.push("/admin/login")
          return
        }
        const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
        if (status) params.set("status", status)
        if (channel) params.set("channel", channel)
        if (templateKey) params.set("templateKey", templateKey)
        if (q) params.set("q", q)
        const res = await fetch(`/api/admin/messages?${params}`, { headers: authHeaders() })
        if (res.status === 401) {
          router.push("/admin/login")
          return
        }
        const data = await res.json()
        if (seq !== requestSeq.current) return
        if (!res.ok) {
          alert(data.error || "Failed to load messages")
          return
        }
        setMessages(data.messages ?? [])
        setTotal(data.total ?? 0)
        setCounts(data.counts ?? { queued: 0, sent: 0, failed: 0, skipped: 0 })
        setTemplateKeys(data.templateKeys ?? [])
      } catch (err) {
        console.error("Failed to load messages:", err)
      } finally {
        if (seq === requestSeq.current) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, status, channel, templateKey, q],
  )

  useEffect(() => {
    load()
  }, [load])

  // Debounce the free-text search
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      if (next !== qRef.current) {
        qRef.current = next
        setQ(next)
        setPage(1)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const pickStatus = (s: Status) => {
    setStatus((prev) => (prev === s ? "" : s))
    setPage(1)
  }

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    })
    if (res.status === 401) {
      router.push("/admin/login")
      throw new Error("unauthorised")
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Request failed")
    return data
  }

  const retry = async (opts: { ids?: string[]; includeSkipped?: boolean }, busyKey: string) => {
    setBusy(busyKey)
    try {
      const data = await post("/api/admin/messages/retry", opts)
      alert(
        data.requeued > 0
          ? `${data.requeued} message(s) re-queued. Use "Send now" to deliver them straight away.`
          : "Nothing to re-queue.",
      )
      await load({ silent: true })
    } catch (err) {
      if ((err as Error).message !== "unauthorised") alert((err as Error).message || "Failed to retry")
    } finally {
      setBusy(null)
    }
  }

  const retryAllFailed = () => {
    if (!confirm("Re-queue every failed message so it is tried again?")) return
    retry({}, "retry-all")
  }

  const requeueSkipped = () => {
    if (
      !confirm(
        "Re-queue messages that were skipped because no provider was connected?\n\nDo this only after you have configured an SMS/WhatsApp provider; otherwise they will just be skipped again.",
      )
    )
      return
    retry({ includeSkipped: true }, "requeue")
  }

  const sendNow = async () => {
    setBusy("send")
    setProgress("Starting…")
    let sent = 0
    try {
      for (let i = 0; i < 200; i++) {
        const r = await post("/api/admin/messages/dispatch", { limit: 25 })
        sent += r.sent ?? 0
        setProgress(`Sent ${sent}, ${r.remaining ?? 0} remaining`)
        if (!r.remaining || !r.attempted) break
      }
    } catch (err) {
      if ((err as Error).message !== "unauthorised") alert((err as Error).message || "Failed to send messages")
    } finally {
      setBusy(null)
      await load({ silent: true })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = !!(status || channel || templateKey || q)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Mail className="h-6 w-6" />
              Messages
            </h1>
            <p className="text-sm text-muted-foreground">
              Every email, SMS and WhatsApp message the system has sent or queued. Failed messages can be retried; SMS and
              WhatsApp are marked Skipped until a provider is connected.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button variant="outline" onClick={retryAllFailed} disabled={busy !== null}>
              {busy === "retry-all" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1 h-4 w-4" />}
              Retry all failed
            </Button>
            <Button variant="outline" onClick={requeueSkipped} disabled={busy !== null}>
              {busy === "requeue" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1 h-4 w-4" />}
              Re-queue provider-skipped
            </Button>
            <Button onClick={sendNow} disabled={busy !== null}>
              {busy === "send" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Send now
            </Button>
          </div>
        </div>

        {progress && (
          <p className="text-sm text-muted-foreground" role="status">
            {busy === "send" ? progress : `Last send: ${progress}`}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(["queued", "sent", "failed", "skipped"] as Status[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickStatus(s)}
              aria-pressed={status === s}
              className={`rounded-lg border bg-card p-4 text-left shadow-sm transition hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                status === s ? "ring-2 ring-primary" : ""
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{STATUS_LABELS[s]}</p>
              <p className={`text-2xl font-bold ${TILE_STYLES[s]}`}>{counts[s]}</p>
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search name, address or subject"
                  className="pl-9"
                  aria-label="Search messages"
                />
              </div>
              <select
                className={selectClass}
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value as "" | Channel)
                  setPage(1)
                }}
                aria-label="Filter by channel"
              >
                <option value="">All channels</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
              <select
                className={selectClass}
                value={templateKey}
                onChange={(e) => {
                  setTemplateKey(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by template"
              >
                <option value="">All templates</option>
                {templateKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatus("")
                    setChannel("")
                    setTemplateKey("")
                    setSearchInput("")
                    qRef.current = ""
                    setQ("")
                    setPage(1)
                  }}
                >
                  Clear filters
                </Button>
              )}
              <Badge variant="outline" className="sm:ml-auto">
                {total} message{total === 1 ? "" : "s"}
              </Badge>
            </div>

            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading…</p>
            ) : messages.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Mail className="mx-auto mb-3 h-10 w-10 opacity-50" />
                {hasFilters ? (
                  <p>No messages match these filters.</p>
                ) : (
                  <p>No messages yet. They appear here when students apply, are scheduled, enrolled, or when an announcement is sent.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((m) => (
                      <TableRow key={m.id} className="cursor-pointer" onClick={() => setSelected(m)}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {fmt(m.sentAt ?? m.createdAt)}
                          {m.status === "queued" && isFuture(m.scheduledFor) && (
                            <p className="text-xs text-amber-700">scheduled for {fmt(m.scheduledFor)}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{m.toName || m.toAddress}</p>
                          {m.toName && <p className="break-all text-xs text-muted-foreground">{m.toAddress}</p>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{CHANNEL_LABELS[m.channel] ?? m.channel}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{m.templateKey}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_STYLES[m.status]}>
                            {STATUS_LABELS[m.status] ?? m.status}
                          </Badge>
                          {m.error && (m.status === "failed" || m.status === "skipped") && (
                            <p className="mt-1 max-w-xs whitespace-normal text-xs text-muted-foreground">{m.error}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{m.attempts}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {m.status === "failed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy !== null}
                                onClick={() => retry({ ids: [m.id] }, m.id)}
                              >
                                {busy === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                <span className="ml-1">Retry</span>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setSelected(m)} title="View message" aria-label="View message">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="break-words pr-6">{selected.subject || `${CHANNEL_LABELS[selected.channel]} message`}</DialogTitle>
                <DialogDescription className="break-all">
                  To {selected.toName ? `${selected.toName} · ` : ""}
                  {selected.toAddress}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={STATUS_STYLES[selected.status]}>
                  {STATUS_LABELS[selected.status]}
                </Badge>
                <Badge variant="secondary">{CHANNEL_LABELS[selected.channel]}</Badge>
                <Badge variant="outline">{selected.templateKey}</Badge>
                <Badge variant="outline">{selected.category === "MARKETING" ? "Marketing" : "Transactional"}</Badge>
              </div>
              {selected.error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{selected.error}</div>
              )}
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3 font-sans text-sm">
                {selected.body}
              </pre>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                <div>Created: {fmt(selected.createdAt)}</div>
                <div>Sent: {fmt(selected.sentAt)}</div>
                <div>Last attempt: {fmt(selected.lastAttemptAt)}</div>
                <div>Scheduled for: {fmt(selected.scheduledFor)}</div>
                <div>Provider: {selected.provider || "—"}</div>
                <div>Attempts: {selected.attempts}</div>
              </dl>
              {selected.status === "failed" && (
                <Button
                  variant="outline"
                  disabled={busy !== null}
                  onClick={async () => {
                    await retry({ ids: [selected.id] }, selected.id)
                    setSelected(null)
                  }}
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Retry
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
