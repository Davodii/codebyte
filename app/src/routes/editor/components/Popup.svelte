<script lang="ts">
    import { popupManager } from "$lib/popup-store.svelte";

    export let popup;

    let style = "";

    $: if (popup.target != null) {
        const rect = popup.target.getBoundingClientRect();

        style = `
            position: fixed;
            top: ${rect.bottom + 8}px;
            left: ${rect.left}px;
        `;
    } else {
        style = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        `;
    }
</script>

<div class="popup" style={style}>
    <p>{popup.text}</p>
    <button on:click={() => popupManager.close(popup.id)}>
        Close
    </button>
</div>

<style>
    .popup {
        padding: 20px;
        background-color: white;
        border: 1px solid black;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
    }
</style>