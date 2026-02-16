<script lang="ts">
    let { id } = $props();
    let container : HTMLDivElement;

    export function getElement() {
        return container;
    }
</script>

<div class="module-container" id="module-container-{id}" bind:this={container}></div>

<style>
    .module-container {
        height: 100%;
        width: 100%;
        border: 1px dashed #ccc; /* For debug */

        /* TODO: determine child layout options */
    }
</style>