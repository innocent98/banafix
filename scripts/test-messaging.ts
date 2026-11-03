/**
 * Stream 7 integration check on a SCRATCH Postgres (never production). Exercises the real code with a
 * fake email adapter:  DATABASE_URL=postgresql://postgres@127.0.0.1:5490/postgres npx tsx scripts/test-messaging.ts
 */
import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL ?? ''
if (!/@(127\.0\.0\.1|localhost):\d+\//.test(url)) {
  console.error('Refusing to run: DATABASE_URL must point at a local scratch database.')
  process.exit(2)
}

const prisma = new PrismaClient()
;(globalThis as unknown as { prisma: PrismaClient }).prisma = prisma

let failures = 0
function ok(name: string, cond: boolean, detail?: unknown) {
  console.log(`${cond ? '✅' : '❌'} ${name}${cond || detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`)
  if (!cond) failures++
}

async function main() {
  const { transitionEnrollment } = await import('../lib/enrollment-transition')
  const { emitEnrollmentEvent } = await import('../lib/messaging/enrollment-events')
  const { drainOutbox, retryMessages } = await import('../lib/messaging/outbox')
  const { setProvidersForTest } = await import('../lib/messaging/providers')
  const { createFakeProvider } = await import('../lib/messaging/providers/fake')
  const { saveTemplate } = await import('../lib/messaging/templates')
  const { runBirthdays, runNewMonth } = await import('../lib/messaging/runs')
  const { queueAnnouncement } = await import('../lib/messaging/announce')
  const { todayInLagos } = await import('../lib/birthdays')

  const email = createFakeProvider('EMAIL')
  setProvidersForTest({ EMAIL: email }) // SMS/WHATSAPP use the real disabled stubs

  // ── clean slate ───────────────────────────────────────────────────────────────
  await prisma.outboundMessage.deleteMany()
  await prisma.messageTemplate.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.birthdayEmailLog.deleteMany()
  await prisma.assessment.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.parent.deleteMany()
  await prisma.student.deleteMany()
  await prisma.courseOffering.deleteMany()
  await prisma.course.deleteMany({ where: { title: { startsWith: 'S7 ' } } })
  await prisma.location.deleteMany({ where: { name: { startsWith: 'S7 ' } } })
  await prisma.deliveryMode.deleteMany({ where: { name: { startsWith: 'S7 ' } } })

  const lagos = await prisma.location.create({ data: { name: 'S7 Lagos', slug: 's7-lagos', assessmentFee: 5000 } })
  const abuja = await prisma.location.create({ data: { name: 'S7 Abuja', slug: 's7-abuja', assessmentFee: 5000 } })
  const course = await prisma.course.create({
    data: { title: 'S7 Piano', instrument: 'Piano', level: 'Beginner', outcomes: [], equipment: [] },
  })

  const mkStudent = (n: string, extra: Record<string, unknown> = {}) =>
    prisma.student.create({
      data: { email: `${n}@s7.test`, firstName: n, lastName: 'Tester', phone: `+23480${Math.floor(Math.random() * 1e8)}`, ...extra },
    })
  const mkEnrollment = (studentId: string, n: string, over: Record<string, unknown> = {}) =>
    prisma.enrollment.create({
      data: {
        courseId: course.id, studentId, email: `${n}@s7.test`, firstName: n, lastName: 'Tester',
        selectedMode: 'x', consentToEmails: true, locationId: lagos.id, applicationFeeAmount: 5000, ...over,
      },
    })

  // ── A. application_received: student + guardian, once ─────────────────────────
  const ada = await mkStudent('ada')
  const e1 = await mkEnrollment(ada.id, 'ada', { guardianName: 'Mrs Ada', guardianEmail: 'mum@s7.test', guardianPhone: '+2348099999999' })
  let n = await emitEnrollmentEvent(prisma, e1.id, 'application_received')
  ok('application_received enqueues student + guardian email (2 rows)', n === 2, n)
  n = await emitEnrollmentEvent(prisma, e1.id, 'application_received')
  ok('replay enqueues nothing (idempotent)', n === 0, n)

  // ── B. transition → one set of rows; replay and race do not duplicate ─────────
  await saveTemplate(prisma, 'assessment_paid', {
    channels: ['EMAIL', 'SMS', 'WHATSAPP'], isActive: true,
    subject: 'Paid {{courseTitle}}', body: 'Dear {{firstName}}, paid.', shortBody: 'Paid {{courseTitle}}',
  })
  const bob = await mkStudent('bob')
  const e2 = await mkEnrollment(bob.id, 'bob', { guardianName: 'Mr Bob', guardianEmail: 'dad@s7.test', guardianPhone: '+2348088888888' })
  const move = () =>
    prisma.$transaction((tx) => transitionEnrollment(tx, e2.id, 'pending', 'assessment_paid', { applicationPaid: true }))
  const results = await Promise.all([move(), move(), move()])
  ok('three concurrent transitions: exactly one wins', results.filter(Boolean).length === 1, results)
  let rows = await prisma.outboundMessage.findMany({ where: { enrollmentId: e2.id, templateKey: 'assessment_paid' } })
  ok('assessment_paid: student+guardian × 3 channels = 6 rows, once', rows.length === 6, rows.length)
  ok('replaying the emit adds nothing', (await emitEnrollmentEvent(prisma, e2.id, 'assessment_paid')) === 0)

  // ── C. scheduling and reschedule ──────────────────────────────────────────────
  const slot1 = new Date('2026-11-10T09:00:00Z')
  const asmt = await prisma.assessment.create({
    data: { enrollmentId: e2.id, arrangement: 'HOME', status: 'scheduled', scheduledAt: slot1 },
  })
  await prisma.$transaction((tx) => transitionEnrollment(tx, e2.id, 'assessment_paid', 'assessment_scheduled'))
  rows = await prisma.outboundMessage.findMany({ where: { enrollmentId: e2.id, templateKey: 'assessment_scheduled' } })
  ok('assessment_scheduled: student + guardian email (2 rows)', rows.length === 2, rows.length)
  const body = rows.find((r) => r.recipientType === 'student')!.body
  ok('rendered with Lagos date/time and arrangement', body.includes('Tuesday 10 November 2026') && body.includes('10:00') && body.includes('at your home address'), body)
  ok('same slot again: no new rows', (await emitEnrollmentEvent(prisma, e2.id, 'assessment_scheduled')) === 0)
  await prisma.assessment.update({ where: { id: asmt.id }, data: { scheduledAt: new Date('2026-11-12T14:00:00Z') } })
  ok('new slot re-notifies (2 rows)', (await emitEnrollmentEvent(prisma, e2.id, 'assessment_scheduled')) === 2)

  // ── D. delivery: fake email sends, stubs skip, failure is retryable ───────────
  email.failFor('dad@s7.test', 'simulated outage')
  const d1 = await drainOutbox({ budgetMs: 60_000, limit: 200 })
  const byStatus = async (status: string, channel?: string) =>
    prisma.outboundMessage.count({ where: { status, ...(channel ? { channel } : {}) } })
  ok('SMS rows end skipped, not sent', (await byStatus('sent', 'SMS')) === 0 && (await byStatus('skipped', 'SMS')) > 0)
  ok('WhatsApp rows end skipped, not sent', (await byStatus('sent', 'WHATSAPP')) === 0 && (await byStatus('skipped', 'WHATSAPP')) > 0)
  const skippedSms = await prisma.outboundMessage.findFirst({ where: { channel: 'SMS', status: 'skipped' } })
  ok('skip reason is "provider not configured"', skippedSms?.error === 'SMS provider not configured', skippedSms?.error)
  const failed = await prisma.outboundMessage.findMany({ where: { status: 'failed' } })
  ok('failing recipient is recorded failed with the provider error', failed.length > 0 && failed.every((f) => f.error === 'simulated outage' && f.attempts === 1), failed.map((f) => f.error))
  ok('emails to healthy recipients were sent', email.sent.length > 0 && !email.sent.some((m) => m.to === 'dad@s7.test'))
  const sentBefore = email.sent.length
  await drainOutbox({ budgetMs: 60_000 })
  ok('a second drain never re-sends sent rows', email.sent.length === sentBefore)
  email.reset()
  ok('retry re-queues failed rows', (await retryMessages()) === failed.length)
  await drainOutbox({ budgetMs: 60_000 })
  ok('after the outage the retry is delivered', (await byStatus('failed')) === 0 && email.sent.some((m) => m.to === 'dad@s7.test'))
  const requeuedSkips = await retryMessages({ includeSkipped: true })
  ok('provider-skipped rows can be re-queued (provider chosen later)', requeuedSkips > 0, requeuedSkips)
  await drainOutbox({ budgetMs: 60_000 })

  // stale lock reclaimed, fresh lock respected
  const mk = (key: string, lockedAt: Date | null) =>
    prisma.outboundMessage.create({
      data: { channel: 'EMAIL', recipientType: 'student', toAddress: 'lock@s7.test', templateKey: 'announcement', category: 'TRANSACTIONAL', subject: 's', body: 'b', idempotencyKey: key, lockedAt },
    })
  await mk('lock:stale', new Date(Date.now() - 10 * 60_000))
  await mk('lock:fresh', new Date(Date.now() - 60_000))
  email.reset()
  await drainOutbox({ budgetMs: 60_000 })
  const stale = await prisma.outboundMessage.findUnique({ where: { idempotencyKey: 'lock:stale' } })
  const fresh = await prisma.outboundMessage.findUnique({ where: { idempotencyKey: 'lock:fresh' } })
  ok('stale lock is reclaimed and sent', stale?.status === 'sent', stale?.status)
  ok('fresh lock is left alone', fresh?.status === 'queued', fresh?.status)

  // ── E. enrolled also schedules feedback +30 days ──────────────────────────────
  await prisma.enrollment.update({ where: { id: e2.id }, data: { status: 'plan_agreed' } })
  await prisma.$transaction((tx) => transitionEnrollment(tx, e2.id, 'plan_agreed', 'enrolled'))
  const enrolledRows = await prisma.outboundMessage.findMany({ where: { enrollmentId: e2.id, templateKey: 'enrolled' } })
  const fb = await prisma.outboundMessage.findMany({ where: { enrollmentId: e2.id, templateKey: 'feedback_request' } })
  ok('enrolled: welcome email to student + guardian', enrolledRows.length === 2, enrolledRows.length)
  const days = fb[0]?.scheduledFor ? (fb[0].scheduledFor.getTime() - Date.now()) / 86_400_000 : -1
  ok('feedback_request scheduled ~30 days out', fb.length === 2 && days > 29 && days < 31, { n: fb.length, days })
  email.reset()
  await drainOutbox({ budgetMs: 60_000 })
  ok('a future-scheduled row is not sent yet', (await prisma.outboundMessage.count({ where: { templateKey: 'feedback_request', status: 'queued' } })) === 2)

  // ── F. cancelled sends nothing ────────────────────────────────────────────────
  const cat = await mkStudent('cat')
  const e3 = await mkEnrollment(cat.id, 'cat')
  const before = await prisma.outboundMessage.count()
  await prisma.$transaction((tx) => transitionEnrollment(tx, e3.id, 'pending', 'cancelled'))
  ok('cancelled enqueues nothing', (await prisma.outboundMessage.count()) === before)

  // ── G. birthdays: student + parent once; consent respected; legacy log excluded
  await prisma.outboundMessage.deleteMany()
  await prisma.parent.deleteMany()
  await prisma.student.deleteMany({ where: { email: { in: ['b1@s7.test', 'b2@s7.test', 'b3@s7.test'] } } })
  const now = new Date()
  const today = todayInLagos(now)
  const dob = new Date(Date.UTC(2012, today.month - 1, today.day))
  const b1 = await mkStudent('b1', { dateOfBirth: dob })
  await mkEnrollment(b1.id, 'b1', { consentToEmails: true })
  const b2 = await mkStudent('b2', { dateOfBirth: dob })
  await mkEnrollment(b2.id, 'b2', { consentToEmails: false })
  const b3 = await mkStudent('b3', { dateOfBirth: dob })
  await mkEnrollment(b3.id, 'b3', { consentToEmails: true })
  await prisma.birthdayEmailLog.create({ data: { recipientType: 'student', recipientId: b3.id, year: today.year, email: b3.email } })
  const pOk = await prisma.parent.create({ data: { name: 'Parent Linked', email: 'plinked@s7.test', birthdayMonth: today.month, birthdayDay: today.day, children: { connect: [{ id: b1.id }] } } })
  const pNone = await prisma.parent.create({ data: { name: 'Parent Unlinked', email: 'punlinked@s7.test', birthdayMonth: today.month, birthdayDay: today.day } })
  email.reset()
  const r1 = await runBirthdays(now)
  const r2 = await runBirthdays(now)
  const msgs = await prisma.outboundMessage.findMany({ where: { templateKey: { startsWith: 'birthday' } } })
  const find = (id: string) => msgs.find((m) => m.recipientId === id)
  ok('birthday run 1: candidates are b1, b2, linked + unlinked parent (b3 excluded by the legacy log)', r1.candidates === 4, r1)
  ok('birthday run 2 enqueues nothing new', r2.queued === 0, r2)
  ok('consenting student queued then sent', find(b1.id)?.status === 'sent', find(b1.id)?.status)
  ok('non-consenting student skipped with the reason', find(b2.id)?.status === 'skipped' && find(b2.id)?.error === 'No email consent on record', find(b2.id))
  ok('parent of a consenting child sent', find(pOk.id)?.status === 'sent', find(pOk.id)?.status)
  ok('unlinked parent (no consent on record) skipped', find(pNone.id)?.status === 'skipped', find(pNone.id)?.status)
  ok('student and parent got different copy', find(b1.id)?.templateKey === 'birthday_student' && find(pOk.id)?.templateKey === 'birthday_parent')
  ok('exactly 2 birthday emails left the building', email.sent.length === 2, email.sent.map((m) => m.to))

  // ── H. new month: once per month; enrolled only ───────────────────────────────
  await prisma.outboundMessage.deleteMany()
  await prisma.enrollment.updateMany({ data: { status: 'enrolled' } })
  email.reset()
  const m1 = await runNewMonth(now)
  const m2 = await runNewMonth(now)
  ok('new-month run 1 queues enrolled students + parent', m1.queued > 0 && m1.candidates >= 4, m1)
  ok('new-month run 2 enqueues nothing (same Lagos month)', m2.queued === 0, m2)
  const nextMonth = await runNewMonth(new Date(now.getTime() + 35 * 86_400_000))
  ok('a different month queues again', nextMonth.queued > 0, nextMonth)

  // ── I. announcements: filtered audience, operational override ─────────────────
  await prisma.outboundMessage.deleteMany()
  const zed = await mkStudent('zed')
  await mkEnrollment(zed.id, 'zed', { status: 'enrolled', locationId: abuja.id, consentToEmails: false })
  const ann = await prisma.announcement.create({ data: { subject: 'Hello', body: 'Hi {{firstName}}', channels: ['EMAIL', 'SMS'], category: 'MARKETING', audience: {} } })
  const lagosOnly = await queueAnnouncement(prisma, { announcementId: ann.id, subject: 'Hello', body: 'Hi {{firstName}}', channels: ['EMAIL'], operational: false, filter: { scope: 'students', locationId: lagos.id } })
  const lagosMsgs = await prisma.outboundMessage.findMany({ where: { batchId: ann.id } })
  ok('location filter excludes the Abuja student', !lagosMsgs.some((m) => m.recipientId === zed.id) && lagosOnly.recipients >= 3, lagosOnly)
  ok('announcement body personalised', lagosMsgs.filter((m) => m.status === 'queued').every((m) => !m.body.includes('{{') && m.body.startsWith('Hi ')))
  const ann2 = await prisma.announcement.create({ data: { subject: 'Closed', body: 'Closed tomorrow', channels: ['EMAIL'], category: 'TRANSACTIONAL', audience: {} } })
  await queueAnnouncement(prisma, { announcementId: ann2.id, subject: 'Closed', body: 'Closed tomorrow', channels: ['EMAIL'], operational: false, filter: { scope: 'students', locationId: abuja.id } })
  const zedMarketing = await prisma.outboundMessage.findFirst({ where: { batchId: ann2.id, recipientId: zed.id } })
  ok('marketing announcement skips a non-consenting student', zedMarketing?.status === 'skipped', zedMarketing?.status)
  const ann3 = await prisma.announcement.create({ data: { subject: 'Closed', body: 'Closed tomorrow', channels: ['EMAIL'], category: 'TRANSACTIONAL', audience: {} } })
  await queueAnnouncement(prisma, { announcementId: ann3.id, subject: 'Closed', body: 'Closed tomorrow', channels: ['EMAIL'], operational: true, filter: { scope: 'students', locationId: abuja.id } })
  const zedOps = await prisma.outboundMessage.findFirst({ where: { batchId: ann3.id, recipientId: zed.id } })
  ok('operational notice goes out regardless of consent', zedOps?.status === 'queued', zedOps?.status)
  const rerun = await queueAnnouncement(prisma, { announcementId: ann3.id, subject: 'Closed', body: 'Closed tomorrow', channels: ['EMAIL'], operational: true, filter: { scope: 'students', locationId: abuja.id } })
  ok('re-queueing the same announcement creates nothing', rerun.created === 0, rerun)
  const parentsOnly = await queueAnnouncement(prisma, { announcementId: ann.id + 'p', subject: 'P', body: 'P', channels: ['EMAIL'], operational: true, filter: { scope: 'parents' } })
  ok('parents-only audience is just parents of enrolled students', parentsOnly.recipients === 1, parentsOnly)

  // ── J. HTML safety end to end ─────────────────────────────────────────────────
  const evil = await mkStudent('<script>x</script>')
  await mkEnrollment(evil.id, 'evil', { status: 'enrolled', firstName: '<script>x</script>' })
  await prisma.outboundMessage.deleteMany({ where: { recipientId: evil.id } })
  const annE = await prisma.announcement.create({ data: { subject: 'S', body: 'Hi {{firstName}}', channels: ['EMAIL'], category: 'TRANSACTIONAL', audience: {} } })
  await queueAnnouncement(prisma, { announcementId: annE.id, subject: 'S', body: 'Hi {{firstName}}', channels: ['EMAIL'], operational: true, filter: { scope: 'students' } })
  const evilMsg = await prisma.outboundMessage.findFirst({ where: { batchId: annE.id, recipientId: evil.id } })
  ok('a hostile name is escaped in the stored email html', !!evilMsg?.html && !evilMsg.html.includes('<script>x') && evilMsg.html.includes('&lt;script&gt;'))

  console.log(failures === 0 ? '\nALL MESSAGING CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
}

main()
  .catch((e) => {
    console.error(e)
    failures++
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(failures === 0 ? 0 : 1)
  })
