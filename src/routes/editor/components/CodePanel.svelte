<script lang="ts">
    import Controls from './Controls.svelte';

    import { onMount } from 'svelte';
    import * as monaco from 'monaco-editor';
    import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
    import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

    let editorContainer: HTMLElement;
    let monacoInstance: monaco.editor.IStandaloneCodeEditor;

    // Setup editor worker
    window.MonacoEnvironment = {
        getWorker(_workerId: any, label: string) {
            if (label === 'typescript' || label === 'javascript') {
                return new tsWorker();
            }
            return new editorWorker();
        }
    };

    onMount(() => {
        console.log("Creating Monaco editor...");

        monacoInstance = monaco.editor.create(
            editorContainer, 
            {
                value: "console.log('Hello world!');",
                language: "typescript",
                wordBasedSuggestions: 'currentDocument',
                automaticLayout: true,
            }
        );
        monaco.editor.setTheme('vs-dark');
        console.log("Editor created.");
    })

    export function resize() {
        if (monacoInstance) {
            // monacoInstance.layout() tells editor to measure its container
            // and adjust its internal rendering, scrollbars, etc
            monacoInstance.layout();
            console.log("WAHAHHA");
        }
    }
    
</script>

<div class="rounded-xl p-4 bg-(--primary) text-(--text)">
    <h1>Code</h1>
    <div id="editor" bind:this={editorContainer} class="h-full w-full"></div>

    <Controls />
</div>
<style>
    .h-full { height: 100%; }
    .w-full { width: 100%; }

    #editor {
        margin: 0;
    }
</style>