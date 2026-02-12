import type { EventBus } from "./events";
import type { VisualiserModule } from "./module";

export type ModuleConstructor<T extends VisualiserModule = VisualiserModule> = new () => T;

export type ModuleMap = {
    // variables: VariablesModule,
    // arrows: ArrowsModule,
    // scopes: ScopesModule,
};

export class ModuleRegistry<M extends Record<string, VisualiserModule>> {
    private registry = new Map<keyof M, ModuleConstructor>();

    register<K extends keyof M>(name: K, ctor: ModuleConstructor<M[K]>) {
        this.registry.set(name, ctor);
    }

    get<K extends keyof M>(name: K): ModuleConstructor<M[K]> {
        const ctor = this.registry.get(name);

        if (!ctor) {
            throw new Error(`Module ${String(name)} not registered.`);
        }

        return ctor as ModuleConstructor<M[K]>;
    }
}

export interface ModuleContext<M extends Record<string, VisualiserModule>, E> {
    canvas: HTMLElement;
    eventBus: EventBus;

    getModule<K extends keyof M>(name: K): M[K] | undefined;
    hasModule<K extends keyof M>(name: K): boolean;
}