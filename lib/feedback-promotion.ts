/**
 * Promote feedback to a testimonial: ISOLATED on purpose.
 *
 * The `Testimonial` model belongs to Stream 8 (PR #11, branch `feature/site-content-admin`) and is NOT in
 * this branch's schema, so it is not recreated here. `toTestimonialInput` already produces the exact create
 * payload for that model's shape (`name, role, quote, permissionToPublish, isPublished`). The only thing
 * left once #11 is in the base is to implement `createTestimonial` below.
 *
 * TODO(stream-8): replace the body of `createTestimonial` with
 *   `const t = await prisma.testimonial.create({ data: input }); return t.id`
 * and delete the `NotAvailableError` branch in app/api/admin/feedback/[id]/promote/route.ts.
 */
export interface TestimonialInput {
  name: string
  role: string | null
  quote: string
  permissionToPublish: true
  isPublished: false
}

export class TestimonialsNotAvailableError extends Error {
  constructor() {
    super('Testimonials are not available yet: the Testimonial model ships with the site-content stream.')
    this.name = 'TestimonialsNotAvailableError'
  }
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

/** Creates the unpublished Testimonial and returns its id. Stub until Stream 8's model is in the base. */
export async function createTestimonial(_input: TestimonialInput): Promise<string> {
  throw new TestimonialsNotAvailableError()
}
