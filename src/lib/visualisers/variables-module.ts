import type { TraceEvent } from "$lib/data/events/events";
import { mount } from "svelte";
import VariableBox from "../../components/visualiser/VariableBox.svelte";
import { VisualiserModule } from "./visualiser-module";
import { ModuleEventType } from "$lib/event-bus";
import type { VisualiserContext } from "$lib/visualiser";

export type Variable = {
    name: string;
    data: any;
}

export class VariablesModule extends VisualiserModule {
    // Need to store:
    // - [~] Current variables in memory
    // - [x] The data stored in the variable

    // Events:
    // - [x] Variable created
    // - [x] Variable value changed (Also where the value comes from)
    
    // Connections:
    // - [ ] SCOPES - variables added as children of the scope they are declared in

    id = 'variables';

    private variables = $state(new Map<string, Variable>());
    private section = $state<HTMLDivElement | null>(null);

    private activeComponents = new Map<string, any>();

    private handleInit(event: TraceEvent) {
        if (!('Init' in event)) return;
        if (!('location' in event.Init)) return;
        if (typeof event.Init.location !== 'object' || !('Variable' in event.Init.location)) return;

        const name = event.Init.location.Variable;
        const data = event.Init.value;

        // Initialisation of a variable
        const variable : Variable = { name, data };

        // Store data in the map
        this.variables.set(name, variable);

        const instance = mount(VariableBox, {
            target: this.section!,
            props: { variable: variable}
        });

        this.activeComponents.set(name, instance);


        // Emit event to the event bus
        this.ctx?.bus.emit(ModuleEventType.VARIABLE_DECLARED, variable);
    }

    private handleUpdate(event: TraceEvent) {
        if (!('Assign' in event)) return;
        if (!('to' in event.Assign)) return;
        if (typeof event.Assign.to !== 'object' || !('Variable' in event.Assign.to)) return;
    
        const name = event.Assign.to.Variable;
        const newData = event.Assign.value;

        const variable = this.variables.get(name);
        if (variable) {
            const oldData = this.variables.get(name)?.data;
            variable.data = newData;

            // Emit an event to the event bus
            this.ctx?.bus.emit(ModuleEventType.VARIABLE_CHANGED, { name, oldData, newData });
        }
    }

    handleEvent(event: TraceEvent, history: TraceEvent[]): void {
        if ('Init' in event) {
            this.handleInit(event);
        }
        if ('Assign' in event) {
            this.handleUpdate(event);
        }
    }

    destroy(): void {
        // Cleanup the UI
        this.activeComponents.forEach(instance => instance.$destroy());
        this.activeComponents.clear();
    }

    init(ctx: VisualiserContext, container: HTMLDivElement): void {
        super.init(ctx, container);

        // TODO: subscribe to the event bus for any updates
    }
}