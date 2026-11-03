/** Shared vocabularies for Assessment records (client + server safe). */
export const ARRANGEMENTS = ['HOME', 'CENTRE', 'ONLINE'] as const
export type Arrangement = (typeof ARRANGEMENTS)[number]
export const ARRANGEMENT_LABELS: Record<Arrangement, string> = {
  HOME: 'At home',
  CENTRE: 'At the centre',
  ONLINE: 'Online',
}

export const TIME_BANDS = ['morning', 'afternoon', 'evening', 'flexible'] as const
export type TimeBand = (typeof TIME_BANDS)[number]
export const TIME_BAND_LABELS: Record<TimeBand, string> = {
  morning: 'Morning (9am to 12pm)',
  afternoon: 'Afternoon (1pm to 5pm)',
  evening: 'Evening (6pm to 9pm)',
  flexible: 'Flexible',
}

export const isArrangement = (v: unknown): v is Arrangement =>
  typeof v === 'string' && (ARRANGEMENTS as readonly string[]).includes(v)
export const isTimeBand = (v: unknown): v is TimeBand =>
  typeof v === 'string' && (TIME_BANDS as readonly string[]).includes(v)
