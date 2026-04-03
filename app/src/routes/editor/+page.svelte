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
    import TourPopup, { type TourStep } from "./components/TourPopup.svelte";

    let session = $state<LevelSession | null>(null);
    let visualiserRoot = $state<HTMLDivElement>();
    let editor = $state<Editor>();
    let visualiser = $state<Visualiser>();
    let levelTree = $state<LevelTree>();

    // Per-level progress, keyed by level ID. Persists across session reloads.
    let levelProgress = $state<Record<string, {
        completed: boolean;
        savedCode?: string;
        milestones?: Record<string, boolean>;
    }>>({});

    // Track completion: re-runs whenever any milestone.completed changes
    $effect(() => {
        if (session?.level.isComplete) {
            const id = session.level.id;
            if (!levelProgress[id]?.completed) {
                levelProgress[id] = { ...(levelProgress[id] ?? {}), completed: true };
            }
        }
    });

    let completedLevelIds = $derived(
        new Set(
            Object.entries(levelProgress)
                .filter(([, v]) => v.completed)
                .map(([id]) => id)
        )
    );

    // --- Tour state ---
    let showTour = $state(false);
    let navBarEl = $state<HTMLElement>();
    let leftPanelEl = $state<HTMLElement>();
    let middlePanelEl = $state<HTMLElement>();
    let rightPanelEl = $state<HTMLElement>();

    const tourSteps = $derived.by<TourStep[]>(() => [
        {
            title: "Welcome to CodeByte!",
            text: "This is the editor page where you'll learn programming concepts through interactive code visualisation. Let's take a quick tour.",
            target: null,
            position: 'center',
        },
        {
            title: "Level Selector",
            text: "Use this sidebar to switch between levels. Each level teaches a different programming concept.",
            target: navBarEl ?? null,
            position: 'right',
        },
        {
            title: "Objectives",
            text: "This panel shows the current level's objectives. Complete each milestone as you work through the level.",
            target: leftPanelEl ?? null,
            position: 'right',
        },
        {
            title: "Code Editor",
            text: "Write your code here. Use the Run button to execute it, and the playback controls to step through the trace.",
            target: middlePanelEl ?? null,
            position: 'right',
        },
        {
            title: "Visualiser",
            text: "Watch your code come to life here. Each level shows a different visualisation — variables, arrays, decision trees, and more.",
            target: rightPanelEl ?? null,
            position: 'left',
        },
    ]);

    function completeTour() {
        localStorage.setItem('codebyte_tour_seen', 'true');
        showTour = false;
    }

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
        if (!visualiser || !id) return;

        // Stop any running playback before replacing the session
        session?.stop();

        // Save current state before replacing the session
        if (session) {
            const currentId = session.level.id;
            levelProgress[currentId] = {
                completed: levelProgress[currentId]?.completed ?? false,
                savedCode: session.state.code,
                milestones: Object.fromEntries(
                    session.level.milestones.map(m => [m.id, m.completed])
                ),
            };
        }

        editor?.clearDiagnostics();
        const LevelClass = getLevelContstructor(id);
        session = new LevelSession(LevelClass, visualiser);
        session.init();

        // Restore saved code for this level if available
        const savedCode = levelProgress[id]?.savedCode;
        if (savedCode !== undefined) {
            session.state.code = savedCode;
        }

        // Restore milestone completion states
        const savedMilestones = levelProgress[id]?.milestones;
        if (savedMilestones) {
            session.level.milestones.forEach(m => {
                if (savedMilestones[m.id]) {
                    m.completed = true;
                }
            });
        }
    }

    async function startPlayback() {
        if (!session) return;
        editor?.clearDiagnostics();
        await session.start();
        editor?.showDiagnostics(session.state.diagnostics);
    }

    function stopPlayback() {
        if (!session) return;
        session.stop();
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

        // Show tour on first visit
        if (!localStorage.getItem('codebyte_tour_seen')) {
            showTour = true;
        }

        // TEsting reasons
        // TODO: remove
        showTour = true;

        return () => {
            session?.stop();

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

    <!-- Onboarding tour -->
    {#if showTour}
        <TourPopup steps={tourSteps} onComplete={completeTour} />
    {/if}

    <!-- Level select navbar -->
    <nav class="nav-bar" bind:this={navBarEl}>
        <LevelTree onSelect={loadLevel} completedLevels={completedLevelIds} bind:this={levelTree} />
    </nav>

    <!-- Main panels -->
    <main class="panel-container" bind:this={panelContainer}>
        <section class="panel" bind:this={leftPanelEl} style="flex: 0 0 {leftWidth}px; padding: {panelPadding}px;">
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

        <section class="panel middle-panel" bind:this={middlePanelEl} style="padding: {panelPadding}px;">
            <h1>Code Editor</h1>
            <hr>
            <div class="panel-content">
                <Controls start={startPlayback} stop={stopPlayback} pause={pausePlayback} changeSpeed={changeSpeed}/>
                {#if session}
                <div class="editor-container">
                    {#key session.level.id}
                        <Editor bind:this={editor} bind:code={session.state.code} />
                    {/key}
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

        <section class="panel" bind:this={rightPanelEl} style="flex: 0 0 {rightWidth}px; padding: {panelPadding}px;">
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
        width: 100%;
        overflow: hidden;
    }

    .nav-bar {
        background-color: var(--bg-color);
        border-right: 1px solid var(--accent-primary);
        /* flex: 1;
        flex-direction: column;
        flex-grow: 1; */
    }

    .panel-container {
        flex: 1;
        display: flex;
        padding: 0;
        margin: 0;
        height: 100%;
        overflow: hidden;
    }

    .panel {
        display: flex;
        flex-direction: column;
        background-color: var(--bg-color);
        min-width: 0; /* Allow panels to shrink below their content width */
        height: 100%;
        overflow: hidden;
    }

    .middle-panel {
        flex: 1;
    }

    .panel-content {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }

    .editor-container {
        flex-grow: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
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

    :global(.cm-editor) {
        height: 100% !important;
    }

    :global(.cm-scroller) {
        overflow: auto !important;
    }

</style>
