/**
 * Link the registering student to a Parent and audit it. Shared by the public enrolment route and the
 * admin walk-in. Best-effort by design: the application is already created and the guardian fields are
 * stored on the student, so a failure here is logged and never fails (or leaks anything through) the
 * response; an admin can attach the child from /admin/parents.
 */
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { linkParentToStudent, MAX_PUBLIC_CHILDREN_PER_PARENT, type LinkOutcome } from './parents'
import type { RegistrantResult } from './validate'

type Ok = Extract<RegistrantResult, { ok: true }>

export async function attachGuardian(
  v: Ok,
  studentId: string,
  ctx: { enrollmentId: string; adminId?: string | null; parentId?: string | null },
): Promise<LinkOutcome | null> {
  const admin = Boolean(ctx.adminId)
  try {
    if (!v.guardian) return null
    // Public: only an exact guardian email can create or match a parent (S6-1); no phone-only linking
    // and no admin-picked parent from an unauthenticated request.
    if (!admin && !v.guardian.email) return null
    const result = await linkParentToStudent(prisma, studentId, v.guardian, {
      parentId: admin ? ctx.parentId : null,
      fillBlankPhone: admin,
      maxChildren: admin ? undefined : MAX_PUBLIC_CHILDREN_PER_PARENT,
    })
    if (result.outcome === 'created' || result.outcome === 'linked') {
      await logAdminAction({
        adminId: ctx.adminId ?? null,
        action: result.outcome === 'created' ? 'parent.registration_create' : 'parent.registration_link',
        entityType: 'parent',
        entityId: result.parentId,
        metadata: {
          source: admin ? 'walk_in' : 'public_form',
          studentId,
          enrollmentId: ctx.enrollmentId,
          matchedBy: result.matchedBy,
          filledPhone: result.filledPhone,
          samePhoneParentIds: result.samePhoneParentIds,
        },
      })
    } else if (result.outcome === 'none' && result.reason === 'cap_reached') {
      await logAdminAction({
        action: 'parent.registration_link_refused',
        entityType: 'student',
        entityId: studentId,
        metadata: { reason: 'cap_reached', enrollmentId: ctx.enrollmentId },
      })
    }
    return result
  } catch (error) {
    console.error('Failed to link parent to student:', error)
    return null
  }
}
