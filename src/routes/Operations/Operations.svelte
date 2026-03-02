<script>
  import DriverCountPerDay from './DriverCountPerDay.svelte'
  import LULCharts from './LULCharts.svelte'
  import RunoutsPerDay from './RunoutsPerDay.svelte'
  import LoadForecast from './LoadForecast.svelte'
  import LoadHistory from './LoadHistory.svelte'
  import Ato from './Ato.svelte'
  import AverageLoadsByMonth from './AverageLoadsByMonth.svelte'
  import DriversByFleetByTerminal from './DriversByFleetByTerminal.svelte'
  import Tractors from './Tractors.svelte'
  import LoadsByType from './LoadsByType.svelte'
  import LoadHistoryVsTarget from './LoadHistoryVsTarget.svelte'
  import LoadsByBillToByTerminal from './LoadsByBillToByTerminal.svelte'
  import LoadCharts from './LoadCharts.svelte'
  import MixLoadsChart from './MixLoadsChart.svelte'
  import FirjacLastSevenDays from './FirjacLastSevenDays.svelte'
</script>

<LoadsByBillToByTerminal />
<DriversByFleetByTerminal />
<Tractors />
<LoadsByType />
<AverageLoadsByMonth />
<Ato />
<DriverCountPerDay />
<LoadForecast />
<LoadHistory />
<LoadHistoryVsTarget />
<RunoutsPerDay />
<LoadCharts />
<MixLoadsChart />
<FirjacLastSevenDays />
