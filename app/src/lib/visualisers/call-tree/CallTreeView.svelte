<script lang="ts">
    import CallTreeView from './CallTreeView.svelte';
    import type { CallNode } from './call-tree-module.svelte';

    let { nodes, nodeId }: {
        nodes: Map<number, CallNode>;
        nodeId?: number;
    } = $props();

    const displayNodes = $derived.by(() => {
        if (nodeId !== undefined) {
            const n = nodes.get(nodeId);
            return n ? [n] : [];
        }
        return [...nodes.values()].filter(n => n.parentCallId === null);
    });
</script>

{#if nodeId === undefined && nodes.size === 0}
    <p class="empty">Run the code to see the recursion tree.</p>
{:else}
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
        border: 2px solid;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 3px;
        transition: border-color 0.2s, background-color 0.2s;
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

    .active   { background: #0a1d2d; border-color: #2196f3; color: #64b5f6; }
    .returned { background: #0a1f0a; border-color: #2d6e2d; color: #4caf50; }

    .returned .return-value { color: #ffd54f; }

    /* ── Connectors ───────────────────────────────────────── */
    .stem {
        width: 2px;
        height: 20px;
        background: #444;
    }

    .branches {
        display: flex;
        flex-direction: row;
        position: relative;
    }

    /* Horizontal bar spanning from centre of first child to centre of last */
    .branches::before {
        content: '';
        position: absolute;
        top: 0;
        left: 25%;
        right: 25%;
        height: 2px;
        background: #444;
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
        background: #444;
    }

    /* ── Misc ─────────────────────────────────────────────── */
    .empty {
        color: #555;
        font-size: 0.85rem;
        text-align: center;
    }
</style>
