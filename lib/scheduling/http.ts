import { NextResponse } from 'next/server'
import { SchedulingError } from './service'

/** Scheduling failures keep their status and a stable `code` the UI can switch on; anything else is a 500. */
export function schedulingErrorResponse(e: unknown, fallback: string): NextResponse {
  if (e instanceof SchedulingError) {
    return NextResponse.json({ error: e.message, code: e.code, ...(e.details !== undefined ? { details: e.details } : {}) }, { status: e.status })
  }
  console.error(fallback, e)
  return NextResponse.json({ error: fallback, code: 'INTERNAL' }, { status: 500 })
}
