import type { Visualiser } from "$lib/visualiser.svelte";
import type { TraceEvent } from "../../events/events.svelte";
import { Level } from "../level.svelte";
import RecursionDescription from "./RecursionDescription.svelte";

const INITIAL_CODE = `func fib(n) do
    if n <= 1 do
        return n
    end
    return fib(n - 1) + fib(n - 2)
end

let result = fib(5)`;

export class RecursionLevel extends Level {
    constructor(visualiser: Visualiser) {
        super(visualiser);
        this.id = "recursion";
        this.title = "Recursion";
        this.visualisationName = "Call Tree";
        this.initialCode = INITIAL_CODE;
        this.description = RecursionDescription;
        this.modules = ["call-tree"];
    }

    init(): void {
        this.milestones = [
            {
                id: "run-code",
                description: "Run the code to see the recursion tree build up.",
                completed: false,
            },
            {
                id: "base-case-returned",
                description: "Watch the base cases (fib(0) and fib(1)) return first.",
                completed: false,
            },
            {
                id: "result-correct",
                description: "See fib(5) return the correct result (5).",
                completed: false,
            },
        ];
    }

    handleEvent(event: TraceEvent, _history: TraceEvent[]): void {
        if (event.kind === "FunctionCall") {
            const m = this.milestones.find(m => m.id === "run-code");
            if (m && !m.completed) m.completed = true;
        }

        if (event.kind === "FunctionReturn") {
            const val = event.return_value.value;

            // Base case: fib(0) = 0 or fib(1) = 1
            if (val.kind === "Integer" && (val.value === 0 || val.value === 1)) {
                const m = this.milestones.find(m => m.id === "base-case-returned");
                if (m && !m.completed) m.completed = true;
            }

            // Root call returns fib(5) = 5
            if (val.kind === "Integer" && val.value === 5) {
                const m = this.milestones.find(m => m.id === "result-correct");
                if (m && !m.completed) m.completed = true;
            }
        }
    }
}
