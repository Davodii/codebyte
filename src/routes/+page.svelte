<script lang="ts">
    import { goto } from "$app/navigation";

    function gotoPage(page: string) {
        goto(page, { replaceState: true, noScroll: true});
    }

</script>

<nav class="p-3 bg-gray-900 text-white shadow-xl flex gap-6">
    <button class="text-xl font-medium hover:text-blue-400" on:click={() => {gotoPage('/editor')}}>Editor</button>
    <button class="text-xl font-medium hover:text-blue-400" on:click={() => {gotoPage('/test')}}>Codemirror Test</button>
    <button class="text-xl font-medium hover:text-blue-400" on:click={() => {gotoPage('/panels')}}>Panels</button>
</nav>

<h1 class="text-3xl font-bold underline">
      Hello world!
</h1>
