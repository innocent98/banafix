import { prisma } from './prisma'

export interface AuditEntry {
  adminId?: string | null
  action: string
  entityType: string
  entityId: string
  metadata?: unknown
}

/** Best-effort admin/system activity log. Never throws into a request path. */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: entry.adminId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata as any,
      },
    })
  } catch (error) {
    console.error('Failed to write audit log:', entry.action, error)
  }
}
