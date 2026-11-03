const TZ = 'Africa/Lagos'

export function formatLagosDate(d: Date): string {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).formatToParts(d)
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  return `${g('weekday')} ${g('day')} ${g('month')} ${g('year')}`
}

export function formatLagosTime(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

export function arrangementPhrase(arrangement: string | null | undefined): string {
  if (arrangement === 'HOME') return 'at your home address'
  if (arrangement === 'CENTRE') return 'at our centre'
  if (arrangement === 'ONLINE') return 'online'
  return ''
}

const PER_WEEK: Record<number, string> = { 1: 'once a week', 2: 'twice a week' }

export function planSummary(p: {
  plannedClasses: number | null
  durationMins: number | null
  classesPerWeek: number | null
  ratePerClass: number | null
}): string {
  if (p.plannedClasses === null && p.durationMins === null && p.classesPerWeek === null && p.ratePerClass === null) {
    return 'your agreed plan'
  }
  const noun = p.plannedClasses === 1 ? 'class' : 'classes'
  let s = `${p.plannedClasses !== null ? `${p.plannedClasses} ` : ''}${noun}`
  if (p.durationMins !== null) s += ` of ${p.durationMins} minutes`
  if (p.ratePerClass !== null) s += ` at ${formatNaira(p.ratePerClass)} per class`
  if (p.classesPerWeek !== null) s += `, ${PER_WEEK[p.classesPerWeek] ?? `${p.classesPerWeek} times a week`}`
  return s
}
