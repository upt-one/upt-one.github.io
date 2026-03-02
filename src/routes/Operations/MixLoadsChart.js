import {
  getDefaultOptions,
  StackedBarChartLabels,
  TerminalColors,
} from '$lib/chart-shared'
import { addMonths } from '$lib/frtl-utility.js'

export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const tds = new Date(ds0.tds)
  const dt0 = ds0.MixLoadsV1
  const myTerminals = [...new Set(dt0.map((x) => x.Terminal))]
  const myKeys = [...Array(12).keys()].reverse()
  const myProps = myKeys.map(x => x === 0 ? 'c' : -x).map(x => `${x}`)
  const myDates = myKeys.map(x => addMonths(tds, -x))
  const myLabels = myDates.map((d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
    }),
  )
  const fd0 = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short'
  })
  const rows = dt0
    .map((x) => ({
      Terminal: x.terminal,
      [fd0(addMonths(tds, -11))]: x['-11'],
      [fd0(addMonths(tds, -10))]: x['-10'],
      [fd0(addMonths(tds, -9))]: x['-9'],
      [fd0(addMonths(tds, -8))]: x['-8'],
      [fd0(addMonths(tds, -7))]: x['-7'],
      [fd0(addMonths(tds, -6))]: x['-6'],
      [fd0(addMonths(tds, -5))]: x['-5'],
      [fd0(addMonths(tds, -4))]: x['-4'],
      [fd0(addMonths(tds, -3))]: x['-3'],
      [fd0(addMonths(tds, -2))]: x['-2'],
      [fd0(addMonths(tds, -1))]: x['-1'],
      [fd0(addMonths(tds, 0))]: x['c'],
    }))
  //set chart options
  const myOptions = getDefaultOptions()
  myOptions.layout.padding.top = 50
  myOptions.scales.y.display = false
  myOptions.scales.x.stacked = true
  myOptions.scales.y.stacked = true
  myOptions.plugins.tooltip.displayColors = true
  myOptions.scales.y.suggestedMax = 15 //per matt's request, want these to scale to 15 at minimum
  myOptions.plugins.tooltip.callbacks.label = ctx =>
    ctx.parsed.y === 0
      ? ''
      : ctx.dataset.label + ': ' + ctx.parsed.y
  myOptions.plugins.tooltip.callbacks.footer = (context) => {
    let total = context.reduce((a, b) => a + b.raw, 0)
    return ['Total: ' + total]
  }
  myOptions.plugins.tooltip.footerColor = '#858796'
  myOptions.scales.x.ticks.maxTicksLimit = null
  myOptions.plugins.legend.display = true
  myOptions.plugins.legend.position = 'bottom'

  const mydatasets = dt0.map((t, tc) => ({
    label: t.terminal,
    backgroundColor: TerminalColors[tc] ?? TerminalColors[0],
    data: myProps.map(p => t[p] ?? 0),
  }))
  // myTerminals.map((t, tc) => ({
  //   label: t,
  //   backgroundColor: TerminalColors[tc * 3] ?? TerminalColors[tc],
  //   data: dt0.find(x => x.Terminal === t)
  // }))

  //chartjs data
  const mydata = {
    labels: myLabels,
    datasets: mydatasets,
  }

  //chartjs config
  const config = {
    type: 'bar',
    data: mydata,
    options: myOptions,
    plugins: [StackedBarChartLabels],
    rows: rows,
  }
  return config
}
