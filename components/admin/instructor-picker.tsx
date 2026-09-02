"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, BadgeCheck, Star } from "lucide-react"

export interface RosterInstructor {
  id: string
  name: string
  bio?: string | null
  avatar?: string | null
  credentials: string[]
  rating: number
  experience?: string | null
  availability?: string | null
  verified: boolean
  courses?: { id: string; title: string }[]
}

interface InstructorPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (instructor: RosterInstructor) => void
}

// Dialog that lists the existing instructor roster so a course can reuse one
// instead of always creating a new record.
export function InstructorPicker({ isOpen, onClose, onSelect }: InstructorPickerProps) {
  const [instructors, setInstructors] = useState<RosterInstructor[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setQuery("")
    setLoading(true)
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
    fetch(`/api/admin/instructors`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setInstructors(d.instructors ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen])

  const filtered = instructors.filter((i) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return i.name.toLowerCase().includes(q) || (i.courses ?? []).some((c) => c.title.toLowerCase().includes(q))
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select an existing instructor</DialogTitle>
          <DialogDescription>Reuse an instructor from the roster instead of creating a new one.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by name or course…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="mt-2 max-h-[55vh] space-y-2 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {instructors.length === 0 ? "No instructors in the roster yet." : "No matches."}
            </p>
          ) : (
            filtered.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => {
                  onSelect(i)
                  onClose()
                }}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={i.avatar || undefined} />
                  <AvatarFallback className="bg-amber-100 text-amber-800">
                    {i.name.split(" ").map((n) => n[0]).join("").toUpperCase() || "IN"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 font-medium">
                    {i.name}
                    {i.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {i.experience || "—"}
                    {i.courses && i.courses.length > 0 && ` · teaches ${i.courses.length} course${i.courses.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  {i.rating?.toFixed(1) ?? "0.0"}
                </Badge>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
