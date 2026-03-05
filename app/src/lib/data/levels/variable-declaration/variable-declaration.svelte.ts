import { ModuleEventType } from "$lib/event-bus.svelte";
import { popupManager } from "$lib/popup-store.svelte";
import type { Visualiser } from "$lib/visualiser.svelte";
import type { VariablesModule } from "$lib/visualisers/variables-module.svelte";
import VariableLevel from "../../../components/descriptions/VariableLevelDescription.svelte";
import type { TraceEvent } from "$lib/data/events/events.svelte";
import { Level } from "./level.svelte";

export class VariableDeclarationLevel extends Level {
    visualiser: Visualiser | null = null;

    runCount = 0;

    constructor() {
        super();
        this.id = "variable-declaration";
        this.title = "Variable Declaration";
        this.initialCode = `# Here is a variable named 'x' being declared and assigned the value 5\nlet x = 5\n`;
        this.description = VariableLevel;
        // TODO: provide some way to embed HTML? for things like images and links
        this.modules = ["variables"];
    }

    init(visualiser: Visualiser): void {
        this.visualiser = visualiser;

        this.milestones = [
            { id: "run-code", description: "Run the code to see the variable declaration in action.", completed: false },
            { id: "declare-variable", description: "Declare a new variable named and assign it a value.", completed: false },
        ];

        // TODO: 
        // - [x] load modules (handled in level session)

        // - [~] attach listeners to the event bus
        // Attaching a listener to the VARIABLE_DECLARED event to check when the user declares a variable and update the milestones accordingly
        visualiser.eventBus.on(ModuleEventType.VARIABLE_DECLARED, this.handleVariableDeclared.bind(this));
    }

    handleEvent(event: TraceEvent, history: any): void {
        // throw new Error("Method not implemented.");
    }

    handleVariableDeclared(payload : { name: string; data: any }) {
        console.log("Variable declared:", payload.name, payload.data);

        if (!this.visualiser) return;

        // Check the name of the variable declared and update the current step accordingly
        if (payload.name === "x") {
            const milestone = this.milestones.find(m => m.id === "run-code");
            if (milestone && !milestone.completed) {
                milestone.completed = true;

                const variableModule = this.visualiser.moduleRegistry.get<VariablesModule>("variables");
                if (!variableModule) {
                    console.error("Variables module not found in registry");
                    return;
                }
                
                const variableElement = variableModule.getVariableDomElement("x");

                console.log("Variable element:", variableElement);

                // TODO: show a popup to the new variable
                popupManager.showPopup({
                    text: `Look! A box has appeared with for the variable 'x'. Now you can move onto the next milestone.`,
                    target: variableElement
                });
            }
        }

        if (payload.name !== "x") {
            // User has created another variable
            // Check the previous milestone is also complete
            const runMilestone = this.milestones.find(m => m.id === "run-code");
            const milestone = this.milestones.find(m => m.id === "declare-variable");
            if (runMilestone && runMilestone.completed && milestone && !milestone.completed) {
                milestone.completed = true;

                const variableModule = this.visualiser.moduleRegistry.get<VariablesModule>("variables");
                if (!variableModule) {
                    console.error("Variables module not found in registry");
                    return;
                }
                
                const variableElement = variableModule.getVariableDomElement(payload.name);

                popupManager.showPopup({
                    text: `Great! You've declared a new variable.`,
                    target: variableElement
                });
            }
        }
    }

    handleCodeRun() {
        // Callback for when the user runs the code
        this.runCount++;

        // We have a new milestone now, 
    }
}