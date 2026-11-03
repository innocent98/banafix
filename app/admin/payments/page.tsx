"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Wallet } from "lucide-react"
import { PaymentsFilters } from "@/components/admin/payments/payments-filters"
import { CreditsTable, OutstandingTable, PaymentsTable } from "@/components/admin/payments/payments-tables"
import {
  EMPTY_FILTERS,
  creditsCsv,
  downloadCsv,
  isTruncated,
  outstandingCsv,
  paymentsCsv,
  toQueryString,
  type Filters,
  type PaymentsResponse,
} from "@/components/admin/payments/types"
import { formatMoney } from "@/components/admin/tuition/shared"

type Tab = "payments" | "outstanding" | "credits"

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export default function PaymentsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [tab, setTab] = useState<Tab>("payments")
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([])
  const [data, setData] = useState<PaymentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const requestId = useRef(0)

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("admin_token")}` })

  // Typing in search / picking dates waits a beat before refetching.
  useEffect(() => {
    const t = setTimeout(() => setApplied(filters), 300)
    return () => clearTimeout(t)
  }, [filters])

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      router.push("/admin/login")
      return
    }
    fetch("/api/admin/locations", { headers: authHeaders() })
      .then((res) => res.json())
      .then((body) => setLocations(body.locations ?? []))
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = useCallback(async (f: Filters) => {
    const mine = ++requestId.current
    setLoading(true)
    setError("")
    try {
      if (!localStorage.getItem("admin_token")) {
        router.push("/admin/login")
        return
      }
      const res = await fetch(`/api/admin/payments${toQueryString(f)}`, { headers: authHeaders() })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const body = await res.json().catch(() => ({}))
      if (mine !== requestId.current) return // a newer request superseded this one
      if (!res.ok) {
        setError(body.error || "Failed to load payments")
        setData(null)
        return
      }
      setData(body as PaymentsResponse)
    } catch {
      if (mine === requestId.current) {
        setError("Network error. Please try again.")
        setData(null)
      }
    } finally {
      if (mine === requestId.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load(applied)
  }, [applied, load])

  const exportCsv = () => {
    if (!data) return
    const day = new Date().toISOString().slice(0, 10)
    if (tab === "payments") downloadCsv(`tuition-payments-${day}.csv`, paymentsCsv(data.payments))
    else if (tab === "credits") downloadCsv(`tuition-credits-${day}.csv`, creditsCsv(data.credits ?? []))
    else downloadCsv(`tuition-outstanding-${day}.csv`, outstandingCsv(data.outstanding))
  }

  const rowsShown = data ? (tab === "payments" ? data.payments.length : tab === "credits" ? (data.credits ?? []).length : data.outstanding.length) : 0

  const body = (list: "payments" | "outstanding" | "credits") => {
    if (loading && !data) return <p className="py-10 text-center text-muted-foreground">Loading...</p>
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => load(applied)}>Retry</Button>
          </AlertDescription>
        </Alert>
      )
    }
    if (!data) return null
    const rows = (data[list] ?? []).length
    return (
      <div className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
        {isTruncated(data.truncated, list) && (
          <Alert>
            <AlertDescription>
              Showing the first {rows} rows only. Narrow the filters to see the rest. The CSV export contains just the rows shown.
              {list !== "payments" && typeof data.truncated !== "boolean" && data.truncated.outstandingScan
                ? " Too many enrollments to scan in one go: the totals above are a lower bound."
                : ""}
            </AlertDescription>
          </Alert>
        )}
        {rows === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <Wallet className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>
              {list === "payments"
                ? "No payments match these filters."
                : list === "credits"
                  ? "No credit on account for these filters."
                  : "Nobody owes tuition for these filters."}
            </p>
          </div>
        ) : list === "payments" ? (
          <PaymentsTable rows={data.payments} />
        ) : list === "credits" ? (
          <>
            <p className="text-xs text-muted-foreground">
              Money held beyond what is owed (for example two payment links both paid), or paid on an enrollment that was cancelled. There is no refund flow yet: apply it to a top-up (Enrollments, Manage payments, Add charge) or refund it by hand in Paystack or by bank transfer.
            </p>
            <CreditsTable rows={data.credits ?? []} />
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Outstanding balances respond to the location and search filters only. Method, status and dates apply to payments.
            </p>
            <OutstandingTable rows={data.outstanding} />
          </>
        )}
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Wallet className="h-6 w-6" />
              Payments
            </h1>
            <p className="text-sm text-muted-foreground">
              Tuition collected, online links waiting to be paid, and who still owes.
            </p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!data || rowsShown === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Collected" value={data ? formatMoney(data.totals.collected) : "-"} hint="Completed and part payments in the rows shown" />
          <Tile label="Pending online" value={data ? formatMoney(data.totals.pendingOnline) : "-"} hint="Payment links not yet paid" />
          <Tile label="Outstanding" value={data ? formatMoney(data.totals.outstanding) : "-"} hint="Still owed by enrolled and plan-agreed students" />
          <Tile label="Credit on account" value={data ? formatMoney(data.totals.credit ?? 0) : "-"} hint="Paid beyond what is owed, or on cancelled enrollments: refund or apply" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentsFilters filters={filters} locations={locations} onChange={setFilters} />
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="payments">Payments{data ? ` (${data.payments.length})` : ""}</TabsTrigger>
            <TabsTrigger value="outstanding">Outstanding{data ? ` (${data.outstanding.length})` : ""}</TabsTrigger>
            <TabsTrigger value="credits">Credits{data ? ` (${(data.credits ?? []).length})` : ""}</TabsTrigger>
          </TabsList>
          <Card>
            <CardContent className="pt-6">
              <TabsContent value="payments">{body("payments")}</TabsContent>
              <TabsContent value="outstanding">{body("outstanding")}</TabsContent>
              <TabsContent value="credits">{body("credits")}</TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
