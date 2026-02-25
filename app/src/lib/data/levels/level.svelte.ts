import type { Visualiser } from "$lib/visualiser.svelte";
import type { TraceEvent } from "../events/events.svelte";

export interface Milestone {
    id: string;
    description: string;
    complete: boolean;
}

/**
 * Base class for levels. Each level should extend this class and implement the init function to set up the level.
 */
export abstract class Level {
    id: string = "";
    title: string = "";
    initialCode: string = "";
    description: string = "";
    modules: string[] = [];
    milestones = $state<Milestone[]>([]);

    /**
     * Check if the level is complete by checking if all milestones are complete.
     */
    get isComplete() {
        return this.milestones.length > 0 && this.milestones.every(m => m.complete);
    }

    abstract init(visualiser: Visualiser) : void;

    abstract handleEvent(event: TraceEvent, history: any) : void;
}