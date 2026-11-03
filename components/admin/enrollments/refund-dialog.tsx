"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency, type ApplicationPayment } from "./types"

interface Props {
  /** The duplicate payment to record as refunded; null keeps the dialog closed. */
  payment: ApplicationPayment | null
  onClose: () => void
  /** Called after the server recorded the refund. */
  onDone: () => void
}

/** Confirm + record that a duplicate assessment-fee payment was refunded by hand in Paystack. */
export function RefundDialog({ payment, onClose, onDone }: Props) {
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setNote("")
    setError("")
    setBusy(false)
  }, [payment?.id])

  const submit = async () => {
    if (!payment) return
    setBusy(true)
    setError("")
    try {
      const token = localStorage.getItem("admin_token")
      const res = await fetch(`/api/admin/application-payments/${payment.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: note.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || data?.message || "Failed to mark refunded")
        return
      }
      onDone()
      onClose()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={Boolean(payment)} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark duplicate payment refunded</DialogTitle>
          <DialogDescription>
            {payment ? `${formatCurrency(payment.amount)}, receipt ${payment.receiptNumber}. ` : ""}
            Refund this amount by hand in the Paystack dashboard first; this only records that it was done.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="refundNote">Note (optional)</Label>
          <Textarea
            id="refundNote"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paystack refund reference"
          />
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Back</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Working..." : "Mark refunded"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
