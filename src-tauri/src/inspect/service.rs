use serde_json::Value;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;
use walkdir::WalkDir;

use crate::world::format_size;

use super::leveldat::{leveldat_section, parse_leveldat_value};
use super::nbt::value_object;
use super::player::{parse_local_player_value, player_sections};
use super::types::{
    InspectBasicInfo, InspectNeteaseInfo, WorldInspectResult,
};

fn summarize_world_record(record: Option<&serde_json::Map<String, Value>>) -> BTreeMap<String, Value> {
    let mut summary = BTreeMap::new();
    if let Some(record) = record {
        for key in [
            "name",
            "slogan",
            "level_id",
            "allow_pc",
            "is_multiple_game",
            "max_member_size",
            "addons",
            "resource_packs",
        ] {
            if let Some(value) = record.get(key) {
                summary.insert(key.to_string(), value.clone());
            }
        }
    }
    summary
}

fn json_array_from_file(path: &Path) -> Vec<Value> {
    fs::read_to_string(path)
        .ok()
        .and_then(|text| serde_json::from_str::<Vec<Value>>(&text).ok())
        .unwrap_or_default()
}

fn folder_size(path: &Path) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum()
}

#[tauri::command]
pub fn inspect_world(path: String) -> Result<WorldInspectResult, String> {
    let started = Instant::now();
    let world_path = PathBuf::from(&path);
    tracing::info!("inspect_world start: {}", world_path.display());
    let folder = world_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let world_name = fs::read_to_string(world_path.join("levelname.txt"))
        .unwrap_or_else(|_| "Unknown".to_string())
        .trim()
        .to_string();
    let basic_started = Instant::now();
    let folder_size = folder_size(&world_path);
    let mut warnings = Vec::new();

    let basic = InspectBasicInfo {
        folder,
        world_name: world_name.clone(),
        path: world_path.to_string_lossy().to_string(),
        folder_size,
        folder_size_formatted: format_size(folder_size),
        levelname_txt: fs::read_to_string(world_path.join("levelname.txt"))
            .ok()
            .map(|s| s.trim().to_string()),
        has_level_dat: world_path.join("level.dat").exists(),
        has_level_dat_old: world_path.join("level.dat_old").exists(),
    };
    tracing::info!(
        "inspect_world basic ready: folder={} elapsed_ms={}",
        basic.folder,
        basic_started.elapsed().as_millis()
    );

    let netease_started = Instant::now();
    let config_value = fs::read_to_string(world_path.join("config"))
        .ok()
        .and_then(|text| serde_json::from_str::<Value>(&text).ok())
        .unwrap_or(Value::Null);
    let config_object = value_object(&config_value);
    let world_record = config_object
        .and_then(|cfg| cfg.get("world_record"))
        .and_then(value_object);

    let behavior_packs = json_array_from_file(&world_path.join("netease_world_behavior_packs.json"));
    let resource_packs = json_array_from_file(&world_path.join("netease_world_resource_packs.json"));
    let netease = InspectNeteaseInfo {
        archive_id: config_object.and_then(|cfg| cfg.get("archive_id").cloned()),
        uid: config_object
            .and_then(|cfg| cfg.get("uid"))
            .map(|v| match v {
                Value::String(s) => s.clone(),
                other => other.to_string(),
            }),
        world_record_summary: summarize_world_record(world_record),
        behavior_pack_count: behavior_packs.len(),
        resource_pack_count: resource_packs.len(),
        behavior_packs,
        resource_packs,
    };
    tracing::info!(
        "inspect_world netease ready: folder={} elapsed_ms={}",
        basic.folder,
        netease_started.elapsed().as_millis()
    );

    let leveldat_started = Instant::now();
    let (nbt_offset, level_payload_value) = parse_leveldat_value(&world_path.join("level.dat"))?;
    let level_payload = value_object(&level_payload_value).ok_or("level.dat root payload is not an object")?;
    let leveldat = leveldat_section(level_payload, nbt_offset);
    tracing::info!(
        "inspect_world leveldat ready: folder={} elapsed_ms={}",
        basic.folder,
        leveldat_started.elapsed().as_millis()
    );

    let player_started = Instant::now();
    let (player, inventory) = match parse_local_player_value(&world_path) {
        Ok((source_log, payload_value)) => {
            if let Some(payload) = value_object(&payload_value) {
                let (player, inventory) = player_sections(source_log, payload);
                (Some(player), Some(inventory))
            } else {
                warnings.push("local_player payload was not an object".to_string());
                (None, None)
            }
        }
        Err(err) => {
            warnings.push(err);
            (None, None)
        }
    };
    tracing::info!(
        "inspect_world player/inventory ready: folder={} elapsed_ms={}",
        basic.folder,
        player_started.elapsed().as_millis()
    );

    tracing::info!(
        "inspect_world done: folder={} total_elapsed_ms={}",
        basic.folder,
        started.elapsed().as_millis()
    );

    Ok(WorldInspectResult {
        basic,
        netease,
        leveldat,
        player,
        inventory,
        warnings,
    })
}


