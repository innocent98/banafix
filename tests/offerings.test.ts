import { describe, expect, it } from "vitest"
import { fromRate } from "@/lib/offering-rates"
import {
  offerableOfferingWhere,
  toPublicOffering,
  courseFromRate,
  type OfferingRow,
} from "@/lib/offerings"

const row = (overrides: Partial<OfferingRow> = {}): OfferingRow => ({
  id: "o1",
  classesPerWeekOptions: [1, 2],
  location: { id: "l1", name: "Lagos", slug: "lagos", kind: "PHYSICAL", assessmentFee: 5000 },
  deliveryMode: { name: "On-site" },
  rates: [
    { durationMins: 60, pricePerClass: 6000 },
    { durationMins: 45, pricePerClass: 4500 },
  ],
  ...overrides,
})

describe("offerableOfferingWhere", () => {
  it("requires an active offering, an active location and at least one rate", () => {
    expect(offerableOfferingWhere()).toEqual({
      isActive: true,
      location: { isActive: true },
      rates: { some: {} },
    })
  })

  it("scopes to one location when given", () => {
    expect(offerableOfferingWhere("loc_1")).toEqual({
      isActive: true,
      location: { isActive: true },
      locationId: "loc_1",
      rates: { some: {} },
    })
  })
})

describe("toPublicOffering", () => {
  it("flattens the format name and sorts rates by duration", () => {
    const offering = toPublicOffering(row())
    expect(offering.format).toBe("On-site")
    expect(offering.rates).toEqual([
      { durationMins: 45, pricePerClass: 4500 },
      { durationMins: 60, pricePerClass: 6000 },
    ])
    expect(offering.location.slug).toBe("lagos")
  })
})

describe("courseFromRate", () => {
  it("is the cheapest per-class rate across offerings", () => {
    const offerings = [
      toPublicOffering(row()),
      toPublicOffering(row({ id: "o2", rates: [{ durationMins: 60, pricePerClass: 3000 }] })),
    ]
    expect(courseFromRate(offerings)).toBe(3000)
  })

  it("is null when nothing is priced, never a legacy number", () => {
    expect(courseFromRate([])).toBeNull()
    expect(courseFromRate([toPublicOffering(row({ rates: [] }))])).toBeNull()
  })

  it("agrees with fromRate for a single offering", () => {
    const offering = toPublicOffering(row())
    expect(courseFromRate([offering])).toBe(fromRate(offering.rates))
  })
})
