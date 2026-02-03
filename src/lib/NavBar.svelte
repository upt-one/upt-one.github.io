<script>
  import { link } from 'svelte-spa-router'
  import active from 'svelte-spa-router/active'
</script>

<nav class="navbar navbar-expand navbar-light fixed-top bg-light">
  <div class="container-fluid">
    <a class="navbar-brand" href="/" use:link>
      <img
        src="nav-bar-logo.png"
        height="32px"
        alt="logo"
        class="rounded border border-light" />
    </a>
    <div class="collapse navbar-collapse" id="navbarsExample02">
      <div class="navbar-nav ms-auto">
        <a class="nav-link" use:link use:active={'/'} href="/">Billing</a>
      </div>
    </div>
  </div>
</nav>
