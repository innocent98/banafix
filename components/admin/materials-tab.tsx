"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Plus, Trash2 } from "lucide-react"
import { formatNaira } from "@/lib/site"

interface MaterialRow {
  id: string
  name: string
  price: number
  required: boolean
  isActive: boolean
}

export function MaterialsTab({ courseId }: { courseId: string }) {
  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [required, setRequired] = useState(false)

  const headers = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` }),
    [],
  )

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/materials`, { headers: headers() })
      const d = await res.json()
      setMaterials(d.materials ?? [])
    } catch {
      setError("Failed to load materials")
    } finally {
      setLoading(false)
    }
  }, [courseId, headers])

  useEffect(() => {
    load()
  }, [load])

  const add = async () => {
    setError("")
    const res = await fetch(`/api/admin/courses/${courseId}/materials`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ name, price: Number(price), required }),
    })
    const d = await res.json()
    if (!res.ok) return setError(d.error || "Failed to add material")
    setName("")
    setPrice("")
    setRequired(false)
    load()
  }

  const patch = async (m: MaterialRow, body: Partial<MaterialRow>) => {
    setError("")
    const res = await fetch(`/api/admin/courses/${courseId}/materials/${m.id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) setError((await res.json()).error || "Failed to update material")
    load()
  }

  const remove = async (m: MaterialRow) => {
    if (!confirm(`Delete "${m.name}"?`)) return
    const res = await fetch(`/api/admin/courses/${courseId}/materials/${m.id}`, { method: "DELETE", headers: headers() })
    if (!res.ok) setError((await res.json()).error || "Failed to delete material")
    load()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Materials
        </CardTitle>
        <CardDescription>Books and equipment a student may need to buy for this course.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_160px_auto_auto]">
          <div>
            <Label htmlFor="mat-name">Name</Label>
            <Input id="mat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Beginner songbook" />
          </div>
          <div>
            <Label htmlFor="mat-price">Price (₦)</Label>
            <Input id="mat-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
            <Checkbox checked={required} onCheckedChange={(v) => setRequired(v === true)} />
            Required
          </label>
          <Button type="button" onClick={add} disabled={!name.trim() || price === ""}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-muted-foreground">Loading…</p>
        ) : materials.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No materials yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m) => (
                <TableRow key={m.id} className={m.isActive ? "" : "opacity-60"}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{formatNaira(m.price)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={m.required}
                      onCheckedChange={(v) => patch(m, { required: v })}
                      aria-label={`Toggle ${m.name} required`}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={m.isActive}
                      onCheckedChange={(v) => patch(m, { isActive: v })}
                      aria-label={`Toggle ${m.name} active`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => remove(m)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
