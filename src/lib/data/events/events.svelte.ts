export type Symbol = number;

export interface TrackedValue {
    value: Value;
    source: DataSource;
}

export type TraceEvent = 
    | { kind: "Init", location: DataSource, value: TrackedValue }
    | { kind: "Assign", from: DataSource, to: DataSource, value: TrackedValue }
    | { kind: "Compare", left: TrackedValue, right: TrackedValue, result: boolean };

export type DataSource = 
    | { kind: "Variable", name: string }
    | { kind: "ArraySlot", id: number, index: number }
    | { kind: "Expression" }
    | { kind: "Literal" }
    | { kind: "None" };
    
export type Type = 
    | { kind: "Integer" }
    | { kind: "Float" }
    | { kind: "Boolean" }
    | { kind: "String" }
    | { kind: "Array", element_type: Type }
    | { kind: "Nil" };

export type Value = 
    | { kind: "Integer", value: number }
    | { kind: "Float", value: number }
    | { kind: "String", value: string }
    | { kind: "Boolean", value: boolean }
    | { kind: "Nil" }
    | { kind: "Array", id: number, elements: TrackedValue[], element_type: Type }
    | { kind: "Function", func_type: FunctionType };

export type FunctionType = 
    | { kind: "Native", name: string };


// export type Symbol = number;

// export type Type = 
//     | "Integer"
//     | "Float"
//     | "Boolean"
//     | "String"
//     | { Array: Type } // Recursive Array(Box<Type>)
//     | "Nil";

// export type DataSource = 
//     | { Variable: string }
//     | { ArraySlot: { id: number, index: number } }
//     | "Expression"
//     | "Literal"
//     | "None";


// export interface TrackedValue {
//     value: Value;
//     source: DataSource;
// }

// export type FunctionType = { Native: string };

// export type Value =
//     | { Integer: number }
//     | { Float: number }
//     | { String: string }
//     | { Boolean: boolean }
//     | "Nil"
//     | { Array: { id: number; elements: TrackedValue[]; element_type: Type } }
//     | { Function: FunctionType };

// export type TraceEvent = 
//     | { Init: {location: DataSource, value: TrackedValue } }
//     | { Assign: {from: DataSource, to: DataSource, value: TrackedValue } }
//     | { Compare: {left: TrackedValue, right: TrackedValue, result: boolean } };