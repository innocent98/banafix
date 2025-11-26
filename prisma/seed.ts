import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@banafix.com' },
    update: {},
    create: {
      email: 'admin@banafix.com',
      name: 'Banafix Admin',
      password: hashedPassword,
      isActive: true,
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create default delivery modes
  const deliveryModes = [
    { name: 'On-site', isActive: true, order: 1 },
    { name: 'One-on-One', isActive: true, order: 2 },
    { name: 'Online', isActive: true, order: 3 },
    { name: 'Home Training', isActive: true, order: 4 },
  ]

  for (const mode of deliveryModes) {
    await prisma.deliveryMode.upsert({
      where: { name: mode.name },
      update: { isActive: mode.isActive, order: mode.order },
      create: mode,
    })
  }

  console.log('✅ Created delivery modes')

  // Create sample course data based on existing frontend structure
  const sampleCourse = await prisma.course.upsert({
    where: { id: 'sample-guitar-course' },
    update: {},
    create: {
      id: 'sample-guitar-course',
      title: 'Guitar Fundamentals',
      description: 'Master the fundamentals of guitar playing with our comprehensive beginner program. This course covers everything from basic chord progressions to your first complete songs.',
      instrument: 'Guitar',
      level: 'Beginner',
      duration: '12 weeks',
      location: 'Lagos',
      session: 'Spring 2025',
      sessionStartDate: new Date('2025-01-15'),
      availableModes: ['On-site', 'One-on-One', 'Online', 'Home Training'],
      pricing: {
        'On-site': 25000,
        'One-on-One': 30000,
        'Online': 20000,
        'Home Training': 35000,
      },
      totalSeats: 20,
      seatsLeft: 8,
      outcomes: [
        'Learn 20+ essential chords and transitions',
        'Master 5+ strumming patterns and techniques',
        'Play 5 complete songs from start to finish',
        'Understand basic music theory and chord progressions',
        'Develop proper posture and finger techniques',
        'Gain confidence for live performance opportunities',
      ],
      equipment: [
        'Acoustic or electric guitar (rental available)',
        'Guitar picks (provided in starter kit)',
        'Digital tuner or tuning app',
        'Music stand (optional but recommended)',
      ],
      image: 'https://images.unsplash.com/photo-1613047747166-a7f33950fd4f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isActive: true,
      isPublished: true,
    },
  })

  // Create instructor for the sample course
  await prisma.instructor.upsert({
    where: { courseId: sampleCourse.id },
    update: {},
    create: {
      courseId: sampleCourse.id,
      name: 'John Adebayo',
      bio: 'Professional guitarist with 15+ years of teaching experience. Specializes in acoustic and electric guitar across multiple genres.',
      avatar: '/instructor-john.jpg',
      credentials: [
        'Certified Music Educator',
        'Berklee Graduate',
        '500+ Students Taught',
      ],
      rating: 4.9,
      experience: '15 years',
      availability: 'Mon-Fri: 9AM-6PM, Sat: 10AM-4PM',
      verified: true,
    },
  })

  // Create curriculum modules for the sample course
  const curriculumModules = [
    {
      module: 1,
      title: 'Guitar Basics & First Chords',
      weeks: 'Weeks 1-2',
      outcomes: ['Proper guitar posture and hand positioning', 'Learn G, C, D, Em chords', 'Basic strumming technique'],
      tasks: ['Daily 15-minute chord practice', 'Memorize chord shapes', 'Practice chord transitions'],
      order: 1,
    },
    {
      module: 2,
      title: 'Rhythm & Strumming Patterns',
      weeks: 'Weeks 3-4',
      outcomes: ['Master down-up strumming', 'Learn 3 essential patterns', 'Play with metronome'],
      tasks: ['Rhythm exercises', 'Pattern practice', 'First simple songs'],
      order: 2,
    },
    {
      module: 3,
      title: 'Expanding Your Chord Vocabulary',
      weeks: 'Weeks 5-7',
      outcomes: ['Add Am, F, Dm chords', 'Barre chord introduction', 'Chord progression patterns'],
      tasks: ['Chord transition drills', 'Song practice', 'Finger strength exercises'],
      order: 3,
    },
    {
      module: 4,
      title: 'Songs & Performance',
      weeks: 'Weeks 8-10',
      outcomes: ['Play 3 complete songs', 'Basic fingerpicking', 'Performance techniques'],
      tasks: ['Song memorization', 'Performance practice', 'Recording exercises'],
      order: 4,
    },
    {
      module: 5,
      title: 'Advanced Techniques',
      weeks: 'Weeks 11-12',
      outcomes: ['Advanced strumming', 'Basic lead guitar', 'Music theory application'],
      tasks: ['Solo practice', 'Improvisation exercises', 'Final performance preparation'],
      order: 5,
    },
  ]

  for (const moduleData of curriculumModules) {
    await prisma.curriculumModule.create({
      data: {
        ...moduleData,
        courseId: sampleCourse.id,
      },
    })
  }

  // Create FAQs for the sample course
  const faqs = [
    {
      question: 'Do I need my own guitar to start?',
      answer: 'While having your own guitar is ideal for practice, we offer rental guitars for the first month to help you get started. This gives you time to find the right instrument for your needs.',
      order: 1,
    },
    {
      question: 'What if I miss a session?',
      answer: 'We offer makeup sessions for missed classes. You can reschedule up to 24 hours in advance through your student dashboard or by contacting your instructor directly.',
      order: 2,
    },
    {
      question: 'Can I switch between training modes?',
      answer: 'Yes, you can switch between On-site, One-on-One, Online, and Home Training modes during the course, subject to availability and any price differences.',
      order: 3,
    },
  ]

  for (const faqData of faqs) {
    await prisma.courseFAQ.create({
      data: {
        ...faqData,
        courseId: sampleCourse.id,
      },
    })
  }

  console.log('✅ Created sample course with instructor, curriculum, and FAQs')

  // Create system settings
  const systemSettings = [
    { key: 'platform_name', value: 'Banafix', type: 'text' },
    { key: 'contact_email', value: 'contact@banafix.com', type: 'text' },
    { key: 'support_phone', value: '+234 800 BANAFIX', type: 'text' },
    { key: 'default_currency', value: 'NGN', type: 'text' },
  ]

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  console.log('✅ Created system settings')
  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })