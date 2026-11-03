"use client"

import { Badge } from "@/components/ui/badge"
import { SiteContentManager } from "@/components/admin/site-content-manager"
import { MessageSquare } from "lucide-react"

export default function TestimonialsAdminPage() {
  return (
    <SiteContentManager
      title="Testimonials"
      description="Real student and parent words. A testimonial can only go live once permission to publish is recorded."
      icon={MessageSquare}
      apiPath="/api/admin/testimonials"
      listKey="testimonials"
      itemKey="testimonial"
      singular="Testimonial"
      emptyText="No testimonials yet. Add one only after the person has agreed to it being published."
      blank={{ name: "", role: "", quote: "", videoUrl: "", permissionToPublish: false, isPublished: false, order: 0 }}
      toForm={(r) => ({
        name: r.name,
        role: r.role ?? "",
        quote: r.quote,
        videoUrl: r.videoUrl ?? "",
        permissionToPublish: r.permissionToPublish,
        isPublished: r.isPublished,
        order: r.order,
      })}
      publishBlockedReason={(r) => (r.permissionToPublish ? null : "Record permission to publish first (edit this testimonial)")}
      columns={[
        {
          header: "Person",
          render: (r) => (
            <div>
              <p className="font-medium">{r.name}</p>
              {r.role && <p className="text-xs text-muted-foreground">{r.role}</p>}
            </div>
          ),
        },
        { header: "Quote", render: (r) => <p className="max-w-xs truncate text-sm">{r.quote}</p> },
        {
          header: "Permission",
          render: (r) =>
            r.permissionToPublish ? <Badge variant="secondary">Given</Badge> : <Badge variant="outline">Not recorded</Badge>,
        },
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "role", label: "Relationship", type: "text", placeholder: "e.g. Parent, piano student" },
        { key: "quote", label: "Quote", type: "textarea", required: true },
        { key: "videoUrl", label: "Video link", type: "url", placeholder: "https://", help: "Optional. Must start with http:// or https://" },
        { key: "order", label: "Display order", type: "number", help: "Lower numbers show first." },
        {
          key: "permissionToPublish",
          label: "Permission to publish recorded",
          type: "switch",
          alsoSet: (v) => (v ? {} : { isPublished: false }),
          help: "Turn on only when the person has agreed. Turning it off takes a live testimonial down.",
        },
        {
          key: "isPublished",
          label: "Show on the site",
          type: "switch",
          disabledWhen: (f) => !f.permissionToPublish,
          disabledHelp: "Record permission to publish first.",
        },
      ]}
    />
  )
}
