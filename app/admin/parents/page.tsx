"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react"
import { ParentFormModal } from "@/components/admin/parent-form-modal"

interface Child {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Parent {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  birthdayMonth?: number | null
  birthdayDay?: number | null
  children: Child[]
}

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default function ParentsPage() {
  const router = useRouter()
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const loadParents = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }
      const res = await fetch("/api/admin/parents", { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const data = await res.json()
      setParents(data.parents ?? [])
    } catch (err) {
      console.error("Failed to load parents:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (parent: Parent) => {
    if (!confirm(`Delete parent "${parent.name}"? This does not delete their children.`)) return
    try {
      const token = localStorage.getItem("admin_token")
      const res = await fetch(`/api/admin/parents/${parent.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) loadParents()
      else alert("Failed to delete parent")
    } catch {
      alert("Failed to delete parent")
    }
  }

  const filtered = parents.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.children.some((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q))
    )
  })

  const formatBirthday = (p: Parent) =>
    p.birthdayMonth && p.birthdayDay ? `${MONTHS[p.birthdayMonth]} ${p.birthdayDay}` : "—"

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Users className="h-6 w-6" />
              Parents
            </h1>
            <p className="text-sm text-muted-foreground">
              Parent/guardian records mapped to enrolled students.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditId(null)
              setModalOpen(true)
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Parent
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>All Parents</span>
              <Badge variant="outline">{parents.length} total</Badge>
            </CardTitle>
            <div className="relative mt-2 max-w-sm">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by parent or child…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p>No parents yet. Add one to map it to enrolled students.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Children</TableHead>
                      <TableHead>Birthday</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <p className="font-medium">{p.name}</p>
                          {p.address && <p className="text-xs text-muted-foreground">{p.address}</p>}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{p.email}</p>
                          {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                        </TableCell>
                        <TableCell>
                          {p.children.length === 0 ? (
                            <span className="text-xs text-muted-foreground">None</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {p.children.map((c) => (
                                <Badge key={c.id} variant="secondary">
                                  {c.firstName} {c.lastName}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatBirthday(p)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditId(p.id)
                                setModalOpen(true)
                              }}
                              title="Edit parent"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(p)}
                              title="Delete parent"
                            >
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

      <ParentFormModal
        parentId={editId}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditId(null)
        }}
        onSaved={loadParents}
      />
    </AdminLayout>
  )
}
