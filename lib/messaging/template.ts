import { ANNOUNCEMENT_FIELDS, EVENTS, isTemplateKey } from './events'
import type { Category, VarMap } from './types'

const FIELD_RE = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g

/** Distinct `{{field}}` names used in a template string, in order of first use. */
export function extractFields(src: string): string[] {
  const seen: string[] = []
  for (const m of src.matchAll(FIELD_RE)) if (!seen.includes(m[1])) seen.push(m[1])
  return seen
}

/** Plain substitution. A missing or null value renders as empty text, never "undefined". */
export function renderTemplate(src: string, vars: VarMap): string {
  return src.replace(FIELD_RE, (_, name: string) => {
    const v = vars[name]
    return v === null || v === undefined ? '' : String(v)
  })
}

/** Save-time check: every merge field must be one the event can supply. */
export function validateTemplate(
  key: string,
  t: { subject: string; body: string; shortBody?: string | null },
): { ok: true } | { ok: false; unknown: string[] } {
  const allowed: readonly string[] =
    key === 'announcement' ? ANNOUNCEMENT_FIELDS : isTemplateKey(key) ? EVENTS[key].fields : []
  const used = [...extractFields(t.subject), ...extractFields(t.body), ...extractFields(t.shortBody ?? '')]
  const unknown = used.filter((f, i) => used.indexOf(f) === i && !allowed.includes(f))
  return unknown.length === 0 ? { ok: true } : { ok: false, unknown }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function linkify(escaped: string): string {
  return escaped.replace(
    /https?:\/\/[^\s<]+/g,
    (url) => `<a href="${url}" style="color:#b9770e">${url}</a>`,
  )
}

/**
 * Wraps already-rendered plain text in the branded email shell. Escaping happens here, once, over
 * the whole rendered text, so neither template copy nor a merge value can inject markup.
 */
export function renderEmailHtml(input: {
  subject: string
  body: string
  category: Category
  supportEmail: string
}): string {
  const paragraphs = input.body
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${linkify(escapeHtml(p)).replace(/\n/g, '<br>')}</p>`)
    .join('\n')

  const optOut =
    input.category === 'MARKETING'
      ? `<p>You are receiving this because you agreed to hear from Banafix. To opt out, reply to this email or write to ${escapeHtml(input.supportEmail)}.</p>`
      : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(input.subject)}</title>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f9fafb; }
.container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
.header { background: #1e293b; color: #fff; padding: 24px 30px; text-align: center; }
.header h1 { margin: 0; font-size: 22px; letter-spacing: 2px; }
.header p { margin: 4px 0 0; font-size: 13px; opacity: .8; }
.content { padding: 28px 30px; }
.content p { margin: 0 0 14px; }
.footer { background: #f8fafc; padding: 16px 30px; color: #64748b; font-size: 13px; }
.footer p { margin: 0 0 6px; }
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>BANAFIX</h1><p>Music Academy &amp; Training Center</p></div>
<div class="content">
${paragraphs}
</div>
<div class="footer">
<p>Questions? Contact us at ${escapeHtml(input.supportEmail)}</p>
${optOut}
</div>
</div>
</body>
</html>`
}

// GSM 03.38 basic set (+ extension table, which costs two septets each).
const GSM_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
const GSM_EXT = '^{}\\[~]|€'

export function smsSegments(text: string): { encoding: 'GSM' | 'UNICODE'; length: number; segments: number } {
  if (text.length === 0) return { encoding: 'GSM', length: 0, segments: 0 }
  let septets = 0
  let gsm = true
  for (const ch of text) {
    if (GSM_BASIC.includes(ch)) septets += 1
    else if (GSM_EXT.includes(ch)) septets += 2
    else {
      gsm = false
      break
    }
  }
  if (gsm) {
    return { encoding: 'GSM', length: septets, segments: septets <= 160 ? 1 : Math.ceil(septets / 153) }
  }
  const units = text.length // UTF-16 code units: an emoji is two
  return { encoding: 'UNICODE', length: units, segments: units <= 70 ? 1 : Math.ceil(units / 67) }
}
