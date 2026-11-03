// Time-band vocabulary -> minute windows (Lagos local). Labels live in lib/assessment-vocab.ts
// (morning 9am-12pm, afternoon 1pm-5pm, evening 6pm-9pm); these windows must stay in step with them.

export type Band = 'morning' | 'afternoon' | 'evening'
export interface MinuteWindow {
  start: number
  end: number
}

export const BANDS: readonly Band[] = ['morning', 'afternoon', 'evening']
export const BAND_WINDOWS: Record<Band, MinuteWindow> = {
  morning: { start: 540, end: 720 },
  afternoon: { start: 780, end: 1020 },
  evening: { start: 1080, end: 1260 },
}
/** Used when a student gave no preference at all ("flexible"): builder call S9. */
export const DEFAULT_WINDOW: MinuteWindow = { start: 540, end: 1260 }

export const isBand = (v: unknown): v is Band => typeof v === 'string' && (BANDS as readonly string[]).includes(v)

/** 'HH:MM' (or 'H:MM') to minutes after midnight; null when not a valid time of day. */
export function parseHHMM(s: unknown): number | null {
  if (typeof s !== 'string') return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

function merge(ws: MinuteWindow[]): MinuteWindow[] {
  const sorted = ws.filter((w) => w.start < w.end).sort((a, b) => a.start - b.start)
  const out: MinuteWindow[] = []
  for (const w of sorted) {
    const last = out[out.length - 1]
    if (last && w.start <= last.end) last.end = Math.max(last.end, w.end)
    else out.push({ ...w })
  }
  return out
}

/**
 * The windows a student would accept: their bands (or the default window when none, or only
 * the from/to range when only that was given), clipped to the optional from/to. Invalid from/to are ignored.
 */
export function preferredWindows(p: { bands?: string[]; from?: string | null; to?: string | null }): MinuteWindow[] {
  const bands = (p.bands ?? []).filter(isBand)
  const from = parseHHMM(p.from)
  const to = parseHHMM(p.to)
  const hasRange = from !== null || to !== null
  const lo = from ?? 0
  const hi = to ?? 1440

  const base: MinuteWindow[] = bands.length
    ? bands.map((b) => BAND_WINDOWS[b])
    : hasRange
      ? [{ start: 0, end: 1440 }]
      : [DEFAULT_WINDOW]

  if (!hasRange) return merge(base)
  if (lo >= hi) return []
  return merge(base.map((w) => ({ start: Math.max(w.start, lo), end: Math.min(w.end, hi) })))
}
