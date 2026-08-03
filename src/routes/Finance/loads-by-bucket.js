// #54 / #52: the CAO's loads-by-bucket view. One row per LOAD, with a designation
// of which buckets it sits in, restricted to DNI and Missing Paperwork.
//
// The two buckets overlap by construction, which is the whole point of the ask.
// DNI is `ord_status='cmp'` + `ord_invoicestatus='xin'` + completed 0-90d.
// Missing Paperwork is `ord_status='CMP'` + completed 0-90d + no transferred invoice
// + a BOL with no scan in Ships.dbo.app_billing (or, for PCSWHI billtos, no backup).
// XIN orders are never transferred, so DNI sits INSIDE the MP scope and a load can be
// DNI only, MP only, or both. Per-bucket counts double-count loads; this collapses to
// load grain so they do not.
//
// Grain warning worth keeping in mind when these numbers are compared to the Billing
// page: `MissingPaperworkV2` is one row per missing DOCUMENT (two unscanned BOLs on a
// load = two rows, plus a BACKUP row where the billto rule applies), and the Billing
// "Missing Paperwork - Total" tile is `rows.length`. So this page will NOT tie to that
// tile, deliberately. The tile over-counts loads; see #52.
//
// #46 contract: the feeds emit RAW db column names. ord_revtype1 = the COMPANY
// (division), ord_revtype2 = the TERMINAL. "Company"/"Terminal" are UI labels applied
// at render, never renamed data columns. See docs/migration-46-revtype.md.

export const DNI = 'DNI'
export const MP = 'Missing Paperwork'
export const BOTH = 'Both'

const UNKNOWN = '(none)'
const key = (v) => (v === null || v === undefined || v === '' ? UNKNOWN : String(v).trim())

// yyyy-mm-dd off the feed's ISO string, without going through Date(). The feed emits
// a fixed-format local timestamp, so slicing beats parsing: it cannot shift a day for
// a viewer west of eastern time the way `new Date(x).toLocaleDateString()` does (#30).
export const completedDate = (row) => String(row?.ord_completiondate ?? '').substring(0, 10)

/**
 * Collapse the DNI and Missing Paperwork datasets to one row per load.
 *
 * @param {object} json the `$data` store contents
 * @returns {Array} load-grain rows, newest completion first
 */
export const buildLoads = (json) => {
  const orders = json?.BillingV1?.OrdersV2 ?? []
  const paperwork = json?.EbeV1?.MissingPaperworkV2 ?? []

  const loads = new Map()

  const upsert = (row) => {
    const id = String(row.ord_hdrnumber)
    let load = loads.get(id)
    if (!load) {
      load = {
        order: id,
        company: key(row.ord_revtype1),
        terminal: key(row.ord_revtype2),
        billto: key(row.ord_billto),
        shipper: key(row.ord_shipper),
        consignee: key(row.ord_consignee),
        driver: key(row.ord_driver1),
        completed: completedDate(row),
        invStatus: '',
        dni: false,
        mp: false,
        reason: '',
        missing: [],
      }
      loads.set(id, load)
    }
    return load
  }

  for (const row of orders) {
    const load = upsert(row)
    load.dni = true
    // DNI is defined by ord_invoicestatus='xin', and OrdersV2 does not carry the
    // column because the filter already guarantees it. Do not invent a lookup.
    if (!load.invStatus) load.invStatus = 'xin'
    if (row.reason !== undefined && row.reason !== null && row.reason !== '') {
      load.reason = String(row.reason)
    }
  }

  for (const row of paperwork) {
    const load = upsert(row)
    load.mp = true
    if (row.ord_invoicestatus) load.invStatus = String(row.ord_invoicestatus)
    const missing = row.missing ?? row.Missing
    if (missing && !load.missing.includes(missing)) load.missing.push(missing)
  }

  return [...loads.values()]
    .map((load) => ({
      ...load,
      missing: load.missing.sort(),
      bucket: load.dni && load.mp ? BOTH : load.dni ? DNI : MP,
    }))
    .sort((a, b) =>
      b.completed.localeCompare(a.completed) || Number(a.order) - Number(b.order),
    )
}

/** Headline counts. `loads` is total, the three buckets are mutually exclusive. */
export const summarize = (loads) => ({
  loads: loads.length,
  dniOnly: loads.filter((x) => x.bucket === DNI).length,
  mpOnly: loads.filter((x) => x.bucket === MP).length,
  both: loads.filter((x) => x.bucket === BOTH).length,
  // the per-bucket totals people will try to reconcile against the Billing tiles.
  // these two DO overlap, which is why they are reported separately from the above.
  anyDni: loads.filter((x) => x.dni).length,
  anyMp: loads.filter((x) => x.mp).length,
  // deliberately NOT named `companies` / `terminals`: the group objects below spread
  // this summary alongside a `terminals` ARRAY, and a same-named count silently
  // replaced it. count-vs-collection is worth the two extra characters.
  companyCount: new Set(loads.map((x) => x.company)).size,
  terminalCount: new Set(loads.map((x) => `${x.company}::${x.terminal}`)).size,
})

/**
 * Apply the page filters. Every field is optional; an empty value means "no filter".
 */
export const applyFilters = (loads, f = {}) => {
  const search = (f.search ?? '').trim().toLowerCase()
  return loads.filter((load) => {
    if (f.company && load.company !== f.company) return false
    if (f.terminal && load.terminal !== f.terminal) return false
    if (f.bucket && load.bucket !== f.bucket) return false
    if (f.from && load.completed < f.from) return false
    if (f.to && load.completed > f.to) return false
    if (search) {
      const hay = [
        load.order, load.billto, load.shipper, load.consignee,
        load.driver, load.company, load.terminal, load.missing.join(' '),
      ].join(' ').toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

/** Company > Terminal tree, each level carrying its own bucket counts. */
export const groupLoads = (loads) => {
  const companies = new Map()
  for (const load of loads) {
    if (!companies.has(load.company)) companies.set(load.company, new Map())
    const terminals = companies.get(load.company)
    if (!terminals.has(load.terminal)) terminals.set(load.terminal, [])
    terminals.get(load.terminal).push(load)
  }
  return [...companies.entries()]
    .map(([company, terminals]) => {
      const groups = [...terminals.entries()]
        .map(([terminal, rows]) => ({ terminal, rows, ...summarize(rows) }))
        .sort((a, b) => b.loads - a.loads || a.terminal.localeCompare(b.terminal))
      return {
        company,
        terminals: groups,
        ...summarize(groups.flatMap((g) => g.rows)),
      }
    })
    .sort((a, b) => b.loads - a.loads || a.company.localeCompare(b.company))
}

/** Flat, human-headed rows for csv export at any scope. Matches the #52 column set. */
export const toExportRows = (loads) =>
  loads.map((load) => ({
    Company: load.company,
    Terminal: load.terminal,
    BillTo: load.billto,
    Order: load.order,
    Completed: load.completed,
    Driver: load.driver,
    InvStatus: load.invStatus,
    DNI: load.dni ? 'Y' : '',
    MissingPaperwork: load.mp ? 'Y' : '',
    Buckets: load.bucket,
    Missing: load.missing.join('; '),
  }))
