"use client"

import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { ImageUpload } from "@/components/admin/image-upload"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"

/**
 * One manager for every admin-edited piece of public-site content. Each admin
 * page is just a config (API path, columns, form fields); the list, publish
 * toggle, add/edit dialog and delete are shared so the four pages cannot drift.
 */

export type Row = { id: string; isPublished: boolean } & Record<string, any>
export type Form = Record<string, any>

export interface FieldDef {
  key: string
  label: string
  type: "text" | "textarea" | "url" | "image" | "datetime" | "number" | "switch"
  required?: boolean
  placeholder?: string
  help?: string
  /** Disable the control while this returns true (e.g. publish needs consent). */
  disabledWhen?: (form: Form) => boolean
  disabledHelp?: string
  /** Extra form changes to make when this field changes (e.g. consent off => unpublish). */
  alsoSet?: (value: unknown) => Form
}

export interface ColumnDef {
  header: string
  render: (row: Row) => ReactNode
}

interface Props {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  /** e.g. "/api/admin/testimonials" */
  apiPath: string
  listKey: string
  itemKey: string
  singular: string
  fields: FieldDef[]
  columns: ColumnDef[]
  blank: Form
  toForm: (row: Row) => Form
  emptyText: string
  /** True when the row's switch must stay off (e.g. no permission to publish). */
  publishBlockedReason?: (row: Row) => string | null
}

export function SiteContentManager(props: Props) {
  const { apiPath, listKey, itemKey, singular } = props
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form, setForm] = useState<Form>(props.blank)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const call = useCallback(
    async (path: string, init?: { method?: string; body?: unknown }) => {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return null
      }
      const res = await fetch(path, {
        method: init?.method ?? "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      })
      if (res.status === 401) {
        router.push("/admin/login")
        return null
      }
      const data = await res.json().catch(() => ({}))
      return { ok: res.ok, data }
    },
    [router],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setPageError("")
    try {
      const r = await call(apiPath)
      if (!r) return
      if (!r.ok) throw new Error(r.data.error || "Failed to load")
      setRows(r.data[listKey] ?? [])
    } catch (e: any) {
      setPageError(e.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [call, apiPath, listKey])

  useEffect(() => {
    load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setForm(props.blank)
    setFormError("")
    setOpen(true)
  }
  const openEdit = (row: Row) => {
    setEditing(row)
    setForm(props.toForm(row))
    setFormError("")
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError("")
    try {
      const body: Form = { ...form }
      for (const f of props.fields) if (f.type === "number") body[f.key] = Number(body[f.key] || 0)
      const r = await call(editing ? `${apiPath}/${editing.id}` : apiPath, {
        method: editing ? "PATCH" : "POST",
        body,
      })
      if (!r) return
      if (!r.ok) {
        setFormError(r.data.error || "Failed to save")
        return
      }
      setOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (row: Row, next: boolean) => {
    setPageError("")
    const r = await call(`${apiPath}/${row.id}`, { method: "PATCH", body: { isPublished: next } })
    if (!r) return
    if (!r.ok) setPageError(r.data.error || "Failed to update")
    load()
  }

  const remove = async (row: Row) => {
    if (!confirm(`Delete this ${singular.toLowerCase()}? This cannot be undone.`)) return
    const r = await call(`${apiPath}/${row.id}`, { method: "DELETE" })
    if (r && !r.ok) setPageError(r.data.error || "Failed to delete")
    load()
  }

  const Icon = props.icon
  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value, ...props.fields.find((x) => x.key === key)?.alsoSet?.(value) }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Icon className="h-6 w-6" />
              {props.title}
            </h1>
            <p className="text-sm text-muted-foreground">{props.description}</p>
          </div>
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" />
            Add {singular}
          </Button>
        </div>

        {pageError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{pageError}</p>}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>All {props.title}</span>
              <Badge variant="outline">
                {rows.filter((r) => r.isPublished).length} live / {rows.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Icon className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p>{props.emptyText}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {props.columns.map((c) => (
                        <TableHead key={c.header}>{c.header}</TableHead>
                      ))}
                      <TableHead>Live on site</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const blocked = props.publishBlockedReason?.(row) ?? null
                      return (
                        <TableRow key={row.id}>
                          {props.columns.map((c) => (
                            <TableCell key={c.header}>{c.render(row)}</TableCell>
                          ))}
                          <TableCell>
                            <Switch
                              checked={row.isPublished}
                              disabled={!row.isPublished && !!blocked}
                              title={!row.isPublished && blocked ? blocked : undefined}
                              onCheckedChange={(v) => togglePublish(row, v)}
                              aria-label={`Show this ${singular.toLowerCase()} on the site`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(row)} title="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => remove(row)} title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Add"} {singular.toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            {props.fields.map((f) => {
              const disabled = f.disabledWhen?.(form) ?? false
              const id = `${itemKey}-${f.key}`
              return (
                <div key={f.key}>
                  {f.type === "switch" ? (
                    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                      <div>
                        <Label htmlFor={id}>{f.label}</Label>
                        {(disabled && f.disabledHelp) || f.help ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {disabled && f.disabledHelp ? f.disabledHelp : f.help}
                          </p>
                        ) : null}
                      </div>
                      <Switch
                        id={id}
                        checked={!!form[f.key]}
                        disabled={disabled}
                        onCheckedChange={(v) => set(f.key, v)}
                      />
                    </div>
                  ) : (
                    <>
                      <Label htmlFor={id}>
                        {f.label}
                        {f.required ? " *" : ""}
                      </Label>
                      {f.type === "textarea" ? (
                        <Textarea
                          id={id}
                          rows={4}
                          className="mt-1"
                          value={form[f.key] ?? ""}
                          placeholder={f.placeholder}
                          onChange={(e) => set(f.key, e.target.value)}
                        />
                      ) : f.type === "image" ? (
                        <ImageUpload value={form[f.key] ?? ""} onChange={(url) => set(f.key, url)} />
                      ) : (
                        <Input
                          id={id}
                          className="mt-1"
                          type={f.type === "datetime" ? "datetime-local" : f.type === "number" ? "number" : "text"}
                          inputMode={f.type === "url" ? "url" : undefined}
                          value={form[f.key] ?? ""}
                          placeholder={f.placeholder}
                          onChange={(e) => set(f.key, e.target.value)}
                        />
                      )}
                      {f.help && <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>}
                    </>
                  )}
                </div>
              )
            })}
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
