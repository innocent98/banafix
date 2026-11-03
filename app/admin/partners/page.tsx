"use client"

import { SiteContentManager } from "@/components/admin/site-content-manager"
import { Handshake } from "lucide-react"

export default function PartnersAdminPage() {
  return (
    <SiteContentManager
      title="Trusted by"
      description="Real organisations Banafix works with. Only published partners appear on the home page."
      icon={Handshake}
      apiPath="/api/admin/trusted-partners"
      listKey="partners"
      itemKey="partner"
      singular="Partner"
      emptyText="No partners yet. The Trusted by section stays hidden until one is published."
      blank={{ name: "", logoUrl: "", linkUrl: "", isPublished: false, order: 0 }}
      toForm={(r) => ({
        name: r.name,
        logoUrl: r.logoUrl ?? "",
        linkUrl: r.linkUrl ?? "",
        isPublished: r.isPublished,
        order: r.order,
      })}
      columns={[
        {
          header: "Partner",
          render: (r) => (
            <div className="flex items-center gap-3">
              {r.logoUrl ? <img src={r.logoUrl} alt="" className="h-8 w-12 rounded border object-contain" /> : null}
              <span className="font-medium">{r.name}</span>
            </div>
          ),
        },
        { header: "Link", render: (r) => <span className="text-xs text-muted-foreground">{r.linkUrl ?? "None"}</span> },
        { header: "Order", render: (r) => r.order },
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "logoUrl", label: "Logo", type: "image", help: "Optional. Without a logo the name is shown as text." },
        { key: "linkUrl", label: "Website link", type: "url", placeholder: "https://", help: "Optional." },
        { key: "order", label: "Display order", type: "number", help: "Lower numbers show first." },
        { key: "isPublished", label: "Show on the site", type: "switch" },
      ]}
    />
  )
}
