import type { ModuleContext } from "./module-registry";

export interface VisualiserModule {
    init(ctx: ModuleContext): void;
    destroy(): void;
}