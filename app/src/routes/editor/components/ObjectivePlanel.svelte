<script lang="ts">
    import type { Level, Milestone } from "$lib/data/levels/level.svelte";
    import type { Component } from "svelte";

    let { level } : { level: Level} = $props();

    // Find the index of the first incomplete milestone.
    // If all are complete, findIndex will return -1.
    let activeIndex = $derived(level.milestones.findIndex(m => !m.completed));

    let Description = $derived(level.description);
</script>

<h1>{level.title}</h1>
<hr>
<div class="panel-content">
    {#if Description}
        <Description />
    {:else}
        <p>No description provided.</p>
    {/if}
    <hr>
    <div class="milestones-container">
        <ul class="milestone-list">
            {#each level.milestones as milestone, index (milestone.id) }
                {@const isCompleted = milestone.completed}
                {@const isActive = index === activeIndex}
                {@const isPending = !isCompleted && !isActive}

                <li
                    class="milestone"
                    class:completed={isCompleted}
                    class:active={isActive}
                    class:pending={isPending}
                >
                    <div class="indicator">
                        {#if isCompleted}
                            ✓
                        {:else if isActive}
                            ➤
                        {:else}
                            ○
                        {/if}
                    </div>

                    <span class="description">
                        {milestone.description}
                    </span>
                </li>
            {/each}
        </ul>
    </div>
</div>

<style>
    .panel-content {
        flex-grow: 1;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .milestones-container {
        font-family: sans-serif;
        padding: 1em;
        border-radius: 8px;
    }

    .milestone-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .milestone {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        border-radius: 4px;
        transition: all 0.3s ease;
    }

    .indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        font-weight: bold;
        border-radius: 50%;
    }

    /* --- Status Styles --- */
    /* 1. Completed: Green */
    .completed {
        color: #4ade80;
        opacity: 0.8;
    }

    .completed .indicator {
        background-color: rgba(74, 222, 128, 0.1);
    }

    .completed .description {
        text-decoration: line-through;
    }

    /* 2. Active: Blue */
    .active {
        color: #60a5fa;
        border-left: 3px solid #60a5fa;
        font-weight: bold;        
    }

    .active .indicator {
        animation: pulse 2s infinite;
    }

    /* 3. Pending: Gray */
    .pending {
        color: #6b7280;
    }

    .pending .indicator {
        font-size: 1.2rem;
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
</style>