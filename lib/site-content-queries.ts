import { prisma } from "@/lib/prisma"
import { upcomingEvents } from "@/lib/site-content"

/**
 * Public reads for admin-managed site content. Published rows only; an empty
 * result is a valid answer and callers render an empty state or omit the
 * section. Nothing here ever supplies placeholder content.
 */

const ORDERED = [{ order: "asc" as const }, { createdAt: "asc" as const }]

export function getPublishedStats() {
  return prisma.siteStat.findMany({
    where: { isPublished: true },
    orderBy: ORDERED,
    select: { id: true, label: true, value: true },
  })
}

export function getPublishedPartners() {
  return prisma.trustedPartner.findMany({
    where: { isPublished: true },
    orderBy: ORDERED,
    select: { id: true, name: true, logoUrl: true, linkUrl: true },
  })
}

export function getPublishedTestimonials() {
  // permissionToPublish is re-checked here as defence in depth: the admin API
  // already refuses to publish without it, but a row edited by hand must still
  // never reach the public site without consent.
  return prisma.testimonial.findMany({
    where: { isPublished: true, permissionToPublish: true },
    orderBy: ORDERED,
    select: { id: true, name: true, role: true, quote: true, videoUrl: true },
  })
}

export async function getUpcomingEvents() {
  const published = await prisma.siteEvent.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      location: true,
      registrationUrl: true,
    },
  })
  return upcomingEvents(published)
}

export type PublicStat = Awaited<ReturnType<typeof getPublishedStats>>[number]
export type PublicPartner = Awaited<ReturnType<typeof getPublishedPartners>>[number]
export type PublicTestimonial = Awaited<ReturnType<typeof getPublishedTestimonials>>[number]
export type PublicEvent = Awaited<ReturnType<typeof getUpcomingEvents>>[number]
