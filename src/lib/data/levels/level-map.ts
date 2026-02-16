// Map of level IDs to their corresponding level classes
import type { Level } from "./level";
import { VariableDeclarationLevel } from "./variable-declaration.svelte";

type LevelConstructor = new () => Level;

export const levelMap: Record<string, LevelConstructor> = {
    "variable-declaration": VariableDeclarationLevel
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