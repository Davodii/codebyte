<script lang="ts">
    import { goto } from "$app/navigation";

    function goToLevel() {
        // TODO: Make this generalised to open editor with the given 
        goto('/editor', { replaceState: true, noScroll: true});
    }
</script>

<nav class="p-3 bg-gray-900 text-white shadow-xl flex gap-6">
    <button class="text-xl font-medium hover:text-blue-400" on:click={goToLevel}>Editor</button>
</nav>
