<script lang="ts">
    import { onMount } from "svelte";
    import { engine } from "$lib/engine.svelte";
    import { Visualiser } from "$lib/visualiser";

    let canvasElement = $state<HTMLDivElement | null>(null);
    let visualiserInstance = $state<Visualiser | null>(null);

    $effect(() => {
        if (canvasElement && !visualiserInstance) {
            // Instantiate the logic once the div exists
            visualiserInstance = new Visualiser(canvasElement);
        }
    });

    // React to level changes
    // $effect(() => {
    //     if (visualiserInstance && engine.state.currentLevelId) {
    //         const modules = get(engine.state.currentLevelId)
    //     }
    // })
</script>

<div class="visualiser-canvas" bind:this={canvasElement}></div>

<style>
    .visualiser-canvas {
        background-color: aquamarine; /* Testing purposes */
    }
</style>