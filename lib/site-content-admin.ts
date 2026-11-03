import { NextRequest } from "next/server"

import { logAdminAction } from "@/lib/audit"
import { createErrorResponse, createResponse, withAuth } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"
import {
  applyTestimonialRules,
  parseEventInput,
  parsePartnerInput,
  parseStatInput,
  parseTestimonialInput,
  type ParseMode,
  type ParseResult,
} from "@/lib/site-content"

type Row = { id: string; isPublished: boolean } & Record<string, unknown>
type Ctx = { params: Promise<{ id: string }> }

/** The slice of a Prisma delegate the factory uses. */
interface Delegate {
  findMany(args: unknown): Promise<Row[]>
  findUnique(args: unknown): Promise<Row | null>
  create(args: unknown): Promise<Row>
  update(args: unknown): Promise<Row>
  delete(args: unknown): Promise<Row>
}

interface ContentConfig {
  delegate: Delegate
  /** AuditLog.entityType and the prefix of its action names, e.g. "testimonial". */
  entityType: string
  /** Human label for messages, e.g. "Testimonial". */
  label: string
  /** JSON keys: { testimonials: [...] } / { testimonial: {...} }. */
  listKey: string
  itemKey: string
  orderBy: unknown
  parse: (body: Record<string, unknown>, mode: ParseMode) => ParseResult
  /** Cross-field rules applied after parsing (testimonial consent). */
  rules?: (
    existing: Row | null,
    data: Record<string, unknown>,
  ) => { ok: true; data: Record<string, unknown>; extraAudit?: Record<string, unknown> } | { ok: false; error: string }
}

async function readBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json()
    return body && typeof body === "object" && !Array.isArray(body) ? body : null
  } catch {
    return null
  }
}

/**
 * Builds the admin handlers for one site-content resource: list + create for
 * `route.ts`, get + patch + delete for `[id]/route.ts`. Every mutation writes
 * an AuditLog row; a change to `isPublished` also writes `.publish`/`.unpublish`.
 */
export function createContentHandlers(cfg: ContentConfig) {
  const { delegate, entityType, label } = cfg

  const list = withAuth(async () => {
    try {
      const rows = await delegate.findMany({ orderBy: cfg.orderBy })
      return createResponse({ [cfg.listKey]: rows })
    } catch (error) {
      console.error(`List ${entityType} error:`, error)
      return createErrorResponse(`Failed to fetch ${cfg.listKey}`, 500)
    }
  })

  const create = withAuth(async (req: NextRequest, admin) => {
    try {
      const body = await readBody(req)
      if (!body) return createErrorResponse("Request body must be a JSON object", 400)

      const parsed = cfg.parse(body, "create")
      if (!parsed.ok) return createErrorResponse(parsed.error, 400)

      let data = parsed.data
      let extraAudit: Record<string, unknown> | undefined
      if (cfg.rules) {
        const ruled = cfg.rules(null, data)
        if (!ruled.ok) return createErrorResponse(ruled.error, 400)
        data = ruled.data
        extraAudit = ruled.extraAudit
      }

      const row = await delegate.create({ data })
      await logAdminAction({
        adminId: admin.id,
        action: `${entityType}.create`,
        entityType,
        entityId: row.id,
        metadata: { isPublished: row.isPublished, ...extraAudit },
      })
      if (row.isPublished) {
        await logAdminAction({ adminId: admin.id, action: `${entityType}.publish`, entityType, entityId: row.id })
      }
      return createResponse({ [cfg.itemKey]: row, message: `${label} created` }, 201)
    } catch (error) {
      console.error(`Create ${entityType} error:`, error)
      return createErrorResponse(`Failed to create ${label.toLowerCase()}`, 500)
    }
  })

  const get = withAuth(async (_req: NextRequest, _admin, context: Ctx) => {
    try {
      const { id } = await context.params
      const row = await delegate.findUnique({ where: { id } })
      if (!row) return createErrorResponse(`${label} not found`, 404)
      return createResponse({ [cfg.itemKey]: row })
    } catch (error) {
      console.error(`Get ${entityType} error:`, error)
      return createErrorResponse(`Failed to fetch ${label.toLowerCase()}`, 500)
    }
  })

  const patch = withAuth(async (req: NextRequest, admin, context: Ctx) => {
    try {
      const { id } = await context.params
      const body = await readBody(req)
      if (!body) return createErrorResponse("Request body must be a JSON object", 400)

      const existing = await delegate.findUnique({ where: { id } })
      if (!existing) return createErrorResponse(`${label} not found`, 404)

      const parsed = cfg.parse(body, "update")
      if (!parsed.ok) return createErrorResponse(parsed.error, 400)

      let data = parsed.data
      let extraAudit: Record<string, unknown> | undefined
      if (cfg.rules) {
        const ruled = cfg.rules(existing, data)
        if (!ruled.ok) return createErrorResponse(ruled.error, 400)
        data = ruled.data
        extraAudit = ruled.extraAudit
      }

      const row = await delegate.update({ where: { id }, data })
      await logAdminAction({
        adminId: admin.id,
        action: `${entityType}.update`,
        entityType,
        entityId: id,
        metadata: { fields: Object.keys(data), ...extraAudit },
      })
      if (existing.isPublished !== row.isPublished) {
        await logAdminAction({
          adminId: admin.id,
          action: `${entityType}.${row.isPublished ? "publish" : "unpublish"}`,
          entityType,
          entityId: id,
        })
      }
      return createResponse({ [cfg.itemKey]: row, message: `${label} updated` })
    } catch (error) {
      console.error(`Update ${entityType} error:`, error)
      return createErrorResponse(`Failed to update ${label.toLowerCase()}`, 500)
    }
  })

  const remove = withAuth(async (_req: NextRequest, admin, context: Ctx) => {
    try {
      const { id } = await context.params
      const existing = await delegate.findUnique({ where: { id } })
      if (!existing) return createErrorResponse(`${label} not found`, 404)

      await delegate.delete({ where: { id } })
      await logAdminAction({
        adminId: admin.id,
        action: `${entityType}.delete`,
        entityType,
        entityId: id,
        metadata: { wasPublished: existing.isPublished },
      })
      return createResponse({ message: `${label} deleted` })
    } catch (error) {
      console.error(`Delete ${entityType} error:`, error)
      return createErrorResponse(`Failed to delete ${label.toLowerCase()}`, 500)
    }
  })

  return { list, create, get, patch, remove }
}

// Prisma's generated delegates are structurally compatible with `Delegate` but
// their argument types are far narrower, so each is cast once here.
const asDelegate = (d: unknown) => d as Delegate

export const testimonialHandlers = createContentHandlers({
  delegate: asDelegate(prisma.testimonial),
  entityType: "testimonial",
  label: "Testimonial",
  listKey: "testimonials",
  itemKey: "testimonial",
  orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  parse: parseTestimonialInput,
  rules: (existing, data) => {
    const r = applyTestimonialRules(
      existing as { permissionToPublish: boolean; isPublished: boolean } | null,
      data,
    )
    return r.ok
      ? { ok: true, data: r.data, extraAudit: r.unpublishedForConsent ? { unpublishedForConsent: true } : undefined }
      : r
  },
})

export const partnerHandlers = createContentHandlers({
  delegate: asDelegate(prisma.trustedPartner),
  entityType: "trusted_partner",
  label: "Partner",
  listKey: "partners",
  itemKey: "partner",
  orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  parse: parsePartnerInput,
})

export const eventHandlers = createContentHandlers({
  delegate: asDelegate(prisma.siteEvent),
  entityType: "site_event",
  label: "Event",
  listKey: "events",
  itemKey: "event",
  orderBy: { startsAt: "desc" },
  parse: parseEventInput,
})

export const statHandlers = createContentHandlers({
  delegate: asDelegate(prisma.siteStat),
  entityType: "site_stat",
  label: "Stat",
  listKey: "stats",
  itemKey: "stat",
  orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  parse: parseStatInput,
})
