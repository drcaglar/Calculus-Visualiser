// The "Program Hakkında / About" chapter - a single static page (copyright/licence/disclaimer),
// rendered by mountAbout (js/core/aboutUI.js). Registered like any other topic so main.js's
// existing chapter/tab machinery handles it without special-casing the nav itself.
(function () {
  Topics.register('about', {
    type: 'about',
    tabTitle: () => I18N.tx('Program Hakkında', 'About'),
  });
})();
