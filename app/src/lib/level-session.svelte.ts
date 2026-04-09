import type { Level } from "./levels/level.svelte";
import type { Visualiser } from "./visualiser.svelte";
import type { TraceEvent, Diagnostic, InterpretResult } from "./events/events.svelte";
import { invoke } from "@tauri-apps/api/core";
import type { LevelConstructor } from "./levels/level-map.svelte";

/**
 * Class to manage a level session, including loading the level, managing the visualiser, and processing events.
 */
export class LevelSession {
    public level: Level;
    public visualiser: Visualiser;

    state = $state({
        events: [] as TraceEvent[],
        diagnostics: [] as Diagnostic[],
        currentIndex: 0,
        isPaused: true,
        playbackSpeed: 200,
        currentLevelId: "",
        code: "",
    });

    // Set to true to break out of the play loop entirely (level switch, tab change, etc.)
    private stopped = false;

    constructor(Level: LevelConstructor, visualiser: Visualiser) {
        this.level = new Level(visualiser);
        this.visualiser = visualiser;
    }

    init() {
        // Initialise the visualiser with the modules specified in the level configuration
        this.visualiser.initLevel(this.level);

        // Initialise the level
        this.level.init();

        // Move code into the state
        // TODO: the code isnt being copied into the front end, also the code doesn't change on changing level
        this.state.code = this.level.initialCode;
    }

    /**
     * Start the level session. 
     * 
     * This will load the level configuration, initialise the visualiser with the correct modules, and start the engine to process events.
     */
    async start() {
        const result = await invoke<InterpretResult>('interpret_code', { input: this.state.code });

        this.state.diagnostics = result.diagnostics;
        this.state.events = result.events;
        this.state.currentIndex = 0;

        // Abort playback if there are any errors (diagnostics will be shown inline in the editor)
        if (result.diagnostics.some(d => d.severity === "Error")) {
            return;
        }

        this.stopped = false;
        this.state.isPaused = false;

        // Cleanup the visualiser
        this.visualiser.reset();

        // Give modules a chance to pre-analyse the full event list before playback
        this.visualiser.preprocess(this.state.events, this.state.code);

        // Start the main loop
        try {
            await this.play();
        }
        catch (e) {
            console.error(e);
        }
        finally {
            this.state.isPaused = true;
        }
    }

    /**
     * Pause execution of events (loop keeps running, waits to resume).
     */
    pause() {
        this.state.isPaused = true;
    }

    /**
     * Stop execution entirely and exit the play loop.
     * Use this when switching levels or navigating away.
     */
    stop() {
        this.stopped = true;
        this.state.isPaused = true;
    }

    /**
     * Resume execution of events.
     */
    async resume() {
        if (this.state.isPaused) {
            this.state.isPaused = false;
            await this.play();
        }
    }

    /**
     * Set the playback speed for processing event.
     * 
     * @param speed Delay between processing each event, in milliseconds. Lower is faster.
     */
    setPlaybackSpeed(speed: number) {
        this.state.playbackSpeed = speed;
    }

    private async play() {
        while (!this.stopped && this.state.currentIndex < this.state.events.length) {
            if (this.state.isPaused) {
                await new Promise(r => setTimeout(r, 100));
                continue;
            }

            const currentEvent = this.state.events[this.state.currentIndex];
            const history = this.state.events.slice(0, this.state.currentIndex + 1);

            // HEART OF THE SYSTEM: 

            // The session tells the visualiser to update ALL modules for THIS event
            this.visualiser.handleEvent(currentEvent, history);
            this.state.currentIndex++;

            // Tell the level that an event has been processed, so it can update its state if needed (e.g. for win conditions)
            this.level.handleEvent(currentEvent, history);

            // Wait for a bit before processing the next event, to control playback speed
            await new Promise(r => setTimeout(r, this.state.playbackSpeed));
        }
    }
}