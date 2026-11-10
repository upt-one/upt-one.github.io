import { describe, it, expect } from 'vitest'
import { toCSV } from './csvdownloader.js'

describe('toCSV', () => {
  it('doubles a quote inside a cell so the columns after it stay put', () => {
    expect(toCSV([{ a: 'say "hi"', b: 'x' }])).toBe('"a","b"\n"say ""hi""","x"')
  })

  it('keeps a newline inside the quoted cell', () => {
    expect(toCSV([{ a: 'one\ntwo', b: 'x' }])).toBe('"a","b"\n"one\ntwo","x"')
  })

  it('makes a cell that starts with = + - @ read as text', () => {
    const csv = toCSV([{ a: '=1+1', b: '+x', c: '-x', d: '@x' }])
    expect(csv.split('\n')[1]).toBe(`"'=1+1","'+x","'-x","'@x"`)
  })

  it('does the same for a cell that starts with a tab or CR', () => {
    expect(toCSV([{ a: '\t=1', b: '\r=1' }]).split('\n')[1]).toBe(`"'\t=1","'\r=1"`)
  })

  it('leaves numbers alone, negatives included', () => {
    expect(toCSV([{ a: -5, b: '-5', c: 1.5 }]).split('\n')[1]).toBe('"-5","-5","1.5"')
  })

  it('writes null and undefined as empty, like before', () => {
    expect(toCSV([{ a: null, b: undefined }]).split('\n')[1]).toBe('"",""')
  })

  it('uses the given header', () => {
    expect(toCSV([{ a: 1 }], ['Col A']).split('\n')[0]).toBe('"Col A"')
  })
})
