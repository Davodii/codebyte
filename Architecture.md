# CodeByte Architecture

## Overview

CodeByte is an educational desktop application for learning programming fundamentals through animated code execution traces. Users write code in a built-in editor, execute it against the Mimble interpreter (via Tauri IPC), then watch the resulting trace replay as a step-by-step animation across one or more visualiser modules.

The application is built on SvelteKit 5 + Tauri v2 (Rust). The frontend is fully TypeScript. Rust handles code interpretation; the frontend handles all UI, visualisation, and lesson logic.

---

## Component Architecture

### High-Level Structure

```
+page.svelte (editor route)
├── LevelSession          — execution state, playback engine
├── Visualiser            — module lifecycle + event broadcast
│   ├── ModuleRegistry    — keyed module lookup
│   ├── ModuleEventBus    — typed inter-module events
│   └── VisualiserModule[] — pluggable rendering components
│       ├── VariablesModule
│       ├── ArrayBarsModule
│       ├── BranchTreeModule
│       └── CallTreeModule
└── Level                 — lesson definition + milestone logic
    ├── VariableDeclarationLevel
    ├── ArraySortingLevel
    ├── ConditionalsLevel
    └── RecursionLevel
```

The editor page owns the `LevelSession` and `Visualiser` instances. It is responsible for wiring them together on level load and for persisting lesson progress to `localStorage`.

### Key Roles

| Class | File | Responsibility |
|---|---|---|
| `LevelSession` | `level-session.svelte.ts` | Execution state, playback loop, Tauri IPC |
| `Visualiser` | `visualiser.svelte.ts` | Module lifecycle, event broadcasting, DOM mounting |
| `ModuleRegistry` | `module-registry.svelte.ts` | Keyed access to loaded modules |
| `ModuleEventBus` | `event-bus.svelte.ts` | Typed domain events between modules/levels |
| `Level` | `level.svelte.ts` | Abstract base for lesson definitions |
| `VisualiserModule` | `visualiser-module.svelte.ts` | Abstract base for rendering modules |

---

## How the Application Receives and Processes Execution Events

### 1. Tauri IPC — `interpret_code`

When the user clicks Run, `LevelSession.start()` calls:

```typescript
invoke('interpret_code', { input: code })
```

The Rust command handler in `app/src-tauri/src/lib.rs`:
1. Creates a `mimble::Interpreter`
2. Attaches a `TraceCollector` (implements the `Tracer` trait)
3. Calls `interpreter.run(code)` — the interpreter emits `TraceEvent`s into the collector during evaluation
4. Collects `interpreter.diagnostics()` (errors and warnings)
5. Translates internal Rust types into JSON-serialisable DTOs (see Translation Layer section)
6. Returns `InterpretResult { events: TraceEventDto[], diagnostics: DiagnosticDto[] }`

### 2. Frontend Receipt

`LevelSession.start()` receives the `InterpretResult` and:
- Stores `events[]` and `diagnostics[]` on its state
- Calls `visualiser.preprocess(events)` — gives each module a chance to analyse the full event stream before playback begins (used by `BranchTreeModule` to pre-build the decision tree)
- Begins `play()`

### 3. The Playback Loop

`LevelSession.play()` is the core event loop:

```
for each event in events:
    visualiser.handleEvent(event, history)   → broadcast to all modules
    level.handleEvent(event, history)        → check milestone conditions
    await sleep(playbackSpeed ms)
```

History is the slice of events already replayed — modules and levels can inspect prior events to build context.

### 4. Event Broadcasting

`Visualiser.handleEvent()` calls `registry.broadcast(event, history)`, which iterates all registered `VisualiserModule` instances and calls their `handleEvent()`. All modules receive every event; each module filters for the types it cares about.

### 5. Trace Event Types

Defined in `app/src/lib/data/events/events.svelte.ts`:

| Event | Meaning |
|---|---|
| `Init` | Variable declared with initial value |
| `Assign` | Variable or array slot assigned |
| `Compare` | Comparison expression evaluated |
| `BranchEnter` / `BranchExit` | Entry/exit of a conditional block |
| `ScopeEnter` / `ScopeExit` | Function/block scope boundary |
| `FunctionCall` / `FunctionReturn` | Function invocation and return |

Each event carries a `TrackedValue` (value + origin `DataSource`) and metadata about where the value came from (a named variable, an array slot by ID + index, a literal, an expression, etc.).

---

## The Translation Layer (Rust → Frontend)

### Why a Translation Layer Exists

Mimble's internal Rust types are not designed for serialisation:

- `Symbol` is an opaque `usize` index into the interpreter's `SymbolPool` — meaningless without the pool
- `FunctionType::Native` holds a raw `fn` pointer — not serialisable
- `FunctionType::User` holds a full `Box<Stmt>` AST body — not serialisable and not needed by the frontend
- `Value::Array` uses internal IDs that need to be preserved for tracking element mutations

The translation layer in `app/src-tauri/src/lib.rs` bridges these gaps.

### What the Translation Layer Does

1. **Resolves `Symbol` → `String`** — all names (variable names, function names) are resolved via the `SymbolPool` before serialisation, so the frontend only ever sees plain strings
2. **Strips function internals** — `Function` values are serialised with only a name (and optionally param/return types); the AST body and fn pointer are discarded
3. **Maps to DTO shapes** — internal enum variants are mapped to flat, named JSON structs that match what the frontend's `events.svelte.ts` types expect
4. **Passes diagnostics** — `interpreter.diagnostics()` is serialised separately and returned alongside events

### DTO Shape

The Tauri command returns:

```typescript
{
  events: TraceEvent[],       // serialised trace from code execution
  diagnostics: Diagnostic[]   // errors/warnings from the interpreter
}
```

`Diagnostic` carries `message`, `severity` (Info/Warning/Error), and a `span` with `start`/`end` byte offsets plus `line`/`column` — suitable for CodeMirror annotations.

---

## How Visualisations Are Rendered

### Module System

Each visualisation concern is a self-contained `VisualiserModule` subclass. Modules:
- Are referenced by string name in `Level.modules[]`
- Are instantiated by `Visualiser.initLevel()` using the `moduleMap` dictionary in `visualiser.svelte.ts`
- Receive a `VisualiserContext` on `init()` containing a root DOM element, the `ModuleRegistry`, and the `ModuleEventBus`
- Mount their own Svelte components into their container `div`
- React to trace events via `handleEvent(event, history)`

The module lifecycle per level load is:

```
Visualiser.initLevel(level)
  → for each module name in level.modules:
      instantiate module class
      mount ModuleContainer div into DOM
      call module.init(ctx)
      register in ModuleRegistry
```

On level switch, `Visualiser.cleanup()` calls `destroy()` on all modules and removes their DOM nodes.

### Available Modules

**`VariablesModule`** (`visualiser/variables/`)
- Maintains a map of variable name → current value
- On `Init`: creates a variable box component
- On `Assign` targeting a variable: updates the displayed value
- On `ScopeExit`: removes out-of-scope variables
- Emits `VARIABLE_DECLARED` and `VARIABLE_CHANGED` bus events so levels can react

**`ArrayBarsModule`** (`visualiser/array-bars/`)
- Renders arrays as bar charts
- On `Init` of an array value: initialises bars from element values
- On `Assign` to an `ArraySlot`: updates the bar at that index
- On `Compare`: highlights the two compared bars

**`BranchTreeModule`** (`visualiser/branch-tree/`)
- Visualises if/else decision trees
- Implements `preprocess(events)` to scan the full event stream before playback and construct the complete tree of `BranchNode`s (including parent-child and true/false branch wiring)
- During playback, `BranchEnter`/`BranchExit` animate the active path through the pre-built tree

**`CallTreeModule`** (`visualiser/call-tree/`)
- Visualises function call stacks and recursion
- Maintains an active call stack
- On `FunctionCall`: creates a `CallNode`, pushes it onto the stack, wires it as a child of the current top-of-stack node
- On `FunctionReturn`: pops the stack, records the return value on the node

### Rendering Approach

Each module mounts a Svelte 5 component into its container div. Module state is Svelte reactive state (using the `$state` rune or `SvelteMap`), so the component re-renders automatically when state changes during playback. Modules have full access to the DOM element for anchoring popups.

---

## How Different Lessons Produce Different Visualisations

A `Level` declares which modules it needs in its `modules[]` array:

```typescript
// Conditionals level
modules = ["variables", "branch-tree"]

// Recursion level
modules = ["variables", "call-tree"]

// Array sorting level
modules = ["variables", "array-bars"]
```

`Visualiser.initLevel()` reads this array and instantiates only those modules. The visualiser panel therefore shows a different combination of components for each lesson, all driven by the same event stream from the interpreter.

This means a single lesson can compose multiple visualisation concerns — e.g. the array sorting level shows both variable values and a bar chart simultaneously.

---

## The Milestone System

### Structure

Each `Level` subclass owns its milestones — an array of `Milestone` objects defined in `level.svelte.ts`:

```typescript
interface Milestone {
  id: string
  label: string          // shown in the ObjectivePanel
  completed: boolean
}
```

A level's `isComplete` getter returns true when all milestones are marked done.

### Tracking and Progression

Levels track progression through two mechanisms:

1. **Trace event observation** — `level.handleEvent(event, history)` is called by the playback loop for every event. Levels inspect event types and payloads to detect conditions (e.g. a `FunctionReturn` with a specific return value, or an `Init` event for a particular variable name).

2. **Module event bus** — Levels subscribe to `ModuleEventBus` events (e.g. `VARIABLE_DECLARED`, `VARIABLE_CHANGED`) during `init()`. This lets a level react to higher-level semantic events rather than raw trace events when appropriate.

When a condition is met, the level sets `milestone.completed = true`. Because milestones are Svelte reactive state, the `ObjectivePanel` updates immediately.

### Feedback

The `ObjectivePanel` reflects milestone state visually:
- Pending milestones shown with a hollow circle
- The first incomplete milestone is highlighted as "active"
- Completed milestones shown with a checkmark and strikethrough

Levels can also call `popupManager.showPopup({ title, content, anchor })` to display instructional popups anchored to specific DOM elements (e.g. anchored to a variable box to explain what just happened). The popup manager is a Svelte store (`popup-store.svelte.ts`) that the editor page renders as a floating layer.

### Persistence

`+page.svelte` persists milestone state to `localStorage` keyed by level ID, so completion survives page reloads. When loading a level, saved milestone states are restored onto the newly instantiated `Level` object.

---

## Lesson Structure

Each lesson is a directory under `app/src/lib/data/levels/<name>/` containing a class that extends `Level`. A level defines:

| Property | Type | Purpose |
|---|---|---|
| `id` | `string` | Unique identifier, matches key in `level-map.svelte.ts` |
| `title` | `string` | Display name |
| `initialCode` | `string` | Starter code pre-loaded into the editor |
| `description` | Svelte component | Rich-text instructions rendered in the ObjectivePanel |
| `visualisationName` | `string` | Title shown above the visualiser panel |
| `modules` | `string[]` | Which visualiser modules to load (by registry key) |
| `milestones` | `Milestone[]` | Ordered list of learning objectives |

In addition, the level implements:
- `init()` — sets up milestones and subscribes to bus events
- `handleEvent(event, history)` — inspects trace events to advance milestones

Levels are registered in `level-map.svelte.ts` as a plain record of `id → constructor`. `getLevelConstructor(id)` acts as a factory.

The `LevelTree.svelte` sidebar component reads a separate JSON file that defines the hierarchical menu structure (sections and level IDs), and uses `level-map` to check whether each level exists.

---

## Notable Design Patterns and Architectural Decisions

### Svelte 5 Class-Based Reactive State

Rather than using Svelte writable stores, the codebase uses Svelte 5's `$state` rune inside plain TypeScript classes. `LevelSession`, `Visualiser`, and individual modules all expose reactive properties as class fields. This gives clean object-oriented encapsulation while retaining Svelte's fine-grained reactivity.

### Two-Layer Event System

There are two distinct event channels:
1. **Trace events** — raw interpreter output, broadcast from `LevelSession` through `Visualiser` to every module and to the active level simultaneously
2. **Module events** (`ModuleEventBus`) — semantic domain events emitted by modules (e.g. `VARIABLE_DECLARED`) and consumed by levels and other modules

This separation keeps the interpreter protocol decoupled from the higher-level domain model. The bus is cleared on level switch to prevent stale subscriptions.

### Preprocess Hook

`VisualiserModule` exposes an optional `preprocess(events)` method called before playback begins with the full event array. `BranchTreeModule` uses this to build the complete decision-tree structure in one pass before animating it. This pattern avoids the need for look-ahead during the step-by-step playback loop.

### Modules Are Self-Contained

Each `VisualiserModule` manages its own DOM subtree, Svelte component lifecycle, and internal state. The `Visualiser` class only orchestrates lifecycle and event delivery — it has no knowledge of what any module renders. Adding a new visualisation requires only: implementing `VisualiserModule`, registering it in `moduleMap`, and naming it in a level's `modules[]` array.

### Levels Own Win Conditions

Win conditions are not implemented in a centralised system. Each `Level` subclass is fully responsible for interpreting events and deciding when its milestones are complete. This keeps lesson-specific logic co-located with the lesson definition rather than scattered across the engine.

### DTO Pattern at the IPC Boundary

The Rust backend explicitly does not expose Mimble's internal types across the Tauri IPC boundary. A dedicated translation layer converts opaque symbols to strings, strips non-serialisable function internals, and shapes DTOs to match what the frontend visualisers actually need. The frontend TypeScript types in `events.svelte.ts` are defined independently and are not structural copies of the Rust types.

### Context Object for Dependency Injection

Each module receives a `VisualiserContext` on `init()` rather than importing globals. This context carries the root DOM element, `ModuleRegistry` (for cross-module access), and `ModuleEventBus`. This makes module dependencies explicit and simplifies testing and reuse.

---

