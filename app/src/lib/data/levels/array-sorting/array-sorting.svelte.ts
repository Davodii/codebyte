import type { Visualiser } from "$lib/visualiser.svelte";
import type { TraceEvent } from "../events/events.svelte";
import { Level } from "./level.svelte";

export class ArraySortingLevel extends Level {
    constructor() {
        super();
        this.id = "array-sorting";
        this.title = "Array Sorting";
        this.initialCode = `# Here is an array of numbers that we want to sort\nlet arr = [5, 2, 9, 1, 5, 6]\n`;
        // this.description = "In this level, you'll learn how to sort arrays. Arrays are ordered collections of data, and sometimes you may want to arrange the elements in a specific order. ";
        this.modules = [];
    }

    init(visualiser: Visualiser): void {
        throw new Error("Method not implemented.");
    }

    handleEvent(event: TraceEvent, history: any): void {
        throw new Error("Method not implemented.");
    }
}