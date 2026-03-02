<script>
  import Card from '$lib/Card.svelte'
  import Chart from '$lib/Chart.svelte'
  import CardError from '$lib/CardError.svelte'
  import CardLoading from '$lib/CardLoading.svelte'
  import { writable } from 'svelte/store'
  const tds = writable(new Date())
  import { data } from '$lib/data.js'
  import { getConfig } from './LULCharts.js'
  const size = 6
  const title = 'LULs'

  const _getConfig = async (d) => {
    const json = d
    const ds0 = json.OperationsV1
    const retval = await getConfig(d)
    tds.set(ds0.tds) //don't update tds until retval is returned without errors
    return retval
  }
</script>

{#await _getConfig($data)}
  <Card {size} {title} tds={$tds}>
    <CardLoading />
  </Card>
{:then configs}
  {#each configs as config}
    <Card {size} title={config.title} tds={$tds}>
      <Chart config={config.chartConfig} />
    </Card>
  {/each}
{:catch error}
  <Card {size} {title} tds={$tds}>
    <CardError {error} />
  </Card>
{/await}
