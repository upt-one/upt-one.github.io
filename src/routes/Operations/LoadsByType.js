import {
  getDefaultOptions,
  StackedBarChartLabels,
  FleetColors,
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
  const dt0 = ds0.LoadsByTypeV2
  const firstMonday = getMondayByDate(new Date(tds))
  const myDates = [6,5,4,3,2,1].map(x => addDays(firstMonday, -7 * x))
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
  myoptions.plugins.tooltip.callbacks.label = (context) =>
    `${context.dataset.label}: ${context.parsed.y}`
    myoptions.plugins.tooltip.callbacks.footer = (context) => {
      let total = context.reduce((a, b) => a + b.raw, 0)
      return ['Total: ' + total]
    }
  myoptions.plugins.tooltip.footerColor = '#858796'
  
  const mydatasets = dt0.map(x => ({
    label: x.cat,
    backgroundColor: FleetColors[x.cat],
    data: [6,5,4,3,2,1].map(i => x[i]),
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
    options: myoptions,
    plugins: [StackedBarChartLabels],
  }
  return config
}
