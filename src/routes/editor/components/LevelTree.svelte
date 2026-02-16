<script lang="ts">
    import levelsData from "$lib/data/level-hierarchy.json";

    let { onSelect } = $props();

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
</script>

<div class="level-hierarchy">
    <ul id="level-sections">
        {#each sections as section, i}
        <li>
            <span 
                class="caret" 
                class:caret-down={section.isOpen}
                onclick={() => toggle(i)}
            >
                {section.name}
            </span>
            <ul class="nested" class:active={section.isOpen}>
                {#each section.items as item}
                    <li
                        class="level-item"
                        class:selected={selectedLevel === item}
                        onclick={() => loadLevel(item)}
                    >
                        {item}
                    </li>
                {/each}
            </ul>
        </li>
        {/each}
    </ul>
</div>

<style>
    ul {
        list-style-type: none;
    }

    .caret {
        cursor: pointer;
        user-select: none;
    }

    .caret::before {
        content: "\25B6";
        color: black;
        display: inline-block;
        margin-right: 6px;
    }

    .caret-down::before { transform: rotate(90deg); }
    .nested { display: none; }
    .active { display: block; }

    .level-item {
        padding: 4px 12px;
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.2s;
    }

    .level-item:hover {
        background-color: #f0f0f0;
    }

    .selected {
        background-color: #e0e7ff;
        color: #4338ca;
        font-weight: bold;
    }
</style>