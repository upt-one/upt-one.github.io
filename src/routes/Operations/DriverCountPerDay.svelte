<script>
  import Card from '$lib/Card.svelte'
  import { data } from '$lib/data.js'
  import { number_format, addDays } from '$lib/frtl-utility.js'
  import Table from '$lib/Table.svelte'
  const fd0 = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    })
  const size = 12
  const title = ['Driver/Day (Gas+WHI)','Scheduled in TMW']
  const json = $data
  const ds0 = json.OperationsV1
  const dt0 = ds0.DriverCountPerDayV1
  const tds = new Date(ds0.tds)
  const rows = dt0
    // .map((x) => {
    //   const { ['Day +8']: a, ['Day +9']: b, ['Day +10']: c, ...y } = x
    //   return y
    // })
    .map((x) => ({
      Terminal: x.Terminal,
      [fd0(tds)]: x['Day 0'] ?? x['Current'], //todo remove 'current' when agent updated
      [fd0(addDays(tds, 1))]: x['Day +1'],
      [fd0(addDays(tds, 2))]: x['Day +2'],
      [fd0(addDays(tds, 3))]: x['Day +3'],
      [fd0(addDays(tds, 4))]: x['Day +4'],
      [fd0(addDays(tds, 5))]: x['Day +5'],
      [fd0(addDays(tds, 6))]: x['Day +6'],
      [fd0(addDays(tds, 7))]: x['Day +7'],
      [fd0(addDays(tds, 8))]: x['Day +8'],
      [fd0(addDays(tds, 9))]: x['Day +9'],
      [fd0(addDays(tds, 10))]: x['Day +10'],
    }))
</script>

<Card {size} {title} {tds}>
  <Table {rows} twist={false} showTotals={true} />
</Card>
