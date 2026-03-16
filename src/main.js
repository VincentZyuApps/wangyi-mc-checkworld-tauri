const { invoke } = window.__TAURI__.tauri;

let allWorlds = [];
let filteredWorlds = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await loadWorldsPath();
  await loadWorlds();
  setupEventListeners();
});

async function loadWorldsPath() {
  try {
    const path = await invoke('get_worlds_path');
    document.getElementById('worlds-path').textContent = `📂 ${path}`;
  } catch (e) {
    console.error('Failed to get worlds path:', e);
  }
}

async function loadWorlds() {
  const tbody = document.getElementById('worlds-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading">⏳ Loading worlds...</td></tr>';

  try {
    allWorlds = await invoke('list_worlds');
    filteredWorlds = [...allWorlds];
    applySort();
    renderWorlds();
    updateStats();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading">❌ Error: ${e}</td></tr>`;
    showToast(`Failed to load worlds: ${e}`, true);
  }
}

function renderWorlds() {
  const tbody = document.getElementById('worlds-tbody');

  if (filteredWorlds.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading">No worlds found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredWorlds.map((world, index) => `
    <tr data-folder="${escapeHtml(world.folder)}">
      <td class="col-index">${index + 1}</td>
      <td class="col-name">${escapeHtml(world.name)}</td>
      <td class="col-folder">${escapeHtml(world.folder)}</td>
      <td class="col-time">${world.last_saved || 'Unknown'}</td>
      <td class="col-size">${world.size_formatted}</td>
      <td class="col-actions">
        <div class="action-buttons">
          <button class="btn btn-secondary btn-small" onclick="openFolder('${escapeJs(world.path)}')">📁 Open</button>
          <button class="btn btn-secondary btn-small" onclick="showBackupModal('${escapeJs(world.folder)}', '${escapeJs(world.name)}')">💾 Backup</button>
          <button class="btn btn-secondary btn-small" onclick="showRenameModal('${escapeJs(world.folder)}', '${escapeJs(world.name)}')">✏️ Rename</button>
          <button class="btn btn-danger btn-small" onclick="showDeleteModal('${escapeJs(world.folder)}', '${escapeJs(world.name)}')">🗑️ Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateStats() {
  const totalCount = filteredWorlds.length;
  const totalSize = filteredWorlds.reduce((sum, w) => sum + w.size, 0);

  document.getElementById('total-count').textContent = `📊 Total: ${totalCount} worlds`;
  document.getElementById('total-size').textContent = `💾 Total size: ${formatSize(totalSize)}`;
}

function formatSize(bytes) {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes < KB) return `${bytes.toFixed(2)} B`;
  if (bytes < MB) return `${(bytes / KB).toFixed(2)} KB`;
  if (bytes < GB) return `${(bytes / MB).toFixed(2)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}

function applySort() {
  const sortValue = document.getElementById('sort-select').value;

  filteredWorlds.sort((a, b) => {
    switch (sortValue) {
      case 'time-desc':
        return (b.last_saved_timestamp || 0) - (a.last_saved_timestamp || 0);
      case 'time-asc':
        return (a.last_saved_timestamp || 0) - (b.last_saved_timestamp || 0);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'size-desc':
        return b.size - a.size;
      case 'size-asc':
        return a.size - b.size;
      default:
        return 0;
    }
  });
}

function applySearch() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();

  if (!query) {
    filteredWorlds = [...allWorlds];
  } else {
    filteredWorlds = allWorlds.filter(w =>
      w.name.toLowerCase().includes(query) ||
      w.folder.toLowerCase().includes(query)
    );
  }

  applySort();
  renderWorlds();
  updateStats();
}

function setupEventListeners() {
  document.getElementById('refresh-btn').addEventListener('click', loadWorlds);
  document.getElementById('sort-select').addEventListener('change', () => {
    applySort();
    renderWorlds();
  });
  document.getElementById('search-input').addEventListener('input', applySearch);

  // Modal
  document.getElementById('modal-cancel').addEventListener('click', hideModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') hideModal();
  });
}

// Actions
async function openFolder(path) {
  try {
    await invoke('open_folder', { path });
  } catch (e) {
    showToast(`Failed to open folder: ${e}`, true);
  }
}

function showBackupModal(folder, name) {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const defaultName = `${name}_backup_${timestamp}`;

  showModal(
    '💾 Backup World',
    `Create a backup of "${name}"?`,
    defaultName,
    async (backupName) => {
      try {
        const path = await invoke('backup_world', { folder, backupName });
        showToast(`Backup created: ${path}`);
      } catch (e) {
        showToast(`Backup failed: ${e}`, true);
      }
    },
    'Backup',
    false
  );
}

function showRenameModal(folder, currentName) {
  showModal(
    '✏️ Rename World',
    `Enter new name for "${currentName}":`,
    currentName,
    async (newName) => {
      if (!newName.trim()) {
        showToast('Name cannot be empty', true);
        return;
      }
      try {
        await invoke('rename_world', { folder, newName: newName.trim() });
        showToast('World renamed successfully');
        await loadWorlds();
      } catch (e) {
        showToast(`Rename failed: ${e}`, true);
      }
    },
    'Rename',
    false
  );
}

function showDeleteModal(folder, name) {
  showModal(
    '🗑️ Delete World',
    `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone!`,
    null,
    async () => {
      try {
        await invoke('delete_world', { folder });
        showToast('World deleted');
        await loadWorlds();
      } catch (e) {
        showToast(`Delete failed: ${e}`, true);
      }
    },
    'Delete',
    true
  );
}

// Modal helpers
let modalCallback = null;

function showModal(title, message, inputValue, callback, confirmText = 'Confirm', isDanger = false) {
  modalCallback = callback;

  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;

  const inputContainer = document.getElementById('modal-input-container');
  const inputElement = document.getElementById('modal-input');

  if (inputValue !== null) {
    inputContainer.classList.remove('hidden');
    inputElement.value = inputValue;
    setTimeout(() => inputElement.focus(), 100);
  } else {
    inputContainer.classList.add('hidden');
  }

  const confirmBtn = document.getElementById('modal-confirm');
  confirmBtn.textContent = confirmText;
  confirmBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';
  confirmBtn.onclick = () => {
    const value = inputValue !== null ? inputElement.value : null;
    hideModal();
    if (modalCallback) modalCallback(value);
  };

  document.getElementById('modal').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal').classList.add('hidden');
  modalCallback = null;
}

// Toast
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = isError ? 'toast error' : 'toast';

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Utilities
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
