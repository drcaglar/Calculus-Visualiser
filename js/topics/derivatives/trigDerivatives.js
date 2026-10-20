// Derivatives of trigonometric functions (chapter 'derivatives'). Ported from Modules/Derivatives/TrigDerivativesControl.vb
// (A sin(Bx+C)+D with its derivative curve and a moving point) and extended to worked examples:
//   problem.kind: 'basic'   f = c*T(kx), T in sin,cos,tan,cot,sec,csc, exact value of f'(x0) at a special angle
//                 'product' f = a*x*T(x),  T in sin,cos           (product rule, x0 = m*pi/2)
//                 'quot'    f = T(x)/x                            (quotient rule, x0 = m*pi/2)
//                 'ratio'   f = a*cos x/(1+sin x)  or  a*sin x/(1+cos x)   (quotient rule + Pythagoras)
//                 'limit'   lim x->0 of sin(ax)/(bx), tan(ax)/(bx), sin(ax)/sin(bx), (1-cos ax)/(b x^2), (1-cos ax)/(bx)
//                 'cycle'   n-th derivative of c*sin(kx) / c*cos(kx)
//                 'wave'    f = A*F(Bx+C)+D with sliders (the VB explorer); derivative and slope at a point
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  const N = (v) => M(fmt2(v));
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let t = v.toFixed(dec === undefined ? 4 : dec);
    if (t.indexOf('.') >= 0) t = t.replace(/0+$/, '').replace(/[.]$/, '');
    if (t === '-0') t = '0';
    return M(t);
  }
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (s) => { s = String(s); return (s[0] === '−' || s[0] === '-') ? '(' + s + ')' : s; };
  const PI = Math.PI;
  const FN = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc'];

  // ---------------- exact helpers ----------------
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
  // (n/d)*sqrt(r)
  function E(n, d, r) {
    if (r === 4) { n *= 2; r = 1; } else if (r === 9) { n *= 3; r = 1; }
    if (n === 0) return { n: 0, d: 1, r: 1 };
    const g = gcd(n, d);
    n /= g; d /= g;
    return { n, d, r };
  }
  const eNum = (e) => (e.n / e.d) * Math.sqrt(e.r);
  const eNeg = (e) => E(-e.n, e.d, e.r);
  const eMul = (a, b) => E(a.n * b.n, a.d * b.d, a.r * b.r);
  const eScale = (e, k) => E(e.n * k, e.d, e.r);
  function eInv(e) {
    if (e.n === 0) throw new Error('inv0');
    const sg = e.n < 0 ? -1 : 1;
    return E(sg * e.d, Math.abs(e.n) * e.r, e.r);
  }
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
  function refAng(d) { return d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d; }
  const nd360 = (deg) => ((deg % 360) + 360) % 360;
  function sinE(deg) {
    const d = nd360(deg), ra = refAng(d), v = SIN_T[ra];
    return (d > 180) ? eNeg(v) : v;
  }
  function cosE(deg) {
    const d = nd360(deg), ra = refAng(d), v = COS_T[ra];
    return (d > 90 && d < 270) ? eNeg(v) : v;
  }
  function TvE(fn, deg) {
    switch (fn) {
      case 0: return sinE(deg);
      case 1: return cosE(deg);
      case 2: return eMul(sinE(deg), eInv(cosE(deg)));
      case 3: return eMul(cosE(deg), eInv(sinE(deg)));
      case 4: return eInv(cosE(deg));
      default: return eInv(sinE(deg));
    }
  }
  // value of T'(theta) (signed)
  function TpE(fn, deg) {
    const s = sinE(deg), c = cosE(deg);
    switch (fn) {
      case 0: return c;
      case 1: return eNeg(s);
      case 2: return eInv(eMul(c, c));
      case 3: return eNeg(eInv(eMul(s, s)));
      case 4: return eMul(s, eInv(eMul(c, c)));
      default: return eNeg(eMul(c, eInv(eMul(s, s))));
    }
  }
  function validAngle(fn, deg) {
    const d = nd360(deg);
    if (fn === 2 || fn === 4) return d !== 90 && d !== 270;
    if (fn === 3 || fn === 5) return d !== 0 && d !== 180;
    return true;
  }
  // x = (num/den) * pi as text
  function piStr(n, d) {
    const f = fr(n, d);
    if (f.n === 0) return '0';
    const neg = f.n < 0, a = Math.abs(f.n);
    let s = (a === 1 ? '' : String(a)) + 'π';
    if (f.d !== 1) s += '/' + f.d;
    return (neg ? '−' : '') + s;
  }
  const degPi = (deg) => piStr(deg, 180);
  const xMinus = (x0s) => (x0s === '0' ? 'x' : x0s[0] === '−' ? `x + ${x0s.slice(1)}` : `x − ${x0s}`);
  const coefStr = (K) => (K === 1 ? '' : K === -1 ? '−' : S(K) + '·');
  function sumPi(A, B) {
    let s = '';
    if (A !== 0) s = S(A);
    if (B.n !== 0) {
      const neg = B.n < 0, a = Math.abs(B.n);
      let t = (a === 1 ? '' : String(a)) + 'π';
      if (B.d !== 1) t += '/' + B.d;
      s = s === '' ? (neg ? '−' : '') + t : s + (neg ? ' − ' : ' + ') + t;
    }
    return s === '' ? '0' : s;
  }
  // (n/d) / pi^e
  function fracPi(f, e) {
    if (f.n === 0) return '0';
    const neg = f.n < 0, a = Math.abs(f.n);
    const pp = e === 2 ? 'π²' : 'π';
    const s = f.d === 1 ? a + '/' + pp : a + '/(' + f.d + pp + ')';
    return (neg ? '−' : '') + s;
  }
  const fracPiVal = (f, e) => (f.n / f.d) / Math.pow(PI, e);

  // ---------------- numeric trig (safe near poles) ----------------
  function clip(v) { return (isFinite(v) && Math.abs(v) < 1e3) ? v : NaN; }
  function Tnum(fn, u) {
    const s = Math.sin(u), c = Math.cos(u);
    switch (fn) {
      case 0: return s;
      case 1: return c;
      case 2: return Math.abs(c) < 0.03 ? NaN : clip(s / c);
      case 3: return Math.abs(s) < 0.03 ? NaN : clip(c / s);
      case 4: return Math.abs(c) < 0.03 ? NaN : clip(1 / c);
      default: return Math.abs(s) < 0.03 ? NaN : clip(1 / s);
    }
  }
  function Tpnum(fn, u) {
    const s = Math.sin(u), c = Math.cos(u);
    switch (fn) {
      case 0: return c;
      case 1: return -s;
      case 2: return Math.abs(c) < 0.03 ? NaN : clip(1 / (c * c));
      case 3: return Math.abs(s) < 0.03 ? NaN : clip(-1 / (s * s));
      case 4: return Math.abs(c) < 0.03 ? NaN : clip(s / (c * c));
      default: return Math.abs(s) < 0.03 ? NaN : clip(-c / (s * s));
    }
  }
  const DBODY = ['cos(§)', 'sin(§)', 'sec²(§)', 'csc²(§)', 'sec(§)·tan(§)', 'csc(§)·cot(§)'];
  const DSIGN = [1, -1, 1, -1, 1, -1];
  const dText = (fn, arg) => (DSIGN[fn] < 0 ? '−' : '') + DBODY[fn].replace(/§/g, arg);
  const cdiff = (f, x, h) => { h = h || 1e-5; return (f(x + h) - f(x - h)) / (2 * h); };

  // ---------------- problem creation ----------------
  const ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
  const ctl = { rows: null, famSel: null, boxes: [] };

  function famName(i) { return ['sin', 'cos', 'tan'][i]; }

  function createProblem(rng) {
    const kinds = ['basic', 'basic', 'basic', 'product', 'quot', 'ratio', 'limit', 'cycle', 'wave'];
    return genKind(rng, rng.pick(kinds));
  }
  function genKind(rng, kind, opt) {
    opt = opt || {};
    const p = { kind, showDeriv: true, showTan: true };
    switch (kind) {
      case 'basic': {
        p.fn = rng.nextInt(0, 6);
        if (opt.fn !== undefined) p.fn = opt.fn;
        p.k = rng.pick([1, 1, 2, 2, 3, 4]);
        if (opt.chain) p.k = rng.pick([2, 3, 4]);
        p.c = rng.pick([1, 1, 2, 3, 4, 5, -1, -2, -3]);
        let th;
        do { th = rng.pick(ANGLES); } while (!validAngle(p.fn, th));
        if (th !== 0 && rng.nextInt(0, 3) === 0) th = -th;
        p.th = th;           // theta = k*x0 in degrees
        p.x0deg = th / p.k;  // x0 in degrees (may be a non-integer: stored as fraction n/k)
        break;
      }
      case 'product':
        p.T = rng.nextInt(0, 2); p.a = rng.pick([1, 1, 2, 3, 4, -1, -2]); p.m = rng.pick([-3, -2, -1, 1, 2, 3, 4, 5]);
        break;
      case 'quot':
        p.T = rng.nextInt(0, 2); p.m = rng.pick([-3, -2, -1, 1, 2, 3, 4]);
        break;
      case 'ratio': {
        p.form = rng.nextInt(0, 2); // 0: cos/(1+sin)  1: sin/(1+cos)
        p.a = rng.pick([1, 1, 2, 3, -1, -2, 4]);
        const list = p.form === 0 ? [-30, 0, 30, 150, 180, 210, 330] : [-120, -60, 0, 60, 90, 120, 240, 270, 300];
        p.deg = rng.pick(list);
        break;
      }
      case 'limit': {
        p.form = rng.nextInt(0, 6);
        p.a = rng.nonZeroInt(-6, 6);
        p.b = rng.nonZeroInt(-5, 5);
        if (p.form === 0 || p.form === 1 || p.form === 2) { if (p.a === p.b && rng.nextInt(0, 3) > 0) p.a = p.a + (p.a > 0 ? 1 : -1); }
        if (p.form >= 3) { p.a = rng.pick([1, 2, 3, 4, 5, 6, -2, -3]); p.b = rng.pick([1, 1, 2, 3, 4]); }
        break;
      }
      case 'cycle': {
        p.T = rng.nextInt(0, 2);
        p.k = rng.pick([1, 1, 2, 3]);
        p.c = rng.pick([1, 2, 3, -1, -2, 5]);
        p.n = p.k === 1 ? rng.nextInt(3, 12) : p.k === 2 ? rng.nextInt(3, 7) : rng.nextInt(3, 6);
        break;
      }
      default: { // wave
        p.fam = rng.nextInt(0, 3);
        p.A = rng.pick([1, 2, 3, -1, -2]);
        p.B = rng.pick([0.5, 1, 1, 1.5, 2, 3]);
        p.C = rng.pick([0, 0, 0.5, 1, -1, 1.5]);
        p.D = rng.pick([0, 0, 1, -1, 2]);
        p.xp = rng.pick([-3, -2, -1, 0, 1, 2, 3]);
        break;
      }
    }
    applyVisibility(p);
    return p;
  }

  // ---------------- model: numeric function + derivative per kind ----------------
  function waveF(p) {
    return (x) => { const v = p.A * Tnum(p.fam, p.B * x + p.C) + p.D; return v; };
  }
  function waveD(p) {
    return (x) => { const v = p.A * p.B * Tpnum(p.fam, p.B * x + p.C); return v; };
  }
  function x0Rad(p) { // basic
    return (p.th / p.k) * PI / 180;
  }
  function model(p) {
    switch (p.kind) {
      case 'basic': return { F: (x) => p.c * Tnum(p.fn, p.k * x), D: (x) => p.c * p.k * Tpnum(p.fn, p.k * x), x0: x0Rad(p) };
      case 'product': {
        const T = p.T;
        return { F: (x) => p.a * x * (T === 0 ? Math.sin(x) : Math.cos(x)), D: (x) => p.a * (T === 0 ? Math.sin(x) + x * Math.cos(x) : Math.cos(x) - x * Math.sin(x)), x0: p.m * PI / 2 };
      }
      case 'quot': {
        const T = p.T;
        return {
          F: (x) => (Math.abs(x) < 1e-9 ? NaN : (T === 0 ? Math.sin(x) : Math.cos(x)) / x),
          D: (x) => (Math.abs(x) < 1e-9 ? NaN : (x * (T === 0 ? Math.cos(x) : -Math.sin(x)) - (T === 0 ? Math.sin(x) : Math.cos(x))) / (x * x)),
          x0: p.m * PI / 2,
        };
      }
      case 'ratio': {
        const a = p.a;
        if (p.form === 0) return { F: (x) => { const d = 1 + Math.sin(x); return Math.abs(d) < 0.03 ? NaN : a * Math.cos(x) / d; }, D: (x) => { const d = 1 + Math.sin(x); return Math.abs(d) < 0.03 ? NaN : clip(-a / d); }, x0: p.deg * PI / 180 };
        return { F: (x) => { const d = 1 + Math.cos(x); return Math.abs(d) < 0.03 ? NaN : a * Math.sin(x) / d; }, D: (x) => { const d = 1 + Math.cos(x); return Math.abs(d) < 0.03 ? NaN : clip(a / d); }, x0: p.deg * PI / 180 };
      }
      case 'cycle': {
        const w = (p.T === 0) ? Math.sin : Math.cos;
        const dw = (p.T === 0) ? Math.cos : (u) => -Math.sin(u);
        return { F: (x) => p.c * w(p.k * x), D: (x) => p.c * p.k * dw(p.k * x), x0: 0 };
      }
      case 'wave': return { F: waveF(p), D: waveD(p), x0: p.xp };
      default: return null;
    }
  }
  function limitF(p) {
    const a = p.a, b = p.b;
    switch (p.form) {
      case 0: return (x) => (Math.abs(x) < 1e-9 ? NaN : Math.sin(a * x) / (b * x));
      case 1: return (x) => { if (Math.abs(x) < 1e-9) return NaN; return clip(Math.tan(a * x) / (b * x)); };
      case 2: return (x) => { const d = Math.sin(b * x); return Math.abs(d) < 1e-9 ? NaN : Math.sin(a * x) / d; };
      case 3: return (x) => (Math.abs(x) < 1e-9 ? NaN : (1 - Math.cos(a * x)) / (b * x * x));
      case 4: return (x) => (Math.abs(x) < 1e-9 ? NaN : (1 - Math.cos(a * x)) / (b * x));
      default: return (x) => (Math.abs(x) < 1e-9 ? NaN : Math.sin(a * x) * Math.sin(a * x) / (b * x * x));
    }
  }
  function limitVal(p) { // exact fraction
    switch (p.form) {
      case 0: case 1: case 2: return fr(p.a, p.b);
      case 3: return fr(p.a * p.a, 2 * p.b);
      case 4: return fr(0, 1);
      default: return fr(p.a * p.a, p.b);
    }
  }
  function cycleShape(p) { // returns {name:'sin'|'cos', sign:+1|-1} of the n-th derivative of T(kx) (without k^n, c)
    const r = p.n % 4;
    if (p.T === 0) return [{ name: 'sin', sign: 1 }, { name: 'cos', sign: 1 }, { name: 'sin', sign: -1 }, { name: 'cos', sign: -1 }][r];
    return [{ name: 'cos', sign: 1 }, { name: 'sin', sign: -1 }, { name: 'cos', sign: -1 }, { name: 'sin', sign: 1 }][r];
  }
  function cycleCoef(p) { return p.c * Math.pow(p.k, p.n) * cycleShape(p).sign; }
  function cycleNum(p) {
    const sh = cycleShape(p);
    const w = sh.name === 'sin' ? Math.sin : Math.cos;
    const K = p.c * Math.pow(p.k, p.n) * sh.sign;
    return (x) => K * w(p.k * x);
  }

  // ---------------- text pieces ----------------
  function kxStr(k) { return k === 1 ? 'x' : S(k) + 'x'; }
  function fText(p) {
    switch (p.kind) {
      case 'basic': return `f(x) = ${coefStr(p.c)}${FN[p.fn]}(${kxStr(p.k)})`;
      case 'product': return `f(x) = ${p.a === 1 ? '' : p.a === -1 ? '−' : S(p.a)}x ${p.T === 0 ? 'sin' : 'cos'} x`;
      case 'quot': return `f(x) = ${p.T === 0 ? 'sin' : 'cos'} x / x`;
      case 'ratio': return p.form === 0 ? `f(x) = ${coefStr(p.a)}cos x / (1 + sin x)` : `f(x) = ${coefStr(p.a)}sin x / (1 + cos x)`;
      case 'cycle': return `f(x) = ${coefStr(p.c)}${p.T === 0 ? 'sin' : 'cos'}(${kxStr(p.k)})`;
      case 'wave': return waveText(p);
      default: return '';
    }
  }
  function waveText(p) {
    return `f(x) = ${N(p.A)}·${famName(p.fam)}(${N(p.B)}x ${p.C >= 0 ? '+' : '−'} ${N(Math.abs(p.C))}) ${p.D >= 0 ? '+' : '−'} ${N(Math.abs(p.D))}`;
  }
  function limitText(p) {
    const ax = (p.a === 1 ? '' : S(p.a)) + 'x', bx = (p.b === 1 ? '' : S(p.b)) + 'x';
    const bb = p.b === 1 ? '' : S(p.b);
    switch (p.form) {
      case 0: return `lim(x→0) sin(${ax}) / (${bx})`;
      case 1: return `lim(x→0) tan(${ax}) / (${bx})`;
      case 2: return `lim(x→0) sin(${ax}) / sin(${bx})`;
      case 3: return `lim(x→0) (1 − cos(${ax})) / (${bb}x²)`;
      case 4: return `lim(x→0) (1 − cos(${ax})) / (${bx})`;
      default: return `lim(x→0) sin²(${ax}) / (${bb}x²)`;
    }
  }

  function problemStatement(p) {
    switch (p.kind) {
      case 'basic': {
        const x0 = piStr(p.th, 180 * p.k);
        return Tx(`${fText(p)} fonksiyonunun f'(x) türevini bulalım; sonra f'(${x0}) değerini kesin (köklü/kesirli) biçimde hesaplayıp bu noktadaki teğetin denklemini yazabiliriz.`,
          `Let's find the derivative f'(x) of ${fText(p)}; then we can compute f'(${x0}) exactly (with radicals/fractions) and write the equation of the tangent line at that point.`);
      }
      case 'product':
        return Tx(`${fText(p)} için çarpım kuralıyla f'(x) ifadesini bulalım ve f'(${piStr(p.m, 2)}) değerini hesaplayalım.`,
          `For ${fText(p)}, let's use the product rule to find f'(x) and then compute f'(${piStr(p.m, 2)}).`);
      case 'quot':
        return Tx(`${fText(p)} için bölüm kuralıyla f'(x) ifadesini bulalım ve f'(${piStr(p.m, 2)}) değerini hesaplayalım.`,
          `For ${fText(p)}, let's use the quotient rule to find f'(x) and then compute f'(${piStr(p.m, 2)}).`);
      case 'ratio':
        return Tx(`${fText(p)} için bölüm kuralını uygulayıp sin²x + cos²x = 1 özdeşliğiyle sadeleştirebilir, sonra f'(${degPi(p.deg)}) değerini bulabiliriz.`,
          `For ${fText(p)}, we can apply the quotient rule, simplify with sin²x + cos²x = 1, and then find f'(${degPi(p.deg)}).`);
      case 'limit':
        return Tx(`${limitText(p)} limitini, lim(x→0) sin x / x = 1 bilgisinden ve gerekli cebirsel düzenlemeden yararlanarak hesaplayalım.`,
          `Let's evaluate ${limitText(p)} using lim(x→0) sin x / x = 1 and the algebra needed to reach that form.`);
      case 'cycle':
        return Tx(`${fText(p)} fonksiyonunun ${p.n}. türevi f^(${p.n})(x) nedir? Türevlerin döngüsünden yararlanıp f^(${p.n})(0) değerini de yazabiliriz.`,
          `Let's find the ${p.n}th derivative f^(${p.n})(x) of ${fText(p)} (using the cycle of derivatives) and state f^(${p.n})(0).`);
      default:
        return Tx(`${waveText(p)} için f'(x) türevini yazalım ve x = ${N(p.xp)} noktasındaki eğimi bulalım (kaydırıcılarla A, B, C, D değerlerini ve noktayı değiştirebiliriz).`,
          `For ${waveText(p)}, let's write f'(x) and find the slope at x = ${N(p.xp)} (we can change A, B, C, D and the point with the sliders).`);
    }
  }

  // ---------------- concept ----------------
  function concept() {
    return Tx(
      "TANIM: Trigonometrik fonksiyonların türevleri birim çemberden ve temel limit lim(x→0) sin x / x = 1 bilgisinden çıkar. Açılar her zaman RADYAN cinsinden alınır.\n" +
      "\n" +
      "TÜREV TABLOSU:\n" +
      "   (sin x)' = cos x\n" +
      "   (cos x)' = −sin x\n" +
      "   (tan x)' = sec²x = 1/cos²x\n" +
      "   (cot x)' = −csc²x\n" +
      "   (sec x)' = sec x · tan x\n" +
      "   (csc x)' = −csc x · cot x\n" +
      "\n" +
      "ZİNCİR KURALIYLA (iç fonksiyon g(x) = u):\n" +
      "   (sin g)' = cos g · g'      (cos g)' = −sin g · g'\n" +
      "   (tan g)' = sec²g · g'      (sec g)' = sec g · tan g · g'\n" +
      "   Örnek: (sin 5x)' = 5 cos 5x.\n" +
      "\n" +
      "ÇARPIM / BÖLÜM KURALI: (u·v)' = u'v + uv'    (u/v)' = (u'v − uv') / v².\n" +
      "   tan x = sin x / cos x yazıp bölüm kuralını uygularsak tablodaki (tan x)' = sec²x sonucunu kendimiz bulabiliriz.\n" +
      "\n" +
      "ÖZEL LİMİTLER (türevin temeli):\n" +
      "   lim(x→0) sin x / x = 1,   lim(x→0) (1 − cos x) / x = 0,   lim(x→0) (1 − cos x) / x² = 1/2.\n" +
      "   Genel: lim sin(ax)/(bx) = a/b, lim tan(ax)/(bx) = a/b, lim (1 − cos ax)/x² = a²/2.\n" +
      "   Neden? (sin x)'|₀ = lim (sin h − sin 0)/h = lim sin h / h = 1 = cos 0.\n" +
      "\n" +
      "BELLEK İPUCU:\n" +
      "   - Adı 'co' ile başlayan fonksiyonların (cos, cot, csc) türevi EKSİ işaretlidir.\n" +
      "   - Çevrim: sin → cos → −sin → −cos → sin (4 türevde başa döner). n. türev için n'i 4'e bölüp kalana bakabiliriz.\n" +
      "\n" +
      "YÖNTEM:\n" +
      "   (1) Önce trig terimini bulalım; argüman yalnız x mi, yoksa bir bileşke (örn. 3x, x²) mi?\n" +
      "   (2) Tablodan ilgili türevi seçeriz.\n" +
      "   (3) Argüman x değilse iç türevle ÇARPARIZ (zincir kuralı).\n" +
      "   (4) Çarpım/bölüm varsa ilgili kural kullanılır; gerekirse sin, cos cinsinden sadeleştirebiliriz (sin² + cos² = 1).\n" +
      "   (5) Verilen noktada özel açı değerlerini (30°, 45°, 60°, 90° …) yerine koyarız; teğet: y − f(x₀) = f'(x₀)(x − x₀).\n" +
      "\n" +
      "ÖZEL DURUMLAR / SIK YAPILAN HATALAR:\n" +
      "   - Derece değil radyan: d/dx sin(x°) = (π/180)·cos(x°).\n" +
      "   - (sin x)² ile sin(x²) farklıdır: türevleri 2 sin x cos x ve 2x cos(x²).\n" +
      "   - tan x ve sec x, π/2 + kπ'de tanımsızdır; cot x ve csc x, kπ'de tanımsızdır; türevleri de orada tanımsızdır.\n" +
      "   - cos'un türevindeki eksi işaretini ve iç türevi (örn. 3cos 3x'teki 3) unutmak en yaygın hatadır.\n" +
      "\n" +
      "MİNİ ÖRNEK: f(x) = x sin x ⇒ f' = sin x + x cos x. g(x) = tan 2x ⇒ g' = 2 sec²(2x). h(x) = sin 3x ⇒ h'(π/6) = 3 cos(π/2) = 0 (teğet yatay).\n" +
      "\n" +
      "BU SEKMEDEKİ ÖRNEKLER: tablo + zincir kuralı (özel açılarda kesin değer), çarpım kuralı, bölüm kuralı, sin x / x limitleri, n. türev döngüsü ve (kaydırıcılı) A·sin(Bx+C)+D keşfi. Grafikte f vurgu renginde, f' mor, teğet kesikli turuncu çizilir.",
      "DEFINITION: The derivatives of the trigonometric functions follow from the unit circle and the basic limit lim(x→0) sin x / x = 1. Angles must always be in RADIANS.\n" +
      "\n" +
      "DERIVATIVE TABLE:\n" +
      "   (sin x)' = cos x\n" +
      "   (cos x)' = −sin x\n" +
      "   (tan x)' = sec²x = 1/cos²x\n" +
      "   (cot x)' = −csc²x\n" +
      "   (sec x)' = sec x · tan x\n" +
      "   (csc x)' = −csc x · cot x\n" +
      "\n" +
      "WITH THE CHAIN RULE (inner function g(x) = u):\n" +
      "   (sin g)' = cos g · g'      (cos g)' = −sin g · g'\n" +
      "   (tan g)' = sec²g · g'      (sec g)' = sec g · tan g · g'\n" +
      "   Example: (sin 5x)' = 5 cos 5x.\n" +
      "\n" +
      "PRODUCT / QUOTIENT RULE: (u·v)' = u'v + uv'    (u/v)' = (u'v − uv') / v².\n" +
      "   If we write tan x = sin x / cos x and apply the quotient rule, we rediscover (tan x)' = sec²x.\n" +
      "\n" +
      "SPECIAL LIMITS (the foundation of these derivatives):\n" +
      "   lim(x→0) sin x / x = 1,   lim(x→0) (1 − cos x) / x = 0,   lim(x→0) (1 − cos x) / x² = 1/2.\n" +
      "   General: lim sin(ax)/(bx) = a/b, lim tan(ax)/(bx) = a/b, lim (1 − cos ax)/x² = a²/2.\n" +
      "   Why? (sin x)'|₀ = lim (sin h − sin 0)/h = lim sin h / h = 1 = cos 0.\n" +
      "\n" +
      "MEMORY AIDS:\n" +
      "   - Functions whose name starts with 'co' (cos, cot, csc) have a MINUS sign in their derivative.\n" +
      "   - Cycle: sin → cos → −sin → −cos → sin (back to the start after 4 derivatives). For the n-th derivative we can divide n by 4 and look at the remainder.\n" +
      "\n" +
      "METHOD:\n" +
      "   (1) First we find the trig term; is the argument just x, or a composition (e.g. 3x, x²)?\n" +
      "   (2) We pick the matching derivative from the table.\n" +
      "   (3) If the argument is not x, we MULTIPLY by the inner derivative (chain rule).\n" +
      "   (4) We use the product/quotient rule if needed and simplify in terms of sin, cos if helpful (sin² + cos² = 1).\n" +
      "   (5) At the given point we substitute the special-angle values (30°, 45°, 60°, 90° …); tangent: y − f(x₀) = f'(x₀)(x − x₀).\n" +
      "\n" +
      "SPECIAL CASES / COMMON PITFALLS:\n" +
      "   - Radians, not degrees: d/dx sin(x°) = (π/180)·cos(x°).\n" +
      "   - (sin x)² and sin(x²) differ: their derivatives are 2 sin x cos x and 2x cos(x²).\n" +
      "   - tan x and sec x are not defined at π/2 + kπ; cot x and csc x at kπ; their derivatives are not defined there either.\n" +
      "   - Forgetting the minus sign in the derivative of cos, or the inner derivative (the 3 in 3cos 3x), is the most common mistake.\n" +
      "\n" +
      "MINI EXAMPLE: f(x) = x sin x ⇒ f' = sin x + x cos x. g(x) = tan 2x ⇒ g' = 2 sec²(2x). h(x) = sin 3x ⇒ h'(π/6) = 3 cos(π/2) = 0 (horizontal tangent).\n" +
      "\n" +
      "EXAMPLES IN THIS TAB: table + chain rule (exact values at special angles), product rule, quotient rule, sin x / x limits, the n-th derivative cycle, and the A·sin(Bx+C)+D explorer with sliders. On the graph f is drawn in the accent colour, f' in purple, and the tangent as a dashed orange line.");
  }

  // ---------------- steps ----------------
  const H = (n, t) => `── ${n}) ${t} ──\n`;

  function stepsBasic(p) {
    const fn = p.fn, nm = FN[fn], k = p.k, c = p.c;
    const th = p.th, x0s = piStr(th, 180 * k), ths = degPi(th);
    const kx = kxStr(k);
    const Ke = c * k;
    const K = Ke * DSIGN[fn];
    const final = `${coefStr(K)}${DBODY[fn].replace(/§/g, kx)}`;
    const sE = sinE(th), cE = cosE(th), tv = TvE(fn, th), tp = TpE(fn, th);
    const ans = eScale(tp, Ke);
    const fv = eScale(tv, c);
    const st = [];
    st.push(Tx(H(1, 'Dış ve iç fonksiyon') + `${fText(p)}.\nDış fonksiyon: ${coefStr(c)}${nm}(u),  iç fonksiyon: u = ${kx}  ⇒  du/dx = ${k}.`,
      H(1, 'Outer and inner function') + `${fText(p)}.\nOuter function: ${coefStr(c)}${nm}(u),  inner function: u = ${kx}  ⇒  du/dx = ${k}.`));
    st.push(Tx(H(2, 'Tablodan dış türev') + `(${nm} u)' = ${dText(fn, 'u')}.`,
      H(2, 'Outer derivative from the table') + `(${nm} u)' = ${dText(fn, 'u')}.`));
    st.push(Tx(H(3, 'Zincir kuralı: dış türev × iç türev') + `f'(x) = ${P(S(c))} · (${nm} u)' · u' = ${P(S(c))} · [${dText(fn, kx)}] · ${P(S(k))}\nf'(x) = ${final}.`,
      H(3, 'Chain rule: outer derivative × inner derivative') + `f'(x) = ${P(S(c))} · (${nm} u)' · u' = ${P(S(c))} · [${dText(fn, kx)}] · ${P(S(k))}\nf'(x) = ${final}.`));
    const dom = (fn === 2 || fn === 4) ? Tx(`cos θ = ${eStr(cE)} ≠ 0, tanım kümesinde.`, `cos θ = ${eStr(cE)} ≠ 0, so θ is in the domain.`)
      : (fn === 3 || fn === 5) ? Tx(`sin θ = ${eStr(sE)} ≠ 0, tanım kümesinde.`, `sin θ = ${eStr(sE)} ≠ 0, so θ is in the domain.`)
        : Tx('Bu fonksiyon her θ için tanımlıdır.', 'This function is defined for every θ.');
    st.push(Tx(H(4, 'Açıyı hesaplayalım') + `x₀ = ${x0s}  ⇒  θ = ${kx.replace('x', '')}${k === 1 ? '' : '·'}x₀ = ${ths}  (${S(th)}°).\n${dom}`,
      H(4, 'Compute the angle') + `x₀ = ${x0s}  ⇒  θ = ${k === 1 ? '' : k + '·'}x₀ = ${ths}  (${S(th)}°).\n${dom}`));
    let vals = `sin θ = ${eStr(sE)},   cos θ = ${eStr(cE)}`;
    if (fn === 2) vals += `\nsec²θ = 1/cos²θ = ${eStr(tp)}`;
    else if (fn === 3) vals += `\ncsc²θ = 1/sin²θ = ${eStr(eNeg(tp))}`;
    else if (fn === 4) vals += `\nsec θ = 1/cos θ = ${eStr(eInv(cE))},   tan θ = sin θ / cos θ = ${eStr(TvE(2, th))}\nsec θ·tan θ = ${eStr(tp)}`;
    else if (fn === 5) vals += `\ncsc θ = 1/sin θ = ${eStr(eInv(sE))},   cot θ = cos θ / sin θ = ${eStr(TvE(3, th))}\ncsc θ·cot θ = ${eStr(eNeg(tp))}`;
    st.push(Tx(H(5, 'Özel açı değerleri') + vals, H(5, 'Special-angle values') + vals));
    st.push(Tx(H(6, "f'(x₀) değerini hesaplayalım") + `(${nm} u)' θ'da: ${dText(fn, 'θ')} = ${eStr(tp)}\nf'(x₀) = ${P(S(c))}·${P(S(k))}·(${eStr(tp)}) = ${P(S(Ke))}·(${eStr(tp)}) = ${eStr(ans)}  (≈ ${N(eNum(ans))}).`,
      H(6, "Evaluate f'(x₀)") + `(${nm} u)' at θ: ${dText(fn, 'θ')} = ${eStr(tp)}\nf'(x₀) = ${P(S(c))}·${P(S(k))}·(${eStr(tp)}) = ${P(S(Ke))}·(${eStr(tp)}) = ${eStr(ans)}  (≈ ${N(eNum(ans))}).`));
    const tline = tangentLine(fv, ans, x0s, th === 0);
    st.push(Tx(H(7, 'Fonksiyon değeri ve teğet') + `f(x₀) = ${P(S(c))}·${nm}(θ) = ${P(S(c))}·(${eStr(tv)}) = ${eStr(fv)}.\nTeğet: ${tline}`,
      H(7, 'Function value and tangent') + `f(x₀) = ${P(S(c))}·${nm}(θ) = ${P(S(c))}·(${eStr(tv)}) = ${eStr(fv)}.\nTangent: ${tline}`));
    const mf = (x) => p.c * Tnum(p.fn, p.k * x);
    const fd = cdiff(mf, x0Rad(p));
    const sgnTr = eNum(ans) > 1e-12 ? 'f artan' : eNum(ans) < -1e-12 ? 'f azalan' : 'teğet yatay';
    const sgnEn = eNum(ans) > 1e-12 ? 'f is increasing' : eNum(ans) < -1e-12 ? 'f is decreasing' : 'the tangent is horizontal';
    st.push(Tx(H(8, 'Kontrol ve yorum') + `Sayısal kontrol: (f(x₀+h) − f(x₀−h))/(2h) ≈ ${N(fd)}  ✓ (≈ ${N(eNum(ans))}).\nYorum: eğim ${N(eNum(ans))} ⇒ ${sgnTr} (x₀ civarında).\nNot: iç türev ${k} unutulsaydı ${eStr(eScale(tp, c))} bulunurdu (yanlış).`,
      H(8, 'Check and interpretation') + `Numerical check: (f(x₀+h) − f(x₀−h))/(2h) ≈ ${N(fd)}  ✓ (≈ ${N(eNum(ans))}).\nInterpretation: slope ${N(eNum(ans))} ⇒ ${sgnEn} near x₀.\nWarning: forgetting the inner derivative ${k} would give ${eStr(eScale(tp, c))} (wrong).`));
    return st;
  }
  function tangentLine(fvE, mE, x0s, x0zero) {
    const xs = x0zero ? 'x' : `(${xMinus(x0s)})`;
    const lhs = fvE.n === 0 ? 'y' : `y − ${P(eStr(fvE))}`;
    if (mE.n === 0) return fvE.n === 0 ? 'y = 0' : `y = ${eStr(fvE)}`;
    return `${lhs} = ${P(eStr(mE))}${xs.startsWith('(') ? '' : '·'}${xs}`;
  }

  function stepsProduct(p) {
    const a = p.a, m = p.m, T = p.T, nm = T === 0 ? 'sin' : 'cos';
    const idx = ((m % 4) + 4) % 4;
    const s = [0, 1, 0, -1][idx], c = [1, 0, -1, 0][idx];
    const x0s = piStr(m, 2);
    const Tv = T === 0 ? s : c, Tp = T === 0 ? c : -s;
    const A = a * Tv, B = fr(a * Tp * m, 2);
    const val = sumPi(A, B);
    const num = A + frV(B) * PI;
    const aS = a === 1 ? '' : a === -1 ? '−' : S(a);
    const Tpn = T === 0 ? 'cos x' : '−sin x';
    const st = [];
    st.push(Tx(H(1, 'Çarpımı tanıyalım') + `${fText(p)} = u·v,  u = ${aS}x,  v = ${nm} x.`,
      H(1, 'Recognise the product') + `${fText(p)} = u·v,  u = ${aS}x,  v = ${nm} x.`));
    st.push(Tx(H(2, 'Çarpım kuralı') + `(u·v)' = u'·v + u·v'.\nu' = ${a},  v' = ${Tpn}.`, H(2, 'Product rule') + `(u·v)' = u'·v + u·v'.\nu' = ${a},  v' = ${Tpn}.`));
    const fp = T === 0 ? `${S(a)}·sin x + ${aS}x·cos x` : `${S(a)}·cos x − ${aS}x·sin x`;
    st.push(Tx(H(3, 'Yerine koyalım') + `f'(x) = ${fp}.\nOrtak çarpan: f'(x) = ${a === 1 ? '' : P(S(a))}(${T === 0 ? 'sin x + x cos x' : 'cos x − x sin x'}).`,
      H(3, 'Substitute') + `f'(x) = ${fp}.\nFactor form: f'(x) = ${a === 1 ? '' : P(S(a))}(${T === 0 ? 'sin x + x cos x' : 'cos x − x sin x'}).`));
    st.push(Tx(H(4, 'Özel açı değerleri') + `x₀ = ${x0s}:  sin x₀ = ${S(s)},  cos x₀ = ${S(c)}.`, H(4, 'Special-angle values') + `x₀ = ${x0s}:  sin x₀ = ${S(s)},  cos x₀ = ${S(c)}.`));
    const sub = T === 0 ? `${a}·(${S(s)}) + ${a}·(${x0s})·(${S(c)})` : `${a}·(${S(c)}) − ${a}·(${x0s})·(${S(s)})`;
    st.push(Tx(H(5, "f'(x₀) değeri") + `f'(${x0s}) = ${sub} = ${val}  (≈ ${N(num)}).`, H(5, "The value f'(x₀)") + `f'(${x0s}) = ${sub} = ${val}  (≈ ${N(num)}).`));
    const f0 = sumPi(0, fr(a * Tv * m, 2));
    const fd = cdiff(model(p).F, m * PI / 2);
    st.push(Tx(H(6, 'Kontrol ve teğet') + `f(${x0s}) = ${f0}.  Teğet: y − (${f0}) = (${val})(${xMinus(x0s)}).\nSayısal kontrol: simetrik fark ≈ ${N(fd)} ✓.`,
      H(6, 'Check and tangent') + `f(${x0s}) = ${f0}.  Tangent: y − (${f0}) = (${val})(${xMinus(x0s)}).\nNumerical check: symmetric difference ≈ ${N(fd)} ✓.`));
    return st;
  }

  function quotAns(p) {
    const m = p.m, idx = ((m % 4) + 4) % 4;
    const s = [0, 1, 0, -1][idx], c = [1, 0, -1, 0][idx];
    const Tv = p.T === 0 ? s : c, Tp = p.T === 0 ? c : -s;
    // N = x0*Tp - Tv ; one of Tv, Tp is zero
    if (Tp === 0) return { f: fr(-4 * Tv, m * m), e: 2, Tv, Tp, s, c };
    return { f: fr(2 * Tp, m), e: 1, Tv, Tp, s, c };
  }
  function stepsQuot(p) {
    const m = p.m, T = p.T, nm = T === 0 ? 'sin' : 'cos';
    const x0s = piStr(m, 2);
    const q = quotAns(p);
    const Tpn = T === 0 ? 'cos x' : '−sin x';
    const st = [];
    st.push(Tx(H(1, 'Bölümü tanıyalım') + `${fText(p)} = u/v,  u = ${nm} x,  v = x  (x ≠ 0).`, H(1, 'Recognise the quotient') + `${fText(p)} = u/v,  u = ${nm} x,  v = x  (x ≠ 0).`));
    st.push(Tx(H(2, 'Bölüm kuralı') + `(u/v)' = (u'v − uv') / v².\nu' = ${Tpn},  v' = 1.`, H(2, 'Quotient rule') + `(u/v)' = (u'v − uv') / v².\nu' = ${Tpn},  v' = 1.`));
    const fp = `(x·(${Tpn}) − ${nm} x·1) / x²`;
    const fps = T === 0 ? '(x cos x − sin x) / x²' : '(−x sin x − cos x) / x²';
    st.push(Tx(H(3, 'Yerine koyun') + `f'(x) = ${fp} = ${fps}.`, H(3, 'Substitute') + `f'(x) = ${fp} = ${fps}.`));
    st.push(Tx(H(4, 'Özel açı değerleri') + `x₀ = ${x0s}:  sin x₀ = ${S(q.s)},  cos x₀ = ${S(q.c)},  x₀² = ${m * m === 1 ? '' : (m * m) + ''}π²/4.`,
      H(4, 'Special-angle values') + `x₀ = ${x0s}:  sin x₀ = ${S(q.s)},  cos x₀ = ${S(q.c)},  x₀² = ${m * m === 1 ? '' : (m * m) + ''}π²/4.`));
    const numer = sumPi(-q.Tv, fr(q.Tp * m, 2));
    st.push(Tx(H(5, 'Payı hesaplayalım') + `Pay: x₀·(${S(q.Tp)}) − (${S(q.Tv)}) = ${numer}.\nPayda: x₀² = ${m * m === 1 ? '' : (m * m)}π²/4.`,
      H(5, 'Compute the numerator') + `Numerator: x₀·(${S(q.Tp)}) − (${S(q.Tv)}) = ${numer}.\nDenominator: x₀² = ${m * m === 1 ? '' : (m * m)}π²/4.`));
    const ansS = fracPi(q.f, q.e);
    const ansN = fracPiVal(q.f, q.e);
    st.push(Tx(H(6, 'Sonuç') + `f'(${x0s}) = ${ansS}  (≈ ${N(ansN)}).`, H(6, 'Result') + `f'(${x0s}) = ${ansS}  (≈ ${N(ansN)}).`));
    const fd = cdiff(model(p).F, m * PI / 2);
    st.push(Tx(H(7, 'Kontrol') + `Sayısal kontrol: (f(x₀+h) − f(x₀−h))/(2h) ≈ ${N(fd)} ✓.\nYorum: ${ansN > 0 ? 'f artan' : ansN < 0 ? 'f azalan' : 'teğet yatay'} (x₀ civarında).`,
      H(7, 'Check') + `Numerical check: (f(x₀+h) − f(x₀−h))/(2h) ≈ ${N(fd)} ✓.\nInterpretation: ${ansN > 0 ? 'f is increasing' : ansN < 0 ? 'f is decreasing' : 'the tangent is horizontal'} near x₀.`));
    return st;
  }

  function sinFr(deg) { const d = nd360(deg); return { 0: fr(0), 30: fr(1, 2), 90: fr(1), 150: fr(1, 2), 180: fr(0), 210: fr(-1, 2), 270: fr(-1), 330: fr(-1, 2) }[d]; }
  function cosFr(deg) { const d = nd360(deg); return { 0: fr(1), 60: fr(1, 2), 90: fr(0), 120: fr(-1, 2), 180: fr(-1), 240: fr(-1, 2), 270: fr(0), 300: fr(1, 2) }[d]; }
  function ratioAns(p) {
    // form0: -a/(1+sin x0)   form1: a/(1+cos x0)
    const v = p.form === 0 ? sinFr(p.deg) : cosFr(p.deg);
    const den = fr(v.n + v.d, v.d); // 1 + v
    const r = fr(p.a * den.d, den.n); // a/den
    return { v, den, val: p.form === 0 ? fr(-r.n, r.d) : r };
  }
  function stepsRatio(p) {
    const a = p.a, f0 = p.form === 0;
    const aS = a === 1 ? '' : a === -1 ? '−' : S(a);
    const num = f0 ? 'cos x' : 'sin x', den = f0 ? '1 + sin x' : '1 + cos x';
    const du = f0 ? '−sin x' : 'cos x', dv = f0 ? 'cos x' : '−sin x';
    const R = ratioAns(p);
    const x0s = degPi(p.deg);
    const st = [];
    st.push(Tx(H(1, 'Bölümü tanıyın') + `${fText(p)} = u/v,  u = ${aS}${num},  v = ${den}.`, H(1, 'Recognise the quotient') + `${fText(p)} = u/v,  u = ${aS}${num},  v = ${den}.`));
    const ac = a === 1 ? '' : S(a) + '·';
    st.push(Tx(H(2, 'Türevleri alalım') + `u' = ${ac}(${du}),  v' = ${dv}.
Bölüm kuralı: f' = (u'v − uv') / v².`,
      H(2, 'Differentiate') + `u' = ${ac}(${du}),  v' = ${dv}.
Quotient rule: f' = (u'v − uv') / v².`));
    // numerator: form0: a[-sin(1+sin) - cos*cos] ; form1: a[cos(1+cos) - sin*(-sin)] = a[cos+cos²+sin²]
    const expand = f0
      ? `u'v − uv' = ${ac}[−sin x(1 + sin x) − cos x·cos x] = ${ac}[−sin x − (sin²x + cos²x)] = ${ac}[−sin x − 1] = −${ac}(1 + sin x)`
      : `u'v − uv' = ${ac}[cos x(1 + cos x) + sin x·sin x] = ${ac}[cos x + (cos²x + sin²x)] = ${ac}[cos x + 1] = ${ac}(1 + cos x)`;
    st.push(Tx(H(3, 'Payı açıp sadeleştirelim') + `${expand}\nsin²x + cos²x = 1 özdeşliği kullanıldı.`, H(3, 'Expand and simplify the numerator') + `${expand}\nUsed the identity sin²x + cos²x = 1.`));
    const fpFinal = f0 ? `f'(x) = ${S(-a)} / (1 + sin x)` : `f'(x) = ${S(a)} / (1 + cos x)`;
    st.push(Tx(H(4, 'Ortak çarpanı sadeleştirelim') + `(1 + ${f0 ? 'sin' : 'cos'} x) çarpanı paydadaki kareden bir kez sadeleşir:\n${fpFinal}   (${f0 ? 'sin x ≠ −1' : 'cos x ≠ −1'}).`,
      H(4, 'Cancel the common factor') + `One factor (1 + ${f0 ? 'sin' : 'cos'} x) cancels against the squared denominator:\n${fpFinal}   (${f0 ? 'sin x ≠ −1' : 'cos x ≠ −1'}).`));
    st.push(Tx(H(5, 'Noktada değerlendirelim') + `x₀ = ${x0s} (${S(p.deg)}°):  ${f0 ? 'sin' : 'cos'} x₀ = ${frS(R.v)}  ⇒  1 + ${f0 ? 'sin' : 'cos'} x₀ = ${frS(R.den)}.\nf'(x₀) = ${S(f0 ? -a : a)} / (${frS(R.den)}) = ${frS(R.val)}  (≈ ${N(frV(R.val))}).`,
      H(5, 'Evaluate at the point') + `x₀ = ${x0s} (${S(p.deg)}°):  ${f0 ? 'sin' : 'cos'} x₀ = ${frS(R.v)}  ⇒  1 + ${f0 ? 'sin' : 'cos'} x₀ = ${frS(R.den)}.\nf'(x₀) = ${S(f0 ? -a : a)} / (${frS(R.den)}) = ${frS(R.val)}  (≈ ${N(frV(R.val))}).`));
    const fd = cdiff(model(p).F, p.deg * PI / 180);
    st.push(Tx(H(6, 'Kontrol') + `Sayısal kontrol: (f(x₀+h) − f(x₀−h))/(2h) ≈ ${N(fd)} ✓.\nNot: ${f0 ? 'cos x/(1 + sin x)' : 'sin x/(1 + cos x)'} aslında ${f0 ? 'tan(π/4 − x/2)' : 'tan(x/2)'} ifadesine eşittir; türev bu yüzden bu kadar sade çıktı.`,
      H(6, 'Check') + `Numerical check: (f(x₀+h) − f(x₀−h))/(2h) ≈ ${N(fd)} ✓.\nNote: ${f0 ? 'cos x/(1 + sin x)' : 'sin x/(1 + cos x)'} actually equals ${f0 ? 'tan(π/4 − x/2)' : 'tan(x/2)'}, which is why the derivative came out so simple.`));
    return st;
  }

  function stepsLimit(p) {
    const a = p.a, b = p.b, L = limitVal(p);
    const f = limitF(p);
    const st = [];
    const ax = (a === 1 ? '' : S(a)) + 'x', bx = (b === 1 ? '' : S(b)) + 'x', bb = b === 1 ? '' : S(b);
    const rat = frS(fr(a, b));
    st.push(Tx(H(1, 'Belirsizliği fark edelim') + `x → 0 için pay ve payda 0'a gider: 0/0 belirsizliği. Doğrudan yerine koyma yetmez; bilinen limite getirmeye çalışacağız: lim(x→0) sin u / u = 1 (u → 0).`,
      H(1, 'Spot the indeterminate form') + `As x → 0 the numerator and denominator both tend to 0: a 0/0 form. Plain substitution fails; we reduce it to the known limit lim(x→0) sin u / u = 1 (u → 0).`));
    let alg = '', res = '';
    switch (p.form) {
      case 0:
        alg = `sin(${ax})/(${bx}) = [sin(${ax})/(${ax})] · (${rat})`;
        res = `= 1 · ${rat} = ${rat}`;
        break;
      case 1:
        alg = `tan(${ax})/(${bx}) = [sin(${ax})/(${ax})] · [1/cos(${ax})] · (${rat})`;
        res = Tx(`x → 0 için 1/cos(${ax}) → 1 ve sin(${ax})/(${ax}) → 1 ⇒ ${rat}`, `as x → 0, 1/cos(${ax}) → 1 and sin(${ax})/(${ax}) → 1 ⇒ ${rat}`);
        break;
      case 2:
        alg = `sin(${ax})/sin(${bx}) = [sin(${ax})/(${ax})] · [(${bx})/sin(${bx})] · (${rat})`;
        res = `= 1 · 1 · ${rat} = ${rat}`;
        break;
      case 3:
        alg = Tx(`1 − cos u = 2sin²(u/2) özdeşliğiyle:  (1 − cos(${ax}))/(${bb}x²) = 2sin²(${ax}/2)/(${bb}x²) = (${S(a * a)}/${S(2 * b)})·[sin(${ax}/2)/(${ax}/2)]²`,
          `Using 1 − cos u = 2sin²(u/2):  (1 − cos(${ax}))/(${bb}x²) = 2sin²(${ax}/2)/(${bb}x²) = (${S(a * a)}/${S(2 * b)})·[sin(${ax}/2)/(${ax}/2)]²`);
        res = `= (${S(a * a)}/${S(2 * b)})·1² = ${frS(L)}`;
        break;
      case 4:
        alg = `(1 − cos(${ax}))/(${bx}) = [(1 − cos(${ax}))/(${ax})] · (${rat})`;
        res = Tx(`lim (1 − cos u)/u = 0 olduğundan  0 · ${rat} = 0`, `since lim (1 − cos u)/u = 0:  0 · ${rat} = 0`);
        break;
      default:
        alg = `sin²(${ax})/(${bb}x²) = [sin(${ax})/(${ax})]² · (${S(a * a)}/${S(b)})`;
        res = `= 1² · ${frS(L)} = ${frS(L)}`;
    }
    st.push(Tx(H(2, 'Cebirsel düzenleme') + alg, H(2, 'Algebraic rearrangement') + alg));
    st.push(Tx(H(3, 'Limiti alalım') + `${res}.\nSonuç: ${limitText(p)} = ${frS(L)}  (≈ ${N(frV(L))}).`, H(3, 'Take the limit') + `${res}.\nResult: ${limitText(p)} = ${frS(L)}  (≈ ${N(frV(L))}).`));
    const hs = [0.1, 0.01, 0.001];
    const row = (sg) => hs.map((h) => `x = ${nf(sg * h, 3)}: ${nf(f(sg * h), 4)}`).join('   |   ');
    st.push(Tx(H(4, 'Sayısal tablo') + `Sağdan: ${row(1)}\nSoldan: ${row(-1)}\nİki taraf da ${nf(frV(L), 4)} değerine yaklaşıyor ✓.`,
      H(4, 'Numerical table') + `From the right: ${row(1)}\nFrom the left: ${row(-1)}\nBoth sides approach ${nf(frV(L), 4)} ✓.`));
    st.push(Tx(H(5, 'Türevle bağlantı') + `lim sin x/x = 1 aslında (sin x)' türevinin x = 0'daki değeridir: (sin h − sin 0)/h → cos 0 = 1. Grafikte x = 0 noktası boş (hollow) işaretlidir: fonksiyon orada tanımsız ama limiti vardır.`,
      H(5, 'Link to the derivative') + `lim sin x/x = 1 is exactly the value of the derivative (sin x)' at x = 0: (sin h − sin 0)/h → cos 0 = 1. On the graph the point x = 0 is a hollow marker: the function is not defined there, yet the limit exists.`));
    return st;
  }

  function stepsCycle(p) {
    const k = p.k, c = p.c, n = p.n, T = p.T;
    const nm = T === 0 ? 'sin' : 'cos';
    const kk = k === 1 ? '' : S(k);
    const names = T === 0 ? [['sin', 1], ['cos', 1], ['sin', -1], ['cos', -1]] : [['cos', 1], ['sin', -1], ['cos', -1], ['sin', 1]];
    const fmtTerm = (j) => {
      const sh = names[j % 4];
      const coef = c * Math.pow(k, j) * sh[1];
      return `${coef === 1 ? '' : coef === -1 ? '−' : S(coef) + '·'}${sh[0]}(${kxStr(k)})`;
    };
    const st = [];
    st.push(Tx(H(1, 'Fonksiyon') + `${fText(p)}. Her türev iç fonksiyondan bir ${kk || '1'} çarpanı getirir (zincir kuralı).`,
      H(1, 'The function') + `${fText(p)}. Each derivative brings an extra factor ${kk || '1'} from the inner function (chain rule).`));
    st.push(Tx(H(2, 'İlk dört türev') + [`f'(x) = ${fmtTerm(1)}`, `f''(x) = ${fmtTerm(2)}`, `f'''(x) = ${fmtTerm(3)}`, `f⁗(x) = ${fmtTerm(4)}`].join('\n') + `\n4. türev ${k === 1 ? 'f' : (Math.pow(k, 4) + '·f')} ile aynı biçimde: döngü uzunluğu 4.`,
      H(2, 'First four derivatives') + [`f'(x) = ${fmtTerm(1)}`, `f''(x) = ${fmtTerm(2)}`, `f'''(x) = ${fmtTerm(3)}`, `f⁗(x) = ${fmtTerm(4)}`].join('\n') + `\nThe 4th derivative has the same shape as ${k === 1 ? 'f' : (Math.pow(k, 4) + '·f')}: the cycle length is 4.`));
    const r = n % 4, q = Math.floor(n / 4);
    st.push(Tx(H(3, `${n}. türev için döngü`) + `${n} = 4·${q} + ${r}  ⇒  kalan ${r}: ${r === 0 ? 'f ile aynı biçim' : r + '. türevin biçimi'}.\nGenlik çarpanı: k^n = ${k}^${n} = ${Math.pow(k, n)}.`,
      H(3, `Cycle for the ${n}th derivative`) + `${n} = 4·${q} + ${r}  ⇒  remainder ${r}: ${r === 0 ? 'same shape as f' : 'the shape of the ' + r + (r === 1 ? 'st' : r === 2 ? 'nd' : 'rd') + ' derivative'}.\nAmplitude factor: k^n = ${k}^${n} = ${Math.pow(k, n)}.`));
    const sh = cycleShape(p), K = cycleCoef(p);
    const fin = `${K === 1 ? '' : K === -1 ? '−' : S(K) + '·'}${sh.name}(${kxStr(k)})`;
    st.push(Tx(H(4, `${n}. türev`) + `f^(${n})(x) = ${fin}.`, H(4, `The ${n}th derivative`) + `f^(${n})(x) = ${fin}.`));
    const v0 = sh.name === 'sin' ? 0 : K;
    st.push(Tx(H(5, 'x = 0 değeri') + `f^(${n})(0) = ${sh.name === 'sin' ? `${S(K)}·sin 0 = 0` : `${S(K)}·cos 0 = ${S(K)}`} ⇒ ${S(v0)}.`,
      H(5, 'Value at x = 0') + `f^(${n})(0) = ${sh.name === 'sin' ? `${S(K)}·sin 0 = 0` : `${S(K)}·cos 0 = ${S(K)}`} ⇒ ${S(v0)}.`));
    st.push(Tx(H(6, 'Genel formül') + `(sin kx)^(n) = kⁿ sin(kx + nπ/2),  (cos kx)^(n) = kⁿ cos(kx + nπ/2). Burada kontrol: ${S(c)}·${k}^${n}·${p.T === 0 ? 'sin' : 'cos'}(${kxStr(k)} + ${n}π/2) ile aynı fonksiyon.`,
      H(6, 'General formula') + `(sin kx)^(n) = kⁿ sin(kx + nπ/2),  (cos kx)^(n) = kⁿ cos(kx + nπ/2). Check: the same function as ${S(c)}·${k}^${n}·${p.T === 0 ? 'sin' : 'cos'}(${kxStr(k)} + ${n}π/2).`));
    return st;
  }

  function stepsWave(p) {
    const fam = p.fam, nm = famName(fam), A = p.A, B = p.B, C = p.C, D = p.D, xp = p.xp;
    const u = B * xp + C;
    const AB = A * B;
    const ds = fam === 0 ? `${N(AB)}·cos(${N(B)}x ${C >= 0 ? '+' : '−'} ${N(Math.abs(C))})` : fam === 1 ? `${N(-AB)}·sin(${N(B)}x ${C >= 0 ? '+' : '−'} ${N(Math.abs(C))})` : `${N(AB)}·sec²(${N(B)}x ${C >= 0 ? '+' : '−'} ${N(Math.abs(C))})`;
    const ang = `${N(B)}·${P(N(xp))} ${C >= 0 ? '+' : '−'} ${N(Math.abs(C))} = ${N(u)}`;
    const slope = waveD(p)(xp);
    const fx = waveF(p)(xp);
    const st = [];
    st.push(Tx(H(1, 'Fonksiyon') + `${waveText(p)}.\nDış: ${nm}, iç: u = ${N(B)}x ${C >= 0 ? '+' : '−'} ${N(Math.abs(C))}  (du/dx = ${N(B)}), sabit çarpan A = ${N(A)}, düşey kayma D = ${N(D)} (türevi 0).`,
      H(1, 'The function') + `${waveText(p)}.\nOuter: ${nm}, inner: u = ${N(B)}x ${C >= 0 ? '+' : '−'} ${N(Math.abs(C))}  (du/dx = ${N(B)}), constant factor A = ${N(A)}, vertical shift D = ${N(D)} (derivative 0).`));
    st.push(Tx(H(2, 'Türev') + `(${nm} u)' = ${dText(fam, 'u')}.\nf'(x) = A · (${nm} u)' · u' + 0 = ${ds}.`, H(2, 'Derivative') + `(${nm} u)' = ${dText(fam, 'u')}.\nf'(x) = A · (${nm} u)' · u' + 0 = ${ds}.`));
    const okv = isFinite(slope) && isFinite(fx);
    const trigVal = fam === 2 ? (Math.abs(Math.cos(u)) < 0.03 ? NaN : 1 / Math.pow(Math.cos(u), 2)) : fam === 0 ? Math.cos(u) : Math.sin(u);
    const trigTxt = (tr) => (isFinite(trigVal) ? '≈ ' + nf(trigVal, 3) : (tr ? 'tanımsız (düşey asimptot)' : 'not defined (vertical asymptote)'));
    st.push(Tx(H(3, 'Noktada değerlendirme') + `x = ${N(xp)}:  u = ${ang} rad.\n${fam === 2 ? 'sec²' : fam === 0 ? 'cos' : 'sin'}(u) ${trigTxt(true)}.`,
      H(3, 'Evaluate at the point') + `x = ${N(xp)}:  u = ${ang} rad.\n${fam === 2 ? 'sec²' : fam === 0 ? 'cos' : 'sin'}(u) ${trigTxt(false)}.`));
    st.push(Tx(H(4, 'Sonuç') + (okv ? `f(${N(xp)}) ≈ ${N(fx)},  f'(${N(xp)}) ≈ ${N(slope)}.\nEğim ${slope > 0.005 ? 'pozitif: f artıyor' : slope < -0.005 ? 'negatif: f azalıyor' : '≈ 0: yatay teğet (tepe/çukur)'}.` : `Seçilen noktada ${nm === 'tan' ? 'tan' : ''} fonksiyon tanımsız (düşey asimptot); noktayı kaydırmayı deneyebiliriz.`),
      H(4, 'Result') + (okv ? `f(${N(xp)}) ≈ ${N(fx)},  f'(${N(xp)}) ≈ ${N(slope)}.\nThe slope is ${slope > 0.005 ? 'positive: f is increasing' : slope < -0.005 ? 'negative: f is decreasing' : '≈ 0: horizontal tangent (peak/trough)'}.` : `At the chosen point the function is not defined (vertical asymptote); move the point.`)));
    st.push(Tx(H(5, 'Gözlem') + `Sinüs için f' bir kosinüs dalgasıdır (tepe → sıfır geçişi). B frekansını artırınca f' genliği A·B kadar büyür: bu zincir kuralının önizlemesidir. D değişince f' değişmez (sabitin türevi 0).`,
      H(5, 'Observation') + `For sine, f' is a cosine wave (a peak of f maps to a zero crossing of f'). Increasing the frequency B scales the amplitude of f' to A·B: a preview of the chain rule. Changing D does not change f' (derivative of a constant is 0).`));
    return st;
  }

  function solveSteps(p) {
    switch (p.kind) {
      case 'basic': return stepsBasic(p);
      case 'product': return stepsProduct(p);
      case 'quot': return stepsQuot(p);
      case 'ratio': return stepsRatio(p);
      case 'limit': return stepsLimit(p);
      case 'cycle': return stepsCycle(p);
      default: return stepsWave(p);
    }
  }

  // ---------------- drawing ----------------
  function ySpan(vals, minHalf) {
    let m = 0;
    vals.forEach((v) => { if (isFinite(v)) m = Math.max(m, Math.abs(v)); });
    return Math.max(minHalf, m);
  }
  function drawPair(canvas, p, mdl, view) {
    const F = mdl.F, D = mdl.D, x0 = mdl.x0;
    const acc = canvas.accent();
    canvas.setViewport(view.x0, view.x1, -view.y, view.y);
    canvas.addFunction({ evaluator: F, color: acc, thickness: 3, label: 'f(x)' });
    if (p.showDeriv) canvas.addFunction({ evaluator: D, color: canvas.purple(), thickness: 2.5, label: "f'(x)" });
    const y0 = F(x0), m = D(x0);
    canvas.addGuideLine({ axis: 'vertical', position: x0, color: canvas.gray(), label: `x = ${N(x0)}` });
    if (isFinite(y0) && isFinite(m)) {
      if (p.showTan) {
        canvas.addFunction({ evaluator: (u) => { const v = y0 + m * (u - x0); return Math.abs(v) < 1e4 ? v : NaN; }, color: canvas.orange(), thickness: 2, dashed: true });
      }
      canvas.addMarker({ x: x0, y: y0, color: canvas.gold(), radius: 7, label: `f = ${N(y0)}` });
      if (p.showDeriv) canvas.addMarker({ x: x0, y: m, color: canvas.purple(), radius: 6, label: `f' = ${N(m)}` });
    }
  }
  function focus(p) {
    if (p.kind === 'limit') return { x: 0, y: frV(limitVal(p)) };
    const mdl = model(p);
    const y = mdl.F(mdl.x0);
    return { x: mdl.x0, y: isFinite(y) ? y : 0 };
  }
  function draw(canvas, p) {
    try {
      if (p.kind === 'limit') { drawLimit(canvas, p); return; }
      const mdl = model(p);
      let view;
      switch (p.kind) {
        case 'basic': {
          const hw = 1.6 * PI / p.k;
          const bounded = p.fn <= 1;
          const m = mdl.D(mdl.x0), y0 = mdl.F(mdl.x0);
          let Y = bounded ? 1.3 * Math.abs(p.c) : 3 * Math.abs(p.c);
          if (p.showDeriv) Y = Math.max(Y, bounded ? 1.3 * Math.abs(p.c * p.k) : 1.6 * Math.abs(p.c * p.k), isFinite(m) ? 1.15 * Math.abs(m) : 0);
          if (isFinite(y0)) Y = Math.max(Y, 1.15 * Math.abs(y0));
          view = { x0: mdl.x0 - hw, x1: mdl.x0 + hw, y: Math.min(Y, 60) };
          break;
        }
        case 'product': {
          const hw = 5.5;
          const yy = [];
          for (let i = 0; i <= 60; i++) { const x = mdl.x0 - hw + 2 * hw * i / 60; yy.push(mdl.F(x)); if (p.showDeriv) yy.push(mdl.D(x)); }
          view = { x0: mdl.x0 - hw, x1: mdl.x0 + hw, y: 1.1 * ySpan(yy, 3) };
          break;
        }
        case 'quot': {
          const hw = Math.max(5.5, Math.abs(mdl.x0) + 2);
          view = { x0: -hw, x1: hw, y: 1.5 };
          break;
        }
        case 'ratio': {
          view = { x0: mdl.x0 - 6, x1: mdl.x0 + 6, y: 4.5 * Math.max(1, Math.abs(p.a)) * 0.9 + 0.5 };
          break;
        }
        case 'cycle': {
          const amp = Math.abs(p.c) * Math.pow(p.k, p.showDeriv ? 1 : 0);
          view = { x0: -2 * PI / p.k * 1.1, x1: 2 * PI / p.k * 1.1, y: 1.3 * Math.max(Math.abs(p.c), amp) };
          break;
        }
        default: {
          const yy = [];
          for (let i = 0; i <= 80; i++) { const x = -2 * PI + 4 * PI * i / 80; const fv = mdl.F(x); if (isFinite(fv) && p.fam !== 2) yy.push(fv); if (p.showDeriv && p.fam !== 2) yy.push(mdl.D(x)); }
          const Y = p.fam === 2 ? 5 + 2 * Math.abs(p.D) : 1.15 * ySpan(yy, 1);
          view = { x0: -2 * PI, x1: 2 * PI, y: Math.max(Y, 1.5) };
        }
      }
      if (p.kind === 'cycle') {
        // draw f and f^(n) (when its amplitude is comparable), else f and f'
        const F = mdl.F, acc = canvas.accent();
        canvas.setViewport(view.x0, view.x1, -view.y, view.y);
        canvas.addFunction({ evaluator: F, color: acc, thickness: 3, label: 'f(x)' });
        const small = Math.abs(cycleCoef(p)) <= 3 * Math.abs(p.c);
        if (p.showDeriv) {
          if (small) canvas.addFunction({ evaluator: cycleNum(p), color: canvas.purple(), thickness: 2.5, label: `f^(${p.n})(x)` });
          else canvas.addFunction({ evaluator: mdl.D, color: canvas.purple(), thickness: 2.5, label: "f'(x)" });
        }
        canvas.addMarker({ x: 0, y: F(0), color: canvas.gold(), radius: 6 });
        if (small && p.showDeriv) canvas.addMarker({ x: 0, y: cycleNum(p)(0), color: canvas.purple(), radius: 6, label: `f^(${p.n})(0) = ${N(cycleNum(p)(0))}` });
        return;
      }
      drawPair(canvas, p, mdl, view);
    } catch (e) {
      canvas.setViewport(-5, 5, -5, 5);
    }
  }
  function drawLimit(canvas, p) {
    const f = limitF(p), L = frV(limitVal(p));
    const a = Math.abs(p.a), b = Math.abs(p.b);
    let hw;
    switch (p.form) {
      case 0: hw = 2 * PI / Math.max(a, b); break;
      case 1: hw = 0.7 * PI / (2 * a); break;
      case 2: hw = 0.9 * PI / Math.max(a, b); break;
      default: hw = 2 * PI / a;
    }
    const ys = [L];
    for (let i = 0; i <= 120; i++) { const v = f(-hw + 2 * hw * i / 120); if (isFinite(v)) ys.push(v); }
    let lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    const pad = Math.max(0.3, (hi - lo) * 0.2);
    canvas.setViewport(-hw, hw, lo - pad, hi + pad);
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: limitText(p).replace('lim(x→0) ', 'g(x) = ') });
    canvas.addGuideLine({ axis: 'horizontal', position: L, color: canvas.gray(), label: `L = ${N(L)}` });
    canvas.addGuideLine({ axis: 'vertical', position: 0, color: canvas.gray() });
    canvas.addMarker({ x: 0, y: L, color: canvas.gold(), radius: 7, hollow: true, label: `(0, ${N(L)})` });
  }

  // ---------------- controls ----------------
  function applyVisibility(p) {
    if (!ctl.rows) return;
    const isWave = p.kind === 'wave';
    ctl.rows.forEach((r) => { if (r.input && r.input.parentElement && r.input.parentElement.style) r.input.parentElement.style.display = isWave ? '' : 'none'; });
    if (ctl.famSel && ctl.famSel.select) {
      ctl.famSel.select.style.display = isWave ? '' : 'none';
      ctl.famSel.select.value = String(p.fam === undefined ? 0 : p.fam);
    }
    if (ctl.famLabel) ctl.famLabel.style.display = isWave ? '' : 'none';
    ctl.boxes.forEach((b) => { if (b && b.refreshFromModel) b.refreshFromModel(); });
  }
  function buildControls(rightCol, getProblem, h) {
    ctl.rows = []; ctl.boxes = [];
    ctl.boxes.push(h.addCheckbox({ caption: Tx("f' eğrisi (mor)", "The f' curve (purple)"), get: () => getProblem().showDeriv, set: (v) => { getProblem().showDeriv = v; } }));
    ctl.boxes.push(h.addCheckbox({ caption: Tx('Teğet doğru (kesikli)', 'Tangent line (dashed)'), get: () => getProblem().showTan, set: (v) => { getProblem().showTan = v; } }));
    const lab = document.createElement('div');
    lab.className = 'we-slider-caption';
    lab.style.fontWeight = '600';
    lab.textContent = Tx('A·F(Bx+C)+D keşfi (temel fonksiyon):', 'A·F(Bx+C)+D explorer (base function):');
    rightCol.appendChild(lab);
    ctl.famLabel = lab;
    ctl.famSel = h.addSelect({
      options: [{ label: Tx('Sinüs', 'Sine'), value: 0 }, { label: Tx('Kosinüs', 'Cosine'), value: 1 }, { label: Tx('Tanjant', 'Tangent'), value: 2 }],
      get: () => (getProblem().fam === undefined ? 0 : getProblem().fam),
      set: (v) => { const q = getProblem(); if (q.kind === 'wave') q.fam = Number(v); },
    });
    const W = (caption, min, max, step, key) => ctl.rows.push(h.addSlider({
      caption, min, max, step,
      get: () => (getProblem()[key] === undefined ? 0 : getProblem()[key]),
      set: (v) => { const q = getProblem(); if (q.kind === 'wave') q[key] = Math.round(v / step) * step; },
    }));
    W(Tx('Genlik (A)', 'Amplitude (A)'), -3, 3, 0.25, 'A');
    W(Tx('Frekans (B)', 'Frequency (B)'), 0.25, 3, 0.25, 'B');
    W(Tx('Faz kayması (C)', 'Phase shift (C)'), -3.14, 3.14, 0.1, 'C');
    W(Tx('Düşey kayma (D)', 'Vertical shift (D)'), -2, 2, 0.25, 'D');
    W(Tx('Nokta konumu (x)', 'Point position (x)'), -6.28, 6.28, 0.1, 'xp');
    applyVisibility(getProblem());
  }

  Topics.register('derivatives', {
    id: 'trigDerivatives',
    tabTitle: () => Tx('Trigonometrik Fonksiyonların Türevleri', 'Derivatives of Trig Functions'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus,
    buildControls,
    links: [
      { match: /^\s+\(sin x\)' = cos x/, make: (rng) => genKind(rng, 'basic', { fn: 0 }) },
      { match: /^\s+\(cos x\)' = −sin x/, make: (rng) => genKind(rng, 'basic', { fn: 1 }) },
      { match: /^\s+\(tan x\)' = sec²x/, make: (rng) => genKind(rng, 'basic', { fn: 2 }) },
      { match: /^\s+\(cot x\)' = −csc²x/, make: (rng) => genKind(rng, 'basic', { fn: 3 }) },
      { match: /^\s+\(sec x\)' = sec x ·/, make: (rng) => genKind(rng, 'basic', { fn: 4 }) },
      { match: /^\s+\(csc x\)' = −csc x ·/, make: (rng) => genKind(rng, 'basic', { fn: 5 }) },
      { match: /^\s+\(sin g\)' = /, make: (rng) => genKind(rng, 'basic', { fn: rng.nextInt(0, 3), chain: true }) },
      { match: /^(ÇARPIM \/ BÖLÜM KURALI|PRODUCT \/ QUOTIENT RULE):/, make: (rng) => genKind(rng, rng.pick(['product', 'quot'])) },
      { match: /^(ÖZEL LİMİTLER|SPECIAL LIMITS)/, make: (rng) => genKind(rng, 'limit') },
      { match: /^\s+- (Çevrim|Cycle):/, make: (rng) => genKind(rng, 'cycle') },
    ],
    // test hooks (harmless)
    _check: (p) => {
      if (p.kind === 'limit') return { type: 'limit', f: limitF(p), L: frV(limitVal(p)) };
      if (p.kind === 'cycle') return { type: 'nth', p, K: cycleCoef(p), shape: cycleShape(p), f: model(p).F };
      const m = model(p);
      let ans;
      switch (p.kind) {
        case 'basic': ans = eNum(eScale(TpE(p.fn, p.th), p.c * p.k)); break;
        case 'product': { const idx = ((p.m % 4) + 4) % 4; const s = [0, 1, 0, -1][idx], c = [1, 0, -1, 0][idx]; const Tv = p.T === 0 ? s : c, Tp = p.T === 0 ? c : -s; ans = p.a * Tv + frV(fr(p.a * Tp * p.m, 2)) * PI; break; }
        case 'quot': { const q = quotAns(p); ans = fracPiVal(q.f, q.e); break; }
        case 'ratio': ans = frV(ratioAns(p).val); break;
        default: ans = waveD(p)(p.xp);
      }
      return { type: 'deriv', f: m.F, x0: m.x0, ans };
    },
  });
})();
