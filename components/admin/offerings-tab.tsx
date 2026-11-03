"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, Layers } from "lucide-react"
import { formatNaira } from "@/lib/site"

interface Rate {
  durationMins: number
  pricePerClass: number
}
interface Offering {
  id: string
  locationId: string
  deliveryModeId: string
  classesPerWeekOptions: number[]
  isActive: boolean
  rates: Rate[]
  location: { id: string; name: string }
  deliveryMode: { id: string; name: string }
}
interface LocationLite {
  id: string
  name: string
  isActive: boolean
}
interface ModeLite {
  id: string
  name: string
  isActive: boolean
}
// Draft rows keep raw input strings so half-typed values do not fight the user.
interface RateDraft {
  durationMins: string
  pricePerClass: string
}

const QUICK_DURATIONS = [45, 60]

export function OfferingsTab({ courseId }: { courseId: string }) {
  const [locations, setLocations] = useState<LocationLite[]>([])
  const [modes, setModes] = useState<ModeLite[]>([])
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [editing, setEditing] = useState<Offering | null>(null)
  const [draftRates, setDraftRates] = useState<RateDraft[]>([])
  const [draftCpw, setDraftCpw] = useState<number[]>([1, 2])
  const [draftActive, setDraftActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState("")

  const [bulkDuration, setBulkDuration] = useState("60")
  const [bulkPrice, setBulkPrice] = useState("")
  const [bulkSelected, setBulkSelected] = useState<string[]>([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkMsg, setBulkMsg] = useState("")

  const headers = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` }),
    [],
  )

  const load = useCallback(async () => {
    try {
      const [l, m, o] = await Promise.all([
        fetch("/api/admin/locations", { headers: headers() }).then((r) => r.json()),
        fetch("/api/admin/delivery-modes", { headers: headers() }).then((r) => r.json()),
        fetch(`/api/admin/courses/${courseId}/offerings`, { headers: headers() }).then((r) => r.json()),
      ])
      setLocations(l.locations ?? [])
      setModes((m.deliveryModes ?? []).filter((x: ModeLite) => x.isActive))
      setOfferings(o.offerings ?? [])
    } catch {
      setError("Failed to load offerings")
    } finally {
      setLoading(false)
    }
  }, [courseId, headers])

  useEffect(() => {
    load()
  }, [load])

  const cell = useMemo(() => {
    const map = new Map<string, Offering>()
    offerings.forEach((o) => map.set(`${o.locationId}:${o.deliveryModeId}`, o))
    return map
  }, [offerings])

  const openDialog = (o: Offering) => {
    setEditing(o)
    setDraftRates(o.rates.map((r) => ({ durationMins: String(r.durationMins), pricePerClass: String(r.pricePerClass) })))
    setDraftCpw(o.classesPerWeekOptions)
    setDraftActive(o.isActive)
    setDialogError("")
  }

  const offer = async (locationId: string, deliveryModeId: string) => {
    setError("")
    const res = await fetch(`/api/admin/courses/${courseId}/offerings`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ locationId, deliveryModeId }),
    })
    const d = await res.json()
    if (!res.ok) return setError(d.error || "Failed to create offering")
    await load()
    openDialog(d.offering)
  }

  const addQuick = (mins: number) =>
    setDraftRates((prev) =>
      prev.some((r) => Number(r.durationMins) === mins) ? prev : [...prev, { durationMins: String(mins), pricePerClass: "" }],
    )

  const toggleCpw = (n: number) =>
    setDraftCpw((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)))

  const save = async () => {
    if (!editing) return
    setDialogError("")
    const rates: Rate[] = []
    for (const r of draftRates) {
      const durationMins = Number(r.durationMins)
      const pricePerClass = Number(r.pricePerClass)
      if (r.pricePerClass === "" || !Number.isInteger(durationMins) || !Number.isInteger(pricePerClass)) {
        return setDialogError("Every rate needs a whole-number duration and price")
      }
      rates.push({ durationMins, pricePerClass })
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/offerings/${editing.id}`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          rates,
          classesPerWeekOptions: draftCpw,
          isActive: rates.length === 0 ? false : draftActive,
        }),
      })
      const d = await res.json()
      if (!res.ok) return setDialogError(d.error || "Failed to save offering")
      setEditing(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!editing || !confirm("Delete this offering?")) return
    const res = await fetch(`/api/admin/courses/${courseId}/offerings/${editing.id}`, {
      method: "DELETE",
      headers: headers(),
    })
    const d = await res.json()
    if (!res.ok) return setDialogError(d.error || "Failed to delete offering")
    setEditing(null)
    load()
  }

  const applyBulk = async () => {
    setBulkMsg("")
    if (bulkSelected.length === 0) return setBulkMsg("Choose at least one offering")
    setBulkBusy(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/offerings/bulk-rate`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          durationMins: Number(bulkDuration),
          pricePerClass: Number(bulkPrice),
          offeringIds: bulkSelected,
        }),
      })
      const d = await res.json()
      if (!res.ok) return setBulkMsg(d.error || "Failed to set rate")
      setBulkMsg(`Rate set on ${d.count} offering(s)`)
      load()
    } finally {
      setBulkBusy(false)
    }
  }

  const toggleBulk = (id: string) =>
    setBulkSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  if (loading) return <p className="py-8 text-center text-muted-foreground">Loading offerings…</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Offerings
          </CardTitle>
          <CardDescription>
            Where and how this course is taught. Each cell is one location and format; set per-class rates by lesson length.
            An offering only shows to students once it is active and has at least one rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {modes.length === 0 || locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add at least one active delivery mode and one location before creating offerings.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-left font-medium text-muted-foreground">Location</th>
                    {modes.map((m) => (
                      <th key={m.id} className="p-2 text-left font-medium text-muted-foreground">
                        {m.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => (
                    <tr key={loc.id} className={`border-t ${loc.isActive ? "" : "opacity-50"}`}>
                      <td className="p-2 font-medium">
                        {loc.name}
                        {!loc.isActive && <span className="ml-2 text-xs font-normal text-muted-foreground">(inactive)</span>}
                      </td>
                      {modes.map((m) => {
                        const o = cell.get(`${loc.id}:${m.id}`)
                        return (
                          <td key={m.id} className="p-2">
                            {!o ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-muted-foreground"
                                onClick={() => offer(loc.id, m.id)}
                              >
                                <Plus className="mr-1 h-3 w-3" /> Offer
                              </Button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openDialog(o)}
                                className="w-full rounded-md border p-2 text-left hover:bg-muted"
                                data-testid={`offering-cell-${loc.id}-${m.id}`}
                              >
                                <Badge variant={o.isActive ? "default" : "secondary"}>
                                  {o.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {o.rates.length === 0
                                    ? "No rates"
                                    : o.rates.map((r) => `${r.durationMins}m ${formatNaira(r.pricePerClass)}`).join(" · ")}
                                </p>
                              </button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {offerings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Set a rate for several offerings</CardTitle>
            <CardDescription>Adds or overwrites one lesson length&apos;s price per class on every offering you tick.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="bulk-duration">Lesson length (minutes)</Label>
                <Input id="bulk-duration" type="number" value={bulkDuration} onChange={(e) => setBulkDuration(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="bulk-price">Price per class (₦)</Label>
                <Input id="bulk-price" type="number" min={0} value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={applyBulk} disabled={bulkBusy || bulkPrice === ""}>
                  {bulkBusy ? "Applying…" : "Set rate"}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="bulk-all"
                checked={bulkSelected.length === offerings.length}
                onCheckedChange={(v) => setBulkSelected(v ? offerings.map((o) => o.id) : [])}
              />
              <Label htmlFor="bulk-all" className="cursor-pointer text-sm font-medium">
                All offerings
              </Label>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {offerings.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm">
                  <Checkbox checked={bulkSelected.includes(o.id)} onCheckedChange={() => toggleBulk(o.id)} />
                  {o.location.name} · {o.deliveryMode.name}
                </label>
              ))}
            </div>
            {bulkMsg && <p className="text-sm text-muted-foreground">{bulkMsg}</p>}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.location.name} · {editing?.deliveryMode.name}
            </DialogTitle>
            <DialogDescription>Rates are per class, by lesson length.</DialogDescription>
          </DialogHeader>
          {dialogError && (
            <Alert variant="destructive">
              <AlertDescription>{dialogError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rates</Label>
              {draftRates.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-28"
                    placeholder="Mins"
                    aria-label="Duration in minutes"
                    value={r.durationMins}
                    onChange={(e) =>
                      setDraftRates((prev) => prev.map((x, j) => (j === i ? { ...x, durationMins: e.target.value } : x)))
                    }
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="₦ per class"
                    aria-label="Price per class"
                    value={r.pricePerClass}
                    onChange={(e) =>
                      setDraftRates((prev) => prev.map((x, j) => (j === i ? { ...x, pricePerClass: e.target.value } : x)))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraftRates((prev) => prev.filter((_, j) => j !== i))}
                    title="Remove rate"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                {QUICK_DURATIONS.map((m) => (
                  <Button key={m} type="button" variant="outline" size="sm" onClick={() => addQuick(m)}>
                    <Plus className="mr-1 h-3 w-3" /> {m} min
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDraftRates((prev) => [...prev, { durationMins: "", pricePerClass: "" }])}
                >
                  <Plus className="mr-1 h-3 w-3" /> Other length
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Classes per week students can choose</Label>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <label key={n} className="flex cursor-pointer items-center gap-1 text-sm">
                    <Checkbox checked={draftCpw.includes(n)} onCheckedChange={() => toggleCpw(n)} />
                    {n}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="offering-active"
                checked={draftActive && draftRates.length > 0}
                disabled={draftRates.length === 0}
                onCheckedChange={setDraftActive}
              />
              <Label htmlFor="offering-active" className="cursor-pointer">
                Active (visible to students)
              </Label>
            </div>
            {draftRates.length === 0 && (
              <p className="text-xs text-muted-foreground">Add at least one rate to activate this offering.</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="ghost" className="text-destructive" onClick={remove}>
              Delete offering
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
