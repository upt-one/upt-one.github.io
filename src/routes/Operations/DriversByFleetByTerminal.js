import { getDefaultOptions, StackedBarChartLabels, FleetColors } from "$lib/chart-shared";
export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const dt0 = ds0.DriversByFleetByTerminalV1
  const dt1 = ds0.ICDriversByTerminalV1
  

  const Terminals = [...new Set(dt0.map(x => x.Terminal))].sort()
  const Fleets = [...new Set(dt0.map(x => x.Fleet))].sort()

  const mylabels = Terminals
  const myoptions = getDefaultOptions()
  myoptions.scales.x.ticks.maxTicksLimit = 100;
  myoptions.layout.padding.top = 50
  myoptions.scales.y.display = false
  myoptions.scales.x.stacked = true
  myoptions.scales.y.stacked = true
  myoptions.plugins.tooltip.displayColors = true
  myoptions.plugins.tooltip.callbacks.label = (context) =>
    `${context.dataset.label}: ${context.parsed.y}`
    myoptions.plugins.tooltip.callbacks.footer = (context) => {
      let total = context.reduce((a, b) => a + b.raw, 0)
      let firstContext = context[0]
      let lookups = firstContext.chart.config._config.data
      let idx = firstContext.dataIndex
      let ICDriverCount = lookups.ICDrivers[idx]
      return ['Total: ' + total, '','IC Drivers: ' + ICDriverCount]
    }
    myoptions.plugins.tooltip.footerColor = '#858796'

  const mydatasets = Fleets.map((f, i) => ({
    label: f,
    backgroundColor: FleetColors[f],
    data: Terminals
      .map(t =>
        dt0
          .filter(xx => xx.Terminal === t && xx.Fleet === f)
          .reduce((a, b) => a + b.Cnt, 0)
      )
  }))

  //chartjs data
  const mydata = {
    labels: mylabels,
    datasets: mydatasets,
    ICDrivers: Terminals.map(t=> dt1.find(x=>x.Terminal===t)?.Cnt ?? 0),
  }

  //chartjs config
  const config = {
    type: 'bar',
    data: mydata,
    options: myoptions,
    plugins: [StackedBarChartLabels],
    total: dt0.reduce((a, b) => a + b.Cnt, 0)
  }
  return config

};