<script lang="ts">
    let { stop, start, pause, changeSpeed} = $props();

    let speed = $state(0);
</script>

<div class="controls">
    <button class="bg-(--accent-secondary)" onclick={stop}>Stop</button>   
    <button class="secondary" onclick={start}>Start</button>
    <button class="secondary" onclick={pause}>Pause</button>
    <input type="range" bind:value={speed} onchange={() => {changeSpeed(speed)}} max="300" min="50" step="25"/>
</div>

<style>
    button {
        padding: 5px;
        color: #000;
        border-radius: 4px;
    }

    .controls {
        margin-bottom: 10px;
        margin-top: 10px;
        flex-shrink: 0;
    }
</style>