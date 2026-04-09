
export function valueToString(val: Value): string {
    switch (val.kind) {
        case "Integer":
        case "Float":
        case "String":
        case "Boolean":
            return String(val.value);
        case "Nil":
            return "nil";
        case "Function":
            return `[Function: ${val.func_type.value.name}]`;
        case "Array":
            const elements = val.value.elements
                .map(ev => valueToString(ev.value))
                .join(", ");
            return `[${elements}]`;
        default:
            const _exhaustiveCheck: never = val;
            return "Unknown";
    }
}

export function trackedValueToString(tv: TrackedValue): string {
    return valueToString(tv.value);
}

export interface InterpretResult {
    events: TraceEvent[];
    diagnostics: Diagnostic[];
}

export interface TrackedValue {
    value: Value;
    source: DataSource;
}

export type TraceEvent =
    | { kind: "Init"; location: DataSource; value: TrackedValue }
    | { kind: "Assign"; from: DataSource; to: DataSource; value: TrackedValue }
    | { kind: "Compare"; left: DataSource; right: DataSource; operator: string; result: boolean }
    | { kind: "BranchEnter"; statement_id: number; condition_result: boolean }
    | { kind: "BranchExit"; statement_id: number }
    | { kind: "ScopeEnter"; scope_id: number }
    | { kind: "ScopeExit"; scope_id: number }
    | { kind: "FunctionCall"; call_id: number; function_name: string; args: TrackedValue[] }
    | { kind: "FunctionReturn"; call_id: number; return_value: TrackedValue };

export type DataSource =
    | { kind: "Variable"; value: string }
    | { kind: "ArraySlot"; value: { id: number; index: number } }
    | { kind: "Expression" }
    | { kind: "Literal" }
    | { kind: "Native" }
    | { kind: "Return" }
    | { kind: "None" };

export type Type =
    | { kind: "Integer" }
    | { kind: "Float" }
    | { kind: "Boolean" }
    | { kind: "String" }
    | { kind: "Array"; element_type: Type }
    | { kind: "Function" }
    | { kind: "Nil" }
    | { kind: "Any" };

export type Value =
    | { kind: "Integer"; value: number }
    | { kind: "Float"; value: number }
    | { kind: "String"; value: string }
    | { kind: "Boolean"; value: boolean }
    | { kind: "Function"; func_type: FunctionType }
    | { kind: "Nil" }
    | { kind: "Array"; value: { id: number; elements: TrackedValue[]; element_type: Type } };

export type FunctionType =
    | { kind: "Native"; value: { name: string } }
    | { kind: "User";   value: { name: string } };

export type Severity = "Info" | "Warning" | "Error";

export interface Diagnostic {
    message: string;
    severity: Severity;
    span: { start: number; end: number; line: number; column: number };
}
