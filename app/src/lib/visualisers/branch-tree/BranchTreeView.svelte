<script lang="ts">
    import BranchTreeView from './BranchTreeView.svelte';
    import type { BranchNode } from './branch-tree-module.svelte';

    let { nodes, nodeId }: {
        nodes: Map<number, BranchNode>;
        nodeId?: number;
    } = $props();

    const isRoot = nodeId === undefined;

    const displayNodes = $derived.by(() => {
        if (!isRoot) {
            const n = nodes.get(nodeId!);
            return n ? [n] : [];
        }
        return [...nodes.values()].filter(n => n.parentId === null);
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
        {#each displayNodes as node (node.id)}
            <div class="subtree">

                <div class="node-box"
                    class:pending  ={node.status === 'pending'}
                    class:active-t ={node.status === 'active'    && node.conditionResult === true}
                    class:active-f ={node.status === 'active'    && node.conditionResult === false}
                    class:done-t   ={node.status === 'evaluated' && node.conditionResult === true}
                    class:done-f   ={node.status === 'evaluated' && node.conditionResult === false}
                >
                    <code class="label">{node.label}</code>
                    {#if node.status !== 'pending'}
                        <span class="result">{node.conditionResult ? 'TRUE' : 'FALSE'}</span>
                    {/if}
                </div>

                <div class="stem"></div>
                <div class="branches">
                    <div class="branch">
                        <div class="drop">
                            <span class="badge t-badge">T</span>
                        </div>
                        {#if node.trueChildId !== null}
                            <BranchTreeView {nodes} nodeId={node.trueChildId} />
                        {:else}
                            <div class="leaf-node"></div>
                        {/if}
                    </div>
                    <div class="branch">
                        <div class="drop">
                            <span class="badge f-badge">F</span>
                        </div>
                        {#if node.falseChildId !== null}
                            <BranchTreeView {nodes} nodeId={node.falseChildId} />
                        {:else}
                            <div class="leaf-node"></div>
                        {/if}
                    </div>
                </div>

            </div>
        {/each}
    </div>
{/snippet}

{#if isRoot}
    {#if nodes.size === 0}
        <p class="empty">Run the code to build the decision tree.</p>
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
        width: 140px;
        padding: 8px 12px;
        border-radius: 8px;
        border: 2px solid var(--border-color);
        background: var(--primary);
        color: var(--text-color);
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 4px;
        transition: border-color 0.25s, background-color 0.25s, color 0.25s;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
    }

    .label {
        font-size: 12px;
        font-family: monospace;
        display: block;
        word-break: break-all;
    }

    .result {
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 0.05em;
    }

    /* ── Status colours ───────────────────────────────────── */
    .pending  { background: var(--secondary); border-color: var(--border-color); color: var(--text-muted); }
    .active-t { background: var(--color-success-bg); border-color: var(--color-success); color: var(--color-success); }
    .active-f { background: var(--color-danger-bg);  border-color: var(--color-danger);  color: var(--color-danger);  }
    .done-t   { background: var(--color-success); border-color: var(--color-success); color: #fff; }
    .done-f   { background: var(--color-danger);  border-color: var(--color-danger);  color: #fff; }

    /* ── Connectors ───────────────────────────────────────── */
    .stem { width: 2px; height: 20px; background: var(--border-color); }

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
        min-width: 130px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .drop {
        width: 2px;
        height: 28px;
        background: var(--border-color);
        position: relative;
        display: flex;
        justify-content: center;
    }

    /* ── T / F badges ─────────────────────────────────────── */
    .badge {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: bold;
        padding: 1px 5px;
        border-radius: 3px;
        left: 6px;
    }

    .t-badge { color: var(--color-success); border: 1px solid var(--color-success); background: var(--color-success-bg); }
    .f-badge { color: var(--color-danger);  border: 1px solid var(--color-danger);  background: var(--color-danger-bg);  }

    /* ── Leaf node ────────────────────────────────────────── */
    .leaf-node {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid var(--border-color);
        background: var(--secondary);
        margin-top: 2px;
    }

    .empty {
        color: var(--text-muted);
        font-size: 0.85rem;
        text-align: center;
        padding: 24px;
    }
</style>
