<script lang="ts">
    import {EditorView, basicSetup} from 'codemirror';
    import { javascript } from '@codemirror/lang-javascript';

    import { onMount } from 'svelte';

    let editorDiv: HTMLDivElement;

    onMount(() => {
        let editor = new EditorView({
            extensions: [ basicSetup, javascript() ],
            parent: editorDiv,
        });
    });
</script>

<div class="editor" bind:this={editorDiv}></div>

<style>
    .editor {
        width: 50%;
        height: 500px;
    }

    :global(.cm-editor) {
        width: 100%;
        height: 100%;
    }
</style>