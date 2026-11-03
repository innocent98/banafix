import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/enrollment-status"

export interface EnrollmentFilterState {
  searchTerm: string
  statusFilter: string
  paymentFilter: string
  locationFilter: string
}

interface Props extends EnrollmentFilterState {
  locations: string[]
  onSearchChange: (v: string) => void
  onStatusChange: (v: string) => void
  onPaymentChange: (v: string) => void
  onLocationChange: (v: string) => void
}

export function EnrollmentFilters({
  searchTerm,
  statusFilter,
  paymentFilter,
  locationFilter,
  locations,
  onSearchChange,
  onStatusChange,
  onPaymentChange,
  onLocationChange,
}: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students, courses, or emails..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={onLocationChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={onPaymentChange}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="application_paid">Assessment fee paid</SelectItem>
              <SelectItem value="application_pending">Assessment fee pending</SelectItem>
              <SelectItem value="tuition_paid">Tuition Paid</SelectItem>
              <SelectItem value="tuition_pending">Tuition Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
