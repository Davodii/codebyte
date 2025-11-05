<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import CodePanel from "./components/CodePanel.svelte";
    import InfoPanel from "./components/InfoPanel.svelte";
    import OutputPanel from "./components/OutputPanel.svelte";

    let codePanelRef: CodePanel;

    // Initial widths in percentages
    let widths = [25, 50, 25];

    // Computer property for CSS grid
    $: gridColums = `${widths[0]}% 20px ${widths[1]}% 20px ${widths[2]}%`;

    // State for drag operation
    let draggingIndex: number | null = null;
    let initialMouseX = 0;
    let initialWidths: number[] = [];
    let editorLayout: HTMLElement;

    function startDrag(index: number) {
        return (event: MouseEvent) => {
            draggingIndex = index;
            initialMouseX = event.clientX;
            initialWidths = [...widths];
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };
    }

    function onMouseMove(event: MouseEvent) {
        if (draggingIndex === null || !editorLayout) return;

        const deltaX = event.clientX - initialMouseX;
        const totalWidth = editorLayout.offsetWidth;
        const deltaPercentage = (deltaX / totalWidth) * 100;

        let newWidths = [...initialWidths];

        let w1 = newWidths[draggingIndex] + deltaPercentage;
        let w2 = newWidths[draggingIndex + 1] - deltaPercentage;
        
        if (w1 > 10 && w2 > 10) {
            newWidths[draggingIndex] = w1;
            newWidths[draggingIndex + 1] = w2;
            widths = newWidths;

            if (codePanelRef) {
                codePanelRef.resize();
            }
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

<div class="editor-layout" bind:this={editorLayout} style="grid-template-columns: {gridColums};">
    <InfoPanel/>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
        class="splitter"
        on:mousedown={startDrag(0)}
        role="separator"
        aria-label="Resize panel border between info and code"
    ></div>
    <CodePanel bind:this={codePanelRef}/>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
        class="splitter"
        on:mousedown={startDrag(1)}
        role="separator"
        aria-label="Resize panel border between info and code"
    ></div>
    <OutputPanel />
</div>


<style lang="postcss">
    @reference "tailwindcss";

    .editor-layout {
        display: grid;
        height: 100vh;
        padding: 0;
        background-color: var(--bg);
        overflow: hidden;
    }

    .splitter {
        width: 20px;
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
