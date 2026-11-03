import { testimonialHandlers } from '@/lib/site-content-admin'

// GET list (all rows, including unpublished) / POST create
export const GET = testimonialHandlers.list
export const POST = testimonialHandlers.create
