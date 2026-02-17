// Data structure for level configuration
export interface LevelConfig {
    id: string;             // unique id
    title: string;          // title of the level
    objective: string;      // description of the objective
    initialCode: string;    // code the user sees when the level loads
    modules: string[];      // list of module names to be loaded for this level
}

export abstract class Level {
    abstract config: LevelConfig;

    // TODO: give the current context to allow level to attach listeners to event bus, or directly manipulate modules
    abstract init() : void;
}