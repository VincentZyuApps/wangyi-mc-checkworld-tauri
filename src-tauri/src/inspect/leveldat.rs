use serde_json::Value;
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use super::nbt::{parse_nbt_payload, value_object, NbtReader};
use super::types::InspectLevelDatInfo;

pub fn parse_leveldat_value(path: &Path) -> Result<(usize, Value), String> {
    let raw = fs::read(path).map_err(|e| e.to_string())?;
    let offset = if raw.len() >= 9 && raw[8] == 0x0A { 8 } else { 0 };
    let mut reader = NbtReader::new(&raw[offset..]);
    let tag_id = reader.read_u8()?;
    let _root_name = reader.read_utf8()?;
    let payload = parse_nbt_payload(&mut reader, tag_id)?;
    Ok((offset, payload))
}

pub fn leveldat_section(payload: &serde_json::Map<String, Value>, nbt_offset: usize) -> InspectLevelDatInfo {
    let mut summary = BTreeMap::new();
    for key in [
        "LevelName",
        "GameType",
        "Difficulty",
        "InventoryVersion",
        "NetworkVersion",
        "RandomSeed",
        "SpawnX",
        "SpawnY",
        "SpawnZ",
        "Time",
        "LastPlayed",
        "PlayerHasDied",
        "neteaseEncryptFlag",
        "showcoordinates",
        "keepinventory",
        "pvp",
    ] {
        summary.insert(key.to_string(), payload.get(key).cloned().unwrap_or(Value::Null));
    }

    let abilities = payload
        .get("abilities")
        .and_then(value_object)
        .map(|map| map.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
        .unwrap_or_default();

    let experiments = payload
        .get("experiments")
        .and_then(value_object)
        .map(|map| map.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
        .unwrap_or_default();

    let mut top_level_keys: Vec<String> = payload.keys().cloned().collect();
    top_level_keys.sort();

    InspectLevelDatInfo {
        nbt_offset,
        summary,
        abilities,
        experiments,
        top_level_key_count: top_level_keys.len(),
        top_level_keys,
    }
}
