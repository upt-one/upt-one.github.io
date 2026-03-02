import { addDays } from '$lib/frtl-utility.js'
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

function getDates(startDate, stopDate) {
  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate <= stopDate) {
    dateArray.push(new Date(currentDate));
    currentDate = currentDate.addDays(1);
  }
  return dateArray;
}
const fd0 = d => new Date(d).toLocaleDateString('en-US', {
  month: 'numeric',
  day: 'numeric',
})
const h2 = (x, d) => {
  const target = x.ALC * (x.DriverCountPerDay?.[`Day -${d}`] ?? 0)
  const currentvalue = x[`Day -${d}`]
  const diff = currentvalue - target
  const a = currentvalue.toFixed(0);
  const b = new Intl.NumberFormat("en-US", { signDisplay: "exceptZero" }).format(diff.toFixed(0))
  return {
    cellclass: `text-light bg-${b<0?'danger':'success'}`,
    cellvalue: `${a}(${b})`
  }
}
export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const dt0 = ds0.LoadHistoryV1
  const dt1 = ds0.DriverCountPerDayV1
  const Terminals = dt1.map(x => x.Terminal)
  const tds = new Date(ds0.tds)
  const rows = dt0
    .filter(x => Terminals.includes(x.Terminal))
    .map(x => ({ ...x, DriverCountPerDay: dt1.find(y => y.Terminal === x.Terminal) }))
    .map(x => ({
      // x[`Day -1`],dt1.find(t=> t.Terminal === x.Terminal)[`Day -1`]
      'Terminal': x.Terminal,
      [fd0(addDays(tds, -1))]: h2(x, 1),
      [fd0(addDays(tds, -2))]: h2(x, 2),
      [fd0(addDays(tds, -3))]: h2(x, 3),
      [fd0(addDays(tds, -4))]: h2(x, 4),
      [fd0(addDays(tds, -5))]: h2(x, 5),
      [fd0(addDays(tds, -6))]: h2(x, 6),
      [fd0(addDays(tds, -7))]: h2(x, 7),
      [fd0(addDays(tds, -8))]: h2(x, 8),
      [fd0(addDays(tds, -9))]: h2(x, 9),
      [fd0(addDays(tds, -10))]: h2(x, 10),
      'M-F': x['M-F'].toFixed(0),
      'S+S': x['S+S'].toFixed(0),
      'ALC': x.ALC.toFixed(1),
    }))

  return rows
}
