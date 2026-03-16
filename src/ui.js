function renderWorlds() {
  const tbody = document.getElementById('worlds-tbody');

  if (filteredWorlds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading">${t('noWorlds')}</td></tr>`;
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
          <button class="btn btn-secondary btn-small" onclick="openFolder('${escapeJs(world.path)}')">${t('btnOpen')}</button>
          <button class="btn btn-secondary btn-small" onclick="backupWorld('${escapeJs(world.folder)}', '${escapeJs(world.name)}')">${t('btnBackup')}</button>
          <button class="btn btn-secondary btn-small" onclick="renameWorld('${escapeJs(world.folder)}', '${escapeJs(world.name)}')">${t('btnRename')}</button>
          <button class="btn btn-danger btn-small" onclick="deleteWorld('${escapeJs(world.folder)}', '${escapeJs(world.name)}')">${t('btnDelete')}</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateUITexts() {
  document.getElementById('app-title').textContent = t('appTitle');
  document.getElementById('search-input').placeholder = t('searchPlaceholder');
  document.getElementById('refresh-btn').textContent = t('refreshBtn');
  
  const sortSelect = document.getElementById('sort-select');
  sortSelect.options[0].text = t('sortLatest');
  sortSelect.options[1].text = t('sortOldest');
  sortSelect.options[2].text = t('sortNameAsc');
  sortSelect.options[3].text = t('sortNameDesc');
  sortSelect.options[4].text = t('sortSizeDesc');
  sortSelect.options[5].text = t('sortSizeAsc');
  
  document.getElementById('total-count').textContent = t('totalCount', { count: filteredWorlds.length });
  document.getElementById('total-size').textContent = t('totalSize', { size: formatSize(filteredWorlds.reduce((sum, w) => sum + w.size, 0)) });
  
  renderWorlds();
}

function setupEventListeners() {
  document.getElementById('refresh-btn').addEventListener('click', loadWorlds);
  document.getElementById('sort-select').addEventListener('change', () => {
    applySort();
    renderWorlds();
  });
  document.getElementById('search-input').addEventListener('input', applySearch);

  document.getElementById('locale-select').addEventListener('change', (e) => {
    setLocale(e.target.value);
  });

  document.getElementById('modal-cancel').addEventListener('click', hideModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') hideModal();
  });
}

let modalCallback = null;

function showModal(title, message, inputValue, callback, confirmText, isDanger = false) {
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

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = isError ? 'toast error' : 'toast';

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}