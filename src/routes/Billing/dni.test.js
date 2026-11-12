import { describe, it, expect } from 'vitest'
import { getReasons, dniCsvRow } from './dni.js'
import { unkFirst, countBy } from '$lib/frtl-utility'
import { toCSV } from '$lib/csvdownloader'

describe('dni reasons', () => {
  it('reads every set bit', () => {
    expect(getReasons(1 | 1024 | 2048)).toEqual(['No Freight BOLs', 'Bad Equipment', 'Bad Division/Terminal'])
  })
  it('says Unknown when no bit is set', () => {
    expect(getReasons(0)).toEqual(['Unknown'])
  })
  it('puts the reasons in the last csv column, not the raw mask', () => {
    const row = { ord_hdrnumber: 1, ord_billto: 'B', errormask: 16 | 32 }
    expect(dniCsvRow(row)).toEqual({ ord_hdrnumber: 1, ord_billto: 'B', reasons: 'A Freight has Zero Gallons; Freight/Order mismatch' })
    expect(toCSV([dniCsvRow(row)], ['Number', 'BillTo', 'Reasons']).split('\n')[1])
      .toBe('"1","B","A Freight has Zero Gallons; Freight/Order mismatch"')
  })
})

describe('unkFirst', () => {
  it('moves UNK to the top and keeps the rest in order', () => {
    const rows = [
      ...Array(5).fill({ t: 'HOU' }),
      ...Array(3).fill({ t: 'DFW' }),
      { t: 'UNK' },
    ]
    expect(unkFirst(countBy(rows, 't', 't')).map((x) => x.key)).toEqual(['UNK', 'HOU', 'DFW'])
  })
  it('leaves a list with no UNK alone', () => {
    const list = [{ key: 'HOU' }, { key: 'DFW' }]
    expect(unkFirst(list)).toEqual(list)
  })
})
