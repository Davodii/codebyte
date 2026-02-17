import type { TraceEvent } from "$lib/data/events/events.svelte";
import type { VisualiserContext } from "$lib/visualiser.svelte";

/**
 * Abstract class for all modules that can be loaded into the visualiser system.
 * 
 * Each module is responsible for rendering a specific aspect of the visualisation (e.g. variables, call stack, etc.) and handling events related to that aspect.
 */
export abstract class VisualiserModule {
    abstract id: string;

    protected ctx? : VisualiserContext;

    // The container div that this module can render into.
    protected container? : HTMLDivElement;

    // List of module ids that this module depends on. 
    // The visualiser will ensure that these modules are loaded before this module is initialized.
    dependencies: string[] = [];

    init(ctx: VisualiserContext, container: HTMLDivElement): void {
        this.ctx = ctx;
        this.container = container;
    };

    /**
     * Handle a trace event for this module.
     * 
     * @param event The trace event to handle
     * @param history The history of events up to and including the current event
     */
    abstract handleEvent(event: TraceEvent, history: TraceEvent[]): void;

    /**
     * Destroy the module and clean up any resources it is using (e.g. DOM elements, event listeners, etc.)
     */
    abstract destroy(): void;

    /**
     * Optional update function that is called every frame (e.g. for animations).
     * @param deltaTime The time in milliseconds since the last update call
     */
    update?(deltaTime: number): void;

    /**
     * Reset the module to its initial state (e.g. when restarting the visualisation).
     */
    abstract reset(): void;
}