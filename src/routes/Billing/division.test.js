// #46 contract: the feeds emit RAW db names in V2 (revtype1 = company, revtype2 = terminal);
// V1 carried the terminal under the revtype1 name and no company at all. The page must
// prefer V2, fall back to V1 unchanged, and filter by company only when V2 is present.
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

// V1-only: exactly what production serves today
const v1 = () => ({
  BillingV1: {
    tds: iso(3),
    InvoicesV1: [inv('A1', null, 'MAC', 'HLD', 100), inv('A2', null, 'HOU', 'HLD', 300)],
    OrdersV1: [ord(1, null, 'MAC'), ord(2, null, 'HOU')],
    NonCompletionsV1: [], LateCompletionsV1: [], LostAccessorialsV1: [], UnrateableV1: [],
    ManualCompletionsV1: [
      { Terminal: 'MAC', Driver: 'D1', ManualCompletionCount: 2, TotalCount: 10 },
      { Terminal: 'HOU', Driver: 'D2', ManualCompletionCount: 5, TotalCount: 10 },
    ],
  },
  EbeV1: {
    tds: iso(3), MissingPaperworkV1: [],
    MobileCaptureV1: [
      { Terminal: 'MAC', Driver: 'D1', DriverScanCount: 9, TotalCount: 10 },
      { Terminal: 'HOU', Driver: 'D2', DriverScanCount: 1, TotalCount: 10 },
    ],
  },
})

// The transition payload: BOTH versions in one file, which is what the feed emits mid-migration
const dual = () => {
  const d = v1()
  d.BillingV1.InvoicesV2 = [inv('A1', 'FLRT', 'MAC', 'HLD', 100), inv('A2', 'UPT', 'HOU', 'HLD', 300)]
  d.BillingV1.OrdersV2 = [ord(1, 'FLRT', 'MAC'), ord(2, 'UPT', 'HOU')]
  d.BillingV1.NonCompletionsV2 = []
  d.BillingV1.LateCompletionsV2 = []
  d.BillingV1.LostAccessorialsV2 = []
  d.BillingV1.UnrateableV2 = []
  d.BillingV1.ManualCompletionsV2 = [
    { ord_revtype1: 'FLRT', ord_revtype2: 'MAC', Driver: 'D1', ManualCompletionCount: 2, TotalCount: 10 },
    { ord_revtype1: 'UPT', ord_revtype2: 'HOU', Driver: 'D2', ManualCompletionCount: 5, TotalCount: 10 },
  ]
  d.EbeV1.MissingPaperworkV2 = []
  d.EbeV1.MobileCaptureV2 = [
    { ord_revtype1: 'FLRT', ord_revtype2: 'MAC', Driver: 'D1', DriverScanCount: 9, TotalCount: 10 },
    { ord_revtype1: 'UPT', ord_revtype2: 'HOU', Driver: 'D2', DriverScanCount: 1, TotalCount: 10 },
  ]
  return d
}
const cur = (k, name) => k.find((x) => x.KPI === name).Current
const tile = (k, name) => k.find((x) => x.KPI === name)

describe('V1 payload (production today)', () => {
  it('renders unfiltered, exactly as before', async () => {
    const k = await getKPIs(v1(), '')
    expect(cur(k, 'Do Not Invoice - Total')).toBe('2')
    expect(cur(k, 'Order Completion Success')).toBe('65%')
  })
  it('ignores a division selection (V1 has no company)', async () => {
    const k = await getKPIs(v1(), 'FLRT')
    expect(cur(k, 'Do Not Invoice - Total')).toBe('2')
  })
  it('groups drilldowns on the V1 (mislabeled) terminal column', async () => {
    const k = await getKPIs(v1(), '')
    expect(tile(k, 'Do Not Invoice - Total').kfil).toBe('ord_revtype1')
    expect(tile(k, 'Mobile Capture Success').kfil).toBe('Terminal')
  })
})

describe('dual payload (mid-migration)', () => {
  it('prefers V2 and filters by the real revtype1', async () => {
    const flrt = await getKPIs(dual(), 'FLRT')
    expect(cur(flrt, 'Do Not Invoice - Total')).toBe('1')
    expect(cur(flrt, 'Order Completion Success')).toBe('80%')
    expect(cur(flrt, 'Mobile Capture Success')).toBe('90%')
    const upt = await getKPIs(dual(), 'UPT')
    expect(cur(upt, 'Order Completion Success')).toBe('50%')
    expect(cur(upt, 'Mobile Capture Success')).toBe('10%')
  })
  it('unfiltered totals match the V1 numbers (no double count)', async () => {
    const k = await getKPIs(dual(), '')
    expect(cur(k, 'Do Not Invoice - Total')).toBe('2')
    expect(cur(k, 'Order Completion Success')).toBe('65%')
  })
  it('groups drilldowns on the real terminal column', async () => {
    const k = await getKPIs(dual(), '')
    expect(tile(k, 'Do Not Invoice - Total').kfil).toBe('ord_revtype2')
    expect(tile(k, 'Unbilled Revenue - Total').kfil).toBe('ivh_revtype2')
    expect(tile(k, 'Mobile Capture Success').kfil).toBe('ord_revtype2')
  })
  it('survives a filter that empties a driver-stat tile', async () => {
    const d = dual()
    d.EbeV1.MobileCaptureV2 = d.EbeV1.MobileCaptureV2.filter((r) => r.ord_revtype1 === 'UPT')
    const k = await getKPIs(d, 'FLRT')
    expect(cur(k, 'Mobile Capture Success')).toBe('0%')
  })
})
