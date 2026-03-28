import type { Visualiser } from "$lib/visualiser.svelte";
import type { TraceEvent } from "../../events/events.svelte";
import { Level } from "../level.svelte";
import ArraySortingDescription from "./ArraySortingDescription.svelte";

export class ArraySortingLevel extends Level {


    constructor(visualiser: Visualiser) {
        super(visualiser);

        this.id = "array-sorting";
        this.title = "Array Sorting";
        this.initialCode = `# Here is an array of numbers that we want to sort\nlet arr = [5, 2, 9, 1, 5, 6]\n`;
        this.description = ArraySortingDescription;
        this.modules = [];
    }

    init(): void {
    }

    handleEvent(event: TraceEvent, history: any): void {
        throw new Error("Method not implemented.");
    }
}