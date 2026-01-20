// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn interpret_code(input: String) -> Result<Vec<mimble::tracer::TraceEvent>, String> {
    // Create the interpreter
    let mut interpreter = mimble::Interpreter::new();

        // Create the tracer
    let tracer = mimble::tracer::TraceCollector::new();
    interpreter.set_tracer(Box::new(tracer));

    // Interpret the code with tracing enabled
    let value = interpreter.run(&input);

    match value {
        Ok(value) => {
            // Print the returned value
            println!("Returned value: {:?}", value);

            if let Some(tracer) = interpreter.take_tracer() {
                // Return the collected trace events
                let trace_collector = tracer
                    .as_any()
                    .downcast_ref::<mimble::tracer::TraceCollector>()
                    .ok_or("Failed to downcast tracer")?;
                Ok(trace_collector.get_events().clone())
            }
            else {
                Err("No tracer found".to_string())
            }
        },
        Err(_) => Err(format!("Error during interpretation")),
    }
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![interpret_code])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}