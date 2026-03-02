import { getDefaultOptions, StackedBarChartLabels, TerminalColors } from "$lib/chart-shared";

export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const dt0 = ds0.TractorsV1
  const dt1 = ds0.DriversByFleetByTerminalV1
  const dt2 = ds0.ICDriversByTerminalV1

  const mylabels = dt0.map(x => x.Terminal)
  const tractors = dt0.map(x => x.Cnt)
  const colors = TerminalColors
  const mydatasets = [
    {
      label: 'Tractors',
      backgroundColor: colors,
      borderColor: colors,
      data: tractors,
    },
  ]
  const mydata = {
    labels: mylabels,
    datasets: mydatasets,
  }
  const myoptions = getDefaultOptions()
  myoptions.scales.x.ticks.maxTicksLimit = 100;
  myoptions.layout.padding.top = 50
  myoptions.scales.y.display = false
  myoptions.plugins.tooltip.displayColors = true
  myoptions.scales.y.suggestedMax = 15 //per matt's request, want these to scale to 15 at minimum
  myoptions.plugins.tooltip.callbacks.label = (context) =>
    `${context.dataset.label}: ${context.parsed.y}`
  myoptions.plugins.tooltip.callbacks.footer = (context) => {
    let firstContext = context[0]
    let trucks = firstContext.raw
    let terminal = firstContext.label
    let config = firstContext.chart.config._config
    let drivers = config.dc[terminal] ?? 0
    let icDrivers = config.ic.find(x => x.Terminal === terminal)?.Cnt ?? 0
    let cDrivers = drivers - icDrivers
    let ratio = trucks === 0 || cDrivers === 0 ? 0 : cDrivers / trucks
    return [`Drivers/Truck: ${ratio.toFixed(2)}`]
  }
  myoptions.plugins.tooltip.footerColor = '#858796'

  return {
    type: 'bar',
    data: mydata,
    options: myoptions,
    plugins: [StackedBarChartLabels],
    //add driver counts so we can calculate driver/tractor ratio in the tooltip
    dc: dt1
      .reduce((a, { Terminal: k, Cnt: v }) =>
        (a[k] = (a[k] || 0) + v) && a, {}),
    ic: dt2
  }

};