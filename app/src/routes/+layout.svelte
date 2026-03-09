<script lang="ts">
    import "../app.css";
    import Navbar from "../components/Navbar.svelte";
</script>

<div class="layout-wrapper">
    <header>
        <Navbar />
    </header>

    <main>
        <slot /> 
    </main>
</div>

<style>
    :global(html, body) {
        height: 100%;
        margin: 0;
        /* overflow: hidden; */
    }

    .layout-wrapper {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }

    main {
        flex-grow: 1;
        /* overflow: hidden; */
        position: relative;
    }
</style>