import { getLabelHint, getSectionHint, inspectT } from './i18n.js';

function renderSectionHeading(level, title) {
  const hint = getSectionHint(title);
  const tag = level === 4 ? 'h4' : 'h3';
  return `
    <div class="inspect-heading">
      <${tag}>${title}</${tag}>
      ${hint ? `<div class="inspect-heading-hint">${escapeHtml(hint)}</div>` : ''}
    </div>
  `;
}

function renderLabel(label) {
  const hint = getLabelHint(label);
  return `
    <div class="inspect-label-main">${label}</div>
    ${hint ? `<div class="inspect-label-hint">${escapeHtml(hint)}</div>` : ''}
  `;
}

function renderKeyValueGrid(entries) {
  return `
    <div class="inspect-grid">
      ${entries.map(([label, value]) => `
        <div class="inspect-field">
          <div class="inspect-label">${renderLabel(label)}</div>
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
      ${renderSectionHeading(3, name)}
      <p class="inspect-meta">${inspectT('slotsMeta', { slots: container.total_slots_seen, count: container.non_empty_count })}</p>
      ${
        container.non_empty_items.length
          ? `<div class="inspect-item-list">${container.non_empty_items.map(item => `
              <article class="inspect-item">
                <div class="inspect-item-title">${escapeHtml(item.Name || 'Unnamed Item')}</div>
                <div class="inspect-item-meta">${inspectT('itemMeta', { count: item.Count ?? 0, damage: item.Damage ?? 0, slot: item.Slot ?? '—' })}</div>
                ${item.tag_keys ? `<div class="inspect-tags">${item.tag_keys.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                ${item.Block ? `<pre class="inspect-json">${escapeHtml(JSON.stringify(item.Block, null, 2))}</pre>` : ''}
                ${item.CanPlaceOn ? `<div class="inspect-item-meta">${escapeHtml(inspectT('itemCanPlaceOn', { value: JSON.stringify(item.CanPlaceOn) }))}</div>` : ''}
              </article>
            `).join('')}</div>`
          : `<p class="inspect-empty">${inspectT('noItems')}</p>`
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
  const summaryLabelMap = {
    keepinventory: 'keepinventory',
    neteaseEncryptFlag: 'neteaseEncryptFlag',
    pvp: 'pvp',
    showcoordinates: 'showcoordinates',
  };
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
          <div class="inspect-kicker">${inspectT('inspectKicker')}</div>
          <h2>${escapeHtml(data.basic.world_name)}</h2>
          <p>${escapeHtml(data.basic.folder)}</p>
        </div>
      </div>

      <div class="inspect-layout">
        <section class="inspect-card">
          ${renderSectionHeading(3, 'Basic')}
          ${renderKeyValueGrid(basicEntries)}
        </section>

        <section class="inspect-card">
          ${renderSectionHeading(3, 'NetEase')}
          ${renderKeyValueGrid(neteaseEntries)}
          <pre class="inspect-json">${escapeHtml(JSON.stringify(data.netease.world_record_summary, null, 2))}</pre>
        </section>

        <section class="inspect-card inspect-span-2">
          ${renderSectionHeading(3, 'level.dat')}
          ${renderKeyValueGrid(levelEntries.map(([label, value]) => [summaryLabelMap[label] || label, value]))}
          <div class="inspect-subsection">
            ${renderSectionHeading(4, 'Abilities')}
            <pre class="inspect-json">${escapeHtml(JSON.stringify(data.leveldat.abilities, null, 2))}</pre>
          </div>
          <div class="inspect-subsection">
            ${renderSectionHeading(4, 'Experiments')}
            <pre class="inspect-json">${escapeHtml(JSON.stringify(data.leveldat.experiments, null, 2))}</pre>
          </div>
        </section>

        ${
          data.player
            ? `<section class="inspect-card inspect-span-2">
                ${renderSectionHeading(3, 'Player')}
                ${renderKeyValueGrid(playerEntries)}
                <div class="inspect-subsection">
                  ${renderSectionHeading(4, 'Attributes')}
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
