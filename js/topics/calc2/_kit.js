// Calculus II kit: small helpers shared by the "Hesap II" tabs (polynomial algebra, exact fractions, regions, tab factory).
// A tab spec: { id, title:[tr,en], concept:[tr,en], modes?:[[tr,en]..], regions?:'poly'|array, sliderCap:[tr,en],
//   range(p)->[lo,hi], statement(p), steps(p)->string[], draw(canvas,p), exact(p)->number, num(p)->number }.
// createProblem checks exact(p) against num(p) (Simpson) and throws on a mismatch, so a wrong closed form cannot ship.
const Calc2 = (function () {
  const tx = (a, b) => I18N.tx(a, b);
  const SUPS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const SUBS = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '-': '₋' };
  const map = (n, m) => String(n).replace(/[0-9-]/g, (c) => m[c]);
  const sup = (n) => map(n, SUPS), sub = (n) => map(n, SUBS);
  const neg = (s) => String(s).replace(/-/g, '−');
  const N2 = (v) => neg(fmt2(v));
  // ---- polynomials as coefficient arrays [c0, c1, c2, ...] ----
  const pEval = (c, x) => c.reduceRight((s, a) => s * x + a, 0);
  const pMul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const pAdd = (a, b, s) => { const n = Math.max(a.length, b.length), r = []; for (let i = 0; i < n; i++) r.push((a[i] || 0) + (s || 1) * (b[i] || 0)); return r; };
  const pInt = (c) => [0, ...c.map((v, i) => v / (i + 1))];
  const pDer = (c) => c.slice(1).map((v, i) => v * (i + 1));
  const pX = [0, 1];
  function pStr(c, v) {
    v = v || 'x';
    let out = '';
    for (let i = c.length - 1; i >= 0; i--) {
      const a = c[i];
      if (Math.abs(a) < 1e-12) continue;
      const mag = Math.abs(a), body = i === 0 ? fmt2(mag) : (Math.abs(mag - 1) < 1e-12 ? '' : fmt2(mag)) + v + (i > 1 ? sup(i) : '');
      out += out ? (a < 0 ? ' − ' : ' + ') + body : (a < 0 ? '−' : '') + body;
    }
    return out || '0';
  }
  const wrap = (c, v) => (c.filter((x) => Math.abs(x) > 1e-12).length > 1 ? '(' + pStr(c, v) + ')' : pStr(c, v));
  const simpson = (f, a, b, n) => { n = n || 4000; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
  // exact rational text of v (denominator up to 5040) or a decimal
  function frac(v) {
    for (let d = 1; d <= 5040; d++) { const n = Math.round(v * d); if (Math.abs(n / d - v) < 1e-9) return d === 1 ? neg(String(n)) : neg(String(n)) + '/' + d; }
    return N2(v);
  }
  const withPi = (v, sym) => { sym = sym === undefined ? 'π' : sym; const f = frac(v); return /\//.test(f) ? '(' + f + ')' + sym : (f === '1' ? sym : f === '−1' ? '−' + sym : f + sym); };
  // regions: f above g on [a,b], both >= 0 (so they can be spun about the x-axis); name in Turkish/English
  const REG = [
    { f: [1, 1], g: [0], a: 0, b: 3 }, { f: [4, 0, -1], g: [0], a: -2, b: 2 }, { f: [1, 0, 1], g: [0], a: 0, b: 2 }, { f: [0, 0, 1], g: [0], a: 0, b: 2 },
    { f: [2, 1], g: [0, 0, 1], a: -1, b: 2 }, { f: [0, 2], g: [0, 0, 1], a: 0, b: 2 }, { f: [1, 1], g: [0, 0, 1], a: 0, b: 1 }, { f: [4], g: [0, 0, 1], a: 0, b: 2 },
    { f: [3], g: [1, 0, 1], a: -1, b: 1 }, { f: [4, 0, -1], g: [1], a: -1, b: 1 },
  ];
  const regName = (r) => 'y = ' + pStr(r.f) + (r.g.length === 1 && r.g[0] === 0 ? '  ( y = 0 )' : '  ,  y = ' + pStr(r.g));
  const col = (canvas, name, a) => canvas._withAlpha ? canvas._withAlpha(canvas[name](), a) : canvas[name]();
  const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
  const at = (p) => { const [lo, hi] = p._range(); return lo + (hi - lo) * p.s; };

  const view = (canvas, xmax, ymax) => { const xm = Math.ceil(xmax + 0.5), ym = Math.ceil(ymax + 0.5); canvas.setViewport(-xm, xm, -ym, ym); };
  const Iexp = (a, b) => '∫' + sub(a) + sup(b);
  const bar = (a, b) => ']' + sub(a) + sup(b);

  function register(chapter, spec) {
    let selReg = null, selMode = null, sl = null;
    const syncSlider = () => { if (!sl) return; const v = sl.get(); sl.valueLabel.textContent = fmt2(v); sl.input.value = String(Math.round(Math.max(0, Math.min(1, v)) * 1000)); };
    function prep(p) { p._range = () => spec.range(p); return p; }
    function createProblem(rng) {
      const nm = spec.modes ? spec.modes.length : 1;
      const list = spec.regions || REG;
      const p = prep({ mode: rng.nextInt(0, nm), ri: rng.nextInt(0, list.length), s: 0.5, reg: null });
      if (spec.pick) spec.pick(p, rng);
      p.reg = list[p.ri];
      if (spec.fix) spec.fix(p);
      const e = spec.exact(p), n = spec.num(p);
      if (!(Math.abs(e - n) <= 1e-6 * Math.max(1, Math.abs(n)))) throw new Error(spec.id + ': closed form ' + e + ' != numeric ' + n);
      if (selReg) selReg.refreshFromModel();
      if (selMode) selMode.refreshFromModel();
      return p;
    }
    function buildControls(rightCol, getProblem, h) {
      const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); };
      if (spec.modes) {
        lab(tx('Soru türü', 'Question type'));
        selMode = h.addRadioGroup({ name: spec.id + 'Mode', options: spec.modes.map((m, i) => ({ label: tx(m[0], m[1]), value: i })), get: () => getProblem().mode,
          set: (v) => { const p = getProblem(); p.mode = Number(v); if (spec.fix) spec.fix(p); } });
      }
      const list = spec.regions || REG;
      lab(tx('Bölge / eğri', 'Region / curve'));
      selReg = h.addSelect({ options: list.map((r, i) => ({ label: (spec.regName || regName)(r), value: i })), get: () => getProblem().ri,
        set: (v) => { const p = getProblem(); p.ri = Number(v); p.reg = list[p.ri]; if (spec.fix) spec.fix(p); } });
      sl = h.addSlider({ caption: tx(spec.sliderCap[0], spec.sliderCap[1]), min: 0, max: 1, step: 0.05, get: () => getProblem().s, set: (v) => { getProblem().s = v; } });
    }
    Topics.register(chapter, {
      id: spec.id,
      tabTitle: () => tx(spec.title[0], spec.title[1]),
      concept: () => tx(spec.concept[0], spec.concept[1]),
      problemStatement: (p) => spec.statement(prep(p)),
      createProblem,
      solveSteps: (p) => spec.steps(prep(p)),
      draw: (c, p) => spec.draw(c, prep(p)),
      buildControls,
      view3d: spec.view3d,
      links: (spec.links || []).map((l) => ({ match: l.match, make: (rng) => {
        const p = createProblem(rng), list = spec.regions || REG;
        if (l.mode !== undefined) p.mode = Array.isArray(l.mode) ? l.mode[rng.nextInt(0, l.mode.length)] : l.mode;
        if (l.region) { const idx = list.map((r, i) => i).filter((i) => l.region(list[i])); if (idx.length) { p.ri = idx[rng.nextInt(0, idx.length)]; p.reg = list[p.ri]; } }
        if (spec.fix) spec.fix(p);
        p.s = 0.5;
        return p;
      } })),
    });
  }
  return { tx, sup, sub, neg, N2, pEval, pMul, pAdd, pInt, pDer, pX, pStr, wrap, simpson, frac, withPi, REG, regName, col, safe, at, view, Iexp, bar, register };
})();
