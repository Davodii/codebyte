<script lang="ts">
    import LevelTree from "./components/LevelTree.svelte";
    import Editor from "./components/CodeEditor.svelte";
    import Controls from "./components/Controls.svelte";
    import { onMount, setContext } from "svelte";
    import { LevelSession } from "$lib/level-session.svelte";
    import { Visualiser } from "$lib/visualiser";
    import { getLevelContstructor } from "$lib/data/levels/level-map";

    const loadLevel = (id: string) => {
        if (!visualiser) return;

        // Instantiate the level
        const LevelClass = getLevelContstructor(id);
        const level = new LevelClass();

        session = new LevelSession(level, visualiser);
    }

    let session = $state<LevelSession | null>(null);
    let visualiserRoot = $state<HTMLDivElement>();

    let visualiser = $state<Visualiser>();

    let levelTree = $state<LevelTree>();

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
    <nav class="nav-bar">
        <LevelTree onSelect={loadLevel} bind:this={levelTree} />
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
                    <Editor bind:code={session!.state.code} />
                </div>
            </div>
        </section>

        <div class="splitter"></div>

        <section class="panel shadow-xl" style="width: 30%;">
            <div class="visualiser-canvas" bind:this={visualiserRoot}></div>
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

    .visualiser-canvas {
        background-color: aquamarine; /* Testing purposes */
    }
</style>
