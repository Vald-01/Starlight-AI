use keyring::{Entry, Error as KeyringError};

const KEYCHAIN_SERVICE: &str = "com.valentindeigers.starlight";
// All keys share one entry, so the OS asks for access once rather than per provider.
const KEYCHAIN_ACCOUNT: &str = "api-keys";

fn api_keys_entry() -> Result<Entry, String> {
    Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT).map_err(|error| error.to_string())
}

// Keychain calls can wait on a system prompt, so these commands stay off the main thread.
#[tauri::command(async)]
fn read_api_keys() -> Result<Option<String>, String> {
    match api_keys_entry()?.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(KeyringError::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command(async)]
fn write_api_keys(value: String) -> Result<(), String> {
    api_keys_entry()?
        .set_password(&value)
        .map_err(|error| error.to_string())
}

#[tauri::command(async)]
fn delete_api_keys() -> Result<(), String> {
    match api_keys_entry()?.delete_credential() {
        Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_api_keys,
            write_api_keys,
            delete_api_keys
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
