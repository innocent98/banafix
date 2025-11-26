"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Receipt, Mail, Download } from "lucide-react"

interface Enrollment {
  id: string
  firstName: string
  lastName: string
  email: string
  course: {
    title: string
    instrument: string
    level: string
  }
  tuitionPayments: Array<{
    id: string
    amount: number
    status: string
    receiptNumber: string
    paidAt?: string
    description?: string
  }>
}

interface TuitionPaymentModalProps {
  enrollment: Enrollment | null
  isOpen: boolean
  onClose: () => void
  onPaymentAdded: () => void
}

export function TuitionPaymentModal({
  enrollment,
  isOpen,
  onClose,
  onPaymentAdded,
}: TuitionPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "",
    description: "",
    receiptEmail: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollment) return

    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      // Validate form
      if (!paymentData.amount || !paymentData.paymentMethod) {
        setError("Please fill in all required fields")
        return
      }

      const amount = parseFloat(paymentData.amount)
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount")
        return
      }

      const token = localStorage.getItem("admin_token")
      const response = await fetch(`/api/admin/enrollments/${enrollment.id}/tuition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          paymentMethod: paymentData.paymentMethod,
          description: paymentData.description,
          sendReceipt: paymentData.receiptEmail,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess("Payment recorded successfully!")
        setPaymentData({
          amount: "",
          paymentMethod: "",
          description: "",
          receiptEmail: true,
        })

        // Call callback to refresh parent data
        onPaymentAdded()

        // Close modal after a brief delay
        setTimeout(() => {
          onClose()
          setSuccess("")
        }, 1500)
      } else {
        setError(result.message || "Failed to record payment")
      }
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("Payment recording error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendExistingReceipt = async (paymentId: string) => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`/api/admin/tuition-payments/${paymentId}/receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setSuccess("Receipt sent successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError("Failed to send receipt")
      }
    } catch (err) {
      setError("Failed to send receipt")
      console.error("Receipt sending error:", err)
    }
  }

  const downloadReceipt = async (paymentId: string, receiptNumber: string) => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`/api/admin/tuition-payments/${paymentId}/receipt?download=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `tuition-receipt-${receiptNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError("Failed to download receipt")
      }
    } catch (err) {
      setError("Failed to download receipt")
      console.error("Receipt download error:", err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getTotalPaid = () => {
    if (!enrollment) return 0
    return enrollment.tuitionPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  if (!enrollment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Tuition Payment Management
          </DialogTitle>
          <DialogDescription>
            Manage tuition payments for {enrollment.firstName} {enrollment.lastName} - {enrollment.course.title}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Record New Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (₦) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="25000"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select
                      value={paymentData.paymentMethod}
                      onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        <SelectItem value="card">Card Payment</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="mobile-money">Mobile Money</SelectItem>
                        <SelectItem value="installment">Installment Plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Payment Description</Label>
                    <Textarea
                      id="description"
                      placeholder="e.g., First installment, Full tuition payment, etc."
                      value={paymentData.description}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="receiptEmail"
                      checked={paymentData.receiptEmail}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, receiptEmail: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="receiptEmail">Send receipt email to student</Label>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Recording Payment..." : "Record Payment"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Payment History
                  <Badge variant="outline">
                    Total: {formatCurrency(getTotalPaid())}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enrollment.tuitionPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tuition payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {enrollment.tuitionPayments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-muted-foreground">
                              Receipt: {payment.receiptNumber}
                            </p>
                            {payment.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {payment.description}
                              </p>
                            )}
                          </div>
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </div>

                        {payment.paidAt && (
                          <p className="text-xs text-muted-foreground mb-3">
                            Paid on {formatDate(payment.paidAt)}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendExistingReceipt(payment.id)}
                            className="flex-1"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Send Receipt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReceipt(payment.id, payment.receiptNumber)}
                            className="flex-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}