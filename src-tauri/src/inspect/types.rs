use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorldInspectResult {
    pub basic: InspectBasicInfo,
    pub netease: InspectNeteaseInfo,
    pub leveldat: InspectLevelDatInfo,
    pub player: Option<InspectPlayerInfo>,
    pub inventory: Option<InspectInventoryInfo>,
    pub db_patterns: Option<InspectDbPatterns>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InspectBasicInfo {
    pub folder: String,
    pub world_name: String,
    pub path: String,
    pub folder_size: u64,
    pub folder_size_formatted: String,
    pub levelname_txt: Option<String>,
    pub has_level_dat: bool,
    pub has_level_dat_old: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InspectNeteaseInfo {
    pub archive_id: Option<Value>,
    pub uid: Option<String>,
    pub world_record_summary: BTreeMap<String, Value>,
    pub behavior_pack_count: usize,
    pub resource_pack_count: usize,
    pub behavior_packs: Vec<Value>,
    pub resource_packs: Vec<Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InspectLevelDatInfo {
    pub nbt_offset: usize,
    pub summary: BTreeMap<String, Value>,
    pub abilities: BTreeMap<String, Value>,
    pub experiments: BTreeMap<String, Value>,
    pub top_level_key_count: usize,
    pub top_level_keys: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InspectPlayerInfo {
    pub source_log: Option<String>,
    pub pos: Option<Value>,
    pub rotation: Option<Value>,
    pub dimension_id: Option<Value>,
    pub player_game_mode: Option<Value>,
    pub selected_inventory_slot: Option<Value>,
    pub spawn_block_position: Vec<Value>,
    pub death_position: Vec<Value>,
    pub attributes: BTreeMap<String, Value>,
    pub parse_warning: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InspectInventoryContainer {
    pub total_slots_seen: usize,
    pub non_empty_count: usize,
    pub non_empty_items: Vec<Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InspectInventoryInfo {
    pub source_log: Option<String>,
    pub containers: BTreeMap<String, InspectInventoryContainer>,
    pub parse_warning: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InspectDbPatterns {
    pub categories: BTreeMap<String, Vec<String>>,
    pub file_counts: BTreeMap<String, BTreeMap<String, usize>>,
}
