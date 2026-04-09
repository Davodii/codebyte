import type { DataSource, TraceEvent } from "$lib/data/events/events.svelte";
import type { VisualiserContext } from "$lib/visualiser.svelte";
import { mount, unmount } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import { VisualiserModule } from "../visualiser-module.svelte";
import BranchTreeView from "./BranchTreeView.svelte";

export type BranchNodeStatus = 'pending' | 'active' | 'evaluated';

export type BranchNode = {
    id: number;
    parentId: number | null;
    depth: number;
    trueChildId: number | null;
    falseChildId: number | null;
    label: string;
    status: BranchNodeStatus;
    conditionResult: boolean;
};

function formatDataSource(ds: DataSource): string {
    if (ds.kind === "Variable") return ds.value;
    if (ds.kind === "ArraySlot") return `[${ds.value.index}]`;
    if (ds.kind === "Literal") return "...";
    return "?";
}

function formatOperator(op: string): string {
    const map: Record<string, string> = {
        ">=": ">=", "<=": "<=", "==": "=", "!=": "!=",
    };
    return map[op] ?? op;
}

export class BranchTreeModule extends VisualiserModule {
    id = 'branch-tree';

    // Reactive map of branch nodes -- drives the view
    nodes = new SvelteMap<number, BranchNode>();

    private componentInstance: Record<string, any> | null = null;

    init(ctx: VisualiserContext, container: HTMLDivElement): void {
        super.init(ctx, container);
        this.componentInstance = mount(BranchTreeView, {
            target: container,
            props: { nodes: this.nodes } as any,
        });
    }

    /**
     * Pre-scan all events to build the complete decision tree in 'pending' state.
     * This runs before playback so the full tree is visible immediately.
     */
    preprocess(events: TraceEvent[]): void {
        this.nodes.clear();
        const stack: Array<{ id: number; conditionResult: boolean }> = [];
        let lastCompare: (TraceEvent & { kind: "Compare" }) | null = null;

        for (const event of events) {
            if (event.kind === "Compare") {
                lastCompare = event;
            }

            if (event.kind === "BranchEnter") {
                const { statement_id, condition_result } = event;
                const parent = stack.at(-1) ?? null;

                if (!this.nodes.has(statement_id)) {
                    const label = lastCompare
                        ? `${formatDataSource(lastCompare.left)} ${formatOperator(lastCompare.operator)} ${formatDataSource(lastCompare.right)}`
                        : "condition";

                    this.nodes.set(statement_id, {
                        id: statement_id,
                        parentId: parent?.id ?? null,
                        depth: stack.length,
                        trueChildId: null,
                        falseChildId: null,
                        label,
                        status: 'pending',
                        conditionResult: condition_result,
                    });
                }

                // Wire parent -> child along the branch that was taken.
                if (parent) {
                    const parentNode = this.nodes.get(parent.id)!;
                    if (parent.conditionResult) {
                        this.nodes.set(parent.id, { ...parentNode, trueChildId: statement_id });
                    } else {
                        this.nodes.set(parent.id, { ...parentNode, falseChildId: statement_id });
                    }
                }

                stack.push({ id: statement_id, conditionResult: condition_result });
                lastCompare = null;
            }

            if (event.kind === "BranchExit") {
                stack.pop();
            }
        }
    }

    handleEvent(event: TraceEvent, _history: TraceEvent[]): void {
        if (event.kind === "BranchEnter") {
            const node = this.nodes.get(event.statement_id);
            if (node) this.nodes.set(event.statement_id, { ...node, status: 'active' });
        }

        if (event.kind === "BranchExit") {
            const node = this.nodes.get(event.statement_id);
            if (node) this.nodes.set(event.statement_id, { ...node, status: 'evaluated' });
        }
    }

    reset(): void {
        this.nodes.clear();
    }

    destroy(): void {
        if (this.componentInstance) {
            unmount(this.componentInstance);
            this.componentInstance = null;
        }
    }
}
