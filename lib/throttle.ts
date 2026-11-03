/**
 * Best-effort in-memory sliding-window throttle (same approach as POST /api/contact). It is per
 * server instance, so it slows casual abuse of an unauthenticated route; it is not a hard limit.
 */
const buckets = new Map<string, number[]>()

/** Records a hit and returns true when `key` has exceeded `max` hits within `windowMs`. */
export function isThrottled(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    buckets.set(key, recent)
    return true
  }
  recent.push(now)
  buckets.set(key, recent)
  if (buckets.size > 5000) {
    for (const [k, stamps] of buckets) {
      if (stamps.every((t) => now - t >= windowMs)) buckets.delete(k)
    }
  }
  return false
}
