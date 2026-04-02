import type { Visualiser } from "$lib/visualiser.svelte";
import type { Component } from "svelte";
import type { TraceEvent } from "$lib/data/events/events.svelte";

export interface Milestone {
    id: string;
    description: string;
    completed: boolean;
}

/**
 * Base class for levels. Each level should extend this class and implement the init function to set up the level.
 */
export abstract class Level {
    visualiser: Visualiser | null = null;

    id: string = "";
    title: string = "";
    initialCode: string = "";
    description: Component | null = null;
    visualisationName: string = "";
    modules: string[] = [];
    milestones: Milestone[] = $state([]);

    constructor(visualiser: Visualiser) {
        this.visualiser = visualiser;
    }

    /**
     * Check if the level is complete by checking if all milestones are complete.
     */
    get isComplete() {
        return this.milestones.length > 0 && this.milestones.every(m => m.completed);
    }

    abstract init() : void;

    abstract handleEvent(event: TraceEvent, history: any) : void;
}