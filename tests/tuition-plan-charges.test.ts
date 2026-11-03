import { describe, expect, it } from 'vitest'
import { buildPlanCharges, classesDescription, topUpRate, type PlanMaterial } from '../lib/tuition-plan-charges'

const mat = (id: string, price: number, required: boolean, isActive = true): PlanMaterial => ({ id, name: `Book ${id}`, price, required, isActive })
const base = { plannedClasses: 8, ratePerClass: 4000, durationMins: 60, optionalMaterialIds: [] as string[] }

describe('buildPlanCharges', () => {
  it('CLASSES line = plannedClasses x rate snapshot', () => {
    const r = buildPlanCharges({ ...base, materials: [] })
    expect(r).toEqual({ ok: true, lines: [{ kind: 'CLASSES', quantity: 8, unitPrice: 4000, description: '8 x 60-minute classes' }] })
  })
  it('adds every required active material, snapshotting name and price', () => {
    const r = buildPlanCharges({ ...base, materials: [mat('a', 3000, true), mat('b', 500, false), mat('c', 900, true, false)] })
    expect(r.ok && r.lines.map((l) => [l.kind, l.unitPrice, l.materialId])).toEqual([
      ['CLASSES', 4000, undefined],
      ['MATERIAL', 3000, 'a'],
    ])
  })
  it('adds optional materials only when chosen', () => {
    const r = buildPlanCharges({ ...base, materials: [mat('a', 3000, true), mat('b', 500, false)], optionalMaterialIds: ['b'] })
    expect(r.ok && r.lines.map((l) => l.materialId)).toEqual([undefined, 'a', 'b'])
  })
  it('choosing a required material does not duplicate it', () => {
    const r = buildPlanCharges({ ...base, materials: [mat('a', 3000, true)], optionalMaterialIds: ['a'] })
    expect(r.ok && r.lines.filter((l) => l.materialId === 'a')).toHaveLength(1)
  })
  it('rejects an unknown or inactive chosen material', () => {
    expect(buildPlanCharges({ ...base, materials: [mat('a', 1, false)], optionalMaterialIds: ['zzz'] }).ok).toBe(false)
    expect(buildPlanCharges({ ...base, materials: [mat('a', 1, false, false)], optionalMaterialIds: ['a'] }).ok).toBe(false)
  })
  it('a zero-priced required material is still listed', () => {
    const r = buildPlanCharges({ ...base, materials: [mat('a', 0, true)] })
    expect(r.ok && r.lines[1].unitPrice).toBe(0)
  })
})

describe('classesDescription / topUpRate', () => {
  it('wording with and without a duration', () => {
    expect(classesDescription(4, 45)).toBe('4 x 45-minute classes')
    expect(classesDescription(4, null)).toBe('4 classes')
  })
  it('top-up resolves the current rate for the duration, null when it cannot', () => {
    const rates = [{ durationMins: 45, pricePerClass: 4500 }, { durationMins: 60, pricePerClass: 6000 }]
    expect(topUpRate(rates, 60)).toBe(6000)
    expect(topUpRate(rates, 30)).toBeNull()
    expect(topUpRate(rates, null)).toBeNull()
    expect(topUpRate(null, 60)).toBeNull()
  })
})
