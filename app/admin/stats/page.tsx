"use client"

import { SiteContentManager } from "@/components/admin/site-content-manager"
import { TrendingUp } from "lucide-react"

export default function StatsAdminPage() {
  return (
    <SiteContentManager
      title="Site stats"
      description="Real figures shown in the home page hero. Enter only numbers you can back up."
      icon={TrendingUp}
      apiPath="/api/admin/site-stats"
      listKey="stats"
      itemKey="stat"
      singular="Stat"
      emptyText="No stats yet. The home page shows no figures until one is published."
      blank={{ label: "", value: "", note: "", isPublished: false, order: 0 }}
      toForm={(r) => ({
        label: r.label,
        value: r.value,
        note: r.note ?? "",
        isPublished: r.isPublished,
        order: r.order,
      })}
      columns={[
        { header: "Figure", render: (r) => <span className="font-display text-lg font-semibold">{r.value}</span> },
        {
          header: "Label",
          render: (r) => (
            <div>
              <p className="font-medium">{r.label}</p>
              {r.note && <p className="text-xs text-muted-foreground">Source: {r.note}</p>}
            </div>
          ),
        },
        { header: "Order", render: (r) => r.order },
      ]}
      fields={[
        { key: "value", label: "Figure", type: "text", required: true, placeholder: "e.g. 120" },
        { key: "label", label: "Label", type: "text", required: true, placeholder: "e.g. Students taught" },
        { key: "note", label: "Source note (admin only)", type: "text", help: "Where the figure comes from. Not shown publicly." },
        { key: "order", label: "Display order", type: "number", help: "Lower numbers show first." },
        { key: "isPublished", label: "Show on the site", type: "switch" },
      ]}
    />
  )
}
