import { resolveRate, type Rate } from './offering-rates'

/**
 * The charge lines created when a plan is agreed (T3, T6): the CLASSES charge from the rate
 * snapshot, every required active material, and the optional active materials the admin picked.
 * Prices are snapshotted from the Material at this moment.
 */
export interface PlanMaterial {
  id: string
  name: string
  price: number
  required: boolean
  isActive: boolean
}

export interface PlanChargeLine {
  kind: 'CLASSES' | 'MATERIAL'
  quantity: number
  unitPrice: number
  description: string
  materialId?: string
}

export type PlanChargesResult = { ok: true; lines: PlanChargeLine[] } | { ok: false; error: string }

export function classesDescription(quantity: number, durationMins: number | null | undefined): string {
  return durationMins ? `${quantity} x ${durationMins}-minute classes` : `${quantity} classes`
}

export function buildPlanCharges(input: {
  plannedClasses: number
  ratePerClass: number
  durationMins: number
  materials: PlanMaterial[]
  optionalMaterialIds: string[]
}): PlanChargesResult {
  const { plannedClasses, ratePerClass, durationMins, materials, optionalMaterialIds } = input
  const byId = new Map(materials.map((m) => [m.id, m]))
  for (const id of optionalMaterialIds) {
    const m = byId.get(id)
    if (!m || !m.isActive) return { ok: false, error: 'materialIds must be active materials of this course' }
  }
  const chosen = new Set(optionalMaterialIds)
  const lines: PlanChargeLine[] = [
    { kind: 'CLASSES', quantity: plannedClasses, unitPrice: ratePerClass, description: classesDescription(plannedClasses, durationMins) },
  ]
  for (const m of materials) {
    if (!m.isActive) continue
    if (m.required || chosen.has(m.id)) {
      lines.push({ kind: 'MATERIAL', quantity: 1, unitPrice: m.price, description: m.name, materialId: m.id })
    }
  }
  return { ok: true, lines }
}

/** Rate for a top-up (T5): today's rate for the enrollment's duration; null when it cannot be resolved. */
export function topUpRate(rates: Rate[] | null | undefined, durationMins: number | null | undefined): number | null {
  if (!rates || durationMins == null) return null
  return resolveRate(rates, durationMins)
}
