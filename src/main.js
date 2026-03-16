document.addEventListener('DOMContentLoaded', async () => {
  initLocale();
  initTheme();
  updateUITexts();
  await loadWorldsPath();
  await loadWorlds();
  setupEventListeners();
});