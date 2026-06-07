const { invoke } = window.__TAURI__.core;

export async function inspectWorld(path) {
  return invoke('inspect_world', { path });
}
