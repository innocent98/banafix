// The database is the arbiter of double-booking (exclusion constraints). This maps the raw violation,
// however Prisma wraps it, to an error the UI can show. Never overridable: only availability is.

export type ConflictKind = 'instructor' | 'student' | 'sequence' | 'availability_overlap'

export class SchedulingConflictError extends Error {
  constructor(
    public kind: ConflictKind,
    message: string,
  ) {
    super(message)
    this.name = 'SchedulingConflictError'
  }
}

function text(err: unknown): string {
  if (!err || typeof err !== 'object') return ''
  const e = err as { message?: unknown; meta?: unknown }
  const meta = e.meta && typeof e.meta === 'object' ? JSON.stringify(e.meta) : ''
  return `${typeof e.message === 'string' ? e.message : ''} ${meta}`
}

export function mapDbConflict(err: unknown, names: { instructor?: string; student?: string } = {}): SchedulingConflictError | null {
  if (!err || typeof err !== 'object') return null
  const t = text(err)
  const code = (err as { code?: unknown }).code

  // Prisma reports an exclusion violation on a model write as PrismaClientUnknownRequestError (no code),
  // on a raw statement as P2010 with the SQLSTATE in meta. Match by constraint name, falling back to the key columns.
  if (/class_sessions_instructor_no_overlap/.test(t) || /existing key \(\\?"instructorId\\?", tstzrange/.test(t)) {
    return new SchedulingConflictError('instructor', `${names.instructor ?? 'The instructor'} already has a class at that time`)
  }
  if (/class_sessions_student_no_overlap/.test(t) || /existing key \(\\?"studentId\\?", tstzrange/.test(t)) {
    return new SchedulingConflictError('student', `${names.student ?? 'The student'} already has a class at that time`)
  }
  if (/instructor_availability_no_overlap/.test(t)) {
    return new SchedulingConflictError('availability_overlap', 'That availability window overlaps another one for the same instructor and weekday')
  }
  if (code === 'P2002' || /class_sessions_slot_unique/.test(t)) {
    const target = ((err as { meta?: { target?: unknown } }).meta?.target ?? []) as unknown
    const cols = Array.isArray(target) ? target.join(',') : String(target)
    if (/class_sessions_slot_unique/.test(t) || (cols.includes('enrollmentId') && cols.includes('sequence'))) {
      return new SchedulingConflictError('sequence', 'That class number is already booked for this student. Refresh and try again')
    }
  }
  return null
}
