import type { TraceEvent, TrackedValue } from "$lib/events/events.svelte";
import { mount, unmount, type Component } from "svelte";
import VariableBox from "./VariableBox.svelte";
import { VisualiserModule } from "../visualiser-module.svelte";
import { ModuleEventType } from "$lib/event-bus.svelte";

export class Variable {
    name: string;
    data = $state<TrackedValue>(null!);

    constructor(name: string, data: TrackedValue) {
        this.name = name;
        this.data = data;
    }
}

type MountedVariable = {
    instance: Record<string, any>;
    wrapper: HTMLElement;
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

    // Current DOM elements
    private activeComponents = new Map<string, MountedVariable>();

    // Each entry is the set of variable names declared in that scope.
    // Pushed on ScopeEntered, popped (and variables removed) on ScopeExited.
    private scopeStack: Set<string>[] = [];

    public getVariableDomElement(name: string): HTMLElement | null {
        const mountedVar = this.activeComponents.get(name);

        if (!mountedVar) return null;

        // Return the wrapper div
        return mountedVar.wrapper;
    }

    private getRandomVibrantColor(lightness: number = 60): string {
        const hue = Math.floor(Math.random() * 360); // 0 to 360 degrees
        return `hsl(${hue}, 70%, ${lightness}%)`;
    }

    private handleInit(event: TraceEvent) {
        if (event.kind !== "Init") return;
        if (event.location.kind !== "Variable") return; // Skip if not a variable declaration

        const name = event.location.value;
        const data = event.value;

        // Initialisation of a variable
        const variable = new Variable(name, data);
        this.variables.set(name, variable);

        // Create a dedicated wrapper div
        const wrapper = document.createElement("div");
        wrapper.id = `var-wrapper-${name}`;

        // Register in the current scope so it gets cleaned up on ScopeExited
        if (this.scopeStack.length > 0) {
            this.scopeStack[this.scopeStack.length - 1].add(name);
        }

        // Append to main container
        this.container!.appendChild(wrapper);

        const instance = mount(VariableBox, {
            target: wrapper,
            props: { 
                variable: variable,
                colour: this.getRandomVibrantColor() // TODO: remove this in the future
            }
        });

        this.activeComponents.set(name, {instance, wrapper});

        // Emit event to the event bus
        this.ctx?.bus.emit(ModuleEventType.VARIABLE_DECLARED, variable);
    }

    private handleAssign(event: TraceEvent) {
        if (event.kind !== "Assign") return;  
        if (event.to.kind !== "Variable") return; // Skip if not assigning to a variable
        
        const name = event.to.value;
        const newData = event.value;

        const variable = this.variables.get(name);
        if (variable) {
            const oldData = variable.data;
            variable.data = newData;

            // Emit an event to the event bus
            this.ctx?.bus.emit(ModuleEventType.VARIABLE_CHANGED, { name: name, oldData, newData });
        }
    }

    handleEvent(event: TraceEvent, history: TraceEvent[]): void {
        if (event.kind === "ScopeEnter") {
            this.scopeStack.push(new Set());
        }

        if (event.kind === "ScopeExit") {
            const scope = this.scopeStack.pop();
            if (scope) {
                scope.forEach(name => this.removeVariable(name));
            }
        }

        if (event.kind === "Init") {
            this.handleInit(event);
        }

        if (event.kind === "Assign") {
            this.handleAssign(event);
        }
    }

    destroy(): void {
        this.reset(); // Reset will clean up the UI and clear variables
    }

    private removeVariable(name: string) {
        const instance = this.activeComponents.get(name);
        if (!instance) return;

        unmount(instance.instance);
        instance.wrapper.remove();
        this.activeComponents.delete(name);
        this.variables.delete(name);
    }

    reset(): void {
        // Remove all variables from the UI and clear the map
        this.activeComponents.forEach(({instance, wrapper}) => {
            unmount(instance);
            wrapper.remove();
        });
        this.activeComponents.clear();
        this.variables.clear();
        this.scopeStack = [];
    }
}