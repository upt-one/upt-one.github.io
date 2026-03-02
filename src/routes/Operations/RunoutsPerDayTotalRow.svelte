<script>
  import RunoutsPerDayRow from './RunoutsPerDayRow.svelte'
  export let rows
  let show = false
  const sumby = (a, i) =>
    a
      .map((x) => Object.values(x))
      .map((x) => x[i])
      .reduce((a, b) => a + b)
  //take array of csv strings and concat them into one long csv string
  const csvStringify = (a, i) =>
    [
      ...new Set(
        a
          .map((x) => Object.values(x))
          .map((x) => x[i])
          .filter((x) => x !== '')
          .map((x) => x.split(','))
          .join(',')
          .split(','),
      ),
    ].join(',')

  const row = [
    'Total',
    sumby(rows, 1),
    sumby(rows, 2),
    sumby(rows, 3),
    sumby(rows, 4),
    csvStringify(rows, 5),
    csvStringify(rows, 6),
    csvStringify(rows, 7),
    csvStringify(rows, 8),
  ]
</script>

<RunoutsPerDayRow {row} totalrow={true} />
