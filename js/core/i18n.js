// Bilingual helper mirroring Core/Loc.vb's Tx(turkish, english).
// Usage: I18N.tx('Türkçe metin', 'English text')
const I18N = (() => {
  let isTurkish = true;
  const listeners = [];

  function tx(turkish, english) {
    return isTurkish ? turkish : english;
  }

  function toggle() {
    isTurkish = !isTurkish;
    listeners.forEach((fn) => fn());
  }

  // Returns an unsubscribe function, so a mounted topic can stop listening when it is torn down.
  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  function get() {
    return isTurkish;
  }

  return { tx, toggle, onChange, get };
})();
