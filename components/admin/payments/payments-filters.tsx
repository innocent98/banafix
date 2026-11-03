"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MANUAL_PAYMENT_METHODS, ONLINE_PAYMENT_METHOD, PAYMENT_METHOD_LABELS } from "@/lib/tuition-methods"
import { ALL, EMPTY_FILTERS, PAYMENT_STATUSES, type Filters } from "./types"

interface Props {
  filters: Filters
  locations: Array<{ id: string; name: string }>
  onChange: (next: Filters) => void
}

export function PaymentsFilters({ filters, locations, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const dirty = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-2">
        <Label htmlFor="pf-q">Search</Label>
        <Input id="pf-q" placeholder="Student name or email" value={filters.q} onChange={(e) => set({ q: e.target.value })} />
      </div>
      <div>
        <Label>Location</Label>
        <Select value={filters.locationId} onValueChange={(v) => set({ locationId: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All locations</SelectItem>
            {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Method</Label>
        <Select value={filters.method} onValueChange={(v) => set({ method: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All methods</SelectItem>
            {[...MANUAL_PAYMENT_METHODS, ONLINE_PAYMENT_METHOD].map((m) => (
              <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Status</Label>
        <Select value={filters.status} onValueChange={(v) => set({ status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end">
        <Button variant="outline" size="sm" className="w-full" disabled={!dirty} onClick={() => onChange(EMPTY_FILTERS)}>
          Clear filters
        </Button>
      </div>
      <div>
        <Label htmlFor="pf-from">From</Label>
        <Input id="pf-from" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set({ from: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="pf-to">To</Label>
        <Input id="pf-to" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set({ to: e.target.value })} />
      </div>
    </div>
  )
}
