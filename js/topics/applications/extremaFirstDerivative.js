// Extrema & First Derivative Test (chapter 'applications').
// problem = { kind, ...params, A, B (closed interval for absolute extrema), pos (moving point), showD }
//   kinds: 'cubic'   f = a x^3 + b x^2 + c x + d, f' = 3a (x - r1)(x - r2)             (local max & min)
//          'quartW'  f = a x^4 - 2 a r^2 x^2 + d, critical points -r, 0, r               (W / M shape)
//          'quartD'  f = a (x^4 - 4 s x^3 / 3) + d (s = +-3): double root at 0 (no extremum) + one extremum
//          'mono'    f = a x^3 + a k x + d: k = 0 -> stationary point WITHOUT extremum (Fermat converse is false);
//                    k > 0 -> no critical point at all
//          'rat'     f = x + q/x (q = k^2), x != 0: local max at -k, local min at k, f undefined at 0 (not critical)
//          'cusp'    f = a (x - c)^(2/3) + d: f' undefined at c but f(c) defined -> critical point (cusp extremum)
// All critical points are integers by construction; stated values are exact.
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  // ---------- exact helpers ----------
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    n = n / g; d = d / g;
    if (n === 0) n = 0;
    return { n, d };
  }
  const frAdd = (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
  const frMul = (a, b) => fr(a.n * b.n, a.d * b.d);
  const frNum = (a) => a.n / a.d;
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (n) => (n < 0 ? '(' + S(n) + ')' : S(n));
  const frS = (x) => (x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d);
  function nf(v) {
    if (!isFinite(v)) return '—';
    let s = fmt2(v);
    if (s === '-0') s = '0';
    return M(s);
  }
  function poly(terms) {
    let s = '';
    terms.forEach((t) => {
      const c = t[0], l = t[1];
      if (c === 0) return;
      const ab = Math.abs(c);
      const body = l === '' ? String(ab) : (ab === 1 ? l : ab + l);
      if (s === '') s = (c < 0 ? '−' : '') + body; else s += (c < 0 ? ' − ' : ' + ') + body;
    });
    return s || '0';
  }
  const sgnStr = (s) => (s > 0 ? '+' : s < 0 ? '−' : '0');

  // ---------- model ----------
  function coefs(p) {
    switch (p.kind) {
      case 'cubic': return [p.d, 3 * p.a * p.r1 * p.r2, -3 * p.a * (p.r1 + p.r2) / 2, p.a];
      case 'quartW': return [p.d, 0, -2 * p.a * p.r * p.r, 0, p.a];
      case 'quartD': return [p.d, 0, 0, -4 * p.a * p.sig, p.a];
      case 'mono': return [p.d, p.a * p.k, 0, p.a];
      default: return null;
    }
  }
  const dcoefs = (cf) => cf.slice(1).map((c, i) => c * (i + 1));
  function hornerNum(cf, x) { let y = 0; for (let i = cf.length - 1; i >= 0; i--) y = y * x + cf[i]; return y; }
  function hornerFr(cf, x) { let y = fr(0); for (let i = cf.length - 1; i >= 0; i--) y = frAdd(frMul(y, x), fr(cf[i])); return y; }

  function fNum(p, x) {
    const cf = coefs(p);
    let y;
    if (cf) y = hornerNum(cf, x);
    else if (p.kind === 'rat') y = Math.abs(x) < 1e-9 ? NaN : x + p.q / x;
    else y = p.a * Math.pow(Math.cbrt(x - p.c), 2) + p.d;
    return isFinite(y) && Math.abs(y) < 1e6 ? y : NaN;
  }
  function fpNum(p, x) {
    const cf = coefs(p);
    let y;
    if (cf) y = hornerNum(dcoefs(cf), x);
    else if (p.kind === 'rat') y = Math.abs(x) < 1e-9 ? NaN : 1 - p.q / (x * x);
    else y = Math.abs(x - p.c) < 1e-9 ? NaN : p.a * (2 / 3) / Math.cbrt(x - p.c);
    return isFinite(y) && Math.abs(y) < 1e6 ? y : NaN;
  }
  // exact value of f at an integer x: {num, str}
  function fVal(p, x) {
    const cf = coefs(p);
    if (cf) { const v = hornerFr(cf, fr(x)); return { num: frNum(v), str: frS(v) }; }
    if (p.kind === 'rat') { const v = frAdd(fr(x), fr(p.q, x)); return { num: frNum(v), str: frS(v) }; }
    const t = x - p.c, m = t * t, r = Math.round(Math.cbrt(m));
    if (r * r * r === m) { const v = p.a * r + p.d; return { num: v, str: S(v) }; }
    const num = p.a * Math.cbrt(m) + p.d;
    let s = (p.a < 0 ? '−' : '') + '∛' + m;
    if (p.d !== 0) s += (p.d < 0 ? ' − ' : ' + ') + Math.abs(p.d);
    return { num, str: s + ' ≈ ' + nf(num) };
  }
  // sign of f' at an exact test value t (Fr); returns {s, str}
  function fpSign(p, t) {
    const cf = coefs(p);
    if (cf) { const v = hornerFr(dcoefs(cf), t); return { s: Math.sign(v.n), str: frS(v) }; }
    if (p.kind === 'rat') { const v = frAdd(fr(1), fr(-p.q * t.d * t.d, t.n * t.n)); return { s: Math.sign(v.n), str: frS(v) }; }
    const u = frNum(t) - p.c;
    const v = p.a * (2 / 3) / Math.cbrt(u);
    return { s: Math.sign(v), str: '≈ ' + nf(v) };
  }
  // split points of the sign chart: {x (integer), type: 'crit' | 'undef' | 'hole'}
  function splits(p) {
    switch (p.kind) {
      case 'cubic': return [{ x: p.r1, type: 'crit' }, { x: p.r2, type: 'crit' }];
      case 'quartW': return [{ x: -p.r, type: 'crit' }, { x: 0, type: 'crit' }, { x: p.r, type: 'crit' }];
      case 'quartD': return p.sig > 0 ? [{ x: 0, type: 'crit' }, { x: 3, type: 'crit' }] : [{ x: -3, type: 'crit' }, { x: 0, type: 'crit' }];
      case 'mono': return p.k === 0 ? [{ x: 0, type: 'crit' }] : [];
      case 'rat': return [{ x: -p.k, type: 'crit' }, { x: 0, type: 'hole' }, { x: p.k, type: 'crit' }];
      default: return [{ x: p.c, type: 'undef' }];
    }
  }
  const critPts = (p) => splits(p).filter((s) => s.type !== 'hole').map((s) => s.x);

  function fStr(p) {
    const cf = coefs(p);
    if (cf) {
      const terms = [];
      for (let i = cf.length - 1; i >= 0; i--) terms.push([cf[i], i === 0 ? '' : i === 1 ? 'x' : 'x' + ['', '', '²', '³', '⁴'][i]]);
      return poly(terms);
    }
    if (p.kind === 'rat') return `x + ${p.q}/x`;
    const base = p.c === 0 ? 'x' : (p.c > 0 ? `(x − ${p.c})` : `(x + ${-p.c})`);
    return (p.a < 0 ? '−' : '') + base + '^(2/3)' + (p.d === 0 ? '' : (p.d < 0 ? ' − ' : ' + ') + Math.abs(p.d));
  }
  function facStr(lead, roots) { // roots: [[r, mult]]
    let s = lead === 1 ? '' : lead === -1 ? '−' : S(lead);
    roots.forEach(([r, m]) => {
      const b = r === 0 ? 'x' : (r > 0 ? `(x − ${r})` : `(x + ${-r})`);
      s += b + (m === 2 ? '²' : '');
    });
    return s;
  }
  function fpFactored(p) {
    switch (p.kind) {
      case 'cubic': return facStr(3 * p.a, [[p.r1, 1], [p.r2, 1]]);
      case 'quartW': return facStr(4 * p.a, [[-p.r, 1], [0, 1], [p.r, 1]]);
      case 'quartD': return p.sig > 0 ? facStr(4 * p.a, [[0, 2], [3, 1]]) : facStr(4 * p.a, [[0, 2], [-3, 1]]);
      case 'mono': return p.k === 0 ? facStr(3 * p.a, [[0, 2]]) : '';
      case 'rat': return `(x − ${p.k})(x + ${p.k}) / x²`;
      default: return '';
    }
  }
  function fpStr(p) {
    const cf = coefs(p);
    if (cf) {
      const d = dcoefs(cf), terms = [];
      for (let i = d.length - 1; i >= 0; i--) terms.push([d[i], i === 0 ? '' : i === 1 ? 'x' : 'x' + ['', '', '²', '³'][i]]);
      return poly(terms);
    }
    if (p.kind === 'rat') return `1 − ${p.q}/x²`;
    const base = p.c === 0 ? 'x' : (p.c > 0 ? `(x − ${p.c})` : `(x + ${-p.c})`);
    return `${p.a < 0 ? '−' : ''}2 / (3·∛${base})`;
  }

  // ---------- analysis ----------
  // intervals of the sign chart, with the exact test value and sign of f'
  function chart(p) {
    const sp = splits(p).slice().sort((u, v) => u.x - v.x);
    const pts = [-Infinity].concat(sp.map((s) => s.x), [Infinity]);
    const rows = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const l = pts[i], r = pts[i + 1];
      let t;
      if (l === -Infinity && r === Infinity) t = fr(0);
      else if (l === -Infinity) t = fr(r - 1);
      else if (r === Infinity) t = fr(l + 1);
      else if (l + 1 < r) t = fr(l + 1);
      else t = fr(l + r, 2);
      const sg = fpSign(p, t);
      rows.push({ l, r, t, s: sg.s, str: sg.str });
    }
    return { sp, rows };
  }
  function classify(p) { // local extrema among critical points
    const ch = chart(p);
    const res = [];
    ch.sp.forEach((s, i) => {
      if (s.type === 'hole') return;
      const before = ch.rows[i].s, after = ch.rows[i + 1].s;
      const kind = before > 0 && after < 0 ? 'max' : before < 0 && after > 0 ? 'min' : 'none';
      res.push({ x: s.x, type: s.type, kind, before, after, v: fVal(p, s.x) });
    });
    return res;
  }
  function absolute(p) {
    const cands = [{ x: p.A, tag: 'end' }];
    critPts(p).forEach((x) => { if (x > p.A && x < p.B) cands.push({ x, tag: 'crit' }); });
    cands.push({ x: p.B, tag: 'end' });
    cands.forEach((c) => { c.v = fVal(p, c.x); });
    let mx = -Infinity, mn = Infinity;
    cands.forEach((c) => { mx = Math.max(mx, c.v.num); mn = Math.min(mn, c.v.num); });
    const same = (u, v) => Math.abs(u - v) < 1e-9;
    return {
      cands, max: mx, min: mn,
      maxAt: cands.filter((c) => same(c.v.num, mx)),
      minAt: cands.filter((c) => same(c.v.num, mn)),
      maxStr: cands.find((c) => same(c.v.num, mx)).v.str,
      minStr: cands.find((c) => same(c.v.num, mn)).v.str,
    };
  }

  // ---------- generation ----------
  function createProblem(rng, forcedKind, monoK) {
    const kinds = ['cubic', 'cubic', 'quartW', 'quartD', 'mono', 'rat', 'cusp'];
    const kind = forcedKind || rng.pick(kinds);
    const p = { kind, pos: -2, showD: false };
    const sgn = () => rng.pick([1, -1]);
    if (kind === 'cubic') {
      p.a = rng.pick([1, 1, -1, -1, 2, -2]);
      let r1, r2;
      do { r1 = rng.nextInt(-3, 2); r2 = r1 + 2 * rng.nextInt(1, 4); } while (r2 > 3 || (p.a === 2 || p.a === -2) && r2 - r1 > 4);
      p.r1 = r1; p.r2 = r2; p.d = rng.nextInt(-3, 4);
    } else if (kind === 'quartW') {
      p.a = sgn(); p.r = rng.nextInt(1, 4); p.d = rng.nextInt(-3, 4);
    } else if (kind === 'quartD') {
      p.a = sgn(); p.sig = sgn(); p.d = rng.nextInt(-3, 4);
    } else if (kind === 'mono') {
      p.a = sgn(); p.k = rng.pick([0, 0, 1, 2]); p.d = rng.nextInt(-3, 4);
      if (monoK === 'flat') p.k = 0; else if (monoK === 'none') p.k = p.k || rng.nextInt(1, 3);
    } else if (kind === 'rat') {
      p.k = rng.nextInt(1, 4); p.q = p.k * p.k;
    } else {
      p.a = sgn(); p.c = rng.nextInt(-2, 3); p.d = rng.nextInt(-2, 3);
    }
    // view window and closed interval
    const cp = critPts(p);
    if (kind === 'rat') { p.xl = -7; p.xh = 7; p.A = 1; p.B = p.k + rng.nextInt(1, 4); }
    else {
      const lo = cp.length ? Math.min.apply(null, cp) : -2, hi = cp.length ? Math.max.apply(null, cp) : 2;
      p.xl = Math.max(-6, lo - 3); p.xh = Math.min(6, hi + 3);
      if (kind === 'quartD') { p.xl = p.sig > 0 ? -2 : -5; p.xh = p.sig > 0 ? 5 : 2; }
      if (kind === 'cusp') { p.xl = p.c - 4; p.xh = p.c + 4; }
      if (kind === 'mono') { p.xl = -3; p.xh = 3; }
      const span = p.xh - p.xl;
      p.A = p.xl + 1 + (rng.nextInt(0, 2) === 0 ? 0 : 1);
      p.B = p.xh - 1 - (rng.nextInt(0, 2) === 0 ? 0 : 1);
      if (kind === 'cusp') { p.A = p.c - (rng.pick([1, 8])); p.B = p.c + rng.pick([1, 8]); p.xl = Math.min(p.xl, p.A - 1); p.xh = Math.max(p.xh, p.B + 1); }
      if (p.B <= p.A + 1) { p.A = p.xl + 1; p.B = p.xh - 1; }
      if (span < 4) { p.A = p.xl; p.B = p.xh; }
    }
    p.pos = Math.round((p.xl + 0.5) * 10) / 10;
    return p;
  }

  // ---------- text ----------
  function intStr(a, b) { return `[${S(a)}, ${S(b)}]`; }

  function problemStatement(p) {
    const f = `f(x) = ${fStr(p)}`;
    const dom = p.kind === 'rat' ? Tx(' (x ≠ 0)', ' (x ≠ 0)') : '';
    return Tx(
      `${f}${dom} fonksiyonu veriliyor.\n(a) Kritik noktaları bulun ve Birinci Türev Testi ile yerel maksimum / minimum olarak sınıflandırın.\n(b) ${intStr(p.A, p.B)} kapalı aralığında mutlak maksimum ve mutlak minimum değerlerini bulun.`,
      `Let ${f}${dom}.\n(a) Find the critical points and classify them as local maxima / minima with the First Derivative Test.\n(b) Find the absolute maximum and minimum values on the closed interval ${intStr(p.A, p.B)}.`);
  }

  function concept() {
    return Tx(
      'EKSTREMUMLAR VE BİRİNCİ TÜREV TESTİ\n' +
      '\n' +
      'TANIMLAR\n' +
      '• Yerel maksimum: c\'nin yakın çevresinde f(c) ≥ f(x). Yerel minimum: f(c) ≤ f(x).\n' +
      '• KRİTİK NOKTA: c, f\'nin tanım kümesinde ve f\'(c) = 0 veya f\'(c) tanımsız (köşe, sivri uç, dikey teğet).\n' +
      '• Mutlak (global) ekstremum: tüm aralıktaki en büyük / en küçük değer.\n' +
      '\n' +
      'FERMAT TEOREMİ\n' +
      'f, c iç noktasında yerel ekstremuma sahipse ve f\'(c) varsa, f\'(c) = 0\'dır. (Tersi DOĞRU DEĞİL: f = x³, f\'(0) = 0 ama ekstremum yok.) Yani ekstremum adayları yalnızca kritik noktalardır.\n' +
      '\n' +
      'BİRİNCİ TÜREV TESTİ\n' +
      'c kritik nokta olsun; c\'den geçerken f\' işaretine bak:\n' +
      '• + → −  : yerel MAKSİMUM (çıkıp iniyor)\n' +
      '• − → +  : yerel MİNİMUM (inip çıkıyor)\n' +
      '• işaret değişmez: ekstremum YOK (f yine artan ya da azalan kalır).\n' +
      '\n' +
      'YÖNTEM\n' +
      '1. f\'(x) hesapla.\n' +
      '2. f\' = 0 ve f\' tanımsız olan kritik noktaları bul (tanım kümesinde olduklarına bak).\n' +
      '3. Kritik noktalarla (ve f\'nün tanımsız olduğu, f\'nin tanımsız olduğu noktalarla) aralıklara böl; her aralıkta bir deneme değeri ile f\'nün işaretini yaz.\n' +
      '4. İşaret değişimine göre sınıflandır, f(c) değerlerini hesapla.\n' +
      '5. Kapalı aralık [a, b] üzerinde MUTLAK ekstremum için (Ekstremum Değer Teoremi, f sürekli): kritik noktalardaki ve UÇ NOKTALARDAKİ f değerlerini karşılaştır; en büyük / en küçük olan cevaptır.\n' +
      '\n' +
      'ÖZEL DURUMLAR\n' +
      '• f\'(c) = 0 ama işaret değişmiyor (ör. x³ ya da x⁴ − 4x³ için x = 0): düz teğetli geçiş, ekstremum değil.\n' +
      '• f\'(c) tanımsız ama f(c) tanımlı (sivri uç, ör. x^(2/3) için x = 0): kritik noktadır ve ekstremum olabilir.\n' +
      '• f\'nin ve f\'nin birlikte tanımsız olduğu nokta (ör. x + 4/x için x = 0) tanım kümesinde olmadığından kritik nokta DEĞİLDİR; yine de işaret tablosunda aralıkları ayırır.\n' +
      '• Hiç kritik nokta yoksa mutlak ekstremumlar kapalı aralıkta uç noktalardadır.\n' +
      '\n' +
      'TUZAKLAR\n' +
      '• Kapalı aralıkta uç noktaları unutmayın.\n' +
      '• Kritik noktalar aralığın dışında kalabilir; yalnızca (a, b) içindekileri aday alın.\n' +
      '• Yerel max ≠ global max.\n' +
      '• f = |x|\'in 0\'da minimumu var, f\' orada yok: tanımsız noktaları işaret tablosundan atlamayın.\n' +
      '\n' +
      'MİNİ ÖRNEK\n' +
      'f(x) = x³ − 3x, [−2, 3]. f\' = 3x² − 3 = 0 → x = ±1. İşaret: x < −1 (+), −1 < x < 1 (−), x > 1 (+) → x = −1 yerel max (f = 2), x = 1 yerel min (f = −2). Uçlar: f(−2) = −2, f(3) = 18 → mutlak max 18 (x = 3), mutlak min −2 (x = 1 ve x = −2).\n' +
      '\n' +
      'GRAFİK: Mavi bölge f\'nin arttığı (f\' > 0), turuncu bölge azaldığı (f\' < 0) yerleri gösterir. Altın elmaslar yerel ekstremum, içi boş altın daireler ekstremum olmayan kritik noktalardır. Yeşil / kırmızı kareler [a, b] üzerindeki mutlak maks / min\'dur. Kaydırıcı ile hareketli noktanın f ve f\' değerini izleyin; "f\' grafiğini göster" ile f\'nün sıfırı tam ekstremumlarda kestiğini görün.',
      'EXTREMA AND THE FIRST DERIVATIVE TEST\n' +
      '\n' +
      'DEFINITIONS\n' +
      '• Local maximum: f(c) ≥ f(x) for x near c. Local minimum: f(c) ≤ f(x).\n' +
      '• CRITICAL POINT: c in the domain of f with f\'(c) = 0 or f\'(c) undefined (corner, cusp, vertical tangent).\n' +
      '• Absolute (global) extremum: the largest / smallest value over the whole interval.\n' +
      '\n' +
      'FERMAT\'S THEOREM\n' +
      'If f has a local extremum at an interior point c and f\'(c) exists, then f\'(c) = 0. (The converse is FALSE: f = x³ has f\'(0) = 0 but no extremum.) So the only candidates for extrema are critical points.\n' +
      '\n' +
      'FIRST DERIVATIVE TEST\n' +
      'Let c be a critical point; look at the sign of f\' as you pass through c:\n' +
      '• + → −  : local MAXIMUM (rises then falls)\n' +
      '• − → +  : local MINIMUM (falls then rises)\n' +
      '• no sign change: NO extremum (f keeps increasing or keeps decreasing).\n' +
      '\n' +
      'METHOD\n' +
      '1. Compute f\'(x).\n' +
      '2. Find the critical points: f\' = 0 and f\' undefined (check they lie in the domain of f).\n' +
      '3. Split into intervals at the critical points (and at points outside the domain); write the sign of f\' in each using a test value.\n' +
      '4. Classify by the sign change and compute the values f(c).\n' +
      '5. For ABSOLUTE extrema on a closed interval [a, b] (Extreme Value Theorem, f continuous): compare f at the critical points and at the ENDPOINTS; the largest / smallest is the answer.\n' +
      '\n' +
      'SPECIAL CASES\n' +
      '• f\'(c) = 0 but no sign change (e.g. x = 0 for x³ or x⁴ − 4x³): a flat inflection, not an extremum.\n' +
      '• f\'(c) undefined but f(c) defined (cusp, e.g. x^(2/3) at x = 0): it is a critical point and may be an extremum.\n' +
      '• A point where f itself is undefined (e.g. x = 0 for x + 4/x) is NOT a critical point; it still separates the intervals of the sign chart.\n' +
      '• With no critical points at all, the absolute extrema on a closed interval sit at the endpoints.\n' +
      '\n' +
      'PITFALLS\n' +
      '• On a closed interval, do not forget the endpoints.\n' +
      '• Critical points may fall outside the interval; use only those in (a, b).\n' +
      '• Local max ≠ global max.\n' +
      '• f = |x| has a minimum at 0 although f\' does not exist there: do not drop points where f\' is undefined.\n' +
      '\n' +
      'MINI EXAMPLE\n' +
      'f(x) = x³ − 3x on [−2, 3]. f\' = 3x² − 3 = 0 → x = ±1. Signs: x < −1 (+), −1 < x < 1 (−), x > 1 (+) → x = −1 local max (f = 2), x = 1 local min (f = −2). Endpoints: f(−2) = −2, f(3) = 18 → absolute max 18 (at x = 3), absolute min −2 (at x = 1 and x = −2).\n' +
      '\n' +
      'GRAPH: blue shading marks where f is increasing (f\' > 0), orange where it is decreasing (f\' < 0). Gold diamonds are local extrema; hollow gold circles are critical points that are not extrema. Green / red squares are the absolute max / min on [a, b]. Drag the point slider to read f and f\' there, and tick "show f\' graph" to see f\' crossing zero exactly at the extrema.');
  }

  function interval(row) {
    const L = row.l === -Infinity ? '(−∞' : '(' + S(row.l);
    const R = row.r === Infinity ? '∞)' : S(row.r) + ')';
    return L + ', ' + R;
  }

  function solveSteps(p) {
    const st = [];
    const f = fStr(p), fp = fpStr(p), fac = fpFactored(p);
    const ch = chart(p), cls = classify(p), ab = absolute(p);
    const cps = critPts(p);

    // 1) derivative
    {
      let tr = `── 1) Türevi bul ──\nf(x) = ${f}\nf'(x) = ${fp}`;
      let en = `── 1) Differentiate ──\nf(x) = ${f}\nf'(x) = ${fp}`;
      if (fac && p.kind !== 'rat') { tr += `\nÇarpanlara ayır: f'(x) = ${fac}`; en += `\nFactor: f'(x) = ${fac}`; }
      if (p.kind === 'rat') {
        tr += `\n = (x² − ${p.q}) / x² = ${fac}\n(f yalnızca x ≠ 0 için tanımlı.)`;
        en += `\n = (x² − ${p.q}) / x² = ${fac}\n(f is defined only for x ≠ 0.)`;
      }
      if (p.kind === 'cusp') {
        tr += `\n(Kuvvet kuralı: d/dx (u)^(2/3) = (2/3)·u^(−1/3).)`;
        en += `\n(Power rule: d/dx (u)^(2/3) = (2/3)·u^(−1/3).)`;
      }
      st.push(Tx(tr, en));
    }

    // 2) critical points
    {
      let tr = '── 2) Kritik noktaları bul ──\n', en = '── 2) Find the critical points ──\n';
      if (p.kind === 'cusp') {
        tr += `f'(x) hiçbir x için 0 olamaz (pay sabit ve sıfırdan farklı).\nf'(x) x = ${S(p.c)}'de TANIMSIZ, ama f(${S(p.c)}) = ${fVal(p, p.c).str} tanımlı.\n→ Kritik nokta: x = ${S(p.c)} (sivri uç / dikey teğet).`;
        en += `f'(x) can never be 0 (the numerator is a nonzero constant).\nf'(x) is UNDEFINED at x = ${S(p.c)}, but f(${S(p.c)}) = ${fVal(p, p.c).str} is defined.\n→ Critical point: x = ${S(p.c)} (cusp / vertical tangent).`;
      } else if (p.kind === 'rat') {
        tr += `f'(x) = 0 → x² − ${p.q} = 0 → x = ${S(-p.k)} veya x = ${p.k}.\nf'(x) x = 0'da tanımsız, fakat f(0) de tanımsız: x = 0 tanım kümesinde olmadığından kritik nokta DEĞİL (yalnızca işaret tablosunda aralıkları ayırır).\n→ Kritik noktalar: x = ${S(-p.k)}, x = ${p.k}.`;
        en += `f'(x) = 0 → x² − ${p.q} = 0 → x = ${S(-p.k)} or x = ${p.k}.\nf'(x) is undefined at x = 0, but f(0) is undefined too: x = 0 is not in the domain, so it is NOT a critical point (it only separates the intervals of the sign chart).\n→ Critical points: x = ${S(-p.k)}, x = ${p.k}.`;
      } else if (cps.length === 0) {
        tr += `f'(x) = ${fp} = 0 denkleminin reel kökü yok (3x² + ${p.k} ≥ ${p.k} > 0).\nf polinom olduğundan f' her yerde tanımlıdır.\n→ Kritik nokta YOK; dolayısıyla yerel ekstremum da yok.`;
        en += `f'(x) = ${fp} = 0 has no real root (3x² + ${p.k} ≥ ${p.k} > 0).\nf is a polynomial, so f' is defined everywhere.\n→ NO critical points, hence no local extrema.`;
      } else {
        const list = cps.map((x) => 'x = ' + S(x)).join(', ');
        tr += `f'(x) = 0 → ${fac} = 0 → ${list}.\nf polinom olduğundan f' her yerde tanımlıdır; başka kritik nokta yoktur.\n→ Kritik noktalar: ${list}.`;
        en += `f'(x) = 0 → ${fac} = 0 → ${list}.\nf is a polynomial, so f' is defined everywhere; there are no other critical points.\n→ Critical points: ${list}.`;
      }
      st.push(Tx(tr, en));
    }

    // 3) sign chart
    {
      let tr = '── 3) f\' işaret tablosu ──\n', en = '── 3) Sign chart of f\' ──\n';
      ch.rows.forEach((row) => {
        const t = frS(row.t);
        const sg = row.s;
        tr += `${interval(row)}: x = ${t} için f'(${t}) ${p.kind === 'cusp' ? row.str : '= ' + row.str} → f' ${sgnStr(sg)} → f ${sg > 0 ? 'ARTAN ↗' : 'AZALAN ↘'}\n`;
        en += `${interval(row)}: at x = ${t}, f'(${t}) ${p.kind === 'cusp' ? row.str : '= ' + row.str} → f' ${sgnStr(sg)} → f ${sg > 0 ? 'INCREASING ↗' : 'DECREASING ↘'}\n`;
      });
      if (ch.sp.some((s) => s.type === 'hole')) {
        tr += `(x = 0'da f tanımsızdır; iki yan aralık ayrı incelenir.)\n`;
        en += `(f is undefined at x = 0; the two sides are examined separately.)\n`;
      }
      st.push(Tx(tr.trim(), en.trim()));
    }

    // 4) classification
    {
      let tr = '── 4) Birinci Türev Testi: sınıflandır ──\n', en = '── 4) First Derivative Test: classify ──\n';
      if (cls.length === 0) {
        tr += 'Kritik nokta olmadığından sınıflandırılacak nokta yok. f, tüm tanım kümesinde monoton: yerel ekstremum yok.';
        en += 'With no critical points there is nothing to classify. f is monotonic everywhere: no local extrema.';
      }
      cls.forEach((c) => {
        const x = S(c.x), v = c.v.str;
        if (c.kind === 'max') {
          tr += `x = ${x}: f' işareti ${sgnStr(c.before)} → ${sgnStr(c.after)} → YEREL MAKSİMUM, f(${x}) = ${v}\n`;
          en += `x = ${x}: f' changes ${sgnStr(c.before)} → ${sgnStr(c.after)} → LOCAL MAXIMUM, f(${x}) = ${v}\n`;
        } else if (c.kind === 'min') {
          tr += `x = ${x}: f' işareti ${sgnStr(c.before)} → ${sgnStr(c.after)} → YEREL MİNİMUM, f(${x}) = ${v}\n`;
          en += `x = ${x}: f' changes ${sgnStr(c.before)} → ${sgnStr(c.after)} → LOCAL MINIMUM, f(${x}) = ${v}\n`;
        } else {
          tr += `x = ${x}: f' işareti ${sgnStr(c.before)} → ${sgnStr(c.after)} (değişmiyor) → EKSTREMUM DEĞİL (f(${x}) = ${v}); yalnızca düz teğetli geçiş.\n`;
          en += `x = ${x}: f' keeps the sign ${sgnStr(c.before)} → ${sgnStr(c.after)} (no change) → NOT an extremum (f(${x}) = ${v}); only a flat passage.\n`;
        }
      });
      st.push(Tx(tr.trim(), en.trim()));
    }

    // 5) absolute extrema
    {
      let tr = `── 5) ${intStr(p.A, p.B)} üzerinde mutlak ekstremum ──\n`, en = `── 5) Absolute extrema on ${intStr(p.A, p.B)} ──\n`;
      const inner = cps.filter((x) => x > p.A && x < p.B);
      tr += `Adaylar: uç noktalar x = ${S(p.A)}, x = ${S(p.B)}` + (inner.length ? ` ve aralığın İÇİNDEKİ kritik noktalar: ${inner.map(S).join(', ')}.` : ` (aralığın içinde kritik nokta yok).`) + '\n';
      en += `Candidates: endpoints x = ${S(p.A)}, x = ${S(p.B)}` + (inner.length ? ` and the critical points INSIDE the interval: ${inner.map(S).join(', ')}.` : ' (no critical point lies inside the interval).') + '\n';
      ab.cands.forEach((c) => {
        tr += `f(${S(c.x)}) = ${c.v.str}${c.tag === 'end' ? '   (uç nokta)' : '   (kritik nokta)'}\n`;
        en += `f(${S(c.x)}) = ${c.v.str}${c.tag === 'end' ? '   (endpoint)' : '   (critical point)'}\n`;
      });
      const ax = (arr) => arr.map((c) => S(c.x)).join(' ve ');
      const axE = (arr) => arr.map((c) => S(c.x)).join(' and ');
      if (Math.abs(ab.max - ab.min) < 1e-9) {
        tr += `Tüm adaylar eşit değerde: f bu aralıkta sabit.`;
        en += `All candidates give the same value: f is constant here.`;
      } else {
        tr += `En büyük: ${ab.maxStr} (x = ${ax(ab.maxAt)})  → mutlak MAKSİMUM\nEn küçük: ${ab.minStr} (x = ${ax(ab.minAt)})  → mutlak MİNİMUM`;
        en += `Largest: ${ab.maxStr} (x = ${axE(ab.maxAt)})  → absolute MAXIMUM\nSmallest: ${ab.minStr} (x = ${axE(ab.minAt)})  → absolute MINIMUM`;
      }
      st.push(Tx(tr, en));
    }

    // 6) summary
    {
      const loc = cls.filter((c) => c.kind !== 'none');
      const lt = loc.length ? loc.map((c) => `${c.kind === 'max' ? 'yerel maks' : 'yerel min'}: (${S(c.x)}, ${c.v.str})`).join(';  ') : 'yerel ekstremum yok';
      const le = loc.length ? loc.map((c) => `${c.kind === 'max' ? 'local max' : 'local min'}: (${S(c.x)}, ${c.v.str})`).join(';  ') : 'no local extremum';
      st.push(Tx(
        `── 6) Sonuç ──\n(a) ${lt}.\n(b) ${intStr(p.A, p.B)} üzerinde mutlak maks = ${ab.maxStr}, mutlak min = ${ab.minStr}.\nİpucu: Mutlak ekstremum bir yerel ekstremum ya da basitçe bir uç nokta olabilir; ikisini ayrı düşünün.`,
        `── 6) Result ──\n(a) ${le}.\n(b) On ${intStr(p.A, p.B)}: absolute max = ${ab.maxStr}, absolute min = ${ab.minStr}.\nTip: an absolute extremum may be a local extremum or simply an endpoint; treat them separately.`));
    }
    return st;
  }

  // ---------- drawing ----------
  function yRange(p) {
    if (p.kind === 'rat') { const h = 2 * p.k + 3; return [-h, h]; }
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const y = fNum(p, p.xl + (p.xh - p.xl) * i / 200);
      if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    }
    if (!isFinite(lo) || !isFinite(hi)) { lo = -5; hi = 5; }
    const pad = Math.max(1, (hi - lo) * 0.15);
    return [lo - pad, hi + pad];
  }

  function draw(canvas, p) {
    try {
      const [yl, yh0] = yRange(p);
      let ylo = yl, yhi = yh0;
      if (p.showD) { const sp = yhi - ylo; ylo = Math.min(ylo, -0.1 * sp); yhi = Math.max(yhi, 0.1 * sp); }
      canvas.setViewport(p.xl, p.xh, ylo, yhi);
      const ch = chart(p);
      // monotonicity regions
      const bounds = [p.xl].concat(ch.sp.map((s) => s.x).filter((x) => x > p.xl && x < p.xh), [p.xh]);
      for (let i = 0; i < bounds.length - 1; i++) {
        const a = bounds[i], b = bounds[i + 1];
        if (b - a < 1e-6) continue;
        const sl = fpNum(p, (a + b) / 2);
        if (!isFinite(sl)) continue;
        canvas.addRegion({ xMin: a, xMax: b, color: canvas._withAlpha(sl >= 0 ? canvas.blue() : canvas.orange(), 0.16) });
      }
      canvas.addFunction({ evaluator: (x) => fNum(p, x), color: canvas.accent(), thickness: 3, label: 'f(x)' });
      if (p.showD) canvas.addFunction({ evaluator: (x) => fpNum(p, x), color: canvas.purple(), thickness: 2, dashed: true, label: "f'(x)" });
      // interval [A, B]
      canvas.addGuideLine({ axis: 'vertical', position: p.A, color: canvas.gray(), label: 'a = ' + nf(p.A) });
      canvas.addGuideLine({ axis: 'vertical', position: p.B, color: canvas.gray(), label: 'b = ' + nf(p.B) });
      // absolute extrema
      const ab = absolute(p);
      if (Math.abs(ab.max - ab.min) > 1e-9) {
        ab.maxAt.forEach((c) => canvas.addMarker({ x: c.x, y: c.v.num, color: canvas.green(), shape: 'square', radius: 9, label: Tx('mutlak maks', 'abs max') }));
        ab.minAt.forEach((c) => canvas.addMarker({ x: c.x, y: c.v.num, color: canvas.red(), shape: 'square', radius: 9, label: Tx('mutlak min', 'abs min') }));
      }
      // critical points
      classify(p).forEach((c) => {
        if (c.x < p.xl || c.x > p.xh) return;
        const lab = c.kind === 'max' ? Tx('yerel maks', 'local max') : c.kind === 'min' ? Tx('yerel min', 'local min') : Tx('ekstremum değil', 'not an extremum');
        canvas.addMarker({ x: c.x, y: c.v.num, color: canvas.gold(), shape: c.kind === 'none' ? 'circle' : 'diamond', radius: 7, hollow: c.kind === 'none', label: `${lab} (${S(c.x)}, ${nf(c.v.num)})` });
        if (p.showD && c.type === 'crit') canvas.addMarker({ x: c.x, y: 0, color: canvas.gold(), radius: 5, label: '' });
      });
      // moving point
      const x0 = p.pos, y0 = fNum(p, x0), s0 = fpNum(p, x0);
      if (isFinite(y0)) {
        const lab = `x = ${nf(x0)}:  f = ${nf(y0)},  f' = ${isFinite(s0) ? nf(s0) : Tx('yok (tanımsız)', 'does not exist')}`;
        if (isFinite(s0)) {
          const hw = (p.xh - p.xl) * 0.07;
          canvas.addSegment({ x1: x0 - hw, y1: y0 - s0 * hw, x2: x0 + hw, y2: y0 + s0 * hw, color: canvas.orange(), thickness: 2, dashed: true });
        }
        canvas.addMarker({ x: x0, y: y0, color: canvas.orange(), radius: 6, label: lab });
        if (p.showD && isFinite(s0)) canvas.addMarker({ x: x0, y: s0, color: canvas.purple(), radius: 5, label: '' });
      }
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: Tx('Nokta konumu x (teğeti ve f\' değerini görün)', 'Point position x (see the tangent and f\' value)'),
      min: -6, max: 6, step: 0.1,
      get: () => { const p = getProblem(); return Math.max(p.xl, Math.min(p.xh, p.pos)); },
      set: (v) => { const p = getProblem(); p.pos = Math.max(p.xl, Math.min(p.xh, v)); },
    });
    h.addSlider({
      caption: Tx('Aralığın sol ucu a (mutlak ekstremum için)', 'Interval left end a (for absolute extrema)'),
      min: -6, max: 6, step: 1,
      get: () => getProblem().A,
      set: (v) => {
        const p = getProblem();
        const lo = p.kind === 'rat' ? 1 : p.xl;
        p.A = Math.max(lo, Math.min(Math.round(v), p.B - 1));
      },
    });
    h.addSlider({
      caption: Tx('Aralığın sağ ucu b', 'Interval right end b'),
      min: -6, max: 6, step: 1,
      get: () => getProblem().B,
      set: (v) => {
        const p = getProblem();
        p.B = Math.min(p.xh, Math.max(Math.round(v), p.A + 1));
      },
    });
    h.addCheckbox({
      caption: Tx('f\' grafiğini göster (mor, kesikli)', 'Show the f\' graph (purple, dashed)'),
      get: () => getProblem().showD,
      set: (v) => { getProblem().showD = !!v; },
    });
  }

  Topics.register('applications', {
    id: 'extremaFirstDerivative',
    tabTitle: () => Tx('Ekstremumlar ve Birinci Türev Testi', 'Extrema & First Derivative Test'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s*• (KRİTİK NOKTA|CRITICAL POINT):/, make: (rng) => createProblem(rng, 'cubic') },
      { match: /^\s*• (Mutlak \(global\)|Absolute \(global\))/, make: (rng) => createProblem(rng, 'quartW') },
      { match: /^\s*(FERMAT TEOREMİ|FERMAT'S THEOREM)$/, make: (rng) => createProblem(rng, 'mono', 'flat') },
      { match: /^\s*• \+ → −/, make: (rng) => createProblem(rng, 'cubic') },
      { match: /^\s*• − → \+/, make: (rng) => createProblem(rng, 'quartW') },
      { match: /^\s*• (işaret değişmez|no sign change):/, make: (rng) => createProblem(rng, 'quartD') },
      { match: /^\s*• f'\(c\) = 0 (ama|but)/, make: (rng) => createProblem(rng, 'mono', 'flat') },
      { match: /^\s*• f'\(c\) (tanımsız|undefined)/, make: (rng) => createProblem(rng, 'cusp') },
      { match: /^\s*• (f'nin ve f'nin birlikte|A point where f itself)/, make: (rng) => createProblem(rng, 'rat') },
      { match: /^\s*• (Hiç kritik nokta|With no critical points)/, make: (rng) => createProblem(rng, 'mono', 'none') },
    ],
  });
})();
