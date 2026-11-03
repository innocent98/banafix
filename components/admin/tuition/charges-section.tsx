"use client"

import { Fragment, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus } from "lucide-react"
import { chargeTotal } from "@/lib/tuition-ledger"
import { formatDay, formatMoney, tuitionApi, type MaterialOption, type TuitionChargeRow } from "./shared"

interface Props {
  enrollmentId: string
  charges: TuitionChargeRow[]
  materials: MaterialOption[]
  onChanged: (message: string) => Promise<void>
}

type AddKind = "CLASSES" | "MATERIAL"

export function ChargesSection({ enrollmentId, charges, materials, onChanged }: Props) {
  const [voidingId, setVoidingId] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [adding, setAdding] = useState(false)
  const [kind, setKind] = useState<AddKind>("CLASSES")
  const [quantity, setQuantity] = useState("")
  const [materialId, setMaterialId] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const hasLedgerRows = charges.length > 0
  const chargedMaterialIds = new Set(charges.filter((c) => !c.voidedAt && c.materialId).map((c) => c.materialId as string))
  const availableMaterials = materials.filter((m) => !chargedMaterialIds.has(m.id))

  const submitVoid = async (chargeId: string) => {
    if (!reason.trim()) {
      setError("A reason is required to void a charge")
      return
    }
    setBusy(true)
    setError("")
    try {
      const { ok, data } = await tuitionApi("POST", `/api/admin/enrollments/${enrollmentId}/tuition/charges/${chargeId}/void`, {
        reason: reason.trim(),
      })
      if (!ok) {
        setError(data.error || "Failed to void the charge")
        return
      }
      setVoidingId(null)
      setReason("")
      await onChanged("Charge voided")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const body =
      kind === "CLASSES"
        ? { kind, quantity: Number(quantity) }
        : { kind, materialId }
    if (kind === "CLASSES" && (!Number.isInteger(body.quantity) || (body.quantity as number) < 1)) {
      setError("Enter a whole number of classes (1 or more)")
      return
    }
    if (kind === "MATERIAL" && !materialId) {
      setError("Choose a material")
      return
    }
    setBusy(true)
    setError("")
    try {
      const { ok, data } = await tuitionApi("POST", `/api/admin/enrollments/${enrollmentId}/tuition/charges`, body)
      if (!ok) {
        setError(data.error || "Failed to add the charge")
        return
      }
      setAdding(false)
      setQuantity("")
      setMaterialId("")
      await onChanged(kind === "CLASSES" ? "Classes added to the ledger" : "Material added to the ledger")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Charges</CardTitle>
        {!adding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAdding(true)
              setError("")
            }}
            disabled={!hasLedgerRows}
            title={hasLedgerRows ? "Add a top-up or a material" : "Save the plan first so the ledger has charges"}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add charge
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {adding && (
          <form onSubmit={submitAdd} className="space-y-3 rounded-md border bg-muted/40 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Charge type</Label>
                <Select value={kind} onValueChange={(v) => v && setKind(v as AddKind)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLASSES">Top-up classes</SelectItem>
                    <SelectItem value="MATERIAL">Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {kind === "CLASSES" ? (
                <div>
                  <Label htmlFor="topUpQty">Number of classes</Label>
                  <Input id="topUpQty" type="number" min={1} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
              ) : (
                <div>
                  <Label>Material</Label>
                  <Select value={materialId} onValueChange={setMaterialId}>
                    <SelectTrigger><SelectValue placeholder={availableMaterials.length ? "Select a material" : "None available"} /></SelectTrigger>
                    <SelectContent>
                      {availableMaterials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({formatMoney(m.price)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {kind === "CLASSES"
                ? "Top-up classes are charged at today's rate for this student's offering and class length. Earlier charges keep their original price."
                : "The material's current price is recorded on the charge."}
            </p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy}>{busy ? "Adding..." : "Add charge"}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setAdding(false)} disabled={busy}>Cancel</Button>
            </div>
          </form>
        )}

        {!hasLedgerRows ? (
          <p className="text-sm text-muted-foreground">
            No charge rows yet. The balance is taken from the agreed plan; saving the plan creates the charges.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty x price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((c) => {
                  const voided = Boolean(c.voidedAt)
                  return (
                    <Fragment key={c.id}>
                      <TableRow>
                        <TableCell>
                          <p className={voided ? "line-through text-muted-foreground" : "font-medium"}>{c.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDay(c.createdAt)}
                            {voided && c.voidReason ? ` • Voided: ${c.voidReason}` : voided ? " • Voided" : ""}
                          </p>
                        </TableCell>
                        <TableCell className={voided ? "line-through text-muted-foreground" : ""}>
                          {c.quantity} x {formatMoney(c.unitPrice)}
                        </TableCell>
                        <TableCell className={`text-right ${voided ? "line-through text-muted-foreground" : "font-medium"}`}>
                          {formatMoney(chargeTotal(c))}
                        </TableCell>
                        <TableCell className="text-right">
                          {!voided && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                setVoidingId(voidingId === c.id ? null : c.id)
                                setReason("")
                                setError("")
                              }}
                            >
                              Void
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {voidingId === c.id && (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-muted/40">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                              <div className="flex-1">
                                <Label htmlFor={`void-${c.id}`}>Reason for voiding (kept in the audit trail)</Label>
                                <Input
                                  id={`void-${c.id}`}
                                  value={reason}
                                  maxLength={200}
                                  onChange={(e) => setReason(e.target.value)}
                                  placeholder="e.g. Student already owns the book"
                                />
                              </div>
                              <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" disabled={busy} onClick={() => submitVoid(c.id)}>
                                {busy ? "Voiding..." : "Void charge"}
                              </Button>
                              <Button size="sm" variant="outline" disabled={busy} onClick={() => setVoidingId(null)}>
                                Keep
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
