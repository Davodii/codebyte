<script lang="ts">
    import { page } from "$app/state";
    
    const navItems = [
        { path: '/', label: 'Home' },
        { path: '/editor', label: 'Editor' },
        { path: '/settings', label: 'Settings' }
    ];
</script>

<nav>
    <div class="logo">CodeByte</div>
    <ul>
        {#each navItems as item}
            <li>
                <a
                    href={item.path}
                    class:active={page.url.pathname === item.path ? 'active' : ''}
                >
                    {item.label}
                </a>
            </li>
        {/each}
    </ul>
</nav>

<style>
    nav {
        display: flex;
        justify-content: space-between;
        padding: 1rem;
        background: var(--bg-color);
        border-bottom: 5px solid var(--border-color);
    }

    ul {
        display: flex;
        list-style: none;
        gap: 1rem;
    }

    a {
        text-decoration: none;
        color: var(--text);
        padding-bottom: 0.25rem;
    }

    .active {
        font-weight: bold;
        border-bottom: 2px solid var(--accent-primary);
    }

    .logo {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--accent-primary);
        text-align: center;
    }
</style>