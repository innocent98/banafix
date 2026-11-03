import { describe, expect, it } from 'vitest'
import { TEMPLATE_KEYS } from './events'
import { DEFAULT_TEMPLATES } from './default-templates'
import { validateTemplate } from './template'

describe('default templates', () => {
  it.each(TEMPLATE_KEYS)('%s has copy that only uses its allowed merge fields', (key) => {
    const t = DEFAULT_TEMPLATES[key]
    expect(t.subject.length).toBeGreaterThan(0)
    expect(t.body.length).toBeGreaterThan(0)
    expect(validateTemplate(key, t)).toEqual({ ok: true })
  })
  it('SMS/WhatsApp short variants avoid the naira sign (it forces 70-char segments)', () => {
    for (const key of TEMPLATE_KEYS) {
      expect(DEFAULT_TEMPLATES[key].shortBody ?? '').not.toContain('₦')
    }
  })
})
