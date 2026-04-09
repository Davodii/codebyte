<script lang="ts">
    let { id, fill = false } = $props();
    let container = $state<HTMLDivElement>();

    export function getElement() {
        return container;
    }
</script>

<div class="module-container" class:fill id="module-container-{id}" bind:this={container}></div>

<style>
    .module-container {
        width: 100%;
        color: inherit;
        background-color: inherit;
        display: flex;
        gap: 5px;
    }

    /* Modules that want to fill the remaining panel space opt in via fill=true */
    .fill {
        flex: 1;
        min-height: 0;
    }
</style>