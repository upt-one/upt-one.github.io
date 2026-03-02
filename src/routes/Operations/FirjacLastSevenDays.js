import {
  getDefaultOptions,
  StackedBarChartLabels,
  LoadStatusColors,
} from '$lib/chart-shared'

export const getConfig = async (d) => {

  const json = d
  const ds0 = json.OperationsV1
  const tds = ds0.tds
  const dt0 = ds0.FirjacLoadsV1
  const dt1 = ds0.FirjacFirstLoadsV1
  const myTerminals = [...new Set(dt0.map((x) => x.Terminal))]
  //width of chart is bootstrap width. divisible by 12. by default, it is 4
  // so 3 charts fit on one line as the default was originally 3 charts, one for each
  // of three terminals. adding macon created 4 charts, so we'll look to
  // see if the terminals are divisible by 3 evenly and if so set it to 3
  // but otherwise set it to 6 which will put 2 charts on each row
  const WidthOfChart = myTerminals.length % 3 === 0 ? 4 : 6
  const myDates = [...new Set(dt0.map((x) => x.Date))]
  const myLabels = myDates.map((d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    }),
  )

  //set chart options
  const myoptions = getDefaultOptions()
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
    let firstContext = context[0]
    let lookups = firstContext.chart.config._config.data
    let idx = firstContext.dataIndex
    let fce = lookups.fcebydate[idx]
    let ori = lookups.originalbydate[idx]
    let vpct = ((fce / total) * 100).toFixed(0)
    let fcepct = (isNaN(vpct) ? 0 : vpct) + '%'
    return ['Total: ' + total, 'FCE: ' + fcepct, '', 'Initial: ' + ori]
  }
  myoptions.plugins.tooltip.footerColor = '#858796'

  //return config for each terminal with appropriate data
  return myTerminals.map((myTerminal) => {
    //add a series for each status with each date for this terminal
    const myDatasets = ['CMP', 'STD', 'DSP', 'PLN', 'AVL'].map(
      (myStatus) => ({
        label: myStatus,
        backgroundColor: LoadStatusColors[myStatus],
        data: myDates.map((myDate) => {
          let r = dt0.filter(
            (x) =>
              (x.Terminal === myTerminal) &
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
      fcebydate: myDates.map((myDate) => {
        let r = dt0.filter(
          (x) => (x.Terminal === myTerminal) & (x.Date === myDate),
        )
        return r[0] ? r.reduce((a, b) => a + b.FCE, 0) : 0 //in case no record, return 0
      }),
      originalbydate: myDates.map((myDate) => {
        let r = dt1.find(
          (x) =>
            (x.Terminal.substring(0, 3) === myTerminal) &
            (x.Date.substring(0, 10) === myDate),
        )
        return r ? r.Loads : 0 //in case no record, return 0
      }),
    }

    //chartjs config
    const config = {
      type: 'bar',
      data: mydata,
      options: myoptions,
      plugins: [StackedBarChartLabels],
    }

    //chartcard config
    return {
      chartID: 'FirjacLastSevenDaysChart' + myTerminal,
      chartConfig: config,
      size: WidthOfChart,
      title: myTerminal + ' - Firjac - Last 10 Days',
      tds: tds,
    }
  })
}