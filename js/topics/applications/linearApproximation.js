// Linear Approximation & Differentials (chapter 'applications'). Port of Modules/Applications/LinearApproximationControl.vb, extended.
// problem = { kind, ...params, dx, zoom }
//   estimates : sqrt (sqrt(r^2+dx)), cbrt (cbrt(r^3+dx)), trig (sin/cos/tan of base+dθ degrees), ln (ln(1+dx)),
//               exp (e^dx), power ((1+dx)^k)
//   linearize : lin (sub: cubic | sqrt | recip | sinkx)  -> find L(x), estimate f(a+dx), over/under?
//   errors    : diff (sub: sphere | circle | cube | cyl)  -> dV or dA from a measurement error dr, relative error
// The dx slider moves the step (kind-specific range); the zoom slider zooms around a so the error sliver vanishes.
// All stated results are exact (or computed from exact values); decimals are rounded and marked with ≈.
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(Math.abs(n) < 1e-12 ? 0 : n));
  const co = (a) => (a === 1 ? '' : String(a));
  function dec(v, d) {
    if (!isFinite(v)) return { s: Tx('tanımsız', 'not defined'), ex: false };
    const dd = d === undefined ? 6 : d;
    let s = v.toFixed(dd);
    const ex = Math.abs(v - parseFloat(s)) < 1e-9;
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return { s: M(s), ex };
  }
  const nf = (v, d) => dec(v, d).s;
  const eq = (v, d) => { const r = dec(v, d); return (r.ex ? ' = ' : ' ≈ ') + r.s; };
  function poly(terms) {
    let s = '';
    terms.forEach((t) => {
      const c = t[0], l = t[1];
      if (Math.abs(c) < 1e-12) return;
      const ab = Math.abs(c);
      const abS = nf(ab);
      const body = l === '' ? abS : (ab === 1 ? l : abS + l);
      if (s === '') s = (c < 0 ? '−' : '') + body; else s += (c < 0 ? ' − ' : ' + ') + body;
    });
    return s || '0';
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
  function fracS(n, d) { const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? String(n) : n + '/' + d; }
  const pk = (k) => (k === 0 ? '' : (k < 0 ? ' − ' + (-k) : ' + ' + k));
  function Hdr(n, text) { return '── ' + n + ') ' + text + ' ──'; }
  const SQ3 = Math.sqrt(3), SQ2 = Math.sqrt(2);

  // ---------- state ----------
  let forcedKind = 'random';
  let dxRow = null;      // custom dx slider row
  let offLang = null;

  const KINDS = ['sqrt', 'cbrt', 'trig', 'ln', 'exp', 'power', 'lin', 'diff'];
  function kindLabel(k) {
    switch (k) {
      case 'sqrt': return Tx('Tahmin: √(r² + dx)', 'Estimate: √(r² + dx)');
      case 'cbrt': return Tx('Tahmin: ∛(r³ + dx)', 'Estimate: ∛(r³ + dx)');
      case 'trig': return Tx('Tahmin: sin / cos / tan (derece)', 'Estimate: sin / cos / tan (degrees)');
      case 'ln': return Tx('Tahmin: ln(1 + dx)', 'Estimate: ln(1 + dx)');
      case 'exp': return Tx('Tahmin: e^dx', 'Estimate: e^dx');
      case 'power': return Tx('Tahmin: (1 + dx)ᵏ', 'Estimate: (1 + dx)ᵏ');
      case 'lin': return Tx('Doğrusallaştırma L(x) bulma', 'Finding the linearization L(x)');
      case 'diff': return Tx('Ölçüm hatası ve diferansiyel', 'Measurement error & differentials');
      default: return Tx('Rastgele', 'Random');
    }
  }

  const TRIG = {
    sin: { 30: { f: '1/2', fv: 0.5, d: '√3/2', dv: SQ3 / 2 }, 45: { f: '√2/2', fv: SQ2 / 2, d: '√2/2', dv: SQ2 / 2 }, 60: { f: '√3/2', fv: SQ3 / 2, d: '1/2', dv: 0.5 } },
    cos: { 30: { f: '√3/2', fv: SQ3 / 2, d: '−1/2', dv: -0.5 }, 45: { f: '√2/2', fv: SQ2 / 2, d: '−√2/2', dv: -SQ2 / 2 }, 60: { f: '1/2', fv: 0.5, d: '−√3/2', dv: -SQ3 / 2 } },
    tan: { 30: { f: '√3/3', fv: SQ3 / 3, d: '4/3', dv: 4 / 3 }, 45: { f: '1', fv: 1, d: '2', dv: 2 }, 60: { f: '√3', fv: SQ3, d: '4', dv: 4 } },
  };

  function createProblem(rng, kindArg) {
    const kind = kindArg || (forcedKind === 'random' ? rng.pick(KINDS) : forcedKind);
    const p = { kind, zoom: 0 };
    const I = (a, b) => rng.nextInt(a, b + 1);
    switch (kind) {
      case 'sqrt': p.r = I(2, 10); p.dx = rng.pick([-1, -0.5, -0.2, 0.2, 0.5, 1, 2]); break;
      case 'cbrt': p.r = I(2, 5); p.dx = rng.pick([-1, -0.5, 0.5, 1, 2, 3]); break;
      case 'trig': p.fn = rng.pick(['sin', 'cos', 'tan']); p.base = rng.pick([30, 45, 60]); p.dx = rng.pick([-3, -2, -1, 1, 2, 3]); break;
      case 'ln': p.dx = rng.pick([-0.1, -0.05, 0.02, 0.05, 0.1, 0.2]); break;
      case 'exp': p.dx = rng.pick([-0.1, -0.05, 0.02, 0.05, 0.1, 0.2]); break;
      case 'power': p.k = rng.pick([-2, -1, 3, 4, 5, 10]); p.dx = rng.pick([-0.02, -0.01, 0.01, 0.02, 0.03]); break;
      case 'lin': {
        p.sub = rng.pick(['cubic', 'sqrt', 'recip', 'sinkx']);
        if (p.sub === 'cubic') { p.m = I(1, 4); p.c = I(-3, 3); p.a = rng.pick([-1, 1, 2]); p.dx = rng.pick([-0.2, -0.1, 0.1, 0.2]); }
        else if (p.sub === 'sqrt') { p.r = I(2, 4); p.a = rng.pick([0, 1, 2, 5]); p.dx = rng.pick([-0.4, -0.2, 0.2, 0.4]); }
        else if (p.sub === 'recip') { p.q = rng.pick([2, 4, 5]); p.a = I(0, 3); p.dx = rng.pick([-0.2, -0.1, 0.1, 0.2]); }
        else { p.k = rng.pick([2, 3, 4]); p.dx = rng.pick([-0.2, -0.1, 0.1, 0.2]); }
        break;
      }
      default: {
        p.sub = rng.pick(['sphere', 'circle', 'cube', 'cyl']);
        p.r = rng.pick([5, 8, 10, 12, 20]); p.h = I(2, 6);
        p.dx = rng.pick([-0.2, -0.1, 0.05, 0.1, 0.2]);
      }
    }
    syncDx(p);
    return p;
  }

  // ---------- model ----------
  // returns { f, df, d2, a, H0, range:{min,max,step}, ... text pieces }
  function spec(p) {
    const sp = {};
    const rangeAround = (mx, st) => ({ min: -mx, max: mx, step: st });
    switch (p.kind) {
      case 'sqrt': {
        const r = p.r, a = r * r;
        sp.f = (x) => (x >= 0 ? Math.sqrt(x) : NaN); sp.df = (x) => 1 / (2 * Math.sqrt(x)); sp.d2 = (x) => -1 / (4 * Math.pow(x, 1.5));
        sp.a = a; sp.H0 = Math.max(3 * Math.abs(p.dx), 0.3 * a, 1.5);
        sp.fS = 'f(x) = √x'; sp.dfS = 'f′(x) = 1/(2√x)'; sp.d2S = 'f″(x) = −1/(4x√x)';
        sp.faS = '√' + a + ' = ' + r; sp.fa = r; sp.dfaS = '1/(2√' + a + ') = 1/' + 2 * r; sp.dfa = 1 / (2 * r);
        sp.baseS = String(a); sp.targetS = '√' + nf(a + p.dx);
        sp.xT = a + p.dx;
        sp.range = rangeAround(2, 0.1); break;
      }
      case 'cbrt': {
        const r = p.r, a = r * r * r;
        sp.f = (x) => Math.cbrt(x); sp.df = (x) => 1 / (3 * Math.pow(Math.cbrt(x), 2)); sp.d2 = (x) => -2 / (9 * Math.pow(Math.cbrt(x), 5));
        sp.a = a; sp.H0 = Math.max(3 * Math.abs(p.dx), 0.3 * a, 2);
        sp.fS = 'f(x) = ∛x'; sp.dfS = 'f′(x) = 1/(3·∛x²)'; sp.d2S = 'f″(x) = −2/(9·∛x⁵)';
        sp.faS = '∛' + a + ' = ' + r; sp.fa = r; sp.dfaS = '1/(3·' + r + '²) = 1/' + 3 * r * r; sp.dfa = 1 / (3 * r * r);
        sp.baseS = String(a); sp.targetS = '∛' + nf(a + p.dx);
        sp.xT = a + p.dx;
        sp.range = rangeAround(3, 0.1); break;
      }
      case 'trig': {
        const fn = p.fn, T = TRIG[fn][p.base], a = p.base * Math.PI / 180;
        const F = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[fn];
        const D = { sin: Math.cos, cos: (x) => -Math.sin(x), tan: (x) => 1 / Math.pow(Math.cos(x), 2) }[fn];
        const D2 = { sin: (x) => -Math.sin(x), cos: (x) => -Math.cos(x), tan: (x) => 2 * Math.tan(x) / Math.pow(Math.cos(x), 2) }[fn];
        sp.f = (x) => { const v = F(x); return Math.abs(v) < 50 ? v : NaN; }; sp.df = D; sp.d2 = D2;
        sp.a = a; sp.dxModel = p.dx * Math.PI / 180; sp.H0 = Math.max(0.35, 3 * Math.abs(sp.dxModel));
        sp.fS = 'f(x) = ' + fn + ' x'; sp.dfS = 'f′(x) = ' + { sin: 'cos x', cos: '−sin x', tan: 'sec² x = 1/cos² x' }[fn];
        sp.d2S = 'f″(x) = ' + { sin: '−sin x', cos: '−cos x', tan: '2 tan x sec² x' }[fn];
        sp.faS = fn + ' ' + p.base + '° = ' + T.f; sp.fa = T.fv;
        sp.dfaS = { sin: 'cos ' + p.base + '°', cos: '−sin ' + p.base + '°', tan: 'sec² ' + p.base + '°' }[fn] + ' = ' + T.d; sp.dfa = T.dv;
        sp.baseS = p.base + '°'; sp.targetS = fn + ' ' + nf(p.base + p.dx) + '°';
        sp.xT = a + sp.dxModel;
        sp.range = rangeAround(3, 0.5); sp.degrees = true; break;
      }
      case 'ln': {
        sp.f = (x) => (x > 0 ? Math.log(x) : NaN); sp.df = (x) => 1 / x; sp.d2 = (x) => -1 / (x * x);
        sp.a = 1; sp.H0 = Math.max(0.5, 3 * Math.abs(p.dx));
        sp.fS = 'f(x) = ln x'; sp.dfS = 'f′(x) = 1/x'; sp.d2S = 'f″(x) = −1/x²';
        sp.faS = 'ln 1 = 0'; sp.fa = 0; sp.dfaS = '1/1 = 1'; sp.dfa = 1;
        sp.baseS = '1'; sp.targetS = 'ln ' + nf(1 + p.dx);
        sp.xT = 1 + p.dx;
        sp.range = rangeAround(0.3, 0.01); break;
      }
      case 'exp': {
        sp.f = (x) => Math.exp(x); sp.df = (x) => Math.exp(x); sp.d2 = (x) => Math.exp(x);
        sp.a = 0; sp.H0 = Math.max(0.5, 3 * Math.abs(p.dx));
        sp.fS = 'f(x) = eˣ'; sp.dfS = 'f′(x) = eˣ'; sp.d2S = 'f″(x) = eˣ';
        sp.faS = 'e⁰ = 1'; sp.fa = 1; sp.dfaS = 'e⁰ = 1'; sp.dfa = 1;
        sp.baseS = '0'; sp.targetS = 'e^(' + nf(p.dx) + ')';
        sp.xT = p.dx;
        sp.range = rangeAround(0.3, 0.01); break;
      }
      case 'power': {
        const k = p.k;
        sp.f = (x) => (x > 0 ? Math.pow(x, k) : NaN); sp.df = (x) => k * Math.pow(x, k - 1); sp.d2 = (x) => k * (k - 1) * Math.pow(x, k - 2);
        sp.a = 1; sp.H0 = Math.max(0.12, 3 * Math.abs(p.dx));
        sp.fS = 'f(x) = x' + (k < 0 ? '^(' + k + ')' : '^' + k); sp.dfS = 'f′(x) = ' + k + 'x^' + (k - 1 < 0 ? '(' + (k - 1) + ')' : (k - 1)); sp.d2S = 'f″(x) = ' + k * (k - 1) + 'x^' + (k - 2 < 0 ? '(' + (k - 2) + ')' : (k - 2));
        sp.faS = '1^' + (k < 0 ? '(' + k + ')' : k) + ' = 1'; sp.fa = 1; sp.dfaS = k + '·1 = ' + k; sp.dfa = k;
        sp.baseS = '1'; sp.targetS = '(' + nf(1 + p.dx) + ')^' + (k < 0 ? '(' + k + ')' : k);
        sp.xT = 1 + p.dx;
        sp.range = { min: -0.05, max: 0.05, step: 0.005 };
        if (Math.abs(k) >= 5) sp.range = { min: -0.03, max: 0.03, step: 0.005 };
        break;
      }
      case 'lin': {
        sp.H0 = 1.5;
        if (p.sub === 'cubic') {
          const m = p.m, c = p.c, a = p.a;
          sp.f = (x) => x * x * x - m * x + c; sp.df = (x) => 3 * x * x - m; sp.d2 = (x) => 6 * x;
          sp.a = a; sp.fS = 'f(x) = ' + poly([[1, 'x³'], [-m, 'x'], [c, '']]); sp.dfS = 'f′(x) = ' + poly([[3, 'x²'], [-m, '']]); sp.d2S = 'f″(x) = 6x';
          sp.faS = 'f(' + S(a) + ') = ' + S(sp.f(a)); sp.fa = sp.f(a); sp.dfaS = 'f′(' + S(a) + ') = ' + S(sp.df(a)); sp.dfa = sp.df(a);
        } else if (p.sub === 'sqrt') {
          const r = p.r, a = p.a, k = r * r - a;
          sp.f = (x) => (x + k >= 0 ? Math.sqrt(x + k) : NaN); sp.df = (x) => 1 / (2 * Math.sqrt(x + k)); sp.d2 = (x) => -1 / (4 * Math.pow(x + k, 1.5));
          sp.a = a; sp.fS = 'f(x) = √(x' + pk(k) + ')'; sp.dfS = 'f′(x) = 1/(2√(x' + pk(k) + '))'; sp.d2S = 'f″(x) = −1/(4(x' + pk(k) + ')√(x' + pk(k) + '))';
          sp.faS = 'f(' + a + ') = √' + r * r + ' = ' + r; sp.fa = r; sp.dfaS = 'f′(' + a + ') = 1/(2·' + r + ') = 1/' + 2 * r; sp.dfa = 1 / (2 * r);
          sp.k = k;
        } else if (p.sub === 'recip') {
          const q = p.q, a = p.a, k = q - a;
          sp.f = (x) => (Math.abs(x + k) > 1e-9 ? 1 / (x + k) : NaN); sp.df = (x) => -1 / ((x + k) * (x + k)); sp.d2 = (x) => 2 / Math.pow(x + k, 3);
          sp.a = a; sp.fS = 'f(x) = 1/(x' + pk(k) + ')'; sp.dfS = 'f′(x) = −1/(x' + pk(k) + ')²'; sp.d2S = 'f″(x) = 2/(x' + pk(k) + ')³';
          sp.faS = 'f(' + a + ') = 1/' + q; sp.fa = 1 / q; sp.dfaS = 'f′(' + a + ') = −1/' + q * q; sp.dfa = -1 / (q * q);
          sp.k = k;
        } else {
          const k = p.k;
          sp.f = (x) => Math.sin(k * x); sp.df = (x) => k * Math.cos(k * x); sp.d2 = (x) => -k * k * Math.sin(k * x);
          sp.a = 0; sp.fS = 'f(x) = sin(' + k + 'x)'; sp.dfS = 'f′(x) = ' + k + 'cos(' + k + 'x)'; sp.d2S = 'f″(x) = −' + k * k + 'sin(' + k + 'x)';
          sp.faS = 'f(0) = sin 0 = 0'; sp.fa = 0; sp.dfaS = 'f′(0) = ' + k + 'cos 0 = ' + k; sp.dfa = k;
        }
        sp.baseS = String(sp.a); sp.xT = sp.a + p.dx;
        sp.range = rangeAround(0.5, 0.05); break;
      }
      default: { // diff
        const r = p.r, h = p.h;
        sp.a = r; sp.H0 = Math.max(0.25 * r, 3 * Math.abs(p.dx));
        sp.range = { min: -0.05 * r, max: 0.05 * r, step: r >= 10 ? 0.05 : 0.01 };
        sp.isDiff = true;
        if (p.sub === 'sphere') {
          sp.f = (x) => 4 * Math.PI * x * x * x / 3; sp.df = (x) => 4 * Math.PI * x * x; sp.d2 = (x) => 8 * Math.PI * x;
          sp.sym = 'V'; sp.fS = 'V(r) = (4/3)πr³'; sp.dfS = 'V′(r) = 4πr²'; sp.pw = 3; sp.cf = (x) => 4 * x * x; sp.what = Tx('küre hacmi', 'sphere volume'); sp.unit = 'cm³'; sp.nameTR = 'kürenin'; sp.nameEN = 'sphere';
          sp.pi = true; sp.vS = 'V = (4/3)π·' + r + '³'; sp.vEx = fracS(4 * r * r * r, 3) + 'π'; sp.nounTR = 'küre'; sp.nounEN = 'sphere';
        } else if (p.sub === 'circle') {
          sp.f = (x) => Math.PI * x * x; sp.df = (x) => 2 * Math.PI * x; sp.d2 = () => 2 * Math.PI;
          sp.sym = 'A'; sp.fS = 'A(r) = πr²'; sp.dfS = 'A′(r) = 2πr'; sp.pw = 2; sp.cf = (x) => 2 * x; sp.what = Tx('dairenin alanı', 'circle area'); sp.unit = 'cm²'; sp.nameTR = 'dairenin'; sp.nameEN = 'circle';
          sp.pi = true; sp.vS = 'A = π·' + r + '²'; sp.vEx = (r * r) + 'π'; sp.nounTR = 'daire'; sp.nounEN = 'circle';
        } else if (p.sub === 'cube') {
          sp.f = (x) => x * x * x; sp.df = (x) => 3 * x * x; sp.d2 = (x) => 6 * x;
          sp.sym = 'V'; sp.fS = 'V(s) = s³'; sp.dfS = 'V′(s) = 3s²'; sp.pw = 3; sp.cf = (x) => 3 * x * x; sp.what = Tx('küp hacmi', 'cube volume'); sp.unit = 'cm³'; sp.nameTR = 'küpün'; sp.nameEN = 'cube';
          sp.pi = false; sp.vS = 'V = ' + r + '³'; sp.vEx = String(r * r * r); sp.nounTR = 'küp'; sp.nounEN = 'cube';
        } else {
          sp.f = (x) => Math.PI * x * x * h; sp.df = (x) => 2 * Math.PI * x * h; sp.d2 = () => 2 * Math.PI * h;
          sp.sym = 'V'; sp.fS = 'V(r) = πr²·' + h; sp.dfS = 'V′(r) = 2πr·' + h; sp.pw = 2; sp.cf = (x) => 2 * x * h; sp.what = Tx('silindir hacmi', 'cylinder volume'); sp.unit = 'cm³'; sp.nameTR = 'silindirin'; sp.nameEN = 'cylinder';
          sp.pi = true; sp.vS = 'V = π·' + r + '²·' + h; sp.vEx = (r * r * h) + 'π'; sp.nounTR = 'silindir'; sp.nounEN = 'cylinder';
        }
        sp.xName = p.sub === 'cube' ? 's' : 'r';
        sp.xT = r + p.dx;
        sp.fa = sp.f(r); sp.dfa = sp.df(r);
        sp.baseS = String(r);
      }
    }
    return sp;
  }

  function syncDx(p) {
    if (!dxRow) return;
    const sp = spec(p), rg = sp.range;
    dxRow.captionEl.textContent = p.kind === 'diff' ? Tx('Ölçüm hatası dx', 'Measurement error dx') : p.kind === 'trig' ? Tx('Açı değişimi dθ (derece)', 'Angle change dθ (degrees)') : Tx('Adım büyüklüğü dx', 'Step size dx');
    dxRow.valueEl.textContent = nf(p.dx, 4);
    const ratio = (p.dx - rg.min) / (rg.max - rg.min);
    dxRow.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
  }

  function clampDx(p, v) {
    const rg = spec(p).range;
    v = Math.round(v / rg.step) * rg.step;
    v = Math.max(rg.min, Math.min(rg.max, v));
    v = Math.round(v * 1e6) / 1e6;
    if (Math.abs(v) < 1e-9) v = rg.step;
    return v;
  }

  // ---------- statement ----------
  function problemStatement(p) {
    const sp = spec(p);
    switch (p.kind) {
      case 'sqrt': case 'cbrt':
        return Tx(sp.targetS + ' değerini doğrusal yaklaşımla (taban noktası a = ' + sp.baseS + ') tahmin edin ve tahmini gerçek değerle karşılaştırın. Tahmin fazla mı, eksik mi?',
          'Estimate ' + sp.targetS + ' by linear approximation (base point a = ' + sp.baseS + ') and compare the estimate with the true value. Is it an over- or an underestimate?');
      case 'trig':
        return Tx(sp.targetS + ' değerini doğrusal yaklaşımla (taban açısı a = ' + sp.baseS + ') tahmin edin; açıyı radyana çevirmeyi unutmayın. Tahmini hesap makinesi değeriyle karşılaştırın.',
          'Estimate ' + sp.targetS + ' by linear approximation (base angle a = ' + sp.baseS + '); remember to convert the angle to radians. Compare the estimate with the calculator value.');
      case 'ln':
        return Tx(sp.targetS + ' değerini f(x) = ln x fonksiyonunun a = 1 noktasındaki doğrusallaştırmasıyla tahmin edin ve gerçek değerle karşılaştırın.', 'Estimate ' + sp.targetS + ' with the linearization of f(x) = ln x at a = 1 and compare with the true value.');
      case 'exp':
        return Tx(sp.targetS + ' değerini f(x) = eˣ fonksiyonunun a = 0 noktasındaki doğrusallaştırmasıyla tahmin edin ve gerçek değerle karşılaştırın.', 'Estimate ' + sp.targetS + ' with the linearization of f(x) = eˣ at a = 0 and compare with the true value.');
      case 'power':
        return Tx(sp.targetS + ' değerini f(x) = xᵏ fonksiyonunun a = 1 noktasındaki doğrusallaştırmasıyla (k = ' + p.k + ') tahmin edin; tahmini gerçek değerle karşılaştırın.', 'Estimate ' + sp.targetS + ' with the linearization of f(x) = xᵏ at a = 1 (k = ' + p.k + ') and compare with the true value.');
      case 'lin':
        return Tx(sp.fS + ' fonksiyonunun a = ' + S(sp.a) + ' noktasındaki doğrusallaştırması L(x)\'i bulun. L ile f(' + nf(sp.xT) + ') değerini tahmin edin (dx = ' + nf(p.dx) + '), tahminin fazla mı eksik mi olduğunu belirleyin ve gerçek değerle karşılaştırın.',
          'Find the linearization L(x) of ' + sp.fS + ' at a = ' + S(sp.a) + '. Use L to estimate f(' + nf(sp.xT) + ') (dx = ' + nf(p.dx) + '), decide whether the estimate is too high or too low, and compare with the true value.');
      default: {
        const X = sp.xName, cyl = p.sub === 'cyl';
        return Tx('Bir ' + sp.nounTR + ' için ' + (X === 's' ? 'kenar uzunluğu' : 'yarıçap') + ' ' + X + ' = ' + p.r + ' cm ölçülüyor' + (cyl ? ' (yükseklik h = ' + p.h + ' cm sabit)' : '') + '; ölçüm hatası d' + X + ' = ' + nf(p.dx) + ' cm. ' + sp.what + ' için hatayı diferansiyelle tahmin edin, bağıl hatayı yüzde olarak bulun ve gerçek değişimle karşılaştırın.',
          'For a ' + sp.nounEN + ' the ' + (X === 's' ? 'side length' : 'radius') + ' ' + X + ' = ' + p.r + ' cm is measured' + (cyl ? ' (height h = ' + p.h + ' cm fixed)' : '') + '; the measurement error is d' + X + ' = ' + nf(p.dx) + ' cm. Estimate the error in the ' + sp.what + ' with a differential, find the relative error as a percentage, and compare with the actual change.');
      }
    }
  }

  // ---------- steps ----------
  function overUnder(sp, dx) {
    const d2 = sp.d2(sp.a);
    if (Math.abs(d2) < 1e-9) return 0;
    return d2 < 0 ? 1 : -1; // +1 overestimate (tangent above curve), -1 underestimate
  }

  function solveSteps(p) {
    const sp = spec(p), st = [];
    let n = 0;
    const H = (tr, en) => st.push(Hdr(++n, Tx(tr, en)));
    const T = (tr, en) => st.push(Tx(tr, en));
    const dxM = sp.dxModel !== undefined ? sp.dxModel : p.dx;       // dx in model units (radians for trig)
    const a = sp.a, fa = sp.fa, dfa = sp.dfa;
    const f = sp.f(a + dxM), L = fa + dfa * dxM;
    const dy = dfa * dxM, dY = f - fa;

    if (sp.isDiff) {
      const r = p.r, sym = sp.sym, X = sp.xName;
      H('Modeli yaz', 'Write the model');
      T('Ölçülen büyüklük ' + X + ' = ' + r + ' cm, ölçüm hatası d' + X + ' = ' + nf(p.dx) + ' cm. İstenen: ' + sp.what + '. Model: ' + sp.fS + '.', 'Measured quantity ' + X + ' = ' + r + ' cm, measurement error d' + X + ' = ' + nf(p.dx) + ' cm. Wanted: the ' + sp.what + '. Model: ' + sp.fS + '.');
      T('Başlangıç değeri: ' + sp.vS + (sp.pi ? ' = ' + sp.vEx + ' ≈ ' : ' = ') + nf(sp.fa, 4) + ' ' + sp.unit + '.', 'Base value: ' + sp.vS + (sp.pi ? ' = ' + sp.vEx + ' ≈ ' : ' = ') + nf(sp.fa, 4) + ' ' + sp.unit + '.');
      H('Diferansiyel formülü', 'The differential formula');
      T('d' + sym + ' = ' + sym + '′(' + X + ')·d' + X + '; ' + sp.dfS + ' olduğundan d' + sym + ' = (' + sp.dfS.split(' = ')[1] + ')·d' + X + '.', 'd' + sym + ' = ' + sym + '′(' + X + ')·d' + X + '; since ' + sp.dfS + ', d' + sym + ' = (' + sp.dfS.split(' = ')[1] + ')·d' + X + '.');
      H('Sayıları yerleştir', 'Insert the numbers');
      const coef = sp.cf(r) * p.dx;
      T('d' + sym + ' = ' + (sp.pi ? 'π·' : '') + nf(sp.cf(r), 4) + '·(' + nf(p.dx) + ')' + ' = ' + (sp.pi ? nf(coef, 4) + 'π ' + '≈ ' + nf(dy, 4) : nf(coef, 4)) + ' ' + sp.unit + '.',
        'd' + sym + ' = ' + (sp.pi ? 'π·' : '') + nf(sp.cf(r), 4) + '·(' + nf(p.dx) + ')' + ' = ' + (sp.pi ? nf(coef, 4) + 'π ' + '≈ ' + nf(dy, 4) : nf(coef, 4)) + ' ' + sp.unit + '.');
      H('Bağıl ve yüzde hata', 'Relative and percentage error');
      const rel = sp.pw * p.dx / r;
      T('d' + sym + '/' + sym + ' = ' + sp.pw + '·d' + X + '/' + X + ' (çünkü ' + sym + ' ∝ ' + X + (sp.pw === 2 ? '²' : '³') + ') = ' + sp.pw + '·(' + nf(p.dx) + ')/' + r + eq(rel, 6) + ' ⇒ ' + nf(rel * 100, 4) + ' %.',
        'd' + sym + '/' + sym + ' = ' + sp.pw + '·d' + X + '/' + X + ' (since ' + sym + ' ∝ ' + X + (sp.pw === 2 ? '²' : '³') + ') = ' + sp.pw + '·(' + nf(p.dx) + ')/' + r + eq(rel, 6) + ' ⇒ ' + nf(rel * 100, 4) + ' %.');
      T('Yorum: ' + X + ' ölçümündeki bağıl hata ' + nf(p.dx / r * 100, 4) + ' % iken, ' + sym + ' için bağıl hata ' + sp.pw + ' katı olur: üs, hatayı büyütür.', 'Interpretation: a relative error of ' + nf(p.dx / r * 100, 4) + ' % in ' + X + ' becomes ' + sp.pw + ' times as large in ' + sym + ': the exponent magnifies the error.');
      H('Gerçek değişimle karşılaştır', 'Compare with the actual change');
      T('Δ' + sym + ' = ' + sym + '(' + nf(r + p.dx, 4) + ') − ' + sym + '(' + r + ')' + eq(dY, 4) + ' ' + sp.unit + '; d' + sym + ' = ' + nf(dy, 4) + ' ' + sp.unit + '. Fark |Δ' + sym + ' − d' + sym + '| ≈ ' + nf(Math.abs(dY - dy), 4) + ' ≈ ½|' + sym + '″|·d' + X + '² = ' + nf(0.5 * Math.abs(sp.d2(r)) * p.dx * p.dx, 4) + ' ' + sp.unit + ' (küçük).',
        'Δ' + sym + ' = ' + sym + '(' + nf(r + p.dx, 4) + ') − ' + sym + '(' + r + ')' + eq(dY, 4) + ' ' + sp.unit + '; d' + sym + ' = ' + nf(dy, 4) + ' ' + sp.unit + '. The difference |Δ' + sym + ' − d' + sym + '| ≈ ' + nf(Math.abs(dY - dy), 4) + ' ≈ ½|' + sym + '″|·d' + X + '² = ' + nf(0.5 * Math.abs(sp.d2(r)) * p.dx * p.dx, 4) + ' ' + sp.unit + ' (small).');
      return st;
    }

    // ----- estimation / linearization kinds -----
    if (p.kind === 'lin') {
      H('Fonksiyonu ve türevlerini yaz', 'Write the function and its derivatives');
      T(sp.fS + ',   ' + sp.dfS + ',   ' + sp.d2S + '.', sp.fS + ',   ' + sp.dfS + ',   ' + sp.d2S + '.');
      H('Taban noktasında değerler', 'Values at the base point');
      T('a = ' + S(a) + ':  ' + sp.faS + ',   ' + sp.dfaS + '.', 'a = ' + S(a) + ':  ' + sp.faS + ',   ' + sp.dfaS + '.');
      H('Doğrusallaştırma L(x)', 'The linearization L(x)');
      const slope = dfa, icpt = fa - dfa * a;
      T('L(x) = f(a) + f′(a)(x − a) = ' + nf(fa, 6) + (dfa < 0 ? ' − ' : ' + ') + nf(Math.abs(dfa), 6) + '(x' + (a === 0 ? '' : (a < 0 ? ' + ' + nf(-a) : ' − ' + nf(a))) + ')  ⇒  L(x) = ' + poly([[slope, 'x'], [icpt, '']]) + (isExactDec(slope) && isExactDec(icpt) ? '' : '  (yuvarlanmış)') + '.',
        'L(x) = f(a) + f′(a)(x − a) = ' + nf(fa, 6) + (dfa < 0 ? ' − ' : ' + ') + nf(Math.abs(dfa), 6) + '(x' + (a === 0 ? '' : (a < 0 ? ' + ' + nf(-a) : ' − ' + nf(a))) + ')  ⇒  L(x) = ' + poly([[slope, 'x'], [icpt, '']]) + (isExactDec(slope) && isExactDec(icpt) ? '' : '  (rounded)') + '.');
      H('Tahmin: x = ' + nf(sp.xT, 6), 'Estimate at x = ' + nf(sp.xT, 6));
      T('dx = x − a = ' + nf(p.dx) + '  ⇒  L(' + nf(sp.xT) + ') = ' + nf(fa) + ' + (' + nf(dfa) + ')(' + nf(p.dx) + ')' + eq(L) + '.', 'dx = x − a = ' + nf(p.dx) + '  ⇒  L(' + nf(sp.xT) + ') = ' + nf(fa) + ' + (' + nf(dfa) + ')(' + nf(p.dx) + ')' + eq(L) + '.');
      commonError(sp, p, H, T, f, L, dy, dY, dxM);
      return st;
    }

    H('Fonksiyon ve taban noktası', 'Function and base point');
    T(sp.targetS + ' hesaplanacak. ' + sp.fS + ' alınır; hedef nokta x = ' + (sp.degrees ? nf(p.base + p.dx) + '°' : nf(sp.xT, 6)) + '. Taban noktası a = ' + sp.baseS + ' seçilir, çünkü f(a) ve f′(a) tam bilinir (hedefe en yakın "kolay" nokta).',
      sp.targetS + ' is to be computed. Take ' + sp.fS + '; the target point is x = ' + (sp.degrees ? nf(p.base + p.dx) + '°' : nf(sp.xT, 6)) + '. The base point a = ' + sp.baseS + ' is chosen because f(a) and f′(a) are known exactly (the nearest "easy" point).');
    if (sp.degrees) T('Açıları radyana çevir: 1° = π/180 rad ⇒ a = ' + p.base + '° = ' + (p.base === 30 ? 'π/6' : p.base === 45 ? 'π/4' : 'π/3') + ' rad, dx = ' + nf(p.dx) + '° = ' + nf(p.dx) + '·π/180 ≈ ' + nf(dxM, 6) + ' rad. (Trigonometrik yaklaşımlarda açı RADYAN olmalıdır.)',
      'Convert the angles to radians: 1° = π/180 rad ⇒ a = ' + p.base + '° = ' + (p.base === 30 ? 'π/6' : p.base === 45 ? 'π/4' : 'π/3') + ' rad, dx = ' + nf(p.dx) + '° = ' + nf(p.dx) + '·π/180 ≈ ' + nf(dxM, 6) + ' rad. (In trigonometric approximations the angle MUST be in radians.)');
    else T('dx = x − a = ' + nf(sp.xT, 6) + ' − ' + sp.baseS + ' = ' + nf(p.dx) + '.', 'dx = x − a = ' + nf(sp.xT, 6) + ' − ' + sp.baseS + ' = ' + nf(p.dx) + '.');
    H('Türev ve taban noktasındaki değerler', 'Derivative and the values at the base point');
    T(sp.dfS + '.', sp.dfS + '.');
    T('f(a) = ' + sp.faS + ';   f′(a) = ' + sp.dfaS + '.', 'f(a) = ' + sp.faS + ';   f′(a) = ' + sp.dfaS + '.');
    H('Doğrusallaştırma ve tahmin', 'Linearization and estimate');
    T('L(x) = f(a) + f′(a)(x − a).  Burada L = ' + sp.faS.split(' = ').pop() + ' + (' + sp.dfaS.split(' = ').pop() + ')·dx.', 'L(x) = f(a) + f′(a)(x − a).  Here L = ' + sp.faS.split(' = ').pop() + ' + (' + sp.dfaS.split(' = ').pop() + ')·dx.');
    T(sp.targetS + ' ≈ L = ' + nf(fa, 6) + ' + (' + nf(dfa, 6) + ')·(' + nf(dxM, 6) + ')' + eq(L, 6) + '.', sp.targetS + ' ≈ L = ' + nf(fa, 6) + ' + (' + nf(dfa, 6) + ')·(' + nf(dxM, 6) + ')' + eq(L, 6) + '.');
    commonError(sp, p, H, T, f, L, dy, dY, dxM);
    return st;
  }

  function isExactDec(v) { return Math.abs(v - Math.round(v * 1e6) / 1e6) < 1e-9; }

  function commonError(sp, p, H, T, f, L, dy, dY, dxM) {
    H('Gerçek değer, hata ve yorum', 'True value, error and interpretation');
    const ou = overUnder(sp);
    T('Gerçek değer (hesap makinesi): ' + (p.kind === 'lin' ? 'f(' + nf(sp.xT) + ')' : sp.targetS) + ' ≈ ' + nf(f, 6) + '.  Hata = L − f ≈ ' + nf(L - f, 6) + '  (bağıl hata ≈ ' + nf(Math.abs((L - f) / f) * 100, 4) + ' %).',
      'True value (calculator): ' + (p.kind === 'lin' ? 'f(' + nf(sp.xT) + ')' : sp.targetS) + ' ≈ ' + nf(f, 6) + '.  Error = L − f ≈ ' + nf(L - f, 6) + '  (relative error ≈ ' + nf(Math.abs((L - f) / f) * 100, 4) + ' %).');
    const d2a = sp.d2(sp.a);
    const actualOver = (L - f) > 0, consistent = Math.abs(L - f) > 1e-12 && ((ou > 0) === actualOver);
    if (ou === 0) {
      T('f″(a) = 0: eğri a noktasında bükey yön değiştirir (büküm), teğet eğriye çok iyi uyar; fark ikinci değil üçüncü mertebeden (≈ dx³) küçülür. Gerçek hata: ' + nf(Math.abs(f - L), 8) + '.',
        'f″(a) = 0: the curve changes concavity at a (inflection), so the tangent fits very well; the gap shrinks to third order (≈ dx³) instead of second. Actual error: ' + nf(Math.abs(f - L), 8) + '.');
    } else {
      if (ou > 0) {
        T('f″(a) = ' + nf(d2a, 6) + ' < 0 ⇒ eğri AŞAĞI bükeydir, teğet eğrinin ÜSTÜNDE kalır ⇒ L, f fonksiyonunu FAZLA tahmin eder (tahmin gerçek değerden büyük)' + (consistent ? ' — sayısal sonuç da bunu doğrular.' : '.'),
          'f″(a) = ' + nf(d2a, 6) + ' < 0 ⇒ the curve is concave DOWN, the tangent lies ABOVE it ⇒ L OVERestimates f (the estimate exceeds the true value)' + (consistent ? ' — the numbers confirm this.' : '.'));
      } else {
        T('f″(a) = ' + nf(d2a, 6) + ' > 0 ⇒ eğri YUKARI bükeydir, teğet eğrinin ALTINDA kalır ⇒ L, f fonksiyonunu EKSİK tahmin eder (tahmin gerçek değerden küçük)' + (consistent ? ' — sayısal sonuç da bunu doğrular.' : '.'),
          'f″(a) = ' + nf(d2a, 6) + ' > 0 ⇒ the curve is concave UP, the tangent lies BELOW it ⇒ L UNDERestimates f (the estimate is below the true value)' + (consistent ? ' — the numbers confirm this.' : '.'));
      }
      T('Hata kestirimi: |f − L| ≈ ½|f″(a)|·dx² = ' + nf(0.5 * Math.abs(d2a) * dxM * dxM, 8) + ' (gerçek hata ' + nf(Math.abs(f - L), 8) + '). Hata dx değerinin KARESİYLE küçülür: dx yarıya inerse hata dörtte birine düşer.',
        'Error estimate: |f − L| ≈ ½|f″(a)|·dx² = ' + nf(0.5 * Math.abs(d2a) * dxM * dxM, 8) + ' (actual error ' + nf(Math.abs(f - L), 8) + '). The error shrinks with dx SQUARED: halve dx and the error drops to a quarter.');
    }
    H('Diferansiyel diliyle', 'In the language of differentials');
    T('dy = f′(a)·dx = ' + nf(dy, 6) + ' (teğet boyunca değişim);  Δy = f(a + dx) − f(a) = ' + nf(dY, 6) + ' (gerçek değişim);  |Δy − dy| = ' + nf(Math.abs(dY - dy), 8) + '. Küçük dx için dy ≈ Δy.',
      'dy = f′(a)·dx = ' + nf(dy, 6) + ' (change along the tangent);  Δy = f(a + dx) − f(a) = ' + nf(dY, 6) + ' (actual change);  |Δy − dy| = ' + nf(Math.abs(dY - dy), 8) + '. For small dx, dy ≈ Δy.');
  }

  // ---------- concept ----------
  function concept() {
    return Tx(
      'FİKİR\n' +
      'Bir noktanın çok yakınında türevlenebilir her eğri, teğet doğrusuna çok benzer. Bu yüzden karmaşık bir fonksiyonu, ucuz hesaplanan bir doğruyla değiştirebiliriz.\n' +
      '\n' +
      'LİNEARİZASYON FORMÜLÜ\n' +
      'f, a\'da türevlenebilir ise\n' +
      '   L(x) = f(a) + f\'(a)·(x − a)        (x ≈ a için f(x) ≈ L(x))\n' +
      '\n' +
      'DİFERANSİYELLER\n' +
      'dx = Δx (bağımsız değişkendeki küçük değişim), dy = f\'(x)·dx (teğet doğrusu boyunca değişim), Δy = f(x+Δx) − f(x) (gerçek değişim). Küçük dx için dy ≈ Δy.\n' +
      'Bağıl hata: dy/y ≈ f\'(x)/f(x) · dx.\n' +
      '\n' +
      'YÖNTEM\n' +
      '   1. Bilinen, kolay hesaplanan bir a seç (x\'e yakın, f(a) ve f\'(a) kolay).\n' +
      '   2. f(a) ve f\'(a) hesapla.\n' +
      '   3. L(x) = f(a) + f\'(a)(x − a) yaz, x yerine koy.\n' +
      '   4. Hatayı yorumla: f\'\' > 0 ise teğet eğrinin ALTINDA kalır (L eksik tahmin eder), f\'\' < 0 ise ÜSTÜNDE kalır (L fazla tahmin eder).\n' +
      '\n' +
      'BİLİNEN LİNEARİZASYONLAR (x ≈ 0)\n' +
      'sin x ≈ x,  cos x ≈ 1,  eˣ ≈ 1 + x,  ln(1+x) ≈ x,  (1+x)ᵏ ≈ 1 + kx,  tan x ≈ x.\n' +
      '\n' +
      'ÖZEL DURUMLAR\n' +
      '   • Ölçüm hatası: V = V(r) ölçülen r\'den hesaplanıyorsa dV = V\'(r)·dr; bağıl hata dV/V = (V\'/V)·dr (üs n ise n·dr/r).\n' +
      '   • Hata kestirimi: |f(x) − L(x)| ≈ ½|f\'\'(a)|·(x − a)² — hata dx\'in karesiyle küçülür.\n' +
      '   • f\'\'(a) = 0 ise (ör. sin x, a = 0) teğet çok daha iyi uyar.\n' +
      '\n' +
      'TUZAKLAR\n' +
      '   • Yaklaşım yalnızca a\'ya YAKIN iyidir; uzaklaştıkça hata ikinci dereceden (≈ ½f\'\'·(x−a)²) büyür.\n' +
      '   • Trigonometrik yaklaşımlarda açı RADYAN olmalı.\n' +
      '   • a\'yı keyfi seçme: f(a) tam olarak bilinmelidir.\n' +
      '\n' +
      'MİNİ ÖRNEK\n' +
      '√4,1 ≈ ? f = √x, a = 4: f(4) = 2, f\'(4) = 1/(2√4) = 1/4. L(4,1) = 2 + 0,25·0,1 = 2,025 (gerçek 2,02485). Fonksiyon aşağı bükey olduğu için tahmin hafifçe büyüktür.\n' +
      'Ölçüm hatası: r = 10 cm yarıçaplı kürede r ölçümünde 0,1 cm hata varsa V = 4/3πr³ için dV = 4πr²dr = 4π·100·0,1 ≈ 126 cm³.\n' +
      '\n' +
      'HAFIZA İPUCU: "Yakından bakınca her düzgün eğri bir doğrudur."\n' +
      '\n' +
      'KAYDIRICILAR: dx kaydırıcısı adımı değiştirir (altın şerit = yaklaşım hatası, turuncu = dy). Yakınlaştır kaydırıcısı a etrafında yakınlaştırır; şerit kaybolur, eğri düzleşir.',
      'IDEA\n' +
      'Very close to a point, any differentiable curve looks like its tangent line. So we can replace a complicated function by a cheap-to-evaluate line.\n' +
      '\n' +
      'LINEARISATION FORMULA\n' +
      'If f is differentiable at a,\n' +
      '   L(x) = f(a) + f\'(a)·(x − a)        (for x ≈ a, f(x) ≈ L(x))\n' +
      '\n' +
      'DIFFERENTIALS\n' +
      'dx = Δx (small change in the independent variable), dy = f\'(x)·dx (change along the tangent line), Δy = f(x+Δx) − f(x) (actual change). For small dx, dy ≈ Δy.\n' +
      'Relative error: dy/y ≈ f\'(x)/f(x) · dx.\n' +
      '\n' +
      'METHOD\n' +
      '   1. Choose an easy base point a near x (f(a) and f\'(a) easy).\n' +
      '   2. Compute f(a) and f\'(a).\n' +
      '   3. Write L(x) = f(a) + f\'(a)(x − a) and substitute x.\n' +
      '   4. Interpret the error: if f\'\' > 0 the tangent lies BELOW the curve (L underestimates); if f\'\' < 0 it lies ABOVE (L overestimates).\n' +
      '\n' +
      'STANDARD LINEARISATIONS (x ≈ 0)\n' +
      'sin x ≈ x,  cos x ≈ 1,  eˣ ≈ 1 + x,  ln(1+x) ≈ x,  (1+x)ᵏ ≈ 1 + kx,  tan x ≈ x.\n' +
      '\n' +
      'SPECIAL CASES\n' +
      '   • Measurement error: if V = V(r) is computed from a measured r then dV = V\'(r)·dr; the relative error is dV/V = (V\'/V)·dr (for a power n: n·dr/r).\n' +
      '   • Error estimate: |f(x) − L(x)| ≈ ½|f\'\'(a)|·(x − a)² — the error shrinks with dx squared.\n' +
      '   • If f\'\'(a) = 0 (e.g. sin x at a = 0) the tangent fits even better.\n' +
      '\n' +
      'PITFALLS\n' +
      '   • The approximation is good only NEAR a; the error grows quadratically (≈ ½f\'\'·(x−a)²) as you move away.\n' +
      '   • Angles must be in RADIANS.\n' +
      '   • Do not choose a arbitrarily: f(a) must be known exactly.\n' +
      '\n' +
      'MINI EXAMPLE\n' +
      '√4.1 ≈ ? f = √x, a = 4: f(4) = 2, f\'(4) = 1/(2√4) = 1/4. L(4.1) = 2 + 0.25·0.1 = 2.025 (true 2.02485). Since f is concave down, the estimate is slightly high.\n' +
      'Measurement error: for a sphere with r = 10 cm and a 0.1 cm error in r, V = 4/3πr³ gives dV = 4πr²dr = 4π·100·0.1 ≈ 126 cm³.\n' +
      '\n' +
      'MEMORY AID: "Zoom in far enough and every smooth curve is a straight line."\n' +
      '\n' +
      'SLIDERS: The dx slider changes the step (gold sliver = approximation error, orange = dy). The zoom slider zooms in around a; the sliver vanishes and the curve flattens.');
  }

  // ---------- drawing ----------
  function draw(canvas, p) {
    const sp = spec(p);
    const a = sp.a, fa = sp.fa, dfa = sp.dfa;
    const dxM = sp.dxModel !== undefined ? sp.dxModel : p.dx;
    const f = (x) => { try { const v = sp.f(x); return isFinite(v) && Math.abs(v) < 1e8 ? v : NaN; } catch (e) { return NaN; } };
    const Lf = (x) => fa + dfa * (x - a);
    const H = Math.max(1e-6, sp.H0 * Math.pow(10, -1.8 * Math.max(0, Math.min(1, p.zoom))));
    const x0 = a - H, x1 = a + H;
    // y range from f and L over the window
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 120; i++) {
      const x = x0 + (x1 - x0) * i / 120;
      [f(x), Lf(x)].forEach((v) => { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    }
    if (!isFinite(lo) || !isFinite(hi)) { lo = fa - 1; hi = fa + 1; }
    let span = hi - lo; if (!(span > 1e-12)) span = 1;
    canvas.setViewport(x0, x1, lo - 0.2 * span, hi + 0.2 * span);
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3 });
    canvas.addFunction({ evaluator: Lf, color: canvas.orange(), thickness: 2, dashed: true });
    const b = a + dxM, fb = f(b), Lb = Lf(b);
    canvas.addSegment({ x1: a, y1: fa, x2: b, y2: fa, color: canvas.gray(), thickness: 1.5, dashed: true });
    if (isFinite(Lb)) canvas.addSegment({ x1: b, y1: fa, x2: b, y2: Lb, color: canvas.orange(), thickness: 2.5 });
    if (isFinite(fb) && isFinite(Lb)) canvas.addSegment({ x1: b, y1: Lb, x2: b, y2: fb, color: canvas.gold(), thickness: 4 });
    canvas.addMarker({ x: a, y: fa, color: canvas.accent(), radius: 7, label: 'a' });
    if (isFinite(fb)) canvas.addMarker({ x: b, y: fb, color: canvas.accent(), radius: 6, label: 'f' });
    if (isFinite(Lb)) canvas.addMarker({ x: b, y: Lb, color: canvas.red(), radius: 6, hollow: true, label: 'L' });
    canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gray() });
  }

  function buildControls(rightCol, getProblem, helpers) {
    helpers.addSelect({
      options: [{ label: Tx('Örnek türü: Rastgele', 'Example type: Random'), value: 'random' }].concat(KINDS.map((k) => ({ label: kindLabel(k), value: k }))),
      get: () => forcedKind,
      set: (v) => { forcedKind = String(v); helpers.regenerate(); },
    });
    // custom dx slider: range depends on the example kind
    const block = document.createElement('div');
    block.className = 'we-slider-block';
    const captionEl = document.createElement('div');
    captionEl.className = 'we-slider-caption';
    const valueEl = document.createElement('div');
    valueEl.className = 'we-slider-value';
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'we-slider';
    input.min = '0'; input.max = '1000'; input.step = '1';
    block.appendChild(captionEl); block.appendChild(valueEl); block.appendChild(input);
    rightCol.appendChild(block);
    dxRow = { block, captionEl, valueEl, input };
    input.addEventListener('input', () => {
      const pr = getProblem(), rg = spec(pr).range;
      pr.dx = clampDx(pr, rg.min + Number(input.value) / 1000 * (rg.max - rg.min));
      valueEl.textContent = nf(pr.dx, 4);
      helpers.refresh();
    });
    syncDx(getProblem());
    helpers.addSlider({
      caption: Tx('Yakınlaştır (0 = geniş, 1 = çok yakın)', 'Zoom in (0 = wide, 1 = very close)'),
      min: 0, max: 1, step: 0.01,
      get: () => getProblem().zoom,
      set: (v) => { getProblem().zoom = Math.max(0, Math.min(1, v)); },
    });
    if (offLang) offLang();
    offLang = I18N.onChange(() => syncDx(getProblem()));
  }

  Topics.register('applications', {
    id: 'linearApproximation',
    tabTitle: () => Tx('Lineer Yaklaşım ve Diferansiyeller', 'Linear Approximation & Differentials'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s*(LİNEARİZASYON FORMÜLÜ|LINEARISATION FORMULA)$/, make: (rng) => createProblem(rng, 'lin') },
      { match: /^\s*(DİFERANSİYELLER|DIFFERENTIALS)$/, make: (rng) => createProblem(rng, 'diff') },
      { match: /^\s*(BİLİNEN LİNEARİZASYONLAR|STANDARD LINEARISATIONS)/, make: (rng) => createProblem(rng, 'ln') },
      { match: /^\s*4\. (Hatayı yorumla|Interpret the error)/, make: (rng) => createProblem(rng, 'cbrt') },
      { match: /^\s*• (Ölçüm hatası|Measurement error):/, make: (rng) => createProblem(rng, 'diff') },
      { match: /^\s*• (Hata kestirimi|Error estimate):/, make: (rng) => createProblem(rng, 'sqrt') },
      { match: /^\s*• (f''\(a\) = 0 ise|If f''\(a\) = 0)/, make: (rng) => createProblem(rng, 'trig') },
    ],
    _kinds: KINDS,
    _spec: spec,
    _setKind: (k) => { forcedKind = k; },
    _setDx: (p, v) => { p.dx = clampDx(p, v); },
  });
})();
