// #54: the load-grain collapse is the whole value of this page, so it gets the tests.
// The overlap (a load in BOTH buckets counted once) and the document-to-load rollup
// are the two things that were wrong in the emailed report and on the Billing tile.
import { describe, it, expect } from 'vitest'
import {
  buildLoads, summarize, applyFilters, groupLoads, toExportRows, DNI, MP, BOTH,
} from './loads-by-bucket.js'

const iso = (d) => `2026-07-${d}T09:30:00.0000000-04:00`

const ord = (n, company, terminal, extra = {}) => ({
  ord_hdrnumber: n, ord_revtype1: company, ord_revtype2: terminal,
  ord_billto: 'PCSWHI', ord_shipper: 'S', ord_consignee: 'C', ord_driver1: 'D',
  ord_completiondate: iso('20'), reason: 'nobols', ...extra,
})

const mp = (n, company, terminal, missing, extra = {}) => ({
  ord_hdrnumber: n, ord_revtype1: company, ord_revtype2: terminal,
  ord_billto: 'PCSWHI', ord_shipper: 'S', ord_consignee: 'C', ord_driver1: 'D',
  ord_completiondate: iso('20'), ord_invoicestatus: 'AVL', missing, ...extra,
})

const json = (orders, paperwork) => ({
  BillingV1: { OrdersV2: orders },
  EbeV1: { MissingPaperworkV2: paperwork },
})

describe('buildLoads', () => {
  it('collapses a load that is in both buckets to ONE row', () => {
    const loads = buildLoads(json([ord(1, 'FLRT', 'MAC')], [mp(1, 'FLRT', 'MAC', 'BOL (123)')]))
    expect(loads).toHaveLength(1)
    expect(loads[0].bucket).toBe(BOTH)
    expect(loads[0].dni).toBe(true)
    expect(loads[0].mp).toBe(true)
  })

  it('rolls multiple missing DOCUMENTS up to one load, joining what is missing', () => {
    const loads = buildLoads(json([], [
      mp(7, 'UPT', 'HOU', 'BOL (100)'),
      mp(7, 'UPT', 'HOU', 'BOL (200)'),
      mp(7, 'UPT', 'HOU', 'BACKUP'),
    ]))
    expect(loads).toHaveLength(1)
    expect(loads[0].missing).toEqual(['BACKUP', 'BOL (100)', 'BOL (200)'])
    expect(loads[0].bucket).toBe(MP)
  })

  it('deduplicates an identical missing string rather than listing it twice', () => {
    const loads = buildLoads(json([], [mp(8, 'UPT', 'HOU', 'BACKUP'), mp(8, 'UPT', 'HOU', 'BACKUP')]))
    expect(loads[0].missing).toEqual(['BACKUP'])
  })

  it('marks a DNI-only load xin, since OrdersV2 does not carry the column', () => {
    const loads = buildLoads(json([ord(2, 'FLRT', 'MAC')], []))
    expect(loads[0].bucket).toBe(DNI)
    expect(loads[0].invStatus).toBe('xin')
  })

  it('prefers the real invoice status when the paperwork side supplies one', () => {
    const loads = buildLoads(json([ord(3, 'FLRT', 'MAC')], [mp(3, 'FLRT', 'MAC', 'BOL (1)')]))
    expect(loads[0].invStatus).toBe('AVL')
  })

  it('reads company from revtype1 and terminal from revtype2 (#46 contract)', () => {
    const loads = buildLoads(json([ord(4, 'ULOG', 'JAX')], []))
    expect(loads[0].company).toBe('ULOG')
    expect(loads[0].terminal).toBe('JAX')
  })

  it('takes the completion date off the string, so it cannot shift a day by timezone', () => {
    const loads = buildLoads(json([ord(5, 'FLRT', 'MAC', { ord_completiondate: iso('01') })], []))
    expect(loads[0].completed).toBe('2026-07-01')
  })

  it('does not throw on a missing or empty dataset', () => {
    expect(buildLoads(undefined)).toEqual([])
    expect(buildLoads({})).toEqual([])
  })

  it('labels blank company/terminal rather than dropping them into an empty group', () => {
    const loads = buildLoads(json([ord(6, '', '')], []))
    expect(loads[0].company).toBe('(none)')
    expect(loads[0].terminal).toBe('(none)')
  })
})

describe('summarize', () => {
  const loads = buildLoads(json(
    [ord(1, 'FLRT', 'MAC'), ord(2, 'FLRT', 'MAC')],
    [mp(2, 'FLRT', 'MAC', 'BOL (1)'), mp(3, 'UPT', 'HOU', 'BACKUP')],
  ))

  it('counts each load exactly once across the three exclusive buckets', () => {
    const s = summarize(loads)
    expect(s.loads).toBe(3)
    expect(s.dniOnly + s.mpOnly + s.both).toBe(s.loads)
    expect(s.dniOnly).toBe(1)
    expect(s.mpOnly).toBe(1)
    expect(s.both).toBe(1)
  })

  it('reports the overlapping per-bucket totals separately, since those double-count', () => {
    const s = summarize(loads)
    expect(s.anyDni).toBe(2)
    expect(s.anyMp).toBe(2)
    expect(s.anyDni + s.anyMp).toBeGreaterThan(s.loads)
  })
})

describe('applyFilters', () => {
  const loads = buildLoads(json(
    [ord(1, 'FLRT', 'MAC'), ord(2, 'UPT', 'HOU', { ord_completiondate: iso('01') })],
    [mp(3, 'UPT', 'HOU', 'BACKUP', { ord_driver1: 'SMITH' })],
  ))

  it('returns everything when no filter is set', () => {
    expect(applyFilters(loads, {})).toHaveLength(3)
    expect(applyFilters(loads)).toHaveLength(3)
  })

  it('filters by company, terminal and bucket', () => {
    expect(applyFilters(loads, { company: 'UPT' })).toHaveLength(2)
    expect(applyFilters(loads, { terminal: 'MAC' })).toHaveLength(1)
    expect(applyFilters(loads, { bucket: MP })).toHaveLength(1)
  })

  it('filters on an inclusive completed-date range', () => {
    expect(applyFilters(loads, { from: '2026-07-20' })).toHaveLength(2)
    expect(applyFilters(loads, { to: '2026-07-01' })).toHaveLength(1)
    expect(applyFilters(loads, { from: '2026-07-01', to: '2026-07-01' })).toHaveLength(1)
  })

  it('searches across order, parties, driver and what is missing', () => {
    expect(applyFilters(loads, { search: 'smith' })).toHaveLength(1)
    expect(applyFilters(loads, { search: 'BACKUP' })).toHaveLength(1)
    expect(applyFilters(loads, { search: '2' })).toHaveLength(1)
    expect(applyFilters(loads, { search: 'nothinghere' })).toHaveLength(0)
  })
})

describe('groupLoads', () => {
  it('nests terminals under companies with counts at both levels', () => {
    const loads = buildLoads(json(
      [ord(1, 'FLRT', 'MAC'), ord(2, 'FLRT', 'JAX'), ord(3, 'UPT', 'HOU')],
      [mp(1, 'FLRT', 'MAC', 'BOL (1)')],
    ))
    const groups = groupLoads(loads)
    expect(groups.map((g) => g.company)).toEqual(['FLRT', 'UPT'])
    expect(groups[0].loads).toBe(2)
    expect(groups[0].both).toBe(1)
    expect(groups[0].terminals.map((t) => t.terminal).sort()).toEqual(['JAX', 'MAC'])
    expect(groups[0].terminals.reduce((a, t) => a + t.loads, 0)).toBe(groups[0].loads)
  })
})

describe('toExportRows', () => {
  it('emits the #52 column set with Y/blank flags so it pivots in excel', () => {
    const loads = buildLoads(json([ord(1, 'FLRT', 'MAC')], [mp(1, 'FLRT', 'MAC', 'BOL (9)')]))
    const [row] = toExportRows(loads)
    expect(Object.keys(row)).toEqual([
      'Company', 'Terminal', 'BillTo', 'Order', 'Completed', 'Driver',
      'InvStatus', 'DNI', 'MissingPaperwork', 'Buckets', 'Missing',
    ])
    expect(row.DNI).toBe('Y')
    expect(row.MissingPaperwork).toBe('Y')
    expect(row.Buckets).toBe(BOTH)
    expect(row.Missing).toBe('BOL (9)')
  })

  it('leaves the flag blank rather than writing N, so excel filters cleanly', () => {
    const [row] = toExportRows(buildLoads(json([ord(1, 'FLRT', 'MAC')], [])))
    expect(row.MissingPaperwork).toBe('')
  })
})
