const { invoke } = window.__TAURI__.core;

let allWorlds = [];
let filteredWorlds = [];
let currentTheme = 'system';

const themeIcons = {
  'light': '☀️',
  'dark': '🌙',
  'system': '🌓'
};

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    currentTheme = saved;
  }
  applyTheme();
  
  document.getElementById('theme-btn').addEventListener('click', cycleTheme);
}

function applyTheme() {
  const themeIcon = document.getElementById('theme-icon');
  themeIcon.textContent = themeIcons[currentTheme];
  
  if (currentTheme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }
}

function cycleTheme() {
  const themes = ['system', 'light', 'dark'];
  const currentIndex = themes.indexOf(currentTheme);
  currentTheme = themes[(currentIndex + 1) % themes.length];
  localStorage.setItem('theme', currentTheme);
  applyTheme();
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (currentTheme === 'system') {
    applyTheme();
  }
});