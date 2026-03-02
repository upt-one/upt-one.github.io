import { getDefaultOptions, months, FleetColors, StackedBarChartLabels } from "$lib/chart-shared";
export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const dt0 = ds0.AvgDailyLoadsV2

  const mylabels = Object.keys(dt0[0]).filter((x, i) => i > 0).map((x) => months[x.split('-')[1] - 1])
  const myoptions = getDefaultOptions()
  myoptions.layout.padding.top = 50
  myoptions.scales.y.display = false
  myoptions.scales.x.stacked = true
  myoptions.scales.y.stacked = true
  myoptions.plugins.tooltip.displayColors = true
  myoptions.plugins.tooltip.callbacks.label = (context) =>
    `${context.dataset.label}: ${context.parsed.y}`
  myoptions.plugins.tooltip.callbacks.footer = (context) => {
    let total = context.reduce((a, b) => a + b.raw, 0)
    return ['Total: ' + total]
  }
  myoptions.plugins.tooltip.footerColor = '#858796'

  const mydatasets = dt0.map((x, i) => {
    const { CAT: Fleet, ...rest } = x
    return {
      label: Fleet,
      backgroundColor: FleetColors[Fleet],
      data: Object.values(rest)
    }
  })

  //chartjs data
  const mydata = {
    labels: mylabels,
    datasets: mydatasets,
  }

  //chartjs config
  const config = {
    type: 'bar',
    data: mydata,
    options: myoptions,
    plugins: [StackedBarChartLabels],
  }
  return config
}
