import type { TraceEvent } from "$lib/events/events.svelte";
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

    /**
     * Whether this module's container should grow to fill the available panel space.
     * Set to true for full-panel visualisations (e.g. tree views, canvas-based modules).
     * Defaults to false so small modules (e.g. variable cards) stay auto-sized.
     */
    fillContainer: boolean = false;

    init(ctx: VisualiserContext, container: HTMLDivElement): void {
        this.ctx = ctx;
        this.container = container;
    };

    /**
     * Called once with all trace events before playback begins.
     * Modules that need to pre-analyse the full event list (e.g. to build a tree structure)
     * should implement this optional method.
     *
     * @param sourceCode The raw source code the user submitted — available for modules
     *                   that need to parse the program structure (e.g. building a full
     *                   branch tree including untaken paths).
     */
    preprocess?(events: TraceEvent[], sourceCode: string): void;

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