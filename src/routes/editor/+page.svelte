<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { formatTraceEvent, formatValue } from "../../lib/utils";

    import { onDestroy, onMount } from "svelte";
    import Controls from "./components/Controls.svelte";
    import Editor from "./components/Editor.svelte";
    import type { DataSource, TraceEvent, TrackedValue } from "$lib/types";

    let container: HTMLDivElement;
    let leftSplitter: HTMLDivElement;
    let rightSplitter: HTMLDivElement;
    let leftPanel: HTMLDivElement;
    let centrePanel: HTMLDivElement;
    let rightPanel: HTMLDivElement;

    let editorRef: Editor;

    let activeSplitter: number | null = $state(null);
    let initialFixedPanelPercentage = $state(0);
    const SPLITTER_WIDTH_PIXELS = 10;
    const MIN_PANEL_WIDTH_PERCENT = 15;

    let displayArray = $state<TrackedValue[]>([]);
    let arrayId = $state<number | null>(null);
    let sourceMap = new Map<string, DataSource>();

    let isRunning = $state(false);
    let playbackSpeed = $state(200); // milliseconds

    let comparing = $state<number[]>([]);

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    async function runVisualiser(events: TraceEvent[]) {
        if (isRunning) return;
        isRunning = true;

        // Reset the state before running again
        displayArray = [];
        sourceMap.clear();

        for (const event of events) {
            // Detect and log swaps in real-time
            if (typeof event !== "string" && "Assign" in event) {
                const {from, to} = event.Assign;
                const originalOrigin = resolveSource(from);

                if (typeof to !== "string" 
                    && typeof originalOrigin !== "string" 
                    &&"ArraySlot" in to 
                    && "ArraySlot" in originalOrigin
                ) {
                    if (originalOrigin.ArraySlot.id === to.ArraySlot.id 
                        && originalOrigin.ArraySlot.index !== to.ArraySlot.index) {
                        comparing = [];
                        comparing.push(originalOrigin.ArraySlot.index);
                        comparing.push(to.ArraySlot.index);
                    }

                    // Only apply delays when we are swapping
                    await delay(playbackSpeed);
                }
            }

            // Process event logic
            applyEventToState(event);
        }

        isRunning = false;
    }

    const startDrag = (splitterID: number) => (e: MouseEvent) => {
        e.preventDefault(); // Prevent accidental selection on drag start
        activeSplitter = splitterID;
        
        // TODO: implement this using svelte
        document.body.style.userSelect = 'none'; // Prevent text selection

        if (splitterID == 0) {
            initialFixedPanelPercentage = parseFloat(rightPanel.style.width);
        } else if (splitterID == 1) {
            initialFixedPanelPercentage = parseFloat(leftPanel.style.width);
        }

        // Apply active drag styling 
        if (splitterID == 0) {
            leftSplitter.classList.add('shadow-xl', 'ring-4', 'ring-indigo-300', 'bg-indigo-700');
        } else if (splitterID == 1) {
            rightSplitter.classList.add('shadow-xl', 'ring-4', 'ring-indigo-300', 'bg-indigo-700');
        }

        // Add event listeners
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    function onMouseMove(e: MouseEvent) {
        if (activeSplitter == null) return;

        const containerRect = container.getBoundingClientRect();

        // Mouse X position relative to container's left edge
        const mouseX = e.clientX - containerRect.left;
        const containerWidthPx = containerRect.width;

        // TODO: calculate splitter width in percentage from their width in pixels
        const totalSplitterWidth = 0;


        if (activeSplitter == 0) {
            // Dragging the left splitter

            // 1. Calculate new left panel percentage
            let newLeftPercent = (mouseX / containerWidthPx) * 100;


            // 2. Define max/min constraints for the left panel
            const maxLeftPercent = 100 - initialFixedPanelPercentage - MIN_PANEL_WIDTH_PERCENT - totalSplitterWidth;
            newLeftPercent = Math.max(MIN_PANEL_WIDTH_PERCENT, Math.min(maxLeftPercent, newLeftPercent));

            // 3. Calculate new middle panel percentage
            const newMiddlePercent = 100 - newLeftPercent - initialFixedPanelPercentage - totalSplitterWidth;

            // 4. Update styles
            leftPanel.style.width = `${newLeftPercent}%`;
            centrePanel.style.width = `${newMiddlePercent}%`;


        } else if (activeSplitter == 1) {
            const combinedLeftMiddlePercent = (mouseX / containerWidthPx) * 100;

            let newMiddlePercent = combinedLeftMiddlePercent - initialFixedPanelPercentage - totalSplitterWidth;

            const maxMiddlePercent = 100 - initialFixedPanelPercentage - MIN_PANEL_WIDTH_PERCENT - totalSplitterWidth;

            newMiddlePercent = Math.max(MIN_PANEL_WIDTH_PERCENT, Math.min(maxMiddlePercent, newMiddlePercent));

            const newRightPercent = 100 - initialFixedPanelPercentage - newMiddlePercent - totalSplitterWidth;

            centrePanel.style.width = `${newMiddlePercent}%`;
            rightPanel.style.width = `${newRightPercent}%`;
        }
    }

    function onMouseUp() {
        if (activeSplitter != null) {
            document.body.style.userSelect = ''; // Re-enable text selection

            // Remove active state classes
            if (activeSplitter == 0) {
                leftSplitter.classList.remove('shadow-xl', 'ring-4', 'ring-indigo-300', 'bg-indigo-700');
            } else if (activeSplitter == 1) {
                rightPanel.classList.remove('shadow-xl', 'ring-4', 'ring-indigo-300', 'bg-indigo-700');
            }

            // leftPanel.classList.remove('shadow-xl');
            // centrePanel.classList.remove('shadow-xl');
            // rightPanel.classList.remove('shadow-xl');

            activeSplitter = null;

            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }
    }

    function resolveSource(source: DataSource): DataSource {
        if (typeof source === "object" && source != null && "Variable" in source) {
            return sourceMap.get(`var:${source.Variable}`) || source;
        }
        return source;
    }

    function applyEventToState(event: TraceEvent) {
        if ("Init" in event) {
            const {location, value} = event.Init;

            // Track the source chain
            if (typeof location !== "string" && "Variable" in location) {
                sourceMap.set(`var:${location.Variable}`, value.source);
            }
            
            const val = value.value;
            if (typeof(val) !== "string" && "Array" in val) {
                displayArray = [...val.Array.elements];
                arrayId = val.Array.id;
            }
        }

        if ("Assign" in event) {
            const { to, value, from } = event.Assign;

            // Resolve the "True" origin of this data
            const originalOrigin = resolveSource(from);

            if (typeof to === "object") { 
                if ("Variable" in to) {
                    sourceMap.set(`var:${to.Variable}`, originalOrigin);
                } else if ("ArraySlot" in to) {
                    sourceMap.set(`slot:${to.ArraySlot.id}:${to.ArraySlot.index}`, originalOrigin);
                }

                if ("ArraySlot" in to && to.ArraySlot.id === arrayId) {
                    displayArray[to.ArraySlot.index] = value;

                    // If an array slot receives data that originally lived in a different array slot
                    if (typeof originalOrigin !== "string" 
                        && "ArraySlot" in originalOrigin
                        && originalOrigin.ArraySlot.id === to.ArraySlot.id
                        && originalOrigin.ArraySlot.index !== to.ArraySlot.index
                    ) {
                        console.log(
                            `🎯 SWAP DETECTED: Value originally from index [${originalOrigin.ArraySlot.index}] ` +
                            `is now moving into index [${to.ArraySlot.index}] (via ${(typeof from !== "string" && "Variable" in from) ? from.Variable : 'direct'})`
                        );
                    }
                }
            }

            // if (typeof to ==="object" 
            //     && to !== null 
            //     && "ArraySlot" in to 
            //     && to.ArraySlot.id === arrayId
            // ) {
            //     // Update the state
            //     displayArray[to.ArraySlot.index] = value;

            //     // Identify a swap
            //     if (typeof from === "object" && from !== null && "ArraySlot" in from) {
            //         console.log(`[SWAP]`);
            //     }
            // }
        }
    }

    async function runCode() {
        // Get code from the editor component
        const code = editorRef.getCode();

        try {
            const events: TraceEvent[] = await invoke('interpret_code', { input: code });

            runVisualiser(events);
        } catch (error) {
            console.error('Error interpreting code:', error);
        }
    }

    onDestroy(() => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    });

    function getValue(value: TrackedValue) : number {
        const val = value.value;
        if (typeof val === "object" && "Integer" in val) {
            return val.Integer;
        }
        return -1;
    }

</script>

<div class="content">
    <div class="header">

    </div>
    <div class="panel-container" bind:this={container}>
        <div class="panel shadow-xl" style="width: 30%;" bind:this={leftPanel}>
            <h1>Objective</h1>
            <hr>
            <div class="panel-content">
                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quisquam, perferendis minima! Sed quae reiciendis blanditiis soluta exercitationem, perferendis, debitis, id earum beatae aliquid ipsam tempora quia ea laudantium. Est, sapiente.</p>
            </div>
        </div>

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div 
            class="w-2 bg-indigo-500 hover:bg-indigo-600 col-resize-cursor shrink-0 transition-colors duration-500 rounded-lg mx-1 shadow-md"
            onmousedown={startDrag(0)}
            bind:this={leftSplitter}
            role="separator"
            aria-label="Resize panel border between info and code"
            style="width: {SPLITTER_WIDTH_PIXELS}px;"
        ></div>

        <div class="panel shadow-xl flex flex-col" style="width: 40%;" bind:this={centrePanel}>
            <h1>Code</h1>
            <div class="panel-content">
                <div id="controls">
                    <Controls />
                </div>
                <button onclick={runCode}>Run Code</button>
                <div id="editor-container">
                    <Editor bind:this={editorRef} />
                </div>
            </div>
        </div>

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div 
            class="w-2 bg-indigo-500 hover:bg-indigo-600 col-resize-cursor shrink-0 transition-colors duration-500 rounded-lg mx-1 shadow-md"
            onmousedown={startDrag(1)}
            bind:this={rightSplitter}
            role="separator"
            aria-label="Resize panel border between info and code"
            style="width: {SPLITTER_WIDTH_PIXELS}px;"
        ></div>

        <div class="panel shadow-xl" style="width: 30%;" bind:this={rightPanel}>
            <h1>Output Panel</h1>
            <hr>
            <div class="panel-content">
                <!-- <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Distinctio eligendi non ratione nobis harum ipsam voluptas assumenda mollitia! Quaerat provident ad debitis quos quo, minus veritatis necessitatibus dolorem iusto dicta!</p> -->
                <h2>Unsorted Array:</h2>
                <div class="flex">
                    {#each displayArray as item, i}
                    <div 
                        class="bar"
                        class:is-comparing={comparing.includes(i)}
                        style:height="{((typeof item.value !== "string" && "Integer" in item.value) ? item.value.Integer : 0) * 10}px"
                    >
                    </div>
                    <style>
                        .bar {
                            width: 35px;
                            background-color: #4a90e2;
                            transition: all 0.1 ease;
                            position: relative;
                        }

                        /* Highlight when two elements are being compared */
                        .is-comparing {
                            background-color: #f5a623; /* Orange */
                            /* transform: scale(1.1); */
                            z-index: 2;
                        }
                    </style>
                    {/each}
                </div>
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
