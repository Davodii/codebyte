<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import CodePanel from "./components/CodePanel.svelte";
    import InfoPanel from "./components/InfoPanel.svelte";
    import OutputPanel from "./components/OutputPanel.svelte";

    let codePanelRef: CodePanel;

    // Initial widths in percentages
    let frUnits = $state([25, 50, 25]);
    const splitterWidthPixels = 20;

    let gridColumns = $derived.by(() => {
        return `${frUnits[0]}fr ${splitterWidthPixels}px ${frUnits[1]}fr ${splitterWidthPixels}px ${frUnits[2]}fr`;
    });
    
    // State for drag operation
    let draggingIndex: number | null = $state(null);
    let initialMouseX = 0;
    let initialFrUnits: number[] = [];
    let editorLayout: HTMLElement;

    function startDrag(index: number) {
        return (event: MouseEvent) => {
            draggingIndex = index;
            initialMouseX = event.clientX;
            initialFrUnits = [...frUnits];
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };
    }

    function onMouseMove(event: MouseEvent) {
        if (draggingIndex === null || !editorLayout) return;

        const deltaX = event.clientX - initialMouseX;

        // Calculate the value of 1 fractional unit in pixels
        const totalFrUnits = initialFrUnits.reduce((a,b) => a + b, 0);

        // Total available width = total width - total fixed splitter width
        const totalAvailableWidth = editorLayout.offsetWidth - (splitterWidthPixels * 2);

        // How many pixels correspond to 1 fractional unit
        const pixelsPerFr = totalAvailableWidth / totalFrUnits;

        // Convert mouse drag delta into change in fr
        const frDelta = deltaX / pixelsPerFr;

        let newFr = [...initialFrUnits];

        let w1 = newFr[draggingIndex] + frDelta;
        let w2 = newFr[draggingIndex + 1] - frDelta;
        
        // Apply minimum width constraint
        const minFr = 5;
        if (w1 > minFr && w2 > minFr) {
            newFr[draggingIndex] = w1;
            newFr[draggingIndex + 1] = w2;
            frUnits = newFr;
        }
    }

    function onMouseUp() {
        draggingIndex = null;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    }

    onDestroy(() => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    })
</script>

<div class="editor-layout" bind:this={editorLayout} style="grid-template-columns: {gridColumns};">
    <InfoPanel/>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
        class="splitter w-{splitterWidthPixels}"
        onmousedown={startDrag(0)}
        role="separator"
        aria-label="Resize panel border between info and code"
    ></div>
    <CodePanel/>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
        class="splitter w-{splitterWidthPixels}"
        onmousedown={startDrag(1)}
        role="separator"
        aria-label="Resize panel border between info and code"
    ></div>
    <OutputPanel />
</div>


<style lang="postcss">
    @reference "tailwindcss";

    .editor-layout {
        display: grid;
        height: 100%;
        padding: 20px;
        background-color: var(--bg);
    }

    .splitter {
        cursor: col-resize;
        background-color: #333;
        opacity: 0.1;
        z-index: 10;
        /* margin: 0 -10px; */
    }

    .splitter:hover{
        opacity: 0.5;
    }
</style>
