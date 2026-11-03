import { describe, it, expect, vi, beforeAll } from 'vitest'
import { generateTuitionReceiptPDF, type TuitionReceiptData } from '@/lib/receipt'

let generateTuitionEmailHTML: (data: TuitionReceiptData) => string

beforeAll(async () => {
  // lib/email.ts constructs a Resend client at import time, which needs a key.
  vi.stubEnv('RESEND_API_KEY', 're_test_placeholder')
  ;({ generateTuitionEmailHTML } = await import('@/lib/email'))
})

function baseData(overrides: Partial<TuitionReceiptData> = {}): TuitionReceiptData {
  return {
    receiptNumber: 'TUI-TEST-0001',
    enrollment: { id: 'enr_placeholder12345678', firstName: 'Ada', lastName: 'Test', email: 'ada@example.test' },
    course: { title: 'Piano Basics', instrument: 'Piano', level: 'Beginner' },
    payment: { amount: 30000, paidAt: '2026-11-03T10:00:00.000Z', paymentMethod: 'cash', description: 'Part one' },
    totalPaid: 30000,
    remainingBalance: 20000,
    paymentType: 'partial',
    ...overrides,
  }
}

function ledgerData(lineCount = 2, overrides: Partial<TuitionReceiptData> = {}): TuitionReceiptData {
  const lines = Array.from({ length: lineCount }, (_, i) =>
    i === 0
      ? { kind: 'CLASSES' as const, description: '8 x 60-minute classes', quantity: 8, unitPrice: 5000, amount: 40000 }
      : { kind: 'MATERIAL' as const, description: `Material ${i}`, quantity: 1, unitPrice: 10000, amount: 10000 }
  )
  const totalCharged = lines.reduce((s, l) => s + l.amount, 0)
  return baseData({
    ledger: {
      lines,
      materialsTotal: totalCharged - 40000,
      totalCharged,
      classesPurchased: 8,
      classesCovered: 6,
      credit: 0,
    },
    ...overrides,
  })
}

function pageCount(pdf: Buffer): number {
  const text = pdf.toString('latin1')
  const pages = (text.match(/\/Type\s*\/Page(?![s\w])/g) || []).length
  return pages
}

describe('tuition receipt PDF', () => {
  it('renders a ledger receipt as a PDF', () => {
    const pdf = generateTuitionReceiptPDF(ledgerData())
    expect(Buffer.isBuffer(pdf)).toBe(true)
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    expect(pdf.length).toBeGreaterThan(1000)
  })

  it('renders a legacy receipt as a PDF', () => {
    const pdf = generateTuitionReceiptPDF(baseData())
    expect(Buffer.isBuffer(pdf)).toBe(true)
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    expect(pageCount(pdf)).toBe(1)
  })

  it('adds pages for a long ledger instead of overflowing', () => {
    const pdf = generateTuitionReceiptPDF(ledgerData(40))
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    expect(pageCount(pdf)).toBeGreaterThan(1)
  })
})

describe('tuition receipt email', () => {
  it('renders per-class content for ledger data', () => {
    const html = generateTuitionEmailHTML(ledgerData())
    expect(html).toContain('Classes covered')
    expect(html).toContain('6 of 8')
    expect(html).toContain('₦30,000')
    expect(html).toContain('₦50,000')
    expect(html).toContain('₦20,000')
    expect(html).toContain('8 x 60-minute classes')
    expect(html).toContain('Part payment')
  })

  it('says Paid in full when the ledger balance is cleared', () => {
    const html = generateTuitionEmailHTML(ledgerData(2, { paymentType: 'completed', remainingBalance: 0 }))
    expect(html).toContain('Paid in full')
  })

  it('escapes interpolated strings', () => {
    const html = generateTuitionEmailHTML(
      ledgerData(2, { enrollment: { id: 'x', firstName: '<script>', lastName: 'Test', email: 'a@b.test' } })
    )
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('keeps the legacy template for payloads without a ledger', () => {
    const html = generateTuitionEmailHTML(baseData())
    expect(html).toContain('Remaining Balance')
    expect(html).not.toContain('Classes covered')
  })
})
