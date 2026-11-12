<script>
  // shown when login or the file listing fails, so the page never sits on a spinner (#29)
  export let error
  console.error(error)
</script>
<div class="alert alert-warning w-75 mx-auto mt-4" role="alert">
  <h5 class="alert-heading">The dashboard could not load its data.</h5>
  <p>{error?.message ?? error}</p>
  <button class="btn btn-sm btn-outline-dark" on:click={() => location.reload()}>Try again</button>
</div>
