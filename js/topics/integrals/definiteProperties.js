// Properties of the definite integral and average value (Thomas 5.3, Stewart 5.2 / 6.5).
// problem = { type: 0 linearity & reversed limits | 1 additivity | 2 even/odd symmetry | 3 average value of a quadratic + MVT |
//             4 average value of sin/cos | 5 average value of A·eˣ | 6 max–min inequality | 7 signed vs total area |
//             8 comparison (domination) f ≤ g,
//             fev (evaluator), a, b, va/vb/vc (graph values), vm (graph mode), concrete }
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const M = (s) => String(s).replace(/-/g, '−');
  const N2 = (v) => (Number.isFinite(v) ? M(fmt2(v)) : '?');
  const P = (v) => (v < 0 ? `(${N2(v)})` : N2(v));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const fr = (n, d) => { if (d === undefined) d = 1; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
  const fadd = (x, y) => fr(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
  const fmul = (x, y) => fr(x[0] * y[0], x[1] * y[1]);
  const fval = (x) => x[0] / x[1];
  const fstr = (x) => (x[1] === 1 ? M(x[0]) : `${x[0] < 0 ? '−' : ''}${Math.abs(x[0])}/${x[1]}`);
  const safeFn = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) && Math.abs(r) < 60 ? r : NaN; } catch (e) { return NaN; } };
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] || '⁻').join('');
  function rgba(hex, a) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return hex;
    return `rgba(${parseInt(m[1].substr(0, 2), 16)},${parseInt(m[1].substr(2, 2), 16)},${parseInt(m[1].substr(4, 2), 16)},${a})`;
  }
  const PI = Math.PI;
  let forced = null;

  function simpson(f, a, b, n) {
    n = n || 400;
    const h = (b - a) / n;
    let s = 0;
    for (let i = 0; i <= n; i++) { const w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; s += w * f(a + i * h); }
    return s * h / 3;
  }
  function polyStr(c, v) {
    const parts = [];
    for (let d = c.length - 1; d >= 0; d--) if (c[d] !== 0) parts.push({ num: c[d], d });
    if (!parts.length) return '0';
    let s = '';
    parts.forEach((q, i) => {
      const a = Math.abs(q.num);
      const body = q.d === 0 ? String(a) : (a === 1 ? '' : String(a)) + v + (q.d > 1 ? sup(q.d) : '');
      s += i === 0 ? (q.num < 0 ? '−' : '') + body : (q.num < 0 ? ' − ' : ' + ') + body;
    });
    return s;
  }
  const pEval = (c, x) => c.reduce((s, q, d) => s + q * Math.pow(x, d), 0);
  // ∫ₐᵇ of a polynomial, exact fraction
  const polyInt = (c, a, b) => { let s = [0, 1]; c.forEach((q, d) => { if (q) s = fadd(s, fr(q * (Math.pow(b, d + 1) - Math.pow(a, d + 1)), d + 1)); }); return s; };
  const sgnStr = (v) => (v < 0 ? '−' : '+');
  const absS = (v) => Math.abs(v);
  const lin = (al, f, be, g, k) => {
    let s = `${al === 1 ? '' : al === -1 ? '−' : al}${f}`;
    s += ` ${sgnStr(be)} ${absS(be) === 1 ? '' : absS(be)}${g}`;
    if (k) s += ` ${sgnStr(k)} ${absS(k)}`;
    return s;
  };

  // schematic function for the abstract problems
  const demo = (x) => 0.2 * (x + 2) * (x - 1) * (x - 4);

  // bound-table entries: f, interval, extremum points, reasons, exact value
  const BT = [
    { fs: 'x² + 1', f: (x) => x * x + 1, a: 0, b: 2, xm: 0, xM: 2, why: ['x ≥ 0 için f artandır', 'f is increasing for x ≥ 0'], I: 14 / 3 },
    { fs: '1/(1 + x²)', f: (x) => 1 / (1 + x * x), a: 0, b: 2, xm: 2, xM: 0, why: ['x ≥ 0 için f azalandır', 'f is decreasing for x ≥ 0'], I: Math.atan(2) },
    { fs: '1/x', f: (x) => 1 / x, a: 1, b: 4, xm: 4, xM: 1, why: ['x > 0 için f azalandır', 'f is decreasing for x > 0'], I: Math.log(4) },
    { fs: '√(x + 1)', f: (x) => Math.sqrt(x + 1), a: 0, b: 3, xm: 0, xM: 3, why: ['f artandır', 'f is increasing'], I: 14 / 3 },
    { fs: 'sin x', f: Math.sin, a: 0, b: PI, xm: 0, xM: PI / 2, why: ['[0, π] üzerinde sin x ≥ 0, en küçük değer uçlarda 0, en büyük değer x = π/2 noktasında 1', 'on [0, π] sin x ≥ 0, the least value is 0 at the ends and the greatest is 1 at x = π/2'], I: 2 },
    { fs: 'e^(−x²)', f: (x) => Math.exp(-x * x), a: 0, b: 1, xm: 1, xM: 0, why: ['x ≥ 0 için f azalandır', 'f is decreasing for x ≥ 0'], I: 0.7468241328 },
    { fs: '4 − x²', f: (x) => 4 - x * x, a: 0, b: 2, xm: 2, xM: 0, why: ['x ≥ 0 için f azalandır', 'f is decreasing for x ≥ 0'], I: 16 / 3 },
  ];
  // comparison (domination) table: f <= g on [a, b], exact integrals If, Ig
  const CT = [
    { fs: 'x²', gs: 'x', f: (x) => x * x, g: (x) => x, a: 0, b: 1, If: 1 / 3, Ig: 1 / 2, Is: ['1/3', '1/2'], why: ['0 ≤ x ≤ 1 için x² = x·x ≤ x·1 = x (x ≤ 1 olduğundan)', 'for 0 ≤ x ≤ 1 we have x² = x·x ≤ x·1 = x (because x ≤ 1)'] },
    { fs: 'x³', gs: 'x²', f: (x) => x * x * x, g: (x) => x * x, a: 0, b: 1, If: 1 / 4, Ig: 1 / 3, Is: ['1/4', '1/3'], why: ['0 ≤ x ≤ 1 için x³ = x²·x ≤ x²·1 = x²', 'for 0 ≤ x ≤ 1 we have x³ = x²·x ≤ x²·1 = x²'] },
    { fs: 'x', gs: '√x', f: (x) => x, g: (x) => Math.sqrt(x), a: 0, b: 1, If: 1 / 2, Ig: 2 / 3, Is: ['1/2', '2/3'], why: ['0 ≤ x ≤ 1 için x = √x·√x ≤ √x·1 = √x', 'for 0 ≤ x ≤ 1 we have x = √x·√x ≤ √x·1 = √x'] },
    { fs: 'sin x', gs: 'x', f: Math.sin, g: (x) => x, a: 0, b: PI / 2, If: 1, Ig: PI * PI / 8, Is: ['1', 'π²/8'], why: ['x ≥ 0 için sin x ≤ x (bilinen eşitsizlik: yay uzunluğu, dik kenardan uzundur)', 'for x ≥ 0 we have sin x ≤ x (the known inequality: the arc is longer than the vertical leg)'] },
    { fs: '1/x²', gs: '1/x', f: (x) => 1 / (x * x), g: (x) => 1 / x, a: 1, b: 2, If: 1 / 2, Ig: Math.LN2, Is: ['1/2', 'ln 2'], why: ['x ≥ 1 için x² ≥ x olduğundan 1/x² ≤ 1/x', 'for x ≥ 1 we have x² ≥ x, hence 1/x² ≤ 1/x'] },
    { fs: 'e^(−x)', gs: 'e^(−x²)', f: (x) => Math.exp(-x), g: (x) => Math.exp(-x * x), a: 0, b: 1, If: 1 - Math.exp(-1), Ig: 0.7468241328, Is: ['1 − 1/e', '≈ 0.7468'], why: ['0 ≤ x ≤ 1 için x² ≤ x, yani −x ≤ −x² ve eᵗ artan olduğundan e^(−x) ≤ e^(−x²)', 'for 0 ≤ x ≤ 1 we have x² ≤ x, so −x ≤ −x² and since eᵗ is increasing e^(−x) ≤ e^(−x²)'] },
    { fs: '1/(1 + x²)', gs: '1', f: (x) => 1 / (1 + x * x), g: () => 1, a: 0, b: 1, If: PI / 4, Ig: 1, Is: ['π/4', '1'], why: ['1 + x² ≥ 1 olduğundan 1/(1 + x²) ≤ 1', 'since 1 + x² ≥ 1 we have 1/(1 + x²) ≤ 1'] },
  ];
  const piTxt = (v) => (Math.abs(v - PI) < 1e-12 ? 'π' : Math.abs(v - PI / 2) < 1e-12 ? 'π/2' : Math.abs(v - 2 * PI) < 1e-12 ? '2π' : N2(v));

  function createProblem(rng) {
    const type = forced !== null ? forced : rng.pick([0, 1, 2, 3, 3, 4, 5, 6, 7]);
    const p = { type, concrete: true };
    if (type === 0) {
      p.concrete = false;
      p.a = rng.nextInt(-3, 2); p.b = p.a + rng.nextInt(2, 5);
      p.A = rng.nonZeroInt(-6, 8); p.B = rng.nonZeroInt(-6, 8);
      p.al = rng.pick([2, 3, 4, -2, -3]); p.be = rng.pick([-1, 2, 3, -3, 1]); p.k = rng.pick([0, 0, 1, 2, -1]);
      p.fev = demo; p.va = p.a; p.vb = p.b; p.vc = (p.a + p.b) / 2; p.vm = 0;
    } else if (type === 1) {
      p.concrete = false;
      p.a = rng.nextInt(-3, 0); p.b = p.a + rng.nextInt(1, 3); p.c = p.b + rng.nextInt(1, 3);
      p.A = rng.nonZeroInt(-6, 8); p.D = rng.nonZeroInt(-6, 8);
      p.variant = rng.nextInt(0, 2);
      p.fev = demo; p.va = p.a; p.vb = p.c; p.vc = p.b; p.vm = 0;
    } else if (type === 2) {
      p.a0 = rng.nextInt(1, 4);
      const oddOnly = rng.nextInt(0, 5) === 0;
      p.cf = [oddOnly ? 0 : rng.nextInt(-4, 5), rng.nextInt(-4, 5), oddOnly ? 0 : rng.nonZeroInt(-3, 4), rng.pick([-2, -1, 0, 1, 2])];
      if (oddOnly && p.cf[1] === 0 && p.cf[3] === 0) p.cf[1] = 2;
      if (!oddOnly && p.cf[0] === 0 && p.cf[2] === 0) p.cf[2] = 1;
      p.fev = (x) => pEval(p.cf, x); p.a = -p.a0; p.b = p.a0; p.va = p.a; p.vb = p.b; p.vc = 0; p.vm = 0;
    } else if (type === 3) {
      p.cf = [rng.nextInt(-5, 6), rng.nextInt(-4, 5), rng.pick([1, 2, -1, -2]), 0];
      p.a = rng.pick([-2, -1, 0, 1]); p.b = p.a + rng.pick([2, 3]);
      p.fev = (x) => pEval(p.cf, x); p.va = p.a; p.vb = p.b; p.vm = 1;
    } else if (type === 4) {
      p.A = rng.nextInt(1, 5);
      p.kind = rng.pick(['sinPi', 'sinHalf', 'cosHalf']);
      p.a = 0; p.b = p.kind === 'sinPi' ? PI : PI / 2;
      p.fev = p.kind === 'cosHalf' ? (x) => p.A * Math.cos(x) : (x) => p.A * Math.sin(x);
      p.va = p.a; p.vb = p.b; p.vm = 1;
    } else if (type === 5) {
      p.A = rng.nextInt(1, 4); p.a = rng.pick([-1, 0, 1]); p.b = p.a + rng.pick([1, 2]);
      p.fev = (x) => p.A * Math.exp(x); p.va = p.a; p.vb = p.b; p.vm = 1;
    } else if (type === 6) {
      p.e = rng.pick(BT); p.a = p.e.a; p.b = p.e.b;
      p.fev = p.e.f; p.va = p.a; p.vb = p.b; p.vm = 2;
    } else if (type === 8) {
      p.e = rng.pick(CT); p.a = p.e.a; p.b = p.e.b;
      p.fev = p.e.f; p.va = p.a; p.vb = p.b; p.vm = 0;
    } else {
      p.sub = rng.pick(['poly', 'sin']);
      if (p.sub === 'poly') { p.mm = rng.nextInt(1, 4); p.a = 0; p.b = 2 * p.mm; p.fev = (x) => x * x - p.mm * p.mm; p.vc = p.mm; }
      else { p.A = rng.nextInt(1, 4); p.a = 0; p.b = 2 * PI; p.fev = (x) => p.A * Math.sin(x); p.vc = PI; }
      p.va = p.a; p.vb = p.b; p.vm = 0;
    }
    if (p.vc === undefined) p.vc = (p.va + p.vb) / 2;
    return p;
  }

  // ---------- helpers for averages ----------
  function avgData(p) {
    // returns { I (exact number), len, avg, cs: [c...] }
    const len = p.b - p.a;
    let I;
    if (p.type === 3) I = fval(polyInt(p.cf, p.a, p.b));
    else if (p.type === 4) I = p.kind === 'sinPi' ? 2 * p.A : p.A;
    else I = p.A * (Math.exp(p.b) - Math.exp(p.a));
    const avg = I / len;
    return { I, len, avg };
  }
  function rootsOf(f, lo, hi, target) {
    const out = [], N = 300;
    let prev = f(lo) - target, px = lo;
    for (let i = 1; i <= N; i++) {
      const x = lo + (hi - lo) * i / N, v = f(x) - target;
      if (Number.isFinite(prev) && Number.isFinite(v) && prev * v < 0) {
        let l = px, r = x, fl = prev;
        for (let t = 0; t < 60; t++) { const m = (l + r) / 2, fm = f(m) - target; if (fl * fm <= 0) r = m; else { l = m; fl = fm; } }
        out.push((l + r) / 2);
      } else if (Number.isFinite(v) && v === 0) out.push(x);
      prev = v; px = x;
    }
    return out.slice(0, 4);
  }

  // ---------- statement ----------
  function problemStatement(p) {
    if (p.type === 0) return tx(`∫ₐᵇ f(x) dx = ${p.A} ve ∫ₐᵇ g(x) dx = ${p.B} olsun (a = ${p.a}, b = ${p.b}). İntegralin özelliklerini kullanarak ∫ₐᵇ [ ${lin(p.al, 'f(x)', p.be, 'g(x)', p.k)} ] dx değerini ve ∫ᵇₐ f(x) dx değerini bulalım.`,
      `Let ∫ₐᵇ f(x) dx = ${p.A} and ∫ₐᵇ g(x) dx = ${p.B} (a = ${p.a}, b = ${p.b}). Using the properties of the integral, let's find ∫ₐᵇ [ ${lin(p.al, 'f(x)', p.be, 'g(x)', p.k)} ] dx and ∫ᵇₐ f(x) dx.`);
    if (p.type === 1) return p.variant === 0
      ? tx(`∫ (${p.a} → ${p.c}) f(x) dx = ${p.A + p.D} ve ∫ (${p.a} → ${p.b}) f(x) dx = ${p.A} olsun. Toplamsallık özelliğiyle ∫ (${p.b} → ${p.c}) f(x) dx ve ∫ (${p.c} → ${p.b}) f(x) dx değerlerini bulalım.`,
        `Let ∫ (${p.a} → ${p.c}) f(x) dx = ${p.A + p.D} and ∫ (${p.a} → ${p.b}) f(x) dx = ${p.A}. Using additivity, let's find ∫ (${p.b} → ${p.c}) f(x) dx and ∫ (${p.c} → ${p.b}) f(x) dx.`)
      : tx(`∫ (${p.a} → ${p.b}) f(x) dx = ${p.A} ve ∫ (${p.b} → ${p.c}) f(x) dx = ${p.D} olsun. Toplamsallık özelliğiyle ∫ (${p.a} → ${p.c}) f(x) dx ve ∫ (${p.c} → ${p.a}) f(x) dx değerlerini bulalım.`,
        `Let ∫ (${p.a} → ${p.b}) f(x) dx = ${p.A} and ∫ (${p.b} → ${p.c}) f(x) dx = ${p.D}. Using additivity, let's find ∫ (${p.a} → ${p.c}) f(x) dx and ∫ (${p.c} → ${p.a}) f(x) dx.`);
    if (p.type === 2) return tx(`∫ (−${p.a0} → ${p.a0}) ( ${polyStr(p.cf, 'x')} ) dx integralini simetri (çift/tek fonksiyon) özelliğinden yararlanarak hesaplayalım. Sonucu doğrudan hesapla kontrol edebilir miyiz?`,
      `Let's compute ∫ (−${p.a0} → ${p.a0}) ( ${polyStr(p.cf, 'x')} ) dx using symmetry (even/odd functions). Can we check the result by direct calculation?`);
    if (p.type === 3) return tx(`f(x) = ${polyStr(p.cf, 'x')} fonksiyonunun [${M(p.a)}, ${M(p.b)}] aralığındaki ortalama değerini bulalım. Sonra f(c) = f_ort olacak şekilde aralık içinde bir c noktası (Ortalama Değer Teoremi) bulabilir miyiz?`,
      `Let's find the average value of f(x) = ${polyStr(p.cf, 'x')} on [${M(p.a)}, ${M(p.b)}]. Then can we find a point c in the interval with f(c) = f_avg (the Mean Value Theorem for integrals)?`);
    if (p.type === 4) return tx(`f(x) = ${p.A === 1 ? '' : p.A}${p.kind === 'cosHalf' ? 'cos' : 'sin'} x fonksiyonunun [0, ${p.kind === 'sinPi' ? 'π' : 'π/2'}] aralığındaki ortalama değerini bulalım ve f(c) = f_ort olan c noktasını (radyan cinsinden) hesaplayalım.`,
      `Let's find the average value of f(x) = ${p.A === 1 ? '' : p.A}${p.kind === 'cosHalf' ? 'cos' : 'sin'} x on [0, ${p.kind === 'sinPi' ? 'π' : 'π/2'}] and compute the point c (in radians) with f(c) = f_avg.`);
    if (p.type === 5) return tx(`f(x) = ${p.A === 1 ? '' : p.A}eˣ fonksiyonunun [${M(p.a)}, ${M(p.b)}] aralığındaki ortalama değerini bulalım ve f(c) = f_ort olan c noktasını hesaplayalım.`,
      `Let's find the average value of f(x) = ${p.A === 1 ? '' : p.A}eˣ on [${M(p.a)}, ${M(p.b)}] and compute the point c with f(c) = f_avg.`);
    if (p.type === 6) return tx(`f(x) = ${p.e.fs} fonksiyonu için, integrali hesaplamadan, ∫ (${piTxt(p.a)} → ${piTxt(p.b)}) f(x) dx değerini en küçük ve en büyük değerler (max–min eşitsizliği) yardımıyla iki sayı arasına sıkıştıralım. Sonra gerçek değerin bu sınırlar arasında kaldığını kontrol edelim.`,
      `For f(x) = ${p.e.fs}, without computing the integral, let's trap ∫ (${piTxt(p.a)} → ${piTxt(p.b)}) f(x) dx between two numbers using the least and greatest values (the max–min inequality). Then let's check that the true value lies between these bounds.`);
    if (p.type === 8) return tx(`f(x) = ${p.e.fs} ve g(x) = ${p.e.gs} olsun. İntegralleri hesaplamadan, karşılaştırma özelliğiyle [${piTxt(p.a)}, ${piTxt(p.b)}] aralığında ∫ f(x) dx ile ∫ g(x) dx integrallerinden hangisinin daha büyük olduğunu bulalım. Sonra gerçek değerleri hesaplayıp sonucu kontrol edelim.`,
      `Let f(x) = ${p.e.fs} and g(x) = ${p.e.gs}. Without computing the integrals, let's use the comparison (domination) property to decide which of ∫ f(x) dx and ∫ g(x) dx is larger on [${piTxt(p.a)}, ${piTxt(p.b)}]. Then let's compute the true values and check the result.`);
    return p.sub === 'poly'
      ? tx(`f(x) = x² − ${p.mm * p.mm} fonksiyonu için [0, ${2 * p.mm}] aralığında hem ∫ f(x) dx (işaretli alan) hem de grafik ile x ekseni arasında kalan TOPLAM alan kaç olur?`,
        `For f(x) = x² − ${p.mm * p.mm} on [0, ${2 * p.mm}], what are both the integral ∫ f(x) dx (signed area) and the TOTAL area between the graph and the x-axis?`)
      : tx(`f(x) = ${p.A === 1 ? '' : p.A}sin x fonksiyonu için [0, 2π] aralığında hem ∫ f(x) dx (işaretli alan) hem de grafik ile x ekseni arasında kalan TOPLAM alan kaç olur?`,
        `For f(x) = ${p.A === 1 ? '' : p.A}sin x on [0, 2π], what are both the integral ∫ f(x) dx (signed area) and the TOTAL area between the graph and the x-axis?`);
  }

  // ---------- solution ----------
  function solveSteps(p) {
    const s = [];
    if (p.type === 0) {
      const R = p.al * p.A + p.be * p.B + p.k * (p.b - p.a);
      s.push(tx(`── 1) Kullanacağımız özellikler ──\n• Sabitle çarpım: ∫ c·f dx = c·∫ f dx\n• Toplam/fark: ∫ (f ± g) dx = ∫ f dx ± ∫ g dx\n• Sabit fonksiyon: ∫ₐᵇ k dx = k(b − a)\n• Sınırları değiştirme: ∫ᵇₐ f dx = −∫ₐᵇ f dx`,
        `── 1) Properties we will use ──\n• Constant multiple: ∫ c·f dx = c·∫ f dx\n• Sum/difference: ∫ (f ± g) dx = ∫ f dx ± ∫ g dx\n• Constant function: ∫ₐᵇ k dx = k(b − a)\n• Reversing the limits: ∫ᵇₐ f dx = −∫ₐᵇ f dx`));
      s.push(tx(`── 2) Integrali parçalayalım ──\n∫ₐᵇ [ ${lin(p.al, 'f', p.be, 'g', p.k)} ] dx = ${P(p.al)}·∫ f dx + ${P(p.be)}·∫ g dx${p.k ? ` + ∫ ${P(p.k)} dx` : ''}.`,
        `── 2) Splitting the integral ──\n∫ₐᵇ [ ${lin(p.al, 'f', p.be, 'g', p.k)} ] dx = ${P(p.al)}·∫ f dx + ${P(p.be)}·∫ g dx${p.k ? ` + ∫ ${P(p.k)} dx` : ''}.`));
      s.push(tx(`── 3) Sayıları yerine koyalım ──\n= ${P(p.al)}·${P(p.A)} + ${P(p.be)}·${P(p.B)}${p.k ? ` + ${P(p.k)}·(${p.b} − ${P(p.a)})` : ''}\n= ${N2(p.al * p.A)} + ${P(p.be * p.B)}${p.k ? ` + ${P(p.k * (p.b - p.a))}` : ''} = ${N2(R)}.`,
        `── 3) Substituting the numbers ──\n= ${P(p.al)}·${P(p.A)} + ${P(p.be)}·${P(p.B)}${p.k ? ` + ${P(p.k)}·(${p.b} − ${P(p.a)})` : ''}\n= ${N2(p.al * p.A)} + ${P(p.be * p.B)}${p.k ? ` + ${P(p.k * (p.b - p.a))}` : ''} = ${N2(R)}.`));
      s.push(tx(`── 4) Sınırlar yer değişince ──\n∫ᵇₐ f dx = −∫ₐᵇ f dx = −(${p.A}) = ${N2(-p.A)}.`, `── 4) Reversed limits ──\n∫ᵇₐ f dx = −∫ₐᵇ f dx = −(${p.A}) = ${N2(-p.A)}.`));
      s.push(tx(`── 5) Kontrol ──\nİntegral doğrusaldır: katsayılar aynen dışarı çıkar. Sabit terim yalnızca dikdörtgen alanı ekler (yükseklik × genişlik). İşaret çevirme ve toplam aynı sonuca götürüyor ✓.`,
        `── 5) Check ──\nThe integral is linear: the coefficients come outside unchanged. A constant term just adds a rectangle's area (height × width). Sign flip and sum lead to the same result ✓.`));
      return s;
    }
    if (p.type === 1) {
      const C = p.A + p.D;
      s.push(tx(`── 1) Toplamsallık özelliği ──\nAralık parçalanabilir: ∫ₐᶜ f dx = ∫ₐᵇ f dx + ∫ᵇᶜ f dx (b hangi noktada olursa olsun). Ayrıca ∫ᶜₐ = −∫ₐᶜ.`,
        `── 1) The additivity property ──\nThe interval can be split: ∫ₐᶜ f dx = ∫ₐᵇ f dx + ∫ᵇᶜ f dx (wherever b lies). Also ∫ᶜₐ = −∫ₐᶜ.`));
      if (p.variant === 0) {
        s.push(tx(`── 2) Bilinmeyeni çözelim ──\n∫ (${p.a}→${p.c}) = ∫ (${p.a}→${p.b}) + ∫ (${p.b}→${p.c})  ⇒  ${N2(C)} = ${N2(p.A)} + ∫ (${p.b}→${p.c}).\n∫ (${p.b}→${p.c}) f dx = ${N2(C)} − ${P(p.A)} = ${N2(p.D)}.`,
          `── 2) Solving for the unknown ──\n∫ (${p.a}→${p.c}) = ∫ (${p.a}→${p.b}) + ∫ (${p.b}→${p.c})  ⇒  ${N2(C)} = ${N2(p.A)} + ∫ (${p.b}→${p.c}).\n∫ (${p.b}→${p.c}) f dx = ${N2(C)} − ${P(p.A)} = ${N2(p.D)}.`));
        s.push(tx(`── 3) Ters sınırlar ──\n∫ (${p.c}→${p.b}) f dx = −∫ (${p.b}→${p.c}) f dx = −(${N2(p.D)}) = ${N2(-p.D)}.`, `── 3) Reversed limits ──\n∫ (${p.c}→${p.b}) f dx = −∫ (${p.b}→${p.c}) f dx = −(${N2(p.D)}) = ${N2(-p.D)}.`));
      } else {
        s.push(tx(`── 2) Parçaları toplayalım ──\n∫ (${p.a}→${p.c}) f dx = ∫ (${p.a}→${p.b}) + ∫ (${p.b}→${p.c}) = ${N2(p.A)} + ${P(p.D)} = ${N2(C)}.`,
          `── 2) Adding the pieces ──\n∫ (${p.a}→${p.c}) f dx = ∫ (${p.a}→${p.b}) + ∫ (${p.b}→${p.c}) = ${N2(p.A)} + ${P(p.D)} = ${N2(C)}.`));
        s.push(tx(`── 3) Ters sınırlar ──\n∫ (${p.c}→${p.a}) f dx = −∫ (${p.a}→${p.c}) f dx = −(${N2(C)}) = ${N2(-C)}.`, `── 3) Reversed limits ──\n∫ (${p.c}→${p.a}) f dx = −∫ (${p.a}→${p.c}) f dx = −(${N2(C)}) = ${N2(-C)}.`));
      }
      s.push(tx(`── 4) Kontrol ──\nDöngüsel kontrol: ∫ (${p.a}→${p.b}) + ∫ (${p.b}→${p.c}) + ∫ (${p.c}→${p.a}) = ${N2(p.A)} + ${P(p.D)} + ${P(-C)} = 0 ✓ (başlangıç noktasına dönen yol ∫ₐᵃ f = 0 verir).`,
        `── 4) Check ──\nLoop check: ∫ (${p.a}→${p.b}) + ∫ (${p.b}→${p.c}) + ∫ (${p.c}→${p.a}) = ${N2(p.A)} + ${P(p.D)} + ${P(-C)} = 0 ✓ (a path that returns to the start gives ∫ₐᵃ f = 0).`));
      return s;
    }
    if (p.type === 2) {
      const c = p.cf, a0 = p.a0;
      const odd = [0, c[1], 0, c[3]], even = [c[0], 0, c[2], 0];
      const half = polyInt(even, 0, a0), ans = fmul(half, fr(2));
      s.push(tx(`── 1) Simetri kuralı ──\nSimetrik [−a, a] aralığında: f ÇİFT (f(−x) = f(x)) ise ∫₋ₐᵃ f dx = 2∫₀ᵃ f dx; f TEK (f(−x) = −f(x)) ise ∫₋ₐᵃ f dx = 0. Çünkü tek fonksiyonda x ekseninin altı ve üstü birbirini götürür.`,
        `── 1) The symmetry rule ──\nOn a symmetric interval [−a, a]: if f is EVEN (f(−x) = f(x)) then ∫₋ₐᵃ f dx = 2∫₀ᵃ f dx; if f is ODD (f(−x) = −f(x)) then ∫₋ₐᵃ f dx = 0. For an odd function the parts above and below the x-axis cancel.`));
      s.push(tx(`── 2) Çift ve tek kısımlara ayıralım ──\nf(x) = ${polyStr(c, 'x')}\nTek kısım (x'in tek kuvvetleri): ${polyStr(odd, 'x')}\nÇift kısım (çift kuvvetler ve sabit): ${polyStr(even, 'x')}`,
        `── 2) Splitting into odd and even parts ──\nf(x) = ${polyStr(c, 'x')}\nOdd part (odd powers of x): ${polyStr(odd, 'x')}\nEven part (even powers and the constant): ${polyStr(even, 'x')}`));
      s.push(tx(`── 3) Tek kısım ──\n∫ (−${a0}→${a0}) ( ${polyStr(odd, 'x')} ) dx = 0.`, `── 3) The odd part ──\n∫ (−${a0}→${a0}) ( ${polyStr(odd, 'x')} ) dx = 0.`));
      const evInt = `${c[2] ? `${P(c[2])}·${a0}³/3` : ''}${c[2] && c[0] ? ' + ' : ''}${c[0] ? `${P(c[0])}·${a0}` : ''}` || '0';
      s.push(tx(`── 4) Çift kısım ──\n∫ (−${a0}→${a0}) ( ${polyStr(even, 'x')} ) dx = 2∫₀^${a0} ( ${polyStr(even, 'x')} ) dx = 2·[ ${evInt} ] = 2·(${fstr(half)}) = ${fstr(ans)}.`,
        `── 4) The even part ──\n∫ (−${a0}→${a0}) ( ${polyStr(even, 'x')} ) dx = 2∫₀^${a0} ( ${polyStr(even, 'x')} ) dx = 2·[ ${evInt} ] = 2·(${fstr(half)}) = ${fstr(ans)}.`));
      s.push(tx(`── 5) Sonuç ──\n∫ (−${a0}→${a0}) f dx = 0 + ${fstr(ans)} = ${fstr(ans)}.`, `── 5) Result ──\n∫ (−${a0}→${a0}) f dx = 0 + ${fstr(ans)} = ${fstr(ans)}.`));
      const Fp = (x) => c[0] * x + c[1] * x * x / 2 + c[2] * x * x * x / 3 + c[3] * Math.pow(x, 4) / 4;
      s.push(tx(`── 6) Kontrol (doğrudan hesap) ──\nF(x) = c₀x + c₁x²/2 + c₂x³/3 + c₃x⁴/4 ile F(${a0}) − F(−${a0}) = ${N2(Fp(a0))} − (${N2(Fp(-a0))}) = ${N2(Fp(a0) - Fp(-a0))} ✓ (aynı sonuç).`,
        `── 6) Check (direct computation) ──\nWith F(x) = c₀x + c₁x²/2 + c₂x³/3 + c₃x⁴/4: F(${a0}) − F(−${a0}) = ${N2(Fp(a0))} − (${N2(Fp(-a0))}) = ${N2(Fp(a0) - Fp(-a0))} ✓ (same result).`));
      return s;
    }
    if (p.type === 3) return avgPolySteps(p, s);
    if (p.type === 4) return avgTrigSteps(p, s);
    if (p.type === 5) return avgExpSteps(p, s);
    if (p.type === 6) return boundSteps(p, s);
    if (p.type === 8) return compareSteps(p, s);
    return signedSteps(p, s);
  }

  const AVGDEF = [
    '── 1) Ortalama değer tanımı ──\nf_ort = (1/(b − a))·∫ₐᵇ f(x) dx. Anlamı: f\'nin altındaki işaretli alan, taban uzunluğu b − a olan ve yüksekliği f_ort olan bir dikdörtgenin alanına eşittir. Ortalama Değer Teoremi: f sürekliyse [a, b] içinde f(c) = f_ort olan en az bir c vardır.',
    '── 1) Definition of the average value ──\nf_avg = (1/(b − a))·∫ₐᵇ f(x) dx. Meaning: the signed area under f equals the area of a rectangle with base b − a and height f_avg. Mean Value Theorem: if f is continuous there is at least one c in [a, b] with f(c) = f_avg.'];

  function avgPolySteps(p, s) {
    const c = p.cf, a = p.a, b = p.b;
    const I = polyInt(c, a, b), len = b - a, avg = fmul(I, fr(1, len));
    s.push(tx(AVGDEF[0] + `\nf(x) = ${polyStr(c, 'x')}, [${M(a)}, ${M(b)}], b − a = ${len}.`, AVGDEF[1] + `\nf(x) = ${polyStr(c, 'x')}, [${M(a)}, ${M(b)}], b − a = ${len}.`));
    const tm = (n, d, pw) => { const q = fr(n, d); return q[0] === 0 ? null : { neg: q[0] < 0, s: `${Math.abs(q[0]) === 1 ? '' : Math.abs(q[0])}x${pw > 1 ? sup(pw) : ''}${q[1] > 1 ? '/' + q[1] : ''}` }; };
    const fparts = [tm(c[2], 3, 3), tm(c[1], 2, 2), tm(c[0], 1, 1)].filter(Boolean);
    const Fs = fparts.map((q, i) => (i === 0 ? (q.neg ? '−' : '') : (q.neg ? ' − ' : ' + ')) + q.s).join('');
    const Fv = (x) => c[2] * x * x * x / 3 + c[1] * x * x / 2 + c[0] * x;
    s.push(tx(`── 2) Belirli integral ──\nF(x) = ${Fs}.\n∫ₐᵇ f dx = F(${M(b)}) − F(${M(a)}) = ${N2(Fv(b))} − (${N2(Fv(a))}) = ${fstr(I)}.`, `── 2) The definite integral ──\nF(x) = ${Fs}.\n∫ₐᵇ f dx = F(${M(b)}) − F(${M(a)}) = ${N2(Fv(b))} − (${N2(Fv(a))}) = ${fstr(I)}.`));
    s.push(tx(`── 3) Ortalama değer ──\nf_ort = (1/${len})·(${fstr(I)}) = ${fstr(avg)} ≈ ${N2(fval(avg))}.`, `── 3) The average value ──\nf_avg = (1/${len})·(${fstr(I)}) = ${fstr(avg)} ≈ ${N2(fval(avg))}.`));
    const av = fval(avg);
    const A2 = c[2], B1 = c[1], C0 = c[0] - av;
    const D = B1 * B1 - 4 * A2 * C0;
    const rs = [(-B1 + Math.sqrt(D)) / (2 * A2), (-B1 - Math.sqrt(D)) / (2 * A2)].sort((x, y) => x - y);
    const inside = rs.filter((r) => r >= a - 1e-9 && r <= b + 1e-9);
    const qStr = `${A2 === 1 ? '' : A2 === -1 ? '−' : A2}c²${B1 ? ` ${sgnStr(B1)} ${absS(B1) === 1 ? '' : absS(B1)}c` : ''} ${sgnStr(C0)} ${N2(absS(C0))} = 0.`;
    s.push(tx(`── 4) f(c) = f_ort denklemi ──\n${polyStr(c, 'c')} = ${N2(av)}  ⇒  ${qStr}\nAyırt edici D = ${P(B1)}² − 4·${P(A2)}·${P(C0)} = ${N2(D)}.\nc = (−${P(B1)} ± √${N2(D)})/(2·${P(A2)})  ⇒  c ≈ ${N2(rs[0])}  veya  c ≈ ${N2(rs[1])}.`,
      `── 4) The equation f(c) = f_avg ──\n${polyStr(c, 'c')} = ${N2(av)}  ⇒  ${qStr}\nDiscriminant D = ${P(B1)}² − 4·${P(A2)}·${P(C0)} = ${N2(D)}.\nc = (−${P(B1)} ± √${N2(D)})/(2·${P(A2)})  ⇒  c ≈ ${N2(rs[0])}  or  c ≈ ${N2(rs[1])}.`));
    s.push(tx(`── 5) Aralıkta kalan nokta ──\n[${M(a)}, ${M(b)}] aralığında olan: ${inside.map((r) => 'c ≈ ' + N2(r)).join(' ve ')}. Diğer kök aralık dışında olduğu için teoremin verdiği noktaya sayılmaz.`,
      `── 5) The point inside the interval ──\nInside [${M(a)}, ${M(b)}]: ${inside.map((r) => 'c ≈ ' + N2(r)).join(' and ')}. The other root (if any) lies outside the interval, so it is not a point the theorem gives.`));
    const c1 = inside[0];
    s.push(tx(`── 6) Kontrol ──\nf(${N2(c1)}) ≈ ${N2(pEval(c, c1))} ≈ f_ort = ${N2(av)} ✓. Dikdörtgen alanı f_ort·(b − a) = ${N2(av)}·${len} = ${N2(av * len)} = ∫ₐᵇ f dx ✓.`,
      `── 6) Check ──\nf(${N2(c1)}) ≈ ${N2(pEval(c, c1))} ≈ f_avg = ${N2(av)} ✓. Rectangle area f_avg·(b − a) = ${N2(av)}·${len} = ${N2(av * len)} = ∫ₐᵇ f dx ✓.`));
    return s;
  }

  function avgTrigSteps(p, s) {
    const A = p.A, kind = p.kind;
    const bs = kind === 'sinPi' ? 'π' : 'π/2';
    const nm = kind === 'cosHalf' ? 'cos' : 'sin';
    const I = kind === 'sinPi' ? 2 * A : A;
    const len = p.b - p.a;
    const avg = I / len;
    const Atx = A === 1 ? '' : String(A);
    s.push(tx(AVGDEF[0] + `\nf(x) = ${Atx}${nm} x, [0, ${bs}], b − a = ${bs}.`, AVGDEF[1] + `\nf(x) = ${Atx}${nm} x, [0, ${bs}], b − a = ${bs}.`));
    const intTr = kind === 'cosHalf' ? `∫₀^(π/2) ${Atx}cos x dx = ${Atx}[sin x]₀^(π/2) = ${Atx}(1 − 0) = ${A}`
      : kind === 'sinHalf' ? `∫₀^(π/2) ${Atx}sin x dx = ${Atx}[−cos x]₀^(π/2) = ${Atx}(0 + 1) = ${A}`
        : `∫₀^π ${Atx}sin x dx = ${Atx}[−cos x]₀^π = ${Atx}(1 + 1) = ${I}`;
    s.push(tx(`── 2) Belirli integral ──\n${intTr}.`, `── 2) The definite integral ──\n${intTr}.`));
    s.push(tx(`── 3) Ortalama değer ──\nf_ort = ${I}/${bs} = ${kind === 'sinPi' ? `${I}/π` : `${I}/(π/2) = ${2 * A}/π`} ≈ ${N2(avg)}.`, `── 3) The average value ──\nf_avg = ${I}/${bs} = ${kind === 'sinPi' ? `${I}/π` : `${I}/(π/2) = ${2 * A}/π`} ≈ ${N2(avg)}.`));
    const r = 2 / PI;
    const c1 = kind === 'cosHalf' ? Math.acos(r) : Math.asin(r);
    const fn = kind === 'cosHalf' ? 'arccos' : 'arcsin';
    let sol = `${Atx}${nm} c = ${N2(avg)}  ⇒  ${nm} c = ${N2(avg)}/${A} = 2/π ≈ ${N2(r)}  ⇒  c = ${fn}(${N2(r)}) ≈ ${N2(c1)} rad.`;
    let solEn = sol;
    if (kind === 'sinPi') { sol += `
sin x, [0, π] üzerinde x = π/2 etrafında simetrik olduğundan ikinci nokta c₂ = π − ${N2(c1)} ≈ ${N2(PI - c1)} olur; iki nokta da aralıkta.`; solEn += `
Because sin x is symmetric about x = π/2 on [0, π], the second point is c₂ = π − ${N2(c1)} ≈ ${N2(PI - c1)}; both lie in the interval.`; }
    s.push(tx(`── 4) f(c) = f_ort ──
${sol}`, `── 4) f(c) = f_avg ──
${solEn}`));
    const fc = p.fev(c1);
    s.push(tx(`── 5) Kontrol ──\nf(${N2(c1)}) = ${N2(fc)} ≈ f_ort = ${N2(avg)} ✓. Ayrıca f_ort·(b − a) = ${N2(avg)}·${N2(len)} = ${N2(avg * len)} = ${I} ✓.`,
      `── 5) Check ──\nf(${N2(c1)}) = ${N2(fc)} ≈ f_avg = ${N2(avg)} ✓. Also f_avg·(b − a) = ${N2(avg)}·${N2(len)} = ${N2(avg * len)} = ${I} ✓.`));
    return s;
  }

  function avgExpSteps(p, s) {
    const A = p.A, a = p.a, b = p.b, len = b - a;
    const Atx = A === 1 ? '' : String(A);
    const ea = Math.exp(a), eb = Math.exp(b);
    const I = A * (eb - ea), avg = I / len;
    s.push(tx(AVGDEF[0] + `\nf(x) = ${Atx}eˣ, [${M(a)}, ${M(b)}], b − a = ${len}.`, AVGDEF[1] + `\nf(x) = ${Atx}eˣ, [${M(a)}, ${M(b)}], b − a = ${len}.`));
    s.push(tx(`── 2) Belirli integral ──\n∫ₐᵇ ${Atx}eˣ dx = ${Atx}[eˣ]ₐᵇ = ${A}(e^${b} − e^${M(a)}) = ${A}(${N2(eb)} − ${N2(ea)}) = ${N2(I)}.`,
      `── 2) The definite integral ──\n∫ₐᵇ ${Atx}eˣ dx = ${Atx}[eˣ]ₐᵇ = ${A}(e^${b} − e^${M(a)}) = ${A}(${N2(eb)} − ${N2(ea)}) = ${N2(I)}.`));
    s.push(tx(`── 3) Ortalama değer ──\nf_ort = ${N2(I)}/${len} = ${N2(avg)}.`, `── 3) The average value ──\nf_avg = ${N2(I)}/${len} = ${N2(avg)}.`));
    const c1 = Math.log(avg / A);
    s.push(tx(`── 4) f(c) = f_ort ──\n${Atx}e^c = ${N2(avg)}  ⇒  e^c = ${N2(avg / A)}  ⇒  c = ln(${N2(avg / A)}) ≈ ${N2(c1)}.\nBu değer [${M(a)}, ${M(b)}] aralığında mı? ${a} ≤ ${N2(c1)} ≤ ${b} ✓.`,
      `── 4) f(c) = f_avg ──\n${Atx}e^c = ${N2(avg)}  ⇒  e^c = ${N2(avg / A)}  ⇒  c = ln(${N2(avg / A)}) ≈ ${N2(c1)}.\nIs this inside [${M(a)}, ${M(b)}]? ${a} ≤ ${N2(c1)} ≤ ${b} ✓.`));
    s.push(tx(`── 5) Kontrol ──\nf(${N2(c1)}) = ${N2(p.fev(c1))} ≈ f_ort = ${N2(avg)} ✓. e'nin eğrisel (yukarı bükey) olması nedeniyle c, aralığın ortasının (${N2((a + b) / 2)}) biraz ${c1 > (a + b) / 2 ? 'sağında' : 'solunda'} çıkar.`,
      `── 5) Check ──\nf(${N2(c1)}) = ${N2(p.fev(c1))} ≈ f_avg = ${N2(avg)} ✓. Because eˣ is concave up, c is slightly ${c1 > (a + b) / 2 ? 'right' : 'left'} of the interval's midpoint (${N2((a + b) / 2)}).`));
    return s;
  }

  function boundSteps(p, s) {
    const e = p.e, len = e.b - e.a;
    const m = e.f(e.xm), Mx = e.f(e.xM);
    const I = e.I;
    s.push(tx(`── 1) Max–min eşitsizliği ──\n[a, b] üzerinde m ≤ f(x) ≤ M ise m(b − a) ≤ ∫ₐᵇ f dx ≤ M(b − a). Yani integral, "en alçak dikdörtgen" ile "en yüksek dikdörtgen" alanı arasındadır.\nf(x) = ${e.fs}, [${piTxt(e.a)}, ${piTxt(e.b)}], b − a = ${N2(len)}.`,
      `── 1) The max–min inequality ──\nIf m ≤ f(x) ≤ M on [a, b] then m(b − a) ≤ ∫ₐᵇ f dx ≤ M(b − a). So the integral lies between the area of the "lowest rectangle" and the "highest rectangle".\nf(x) = ${e.fs}, [${piTxt(e.a)}, ${piTxt(e.b)}], b − a = ${N2(len)}.`));
    s.push(tx(`── 2) En küçük ve en büyük değer ──\n${e.why[0]}.\nm = f(${piTxt(e.xm)}) = ${N2(m)},  M = f(${piTxt(e.xM)}) = ${N2(Mx)}.`, `── 2) Least and greatest values ──\n${e.why[1]}.\nm = f(${piTxt(e.xm)}) = ${N2(m)},  M = f(${piTxt(e.xM)}) = ${N2(Mx)}.`));
    s.push(tx(`── 3) Sınırlar ──\nAlt sınır: m(b − a) = ${N2(m)}·${N2(len)} = ${N2(m * len)}.\nÜst sınır: M(b − a) = ${N2(Mx)}·${N2(len)} = ${N2(Mx * len)}.\n${N2(m * len)} ≤ ∫ f dx ≤ ${N2(Mx * len)}.`,
      `── 3) The bounds ──\nLower bound: m(b − a) = ${N2(m)}·${N2(len)} = ${N2(m * len)}.\nUpper bound: M(b − a) = ${N2(Mx)}·${N2(len)} = ${N2(Mx * len)}.\n${N2(m * len)} ≤ ∫ f dx ≤ ${N2(Mx * len)}.`));
    s.push(tx(`── 4) Kontrol ──\nGerçek değer (örneğin Temel Teorem ya da sayısal hesapla) ≈ ${N2(I)}; ${N2(m * len)} ≤ ${N2(I)} ≤ ${N2(Mx * len)} ✓. Ortalama değer f_ort ≈ ${N2(I / len)} de m ile M arasındadır.`,
      `── 4) Check ──\nThe true value (e.g. by the Fundamental Theorem or numerically) ≈ ${N2(I)}; ${N2(m * len)} ≤ ${N2(I)} ≤ ${N2(Mx * len)} ✓. The average value f_avg ≈ ${N2(I / len)} also lies between m and M.`));
    return s;
  }

  function compareSteps(p, s) {
    const e = p.e, mid = (e.a + e.b) / 2, d = e.Ig - e.If;
    s.push(tx(`── 1) Karşılaştırma özelliği ──\n[a, b] üzerinde f(x) ≤ g(x) ise ∫ₐᵇ f dx ≤ ∫ₐᵇ g dx. Çünkü taban aynıyken daha yüksekteki eğrinin altındaki alan daha büyüktür.\nf(x) = ${e.fs}, g(x) = ${e.gs}, [${piTxt(e.a)}, ${piTxt(e.b)}].`,
      `── 1) The comparison (domination) property ──\nIf f(x) ≤ g(x) on [a, b] then ∫ₐᵇ f dx ≤ ∫ₐᵇ g dx, because with the same base the area under the higher curve is larger.\nf(x) = ${e.fs}, g(x) = ${e.gs}, [${piTxt(e.a)}, ${piTxt(e.b)}].`));
    s.push(tx(`── 2) Eğrileri karşılaştıralım ──\n${e.why[0]}. Yani aralığın her noktasında f(x) ≤ g(x).\nÖrnek: x = ${N2(mid)} için f = ${N2(e.f(mid))} ≤ g = ${N2(e.g(mid))}.`,
      `── 2) Comparing the curves ──\n${e.why[1]}. So f(x) ≤ g(x) at every point of the interval.\nExample: at x = ${N2(mid)} we get f = ${N2(e.f(mid))} ≤ g = ${N2(e.g(mid))}.`));
    s.push(tx(`── 3) Sonuç ──\nKarşılaştırma özelliğinden ∫ (${piTxt(e.a)}→${piTxt(e.b)}) ${e.fs} dx ≤ ∫ (${piTxt(e.a)}→${piTxt(e.b)}) ${e.gs} dx. Yani g'nin altındaki alan daha büyüktür.`,
      `── 3) Conclusion ──\nBy the comparison property ∫ (${piTxt(e.a)}→${piTxt(e.b)}) ${e.fs} dx ≤ ∫ (${piTxt(e.a)}→${piTxt(e.b)}) ${e.gs} dx. So the area under g is the larger one.`));
    s.push(tx(`── 4) Kontrol (gerçek değerler) ──\n∫ f dx = ${e.Is[0]} ≈ ${N2(e.If)},  ∫ g dx = ${e.Is[1]} ≈ ${N2(e.Ig)}; ${N2(e.If)} ≤ ${N2(e.Ig)} ✓. Fark ∫ (g − f) dx ≈ ${N2(d)} ≥ 0, yani iki eğri arasında kalan alandır.`,
      `── 4) Check (true values) ──\n∫ f dx = ${e.Is[0]} ≈ ${N2(e.If)},  ∫ g dx = ${e.Is[1]} ≈ ${N2(e.Ig)}; ${N2(e.If)} ≤ ${N2(e.Ig)} ✓. The difference ∫ (g − f) dx ≈ ${N2(d)} ≥ 0 is the area between the two curves.`));
    return s;
  }

  function signedSteps(p, s) {
    if (p.sub === 'poly') {
      const m = p.mm, m2 = m * m;
      const F = (x) => x * x * x / 3 - m2 * x;
      const I1 = fr(-2 * m * m * m, 3), I2 = fr(4 * m * m * m, 3), sg = fadd(I1, I2), tot = fadd(fr(2 * m * m * m, 3), I2);
      s.push(tx(`── 1) İşaretli alan ve toplam alan ──\nf negatifken integral alanı EKSİ sayar (işaretli alan). Toplam alan için f'nin işaret değiştirdiği yerde aralığı bölüp negatif parçanın mutlak değerini alırız.`,
        `── 1) Signed and total area ──\nWhere f is negative the integral counts the area as NEGATIVE (signed area). For the total area we split the interval where f changes sign and take the absolute value of the negative part.`));
      s.push(tx(`── 2) İşaret değiştiren nokta ──\nx² − ${m2} = 0 ⇒ x = ${m}. [0, ${m}] aralığında f ≤ 0, [${m}, ${2 * m}] aralığında f ≥ 0.\nF(x) = x³/3 − ${m2}x.`, `── 2) Where the sign changes ──\nx² − ${m2} = 0 ⇒ x = ${m}. On [0, ${m}] f ≤ 0, on [${m}, ${2 * m}] f ≥ 0.\nF(x) = x³/3 − ${m2}x.`));
      s.push(tx(`── 3) İki parça ──\n∫₀^${m} f dx = F(${m}) − F(0) = ${fstr(fr(m * m * m - 3 * m2 * m, 3))} = ${fstr(I1)}  (negatif).\n∫_${m}^${2 * m} f dx = F(${2 * m}) − F(${m}) = ${N2(F(2 * m))} − (${N2(F(m))}) = ${fstr(I2)}  (pozitif).`,
        `── 3) The two pieces ──\n∫₀^${m} f dx = F(${m}) − F(0) = ${fstr(fr(m * m * m - 3 * m2 * m, 3))} = ${fstr(I1)}  (negative).\n∫_${m}^${2 * m} f dx = F(${2 * m}) − F(${m}) = ${N2(F(2 * m))} − (${N2(F(m))}) = ${fstr(I2)}  (positive).`));
      s.push(tx(`── 4) Sonuçlar ──\nİşaretli alan: ∫₀^${2 * m} f dx = ${fstr(I1)} + ${fstr(I2)} = ${fstr(sg)}.\nToplam alan: |${fstr(I1)}| + ${fstr(I2)} = ${fstr(fr(2 * m * m * m, 3))} + ${fstr(I2)} = ${fstr(tot)}.`,
        `── 4) Results ──\nSigned area: ∫₀^${2 * m} f dx = ${fstr(I1)} + ${fstr(I2)} = ${fstr(sg)}.\nTotal area: |${fstr(I1)}| + ${fstr(I2)} = ${fstr(fr(2 * m * m * m, 3))} + ${fstr(I2)} = ${fstr(tot)}.`));
      s.push(tx(`── 5) Kontrol ──\nDoğrudan: F(${2 * m}) − F(0) = ${N2(F(2 * m))} = ${fstr(sg)} ✓. Toplam alan işaretli alandan büyük (${fstr(tot)} > ${fstr(sg)}) çünkü negatif parça artık eksi değil artı sayılıyor.`,
        `── 5) Check ──\nDirectly: F(${2 * m}) − F(0) = ${N2(F(2 * m))} = ${fstr(sg)} ✓. The total area is larger than the signed area (${fstr(tot)} > ${fstr(sg)}) because the negative piece now counts as positive.`));
      return s;
    }
    const A = p.A, Atx = A === 1 ? '' : String(A);
    s.push(tx(`── 1) İşaretli alan ve toplam alan ──\nf negatifken integral alanı EKSİ sayar. Toplam alan için aralığı işaret değiştirdiği yerden bölüp negatif parçanın mutlak değerini alırız.`, `── 1) Signed and total area ──\nWhere f is negative the integral counts the area as NEGATIVE. For the total area we split at the sign change and take the absolute value of the negative piece.`));
    s.push(tx(`── 2) İşaret değiştiren nokta ──\n${Atx}sin x = 0 ⇒ x = π. [0, π]'de f ≥ 0, [π, 2π]'de f ≤ 0.`, `── 2) Where the sign changes ──\n${Atx}sin x = 0 ⇒ x = π. On [0, π] f ≥ 0, on [π, 2π] f ≤ 0.`));
    s.push(tx(`── 3) İki parça ──\n∫₀^π ${Atx}sin x dx = ${Atx}[−cos x]₀^π = ${Atx}(1 + 1) = ${2 * A}.\n∫_π^(2π) ${Atx}sin x dx = ${Atx}[−cos x]_π^(2π) = ${Atx}(−1 − 1) = ${N2(-2 * A)}.`,
      `── 3) The two pieces ──\n∫₀^π ${Atx}sin x dx = ${Atx}[−cos x]₀^π = ${Atx}(1 + 1) = ${2 * A}.\n∫_π^(2π) ${Atx}sin x dx = ${Atx}[−cos x]_π^(2π) = ${Atx}(−1 − 1) = ${N2(-2 * A)}.`));
    s.push(tx(`── 4) Sonuçlar ──\nİşaretli alan: ${2 * A} + (${N2(-2 * A)}) = 0.\nToplam alan: ${2 * A} + |${N2(-2 * A)}| = ${4 * A}.`, `── 4) Results ──\nSigned area: ${2 * A} + (${N2(-2 * A)}) = 0.\nTotal area: ${2 * A} + |${N2(-2 * A)}| = ${4 * A}.`));
    s.push(tx(`── 5) Kontrol ──\nsin x, [0, 2π] üzerinde tek bir periyottur: üst ve alt yarı eşit alanlıdır, bu yüzden integral 0 olur; gerçek alanı bulmak için parçaları ayrı ayrı mutlak değerle toplamak gerekir ✓.`,
      `── 5) Check ──\nOver [0, 2π] sin x covers one full period: the upper and lower halves have equal areas, so the integral is 0; to get the real area we have to add the pieces with absolute values ✓.`));
    return s;
  }

  // ---------- graph ----------
  const fmtI = (v) => (Number.isFinite(v) ? N2(v) : '?');
  function drawCompare(canvas, p) {
    const e = p.e, f = safeFn(e.f), g = safeFn(e.g);
    const lo = Math.min(p.va, p.vb), up = Math.max(p.va, p.vb);
    let ymin = 0, ymax = 1;
    for (let i = 0; i <= 120; i++) { const x = lo + (up - lo) * i / 120; [f(x), g(x)].forEach((v) => { if (Number.isFinite(v)) { ymin = Math.min(ymin, v); ymax = Math.max(ymax, v); } }); }
    const px = Math.max(0.5, (up - lo) * 0.3), py = Math.max(0.3, (ymax - ymin) * 0.2);
    canvas.setViewport(lo - px, up + px, ymin - py, ymax + py);
    canvas.addFilledArea({ evaluator: g, xMin: lo, xMax: up, color: rgba(canvas.orange(), 0.2), samples: 160 });
    canvas.addFilledArea({ evaluator: f, xMin: lo, xMax: up, color: rgba(canvas.accent(), 0.3), samples: 160 });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
    canvas.addFunction({ evaluator: g, color: canvas.orange(), thickness: 3, label: 'g(x)' });
    canvas.addGuideLine({ axis: 'vertical', position: p.va, color: canvas.gold(), label: `a = ${N2(p.va)}` });
    canvas.addGuideLine({ axis: 'vertical', position: p.vb, color: canvas.gold(), label: `b = ${N2(p.vb)}` });
    canvas.addMarker({ x: (lo + up) / 2, y: 0, color: canvas.gold(), shape: 'diamond', radius: 7, label: `∫f = ${N2(simpson(f, p.va, p.vb))}  ≤  ∫g = ${N2(simpson(g, p.va, p.vb))}` });
  }
  function draw(canvas, p) {
    if (p.type === 8) return drawCompare(canvas, p);
    const f = safeFn(p.fev);
    const lo0 = Math.min(p.a, p.b), hi0 = Math.max(p.a, p.b);
    let hi = 3;
    for (let i = 0; i <= 120; i++) { const v = f(lo0 + (hi0 - lo0) * i / 120); if (Number.isFinite(v)) hi = Math.max(hi, Math.abs(v)); }
    canvas.setViewport(-7, 7, -hi * 1.3, hi * 1.3);
    const va = p.va, vb = p.vb;
    const lo = Math.min(va, vb), up = Math.max(va, vb);
    let vc = p.vc;
    const mode = p.vm;
    const raw = (x) => p.fev(x);
    const Iab = simpson(raw, va, vb), len = vb - va;
    if (mode === 0) {
      const c = Math.max(lo, Math.min(up, vc));
      const pos = (x) => { const v = f(x); return v > 0 ? v : (Number.isNaN(v) ? NaN : 0); };
      const neg = (x) => { const v = f(x); return v < 0 ? v : (Number.isNaN(v) ? NaN : 0); };
      const G = canvas.green(), R = canvas.red();
      if (c > lo + 1e-9) { canvas.addFilledArea({ evaluator: pos, xMin: lo, xMax: c, color: rgba(G, 0.5), samples: 160 }); canvas.addFilledArea({ evaluator: neg, xMin: lo, xMax: c, color: rgba(R, 0.5), samples: 160 }); }
      if (up > c + 1e-9) { canvas.addFilledArea({ evaluator: pos, xMin: c, xMax: up, color: rgba(G, 0.25), samples: 160 }); canvas.addFilledArea({ evaluator: neg, xMin: c, xMax: up, color: rgba(R, 0.25), samples: 160 }); }
      canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
      canvas.addGuideLine({ axis: 'vertical', position: va, color: canvas.gold(), label: `a = ${N2(va)}` });
      canvas.addGuideLine({ axis: 'vertical', position: vb, color: canvas.gold(), label: `b = ${N2(vb)}` });
      canvas.addSegment({ x1: c, y1: -hi * 1.3, x2: c, y2: hi * 1.3, color: canvas.purple(), thickness: 1.5, dashed: true });
      const lab = p.concrete
        ? tx(`∫ₐᶜ = ${fmtI(simpson(raw, va, c))}   ∫ᶜᵇ = ${fmtI(simpson(raw, c, vb))}   ∫ₐᵇ = ${fmtI(Iab)}`, `∫ₐᶜ = ${fmtI(simpson(raw, va, c))}   ∫ᶜᵇ = ${fmtI(simpson(raw, c, vb))}   ∫ₐᵇ = ${fmtI(Iab)}`)
        : tx(`şematik f (yeşil: pozitif, kırmızı: negatif alan); c = ${N2(c)}`, `schematic f (green: positive, red: negative area); c = ${N2(c)}`);
      canvas.addMarker({ x: c, y: 0, color: canvas.purple(), shape: 'diamond', radius: 7, label: lab });
    } else if (mode === 1) {
      if (Math.abs(len) < 0.2) { canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' }); return; }
      const avg = Iab / len;
      if (!Number.isFinite(avg)) { canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' }); return; }
      canvas.addFilledArea({ evaluator: f, xMin: lo, xMax: up, color: rgba(canvas.accent(), 0.15), samples: 160 });
      canvas.addFilledArea({ evaluator: () => avg, xMin: lo, xMax: up, color: rgba(canvas.orange(), 0.28), samples: 2 });
      canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
      canvas.addSegment({ x1: lo, y1: avg, x2: up, y2: avg, color: canvas.orange(), thickness: 2.5 });
      canvas.addGuideLine({ axis: 'vertical', position: va, color: canvas.gold(), label: `a = ${N2(va)}` });
      canvas.addGuideLine({ axis: 'vertical', position: vb, color: canvas.gold(), label: `b = ${N2(vb)}` });
      const cs = rootsOf(raw, lo, up, avg);
      cs.forEach((c) => {
        canvas.addSegment({ x1: c, y1: 0, x2: c, y2: avg, color: canvas.green(), thickness: 1.5, dashed: true });
        canvas.addMarker({ x: c, y: avg, color: canvas.green(), radius: 6, label: `c = ${N2(c)}` });
      });
      canvas.addMarker({ x: lo, y: avg, color: canvas.orange(), shape: 'diamond', radius: 6, label: tx(`f_ort = ${fmtI(avg)}`, `f_avg = ${fmtI(avg)}`) });
      const cc = Math.max(lo, Math.min(up, vc)), fc = f(cc);
      if (Number.isFinite(fc)) canvas.addMarker({ x: cc, y: fc, color: canvas.purple(), radius: 5, hollow: true, label: `f(${N2(cc)}) = ${N2(fc)}` });
    } else {
      const sam = []; for (let i = 0; i <= 400; i++) { const v = f(lo + (up - lo) * i / 400); if (Number.isFinite(v)) sam.push(v); }
      const m = sam.length ? Math.min.apply(null, sam) : 0, Mx = sam.length ? Math.max.apply(null, sam) : 0;
      const w = up - lo;
      canvas.addFilledArea({ evaluator: () => Mx, xMin: lo, xMax: up, color: rgba(canvas.orange(), 0.18), samples: 2 });
      canvas.addFilledArea({ evaluator: () => m, xMin: lo, xMax: up, color: rgba(canvas.blue(), 0.3), samples: 2 });
      canvas.addFilledArea({ evaluator: f, xMin: lo, xMax: up, color: rgba(canvas.accent(), 0.2), samples: 160 });
      canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
      canvas.addSegment({ x1: lo, y1: Mx, x2: up, y2: Mx, color: canvas.orange(), thickness: 2 });
      canvas.addSegment({ x1: lo, y1: m, x2: up, y2: m, color: canvas.blue(), thickness: 2 });
      canvas.addGuideLine({ axis: 'vertical', position: va, color: canvas.gold(), label: `a = ${N2(va)}` });
      canvas.addGuideLine({ axis: 'vertical', position: vb, color: canvas.gold(), label: `b = ${N2(vb)}` });
      canvas.addMarker({ x: (lo + up) / 2, y: Mx, color: canvas.orange(), shape: 'diamond', radius: 6, label: `M = ${N2(Mx)}` });
      canvas.addMarker({ x: (lo + up) / 2, y: m, color: canvas.blue(), shape: 'diamond', radius: 6, label: `m = ${N2(m)}` });
      canvas.addMarker({ x: (lo + up) / 2, y: 0, color: canvas.gold(), shape: 'diamond', radius: 7, label: `${N2(m * w)} ≤ ∫ = ${fmtI(Iab)} ≤ ${N2(Mx * w)}${p.concrete ? '' : tx('  (şematik)', '  (schematic)')}` });
    }
  }

  // ---------- concept ----------
  function concept() {
    return tx(
      `TANIM
∫ₐᵇ f(x) dx, f'nin grafiği ile x ekseni arasındaki İŞARETLİ alandır: eksenin üstü pozitif, altı negatif sayılır. İntegralin özellikleri bu alanların nasıl birleştirildiğini söyler.

ÖZELLİKLER
• ∫ₐᵃ f dx = 0   • ∫ᵇₐ f dx = −∫ₐᵇ f dx
• ∫ c·f dx = c·∫ f dx   • ∫ (f ± g) dx = ∫ f dx ± ∫ g dx   • ∫ₐᵇ k dx = k(b − a)
• Toplamsallık: ∫ₐᵇ f dx + ∫ᵇᶜ f dx = ∫ₐᶜ f dx (b, a ile c arasında olmak zorunda değildir)
• Karşılaştırma: [a,b]'de f ≤ g ise ∫ f ≤ ∫ g
• Max–min: m ≤ f ≤ M ise m(b − a) ≤ ∫ₐᵇ f dx ≤ M(b − a)
• Simetri: f çift ise ∫₋ₐᵃ f = 2∫₀ᵃ f; f tek ise ∫₋ₐᵃ f = 0
• İşaretli ≠ toplam alan: toplam alan için f işaret değiştirdiği yerde parçalara ayırıp mutlak değerleri toplarız.

ORTALAMA DEĞER
  f_ort = (1/(b − a)) ∫ₐᵇ f(x) dx.
Anlamı: eğrinin altındaki alan, genişliği b − a ve yüksekliği f_ort olan dikdörtgenin alanına eşittir. Ortalama Değer Teoremi: f sürekli ise [a, b]'de f(c) = f_ort olan bir c vardır; yani eğri ortalama yüksekliğe en az bir kez değer.

YÖNTEM
1. Hangi özelliğin işe yaradığına karar verelim (sınır çevirme, toplamsallık, simetri…). 2. Bilinen değerleri yerine koyalım. 3. Ortalama değer için ∫ₐᵇ f dx'i hesaplayıp (b − a)'ya bölelim. 4. f(c) = f_ort denklemini çözüp c'nin aralıkta olup olmadığına bakalım.

TUZAKLAR
• Sınırlar ters çevrilince işaret değişir. • ∫ f·g ≠ ∫ f · ∫ g. • Ortalama değer, uç değerlerin ortalaması değil, integralin genişliğe bölümüdür. • Denklem birden fazla kök verirse yalnızca [a, b] içindekiler geçerlidir.

MİNİ ÖRNEK
f(x) = x² için [0, 3]: ∫ = 9, f_ort = 9/3 = 3, x² = 3 ⇒ c = √3 ≈ 1,73 ∈ [0, 3] ✓.

NEREDE KULLANILIR?
Ortalama (etkin) hız ve ortalama güç, dalgalı yük altında ortalama gerilme ve RMS değerleri, ısıl ortalama sıcaklık.`,
      `DEFINITION
∫ₐᵇ f(x) dx is the SIGNED area between the graph of f and the x-axis: above the axis counts as positive, below as negative. The properties of the integral tell us how such areas combine.

PROPERTIES
• ∫ₐᵃ f dx = 0   • ∫ᵇₐ f dx = −∫ₐᵇ f dx
• ∫ c·f dx = c·∫ f dx   • ∫ (f ± g) dx = ∫ f dx ± ∫ g dx   • ∫ₐᵇ k dx = k(b − a)
• Additivity: ∫ₐᵇ f dx + ∫ᵇᶜ f dx = ∫ₐᶜ f dx (b need not lie between a and c)
• Domination: if f ≤ g on [a,b] then ∫ f ≤ ∫ g
• Max–min: if m ≤ f ≤ M then m(b − a) ≤ ∫ₐᵇ f dx ≤ M(b − a)
• Symmetry: if f is even, ∫₋ₐᵃ f = 2∫₀ᵃ f; if f is odd, ∫₋ₐᵃ f = 0
• Signed ≠ total area: for the total area we split where f changes sign and add the absolute values.

AVERAGE VALUE
  f_avg = (1/(b − a)) ∫ₐᵇ f(x) dx.
Meaning: the area under the curve equals the area of the rectangle of width b − a and height f_avg. Mean Value Theorem: if f is continuous there is a c in [a, b] with f(c) = f_avg; the curve takes its average height at least once.

METHOD
1. Let's decide which property helps (reversing limits, additivity, symmetry…). 2. Substitute the known values. 3. For the average value, compute ∫ₐᵇ f dx and divide by (b − a). 4. Solve f(c) = f_avg and see whether c lies in the interval.

PITFALLS
• Reversing the limits flips the sign. • ∫ f·g ≠ ∫ f · ∫ g. • The average value is the integral divided by the width, not the average of the end values. • If the equation gives several roots only those inside [a, b] count.

MINI EXAMPLE
f(x) = x² on [0, 3]: ∫ = 9, f_avg = 9/3 = 3, x² = 3 ⇒ c = √3 ≈ 1.73 ∈ [0, 3] ✓.

WHERE IS IT USED?
Average (effective) velocity and power, mean stress under fluctuating load and RMS values, mean temperature.`);
  }

  // ---------- controls ----------
  function buildControls(rightCol, getProblem, h) {
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); return d; };
    lab(tx('Gösterim', 'View'));
    h.addRadioGroup({
      name: 'dpMode',
      options: [{ label: tx('İşaretli alan (a, c, b)', 'Signed areas (a, c, b)'), value: 0 }, { label: tx('Ortalama değer dikdörtgeni', 'Average-value rectangle'), value: 1 }, { label: tx('Alt / üst sınır dikdörtgenleri', 'Lower / upper bound rectangles'), value: 2 }],
      get: () => getProblem().vm, set: (v) => { getProblem().vm = Number(v); },
    });
    h.addSlider({ caption: tx('Alt sınır a', 'Lower limit a'), min: -6, max: 6, step: 0.25, get: () => getProblem().va, set: (v) => { getProblem().va = v; } });
    h.addSlider({ caption: tx('Üst sınır b', 'Upper limit b'), min: -6, max: 6, step: 0.25, get: () => getProblem().vb, set: (v) => { getProblem().vb = v; } });
    h.addSlider({ caption: tx('Nokta c', 'Point c'), min: -6, max: 6, step: 0.25, get: () => getProblem().vc, set: (v) => { getProblem().vc = v; } });
  }

  const makeType = (t) => (rng) => {
    const old = forced; forced = t;
    try { return createProblem(rng); } finally { forced = old; }
  };

  Topics.register('integrals', {
    id: 'definiteProperties',
    tabTitle: () => tx('Belirli İntegralin Özellikleri ve Ortalama Değer', 'Properties of the Definite Integral and Average Value'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^• ∫ₐᵃ f dx = 0/, make: makeType(0) },
      { match: /^• (Toplamsallık|Additivity):/, make: makeType(1) },
      { match: /^• (Karşılaştırma|Domination):/, make: makeType(8) },
      { match: /^• (Max–min|Max-min):/, make: makeType(6) },
      { match: /^• (Simetri|Symmetry):/, make: makeType(2) },
      { match: /^• (İşaretli ≠ toplam alan|Signed ≠ total area):/, make: makeType(7) },
      { match: /^(ORTALAMA DEĞER|AVERAGE VALUE)$/, make: (rng) => makeType(rng.pick([3, 4, 5]))(rng) },
    ],
    _scenarioCount: () => 9,
    _setScenario: (i) => { forced = i % 9; },
    _lib: { simpson, avgData, polyInt, BT },
  });
})();
