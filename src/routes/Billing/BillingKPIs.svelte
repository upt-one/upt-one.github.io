<script>
  import Card from '$lib/Card.svelte'
  import CardError from '$lib/CardError.svelte'
  import CardLoading from '$lib/CardLoading.svelte'
  import { writable } from 'svelte/store'
  const tds = writable(new Date())
  import BillingKPIsRow from './BillingKPIsRow.svelte'
  import { data } from '$lib/data.js'
  import { getKPIs } from './BillingKPIs.js'
  const size = 12
  const title = 'Billing'

  // #46 division filter. Options come from the data (rows carry `division` once the feeds
  // ship it), so the control renders only when the data actually has divisions - against
  // pre-migration feeds the page looks exactly like today.
  const division = writable('')
  // Only V2 carries the company (ord_revtype1/ivh_revtype1 = the real revtype1). On a V1-only
  // payload this returns [] and the control does not render, so the page is unchanged.
  const divisionsOf = (d) => {
    const s = new Set()
    for (const r of d?.BillingV1?.OrdersV2 ?? []) if (r.ord_revtype1) s.add(r.ord_revtype1)
    for (const r of d?.BillingV1?.InvoicesV2 ?? []) if (r.ivh_revtype1) s.add(r.ivh_revtype1)
    return [...s].sort()
  }
  $: divisions = divisionsOf($data)

  const _getKPIs = async (d, div) => {
    const json = d
    const ds0 = json.BillingV1
    const retval = await getKPIs(d, div)
    tds.set(ds0.tds) //don't update tds until retval is returned without errors
    return retval
  }
</script>

<Card {size} {title} tds={$tds}>
  <svelte:fragment slot="header">
    {#if divisions.length}
      <div class="d-flex align-items-center gap-2">
        <label for="division-filter" class="form-label m-0 text-muted"><small>Division</small></label>
        <select id="division-filter" class="form-select form-select-sm w-auto py-0" bind:value={$division}>
          <option value="">All divisions</option>
          {#each divisions as dv}
            <option value={dv}>{dv}</option>
          {/each}
        </select>
      </div>
    {/if}
  </svelte:fragment>
  <div class="table-responsive m-0 mt-2 m-lg-4">
    {#await _getKPIs($data, $division)}
    <CardLoading />
    {:then kpis}
      <table class="table table-borderless table-sm align-middle">
        <thead>
          <tr class="text-end table-light">
            <th class="text-start">KPI</th>
            <th>Current</th>
            <th>Goal</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {#each kpis as kpi}
            <BillingKPIsRow {kpi} />
          {/each}
        </tbody>
      </table>
    {:catch error}
    <CardError {error} />
    {/await}
    
  </div>
</Card>
