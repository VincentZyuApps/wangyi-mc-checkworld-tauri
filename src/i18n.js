const translations = {
  'zh-CN': {
    appTitle: '🎮 MC NetEase World Manager',
    loading: 'Loading...',
    searchPlaceholder: '🔍 搜索存档...',
    refreshBtn: '🔄 刷新',
    sortLatest: '⏰ 最新优先',
    sortOldest: '⏰ 最旧优先',
    sortNameAsc: '📝 名称 A-Z',
    sortNameDesc: '📝 名称 Z-A',
    sortSizeDesc: '💾 最大优先',
    sortSizeAsc: '💾 最小优先',
    totalCount: '共 {count} 个存档',
    totalSize: '总大小: {size}',
    colIndex: '#',
    colName: '存档名称',
    colFolder: '文件夹',
    colTime: '最后保存',
    colSize: '大小',
    colActions: '操作',
    noWorlds: '未找到存档',
    loadingWorlds: '⏳ 加载存档中...',
    errorLoading: '❌ 加载错误',
    btnOpen: '📁 打开',
    btnBackup: '💾 备份',
    btnRename: '✏️ 重命名',
    btnDelete: '🗑️ 删除',
    modalBackupTitle: '💾 备份存档',
    modalBackupMessage: '创建 "{name}" 的备份？',
    modalBackupConfirm: '备份',
    modalRenameTitle: '✏️ 重命名存档',
    modalRenameMessage: '输入新名称:',
    modalRenameConfirm: '重命名',
    modalDeleteTitle: '🗑️ 删除存档',
    modalDeleteMessage: '确定要删除 "{name}" 吗？此操作无法撤销！',
    modalDeleteConfirm: '删除',
    modalCancel: '取消',
    toastBackupSuccess: '备份已创建: {path}',
    toastBackupFailed: '备份失败: {error}',
    toastRenameSuccess: '存档重命名成功',
    toastRenameFailed: '重命名失败: {error}',
    toastDeleteSuccess: '存档已删除',
    toastDeleteFailed: '删除失败: {error}',
    toastOpenFailed: '打开文件夹失败: {error}',
    toastLoadFailed: '加载存档失败',
    nameEmptyError: '名称不能为空',
    logWindowTitle: '📋 日志',
  },
  'en-US': {
    appTitle: '🎮 MC NetEase World Manager',
    loading: 'Loading...',
    searchPlaceholder: '🔍 Search worlds...',
    refreshBtn: '🔄 Refresh',
    sortLatest: '⏰ Latest First',
    sortOldest: '⏰ Oldest First',
    sortNameAsc: '📝 Name A-Z',
    sortNameDesc: '📝 Name Z-A',
    sortSizeDesc: '💾 Largest First',
    sortSizeAsc: '💾 Smallest First',
    totalCount: 'Total: {count} worlds',
    totalSize: 'Total size: {size}',
    colIndex: '#',
    colName: 'World Name',
    colFolder: 'Folder',
    colTime: 'Last Saved',
    colSize: 'Size',
    colActions: 'Actions',
    noWorlds: 'No worlds found',
    loadingWorlds: '⏳ Loading worlds...',
    errorLoading: '❌ Error loading',
    btnOpen: '📁 Open',
    btnBackup: '💾 Backup',
    btnRename: '✏️ Rename',
    btnDelete: '🗑️ Delete',
    modalBackupTitle: '💾 Backup World',
    modalBackupMessage: 'Create a backup of "{name}"?',
    modalBackupConfirm: 'Backup',
    modalRenameTitle: '✏️ Rename World',
    modalRenameMessage: 'Enter new name:',
    modalRenameConfirm: 'Rename',
    modalDeleteTitle: '🗑️ Delete World',
    modalDeleteMessage: 'Are you sure you want to delete "{name}"?\n\nThis action cannot be undone!',
    modalDeleteConfirm: 'Delete',
    modalCancel: 'Cancel',
    toastBackupSuccess: 'Backup created: {path}',
    toastBackupFailed: 'Backup failed: {error}',
    toastRenameSuccess: 'World renamed successfully',
    toastRenameFailed: 'Rename failed: {error}',
    toastDeleteSuccess: 'World deleted',
    toastDeleteFailed: 'Delete failed: {error}',
    toastOpenFailed: 'Failed to open folder: {error}',
    toastLoadFailed: 'Failed to load worlds',
    nameEmptyError: 'Name cannot be empty',
    logWindowTitle: '📋 Log',
  }
};

let currentLocale = 'zh-CN';

function initLocale() {
  const saved = localStorage.getItem('locale');
  if (saved && translations[saved]) {
    currentLocale = saved;
  } else {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('en')) {
      currentLocale = 'en-US';
    } else {
      currentLocale = 'zh-CN';
    }
  }
  updateLocaleUI();
}

function setLocale(locale) {
  if (translations[locale]) {
    currentLocale = locale;
    localStorage.setItem('locale', locale);
    updateLocaleUI();
    renderUI();
  }
}

function updateLocaleUI() {
  const select = document.getElementById('locale-select');
  if (select) {
    select.value = currentLocale;
  }
}

function t(key, params = {}) {
  const trans = translations[currentLocale] || translations['zh-CN'];
  let text = trans[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

function renderUI() {
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
  
  const thead = document.querySelector('.worlds-table thead tr');
  thead.children[1].textContent = t('colName');
  thead.children[2].textContent = t('colFolder');
  thead.children[3].textContent = t('colTime');
  thead.children[4].textContent = t('colSize');
  thead.children[5].textContent = t('colActions');
}

let currentLocale = 'zh-CN';

function initLocale() {
  const saved = localStorage.getItem('locale');
  if (saved && translations[saved]) {
    currentLocale = saved;
  } else {
    const browserLang = navigator.language || navigator.userLanguage;
    currentLocale = browserLang.startsWith('en') ? 'en-US' : 'zh-CN';
  }
  updateLocaleUI();
}

function updateLocaleUI() {
  const select = document.getElementById('locale-select');
  if (select) select.value = currentLocale;
}

function setLocale(locale) {
  if (translations[locale]) {
    currentLocale = locale;
    localStorage.setItem('locale', locale);
    updateLocaleUI();
    if (typeof updateUITexts === 'function') {
      updateUITexts();
    }
  }
}