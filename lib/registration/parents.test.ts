import { describe, expect, it } from 'vitest'
import { linkParentToStudent, type ParentDb } from './parents'

type P = { id: string; email: string; phone: string | null; name: string; children: string[] }

/** Minimal in-memory stand-in for the slice of Prisma that linkParentToStudent touches. */
function fakeDb(parents: P[]) {
  const calls = { create: 0, update: [] as unknown[] }
  const db = {
    $queryRaw: async (_s: unknown, key: string) =>
      parents.filter((p) => p.phone && p.phone.replace(/\D/g, '').slice(-10) === key).map((p) => ({ id: p.id })),
    parent: {
      findUnique: async ({ where, select }: any) => {
        const p = where.id ? parents.find((x) => x.id === where.id) : parents.find((x) => x.email === where.email)
        if (!p) return null
        return { ...p, _count: { children: p.children.length } }
      },
      findFirst: async ({ where }: any) => {
        const p = parents.find((x) => x.id === where.id)
        return p && p.children.includes(where.children.some.id) ? { id: p.id } : null
      },
      update: async ({ where, data }: any) => {
        calls.update.push(data)
        const p = parents.find((x) => x.id === where.id)!
        if (data.children?.connect && !p.children.includes(data.children.connect.id)) p.children.push(data.children.connect.id)
        if (data.phone) p.phone = data.phone
        return p
      },
      create: async ({ data }: any) => {
        calls.create++
        if (parents.some((x) => x.email === data.email)) throw Object.assign(new Error('dup'), { code: 'P2002' })
        const p = { id: `p${parents.length + 1}`, name: data.name, email: data.email, phone: data.phone, children: [data.children.connect.id] }
        parents.push(p)
        return { id: p.id }
      },
    },
  }
  return { db: db as unknown as ParentDb, calls, parents }
}

const mum = (over: Partial<P> = {}): P => ({ id: 'p1', email: 'mum@x.com', phone: '0903 856 3822', name: 'Mum', children: ['c1'], ...over })

describe('linkParentToStudent', () => {
  it('links a second child to the parent matched by email, changing nothing on the parent', async () => {
    const { db, parents } = fakeDb([mum()])
    const r = await linkParentToStudent(db, 'c2', { name: 'Someone Else', email: 'MUM@x.com', phone: '0800 000 0000' })
    expect(r).toMatchObject({ outcome: 'linked', parentId: 'p1', matchedBy: 'email', filledPhone: false })
    expect(parents[0]).toMatchObject({ name: 'Mum', phone: '0903 856 3822', children: ['c1', 'c2'] })
  })
  it('is idempotent', async () => {
    const { db } = fakeDb([mum()])
    expect(await linkParentToStudent(db, 'c1', { name: 'Mum', email: 'mum@x.com', phone: null })).toMatchObject({ outcome: 'already_linked' })
  })
  it('creates a parent when the email is unknown', async () => {
    const { db, parents } = fakeDb([mum()])
    const r = await linkParentToStudent(db, 'c9', { name: 'Dad', email: 'dad@x.com', phone: null })
    expect(r).toMatchObject({ outcome: 'created', matchedBy: 'new' })
    expect(parents).toHaveLength(2)
  })
  it('does NOT link on a shared phone when an email was given (different email = different person); flags it', async () => {
    const { db, parents } = fakeDb([mum()])
    const r = await linkParentToStudent(db, 'c9', { name: 'Dad', email: 'dad@x.com', phone: '+234 903 856 3822' })
    expect(r).toMatchObject({ outcome: 'created', samePhoneParentIds: ['p1'] })
    expect(parents[0].children).toEqual(['c1'])
  })
  it('phone fallback only when no email, only when exactly one parent has it', async () => {
    const one = fakeDb([mum()])
    expect(await linkParentToStudent(one.db, 'c2', { name: 'Mum', email: null, phone: '2349038563822' })).toMatchObject({ outcome: 'linked', matchedBy: 'phone' })
    const two = fakeDb([mum(), mum({ id: 'p2', email: 'dad@x.com' })])
    expect(await linkParentToStudent(two.db, 'c2', { name: 'Mum', email: null, phone: '09038563822' })).toMatchObject({ outcome: 'none', reason: 'no_email_no_unique_phone', samePhoneParentIds: ['p1', 'p2'] })
    expect(two.calls.create).toBe(0)
  })
  it('never matches on name alone', async () => {
    const { db, parents } = fakeDb([mum()])
    await linkParentToStudent(db, 'c2', { name: 'Mum', email: 'other@x.com', phone: null })
    expect(parents[0].children).toEqual(['c1'])
    expect(parents).toHaveLength(2)
  })
  it('admin may fill a BLANK phone but never overwrite one', async () => {
    const blank = fakeDb([mum({ phone: null })])
    const a = await linkParentToStudent(blank.db, 'c2', { name: 'Mum', email: 'mum@x.com', phone: '0801 111 2222' }, { fillBlankPhone: true })
    expect(a).toMatchObject({ outcome: 'linked', filledPhone: true })
    expect(blank.parents[0].phone).toBe('0801 111 2222')
    const set = fakeDb([mum()])
    const b = await linkParentToStudent(set.db, 'c2', { name: 'Mum', email: 'mum@x.com', phone: '0801 111 2222' }, { fillBlankPhone: true })
    expect(b).toMatchObject({ filledPhone: false })
    expect(set.parents[0].phone).toBe('0903 856 3822')
  })
  it('an explicitly picked parent wins over matching and must exist', async () => {
    const { db, parents } = fakeDb([mum(), mum({ id: 'p2', email: 'dad@x.com', phone: null })])
    expect(await linkParentToStudent(db, 'c2', { name: 'x', email: 'mum@x.com', phone: null }, { parentId: 'p2' })).toMatchObject({ outcome: 'linked', parentId: 'p2' })
    expect(parents[0].children).toEqual(['c1'])
    expect(await linkParentToStudent(db, 'c2', { name: 'x', email: null, phone: null }, { parentId: 'gone' })).toMatchObject({ outcome: 'none', reason: 'parent_not_found' })
  })
  it('refuses past the public child cap and does not link', async () => {
    const { db, parents } = fakeDb([mum({ children: ['a', 'b', 'c'] })])
    const r = await linkParentToStudent(db, 'z', { name: 'Mum', email: 'mum@x.com', phone: null }, { maxChildren: 3 })
    expect(r).toMatchObject({ outcome: 'none', reason: 'cap_reached' })
    expect(parents[0].children).toHaveLength(3)
  })
  it('a lost creation race links to the winner', async () => {
    const { db, parents } = fakeDb([])
    const realFind = (db as any).parent.findUnique
    let first = true
    ;(db as any).parent.findUnique = async (a: any) => {
      if (first && a.where.email) { first = false; parents.push(mum({ children: [] })); return null }
      return realFind(a)
    }
    const r = await linkParentToStudent(db, 'c2', { name: 'Mum', email: 'mum@x.com', phone: null })
    expect(r).toMatchObject({ outcome: 'linked', parentId: 'p1' })
  })
})
