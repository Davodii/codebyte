<script lang="ts">
    import { onMount } from 'svelte';
    import * as monaco from 'monaco-editor';
    import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
    import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

    let editor: HTMLDivElement;

    onMount(() => {
        // Setup editor worker
        window.MonacoEnvironment = {
            getWorker(_workerId: any, label: string) {
                if (label === 'typescript' || label === 'javascript') {
                    return new tsWorker();
                }
                return new editorWorker();
            }
        }

        console.log("Creating Monaco editor...");
        monaco.editor.create(
            editor, 
            {
                value: "console.log('Hello world!');",
                language: "typescript",
                wordBasedSuggestions: 'currentDocument',
            }
        );
        console.log("Editor created.");
    })

    
</script>

<div id="editor" bind:this={editor}></div>

<style>
    #editor {
        margin: 10vh auto;
        width: 100%;
        height: 50vh;
    }
</style>