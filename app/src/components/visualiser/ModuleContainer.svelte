<script lang="ts">
    let { id } = $props();
    let container = $state<HTMLDivElement>();

    export function getElement() {
        return container;
    }
</script>

<div class="module-container" id="module-container-{id}" bind:this={container}></div>

<style>
    .module-container {
        height: 100%;
        width: 100%;
        /* TODO: determine child layout options */
    }
</style>