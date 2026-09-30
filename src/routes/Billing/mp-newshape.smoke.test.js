// #65 smoke: the feed's missing values become per-billto doctype names (FB, BACKUP_AR,
// TOLL...) instead of the fixed BOL(...)/BACKUP pair. Prove the three UI consumers treat
// the value as opaque display text: nothing parses it, nothing throws, highlighting keys
// on ord_hdrnumber + flags only.
import { describe, it, expect } from 'vitest'
import { getKPIs } from './BillingKPIs.js'
import { isMP, hasOne, hasMultiplePages } from '$lib/frtl-utility'
import { buildLoads, summarize } from '../Finance/loads-by-bucket.js'

const iso = '2026-08-20T09:30:00.0000000-04:00'
const mp = (n, missing, one) => ({
  ord_hdrnumber: n, ord_revtype1: 'UPT', ord_revtype2: 'HOU', ord_billto: 'X',
  ord_shipper: 'S', ord_consignee: 'C', ord_driver1: 'D', ord_invoicestatus: 'AVL',
  ord_startdate: iso, ord_completiondate: iso, missing, hasOne: one, hasMultiplePages: 0,
})

const json = {
  BillingV1: {
    tds: iso,
    InvoicesV2: [], OrdersV2: [], NonCompletionsV2: [], LateCompletionsV2: [],
    LostAccessorialsV2: [], UnrateableV2: [], ManualCompletionsV2: [],
  },
  EbeV1: {
    tds: iso,
    MobileCaptureV2: [],
    MissingPaperworkV2: [
      mp(90000001, 'FB', 1),
      mp(90000002, 'BACKUP_AR', 0),
      mp(90000003, 'TOLL', 1),
      mp(90000004, 'BOL (999123)', 0),
      mp(90000001, 'DO', 1),
    ],
  },
}

describe('missing paperwork new-shape rows (#65)', () => {
  it('billing tile counts rows and passes the raw doctype through as display text', async () => {
    const kpis = await getKPIs(json)
    const tile = kpis.find((k) => k.KPI === 'Missing Paperwork - Total')
    expect(tile.Current).toBe(5)
    const row = tile.rows.find((r) => r.ord_hdrnumber === 90000002)
    expect(tile.mapf(row).missing).toBe('BACKUP_AR')
  })

  it('highlighting keys on ord_hdrnumber + flags only, never the missing value', () => {
    expect(isMP(json, 90000001)).toBe(true)
    expect(hasOne(json, 90000001)).toBe(true)
    expect(isMP(json, 90000002)).toBe(true)
    expect(hasOne(json, 90000002)).toBe(false)
    expect(hasMultiplePages(json, 90000001)).toBe(false)
    expect(isMP(json, 12345678)).toBe(false)
  })

  it('finance page groups arbitrary doctype names per load and the buckets still add up', () => {
    const loads = buildLoads(json)
    const two = loads.find((l) => l.order === '90000001')
    expect(two.missing).toEqual(['DO', 'FB'])
    const s = summarize(loads)
    expect(s.dniOnly + s.mpOnly + s.both).toBe(s.loads)
  })
})
