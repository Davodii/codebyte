<script lang="ts">
    type Bar = { value: number; highlighted: boolean };

    let { bars } = $props<{ bars: Bar[] }>();

    const BAR_MAX_PX = 220;

    const maxValue = $derived(bars.length > 0 ? Math.max(...bars.map((b: Bar) => b.value)) : 1);

    function barHeight(value: number): number {
        return Math.max(4, (value / maxValue) * BAR_MAX_PX);
    }
</script>

<div class="bars-wrapper">
    {#each bars as bar, i (i)}
        <div class="bar-col">
            <div
                class="bar"
                class:highlighted={bar.highlighted}
                style="height: {barHeight(bar.value)}px"
            ></div>
            <span class="bar-label">{bar.value}</span>
        </div>
    {/each}
</div>

<style>
    .bars-wrapper {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        justify-content: center;
        gap: 8px;
        width: 100%;
        height: 100%;
        padding: 16px 12px 8px;
        box-sizing: border-box;
    }

    .bar-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .bar {
        width: 100%;
        background-color: var(--accent-primary, #4a90d9);
        border-radius: 4px 4px 0 0;
        transition: height 0.15s ease, background-color 0.1s ease;
    }

    .bar.highlighted {
        background-color: #f5a623;
    }

    .bar-label {
        font-size: 0.7rem;
        color: var(--text-secondary, #aaa);
        user-select: none;
    }
</style>
