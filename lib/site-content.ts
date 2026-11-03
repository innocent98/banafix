/**
 * Pure rules for admin-managed public-site content (testimonials, partners,
 * events, stats). No I/O here so every rule is unit-testable.
 */

export const TESTIMONIAL_PERMISSION_ERROR =
  "Permission to publish is required before a testimonial can go live"

/**
 * A testimonial may only be live if the person has given permission. Enforced
 * server-side on every create and update; the admin UI mirrors it but is not
 * trusted.
 */
export function testimonialPublishError(t: {
  permissionToPublish: boolean
  isPublished: boolean
}): string | null {
  return t.isPublished && !t.permissionToPublish ? TESTIMONIAL_PERMISSION_ERROR : null
}

/**
 * Validates an optional link field. Empty or missing becomes null; anything
 * other than an http(s) URL is "invalid" so `javascript:` and similar can
 * never reach an `href` on the public site.
 */
export function normalizeHttpUrl(value: unknown): string | null | "invalid" {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return "invalid"
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : "invalid"
  } catch {
    return "invalid"
  }
}

/** Lagos is UTC+1 all year (no DST). */
const LAGOS_OFFSET_MINUTES = 60

/**
 * Parses an admin `datetime-local` value ("2026-12-05T14:00") as Lagos wall
 * time and returns the UTC instant. The server's own timezone is irrelevant.
 */
export function parseLagosLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const [, y, mo, d, h, mi] = match.map(Number)
  const utc = Date.UTC(y, mo - 1, d, h, mi) - LAGOS_OFFSET_MINUTES * 60_000
  const date = new Date(utc)
  // Reject rollovers such as 2026-02-31.
  const roundTrip = new Date(utc + LAGOS_OFFSET_MINUTES * 60_000)
  if (
    Number.isNaN(date.getTime()) ||
    roundTrip.getUTCFullYear() !== y ||
    roundTrip.getUTCMonth() !== mo - 1 ||
    roundTrip.getUTCDate() !== d
  ) {
    return null
  }
  return date
}

/** Inverse of `parseLagosLocal`: a UTC instant as a Lagos `datetime-local` value. */
export function toLagosLocalInput(date: Date): string {
  const shifted = new Date(date.getTime() + LAGOS_OFFSET_MINUTES * 60_000)
  return shifted.toISOString().slice(0, 16)
}

/** Events that have not started yet, soonest first. An event starting exactly now still counts. */
export function upcomingEvents<T extends { startsAt: Date }>(
  events: readonly T[],
  now: Date = new Date(),
): T[] {
  return events
    .filter((event) => event.startsAt.getTime() >= now.getTime())
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}

// ---------------------------------------------------------------------------
// Input parsing for the admin API. `create` enforces required fields; `update`
// validates only the fields that were sent, so PATCH can toggle one flag.
// ---------------------------------------------------------------------------

export type ParseMode = "create" | "update"
export type ParseResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string }

type Body = Record<string, unknown>

class FieldError extends Error {}

function has(body: Body, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key)
}

/** Required text: must be a non-empty string when creating or when sent. */
function readRequired(body: Body, key: string, label: string, mode: ParseMode, out: Body) {
  if (!has(body, key)) {
    if (mode === "create") throw new FieldError(`${label} is required`)
    return
  }
  const value = body[key]
  if (typeof value !== "string" || !value.trim()) throw new FieldError(`${label} is required`)
  out[key] = value.trim()
}

/** Optional text: empty string clears to null. */
function readOptional(body: Body, key: string, out: Body) {
  if (!has(body, key)) return
  const value = body[key]
  out[key] = typeof value === "string" && value.trim() ? value.trim() : null
}

function readUrl(body: Body, key: string, label: string, out: Body) {
  if (!has(body, key)) return
  const url = normalizeHttpUrl(body[key])
  if (url === "invalid") throw new FieldError(`${label} must be an http(s) link`)
  out[key] = url
}

function readBool(body: Body, key: string, out: Body) {
  if (has(body, key)) out[key] = body[key] === true
}

function readOrder(body: Body, out: Body) {
  if (!has(body, "order")) return
  const n = Number(body.order)
  if (!Number.isInteger(n)) throw new FieldError("Order must be a whole number")
  out.order = n
}

function run(fn: (out: Body) => void): ParseResult {
  const out: Body = {}
  try {
    fn(out)
    return { ok: true, data: out }
  } catch (error) {
    if (error instanceof FieldError) return { ok: false, error: error.message }
    throw error
  }
}

export function parseTestimonialInput(body: Body, mode: ParseMode): ParseResult {
  return run((out) => {
    readRequired(body, "name", "Name", mode, out)
    readRequired(body, "quote", "Quote", mode, out)
    readOptional(body, "role", out)
    readUrl(body, "videoUrl", "Video link", out)
    readBool(body, "permissionToPublish", out)
    readBool(body, "isPublished", out)
    readOrder(body, out)
  })
}

export function parsePartnerInput(body: Body, mode: ParseMode): ParseResult {
  return run((out) => {
    readRequired(body, "name", "Name", mode, out)
    readUrl(body, "logoUrl", "Logo", out)
    readUrl(body, "linkUrl", "Website link", out)
    readBool(body, "isPublished", out)
    readOrder(body, out)
  })
}

export function parseEventInput(body: Body, mode: ParseMode): ParseResult {
  return run((out) => {
    readRequired(body, "title", "Title", mode, out)
    readRequired(body, "description", "Description", mode, out)
    readRequired(body, "location", "Location", mode, out)
    readUrl(body, "registrationUrl", "Registration link", out)
    readBool(body, "isPublished", out)
    if (has(body, "startsAt") || mode === "create") {
      const raw = body.startsAt
      const parsed = typeof raw === "string" ? parseLagosLocal(raw) : null
      if (!parsed) throw new FieldError("Start date and time must look like 2026-12-05T14:00 (Lagos time)")
      out.startsAt = parsed
    }
  })
}

export function parseStatInput(body: Body, mode: ParseMode): ParseResult {
  return run((out) => {
    readRequired(body, "label", "Label", mode, out)
    readRequired(body, "value", "Value", mode, out)
    readOptional(body, "note", out)
    readBool(body, "isPublished", out)
    readOrder(body, out)
  })
}

/**
 * Applies the testimonial consent rules to a parsed write.
 *  - Publishing without permission is an error.
 *  - Withdrawing permission from a live testimonial takes it down in the same
 *    write (consent withdrawn means it must not stay public).
 * `existing` is null on create.
 */
export function applyTestimonialRules(
  existing: { permissionToPublish: boolean; isPublished: boolean } | null,
  data: Record<string, unknown>,
): { ok: true; data: Record<string, unknown>; unpublishedForConsent: boolean } | { ok: false; error: string } {
  const next = { ...data }
  let unpublishedForConsent = false

  if (existing && next.permissionToPublish === false && !has(next, "isPublished") && existing.isPublished) {
    next.isPublished = false
    unpublishedForConsent = true
  }

  const merged = {
    permissionToPublish: (next.permissionToPublish ?? existing?.permissionToPublish ?? false) as boolean,
    isPublished: (next.isPublished ?? existing?.isPublished ?? false) as boolean,
  }
  const error = testimonialPublishError(merged)
  return error ? { ok: false, error } : { ok: true, data: next, unpublishedForConsent }
}
