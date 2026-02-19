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

<div class="content">
    <div class="header">
        <img src="/svelte.svg" alt="Svelte Icon">
        <span class="text-4xl">Panels Test</span>
    </div>
    <div class="panel-container">
        <div class="panel">
            <h1>Panel 1</h1>
            <div class="panel-content">
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus reprehenderit corrupti voluptate incidunt. Distinctio dicta eaque minus perferendis ratione. Tenetur nihil vel earum qui quo odit, inventore aliquid corrupti dolores.</p>
            </div>
        </div>
        <div class="splitter"></div>
        <div class="panel">
            <h1>Panel 2</h1>
            <div class="panel-content flex flex-col">
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus, aperiam nisi incidunt beatae consequuntur dolor atque perferendis, blanditiis consequatur quibusdam modi quisquam, doloribus id. Assumenda reprehenderit quas accusamus doloremque culpa.</p>
                <div class="editor" bind:this={editorDiv}></div>
            </div>
        </div>
        <div class="splitter"></div>
        <div class="panel">
            <h1>Panel 3</h1>
            <div class="panel-content">
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae quia nostrum, qui cum atque sequi eius quaerat dolorem quibusdam autem pariatur non nulla porro molestias sed ducimus reiciendis exercitationem alias!</p>
            </div>
        </div>
    </div>
</div>

<style>
    .content {
        display: flex;
        flex-direction: column;
        height: 100vh;
        max-height: 100vh;
    }

    .header {
        height: 100px;
        flex-shrink: 0;
    }

    .panel-container {
        flex-grow: 1;
        display: flex;
        flex-direction: row;
        margin: 0;
        border: black 3px solid;
        min-height: 0;
    }

    .panel {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        padding: 0;

        min-height: 0;
    }

    .panel-content {
        flex-grow: 1;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .editor {
        flex-grow: 1;
        min-height: 0;
        overflow: hidden;
        height: 100%;
    }

    .splitter {
        width: 40px;
        background-color: black;
    }

    :global(.cm-editor) {
        width: 100%;
        height: 100%;
    }

    :global(.cm-scroller) {
        overflow:auto;
    }
</style>