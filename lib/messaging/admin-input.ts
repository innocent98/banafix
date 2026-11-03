import { CHANNELS, type Channel } from './types'
import type { AudienceFilter, AudienceScope } from './audience'


/** Parses a user-supplied channel list: only known channels, de-duplicated; null if invalid or empty. */
export function parseChannels(v: unknown, opts: { allowEmpty?: boolean } = {}): Channel[] | null {
  if (!Array.isArray(v)) return null
  const out = [...new Set(v)]
  if (!out.every((c): c is Channel => typeof c === 'string' && (CHANNELS as readonly string[]).includes(c))) return null
  return out.length === 0 && !opts.allowEmpty ? null : out
}

export function parseAudienceFilter(v: unknown): AudienceFilter | null {
  if (!v || typeof v !== 'object') return null
  const b = v as Record<string, unknown>
  if (b.scope !== 'students' && b.scope !== 'parents' && b.scope !== 'both') return null
  const id = (x: unknown) => (typeof x === 'string' && x.trim() ? x.trim() : undefined)
  return {
    scope: b.scope as AudienceScope,
    locationId: id(b.locationId),
    courseId: id(b.courseId),
    includeApplicants: b.includeApplicants === true,
  }
}
