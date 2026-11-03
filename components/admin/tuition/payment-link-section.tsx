"use client"

import { useEffect, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Link2, MessageCircle } from "lucide-react"
import { copyText, formatMoney, tuitionApi } from "./shared"

interface Props {
  enrollmentId: string
  outstanding: number
  studentFirstName: string
  courseTitle: string
  onCreated: (message: string) => Promise<void>
}

interface CreatedLink {
  id: string
  amount: number
  paymentUrl: string
}

export function whatsAppShareUrl(firstName: string, courseTitle: string, amount: number, url: string): string {
  const text = `Hello ${firstName}, here is your secure link to pay ${formatMoney(amount)} toward your ${courseTitle} tuition at Banafix: ${url}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function PaymentLinkSection({ enrollmentId, outstanding, studentFirstName, courseTitle, onCreated }: Props) {
  const [amount, setAmount] = useState(outstanding > 0 ? String(outstanding) : "")
  const [link, setLink] = useState<CreatedLink | null>(null)
  const [reused, setReused] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setAmount(outstanding > 0 ? String(outstanding) : "")
  }, [outstanding])

  const entered = Number(amount)
  const validAmount = amount.trim() !== "" && Number.isInteger(entered) && entered > 0
  const tooHigh = validAmount && entered > outstanding

  const create = async () => {
    setError("")
    setCopied(false)
    if (!validAmount) {
      setError("Enter a whole number of naira greater than 0")
      return
    }
    setBusy(true)
    try {
      const { ok, data } = await tuitionApi<{ payment?: CreatedLink; reused?: boolean }>(
        "POST",
        `/api/admin/enrollments/${enrollmentId}/tuition/payment-link`,
        { amount: entered },
      )
      if (!ok || !data.payment) {
        setError(data.error || "Failed to create the payment link")
        return
      }
      setLink(data.payment)
      setReused(Boolean(data.reused))
      await onCreated(data.reused ? "Existing payment link reused" : "Payment link created")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!link) return
    setCopied(await copyText(link.paymentUrl))
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="h-4 w-4" />
          Online payment link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Create a Paystack link for the student to pay online. The payment is confirmed automatically and a receipt
          is emailed. The link cannot be for more than the outstanding balance.
        </p>
        <div>
          <Label htmlFor="pl-amount">Amount (₦)</Label>
          <Input
            id="pl-amount"
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={outstanding <= 0}
          />
          <p className="mt-1 text-xs text-muted-foreground">Outstanding balance: {formatMoney(outstanding)}</p>
        </div>
        {tooHigh && (
          <p className="text-xs text-red-600">
            That is more than the outstanding balance. Add a charge first to take payment for more classes.
          </p>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={create} disabled={busy || outstanding <= 0 || tooHigh} variant="outline" className="w-full">
          {busy ? "Creating link..." : "Create payment link"}
        </Button>
        {outstanding <= 0 && <p className="text-xs text-muted-foreground">Nothing is outstanding.</p>}

        {link && (
          <div className="space-y-2 rounded-md border bg-muted/40 p-3">
            <p className="text-sm font-medium">
              Link for {formatMoney(link.amount)}
              {reused && <span className="font-normal text-muted-foreground"> (an identical recent link was reused)</span>}
            </p>
            <Input readOnly value={link.paymentUrl} onFocus={(e) => e.currentTarget.select()} aria-label="Payment link" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={copy}>
                <Copy className="mr-1 h-3 w-3" />
                {copied ? "Copied" : "Copy"}
              </Button>
              <a
                href={whatsAppShareUrl(studentFirstName, courseTitle, link.amount, link.paymentUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <MessageCircle className="mr-1 h-3 w-3" />
                Share on WhatsApp
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
