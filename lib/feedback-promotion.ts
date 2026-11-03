import { prisma } from '@/lib/prisma'

/**
 * Promote feedback to a testimonial. `toTestimonialInput` is the pure mapping (needs the author's permission,
 * always UNPUBLISHED: a person still reviews it in /admin/testimonials); `createTestimonial` writes it.
 */
export interface TestimonialInput {
  name: string
  role: string | null
  quote: string
  permissionToPublish: true
  isPublished: false
}

/** Pure mapping. Needs the author's permission; always UNPUBLISHED (a person still reviews it on the testimonials page). */
export function toTestimonialInput(f: {
  authorName: string
  relationship: string | null
  text: string
  allowTestimonial: boolean
}): TestimonialInput {
  if (!f.allowTestimonial) throw new Error('No permission to quote this feedback as a testimonial.')
  return {
    name: f.authorName,
    role: f.relationship?.trim() ? f.relationship.trim() : null,
    quote: f.text,
    permissionToPublish: true,
    isPublished: false,
  }
}

/** Creates the unpublished Testimonial (Stream 8 model) and returns its id. */
export async function createTestimonial(input: TestimonialInput): Promise<string> {
  const t = await prisma.testimonial.create({ data: input, select: { id: true } })
  return t.id
}
