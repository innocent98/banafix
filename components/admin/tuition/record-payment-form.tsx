"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MANUAL_PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/tuition-methods"
import { formatMoney, tuitionApi } from "./shared"

interface Props {
  enrollmentId: string
  /** Ledger rows: the amount defaults to this and anything above it needs an explicit confirmation. */
  outstanding: number
  /** Legacy rows only: course price for the mode, so the old balance preview can be shown. */
  legacy?: { expectedTotal?: number; paid: number }
  onRecorded: (message: string) => Promise<void>
}

export function RecordPaymentForm({ enrollmentId, outstanding, legacy, onRecorded }: Props) {
  const isLegacy = Boolean(legacy)
  const [amount, setAmount] = useState(isLegacy ? "" : outstanding > 0 ? String(outstanding) : "")
  const [method, setMethod] = useState("")
  const [description, setDescription] = useState("")
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full")
  const [sendReceipt, setSendReceipt] = useState(true)
  const [confirmOver, setConfirmOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  // After a refetch the balance has moved: offer the new outstanding amount again.
  useEffect(() => {
    if (!isLegacy) setAmount(outstanding > 0 ? String(outstanding) : "")
    setConfirmOver(false)
  }, [outstanding, isLegacy])

  const entered = Number(amount)
  const validAmount = amount.trim() !== "" && Number.isInteger(entered) && entered > 0
  const overpaying = !isLegacy && validAmount && entered > outstanding
  const legacyBalanceAfter =
    legacy && typeof legacy.expectedTotal === "number"
      ? Math.max(0, legacy.expectedTotal - (legacy.paid + (validAmount ? entered : 0)))
      : undefined

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!validAmount) {
      setError("Enter a whole number of naira greater than 0")
      return
    }
    if (!method) {
      setError("Choose the payment method")
      return
    }
    if (overpaying && !confirmOver) {
      setError("Confirm the overpayment to continue")
      return
    }
    setBusy(true)
    try {
      const { ok, data } = await tuitionApi("POST", `/api/admin/enrollments/${enrollmentId}/tuition`, {
        amount: entered,
        paymentMethod: method,
        description: description.trim() || undefined,
        sendReceipt,
        ...(isLegacy ? { paymentType } : {}),
        ...(overpaying ? { allowOverpayment: true } : {}),
      })
      if (!ok) {
        setError(data.error || "Failed to record payment")
        return
      }
      setDescription("")
      setMethod("")
      await onRecorded("Payment recorded")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Record payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="rp-amount">Amount (₦) *</Label>
            <Input
              id="rp-amount"
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setConfirmOver(false)
              }}
              required
            />
            {!isLegacy && (
              <p className="mt-1 text-xs text-muted-foreground">Outstanding balance: {formatMoney(outstanding)}</p>
            )}
          </div>

          {isLegacy && (
            <div>
              <Label>Payment type *</Label>
              <Select value={paymentType} onValueChange={(v) => v && setPaymentType(v as "full" | "partial")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full payment (settles tuition)</SelectItem>
                  <SelectItem value="partial">Part payment (balance remains)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {legacy &&
            (typeof legacy.expectedTotal === "number" ? (
              <div className="space-y-1 rounded-md border bg-muted/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected tuition</span>
                  <span className="font-medium">{formatMoney(legacy.expectedTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid so far</span>
                  <span className="font-medium">{formatMoney(legacy.paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance after this payment</span>
                  <span className="font-semibold">{formatMoney(legacyBalanceAfter ?? 0)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No course price set for this mode, so no balance is tracked on the receipt.
              </p>
            ))}

          {overpaying && (
            <Alert className="border-amber-300 bg-amber-50">
              <AlertDescription className="space-y-2 text-amber-900">
                <p>
                  This is {formatMoney(entered - outstanding)} more than the outstanding balance. The extra is kept as
                  credit on the student&apos;s account and the overpayment is logged.
                </p>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={confirmOver}
                    onChange={(e) => setConfirmOver(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Confirm overpayment
                </label>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Payment method *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
              <SelectContent>
                {MANUAL_PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m] ?? m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rp-description">Description</Label>
            <Textarea
              id="rp-description"
              rows={2}
              maxLength={500}
              placeholder="e.g. Part payment, 4 classes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sendReceipt}
              onChange={(e) => setSendReceipt(e.target.checked)}
              className="rounded border-gray-300"
            />
            Send receipt email to the student
          </label>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={busy || (overpaying && !confirmOver)} className="w-full">
            {busy ? "Recording payment..." : "Record payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
