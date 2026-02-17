import type { Level } from "./data/levels/level.svelte";
import type { Visualiser } from "./visualiser.svelte";
import type { TraceEvent } from "./data/events/events.svelte";
import { invoke } from "@tauri-apps/api/core";

/**
 * Class to manage a level session, including loading the level, managing the visualiser, and processing events.
 */
export class LevelSession {
    public level: Level;
    public visualiser: Visualiser;

    state = $state({
        events: [] as TraceEvent[], // Trace events from interpeter
        currentIndex: 0,
        isPaused: true,
        playbackSpeed: 200,
        currentLevelId: "",
        // TODO: the code lives in the CodeEditor component, but we 
        // need it here to send to the backend. 
        // Maybe move it here and pass it down as a prop?
        code: "",
    });

    constructor(level: Level, visualiser: Visualiser) {
        this.level = level;
        this.visualiser = visualiser;
    }

    init() {
        // Initialise the visualiser with the modules specified in the level configuration
        this.visualiser.initLevel(this.level);

        // Initialise the level
        this.level.init();

        // Move code into the state
        this.state.code = this.level.config.initialCode;
    }

    /**
     * Start the level session. 
     * 
     * This will load the level configuration, initialise the visualiser with the correct modules, and start the engine to process events.
     */
    async start() {
        // Get the data from the backend
        this.state.events = await invoke('interpret_code', {input: this.state.code});
        this.state.currentIndex = 0;
        this.state.isPaused = false;

        // Cleanup the visualiser
        this.visualiser.reset();

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
     * Pause execution of events.
     */
    async pause() {
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
        while (this.state.currentIndex < this.state.events.length) {
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

            // Wait for a bit before processing the next event, to control playback speed
            await new Promise(r => setTimeout(r, this.state.playbackSpeed));
        }
    }
}