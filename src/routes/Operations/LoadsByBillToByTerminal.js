import { getDefaultOptions, StackedBarChartLabels, UniqueColors } from "$lib/chart-shared";
export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const dt0 = ds0.LoadsByBillToByTerminalV1

  //Terminal and BillTo list will be the same for all charts
  const Terminals = [...new Set(dt0.map(x => x.Terminal))].sort()
  const BillTos = [...new Set(dt0.map(x => x.BillTo))].sort()

  //Adjust to match the way we split up the charts in the chart group
  const myCharts = [...new Set(dt0.map((x) => x.Date))].sort()
  
  //set labels and colors so consistent across charts
  const myLabels = Terminals
  const myColors = BillTos
    .reduce((a,b,c) => {
      a[b] = UniqueColors[c]
      return a
    }, {})
  
  //set the same options for each chart in this group of charts
  const myOptions = getDefaultOptions()
  myOptions.scales.x.ticks.maxTicksLimit = 100;
  myOptions.layout.padding.top = 50
  myOptions.scales.y.display = false
  myOptions.scales.x.stacked = true
  myOptions.scales.y.stacked = true
  myOptions.plugins.tooltip.displayColors = true
  myOptions.plugins.tooltip.callbacks.label = ctx =>
    ctx.parsed.y === 0
      ? ''
      : ctx.dataset.label + ': ' + ctx.parsed.y
  myOptions.plugins.tooltip.callbacks.footer = ctx =>
    ['Total: ' + ctx.reduce((a, b) => a + b.raw, 0)]
  myOptions.plugins.tooltip.footerColor = '#858796'

  const getData = (b, d) => Terminals.map(t =>
      dt0.find((x) =>
        (x.Terminal === t) &&
        (x.BillTo === b) &&
        (x.Date === d)
      )?.Cnt ?? 0
    )

  const getDatasets = (d) => BillTos.map(b => ({
    label: b,
    backgroundColor: myColors[b],
    data: getData(b, d)
  }))

  const getTitle = (d) => [
    `Loads/BillTo by Terminal - ${
      new Date(d).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
      })
    }`,
    `Total: ${dt0
      .filter(xx => xx.Date === d)
      .reduce((a, b) => a + b.Cnt, 0)}`
  ]

  const getChartConfig = (d) => ({
    title: getTitle(d),
    type: 'bar',
    options: myOptions,
    plugins: [StackedBarChartLabels],
    data: {
      labels: myLabels,
      datasets: getDatasets(d)
    },
  })

  const chartConfigs = myCharts
    .map(m => getChartConfig(m));

  return chartConfigs;

}