"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GraduationCap, Plus, Pencil, Trash2, Search, BadgeCheck, Star } from "lucide-react"
import { InstructorRosterModal } from "@/components/admin/instructor-roster-modal"

interface CourseLite {
  id: string
  title: string
  instrument?: string
  level?: string
}

interface Instructor {
  id: string
  name: string
  bio?: string | null
  credentials: string[]
  rating: number
  experience?: string | null
  availability?: string | null
  verified: boolean
  courses: CourseLite[]
}

export default function InstructorsPage() {
  const router = useRouter()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }
      const res = await fetch("/api/admin/instructors", { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const data = await res.json()
      setInstructors(data.instructors ?? [])
    } catch (err) {
      console.error("Failed to load instructors:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (instructor: Instructor) => {
    if (!confirm(`Remove "${instructor.name}" from the roster? Their courses will be left without an instructor.`)) return
    try {
      const token = localStorage.getItem("admin_token")
      const res = await fetch(`/api/admin/instructors/${instructor.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) load()
      else alert("Failed to delete instructor")
    } catch {
      alert("Failed to delete instructor")
    }
  }

  const filtered = instructors.filter((i) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      i.name.toLowerCase().includes(q) ||
      i.courses.some((c) => c.title.toLowerCase().includes(q))
    )
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <GraduationCap className="h-6 w-6" />
              Instructors
            </h1>
            <p className="text-sm text-muted-foreground">
              Reusable instructor roster — one instructor can teach many courses.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditId(null)
              setModalOpen(true)
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Instructor
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>All Instructors</span>
              <Badge variant="outline">{instructors.length} total</Badge>
            </CardTitle>
            <div className="relative mt-2 max-w-sm">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by instructor or course…"
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
                <GraduationCap className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p>No instructors yet. Add one and assign the courses they teach.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Credentials</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>
                          <p className="flex items-center gap-1 font-medium">
                            {i.name}
                            {i.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                          </p>
                          {i.experience && <p className="text-xs text-muted-foreground">{i.experience}</p>}
                        </TableCell>
                        <TableCell>
                          {i.credentials.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {i.credentials.map((c, idx) => (
                                <Badge key={idx} variant="secondary">{c}</Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {i.courses.length === 0 ? (
                            <span className="text-xs text-muted-foreground">None</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {i.courses.map((c) => (
                                <Badge key={c.id} variant="outline">{c.title}</Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            {i.rating?.toFixed(1) ?? "0.0"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditId(i.id); setModalOpen(true) }} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(i)} title="Delete">
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

      <InstructorRosterModal
        instructorId={editId}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditId(null) }}
        onSaved={load}
      />
    </AdminLayout>
  )
}
