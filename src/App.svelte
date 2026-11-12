<script>
  import "bootstrap/dist/css/bootstrap.min.css";
  import "$lib/global.css";
  import NavBar from '$lib/NavBar.svelte'
  import Spinner from '$lib/Spinner.svelte'
  import LoadError from '$lib/LoadError.svelte'
  import Content from './Content.svelte'
  window['dbg'] = window.location.href.includes('?debug')
  window['dbg'] && console.log('\n---debug messaging enabled---\n\n')
  import { getAuth, accessToken } from '$lib/auth.js'
  import { getData, data } from '$lib/data.js'
</script>

{#if $data}
  <NavBar />
{/if}
<main class="flex-shrink-0">
  <div class="container">
    <div class="container-fluid">
      <div class="row pb-2 pb-lg-4">
        {#await getAuth()}
          <Spinner message={'Logging in...'} />
        {:then _}
          {#await getData($accessToken)}
            <Spinner message={'Getting data...'} />
          {:then _}
            <Content />
          {:catch error}
            <LoadError {error} />
          {/await}
        {:catch error}
          <LoadError {error} />
        {/await}
      </div>
    </div>
  </div>
</main>
