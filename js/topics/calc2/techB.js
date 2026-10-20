// Calculus II - Techniques of integration B: trigonometric substitution and partial fractions.
// Every example is built from exact data (terms of the form rational + ln-terms + pi / sqrt3) and is checked against Simpson's rule
// and against the antiderivative before it is shown, so a wrong closed form cannot ship.
(function () {
  const K = Calc2, tx = K.tx, { frac, N2, simpson, pEval, pMul, pAdd, pStr, sup, sub } = K;
  const PI = Math.PI, SQ3 = Math.sqrt(3);
  const rt = (v) => (v >= 0 ? Math.sqrt(v) : NaN);
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  // coefficient prefix for |v| in front of a symbol: '' for 1, '(p/q)' for fractions, else the number
  const cf = (v) => { const s = frac(Math.abs(v)); return s === '1' ? '' : (/\//.test(s) ? '(' + s + ')' : s); };
  const cl = (v) => (cf(v) ? cf(v) + ' ' : '');
  const co = (v) => { const s = cf(v); return s ? s + '·' : ''; };

  // ---- exact values: [{ v, sym, val }] ; sym '' = rational part ----
  const SYM = { pi: { sym: 'π', val: PI }, r3: { sym: '√3', val: SQ3 }, one: { sym: '', val: 1 } };
  const lnR = (p, q) => { const g = gcd(p, q); p /= g; q /= g; return { sym: q === 1 ? 'ln ' + p : 'ln(' + p + '/' + q + ')', val: Math.log(p / q), isLn: true, ratio: p / q }; };
  const T1 = (v, s) => Object.assign({ v }, s);
  const termsVal = (t) => t.reduce((s, x) => s + x.v * x.val, 0);
  function termsStr(t) {
    let out = '';
    t.forEach((x) => {
      if (Math.abs(x.v) < 1e-12 || (x.isLn && Math.abs(x.ratio - 1) < 1e-12)) return;
      const mag = Math.abs(x.v), c = cf(mag) || '1';
      const body = x.sym === '' ? frac(mag) : (Math.abs(mag - 1) < 1e-12 ? x.sym : c + (/^ln/.test(x.sym) ? ' ' : '') + x.sym);
      out += out ? (x.v < 0 ? ' − ' : ' + ') + body : (x.v < 0 ? '−' : '') + body;
    });
    return out || '0';
  }
  const lab = (rightCol, t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); };
  const lim = (a, b) => '∫' + sub(a) + sup(b);
  const closeTo = (u, v, tol) => Math.abs(u - v) <= tol * Math.max(1, Math.abs(v));
  const joinSigned = (items) => items.map((it, i) => (i === 0 ? (it.v < 0 ? '−' : '') : (it.v < 0 ? ' − ' : ' + ')) + it.s).join('');

  // ================================================================ TRIGONOMETRIC SUBSTITUTION
  // families: 0 = √(a²−x²) (x = a sinθ), 1 = √(a²+x²) (x = a tanθ), 2 = √(x²−a²) (x = a secθ)
  const sec = (t) => 1 / Math.cos(t);
  const lnst = (t) => Math.log(sec(t) + Math.tan(t));
  const xa = (a) => (a === 1 ? 'x' : 'x/' + a);
  const TYPES = {
    A: { text: (c) => `√(${c.a * c.a} − x²)`, f: (c) => (x) => rt(c.a * c.a - x * x),
      Fx: (c) => (x) => x / 2 * rt(c.a * c.a - x * x) + c.a * c.a / 2 * Math.asin(Math.min(1, x / c.a)),
      G: (c) => (t) => c.a * c.a / 2 * (t + Math.sin(t) * Math.cos(t)),
      terms: (c) => (c.hi === c.a ? [T1(c.a * c.a / 4, SYM.pi)] : [T1(c.a * c.a / 8, SYM.r3), T1(c.a * c.a / 12, SYM.pi)]),
      ant: (c) => `(x/2)·√(${c.a * c.a} − x²) + ${co(c.a * c.a / 2)}arcsin(${xa(c.a)}) + C`,
      thInt: 'a cosθ · a cosθ dθ = a² cos²θ dθ = (a²/2)(1 + cos2θ) dθ', thAnt: '(a²/2)(θ + sinθ cosθ)' },
    B: { text: (c) => `x²/√(${c.a * c.a} − x²)`, f: (c) => (x) => x * x / rt(c.a * c.a - x * x),
      Fx: (c) => (x) => c.a * c.a / 2 * Math.asin(Math.min(1, x / c.a)) - x / 2 * rt(c.a * c.a - x * x),
      G: (c) => (t) => c.a * c.a / 2 * (t - Math.sin(t) * Math.cos(t)),
      terms: (c) => [T1(-c.a * c.a / 8, SYM.r3), T1(c.a * c.a / 12, SYM.pi)],
      ant: (c) => `${co(c.a * c.a / 2)}arcsin(${xa(c.a)}) − (x/2)·√(${c.a * c.a} − x²) + C`,
      thInt: 'a² sin²θ · a cosθ dθ / (a cosθ) = a² sin²θ dθ = (a²/2)(1 − cos2θ) dθ', thAnt: '(a²/2)(θ − sinθ cosθ)' },
    C: { text: (c) => `1/√((${c.a * c.a} − x²)³)`, f: (c) => (x) => 1 / Math.pow(rt(c.a * c.a - x * x), 3),
      Fx: (c) => (x) => x / (c.a * c.a * rt(c.a * c.a - x * x)),
      G: (c) => (t) => Math.tan(t) / (c.a * c.a),
      terms: (c) => [T1(1 / (3 * c.a * c.a), SYM.r3)],
      ant: (c) => `x/(${c.a * c.a}·√(${c.a * c.a} − x²)) + C`,
      thInt: 'a cosθ dθ / (a³ cos³θ) = (1/a²) sec²θ dθ', thAnt: '(1/a²) tanθ' },
    D: { text: (c) => `1/√(${c.a * c.a} + x²)`, f: (c) => (x) => 1 / rt(c.a * c.a + x * x),
      Fx: (c) => (x) => Math.log(x + rt(c.a * c.a + x * x)),
      G: () => lnst, terms: (c) => [T1(1, lnR(c.hi + c.c, c.a))],
      ant: (c) => `ln(x + √(${c.a * c.a} + x²)) + C`,
      thInt: 'a sec²θ dθ / (a secθ) = secθ dθ', thAnt: 'ln|secθ + tanθ|' },
    E: { text: (c) => `√(${c.a * c.a} + x²)`, f: (c) => (x) => rt(c.a * c.a + x * x),
      Fx: (c) => (x) => x / 2 * rt(c.a * c.a + x * x) + c.a * c.a / 2 * Math.log(x + rt(c.a * c.a + x * x)),
      G: (c) => (t) => c.a * c.a / 2 * (sec(t) * Math.tan(t) + lnst(t)),
      terms: (c) => [T1(c.hi * c.c / 2, SYM.one), T1(c.a * c.a / 2, lnR(c.hi + c.c, c.a))],
      ant: (c) => `(x/2)·√(${c.a * c.a} + x²) + ${co(c.a * c.a / 2)}ln(x + √(${c.a * c.a} + x²)) + C`,
      thInt: 'a secθ · a sec²θ dθ = a² sec³θ dθ', thAnt: '(a²/2)(secθ tanθ + ln|secθ + tanθ|)' },
    F: { text: (c) => `1/√((${c.a * c.a} + x²)³)`, f: (c) => (x) => 1 / Math.pow(rt(c.a * c.a + x * x), 3),
      Fx: (c) => (x) => x / (c.a * c.a * rt(c.a * c.a + x * x)),
      G: (c) => (t) => Math.sin(t) / (c.a * c.a),
      terms: (c) => [T1(c.hi / (c.a * c.a * c.c), SYM.one)],
      ant: (c) => `x/(${c.a * c.a}·√(${c.a * c.a} + x²)) + C`,
      thInt: 'a sec²θ dθ / (a³ sec³θ) = (1/a²) cosθ dθ', thAnt: '(1/a²) sinθ' },
    G: { text: (c) => `x²/√(${c.a * c.a} + x²)`, f: (c) => (x) => x * x / rt(c.a * c.a + x * x),
      Fx: (c) => (x) => x / 2 * rt(c.a * c.a + x * x) - c.a * c.a / 2 * Math.log(x + rt(c.a * c.a + x * x)),
      G: (c) => (t) => c.a * c.a / 2 * (sec(t) * Math.tan(t) - lnst(t)),
      terms: (c) => [T1(c.hi * c.c / 2, SYM.one), T1(-c.a * c.a / 2, lnR(c.hi + c.c, c.a))],
      ant: (c) => `(x/2)·√(${c.a * c.a} + x²) − ${co(c.a * c.a / 2)}ln(x + √(${c.a * c.a} + x²)) + C`,
      thInt: 'a² tan²θ · secθ dθ = a²(sec³θ − secθ) dθ', thAnt: '(a²/2)(secθ tanθ − ln|secθ + tanθ|)' },
    H: { text: (c) => `1/√(x² − ${c.a * c.a})`, f: (c) => (x) => 1 / rt(x * x - c.a * c.a),
      Fx: (c) => (x) => Math.log(x + rt(x * x - c.a * c.a)),
      G: () => lnst, terms: (c) => [T1(1, lnR(c.hi + c.s2, c.lo + c.s1))],
      ant: (c) => `ln(x + √(x² − ${c.a * c.a})) + C`,
      thInt: 'a secθ tanθ dθ / (a tanθ) = secθ dθ', thAnt: 'ln|secθ + tanθ|' },
    I: { text: (c) => `√(x² − ${c.a * c.a})`, f: (c) => (x) => rt(x * x - c.a * c.a),
      Fx: (c) => (x) => x / 2 * rt(x * x - c.a * c.a) - c.a * c.a / 2 * Math.log(x + rt(x * x - c.a * c.a)),
      G: (c) => (t) => c.a * c.a / 2 * (sec(t) * Math.tan(t) - lnst(t)),
      terms: (c) => [T1(c.hi * c.s / 2, SYM.one), T1(-c.a * c.a / 2, lnR(c.hi + c.s, c.a))],
      ant: (c) => `(x/2)·√(x² − ${c.a * c.a}) − ${co(c.a * c.a / 2)}ln(x + √(x² − ${c.a * c.a})) + C`,
      thInt: 'a tanθ · a secθ tanθ dθ = a² secθ tan²θ dθ = a²(sec³θ − secθ) dθ', thAnt: '(a²/2)(secθ tanθ − ln|secθ + tanθ|)' },
    J: { text: (c) => `√(x² − ${c.a * c.a})/x²`, f: (c) => (x) => rt(x * x - c.a * c.a) / (x * x),
      Fx: (c) => (x) => Math.log(x + rt(x * x - c.a * c.a)) - rt(x * x - c.a * c.a) / x,
      G: () => (t) => lnst(t) - Math.sin(t),
      terms: (c) => [T1(1, lnR(c.hi + c.s, c.a)), T1(-c.s / c.hi, SYM.one)],
      ant: (c) => `ln(x + √(x² − ${c.a * c.a})) − √(x² − ${c.a * c.a})/x + C`,
      thInt: 'a tanθ · a secθ tanθ dθ / (a² sec²θ) = (tan²θ/secθ) dθ = (secθ − cosθ) dθ', thAnt: 'ln|secθ + tanθ| − sinθ' },
    K: { text: (c) => `√(x² − ${c.a * c.a})/x`, f: (c) => (x) => rt(x * x - c.a * c.a) / x,
      Fx: (c) => (x) => rt(x * x - c.a * c.a) - c.a * Math.acos(Math.min(1, c.a / x)),
      G: (c) => (t) => c.a * (Math.tan(t) - t),
      terms: (c) => [T1(c.a, SYM.r3), T1(-c.a / 3, SYM.pi)],
      ant: (c) => `√(x² − ${c.a * c.a}) − ${co(c.a)}arccos(${c.a}/x) + C`,
      thInt: 'a tanθ · a secθ tanθ dθ / (a secθ) = a tan²θ dθ = a(sec²θ − 1) dθ', thAnt: 'a(tanθ − θ)' },
  };
  const THETA = [(c) => (x) => Math.asin(Math.min(1, x / c.a)), (c) => (x) => Math.atan(x / c.a), (c) => (x) => Math.acos(Math.min(1, c.a / x))];
  const CASES = [];
  [[1, 1], [2, 1], [3, 1], [2, 0.5], [4, 0.5], [6, 0.5]].forEach(([a, w]) => CASES.push({ fam: 0, t: 'A', a, lo: 0, hi: a * w }));
  [2, 4, 6, 8].forEach((a) => CASES.push({ fam: 0, t: 'B', a, lo: 0, hi: a / 2 }));
  [2, 4, 6].forEach((a) => CASES.push({ fam: 0, t: 'C', a, lo: 0, hi: a / 2 }));
  ['D', 'E', 'F', 'G'].forEach((t) => [[3, 4, 5], [4, 3, 5], [12, 5, 13], [5, 12, 13]].forEach(([a, b, c]) => CASES.push({ fam: 1, t, a, lo: 0, hi: b, c })));
  [[8, 10, 17, 6, 15], [12, 13, 15, 5, 9], [12, 15, 20, 9, 16], [15, 17, 25, 8, 20]].forEach(([a, lo, hi, s1, s2]) => CASES.push({ fam: 2, t: 'H', a, lo, hi, s1, s2 }));
  ['I', 'J'].forEach((t) => [[3, 5, 4], [4, 5, 3], [5, 13, 12], [12, 13, 5]].forEach(([a, b, s]) => CASES.push({ fam: 2, t, a, lo: a, hi: b, s })));
  [1, 2, 3].forEach((a) => CASES.push({ fam: 2, t: 'K', a, lo: a, hi: 2 * a }));
  const famStart = [0, 1, 2].map((f) => CASES.findIndex((c) => c.fam === f));
  const fn = (c) => TYPES[c.t].f(c);
  const exactT = (c) => termsVal(TYPES[c.t].terms(c));
  const simpT = (c, a, b) => simpson(fn(c), a, b, 20000);
  const verifiedT = {};
  function verifyT(ci) {
    if (verifiedT[ci]) return;
    const c = CASES[ci], T = TYPES[c.t], ex = exactT(c), th = THETA[c.fam](c), G = T.G(c), Fx = T.Fx(c), f = fn(c);
    if (!closeTo(ex, simpT(c, c.lo, c.hi), 1e-5)) throw new Error('trigSub #' + ci + ': exact ' + ex + ' != Simpson');
    if (!closeTo(ex, Fx(c.hi) - Fx(c.lo), 1e-9)) throw new Error('trigSub #' + ci + ': exact != F(b) - F(a)');
    if (!closeTo(ex, G(th(c.hi)) - G(th(c.lo)), 1e-9)) throw new Error('trigSub #' + ci + ': exact != theta-antiderivative');
    for (let i = 1; i < 6; i++) {
      const x = c.lo + (c.hi - c.lo) * i / 6, h = 1e-5, d = (Fx(x + h) - Fx(x - h)) / (2 * h);
      if (!closeTo(d, f(x), 1e-5)) throw new Error('trigSub #' + ci + ': F\' != f at ' + x);
    }
    verifiedT[ci] = true;
  }
  const xT = (p) => { const c = CASES[p.ci]; return c.lo + (c.hi - c.lo) * Math.max(0, Math.min(1, p.s)); };
  const integ = (c) => TYPES[c.t].text(c);
  const FAM_TXT = [
    { sub: 'x = a sinθ', dx: 'dx = a cosθ dθ', root: '√(a² − x²) = √(a² − a²sin²θ) = a cosθ', id: '1 − sin²θ = cos²θ', tri: ['sinθ = x/a', 'cosθ = √(a² − x²)/a'], hyp: 'a', opp: 'x', adj: '√(a² − x²)' },
    { sub: 'x = a tanθ', dx: 'dx = a sec²θ dθ', root: '√(a² + x²) = √(a² + a²tan²θ) = a secθ', id: '1 + tan²θ = sec²θ', tri: ['tanθ = x/a', 'secθ = √(a² + x²)/a'], hyp: '√(a² + x²)', opp: 'x', adj: 'a' },
    { sub: 'x = a secθ', dx: 'dx = a secθ tanθ dθ', root: '√(x² − a²) = √(a²sec²θ − a²) = a tanθ', id: 'sec²θ − 1 = tan²θ', tri: ['secθ = x/a', 'tanθ = √(x² − a²)/a'], hyp: 'x', opp: '√(x² − a²)', adj: 'a' },
  ];
  const rootWord = (c) => [`√(${c.a * c.a} − x²)`, `√(${c.a * c.a} + x²)`, `√(x² − ${c.a * c.a})`][c.fam];
  const domTxt = (c) => (c.fam === 2 ? 'x > ' + c.a : c.fam === 0 ? '0 < x < ' + c.a : 'x > 0');

  function statementT(p) {
    const c = CASES[p.ci], f = integ(c);
    if (p.def) return tx(`${lim(c.lo, c.hi)} ${f} dx integralini trigonometrik yerine koyma ile hesaplayalım (tam değer ve 2 ondalıklı yaklaşık değer).`,
      `Let's evaluate ${lim(c.lo, c.hi)} ${f} dx by trigonometric substitution (exact value and a 2-decimal approximation).`);
    return tx(`∫ ${f} dx belirsiz integralini trigonometrik yerine koyma ile bulalım (${domTxt(c)} bölgesinde). Sonucu x cinsinden yazalım.`,
      `Let's find the indefinite integral ∫ ${f} dx by trigonometric substitution (for ${domTxt(c)}). Let's give the result in terms of x.`);
  }
  function stepsT(p) {
    verifyT(p.ci);
    const c = CASES[p.ci], T = TYPES[c.t], F = FAM_TXT[c.fam], a = c.a, a2 = a * a, ex = exactT(c), Fx = T.Fx(c), f = fn(c), out = [];
    const ant = T.ant(c).replace(/ \+ C$/, ''), t = T.terms(c), I = integ(c);
    out.push(tx(`── 1) Yerine koymayı seçelim ──\nKök ${rootWord(c)} biçiminde; a² = ${a2}, a = ${a}.\nBu biçim için ${F.sub} alınır (${F.id}).`,
      `── 1) Choosing the substitution ──\nThe root is ${rootWord(c)}; a² = ${a2}, a = ${a}.\nFor this form we take ${F.sub} (${F.id}).`));
    out.push(tx(`── 2) θ cinsinden yazalım ──\n${F.dx},  ${F.root}.\n∫ ${I} dx = ∫ ${T.thInt}`, `── 2) Rewriting in θ ──\n${F.dx},  ${F.root}.\n∫ ${I} dx = ∫ ${T.thInt}`));
    out.push(tx(`── 3) θ'ya göre integral ──\n= ${T.thAnt} + C`, `── 3) Integrating in θ ──\n= ${T.thAnt} + C`));
    out.push(tx(`── 4) Dik üçgenle x'e dönelim ──\nθ açılı dik üçgende: hipotenüs = ${F.hyp}, karşı kenar = ${F.opp}, komşu kenar = ${F.adj} (Pisagor).\n${F.tri.join(',  ')}.\nBu oranları yukarıdaki ifadede yerine koyarız.`,
      `── 4) Back to x with the right triangle ──\nIn the right triangle with angle θ: hypotenuse = ${F.hyp}, opposite = ${F.opp}, adjacent = ${F.adj} (Pythagoras).\n${F.tri.join(',  ')}.\nWe put these ratios into the expression above.`));
    out.push(tx(`── 5) Ters türev ──\nF(x) = ${ant}${/ln/.test(ant) ? "   (sabitler ve log içindeki 1/a çarpanı C'ye katıldı)" : ''}`, `── 5) Antiderivative ──\nF(x) = ${ant}${/ln/.test(ant) ? '   (constants and the 1/a factor inside the log are absorbed into C)' : ''}`));
    if (p.def) {
      out.push(tx(`── 6) Sınırları yerleştirelim ──\nF(${N2(c.hi)}) ≈ ${N2(Fx(c.hi))},  F(${N2(c.lo)}) ≈ ${N2(Fx(c.lo))}\nF(${N2(c.hi)}) − F(${N2(c.lo)}) = ${termsStr(t)}`,
        `── 6) Evaluating at the limits ──\nF(${N2(c.hi)}) ≈ ${N2(Fx(c.hi))},  F(${N2(c.lo)}) ≈ ${N2(Fx(c.lo))}\nF(${N2(c.hi)}) − F(${N2(c.lo)}) = ${termsStr(t)}`));
      out.push(tx(`── 7) Sonuç ──\n${lim(c.lo, c.hi)} ${I} dx = ${termsStr(t)} ≈ ${N2(ex)}`, `── 7) Result ──\n${lim(c.lo, c.hi)} ${I} dx = ${termsStr(t)} ≈ ${N2(ex)}`));
      out.push(tx(`── 8) Sayısal kontrol ──\nSimpson kuralıyla ≈ ${N2(simpT(c, c.lo, c.hi))}; kapalı çözümle aynı ✓.`, `── 8) Numerical check ──\nSimpson's rule gives ≈ ${N2(simpT(c, c.lo, c.hi))}, the same as the closed form ✓.`));
    } else {
      const m = (c.lo + c.hi) / 2, h = 1e-5, d = (Fx(m + h) - Fx(m - h)) / (2 * h);
      out.push(tx(`── 6) Sonuç ──\n∫ ${I} dx = ${T.ant(c)}`, `── 6) Result ──\n∫ ${I} dx = ${T.ant(c)}`));
      out.push(tx(`── 7) Türevle kontrol ──\nx = ${N2(m)} için F'(x) ≈ ${N2(d)} ve integrant f(x) = ${N2(f(m))}; aynı ✓.\n([${N2(c.lo)}, ${N2(c.hi)}] aralığında belirli integral = ${termsStr(t)} ≈ ${N2(ex)}.)`,
        `── 7) Check by differentiating ──\nAt x = ${N2(m)}: F'(x) ≈ ${N2(d)} and the integrand is f(x) = ${N2(f(m))}; the same ✓.\n(Over [${N2(c.lo)}, ${N2(c.hi)}] the definite integral is ${termsStr(t)} ≈ ${N2(ex)}.)`));
    }
    return out;
  }
  function drawT(cv, p) {
    const c = CASES[p.ci], f = fn(c), a = c.a, x0 = xT(p), Fx = TYPES[c.t].Fx(c);
    let ym = 1e-9; for (let i = 0; i <= 80; i++) { const v = f(c.lo + (c.hi - c.lo) * i / 80); if (Number.isFinite(v)) ym = Math.max(ym, v); }
    const xl = c.fam === 0 ? -a * 1.15 : c.fam === 1 ? -0.2 * c.hi : 0, xr = c.fam === 0 ? a * 1.15 : c.hi * 1.15;
    cv.setViewport(xl, xr, -0.15 * ym, ym * 1.3);
    cv.addFilledArea({ evaluator: f, xMin: c.lo, xMax: c.hi, color: K.col(cv, 'accent', 0.16) });
    cv.addFilledArea({ evaluator: f, xMin: c.lo, xMax: x0, color: K.col(cv, 'orange', 0.4) });
    cv.addFunction({ evaluator: f, color: cv.accent(), thickness: 3, label: 'f(x)' });
    cv.addGuideLine({ axis: 'vertical', position: c.hi, color: cv.gray(), label: `x = ${N2(c.hi)}` });
    if (c.lo !== 0) cv.addGuideLine({ axis: 'vertical', position: c.lo, color: cv.gray(), label: `x = ${N2(c.lo)}` });
    if (c.fam === 0) { cv.addGuideLine({ axis: 'vertical', position: a, color: cv.red(), label: `x = ${a}` }); cv.addGuideLine({ axis: 'vertical', position: -a, color: cv.red() }); }
    if (c.fam === 2) cv.addGuideLine({ axis: 'vertical', position: a, color: cv.red(), label: `x = ${a}` });
    cv.addMarker({ x: x0, y: f(x0), color: cv.orange(), radius: 5, label: `x = ${N2(x0)}` });
    cv.addMarker({ x: x0, y: 0, color: cv.orange(), radius: 4, label: `${tx('alan', 'area')} ≈ ${N2(Fx(x0) - Fx(c.lo))}` });
  }
  function schemT(sc, p) {
    const c = CASES[p.ci], a = c.a, F = FAM_TXT[c.fam];
    let x = Math.max(xT(p), c.lo + 0.12 * (c.hi - c.lo));
    if (c.fam === 0) x = Math.min(x, 0.97 * a);
    let opp, adj, hyp;
    if (c.fam === 0) { opp = x; adj = rt(a * a - x * x); hyp = a; } else if (c.fam === 1) { opp = x; adj = a; hyp = rt(a * a + x * x); } else { hyp = x; adj = a; opp = rt(x * x - a * a); }
    if (![opp, adj, hyp].every((v) => Number.isFinite(v) && v > 0)) return;
    const k = Math.min(66 / adj, 52 / opp), x0 = 14, y0 = 24, x1 = x0 + adj * k, y2 = y0 + opp * k, r2 = (v) => fmt2(+v.toFixed(2));
    sc.title(tx('Dik üçgen: ', 'Right triangle: ') + F.sub);
    sc.poly([[x0, y0], [x1, y0], [x1, y2]], { fill: sc.c.fill, w: 0.9 });
    sc.poly([[x1 - 4, y0], [x1 - 4, y0 + 4], [x1, y0 + 4]], { close: false, w: 0.4, color: sc.c.sub });
    sc.arc(x0, y0, 9, 0, Math.atan2(opp, adj) * 180 / PI, { color: sc.c.accent, w: 0.6 });
    sc.text(x0 + 14, y0 + 3.2, 'θ', { color: sc.c.accent, size: 4.2, bold: true });
    sc.text((x0 + x1) / 2 - 6, (y0 + y2) / 2 + 5, `${F.hyp} = ${r2(hyp)}`, { size: 3.3, color: sc.c.load });
    sc.text(x1 + 2, (y0 + y2) / 2, `${F.opp} = ${r2(opp)}`, { size: 3.3, align: 'left' });
    sc.text((x0 + x1) / 2, y0 - 5, `${F.adj} = ${r2(adj)}`, { size: 3.3 });
    sc.text(50, 12, F.tri.join(',  '), { size: 3, color: sc.c.sub });
    sc.text(50, 6, `a = ${a},  x = ${r2(x)}`, { size: 3, color: sc.c.sub });
  }
  function buildControlsT(rightCol, getProblem, h) {
    lab(rightCol, tx('Kökün biçimi', 'Form of the root'));
    h.addRadioGroup({ name: 'trigSubFam', options: [{ label: '√(a² − x²)  →  x = a sinθ', value: 0 }, { label: '√(a² + x²)  →  x = a tanθ', value: 1 }, { label: '√(x² − a²)  →  x = a secθ', value: 2 }],
      get: () => CASES[getProblem().ci].fam, set: (v) => { const p = getProblem(); if (CASES[p.ci].fam !== Number(v)) p.ci = famStart[Number(v)]; } });
    lab(rightCol, tx('İntegral', 'Integral'));
    h.addSelect({ options: CASES.map((c, i) => ({ label: `${integ(c)}   [${N2(c.lo)}, ${N2(c.hi)}]`, value: i })), get: () => getProblem().ci, set: (v) => { getProblem().ci = Number(v); } });
    h.addCheckbox({ caption: tx('Belirli integral (sınırlarla)', 'Definite integral (with limits)'), get: () => getProblem().def, set: (v) => { getProblem().def = !!v; } });
    h.addSlider({ caption: tx('Üst sınır konumu x (0 = alt sınır, 1 = üst sınır)', 'Upper position x (0 = lower limit, 1 = upper limit)'), min: 0, max: 1, step: 0.05, get: () => getProblem().s, set: (v) => { getProblem().s = v; } });
  }
  function createProblemT(rng) {
    const p = { ci: rng.nextInt(0, CASES.length), def: rng.nextInt(0, 4) !== 0, s: 0.6 };
    verifyT(p.ci);
    return p;
  }
  const conceptT = () => tx(
    `TRİGONOMETRİK YERİNE KOYMA
√(a² − x²), √(a² + x²) ya da √(x² − a²) gibi kökler içeren integrallerde kökü bir trigonometrik özdeşlikle ortadan kaldırırız. x'i bir açının trigonometrik fonksiyonu olarak yazarız; kök a·cosθ gibi sade bir ifadeye dönüşür ve integral θ'ya göre alınabilir hâle gelir.

KÖKÜN BİÇİMİNE GÖRE YERİNE KOYMA
• √(a² − x²): x = a sinθ, dx = a cosθ dθ, √(a² − x²) = a cosθ (−π/2 ≤ θ ≤ π/2). Özdeşlik: 1 − sin²θ = cos²θ.
• √(a² + x²): x = a tanθ, dx = a sec²θ dθ, √(a² + x²) = a secθ (−π/2 < θ < π/2). Özdeşlik: 1 + tan²θ = sec²θ.
• √(x² − a²): x = a secθ, dx = a secθ tanθ dθ, √(x² − a²) = a tanθ (0 ≤ θ < π/2, x ≥ a). Özdeşlik: sec²θ − 1 = tan²θ.

YÖNTEM
1. Kökün biçimine bakıp yerine koymayı seçeriz.
2. dx'i ve kökü θ cinsinden yazıp integrali θ'ya çeviririz.
3. θ'ya göre integrali alırız (sin²θ için yarım açı, sec³θ için kısmi integrasyon gibi standart sonuçlarla).
4. Dik üçgenle x'e döneriz; belirli integralde elde edilen ters türevi sınırlarda değerlendiririz.

DİK ÜÇGENLE GERİ DÖNÜŞ
θ açılı bir dik üçgen çizeriz. x = a sinθ ise karşı kenar x, hipotenüs a olur; komşu kenarı Pisagor verir: √(a² − x²). Böylece cosθ, tanθ gibi oranlar x cinsinden okunur. Sağdaki şekil kaydırıcıdaki x için bu üçgeni gösterir.

MİNİ ÖRNEK
∫ dx/√(9 + x²): x = 3tanθ, dx = 3sec²θ dθ, √(9 + x²) = 3secθ olur. İntegral = ∫ secθ dθ = ln|secθ + tanθ| + C. Üçgende tanθ = x/3, secθ = √(9 + x²)/3 olduğundan sonuç ln(x + √(9 + x²)) + C' bulunur.

TUZAKLAR
• dx'i unutmak: x = a sinθ ise dx = a cosθ dθ olur.
• Belirli integralde sınırları θ'ya çevirmeden x değerlerini θ yerine koymak.
• √(a² − x²) = a cosθ eşitliği için cosθ ≥ 0 olan aralık seçilir.
• Önce basit yöntemi denemek gerekir: ∫ x/√(a² − x²) dx için u = a² − x² yeterlidir.

MÜHENDİSLİKTE
Daire ve elips alanı, yay uzunluğu, yüklü çubuk ve tel çevresindeki elektrik alanı, kablo ve kemer eğrileri gibi hesaplarda 1/√(a² + x²) ve √(a² − x²) tipi terimler çıkar.

GRAFİK
Mavi eğri integranttır; açık mavi bölge [alt, üst] aralığındaki alan, turuncu bölge kaydırıcıdaki x'e kadar olan alandır. Yandaki dik üçgen o x için θ'yı ve kenarları gösterir.`,
    `TRIGONOMETRIC SUBSTITUTION
For integrals containing a root such as √(a² − x²), √(a² + x²) or √(x² − a²) we remove the root with a trigonometric identity. We write x as a trigonometric function of an angle; the root becomes a simple expression like a·cosθ and the integral can be done in θ.

SUBSTITUTION BY THE FORM OF THE ROOT
• √(a² − x²): x = a sinθ, dx = a cosθ dθ, √(a² − x²) = a cosθ (−π/2 ≤ θ ≤ π/2). Identity: 1 − sin²θ = cos²θ.
• √(a² + x²): x = a tanθ, dx = a sec²θ dθ, √(a² + x²) = a secθ (−π/2 < θ < π/2). Identity: 1 + tan²θ = sec²θ.
• √(x² − a²): x = a secθ, dx = a secθ tanθ dθ, √(x² − a²) = a tanθ (0 ≤ θ < π/2, x ≥ a). Identity: sec²θ − 1 = tan²θ.

METHOD
1. We look at the form of the root and choose the substitution.
2. We write dx and the root in θ and convert the integral to θ.
3. We integrate in θ (using standard results: half-angle for sin²θ, by parts for sec³θ).
4. We return to x with a right triangle; for a definite integral we evaluate the resulting antiderivative at the limits.

RIGHT-TRIANGLE BACK-SUBSTITUTION
We draw a right triangle with angle θ. If x = a sinθ the opposite side is x and the hypotenuse is a; Pythagoras gives the adjacent side √(a² − x²). So ratios such as cosθ and tanθ can be read in terms of x. The sketch on the right shows this triangle for the slider position x.

MINI EXAMPLE
∫ dx/√(9 + x²): x = 3tanθ, dx = 3sec²θ dθ, √(9 + x²) = 3secθ. The integral is ∫ secθ dθ = ln|secθ + tanθ| + C. In the triangle tanθ = x/3 and secθ = √(9 + x²)/3, so the result is ln(x + √(9 + x²)) + C'.

PITFALLS
• Forgetting dx: if x = a sinθ then dx = a cosθ dθ.
• In a definite integral, putting the x values in place of θ without converting the limits.
• For √(a² − x²) = a cosθ we choose the interval where cosθ ≥ 0.
• Try the simple method first: for ∫ x/√(a² − x²) dx the substitution u = a² − x² is enough.

IN ENGINEERING
Area of a circle or ellipse, arc length, the electric field around a charged rod or wire, cable and arch curves: terms of the type 1/√(a² + x²) and √(a² − x²) appear.

GRAPH
The blue curve is the integrand; the light blue region is the area on [lower, upper], the orange region is the area up to the slider position x. The right triangle shows θ and the sides for that x.`);
  const mkLinkT = (fams) => (rng) => {
    const p = createProblemT(rng), idx = CASES.map((c, i) => i).filter((i) => fams.includes(CASES[i].fam));
    p.ci = idx[rng.nextInt(0, idx.length)]; p.s = 0.6; verifyT(p.ci); return p;
  };
  Topics.register('calc2', {
    id: 'trigSub',
    tabTitle: () => tx('Trigonometrik Yerine Koyma', 'Trigonometric Substitution'),
    concept: conceptT,
    problemStatement: statementT,
    createProblem: createProblemT,
    solveSteps: stepsT,
    draw: drawT,
    drawSchematic: schemT,
    buildControls: buildControlsT,
    links: [
      { match: /^• √\(a² − x²\):/, make: mkLinkT([0]) },
      { match: /^• √\(a² \+ x²\):/, make: mkLinkT([1]) },
      { match: /^• √\(x² − a²\):/, make: mkLinkT([2]) },
      { match: /^(DİK ÜÇGENLE GERİ DÖNÜŞ|RIGHT-TRIANGLE BACK-SUBSTITUTION)$/, make: (rng) => { const p = mkLinkT([0, 1, 2])(rng); p.def = false; return p; } },
    ],
    challenge: {
      prompt: (p) => { const c = CASES[p.ci]; return tx(`${lim(c.lo, c.hi)} ${integ(c)} dx integralinin değeri kaçtır? Yerine koymayı yapıp ya da sayısal hesaplayıp 2 ondalık basamakla yazalım.`, `What is the value of ${lim(c.lo, c.hi)} ${integ(c)} dx? Let's do the substitution (or compute numerically) and type it to 2 decimals.`); },
      target: (p) => exactT(CASES[p.ci]),
      tol: (p) => Math.max(0.02, 0.005 * Math.abs(exactT(CASES[p.ci]))),
      hint: (p, g) => { const c = CASES[p.ci], t = exactT(c); return tx(g > t ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > t ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.') + ' ' + tx(`Yerine koyma: ${FAM_TXT[c.fam].sub}.`, `Substitution: ${FAM_TXT[c.fam].sub}.`); },
    },
    _test: { CASES, TYPES, exactT, simpT, THETA, termsStr, verify: verifyT },
  });

  // ================================================================ PARTIAL FRACTIONS
  const FX = (r) => (r === 0 ? 'x' : r > 0 ? `(x − ${r})` : `(x + ${-r})`);
  const lin = (r) => [-r, 1];
  const trim = (c) => { c = c.slice(); while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-12) c.pop(); return c; };
  const NM = ['A', 'B', 'C'];
  const PC = [];
  [[[0, 1], [3, -1], 2, 4], [[1, 2], [2, 1], 3, 5], [[-1, 2], [1, 2], 3, 6], [[-2, 1], [3, 2], 2, 4], [[0, 2], [2, 3], 3, 5],
    [[-1, 0, 1], [1, -2, 2], 2, 4], [[0, 1, 2], [2, 1, 3], 3, 5], [[-2, 1, 3], [1, 2, 3], 4, 6]].forEach(([r, A, lo, hi]) => PC.push({ m: 0, r, A, lo, hi }));
  [[1, 2, 1, 3, 2, 3, 5], [0, 1, 2, 1, 1, 2, 4], [-1, 1, 1, 2, 1, 2, 3], [2, -1, 2, 4, 1, 3, 5], [1, 0, 1, 2, 3, 2, 4]].forEach(([r, s, A, B, C, lo, hi]) => PC.push({ m: 1, r, s, A, B, C, lo, hi }));
  [[-1, 1, 2, 1, 3, '0'], [-2, 1, 1, 2, 1, 'sym'], [-1, 4, 3, 1, 2, '0'], [-3, 4, 2, 1, 4, 'sym'], [-1, 9, 1, 2, 3, '0'], [-4, 9, 2, 1, 3, 'sym']].forEach(([r, k, A, B, C, iv]) => {
    const q = Math.sqrt(k); PC.push({ m: 2, r, k, A, B, C, iv, lo: iv === '0' ? 0 : -q, hi: q });
  });
  [[[2, 0], 1, 2, 3, 1, 3, 5], [[1, 1], 0, 1, 2, 1, 2, 4], [[0, 1], -1, 1, 1, 2, 2, 4], [[3, 0], 0, 2, 1, 2, 3, 5], [[1, 2], 1, -1, 2, 3, 2, 3]].forEach(([q, r, s, A, B, lo, hi]) => PC.push({ m: 3, q, r, s, A, B, lo, hi }));
  const pcStart = [0, 1, 2, 3].map((m) => PC.findIndex((c) => c.m === m));
  const MODEL = {};
  function model(ci) {
    if (MODEL[ci]) return MODEL[ci];
    const c = PC[ci];
    let N, D, parts, Q = [0], fac, Dtxt;
    if (c.m === 0) {
      D = [1]; c.r.forEach((r) => { D = pMul(D, lin(r)); });
      N = [0]; c.r.forEach((r, i) => { let t = [c.A[i]]; c.r.forEach((s, j) => { if (j !== i) t = pMul(t, lin(s)); }); N = pAdd(N, t); });
      parts = c.r.map((r, i) => ({ k: 'lin', r, v: c.A[i], pw: 1 }));
      fac = c.r.map(FX).join(''); Dtxt = `(${pStr(trim(D))})`;
    } else if (c.m === 1) {
      D = pMul(pMul(lin(c.r), lin(c.r)), lin(c.s));
      N = pAdd(pAdd(pMul([c.A], pMul(lin(c.r), lin(c.s))), pMul([c.B], lin(c.s))), pMul([c.C], pMul(lin(c.r), lin(c.r))));
      parts = [{ k: 'lin', r: c.r, v: c.A, pw: 1 }, { k: 'lin', r: c.r, v: c.B, pw: 2 }, { k: 'lin', r: c.s, v: c.C, pw: 1 }];
      fac = `${FX(c.r)}²${FX(c.s)}`; Dtxt = `(${fac})`;
    } else if (c.m === 2) {
      D = pMul(lin(c.r), [c.k, 0, 1]);
      N = pAdd(pMul([c.A], [c.k, 0, 1]), pMul([c.C, c.B], lin(c.r)));
      parts = [{ k: 'lin', r: c.r, v: c.A, pw: 1 }, { k: 'quad', k2: c.k, B: c.B, C: c.C }];
      fac = `${FX(c.r)}(x² + ${c.k})`; Dtxt = `(${fac})`;
    } else {
      D = pMul(lin(c.r), lin(c.s)); Q = c.q;
      N = pAdd(pAdd(pMul(Q, D), pMul([c.A], lin(c.s))), pMul([c.B], lin(c.r)));
      parts = [{ k: 'lin', r: c.r, v: c.A, pw: 1 }, { k: 'lin', r: c.s, v: c.B, pw: 1 }];
      fac = `${FX(c.r)}${FX(c.s)}`; Dtxt = `(${pStr(trim(D))})`;
    }
    N = trim(N); D = trim(D); Q = trim(Q);
    const f = (x) => { const d = pEval(D, x); return Math.abs(d) < 1e-9 ? NaN : pEval(N, x) / d; };
    const part = (pt, x) => (pt.k === 'lin' ? pt.v / Math.pow(x - pt.r, pt.pw) : (pt.B * x + pt.C) / (x * x + pt.k2));
    const psum = (x) => { let s = pEval(Q, x); parts.forEach((pt) => { s += part(pt, x); }); return Number.isFinite(s) ? s : NaN; };
    const Fx = (x) => {
      let s = Q[0] * x + (Q[1] || 0) * x * x / 2;
      parts.forEach((pt) => {
        if (pt.k === 'lin') s += pt.pw === 1 ? pt.v * Math.log(Math.abs(x - pt.r)) : -pt.v / (x - pt.r);
        else { const q = Math.sqrt(pt.k2); s += pt.B / 2 * Math.log(x * x + pt.k2) + pt.C / q * Math.atan(x / q); }
      });
      return s;
    };
    // exact definite value: rational part R + ln terms + pi term
    const lo = c.lo, hi = c.hi, linLn = [], quadLn = [], pis = [];
    let R = Q[0] * (hi - lo) + (Q[1] || 0) / 2 * (hi * hi - lo * lo), pw2R = 0;
    parts.forEach((pt) => {
      if (pt.k === 'lin') {
        if (pt.pw === 1) linLn.push(T1(pt.v, lnR(hi - pt.r, lo - pt.r)));
        else { pw2R = -pt.v * (1 / (hi - pt.r) - 1 / (lo - pt.r)); R += pw2R; }
      } else {
        const q = Math.sqrt(pt.k2);
        quadLn.push(T1(pt.B / 2, lnR(hi * hi + pt.k2, lo * lo + pt.k2)));
        pis.push(T1(pt.C / q * (c.iv === 'sym' ? 1 / 2 : 1 / 4), SYM.pi));
      }
    });
    const terms = [T1(R, SYM.one)].concat(linLn, quadLn, pis);
    const m = { c, N, D, Q, parts, fac, Dtxt, f, psum, Fx, terms, linLn, quadLn, pw2R, exact: termsVal(terms), part };
    MODEL[ci] = m;
    return m;
  }
  const pcSimp = (m) => simpson(m.f, m.c.lo, m.c.hi, 4000);
  const verifiedP = {};
  function verifyP(ci) {
    if (verifiedP[ci]) return;
    const m = model(ci);
    for (const x of [-4.3, -0.37, 0.61, 2.43, 5.17, 8.9]) { const u = m.f(x), v = m.psum(x); if (Number.isFinite(u) && Number.isFinite(v) && !closeTo(u, v, 1e-9)) throw new Error('partialFractions #' + ci + ': parts sum != f at ' + x); }
    if (!closeTo(m.exact, pcSimp(m), 1e-8)) throw new Error('partialFractions #' + ci + ': exact ' + m.exact + ' != Simpson');
    if (!closeTo(m.exact, m.Fx(m.c.hi) - m.Fx(m.c.lo), 1e-9)) throw new Error('partialFractions #' + ci + ': exact != F(b) - F(a)');
    for (const x of [m.c.lo + 0.3, (m.c.lo + m.c.hi) / 2 + 0.1]) { const h = 1e-6, d = (m.Fx(x + h) - m.Fx(x - h)) / (2 * h); if (!closeTo(d, m.f(x), 1e-5)) throw new Error('partialFractions #' + ci + ': F\' != f'); }
    verifiedP[ci] = true;
  }
  const fStr = (m) => `${K.wrap(m.N)}/${m.Dtxt}`;
  const isZeroPoly = (q) => q.length === 1 && q[0] === 0;
  // the sum of the pieces as text
  function sumText(m) {
    const items = [];
    if (!isZeroPoly(m.Q)) items.push({ v: 1, s: pStr(m.Q) });
    m.parts.forEach((pt) => {
      if (pt.k === 'lin') items.push({ v: pt.v, s: `${Math.abs(pt.v) === 1 ? '1' : Math.abs(pt.v)}/${FX(pt.r)}${pt.pw === 2 ? '²' : ''}` });
      else { const nu = pStr([pt.C, pt.B]); items.push({ v: nu[0] === '−' ? -1 : 1, s: `${/ /.test(nu) ? '(' + nu + ')' : nu.replace(/^−/, '')}/(x² + ${pt.k2})` }); }
    });
    return joinSigned(items);
  }
  // the antiderivative as text
  function antText(m) {
    const items = [];
    if (!isZeroPoly(m.Q)) {
      if (m.Q[1]) items.push({ v: m.Q[1], s: `${cf(m.Q[1] / 2)}x²` });
      if (m.Q[0]) items.push({ v: m.Q[0], s: `${cf(m.Q[0])}x` });
    }
    m.parts.forEach((pt) => {
      if (pt.k === 'lin' && pt.pw === 1) items.push({ v: pt.v, s: `${cl(pt.v)}ln|${pt.r === 0 ? 'x' : pt.r > 0 ? 'x − ' + pt.r : 'x + ' + -pt.r}|` });
      else if (pt.k === 'lin') items.push({ v: -pt.v, s: `${Math.abs(pt.v)}/${FX(pt.r)}` });
      else {
        const q = Math.sqrt(pt.k2);
        if (pt.B !== 0) items.push({ v: pt.B, s: `${cl(pt.B / 2)}ln(x² + ${pt.k2})` });
        if (pt.C !== 0) items.push({ v: pt.C, s: `${cl(pt.C / q)}arctan(${q === 1 ? 'x' : 'x/' + q})` });
      }
    });
    return joinSigned(items) + ' + C';
  }
  const aVal = (m) => m.parts[0].v;
  function statementP(p) {
    const m = model(p.ci), c = m.c, f = fStr(m);
    if (p.def) return tx(`${lim(c.lo, c.hi)} ${f} dx integralini basit kesirlere ayırarak hesaplayalım (tam değer ve 2 ondalıklı yaklaşık değer).`,
      `Let's evaluate ${lim(c.lo, c.hi)} ${f} dx using partial fractions (exact value and a 2-decimal approximation).`);
    return tx(`∫ ${f} dx belirsiz integralini basit kesirlere ayırarak bulalım.`, `Let's find the indefinite integral ∫ ${f} dx using partial fractions.`);
  }
  function stepsP(p) {
    verifyP(p.ci);
    const m = model(p.ci), c = m.c, out = [], Nv = (x) => pEval(m.N, x), mode = c.m, num = N2, paren = (v) => (v < 0 ? '(' + num(v) + ')' : num(v));
    let n = 1;
    const h = (a, b, body) => { out.push(tx(`── ${n}) ${a} ──\n${body[0]}`, `── ${n}) ${b} ──\n${body[1]}`)); n++; };
    const both = (s) => [s, s];
    if (mode === 3) {
      const R = trim(pAdd(m.N, pMul(m.Q, m.D), -1));
      h('Önce polinom bölmesi', 'First, polynomial division', [
        `Pay derecesi (${m.N.length - 1}) ≥ payda derecesi (${m.D.length - 1}): kesir bileşik. Böleriz:\n${pStr(m.N)} = (${pStr(m.Q)})·(${pStr(m.D)}) + (${pStr(R)})\nYani f(x) = ${pStr(m.Q)} + (${pStr(R)})/(${pStr(m.D)}).`,
        `Numerator degree (${m.N.length - 1}) ≥ denominator degree (${m.D.length - 1}): the fraction is improper. We divide:\n${pStr(m.N)} = (${pStr(m.Q)})·(${pStr(m.D)}) + (${pStr(R)})\nSo f(x) = ${pStr(m.Q)} + (${pStr(R)})/(${pStr(m.D)}).`]);
      h('Paydayı çarpanlarına ayıralım', 'Factoring the denominator', [`${pStr(m.D)} = ${m.fac}\nKalan kesri ayırırız:  (${pStr(R)})/(${pStr(m.D)}) = A/${FX(c.r)} + B/${FX(c.s)}`, `${pStr(m.D)} = ${m.fac}\nWe split the remainder fraction:  (${pStr(R)})/(${pStr(m.D)}) = A/${FX(c.r)} + B/${FX(c.s)}`]);
      h('Katsayılar (örtme yöntemi)', 'Coefficients (cover-up method)', [
        `Her iki yanı ${m.fac} ile çarparız: ${pStr(R)} = A·${FX(c.s)} + B·${FX(c.r)}\nx = ${num(c.r)}:  ${num(pEval(R, c.r))} = A·(${num(c.r - c.s)})  ⇒  A = ${num(c.A)}\nx = ${num(c.s)}:  ${num(pEval(R, c.s))} = B·(${num(c.s - c.r)})  ⇒  B = ${num(c.B)}`,
        `Multiplying both sides by ${m.fac}: ${pStr(R)} = A·${FX(c.s)} + B·${FX(c.r)}\nx = ${num(c.r)}:  ${num(pEval(R, c.r))} = A·(${num(c.r - c.s)})  ⇒  A = ${num(c.A)}\nx = ${num(c.s)}:  ${num(pEval(R, c.s))} = B·(${num(c.s - c.r)})  ⇒  B = ${num(c.B)}`]);
    } else if (mode === 0) {
      const k = c.r.length, others = (i) => c.r.filter((r, j) => j !== i).map(FX).join('');
      h('Payda ve kesir türü', 'Denominator and type of fraction', [`Pay derecesi payda derecesinden küçük: kesir basit (bileşik değil).\nPayda: ${pStr(m.D)} = ${m.fac}  (${k} farklı doğrusal çarpan).`, `The numerator degree is smaller than the denominator degree: the fraction is proper.\nDenominator: ${pStr(m.D)} = ${m.fac}  (${k} distinct linear factors).`]);
      const setup = `f(x) = ${c.r.map((r, j) => NM[j] + '/' + FX(r)).join(' + ')}`, prod = `${pStr(m.N)} = ${c.r.map((r, j) => NM[j] + '·' + others(j)).join(' + ')}`;
      h('Ayrışmış biçimi kuralım', 'Setting up the decomposition', [`${setup}
İki yanı ${m.fac} ile çarparız:
${prod}`, `${setup}
Multiplying both sides by ${m.fac}:
${prod}`]);
      const cov = c.r.map((r, i) => { const dn = c.r.reduce((s, q, j) => (j === i ? s : s * (r - q)), 1); return `x = ${num(r)}:  ${num(Nv(r))} = ${NM[i]}·(${num(dn)})  ⇒  ${NM[i]} = ${num(c.A[i])}`; }).join('\n');
      const lead = m.N[k - 1] || 0, sumA = c.A.reduce((s, v) => s + v, 0), names = c.r.map((r, i) => NM[i]).join(' + ');
      h('Katsayılar (örtme ve karşılaştırma)', 'Coefficients (cover-up and comparison)', [`Örtme: çarpanın kökünü yerine koyarsak diğer terimler sıfırlanır.\n${cov}\nKarşılaştırma ile kontrol: x${k > 2 ? '²' : ''} katsayıları: ${names} = ${num(lead)}  ✓ (${c.A.map(paren).join(' + ')} = ${num(sumA)}).`,
        `Cover-up: putting in the root of a factor kills the other terms.\n${cov}\nCheck by comparing coefficients: the x${k > 2 ? '²' : ''} coefficients: ${names} = ${num(lead)}  ✓ (${c.A.map(paren).join(' + ')} = ${num(sumA)}).`]);
    } else if (mode === 1) {
      const N2c = m.N.length > 2 ? m.N[2] : 0;
      h('Payda ve kesir türü', 'Denominator and type of fraction', [`Pay derecesi payda derecesinden küçük: kesir basit.\nPayda ${m.fac}: ${FX(c.r)} çarpanı İKİ kez geçiyor (tekrarlı).`, `The numerator degree is smaller than the denominator degree: the fraction is proper.\nDenominator ${m.fac}: the factor ${FX(c.r)} occurs TWICE (repeated).`]);
      h('Ayrışmış biçimi kuralım', 'Setting up the decomposition', [`Tekrarlı çarpanın her kuvveti için bir terim yazılır:\nf(x) = A/${FX(c.r)} + B/${FX(c.r)}² + C/${FX(c.s)}\nİki yanı ${m.fac} ile çarparız:\n${pStr(m.N)} = A·${FX(c.r)}${FX(c.s)} + B·${FX(c.s)} + C·${FX(c.r)}²`, `We write one term for every power of the repeated factor:\nf(x) = A/${FX(c.r)} + B/${FX(c.r)}² + C/${FX(c.s)}\nMultiplying both sides by ${m.fac}:\n${pStr(m.N)} = A·${FX(c.r)}${FX(c.s)} + B·${FX(c.s)} + C·${FX(c.r)}²`]);
      h('Katsayılar (örtme ve karşılaştırma)', 'Coefficients (cover-up and comparison)', [`Örtme: x = ${num(c.r)}:  ${num(Nv(c.r))} = B·(${num(c.r - c.s)})  ⇒  B = ${num(c.B)}\nx = ${num(c.s)}:  ${num(Nv(c.s))} = C·(${num(c.s - c.r)})²  ⇒  C = ${num(c.C)}\nA örtmeyle çıkmaz; x² katsayılarını karşılaştırırız: A + C = ${num(N2c)}  ⇒  A = ${num(c.A)}`,
        `Cover-up: x = ${num(c.r)}:  ${num(Nv(c.r))} = B·(${num(c.r - c.s)})  ⇒  B = ${num(c.B)}\nx = ${num(c.s)}:  ${num(Nv(c.s))} = C·(${num(c.s - c.r)})²  ⇒  C = ${num(c.C)}\nA does not come from cover-up; we compare the x² coefficients: A + C = ${num(N2c)}  ⇒  A = ${num(c.A)}`]);
    } else {
      const N2c = m.N.length > 2 ? m.N[2] : 0;
      h('Payda ve kesir türü', 'Denominator and type of fraction', [`Pay derecesi payda derecesinden küçük: kesir basit.\nPayda ${m.fac}: x² + ${c.k} gerçek kökü olmayan (indirgenemez) ikinci derece çarpandır.`, `The numerator degree is smaller than the denominator degree: the fraction is proper.\nDenominator ${m.fac}: x² + ${c.k} is an irreducible quadratic factor (no real roots).`]);
      h('Ayrışmış biçimi kuralım', 'Setting up the decomposition', [`İkinci derece çarpanın payı bir doğrusal ifadedir:\nf(x) = A/${FX(c.r)} + (Bx + C)/(x² + ${c.k})\nİki yanı ${m.fac} ile çarparız:\n${pStr(m.N)} = A·(x² + ${c.k}) + (Bx + C)·${FX(c.r)}`, `The numerator of a quadratic factor is a linear expression:\nf(x) = A/${FX(c.r)} + (Bx + C)/(x² + ${c.k})\nMultiplying both sides by ${m.fac}:\n${pStr(m.N)} = A·(x² + ${c.k}) + (Bx + C)·${FX(c.r)}`]);
      h('Katsayılar (örtme ve karşılaştırma)', 'Coefficients (cover-up and comparison)', [`Örtme: x = ${num(c.r)}:  ${num(Nv(c.r))} = A·(${num(c.r * c.r + c.k)})  ⇒  A = ${num(c.A)}\nx² katsayıları: A + B = ${num(N2c)}  ⇒  B = ${num(c.B)}\nSabit terimler: ${num(m.N[0])} = ${c.k}·A − (${num(c.r)})·C  ⇒  C = ${num(c.C)}`,
        `Cover-up: x = ${num(c.r)}:  ${num(Nv(c.r))} = A·(${num(c.r * c.r + c.k)})  ⇒  A = ${num(c.A)}\nx² coefficients: A + B = ${num(N2c)}  ⇒  B = ${num(c.B)}\nConstant terms: ${num(m.N[0])} = ${c.k}·A − (${num(c.r)})·C  ⇒  C = ${num(c.C)}`]);
    }
    h('Ayrışmış toplam', 'The decomposition', both(`f(x) = ${sumText(m)}`));
    const hasPw2 = m.parts.some((pt) => pt.k === 'lin' && pt.pw === 2), hasQ = m.parts.some((pt) => pt.k === 'quad');
    const rules = `∫ A/(x − r) dx = A ln|x − r|${hasPw2 ? ',  ∫ B/(x − r)² dx = −B/(x − r)' : ''}${hasQ ? ',  ∫ (Bx + C)/(x² + k) dx = (B/2) ln(x² + k) + (C/√k) arctan(x/√k)' : ''}`;
    const Fs = antText(m).replace(/ \+ C$/, '');
    h('Terim terim integral', 'Integrating term by term', [`${rules}${mode === 3 ? '\nPolinom kısmı: kuvvet kuralı.' : ''}\nF(x) = ${Fs}`, `${rules}${mode === 3 ? '\nPolynomial part: power rule.' : ''}\nF(x) = ${Fs}`]);
    const ex = m.exact, ts = termsStr(m.terms);
    if (p.def) {
      h('Sınırları yerleştirelim', 'Evaluating at the limits', [`[${num(c.lo)}, ${num(c.hi)}] aralığında x − r > 0 olduğundan mutlak değer kalkar.\nF(${num(c.hi)}) − F(${num(c.lo)}) = ${ts}`, `On [${num(c.lo)}, ${num(c.hi)}] we have x − r > 0, so the absolute values drop.\nF(${num(c.hi)}) − F(${num(c.lo)}) = ${ts}`]);
      h('Sonuç', 'Result', both(`${lim(c.lo, c.hi)} ${fStr(m)} dx = ${ts} ≈ ${num(ex)}`));
      h('Sayısal kontrol', 'Numerical check', [`Simpson kuralıyla ≈ ${num(pcSimp(m))}; kapalı çözümle aynı ✓. Ayrışmış toplam f ile her noktada çakışır (grafikte kesikli eğri).`, `Simpson's rule gives ≈ ${num(pcSimp(m))}, the same as the closed form ✓. The sum of the pieces coincides with f everywhere (dashed curve on the graph).`]);
    } else {
      h('Sonuç', 'Result', both(`∫ ${fStr(m)} dx = ${antText(m)}`));
      const x0 = (c.lo + c.hi) / 2, d = (m.Fx(x0 + 1e-5) - m.Fx(x0 - 1e-5)) / 2e-5;
      h('Türevle kontrol', 'Check by differentiating', [`x = ${num(x0)} için F'(x) ≈ ${num(d)}, f(x) = ${num(m.f(x0))}; aynı ✓.\n([${num(c.lo)}, ${num(c.hi)}] aralığında belirli integral ${ts} ≈ ${num(ex)}.)`, `At x = ${num(x0)}: F'(x) ≈ ${num(d)}, f(x) = ${num(m.f(x0))}; the same ✓.\n(Over [${num(c.lo)}, ${num(c.hi)}] the definite integral is ${ts} ≈ ${num(ex)}.)`]);
    }
    return out;
  }
  const xP = (p) => { const c = PC[p.ci]; return c.lo + (c.hi - c.lo) * Math.max(0, Math.min(1, p.s)); };
  function drawP(cv, p) {
    const m = model(p.ci), c = m.c, x0 = xP(p), roots = [];
    m.parts.forEach((pt) => { if (pt.k === 'lin' && !roots.includes(pt.r)) roots.push(pt.r); });
    const xs = [c.lo, c.hi].concat(roots), xl = Math.min(...xs) - 1.3, xr = Math.max(...xs) + 1.3;
    let y0 = 0, y1 = 0; for (let i = 0; i <= 60; i++) { const v = m.f(c.lo + (c.hi - c.lo) * i / 60); if (Number.isFinite(v)) { y0 = Math.min(y0, v); y1 = Math.max(y1, v); } }
    const yr = Math.max(y1 - y0, 0.5);
    cv.setViewport(xl, xr, y0 - 0.45 * yr, y1 + 0.55 * yr);
    cv.addFilledArea({ evaluator: m.f, xMin: c.lo, xMax: c.hi, color: K.col(cv, 'accent', 0.16) });
    cv.addFilledArea({ evaluator: m.f, xMin: c.lo, xMax: x0, color: K.col(cv, 'orange', 0.4) });
    m.parts.forEach((pt, i) => cv.addFunction({ evaluator: (x) => { const v = m.part(pt, x); return Number.isFinite(v) ? v : NaN; }, color: i % 2 ? cv.green() : cv.purple(), thickness: 1.5 }));
    cv.addFunction({ evaluator: m.f, color: cv.accent(), thickness: 3.2, label: 'f(x)' });
    cv.addFunction({ evaluator: m.psum, color: cv.orange(), thickness: 1.8, dashed: true, label: tx('parçaların toplamı', 'sum of parts') });
    roots.forEach((r) => cv.addGuideLine({ axis: 'vertical', position: r, color: cv.red(), label: `x = ${N2(r)}` }));
    cv.addGuideLine({ axis: 'vertical', position: c.hi, color: cv.gray(), label: `x = ${N2(c.hi)}` });
    cv.addGuideLine({ axis: 'vertical', position: c.lo, color: cv.gray(), label: `x = ${N2(c.lo)}` });
    cv.addMarker({ x: x0, y: m.f(x0), color: cv.orange(), radius: 5, label: `x = ${N2(x0)}` });
    cv.addMarker({ x: x0, y: 0, color: cv.orange(), radius: 4, label: `${tx('alan', 'area')} ≈ ${N2(m.Fx(x0) - m.Fx(c.lo))}` });
  }
  function buildControlsP(rightCol, getProblem, h) {
    lab(rightCol, tx('Çarpan türü', 'Type of factors'));
    h.addRadioGroup({ name: 'pfMode', options: [
      { label: tx('Farklı doğrusal çarpanlar', 'Distinct linear factors'), value: 0 }, { label: tx('Tekrarlı doğrusal çarpan', 'Repeated linear factor'), value: 1 },
      { label: tx('İndirgenemez ikinci derece çarpan', 'Irreducible quadratic factor'), value: 2 }, { label: tx('Bileşik kesir (önce bölme)', 'Improper fraction (divide first)'), value: 3 }],
    get: () => PC[getProblem().ci].m, set: (v) => { const p = getProblem(); if (PC[p.ci].m !== Number(v)) p.ci = pcStart[Number(v)]; } });
    lab(rightCol, tx('Örnek', 'Example'));
    h.addSelect({ options: PC.map((c, i) => ({ label: `${fStr(model(i))}   [${N2(c.lo)}, ${N2(c.hi)}]`, value: i })), get: () => getProblem().ci, set: (v) => { getProblem().ci = Number(v); } });
    h.addCheckbox({ caption: tx('Belirli integral (sınırlarla)', 'Definite integral (with limits)'), get: () => getProblem().def, set: (v) => { getProblem().def = !!v; } });
    h.addSlider({ caption: tx('Üst sınır konumu x (0 = alt sınır, 1 = üst sınır)', 'Upper position x (0 = lower limit, 1 = upper limit)'), min: 0, max: 1, step: 0.05, get: () => getProblem().s, set: (v) => { getProblem().s = v; } });
  }
  function createProblemP(rng) {
    const p = { ci: rng.nextInt(0, PC.length), def: rng.nextInt(0, 4) !== 0, s: 0.6 };
    verifyP(p.ci);
    return p;
  }
  const conceptP = () => tx(
    `BASİT KESİRLERE AYIRMA
Paydası çarpanlarına ayrılabilen bir rasyonel fonksiyonu P(x)/Q(x), her çarpana karşılık gelen basit kesirlerin toplamı olarak yazarız. Basit kesirlerin integrali bellidir (ln ve arctan), böylece zor görünen bir integral kolay parçalara bölünür.

YÖNTEM
1. Pay derecesi payda derecesinden küçük mü? Değilse önce polinom bölmesi yaparız: P/Q = bölüm + kalan/Q.
2. Paydayı gerçek katsayılı çarpanlara (doğrusal ve indirgenemez ikinci derece) ayırırız.
3. Her çarpan için aşağıdaki biçimi kurarız.
4. Katsayıları buluruz, terimleri tek tek integraliz, sınırları yerleştiririz.

ÇARPAN TÜRÜNE GÖRE KURULUM
• Farklı doğrusal çarpanlar: (x − r₁)(x − r₂) için A/(x − r₁) + B/(x − r₂).
• Tekrarlı doğrusal çarpan: (x − r)² için A/(x − r) + B/(x − r)²; her kuvvet için bir terim yazılır.
• İndirgenemez ikinci derece çarpan: x² + k (k > 0) için (Bx + C)/(x² + k).
• Bileşik kesir (önce bölme): pay derecesi paydaya eşit ya da büyükse uzun bölme yaparız; çıkan kalan kesri yukarıdaki gibi ayırırız.

KATSAYILARI BULMA
• Örtme (cover-up) yöntemi: eşitliği payda ile çarpıp çarpanın kökünü yerine koyarız; diğer terimler sıfırlanır ve katsayı doğrudan çıkar (tekrarlı çarpanda en yüksek kuvvetin katsayısı).
• Katsayı karşılaştırma: aynı dereceli terimlerin katsayılarını eşitleriz; örtmeyle çıkmayan katsayılar buradan bulunur.

İNTEGRAL ALMA
∫ A/(x − r) dx = A ln|x − r|,  ∫ B/(x − r)² dx = −B/(x − r),  ∫ (Bx + C)/(x² + k) dx = (B/2) ln(x² + k) + (C/√k) arctan(x/√k).

MİNİ ÖRNEK
(x + 5)/((x + 1)(x + 2)) = A/(x + 1) + B/(x + 2). x = −1 için A = 4/1 = 4, x = −2 için B = 3/(−1) = −3. İntegral: 4 ln|x + 1| − 3 ln|x + 2| + C.

TUZAKLAR
• Pay derecesini kontrol etmeden başlamak (bölme unutulur).
• Tekrarlı çarpanda B/(x − r)² terimini unutmak ya da integralini ln yazmak.
• İkinci derece çarpanın payına yalnızca sabit yazmak (Bx + C gerekir).
• Mutlak değeri unutmak; kutup noktasını içeren aralıkta integral almak.

MÜHENDİSLİKTE
Laplace ters dönüşümü, transfer fonksiyonu analizi, kimyasal tepkime hızları ve devre cevabında rasyonel fonksiyonlar bu yöntemle çözülür.

GRAFİK
Mavi eğri f(x), kesikli turuncu eğri basit kesirlerin toplamıdır (üst üste biner). İnce eğriler tek tek basit kesirlerdir. Açık mavi bölge [alt, üst] aralığındaki alan, turuncu bölge kaydırıcıdaki x'e kadar olan alandır; kırmızı çizgiler paydanın köklerindeki düşey asimptotlardır.`,
    `PARTIAL FRACTIONS
A rational function P(x)/Q(x) whose denominator factors is written as a sum of simple fractions, one kind for each factor. The integrals of simple fractions are known (ln and arctan), so a hard-looking integral is cut into easy pieces.

METHOD
1. Is the numerator degree smaller than the denominator degree? If not, we first divide the polynomials: P/Q = quotient + remainder/Q.
2. We factor the denominator into real factors (linear and irreducible quadratic).
3. For each factor we set up the form below.
4. We find the coefficients, integrate term by term and put in the limits.

SETUP BY TYPE OF FACTOR
• Distinct linear factors: for (x − r₁)(x − r₂) write A/(x − r₁) + B/(x − r₂).
• Repeated linear factor: for (x − r)² write A/(x − r) + B/(x − r)²; one term for every power.
• Irreducible quadratic factor: for x² + k (k > 0) write (Bx + C)/(x² + k).
• Improper fraction (divide first): if the numerator degree is at least the denominator degree we do long division and split the remainder fraction as above.

FINDING THE COEFFICIENTS
• Cover-up method: multiply by the denominator and put in the root of a factor; the other terms vanish and the coefficient comes out directly (for a repeated factor, the coefficient of the highest power).
• Comparing coefficients: equate the coefficients of equal powers; coefficients that cover-up cannot give are found here.

INTEGRATING
∫ A/(x − r) dx = A ln|x − r|,  ∫ B/(x − r)² dx = −B/(x − r),  ∫ (Bx + C)/(x² + k) dx = (B/2) ln(x² + k) + (C/√k) arctan(x/√k).

MINI EXAMPLE
(x + 5)/((x + 1)(x + 2)) = A/(x + 1) + B/(x + 2). At x = −1: A = 4/1 = 4; at x = −2: B = 3/(−1) = −3. Integral: 4 ln|x + 1| − 3 ln|x + 2| + C.

PITFALLS
• Starting without checking the degrees (the division is forgotten).
• For a repeated factor, forgetting the B/(x − r)² term or integrating it as a ln.
• Writing only a constant over a quadratic factor (Bx + C is needed).
• Forgetting the absolute value; integrating across a pole.

IN ENGINEERING
Inverse Laplace transforms, transfer-function analysis, chemical reaction rates and circuit responses reduce rational functions with this method.

GRAPH
The blue curve is f(x); the dashed orange curve is the sum of the simple fractions (it lies on top of f). The thin curves are the single simple fractions. The light blue region is the area on [lower, upper], the orange region is the area up to the slider position x; the red lines are the vertical asymptotes at the roots of the denominator.`);
  const mkLinkP = (modes) => (rng) => {
    const p = createProblemP(rng), idx = PC.map((c, i) => i).filter((i) => modes.includes(PC[i].m));
    p.ci = idx[rng.nextInt(0, idx.length)]; p.def = true; p.s = 0.6; verifyP(p.ci); return p;
  };
  Topics.register('calc2', {
    id: 'partialFractions',
    tabTitle: () => tx('Basit Kesirlere Ayırma', 'Partial Fractions'),
    concept: conceptP,
    problemStatement: statementP,
    createProblem: createProblemP,
    solveSteps: stepsP,
    draw: drawP,
    buildControls: buildControlsP,
    links: [
      { match: /^• (Farklı doğrusal çarpanlar|Distinct linear factors):/, make: mkLinkP([0]) },
      { match: /^• (Tekrarlı doğrusal çarpan|Repeated linear factor):/, make: mkLinkP([1]) },
      { match: /^• (İndirgenemez ikinci derece çarpan|Irreducible quadratic factor):/, make: mkLinkP([2]) },
      { match: /^• (Bileşik kesir|Improper fraction)/, make: mkLinkP([3]) },
      { match: /^• (Örtme \(cover-up\) yöntemi|Cover-up method):/, make: mkLinkP([0, 1]) },
      { match: /^• (Katsayı karşılaştırma|Comparing coefficients):/, make: mkLinkP([1, 2]) },
    ],
    challenge: {
      prompt: (p) => { const m = model(p.ci), c = m.c; return p.def
        ? tx(`${lim(c.lo, c.hi)} ${fStr(m)} dx integralinin değeri kaçtır? Basit kesirlere ayırıp ya da sayısal hesaplayıp 2 ondalık basamakla yazalım.`, `What is the value of ${lim(c.lo, c.hi)} ${fStr(m)} dx? Let's use partial fractions (or compute numerically) and type it to 2 decimals.`)
        : tx(`${fStr(m)} ifadesini basit kesirlere ayırdığımızda ilk terimin katsayısı (A) kaçtır? (A, ${FX(m.parts[0].r)} çarpanının payıdır.)`, `When ${fStr(m)} is split into partial fractions, what is the coefficient A of the first term? (A is the numerator over the factor ${FX(m.parts[0].r)}.)`); },
      target: (p) => (p.def ? model(p.ci).exact : aVal(model(p.ci))),
      tol: (p) => (p.def ? Math.max(0.02, 0.005 * Math.abs(model(p.ci).exact)) : 0.01),
      hint: (p, g) => { const t = p.def ? model(p.ci).exact : aVal(model(p.ci)); return tx(g > t ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > t ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.') + ' ' + (p.def ? tx('Önce katsayıları örtme yöntemiyle bulalım.', 'First find the coefficients by cover-up.') : tx('Örtme yöntemi: çarpanın kökünü paya yerleştirip diğer çarpanlarla bölelim.', 'Cover-up: put the root of the factor into the numerator and divide by the other factors.')); },
    },
    _test: { PC, model, exactP: (ci) => model(ci).exact, pcSimp, FX, verify: verifyP, sumText, antText },
  });

  // ================================================================ QUIZ MATERIAL
  window.Calc2Quiz = window.Calc2Quiz || { main: [], extra: [] };
  const topT = () => tx('Trigonometrik Yerine Koyma', 'Trigonometric Substitution');
  const topP = () => tx('Basit Kesirlere Ayırma', 'Partial Fractions');
  const lvl = (g, l) => { g.level = l; return g; };
  const pick = (rng, arr) => arr[rng.nextInt(0, arr.length)];
  // value question; pairs = [[wrongValue, note]] (misconceptions first, plain fillers are added)
  function numQ(topic, text, correct, sol, rng, level, pairs, unit) {
    const seen = new Set([fmt2(correct)]), wr = [], notes = [];
    pairs.concat([[correct * 2, ''], [correct / 2, ''], [correct + 1, ''], [correct - 1, ''], [correct + 2, ''], [-correct, '']]).forEach(([v, n]) => {
      if (!Number.isFinite(v) || seen.has(fmt2(v))) return;
      seen.add(fmt2(v)); wr.push(v); notes.push(n);
    });
    return Assessment.num(topic, text, correct, sol, rng, { level, wrongs: wr, notes, unit });
  }
  const flipLn = (t) => termsVal(t.map((x) => (x.isLn ? Object.assign({}, x, { v: -x.v }) : x)));
  const flipPi = (t) => termsVal(t.map((x) => (x.sym === 'π' ? Object.assign({}, x, { v: -x.v }) : x)));
  function defGenT(filter, level) {
    return lvl((rng) => {
      const idx = CASES.map((c, i) => i).filter((i) => filter(CASES[i])), ci = pick(rng, idx), c = CASES[ci], T = TYPES[c.t];
      verifyT(ci);
      const t = T.terms(c), ex = termsVal(t), hasLn = t.some((x) => x.isLn), G = T.G(c), th = THETA[c.fam](c);
      const unconv = G(c.hi) - G(c.lo);
      void th;
      const factor = 'ABEGI'.includes(c.t) ? ex * 2 : 'CF'.includes(c.t) ? ex * c.a * c.a : ex / c.a;
      const sol = [`${FAM_TXT[c.fam].sub},  ${FAM_TXT[c.fam].dx},  ${FAM_TXT[c.fam].root}.`, `∫ ${integ(c)} dx = ∫ ${T.thInt} = ${T.thAnt} + C.`, `F(x) = ${T.ant(c).replace(/ \+ C$/, '')}.`, `F(${N2(c.hi)}) − F(${N2(c.lo)}) = ${termsStr(t)} ≈ ${N2(ex)}.`];
      return numQ(topT(), tx(`${lim(c.lo, c.hi)} ${integ(c)} dx integralinin değeri yaklaşık kaçtır?`, `What is the approximate value of ${lim(c.lo, c.hi)} ${integ(c)} dx?`), ex, sol, rng, level, [
        [unconv, tx('Sınırlar θ\'ya çevrilmeden x değerleri θ yerine konmuş.', 'The limits were not converted: the x values were used as θ.')],
        [factor, tx('Özdeşlikten ya da ters türevden gelen bir çarpan (½, a ya da a²) kaybolmuş.', 'A factor (½, a or a²) from the identity or the antiderivative was lost.')],
        [hasLn ? flipLn(t) : flipPi(t), tx('Log (ya da π) teriminin işareti yanlış alınmış.', 'The sign of the log (or π) term is wrong.')]]);
    }, level);
  }
  Calc2Quiz.main.push(defGenT(() => true, 2));
  Calc2Quiz.extra.push(lvl((rng) => {
    const fam = rng.nextInt(0, 3), [p1, q1, h1] = pick(rng, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10]]);
    // sin: a = hyp, x = leg; tan: a, x legs; sec: a leg, x = hyp
    const a = fam === 0 ? h1 : p1, x = fam === 2 ? h1 : fam === 0 ? p1 : q1, ans = fam === 1 ? h1 : q1;
    const sq = ['√(a² − x²)', '√(a² + x²)', '√(x² − a²)'][fam], F = FAM_TXT[fam];
    const wrongs = [[[a - x, a * a - x * x, a + x, x]], [[Math.abs(a - x), a * a + x * x, a + x, a]], [[x - a, x * x - a * a, x + a, x]]][fam][0];
    const notes = [tx('Pisagor yerine kenarlar doğrudan çıkarılmış.', 'The sides were subtracted directly instead of using Pythagoras.'), tx('Karekök alınmamış (kare değer verilmiş).', 'The square root was not taken (squared value).'), tx('Kenarlar toplanmış.', 'The sides were added.'), tx('Verilen bir kenar sonuç sanılmış.', 'A given side was taken as the answer.')];
    return numQ(topT(), tx(`${F.sub} yerine koymasında a = ${a} ve x = ${x} iken ${sq} kaçtır? (Dik üçgenin üçüncü kenarı.)`, `In the substitution ${F.sub} with a = ${a} and x = ${x}, what is ${sq}? (The third side of the right triangle.)`),
      ans, [`${F.sub}: hipotenüs = ${F.hyp}, karşı = ${F.opp}, komşu = ${F.adj}.`.replace(/^/, ''), `${sq} = ${ans}  (Pisagor: ${[`${a}² − ${x}²`, `${a}² + ${x}²`, `${x}² − ${a}²`][fam]} = ${ans * ans}).`], rng, 1, wrongs.map((w, i) => [w, notes[i]]));
  }, 1));
  Calc2Quiz.extra.push(lvl((rng) => {
    const o = pick(rng, [
      { a: 2, x: '1', th: 30, form: 'x = 2 sinθ', f: 'sinθ' }, { a: 2, x: '√3', th: 60, form: 'x = 2 sinθ', f: 'sinθ' }, { a: 5, x: '5', th: 90, form: 'x = 5 sinθ', f: 'sinθ' },
      { a: 3, x: '3', th: 45, form: 'x = 3 tanθ', f: 'tanθ' }, { a: 2, x: '2√3', th: 60, form: 'x = 2 tanθ', f: 'tanθ' },
      { a: 3, x: '6', th: 60, form: 'x = 3 secθ', f: 'secθ' }, { a: 4, x: '4√2', th: 45, form: 'x = 4 secθ', f: 'secθ' }]);
    return numQ(topT(), tx(`${o.form} yerine koymasında integralin üst sınırı x = ${o.x} ise karşılık gelen θ açısı kaç derecedir? (0° ≤ θ ≤ 90°.)`, `In the substitution ${o.form}, which angle θ (in degrees) corresponds to the upper limit x = ${o.x}? (0° ≤ θ ≤ 90°.)`), o.th,
      [`${o.form} ⇒ ${o.f} = x/${o.a}.`, `x = ${o.x}: ${o.f} = ${o.x}/${o.a} ⇒ θ = ${o.th}°.`], rng, 2,
      [[90 - o.th, tx('Tümler açı: sin yerine cos okunmuş.', 'The complementary angle: cos was read instead of sin.')], [o.th * 2, tx('Açı iki katına çıkarılmış.', 'The angle was doubled.')], [45, ''], [60, ''], [30, ''], [90, '']].filter((w) => w[0] > 0 && w[0] <= 90), '°');
  }, 2));
  Calc2Quiz.extra.push(defGenT((c) => 'EGIJH'.includes(c.t), 3));
  Calc2Quiz.extra.push(defGenT((c) => c.fam === 0 && c.t === 'A', 2));

  // ---- partial fractions quiz ----
  const pfIdx = (f) => PC.map((c, i) => i).filter((i) => f(PC[i]));
  function defGenP(filter, level) {
    return lvl((rng) => {
      const ci = pick(rng, pfIdx(filter)), m = model(ci), c = m.c, t = m.terms, ex = m.exact;
      verifyP(ci);
      const lnSum = m.linLn.reduce((s, x) => s + x.v * x.val, 0), quadSum = m.quadLn.reduce((s, x) => s + x.v * x.val, 0);
      const inv = ex - 2 * lnSum;
      let alt, altNote;
      if (m.pw2R) { alt = ex - 2 * m.pw2R; altNote = tx('B/(x − r)² teriminin integrali yanlış işaretle (ya da ln gibi) alınmış.', 'The integral of B/(x − r)² was taken with the wrong sign (or like a ln).'); }
      else if (m.linLn.length > 1) { alt = ex - lnSum + m.linLn.reduce((s, x, i) => s + x.v * m.linLn[(i + 1) % m.linLn.length].val, 0); altNote = tx('Katsayılar yer değiştirmiş (A ile B karışmış).', 'The coefficients were swapped (A and B mixed up).'); }
      else { alt = ex - quadSum; altNote = tx('ln(x² + k) terimi unutulmuş.', 'The ln(x² + k) term was forgotten.'); }
      const drop = ex - m.linLn[0].v * m.linLn[0].val;
      const sol = [`f(x) = ${sumText(m)}`, `F(x) = ${antText(m).replace(/ \+ C$/, '')}`, `F(${N2(c.hi)}) − F(${N2(c.lo)}) = ${termsStr(t)} ≈ ${N2(ex)}`];
      return numQ(topP(), tx(`${lim(c.lo, c.hi)} ${fStr(m)} dx integralinin değeri yaklaşık kaçtır?`, `What is the approximate value of ${lim(c.lo, c.hi)} ${fStr(m)} dx?`), ex, sol, rng, level, [
        [inv, tx('ln terimlerinde oran ters alınmış (alt/üst).', 'The ratio inside the ln terms was inverted (lower/upper).')],
        [alt, altNote],
        [drop, tx('Bir basit kesir integrale katılmamış.', 'One simple fraction was left out of the integral.')]]);
    }, level);
  }
  Calc2Quiz.main.push(defGenP((c) => c.m <= 1, 2));
  Calc2Quiz.extra.push(lvl((rng) => {
    const ci = pick(rng, pfIdx((c) => c.m === 0 && c.r.length === 2)), m = model(ci), c = m.c, [r, s] = c.r, N = (x) => pEval(m.N, x);
    verifyP(ci);
    const A = c.A[0], B = c.A[1];
    return numQ(topP(), tx(`${fStr(m)} = A/${FX(r)} + B/${FX(s)} ayrışmasında A kaçtır? (Örtme yöntemi.)`, `In the decomposition ${fStr(m)} = A/${FX(r)} + B/${FX(s)}, what is A? (Use the cover-up method.)`), A,
      [`x = ${N2(r)} için ${FX(r)} çarpanı örtülür: A = N(${N2(r)})/(${N2(r)} − ${s < 0 ? '(' + N2(s) + ')' : N2(s)}) = ${N2(N(r))}/${N2(r - s)} = ${N2(A)}.`, `Kontrol: A + B = ${N2(A + B)} = x'in katsayısı.`],
      rng, 1, [[B, tx('A yerine B bulunmuş (yanlış kök).', 'B was found instead of A (wrong root).')], [N(r) / (s - r), tx('Paydadaki fark ters işaretle alınmış.', 'The difference in the denominator has the wrong sign.')], [N(r), tx('Payın değeri bölünmeden bırakılmış.', 'The numerator value was not divided.')]]);
  }, 1));
  Calc2Quiz.extra.push(lvl((rng) => {
    const ci = pick(rng, pfIdx((c) => c.m === 1)), m = model(ci), c = m.c, N = (x) => pEval(m.N, x);
    verifyP(ci);
    return numQ(topP(), tx(`${fStr(m)} = A/${FX(c.r)} + B/${FX(c.r)}² + C/${FX(c.s)} ayrışmasında B kaçtır?`, `In the decomposition ${fStr(m)} = A/${FX(c.r)} + B/${FX(c.r)}² + C/${FX(c.s)}, what is B?`), c.B,
      [`x = ${N2(c.r)} için ${FX(c.r)}² çarpanı örtülür: B = N(${N2(c.r)})/(${N2(c.r)} − ${c.s < 0 ? '(' + N2(c.s) + ')' : N2(c.s)}) = ${N2(N(c.r))}/${N2(c.r - c.s)} = ${N2(c.B)}.`],
      rng, 2, [[c.A, tx('A ile B karıştırılmış.', 'A and B were mixed up.')], [c.C, tx('Diğer kökün katsayısı bulunmuş.', 'The coefficient of the other root was found.')], [N(c.r), tx('Paydadaki (r − s) ile bölünmemiş.', 'Not divided by (r − s).')]]);
  }, 2));
  Calc2Quiz.extra.push(defGenP((c) => c.m === 2, 3));
  Calc2Quiz.extra.push(defGenP((c) => c.m === 3, 2));
})();
