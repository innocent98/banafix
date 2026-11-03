// Demo data for browser-checking scheduling on a THROWAWAY database. Refuses non-local DATABASE_URL.
//   DATABASE_URL=postgresql://postgres@127.0.0.1:5470/postgres npx tsx scripts/dev/seed-scheduling-demo.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL ?? ''
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(url)) throw new Error('refusing: DATABASE_URL is not local')
const prisma = new PrismaClient()

async function main() {
  await prisma.admin.upsert({
    where: { email: 'admin@banafix.com' }, update: {},
    create: { email: 'admin@banafix.com', name: 'Banafix Admin', password: await bcrypt.hash('admin123', 12), isActive: true },
  })
  for (const [i, name] of ['On-site', 'One-on-One', 'Online', 'Home Training'].entries()) {
    await prisma.deliveryMode.upsert({ where: { name }, update: {}, create: { name, order: i + 1 } })
  }
  const lagos = await prisma.location.upsert({ where: { name: 'Lagos' }, update: {}, create: { name: 'Lagos', slug: 'lagos', assessmentFee: 5000, order: 1 } })
  const online = await prisma.location.upsert({ where: { name: 'Online' }, update: {}, create: { name: 'Online', slug: 'online', kind: 'ONLINE', assessmentFee: 5000, order: 2 } })
  const guitar = await prisma.course.create({ data: { title: 'Guitar Foundations', instrument: 'Guitar', level: 'Beginner', outcomes: [], equipment: [], isPublished: true } })
  const piano = await prisma.course.create({ data: { title: 'Piano Online', instrument: 'Piano', level: 'All Levels', outcomes: [], equipment: [], isPublished: true } })
  const ada = await prisma.instructor.create({ data: { name: 'Ada Okafor', credentials: [], verified: true } })
  const tunde = await prisma.instructor.create({ data: { name: 'Tunde Bello', credentials: [], verified: true } })
  await prisma.instructorCourse.createMany({ data: [
    { instructorId: ada.id, courseId: guitar.id }, { instructorId: ada.id, courseId: piano.id }, { instructorId: tunde.id, courseId: guitar.id },
  ] })
  await prisma.course.update({ where: { id: guitar.id }, data: { instructorId: ada.id } })
  await prisma.instructorAvailability.createMany({ data: [
    { instructorId: ada.id, weekday: 1, startMinute: 540, endMinute: 720, locationId: lagos.id, mode: 'CENTRE' },
    { instructorId: ada.id, weekday: 3, startMinute: 780, endMinute: 1020, locationId: lagos.id, mode: 'HOME' },
    { instructorId: ada.id, weekday: 5, startMinute: 1080, endMinute: 1260, locationId: online.id, mode: 'ONLINE' },
    { instructorId: tunde.id, weekday: 1, startMinute: 600, endMinute: 900, locationId: lagos.id, mode: 'CENTRE' },
  ] })
  const people = [
    { first: 'Chi', last: 'Eze', days: ['mon', 'wed'], bands: ['morning', 'afternoon'], perWeek: 2 },
    { first: 'Dayo', last: 'Ade', days: ['Monday'], bands: ['morning'], perWeek: 1 }, // legacy day name
    { first: 'Ife', last: 'Obi', days: [], bands: [], perWeek: null },
  ]
  for (const [i, p] of people.entries()) {
    const s = await prisma.student.create({ data: { email: `${p.first.toLowerCase()}@demo.test`, firstName: p.first, lastName: p.last } })
    await prisma.enrollment.create({ data: {
      courseId: guitar.id, studentId: s.id, selectedMode: 'On-site', status: 'plan_agreed', locationId: lagos.id, applicationPaid: true,
      durationMins: i === 1 ? 45 : 60, classesPerWeek: p.perWeek ?? 1, plannedClasses: 6, ratePerClass: 5000,
      preferredDays: p.days, preferredTimeBands: p.bands, preferredClassesPerWeek: p.perWeek,
    } })
  }
  console.log('demo data ready: admin@banafix.com / admin123 (local only)')
}
main().finally(() => prisma.$disconnect())
