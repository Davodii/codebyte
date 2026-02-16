import { mount, unmount } from "svelte";
import { ModuleRegistry } from "./module-registry";
import ModuleContainer from "../components/visualiser/ModuleContainer.svelte";
import type { Level } from "./data/levels/level";
import { VariablesModule } from "./visualisers/variables-module";
import type { TraceEvent } from "./data/events/events";
import { ModuleEventBus } from "./event-bus";
import type { VisualiserModule } from "./visualisers/visualiser-module";

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

        // TODO: have a hierarchy being checked to ensure loaded in correct order
        instances.forEach(mod => {
            // Create a new div for each module, and call the mount function to allow them to add their UI components
            const componentInstance = mount(ModuleContainer, {
                target: this.root!,
                props: { id: mod.id }
            });

            // Store the component instance for later use
            this.moduleContainers.set(mod.id, componentInstance);

            const internalDiv = componentInstance.getElement();

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
        // Broadcast the current event to every visualiser module
        this.registry.broadcast(event, history);
    }
}