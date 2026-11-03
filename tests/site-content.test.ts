import { describe, expect, it } from "vitest"

import {
  TESTIMONIAL_PERMISSION_ERROR,
  applyTestimonialRules,
  normalizeHttpUrl,
  parseEventInput,
  parseLagosLocal,
  parsePartnerInput,
  parseStatInput,
  parseTestimonialInput,
  testimonialPublishError,
  toLagosLocalInput,
  upcomingEvents,
} from "@/lib/site-content"

describe("testimonialPublishError", () => {
  it("blocks publishing without permission", () => {
    expect(testimonialPublishError({ permissionToPublish: false, isPublished: true })).toBe(
      TESTIMONIAL_PERMISSION_ERROR,
    )
  })
  it("allows publishing with permission", () => {
    expect(testimonialPublishError({ permissionToPublish: true, isPublished: true })).toBeNull()
  })
  it("allows an unpublished draft without permission", () => {
    expect(testimonialPublishError({ permissionToPublish: false, isPublished: false })).toBeNull()
  })
})

describe("normalizeHttpUrl", () => {
  it("treats empty and missing as null", () => {
    expect(normalizeHttpUrl(undefined)).toBeNull()
    expect(normalizeHttpUrl(null)).toBeNull()
    expect(normalizeHttpUrl("   ")).toBeNull()
  })
  it("accepts http and https", () => {
    expect(normalizeHttpUrl(" https://example.com/a ")).toBe("https://example.com/a")
    expect(normalizeHttpUrl("http://example.com")).toBe("http://example.com")
  })
  it("rejects other schemes, junk and non-strings", () => {
    expect(normalizeHttpUrl("javascript:alert(1)")).toBe("invalid")
    expect(normalizeHttpUrl("mailto:a@b.com")).toBe("invalid")
    expect(normalizeHttpUrl("not a url")).toBe("invalid")
    expect(normalizeHttpUrl(42)).toBe("invalid")
  })
})

describe("parseLagosLocal", () => {
  it("reads the input as Lagos time (UTC+1)", () => {
    expect(parseLagosLocal("2026-12-05T14:00")?.toISOString()).toBe("2026-12-05T13:00:00.000Z")
  })
  it("rolls across midnight correctly", () => {
    expect(parseLagosLocal("2026-12-05T00:30")?.toISOString()).toBe("2026-12-04T23:30:00.000Z")
  })
  it("rejects garbage and impossible dates", () => {
    expect(parseLagosLocal("tomorrow")).toBeNull()
    expect(parseLagosLocal("2026-02-31T10:00")).toBeNull()
    expect(parseLagosLocal("")).toBeNull()
  })
  it("round-trips through toLagosLocalInput", () => {
    const d = parseLagosLocal("2026-12-05T14:00")!
    expect(toLagosLocalInput(d)).toBe("2026-12-05T14:00")
  })
})

describe("upcomingEvents", () => {
  const now = new Date("2026-11-03T12:00:00Z")
  const ev = (id: string, iso: string) => ({ id, startsAt: new Date(iso) })

  it("drops past events and sorts soonest first", () => {
    const result = upcomingEvents(
      [ev("later", "2026-12-01T10:00:00Z"), ev("past", "2026-11-02T10:00:00Z"), ev("soon", "2026-11-10T10:00:00Z")],
      now,
    )
    expect(result.map((e) => e.id)).toEqual(["soon", "later"])
  })
  it("keeps an event starting exactly now", () => {
    expect(upcomingEvents([ev("now", "2026-11-03T12:00:00Z")], now)).toHaveLength(1)
  })
  it("returns empty for no events", () => {
    expect(upcomingEvents([], now)).toEqual([])
  })
})

describe("parsers", () => {
  it("testimonial create needs name and quote", () => {
    expect(parseTestimonialInput({ name: "A" }, "create")).toEqual({ ok: false, error: "Quote is required" })
    expect(parseTestimonialInput({ name: "A", quote: "Q" }, "create")).toEqual({
      ok: true,
      data: { name: "A", quote: "Q" },
    })
  })
  it("update validates only what was sent", () => {
    expect(parseTestimonialInput({ isPublished: true }, "update")).toEqual({
      ok: true,
      data: { isPublished: true },
    })
    expect(parseTestimonialInput({ name: "  " }, "update").ok).toBe(false)
  })
  it("rejects a non-http video link and a fractional order", () => {
    expect(parseTestimonialInput({ name: "A", quote: "Q", videoUrl: "javascript:x" }, "create")).toEqual({
      ok: false,
      error: "Video link must be an http(s) link",
    })
    expect(parseStatInput({ label: "L", value: "V", order: 1.5 }, "create").ok).toBe(false)
  })
  it("event start is parsed as Lagos time", () => {
    const r = parseEventInput(
      { title: "T", description: "D", location: "L", startsAt: "2026-12-05T14:00" },
      "create",
    )
    expect(r.ok && (r.data.startsAt as Date).toISOString()).toBe("2026-12-05T13:00:00.000Z")
    expect(parseEventInput({ title: "T", description: "D", location: "L" }, "create").ok).toBe(false)
  })
  it("partner and stat parse", () => {
    expect(parsePartnerInput({ name: "P", linkUrl: "" }, "create")).toEqual({
      ok: true,
      data: { name: "P", linkUrl: null },
    })
    expect(parseStatInput({ label: "L", value: "3,200+", note: "" }, "create")).toEqual({
      ok: true,
      data: { label: "L", value: "3,200+", note: null },
    })
  })
})

describe("applyTestimonialRules", () => {
  it("rejects publishing a draft that has no permission", () => {
    const r = applyTestimonialRules(null, { isPublished: true })
    expect(r).toEqual({ ok: false, error: TESTIMONIAL_PERMISSION_ERROR })
  })
  it("rejects publishing an existing row without permission", () => {
    const r = applyTestimonialRules({ permissionToPublish: false, isPublished: false }, { isPublished: true })
    expect(r.ok).toBe(false)
  })
  it("allows grant + publish in one write", () => {
    const r = applyTestimonialRules(null, { permissionToPublish: true, isPublished: true })
    expect(r.ok).toBe(true)
  })
  it("unpublishes a live testimonial when permission is withdrawn", () => {
    const r = applyTestimonialRules({ permissionToPublish: true, isPublished: true }, { permissionToPublish: false })
    expect(r).toEqual({ ok: true, data: { permissionToPublish: false, isPublished: false }, unpublishedForConsent: true })
  })
  it("rejects withdrawing permission while explicitly keeping it published", () => {
    const r = applyTestimonialRules(
      { permissionToPublish: true, isPublished: true },
      { permissionToPublish: false, isPublished: true },
    )
    expect(r.ok).toBe(false)
  })
})
