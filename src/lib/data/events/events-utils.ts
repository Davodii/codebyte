import type { DataSource, TraceEvent, Value } from "./events";

export function formatValue(v: Value) : string {
    if (v === "Nil") return "Nil";
    if (typeof(v) === "object") {
        if ("Integer" in v) return v.Integer.toString();
        if ("Float" in v) return v.Float.toString();
        if ("String" in v) return `"${v.String}"`;
        if ("Boolean" in v) return v.Boolean ? "True" : "False";
        if ("Array" in v) {
            const elements = v.Array.elements.map(ev => formatValue(ev.value));
            return `[${elements.join(", ")}]`;
        }
    }
    return "Unknown";
}

export function formatTraceEvent(e: TraceEvent) : string {
    if ("Init" in e) {
        return `Init ${formatValue(e.Init.value.value)} at ${formatDataSource(e.Init.location)}`;
    } else if ("Assign" in e) {
        return `Assign ${formatValue(e.Assign.value.value)} from ${formatDataSource(e.Assign.from)} to ${formatDataSource(e.Assign.to)}`;
    } else if ("Compare" in e) {
        return `Compare ${formatValue(e.Compare.left.value)} and ${formatValue(e.Compare.right.value)}: ${e.Compare.result}`;
    }
    return "Unknown TraceEvent";
}

export function formatDataSource(source: DataSource) : string {
    if (typeof(source) === "string") {
        return source;
    }

    if (typeof(source) === "object") {
        if ("Variable" in source) {
            return `Variable(${source.Variable})`;
        } else if ("ArraySlot" in source) {
            return `ArraySlot(id=${source.ArraySlot.id}, index=${source.ArraySlot.index})`;
        }
    }

    return "Unknown DataSource";
}