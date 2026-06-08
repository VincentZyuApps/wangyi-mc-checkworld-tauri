let currentLocale = 'zh-CN';

export const translations = {
  'zh-CN': {
    appTitle: '🎮 MC网易基岩世界存档查看',
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
    colFolder: '文件夹名称',
    colTime: '最后保存',
    colSize: '大小',
    colActions: '操作',
    noWorlds: '未找到存档',
    loadingWorlds: '⏳ 加载存档中...',
    errorLoading: '❌ 加载错误',
    btnOpenRoot: '📁 打开',
    btnCopyRoot: '📋 复制',
    btnOpen: '📁 打开',
    btnCopy: '📋 复制',
    btnInspect: '查看详情',
    toastPathCopied: '路径已复制',
    toastLoadFailed: '加载失败: {error}',
    logWindowTitle: '📝 日志',
  },
  'en-US': {
    appTitle: '🎮 MC NetEase World Checker',
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
    colFolder: 'Folder Name',
    colTime: 'Last Saved',
    colSize: 'Size',
    colActions: 'Actions',
    noWorlds: 'No worlds found',
    loadingWorlds: '⏳ Loading worlds...',
    errorLoading: '❌ Error loading',
    btnOpenRoot: '📁 Open',
    btnCopyRoot: '📋 Copy',
    btnOpen: '📁 Open',
    btnCopy: '📋 Copy',
    btnInspect: 'Inspect',
    toastPathCopied: 'Path copied',
    toastLoadFailed: 'Load failed: {error}',
    logWindowTitle: '📝 Log',
  },
};

export function t(key, params = {}) {
  const trans = translations[currentLocale] || translations['zh-CN'];
  let text = trans[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

export function initLocale() {
  const saved = localStorage.getItem('locale');
  if (saved && translations[saved]) {
    currentLocale = saved;
  } else {
    const browserLang = navigator.language || navigator.userLanguage;
    currentLocale = browserLang.startsWith('en') ? 'en-US' : 'zh-CN';
  }
  return currentLocale;
}

export function setLocale(locale) {
  if (!translations[locale]) {
    return false;
  }
  currentLocale = locale;
  localStorage.setItem('locale', locale);
  return true;
}

export function getCurrentLocale() {
  return currentLocale;
}
