// Every scheduling mutation lives here: validation, the transaction, the audit row (inside it) and the
// mapping of database conflicts to friendly errors. Routes are thin wrappers.
//
// The exclusion constraints in the 20261103170000_scheduling migration are the arbiter of double-booking.
// The pre-checks below only exist to give readable previews; they are never relied on for safety.

import { Prisma, type ClassSession } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { instructorTeaches } from '@/lib/instructor-courses'
import { isWithinAvailability, type AvailabilityWindow } from './availability'
import { preferredWindows } from './bands'
import { SchedulingConflictError, mapDbConflict } from './conflict-error'
import { generateSessions, type GeneratedSlot, type Unplaced } from './generator'
import { onSessionRescheduled, onSessionsScheduled, onSessionStatusChanged } from './hooks'
import { defaultSessionMode, isSessionMode, modeFitsLocation, type SessionMode } from './mode'
import type { Interval } from './overlap'
import { normaliseDay } from './preferences'
import { ACTIVE_STATUSES, SLOT_STATUSES, canMoveSession, isSessionStatus, type SessionStatus } from './session-status'
import { addDays, fromLagos, isDateKey, lagosParts, type DateKey } from './time'

export class SchedulingError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'SchedulingError'
  }
}

type Admin = { id: string }
type Tx = Prisma.TransactionClient
const SUPPORTED_DURATIONS = [45, 60]
const SCHEDULABLE_STATUSES = ['plan_agreed', 'enrolled']

function audit(tx: Tx, admin: Admin, action: string, entityType: string, entityId: string, metadata: unknown) {
  return tx.auditLog.create({ data: { adminId: admin.id, action, entityType, entityId, metadata: metadata as Prisma.InputJsonValue } })
}

/** Map a DB conflict to a SchedulingError (409), pass other errors through untouched. */
function toSchedulingError(err: unknown, names: { instructor?: string; student?: string }, slot?: unknown): unknown {
  if (err instanceof SchedulingError) return err
  const c = mapDbConflict(err, names)
  if (!c) return err
  const code = { instructor: 'INSTRUCTOR_BUSY', student: 'STUDENT_BUSY', sequence: 'SLOT_TAKEN', availability_overlap: 'AVAILABILITY_OVERLAP' }[c.kind]
  return new SchedulingError(409, code, c.message, slot)
}

const toInterval = (s: { startsAt: Date; endsAt: Date }): Interval => ({ start: s.startsAt, end: s.endsAt })
const windowRow = (w: { weekday: number; startMinute: number; endMinute: number; locationId: string; mode: string }): AvailabilityWindow => ({
  weekday: w.weekday, startMinute: w.startMinute, endMinute: w.endMinute, locationId: w.locationId, mode: w.mode,
})

/* ------------------------------------------------------------------ availability */

export async function getAvailability(instructorId: string) {
  return prisma.instructorAvailability.findMany({
    where: { instructorId },
    orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
    select: { id: true, weekday: true, startMinute: true, endMinute: true, locationId: true, mode: true, location: { select: { name: true, kind: true } } },
  })
}

/** Replace an instructor's whole weekly availability. Existing classes are not re-validated (they were valid when booked). */
export async function setAvailability(instructorId: string, slots: AvailabilityWindow[], admin: Admin) {
  const instructor = await prisma.instructor.findUnique({ where: { id: instructorId }, select: { id: true, name: true } })
  if (!instructor) throw new SchedulingError(404, 'INSTRUCTOR_NOT_FOUND', 'Instructor not found')

  const locations = await prisma.location.findMany({ where: { id: { in: [...new Set(slots.map((s) => s.locationId))] } }, select: { id: true, name: true, kind: true } })
  for (const s of slots) {
    const loc = locations.find((l) => l.id === s.locationId)
    if (!loc) throw new SchedulingError(400, 'LOCATION_NOT_FOUND', 'One of the locations no longer exists')
    if (!modeFitsLocation(s.mode as SessionMode, loc.kind)) {
      throw new SchedulingError(400, 'MODE_LOCATION_MISMATCH', loc.kind === 'ONLINE' ? `${loc.name} is an online location: use mode Online` : `${loc.name} is a physical location: use At the centre or At home`)
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const before = await tx.instructorAvailability.count({ where: { instructorId } })
      await tx.instructorAvailability.deleteMany({ where: { instructorId } })
      if (slots.length) await tx.instructorAvailability.createMany({ data: slots.map((s) => ({ ...s, instructorId })) })
      await audit(tx, admin, 'availability.update', 'instructor', instructorId, { before, after: slots.length, slots })
      return tx.instructorAvailability.findMany({ where: { instructorId }, orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] })
    })
  } catch (e) {
    throw toSchedulingError(e, { instructor: instructor.name })
  }
}

/* ------------------------------------------------------------------ assign + generate */

export interface ScheduleInput {
  instructorId: string
  startDate: string
  /** Max classes to place (default: every free class number up to the plan). */
  count?: number
  mode?: string
  dryRun?: boolean
  /** Accept a plan that places only some of the classes (otherwise the whole request fails, nothing written). */
  allowPartial?: boolean
  overrideAvailability?: boolean
  overrideReason?: string
}

export interface SchedulePlan {
  enrollmentId: string
  instructor: { id: string; name: string }
  student: { id: string; name: string }
  mode: SessionMode
  locationId: string
  durationMins: number
  classesPerWeek: number
  plannedClasses: number
  alreadyScheduled: number
  placed: GeneratedSlot[]
  unplaced: Unplaced[]
  /** Placed slots that fall outside the instructor's availability (only possible with an override). */
  outsideAvailability: GeneratedSlot[]
  overrideAvailability: boolean
}

async function buildPlan(enrollmentId: string, input: ScheduleInput): Promise<SchedulePlan & { courseId: string }> {
  if (!isDateKey(input.startDate)) throw new SchedulingError(400, 'BAD_START_DATE', 'startDate must be a date like 2026-11-09')
  const override = input.overrideAvailability === true
  if (override && !(typeof input.overrideReason === 'string' && input.overrideReason.trim())) {
    throw new SchedulingError(400, 'OVERRIDE_REASON_REQUIRED', 'Say why the instructor is being booked outside their availability')
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      location: { select: { id: true, kind: true } },
      offering: { select: { deliveryMode: { select: { name: true } } } },
    },
  })
  if (!enrollment) throw new SchedulingError(404, 'ENROLLMENT_NOT_FOUND', 'Enrollment not found')
  if (!SCHEDULABLE_STATUSES.includes(enrollment.status)) {
    throw new SchedulingError(400, 'NOT_PLANNED', 'Classes can only be scheduled once the plan is agreed')
  }
  const { durationMins, classesPerWeek, plannedClasses } = enrollment
  if (durationMins == null || classesPerWeek == null || plannedClasses == null) {
    throw new SchedulingError(400, 'PLAN_MISSING', 'This enrollment has no plan (duration, classes per week, planned classes). Agree the plan first')
  }
  if (!SUPPORTED_DURATIONS.includes(durationMins)) {
    throw new SchedulingError(400, 'DURATION_UNSUPPORTED', 'Classes can be 45 minutes or 1 hour. Change the plan duration first')
  }
  if (!enrollment.location) throw new SchedulingError(400, 'LOCATION_MISSING', 'This enrollment has no location. Set one before scheduling')

  const instructor = await prisma.instructor.findUnique({ where: { id: input.instructorId }, select: { id: true, name: true } })
  if (!instructor) throw new SchedulingError(404, 'INSTRUCTOR_NOT_FOUND', 'Instructor not found')
  if (!(await instructorTeaches(prisma, instructor.id, enrollment.courseId))) {
    throw new SchedulingError(400, 'INSTRUCTOR_NOT_ASSIGNED_TO_COURSE', `${instructor.name} is not assigned to this course. Add the course to their profile first`)
  }

  let mode: SessionMode
  if (input.mode === undefined) mode = defaultSessionMode(enrollment.location.kind, enrollment.offering?.deliveryMode.name)
  else if (isSessionMode(input.mode)) mode = input.mode
  else throw new SchedulingError(400, 'BAD_MODE', 'mode must be CENTRE, HOME or ONLINE')
  if (!modeFitsLocation(mode, enrollment.location.kind)) {
    throw new SchedulingError(400, 'MODE_LOCATION_MISMATCH', enrollment.location.kind === 'ONLINE' ? 'Online students are taught online' : 'A student at a physical location cannot be taught online')
  }

  const existing = await prisma.classSession.findMany({
    where: { enrollmentId, status: { in: [...SLOT_STATUSES] } },
    select: { sequence: true },
  })
  const taken = new Set(existing.map((s) => s.sequence))
  const free = Array.from({ length: plannedClasses }, (_, k) => k + 1).filter((n) => !taken.has(n))
  if (free.length === 0) throw new SchedulingError(400, 'NOTHING_TO_SCHEDULE', `All ${plannedClasses} planned classes are already scheduled`)
  const wanted = input.count === undefined ? free.length : Math.floor(Number(input.count))
  if (!Number.isFinite(wanted) || wanted < 1) throw new SchedulingError(400, 'BAD_COUNT', 'count must be a positive whole number')

  const horizon = fromLagos(input.startDate as DateKey, 0)
  const [windows, instructorBusy, studentBusy] = await Promise.all([
    prisma.instructorAvailability.findMany({ where: { instructorId: instructor.id } }),
    prisma.classSession.findMany({ where: { instructorId: instructor.id, status: { in: [...ACTIVE_STATUSES] }, endsAt: { gt: horizon } }, select: { startsAt: true, endsAt: true } }),
    prisma.classSession.findMany({ where: { studentId: enrollment.studentId, status: { in: [...ACTIVE_STATUSES] }, endsAt: { gt: horizon } }, select: { startsAt: true, endsAt: true } }),
  ])
  const availability = windows.map(windowRow)

  const result = generateSessions({
    startDate: input.startDate as DateKey,
    count: Math.min(wanted, free.length),
    freeSequences: free,
    classesPerWeek,
    durationMins,
    preferredDays: (enrollment.preferredDays ?? []).map(normaliseDay).filter((n): n is number => n !== null),
    windows: preferredWindows({ bands: enrollment.preferredTimeBands, from: enrollment.preferredFromTime, to: enrollment.preferredToTime }),
    availability: override ? null : availability,
    where: { locationId: enrollment.location.id, mode },
    busy: [...instructorBusy, ...studentBusy].map(toInterval),
  })
  const outsideAvailability = result.placed.filter((s) => !isWithinAvailability(toInterval(s), availability, { locationId: enrollment.location!.id, mode }))

  return {
    enrollmentId,
    courseId: enrollment.courseId,
    instructor,
    student: { id: enrollment.student.id, name: `${enrollment.student.firstName} ${enrollment.student.lastName}`.trim() },
    mode,
    locationId: enrollment.location.id,
    durationMins,
    classesPerWeek,
    plannedClasses,
    alreadyScheduled: taken.size,
    placed: result.placed,
    unplaced: result.unplaced,
    outsideAvailability,
    overrideAvailability: override,
  }
}

/** Dry run: what would be booked, nothing written. */
export async function planSchedule(enrollmentId: string, input: ScheduleInput): Promise<SchedulePlan> {
  const { courseId: _c, ...plan } = await buildPlan(enrollmentId, input)
  return plan
}

export async function createSchedule(enrollmentId: string, input: ScheduleInput, admin: Admin): Promise<{ sessions: ClassSession[]; plan: SchedulePlan }> {
  return commitSchedule(await planSchedule(enrollmentId, input), input, admin)
}

/**
 * Write a previously computed plan. Split from planning so a race is testable: two admins who each planned
 * against the same empty calendar both commit, and the database lets exactly one through.
 */
export async function commitSchedule(plan: SchedulePlan, input: ScheduleInput, admin: Admin): Promise<{ sessions: ClassSession[]; plan: SchedulePlan }> {
  const enrollmentId = plan.enrollmentId
  if (plan.placed.length === 0 || (plan.unplaced.length > 0 && !input.allowPartial)) {
    throw new SchedulingError(422, 'UNPLACEABLE', plan.placed.length === 0 ? 'No classes could be placed with these preferences and this instructor' : `Only ${plan.placed.length} of ${plan.placed.length + plan.unplaced.length} classes fit. Adjust the start date or instructor, or accept a partial schedule`, { unplaced: plan.unplaced })
  }

  let current: GeneratedSlot | undefined
  try {
    const sessions = await prisma.$transaction(async (tx) => {
      const created: ClassSession[] = []
      // One at a time so a conflict names the slot that failed; the whole transaction rolls back.
      for (const slot of plan.placed) {
        current = slot
        created.push(
          await tx.classSession.create({
            data: {
              enrollmentId, studentId: plan.student.id, instructorId: plan.instructor.id, locationId: plan.locationId, mode: plan.mode,
              startsAt: slot.startsAt, endsAt: slot.endsAt, durationMins: plan.durationMins, status: 'scheduled', sequence: slot.sequence,
            },
          }),
        )
      }
      current = undefined
      await audit(tx, admin, 'schedule.generate', 'enrollment', enrollmentId, {
        instructorId: plan.instructor.id, mode: plan.mode, durationMins: plan.durationMins, classesPerWeek: plan.classesPerWeek,
        sequences: plan.placed.map((s) => s.sequence), firstStartsAt: plan.placed[0].startsAt, unplaced: plan.unplaced.length,
        overrideAvailability: plan.overrideAvailability,
      })
      if (plan.overrideAvailability && plan.outsideAvailability.length > 0) {
        await audit(tx, admin, 'schedule.availability_override', 'enrollment', enrollmentId, {
          reason: input.overrideReason!.trim(), instructorId: plan.instructor.id, sessionIds: created.filter((c) => plan.outsideAvailability.some((o) => o.sequence === c.sequence)).map((c) => c.id),
          slots: plan.outsideAvailability.map((o) => ({ sequence: o.sequence, startsAt: o.startsAt, endsAt: o.endsAt })),
        })
      }
      return created
    })
    // TODO(S7) hook, after commit; never throws into the request.
    await onSessionsScheduled({ enrollmentId, sessionIds: sessions.map((s) => s.id) }).catch((e) => console.error('onSessionsScheduled hook failed', e))
    return { sessions, plan }
  } catch (e) {
    throw toSchedulingError(e, { instructor: plan.instructor.name, student: plan.student.name }, current && { sequence: current.sequence, startsAt: current.startsAt })
  }
}

/* ------------------------------------------------------------------ reschedule + status */

export interface RescheduleInput {
  startsAt: Date
  instructorId?: string
  durationMins?: number
  mode?: string
  overrideAvailability?: boolean
  overrideReason?: string
}

export async function rescheduleSession(sessionId: string, input: RescheduleInput, admin: Admin): Promise<ClassSession> {
  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: { enrollment: { select: { courseId: true, student: { select: { firstName: true, lastName: true } } } }, location: { select: { id: true, kind: true } } },
  })
  if (!session) throw new SchedulingError(404, 'SESSION_NOT_FOUND', 'Class not found')
  if (session.status !== 'scheduled') throw new SchedulingError(400, 'NOT_RESCHEDULABLE', 'Only a scheduled class can be rescheduled')
  if (!(input.startsAt instanceof Date) || Number.isNaN(input.startsAt.getTime())) throw new SchedulingError(400, 'BAD_START', 'startsAt must be a valid date and time')
  if (input.startsAt.getTime() < Date.now()) throw new SchedulingError(400, 'IN_THE_PAST', 'The new time is in the past')

  const override = input.overrideAvailability === true
  if (override && !(typeof input.overrideReason === 'string' && input.overrideReason.trim())) {
    throw new SchedulingError(400, 'OVERRIDE_REASON_REQUIRED', 'Say why the instructor is being booked outside their availability')
  }
  const durationMins = input.durationMins ?? session.durationMins
  if (!SUPPORTED_DURATIONS.includes(durationMins)) throw new SchedulingError(400, 'DURATION_UNSUPPORTED', 'Classes can be 45 minutes or 1 hour')
  const mode = input.mode ?? session.mode
  if (!isSessionMode(mode)) throw new SchedulingError(400, 'BAD_MODE', 'mode must be CENTRE, HOME or ONLINE')
  if (session.location && !modeFitsLocation(mode, session.location.kind)) throw new SchedulingError(400, 'MODE_LOCATION_MISMATCH', 'That mode does not fit this class location')

  const instructorId = input.instructorId ?? session.instructorId
  const instructor = await prisma.instructor.findUnique({ where: { id: instructorId }, select: { id: true, name: true } })
  if (!instructor) throw new SchedulingError(404, 'INSTRUCTOR_NOT_FOUND', 'Instructor not found')
  if (instructorId !== session.instructorId && !(await instructorTeaches(prisma, instructorId, session.enrollment.courseId))) {
    throw new SchedulingError(400, 'INSTRUCTOR_NOT_ASSIGNED_TO_COURSE', `${instructor.name} is not assigned to this course`)
  }

  const startsAt = input.startsAt
  const endsAt = new Date(startsAt.getTime() + durationMins * 60_000)
  const windows = (await prisma.instructorAvailability.findMany({ where: { instructorId } })).map(windowRow)
  const inside = isWithinAvailability({ start: startsAt, end: endsAt }, windows, { locationId: session.locationId, mode })
  if (!inside && !override) {
    const p = lagosParts(startsAt)
    throw new SchedulingError(422, 'OUTSIDE_AVAILABILITY', `${instructor.name} is not available then. Pick a time inside their availability or override with a reason`, { startsAt, weekday: p.isoWeekday, minuteOfDay: p.minuteOfDay })
  }

  const names = { instructor: instructor.name, student: `${session.enrollment.student.firstName} ${session.enrollment.student.lastName}`.trim() }
  try {
    const created = await prisma.$transaction(async (tx) => {
      // Free the old slot first (compare-and-set), then book the new one; any failure rolls both back.
      const freed = await tx.classSession.updateMany({ where: { id: sessionId, status: 'scheduled' }, data: { status: 'rescheduled' } })
      if (freed.count !== 1) throw new SchedulingError(409, 'CHANGED', 'This class changed while you were editing. Refresh and try again')
      const next = await tx.classSession.create({
        data: {
          enrollmentId: session.enrollmentId, studentId: session.studentId, instructorId, locationId: session.locationId, mode,
          startsAt, endsAt, durationMins, status: 'scheduled', sequence: session.sequence, rescheduledFromId: session.id, notes: session.notes,
        },
      })
      await audit(tx, admin, 'session.reschedule', 'class_session', next.id, {
        enrollmentId: session.enrollmentId, sequence: session.sequence, fromSessionId: session.id,
        from: { instructorId: session.instructorId, startsAt: session.startsAt, durationMins: session.durationMins },
        to: { instructorId, startsAt, durationMins }, overrideAvailability: override && !inside,
      })
      if (override && !inside) {
        await audit(tx, admin, 'schedule.availability_override', 'class_session', next.id, { reason: input.overrideReason!.trim(), instructorId, slots: [{ sequence: session.sequence, startsAt, endsAt }] })
      }
      return next
    })
    await onSessionRescheduled({ enrollmentId: session.enrollmentId, fromSessionId: session.id, toSessionId: created.id }).catch((e) => console.error('onSessionRescheduled hook failed', e))
    return created
  } catch (e) {
    throw toSchedulingError(e, names, { sequence: session.sequence, startsAt })
  }
}

export async function setSessionStatus(sessionId: string, to: string, note: string | undefined, admin: Admin): Promise<ClassSession> {
  if (!isSessionStatus(to) || to === 'rescheduled') throw new SchedulingError(400, 'BAD_STATUS', 'status must be scheduled, held, missed or cancelled')
  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: { instructor: { select: { name: true } }, enrollment: { select: { student: { select: { firstName: true, lastName: true } } } } },
  })
  if (!session) throw new SchedulingError(404, 'SESSION_NOT_FOUND', 'Class not found')
  if (!canMoveSession(session.status, to)) throw new SchedulingError(400, 'BAD_TRANSITION', `A ${session.status} class cannot become ${to}`)
  if ((to === 'held' || to === 'missed') && session.startsAt.getTime() > Date.now()) {
    throw new SchedulingError(400, 'NOT_STARTED', 'A class can only be marked held or missed once it has started')
  }
  const from = session.status as SessionStatus
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.classSession.updateMany({ where: { id: sessionId, status: from }, data: { status: to, ...(note !== undefined ? { notes: note.trim() || null } : {}) } })
      if (r.count !== 1) throw new SchedulingError(409, 'CHANGED', 'This class changed while you were editing. Refresh and try again')
      await audit(tx, admin, 'session.status', 'class_session', sessionId, { enrollmentId: session.enrollmentId, sequence: session.sequence, from, to, note: note ?? null })
      return tx.classSession.findUniqueOrThrow({ where: { id: sessionId } })
    })
    await onSessionStatusChanged({ enrollmentId: session.enrollmentId, sessionId, from, to }).catch((e) => console.error('onSessionStatusChanged hook failed', e))
    return updated
  } catch (e) {
    throw toSchedulingError(e, { instructor: session.instructor.name, student: `${session.enrollment.student.firstName} ${session.enrollment.student.lastName}`.trim() })
  }
}

/* ------------------------------------------------------------------ read models for the timetable */

export interface TimetableQuery { from: string; to: string; instructorId?: string }

/** Sessions (all statuses) between two local dates inclusive, with the instructor's availability and who still needs scheduling. */
export async function getTimetable(q: TimetableQuery) {
  if (!isDateKey(q.from) || !isDateKey(q.to) || q.to < q.from) throw new SchedulingError(400, 'BAD_RANGE', 'from and to must be dates (YYYY-MM-DD) with to on or after from')
  const start = fromLagos(q.from as DateKey, 0)
  const end = fromLagos(addDays(q.to as DateKey, 1), 0)
  const [sessions, availability, needs] = await Promise.all([
    prisma.classSession.findMany({
      where: { startsAt: { gte: start, lt: end }, ...(q.instructorId ? { instructorId: q.instructorId } : {}) },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true, enrollmentId: true, sequence: true, startsAt: true, endsAt: true, durationMins: true, status: true, mode: true, notes: true,
        instructorId: true, locationId: true, rescheduledFromId: true,
        instructor: { select: { name: true } },
        location: { select: { name: true } },
        enrollment: { select: { student: { select: { id: true, firstName: true, lastName: true } }, course: { select: { id: true, title: true } } } },
      },
    }),
    q.instructorId ? getAvailability(q.instructorId) : Promise.resolve([]),
    prisma.enrollment.findMany({
      where: { status: { in: SCHEDULABLE_STATUSES }, plannedClasses: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        id: true, plannedClasses: true, durationMins: true, classesPerWeek: true, preferredDays: true, preferredTimeBands: true, preferredFromTime: true, preferredToTime: true, preferredClassesPerWeek: true, schedulePreference: true,
        student: { select: { firstName: true, lastName: true } }, course: { select: { id: true, title: true } }, location: { select: { name: true } },
        classSessions: { where: { status: { in: [...SLOT_STATUSES] } }, select: { id: true } },
      },
    }),
  ])
  const needsScheduling = needs
    .map((e) => ({ ...e, scheduled: e.classSessions.length, classSessions: undefined }))
    .filter((e) => e.scheduled < (e.plannedClasses ?? 0))
  return { sessions, availability, needsScheduling }
}

export async function getEnrollmentSchedule(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, courseId: true, status: true, plannedClasses: true, durationMins: true, classesPerWeek: true, preferredDays: true, preferredTimeBands: true, preferredFromTime: true, preferredToTime: true, preferredClassesPerWeek: true, schedulePreference: true },
  })
  if (!enrollment) throw new SchedulingError(404, 'ENROLLMENT_NOT_FOUND', 'Enrollment not found')
  const [sessions, instructors] = await Promise.all([
    prisma.classSession.findMany({
      where: { enrollmentId },
      orderBy: [{ sequence: 'asc' }, { startsAt: 'asc' }],
      select: { id: true, sequence: true, startsAt: true, endsAt: true, durationMins: true, status: true, mode: true, notes: true, instructorId: true, instructor: { select: { name: true } } },
    }),
    prisma.instructor.findMany({
      where: { OR: [{ teaches: { some: { courseId: enrollment.courseId } } }, { courses: { some: { id: enrollment.courseId } } }] },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return { enrollment, sessions, instructors }
}
