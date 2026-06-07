function renderKeyValueGrid(entries) {
  return `
    <div class="inspect-grid">
      ${entries.map(([label, value]) => `
        <div class="inspect-field">
          <div class="inspect-label">${label}</div>
          <div class="inspect-value">${formatValue(value)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return '<span class="inspect-empty">—</span>';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '<span class="inspect-empty">[]</span>';
    return `<code>${escapeHtml(JSON.stringify(value))}</code>`;
  }
  if (typeof value === 'object') {
    return `<pre class="inspect-json">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  }
  return escapeHtml(String(value));
}

function renderContainer(name, container) {
  return `
    <section class="inspect-card">
      <h3>${name}</h3>
      <p class="inspect-meta">Slots: ${container.total_slots_seen} · Non-empty: ${container.non_empty_count}</p>
      ${
        container.non_empty_items.length
          ? `<div class="inspect-item-list">${container.non_empty_items.map(item => `
              <article class="inspect-item">
                <div class="inspect-item-title">${escapeHtml(item.Name || 'Unnamed Item')}</div>
                <div class="inspect-item-meta">Count: ${item.Count ?? 0} · Damage: ${item.Damage ?? 0} · Slot: ${item.Slot ?? '—'}</div>
                ${item.tag_keys ? `<div class="inspect-tags">${item.tag_keys.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                ${item.Block ? `<pre class="inspect-json">${escapeHtml(JSON.stringify(item.Block, null, 2))}</pre>` : ''}
                ${item.CanPlaceOn ? `<div class="inspect-item-meta">CanPlaceOn: ${escapeHtml(JSON.stringify(item.CanPlaceOn))}</div>` : ''}
              </article>
            `).join('')}</div>`
          : `<p class="inspect-empty">No items</p>`
      }
    </section>
  `;
}

function renderPatternSection(dbPatterns) {
  if (!dbPatterns) return '';
  return `
    <section class="inspect-card inspect-span-2">
      <h3>DB Patterns</h3>
      <div class="inspect-grid">
        ${Object.entries(dbPatterns.categories).map(([name, samples]) => `
          <div class="inspect-field">
            <div class="inspect-label">${escapeHtml(name)}</div>
            <div class="inspect-value">
              <pre class="inspect-json">${escapeHtml(JSON.stringify(samples.slice(0, 10), null, 2))}</pre>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

export function renderInspectContent(data) {
  const basicEntries = [
    ['Folder', data.basic.folder],
    ['World Name', data.basic.world_name],
    ['Path', data.basic.path],
    ['Size', data.basic.folder_size_formatted],
    ['level.dat', data.basic.has_level_dat],
    ['level.dat_old', data.basic.has_level_dat_old],
  ];
  const neteaseEntries = [
    ['archive_id', data.netease.archive_id],
    ['uid', data.netease.uid],
    ['Behavior Packs', data.netease.behavior_pack_count],
    ['Resource Packs', data.netease.resource_pack_count],
  ];
  const levelEntries = Object.entries(data.leveldat.summary || {});
  const playerEntries = data.player ? [
    ['Source Log', data.player.source_log],
    ['Pos', data.player.pos],
    ['Rotation', data.player.rotation],
    ['DimensionId', data.player.dimension_id],
    ['PlayerGameMode', data.player.player_game_mode],
    ['SelectedInventorySlot', data.player.selected_inventory_slot],
    ['SpawnBlockPosition', data.player.spawn_block_position],
    ['DeathPosition', data.player.death_position],
  ] : [];

  return `
    <div class="inspect-scroll">
      <div class="inspect-hero">
        <div>
          <div class="inspect-kicker">Inspect</div>
          <h2>${escapeHtml(data.basic.world_name)}</h2>
          <p>${escapeHtml(data.basic.folder)}</p>
        </div>
      </div>

      <div class="inspect-layout">
        <section class="inspect-card">
          <h3>Basic</h3>
          ${renderKeyValueGrid(basicEntries)}
        </section>

        <section class="inspect-card">
          <h3>NetEase</h3>
          ${renderKeyValueGrid(neteaseEntries)}
          <pre class="inspect-json">${escapeHtml(JSON.stringify(data.netease.world_record_summary, null, 2))}</pre>
        </section>

        <section class="inspect-card inspect-span-2">
          <h3>level.dat</h3>
          ${renderKeyValueGrid(levelEntries)}
          <div class="inspect-subsection">
            <h4>Abilities</h4>
            <pre class="inspect-json">${escapeHtml(JSON.stringify(data.leveldat.abilities, null, 2))}</pre>
          </div>
          <div class="inspect-subsection">
            <h4>Experiments</h4>
            <pre class="inspect-json">${escapeHtml(JSON.stringify(data.leveldat.experiments, null, 2))}</pre>
          </div>
        </section>

        ${
          data.player
            ? `<section class="inspect-card inspect-span-2">
                <h3>Player</h3>
                ${renderKeyValueGrid(playerEntries)}
                <div class="inspect-subsection">
                  <h4>Attributes</h4>
                  <pre class="inspect-json">${escapeHtml(JSON.stringify(data.player.attributes, null, 2))}</pre>
                </div>
                ${data.player.parse_warning ? `<p class="inspect-warning">${escapeHtml(data.player.parse_warning)}</p>` : ''}
              </section>`
            : ''
        }

        ${
          data.inventory
            ? Object.entries(data.inventory.containers).map(([name, container]) => renderContainer(name, container)).join('')
            : ''
        }

        ${renderPatternSection(data.db_patterns)}
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
