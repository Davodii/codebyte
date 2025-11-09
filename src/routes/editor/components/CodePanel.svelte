<script lang="ts">
    import Controls from './Controls.svelte';
    import Editor from './Editor.svelte';
</script>

<div id="code-panel" class="rounded-xl p-4 bg-(--primary) text-(--text)">
    <h1>Code</h1>
    <hr>
    <Controls />
    <div class="editor-container">
        <Editor />
    </div>
</div>

<style>
    #code-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .editor-container {
        flex: 1;
        min-height: 0;

    }
</style>