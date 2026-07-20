import { prisma } from '../lib/prisma'

/**
 * Uploads the Saxophone & Violin (Beginner + Intermediate) courses and their
 * weekly curriculum modules to the database.
 *
 * Idempotent: courses are upserted by a deterministic id, and each course's
 * curriculum is fully replaced on every run (deleteMany -> create).
 *
 * Course meta mirrors the sample Guitar course defaults (pricing, delivery
 * modes, location, seats) and is published live, per the admin's instruction.
 */

type ModuleInput = {
  module: number
  title: string
  weeks: string
  outcomes: string[]
  tasks: string[]
}

type CourseInput = {
  id: string
  title: string
  instrument: string
  level: string
  description: string
  outcomes: string[]
  equipment: string[]
  curriculum: ModuleInput[]
}

const GUITAR_DEFAULTS = {
  duration: '12 weeks',
  location: 'Lagos',
  availableModes: ['On-site', 'One-on-One', 'Online', 'Home Training'],
  pricing: {
    'On-site': 25000,
    'One-on-One': 30000,
    Online: 20000,
    'Home Training': 35000,
  },
  totalSeats: 20,
  seatsLeft: 20,
}

// Helper to keep the per-week data compact.
const wk = (
  module: number,
  title: string,
  outcomes: string[],
  tasks: string[] = [],
): ModuleInput => ({ module, title, weeks: `Week ${module}`, outcomes, tasks })

const saxophoneBeginner: CourseInput = {
  id: 'saxophone-beginner',
  title: 'Saxophone for Beginners',
  instrument: 'Saxophone',
  level: 'Beginner',
  description:
    'A 12-week beginner saxophone program covering music theory, instrument care, tone production, scales, phrasing, and articulation.',
  outcomes: [
    'Read basic music notation and rhythm',
    'Produce a clear tone with proper embouchure',
    'Play major and chromatic scales',
    'Apply phrases, licks, and articulation in simple songs',
  ],
  equipment: [
    'Alto or tenor saxophone (rental available)',
    'Reeds (provided in starter kit)',
    'Cork grease and cleaning swab',
    'Music stand (recommended)',
  ],
  curriculum: [
    wk(1, 'Introduction to Music Theory', ['Basic note values, staff, clefs, rhythm, and simple notation.']),
    wk(2, 'Parts of the Saxophone', ['Identification of saxophone parts, functions, care, and key recognition.']),
    wk(3, 'Introduction to Scales', ['Understanding major scales and their practical application.']),
    wk(4, 'Embouchure & Sound Production', ['Developing proper embouchure and tone control using major scales.']),
    wk(5, 'Scale Fragmentation & Patterns (Major Scales)', ['Breaking scales into patterns to improve fingering and fluency.']),
    wk(6, 'Introduction to the Chromatic Scale', ['Understanding and practicing the full range of the saxophone.']),
    wk(7, 'Scale Patterns (Major & Chromatic)', ['Applying patterns using both major and chromatic scales.']),
    wk(8, 'Introduction to Phrases and Licks', ['Basic musical phrasing and simple licks for expression.']),
    wk(9, 'Application of Phrases & Licks', ['Using phrases and licks in simple songs.']),
    wk(10, 'Application of Scale Patterns', ['Integrating scale patterns into short musical pieces.']),
    wk(11, 'Introduction to Articulation', ['Understanding articulation styles (legato, staccato, etc.).']),
    wk(12, 'Articulation Techniques (Tonguing)', ['Developing tonguing technique for clarity and precision.']),
  ],
}

const saxophoneIntermediate: CourseInput = {
  id: 'saxophone-intermediate',
  title: 'Saxophone for Intermediate Students',
  instrument: 'Saxophone',
  level: 'Intermediate',
  description:
    'A 12-week intermediate saxophone program advancing scale patterns, improvisation, articulation, dynamics, and full-song performance across all 12 keys.',
  outcomes: [
    'Master advanced scale patterns',
    'Approach and develop improvisation over songs',
    'Control dynamics and articulation',
    'Perform fluently across all 12 keys',
  ],
  equipment: [
    'Alto or tenor saxophone (rental available)',
    'Reeds (provided in starter kit)',
    'Cork grease and cleaning swab',
    'Music stand (recommended)',
  ],
  curriculum: [
    wk(1, 'Scale Work & Patterns', ["Advanced scale practice using patterns based on the student's current scale knowledge."]),
    wk(2, 'Application of Phrases & Licks', ['Understanding and applying musical phrases and licks in songs with a professional approach.']),
    wk(3, 'Introduction to Improvisation', ['Techniques for approaching and developing improvisation on songs.']),
    wk(4, 'Articulation Techniques', ['Focus on tonguing and slurring techniques.']),
    wk(5, 'Application of Articulation', ['Practical use of different tonguing styles and slurring in musical pieces.']),
    wk(6, 'Dynamics in Music', ['Understanding volume control, expression, and musical dynamics.']),
    wk(7, 'Octave Control & Sound Management', ['Improving tone consistency across octaves and overall sound quality.']),
    wk(8, 'Introduction to Advanced Techniques', ['Overview of essential saxophone techniques (e.g., vibrato, bends, etc.).']),
    wk(9, 'Technique Mastery & Application', ['Applying learned techniques in exercises and musical contexts.']),
    wk(10, 'All 12 Keys Practice', ['Developing fluency in all 12 keys.']),
    wk(11, 'Speed & Technical Accuracy', ['Improving speed, precision, and finger agility across all keys.']),
    wk(12, 'Performance & Song Execution', ['Scoring, interpreting, and performing a complete song using learned techniques.']),
  ],
}

const violinBeginner: CourseInput = {
  id: 'violin-beginner',
  title: 'Violin for Beginners',
  instrument: 'Violin',
  level: 'Beginner',
  description:
    'A 12-week beginner violin program. Goal: build a solid foundation in posture, tone production, note reading, and simple song performance.',
  outcomes: [
    'Hold the violin and bow with proper posture',
    'Produce a clean tone on all strings',
    'Read treble-clef notation',
    'Perform simple complete pieces',
  ],
  equipment: [
    'Violin and bow (rental available)',
    'Rosin',
    'Shoulder rest',
    'Music stand (recommended)',
  ],
  curriculum: [
    wk(1, 'Introduction & Setup',
      ['Parts of the violin and bow', 'Proper posture (standing/sitting)', 'How to hold the violin and bow'],
      ['Practice Goal: Proper posture and correct bow/violin handling']),
    wk(2, 'Sound Production',
      ['Bowing on open strings (A & D)', 'Rhythm basics (whole notes, half notes)'],
      ['Practice Goal: Clean tone on open strings and basic rhythm counting', 'Song: Simple open string patterns']),
    wk(3, 'First Notes & Rhythm',
      ['Left-hand setup (finger placement)', 'Notes on A string (B, C#, D)', 'Introduction to quarter notes', 'Basic bowing (down-bow & up-bow)'],
      ['Practice Goal: Finger accuracy and steady rhythm']),
    wk(4, 'Playing Simple Tunes',
      ['Applying notes to simple melodies'],
      ['Song: Mary Had a Little Lamb', 'Practice Goal: Correct intonation and steady rhythm']),
    wk(5, 'Expanding Notes',
      ['Fingers 1, 2, and 3 on A and D strings', 'Notes on D string (E, F#, G)', 'Introduction to string crossing (A ↔️ D)'],
      ['Practice Goal: Smooth string crossing']),
    wk(6, 'String Crossing & Slurs',
      ['Introduction to slurs (2 notes per bow)'],
      ['Song: Twinkle Twinkle Little Star', 'Practice Goal: Smooth bowing and controlled string crossing']),
    wk(7, 'Scales & Coordination',
      ['D Major scale (1 octave)', 'Bow distribution (long vs short bows using crotchets and quavers)'],
      ['Practice Goal: Coordination between both hands']),
    wk(8, 'Introduction to Dynamics',
      ['Playing loud and soft (dynamics)'],
      ['Song: Ode to Joy', 'Practice Goal: Control of volume and expression']),
    wk(9, 'Reading & Articulation',
      ['Reading from the staff (treble clef)', 'Articulation (detached vs smooth playing)'],
      ['Practice Goal: Improved reading and articulation']),
    wk(10, 'Phrasing & Expression',
      ['Simple musical phrasing'],
      ['Song: Lightly Row', 'Practice Goal: Expressive playing']),
    wk(11, 'Performance Preparation',
      ['Combining all learned skills', 'Building confidence'],
      ['Mock Performance: Lightly Row', 'Practice Goal: Performance readiness']),
    wk(12, 'Final Performance',
      ['Performance of a complete piece'],
      ['Practice Goal: Confident and accurate performance']),
  ],
}

const violinIntermediate: CourseInput = {
  id: 'violin-intermediate',
  title: 'Violin for Intermediate Students',
  instrument: 'Violin',
  level: 'Intermediate',
  description:
    'A 12-week intermediate violin program developing shifting, articulation, vibrato, double stops, and expressive performance.',
  outcomes: [
    'Shift confidently between positions',
    'Develop a controlled vibrato',
    'Play staccato and martelé articulation',
    'Perform an intermediate piece with expression',
  ],
  equipment: [
    'Violin and bow (rental available)',
    'Rosin',
    'Shoulder rest',
    'Music stand (recommended)',
  ],
  curriculum: [
    wk(1, 'Tone & Technical Reset',
      ['Focus: Posture, tone production, and bow control', 'Scales: G Major (2 octaves)', 'Arpeggios: G Major', 'Technical Work: Long bow exercises (full bow control); Open string tone work', 'Practice Goal: Produce a steady tone with proper bow distribution'],
      ['Étude: Wohlfahrt Op. 45 No. 1', 'Piece: Introduction of an intermediate piece', 'Sight-Reading: Grade 2 level']),
    wk(2, 'Legato & Smooth Playing',
      ['Focus: Bow smoothness and phrasing', 'Scales: D Major (2 octaves)', 'Arpeggios: D Major', 'Technical Work: Slurs (2–4 notes per bow)', 'Practice Goal: Achieve smooth, connected bowing'],
      ['Étude: Wohlfahrt Nos. 2–3', 'Piece: Continue Week 1 piece', 'Sight-Reading: Rhythm-focused exercises']),
    wk(3, 'Introduction to Shifting',
      ['Focus: Position changes', 'Scales: A Major (2 octaves)', 'Technical Work: 1st to 3rd position shifting drills', 'Practice Goal: Accurate and relaxed shifting'],
      ['Étude: Wohlfahrt No. 4', 'Piece: Introduction of shifting passages', 'Sight-Reading: Simple melodies with position awareness']),
    wk(4, 'Shifting Accuracy',
      ['Focus: Intonation in new positions', 'Scales: C Major (2 octaves)', 'Technical Work: Slow shifting with guide fingers', 'Practice Goal: Clean pitch during shifts'],
      ['Étude: Wohlfahrt Nos. 5–6', 'Piece: Continue shifting piece', 'Sight-Reading: Moderate level']),
    wk(5, 'Articulation (Staccato)',
      ['Focus: Clear note separation', 'Scales: A Major (staccato bowing)', 'Technical Work: Staccato bowing exercises', 'Practice Goal: Controlled and clean staccato'],
      ['Étude: Kayser Op. 20 No. 1', 'Piece: Light classical piece', 'Sight-Reading: Short articulated passages']),
    wk(6, 'Bow Control (Martelé)',
      ['Focus: Accented bow strokes', 'Scales: E Major', 'Technical Work: Martelé bowing; String crossing control', 'Practice Goal: Strong and controlled bow articulation'],
      ['Étude: Kayser No. 2', 'Piece: Continue Week 5 piece', 'Sight-Reading: Rhythmic accuracy exercises']),
    wk(7, 'Introduction to Vibrato',
      ['Focus: Expressive technique', 'Scales: G Major (slow practice with vibrato)', 'Technical Work: Wrist/arm vibrato exercises', 'Practice Goal: Develop controlled vibrato motion'],
      ['Étude: Kayser No. 3', 'Piece: Introduction of lyrical piece', 'Sight-Reading: Slow expressive passages']),
    wk(8, 'Vibrato Development',
      ['Focus: Consistency in vibrato', 'Scales: D Major (with vibrato)', 'Technical Work: Vibrato on sustained notes', 'Practice Goal: Even and relaxed vibrato'],
      ['Étude: Kayser No. 4', 'Piece: Continue lyrical piece', 'Sight-Reading: Moderate level']),
    wk(9, 'Introduction to Double Stops',
      ['Focus: Playing two strings simultaneously', 'Scales: B♭ Major', 'Technical Work: Basic thirds and sixths', 'Practice Goal: Balanced tone across strings'],
      ['Étude: Kayser No. 5', 'Piece: Intermediate piece with harmony', 'Sight-Reading: Interval reading']),
    wk(10, 'Rhythm & Coordination',
      ['Focus: Complex rhythms', 'Scales: E♭ Major', 'Technical Work: Syncopation and dotted rhythms', 'Practice Goal: Accurate timing and coordination'],
      ['Étude: Kayser No. 6', 'Piece: Continue Week 9 piece', 'Sight-Reading: Rhythm drills']),
    wk(11, 'Performance Preparation',
      ['Focus: Polishing and refinement', 'Scales: Review all learned scales', 'Technical Work: Targeted practice on challenging passages', 'Practice Goal: Confidence and consistency'],
      ['Étude: Review selected études', 'Piece: Final performance piece', 'Activity: Mock performance']),
    wk(12, 'Final Performance & Evaluation',
      ['Focus: Presentation and mastery', "Scales: Student's choice (best scales)", 'Technical Work: Light review', 'Practice Goal: Musical expression and confidence'],
      ['Piece: Final performance', 'Activity: Performance recording', 'Activity: Instructor feedback']),
  ],
}

const courses: CourseInput[] = [
  saxophoneBeginner,
  saxophoneIntermediate,
  violinBeginner,
  violinIntermediate,
]

async function main() {
  console.log('🎼 Uploading Saxophone & Violin curricula...\n')

  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { id: c.id },
      update: {
        title: c.title,
        description: c.description,
        instrument: c.instrument,
        level: c.level,
        outcomes: c.outcomes,
        equipment: c.equipment,
        isActive: true,
        isPublished: true,
        ...GUITAR_DEFAULTS,
      },
      create: {
        id: c.id,
        title: c.title,
        description: c.description,
        instrument: c.instrument,
        level: c.level,
        outcomes: c.outcomes,
        equipment: c.equipment,
        isActive: true,
        isPublished: true,
        ...GUITAR_DEFAULTS,
      },
    })

    // Replace curriculum wholesale so re-runs stay clean.
    await prisma.curriculumModule.deleteMany({ where: { courseId: course.id } })
    for (const m of c.curriculum) {
      await prisma.curriculumModule.create({
        data: {
          courseId: course.id,
          module: m.module,
          title: m.title,
          weeks: m.weeks,
          outcomes: m.outcomes,
          tasks: m.tasks,
          order: m.module,
        },
      })
    }

    console.log(`✅ ${c.title} (${c.level}) — ${c.curriculum.length} weekly modules`)
  }

  console.log('\n🎉 Upload complete.')
}

main()
  .catch((e) => {
    console.error('❌ Upload failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
