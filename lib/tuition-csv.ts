/**
 * Minimal CSV writer for the admin payments export. Strings starting with = + - @ get a leading
 * apostrophe so a spreadsheet never evaluates them as a formula (CSV injection). Numbers are written as is.
 */
export type CsvCell = string | number | null | undefined

function cell(value: CsvCell): string {
  if (value == null) return ''
  if (typeof value === 'number') return String(value)
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(cell).join(',')).join('\r\n')
}
