import { addDays } from '$lib/frtl-utility.js'
const fd0 = d => new Date(d).toLocaleDateString('en-US', {
  month: 'numeric',
  day: 'numeric',
})
const h2 = (x, tds, d) => {
  const dayIdx = addDays(tds, d).getDay()
  const target = Number(x.Targets?.split(',')[dayIdx] ?? 0)
  const fmtr = new Intl.NumberFormat('en-US', { style: 'decimal', signDisplay: "exceptZero" })
  const currentvalue = x[`Day ${fmtr.format(d)}`]
  const diff = currentvalue - target
  const a = currentvalue.toFixed(0);
  const b = fmtr.format(diff.toFixed(0))
  return {
    cellclass: `text-light bg-${b < 0 ? 'danger' : 'success'}`,
    cellvalue: `${a}(${b})`
  }
}
export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const dt0 = ds0.LoadHistoryV1
  const dt1 = ds0.DriverCountPerDayV1
  const dt2 = ds0.TargetsV1
  const Terminals = dt1.map(x => x.Terminal)
  const tds = new Date(ds0.tds)
  const rows = dt0
    .filter(x => Terminals.includes(x.Terminal))
    .map(x => ({
      ...x,
      DriverCountPerDay: dt1.find(y => y.Terminal === x.Terminal),
      ...dt2.find(y => y.Terminal === x.Terminal)
    }))
    .map(x => ({
      'Terminal': x.Terminal,
      ...[...Array(10).keys()]
        .reduce((a, b) => {
          b = -(b + 1)
          a[fd0(addDays(tds, b))] = h2(x, tds, b)
          return a;
        }, {})
    }))

  return rows
}
