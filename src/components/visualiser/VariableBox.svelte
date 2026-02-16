<script lang="ts">
    import { scale } from "svelte/transition";
    import { elasticOut } from "svelte/easing";
    import type { Variable } from "../../lib/visualisers/variables-module";

    let { variable } = $props<{ variable: Variable }>();
</script>

<div
    transition:scale={{ duration: 500, easing: elasticOut }}
    class="variable-card"
>
    <span class="label">{variable.name}</span>
    <div class="value-box">{variable.data}</div>
</div>

<style>
    .variable-card {
        /* TODO: Box styling here */
        background-color: blue;
    }
</style>