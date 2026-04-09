import type { Visualiser } from "$lib/visualiser.svelte";
import type { TraceEvent } from "../../events/events.svelte";
import { Level } from "../level.svelte";
import ConditionalsDescription from "./ConditionalsDescription.svelte";

const INITIAL_CODE = `let score = 75
let grade = "C"

if score >= 90 do
    grade = "A"
end else do
    if score >= 70 do
        grade = "B"
    end
end`;

export class ConditionalsLevel extends Level {
    constructor(visualiser: Visualiser) {
        super(visualiser);
        this.id = "conditionals";
        this.title = "Conditionals";
        this.visualisationName = "Decision Tree";
        this.initialCode = INITIAL_CODE;
        this.description = ConditionalsDescription;
        this.modules = ["variables", "branch-tree"];
    }

    init(): void {
        this.milestones = [
            {
                id: "run-code",
                description: "Run the code to see the conditions evaluated in the decision tree.",
                completed: false,
            },
            {
                id: "grade-a",
                description: "Change score to 95 and re-run to get grade A.",
                completed: false,
            },
        ];
    }

    handleEvent(event: TraceEvent, _history: TraceEvent[]): void {
        if (event.kind === "BranchEnter") {
            const milestone = this.milestones.find(m => m.id === "run-code");
            if (milestone && !milestone.completed) milestone.completed = true;
        }

        if (event.kind === "Assign") {
            if (
                event.to.kind === "Variable" &&
                event.to.value === "grade" &&
                event.value.value.kind === "String" &&
                event.value.value.value === "A"
            ) {
                const milestone = this.milestones.find(m => m.id === "grade-a");
                if (milestone && !milestone.completed) milestone.completed = true;
            }
        }
    }
}
