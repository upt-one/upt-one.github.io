<script>
  import ToggleButton from '$lib/ToggleButton.svelte'
  import BillingKPIsRowDetail from './BillingKPIsRowDetail.svelte'
  import { number_format, isMP } from '$lib/frtl-utility'
  export let kpi
  let show = false
  // Defer tsum until row is expanded — saves N upfront compute passes for
  // KPIs the user never opens.
  $: TerminalTotals = show ? kpi.tsum(kpi.rows) : []
  import { data } from '$lib/data.js'
  const json = $data
  const getMProws = (json, kpi) =>
    kpi.showMPS && kpi.mpf
      ? kpi.rows
          .filter((x) => isMP(json, x[kpi.mpf]))
          .map((x) => parseFloat(x.ivh_totalcharge))
      : []
  const mprows = kpi.showMPS && getMProws(json, kpi)
  const showMPS = kpi.showMPS && mprows.length !== 0
  const mpSubText = () => {
    let retval = mprows.length
    if (kpi.isInvoice) {
      retval += ` ($${number_format(
        mprows.reduce((x, y) => x + y) / 1000,
        0,
      )}k)`
    }
    return retval
  }
</script>

<tr class="text-end">
  <td class="text-start">{kpi.KPI}</td>
  <td>{kpi.Current}</td>
  <td>{kpi.Goal}</td>
  <td>
    <ToggleButton bind:show />
  </td>
</tr>
{#if showMPS}
  <tr>
    <td colspan="2" class="text-end pt-0">
      <small class="text-muted missing-paperwork">
        Missing Paperwork: {mpSubText()}
      </small>
    </td>
  </tr>
{/if}
{#if show}
  <tr>
    <td colspan="4">
      <div class="table-responsive m-0 mt-2 m-lg-4">
        <table class="table table-borderless align-middle">
          <thead>
            <tr class="table-dark text-end">
              <th class="text-start">
                {#if kpi.kfil.toLowerCase() === 'ord_status'}
                  Status
                {:else if kpi.kfil.toLowerCase() === 'date'}
                  Date
                {:else}Terminal{/if}
              </th>
              <th>{kpi.thdr}</th>
              {#if kpi.showMPS}
                <th>Missing Paperwork</th>
              {/if}
              <th />
            </tr>
          </thead>
          <tbody>
            {#each TerminalTotals as tt}
              <BillingKPIsRowDetail {tt} {kpi} />
            {/each}
          </tbody>
        </table>
      </div>
    </td>
  </tr>
{/if}
