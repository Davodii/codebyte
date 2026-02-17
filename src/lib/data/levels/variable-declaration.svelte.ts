import { Level, type LevelConfig } from "./level.svelte";

export class VariableDeclarationLevel extends Level {
    config: LevelConfig = {
        id: "variable-declaration",
        title: "Variable Declaration",
        objective: "Learn how to declare variables.",
        initialCode: `# This code is creating a new variable named 'x' and assigning it the value 5\nlet x = 5\n`,
        modules: ['variables']
    };

    init() {
        // No additional initialization needed for this level
    }
}