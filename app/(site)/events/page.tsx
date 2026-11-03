import type { Metadata } from "next"
import { CalendarDays, Clock, MapPin } from "lucide-react"

import { MediaSlot } from "@/components/site/media-slot"
import { Display, Eyebrow, PillAnchor, PillLink } from "@/components/site/primitives"
import { getUpcomingEvents, type PublicEvent } from "@/lib/site-content-queries"
import { ENROL_HREF, ENROL_LABEL, SITE_EMAIL, SITE_EMAIL_MAILTO, SITE_WHATSAPP } from "@/lib/site"

export const metadata: Metadata = {
  title: "Events | Banafix",
  description: "Upcoming events at Banafix in Lekki, Lagos.",
}

/**
 * /events lists published events that have not started yet (`SiteEvent`, past
 * events are filtered out by `upcomingEvents`). With none it shows an honest
 * empty state. Read per request: "upcoming" depends on the current time and the
 * build needs no database.
 */
export const dynamic = "force-dynamic"

const LAGOS = "Africa/Lagos"

function formatEventDate(date: Date) {
  return date.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: LAGOS,
  })
}

function formatEventTime(date: Date) {
  return date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", timeZone: LAGOS })
}

function EventCard({ event }: { event: PublicEvent }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] border border-bfx-border bg-bfx-surface transition-shadow hover:shadow-[0_22px_44px_-24px_rgba(16,26,40,0.3)]">
      <div className="relative h-[140px]">
        <MediaSlot src={null} alt="" glyph="beamed" glyphSize={68} />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="mb-3 text-[21px] font-bold tracking-[-0.015em]">{event.title}</h2>
        <p className="bfx-pretty mb-5 text-[15px] leading-[1.6] text-bfx-body-2">
          {event.description}
        </p>

        <div className="mb-5 flex flex-col gap-2.5 text-[14px] text-bfx-strong">
          <div className="flex items-center gap-2.5">
            <CalendarDays aria-hidden className="h-4 w-4 flex-none text-bfx-muted-2" />
            <time dateTime={event.startsAt.toISOString()}>{formatEventDate(event.startsAt)}</time>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock aria-hidden className="h-4 w-4 flex-none text-bfx-muted-2" />
            {formatEventTime(event.startsAt)}
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin aria-hidden className="h-4 w-4 flex-none text-bfx-muted-2" />
            {event.location}
          </div>
        </div>

        <div className="mt-auto border-t border-dashed border-bfx-border-7 pt-[18px]">
          {event.registrationUrl ? (
            <PillAnchor
              variant="ink"
              size="sm"
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Reserve a seat
            </PillAnchor>
          ) : (
            <PillAnchor
              variant="ink"
              size="sm"
              href={SITE_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask about a seat
            </PillAnchor>
          )}
        </div>
      </div>
    </article>
  )
}

export default async function EventsPage() {
  const events = await getUpcomingEvents()

  return (
    <div className="bfx-rise">
      <section className="bfx-shell pt-16 pb-11">
        <div className="max-w-[640px]">
          <Eyebrow>EVENTS</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none">
            What&rsquo;s on
            <br />
            at Banafix
          </Display>
          <p className="bfx-pretty text-[18px] leading-[1.6] text-bfx-body">
            When an event is scheduled, it shows up here.
          </p>
        </div>
      </section>

      <section className="bfx-shell pb-20">
        {events.length > 0 ? (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(290px,1fr))]">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          /* Empty state. Nothing is scheduled and we say so rather than filling
             the grid with events that have already happened. */
          <div className="overflow-hidden rounded-[24px] border border-bfx-border bg-bfx-surface">
            <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
              <div>
                <Display as="h2" className="mb-3.5 text-[clamp(26px,3vw,36px)] leading-[1.08]">
                  Nothing on the calendar
                  <br />
                  right now
                </Display>
                <p className="bfx-pretty mb-7 max-w-[460px] text-[16.5px] leading-[1.65] text-bfx-body">
                  Event dates go up here as soon as they&apos;re set. Message us on WhatsApp and
                  ask what is coming up.
                </p>
                <div className="flex flex-wrap gap-3">
                  <PillAnchor
                    variant="ink"
                    size="lg"
                    href={SITE_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ask on WhatsApp
                  </PillAnchor>
                  <PillLink variant="outlineSoft" size="lg" href="/courses">
                    Browse courses
                  </PillLink>
                </div>
              </div>

              <div className="h-[220px] overflow-hidden rounded-[20px]">
                <MediaSlot src={null} alt="" glyph="beamed" glyphSize={84} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Host an event — the old "Propose an Event" button had no handler. */}
      <section className="bfx-shell pb-24">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[20px] border border-bfx-border-4 bg-bfx-cream-2 px-8 py-7">
          <div>
            <h2 className="mb-1.5 text-[19px] font-bold tracking-[-0.01em]">
              Want to run a workshop here?
            </h2>
            <p className="bfx-pretty m-0 max-w-[540px] text-[15px] leading-[1.6] text-bfx-body">
              Send us the idea and we&apos;ll see what we can do.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PillAnchor variant="ink" size="md" href={SITE_EMAIL_MAILTO}>
              Email {SITE_EMAIL}
            </PillAnchor>
            <PillLink variant="outlineSoft" size="md" href={ENROL_HREF}>
              {ENROL_LABEL}
            </PillLink>
          </div>
        </div>
      </section>
    </div>
  )
}
