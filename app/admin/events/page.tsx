"use client"

import { SiteContentManager } from "@/components/admin/site-content-manager"
import { toLagosLocalInput } from "@/lib/site-content"
import { CalendarDays } from "lucide-react"

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })

export default function EventsAdminPage() {
  return (
    <SiteContentManager
      title="Events"
      description="Upcoming recitals, workshops and masterclasses. Past events are hidden from the public page automatically."
      icon={CalendarDays}
      apiPath="/api/admin/site-events"
      listKey="events"
      itemKey="event"
      singular="Event"
      emptyText="No events yet. The public Events page shows an honest empty state until one is published."
      blank={{ title: "", description: "", startsAt: "", location: "", registrationUrl: "", isPublished: false }}
      toForm={(r) => ({
        title: r.title,
        description: r.description,
        startsAt: toLagosLocalInput(new Date(r.startsAt)),
        location: r.location,
        registrationUrl: r.registrationUrl ?? "",
        isPublished: r.isPublished,
      })}
      columns={[
        { header: "Event", render: (r) => <span className="font-medium">{r.title}</span> },
        { header: "When (Lagos)", render: (r) => <span className="text-sm">{when(r.startsAt)}</span> },
        { header: "Where", render: (r) => <span className="text-sm">{r.location}</span> },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea", required: true },
        { key: "startsAt", label: "Starts (Lagos time)", type: "datetime", required: true },
        { key: "location", label: "Location", type: "text", required: true },
        { key: "registrationUrl", label: "Registration link", type: "url", placeholder: "https://", help: "Optional. Without one, visitors are pointed to WhatsApp." },
        { key: "isPublished", label: "Show on the site", type: "switch" },
      ]}
    />
  )
}
