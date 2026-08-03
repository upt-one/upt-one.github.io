<script>
  // #54 / #52: the CAO's loads-by-bucket view. One row per LOAD, grouped Company >
  // Terminal, with bucket designation. Reads the existing billing feed only, no new
  // dataset. The join and rollup live in loads-by-bucket.js so they can be tested.
  import { data } from '$lib/data.js'
  import { downloadcsv } from '$lib/csvdownloader'
  import Card from '$lib/Card.svelte'
  import {
    buildLoads, summarize, applyFilters, groupLoads, toExportRows, DNI, MP, BOTH,
  } from './loads-by-bucket.js'

  $: json = $data
  $: tds = json?.BillingV1?.tds
  $: allLoads = json ? buildLoads(json) : []

  let company = ''
  let terminal = ''
  let bucket = ''
  let from = ''
  let to = ''
  let search = ''

  $: companies = [...new Set(allLoads.map((x) => x.company))].sort()
  // terminal options follow the company filter, otherwise the list is the whole fleet
  $: terminals = [
    ...new Set(allLoads.filter((x) => !company || x.company === company).map((x) => x.terminal)),
  ].sort()

  $: filtered = applyFilters(allLoads, { company, terminal, bucket, from, to, search })
  $: totals = summarize(filtered)
  $: groups = groupLoads(filtered)

  // ONE bucket->colour map, used by the summary tiles AND the badges further down, so
  // the strip at the top and the chips at the bottom cannot drift apart. Bootstrap
  // contextual classes: red = in both (the worst case), amber = DNI, cyan = paperwork.
  const BUCKET_STYLE = {
    [BOTH]: 'bg-danger text-white',
    [DNI]: 'bg-warning text-dark',
    [MP]: 'bg-info text-dark',
  }
  const chip = (b) => BUCKET_STYLE[b] ?? 'bg-secondary text-white'

  // the summary strip, driven off the same map. `tone` is the accent bar colour.
  $: tiles = [
    { label: 'Loads', value: totals.loads, style: 'bg-secondary text-white' },
    { label: 'Both buckets', value: totals.both, style: BUCKET_STYLE[BOTH] },
    { label: 'DNI only', value: totals.dniOnly, style: BUCKET_STYLE[DNI] },
    { label: 'Paperwork only', value: totals.mpOnly, style: BUCKET_STYLE[MP] },
    { label: 'Companies', value: totals.companyCount, style: 'bg-light text-dark' },
    { label: 'Terminals', value: totals.terminalCount, style: 'bg-light text-dark' },
  ]

  // Collapsed by default, down to the divisions. An `open` map (rather than the
  // `closed` map this started as) means the empty initial state IS all-collapsed, so
  // arriving on the page shows the company rollup rather than every load in the fleet.
  let open = {}
  const toggle = (k) => (open = { ...open, [k]: !open[k] })
  const expandAll = () => {
    const next = {}
    for (const g of groups) {
      next[g.company] = true
      for (const t of g.terminals) next[`${g.company}/${t.terminal}`] = true
    }
    open = next
  }
  const collapseAll = () => (open = {})

  const clear = () => {
    company = ''; terminal = ''; bucket = ''; from = ''; to = ''; search = ''
  }

  const stamp = () => new Date().toISOString().substring(0, 10)
  const exportAll = () => downloadcsv(toExportRows(filtered), null, `loads-by-bucket-${stamp()}`)
  const exportRows = (rows, name) =>
    downloadcsv(toExportRows(rows), null, `loads-by-bucket-${name}-${stamp()}`)
</script>

<Card size="12" title="Loads by Bucket (DNI + Missing Paperwork)" {tds}>
  <div class="card-body">

    {#if !json}
      <p class="text-muted mb-0">Loading billing data…</p>
    {:else}

      <!-- summary strip: the overlap leads, because that is the number the emailed
           report could not give and the per-bucket tiles double-count. colours come
           from BUCKET_STYLE so they match the chips in the groups below. -->
      <div class="row g-2 mb-3">
        {#each tiles as t}
          <div class="col-6 col-sm-4 col-lg-2">
            <div class="border rounded overflow-hidden h-100">
              <div class="{t.style} px-2 py-1 text-center">
                <small class="text-truncate d-block">{t.label}</small>
              </div>
              <div class="h4 mb-0 py-2 text-center">{t.value}</div>
            </div>
          </div>
        {/each}
      </div>

      <p class="text-muted small">
        A load can sit in both buckets at once, so it is counted once here and the three
        bucket figures add to the total. The overlapping per-bucket totals are
        <strong>{totals.anyDni}</strong> DNI and <strong>{totals.anyMp}</strong> Missing
        Paperwork. These will not tie to the Billing page's Missing Paperwork tile, which
        counts missing <em>documents</em> rather than loads (kpi-dashboard#52).
      </p>

      <!-- filters -->
      <div class="row g-2 mb-3 align-items-end">
        <div class="col-6 col-lg-2">
          <label class="form-label small mb-1" for="lbb-company">Company</label>
          <select id="lbb-company" class="form-select form-select-sm" bind:value={company}>
            <option value="">All</option>
            {#each companies as c}<option value={c}>{c}</option>{/each}
          </select>
        </div>
        <div class="col-6 col-lg-2">
          <label class="form-label small mb-1" for="lbb-terminal">Terminal</label>
          <select id="lbb-terminal" class="form-select form-select-sm" bind:value={terminal}>
            <option value="">All</option>
            {#each terminals as t}<option value={t}>{t}</option>{/each}
          </select>
        </div>
        <div class="col-6 col-lg-2">
          <label class="form-label small mb-1" for="lbb-bucket">Bucket</label>
          <select id="lbb-bucket" class="form-select form-select-sm" bind:value={bucket}>
            <option value="">All</option>
            <option value={BOTH}>{BOTH}</option>
            <option value={DNI}>{DNI} only</option>
            <option value={MP}>{MP} only</option>
          </select>
        </div>
        <div class="col-6 col-lg-2">
          <label class="form-label small mb-1" for="lbb-from">Completed from</label>
          <input id="lbb-from" type="date" class="form-control form-control-sm" bind:value={from} />
        </div>
        <div class="col-6 col-lg-2">
          <label class="form-label small mb-1" for="lbb-to">Completed to</label>
          <input id="lbb-to" type="date" class="form-control form-control-sm" bind:value={to} />
        </div>
        <div class="col-6 col-lg-2">
          <label class="form-label small mb-1" for="lbb-search">Search</label>
          <input
            id="lbb-search"
            type="search"
            class="form-control form-control-sm"
            placeholder="order, billto, driver…"
            bind:value={search} />
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-sm btn-outline-secondary" on:click={clear}>Clear filters</button>
          <button class="btn btn-sm btn-outline-secondary" on:click={expandAll}>Expand all</button>
          <button class="btn btn-sm btn-outline-secondary" on:click={collapseAll}>Collapse all</button>
        </div>
        <button class="btn btn-sm btn-outline-primary" on:click={exportAll}>
          Export {totals.loads} loads (csv)
        </button>
      </div>

      {#if groups.length === 0}
        <p class="text-muted mb-0">No loads match these filters.</p>
      {/if}

      <!-- Company > Terminal, collapsed to the company level on arrival -->
      {#each groups as g (g.company)}
        <div class="border rounded mb-3">
          <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center bg-light p-2">
            <button
              class="btn btn-sm btn-link text-decoration-none text-dark fw-bold text-nowrap"
              on:click={() => toggle(g.company)}>
              {open[g.company] ? '▾' : '▸'} {g.company}
            </button>
            <div class="d-flex flex-wrap gap-1 align-items-center">
              <span class="badge bg-secondary text-nowrap">{g.loads} loads</span>
              <span class="badge {chip(BOTH)} text-nowrap">{g.both} both</span>
              <span class="badge {chip(DNI)} text-nowrap">{g.dniOnly} DNI</span>
              <span class="badge {chip(MP)} text-nowrap">{g.mpOnly} paperwork</span>
              <button
                class="btn btn-sm btn-outline-primary text-nowrap"
                on:click={() => exportRows(g.terminals.flatMap((t) => t.rows), g.company)}>
                csv
              </button>
            </div>
          </div>

          {#if open[g.company]}
            {#each g.terminals as t (t.terminal)}
              {@const tkey = `${g.company}/${t.terminal}`}
              <div class="border-top">
                <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center px-3 py-2">
                  <button
                    class="btn btn-sm btn-link text-decoration-none text-dark text-nowrap"
                    on:click={() => toggle(tkey)}>
                    {open[tkey] ? '▾' : '▸'} {t.terminal}
                  </button>
                  <div class="d-flex flex-wrap gap-1 align-items-center">
                    <span class="badge bg-secondary text-nowrap">{t.loads} loads</span>
                    <span class="badge {chip(BOTH)} text-nowrap">{t.both} both</span>
                    <span class="badge {chip(DNI)} text-nowrap">{t.dniOnly} DNI</span>
                    <span class="badge {chip(MP)} text-nowrap">{t.mpOnly} paperwork</span>
                    <button
                      class="btn btn-sm btn-outline-primary text-nowrap"
                      on:click={() => exportRows(t.rows, tkey.replace('/', '-'))}>
                      csv
                    </button>
                  </div>
                </div>

                {#if open[tkey]}
                  <div class="table-responsive">
                    <table class="table table-sm table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Order</th>
                          <th>Completed</th>
                          <th>BillTo</th>
                          <th>Driver</th>
                          <th>Inv</th>
                          <th>Bucket</th>
                          <th>Missing</th>
                          <th>DNI reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each t.rows as row (row.order)}
                          <tr>
                            <td class="text-nowrap">{row.order}</td>
                            <td class="text-nowrap">{row.completed}</td>
                            <td>{row.billto}</td>
                            <td>{row.driver}</td>
                            <td>{row.invStatus}</td>
                            <td>
                              <span class="badge {chip(row.bucket)} text-nowrap">{row.bucket}</span>
                            </td>
                            <td><small>{row.missing.join('; ')}</small></td>
                            <td><small>{row.reason}</small></td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      {/each}

    {/if}
  </div>
</Card>
