<script>
  import Router from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  const routes = {
    "/": wrap({ asyncComponent: () => import("./routes/Billing/Billing.svelte") }),
    "/Safety": wrap({ asyncComponent: () => import("./routes/Safety/Safety.svelte") }),
    "/Maint": wrap({ asyncComponent: () => import("./routes/Maint/Maint.svelte") }),
    "/Operations": wrap({ asyncComponent: () => import("./routes/Operations/Operations.svelte") }),
  };
</script>

<Router {routes} />
