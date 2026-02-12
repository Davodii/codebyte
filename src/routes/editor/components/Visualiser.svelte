<script lang="ts">
    import { engine } from "$lib/engine.svelte";
    import { fly } from "svelte/transition";
</script>

<div class="output-grid">
    {#each Array.from(engine.snapshot) as [name, value]}
        <div
            id="var={name}"
            class="variable-box"
            class:highlighted={engine.currentEvent?.name === name}
            in:fly={{ y: 20 }}
        >
            <span class="label">{name}</span>
            <span class="value">{value}</span>

            <!-- TODO: point this variable out if it is new -->
        </div>
    {/each}
</div>

<style>
    .variable-box {
        border: 2px solid #4a90e2;
        padding: 1rem;
        transition: all 0.2s;
    }

    .highlighted {
        border-color: #f5a623;
        transform: scale(1.05);
    }

    /* .pointer-arrow {
        position: absolute;
        right: -60px;
        color: #f5a623;
        font-weight: bold;
    } */
</style>