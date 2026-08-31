import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { logAdminAction } from '../lib/audit'

async function main() {
  await logAdminAction({ adminId: null, action: 'test.system', entityType: 'test', entityId: 't1', metadata: { ok: true } })
  const row = await prisma.auditLog.findFirst({ where: { entityId: 't1' }, orderBy: { createdAt: 'desc' } })
  console.log(row?.action === 'test.system' && row?.adminId === null ? '✅ audit write ok' : '❌ audit write failed', row)
  process.exit(row ? 0 : 1)
}
main()
