import { describe, expect, it } from 'vitest'
import { extractFields, renderEmailHtml, renderTemplate, smsSegments, validateTemplate } from './template'

describe('renderTemplate', () => {
  it('replaces fields, tolerating spaces inside the braces', () => {
    expect(renderTemplate('Hi {{firstName}} and {{ lastName }}', { firstName: 'Ada', lastName: 'Obi' })).toBe(
      'Hi Ada and Obi',
    )
  })
  it('renders a missing or null value as empty, never "undefined"', () => {
    expect(renderTemplate('A{{x}}B{{y}}C', { y: null })).toBe('ABC')
  })
  it('leaves merge values raw (escaping is the email renderer’s job)', () => {
    expect(renderTemplate('{{n}}', { n: '<b>x</b>' })).toBe('<b>x</b>')
  })
  it('renders numbers', () => {
    expect(renderTemplate('{{n}} classes', { n: 8 })).toBe('8 classes')
  })
})

describe('extractFields / validateTemplate', () => {
  it('lists distinct fields', () => {
    expect(extractFields('{{a}} {{ b }} {{a}}')).toEqual(['a', 'b'])
  })
  it('accepts fields allowed for the key', () => {
    expect(validateTemplate('new_month', { subject: 'Hi {{monthName}}', body: 'Dear {{firstName}} {{year}}' })).toEqual({
      ok: true,
    })
  })
  it('rejects an unknown field and names it', () => {
    const r = validateTemplate('new_month', { subject: 's', body: 'Dear {{firstNmae}}' })
    expect(r).toEqual({ ok: false, unknown: ['firstNmae'] })
  })
  it('checks shortBody too', () => {
    const r = validateTemplate('birthday_student', { subject: 's', body: 'b', shortBody: 'x {{courseTitle}}' })
    expect(r).toEqual({ ok: false, unknown: ['courseTitle'] })
  })
  it('announcement uses the announcement field set', () => {
    expect(validateTemplate('announcement', { subject: 's', body: '{{firstName}} {{monthName}}' })).toEqual({
      ok: false,
      unknown: ['monthName'],
    })
  })
})

describe('renderEmailHtml', () => {
  const base = { subject: 'S', category: 'TRANSACTIONAL' as const, supportEmail: 'support@x.test' }
  it('turns a blank line into a paragraph break and a newline into <br>', () => {
    const html = renderEmailHtml({ ...base, body: 'One\nTwo\n\nThree' })
    expect(html).toContain('<p>One<br>Two</p>')
    expect(html).toContain('<p>Three</p>')
  })
  it('escapes HTML coming from a merge value or the template itself', () => {
    const html = renderEmailHtml({ ...base, body: 'Hi <script>alert(1)</script> & "q"' })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp;')
  })
  it('links bare URLs', () => {
    const html = renderEmailHtml({ ...base, body: 'Go to https://banafix.test/feedback?a=1&b=2 now' })
    expect(html).toContain('<a href="https://banafix.test/feedback?a=1&amp;b=2"')
  })
  it('marketing mail carries the opt-out line, transactional does not', () => {
    expect(renderEmailHtml({ ...base, category: 'MARKETING', body: 'x' })).toContain('opt out')
    expect(renderEmailHtml({ ...base, body: 'x' })).not.toContain('opt out')
  })
})

describe('smsSegments', () => {
  it('160 GSM chars is one segment, 161 is two', () => {
    expect(smsSegments('a'.repeat(160))).toMatchObject({ encoding: 'GSM', segments: 1 })
    expect(smsSegments('a'.repeat(161))).toMatchObject({ encoding: 'GSM', segments: 2 })
  })
  it('the naira sign forces UNICODE (70 per segment)', () => {
    expect(smsSegments('Fee ₦5,000')).toMatchObject({ encoding: 'UNICODE', segments: 1 })
    expect(smsSegments('₦'.repeat(71))).toMatchObject({ encoding: 'UNICODE', segments: 2 })
  })
  it('extended GSM characters count double', () => {
    expect(smsSegments('{'.repeat(80))).toMatchObject({ encoding: 'GSM', length: 160, segments: 1 })
    expect(smsSegments('{'.repeat(81))).toMatchObject({ length: 162, segments: 2 })
  })
  it('emoji count as two UTF-16 units', () => {
    expect(smsSegments('🎉'.repeat(35))).toMatchObject({ encoding: 'UNICODE', length: 70, segments: 1 })
    expect(smsSegments('🎉'.repeat(36))).toMatchObject({ length: 72, segments: 2 })
  })
  it('empty text is zero segments', () => {
    expect(smsSegments('')).toMatchObject({ length: 0, segments: 0 })
  })
})
