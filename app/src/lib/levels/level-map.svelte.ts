// Map of level IDs to their corresponding level classes
import type { Visualiser } from "$lib/visualiser.svelte";
import { ArraySortingLevel } from "./array-sorting/array-sorting.svelte";
import { ConditionalsLevel } from "./conditionals/conditionals.svelte";
import type { Level } from "./level.svelte";
import { RecursionLevel } from "./recursion/recursion.svelte";
import { VariableDeclarationLevel } from "./variable-declaration/variable-declaration.svelte";

export type LevelConstructor = new (vis: Visualiser) => Level;

export const levelMap: Record<string, LevelConstructor> = {
    "variable-declaration": VariableDeclarationLevel,
    "array-sorting": ArraySortingLevel,
    "conditionals": ConditionalsLevel,
    "recursion": RecursionLevel,
};

/**
 * Returns the class blueprint for a specific ID.
 * @param id 
 * @returns 
 */
export function getLevelContstructor(id: string) : LevelConstructor{
    const ctor = levelMap[id];
    if (!ctor) {
        throw new Error(`Level with ID ${id} not found in level map`);
    }
    return ctor;
}