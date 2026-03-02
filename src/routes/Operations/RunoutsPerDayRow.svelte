<script>
  export let row
  export let totalrow = false
  let hasdata =
    Object.values(row)
      .slice(1, 5)
      .reduce((a, b) => a + b) !== 0
  let show = false
  const fmtNums = (a) => (a === 0 ? '' : a)
  const fmtBillTos = (a) => a.split(',').sort().join('<br />')
</script>

<tr
  class="text-end"
  class:table-dark={totalrow}
  on:click={() => {
    show = !show
  }}>
  <td class="text-start" class:border={show&&!totalrow}>{row[0]}</td>
  <td>{fmtNums(row[1])}</td>
  <td>{fmtNums(row[2])}</td>
  <td>{fmtNums(row[3])}</td>
  <td>{fmtNums(row[4])}</td>
</tr>
{#if show}
    {#if hasdata}
    <tr class="text-end align-text-top alert-warning">
      <td>Impacted:</td>
      <td>
        {@html fmtBillTos(row[5])}
      </td>
      <td>
        {@html fmtBillTos(row[6])}
      </td>
      <td>
        {@html fmtBillTos(row[7])}
      </td>
      <td>
        {@html fmtBillTos(row[8])}
      </td>
    </tr>
    {:else}
    <tr class="text-end align-text-top alert-success">
      <td />
      <td class="text-center" colspan="4">
        No impacted customers.
      </td>
    </tr>
      {/if}

{/if}
