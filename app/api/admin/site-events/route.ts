import { eventHandlers } from '@/lib/site-content-admin'

// GET list (all rows, including unpublished) / POST create
export const GET = eventHandlers.list
export const POST = eventHandlers.create
