<script lang="ts">
    import "../app.css";
</script>

<main>
    <slot />
</main>

<style>
    :global(html, body) {
        height: 100%;
        margin: 0;
        overflow: hidden;
    }

    main {
        height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
</style>
