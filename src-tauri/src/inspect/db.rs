use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use super::types::InspectDbPatterns;

fn extract_printable_strings(data: &[u8], min_len: usize) -> Vec<String> {
    let mut strings = Vec::new();
    let mut buf = Vec::new();
    for &byte in data {
        if (0x20..=0x7E).contains(&byte) {
            buf.push(byte);
        } else {
            if buf.len() >= min_len {
                strings.push(String::from_utf8_lossy(&buf).to_string());
            }
            buf.clear();
        }
    }
    if buf.len() >= min_len {
        strings.push(String::from_utf8_lossy(&buf).to_string());
    }
    strings
}

fn categorize_string(text: &str) -> Vec<&'static str> {
    let patterns = [
        ("local_player", &["local_player"][..]),
        ("playerish", &["minecraft:player", "playerPermissionsLevel", "PlayerGameMode"][..]),
        ("positionish", &["Pos", "Rotation", "DimensionId", "SpawnBlockPosition", "DeathPosition"][..]),
        ("attributeish", &["Attributes", "minecraft:health", "minecraft:player.hunger", "minecraft:player.saturation"][..]),
        ("inventoryish", &["Armor", "Inventory", "Offhand", "Mainhand", "Count", "Damage", "WasPickedUp"][..]),
        ("entityish", &["identifier", "UniqueID", "Motion", "OnGround", "AutonomousEntity"][..]),
        ("recipeish", &["recipeId", "WorkBench", "stonecutter_", "Jukebox_recipeId"][..]),
        ("block_item_names", &["minecraft:"][..]),
    ];
    let mut matches = Vec::new();
    for (name, needles) in patterns {
        if needles.iter().any(|needle| text.contains(needle)) {
            matches.push(name);
        }
    }
    if matches.is_empty() {
        matches.push("uncategorized");
    }
    matches
}

pub fn db_patterns_for_world(world_path: &Path) -> Option<InspectDbPatterns> {
    let db_dir = world_path.join("db");
    let entries = fs::read_dir(&db_dir).ok()?;
    let mut categories: BTreeMap<String, Vec<String>> = BTreeMap::new();
    let mut file_counts: BTreeMap<String, BTreeMap<String, usize>> = BTreeMap::new();

    for path in entries.filter_map(|entry| entry.ok().map(|e| e.path())) {
        let Some(ext) = path.extension() else {
            continue;
        };
        let ext = ext.to_string_lossy().to_ascii_lowercase();
        if ext != "log" && ext != "ldb" {
            continue;
        }
        let raw = match fs::read(&path) {
            Ok(raw) => raw,
            Err(_) => continue,
        };
        let mut seen = Vec::<String>::new();
        for item in extract_printable_strings(&raw, 3) {
            if !seen.contains(&item) {
                seen.push(item);
            }
        }
        let mut counts: BTreeMap<String, usize> = BTreeMap::new();
        for item in seen {
            for category in categorize_string(&item) {
                *counts.entry(category.to_string()).or_insert(0) += 1;
                let samples = categories.entry(category.to_string()).or_default();
                if samples.len() < 20 && !samples.contains(&item) {
                    samples.push(item.clone());
                }
            }
        }
        file_counts.insert(
            path.file_name().unwrap_or_default().to_string_lossy().to_string(),
            counts,
        );
    }

    Some(InspectDbPatterns { categories, file_counts })
}
