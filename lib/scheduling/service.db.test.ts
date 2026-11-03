// REAL-DATABASE tests (no mocks): they prove the exclusion constraints and the service's conflict handling
// under concurrency. Skipped unless SCHEDULING_DB_URL is set; run with `scripts/test-scheduling-db.sh`,
// which migrates a throwaway Postgres on 127.0.0.1 first. Refuses to run against anything non-local.

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { mapDbConflict } from './conflict-error'

const URL_ = process.env.SCHEDULING_DB_URL
const run = describe.skipIf(!URL_)

// 2030-01-07 is a Monday, safely in the future for reschedule's "not in the past" rule.
const MON = '2030-01-07'
const ADMIN = { id: 'admin_test' }

run('scheduling service against a real Postgres', () => {
  let prisma: PrismaClient
  let svc: typeof import('./service')
  let n = 0
  const uid = (p: string) => `${p}_${++n}`

  beforeAll(async () => {
    const host = new globalThis.URL(URL_!).hostname
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) throw new Error(`refusing to run DB tests against ${host}`)
    process.env.DATABASE_URL = URL_
    prisma = (await import('@/lib/prisma')).prisma
    svc = await import('./service')
  })
  afterAll(async () => { await prisma?.$disconnect() })
  beforeEach(async () => {
    n = 0
    await prisma.$executeRawUnsafe('TRUNCATE class_sessions, instructor_availability, instructor_courses, enrollments, students, courses, instructors, locations, audit_logs CASCADE')
  })

  // ---- fixtures
  async function world() {
    const loc = await prisma.location.create({ data: { name: 'Lagos', slug: 'lagos', assessmentFee: 1000 } })
    const online = await prisma.location.create({ data: { name: 'Online', slug: 'online', kind: 'ONLINE', assessmentFee: 1000 } })
    const course = await prisma.course.create({ data: { title: 'Guitar', instrument: 'g', level: 'b', outcomes: [], equipment: [] } })
    const course2 = await prisma.course.create({ data: { title: 'Piano', instrument: 'p', level: 'b', outcomes: [], equipment: [] } })
    const ada = await prisma.instructor.create({ data: { name: 'Ada Teacher', credentials: [] } })
    const bob = await prisma.instructor.create({ data: { name: 'Bob Teacher', credentials: [] } })
    for (const i of [ada, bob]) for (const c of [course, course2]) await prisma.instructorCourse.create({ data: { instructorId: i.id, courseId: c.id } })
    for (const i of [ada, bob]) await prisma.instructorAvailability.create({ data: { instructorId: i.id, weekday: 1, startMinute: 540, endMinute: 720, locationId: loc.id, mode: 'CENTRE' } })
    return { loc, online, course, course2, ada, bob }
  }
  async function student(email = `s${++n}@x.com`) {
    return prisma.student.create({ data: { email, firstName: 'Stu', lastName: `Dent${n}` } })
  }
  async function enrol(w: Awaited<ReturnType<typeof world>>, o: { studentId?: string; courseId?: string; planned?: number | null; days?: string[]; bands?: string[]; status?: string; duration?: number | null; location?: string } = {}) {
    const studentId = o.studentId ?? (await student()).id
    return prisma.enrollment.create({
      data: {
        courseId: o.courseId ?? w.course.id, studentId, selectedMode: 'On-site', status: o.status ?? 'plan_agreed', locationId: o.location ?? w.loc.id,
        durationMins: o.duration === undefined ? 60 : o.duration, classesPerWeek: 1, plannedClasses: o.planned === undefined ? 4 : o.planned,
        preferredDays: o.days ?? ['mon'], preferredTimeBands: o.bands ?? ['morning'],
      },
    })
  }
  const audits = (action: string) => prisma.auditLog.findMany({ where: { action } })
  const activeOverlaps = async () => Number((await prisma.$queryRawUnsafe<{ c: bigint }[]>(
    `select count(*) c from class_sessions a join class_sessions b on a.id < b.id and a."instructorId" = b."instructorId" and a.status in ('scheduled','held') and b.status in ('scheduled','held') and tstzrange(a."startsAt", a."endsAt") && tstzrange(b."startsAt", b."endsAt")`))[0].c)

  it('generates the planned classes on the preferred weekday inside availability, with sequences and an audit row', async () => {
    const w = await world()
    const e = await enrol(w)
    const { sessions } = await svc.createSchedule(e.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)
    expect(sessions.map((s) => s.sequence)).toEqual([1, 2, 3, 4])
    expect(sessions.every((s) => s.status === 'scheduled' && s.mode === 'CENTRE' && s.durationMins === 60 && s.studentId === e.studentId)).toBe(true)
    expect(sessions[0].startsAt.toISOString()).toBe('2030-01-07T08:00:00.000Z') // 09:00 Lagos
    expect((await audits('schedule.generate'))).toHaveLength(1)
    expect((await audits('schedule.availability_override'))).toHaveLength(0)
  })

  it('refuses to book classes in the past unless explicitly backfilled (audited as backfill)', async () => {
    const w = await world()
    const e = await enrol(w, { planned: 1 })
    await expect(svc.createSchedule(e.id, { instructorId: w.ada.id, startDate: '2024-01-01' }, ADMIN)).rejects.toMatchObject({ status: 422, code: 'UNPLACEABLE' })
    expect(await prisma.classSession.count()).toBe(0)
    const e2 = await enrol(w, { planned: 1 })
    const { sessions } = await svc.createSchedule(e2.id, { instructorId: w.bob.id, startDate: '2024-01-01', allowPast: true }, ADMIN)
    expect(sessions[0].startsAt.toISOString()).toBe('2024-01-01T08:00:00.000Z')
    expect((await audits('schedule.generate')).some((a) => (a.metadata as { backfill?: boolean }).backfill === true)).toBe(true)
  })

  it('the guarantees exist in the catalog: 3 exclusion constraints, the partial unique index, the endsAt pin (guards against a future Prisma migration dropping them)', async () => {
    const cons = (await prisma.$queryRawUnsafe<{ conname: string }[]>(`select conname from pg_constraint where conrelid in ('class_sessions'::regclass,'instructor_availability'::regclass)`)).map((c) => c.conname)
    for (const name of ['class_sessions_instructor_no_overlap', 'class_sessions_student_no_overlap', 'instructor_availability_no_overlap', 'class_sessions_ends_chk', 'class_sessions_duration_chk']) expect(cons).toContain(name)
    const idx = await prisma.$queryRawUnsafe<{ indexdef: string }[]>(`select indexdef from pg_indexes where indexname='class_sessions_slot_unique'`)
    expect(idx).toHaveLength(1)
    expect(idx[0].indexdef).toMatch(/WHERE/)
  })

  it('RACE: ten simultaneous inserts of the same instructor slot -> exactly one succeeds (direct, constraint only)', async () => {
    const w = await world()
    const enrolments = await Promise.all(Array.from({ length: 10 }, () => enrol(w)))
    const start = new Date('2030-01-07T08:00:00Z'), end = new Date('2030-01-07T09:00:00Z')
    const results = await Promise.allSettled(enrolments.map((e) => prisma.classSession.create({ data: { enrollmentId: e.id, studentId: e.studentId, instructorId: w.ada.id, mode: 'CENTRE', startsAt: start, endsAt: end, durationMins: 60, sequence: 1 } })))
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(rejected).toHaveLength(9)
    for (const r of rejected) expect(mapDbConflict(r.reason)?.kind).toBe('instructor')
    expect(await activeOverlaps()).toBe(0)
  })

  it('RACE: ten admins commit plans computed against the same empty calendar -> one booking, nine INSTRUCTOR_BUSY', async () => {
    const w = await world()
    const enrolments = await Promise.all(Array.from({ length: 10 }, () => enrol(w, { planned: 1 })))
    const input = { instructorId: w.ada.id, startDate: MON }
    const plans = await Promise.all(enrolments.map((e) => svc.planSchedule(e.id, input)))
    expect(new Set(plans.map((p) => p.placed[0].startsAt.toISOString())).size).toBe(1) // all want the same slot
    const results = await Promise.allSettled(plans.map((p) => svc.commitSchedule(p, input, ADMIN)))
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    for (const r of rejected) {
      expect(r.reason).toBeInstanceOf(svc.SchedulingError)
      expect(r.reason.code).toBe('INSTRUCTOR_BUSY')
      expect(r.reason.status).toBe(409)
      expect(r.reason.message).toBe('Ada Teacher already has a class at that time')
    }
    expect(await prisma.classSession.count()).toBe(1)
    expect(await activeOverlaps()).toBe(0)
    // the losers wrote nothing: one schedule.generate row only
    expect(await audits('schedule.generate')).toHaveLength(1)
  })

  it('RACE: one student, two courses, two instructors, same time -> exactly one wins, the other is STUDENT_BUSY', async () => {
    const w = await world()
    const s = await student('twice@x.com')
    const e1 = await enrol(w, { studentId: s.id, courseId: w.course.id, planned: 1 })
    const e2 = await enrol(w, { studentId: s.id, courseId: w.course2.id, planned: 1 })
    const p1 = await svc.planSchedule(e1.id, { instructorId: w.ada.id, startDate: MON })
    const p2 = await svc.planSchedule(e2.id, { instructorId: w.bob.id, startDate: MON })
    expect(p1.placed[0].startsAt).toEqual(p2.placed[0].startsAt)
    const [r1, r2] = await Promise.allSettled([svc.commitSchedule(p1, { instructorId: w.ada.id, startDate: MON }, ADMIN), svc.commitSchedule(p2, { instructorId: w.bob.id, startDate: MON }, ADMIN)])
    const won = [r1, r2].filter((r) => r.status === 'fulfilled')
    const lost = [r1, r2].filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(won).toHaveLength(1)
    expect(lost[0].reason.code).toBe('STUDENT_BUSY')
    expect(await prisma.classSession.count()).toBe(1)
  })

  it('the planner avoids an existing booking (instructor busy at 09:00 -> the next student gets 10:00)', async () => {
    const w = await world()
    const a = await enrol(w, { planned: 1 }), b = await enrol(w, { planned: 1 })
    await svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)
    const { sessions } = await svc.createSchedule(b.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)
    expect(sessions[0].startsAt.toISOString()).toBe('2030-01-07T09:00:00.000Z') // 10:00 Lagos, back-to-back
  })

  it('RACE: a reschedule racing a new booking for the same slot -> exactly one wins; the loser leaves no trace', async () => {
    const w = await world()
    const a = await enrol(w, { planned: 1 }), b = await enrol(w, { planned: 1 })
    const { sessions: [x] } = await svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: MON }, ADMIN) // Mon 09:00
    const input = { instructorId: w.ada.id, startDate: MON }
    // b is planned while 09:00 is taken, so give b the 10:00 slot; then race x -> 10:00 against b's booking.
    const planB = await svc.planSchedule(b.id, input)
    expect(planB.placed[0].startsAt.toISOString()).toBe('2030-01-07T09:00:00.000Z')
    const ten = new Date('2030-01-07T09:00:00Z')
    const [rs, bk] = await Promise.allSettled([svc.rescheduleSession(x.id, { startsAt: ten }, ADMIN), svc.commitSchedule(planB, input, ADMIN)])
    expect([rs, bk].filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(await activeOverlaps()).toBe(0)
    const rows = await prisma.classSession.findMany({ where: { enrollmentId: a.id }, orderBy: { createdAt: 'asc' } })
    if (rs.status === 'rejected') {
      expect(rs.reason.code).toBe('INSTRUCTOR_BUSY')
      expect(rows).toHaveLength(1)
      expect(rows[0].status).toBe('scheduled') // rolled back: still booked at 09:00
      expect(rows[0].startsAt.toISOString()).toBe('2030-01-07T08:00:00.000Z')
    } else {
      expect(rows.map((r) => r.status)).toEqual(['rescheduled', 'scheduled'])
      expect((bk as PromiseRejectedResult).reason.code).toBe('INSTRUCTOR_BUSY')
    }
  })

  it('a failed reschedule leaves the original scheduled and writes nothing', async () => {
    const w = await world()
    const a = await enrol(w, { planned: 1 }), b = await enrol(w, { planned: 1 })
    const { sessions: [x] } = await svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)
    await svc.createSchedule(b.id, { instructorId: w.ada.id, startDate: MON }, ADMIN) // 10:00
    const before = await prisma.auditLog.count()
    await expect(svc.rescheduleSession(x.id, { startsAt: new Date('2030-01-07T09:00:00Z') }, ADMIN)).rejects.toMatchObject({ code: 'INSTRUCTOR_BUSY' })
    expect((await prisma.classSession.findUniqueOrThrow({ where: { id: x.id } })).status).toBe('scheduled')
    expect(await prisma.classSession.count({ where: { enrollmentId: a.id } })).toBe(1)
    expect(await prisma.auditLog.count()).toBe(before)
  })

  it('reschedule moves to a free slot: old row rescheduled, new row same sequence, linked, audited', async () => {
    const w = await world()
    const a = await enrol(w, { planned: 2 })
    const { sessions } = await svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)
    const moved = await svc.rescheduleSession(sessions[1].id, { startsAt: new Date('2030-01-14T09:00:00Z') }, ADMIN) // Mon 14 Jan 10:00 Lagos
    expect(moved.sequence).toBe(2)
    expect(moved.rescheduledFromId).toBe(sessions[1].id)
    expect((await prisma.classSession.findUniqueOrThrow({ where: { id: sessions[1].id } })).status).toBe('rescheduled')
    expect(await audits('session.reschedule')).toHaveLength(1)
    await expect(svc.rescheduleSession(sessions[1].id, { startsAt: new Date('2030-01-21T09:00:00Z') }, ADMIN)).rejects.toMatchObject({ code: 'NOT_RESCHEDULABLE' })
  })

  it('OUTSIDE availability is rejected (422) unless overridden with a reason; the override is audited; double-booking is never overridable', async () => {
    const w = await world()
    const a = await enrol(w, { planned: 1, bands: ['evening'] }) // instructor only does Monday mornings
    const input = { instructorId: w.ada.id, startDate: MON }
    const dry = await svc.planSchedule(a.id, input)
    expect(dry.placed).toHaveLength(0)
    await expect(svc.createSchedule(a.id, input, ADMIN)).rejects.toMatchObject({ status: 422, code: 'UNPLACEABLE' })
    await expect(svc.createSchedule(a.id, { ...input, overrideAvailability: true }, ADMIN)).rejects.toMatchObject({ code: 'OVERRIDE_REASON_REQUIRED' })
    expect(await prisma.classSession.count()).toBe(0)

    const { sessions } = await svc.createSchedule(a.id, { ...input, overrideAvailability: true, overrideReason: 'Student works until 6pm' }, ADMIN)
    expect(sessions).toHaveLength(1)
    const [row] = await audits('schedule.availability_override')
    expect(row).toBeTruthy()
    expect(row.adminId).toBe(ADMIN.id)
    expect(row.metadata).toMatchObject({ reason: 'Student works until 6pm', instructorId: w.ada.id, sessionIds: [sessions[0].id] })

    // a second student also wanting that evening slot with override: still refused by the database
    const b = await enrol(w, { planned: 1, bands: ['evening'] })
    const ov = { ...input, overrideAvailability: true, overrideReason: 'Also evening' }
    const planB = await svc.planSchedule(b.id, ov) // the planner already sees the booking and moves on, so force the clash
    const forced = { ...planB, placed: [{ ...planB.placed[0], startsAt: sessions[0].startsAt, endsAt: sessions[0].endsAt }] }
    await expect(svc.commitSchedule(forced, ov, ADMIN)).rejects.toMatchObject({ code: 'INSTRUCTOR_BUSY' })
    // the failed attempt rolled back its audit rows too
    expect(await audits('schedule.availability_override')).toHaveLength(1)
  })

  it('reschedule outside availability: 422 without override, succeeds with a reason and is audited', async () => {
    const w = await world()
    const a = await enrol(w, { planned: 1 })
    const { sessions: [x] } = await svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)
    const evening = new Date('2030-01-07T17:00:00Z') // 18:00 Lagos
    await expect(svc.rescheduleSession(x.id, { startsAt: evening }, ADMIN)).rejects.toMatchObject({ status: 422, code: 'OUTSIDE_AVAILABILITY' })
    await svc.rescheduleSession(x.id, { startsAt: evening, overrideAvailability: true, overrideReason: 'Parent request' }, ADMIN)
    expect(await audits('schedule.availability_override')).toHaveLength(1)
  })

  it('refuses a plan that is missing, an unplanned status, an unassigned instructor, and a bad date', async () => {
    const w = await world()
    const noPlan = await enrol(w, { planned: null })
    await expect(svc.createSchedule(noPlan.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)).rejects.toMatchObject({ status: 400, code: 'PLAN_MISSING' })
    const early = await enrol(w, { status: 'assessed' })
    await expect(svc.createSchedule(early.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)).rejects.toMatchObject({ code: 'NOT_PLANNED' })
    const stranger = await prisma.instructor.create({ data: { name: 'Eve', credentials: [] } })
    const ok = await enrol(w)
    await expect(svc.createSchedule(ok.id, { instructorId: stranger.id, startDate: MON }, ADMIN)).rejects.toMatchObject({ code: 'INSTRUCTOR_NOT_ASSIGNED_TO_COURSE' })
    await expect(svc.createSchedule(ok.id, { instructorId: w.ada.id, startDate: 'soon' }, ADMIN)).rejects.toMatchObject({ code: 'BAD_START_DATE' })
    const odd = await enrol(w, { duration: 30 })
    await expect(svc.createSchedule(odd.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)).rejects.toMatchObject({ code: 'DURATION_UNSUPPORTED' })
    expect(await prisma.classSession.count()).toBe(0)
  })

  it('cancel frees a class number so regenerating refills it; a missed class stays consumed', async () => {
    const w = await world()
    const a = await enrol(w, { planned: 3 })
    const { sessions } = await svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)
    await svc.setSessionStatus(sessions[1].id, 'cancelled', 'student ill', ADMIN)
    await expect(svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: '2029-01-01' }, ADMIN)).resolves.toBeTruthy() // refills sequence 2 (plan start date earlier than the others is fine)
    const seqs = (await prisma.classSession.findMany({ where: { enrollmentId: a.id, status: 'scheduled' }, orderBy: { sequence: 'asc' } })).map((s) => s.sequence)
    expect(seqs).toEqual([1, 2, 3])
  })

  it('missed keeps its slot: nothing to schedule once every number is scheduled/held/missed', async () => {
    const w = await world()
    const a = await enrol(w, { planned: 1 })
    const { sessions: [s] } = await svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: '2024-01-01', allowPast: true }, ADMIN) // a past Monday so it can be marked
    await svc.setSessionStatus(s.id, 'missed', undefined, ADMIN)
    await expect(svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)).rejects.toMatchObject({ code: 'NOTHING_TO_SCHEDULE' })
  })

  it('status moves: held/missed need the class to have started; terminal states stay terminal; each is audited', async () => {
    const w = await world()
    const a = await enrol(w, { planned: 2 })
    const { sessions: [future] } = await svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)
    await expect(svc.setSessionStatus(future.id, 'held', undefined, ADMIN)).rejects.toMatchObject({ code: 'NOT_STARTED' })
    await expect(svc.setSessionStatus(future.id, 'rescheduled', undefined, ADMIN)).rejects.toMatchObject({ code: 'BAD_STATUS' })
    await svc.setSessionStatus(future.id, 'cancelled', 'moved abroad', ADMIN)
    await expect(svc.setSessionStatus(future.id, 'scheduled', undefined, ADMIN)).rejects.toMatchObject({ code: 'BAD_TRANSITION' })
    expect(await audits('session.status')).toHaveLength(1)
  })

  it('a held class still blocks the instructor; reactivating a cancelled class onto a taken slot is a friendly conflict', async () => {
    const w = await world()
    const a = await enrol(w, { planned: 1 }), b = await enrol(w, { planned: 1 })
    const { sessions: [x] } = await svc.createSchedule(a.id, { instructorId: w.ada.id, startDate: '2024-01-01', allowPast: true }, ADMIN) // past Monday 09:00
    await svc.setSessionStatus(x.id, 'held', undefined, ADMIN)
    const input = { instructorId: w.ada.id, startDate: '2024-01-01', allowPast: true }
    const planB = await svc.planSchedule(b.id, input)
    expect(planB.placed[0].startsAt.getTime()).toBeGreaterThan(x.startsAt.getTime()) // planner skipped the held slot
    // cancel x? held cannot be cancelled; flip it to missed (no longer blocks time), book b into 09:00, then revive x
    await svc.setSessionStatus(x.id, 'missed', undefined, ADMIN)
    const forced = { ...planB, placed: [{ ...planB.placed[0], startsAt: x.startsAt, endsAt: x.endsAt }] }
    await svc.commitSchedule(forced, input, ADMIN)
    await expect(svc.setSessionStatus(x.id, 'scheduled', undefined, ADMIN)).rejects.toMatchObject({ code: 'INSTRUCTOR_BUSY' })
  })

  it('availability: replace-all round trip is audited; overlapping windows and mode/location mismatches are refused', async () => {
    const w = await world()
    const slots = [{ weekday: 2, startMinute: 600, endMinute: 780, locationId: w.loc.id, mode: 'HOME' }, { weekday: 3, startMinute: 540, endMinute: 600, locationId: w.online.id, mode: 'ONLINE' }]
    await svc.setAvailability(w.ada.id, slots, ADMIN)
    expect((await svc.getAvailability(w.ada.id)).map((s) => [s.weekday, s.mode])).toEqual([[2, 'HOME'], [3, 'ONLINE']]) // Monday window from the fixture was replaced
    expect(await audits('availability.update')).toHaveLength(1)
    await expect(svc.setAvailability(w.ada.id, [slots[0], { ...slots[0], startMinute: 700, endMinute: 800 }], ADMIN)).rejects.toMatchObject({ status: 409, code: 'AVAILABILITY_OVERLAP' })
    await expect(svc.setAvailability(w.ada.id, [{ ...slots[0], mode: 'ONLINE' }], ADMIN)).rejects.toMatchObject({ code: 'MODE_LOCATION_MISMATCH' })
    expect(await svc.getAvailability(w.ada.id)).toHaveLength(2) // failed replace rolled back
  })

  it('legacy preferredDays like "Monday" are understood', async () => {
    const w = await world()
    const e = await enrol(w, { days: ['Monday'], planned: 1 })
    const { sessions } = await svc.createSchedule(e.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)
    expect(sessions[0].startsAt.toISOString()).toBe('2030-01-07T08:00:00.000Z')
  })

  it('deleting an instructor who has classes on record is blocked by the database', async () => {
    const w = await world()
    const e = await enrol(w, { planned: 1 })
    await svc.createSchedule(e.id, { instructorId: w.ada.id, startDate: MON }, ADMIN)
    await expect(prisma.instructor.delete({ where: { id: w.ada.id } })).rejects.toBeTruthy()
  })

  it('timetable read model returns sessions, availability and who still needs scheduling', async () => {
    const w = await world()
    const e = await enrol(w, { planned: 2 })
    await svc.createSchedule(e.id, { instructorId: w.ada.id, startDate: MON, count: 1 }, ADMIN)
    const t = await svc.getTimetable({ from: '2030-01-07', to: '2030-01-13', instructorId: w.ada.id })
    expect(t.sessions).toHaveLength(1)
    expect(t.availability).toHaveLength(1)
    expect(t.needsScheduling.map((x) => [x.id, x.scheduled, x.plannedClasses])).toEqual([[e.id, 1, 2]])
  })
})
