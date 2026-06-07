use serde_json::{Map, Value};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use super::nbt::{parse_nbt_payload, value_object, NbtReader};
use super::types::{
    InspectInventoryContainer, InspectInventoryInfo, InspectPlayerInfo,
};

pub fn parse_local_player_value(world_path: &Path) -> Result<(String, Value), String> {
    let db_dir = world_path.join("db");
    let entries = fs::read_dir(&db_dir).map_err(|e| e.to_string())?;
    let mut logs: Vec<PathBuf> = entries
        .filter_map(|entry| entry.ok().map(|e| e.path()))
        .filter(|path| path.extension().map(|ext| ext.eq_ignore_ascii_case("log")).unwrap_or(false))
        .collect();
    logs.sort();

    for path in logs {
        let raw = match fs::read(&path) {
            Ok(raw) => raw,
            Err(_) => continue,
        };
        let Some(idx) = find_bytes(&raw, b"local_player") else {
            continue;
        };
        let start = find_bytes_in_range(
            &raw,
            b"\x0A\x00\x00",
            idx + b"local_player".len(),
            (idx + b"local_player".len() + 64).min(raw.len()),
        );
        let Some(start) = start else {
            continue;
        };
        let mut reader = NbtReader::new(&raw[start..]);
        let tag_id = reader.read_u8()?;
        let _root_name = reader.read_utf8()?;
        let payload = parse_nbt_payload(&mut reader, tag_id)?;
        return Ok((
            path.file_name().unwrap_or_default().to_string_lossy().to_string(),
            payload,
        ));
    }

    Err("local_player record not found in db logs".to_string())
}

fn find_bytes(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack.windows(needle.len()).position(|window| window == needle)
}

fn find_bytes_in_range(haystack: &[u8], needle: &[u8], start: usize, end: usize) -> Option<usize> {
    if start >= end || needle.is_empty() || end > haystack.len() {
        return None;
    }
    haystack[start..end]
        .windows(needle.len())
        .position(|window| window == needle)
        .map(|pos| pos + start)
}

fn player_attributes(payload: &Map<String, Value>) -> BTreeMap<String, Value> {
    let mut attrs = BTreeMap::new();
    if let Some(Value::Array(items)) = payload.get("Attributes") {
        for item in items {
            if let Some(map) = value_object(item) {
                if let Some(Value::String(name)) = map.get("Name") {
                    attrs.insert(name.clone(), Value::Object(map.clone()));
                }
            }
        }
    }
    attrs
}

fn summarize_item(item: &Value, index: usize) -> Value {
    if let Some(map) = value_object(item) {
        let mut out = Map::new();
        out.insert("index".into(), Value::from(index as i64));
        for key in ["Name", "Count", "Damage", "Slot", "WasPickedUp"] {
            out.insert(key.into(), map.get(key).cloned().unwrap_or(Value::Null));
        }
        if let Some(tag) = map.get("tag").and_then(value_object) {
            let mut keys: Vec<Value> = tag.keys().cloned().map(Value::String).collect();
            keys.sort_by(|a, b| a.as_str().cmp(&b.as_str()));
            out.insert("tag_keys".into(), Value::Array(keys));
        }
        for key in ["Block", "CanPlaceOn", "CanDestroy"] {
            if let Some(value) = map.get(key) {
                out.insert(key.into(), value.clone());
            }
        }
        return Value::Object(out);
    }
    Value::Object(
        [("index".to_string(), Value::from(index as i64)), ("raw".to_string(), item.clone())]
            .into_iter()
            .collect(),
    )
}

fn normalize_container(value: Option<&Value>) -> Vec<Value> {
    match value {
        Some(Value::Array(items)) => items.iter().enumerate().map(|(i, item)| summarize_item(item, i)).collect(),
        Some(item) => vec![summarize_item(item, 0)],
        None => Vec::new(),
    }
}

fn non_empty_items(items: &[Value]) -> Vec<Value> {
    items.iter()
        .filter(|item| {
            item.get("Name")
                .and_then(|v| v.as_str())
                .map(|v| !v.is_empty())
                .unwrap_or(false)
                || item.get("Count").and_then(|v| v.as_i64()).unwrap_or(0) > 0
        })
        .cloned()
        .collect()
}

pub fn player_sections(source_log: String, payload: &Map<String, Value>) -> (InspectPlayerInfo, InspectInventoryInfo) {
    let attrs = player_attributes(payload);
    let player = InspectPlayerInfo {
        source_log: Some(source_log.clone()),
        pos: payload.get("Pos").cloned(),
        rotation: payload.get("Rotation").cloned(),
        dimension_id: payload.get("DimensionId").cloned(),
        player_game_mode: payload.get("PlayerGameMode").cloned(),
        selected_inventory_slot: payload.get("SelectedInventorySlot").cloned(),
        spawn_block_position: vec![
            payload.get("SpawnBlockPositionX").cloned().unwrap_or(Value::Null),
            payload.get("SpawnBlockPositionY").cloned().unwrap_or(Value::Null),
            payload.get("SpawnBlockPositionZ").cloned().unwrap_or(Value::Null),
        ],
        death_position: vec![
            payload.get("DeathPositionX").cloned().unwrap_or(Value::Null),
            payload.get("DeathPositionY").cloned().unwrap_or(Value::Null),
            payload.get("DeathPositionZ").cloned().unwrap_or(Value::Null),
        ],
        attributes: attrs,
        parse_warning: payload
            .get("_parse_error")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
    };

    let mut containers = BTreeMap::new();
    for name in ["Armor", "Inventory", "EnderChestInventory", "Mainhand", "Offhand"] {
        let items = normalize_container(payload.get(name));
        let non_empty = non_empty_items(&items);
        containers.insert(
            name.to_string(),
            InspectInventoryContainer {
                total_slots_seen: items.len(),
                non_empty_count: non_empty.len(),
                non_empty_items: non_empty,
            },
        );
    }
    let inventory = InspectInventoryInfo {
        source_log: Some(source_log),
        containers,
        parse_warning: payload
            .get("_parse_error")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
    };

    (player, inventory)
}
