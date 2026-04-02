
use mimble::evaluator::value::{DataSource, FunctionType, TrackedValue, Value};
use mimble::tracer::TraceEvent;

// =====================
// DTOs
// =====================

#[derive(serde::Serialize)]
pub struct InterpretResult {
    events: Vec<TraceEventDto>,
    diagnostics: Vec<DiagnosticDto>,
}

#[derive(serde::Serialize)]
#[serde(tag = "kind")]
enum TraceEventDto {
    Init {
        location: DataSourceDto,
        value: TrackedValueDto,
    },
    Assign {
        from: DataSourceDto,
        to: DataSourceDto,
        value: TrackedValueDto,
    },
    Compare {
        left: DataSourceDto,
        right: DataSourceDto,
        operator: String,
        result: bool,
    },
    BranchEnter {
        statement_id: usize,
        condition_result: bool,
    },
    BranchExit {
        statement_id: usize,
    },
    ScopeEnter {
        scope_id: usize,
    },
    ScopeExit {
        scope_id: usize,
    },
}

#[derive(serde::Serialize)]
#[serde(tag = "kind")]
enum DataSourceDto {
    Variable { value: String },
    ArraySlot { value: ArraySlotDto },
    Expression,
    Literal,
    Native,
    Return,
    None,
}

#[derive(serde::Serialize)]
struct ArraySlotDto {
    id: usize,
    index: usize,
}

#[derive(serde::Serialize)]
struct TrackedValueDto {
    value: ValueDto,
    source: DataSourceDto,
}

#[derive(serde::Serialize)]
#[serde(tag = "kind")]
enum ValueDto {
    Integer { value: i64 },
    Float { value: f64 },
    String { value: std::string::String },
    Boolean { value: bool },
    Array { value: ArrayValueDto },
    Function { func_type: FunctionTypeDto },
    Nil,
}

#[derive(serde::Serialize)]
struct ArrayValueDto {
    id: usize,
    elements: Vec<TrackedValueDto>,
    element_type: TypeDto,
}

#[derive(serde::Serialize)]
#[serde(tag = "kind")]
enum FunctionTypeDto {
    Native { value: FunctionInfoDto },
    User { value: FunctionInfoDto },
}

#[derive(serde::Serialize)]
struct FunctionInfoDto {
    name: std::string::String,
}

/// Mirrors mimble::Type but with serde attributes shaped for the frontend.
#[derive(serde::Serialize)]
#[serde(tag = "kind")]
enum TypeDto {
    Integer,
    Float,
    Boolean,
    String,
    Array { element_type: Box<TypeDto> },
    Function,
    Nil,
    Any,
}

#[derive(serde::Serialize)]
struct DiagnosticDto {
    message: std::string::String,
    severity: SeverityDto,
    span: SpanDto,
}

#[derive(serde::Serialize)]
enum SeverityDto {
    Info,
    Warning,
    Error,
}

#[derive(serde::Serialize)]
struct SpanDto {
    start: usize,
    end: usize,
    line: usize,
    column: usize,
}

// =====================
// Translation functions
// =====================

fn translate_event(event: &TraceEvent, interpreter: &mimble::Interpreter) -> TraceEventDto {
    match event {
        TraceEvent::Init { location, value } => TraceEventDto::Init {
            location: translate_data_source(location, interpreter),
            value: translate_tracked_value(value, interpreter),
        },
        TraceEvent::Assign { from, to, value } => TraceEventDto::Assign {
            from: translate_data_source(from, interpreter),
            to: translate_data_source(to, interpreter),
            value: translate_tracked_value(value, interpreter),
        },
        TraceEvent::Compare { left, right, operator, result } => TraceEventDto::Compare {
            left: translate_data_source(left, interpreter),
            right: translate_data_source(right, interpreter),
            operator: operator.clone(),
            result: *result,
        },
        TraceEvent::BranchEnter { statement_id, condition_result } => TraceEventDto::BranchEnter {
            statement_id: *statement_id,
            condition_result: *condition_result,
        },
        TraceEvent::BranchExit { statement_id } => TraceEventDto::BranchExit {
            statement_id: *statement_id,
        },
        TraceEvent::ScopeEnter { scope_id } => TraceEventDto::ScopeEnter {
            scope_id: *scope_id,
        },
        TraceEvent::ScopeExit { scope_id } => TraceEventDto::ScopeExit {
            scope_id: *scope_id,
        },
    }
}

fn translate_data_source(ds: &DataSource, interpreter: &mimble::Interpreter) -> DataSourceDto {
    match ds {
        DataSource::Variable(sym) => DataSourceDto::Variable {
            value: interpreter.resolve_symbol(*sym),
        },
        DataSource::ArraySlot { id, index } => DataSourceDto::ArraySlot {
            value: ArraySlotDto { id: *id, index: *index },
        },
        DataSource::Expression => DataSourceDto::Expression,
        DataSource::Literal => DataSourceDto::Literal,
        DataSource::Native => DataSourceDto::Native,
        DataSource::Return => DataSourceDto::Return,
        DataSource::None => DataSourceDto::None,
    }
}

fn translate_tracked_value(tv: &TrackedValue, interpreter: &mimble::Interpreter) -> TrackedValueDto {
    TrackedValueDto {
        value: translate_value(&tv.value, interpreter),
        source: translate_data_source(&tv.source, interpreter),
    }
}

fn translate_value(val: &Value, interpreter: &mimble::Interpreter) -> ValueDto {
    match val {
        Value::Integer(n) => ValueDto::Integer { value: *n },
        Value::Float(n) => ValueDto::Float { value: *n },
        Value::String(s) => ValueDto::String { value: s.clone() },
        Value::Boolean(b) => ValueDto::Boolean { value: *b },
        Value::Nil => ValueDto::Nil,
        Value::Array { id, elements, element_type } => ValueDto::Array {
            value: ArrayValueDto {
                id: *id,
                elements: elements.iter().map(|e| translate_tracked_value(e, interpreter)).collect(),
                element_type: translate_type(element_type),
            },
        },
        Value::Function(ft) => ValueDto::Function {
            func_type: translate_function_type(ft, interpreter),
        },
    }
}

fn translate_function_type(ft: &FunctionType, interpreter: &mimble::Interpreter) -> FunctionTypeDto {
    match ft {
        FunctionType::Native { name, .. } => FunctionTypeDto::Native {
            value: FunctionInfoDto { name: interpreter.resolve_symbol(*name) },
        },
        FunctionType::User { name, .. } => FunctionTypeDto::User {
            value: FunctionInfoDto { name: interpreter.resolve_symbol(*name) },
        },
    }
}

fn translate_type(t: &mimble::Type) -> TypeDto {
    match t {
        mimble::Type::Integer => TypeDto::Integer,
        mimble::Type::Float => TypeDto::Float,
        mimble::Type::Boolean => TypeDto::Boolean,
        mimble::Type::String => TypeDto::String,
        mimble::Type::Array(inner) => TypeDto::Array {
            element_type: Box::new(translate_type(inner)),
        },
        mimble::Type::Function { .. } => TypeDto::Function,
        mimble::Type::Nil => TypeDto::Nil,
        mimble::Type::Any => TypeDto::Any,
    }
}

// =====================
// Tauri command
// =====================

#[tauri::command]
fn interpret_code(input: String) -> Result<InterpretResult, String> {
    let mut interpreter = mimble::Interpreter::new();
    interpreter.set_tracer(Box::new(mimble::tracer::TraceCollector::new()));

    // Run — ignore the return value; diagnostics are the source of truth for errors
    let _ = interpreter.run(&input);

    // Collect diagnostics
    let diagnostics: Vec<DiagnosticDto> = interpreter
        .diagnotics()
        .borrow()
        .diagnostics()
        .iter()
        .map(|diag| DiagnosticDto {
            message: diag.message.clone(),
            severity: match diag.severity {
                mimble::Severity::Info => SeverityDto::Info,
                mimble::Severity::Warning => SeverityDto::Warning,
                mimble::Severity::Error => SeverityDto::Error,
            },
            span: SpanDto {
                start: diag.span.start,
                end: diag.span.end,
                line: diag.span.line,
                column: diag.span.column,
            },
        })
        .collect();

    // Collect trace events (empty if execution was halted by errors)
    let events = match interpreter.take_tracer() {
        Some(tracer_box) => match tracer_box
            .as_any()
            .downcast_ref::<mimble::tracer::TraceCollector>()
        {
            Some(collector) => collector
                .get_events()
                .iter()
                .map(|e| translate_event(e, &interpreter))
                .collect(),
            None => vec![],
        },
        None => vec![],
    };

    Ok(InterpretResult { events, diagnostics })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![interpret_code])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
