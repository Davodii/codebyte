import type { TraceEvent } from "./data/events/events.svelte";
import type { VisualiserModule } from "./visualisers/visualiser-module.svelte";

// Class to store all the modules that are currently loaded into the visualiser system.
export class ModuleRegistry {
    private modules = new Map<string, VisualiserModule>();

    register(module: VisualiserModule) {
        this.modules.set(module.id, module);
    }

    get<T extends VisualiserModule>(id: string): T | undefined {
        const mod = this.modules.get(id);
        if (!mod) throw new Error(`Module ${id} not found.`);
        return mod as T;
    }

    has(id: string): boolean {
        return this.modules.has(id);
    }

    getAll(): VisualiserModule[] {
        return Array.from(this.modules.values());
    }

    // Broadcast the current event to every visualiser module
    broadcast(event: TraceEvent, history: TraceEvent[]) {
        this.modules.forEach(m => m.handleEvent(event, history));
    }
}