"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Download, Mail, Copy, XCircle } from "lucide-react"
import { PAYMENT_METHOD_LABELS } from "@/lib/tuition-methods"
import { copyText, formatDay, formatMoney, isCounted, STATUS_STYLES, tuitionApi, type TuitionPaymentRow } from "./shared"

interface Props {
  payments: TuitionPaymentRow[]
  totalPaid: number
  onChanged: (message: string) => Promise<void>
}

const token = () => localStorage.getItem("admin_token")

export function PaymentHistory({ payments, totalPaid, onChanged }: Props) {
  const [error, setError] = useState("")
  const [note, setNote] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id)
    setError("")
    setNote("")
    try {
      await fn()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  const sendReceipt = (id: string) =>
    run(id, async () => {
      const { ok, data } = await tuitionApi("POST", `/api/admin/tuition-payments/${id}/receipt`)
      if (ok) setNote("Receipt sent")
      else setError(data.error || "Failed to send the receipt")
    })

  const downloadReceipt = (id: string, receiptNumber: string) =>
    run(id, async () => {
      const res = await fetch(`/api/admin/tuition-payments/${id}/receipt?download=true`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setError(body.error || "Failed to download the receipt")
        return
      }
      const url = window.URL.createObjectURL(await res.blob())
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `tuition-receipt-${receiptNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    })

  const copyLink = (id: string, link: string) =>
    run(id, async () => {
      if (await copyText(link)) setNote("Payment link copied")
      else setError("Could not copy automatically. Create the link again to select and copy it.")
    })

  const cancelLink = (id: string) => {
    if (!window.confirm("Cancel this payment link? If the student still pays it, the money is recorded anyway.")) return
    return run(id, async () => {
      const { ok, data } = await tuitionApi("POST", `/api/admin/tuition-payments/${id}/cancel`)
      if (!ok) {
        setError(data.error || "Failed to cancel the link")
        return
      }
      await onChanged("Payment link cancelled")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          Payment history
          <Badge variant="outline">Paid: {formatMoney(totalPaid)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {note && (
          <Alert>
            <AlertDescription className="text-green-700">{note}</AlertDescription>
          </Alert>
        )}
        {payments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <CreditCard className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>No tuition payments yet</p>
          </div>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {payments.map((p) => {
              const method = p.paymentMethod ? PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod : "Method not recorded"
              const busy = busyId === p.id
              return (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{formatMoney(p.amount)} <span className="font-normal text-muted-foreground">via {method}</span></p>
                      <p className="text-sm text-muted-foreground">Receipt: {p.receiptNumber}</p>
                      {p.paystackReference && (
                        <p className="break-all text-xs text-muted-foreground">Reference: {p.paystackReference}</p>
                      )}
                      {p.description && <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.paidAt ? `Paid ${formatDay(p.paidAt)}` : `Created ${formatDay(p.createdAt)}`}
                      </p>
                    </div>
                    <Badge variant="outline" className={STATUS_STYLES[p.status] ?? ""}>{p.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isCounted(p.status) && (
                      <>
                        <Button variant="outline" size="sm" disabled={busy} onClick={() => sendReceipt(p.id)}>
                          <Mail className="mr-1 h-3 w-3" />
                          Send receipt
                        </Button>
                        <Button variant="outline" size="sm" disabled={busy} onClick={() => downloadReceipt(p.id, p.receiptNumber)}>
                          <Download className="mr-1 h-3 w-3" />
                          Download receipt
                        </Button>
                      </>
                    )}
                    {p.status === "pending" && (
                      <>
                        {p.paymentUrl && (
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => copyLink(p.id, p.paymentUrl as string)}>
                            <Copy className="mr-1 h-3 w-3" />
                            Copy link
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-destructive" disabled={busy} onClick={() => cancelLink(p.id)}>
                          <XCircle className="mr-1 h-3 w-3" />
                          Cancel link
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
