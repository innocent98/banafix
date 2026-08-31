// scripts/test-enroll-create.ts — requires a local DB with a published, seatful course
import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const course = await prisma.course.findFirst({ where: { isPublished: true, isActive: true } })
  if (!course) throw new Error('seed a published course first')
  const email = 'Foundation.Test@Example.com'
  await prisma.enrollment.deleteMany({ where: { student: { email: email.toLowerCase() } } })
  await prisma.student.deleteMany({ where: { email: email.toLowerCase() } })

  // simulate two enrollments (same person) via the same upsert path the route uses
  for (const last of ['First', 'Second']) {
    const s = await prisma.student.upsert({
      where: { email: email.toLowerCase() },
      update: { firstName: 'Foundation', lastName: last },
      create: { email: email.toLowerCase(), firstName: 'Foundation', lastName: last },
    })
    await prisma.enrollment.create({ data: { studentId: s.id, courseId: course.id, selectedMode: course.availableModes[0], status: 'pending' } })
  }
  const students = await prisma.student.count({ where: { email: email.toLowerCase() } })
  const s = await prisma.student.findUnique({ where: { email: email.toLowerCase() }, include: { enrollments: true } })
  console.log(students === 1 && s?.lastName === 'Second' && s?.enrollments.length === 2 ? '✅ one student, refreshed, 2 enrollments' : '❌ failed', { students, last: s?.lastName, enrollments: s?.enrollments.length })
  process.exit(students === 1 && s?.lastName === 'Second' ? 0 : 1)
}
main()
