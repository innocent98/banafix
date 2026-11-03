"use client"

import { CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { describePreferences } from "@/lib/scheduling/preferences"
import { studentName, type NeedsSchedulingItem } from "./shared"

interface Props {
  items: NeedsSchedulingItem[]
  onSchedule: (enrollmentId: string) => void
}

export function NeedsSchedulingPanel({ items, onSchedule }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Needs scheduling</span>
          <Badge variant="outline">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every student with an agreed plan has all their classes scheduled.</p>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-medium">{studentName(n.student)}</p>
                  <p className="break-words text-sm text-muted-foreground">
                    {n.course.title}
                    {n.location ? ` · ${n.location.name}` : ""}
                  </p>
                  <p className="text-sm">{n.scheduled} of {n.plannedClasses ?? "?"} classes scheduled</p>
                  <p className="break-words text-xs text-muted-foreground">{describePreferences(n)}</p>
                </div>
                <Button type="button" size="sm" className="shrink-0 self-start sm:self-center" onClick={() => onSchedule(n.id)}>
                  <CalendarPlus className="mr-1 h-4 w-4" />
                  Schedule
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
