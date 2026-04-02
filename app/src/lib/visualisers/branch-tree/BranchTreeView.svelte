<script lang="ts">
    import BranchTreeView from './BranchTreeView.svelte';
    import type { BranchNode } from './branch-tree-module.svelte';

    let { nodes, nodeId }: {
        nodes: Map<number, BranchNode>;
        nodeId?: number;
    } = $props();

    // Top-level: find roots. Recursive call: resolve the specific node.
    const displayNodes = $derived.by(() => {
        if (nodeId !== undefined) {
            const n = nodes.get(nodeId);
            return n ? [n] : [];
        }
        return [...nodes.values()].filter(n => n.parentId === null);
    });

    $effect(() => {
        // Print the props
        console.log("BranchTreeView props:", { nodeId, nodes });
    });
</script>

{#if nodeId === undefined && nodes.size === 0}
    <p class="empty">Run the code to see the decision tree.</p>
{:else}
    <div class="forest">
        {#each displayNodes as node (node.id)}
            <div class="subtree">
                <!-- Condition node box -->
                <div class="node-box"
                    class:active-t  ={node.status === 'active'    && node.conditionResult === true}
                    class:active-f  ={node.status === 'active'    && node.conditionResult === false}
                    class:done-t    ={node.status === 'evaluated' && node.conditionResult === true}
                    class:done-f    ={node.status === 'evaluated' && node.conditionResult === false}
                >
                    <code class="label">{node.label}</code>
                    <span class="result">{node.conditionResult ? 'TRUE' : 'FALSE'}</span>
                </div>
                {#if node.trueChildId !== null || node.falseChildId !== null}
                    <!-- Stem from node down to the horizontal bar -->
                    <div class="stem"></div>

                    <div class="branches">
                        <!-- True branch (left) -->
                        <div class="branch">
                            <div class="drop">
                                <span class="badge t-badge">T</span>
                            </div>
                            {#if node.trueChildId !== null}
                                <BranchTreeView {nodes} nodeId={node.trueChildId} />
                            {/if}
                        </div>

                        <!-- False branch (right) -->
                        <div class="branch">
                            <div class="drop">
                                <span class="badge f-badge">F</span>
                            </div>
                            {#if node.falseChildId !== null}
                                <BranchTreeView {nodes} nodeId={node.falseChildId} />
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
{/if}

<style>
    /* ── Wrapper ──────────────────────────────────────────── */
    .forest {
        display: flex;
        flex-direction: row;
        gap: 48px;
        justify-content: center;
        align-items: flex-start;
        padding: 16px;
        overflow: auto;
        width: 100%;
        height: 100%;
        box-sizing: border-box;

        /* TODO: remove this  */
        border: solid 1px #ccc;
    }

    .subtree {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    /* ── Node box ─────────────────────────────────────────── */
    .node-box {
        width: 130px;
        padding: 8px 12px;
        border-radius: 8px;
        border: 2px solid;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 4px;
        transition: border-color 0.2s, background-color 0.2s;
    }

    .label {
        font-size: 12px;
        font-family: monospace;
        display: block;
    }

    .result {
        font-size: 13px;
        font-weight: bold;
    }

    /* Status colours */
    .active-t  { background: #0f2d0f; border-color: #4caf50; color: #4caf50; }
    .active-f  { background: #2d0f0f; border-color: #ef5350; color: #ef5350; }
    .done-t    { background: #0a1f0a; border-color: #2d6e2d; color: #4caf50; }
    .done-f    { background: #1f0a0a; border-color: #6e2d2d; color: #ef5350; }

    /* ── Connectors ───────────────────────────────────────── */
    .stem {
        width: 2px;
        height: 20px;
        background: #444;
    }

    .branches {
        display: flex;
        flex-direction: row;
        gap: 32px;
        position: relative;
    }

    /* Horizontal bar spanning the two branches */
    .branches::before {
        content: '';
        position: absolute;
        top: 0;
        /* span between the centre points of the two .branch children */
        left: calc(25%);
        right: calc(25%);
        height: 2px;
        background: #444;
    }

    .branch {
        flex: 1;
        min-width: 130px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    /* Vertical drop from horizontal bar to child */
    .drop {
        width: 2px;
        height: 28px;
        background: #444;
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
        padding: 1px 4px;
        border-radius: 3px;
        /* shift sideways so badge doesn't overlap the line */
        left: 6px;
    }

    .t-badge { color: #4caf50; border: 1px solid #2d6e2d; background: #0a1a0a; }
    .f-badge { color: #ef5350; border: 1px solid #6e2d2d; background: #1a0a0a; }

    /* ── Misc ─────────────────────────────────────────────── */
    .empty {
        color: #555;
        font-size: 0.85rem;
        text-align: center;
    }
</style>
