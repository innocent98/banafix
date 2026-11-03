/**
 * Public view of what each location offers (B6).
 *
 * An offering is "offerable" only when it, its location, and at least one per-class rate are all
 * live. Anything else is invisible publicly, so a course can never show a wrong or missing price.
 * Legacy `Course.pricing` / `availableModes` / `location` are never read here.
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { fromRate, type Rate } from '@/lib/offering-rates'

export function offerableOfferingWhere(locationId?: string): Prisma.CourseOfferingWhereInput {
  return {
    isActive: true,
    location: { isActive: true },
    deliveryMode: { isActive: true },
    ...(locationId ? { locationId } : {}),
    rates: { some: {} },
  }
}

export interface PublicOffering {
  id: string
  location: { id: string; name: string; slug: string; kind: 'PHYSICAL' | 'ONLINE'; assessmentFee: number }
  /** The delivery mode's name: On-site, One-on-One, Online, Home Training. */
  format: string
  classesPerWeekOptions: number[]
  rates: Rate[]
}

/** The select that yields everything `toPublicOffering` needs. */
export const publicOfferingSelect = {
  id: true,
  classesPerWeekOptions: true,
  location: { select: { id: true, name: true, slug: true, kind: true, assessmentFee: true } },
  deliveryMode: { select: { name: true } },
  rates: { select: { durationMins: true, pricePerClass: true } },
} satisfies Prisma.CourseOfferingSelect

export type OfferingRow = Prisma.CourseOfferingGetPayload<{ select: typeof publicOfferingSelect }>

export function toPublicOffering(row: OfferingRow): PublicOffering {
  return {
    id: row.id,
    location: row.location,
    format: row.deliveryMode.name,
    classesPerWeekOptions: row.classesPerWeekOptions,
    rates: [...row.rates].sort((a, b) => a.durationMins - b.durationMins),
  }
}

/** Cheapest per-class rate across a course's offerable offerings; null when none is priced. */
export function courseFromRate(offerings: readonly Pick<PublicOffering, 'rates'>[]): number | null {
  return fromRate(offerings.flatMap((offering) => offering.rates))
}

/** A course's offerable offerings, optionally at one location (by slug). Unknown slug => none. */
export async function getPublicOfferings(
  courseId: string,
  locationSlug?: string,
): Promise<PublicOffering[]> {
  let locationId: string | undefined
  if (locationSlug) {
    const location = await prisma.location.findUnique({
      where: { slug: locationSlug },
      select: { id: true },
    })
    if (!location) return []
    locationId = location.id
  }

  const rows = await prisma.courseOffering.findMany({
    where: { courseId, ...offerableOfferingWhere(locationId) },
    select: publicOfferingSelect,
    orderBy: [{ location: { order: 'asc' } }, { deliveryMode: { order: 'asc' } }],
  })
  return rows.map(toPublicOffering)
}

/** Active locations in display order, for the chooser and `/api/locations`. */
export async function getActiveLocations() {
  return prisma.location.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, slug: true, kind: true, assessmentFee: true },
  })
}

/**
 * For each of `courseIds`, the offerable offerings (optionally at one location). Used by the
 * listing page/API so the card caption and the location filter share one predicate.
 */
export async function getOfferingsByCourse(
  courseIds: string[],
  locationId?: string,
): Promise<Map<string, PublicOffering[]>> {
  const map = new Map<string, PublicOffering[]>()
  if (courseIds.length === 0) return map
  const rows = await prisma.courseOffering.findMany({
    where: { courseId: { in: courseIds }, ...offerableOfferingWhere(locationId) },
    select: { courseId: true, ...publicOfferingSelect },
  })
  for (const { courseId, ...rest } of rows) {
    const list = map.get(courseId) ?? []
    list.push(toPublicOffering(rest))
    map.set(courseId, list)
  }
  return map
}
