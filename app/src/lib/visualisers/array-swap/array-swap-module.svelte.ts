import type { TraceEvent } from "$lib/data/events/events.svelte";
import { VisualiserModule } from "../visualiser-module.svelte";

export class ArraySwapModule extends VisualiserModule {
    id: string;

    constructor() {
        super();
        this.id = "array-swap";
    }

    handleEvent(event: TraceEvent, history: TraceEvent[]): void {
        throw new Error("Method not implemented.");
    }
    destroy(): void {
        throw new Error("Method not implemented.");
    }
    reset(): void {
        throw new Error("Method not implemented.");
    }

}