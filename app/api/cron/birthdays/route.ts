import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { sendBirthdayEmail } from '@/lib/email'
import { logAdminAction } from '@/lib/audit'
import { collectBirthdayRecipients, todayInLagos } from '@/lib/birthdays'

export const dynamic = 'force-dynamic'

// GET /api/cron/birthdays — daily Vercel Cron; guarded by CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return createErrorResponse('CRON_SECRET not configured', 500)
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return createErrorResponse('Unauthorized', 401)
  }

  try {
    const { month, day, year } = todayInLagos()
    const recipients = await collectBirthdayRecipients(month, day, year)

    let sent = 0
    let failed = 0
    for (const r of recipients) {
      const ok = await sendBirthdayEmail({ name: r.name, email: r.email, type: r.type })
      if (ok) {
        // Log ONLY successful sends so a failed send retries on the next run.
        try {
          await prisma.birthdayEmailLog.create({
            data: { recipientType: r.type, recipientId: r.id, year, email: r.email },
          })
        } catch {
          // unique (type,id,year) race — already logged; ignore.
        }
        sent++
      } else {
        failed++
      }
    }

    await logAdminAction({
      adminId: null,
      action: 'birthday.run',
      entityType: 'birthday',
      entityId: `${year}-${month}-${day}`,
      metadata: { candidates: recipients.length, sent, failed },
    })

    return createResponse({
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      candidates: recipients.length,
      sent,
      failed,
    })
  } catch (error) {
    console.error('Birthday cron error:', error)
    return createErrorResponse('Birthday cron failed', 500)
  }
}
