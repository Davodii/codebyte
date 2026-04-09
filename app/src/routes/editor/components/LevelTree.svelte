<script lang="ts">
    import levelsData from "$lib/levels/level-hierarchy.json";

    let { onSelect, completedLevels = new Set<string>() } : {
        onSelect: (id: string) => void;
        completedLevels?: Set<string>;
    } = $props();

    let isCollapsed = $state(false);

    let sections = $state(levelsData.map(section => ({
        ...section,
        isOpen: false
    })));

    let selectedLevel = $state("");

    function toggle(index: number) {
        sections[index].isOpen = !sections[index].isOpen;
    }

    function loadLevel(item: string) {
        selectedLevel = item;
        console.log(`Loading Level: ${item}`);
        onSelect(item);
    }

    export function getSelectedLevel() : string {
        return selectedLevel;
    }

    function toggleSidebar() {
        isCollapsed = !isCollapsed;
    }
</script>

<div class="level-hierarchy" class:collapsed={isCollapsed}>
    <button class="toggle-btn" onclick={toggleSidebar} aria-label="Toggle Sidebar">
        {isCollapsed ? "→" : "←"}
    </button>


    <ul class="level-sections">
        {#each sections as section, i}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <li>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <span 
                class="caret" 
                class:caret-down={section.isOpen}
                onclick={() => toggle(i)}
            >
                <span class="text-label group">{section.name}</span>
            </span>
            <ul class="nested" class:active={section.isOpen}>
                {#each section.items as item}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <li
                        class="level-item"
                        class:selected={selectedLevel === item.id}
                        class:completed={completedLevels.has(item.id)}
                        onclick={() => loadLevel(item.id)}
                    >
                        <span class="text-label">
                            {item.name}
                            {#if completedLevels.has(item.id)}
                                <span class="completion-badge">✓</span>
                            {/if}
                        </span>
                    </li>
                {/each}
            </ul>
        </li>
        {/each}
    </ul>
</div>

<style>
    .level-hierarchy {
        width: max-content;
        transition: width 0.3s ease;
        overflow-x: hidden;
        white-space: nowrap;
        position: relative;
    }

    .level-sections {
        list-style-type: none;
        padding: 10px;
        margin: 0;
    }

    .collapsed {
        width: 50px;
    }

    .collapsed .text-label {
        display: none;
    }

    .toggle-btn {
        width: 100%;
        padding: 10px;
        cursor: pointer;
        background: var(--secondary);
        color: var(--text-color);
        border: none;
        border-bottom: 1px solid var(--border-color);
    }

    ul {
        list-style-type: none;
        padding-left: 15px;
    }

    .caret {
        cursor: pointer;
        user-select: none;
        padding: 8px 0;
    }

    .caret::before {
        content: "\25B6";
        display: inline-block;
        margin-right: 6px;
        transition: transform 0.2s;
    }

    .caret-down::before { transform: rotate(90deg); }
    .nested { display: none; }
    .active { display: block; }

    .collapsed .nested {
        display: none !important;
    }

    .level-item {
        padding: 4px 12px;
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.2s ease;
    }

    .level-item:hover {
        background-color: var(--secondary);
    }

    .selected {
        background-color: var(--color-active-bg);
        color: var(--accent-primary);
        font-weight: bold;
    }

    .completed .text-label {
        color: var(--color-success);
    }

    .completion-badge {
        margin-left: 6px;
        font-weight: bold;
    }

    .group {
        font-size: larger;
    }
</style>