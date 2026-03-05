<script lang="ts">
    import { scale } from "svelte/transition";
    import { elasticOut } from "svelte/easing";
    import type { Variable } from "$lib/visualisers/variables/variables-module.svelte";
    import { valueToString } from "$lib/data/events/events.svelte";

    let { variable, colour = "blue" } : { variable: Variable, colour: string } = $props<{ variable: Variable, colour: string}>();

    function inverseColour(hsl: string): string {
        // hsl is in the format "hsl(hue, saturation%, lightness%)"
        const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return "black"; // Fallback to black if parsing fails
        let [_, hue, saturation, lightness] = match.map(Number);
        hue = (hue + 180) % 360; // Invert the hue
        lightness = 100 - lightness; // Invert the lightness
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
</script>

<div
    transition:scale={{ duration: 500, easing: elasticOut }}
    class="variable-card"
    style="background-color: {colour};"
    
>
    <span class="label" style:color="{inverseColour(colour)}">{variable.name}</span>
    <div class="value-box" style:color="{inverseColour(colour)}">{valueToString(variable.data.value)}</div>
</div>

<style>
    .variable-card {
        padding: 20px;
        border-radius: 8px;
        width: 50px;
        height: 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .label {
        font-size: 24px;
        font-weight: bold;
    }

    .value-box {
        font-size: 20px;
    }

</style>