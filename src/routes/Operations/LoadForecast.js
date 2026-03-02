import { addDays } from '$lib/frtl-utility.js'
const fd0 = d => new Date(d).toLocaleDateString('en-US', {
  month: 'numeric',
  day: 'numeric',
})
const fmtr = new Intl.NumberFormat('en-US', { style: 'decimal', signDisplay: "exceptZero" })
const addTargets = x => {
  const targets = x.Targets.split(',')//targets by day of week. 0 based like js
  const wedays = [0, 6]
  const wkdays = [1, 2, 3, 4, 5]
  x['M-F'] = (wkdays.reduce((a, b) => a + Number(targets[b]), 0) / wkdays.length).toFixed(0)
  x['S+S'] = (wedays.reduce((a, b) => a + Number(targets[b]), 0) / wedays.length).toFixed(0)
  return x
}

//add highlighting class data if below target
const hl = (x, tds, d) => {

  const isWeekend = [0, 6].includes(addDays(tds, d).getDay())
  const target = x[isWeekend?'S+S':'M-F']
  const currentvalue = (x[`Day ${fmtr.format(d)}`] * x.ALC).toFixed(0)
  return {
    cellclass: `text-light bg-${currentvalue >= target ? 'success': 'danger'}`,
    cellvalue: currentvalue
  }
}
export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const dt0 = ds0.DriverCountPerDayV1
  const dt1 = ds0.LoadHistoryV1 //required for alc, until this moves to targets
  const dt2 = ds0.TargetsV1
  const Terminals = dt1.map(x => x.Terminal)
  const tds = new Date(ds0.tds)
  const rows = dt0
    .filter(x => Terminals.includes(x.Terminal))
    .map(x => ({
      ...x,
      ...dt1.find(y => y.Terminal === x.Terminal),
      ...dt2.find(y => y.Terminal === x.Terminal),
    }))
    .map(x => ({
      'Terminal': x.Terminal,
      ...[...Array(10).keys()]
        .reduce((a, b) => {
          a[fd0(addDays(tds, b))] = hl(x, tds, b)
          return a;
        }, {}),
      'M-F': x['M-F'],
      'S+S': x['S+S']
    }))
  return rows
}
