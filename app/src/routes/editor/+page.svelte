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

    // --- Draggable splitter state ---
    let panelContainer = $state<HTMLElement>();
    let leftWidth = $state<number>(300);
    let rightWidth = $state<number>(300);
    let isDraggingLeft = $state<boolean>(false);
    let isDraggingRight = $state<boolean>(false);

    const panelPadding = 20;

    function startDraggingLeft() { 
        isDraggingLeft = true; 
        document.body.classList.add('dragging');
    }
    function startDraggingRight() { 
        isDraggingRight = true; 
        document.body.classList.add('dragging');
    }

    function handleGlobalMouseMove(event: MouseEvent) {
        if (!panelContainer) return;
        const containerRect = panelContainer.getBoundingClientRect();
        const resizerWidth = 4;
        const offset = (resizerWidth / 2) + 2 * panelPadding;

        if (isDraggingLeft) {
            // Calculate new width from left edge of container
            const newLeftWidth = (event.clientX - containerRect.left) - offset;
            leftWidth = Math.max(100, Math.min(newLeftWidth, containerRect.width * 0.4));
        }

        if (isDraggingRight) {
            // Calculate new width from right edge of container
            const newRightWidth = (containerRect.right - event.clientX) - offset;
            rightWidth = Math.max(100, Math.min(newRightWidth, containerRect.width * 0.4));
        }
    }

    function stopDragging() {
        isDraggingLeft = false;
        isDraggingRight = false;
    }

    const loadLevel = (id: string) => {
        if (!visualiser) return;
        
        // Instantiate the level
        const LevelClass = getLevelContstructor(id);

        session = new LevelSession(LevelClass, visualiser);

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

    // Visualiser setup and level loading
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

<svelte:window 
    onmousemove={handleGlobalMouseMove} 
    onmouseup={() => {
        stopDragging();
        document.body.classList.remove('dragging');
    }} 
/>

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
    <main class="panel-container" bind:this={panelContainer}>
        <section class="panel" style="flex: 0 0 {leftWidth}px; padding: {panelPadding}px;">
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

        <button 
            onmousedown={startDraggingLeft}
            class="resizer"
            class:active="{isDraggingLeft}"
            aria-label="Resize left panel"
        ></button>

        <section class="panel middle-panel" style="padding: {panelPadding}px;">
            <h1>Code Editor</h1>
            <hr>
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

        <button 
            onmousedown={startDraggingRight}
            class="resizer"
            class:active="{isDraggingRight}"
            aria-label="Resize right panel"
        ></button>

        <section class="panel" style="flex: 0 0 {rightWidth}px; padding: {panelPadding}px;">
            <h1>{session?.level.visualisationName || "Visualiser"}</h1>
            <hr>
            <div class="visualiser-canvas" bind:this={visualiserRoot}></div>
        </section>
    </main>
</div>

<style>
    :global(body.dragging) {
        user-select: none;
        cursor: ew-resize;
    }

    .layout {
        display:flex;
        flex-direction: row;
        height: 100%;
    }

    .nav-bar {
        background-color: var(--bg-color);
        border-right: 1px solid var(--accent-primary);
    }

    .panel-container {
        flex-grow: 1;
        display: flex;
        padding: 0;
        margin: 0;
        overflow: hidden;
    }

    .panel {
        overflow: auto;
        background-color: var(--bg-color);
        min-width: 0; /* Allow panels to shrink below their content width */
    }

    .middle-panel {
        flex: 1;
    }

    .panel-content {
        flex-grow: 1;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
    }

    #editor-container {
        display: flex;
        flex-grow: 1;
        min-height: 0;
        overflow: hidden;
        height: 100%;
    }

    .resizer {
        /* Remove default styles */
        all: unset; 
        width: 4px;
        height: 100%;
        background-color: transparent;
        border-left: 1px solid var(--accent-primary);

        /* Interaction cues */
        cursor: ew-resize;
        z-index: 10;
        transition: background-color 0.2s ease;
    }

    .resizer:hover, .resizer.active {
        background-color: var(--accent-primary);
    }

</style>
