// The Chain Rule (chapter 'derivatives'). Ported from Modules/Derivatives/ChainRuleControl.vb (x -> u = g(x) -> y = f(u),
// live readout of every link and comparison of the numeric derivative with dy/du * du/dx) and extended to worked examples.
// problem.kind: 'power' (a x+b)^n or (a x^2+b)^n | 'sqrt' | 'exp' e^g | 'ln' ln g | 'trigLin' T(kx+b) |
//               'trigPow' T(kx)^n (3 layers) | 'expTrig' e^T(kx) (3) | 'lnTrig' ln T(kx) (3) | 'powpow' ((ax+b)^2+c)^n (3) |
//               'expSqrt' e^sqrt(ax+b) (3) | 'vb' the four VB composites with a position slider (numeric readout).
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  const N = (v) => M(fmt2(v));
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (s) => { s = String(s); return (s[0] === '−' || s[0] === '-') ? '(' + s + ')' : s; };
  const PI = Math.PI;
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let t = v.toFixed(dec === undefined ? 4 : dec);
    if (t.indexOf('.') >= 0) t = t.replace(/0+$/, '').replace(/[.]$/, '');
    if (t === '-0') t = '0';
    return M(t);
  }
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const sup = (n) => (n === 1 ? '' : String(n).split('').map((c) => SUP[c] || c).join(''));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    n = n / g; d = d / g;
    if (n === 0) { n = 0; d = 1; }
    return { n, d };
  }
  const frS = (x) => (x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d);
  const frV = (x) => x.n / x.d;
  const frMul = (a, b) => fr(a.n * b.n, a.d * b.d);
  function frPow(a, e) { // integer exponent
    let r = fr(1);
    const base = e < 0 ? fr(a.d, a.n) : a;
    for (let i = 0; i < Math.abs(e); i++) r = frMul(r, base);
    return r;
  }
  const par = (s) => (/[ +−]/.test(String(s).slice(1)) ? '(' + s + ')' : s);
  const coef = (K) => (K === 1 ? '' : K === -1 ? '−' : S(K));
  const coefDot = (K) => (K === 1 ? '' : K === -1 ? '−' : S(K) + '·');
  function linStr(a, b, v) {
    v = v || 'x';
    let s = a === 0 ? '' : (a === 1 ? v : a === -1 ? '−' + v : S(a) + v);
    if (b !== 0) s += s === '' ? S(b) : (b < 0 ? ' − ' + (-b) : ' + ' + b);
    return s || '0';
  }
  function quadStr(a, c) {
    let s = (a === 1 ? '' : a === -1 ? '−' : S(a)) + 'x²';
    if (c !== 0) s += c < 0 ? ' − ' + (-c) : ' + ' + c;
    return s;
  }

  // ---------- exact trig (surds) ----------
  function E(n, d, r) {
    if (r === 4) { n *= 2; r = 1; } else if (r === 9) { n *= 3; r = 1; }
    if (n === 0) return { n: 0, d: 1, r: 1 };
    const g = gcd(n, d);
    return { n: n / g, d: d / g, r };
  }
  const eNum = (e) => (e.n / e.d) * Math.sqrt(e.r);
  const eNeg = (e) => E(-e.n, e.d, e.r);
  const eMul = (a, b) => E(a.n * b.n, a.d * b.d, a.r * b.r);
  const eScale = (e, k) => E(e.n * k, e.d, e.r);
  function eInv(e) {
    const sg = e.n < 0 ? -1 : 1;
    return E(sg * e.d, Math.abs(e.n) * e.r, e.r);
  }
  function ePow(e, n) { let r = E(1, 1, 1); for (let i = 0; i < n; i++) r = eMul(r, e); return r; }
  function eStr(e) {
    if (e.n === 0) return '0';
    const neg = e.n < 0, a = Math.abs(e.n);
    let s;
    if (e.r === 1) s = e.d === 1 ? String(a) : a + '/' + e.d;
    else {
      const root = '√' + e.r;
      if (e.d === 1) s = (a === 1 ? '' : a) + root;
      else if (a === 1) s = root + '/' + e.d;
      else s = a + root + '/' + e.d;
    }
    return (neg ? '−' : '') + s;
  }
  const SIN_T = { 0: E(0, 1, 1), 30: E(1, 2, 1), 45: E(1, 2, 2), 60: E(1, 2, 3), 90: E(1, 1, 1) };
  const COS_T = { 0: E(1, 1, 1), 30: E(1, 2, 3), 45: E(1, 2, 2), 60: E(1, 2, 1), 90: E(0, 1, 1) };
  const nd360 = (deg) => ((deg % 360) + 360) % 360;
  const refAng = (d) => (d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d);
  function sinE(deg) { const d = nd360(deg), v = SIN_T[refAng(d)]; return d > 180 ? eNeg(v) : v; }
  function cosE(deg) { const d = nd360(deg), v = COS_T[refAng(d)]; return (d > 90 && d < 270) ? eNeg(v) : v; }
  function TvE(fn, deg) {
    if (fn === 0) return sinE(deg);
    if (fn === 1) return cosE(deg);
    return eMul(sinE(deg), eInv(cosE(deg)));
  }
  function TpE(fn, deg) {
    const s = sinE(deg), c = cosE(deg);
    if (fn === 0) return c;
    if (fn === 1) return eNeg(s);
    return eInv(eMul(c, c));
  }
  const TN = ['sin', 'cos', 'tan'];
  const TBODY = ['cos', 'sin', 'sec²'];   // body of T' (without sign)
  const TSIGN = [1, -1, 1];
  function piStr(n, d) {
    const f = fr(n, d);
    if (f.n === 0) return '0';
    const neg = f.n < 0, a = Math.abs(f.n);
    let s = (a === 1 ? '' : String(a)) + 'π';
    if (f.d !== 1) s += '/' + f.d;
    return (neg ? '−' : '') + s;
  }
  const sinFr = (deg) => ({ 0: fr(0), 30: fr(1, 2), 90: fr(1), 150: fr(1, 2), 180: fr(0), 210: fr(-1, 2), 270: fr(-1), 330: fr(-1, 2) })[nd360(deg)];
  const cosFr = (deg) => ({ 0: fr(1), 60: fr(1, 2), 90: fr(0), 120: fr(-1, 2), 180: fr(-1), 240: fr(-1, 2), 270: fr(0), 300: fr(1, 2) })[nd360(deg)];
  const ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
  const kxStr = (k) => (k === 1 ? 'x' : S(k) + 'x');
  function Tnum(fn, u) {
    const s = Math.sin(u), c = Math.cos(u);
    if (fn === 0) return s;
    if (fn === 1) return c;
    return Math.abs(c) < 0.03 ? NaN : s / c;
  }
  function Tpnum(fn, u) {
    const s = Math.sin(u), c = Math.cos(u);
    if (fn === 0) return c;
    if (fn === 1) return -s;
    return Math.abs(c) < 0.03 ? NaN : 1 / (c * c);
  }
  function expStr(q) { // e^q for a fraction q
    if (q.n === 0) return '1';
    if (q.n === 1 && q.d === 1) return 'e';
    return 'e^' + (q.d === 1 && q.n > 0 ? S(q.n) : '(' + frS(q) + ')');
  }
  function eTimesExp(E1, q) { // exact (surd) * e^q
    if (E1.n === 0) return '0';
    const es = eStr(E1);
    if (q.n === 0) return es;
    const ex = expStr(q);
    if (es === '1') return ex;
    if (es === '−1') return '−' + ex;
    const needP = E1.r !== 1 && E1.d !== 1;
    return (needP ? '(' + es + ')' : es) + '·' + ex;
  }
  const cdiff = (f, x) => { const h = 1e-5 * (1 + Math.abs(x)); return (f(x + h) - f(x - h)) / (2 * h); };

  // ---------- problem creation ----------
  const VB = [
    { name: 'y = sin(x²)', u: 'x²', du: '2x', y: 'sin u', dy: 'cos u', g: (x) => x * x, dg: (x) => 2 * x, f: Math.sin, df: Math.cos, dMin: -3, dMax: 3, simp: "f'(x) = cos(x²)·2x", chain: "cos(x²)·2x", tr: '(sin u)′ = cos u' },
    { name: 'y = (2x + 1)³', u: '2x + 1', du: '2', y: 'u³', dy: '3u²', g: (x) => 2 * x + 1, dg: () => 2, f: (u) => u * u * u, df: (u) => 3 * u * u, dMin: -3, dMax: 2, simp: "f'(x) = 3(2x + 1)²·2 = 6(2x + 1)²", chain: '3(2x + 1)²·2' },
    { name: 'y = e^(sin x)', u: 'sin x', du: 'cos x', y: 'e^u', dy: 'e^u', g: Math.sin, dg: Math.cos, f: Math.exp, df: Math.exp, dMin: -6, dMax: 6, simp: "f'(x) = e^(sin x)·cos x", chain: 'e^(sin x)·cos x' },
    { name: 'y = √(x² + 1)', u: 'x² + 1', du: '2x', y: '√u', dy: '1/(2√u)', g: (x) => x * x + 1, dg: (x) => 2 * x, f: Math.sqrt, df: (u) => 1 / (2 * Math.sqrt(u)), dMin: -4, dMax: 4, simp: "f'(x) = 2x/(2√(x² + 1)) = x/√(x² + 1)", chain: '(1/(2√(x² + 1)))·2x' },
  ];
  const ctl = { rows: [], vbSel: null, vbLabel: null, boxes: [] };

  function createProblem(rng) {
    const kinds = ['power', 'power', 'sqrt', 'exp', 'ln', 'trigLin', 'trigPow', 'trigPow', 'expTrig', 'lnTrig', 'powpow', 'expSqrt', 'vb'];
    return genKind(rng, rng.pick(kinds));
  }
  function genKind(rng, kind) {
    const p = { kind, showDeriv: true, showChain: true, showTan: false };
    switch (kind) {
      case 'power': {
        p.inner = rng.pick(['lin', 'lin', 'quad']);
        p.a = rng.pick([1, 2, 3, -1, -2, 4, 5]);
        p.b = rng.nextInt(-4, 5);
        p.n = rng.pick([2, 3, 4, 5, 6, -1, -2, -3]);
        let tries = 0;
        do {
          p.x0 = rng.nextInt(-2, 3);
          const u0 = p.inner === 'lin' ? p.a * p.x0 + p.b : p.a * p.x0 * p.x0 + p.b;
          if (u0 !== 0 && Math.abs(u0) <= 6 && !(p.n < 0 && Math.abs(u0) > 4)) break;
          p.b = rng.nextInt(-4, 5);
          tries++;
        } while (tries < 60);
        if (tries >= 60) { p.x0 = 1; p.a = 1; p.b = 1; }
        break;
      }
      case 'sqrt': {
        p.inner = rng.pick(['lin', 'quad']);
        if (p.inner === 'lin') {
          p.a = rng.pick([1, 2, 3, 4, -1, -2]); p.r = rng.pick([1, 2, 3]); p.x0 = rng.nextInt(-2, 4); p.b = p.r * p.r - p.a * p.x0;
        } else {
          let ok = false, tries = 0;
          while (!ok && tries++ < 200) {
            p.a = rng.pick([1, 1, 2, 3]); p.r = rng.nextInt(2, 6); p.x0 = rng.nextInt(-3, 4); p.b = p.r * p.r - p.a * p.x0 * p.x0;
            ok = p.b >= 1 && p.b <= 20 && p.x0 !== 0;
          }
          if (!ok) { p.a = 1; p.r = 5; p.x0 = 3; p.b = 16; }
        }
        break;
      }
      case 'exp': {
        p.inner = rng.pick(['lin', 'quad']);
        let tries = 0;
        do {
          p.a = rng.pick([1, 2, 3, -1, -2]);
          p.b = p.inner === 'lin' ? rng.nextInt(-3, 4) : rng.pick([0, 0, 1, -1, 2, -2]);
          p.x0 = rng.nextInt(-2, 3);
          const m = p.inner === 'lin' ? p.a * p.x0 + p.b : p.a * p.x0 * p.x0 + p.b;
          if (Math.abs(m) <= 5) break;
        } while (tries++ < 200);
        if (tries >= 200) { p.inner = 'lin'; p.a = 1; p.b = 0; p.x0 = 1; }
        break;
      }
      case 'ln': {
        p.inner = rng.pick(['lin', 'quad']);
        let tries = 0;
        do {
          p.a = p.inner === 'lin' ? rng.pick([1, 2, 3, -1, -2, 4]) : rng.pick([1, 1, 2, 3]);
          p.b = p.inner === 'lin' ? rng.nextInt(-4, 9) : rng.nextInt(1, 6);
          p.x0 = rng.nextInt(-2, 4);
          const u0 = p.inner === 'lin' ? p.a * p.x0 + p.b : p.a * p.x0 * p.x0 + p.b;
          if (u0 >= 1 && u0 <= 9) break;
        } while (tries++ < 300);
        if (tries >= 300) { p.inner = 'lin'; p.a = 1; p.b = 2; p.x0 = 1; }
        break;
      }
      case 'trigLin':
        p.T = rng.nextInt(0, 3);
        p.k = rng.pick([1, 2, 3, 4, -1, -2, -3]);
        p.bdeg = rng.pick(p.T === 2 ? [30, 45, 60, 120, 135, 150, -30, -45, -60] : [30, 45, 60, 90, 120, 135, 150, -30, -45, -60, -90]);
        break;
      case 'trigPow': {
        p.T = rng.nextInt(0, 3);
        p.k = rng.pick([1, 1, 2, 3]);
        p.n = rng.pick([2, 2, 3, 4]);
        let th;
        do { th = rng.pick(ANGLES); } while (p.T === 2 && (nd360(th) === 90 || nd360(th) === 270));
        if (th !== 0 && rng.nextInt(0, 3) === 0) th = -th;
        p.th = th;
        break;
      }
      case 'expTrig': {
        p.T = rng.nextInt(0, 2);
        p.k = rng.pick([1, 1, 2, 3]);
        p.th = rng.pick(p.T === 0 ? [0, 30, 90, 150, 180, 210, 270, 330, -30, -90, -150] : [0, 60, 90, 120, 180, 240, 270, 300, -60, -120, -180]);
        break;
      }
      case 'lnTrig': {
        p.T = rng.nextInt(0, 2);
        p.k = rng.pick([1, 1, 2, 3]);
        const list = p.T === 0 ? [30, 45, 60, 90, 120, 135, 150] : [0, 30, 45, 60, -30, -45, -60];
        p.th = rng.pick(list);
        break;
      }
      case 'powpow': {
        let tries = 0;
        do {
          p.a = rng.pick([1, 1, 2, -1, -2]); p.b = rng.nextInt(-2, 3); p.c = rng.pick([1, 1, 2, 3, -1]);
          p.n = rng.pick([2, 3, 3, 4]); p.x0 = rng.nextInt(-1, 3);
          const u = p.a * p.x0 + p.b, v = u * u + p.c;
          const val = p.n * Math.pow(v, p.n - 1) * 2 * u * p.a;
          if (v > 0 && u !== 0 && Math.abs(val) <= 3000) break;
        } while (tries++ < 400);
        if (tries >= 400) { p.a = 1; p.b = 0; p.c = 1; p.n = 2; p.x0 = 1; }
        break;
      }
      case 'expSqrt': {
        p.r = rng.pick([1, 2, 3]); p.a = rng.pick([1, 2, 3, 4, -2, -4]); p.x0 = rng.nextInt(-2, 4); p.b = p.r * p.r - p.a * p.x0;
        break;
      }
      case 'aExp': {
        p.inner = rng.pick(['lin', 'quad']);
        p.base = rng.pick([2, 2, 3, 5]);
        let tries = 0;
        do {
          p.a = rng.pick([1, 2, 3, -1, -2]);
          p.b = p.inner === 'lin' ? rng.nextInt(-3, 4) : rng.pick([0, 0, 1, -1, 2]);
          p.x0 = rng.nextInt(-2, 3);
          const m = p.inner === 'lin' ? p.a * p.x0 + p.b : p.a * p.x0 * p.x0 + p.b;
          const k = p.inner === 'lin' ? p.a : 2 * p.a * p.x0;
          if (Math.abs(m) <= 3 && k !== 0) break;
        } while (tries++ < 300);
        if (tries >= 300) { p.inner = 'lin'; p.a = 1; p.b = 0; p.x0 = 1; }
        break;
      }
      case 'recip': {
        p.inner = rng.pick(['lin', 'quad']);
        let tries = 0;
        do {
          p.a = rng.pick([1, 2, 3, -1, -2]);
          p.b = rng.nextInt(-4, 5);
          p.x0 = rng.nextInt(-2, 3);
          const u0 = p.inner === 'lin' ? p.a * p.x0 + p.b : p.a * p.x0 * p.x0 + p.b;
          const k = p.inner === 'lin' ? p.a : 2 * p.a * p.x0;
          if (u0 !== 0 && Math.abs(u0) <= 5 && k !== 0) break;
        } while (tries++ < 300);
        if (tries >= 300) { p.inner = 'lin'; p.a = 1; p.b = 1; p.x0 = 1; }
        break;
      }
      default:
        p.idx = rng.nextInt(0, 4);
        p.x0 = rng.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]);
        if (p.idx === 1) p.x0 = rng.pick([-2, -1.5, -1, -0.5, 0, 0.5, 1]);
    }
    applyVisibility(p);
    return p;
  }

  // ---------- model construction ----------
  // returns { fStr, layers:[{out,inp,expr,dsym,dexpr,f,df}], chain, simp, evalLines:[], ans, num, wrong, wrongNote, x0, x0s, hw, domainNote }
  function build(p) {
    switch (p.kind) {
      case 'power': return bPower(p);
      case 'sqrt': return bSqrt(p);
      case 'exp': return bExp(p);
      case 'ln': return bLn(p);
      case 'trigLin': return bTrigLin(p);
      case 'trigPow': return bTrigPow(p);
      case 'expTrig': return bExpTrig(p);
      case 'lnTrig': return bLnTrig(p);
      case 'powpow': return bPowPow(p);
      case 'expSqrt': return bExpSqrt(p);
      case 'aExp': return bAExp(p);
      case 'recip': return bRecip(p);
      default: return bVb(p);
    }
  }
  const x0Str = (x0) => S(x0);

  function bPower(p) {
    const { a, b, n, x0 } = p, lin = p.inner === 'lin';
    const g = lin ? (x) => a * x + b : (x) => a * x * x + b;
    const dg = lin ? () => a : (x) => 2 * a * x;
    const gS = lin ? linStr(a, b) : quadStr(a, b);
    const dgS = lin ? S(a) : S(2 * a) + 'x';
    const u0 = g(x0), d0 = dg(x0);
    const pw = (e) => (e === 1 ? 'u' : 'u' + sup(e));
    const val = frMul(frMul(fr(n), frPow(fr(u0), n - 1)), fr(d0));
    const wrongV = frMul(fr(n), frPow(fr(u0), n - 1));
    const K = lin ? n * a : 2 * n * a;
    const simpBase = `(${gS})${sup(n - 1)}`;
    return {
      fStr: `f(x) = (${gS})${sup(n)}`,
      layers: [
        { out: 'u', inp: 'x', expr: gS, dsym: 'du/dx', dexpr: dgS, f: g, df: dg },
        { out: 'y', inp: 'u', expr: 'u' + sup(n), dsym: 'dy/du', dexpr: `${S(n)}${pw(n - 1)}`, f: (u) => Math.pow(u, n), df: (u) => n * Math.pow(u, n - 1) },
      ],
      chain: `f'(x) = ${S(n)}(${gS})${sup(n - 1)} · ${P(dgS)}`,
      simp: lin ? `f'(x) = ${coefDot(K)}(${gS})${sup(n - 1)}` : `f'(x) = ${coef(K)}x(${gS})${sup(n - 1)}`,
      evalLines: [`u₀ = g(${S(x0)}) = ${S(u0)}`,
        `g'(${S(x0)}) = ${S(d0)}`,
        `f'(${S(x0)}) = ${S(n)}·(${S(u0)})${sup(n - 1)}·(${S(d0)}) = ${frS(val)}`],
      ans: frS(val), num: frV(val),
      wrong: frS(wrongV), x0, x0s: x0Str(x0), hw: 2.5,
      baseNote: simpBase,
    };
  }
  function bSqrt(p) {
    const { a, b, r, x0 } = p, lin = p.inner === 'lin';
    const g = lin ? (x) => a * x + b : (x) => a * x * x + b;
    const dg = lin ? () => a : (x) => 2 * a * x;
    const gS = lin ? linStr(a, b) : quadStr(a, b);
    const dgS = lin ? S(a) : S(2 * a) + 'x';
    const d0 = dg(x0), u0 = g(x0);
    const val = fr(d0, 2 * r);
    return {
      fStr: `f(x) = √(${gS})`,
      layers: [
        { out: 'u', inp: 'x', expr: gS, dsym: 'du/dx', dexpr: dgS, f: g, df: dg },
        { out: 'y', inp: 'u', expr: '√u', dsym: 'dy/du', dexpr: '1/(2√u)', f: (u) => (u < 0 ? NaN : Math.sqrt(u)), df: (u) => (u <= 0 ? NaN : 1 / (2 * Math.sqrt(u))) },
      ],
      chain: `f'(x) = 1/(2√(${gS})) · ${P(dgS)}`,
      simp: lin ? `f'(x) = ${S(a)}/(2√(${gS}))` : `f'(x) = ${a === 1 ? '' : S(a)}x/√(${gS})`,
      evalLines: [`u₀ = g(${S(x0)}) = ${S(u0)},  √u₀ = ${r}`, `g'(${S(x0)}) = ${S(d0)}`, `f'(${S(x0)}) = 1/(2·${r}) · (${S(d0)}) = ${frS(val)}`],
      ans: frS(val), num: frV(val), wrong: frS(fr(1, 2 * r)), x0, x0s: x0Str(x0), hw: 2.5,
    };
  }
  function bExp(p) {
    const { a, b, x0 } = p, lin = p.inner === 'lin';
    const g = lin ? (x) => a * x + b : (x) => a * x * x + b;
    const dg = lin ? () => a : (x) => 2 * a * x;
    const gS = lin ? linStr(a, b) : quadStr(a, b);
    const dgS = lin ? S(a) : S(2 * a) + 'x';
    const m = g(x0), k = dg(x0);
    const expv = (mm) => (mm === 0 ? '1' : mm === 1 ? 'e' : 'e^' + (mm < 0 ? '(' + S(mm) + ')' : mm));
    const ansS = k === 0 ? '0' : (mm0 => (mm0 === 0 ? S(k) : (k === 1 ? '' : k === -1 ? '−' : S(k) + '·') + expv(mm0)))(m);
    const K = lin ? a : 2 * a;
    return {
      fStr: `f(x) = e^(${gS})`,
      layers: [
        { out: 'u', inp: 'x', expr: gS, dsym: 'du/dx', dexpr: dgS, f: g, df: dg },
        { out: 'y', inp: 'u', expr: 'e^u', dsym: 'dy/du', dexpr: 'e^u', f: (u) => (Math.abs(u) > 30 ? NaN : Math.exp(u)), df: (u) => (Math.abs(u) > 30 ? NaN : Math.exp(u)) },
      ],
      chain: `f'(x) = e^(${gS}) · ${P(dgS)}`,
      simp: lin ? `f'(x) = ${coefDot(K)}e^(${gS})` : `f'(x) = ${coef(K)}x·e^(${gS})`,
      evalLines: [`u₀ = g(${S(x0)}) = ${S(m)}`, `g'(${S(x0)}) = ${S(k)}`, `f'(${S(x0)}) = e^(${S(m)}) · (${S(k)}) = ${ansS}`],
      ans: ansS, num: k * Math.exp(m), wrong: expv(m), x0, x0s: x0Str(x0), hw: 2.2,
    };
  }
  function bLn(p) {
    const { a, b, x0 } = p, lin = p.inner === 'lin';
    const g = lin ? (x) => a * x + b : (x) => a * x * x + b;
    const dg = lin ? () => a : (x) => 2 * a * x;
    const gS = lin ? linStr(a, b) : quadStr(a, b);
    const dgS = lin ? S(a) : S(2 * a) + 'x';
    const u0 = g(x0), d0 = dg(x0);
    const val = fr(d0, u0);
    return {
      fStr: `f(x) = ln(${gS})`,
      layers: [
        { out: 'u', inp: 'x', expr: gS, dsym: 'du/dx', dexpr: dgS, f: g, df: dg },
        { out: 'y', inp: 'u', expr: 'ln u', dsym: 'dy/du', dexpr: '1/u', f: (u) => (u <= 0 ? NaN : Math.log(u)), df: (u) => (u <= 0 ? NaN : 1 / u) },
      ],
      chain: `f'(x) = (1/(${gS})) · ${P(dgS)}`,
      simp: `f'(x) = ${dgS}/(${gS})`,
      evalLines: [`u₀ = g(${S(x0)}) = ${S(u0)} > 0`, `g'(${S(x0)}) = ${S(d0)}`, `f'(${S(x0)}) = (${S(d0)})/(${S(u0)}) = ${frS(val)}`],
      ans: frS(val), num: frV(val), wrong: frS(fr(1, u0)), x0, x0s: x0Str(x0), hw: 2.2,
    };
  }
  function bTrigLin(p) {
    const { T, k, bdeg } = p, nm = TN[T];
    const b = bdeg * PI / 180;
    const inner = `${kxStr(k)} ${bdeg < 0 ? '−' : '+'} ${piStr(Math.abs(bdeg), 180)}`;
    const tp = TpE(T, bdeg), tv = TvE(T, bdeg);
    const ans = eScale(tp, k);
    const body = (TSIGN[T] < 0 ? '−' : '') + TBODY[T] + '(' + inner + ')';
    const K = k * TSIGN[T];
    return {
      fStr: `f(x) = ${nm}(${inner})`,
      layers: [
        { out: 'u', inp: 'x', expr: inner, dsym: 'du/dx', dexpr: S(k), f: (x) => k * x + b, df: () => k },
        { out: 'y', inp: 'u', expr: `${nm} u`, dsym: 'dy/du', dexpr: (TSIGN[T] < 0 ? '−' : '') + TBODY[T] + ' u', f: (u) => Tnum(T, u), df: (u) => Tpnum(T, u) },
      ],
      chain: `f'(x) = (${body}) · ${S(k)}`,
      simp: `f'(x) = ${coefDot(K)}${TBODY[T]}(${inner})`,
      evalLines: [`x₀ = 0:  u₀ = ${piStr(bdeg, 180)}  (${S(bdeg)}°)`, `${nm}′ u₀ = ${body.replace(`(${inner})`, '(u₀)')} = ${eStr(tp)}`, `f'(0) = (${eStr(tp)}) · (${S(k)}) = ${eStr(ans)}`],
      ans: eStr(ans), num: eNum(ans), wrong: eStr(tp), x0: 0, x0s: '0', hw: 1.6 * PI / Math.abs(k), tvStr: eStr(tv),
    };
  }
  function trigSet(p) {
    const T = p.T, k = p.k, th = p.th;
    return { nm: TN[T], kx: kxStr(k), x0s: piStr(th, 180 * k), tv: TvE(T, th), tp: TpE(T, th), s: sinE(th), c: cosE(th) };
  }
  function bTrigPow(p) {
    const { T, k, n, th } = p;
    const q = trigSet(p), nm = q.nm, kx = q.kx;
    const x0 = (th / k) * PI / 180;
    const ans = eScale(eMul(ePow(q.tv, n - 1), q.tp), n * k);
    const sg = TSIGN[T];
    const K = n * k * sg;
    const bodyT = TBODY[T] + '(' + kx + ')';
    const fpow = `${nm}${sup(n)}(${kx})`;
    return {
      fStr: `f(x) = ${fpow}`,
      layers: [
        { out: 'u', inp: 'x', expr: kx, dsym: 'du/dx', dexpr: S(k), f: (x) => k * x, df: () => k },
        { out: 'v', inp: 'u', expr: `${nm} u`, dsym: 'dv/du', dexpr: (sg < 0 ? '−' : '') + TBODY[T] + ' u', f: (u) => Tnum(T, u), df: (u) => Tpnum(T, u) },
        { out: 'y', inp: 'v', expr: 'v' + sup(n), dsym: 'dy/dv', dexpr: `${n}${n - 1 === 1 ? 'v' : 'v' + sup(n - 1)}`, f: (v) => Math.pow(v, n), df: (v) => n * Math.pow(v, n - 1) },
      ],
      chain: `f'(x) = ${n}${nm}${sup(n - 1)}(${kx}) · (${sg < 0 ? '−' : ''}${bodyT}) · ${S(k)}`,
      simp: `f'(x) = ${coefDot(K)}${nm}${sup(n - 1)}(${kx})·${bodyT}`,
      evalLines: [`x₀ = ${q.x0s}  ⇒  u₀ = ${kx.replace('x', '')}${k === 1 ? '' : '·'}x₀ = ${piStr(th, 180)}  (${S(th)}°)`,
        `sin u₀ = ${eStr(q.s)},  cos u₀ = ${eStr(q.c)}${T === 2 ? ',  tan u₀ = ' + eStr(q.tv) + ',  sec²u₀ = ' + eStr(q.tp) : ''}`,
        `${nm} u₀ = ${eStr(q.tv)},  (${nm} u)′ = ${(sg < 0 ? '−' : '') + TBODY[T]} u₀ = ${eStr(q.tp)}`,
        `f'(x₀) = ${n}·(${eStr(q.tv)})${sup(n - 1)}·(${eStr(q.tp)})·${S(k)} = ${eStr(ans)}`],
      ans: eStr(ans), num: eNum(ans), wrong: eStr(eScale(eMul(ePow(q.tv, n - 1), q.tp), n)), x0, x0s: q.x0s, hw: 1.6 * PI / k,
    };
  }
  function bExpTrig(p) {
    const { T, k, th } = p, nm = TN[T];
    const q = trigSet(p), kx = q.kx;
    const x0 = (th / k) * PI / 180;
    const val = T === 0 ? sinFr(th) : cosFr(th);
    const sg = TSIGN[T];
    const tpE = q.tp;                       // signed T'
    const ansE = eScale(tpE, k);
    const ansS = eTimesExp(ansE, val);
    const num = eNum(ansE) * Math.exp(frV(val));
    return {
      fStr: `f(x) = e^(${nm} ${kx})`,
      layers: [
        { out: 'u', inp: 'x', expr: kx, dsym: 'du/dx', dexpr: S(k), f: (x) => k * x, df: () => k },
        { out: 'v', inp: 'u', expr: `${nm} u`, dsym: 'dv/du', dexpr: (sg < 0 ? '−' : '') + TBODY[T] + ' u', f: (u) => Tnum(T, u), df: (u) => Tpnum(T, u) },
        { out: 'y', inp: 'v', expr: 'e^v', dsym: 'dy/dv', dexpr: 'e^v', f: (v) => Math.exp(v), df: (v) => Math.exp(v) },
      ],
      chain: `f'(x) = e^(${nm} ${kx}) · (${sg < 0 ? '−' : ''}${TBODY[T]} ${kx}) · ${S(k)}`,
      simp: `f'(x) = ${coefDot(k * sg)}e^(${nm} ${kx})·${TBODY[T]} ${kx}`,
      evalLines: [`x₀ = ${q.x0s}  ⇒  u₀ = ${piStr(th, 180)}  (${S(th)}°)`,
        `${nm} u₀ = ${frS(val)},  (${nm} u)′ = ${eStr(tpE)}`,
        `f'(x₀) = e^(${frS(val)}) · (${eStr(tpE)}) · ${S(k)} = ${ansS}`],
      ans: ansS, num, wrong: eTimesExp(tpE, val), x0, x0s: q.x0s, hw: 1.6 * PI / k,
    };
  }
  function bLnTrig(p) {
    const { T, k, th } = p, nm = TN[T];
    const q = trigSet(p), kx = q.kx;
    const x0 = (th / k) * PI / 180;
    const sg = TSIGN[T];
    const ratio = eMul(q.tp, eInv(q.tv));         // T'/T
    const ansE = eScale(ratio, k);
    return {
      fStr: `f(x) = ln(${nm} ${kx})`,
      layers: [
        { out: 'u', inp: 'x', expr: kx, dsym: 'du/dx', dexpr: S(k), f: (x) => k * x, df: () => k },
        { out: 'v', inp: 'u', expr: `${nm} u`, dsym: 'dv/du', dexpr: (sg < 0 ? '−' : '') + TBODY[T] + ' u', f: (u) => Tnum(T, u), df: (u) => Tpnum(T, u) },
        { out: 'y', inp: 'v', expr: 'ln v', dsym: 'dy/dv', dexpr: '1/v', f: (v) => (v <= 0 ? NaN : Math.log(v)), df: (v) => (v <= 0 ? NaN : 1 / v) },
      ],
      chain: `f'(x) = 1/(${nm} ${kx}) · (${sg < 0 ? '−' : ''}${TBODY[T]} ${kx}) · ${S(k)}`,
      simp: T === 0 ? `f'(x) = ${coefDot(k)}cot(${kx})` : `f'(x) = ${coefDot(-k)}tan(${kx})`,
      evalLines: [`x₀ = ${q.x0s}  ⇒  u₀ = ${piStr(th, 180)}  (${S(th)}°)`,
        `${nm} u₀ = ${eStr(q.tv)} > 0,  (${nm} u)′ = ${eStr(q.tp)}`,
        `f'(x₀) = (1/(${eStr(q.tv)})) · (${eStr(q.tp)}) · ${S(k)} = ${eStr(ansE)}`],
      ans: eStr(ansE), num: eNum(ansE), wrong: eStr(ratio), x0, x0s: q.x0s, hw: 1.2 * PI / k,
    };
  }
  function bPowPow(p) {
    const { a, b, c, n, x0 } = p;
    const uS = linStr(a, b);
    const vS = `${par(uS)}² ${c < 0 ? '− ' + (-c) : '+ ' + c}`;
    const u0 = a * x0 + b, v0 = u0 * u0 + c;
    const val = n * Math.pow(v0, n - 1) * 2 * u0 * a;
    const K = 2 * n * a;
    return {
      fStr: `f(x) = (${vS})${sup(n)}`,
      layers: [
        { out: 'u', inp: 'x', expr: uS, dsym: 'du/dx', dexpr: S(a), f: (x) => a * x + b, df: () => a },
        { out: 'v', inp: 'u', expr: `u² ${c < 0 ? '− ' + (-c) : '+ ' + c}`, dsym: 'dv/du', dexpr: '2u', f: (u) => u * u + c, df: (u) => 2 * u },
        { out: 'y', inp: 'v', expr: 'v' + sup(n), dsym: 'dy/dv', dexpr: `${n}${n - 1 === 1 ? 'v' : 'v' + sup(n - 1)}`, f: (v) => Math.pow(v, n), df: (v) => n * Math.pow(v, n - 1) },
      ],
      chain: `f'(x) = ${n}(${vS})${sup(n - 1)} · 2${par(uS)} · ${P(S(a))}`,
      simp: `f'(x) = ${coefDot(K)}${par(uS)}(${vS})${sup(n - 1)}`,
      evalLines: [`u₀ = ${S(u0)},  v₀ = u₀² ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${S(v0)}`, `du/dx = ${S(a)},  dv/du = 2u₀ = ${S(2 * u0)},  dy/dv = ${n}v₀${sup(n - 1)} = ${S(n * Math.pow(v0, n - 1))}`, `f'(${S(x0)}) = ${S(n * Math.pow(v0, n - 1))}·${P(S(2 * u0))}·${P(S(a))} = ${S(val)}`],
      ans: S(val), num: val, wrong: S(n * Math.pow(v0, n - 1) * 2 * u0), x0, x0s: x0Str(x0), hw: 2.2,
    };
  }
  function bExpSqrt(p) {
    const { a, b, r, x0 } = p;
    const uS = linStr(a, b);
    const val = fr(a, 2 * r);
    const ansS = (val.n === 1 ? '' : val.n === -1 ? '−' : S(val.n)) + 'e^' + r + (val.d === 1 ? '' : '/' + val.d);
    const num = frV(val) * Math.exp(r);
    return {
      fStr: `f(x) = e^(√(${uS}))`,
      layers: [
        { out: 'u', inp: 'x', expr: uS, dsym: 'du/dx', dexpr: S(a), f: (x) => a * x + b, df: () => a },
        { out: 'v', inp: 'u', expr: '√u', dsym: 'dv/du', dexpr: '1/(2√u)', f: (u) => (u < 0 ? NaN : Math.sqrt(u)), df: (u) => (u <= 0 ? NaN : 1 / (2 * Math.sqrt(u))) },
        { out: 'y', inp: 'v', expr: 'e^v', dsym: 'dy/dv', dexpr: 'e^v', f: (v) => Math.exp(v), df: (v) => Math.exp(v) },
      ],
      chain: `f'(x) = e^(√(${uS})) · 1/(2√(${uS})) · ${S(a)}`,
      simp: `f'(x) = ${S(a)}·e^(√(${uS})) / (2√(${uS}))`,
      evalLines: [`u₀ = ${S(r * r)},  v₀ = √u₀ = ${r}`, `du/dx = ${S(a)},  dv/du = 1/(2·${r}) = 1/${2 * r},  dy/dv = e^${r}`, `f'(${S(x0)}) = e^${r} · (1/${2 * r}) · (${S(a)}) = ${ansS}`],
      ans: ansS, num, wrong: 'e^' + r + '/' + (2 * r), x0, x0s: x0Str(x0), hw: 2.2,
    };
  }
  function bAExp(p) {
    const { a, b, x0, base } = p, lin = p.inner === 'lin';
    const g = lin ? (x) => a * x + b : (x) => a * x * x + b;
    const dg = lin ? () => a : (x) => 2 * a * x;
    const gS = lin ? linStr(a, b) : quadStr(a, b);
    const dgS = lin ? S(a) : S(2 * a) + 'x';
    const m = g(x0), k = dg(x0);
    const pw = frPow(fr(base), m);                 // base^m exactly
    const lnS = 'ln ' + base;
    const times = (c) => (c.n === 0 ? '0' : (c.n === 1 && c.d === 1 ? '' : c.n === -1 && c.d === 1 ? '−' : (c.d === 1 ? S(c.n) : '(' + frS(c) + ')') + '·') + (c.n === 0 ? '' : lnS));
    const val = frMul(pw, fr(k));
    const K = lin ? a : 2 * a;
    return {
      fStr: `f(x) = ${base}^(${gS})`,
      layers: [
        { out: 'u', inp: 'x', expr: gS, dsym: 'du/dx', dexpr: dgS, f: g, df: dg },
        { out: 'y', inp: 'u', expr: `${base}^u`, dsym: 'dy/du', dexpr: `${base}^u·${lnS}`, f: (u) => Math.pow(base, u), df: (u) => Math.pow(base, u) * Math.log(base) },
      ],
      chain: `f'(x) = ${base}^(${gS})·${lnS} · ${P(dgS)}`,
      simp: lin ? `f'(x) = ${coefDot(K)}${lnS}·${base}^(${gS})` : `f'(x) = ${coef(K)}x·${lnS}·${base}^(${gS})`,
      evalLines: [`u₀ = g(${S(x0)}) = ${S(m)}`, `g'(${S(x0)}) = ${S(k)}`, `f'(${S(x0)}) = ${base}^(${S(m)})·${lnS}·(${S(k)}) = ${times(val)}`],
      ans: times(val), num: frV(val) * Math.log(base), wrong: times(pw), x0, x0s: x0Str(x0), hw: 2,
    };
  }
  function bRecip(p) {
    const { a, b, x0 } = p, lin = p.inner === 'lin';
    const g = lin ? (x) => a * x + b : (x) => a * x * x + b;
    const dg = lin ? () => a : (x) => 2 * a * x;
    const gS = lin ? linStr(a, b) : quadStr(a, b);
    const dgS = lin ? S(a) : S(2 * a) + 'x';
    const u0 = g(x0), d0 = dg(x0);
    const val = fr(-d0, u0 * u0);
    return {
      fStr: `f(x) = 1/(${gS})`,
      layers: [
        { out: 'u', inp: 'x', expr: gS, dsym: 'du/dx', dexpr: dgS, f: g, df: dg },
        { out: 'y', inp: 'u', expr: '1/u', dsym: 'dy/du', dexpr: '−1/u²', f: (u) => (u === 0 ? NaN : 1 / u), df: (u) => (u === 0 ? NaN : -1 / (u * u)) },
      ],
      chain: `f'(x) = (−1/(${gS})²) · ${P(dgS)}`,
      simp: lin ? `f'(x) = ${S(-a)}/(${gS})²` : `f'(x) = ${coef(-2 * a)}x/(${gS})²`,
      evalLines: [`u₀ = g(${S(x0)}) = ${S(u0)} ≠ 0`, `g'(${S(x0)}) = ${S(d0)}`, `f'(${S(x0)}) = (−1/(${S(u0)})²) · (${S(d0)}) = ${frS(val)}`],
      ans: frS(val), num: frV(val), wrong: frS(fr(-1, u0 * u0)), x0, x0s: x0Str(x0), hw: 2.5,
    };
  }
  function bVb(p) {
    const e = VB[p.idx];
    const x0 = Math.max(e.dMin, Math.min(e.dMax, p.x0));
    const u0 = e.g(x0), dudx = e.dg(x0), dydu = e.df(u0);
    const num = dydu * dudx;
    const outerD = e.dy.replace(/u/g, '(' + N(u0) + ')');
    return {
      fStr: `f(x) = ${e.name.replace('y = ', '')}`,
      layers: [
        { out: 'u', inp: 'x', expr: e.u, dsym: 'du/dx', dexpr: e.du, f: e.g, df: e.dg },
        { out: 'y', inp: 'u', expr: e.y, dsym: 'dy/du', dexpr: e.dy, f: (u) => { const v = e.f(u); return isFinite(v) ? v : NaN; }, df: (u) => { const v = e.df(u); return isFinite(v) ? v : NaN; } },
      ],
      chain: `f'(x) = (${e.dy.replace(/u/g, '(' + e.u + ')')}) · ${e.du}`,
      simp: e.simp,
      evalLines: [`x₀ = ${N(x0)}:  u₀ = g(x₀) = ${N(u0)},  y₀ = f(u₀) = ${N(e.f(u0))}`, `du/dx = ${e.du} = ${N(dudx)},  dy/du = ${e.dy.replace(/u/g, 'u₀')} = ${N(dydu)}`, `f'(x₀) = ${N(dydu)} · ${P(N(dudx))} = ${N(num)}`],
      ans: N(num), num, wrong: N(dydu), x0, x0s: N(x0), hw: (e.dMax - e.dMin) / 2, domain: [e.dMin, e.dMax], outerD,
    };
  }

  // ---------- numeric functions from the layers ----------
  function composeF(layers) {
    return (x) => {
      let v = x;
      for (let i = 0; i < layers.length; i++) { v = layers[i].f(v); if (!isFinite(v)) return NaN; }
      return Math.abs(v) < 1e6 ? v : NaN;
    };
  }
  function composeD(layers) {
    return (x) => {
      let v = x, d = 1;
      for (let i = 0; i < layers.length; i++) {
        const dv = layers[i].df(v);
        v = layers[i].f(v);
        if (!isFinite(v) || !isFinite(dv)) return NaN;
        d *= dv;
      }
      return Math.abs(d) < 1e6 ? d : NaN;
    };
  }
  function links(m) {
    const names = ['x'], vals = [m.x0], ders = [];
    let v = m.x0;
    m.layers.forEach((l) => { ders.push(l.df(v)); v = l.f(v); names.push(l.out); vals.push(v); });
    return { names, vals, ders };
  }

  // ---------- texts ----------
  function problemStatement(p) {
    const m = build(p);
    if (p.kind === 'vb') {
      return Tx(`${m.fStr} bileşke fonksiyonunda iç fonksiyon u = g(x) ve dış fonksiyon y = f(u)'yu belirleyelim; dy/dx = (dy/du)·(du/dx) ile türevi bulalım ve x = ${m.x0s} noktasındaki değerine bakalım (kaydırıcı ile noktayı değiştirebiliriz).`,
        `For the composite ${m.fStr}, let's identify the inner function u = g(x) and the outer function y = f(u); we can find the derivative with dy/dx = (dy/du)·(du/dx) and evaluate it at x = ${m.x0s} (the slider lets us move the point).`);
    }
    return Tx(`${m.fStr} fonksiyonunda katmanları (iç → dış) belirleyelim, zincir kuralıyla f'(x) ifadesini bulalım ve f'(${m.x0s}) değerini hesaplayalım.`,
      `For ${m.fStr}, let's identify the layers (inner → outer), use the chain rule to find f'(x), and compute f'(${m.x0s}).`);
  }

  function concept() {
    return Tx(
      "TANIM: Zincir kuralı, bileşke fonksiyonların (bir fonksiyonun içine yerleştirilmiş fonksiyon) türevini verir. h(x) = f(g(x)) için f DIŞ, g İÇ fonksiyondur. Bir bileşke, bağımlı dönüşümler zinciridir: x → u = g(x) → y = f(u).\n" +
      "\n" +
      "FORMÜLLER:\n" +
      "   (f(g(x)))' = f'(g(x)) · g'(x)\n" +
      "   Leibniz gösterimi: dy/dx = (dy/du) · (du/dx),  u = g(x)\n" +
      "   Üç halka: (f(g(h(x))))' = f'(g(h)) · g'(h) · h'(x),  yani dy/dx = (dy/dv)(dv/du)(du/dx)\n" +
      "\n" +
      "ÖZEL HALLER (hazır kalıplar):\n" +
      "   (gⁿ)' = n·gⁿ⁻¹·g'            (√g)' = g' / (2√g)\n" +
      "   (eᵍ)' = eᵍ·g'                 (ln g)' = g' / g\n" +
      "   (sin g)' = cos g·g'           (cos g)' = −sin g·g'           (tan g)' = sec²g·g'\n" +
      "   (aᵍ)' = aᵍ·ln a·g'            (1/g)' = −g' / g²\n" +
      "\n" +
      "YÖNTEM:\n" +
      "   (1) İçi (u = g(x)) ve dışı (y = f(u)) belirleriz; üç katman varsa içten dışa u, v, y adlarını veririz.\n" +
      "   (2) Dış fonksiyonun türevini alırız, içi DEĞİŞTİRMEDEN bırakırız: f'(g(x)).\n" +
      "   (3) İç fonksiyonun türevini alırız: g'(x).\n" +
      "   (4) İkisini ÇARPARIZ. Üç katmanda üç türev çarpılır (dıştan içe).\n" +
      "   (5) Gerekirse sadeleştiririz; istenen x₀ için önce u₀ = g(x₀)'ı bulur, sonra f'(u₀)·g'(x₀) değerini hesaplarız.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - İç türev g'(x)'i çarpmayı atlamak en sık görülen hatadır: (sin 3x)' = 3cos 3x, cos 3x değil; ((2x+1)³)' = 3(2x+1)²·2.\n" +
      "   - Çarpım kuralı ile karıştırmak: f(x)·g(x) çarpımdır, f(g(x)) bileşkedir.\n" +
      "   - f'(g(x)), f' içinde x yerine g(x) koymaktır; f'(x)·g'(x) değildir.\n" +
      "   - Katman sırasını karıştırmak: önce hangi işlemin yapıldığına bakmak yardımcı olur (x'ten başlayarak: x → u → y).\n" +
      "   - (sin x)² ile sin(x²) farklıdır: 2 sin x cos x  ve  2x cos(x²).\n" +
      "\n" +
      "MİNİ ÖRNEK: h(x) = (3x² + 1)⁵. Dış u⁵, iç u = 3x² + 1. h' = 5(3x²+1)⁴ · 6x = 30x(3x²+1)⁴. x = 1'de: 30·4⁴ = 7680.\n" +
      "\n" +
      "SEZGİ: Dişli çarkları gibi düşünebiliriz: x değişince u, u değişince y değişir; toplam hız, halkaların hızlarının çarpımıdır (dy/dx = dy/du · du/dx). Grafikte mor eğri sayısal olarak hesaplanan türev, kesikli altın eğri zincir kuralının öngörüsüdür; ikisi her yerde çakışır.\n" +
      "\n" +
      "BU SEKMEDEKİ ÖRNEKLER: kuvvet, kök, üstel, logaritma, trigonometrik, üç katmanlı bileşkeler ve VB'deki dört bileşke (kaydırıcıyla nokta seçimi).",
      "DEFINITION: The chain rule gives the derivative of a composite function (a function inside another). For h(x) = f(g(x)), f is the OUTER and g the INNER function. A composite is a chain of dependent transformations: x → u = g(x) → y = f(u).\n" +
      "\n" +
      "FORMULAS:\n" +
      "   (f(g(x)))' = f'(g(x)) · g'(x)\n" +
      "   Leibniz notation: dy/dx = (dy/du) · (du/dx),  u = g(x)\n" +
      "   Three links: (f(g(h(x))))' = f'(g(h)) · g'(h) · h'(x),  i.e. dy/dx = (dy/dv)(dv/du)(du/dx)\n" +
      "\n" +
      "SPECIAL CASES (ready-made patterns):\n" +
      "   (gⁿ)' = n·gⁿ⁻¹·g'            (√g)' = g' / (2√g)\n" +
      "   (eᵍ)' = eᵍ·g'                 (ln g)' = g' / g\n" +
      "   (sin g)' = cos g·g'           (cos g)' = −sin g·g'           (tan g)' = sec²g·g'\n" +
      "   (aᵍ)' = aᵍ·ln a·g'            (1/g)' = −g' / g²\n" +
      "\n" +
      "METHOD:\n" +
      "   (1) We identify the inside (u = g(x)) and the outside (y = f(u)); with three layers we name them u, v, y from the inside out.\n" +
      "   (2) We differentiate the outside, leaving the inside UNCHANGED: f'(g(x)).\n" +
      "   (3) We differentiate the inside: g'(x).\n" +
      "   (4) We MULTIPLY the two. With three layers we multiply three derivatives (outside in).\n" +
      "   (5) We simplify if needed; for a given x₀ we first find u₀ = g(x₀), then compute f'(u₀)·g'(x₀).\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Leaving out the inner derivative g'(x) is the most common mistake: (sin 3x)' = 3cos 3x, not cos 3x; ((2x+1)³)' = 3(2x+1)²·2.\n" +
      "   - Confusing it with the product rule: f(x)·g(x) is a product, f(g(x)) is a composition.\n" +
      "   - f'(g(x)) means plug g(x) into f'; it is not f'(x)·g'(x).\n" +
      "   - Mixing up the order of the layers: it helps to ask which operation is done first (start from x: x → u → y).\n" +
      "   - (sin x)² and sin(x²) differ: 2 sin x cos x  versus  2x cos(x²).\n" +
      "\n" +
      "MINI EXAMPLE: h(x) = (3x² + 1)⁵. Outer u⁵, inner u = 3x² + 1. h' = 5(3x²+1)⁴ · 6x = 30x(3x²+1)⁴. At x = 1: 30·4⁴ = 7680.\n" +
      "\n" +
      "INTUITION: we can think of gears: when x changes, u changes; when u changes, y changes; the total rate is the product of the link rates (dy/dx = dy/du · du/dx). On the graph the purple curve is the numerically computed derivative and the dashed gold curve is the chain-rule prediction; they coincide everywhere.\n" +
      "\n" +
      "EXAMPLES IN THIS TAB: power, root, exponential, logarithm, trigonometric and three-layer composites, plus the four VB composites (choose the point with the slider).");
  }

  function solveSteps(p) {
    const m = build(p);
    const L = m.layers, n = L.length;
    const lk = links(m);
    const st = [];
    const H = (i, t) => `── ${i}) ${t} ──\n`;
    const layerLines = L.map((l) => `${l.out} = ${l.expr}`).join('\n');
    const outName = n === 2 ? 'y = f(u)' : 'y = f(v)';
    st.push(Tx(H(1, 'İç ve dış fonksiyonları belirleyelim') + `${m.fStr}\nKatmanlar (x'ten başlayarak içten dışa):\n${layerLines}\nİç: ${L[0].out} = ${L[0].expr};  dış: ${outName} = ${L[n - 1].expr}${n === 3 ? ';  orta: v = ' + L[1].expr : ''}.`,
      H(1, 'Identifying inner and outer functions') + `${m.fStr}\nLayers (from x, inside out):\n${layerLines}\nInner: ${L[0].out} = ${L[0].expr};  outer: ${outName} = ${L[n - 1].expr}${n === 3 ? ';  middle: v = ' + L[1].expr : ''}.`));
    const dLines = L.map((l) => `${l.dsym} = ${l.dexpr}`).join('\n');
    st.push(Tx(H(2, 'Her katmanın türevini alalım') + dLines, H(2, 'Differentiating each layer') + dLines));
    const leib = L.slice().reverse().map((l) => l.dsym).join(' · ');
    st.push(Tx(H(3, 'Zincir kuralı: türevleri çarpalım') + `dy/dx = ${leib}\nDış türevde ara değişkenleri x cinsinden yazarız:\n${m.chain}`,
      H(3, 'Chain rule: multiplying the derivatives') + `dy/dx = ${leib}\nWe write the intermediate variables in terms of x in the outer derivative:\n${m.chain}`));
    st.push(Tx(H(4, 'Sadeleştirelim') + m.simp, H(4, 'Simplifying') + m.simp));
    const ev = m.evalLines.join('\n');
    st.push(Tx(H(5, `x₀ = ${m.x0s} noktasında değerlendirelim`) + ev, H(5, `Evaluating at x₀ = ${m.x0s}`) + ev));
    const nm = lk.names, vl = lk.vals;
    const vline = nm.map((q, i) => `${i === 0 ? 'x' : q}${i === 0 ? '₀' : '₀'} = ${nf(vl[i], 4)}`).join('     ');
    let prodNum = 1; lk.ders.forEach((d) => { prodNum *= d; });
    const dline = lk.ders.map((d, i) => `${L[i].dsym} = ${nf(d, 4)}`).join('     ');
    st.push(Tx(H(6, 'Halka halka sayısal okuma') + `${vline}\n${dline}\ndy/dx = ${L.slice().reverse().map((l) => l.dsym).join(' · ')} = ${lk.ders.slice().reverse().map((d) => P(nf(d, 4))).join(' · ')} = ${nf(prodNum, 4)}`,
      H(6, 'Link-by-link numeric readout') + `${vline}\n${dline}\ndy/dx = ${L.slice().reverse().map((l) => l.dsym).join(' · ')} = ${lk.ders.slice().reverse().map((d) => P(nf(d, 4))).join(' · ')} = ${nf(prodNum, 4)}`));
    const F = composeF(L);
    const fd = cdiff(F, m.x0);
    st.push(Tx(H(7, 'Sonuç ve kontrol') + `f'(${m.x0s}) = ${m.ans}  (≈ ${nf(m.num, 4)}).\nSayısal kontrol: (f(x₀+h) − f(x₀−h))/(2h) ≈ ${nf(fd, 4)} ✓.\nEğim ${m.num > 1e-9 ? 'pozitif: f artıyor' : m.num < -1e-9 ? 'negatif: f azalıyor' : 'sıfır: yatay teğet'}.`,
      H(7, 'Result and check') + `f'(${m.x0s}) = ${m.ans}  (≈ ${nf(m.num, 4)}).\nNumerical check: (f(x₀+h) − f(x₀−h))/(2h) ≈ ${nf(fd, 4)} ✓.\nThe slope is ${m.num > 1e-9 ? 'positive: f is increasing' : m.num < -1e-9 ? 'negative: f is decreasing' : 'zero: horizontal tangent'}.`));
    const wn = wrongNum(p, m);
    if (Math.abs(wn - m.num) < 1e-9 * (1 + Math.abs(m.num))) {
      st.push(Tx(H(8, 'Sık yapılan hata') + `Bu noktada iç türev(ler) çarpana 1 (ya da sonuç 0) katkı verdiği için "iç türevi atlamak" aynı sayıyı verir; fakat genel x için ${m.simp.replace("f'(x) = ", '')} ifadesindeki iç türev çarpanı atılamaz. Zincir kuralında her katmanın türevi çarpıma girer.`,
        H(8, 'Common mistake') + `At this point the inner derivative(s) contribute a factor of 1 (or the result is 0), so "forgetting the inner derivative" gives the same number; but for general x the inner-derivative factor in ${m.simp.replace("f'(x) = ", '')} cannot be dropped. In the chain rule every layer's derivative enters the product.`));
    } else {
      st.push(Tx(H(8, 'Sık yapılan hata') + `İç türev atlanıp yalnızca dış türev alınsaydı f'(${m.x0s}) = ${m.wrong} (≈ ${nf(wn, 4)}) bulunurdu; bu YANLIŞ olurdu (doğru: ${m.ans}). Zincir kuralında her katmanın türevi çarpıma girer.`,
        H(8, 'Common mistake') + `If the inner derivative were forgotten and only the outer derivative taken, one would get f'(${m.x0s}) = ${m.wrong} (≈ ${nf(wn, 4)}); this is WRONG (correct: ${m.ans}). In the chain rule every layer's derivative enters the product.`));
    }
    return st;
  }
  function wrongNum(p, m) { // outer-only derivative numerically (all layers except the first derivative)
    const L = m.layers;
    let v = m.x0, d = 1;
    for (let i = 0; i < L.length; i++) { const dv = L[i].df(v); v = L[i].f(v); if (i > 0) d *= dv; }
    return d;
  }

  // ---------- drawing ----------
  function focus(p) {
    const m = build(p);
    const y = composeF(m.layers)(m.x0);
    return (isFinite(m.x0) && isFinite(y)) ? { x: m.x0, y } : null;
  }
  function quantView(F, D, x0, hw, showD) {
    const x1 = x0 - hw, x2 = x0 + hw;
    const ys = [];
    for (let i = 0; i <= 240; i++) {
      const x = x1 + (x2 - x1) * i / 240;
      const a = F(x); if (isFinite(a)) ys.push(a);
      if (showD) { const b = D(x); if (isFinite(b)) ys.push(b); }
    }
    ys.sort((u, v) => u - v);
    let lo = 0, hi = 1;
    if (ys.length) {
      lo = ys[Math.floor(ys.length * 0.04)]; hi = ys[Math.min(ys.length - 1, Math.floor(ys.length * 0.96))];
    }
    const must = [F(x0)];
    if (showD) must.push(D(x0));
    must.forEach((v) => { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    if (lo > 0 && lo < (hi - lo)) lo = 0;
    if (hi < 0 && -hi < (hi - lo)) hi = 0;
    let span = hi - lo;
    if (!(span > 1e-6)) { span = 2; lo -= 1; hi += 1; }
    return { x0: x1, x1: x2, y0: lo - 0.15 * span, y1: hi + 0.15 * span };
  }
  function draw(canvas, p) {
    try {
      const m = build(p);
      const F = composeF(m.layers), D = composeD(m.layers);
      const ND = (x) => { const v = F(x); if (!isFinite(v)) return NaN; const h = 1e-5 * (1 + Math.abs(x)); const a = F(x + h), b = F(x - h); return (isFinite(a) && isFinite(b)) ? (a - b) / (2 * h) : NaN; };
      const showD = p.showDeriv || p.showChain;
      const v = quantView(F, D, m.x0, m.hw, showD);
      if (p.kind === 'vb') { const dm = m.domain; const hwv = (dm[1] - dm[0]) / 2; v.x0 = m.x0 - hwv; v.x1 = m.x0 + hwv; }
      canvas.setViewport(v.x0, v.x1, v.y0, v.y1);
      canvas.addFunction({ evaluator: F, color: canvas.accent(), thickness: 3, label: 'f(x)' });
      if (p.showDeriv) canvas.addFunction({ evaluator: ND, color: canvas.purple(), thickness: 3, label: Tx("f'(x) sayısal", "f'(x) numeric") });
      if (p.showChain) canvas.addFunction({ evaluator: D, color: canvas.gold(), thickness: 2, dashed: true, label: Tx('zincir kuralı: dy/du·du/dx', 'chain rule: dy/du·du/dx') });
      const y0 = F(m.x0), d0 = D(m.x0);
      canvas.addGuideLine({ axis: 'vertical', position: m.x0, color: canvas.gray(), label: `x₀ = ${N(m.x0)}` });
      if (isFinite(y0) && isFinite(d0)) {
        if (p.showTan) canvas.addFunction({ evaluator: (u) => { const w = y0 + d0 * (u - m.x0); return Math.abs(w) < 1e5 ? w : NaN; }, color: canvas.orange(), thickness: 2, dashed: true });
        canvas.addMarker({ x: m.x0, y: y0, color: canvas.gold(), radius: 7, label: `f = ${N(y0)}` });
        if (showD) canvas.addMarker({ x: m.x0, y: d0, color: canvas.purple(), radius: 6, label: `f' = ${N(d0)}` });
      }
    } catch (e) {
      canvas.setViewport(-5, 5, -5, 5);
    }
  }

  // ---------- controls ----------
  function applyVisibility(p) {
    const isVb = p.kind === 'vb';
    const show = (el) => { if (el && el.style) el.style.display = isVb ? '' : 'none'; };
    (ctl.rows || []).forEach((r) => { if (r && r.input) show(r.input.parentElement); });
    if (ctl.vbSel && ctl.vbSel.select) { show(ctl.vbSel.select); ctl.vbSel.select.value = String(p.idx === undefined ? 0 : p.idx); }
    show(ctl.vbLabel);
    (ctl.boxes || []).forEach((b) => { if (b && b.refreshFromModel) b.refreshFromModel(); });
  }
  function buildControls(rightCol, getProblem, h) {
    ctl.rows = []; ctl.boxes = [];
    ctl.boxes.push(h.addCheckbox({ caption: Tx("Sayısal türev eğrisi (mor)", 'Numeric derivative curve (purple)'), get: () => getProblem().showDeriv, set: (v) => { getProblem().showDeriv = v; } }));
    ctl.boxes.push(h.addCheckbox({ caption: Tx('Zincir kuralı öngörüsü (kesikli altın)', 'Chain-rule prediction (dashed gold)'), get: () => getProblem().showChain, set: (v) => { getProblem().showChain = v; } }));
    ctl.boxes.push(h.addCheckbox({ caption: Tx('Teğet doğruyu göster', 'Show the tangent line'), get: () => getProblem().showTan, set: (v) => { getProblem().showTan = v; } }));
    const lab = document.createElement('div');
    lab.className = 'we-slider-caption';
    lab.style.fontWeight = '600';
    lab.textContent = Tx('Bileşke fonksiyon (VB örnekleri):', 'Composite function (VB examples):');
    rightCol.appendChild(lab);
    ctl.vbLabel = lab;
    ctl.vbSel = h.addSelect({
      options: VB.map((e, i) => ({ label: e.name, value: i })),
      get: () => (getProblem().idx === undefined ? 0 : getProblem().idx),
      set: (v) => { const q = getProblem(); if (q.kind === 'vb') { q.idx = Number(v); const e = VB[q.idx]; q.x0 = Math.max(e.dMin, Math.min(e.dMax, q.x0)); } },
    });
    ctl.rows.push(h.addSlider({
      caption: Tx('Konum (x)', 'Position (x)'), min: -4, max: 4, step: 0.1,
      get: () => (getProblem().x0 === undefined ? 0 : getProblem().x0),
      set: (v) => { const q = getProblem(); if (q.kind === 'vb') { const e = VB[q.idx]; q.x0 = Math.max(e.dMin, Math.min(e.dMax, Math.round(v * 10) / 10)); } },
    }));
    applyVisibility(getProblem());
  }

  Topics.register('derivatives', {
    id: 'chainRule',
    tabTitle: () => Tx('Zincir Kuralı', 'Chain Rule'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus,
    buildControls,
    links: [
      { match: /^\s+\(f\(g\(x\)\)\)' = f'\(g\(x\)\) · g'\(x\)\s*$/, make: (rng) => genKind(rng, rng.pick(['power', 'sqrt', 'exp', 'ln', 'trigLin'])) },
      { match: /^\s+(Leibniz gösterimi|Leibniz notation):/, make: (rng) => genKind(rng, 'vb') },
      { match: /^\s+(Üç halka|Three links):/, make: (rng) => genKind(rng, rng.pick(['trigPow', 'expTrig', 'lnTrig', 'powpow', 'expSqrt'])) },
      { match: /^\s+\(gⁿ\)' = /, make: (rng) => genKind(rng, rng.pick(['power', 'sqrt'])) },
      { match: /^\s+\(eᵍ\)' = /, make: (rng) => genKind(rng, rng.pick(['exp', 'ln'])) },
      { match: /^\s+\(sin g\)' = /, make: (rng) => genKind(rng, 'trigLin') },
      { match: /^\s+\(aᵍ\)' = /, make: (rng) => genKind(rng, rng.pick(['aExp', 'recip'])) },
    ],
    // test hooks (harmless)
    _check: (p) => {
      const m = build(p);
      const F = composeF(m.layers), D = composeD(m.layers);
      const lk = links(m);
      let prod = 1; lk.ders.forEach((d) => { prod *= d; });
      return { F, D, x0: m.x0, num: m.num, prod, ans: m.ans };
    },
  });
})();
