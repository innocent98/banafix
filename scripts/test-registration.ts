/**
 * Bounded real-database journey for Stream 6 (registration + parents). Calls the REAL route handlers
 * (public POST /api/enrollments, admin walk-in, admin parent detail) against a scratch Postgres with the
 * local Paystack mock. Refuses to run unless DATABASE_URL points at 127.0.0.1.
 *
 *   scripts/dev/ephemeral-pg.sh reset   (EPHEMERAL_PG_PORT=5510)
 *   DATABASE_URL=postgresql://postgres@127.0.0.1:5510/postgres npx prisma migrate deploy
 *   node scripts/mock-paystack.mjs &
 *   DATABASE_URL=... PAYSTACK_BASE_URL=http://127.0.0.1:4010 PAYSTACK_SECRET_KEY=sk_test_x JWT_SECRET=t \
 *     npx tsx scripts/test-registration.ts
 */
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL?.includes('127.0.0.1')) {
  console.error('refusing: DATABASE_URL must point at 127.0.0.1')
  process.exit(1)
}

let failures = 0
const check = (name: string, ok: boolean, extra = '') => {
  if (!ok) failures++
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` ${extra}` : ''}`)
}
const shape = (o: unknown): unknown =>
  Array.isArray(o) ? 'array' : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).sort().map(([k, v]) => [k, shape(v)])) : o === null ? 'null' : typeof o

async function main() {
  const db = new PrismaClient()
  const { POST: publicPost } = await import('../app/api/enrollments/route')
  const { POST: walkIn } = await import('../app/api/admin/enrollments/route')
  const { GET: parentGet } = await import('../app/api/admin/parents/[id]/route')
  const { generateToken } = await import('../lib/auth')
  const { parentConsentFlags } = await import('../lib/messaging/consent')

  // ---- fixtures
  const n = Date.now().toString(36)
  const admin = await db.admin.create({ data: { email: `adm${n}@example.com`, name: 'Adm', password: 'x' } })
  const token = generateToken({ id: admin.id, email: admin.email, name: admin.name })
  const mode = await db.deliveryMode.create({ data: { name: `Mode${n}` } })
  const loc = await db.location.create({ data: { name: `Loc${n}`, slug: `loc-${n}`, assessmentFee: 5000 } })
  const mkCourse = async (t: string) => {
    const course = await db.course.create({ data: { title: `${t}${n}`, instrument: 'Guitar', level: 'Beginner', isPublished: true, isActive: true } })
    const offering = await db.courseOffering.create({ data: { courseId: course.id, locationId: loc.id, deliveryModeId: mode.id, isActive: true } })
    await db.offeringRate.create({ data: { offeringId: offering.id, durationMins: 60, pricePerClass: 4000 } })
    return { course, offering }
  }
  const A = await mkCourse('Guitar'), B = await mkCourse('Piano')

  let ip = 0
  const pub = async (courseOf: typeof A, body: Record<string, unknown>) => {
    const res = await publicPost(new NextRequest('http://localhost/api/enrollments', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.9.${Math.floor(++ip / 200)}.${ip % 200}` },
      body: JSON.stringify({ courseId: courseOf.course.id, offeringId: courseOf.offering.id, arrangement: 'CENTRE', agreeToTerms: true, agreeToRefundPolicy: true, ...body }),
    }))
    return { status: res.status, json: await res.json() }
  }
  const adm = async (body: Record<string, unknown>) => {
    const res = await walkIn(new NextRequest('http://localhost/api/admin/enrollments', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ courseId: A.course.id, locationId: loc.id, feePaid: false, ...body }),
    }))
    return { status: res.status, json: await res.json() }
  }
  const L = `Okafor${n}`
  const mum = `mum${n}@example.com`
  const parentsBefore = await db.parent.count()
  const parentsOf = (email: string) => db.parent.findUnique({ where: { email }, include: { children: true } })

  // ---- public form
  const adult = await pub(A, { firstName: 'Ann', lastName: 'Adult', email: `ann${n}@example.com`, phone: '08030000001', registeringFor: 'self', consentToEmails: true })
  check('adult self-registration → 201, no parent record', adult.status === 201 && (await db.parent.count()) === parentsBefore, JSON.stringify(adult.json).slice(0, 80))

  const ada = await pub(A, { firstName: 'Ada', lastName: L, registeringFor: 'child', guardianName: 'Mrs Okafor', guardianEmail: mum.toUpperCase(), guardianPhone: '0903 856 3822', consentToEmails: true, dateOfBirth: '2016-04-02' })
  const p1 = await parentsOf(mum)
  const adaStu = await db.student.findFirst({ where: { firstName: 'Ada', lastName: L } })
  check('child with no own email → 201, parent created and linked', ada.status === 201 && p1?.children.length === 1 && p1.name === 'Mrs Okafor', `student=${adaStu?.email}`)
  check('child is keyed on a +tag of the guardian mailbox, guardian fields stored', adaStu?.email === `${mum.split('@')[0]}+ada-okafor${n}@example.com` && adaStu?.guardianEmail === mum)

  const tobi = await pub(A, { firstName: 'Tobi', lastName: L, registeringFor: 'child', guardianName: 'SOMEONE ELSE', guardianEmail: mum, guardianPhone: '0800 000 0000', consentToEmails: false })
  const p2 = await parentsOf(mum)
  check('second child, same guardian email → linked to the SAME parent', tobi.status === 201 && p2?.children.length === 2 && (await db.parent.count()) === parentsBefore + 1)
  check('existing parent NOT overwritten by the public form', p2?.name === 'Mrs Okafor' && p2?.phone === '0903 856 3822', `name=${p2?.name} phone=${p2?.phone}`)
  check('two siblings = two students (not merged)', (await db.student.count({ where: { lastName: L } })) === 2)
  check('response shape identical for new-parent and existing-parent child (no enumeration)', JSON.stringify(shape(ada.json)) === JSON.stringify(shape(tobi.json)))
  const fresh = await pub(B, { firstName: 'Zed', lastName: 'New', registeringFor: 'child', guardianName: 'New Guardian', guardianEmail: `new${n}@example.com` })
  check('response shape identical for a never-seen guardian', JSON.stringify(shape(fresh.json)) === JSON.stringify(shape(ada.json)))

  const adaB = await pub(B, { firstName: 'Ada', lastName: L, registeringFor: 'child', guardianName: 'Mrs Okafor', guardianEmail: mum })
  check('same child, second course → same student, 2 applications', adaB.status === 201 && (await db.student.count({ where: { firstName: 'Ada', lastName: L } })) === 1 && (await db.enrollment.count({ where: { studentId: adaStu!.id } })) === 2)

  const noG = await pub(A, { firstName: 'Kid', lastName: 'Nog', registeringFor: 'child', email: `kid${n}@example.com` })
  check('child without guardian → 400', noG.status === 400, noG.json.error)
  const dobMinor = await pub(A, { firstName: 'Kid', lastName: 'Dob', registeringFor: 'self', email: `kd${n}@example.com`, dateOfBirth: '2015-01-01' })
  check('"self" with a birth date under 18 → 400', dobMinor.status === 400, dobMinor.json.error)

  const spoof = await pub(B, { firstName: 'Ann', lastName: 'Adult', email: `ann${n}@example.com`, registeringFor: 'self', guardianName: 'Attacker', guardianEmail: `attacker${n}@example.com` })
  check('guardian typed against an EXISTING student is not linked from the public form', spoof.status === 201 && !(await parentsOf(`attacker${n}@example.com`)))

  // consent: parent marketing needs a child past the unconfirmed stage
  const flagsPending = parentConsentFlags((await db.parent.findUnique({ where: { email: mum }, select: { children: { select: { enrollments: { select: { consentToEmails: true, status: true } } } } } }))!.children)
  check('public applications are pending → parent has NO marketing consent yet (even though the box was ticked)', flagsPending.length === 0)
  await db.enrollment.updateMany({ where: { studentId: adaStu!.id, courseId: A.course.id }, data: { status: 'assessment_paid' } })
  const flagsPaid = parentConsentFlags((await db.parent.findUnique({ where: { email: mum }, select: { children: { select: { enrollments: { select: { consentToEmails: true, status: true } } } } } }))!.children)
  check('once the child application is paid, the ticked consent counts', flagsPaid.some(Boolean))

  // ---- admin walk-in
  const picked = await adm({ firstName: 'Ife', lastName: L, registeringFor: 'child', parentId: p2!.id, guardianName: 'ignored', consentToEmails: true })
  const p3 = await parentsOf(mum)
  check('walk-in child attached to an existing parent by id → linked, parent unchanged', picked.status === 201 && picked.json.parent?.outcome === 'linked' && p3?.children.length === 3 && p3.name === 'Mrs Okafor')
  const viaEmail = await adm({ firstName: 'Femi', lastName: L, registeringFor: 'child', guardianName: 'Mrs Okafor', guardianEmail: mum })
  check('walk-in child with the same guardian email → matched, no new parent', viaEmail.json.parent?.outcome === 'linked' && viaEmail.json.parent.id === p2!.id)
  const phoneOnly = await adm({ firstName: 'Gift', lastName: L, registeringFor: 'child', guardianName: 'Mrs O', guardianPhone: '+234 903 856 3822' })
  check('walk-in guardian with ONLY a phone → linked by the unique phone match', phoneOnly.status === 201 && phoneOnly.json.parent?.outcome === 'linked' && phoneOnly.json.parent?.id === p2!.id, JSON.stringify(phoneOnly.json.parent))
  const noGuardian = await adm({ firstName: 'Lone', lastName: 'Kid', registeringFor: 'child', email: `lone${n}@example.com` })
  check('walk-in child with no guardian → 400', noGuardian.status === 400, noGuardian.json.error)
  const newG = await adm({ firstName: 'Neo', lastName: 'Eze', registeringFor: 'child', guardianName: 'Mr Eze', guardianEmail: `eze${n}@example.com`, guardianPhone: '0805 111 2222' })
  check('walk-in new guardian → parent created', newG.json.parent?.outcome === 'created' && !!(await parentsOf(`eze${n}@example.com`)))

  // ---- admin parent view
  const detail = await parentGet(new NextRequest(`http://localhost/api/admin/parents/${p2!.id}`, { headers: { authorization: `Bearer ${token}` } }), { params: Promise.resolve({ id: p2!.id }) })
  const dj = await detail.json()
  check('admin parent detail lists every child with their applications + derived marketing flag', detail.status === 200 && dj.parent.children.length >= 3 && dj.parent.children.every((c: any) => Array.isArray(c.enrollments)) && dj.parent.marketingConsent === true, `children=${dj.parent.children.length}`)

  // ---- audit
  const audits = await db.auditLog.findMany({ where: { action: { startsWith: 'parent.registration' } } })
  check('audit rows written for create + link (public: no admin, walk-in: admin id)', audits.some((a) => a.action === 'parent.registration_create' && a.adminId === null) && audits.some((a) => a.action === 'parent.registration_link' && a.adminId === admin.id))
  check('walk-in audit records the parent', !!(await db.auditLog.findFirst({ where: { action: 'enrollment.admin_create', adminId: admin.id } })))

  await db.$disconnect()
  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
  process.exit(failures === 0 ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
