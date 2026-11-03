import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { EVENTS, isTemplateKey } from '@/lib/messaging/events'
import { getTemplate, resetTemplate, saveTemplate } from '@/lib/messaging/templates'
import { validateTemplate } from '@/lib/messaging/template'
import { parseChannels } from '@/lib/messaging/admin-input'

type Ctx = { params: Promise<{ key: string }> }

export const GET = withAuth(async (_req: NextRequest, _admin, context: Ctx) => {
  const { key } = await context.params
  if (!isTemplateKey(key)) return createErrorResponse('Template not found', 404)
  return createResponse({ template: { ...(await getTemplate(prisma, key)), fields: EVENTS[key].fields } })
})

// PUT /api/admin/templates/[key] { channels, subject, body, shortBody?, isActive } — save (merge fields validated)
export const PUT = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { key } = await context.params
    if (!isTemplateKey(key)) return createErrorResponse('Template not found', 404)
    const body = await req.json().catch(() => ({}))
    const channels = parseChannels(body.channels, { allowEmpty: true })
    if (!channels) return createErrorResponse('channels must be a list of EMAIL, SMS, WHATSAPP', 400)
    if (typeof body.subject !== 'string' || !body.subject.trim()) return createErrorResponse('Subject is required', 400)
    if (typeof body.body !== 'string' || !body.body.trim()) return createErrorResponse('Message body is required', 400)
    const shortBody = typeof body.shortBody === 'string' ? body.shortBody : null
    const check = validateTemplate(key, { subject: body.subject, body: body.body, shortBody })
    if (!check.ok) {
      return createErrorResponse(
        `Unknown merge field${check.unknown.length > 1 ? 's' : ''}: ${check.unknown.map((f) => `{{${f}}}`).join(', ')}. Allowed: ${EVENTS[key].fields.map((f) => `{{${f}}}`).join(', ')}`,
        400,
      )
    }
    const before = await getTemplate(prisma, key)
    const template = await saveTemplate(prisma, key, {
      channels, subject: body.subject, body: body.body, shortBody, isActive: body.isActive !== false,
    })
    await logAdminAction({
      adminId: admin.id,
      action: 'template.update',
      entityType: 'template',
      entityId: key,
      metadata: { before: { channels: before.channels, subject: before.subject, isActive: before.isActive }, after: { channels: template.channels, subject: template.subject, isActive: template.isActive } },
    })
    return createResponse({ template: { ...template, fields: EVENTS[key].fields } })
  } catch (error) {
    console.error('Save template error:', error)
    return createErrorResponse('Failed to save template', 500)
  }
})

// DELETE /api/admin/templates/[key] — reset to the code default
export const DELETE = withAuth(async (_req: NextRequest, admin, context: Ctx) => {
  try {
    const { key } = await context.params
    if (!isTemplateKey(key)) return createErrorResponse('Template not found', 404)
    const template = await resetTemplate(prisma, key)
    await logAdminAction({ adminId: admin.id, action: 'template.reset', entityType: 'template', entityId: key })
    return createResponse({ template: { ...template, fields: EVENTS[key].fields } })
  } catch (error) {
    console.error('Reset template error:', error)
    return createErrorResponse('Failed to reset template', 500)
  }
})
