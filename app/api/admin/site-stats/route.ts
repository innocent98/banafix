import { statHandlers } from '@/lib/site-content-admin'

// GET list (all rows, including unpublished) / POST create
export const GET = statHandlers.list
export const POST = statHandlers.create
