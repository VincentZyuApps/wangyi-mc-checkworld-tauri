import { inspectWorld } from './service.js';
import { renderInspectContent } from './view.js';

let activeInspectPath = null;

export function initInspect({ t, showToast }) {
  const overlay = document.getElementById('inspect-overlay');
  const closeBtn = document.getElementById('inspect-close');

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
      overlayEl.classList.remove('hidden');
      document.body.classList.add('inspect-open');
      content.innerHTML = '<div class="inspect-loading">Loading inspect data...</div>';
      console.time(`inspect:${path}`);
      try {
        const data = await inspectWorld(path);
        if (activeInspectPath !== path) return;
        content.innerHTML = renderInspectContent(data);
        console.timeEnd(`inspect:${path}`);
      } catch (error) {
        console.timeEnd(`inspect:${path}`);
        content.innerHTML = `<div class="inspect-error">${escapeHtml(String(error))}</div>`;
        showToast(`Inspect failed: ${error}`, true);
      }
    },
  };
}

export function closeInspect() {
  activeInspectPath = null;
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

