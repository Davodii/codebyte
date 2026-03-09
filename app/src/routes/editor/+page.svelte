<script lang="ts">
    import LevelTree from "./components/LevelTree.svelte";
    import Editor from "./components/CodeEditor.svelte";
    import Controls from "./components/Controls.svelte";
    import { onMount, setContext } from "svelte";
    import { LevelSession } from "$lib/level-session.svelte";
    import { Visualiser } from "$lib/visualiser.svelte";
    import { getLevelContstructor } from "$lib/data/levels/level-map.svelte";
    import ObjectivePlanel from "./components/ObjectivePlanel.svelte";

    import { popupManager } from "$lib/popup-store.svelte";
    import Popup from "./components/Popup.svelte";

    let session = $state<LevelSession | null>(null);
    let visualiserRoot = $state<HTMLDivElement>();
    let editor = $state<Editor>();
    let visualiser = $state<Visualiser>();
    let levelTree = $state<LevelTree>();

    const loadLevel = (id: string) => {
        if (!visualiser) return;
        
        // Instantiate the level
        const LevelClass = getLevelContstructor(id);
        const level = new LevelClass();

        session = new LevelSession(level, visualiser);

        session.init();
    }

    function startPlayback() {
        if (!session) return;
        session.start();
    }

    function stopPlayback() {
        if (!session) return;
        session.pause();
    }

    function pausePlayback() {
        if (!session) return;
        session.pause();
    }

    function changeSpeed(value: number) {
        if (!session) return;
        session.setPlaybackSpeed(value);
    }

    onMount(() => {
        // Create a new visualiser
        visualiser = new Visualiser(visualiserRoot!);

        // Load the level
        const currentSelectedId = levelTree!.getSelectedLevel();
        loadLevel(currentSelectedId);

        // Provide to children via Context
        setContext('level-session', session);

        return () => {
            // Cleanup logic
            session?.pause();

            // TODO: cleanup anything else?
        };
    });
</script>

<div class="layout">
    <!-- Popups -->
     {#each $popupManager as popup (popup.id)}
        <Popup {popup} />
     {/each}

    <!-- Level select navbar -->
    <nav class="nav-bar">
        <LevelTree onSelect={loadLevel} bind:this={levelTree} />
    </nav>

    <!-- Main panels -->
    <main class="panel-container">
        <section class="panel shadow-xl" style="width: 30%;">
            {#if session}
                <ObjectivePlanel level={session.level} />
            {:else}
                <h1>Level Title</h1>
                <hr>
                <div class="panel-content">
                    <p>Level Description</p>
                    <hr>
                </div>
            {/if}
        </section>

        <div class="splitter"></div>

        <section class="panel shadow-xl flex flex-col" style="width: 40%;">
            <div class="panel-content">
                <Controls start={startPlayback} stop={stopPlayback} pause={pausePlayback} changeSpeed={changeSpeed}/>
                {#if session}
                <div id="editor-container">
                    <Editor bind:this={editor} bind:code={session!.state.code} />
                </div>
                {:else}
                <div class="loading">Initialising level...</div>
                {/if}
            </div>
        </section>

        <div class="splitter"></div>

        <section class="panel shadow-xl" style="width: 30%;">
            <h1>{session?.level.visualisationName || "Visualiser"}</h1>
            <div class="visualiser-canvas" bind:this={visualiserRoot}></div>
        </section>
    </main>
</div>

<style>
    .layout {
        display:flex;
        flex-direction: row;
        height: 100%;
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
        background-color: var(--bg-color);
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
