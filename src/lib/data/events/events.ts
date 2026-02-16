export type Symbol = number;

export type Type = 
    | "Integer"
    | "Float"
    | "Boolean"
    | "String"
    | { Array: Type } // Recursive Array(Box<Type>)
    | "Nil";

export type DataSource = 
    | { Variable: string }
    | { ArraySlot: { id: number, index: number } }
    | "Expression"
    | "Literal"
    | "None";


export interface TrackedValue {
    value: Value;
    source: DataSource;
}

export type FunctionType = { Native: string };

export type Value =
    | { Integer: number }
    | { Float: number }
    | { String: string }
    | { Boolean: boolean }
    | "Nil"
    | { Array: { id: number; elements: TrackedValue[]; element_type: Type } }
    | { Function: FunctionType };

export type TraceEvent = 
    | { Init: {location: DataSource, value: TrackedValue } }
    | { Assign: {from: DataSource, to: DataSource, value: TrackedValue } }
    | { Compare: {left: TrackedValue, right: TrackedValue, result: boolean } };