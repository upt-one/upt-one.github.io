<script>
  // Default route (Billing) is eager-imported so first paint after auth
  // doesn't have to wait on a route-chunk fetch — that gap shows as an
  // empty page between "login finished" and "tile appears."
  // Other routes stay lazy: their chunks fetch on first navigation.
  import Router from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  import Billing from "./routes/Billing/Billing.svelte";
  const routes = {
    "/": Billing,
    "/Maint": wrap({ asyncComponent: () => import("./routes/Maint/Maint.svelte") }),
    "/Operations": wrap({ asyncComponent: () => import("./routes/Operations/Operations.svelte") }),
    "/Finance": wrap({ asyncComponent: () => import("./routes/Finance/Finance.svelte") }),
  };
</script>

<Router {routes} />
