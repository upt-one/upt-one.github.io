// #46 contract: the feeds emit RAW db names (revtype1 = company, revtype2 = terminal) and the
// page reads the V2 tables only. "Terminal"/"Division" are UI labels, never data columns.
import { describe, it, expect } from 'vitest'
import { getKPIs } from './BillingKPIs.js'

const iso = (d) => `2026-07-2${d}T00:00:00.0000000+00:00`
const inv = (n, div, term, status, charge) => ({
  ivh_invoicenumber: n, ivh_invoicestatus: status, ivh_billto: 'X', ivh_shipper: 'S', ivh_consignee: 'C',
  ivh_shipdate: iso(0), ivh_deliverydate: iso(0), ivh_totalcharge: charge, ivh_quantity: 1, ref_number: 'r',
  ...(div ? { ivh_revtype1: div, ivh_revtype2: term } : { ivh_revtype1: term }),
})
const ord = (n, div, term) => ({
  ord_hdrnumber: n, ord_billto: 'X', ord_shipper: 'S', ord_consignee: 'C',
  ord_completiondate: iso(0), ord_driver1: 'D', reason: 1,
  ...(div ? { ord_revtype1: div, ord_revtype2: term } : { ord_revtype1: term }),
})

// the shape the feeds emit now
const base = () => ({
  BillingV1: {
    tds: iso(3),
    InvoicesV2: [inv('A1', 'FLRT', 'MAC', 'HLD', 100), inv('A2', 'UPT', 'HOU', 'HLD', 300)],
    OrdersV2: [ord(1, 'FLRT', 'MAC'), ord(2, 'UPT', 'HOU')],
    NonCompletionsV2: [], LateCompletionsV2: [], LostAccessorialsV2: [], UnrateableV2: [],
    ManualCompletionsV2: [
      { ord_revtype1: 'FLRT', ord_revtype2: 'MAC', Driver: 'D1', ManualCompletionCount: 2, TotalCount: 10 },
      { ord_revtype1: 'UPT', ord_revtype2: 'HOU', Driver: 'D2', ManualCompletionCount: 5, TotalCount: 10 },
    ],
  },
  EbeV1: {
    tds: iso(3), MissingPaperworkV2: [],
    MobileCaptureV2: [
      { ord_revtype1: 'FLRT', ord_revtype2: 'MAC', Driver: 'D1', DriverScanCount: 9, TotalCount: 10 },
      { ord_revtype1: 'UPT', ord_revtype2: 'HOU', Driver: 'D2', DriverScanCount: 1, TotalCount: 10 },
    ],
  },
})

const cur = (k, name) => k.find((x) => x.KPI === name).Current
const tile = (k, name) => k.find((x) => x.KPI === name)

describe('V2 payload', () => {
  it('filters by the real revtype1 (the company)', async () => {
    const flrt = await getKPIs(base(), 'FLRT')
    expect(cur(flrt, 'Do Not Invoice - Total')).toBe('1')
    expect(cur(flrt, 'Order Completion Success')).toBe('80%')
    expect(cur(flrt, 'Mobile Capture Success')).toBe('90%')
    const upt = await getKPIs(base(), 'UPT')
    expect(cur(upt, 'Order Completion Success')).toBe('50%')
    expect(cur(upt, 'Mobile Capture Success')).toBe('10%')
  })
  it('unfiltered totals cover every division', async () => {
    const k = await getKPIs(base(), '')
    expect(cur(k, 'Do Not Invoice - Total')).toBe('2')
    expect(cur(k, 'Order Completion Success')).toBe('65%')
  })
  it('groups drilldowns on the real terminal column', async () => {
    const k = await getKPIs(base(), '')
    expect(tile(k, 'Do Not Invoice - Total').kfil).toBe('ord_revtype2')
    expect(tile(k, 'Unbilled Revenue - Total').kfil).toBe('ivh_revtype2')
    expect(tile(k, 'Mobile Capture Success').kfil).toBe('ord_revtype2')
  })
  it('survives a filter that empties a driver-stat tile', async () => {
    const d = base()
    d.EbeV1.MobileCaptureV2 = d.EbeV1.MobileCaptureV2.filter((r) => r.ord_revtype1 === 'UPT')
    const k = await getKPIs(d, 'FLRT')
    expect(cur(k, 'Mobile Capture Success')).toBe('0%')
  })
})
