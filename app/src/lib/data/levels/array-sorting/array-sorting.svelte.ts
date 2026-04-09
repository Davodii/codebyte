import { popupManager } from "$lib/popup-store.svelte";
import type { Visualiser } from "$lib/visualiser.svelte";
import type { ArrayBarsModule } from "$lib/visualisers/array-bars/array-bars-module.svelte";
import type { TraceEvent } from "../../events/events.svelte";
import { Level } from "../level.svelte";
import ArraySortingDescription from "./ArraySortingDescription.svelte";

// The swap logic is intentionally absent — the user must add it.
const INITIAL_CODE = `let arr = [5, 3, 8, 1, 9, 2]
let n = len(arr)
let i = 0
while i < n do
    let j = 0
    while j < n - i - 1 do
        if arr[j] > arr[j + 1] do
            # Swap arr[j] and arr[j + 1]
        end
        j = j + 1
    end
    i = i + 1
end`;

export class ArraySortingLevel extends Level {
    private trackedArrayId: number | null = null;
    private currentValues: number[] = [];
    private popupShown: boolean = false;

    constructor(visualiser: Visualiser) {
        super(visualiser);
        this.id = "array-sorting";
        this.title = "Array Sorting";
        this.visualisationName = "Array Bars";
        this.initialCode = INITIAL_CODE;
        this.description = ArraySortingDescription;
        this.modules = ["array-bars"];
    }

    init(): void {
        this.milestones = [
            {
                id: "run-code",
                description: "Run the code to see the algorithm comparing neighbouring elements.",
                completed: false,
            },
            {
                id: "add-swap",
                description: "Add the swap inside the if block",
                completed: false,
            },
            {
                id: "array-sorted",
                description: "Run the code again and watch the array sort itself.",
                completed: false,
            },
        ];
    }

    handleEvent(event: TraceEvent, _history: TraceEvent[]): void {
        // Milestone 1: first run (array initialised)
        if (event.kind === "Init") {
            if (event.location.kind === "Variable" && event.value.value.kind === "Array") {
                const arr = event.value.value.value;
                if (this.trackedArrayId === null) {
                    this.trackedArrayId = arr.id;
                }
                this.currentValues = arr.elements.map(el =>
                    el.value.kind === "Integer" || el.value.kind === "Float"
                        ? Number(el.value.value) : 0
                );

                const m = this.milestones.find(m => m.id === "run-code");
                if (m && !m.completed) m.completed = true;
            }
        }

        if (event.kind === "Compare" && !this.milestones[1].completed && !this.popupShown) {
            // Show a popup telling the user a comparison has been made, prompting them to add the swap logic.
            let dom = this.visualiser?.moduleRegistry.get<ArrayBarsModule>("array-bars")?.getArrayDomElement();
            if (dom) {
                popupManager.showPopup({
                    text: "The algorithm is comparing two elements. Can you add the swap logic to sort the array?",
                    target: dom,
                });
                this.popupShown = true;
            }
        }

        // Milestones 2 & 3: triggered by array element assignments (swap)
        if (event.kind === "Assign") {
            if (event.to.kind === "ArraySlot" && event.to.value.id === this.trackedArrayId) {
                const m2 = this.milestones.find(m => m.id === "add-swap");
                if (m2 && !m2.completed) m2.completed = true;

                const idx = event.to.value.index;
                const val = event.value.value;
                if ((val.kind === "Integer" || val.kind === "Float") && idx < this.currentValues.length) {
                    this.currentValues[idx] = Number(val.value);

                    if (this.isSorted(this.currentValues)) {
                        const m3 = this.milestones.find(m => m.id === "array-sorted");
                        if (m3 && !m3.completed) m3.completed = true;
                    }
                }
            }
        }
    }

    private isSorted(values: number[]): boolean {
        for (let i = 0; i < values.length - 1; i++) {
            if (values[i] > values[i + 1]) return false;
        }
        return true;
    }
}
