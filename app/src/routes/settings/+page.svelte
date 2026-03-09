<script lang="ts">
    import { settings } from "$lib/settings.svelte";

    function toggleTheme() {
        settings.toggleTheme();
    }

    function updateFont(e: Event) {
        const size = parseInt((e.target as HTMLInputElement).value);
        settings.updateFontSize(size);
    }
</script>

<div class="settings-panel">
    <h3>Appearance</h3>

    <label>
        Theme:
        <button on:click={toggleTheme} class="theme-toggle">
            Switch to {settings.value.theme === 'light' ? 'Light' : 'Dark'} Mode
        </button>
    </label>

    <label>
        Font Size: {settings.value.fontSize}px
        <input 
            type="range" 
            min="12" 
            max="24" 
            value={settings.value.fontSize}
            on:input={updateFont}
        />
    </label>
</div>