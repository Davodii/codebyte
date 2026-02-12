import type { VariablesEvents } from "./variables-module";

// TODO: extend with the other events
type VisualiserEvents = & VariablesEvents;

type EventCallback<T = any> = (payload: T) => void;

export class EventBus {
    private listeners = new Map<string, EventCallback[]>();

    on<T>(event: string, cb: EventCallback<T>) {
        // Register the event if it does not exist
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        this.listeners.get(event)!.push(cb as EventCallback);
    }

    emit<T>(event: string, payload: T) {
        this.listeners.get(event)?.forEach(cb => cb(payload));
    }
}