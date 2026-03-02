  import {
    getDefaultOptions,
    StackedBarChartLabels,
  } from '$lib/chart-shared'

  export const getConfig = async (d) => {

    const json = d
    const ds0 = json.OperationsV1
    const tds = ds0.tds
    const dt0 = ds0.LULCountsV1
    // show a customers last
    const chartLabels = [...new Set(dt0.map((x) => x.Label))].reverse()
    // currently we assume same number of dates on all charts so we can calculate this once
    const myLabels = [...new Set(dt0.map((x) => x.Date))].map((d) =>
      new Date(d).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
      }),
    )
    //same options for each
    const myoptions = getDefaultOptions()
    myoptions.layout.padding.top = 50
    myoptions.scales.y.display = false;
    myoptions.plugins.tooltip.callbacks.label = context => `${context.dataset.label}: ${context.parsed.y}`
    myoptions.scales.y.suggestedMax = 15 //per matt's request, want these to scale to 15 at minimum

    const myConfigs = chartLabels.map((x, i) => ({
      chartID: `LULs${i}`,
      chartConfig: {
        type: 'bar',
        data: {
          labels: myLabels,
          datasets: [
            {
              label: 'LULs',
              backgroundColor: '#7baaf7',
              data: dt0.filter((y) => y.Label === x).map((y) => y.LULs),
            },
          ],
        },
        options: myoptions,
        plugins: [StackedBarChartLabels],
      },
      size: 6,
      title: `LULs - ${x}`,
      tds: tds,
    }))
    return myConfigs
  }
