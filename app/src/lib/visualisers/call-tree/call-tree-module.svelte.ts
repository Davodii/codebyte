import type { TraceEvent } from "$lib/events/events.svelte";
import { trackedValueToString } from "$lib/events/events.svelte";
import type { VisualiserContext } from "$lib/visualiser.svelte";
import { mount, unmount } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import { VisualiserModule } from "../visualiser-module.svelte";
import CallTreeView from "./CallTreeView.svelte";

export type CallNodeStatus = 'active' | 'returned';

export type CallNode = {
    call_id: number;
    parentCallId: number | null;
    label: string;            // e.g. "fib(5)"
    returnValue: string | null;
    status: CallNodeStatus;
    childIds: number[];
};

export class CallTreeModule extends VisualiserModule {
    id = 'call-tree';
    fillContainer = true;

    nodes = new SvelteMap<number, CallNode>();

    private stack: number[] = [];

    private componentInstance: Record<string, any> | null = null;

    init(ctx: VisualiserContext, container: HTMLDivElement): void {
        super.init(ctx, container);
        this.componentInstance = mount(CallTreeView, {
            target: container,
            props: { nodes: this.nodes } as any,
        });
    }

    handleEvent(event: TraceEvent, _history: TraceEvent[]): void {
        if (event.kind === "FunctionCall") {
            const parentCallId = this.stack.at(-1) ?? null;
            const args = event.args.map(a => trackedValueToString(a)).join(", ");

            this.nodes.set(event.call_id, {
                call_id: event.call_id,
                parentCallId,
                label: `${event.function_name}(${args})`,
                returnValue: null,
                status: 'active',
                childIds: [],
            });

            // Wire parent -> child. Must use .set() to trigger SvelteMap reactivity.
            if (parentCallId !== null) {
                const parent = this.nodes.get(parentCallId)!;
                this.nodes.set(parentCallId, {
                    ...parent,
                    childIds: [...parent.childIds, event.call_id],
                });
            }

            this.stack.push(event.call_id);
        }

        if (event.kind === "FunctionReturn") {
            const node = this.nodes.get(event.call_id);
            if (node) {
                this.nodes.set(event.call_id, {
                    ...node,
                    returnValue: trackedValueToString(event.return_value),
                    status: 'returned',
                });
            }
            this.stack.pop();
        }
    }

    reset(): void {
        this.nodes.clear();
        this.stack = [];
    }

    destroy(): void {
        if (this.componentInstance) {
            unmount(this.componentInstance);
            this.componentInstance = null;
        }
    }
}
