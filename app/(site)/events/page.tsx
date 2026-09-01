import type { Metadata } from "next"
import { CalendarDays, Clock, MapPin } from "lucide-react"

import {
  EVENT_CATEGORY_LABELS,
  EVENTS,
  upcomingEvents,
  type BanafixEvent,
} from "@/components/site/events/events"
import { MediaSlot } from "@/components/site/media-slot"
import { Display, Eyebrow, LevelBadge, PillAnchor, PillLink } from "@/components/site/primitives"
import { SITE_EMAIL, SITE_EMAIL_MAILTO, SITE_WHATSAPP, TRIAL_HREF } from "@/lib/site"

export const metadata: Metadata = {
  title: "Events & workshops | Banafix",
  description:
    "Masterclasses, workshops and student recitals at the Banafix studio in Lekki, Lagos.",
}

/**
 * /events.
 *
 * There is no Event model and no events API — see components/site/events/events.ts
 * for what was removed and why. The page renders the designed grid when
 * `EVENTS` has entries and a designed empty state while it does not, so
 * putting real events back is a data edit, not a rebuild.
 *
 * `revalidate` is deliberate: `upcomingEvents` compares against `new Date()`,
 * and a purely static page would freeze "upcoming" at build time and keep
 * listing an event days after it ran. An hour is well inside the resolution
 * anyone cares about for an event listing, and far cheaper than
 * force-dynamic.
 */
export const revalidate = 3600

function formatEventDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function EventCard({ event }: { event: BanafixEvent }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] border border-bfx-border bg-bfx-surface transition-shadow hover:shadow-[0_22px_44px_-24px_rgba(16,26,40,0.3)]">
      <div className="relative h-[196px]">
        <MediaSlot
          src={event.image ?? null}
          alt={event.title}
          glyph="beamed"
          glyphSize={68}
        />
        <LevelBadge className="top-[13px] left-[13px]">
          {EVENT_CATEGORY_LABELS[event.category]}
        </LevelBadge>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="mb-1.5 text-[21px] font-bold tracking-[-0.015em]">{event.title}</h2>
        <p className="mb-4 text-[13.5px] font-semibold text-bfx-bronze">with {event.host}</p>
        <p className="bfx-pretty mb-5 text-[15px] leading-[1.6] text-bfx-body-2">
          {event.description}
        </p>

        <div className="mb-5 flex flex-col gap-2.5 text-[14px] text-bfx-strong">
          <div className="flex items-center gap-2.5">
            <CalendarDays aria-hidden className="h-4 w-4 flex-none text-bfx-muted-2" />
            <time dateTime={event.date}>{formatEventDate(event.date)}</time>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock aria-hidden className="h-4 w-4 flex-none text-bfx-muted-2" />
            {event.time}
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin aria-hidden className="h-4 w-4 flex-none text-bfx-muted-2" />
            {event.location}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3.5 border-t border-dashed border-bfx-border-7 pt-[18px]">
          <div>
            <div className="text-[12px] font-semibold text-bfx-muted-2">entry</div>
            <div className="text-[21px] font-extrabold tracking-[-0.01em]">{event.price}</div>
          </div>
          {event.registerHref ? (
            <PillAnchor
              variant="ink"
              size="sm"
              href={event.registerHref}
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

export default function EventsPage() {
  const events = upcomingEvents(EVENTS)

  return (
    <div className="bfx-rise">
      <section className="bfx-shell pt-16 pb-11">
        <div className="max-w-[640px]">
          <Eyebrow>EVENTS</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none">
            Recitals, workshops
            <br />
            and masterclasses
          </Display>
          <p className="bfx-pretty text-[18px] leading-[1.6] text-bfx-body">
            Every term ends in a student recital, and we run open workshops in between. When one is
            scheduled, it shows up here.
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
          /* First-time empty state. Nothing is scheduled and we say so rather
             than filling the grid with events that have already happened. */
          <div className="overflow-hidden rounded-[24px] border border-bfx-border bg-bfx-surface">
            <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
              <div>
                <Display as="h2" className="mb-3.5 text-[clamp(26px,3vw,36px)] leading-[1.08]">
                  Nothing on the calendar
                  <br />
                  right now
                </Display>
                <p className="bfx-pretty mb-7 max-w-[460px] text-[16.5px] leading-[1.65] text-bfx-body">
                  The next recital and workshop dates go up here as soon as they&apos;re set. Tell
                  us what you&apos;d like to sit in on and we&apos;ll message you when it&apos;s
                  scheduled — no mailing list, just a WhatsApp note.
                </p>
                <div className="flex flex-wrap gap-3">
                  <PillAnchor
                    variant="ink"
                    size="lg"
                    href={SITE_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tell us on WhatsApp
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
              Tutors and students both propose sessions. Send us the idea and the instrument, and
              we&apos;ll find a room and a date.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PillAnchor variant="ink" size="md" href={SITE_EMAIL_MAILTO}>
              Email {SITE_EMAIL}
            </PillAnchor>
            <PillLink variant="outlineSoft" size="md" href={TRIAL_HREF}>
              Book a free trial
            </PillLink>
          </div>
        </div>
      </section>
    </div>
  )
}
