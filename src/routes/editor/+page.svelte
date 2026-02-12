<script lang="ts">
    import { engine } from "$lib/engine.svelte";
    import LevelTree from "./components/LevelTree.svelte";
    import Editor from "./components/Editor.svelte";
    import Visualiser from "./components/Visualiser.svelte";
    import Controls from "./components/Controls.svelte";

    const handleSelect = (id: string) => engine.loadLevel(id);

    let editorRef: Editor;

</script>

<div class="layout">
    <nav class="nav-bar">
        <LevelTree onSelect={handleSelect}/>
    </nav>

    <main class="panel-container">
        <section class="panel shadow-xl" style="width: 30%;">
            <h1>Objective</h1>
            <hr>
            <div class="panel-content">
                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quisquam, perferendis minima! Sed quae reiciendis blanditiis soluta exercitationem, perferendis, debitis, id earum beatae aliquid ipsam tempora quia ea laudantium. Est, sapiente.</p>
            </div>
        </section>

        <div class="splitter"></div>

        <section class="panel shadow-xl flex flex-col" style="width: 40%;">
            <div class="panel-content">
                <Controls />
                <div id="editor-container">
                    <Editor bind:this={editorRef} />
                </div>
            </div>
        </section>

        <div class="splitter"></div>

        <section class="panel shadow-xl" style="width: 30%;">
            <Visualiser
                events={engine.events}
                step={engine.currentIndex}
            />
        </section>
    </main>
</div>

<style>
    .layout {
        display:flex;
        flex-direction: row;
        height: 100vh;
    }

    #nav-bar {
        min-width: 300px;
        overflow: scroll;
    }


    .content {
        display: flex;
        flex-direction: column;
    }
    .panel-container {
        flex-grow: 1;
        display: flex;
        padding: 20px;
        margin: 0;
        min-height: 0;
    }

    .panel {
        padding: 20px;
        min-height: 0;
        overflow: auto;
        
    }

    .panel-content {
        flex-grow: 1;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    #editor-container {
        display: flex;
        flex-grow: 1;
        min-height: 0;
        overflow: hidden;
        height: 100%;
    }

    .col-resize-cursor {
        cursor: col-resize;
    }
</style>
