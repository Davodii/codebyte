<script lang="ts">
    import Controls from "./components/Controls.svelte";
    import CodePanel from "./components/CodePanel.svelte";
    import InfoPanel from "./components/InfoPanel.svelte";
    import OutputPanel from "./components/OutputPanel.svelte";
</script>

<div class="editor-layout">
    <InfoPanel/>
    <div>
        <Controls />
        <CodePanel />
    </div>
    <OutputPanel/>
</div>


<style>
    .editor-layout {
        display: grid;
        grid-template-columns: 1fr 2fr 1fr;
        height: 100vh;
    }
</style>
