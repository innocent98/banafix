export interface Interval {
  start: Date
  end: Date
}

/** Half-open: [start, end). A class ending at 10:00 and one starting at 10:00 do not overlap, matching the DB's '[)' ranges. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()
}

export function findConflicts<T extends Interval>(candidate: Interval, existing: T[]): T[] {
  return existing.filter((e) => overlaps(candidate, e))
}
