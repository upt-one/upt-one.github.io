<script>
  import Router from "svelte-spa-router";
  import Billing from "./routes/Billing/Billing.svelte";
  import Safety from "./routes/Safety/Safety.svelte";
  import Maint from "./routes/Maint/Maint.svelte";
  import Operations from "./routes/Operations/Operations.svelte";
  const routes = {
    "/": Billing,
    "/Safety": Safety,
    "/Maint": Maint,
    "/Operations": Operations,
  };
</script>

<Router {routes} />
