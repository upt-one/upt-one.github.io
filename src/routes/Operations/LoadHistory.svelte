<script>
  import Card from '$lib/Card.svelte'
  import CardError from '$lib/CardError.svelte'
  import CardLoading from '$lib/CardLoading.svelte'
  import { writable } from 'svelte/store'
  const tds = writable(new Date())
  import { data } from '$lib/data.js'
  import { getConfig } from './LoadHistory.js'
  import Table from '$lib/Table.svelte'
  import Chart from '$lib/Chart.svelte'

  const size = 12
  const title = ['Load History vs Forecast (Gas)','Daily Actuals + 6 Wk Avgs']
  const _getConfig = async (d) => {
    const json = d
    const ds0 = json.OperationsV1
    const retval = await getConfig(d)
    tds.set(ds0.tds) //don't update tds until retval is returned without errors
    return retval
  }
</script>

<Card {size} {title} tds={$tds}>
  {#await _getConfig($data)}
    <CardLoading />
  {:then rows}
    <Table {rows} twist={false} showTotals={true} showVariance={true} />
  {:catch error}
    <CardError {error} />
  {/await}
</Card>


