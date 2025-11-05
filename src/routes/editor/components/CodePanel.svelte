<script lang="ts">
    import Controls from './Controls.svelte';
    import { onMount } from 'svelte';

    
    let editorDiv: HTMLElement;

    onMount(() => {

    });
</script>

<div class="rounded-xl p-4 bg-(--primary) text-(--text)">
    <h1>Code</h1>
    <Controls />

    <div id="editor" class="h-full w-full" bind:this={editorDiv}></div>
</div>
<style>
    .h-full { height: 100%; }
    .w-full { width: 100%; }

    #editor {
        margin: 0;
    }
</style>