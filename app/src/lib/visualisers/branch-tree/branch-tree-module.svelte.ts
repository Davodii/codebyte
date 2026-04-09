import type { TraceEvent } from "$lib/events/events.svelte";
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

type IfToken = { type: 'if' | 'do' | 'end' | 'else'; offset: number };

/**
 * Parse the source code to build the complete if/else tree.
 *
 * BranchEnter events use `statement_id = span.start`, which is the byte offset
 * of the `if` keyword in the source. We use that same offset as the node ID so
 * that handleEvent can look up nodes by statement_id during playback.
 *
 * Building from source (rather than trace events) means ALL branches are visible
 * upfront — including those never taken in a given run.
 */
function parseIfTree(source: string, nodes: SvelteMap<number, BranchNode>): void {
    nodes.clear();

    // Strip string literals and line comments so keywords inside them are ignored.
    // We replace with spaces to preserve byte offsets for slice() calls later.
    const stripped = source
        .replace(/"[^"\n]*"/g, m => ' '.repeat(m.length))
        .replace(/#[^\n]*/g,   m => ' '.repeat(m.length));

    const tokens: IfToken[] = [];
    const re = /\b(if|do|end|else)\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(stripped)) !== null) {
        tokens.push({ type: m[1] as IfToken['type'], offset: m.index });
    }

    let pos = 0;

    /**
     * Recursively parse a block of statements, collecting any `if` nodes found.
     * Stops when it hits `end` or `else` (letting the caller consume those).
     */
    function parseBlock(
        parentId: number | null,
        depth: number,
        isTrueBranch: boolean | null,
        parentNode: BranchNode | null,
    ): void {
        while (pos < tokens.length) {
            const tok = tokens[pos];

            if (tok.type === 'if') {
                pos++; // consume 'if'
                const nodeOffset = tok.offset;

                // Condition text: from just after 'if' up to the next 'do'
                const condStart = nodeOffset + 2;
                while (pos < tokens.length && tokens[pos].type !== 'do') {
                    pos++;
                }
                const condEnd = pos < tokens.length ? tokens[pos].offset : condStart;
                const condition = source.slice(condStart, condEnd).trim();
                pos++; // consume 'do'

                // Wire first child into parent
                if (parentNode !== null && isTrueBranch !== null) {
                    if (isTrueBranch && parentNode.trueChildId === null) {
                        parentNode.trueChildId = nodeOffset;
                    } else if (!isTrueBranch && parentNode.falseChildId === null) {
                        parentNode.falseChildId = nodeOffset;
                    }
                }

                const node: BranchNode = {
                    id: nodeOffset,
                    parentId,
                    depth,
                    trueChildId: null,
                    falseChildId: null,
                    label: condition,
                    status: 'pending',
                    conditionResult: false,
                };
                nodes.set(nodeOffset, node);

                // True branch body
                parseBlock(nodeOffset, depth + 1, true, node);

                // Consume the 'end' that closes the true branch
                if (pos < tokens.length && tokens[pos].type === 'end') {
                    pos++;
                }

                // Optional else branch
                if (pos < tokens.length && tokens[pos].type === 'else') {
                    pos++; // consume 'else'
                    if (pos < tokens.length && tokens[pos].type === 'do') {
                        pos++; // consume 'do'
                    }
                    parseBlock(nodeOffset, depth + 1, false, node);
                    if (pos < tokens.length && tokens[pos].type === 'end') {
                        pos++; // consume closing 'end' of else
                    }
                }

            } else if (tok.type === 'end' || tok.type === 'else') {
                // Signal the caller to handle this token
                break;

            } else if (tok.type === 'do') {
                // A `do` from a non-if block (while, func, bare block).
                // Recurse so that ifs nested inside are still collected, then
                // consume the matching `end`.
                pos++; // consume 'do'
                parseBlock(parentId, depth, isTrueBranch, parentNode);
                if (pos < tokens.length && tokens[pos].type === 'end') {
                    pos++;
                }

            } else {
                pos++;
            }
        }
    }

    parseBlock(null, 0, null, null);
}

export class BranchTreeModule extends VisualiserModule {
    id = 'branch-tree';
    fillContainer = true;

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
     * Build the complete branch tree from the source code so all branches are
     * visible before (and independent of) which paths are actually executed.
     */
    preprocess(_events: TraceEvent[], sourceCode: string): void {
        parseIfTree(sourceCode, this.nodes);
    }

    handleEvent(event: TraceEvent, _history: TraceEvent[]): void {
        if (event.kind === "BranchEnter") {
            const node = this.nodes.get(event.statement_id);
            if (node) this.nodes.set(event.statement_id, {
                ...node,
                status: 'active',
                conditionResult: event.condition_result,
            });
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
