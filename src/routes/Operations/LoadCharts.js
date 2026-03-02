import {
  getDefaultOptions,
  StackedBarChartLabels,
  LoadStatusColors,
  UniqueColors,
} from '$lib/chart-shared'

export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const tds = ds0.tds
  const dt0 = ds0.LoadChartsV2
  const myChartNames = [...new Set(dt0.map((x) => x.ChartName))]

  const myDates = [...new Set(dt0.map((x) => x.Date))].sort()
  const myLabels = myDates.map((d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    }),
  )

  //set chart options
  const myoptions = getDefaultOptions()
  myoptions.scales.x.ticks.maxTicksLimit = 100;
  myoptions.layout.padding.top = 50
  myoptions.scales.y.display = false
  myoptions.scales.x.stacked = true
  myoptions.scales.y.stacked = true
  myoptions.plugins.tooltip.displayColors = true
  myoptions.scales.y.suggestedMax = 15 //per matt's request, want these to scale to 15 at minimum

  //reverse tooltip order
  //ref https://stackoverflow.com/questions/43474802/chart-js-y-axis-label-reverse-tooltip-order-shorten-x-axis-labels
  myoptions.plugins.tooltip.itemSort = (a, b) =>
    b.datasetIndex - a.datasetIndex
  myoptions.plugins.tooltip.callbacks.label = (context) =>
    `${context.dataset.label}: ${context.parsed.y}`
  myoptions.plugins.tooltip.callbacks.footer = (context) => {
    let total = context.reduce((a, b) => a + b.raw, 0)
    return ['Total: ' + total,]
  }
  myoptions.plugins.tooltip.footerColor = '#858796'

  //return config for each terminal with appropriate data
  return myChartNames
    //sort descending order
    .sort((a, b) => {
      var textA = a.toUpperCase()
      var textB = b.toUpperCase()
      return textA > textB ? -1 : textA < textB ? 1 : 0
    })
    .map((myChartName) => {

      // Defaults to load status except for dry charts
      const myStatuses = /^dry/i.test(myChartName)
        ? [...new Set(dt0.filter(x=>/^dry/i.test(x.ChartName)).map((x) => x.Status))]
          .sort((a, b) => b.localeCompare(a))
        : ['CMP', 'STD', 'DSP', 'PLN', 'AVL']

      const myColors = /^dry/i.test(myChartName)
        ? myStatuses.reduce((a,b,c) => {
          a[b] = UniqueColors[6 + (c*2)]
          return a
        }, {})
        : LoadStatusColors
          
      //add a series for each status with each date for this ChartName
      const myDatasets = myStatuses.map(
        (myStatus) => ({
          label: myStatus,
          backgroundColor: myColors[myStatus],
          data: myDates.map((myDate) => {
            let r = dt0.filter(
              (x) =>
                (x.ChartName === myChartName) &
                (x.Status === myStatus) &
                (x.Date === myDate),
            )
            return r[0] ? r[0].Loads : 0 //in case no record, return 0
          }),
        }),
      )

      //chartjs data
      const mydata = {
        labels: myLabels,
        datasets: myDatasets,
      }

      //on dry loads, omit 0 on tooltip
      let cOptions = myoptions
      if (/^dry/i.test(myChartName)) {
        cOptions.plugins.tooltip.callbacks.label = (context) =>
        context.parsed.y === 0 ? null : `${context.dataset.label}: ${context.parsed.y}`
      }
      //chartjs config
      const config = {
        type: 'bar',
        data: mydata,
        options: cOptions,
        plugins: [StackedBarChartLabels],
      }

      //chartcard config
      return {
        chartID: 'FirjacLastSevenDaysChart' + myChartName,
        chartConfig: config,
        title: myChartName,
        tds: tds,
      }
    }
    )
}
