import { describe, expect, it } from 'vitest'
import { baseVars, composeMessages, recipientVars } from './compose'
import type { Recipient } from './types'

const template = {
  key: 'new_month',
  category: 'MARKETING' as const,
  channels: ['EMAIL', 'SMS', 'WHATSAPP'] as ('EMAIL' | 'SMS' | 'WHATSAPP')[],
  subject: 'Hi {{firstName}}',
  body: 'Dear {{fullName}}, welcome to {{monthName}}.',
  shortBody: 'Hi {{firstName}}, {{monthName}}!',
}
const ada: Recipient = { type: 'student', id: 's1', name: 'Ada Obi', email: 'ada@x.test', phone: '+2348011111111' }
const common = { template, recipient: ada, vars: { ...recipientVars(ada), monthName: 'March' }, scope: 'newmonth:2027-03', supportEmail: 's@x.test' }

describe('recipientVars / baseVars', () => {
  it('splits the name', () => {
    expect(recipientVars(ada)).toEqual({ firstName: 'Ada', lastName: 'Obi', fullName: 'Ada Obi' })
    expect(recipientVars({ ...ada, name: 'Madonna' })).toMatchObject({ firstName: 'Madonna', lastName: '' })
  })
  it('academy defaults', () => {
    expect(baseVars().academyName).toBe('Banafix Music Academy')
  })
})

describe('composeMessages', () => {
  it('one row per channel with channel-appropriate content and unique keys', () => {
    const rows = composeMessages({ ...common, consent: [true] })
    expect(rows.map((r) => r.channel)).toEqual(['EMAIL', 'SMS', 'WHATSAPP'])
    expect(new Set(rows.map((r) => r.idempotencyKey)).size).toBe(3)
    const [email, sms] = rows
    expect(email).toMatchObject({ toAddress: 'ada@x.test', subject: 'Hi Ada', body: 'Dear Ada Obi, welcome to March.', status: 'queued' })
    expect(email.html).toContain('welcome to March')
    expect(sms).toMatchObject({ toAddress: '+2348011111111', body: 'Hi Ada, March!', subject: null, html: null })
  })
  it('falls back to the long body when there is no shortBody', () => {
    const rows = composeMessages({ ...common, consent: [true], template: { ...template, shortBody: null } })
    expect(rows[1].body).toBe('Dear Ada Obi, welcome to March.')
  })
  it('records a missing phone as skipped with a reason, never as a send to nothing', () => {
    const rows = composeMessages({ ...common, consent: [true], recipient: { ...ada, phone: null } })
    expect(rows[1]).toMatchObject({ channel: 'SMS', status: 'skipped', error: 'No phone number on file', toAddress: null })
    expect(rows[0].status).toBe('queued')
  })
  it('records a missing email as skipped', () => {
    const rows = composeMessages({ ...common, consent: [true], recipient: { ...ada, email: '' } })
    expect(rows[0]).toMatchObject({ channel: 'EMAIL', status: 'skipped', error: 'No email address on file' })
  })
  it('skips every channel for a marketing message without consent, with the reason', () => {
    const rows = composeMessages({ ...common, consent: [false] })
    expect(rows.every((r) => r.status === 'skipped' && r.error === 'No email consent on record')).toBe(true)
  })
  it('sends transactional messages regardless of consent', () => {
    const rows = composeMessages({ ...common, template: { ...template, category: 'TRANSACTIONAL' }, consent: [] })
    expect(rows.every((r) => r.status === 'queued')).toBe(true)
  })
  it('operational notices override marketing consent', () => {
    const rows = composeMessages({ ...common, consent: [false], operational: true })
    expect(rows.every((r) => r.status === 'queued')).toBe(true)
  })
  it('escapes merge values in the email html but not in the plain body', () => {
    const rows = composeMessages({
      ...common,
      consent: [true],
      vars: { ...common.vars, monthName: '<img src=x onerror=alert(1)>' },
    })
    expect(rows[0].html).not.toContain('<img')
    expect(rows[0].body).toContain('<img')
  })
  it('only emits the channels the template has switched on', () => {
    const rows = composeMessages({ ...common, consent: [true], template: { ...template, channels: ['EMAIL'] } })
    expect(rows).toHaveLength(1)
    expect(composeMessages({ ...common, consent: [true], template: { ...template, channels: [] } })).toEqual([])
  })
  it('passes through batch, enrollment and schedule', () => {
    const when = new Date('2026-12-05T00:00:00Z')
    const rows = composeMessages({ ...common, consent: [true], batchId: 'b1', enrollmentId: 'e1', scheduledFor: when })
    expect(rows[0]).toMatchObject({ batchId: 'b1', enrollmentId: 'e1', scheduledFor: when, templateKey: 'new_month', category: 'MARKETING' })
  })
})
