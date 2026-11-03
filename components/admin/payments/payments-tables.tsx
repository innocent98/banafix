import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/admin/enrollments/status-badge"
import { STATUS_STYLES, formatDay, formatMoney } from "@/components/admin/tuition/shared"
import { methodLabel, type OutstandingRow, type PaymentRow } from "./types"

function Person({ name, email }: { name: string; email: string }) {
  return (
    <div>
      <p className="font-medium">{name}</p>
      <p className="text-xs text-muted-foreground">{email}</p>
    </div>
  )
}

function CourseCell({ course, location }: { course: string; location: string }) {
  return (
    <div>
      <p>{course}</p>
      {location && <p className="text-xs text-muted-foreground">{location}</p>}
    </div>
  )
}

export function PaymentsTable({ rows }: { rows: PaymentRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Enrollment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="whitespace-nowrap text-sm">{formatDay(p.paidAt ?? p.createdAt)}</TableCell>
              <TableCell><Person name={p.student} email={p.email} /></TableCell>
              <TableCell><CourseCell course={p.course} location={p.location} /></TableCell>
              <TableCell className="text-right font-medium">{formatMoney(p.amount)}</TableCell>
              <TableCell>
                <p className="text-sm">{methodLabel(p.method)}</p>
                {p.reference && <p className="break-all text-xs text-muted-foreground">{p.reference}</p>}
                <p className="text-xs text-muted-foreground">{p.receiptNumber}</p>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={STATUS_STYLES[p.status] ?? ""}>{p.status}</Badge>
              </TableCell>
              <TableCell>
                <StatusBadge status={p.enrollmentStatus} />
                {p.enrollmentStatus === "cancelled" && (
                  <p className="mt-1 text-xs text-red-600">Enrollment cancelled</p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function OutstandingTable({ rows }: { rows: OutstandingRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Enrollment</TableHead>
            <TableHead className="text-right">Charged</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
            <TableHead>Classes covered</TableHead>
            <TableHead>Last payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.enrollmentId}>
              <TableCell><Person name={r.student} email={r.email} /></TableCell>
              <TableCell><CourseCell course={r.course} location={r.location} /></TableCell>
              <TableCell><StatusBadge status={r.enrollmentStatus} /></TableCell>
              <TableCell className="text-right">{r.charged == null ? "-" : formatMoney(r.charged)}</TableCell>
              <TableCell className="text-right">{formatMoney(r.paid)}</TableCell>
              <TableCell className="text-right font-semibold text-orange-600">{formatMoney(r.outstanding)}</TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {r.classesCovered != null && r.classesPurchased != null ? `${r.classesCovered} of ${r.classesPurchased}` : "-"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">{r.lastPaymentAt ? formatDay(r.lastPaymentAt) : "None yet"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
