/**
 * Types for events emitted by modules to communicate with each other and the visualiser.
 */
export enum ModuleEventType {
    VARIABLE_DECLARED = "VARIABLE_DECLARED",
    VARIABLE_CHANGED = "VARIABLE_CHANGED",
}

/**
 * The payload for each event type.
 * 
 * This is used to type the event bus and ensure that modules emit the correct payload for each event type.
 */
export interface ModuleEventMap {
    [ModuleEventType.VARIABLE_DECLARED]: {
        name: string;
        data: any;
    };
    [ModuleEventType.VARIABLE_CHANGED]: {
        name: string;
        oldData: any;
        newData: any;
    };
}

/**
 * A simple typed event emitter class to allow modules to communicate with each other and the visualiser.
 * 
 * This is used as the event bus for the visualiser system, allowing modules to emit events that other modules can listen to without needing to know about each other directly.
 */
export class ModuleEventBus {
    private listeners: {
        [K in keyof ModuleEventMap]?: ((payload: ModuleEventMap[K]) => void)[]
    } = {};

    /**
     * Subscribe to a module event.
     * 
     * @param event 
     * @param cb 
     */
    on<K extends keyof ModuleEventMap>(
        event: K, 
        cb: (payload: ModuleEventMap[K]) => void
    ) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(cb);
    }

    /**
     * Emit a module event.
     * 
     * @param event 
     * @param payload 
     */
    emit<K extends keyof ModuleEventMap>(
        event: K, 
        payload: ModuleEventMap[K]
    ) {
        this.listeners[event]?.forEach(cb => cb(payload));
    }
}