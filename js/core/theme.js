// Dark/light theme toggle mirroring Core/ThemeManager.vb. Colours live in css/style.css
// as CSS variables under :root[data-theme="dark"|"light"]; this module just flips the attribute.
const Theme = (() => {
  let dark = true;
  const listeners = [];

  function apply() {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    listeners.forEach((fn) => fn());
  }

  function toggle() {
    dark = !dark;
    apply();
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  function isDark() {
    return dark;
  }

  // Reads the current theme's colours straight from CSS variables, so graph.js never
  // hardcodes a palette - it always matches whatever is in style.css.
  function palette() {
    const s = getComputedStyle(document.documentElement);
    const v = (name) => s.getPropertyValue(name).trim();
    return {
      graphBackground: v('--graph-bg'),
      grid: v('--grid'),
      axis: v('--axis'),
      foreground: v('--fg'),
      subtleForeground: v('--subtle-fg'),
      accent: v('--accent'),
      panelBackground: v('--panel-bg'),
      good: v('--good'),
      bad: v('--bad'),
    };
  }

  apply();
  return { toggle, onChange, isDark, palette };
})();
