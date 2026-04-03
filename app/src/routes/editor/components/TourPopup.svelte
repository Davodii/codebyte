<script lang="ts">
    export type TourStep = {
        title: string;
        text: string;
        target: HTMLElement | null;
        position?: 'below' | 'right' | 'left' | 'center';
    };

    let { steps, onComplete }: {
        steps: TourStep[];
        onComplete: () => void;
    } = $props();

    let currentIndex = $state(0);

    const step = $derived(steps[currentIndex]);
    const isLast = $derived(currentIndex === steps.length - 1);

    function next() {
        if (isLast) {
            onComplete();
        } else {
            currentIndex++;
        }
    }

    const popupStyle = $derived.by(() => {
        if (!step.target || step.position === 'center') {
            return 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);';
        }
        const r = step.target.getBoundingClientRect();
        const pos = step.position ?? 'below';
        if (pos === 'right') {
            return `position:fixed; top:${r.top}px; left:${r.right + 14}px;`;
        }
        if (pos === 'left') {
            return `position:fixed; top:${r.top}px; left:${r.left - 14}px; transform:translateX(-100%);`;
        }
        // below (default)
        return `position:fixed; top:${r.bottom + 14}px; left:${r.left + r.width / 2}px; transform:translateX(-50%);`;
    });
</script>

<!-- Dim backdrop -->
<div class="backdrop"></div>

<div class="popup" style={popupStyle}>
    <div class="header">
        <span class="title">{step.title}</span>
        <span class="counter">{currentIndex + 1} / {steps.length}</span>
    </div>
    <p class="text">{step.text}</p>
    <div class="footer">
        <button class="btn" onclick={next}>
            {isLast ? 'Get started' : 'Next'}
        </button>
    </div>
</div>

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 999;
    }

    .popup {
        z-index: 1000;
        width: 280px;
        background: #1e1e1e;
        border: 1px solid var(--accent-primary, #555);
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        padding: 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .title {
        font-weight: bold;
        font-size: 0.95rem;
        color: #e0e0e0;
    }

    .counter {
        font-size: 0.75rem;
        color: #666;
    }

    .text {
        font-size: 0.85rem;
        color: #aaa;
        line-height: 1.5;
        margin: 0;
    }

    .footer {
        display: flex;
        justify-content: flex-end;
    }

    .btn {
        background: var(--accent-primary, #555);
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 6px 16px;
        font-size: 0.85rem;
        cursor: pointer;
    }

    .btn:hover {
        filter: brightness(1.15);
    }
</style>
