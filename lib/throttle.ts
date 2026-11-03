import type { NextRequest } from 'next/server'

/**
 * Per-IP in-memory throttle (per lambda instance: slows a naive flood, no global cap, no Redis).
 * Same trade-off as /api/contact; if abuse becomes real, move it to the edge.
 */
export function createThrottle(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>()
  return function isThrottled(key: string): boolean {
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((t) => now - t < opts.windowMs)
    if (recent.length >= opts.max) {
      hits.set(key, recent)
      return true
    }
    recent.push(now)
    hits.set(key, recent)
    if (hits.size > 500) {
      for (const [k, stamps] of hits) if (stamps.every((t) => now - t >= opts.windowMs)) hits.delete(k)
    }
    return false
  }
}

export function clientIp(req: NextRequest): string {
  const first = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return first || req.headers.get('x-real-ip') || 'unknown'
}
