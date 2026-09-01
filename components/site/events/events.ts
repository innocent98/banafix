/**
 * Event content for /events.
 *
 * THIS LIST IS DELIBERATELY EMPTY. There is no Event model in Prisma and no
 * /api/events endpoint — the page has never had a data source.
 *
 * The previous page hardcoded six events and presented them as bookable:
 *
 *   Piano Masterclass with Sarah Johnson   28 Dec 2024   18/30 seats   Free
 *   Guitar Workshop: Fingerpicking          30 Dec 2024   12/15 seats   ₦15,000
 *   Student Recital: Winter Showcase        5 Jan 2025    45/100 seats  Free
 *   Vocal Technique Intensive               8 Jan 2025    8/12 seats    ₦25,000
 *   Music Production Workshop               12 Jan 2025   6/10 seats    ₦30,000
 *   Annual Music Competition                20 Jan 2025   23/50 seats   ₦5,000
 *
 * Every one of those dates is in the past, every seat count was invented, all
 * six shared one stock photo, and the "Register Now" button had no handler —
 * there is no registration endpoint for events. They were removed rather than
 * restyled, because a re-skin of a passed date with a live "Register Now"
 * button is a worse lie than the old design was.
 *
 * To put real events back: add them to `EVENTS` below. The page already
 * renders the full designed grid the moment the array is non-empty, and falls
 * back to a designed empty state while it is not.
 */

export type EventCategory = "workshop" | "masterclass" | "recital" | "competition"

export interface BanafixEvent {
  id: string
  title: string
  category: EventCategory
  /** ISO date, e.g. "2026-10-04". */
  date: string
  /** Free text, e.g. "2:00 PM – 4:00 PM". */
  time: string
  location: string
  /** Display string. Use "Free" when there is no charge. */
  price: string
  host: string
  description: string
  /** Optional photo URL; MediaSlot renders its designed ground without one. */
  image?: string | null
  /** Where a visitor books. Omit and the card shows the WhatsApp fallback. */
  registerHref?: string | null
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  workshop: "Workshop",
  masterclass: "Masterclass",
  recital: "Recital",
  competition: "Competition",
}

export const EVENTS: BanafixEvent[] = []

/** Future-dated events only, soonest first. */
export function upcomingEvents(events: BanafixEvent[], now: Date = new Date()): BanafixEvent[] {
  return events
    .filter((event) => new Date(event.date).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
