import {
  getDefaultOptions,
  StackedBarChartLabels,
  TerminalColors,
} from '$lib/chart-shared'
import { addDays } from '$lib/frtl-utility.js'
const getMondayByDate = (d) => {
  const first = d.getDate() - d.getDay() + 1;
  const monday = new Date(d.setDate(first));
  return monday;
}
export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const tds = ds0.tds
  const dt0 = ds0.AtoV1
  const myTerminals = [...new Set(dt0.map((x) => x.Terminal))]
  const firstMonday = getMondayByDate(new Date(tds))
  const myDates = [0, 1, 2, 3, 4, 5].map(x => addDays(firstMonday, 7 * x))
  const myLabels = myDates.map((d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    }),
  )
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

  const mydatasets = myTerminals.map((t, tc) => ({
    label: t,
    backgroundColor: TerminalColors[tc * 3] ?? TerminalColors[tc],
    data: [0, 1, 2, 3, 4, 5].map(i => dt0.find(x => x.Terminal === t && x.WD === i)?.Cnt ?? 0)
  }))

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
  }
  return config
}
