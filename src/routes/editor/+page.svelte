<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import Controls from "./components/Controls.svelte";
    import Editor from "./components/Editor.svelte";

    let container: HTMLDivElement;
    let leftSplitter: HTMLDivElement;
    let rightSplitter: HTMLDivElement;
    let leftPanel: HTMLDivElement;
    let centrePanel: HTMLDivElement;
    let rightPanel: HTMLDivElement;

    let activeSplitter: number | null = $state(null);
    let initialFixedPanelPercentage = $state(0);
    const SPLITTER_WIDTH_PIXELS = 10;
    const MIN_PANEL_WIDTH_PERCENT = 15;

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

    onDestroy(() => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    });

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
                <div id="editor-container">
                    <Editor />
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
                <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Distinctio eligendi non ratione nobis harum ipsam voluptas assumenda mollitia! Quaerat provident ad debitis quos quo, minus veritatis necessitatibus dolorem iusto dicta!</p>
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
