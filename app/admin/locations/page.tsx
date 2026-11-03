"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react"
import { LocationFormModal, type LocationRow } from "@/components/admin/location-form-modal"
import { formatNaira } from "@/lib/site"

export default function LocationsPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<LocationRow | null>(null)

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("admin_token")}` })

  const load = async () => {
    setLoading(true)
    try {
      if (!localStorage.getItem("admin_token")) {
        router.push("/admin/login")
        return
      }
      const res = await fetch("/api/admin/locations", { headers: authHeaders() })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const data = await res.json()
      setLocations(data.locations ?? [])
    } catch (err) {
      console.error("Failed to load locations:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleActive = async (loc: LocationRow, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/locations/${loc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ isActive }),
      })
      if (res.ok) load()
      else alert((await res.json()).error || "Failed to update location")
    } catch {
      alert("Failed to update location")
    }
  }

  const handleDelete = async (loc: LocationRow) => {
    if (!confirm(`Delete "${loc.name}"?`)) return
    try {
      const res = await fetch(`/api/admin/locations/${loc.id}`, { method: "DELETE", headers: authHeaders() })
      if (res.ok) load()
      else alert((await res.json()).error || "Failed to delete location")
    } catch {
      alert("Failed to delete location")
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MapPin className="h-6 w-6" />
              Locations
            </h1>
            <p className="text-sm text-muted-foreground">
              Where students can learn, and the assessment fee charged at each. Courses are offered per location.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Location
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>All Locations</span>
              <Badge variant="outline">{locations.length} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading…</p>
            ) : locations.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <MapPin className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p>No locations yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Assessment fee</TableHead>
                      <TableHead>Offerings</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((loc) => (
                      <TableRow key={loc.id} className={loc.isActive ? "" : "opacity-60"}>
                        <TableCell>
                          <p className="font-medium">{loc.name}</p>
                          <p className="text-xs text-muted-foreground">/{loc.slug}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{loc.kind === "ONLINE" ? "Online" : "Physical"}</Badge>
                        </TableCell>
                        <TableCell>{formatNaira(loc.assessmentFee)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {loc._count?.offerings ?? 0} offering(s), {loc._count?.enrollments ?? 0} enrollment(s)
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={loc.isActive}
                            onCheckedChange={(v) => toggleActive(loc, v)}
                            aria-label={`Toggle ${loc.name} active`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditing(loc)
                                setModalOpen(true)
                              }}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(loc)} title="Delete">
                              <Trash2 className="h-4 w-4" />
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

      <LocationFormModal location={editing} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </AdminLayout>
  )
}
