<script lang="ts">
    import CallTreeView from './CallTreeView.svelte';
    import type { CallNode } from './call-tree-module.svelte';

    let { nodes, nodeId }: {
        nodes: Map<number, CallNode>;
        nodeId?: number;
    } = $props();

    const isRoot = nodeId === undefined;

    const displayNodes = $derived.by(() => {
        if (!isRoot) {
            const n = nodes.get(nodeId!);
            return n ? [n] : [];
        }
        return [...nodes.values()].filter(n => n.parentCallId === null);
    });

    // Pan/zoom state — only active at root level
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

{#snippet forestContent()}
    <div class="forest">
        {#each displayNodes as node (node.call_id)}
            <div class="subtree">
                <div class="node-box"
                    class:active   ={node.status === 'active'}
                    class:returned ={node.status === 'returned'}
                >
                    <code class="label">{node.label}</code>
                    {#if node.returnValue !== null}
                        <span class="return-value">= {node.returnValue}</span>
                    {/if}
                </div>

                {#if node.childIds.length > 0}
                    <div class="stem"></div>
                    <div class="branches">
                        {#each node.childIds as childId (childId)}
                            <div class="branch">
                                <div class="drop"></div>
                                <CallTreeView {nodes} nodeId={childId} />
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
{/snippet}

{#if isRoot}
    {#if nodes.size === 0}
        <p class="empty">Run the code to see the recursion tree.</p>
    {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="pan-zoom-outer"
            class:dragging={isDragging}
            onwheel={onWheel}
            onmousedown={onMouseDown}
            onmousemove={onMouseMove}
            onmouseup={stopDragging}
            onmouseleave={stopDragging}
        >
            <div class="pan-zoom-inner" style="transform: translate({tx}px, {ty}px) scale({scale})">
                {@render forestContent()}
            </div>
            <div class="hud">
                <span class="zoom-pct">{Math.round(scale * 100)}%</span>
                <button class="reset-btn" onclick={reset}>Reset view</button>
            </div>
        </div>
    {/if}
{:else}
    {@render forestContent()}
{/if}

<style>
    /* ── Pan/zoom wrapper ─────────────────────────────────── */
    .pan-zoom-outer {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
        cursor: grab;
        background-color: var(--bg-color);
    }

    .pan-zoom-outer.dragging {
        cursor: grabbing;
        user-select: none;
    }

    .pan-zoom-inner {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
        min-width: 100%;
        min-height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-start;
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

    .reset-btn:hover { text-decoration: underline; }

    /* ── Forest layout ────────────────────────────────────── */
    .forest {
        display: flex;
        flex-direction: row;
        gap: 48px;
        justify-content: center;
        align-items: flex-start;
        padding: 24px;
    }

    .subtree {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    /* ── Node box ─────────────────────────────────────────── */
    .node-box {
        width: 110px;
        padding: 8px 10px;
        border-radius: 8px;
        border: 2px solid var(--border-color);
        background: var(--secondary);
        color: var(--text-muted);
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 3px;
        transition: border-color 0.25s, background-color 0.25s, color 0.25s;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
    }

    .label {
        font-size: 12px;
        font-family: monospace;
        display: block;
    }

    .return-value {
        font-size: 13px;
        font-weight: bold;
    }

    .active {
        background: var(--color-active-bg);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }

    .returned {
        background: var(--color-success);
        border-color: var(--color-success);
        color: #fff;
    }

    .returned .return-value {
        color: var(--color-warning);
    }

    /* ── Connectors ───────────────────────────────────────── */
    .stem {
        width: 2px;
        height: 20px;
        background: var(--border-color);
    }

    .branches {
        display: flex;
        flex-direction: row;
        position: relative;
    }

    .branches::before {
        content: '';
        position: absolute;
        top: 0;
        left: 25%;
        right: 25%;
        height: 2px;
        background: var(--border-color);
    }

    .branch {
        flex: 1;
        min-width: 110px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .drop {
        width: 2px;
        height: 20px;
        background: var(--border-color);
    }

    /* ── Misc ─────────────────────────────────────────────── */
    .empty {
        color: var(--text-muted);
        font-size: 0.85rem;
        text-align: center;
        padding: 24px;
    }
</style>
