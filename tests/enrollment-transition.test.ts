import { describe, expect, it, vi } from 'vitest'
import { transitionEnrollment } from '../lib/enrollment-transition'
import { InvalidTransitionError } from '../lib/enrollment-status'

const writer = (count: number) => ({ enrollment: { updateMany: vi.fn().mockResolvedValue({ count }) } })

describe('transitionEnrollment (compare-and-set)', () => {
  it('updates only while the row is still in `from`, and reports the win', async () => {
    const tx = writer(1)
    const won = await transitionEnrollment(tx, 'e1', 'pending', 'assessment_paid', { applicationPaid: true })
    expect(won).toBe(true)
    expect(tx.enrollment.updateMany).toHaveBeenCalledWith({
      where: { id: 'e1', status: 'pending' },
      data: { applicationPaid: true, status: 'assessment_paid' },
    })
  })

  it('returns false when another writer already moved the row (idempotent replay)', async () => {
    expect(await transitionEnrollment(writer(0), 'e1', 'pending', 'assessment_paid')).toBe(false)
  })

  it('refuses an illegal edge before touching the database', async () => {
    const tx = writer(1)
    await expect(transitionEnrollment(tx, 'e1', 'pending', 'enrolled')).rejects.toBeInstanceOf(InvalidTransitionError)
    expect(tx.enrollment.updateMany).not.toHaveBeenCalled()
  })

  it('lets the guard status win over a status passed in data', async () => {
    const tx = writer(1)
    await transitionEnrollment(tx, 'e1', 'plan_agreed', 'enrolled', { status: 'cancelled' } as any)
    expect(tx.enrollment.updateMany.mock.calls[0][0].data.status).toBe('enrolled')
  })
})
