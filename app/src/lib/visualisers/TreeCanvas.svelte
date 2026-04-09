<script lang="ts">
    import type { Snippet } from 'svelte';

    let { children }: { children: Snippet } = $props();

    let tx = $state(0);
    let ty = $state(0);
    let scale = $state(1);
    let isDragging = $state(false);
    let lastX = 0;
    let lastY = 0;

    function onWheel(e: WheelEvent) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const newScale = Math.max(0.1, Math.min(4, scale * factor));
        // Zoom toward the cursor position
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        tx = mx - (mx - tx) * (newScale / scale);
        ty = my - (my - ty) * (newScale / scale);
        scale = newScale;
    }

    function onMouseDown(e: MouseEvent) {
        if (e.button !== 0) return;
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    }

    function onMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        tx += e.clientX - lastX;
        ty += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
    }

    function stopDragging() { isDragging = false; }

    function reset() { tx = 0; ty = 0; scale = 1; }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="tree-canvas"
    class:dragging={isDragging}
    onwheel={onWheel}
    onmousedown={onMouseDown}
    onmousemove={onMouseMove}
    onmouseup={stopDragging}
    onmouseleave={stopDragging}
>
    <div
        class="tree-content"
        style="transform: translate({tx}px, {ty}px) scale({scale})"
    >
        {@render children()}
    </div>

    <div class="hud">
        <span class="zoom-pct">{Math.round(scale * 100)}%</span>
        <button class="reset-btn" onclick={reset}>Reset view</button>
    </div>
</div>

<style>
    .tree-canvas {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
        cursor: grab;
        background-color: var(--bg-color);
    }

    .tree-canvas.dragging {
        cursor: grabbing;
        user-select: none;
    }

    .tree-content {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
        min-width: 100%;
        min-height: 100%;
        display: flex;
        align-items: flex-start;
        justify-content: center;
    }

    .hud {
        position: absolute;
        bottom: 10px;
        right: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 0.75rem;
        color: var(--text-muted);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        z-index: 10;
        pointer-events: all;
    }

    .zoom-pct {
        font-variant-numeric: tabular-nums;
        min-width: 3ch;
        text-align: right;
    }

    .reset-btn {
        background: none;
        border: none;
        color: var(--accent-primary);
        cursor: pointer;
        font-size: 0.75rem;
        padding: 0;
    }

    .reset-btn:hover {
        text-decoration: underline;
    }
</style>
