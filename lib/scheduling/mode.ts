export const SESSION_MODES = ['CENTRE', 'HOME', 'ONLINE'] as const
export type SessionMode = (typeof SESSION_MODES)[number]
export const MODE_LABELS: Record<SessionMode, string> = { CENTRE: 'At the centre', HOME: 'At home', ONLINE: 'Online' }

export const isSessionMode = (v: unknown): v is SessionMode =>
  typeof v === 'string' && (SESSION_MODES as readonly string[]).includes(v)

type LocationKind = 'PHYSICAL' | 'ONLINE'

/** Where a class happens, from the enrollment's location kind and its offering's delivery-mode name (admin can override). */
export function defaultSessionMode(kind: LocationKind, deliveryModeName: string | null | undefined): SessionMode {
  if (kind === 'ONLINE') return 'ONLINE'
  if (deliveryModeName && /home/i.test(deliveryModeName)) return 'HOME'
  return 'CENTRE'
}

export const modeFitsLocation = (mode: SessionMode, kind: LocationKind): boolean => (mode === 'ONLINE') === (kind === 'ONLINE')
