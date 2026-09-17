// Stamp the theme before first paint so there is no flash of the wrong
// palette. Mirrors ThemeProvider's resolution order: stored choice, then OS
// preference, then dark. A file rather than an inline script, so the
// content security policy can stay at 'self'.
(function () {
  try {
    var stored = localStorage.getItem('sketchyart-theme');
    if (stored !== 'dark' && stored !== 'light') {
      stored = window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
    }
    document.documentElement.setAttribute('data-theme', stored);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
