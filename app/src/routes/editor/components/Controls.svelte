<script lang="ts">
    let { stop, start, pause, changeSpeed } = $props();
    let speed = $state(100);
    // Icons: Using SVG inline for simplicity
    const icons = {
        start: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`,
        stop: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>`,
        pause: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    };
</script>

<div class="controls">
    <button class="control-button start" id="start" onclick={start}>
        {@html icons.start}
        <span>Start</span>
    </button>
    <button class="control-button stop" id="stop" onclick={stop}>
        {@html icons.stop}
        <span>Stop</span>
    </button>
    <button class="control-button pause" id="pause" onclick={pause}>
        {@html icons.pause}
        <span>Pause</span>
    </button>
    <div class="speed-control">
        <label for="speed-slider">Speed:</label>
        <input id="speed-slider" type="range" bind:value={speed} onchange={() => {changeSpeed(speed)}} max="300" min="50" step="25"/>
        <span
            class="speed-indicator"
            class:fast={speed < 100}
            class:medium={speed >= 100 && speed < 200}
            class:slow={speed >= 200}
        >
            {speed} ms
        </span>
    </div>
</div>

<style>
    .controls {
        margin-bottom: 10px;
        margin-top: 10px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .control-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 1px 4px rgba(0,0,0,0.07);
    }
    .control-button.start {
        color: var(--color-success);
        background: var(--color-success-bg);
    }
    .control-button.stop {
        color: var(--color-danger);
        background: var(--color-danger-bg);
    }
    .control-button.pause {
        color: var(--text-muted);
        background: var(--secondary);
    }
    .control-button:hover {
        filter: brightness(1.15);
    }
    .speed-control {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    #speed-slider {
        width: 120px;
    }
    .speed-indicator {
        min-width: 48px;
        text-align: center;
        font-size: 1rem;
        font-weight: bold;
        margin-left: 8px;
    }
    .speed-indicator.fast   { color: var(--color-danger); }
    .speed-indicator.medium { color: var(--color-warning); }
    .speed-indicator.slow   { color: var(--color-success); }
</style>