import type { TraceEvent } from "$lib/data/events/events.svelte";
import type { VisualiserContext } from "$lib/visualiser.svelte";
import { mount, unmount } from "svelte";
import { VisualiserModule } from "../visualiser-module.svelte";
import ArrayBarsView from "./ArrayBarsView.svelte";

export type Bar = {
    value: number;
    highlighted: boolean;
};

export class ArrayBarsModule extends VisualiserModule {
    id = 'array-bars';

    private trackedArrayId: number | null = null;
    private bars = $state<Bar[]>([]);
    private componentInstance: Record<string, any> | null = null;

    init(ctx: VisualiserContext, container: HTMLDivElement): void {
        super.init(ctx, container);
        this.componentInstance = mount(ArrayBarsView, {
            target: container,
            props: { bars: this.bars },
        });
    }

    public getArrayDomElement(): HTMLElement | null {
        return this.container === undefined ? null : this.container;
    }

    handleEvent(event: TraceEvent, _history: TraceEvent[]): void {
        // Clear comparison highlights at the start of every event
        for (const bar of this.bars) bar.highlighted = false;

        if (event.kind === "Init") {
            if (event.location.kind === "Variable" && event.value.value.kind === "Array") {
                const arr = event.value.value.value;
                this.trackedArrayId = arr.id;
                const newBars: Bar[] = arr.elements.map(el => ({
                    value: el.value.kind === "Integer" || el.value.kind === "Float"
                        ? Number(el.value.value) : 0,
                    highlighted: false,
                }));
                this.bars.splice(0, this.bars.length, ...newBars);
            }
        }

        if (event.kind === "Assign") {
            if (event.to.kind === "ArraySlot" && event.to.value.id === this.trackedArrayId) {
                const idx = event.to.value.index;
                const val = event.value.value;
                if ((val.kind === "Integer" || val.kind === "Float") && idx < this.bars.length) {
                    this.bars[idx] = { value: Number(val.value), highlighted: false };
                }
            }
        }

        if (event.kind === "Compare") {
            const leftIdx = event.left.kind === "ArraySlot" && event.left.value.id === this.trackedArrayId
                ? event.left.value.index : null;
            const rightIdx = event.right.kind === "ArraySlot" && event.right.value.id === this.trackedArrayId
                ? event.right.value.index : null;
            if (leftIdx !== null && leftIdx < this.bars.length) this.bars[leftIdx].highlighted = true;
            if (rightIdx !== null && rightIdx < this.bars.length) this.bars[rightIdx].highlighted = true;
        }
    }

    reset(): void {
        this.bars.splice(0, this.bars.length);
        this.trackedArrayId = null;
    }

    destroy(): void {
        if (this.componentInstance) {
            unmount(this.componentInstance);
            this.componentInstance = null;
        }
    }
}
