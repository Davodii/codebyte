<script lang="ts">
    import levelsData from "$lib/data/levels/level-hierarchy.json";

    let { onSelect } = $props();

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


    <ul id="level-sections">
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
                        onclick={() => loadLevel(item.id)}
                    >
                        <span class="text-label">{item.name}</span>
                    </li>
                {/each}
            </ul>
        </li>
        {/each}
    </ul>
</div>

<style>
    .level-hierarchy {
        width: 250px;
        transition: width 0.3s ease;
        border-right: 1px solid var(--accent-primary);
        overflow-x: hidden;
        white-space: nowrap;
        position: relative;
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
        background: #f8f9fa;
        border: none;
        border-bottom: 1px solid #ddd;
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
        background-color: #f0f0f0;
    }

    .selected {
        background-color: #e0e7ff;
        color: #4338ca;
        font-weight: bold;
    }

    .group {
        font-size: larger;
    }
</style>