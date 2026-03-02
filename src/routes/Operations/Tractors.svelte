<script>
  
  import Card from '$lib/Card.svelte'
  import Chart from '$lib/Chart.svelte'
  import CardError from '$lib/CardError.svelte'
  import CardLoading from '$lib/CardLoading.svelte'
  import { data } from '$lib/data.js'
  import { getConfig } from './Tractors.js'
  
  import { writable } from 'svelte/store'
  const tds = writable(new Date())
  const title = writable('Tractors/Terminal')
  const size = 12

  const _getConfig = async (d) => {
    const json = d
    const ds0 = json.OperationsV1
    const retval = await getConfig(d)
    tds.set(ds0.tds) //don't update tds until retval is returned without errors
    const x = retval.data.datasets[0]?.data.reduce((a,b)=> a+b)
    if(x) {title.set([$title,`Total: ${x}`])}
    return retval
  }

</script>

<Card {size} title={$title} tds={$tds}>
  {#await _getConfig($data)}
    <CardLoading />
  {:then config}
    <Chart {config} />
  {:catch error}
    <CardError {error} />
  {/await}
</Card>
