<script>
    export let size, title,tds;
</script>
<div class="col-lg-{size} g-2 g-lg-4">
    <div class="card">
        <div class="card-header bg-light text-dark d-flex justify-content-between align-items-center">
            {#if Array.isArray(title)}
            {#each title as t}
            <span>{t}</span>
            {/each}
            {:else}
            <span>{title}</span>
            {/if}
            <!-- right-side header controls (e.g. the billing division filter); empty for most cards -->
            <slot name="header"></slot>
        </div>
        <slot></slot>
        <div class="card-footer text-center text-muted text-small justify-content-between">
            Last Updated: {new Date(tds).toLocaleString()}
        </div>
    </div>
</div>