import { partnerHandlers } from '@/lib/site-content-admin'

// GET list (all rows, including unpublished) / POST create
export const GET = partnerHandlers.list
export const POST = partnerHandlers.create
