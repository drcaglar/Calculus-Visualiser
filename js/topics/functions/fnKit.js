// Ported from Modules/Functions/FnTabs1.vb's shared "FnKit" module. Plain functions on a
// window-visible object (no IIFE) so every js/topics/functions/*.js file can call FnKit.* directly.
// Only the helpers actually used by the ported controls (Sg, Suffix, N2, DomainText/Boundary) exist
// in the VB source - there is no Sup/IPow/PolyStr/EvalPoly in FnTabs1.vb, so none are ported here.

const FnKit = {
  // Link helper: draw problems from the tab's own generator until one satisfies pred (forces a sub-topic).
  until(gen, rng, pred) {
    let p = gen(rng);
    for (let i = 0; i < 400 && !pred(p); i++) p = gen(rng);
    return p;
  },

  // "+ 3" or "- 3" (for writing "x + 3" / "x - 3"). Mirrors VB FnKit.Sg.
  sg(v) {
    return v >= 0 ? `+ ${fmt2(v)}` : `- ${fmt2(Math.abs(v))}`;
  },

  // " + 3" / " - 3", or an empty string when v = 0. Mirrors VB FnKit.Suffix.
  suffix(v) {
    return Math.abs(v) < 0.0000001 ? '' : ' ' + FnKit.sg(v);
  },

  // Mirrors VB FnKit.N2 (v.ToString("0.##")) - same behaviour as graph.js's fmt2.
  n2(v) {
    return fmt2(v);
  },

  // Natural domain of f found numerically on [-10, 10]: writes intervals such as "[0, ∞)" or
  // "(-∞, 0) ∪ (0, ∞)". Boundaries are refined by bisection and rounded to 2 decimals.
  // Mirrors VB FnKit.DomainText (and its private Boundary helper).
  domainText(f) {
    const ok = (x) => {
      let y;
      try {
        y = f(x);
      } catch (e) {
        return false;
      }
      return !Number.isNaN(y) && Number.isFinite(y);
    };

    const boundary = (badX, goodX) => {
      let bad = badX;
      let good = goodX;
      for (let i = 0; i < 40; i++) {
        const mid = (bad + good) / 2.0;
        if (ok(mid)) good = mid; else bad = mid;
      }
      return (bad + good) / 2.0;
    };

    const lo = -10.0;
    const hi = 10.0;
    const pieces = [];
    let start = NaN;
    let prevX = lo;
    let prevOk = ok(lo);
    if (prevOk) start = lo;

    for (let i = 1; i <= 2000; i++) {
      const x = lo + (i * (hi - lo)) / 2000.0;
      const cur = ok(x);
      if (cur && !prevOk) {
        start = boundary(prevX, x);
      } else if (!cur && prevOk) {
        pieces.push([start, boundary(x, prevX)]);
        start = NaN;
      }
      prevX = x;
      prevOk = cur;
    }
    if (prevOk) pieces.push([start, hi]);
    if (pieces.length === 0) return I18N.tx('Boş küme', 'Empty set');

    const parts = [];
    for (const piece of pieces) {
      const a = piece[0];
      const b = piece[1];
      let left;
      let right;
      if (a <= lo + 0.0001) {
        left = '(-∞';
      } else {
        const ra = Math.round(a * 100) / 100;
        left = (ok(ra) ? '[' : '(') + FnKit.n2(ra);
      }
      if (b >= hi - 0.0001) {
        right = '∞)';
      } else {
        const rb = Math.round(b * 100) / 100;
        right = FnKit.n2(rb) + (ok(rb) ? ']' : ')');
      }
      parts.push(`${left}, ${right}`);
    }
    return parts.join(' ∪ ');
  },
};
