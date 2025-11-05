<script lang="ts">
    import Controls from './Controls.svelte';
    import { onMount } from 'svelte';
    import { basicSetup } from "codemirror";
    import { EditorView } from '@codemirror/view';
    import { EditorState } from "@codemirror/state";
    import { javascript } from "@codemirror/lang-javascript";
    import { oneDark } from "@codemirror/theme-one-dark";
    
    let editorDiv: HTMLDivElement;
    export let value = "console.log('Hello World!');";
    export let onChange = (val: String) => {};

    onMount(() => {
        const startState = EditorState.create({
            doc: value,
            extensions: [
                basicSetup,
                javascript(),
                oneDark,
                EditorView.updateListener.of(update => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString());
                    }
                })
            ]
        });

        const view = new EditorView({
            state: startState,
            parent: editorDiv,
        });

        return () => view.destroy();
    });

    
</script>

<div class="rounded-xl p-4 bg-(--primary) text-(--text) overflow-hidden">
    <h1>Code</h1>
    <hr>
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