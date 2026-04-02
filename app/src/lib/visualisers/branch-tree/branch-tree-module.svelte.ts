import type { DataSource, TraceEvent } from "$lib/data/events/events.svelte";
import type { VisualiserContext } from "$lib/visualiser.svelte";
import { mount, unmount } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import { VisualiserModule } from "../visualiser-module.svelte";
import BranchTreeView from "./BranchTreeView.svelte";

export type BranchNodeStatus = 'active' | 'evaluated';

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

    // Runtime stack tracking which branch we're currently inside
    private stack: Array<{ id: number; conditionResult: boolean }> = [];

    // The most recent Compare event, used to label the next BranchEnter
    private lastCompare: (TraceEvent & { kind: "Compare" }) | null = null;

    private componentInstance: Record<string, any> | null = null;

    init(ctx: VisualiserContext, container: HTMLDivElement): void {
        super.init(ctx, container);
        this.componentInstance = mount(BranchTreeView, {
            target: container,
            props: { nodes: this.nodes } as any,
        });
    }

    handleEvent(event: TraceEvent, _history: TraceEvent[]): void {
        if (event.kind === "Compare") {
            this.lastCompare = event;
        }

        if (event.kind === "BranchEnter") {
            const { statement_id, condition_result } = event;
            const parent = this.stack.at(-1) ?? null;

            if (!this.nodes.has(statement_id)) {
                const label = this.lastCompare
                    ? `${formatDataSource(this.lastCompare.left)} ${formatOperator(this.lastCompare.operator)} ${formatDataSource(this.lastCompare.right)}`
                    : "condition";

                this.nodes.set(statement_id, {
                    id: statement_id,
                    parentId: parent?.id ?? null,
                    depth: this.stack.length,
                    trueChildId: null,
                    falseChildId: null,
                    label,
                    status: 'active',
                    conditionResult: condition_result,
                });
            } else {
                // Node revisited (e.g. inside a loop) -- replace object so SvelteMap notifies dependents
                const existing = this.nodes.get(statement_id)!;
                this.nodes.set(statement_id, { ...existing, status: 'active', conditionResult: condition_result });
            }

            // Wire parent -> this node along the branch that was taken.
            // Must replace the object via .set() so SvelteMap notifies dependents --
            // direct property mutation on a plain object is invisible to Svelte's reactivity.
            if (parent) {
                const parentNode = this.nodes.get(parent.id)!;
                if (parent.conditionResult) {
                    this.nodes.set(parent.id, { ...parentNode, trueChildId: statement_id });
                } else {
                    this.nodes.set(parent.id, { ...parentNode, falseChildId: statement_id });
                }
            }

            this.stack.push({ id: statement_id, conditionResult: condition_result });
            this.lastCompare = null;
        }

        if (event.kind === "BranchExit") {
            const node = this.nodes.get(event.statement_id);
            if (node) this.nodes.set(event.statement_id, { ...node, status: 'evaluated' });
            this.stack.pop();
        }
    }

    reset(): void {
        this.nodes.clear();
        this.stack = [];
        this.lastCompare = null;
    }

    destroy(): void {
        if (this.componentInstance) {
            unmount(this.componentInstance);
            this.componentInstance = null;
        }
    }
}
