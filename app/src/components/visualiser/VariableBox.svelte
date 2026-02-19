<script lang="ts">
    import { scale } from "svelte/transition";
    import { elasticOut } from "svelte/easing";
    import type { Variable } from "$lib/visualisers/variables-module.svelte";

    let { variable, colour = "blue" } = $props<{ variable: Variable, colour: string}>();
</script>

<div
    transition:scale={{ duration: 500, easing: elasticOut }}
    class="variable-card"
    style="background-color: {colour};"
>
    <span class="label">{variable.name}</span>
    <div class="value-box">{variable.data}</div>
</div>

<style>
    /* .variable-card {
    } */
</style>