import { describe, expect, it } from 'vitest'
import { toCsv } from '../lib/tuition-csv'

describe('toCsv', () => {
  it('joins rows with CRLF and cells with commas', () => {
    expect(toCsv([['a', 1], ['b', 2]])).toBe('a,1\r\nb,2')
  })
  it('quotes cells with commas, quotes and newlines, doubling quotes', () => {
    expect(toCsv([['x,y', 'say "hi"', 'l1\nl2']])).toBe('"x,y","say ""hi""","l1\nl2"')
  })
  it('renders null/undefined as empty', () => {
    expect(toCsv([[null, undefined, 0]])).toBe(',,0')
  })
  it('neutralises spreadsheet formulas', () => {
    expect(toCsv([['=SUM(A1)', '+1', '-1', '@x', 'ok']])).toBe("'=SUM(A1),'+1,'-1,'@x,ok")
  })
  it('does not treat negative numbers typed as numbers as formulas', () => {
    expect(toCsv([[-500]])).toBe('-500')
  })
})
