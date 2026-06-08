import { inspectWorld } from './service.js';
import { inspectT, setInspectLocale } from './i18n.js';
import { renderInspectContent } from './view.js';

let activeInspectPath = null;
let activeInspectData = null;

export function initInspect({ t, showToast, getLocale }) {
  const overlay = document.getElementById('inspect-overlay');
  const closeBtn = document.getElementById('inspect-close');
  setInspectLocale(getLocale());

  closeBtn.addEventListener('click', closeInspect);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeInspect();
    }
  });

  return {
    renderInspectButton(world) {
      return `<button class="btn btn-secondary btn-small" onclick="window.openInspect('${escapeJs(world.path)}')">🔍 ${t('btnInspect')}</button>`;
    },
    async openInspect(path) {
      const content = document.getElementById('inspect-content');
      const overlayEl = document.getElementById('inspect-overlay');
      activeInspectPath = path;
      activeInspectData = null;
      setInspectLocale(getLocale());
      overlayEl.classList.remove('hidden');
      document.body.classList.add('inspect-open');
      content.innerHTML = `<div class="inspect-loading">${inspectT('loadingInspectData')}</div>`;
      console.time(`inspect:${path}`);
      try {
        const data = await inspectWorld(path);
        if (activeInspectPath !== path) return;
        activeInspectData = data;
        content.innerHTML = renderInspectContent(data);
        console.timeEnd(`inspect:${path}`);
      } catch (error) {
        console.timeEnd(`inspect:${path}`);
        content.innerHTML = `<div class="inspect-error">${escapeHtml(String(error))}</div>`;
        showToast(`${inspectT('inspectFailed')}: ${error}`, true);
      }
    },
    refreshLocale(locale) {
      setInspectLocale(locale);
      if (activeInspectPath && activeInspectData) {
        document.getElementById('inspect-content').innerHTML = renderInspectContent(activeInspectData);
      }
    },
  };
}

export function closeInspect() {
  activeInspectPath = null;
  activeInspectData = null;
  document.getElementById('inspect-overlay').classList.add('hidden');
  document.body.classList.remove('inspect-open');
}

function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

