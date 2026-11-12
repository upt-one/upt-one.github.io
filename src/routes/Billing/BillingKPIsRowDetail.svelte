<script>
  import Table from '$lib/Table.svelte'
  import ToggleButton from '$lib/ToggleButton.svelte'
  import DriverStats from './DriverStats.svelte'
  import DNI from './DNI.svelte'
  import { downloadcsv } from '$lib/csvdownloader'
  import {
    number_format,
    isMP,
    hasOne,
    hasMultiplePages,
  } from '$lib/frtl-utility'
  import { data } from '$lib/data.js'
  const json = $data
  export let tt
  export let kpi
  const rows = kpi.rows.filter((a) => a[kpi.kfil] === tt.key).map(x=>kpi.mapf(x))
  let t = `${kpi.KPI} - ${tt.key}`
  let show = false
  const getMProws = (json, kpi) =>
    kpi.showMPS && kpi.mpf
      ? rows //note we are using the filtered rows here vs what we use for the kpi row
          .filter((x) => isMP(json, x[kpi.mpf]))
          .map((x) => parseFloat(x.ivh_totalcharge))
      : []
  const mprows = kpi.showMPS && getMProws(json, kpi)
  const colspan = kpi.showMPS ? 4 : 3
  const mpSubText = () =>
    mprows.length > 0
      ? kpi.isInvoice
        ? `$${number_format(
            mprows.reduce((x, y) => x + y),
            2,
          )} (${mprows.length})`
        : `${mprows.length}` + `&nbsp;❌&nbsp;`
      : `&nbsp;✔️&nbsp;`
  const getHighlighting = (r) =>
    isMP(json, r[kpi.mpf])
      ? hasMultiplePages(json, r[kpi.mpf])
        ? 'has-multiple-pages'
        : hasOne(json, r[kpi.mpf])
        ? 'has-one-paperwork'
        : 'missing-paperwork'
      : ''
  const rowsWithHighlighting = (rows) => rows.map(row=>({...row, rowclass : getHighlighting(row)}))

</script>

<tr class="text-end">
  <td class="text-start">{tt.key}</td>
  <td>{kpi.sumv(tt, rows)}</td>
  {#if kpi.showMPS}
    <td>
      {@html mpSubText()}
    </td>
  {/if}
  <td class="p-0">
    <ToggleButton bind:show />
    {#if !kpi.isDriverStats}
      <button
        class="btn btn-sm btn-secondary"
        on:click={() => downloadcsv(kpi.csvf ? rows.map(kpi.csvf) : rows, kpi.hdrs, t)}>
        CSV
      </button>
    {/if}
  </td>
</tr>
{#if show}
  <tr>
    <td {colspan}>
      {#if kpi.isDriverStats}
        <DriverStats
          {rows}
          pct_field={'SuccessRate'}
          count_field={'SuccessCount'} />
      {:else if kpi.isDNI}
        <DNI {rows} {kpi} />
      {:else}
        <Table headers={kpi.hdrs} rows={rowsWithHighlighting(rows)} />
      {/if}
    </td>
  </tr>
{/if}
