# CodeByte — Project Guide

## Overview

CodeByte is an educational desktop app for learning programming fundamentals through step-by-step code visualization. Users write code in a built-in editor, execute it via the Mimble interpreter, then watch the execution replay as an animated trace — with panels for objectives, the code editor, and a visualization canvas.

**Stack:** Tauri v2 (Rust + SvelteKit 5), TypeScript, CodeMirror 6, Tailwind CSS 4, Bun.

---

## Repository Structure

```
codebyte/
├── app/                        # SvelteKit + Tauri frontend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +layout.svelte          # Root layout (navbar)
│   │   │   ├── +page.svelte            # Home page
│   │   │   ├── editor/
│   │   │   │   ├── +page.svelte        # Main 3-panel editor page
│   │   │   │   └── components/         # Editor-specific components
│   │   │   └── settings/+page.svelte
│   │   ├── lib/
│   │   │   ├── level-session.svelte.ts     # Playback engine & event loop
│   │   │   ├── visualiser.svelte.ts        # Module lifecycle & event broadcast
│   │   │   ├── module-registry.svelte.ts   # Module registration/lookup
│   │   │   ├── event-bus.svelte.ts         # Typed inter-module event bus
│   │   │   ├── popup-store.svelte.ts       # Global popup notifications
│   │   │   ├── settings.svelte.ts
│   │   │   ├── data/
│   │   │   │   ├── events/events.svelte.ts     # TraceEvent types (mirrors Rust types)
│   │   │   │   └── levels/                     # Level definitions
│   │   │   │       ├── level.svelte.ts          # Abstract Level base class
│   │   │   │       ├── level-map.svelte.ts      # Level registry (id → constructor)
│   │   │   │       └── <level-name>/            # One directory per level
│   │   │   └── visualisers/
│   │   │       ├── visualiser-module.svelte.ts  # Abstract VisualiserModule base class
│   │   │       ├── variables/                   # Variables module
│   │   │       └── array-swap/                  # Array swap module
│   │   └── components/
│   │       ├── Navbar.svelte
│   │       └── visualiser/ModuleContainer.svelte
│   └── src-tauri/
│       └── src/lib.rs          # Tauri command handler (interpret_code)
└── crates/mimble/              # Mimble interpreter (Rust crate)
    └── src/
        ├── lib.rs              # Interpreter public API
        ├── lexer/
        ├── parser/
        ├── analyser/
        ├── evaluator/
        ├── tracer/mod.rs       # TraceEvent, Tracer trait, TraceCollector
        ├── stdlib/
        └── common/
```

---

## Development

```bash
./start.sh          # Runs: bun run tauri dev
```

The frontend dev server runs on `http://localhost:1420`. The Tauri process wraps it in a native window.

**Frontend checks:**
```bash
cd app && bun run check       # svelte-check + TypeScript
```

---

## Architecture: How Things Connect

### Execution flow

```
User edits code in CodeMirror
         |
         v
LevelSession.start()
         |
         v
invoke('interpret_code', { input: code })     ← Tauri IPC
         |
         v  [Rust: app/src-tauri/src/lib.rs]
Interpreter::new() → set_tracer(TraceCollector) → run(code)
         |
         v
Returns Vec<TraceEvent> serialized as JSON    ← currently returns ()  [WIP]
         |
         v
LevelSession.play() — loops through events one-by-one
    ├─ visualiser.handleEvent(event, history)  → broadcasts to all loaded modules
    └─ level.handleEvent(event, history)        → updates milestones / win conditions
         |
         v (after playbackSpeed ms delay)
Next event
```

### Trace event types: internal Rust types vs. frontend DTOs

The Rust types in `crates/mimble` are **internal interpreter types** — they are not designed for serialization and should not be mirrored 1:1 in TypeScript. The translation layer in `app/src-tauri/src/lib.rs` is responsible for converting them into clean, frontend-friendly DTOs before sending over Tauri IPC.

#### Internal Rust types (for reference when building the translation layer)

**`crates/mimble/src/tracer/mod.rs`**
```rust
pub enum TraceEvent {
    Init    { location: DataSource, value: TrackedValue },
    Assign  { from: DataSource, to: DataSource, value: TrackedValue },
    Compare { left: DataSource, right: DataSource, operator: String, result: bool },
}
```

**`crates/mimble/src/evaluator/value.rs`**
```rust
pub enum DataSource {
    Variable(Symbol),                    // Symbol = usize index into SymbolPool
    ArraySlot { id: usize, index: usize },
    Expression,
    Literal,
    Native,
    Return,
    None,
}

pub struct TrackedValue {
    pub value: Value,
    pub source: DataSource,
}

pub enum Value {
    Integer(i64),
    Float(f64),
    String(String),
    Boolean(bool),
    Array { id: usize, elements: Vec<TrackedValue>, element_type: Type },
    Function(FunctionType),
    Nil,
}

pub enum FunctionType {
    // Contains NativeFn (raw fn pointer) — not serializable
    Native { name: Symbol, args: Vec<Type>, return_type: Type, func: NativeFn },
    // Contains body: Box<Stmt> (full AST) — not serializable, and not needed by frontend
    User   { name: Symbol, return_type: Type, params: Vec<(Symbol, Option<Type>)>, body: Box<Stmt> },
}
```

**`crates/mimble/src/common/`**
```rust
pub struct Symbol(pub usize);   // interned string — resolve via SymbolPool before serializing
pub enum Type { Integer, Float, Boolean, String, Array(Box<Type>), Function { .. }, Nil, Any }
```

#### What the translation layer (`lib.rs`) must do

1. **Resolve `Symbol` → `String`** — `Symbol` is an opaque index into the interpreter's `SymbolPool`. The frontend has no access to the pool, so all `Symbol` values must be resolved to strings before serialization.
2. **Strip `Function` internals** — `FunctionType::Native` holds a raw fn pointer; `FunctionType::User` holds the full AST body. Neither is serializable or useful to the frontend. Serialize only the function name (and optionally param/return types).
3. **Design the DTO shape for the frontend's needs**, not as a structural copy of the Rust types. The frontend types in `events.svelte.ts` should reflect what the visualiser modules actually consume.

#### Diagnostics

Alongside trace events, the interpreter collects diagnostics (errors and warnings). These come from `interpreter.diagnostics()` and should be returned to the frontend in the same response as the trace events.

**`crates/mimble/src/common/diagnostics.rs`**
```rust
pub enum Severity { Info, Warning, Error }

pub struct Diagnostic {
    pub message: String,
    pub span: Span,       // { start, end, line, column } — byte offsets + human-readable position
    pub severity: Severity,
}
```

`Span` (`crates/mimble/src/common/span.rs`) carries `start`/`end` byte offsets and `line`/`column` for display. These map well to CodeMirror's editor positions and can be used to underline errors in the editor.

The `interpret_code` Tauri command should return both events and diagnostics together, e.g.:
```typescript
// Suggested shape for the Tauri command return value
{ events: TraceEvent[], diagnostics: Diagnostic[] }
```

### Visualiser modules

Each `VisualiserModule` subclass handles one aspect of visualization (variables, arrays, etc.). Modules:
- Are listed by string name in `Level.modules[]`
- Are instantiated by `Visualiser.initLevel()` using `moduleMap` in `visualiser.svelte.ts`
- Receive every `TraceEvent` via `handleEvent(event, history)`
- Communicate with each other via `ModuleEventBus` (typed events defined in `event-bus.svelte.ts`)
- Must implement: `init()`, `handleEvent()`, `reset()`, `destroy()`

To add a new module: create a class extending `VisualiserModule`, register it in `moduleMap` in `visualiser.svelte.ts`, and add its string name to the relevant level's `modules` array.

### Level system

Each `Level` subclass defines a learning objective. It specifies:
- `initialCode` — starter code pre-loaded into the editor
- `modules[]` — which visualiser modules to load
- `milestones[]` — objectives shown in the left panel
- `handleEvent()` — reacts to trace events to mark milestones complete

To add a new level: create a directory under `lib/data/levels/`, extend `Level`, and register it in `level-map.svelte.ts`.

---

## Active TODOs / Known Gaps

- **`interpret_code` Tauri command** (`app/src-tauri/src/lib.rs`) currently returns `Ok(())`. It needs a translation layer that converts the internal Rust types into frontend DTOs (resolving `Symbol`s, stripping AST bodies, etc.) and returns both trace events and diagnostics. `LevelSession.start()` already calls this command and assigns the result to `state.events`.
- **Mimble interpreter internals** — implementation details are intentional black-box from the app's perspective. The app only depends on `mimble::Interpreter`, `mimble::tracer::TraceCollector`, and the `TraceEvent` enum shape.
- **`ModuleEventBus`** has no unsubscribe mechanism (noted in code).
- **Level code not refreshing** when switching levels (noted in `LevelSession.init()`).
- **Diagnostic messages** from the interpreter are collected but not yet surfaced in the UI.

---

## Mimble Interpreter (crates/mimble)

Treat this as a dependency. The app integrates with it via:
1. `mimble::Interpreter::new()` + `.set_tracer(Box<dyn Tracer>)` + `.run(&str)`
2. `mimble::tracer::TraceCollector` — collects `Vec<TraceEvent>` during execution
3. `interpreter.diagnostics()` — returns diagnostic messages (errors/warnings)

The interpreter pipeline is: Lexer → Parser → Analyser → Evaluator (emits trace events).

Do not modify `crates/mimble` for app-level features — add serialization/translation in `app/src-tauri/src/lib.rs` instead.

## Working style
- When asked to implement something, first explain the approach and flag 
  any architectural concerns before writing code.
- Prefer asking one clarifying question over making an assumption.
- When fixing a bug, identify the root cause before proposing a fix.