import { invoke } from "@tauri-apps/api/core";
import type { TraceEvent, DataSource, TrackedValue } from "./types";

export class LevelEngine {
    events = $state<TraceEvent[]>([]); // Trace events from interpeter
    currentIndex = $state(0);


    // This map stores the current state of every storage location
    // Key: stringified DataSource, value: TrackedValue
    stateMap = $derived.by(() => {
        const map = new Map<string, TrackedValue>();
        for (let i = 0; i <= this.currentIndex; i++) {
            const ev = this.events[i];

            if ("Init" in ev) {
                map.set(JSON.stringify(ev.Init.location), ev.Init.value);
            } else if ("Assign" in ev) {
                map.set(JSON.stringify(ev.Assign.to), ev.Assign.value);
            }
        }
        return map;
    });

    
    currentLevelId = $state("");
    code = $state("");
    isRunning = $state(false);

    // Derived: current event being visualised
    currentEvent = $derived(this.events[this.currentIndex]);


    snapshot = $derived.by(() => {
        const vars = new Map();
        for (let i = 0; i <= this.currentIndex; i++) {
            const ev = this.events[i];
            if ("Init" in ev) {
                // TODO: Handle new variable being made
                // vars.set(ev.name, ev.value)
            } else if ("Assign" in ev) {
                // TODO: Handle assignment
                // vars.set(ev.name, ev.value)
            }
        }

        return vars;
    });

    checkCompletion(levelId: string) {
        if (levelId === 'variable-declaration') {
            // Parse the events
            // Check if there is an variable initialisation for a variable other than x
        }

        // TODO: add logic for the other levels
    }

    async loadLevel(id: string) {
        this.currentLevelId = id;
        const data = await fetch(`$lib/data/levels/${id}.json`).then(r => r.json());
        this.code = data.initialCode;
        this.events = [];
        this.currentIndex = 0;
    }

    async runExecution() {
        this.isRunning = true;
        try {
            this.events = await invoke('interpret_code', {input: this.code});
            this.playTrace();
        } catch (e) {
            console.error(e);
        } finally {
            this.isRunning = false;
        }
    }

    private async playTrace() {
        for (let i = 0; i < this.events.length; i++) {
            this.currentIndex = i;
            await new Promise(r => setTimeout(r, 200)); // Playback speed
        }
    }
}

export const engine = new LevelEngine();