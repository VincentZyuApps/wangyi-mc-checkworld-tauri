const { invoke } = window.__TAURI__.core;

let allWorlds = [];
let filteredWorlds = [];

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
  tbody.innerHTML = `<tr><td colspan="6" class="loading">${t('loadingWorlds')}</td></tr>`;

  try {
    allWorlds = await invoke('list_worlds');
    filteredWorlds = [...allWorlds];
    applySort();
    renderWorlds();
    updateStats();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading">${t('errorLoading')}: ${escapeHtml(e)}</td></tr>`;
    showToast(t('toastLoadFailed', { error: e }), true);
  }
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

function updateStats() {
  const totalCount = filteredWorlds.length;
  const totalSize = filteredWorlds.reduce((sum, w) => sum + w.size, 0);

  document.getElementById('total-count').textContent = t('totalCount', { count: totalCount });
  document.getElementById('total-size').textContent = t('totalSize', { size: formatSize(totalSize) });
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

async function openFolder(path) {
  try {
    await invoke('open_folder', { path });
  } catch (e) {
    showToast(t('toastOpenFailed', { error: e }), true);
  }
}

async function backupWorld(folder, name) {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const defaultName = `${name}_backup_${timestamp}`;

  showModal(
    t('modalBackupTitle'),
    t('modalBackupMessage', { name }),
    defaultName,
    async (backupName) => {
      try {
        const path = await invoke('backup_world', { folder, backupName });
        showToast(t('toastBackupSuccess', { path }));
      } catch (e) {
        showToast(t('toastBackupFailed', { error: e }), true);
      }
    },
    t('modalBackupConfirm'),
    false
  );
}

async function renameWorld(folder, currentName) {
  showModal(
    t('modalRenameTitle'),
    t('modalRenameMessage'),
    currentName,
    async (newName) => {
      if (!newName.trim()) {
        showToast(t('nameEmptyError'), true);
        return;
      }
      try {
        await invoke('rename_world', { folder, newName: newName.trim() });
        showToast(t('toastRenameSuccess'));
        await loadWorlds();
      } catch (e) {
        showToast(t('toastRenameFailed', { error: e }), true);
      }
    },
    t('modalRenameConfirm'),
    false
  );
}

async function deleteWorld(folder, name) {
  showModal(
    t('modalDeleteTitle'),
    t('modalDeleteMessage', { name }),
    null,
    async () => {
      try {
        await invoke('delete_world', { folder });
        showToast(t('toastDeleteSuccess'));
        await loadWorlds();
      } catch (e) {
        showToast(t('toastDeleteFailed', { error: e }), true);
      }
    },
    t('modalDeleteConfirm'),
    true
  );
}