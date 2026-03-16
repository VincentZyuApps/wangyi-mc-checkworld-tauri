// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use tracing::{error, info, warn};
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use walkdir::WalkDir;

static LOG_CONTENT: Mutex<String> = Mutex::new(String::new());

fn init_logging() {
    let appdata = env::var("APPDATA").unwrap_or_else(|_| String::from("."));
    let log_dir = PathBuf::from(&appdata)
        .join("WangyiMCCheckworld")
        .join("logs");
    
    std::fs::create_dir_all(&log_dir).ok();
    
    let file_appender = RollingFileAppender::new(
        Rotation::NEVER,
        &log_dir,
        "latest.log",
    );
    
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
    
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));
    
    tracing_subscriber::registry()
        .with(env_filter)
        .with(fmt::layer().with_writer(non_blocking).with_ansi(false))
        .with(fmt::layer().with_writer(std::io::stderr))
        .init();
    
    info!("Application starting...");
    info!("Log directory: {}", log_dir.display());
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct WorldInfo {
    folder: String,
    name: String,
    last_saved: Option<String>,
    last_saved_timestamp: Option<i64>,
    size: u64,
    size_formatted: String,
    path: String,
}

fn get_worlds_dir() -> PathBuf {
    let appdata = env::var("APPDATA").unwrap_or_else(|_| {
        warn!("APPDATA not found, using fallback");
        String::from("C:\\Users\\VincentZyu\\AppData\\Roaming")
    });
    info!("APPDATA: {}", appdata);
    PathBuf::from(appdata)
        .join("MinecraftPC_Netease_PB")
        .join("minecraftWorlds")
}

fn format_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes < KB {
        format!("{:.2} B", bytes as f64)
    } else if bytes < MB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else if bytes < GB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    }
}

fn get_folder_size(path: &PathBuf) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum()
}

#[tauri::command]
fn get_worlds_path() -> String {
    let path = get_worlds_dir().to_string_lossy().to_string();
    info!("get_worlds_path: {}", path);
    path
}

#[tauri::command]
fn list_worlds() -> Result<Vec<WorldInfo>, String> {
    info!("list_worlds called");
    let worlds_dir = get_worlds_dir();
    info!("Worlds directory: {}", worlds_dir.display());

    if !worlds_dir.exists() {
        error!("Worlds directory not found: {}", worlds_dir.display());
        return Err(format!(
            "Worlds directory not found: {}",
            worlds_dir.display()
        ));
    }

    let mut worlds = Vec::new();

    let entries = fs::read_dir(&worlds_dir).map_err(|e| e.to_string())?;

    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        // Skip special folders (like our git repo folder)
        let folder_name = path.file_name().unwrap().to_string_lossy().to_string();
        if folder_name.starts_with("+++") {
            continue;
        }

        let levelname_path = path.join("levelname.txt");
        if !levelname_path.exists() {
            continue;
        }

        // Read world name
        let world_name = fs::read_to_string(&levelname_path)
            .unwrap_or_else(|_| "Unknown".to_string())
            .trim()
            .to_string();

        // Get last saved time from level.dat
        let leveldat_path = path.join("level.dat");
        let (last_saved, last_saved_timestamp) = if leveldat_path.exists() {
            if let Ok(metadata) = fs::metadata(&leveldat_path) {
                if let Ok(modified) = metadata.modified() {
                    let datetime: DateTime<Local> = modified.into();
                    (
                        Some(datetime.format("%Y-%m-%d %H:%M:%S").to_string()),
                        Some(datetime.timestamp()),
                    )
                } else {
                    (None, None)
                }
            } else {
                (None, None)
            }
        } else {
            (None, None)
        };

        // Calculate folder size
        let size = get_folder_size(&path);

        worlds.push(WorldInfo {
            folder: folder_name,
            name: world_name,
            last_saved,
            last_saved_timestamp,
            size,
            size_formatted: format_size(size),
            path: path.to_string_lossy().to_string(),
        });
    }

    // Sort by last_saved_timestamp descending
    worlds.sort_by(|a, b| {
        b.last_saved_timestamp
            .unwrap_or(0)
            .cmp(&a.last_saved_timestamp.unwrap_or(0))
    });

    info!("Found {} worlds", worlds.len());
    Ok(worlds)
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn backup_world(folder: String, backup_name: String) -> Result<String, String> {
    let worlds_dir = get_worlds_dir();
    let source_path = worlds_dir.join(&folder);
    let backup_path = worlds_dir.join(format!("{}.zip", backup_name));

    if !source_path.exists() {
        return Err("Source folder not found".to_string());
    }

    // Create zip file
    let file = fs::File::create(&backup_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    for entry in WalkDir::new(&source_path).into_iter().filter_map(|e| e.ok()) {
        let entry_path = entry.path();
        let relative_path = entry_path.strip_prefix(&source_path).unwrap();

        if entry_path.is_file() {
            zip.start_file(relative_path.to_string_lossy(), options)
                .map_err(|e| e.to_string())?;
            let mut f = fs::File::open(entry_path).map_err(|e| e.to_string())?;
            let mut buffer = Vec::new();
            f.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
            zip.write_all(&buffer).map_err(|e| e.to_string())?;
        } else if !relative_path.as_os_str().is_empty() {
            zip.add_directory(relative_path.to_string_lossy(), options)
                .map_err(|e| e.to_string())?;
        }
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
fn delete_world(folder: String) -> Result<(), String> {
    let worlds_dir = get_worlds_dir();
    let target_path = worlds_dir.join(&folder);

    if !target_path.exists() {
        return Err("Folder not found".to_string());
    }

    fs::remove_dir_all(&target_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn rename_world(folder: String, new_name: String) -> Result<(), String> {
    let worlds_dir = get_worlds_dir();
    let target_path = worlds_dir.join(&folder);
    let levelname_path = target_path.join("levelname.txt");

    if !levelname_path.exists() {
        return Err("levelname.txt not found".to_string());
    }

    let new_name_cloned = new_name.clone();
    fs::write(&levelname_path, new_name).map_err(|e| e.to_string())?;
    info!("Renamed world folder: {} to {}", folder, new_name_cloned);
    Ok(())
}

#[tauri::command]
fn get_log() -> Result<String, String> {
    let appdata = env::var("APPDATA").unwrap_or_else(|_| String::from("C:\\Users\\VincentZyu\\AppData\\Roaming"));
    let log_path = PathBuf::from(&appdata)
        .join("WangyiMCCheckworld")
        .join("logs")
        .join("latest.log");
    
    if log_path.exists() {
        fs::read_to_string(&log_path).map_err(|e| e.to_string())
    } else {
        Ok("Log file not found".to_string())
    }
}

fn main() {
    init_logging();
    
    std::panic::set_hook(Box::new(|panic_info| {
        error!("Application panic: {}", panic_info);
    }));
    
    info!("Building Tauri application...");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_worlds_path,
            list_worlds,
            open_folder,
            backup_world,
            delete_world,
            rename_world,
            get_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
