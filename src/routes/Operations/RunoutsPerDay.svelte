<script>
  import RunoutsPerDayRow from './RunoutsPerDayRow.svelte'
  import RunoutsPerDayTotalRow from './RunoutsPerDayTotalRow.svelte'
  import Card from '$lib/Card.svelte'
  import { data } from '$lib/data.js'
  import { number_format } from '$lib/frtl-utility'
  const size = 12
  const title = ['Low Level Alarms','BSTK < 12']
  const json = $data
  const ds0 = json.OperationsV1
  const dt0 = ds0.RunoutsPerDayV1
  const tds = ds0.tds
</script>

<Card {size} {title} {tds}>
  <div class="table-responsive m-0 mt-2 m-lg-4 p-1">
    <table class="table table-hover table-borderless table-sm align-middle">
      <thead>
        <tr class="text-end table-light">
          <th width="20%" class="text-start">Terminal</th>
          <th width="20%" >Current</th>
          <th width="20%" >Day -1</th>
          <th width="20%" >Day -2</th>
          <th width="20%" >Day -3</th>
        </tr>
      </thead>
      <tbody>
        {#each dt0.map((x) => Object.values(x)) as row, i}
          <RunoutsPerDayRow {row} />
        {/each}
        <RunoutsPerDayTotalRow rows={dt0} />
      </tbody>
    </table>
  </div>
</Card>
