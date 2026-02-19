import { mount, tick, unmount } from "svelte";
import { ModuleRegistry } from "./module-registry.svelte";
import ModuleContainer from "../components/visualiser/ModuleContainer.svelte";
import type { Level } from "./data/levels/level.svelte";
import { VariablesModule } from "./visualisers/variables-module.svelte";
import type { TraceEvent } from "./data/events/events.svelte";
import { ModuleEventBus } from "./event-bus.svelte";
import type { VisualiserModule } from "./visualisers/visualiser-module.svelte";

export const moduleMap: Record<string, any> = {
    "variables": VariablesModule
};

export function getModuleClass(name: string) {
    const moduleClass = moduleMap[name];
    if (!moduleClass) {
        throw new Error(`Module ${name} not found in module map`);
    }
    return moduleClass;
}

/**
 * Visualiser context passed into modules on intialisation, allowing them to access the canvas, registry and event bus.
 */
export interface VisualiserContext {
    root: HTMLElement;
    registry: ModuleRegistry;
    bus: ModuleEventBus;
}

type ModuleContainerInstance = ReturnType<typeof mount>;

/**
 * The main visualiser class, responsible for managing the loaded modules, handling events and rendering the visualisation.
 */
export class Visualiser {
    // Registry for all loaded modules
    private registry = new ModuleRegistry();

    // The main container div that the visualiser is rendered into. 
    // This is passed to modules so they can add their own UI components if needed.
    private root : HTMLDivElement;

    // Main event bus
    private bus = new ModuleEventBus();

    // Store the component instances for each module, so we can call 
    // functions on them later if needed (e.g. to update their UI)
    private moduleContainers = new Map<string, ModuleContainerInstance>();

    // TODO: provide a way for modules to access certain divs?

    constructor(container: HTMLDivElement) {
        this.root = container;
    }

    /**
     * Cleanup the visualiser by destroying all loaded modules and removing their UI components from the DOM.
     */
    cleanup() {
        // Cleanup modules
        this.registry.getAll().forEach(mod => mod.destroy());
        
        // Remove module containers
        this.moduleContainers.forEach(instance => unmount(instance));
        this.moduleContainers.clear();
    }

    /**
     * Reset the visualiser to initial state.
     * 
     * Used to remove UI elements and reset module state when restarting a level, without needing to reload the page and lose the loaded modules.
     */
    reset() {
        // Reset modules
        this.registry.getAll().forEach(mod => mod.reset());
    }

    /**
     * Initialise the visualiser with a level, loading the modules specified in the level config and calling their init functions.
     * @param level 
     * @returns The list of module instances that were created and initialised
     */
    initLevel(level: Level) : VisualiserModule[] {
        // Clear previous modules
        this.cleanup();
    
        // Initiate modules
        const instances = level.config.modules.map(name => {
            const Ctor = getModuleClass(name);
            return new Ctor();
        });

        // Register modules first so they can see each other during initialisation
        instances.forEach(mod => this.registry.register(mod));

        console.log("root:", this.root);

        // TODO: have a hierarchy being checked to ensure loaded in correct order
        instances.forEach(async mod => {
            // Create a new div for each module, and call the mount function to allow them to add their UI components
            const componentInstance = mount(ModuleContainer, {
                target: this.root!,
                props: { id: mod.id }
            });

            // Store the component instance for later use
            this.moduleContainers.set(mod.id, componentInstance);

            await tick(); // Wait for the DOM to update before trying to access the div
            const internalDiv = componentInstance.getElement();

            console.log(`Initialising module ${mod.id}`);
            console.log(internalDiv);

            // Call the module's init function, passing in the div it can use to add its UI, 
            // and the registry and event bus for communication  
            mod.init(
                 {
                    root: this.root,
                    registry: this.registry,
                    bus: this.bus
                } as VisualiserContext,
                internalDiv
            );
        });

        return instances; // Return to level code to attach listeners
    }

    /**
     * Handle a trace event for the visualiser.
     * @param event
     * @param history 
     */
    handleEvent(event: TraceEvent, history: TraceEvent[]) {
        console.log("Visualiser received event");
        // Broadcast the current event to every visualiser module
        this.registry.broadcast(event, history);
    }
}