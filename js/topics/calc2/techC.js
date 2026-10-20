// Calculus II - techniques C: numerical integration (trapezoid / Simpson with error bounds) and improper integrals.
// Both tabs are hand-written (like riemannSums.js). Every closed form shown in the steps is checked in createProblem against
// an independent numeric computation, so a wrong result cannot ship.
window.Calc2Quiz = window.Calc2Quiz || { main: [], extra: [] };

// ======================================================================================================================
// 1) Numerical integration: T_n and S_n
// ======================================================================================================================
(function () {
  const K0 = Calc2, tx = K0.tx, sub = K0.sub, sup = K0.sup, neg = K0.neg, N2 = K0.N2;
  const PI = Math.PI, E = Math.E;
  const D = (v, k) => neg(v.toFixed(k));
  // errors and bounds: plain decimals, scientific notation for tiny values
  const G = (v) => {
    if (v === 0) return '0';
    if (Math.abs(v) >= 1e-3) return D(v, 6).replace(/0+$/, '').replace(/\.$/, '');
    const e = Math.floor(Math.log10(Math.abs(v)) + 1e-12), m = v / Math.pow(10, e);
    return `${neg(m.toFixed(2))} × 10${sup(e)}`;
  };
  const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
  const rgba = (hex, a) => {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    return m ? `rgba(${parseInt(m[1].substr(0, 2), 16)},${parseInt(m[1].substr(2, 2), 16)},${parseInt(m[1].substr(4, 2), 16)},${a})` : hex;
  };
  const NMAX = 20, EPS = [0.01, 0.001, 0.0001], EPSS = ['0.01', '0.001', '0.0001'];
  const W = (tr, en) => [tr, en];
  const kwE = (x, v) => W(`f″ = eˣ artandır; en büyük değeri x = ${x} için ${v} olur`, `f″ = eˣ is increasing; its maximum is ${v} at x = ${x}`);
  const mwE = (x, v) => W(`f⁗ = eˣ artandır; en büyük değer x = ${x} için ${v}`, `f⁗ = eˣ is increasing; the maximum is ${v} at x = ${x}`);
  const kwInv = W('|f″| = 2/x³ azalandır; en büyük değer sol uçta, x = 1 için 2', '|f″| = 2/x³ is decreasing; the maximum is at the left end, x = 1, where it equals 2');
  const mwInv = W('|f⁗| = 24/x⁵ azalandır; en büyük değer x = 1 için 24', '|f⁗| = 24/x⁵ is decreasing; the maximum is 24 at x = 1');
  const kwSq = W('|f″| = 1/(4x^(3/2)) azalandır; en büyük değer x = 1 için 1/4', '|f″| = 1/(4x^(3/2)) is decreasing; the maximum is 1/4 at x = 1');
  const mwSq = W('|f⁗| = 15/(16x^(7/2)) azalandır; en büyük değer x = 1 için 15/16', '|f⁗| = 15/(16x^(7/2)) is decreasing; the maximum is 15/16 at x = 1');
  const kwSin = W('|f″| = |sin x| ≤ 1 ve x = π/2 için eşitlik olur', '|f″| = |sin x| ≤ 1, with equality at x = π/2');
  const mwSin = W('|f⁗| = |sin x| ≤ 1 ve x = π/2 için eşitlik olur', '|f⁗| = |sin x| ≤ 1, with equality at x = π/2');
  const mw24 = W('f⁗ = 24 sabittir', 'f⁗ = 24 is constant');

  // K = max|f''|, M = max|f''''| on [a,b] (verified numerically in verifyFn); kw/mw: where the maximum is
  const FUNS = [
    { eq: 'eˣ', f: Math.exp, d2: Math.exp, d4: Math.exp, a: 0, b: 1, aS: '0', bS: '1', I: E - 1, IS: 'e − 1', Fs: 'eˣ', d2S: 'eˣ', d4S: 'eˣ', K: E, KS: 'e', M: E, MS: 'e', kw: kwE(1, 'e'), mw: mwE(1, 'e') },
    { eq: 'eˣ', f: Math.exp, d2: Math.exp, d4: Math.exp, a: 0, b: 2, aS: '0', bS: '2', I: E * E - 1, IS: 'e² − 1', Fs: 'eˣ', d2S: 'eˣ', d4S: 'eˣ', K: E * E, KS: 'e²', M: E * E, MS: 'e²', kw: kwE(2, 'e²'), mw: mwE(2, 'e²') },
    { eq: '1/x', f: (x) => 1 / x, d2: (x) => 2 / (x * x * x), d4: (x) => 24 / Math.pow(x, 5), a: 1, b: 2, aS: '1', bS: '2', I: Math.log(2), IS: 'ln 2', Fs: 'ln x', d2S: '2/x³', d4S: '24/x⁵', K: 2, KS: '2', M: 24, MS: '24', kw: kwInv, mw: mwInv },
    { eq: '1/x', f: (x) => 1 / x, d2: (x) => 2 / (x * x * x), d4: (x) => 24 / Math.pow(x, 5), a: 1, b: 3, aS: '1', bS: '3', I: Math.log(3), IS: 'ln 3', Fs: 'ln x', d2S: '2/x³', d4S: '24/x⁵', K: 2, KS: '2', M: 24, MS: '24', kw: kwInv, mw: mwInv },
    { eq: 'sin x', f: Math.sin, d2: (x) => -Math.sin(x), d4: Math.sin, a: 0, b: PI, aS: '0', bS: 'π', I: 2, IS: '2', Fs: '−cos x', d2S: '−sin x', d4S: 'sin x', K: 1, KS: '1', M: 1, MS: '1', kw: kwSin, mw: mwSin },
    { eq: 'sin x', f: Math.sin, d2: (x) => -Math.sin(x), d4: Math.sin, a: 0, b: PI / 2, aS: '0', bS: 'π/2', I: 1, IS: '1', Fs: '−cos x', d2S: '−sin x', d4S: 'sin x', K: 1, KS: '1', M: 1, MS: '1',
      kw: W('|f″| = sin x artandır; en büyük değer sağ uçta, x = π/2 için 1', '|f″| = sin x is increasing; the maximum is 1 at the right end, x = π/2'), mw: W('|f⁗| = sin x artandır; en büyük değer x = π/2 için 1', '|f⁗| = sin x is increasing; the maximum is 1 at x = π/2') },
    { eq: '√x', f: Math.sqrt, d2: (x) => -0.25 * Math.pow(x, -1.5), d4: (x) => -15 / 16 * Math.pow(x, -3.5), a: 1, b: 4, aS: '1', bS: '4', I: 14 / 3, IS: '14/3', Fs: '(2/3)x^(3/2)', d2S: '−1/(4x^(3/2))', d4S: '−15/(16x^(7/2))', K: 0.25, KS: '1/4', M: 15 / 16, MS: '15/16', kw: kwSq, mw: mwSq },
    { eq: '√x', f: Math.sqrt, d2: (x) => -0.25 * Math.pow(x, -1.5), d4: (x) => -15 / 16 * Math.pow(x, -3.5), a: 1, b: 9, aS: '1', bS: '9', I: 52 / 3, IS: '52/3', Fs: '(2/3)x^(3/2)', d2S: '−1/(4x^(3/2))', d4S: '−15/(16x^(7/2))', K: 0.25, KS: '1/4', M: 15 / 16, MS: '15/16', kw: kwSq, mw: mwSq },
    { eq: 'x⁴', f: (x) => x * x * x * x, d2: (x) => 12 * x * x, d4: () => 24, a: 0, b: 2, aS: '0', bS: '2', I: 32 / 5, IS: '32/5', Fs: 'x⁵/5', d2S: '12x²', d4S: '24', K: 48, KS: '48', M: 24, MS: '24',
      kw: W('f″ = 12x² artandır; en büyük değer x = 2 için 12·4 = 48', 'f″ = 12x² is increasing; the maximum is 12·4 = 48 at x = 2'), mw: mw24 },
    { eq: 'x⁴', f: (x) => x * x * x * x, d2: (x) => 12 * x * x, d4: () => 24, a: 0, b: 1, aS: '0', bS: '1', I: 0.2, IS: '1/5', Fs: 'x⁵/5', d2S: '12x²', d4S: '24', K: 12, KS: '12', M: 24, MS: '24',
      kw: W('f″ = 12x² artandır; en büyük değer x = 1 için 12', 'f″ = 12x² is increasing; the maximum is 12 at x = 1'), mw: mw24 },
    { eq: '1/(1+x²)', f: (x) => 1 / (1 + x * x), d2: (x) => (6 * x * x - 2) / Math.pow(1 + x * x, 3), d4: (x) => 24 * (5 * Math.pow(x, 4) - 10 * x * x + 1) / Math.pow(1 + x * x, 5), a: 0, b: 1, aS: '0', bS: '1', I: PI / 4, IS: 'π/4', Fs: 'arctan x',
      d2S: '(6x² − 2)/(1 + x²)³', d4S: '24(5x⁴ − 10x² + 1)/(1 + x²)⁵', K: 2, KS: '2', M: 24, MS: '24',
      kw: W('[0, 1] üzerinde |f″| en çok x = 0 noktasında olur: |−2| = 2', 'on [0, 1] the largest |f″| occurs at x = 0: |−2| = 2'), mw: W('[0, 1] üzerinde |f⁗| en çok x = 0 noktasında olur: 24', 'on [0, 1] the largest |f⁗| occurs at x = 0: 24') },
  ];

  const weights = (n, m) => { const w = []; for (let i = 0; i <= n; i++) w.push(i === 0 || i === n ? 1 : m === 0 ? 2 : (i % 2 ? 4 : 2)); return w; };
  const rule = (f, a, b, n, m) => {
    const h = (b - a) / n, w = weights(n, m);
    let s = 0;
    for (let i = 0; i <= n; i++) s += w[i] * f(a + i * h);
    return (m === 0 ? h / 2 : h / 3) * s;
  };
  // independent forms: T = (L + R)/2 ; S_n = (T_{n/2} + 2 M_{n/2})/3
  const trapAlt = (f, a, b, n) => { const h = (b - a) / n; let l = 0, r = 0; for (let i = 0; i < n; i++) { l += f(a + i * h); r += f(a + (i + 1) * h); } return h * (l + r) / 2; };
  const midAlt = (f, a, b, n) => { const h = (b - a) / n; let s = 0; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return h * s; };
  const simpAlt = (f, a, b, n) => (trapAlt(f, a, b, n / 2) + 2 * midAlt(f, a, b, n / 2)) / 3;
  const boundT = (u, n) => u.K * Math.pow(u.b - u.a, 3) / (12 * n * n);
  const boundS = (u, n) => u.M * Math.pow(u.b - u.a, 5) / (180 * Math.pow(n, 4));
  const rawN = (u, m, eps) => (m === 0 ? Math.sqrt(u.K * Math.pow(u.b - u.a, 3) / (12 * eps)) : Math.pow(u.M * Math.pow(u.b - u.a, 5) / (180 * eps), 0.25));
  const needN = (u, m, eps) => {
    let n = m === 0 ? 1 : 2;
    while ((m === 0 ? boundT(u, n) : boundS(u, n)) >= eps && n < 100000) n += m === 0 ? 1 : 2;
    return n;
  };

  const okU = new Set();
  function verifyFn(i) {
    if (okU.has(i)) return;
    const u = FUNS[i], fail = (m) => { throw new Error('numericInt: ' + u.eq + ' [' + u.aS + ',' + u.bS + '] ' + m); };
    const L = u.b - u.a;
    let s = u.f(u.a) + u.f(u.b);
    const n = 4000, h = L / n;
    for (let k = 1; k < n; k++) s += u.f(u.a + k * h) * (k % 2 ? 4 : 2);
    if (Math.abs(s * h / 3 - u.I) > 1e-9 * (1 + Math.abs(u.I))) fail('exact value mismatch');
    let m2 = 0, m4 = 0;
    for (let k = 0; k <= 2000; k++) {
      const x = u.a + L * k / 2000;
      m2 = Math.max(m2, Math.abs(u.d2(x))); m4 = Math.max(m4, Math.abs(u.d4(x)));
      if (k % 250 === 0 && k > 0 && k < 2000) {
        const e = 1e-3, d2n = (u.f(x + e) - 2 * u.f(x) + u.f(x - e)) / (e * e), d4n = (u.d2(x + e) - 2 * u.d2(x) + u.d2(x - e)) / (e * e);
        if (Math.abs(d2n - u.d2(x)) > 1e-3 * (1 + Math.abs(u.d2(x)))) fail('f″ formula mismatch at ' + x);
        if (Math.abs(d4n - u.d4(x)) > 1e-3 * (1 + Math.abs(u.d4(x)))) fail('f⁗ formula mismatch at ' + x);
      }
    }
    if (Math.abs(m2 - u.K) > 1e-5 * u.K) fail('K mismatch ' + m2 + ' vs ' + u.K);
    if (Math.abs(m4 - u.M) > 1e-5 * u.M) fail('M mismatch ' + m4 + ' vs ' + u.M);
    okU.add(i);
  }
  function verify(p) {
    verifyFn(p.fi);
    const u = FUNS[p.fi], v = rule(u.f, u.a, u.b, p.n, p.m);
    const alt = p.m === 0 ? trapAlt(u.f, u.a, u.b, p.n) : simpAlt(u.f, u.a, u.b, p.n);
    if (Math.abs(v - alt) > 1e-12 * (1 + Math.abs(v))) throw new Error('numericInt: rule mismatch');
    const bd = p.m === 0 ? boundT(u, p.n) : boundS(u, p.n);
    if (Math.abs(v - u.I) > bd * (1 + 1e-9) + 1e-14) throw new Error('numericInt: error exceeds the bound');
    if (Math.ceil(rawN(u, p.m, p.eps) - 1e-9) > needN(u, p.m, p.eps)) throw new Error('numericInt: n needed mismatch');
  }

  function norm(p) {
    p.fi = Math.max(0, Math.min(FUNS.length - 1, Math.round(p.fi)));
    p.m = p.m === 1 ? 1 : 0;
    p.n = Math.max(1, Math.min(NMAX, Math.round(p.n)));
    if (p.m === 1) p.n = Math.max(2, 2 * Math.round(p.n / 2));
    if (!EPS.includes(p.eps)) p.eps = 0.001;
    return p;
  }
  const METH = () => [tx('YAMUK kuralı (Tₙ)', 'TRAPEZOID rule (Tₙ)'), tx('SIMPSON kuralı (Sₙ)', "SIMPSON's rule (Sₙ)")];
  const SYM = (m) => (m === 0 ? 'Tₙ' : 'Sₙ');

  function problemStatement(p) {
    norm(p);
    const u = FUNS[p.fi], es = EPSS[EPS.indexOf(p.eps)], kk = p.m === 0 ? 'K = max|f″|' : 'M = max|f⁗|';
    return tx(`f(x) = ${u.eq} fonksiyonu için ∫ f(x) dx integralini [${u.aS}, ${u.bS}] aralığında n = ${p.n} parçalı ${METH()[p.m]} ile yaklaşık hesaplayalım. Tam değerle karşılaştırıp hatayı bulalım, hata sınırı formülünü (${kk} değerini hesaplayarak) uygulayalım ve hatanın ${es} değerinden küçük olması için en az kaç parça gerektiğini belirleyelim.`,
      `Let's approximate ∫ f(x) dx for f(x) = ${u.eq} on [${u.aS}, ${u.bS}] with the ${METH()[p.m]} using n = ${p.n} pieces. Then let's compare with the exact value to find the error, apply the error-bound formula (computing ${kk}) and decide how many pieces are needed for the error to be below ${es}.`);
  }

  function solveSteps(p) {
    norm(p);
    const u = FUNS[p.fi], n = p.n, m = p.m, L = u.b - u.a, h = L / n, w = weights(n, m);
    const xs = w.map((_, i) => u.a + i * h), fs = xs.map(u.f), sum = fs.reduce((s, v, i) => s + w[i] * v, 0);
    const val = (m === 0 ? h / 2 : h / 3) * sum, err = u.I - val, bd = m === 0 ? boundT(u, n) : boundS(u, n);
    const es = EPSS[EPS.indexOf(p.eps)], nn = needN(u, m, p.eps), raw = rawN(u, m, p.eps);
    const row = (i) => `x${sub(i)} = ${D(xs[i], 4)},  f(x${sub(i)}) = ${D(fs[i], 5)},  w${sub(i)} = ${w[i]},  w${sub(i)}·f = ${D(w[i] * fs[i], 5)}`;
    const idx = n <= 10 ? w.map((_, i) => i) : [0, 1, 2, -1, n - 1, n];
    const table = idx.map((i) => (i < 0 ? '…' : row(i))).join('\n');
    const fac = m === 0 ? 'h/2' : 'h/3', facV = m === 0 ? h / 2 : h / 3;
    const terms = n <= 6 ? w.map((wi, i) => `${wi}·${D(fs[i], 5)}`).join(' + ') + ' = ' : '';
    const wtxt = m === 0 ? '1, 2, 2, …, 2, 1' : '1, 4, 2, 4, …, 4, 1';
    const s = [];
    s.push(tx(`── 1) Parçalama ──\nn = ${n} parça: h = (b − a)/n = (${u.bS} − ${u.aS})/${n} = ${D(h, 5)}. Düğüm noktaları xᵢ = a + i·h (i = 0 … ${n}).\nYöntem: ${METH()[m]}. ${m === 0 ? 'Her parçada eğriyi kirişle değiştiririz.' : 'n çift olmalı; ardışık iki parçada eğriyi üç noktadan geçen parabolle değiştiririz.'}`,
      `── 1) Subdivision ──\nn = ${n} pieces: h = (b − a)/n = (${u.bS} − ${u.aS})/${n} = ${D(h, 5)}. Nodes xᵢ = a + i·h (i = 0 … ${n}).\nMethod: ${METH()[m]}. ${m === 0 ? 'On every piece we replace the curve by a chord.' : 'n must be even; on every pair of pieces we replace the curve by the parabola through three points.'}`));
    s.push(tx(`── 2) Formül ──\n${SYM(m)} = (${fac})·[Σ wᵢ f(xᵢ)],  ağırlıklar wᵢ: ${wtxt}.`, `── 2) The formula ──\n${SYM(m)} = (${fac})·[Σ wᵢ f(xᵢ)],  weights wᵢ: ${wtxt}.`));
    s.push(tx(`── 3) Tablo ──\n${table}`, `── 3) Table ──\n${table}`));
    s.push(tx(`── 4) Toplam ──\nΣ wᵢ f(xᵢ) = ${terms}${D(sum, 5)}.\n${SYM(m)} = (${fac})·Σ = ${D(facV, 5)}·${D(sum, 5)} = ${D(val, 5)}.`,
      `── 4) The sum ──\nΣ wᵢ f(xᵢ) = ${terms}${D(sum, 5)}.\n${SYM(m)} = (${fac})·Σ = ${D(facV, 5)}·${D(sum, 5)} = ${D(val, 5)}.`));
    s.push(tx(`── 5) Tam değer ──\nF(x) = ${u.Fs}; ∫ₐᵇ f dx = F(b) − F(a) = ${u.IS} ≈ ${D(u.I, 5)}.`, `── 5) Exact value ──\nF(x) = ${u.Fs}; ∫ₐᵇ f dx = F(b) − F(a) = ${u.IS} ≈ ${D(u.I, 5)}.`));
    s.push(tx(`── 6) Gerçek hata ──\nI − ${SYM(m)} = ${D(u.I, 5)} − ${D(val, 5)} = ${G(err)}; |E| = ${G(Math.abs(err))}, bağıl hata ≈ %${N2(100 * Math.abs(err) / Math.abs(u.I))}. ${err > 0 ? 'Yaklaşım gerçek değerden KÜÇÜK.' : err < 0 ? 'Yaklaşım gerçek değerden BÜYÜK.' : 'Yaklaşım tam.'}`,
      `── 6) Actual error ──\nI − ${SYM(m)} = ${D(u.I, 5)} − ${D(val, 5)} = ${G(err)}; |E| = ${G(Math.abs(err))}, relative error ≈ ${N2(100 * Math.abs(err) / Math.abs(u.I))}%. ${err > 0 ? 'The approximation is BELOW the exact value.' : err < 0 ? 'The approximation is ABOVE the exact value.' : 'The approximation is exact.'}`));
    if (m === 0) {
      s.push(tx(`── 7) Hata sınırı ──\nf″(x) = ${u.d2S}. ${u.kw[0]}: K = ${u.KS} ≈ ${D(u.K, 5)}.\n|E_T| ≤ K(b − a)³/(12n²) = ${D(u.K, 5)}·${D(L, 5)}³/(12·${n}²) = ${G(bd)}.\nGerçek hata ${G(Math.abs(err))} ≤ ${G(bd)} ✓.`,
        `── 7) Error bound ──\nf″(x) = ${u.d2S}. ${u.kw[1]}: K = ${u.KS} ≈ ${D(u.K, 5)}.\n|E_T| ≤ K(b − a)³/(12n²) = ${D(u.K, 5)}·${D(L, 5)}³/(12·${n}²) = ${G(bd)}.\nThe actual error ${G(Math.abs(err))} ≤ ${G(bd)} ✓.`));
      s.push(tx(`── 8) Hata < ${es} için kaç parça? ──\nK(b − a)³/(12n²) < ${es}  ⇒  n > √(K(b − a)³/(12·${es})) = √(${D(u.K, 5)}·${D(Math.pow(L, 3), 5)}/${D(12 * p.eps, 6)}) ≈ ${D(raw, 3)}.\nEn küçük tam sayı: n = ${nn}.`,
        `── 8) How many pieces for error < ${es}? ──\nK(b − a)³/(12n²) < ${es}  ⇒  n > √(K(b − a)³/(12·${es})) = √(${D(u.K, 5)}·${D(Math.pow(L, 3), 5)}/${D(12 * p.eps, 6)}) ≈ ${D(raw, 3)}.\nSmallest integer: n = ${nn}.`));
    } else {
      s.push(tx(`── 7) Hata sınırı ──\nf⁗(x) = ${u.d4S}. ${u.mw[0]}: M = ${u.MS} ≈ ${D(u.M, 5)}.\n|E_S| ≤ M(b − a)⁵/(180n⁴) = ${D(u.M, 5)}·${D(L, 5)}⁵/(180·${n}⁴) = ${G(bd)}.\nGerçek hata ${G(Math.abs(err))} ≤ ${G(bd)} ✓.`,
        `── 7) Error bound ──\nf⁗(x) = ${u.d4S}. ${u.mw[1]}: M = ${u.MS} ≈ ${D(u.M, 5)}.\n|E_S| ≤ M(b − a)⁵/(180n⁴) = ${D(u.M, 5)}·${D(L, 5)}⁵/(180·${n}⁴) = ${G(bd)}.\nThe actual error ${G(Math.abs(err))} ≤ ${G(bd)} ✓.`));
      s.push(tx(`── 8) Hata < ${es} için kaç parça? ──\nM(b − a)⁵/(180n⁴) < ${es}  ⇒  n > (M(b − a)⁵/(180·${es}))^(1/4) = (${D(u.M, 5)}·${D(Math.pow(L, 5), 5)}/${D(180 * p.eps, 5)})^(1/4) ≈ ${D(raw, 3)}.\nn ÇİFT olmalı: en küçük çift tam sayı n = ${nn}.`,
        `── 8) How many pieces for error < ${es}? ──\nM(b − a)⁵/(180n⁴) < ${es}  ⇒  n > (M(b − a)⁵/(180·${es}))^(1/4) = (${D(u.M, 5)}·${D(Math.pow(L, 5), 5)}/${D(180 * p.eps, 5)})^(1/4) ≈ ${D(raw, 3)}.\nn must be EVEN: smallest even integer n = ${nn}.`));
    }
    const alt = m === 0 ? trapAlt(u.f, u.a, u.b, n) : simpAlt(u.f, u.a, u.b, n);
    s.push(tx(`── 9) Sayısal kontrol ──\n${m === 0 ? 'Tₙ = (Lₙ + Rₙ)/2 (sol ve sağ toplamların ortalaması)' : `Sₙ = (T${sub(n / 2)} + 2M${sub(n / 2)})/3 (yamuk ve orta nokta toplamlarından)`} = ${D(alt, 5)}; aynı ✓. Hatanın gerçekten sınırın altında kaldığı da doğrulandı.`,
      `── 9) Numerical check ──\n${m === 0 ? 'Tₙ = (Lₙ + Rₙ)/2 (average of the left and right sums)' : `Sₙ = (T${sub(n / 2)} + 2M${sub(n / 2)})/3 (from trapezoid and midpoint sums)`} = ${D(alt, 5)}; the same ✓. The error is indeed below the bound.`));
    return s;
  }

  function draw(canvas, p) {
    norm(p);
    const u = FUNS[p.fi], f = safe(u.f), n = p.n, m = p.m, L = u.b - u.a, h = L / n;
    let top = 0;
    for (let i = 0; i <= 200; i++) { const v = f(u.a + L * i / 200); if (isFinite(v)) top = Math.max(top, v); }
    canvas.setViewport(u.a - 0.12 * L, u.b + 0.12 * L, -0.1 * top, 1.18 * top);
    const xs = [], ys = [];
    for (let i = 0; i <= n; i++) { xs.push(u.a + i * h); ys.push(u.f(xs[i])); }
    canvas.addFilledArea({ evaluator: f, xMin: u.a, xMax: u.b, color: rgba(canvas.accent(), 0.12), samples: 200 });
    const col = canvas.orange();
    if (m === 0) {
      for (let i = 0; i < n; i++) {
        const x0 = xs[i], x1 = xs[i + 1], y0 = ys[i], y1 = ys[i + 1];
        canvas.addFilledArea({ evaluator: safe((x) => y0 + (y1 - y0) * (x - x0) / h), xMin: x0, xMax: x1, color: rgba(col, 0.4), samples: 4 });
        canvas.addSegment({ x1: x0, y1: 0, x2: x0, y2: y0, color: col, thickness: 1 });
        canvas.addSegment({ x1: x0, y1: y0, x2: x1, y2: y1, color: col, thickness: 1.5 });
      }
    } else {
      for (let i = 0; i < n; i += 2) {
        const x0 = xs[i], x2 = xs[i + 2], y0 = ys[i], y1 = ys[i + 1], y2 = ys[i + 2];
        const par = safe((x) => { const t = (x - x0) / h; return y0 * (t - 1) * (t - 2) / 2 - y1 * t * (t - 2) + y2 * t * (t - 1) / 2; });
        canvas.addFilledArea({ evaluator: par, xMin: x0, xMax: x2, color: rgba(col, 0.4), samples: 24 });
        canvas.addFunction({ evaluator: (x) => (x >= x0 && x <= x2 ? par(x) : NaN), color: col, thickness: 2 });
        canvas.addSegment({ x1: x0, y1: 0, x2: x0, y2: y0, color: col, thickness: 1 });
      }
    }
    canvas.addSegment({ x1: xs[n], y1: 0, x2: xs[n], y2: ys[n], color: col, thickness: 1 });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
    for (let i = 0; i <= n; i++) canvas.addMarker({ x: xs[i], y: ys[i], color: canvas.gold(), radius: 3 });
    const val = rule(u.f, u.a, u.b, n, m);
    canvas.addMarker({ x: (u.a + u.b) / 2, y: 0, color: canvas.gold(), shape: 'diamond', radius: 7, label: `${SYM(m)} = ${D(val, 5)}   I = ${D(u.I, 5)}` });
  }

  const concept = () => tx(
    `SAYISAL İNTEGRAL

FİKİR
Her fonksiyonun ters türevi kapalı biçimde yazılamaz (örneğin e^(−x²) ya da √(1 + x³)); bazen f yalnızca bir ölçüm tablosuyla bilinir. Bu durumda ∫ₐᵇ f(x) dx integralini, eğrinin altındaki alanı basit şekillerin alanlarıyla toplayarak yaklaşık hesaplarız ve hatayı bir formülle denetleriz.

KURULUM
[a, b] aralığını n eşit parçaya böleriz: h = (b − a)/n, xᵢ = a + i·h (i = 0 … n).

YÖNTEMLER
• YAMUK KURALI (Tₙ): her parçada eğriyi kirişle değiştirir, yamukların alanlarını toplarız.
  Tₙ = (h/2)·[f(x₀) + 2f(x₁) + 2f(x₂) + … + 2f(xₙ₋₁) + f(xₙ)]   (ağırlıklar 1, 2, 2, …, 2, 1)
• SIMPSON KURALI (Sₙ, n ÇİFT): ardışık iki parçada eğriyi üç noktadan geçen parabolle değiştiririz.
  Sₙ = (h/3)·[f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + … + 2f(xₙ₋₂) + 4f(xₙ₋₁) + f(xₙ)]   (ağırlıklar 1, 4, 2, 4, …, 4, 1)

HATA SINIRLARI
[a, b] üzerinde f″ ve f⁗ sürekli olsun; |f″| ≤ K ve |f⁗| ≤ M olsun. O zaman
  |E_T| ≤ K(b − a)³/(12n²),    |E_S| ≤ M(b − a)⁵/(180n⁴).
Yamuk hatası 1/n² gibi, Simpson hatası 1/n⁴ gibi azalır: n iki katına çıkınca yamuk hatası yaklaşık 4 kat, Simpson hatası yaklaşık 16 kat küçülür. Simpson kuralı üçüncü dereceye kadar her polinom için TAMDIR (f⁗ = 0).

KAÇ PARÇA GEREKİR?
Hata ε'dan küçük istenirse, sınırı ε'dan küçük yapan en küçük n seçilir:
  yamuk: n > √(K(b − a)³/(12ε)),   Simpson: n > (M(b − a)⁵/(180ε))^(1/4) ve n çift.

YÖNTEM
1. h = (b − a)/n değerini ve düğümleri xᵢ yaz.
2. f(xᵢ) değerlerini hesapla ve ağırlıklarla çarp.
3. Toplamı (h/2) ya da (h/3) ile çarp.
4. Gerekirse K ya da M değerini bulmak için f″ ya da f⁗'nin [a, b] üzerindeki en büyük mutlak değerini hesapla.

TUZAKLAR
• Simpson için n tek olamaz; ağırlıklar 4, 2, 4, 2 … biçiminde değişir ve uçlar 1 alır.
• Yamukta uç noktalar 1, ortadakiler 2 ağırlıkla girer; hepsine 1 vermek sol toplamı verir.
• Yamuk için çarpan h/2, Simpson için h/3'tür.
• K ve M, f″ ve f⁗'nin [a, b] üzerindeki en büyük MUTLAK değeridir (çoğu kez uç noktalardan birinde, ama sin x örneğinde iç noktada).
• Hata sınırı gerçek hata değildir; yalnızca bir üst sınırdır.

MİNİ ÖRNEK
f = x², [0, 2], n = 4, h = 0,5: f değerleri 0; 0,25; 1; 2,25; 4. T₄ = 0,25·(0 + 0,5 + 2 + 4,5 + 4) = 2,75. S₄ = (0,5/3)·(0 + 1 + 2 + 9 + 4) = 8/3. Gerçek değer 8/3: Simpson ikinci derece için tam; yamuk hatası 2,75 − 8/3 = 1/12 = K(b − a)³/(12n²) = 2·8/192 ✓.`,
    `NUMERICAL INTEGRATION

IDEA
Not every function has an antiderivative in closed form (for example e^(−x²) or √(1 + x³)); sometimes f is known only from a table of measurements. Then we approximate ∫ₐᵇ f(x) dx by adding up areas of simple shapes under the curve, and we police the error with a formula.

SETUP
We cut [a, b] into n equal pieces: h = (b − a)/n, xᵢ = a + i·h (i = 0 … n).

METHODS
• TRAPEZOID RULE (Tₙ): on every piece we replace the curve by a chord and add the areas of the trapezoids.
  Tₙ = (h/2)·[f(x₀) + 2f(x₁) + 2f(x₂) + … + 2f(xₙ₋₁) + f(xₙ)]   (weights 1, 2, 2, …, 2, 1)
• SIMPSON'S RULE (Sₙ, n EVEN): on every pair of neighbouring pieces we replace the curve by the parabola through three points.
  Sₙ = (h/3)·[f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + … + 2f(xₙ₋₂) + 4f(xₙ₋₁) + f(xₙ)]   (weights 1, 4, 2, 4, …, 4, 1)

ERROR BOUNDS
Let f″ and f⁗ be continuous on [a, b], with |f″| ≤ K and |f⁗| ≤ M. Then
  |E_T| ≤ K(b − a)³/(12n²),    |E_S| ≤ M(b − a)⁵/(180n⁴).
The trapezoid error falls like 1/n², the Simpson error like 1/n⁴: doubling n divides the trapezoid error by about 4 and the Simpson error by about 16. Simpson's rule is EXACT for every polynomial up to degree three (f⁗ = 0).

HOW MANY PIECES ARE NEEDED?
If the error must be below ε, we choose the smallest n whose bound is below ε:
  trapezoid: n > √(K(b − a)³/(12ε)),   Simpson: n > (M(b − a)⁵/(180ε))^(1/4) and n even.

METHOD
1. Write h = (b − a)/n and the nodes xᵢ.
2. Compute the values f(xᵢ) and multiply them by the weights.
3. Multiply the sum by (h/2) or (h/3).
4. If needed, find K or M as the largest absolute value of f″ or f⁗ on [a, b].

PITFALLS
• For Simpson n cannot be odd; the weights alternate 4, 2, 4, 2 … and the ends get 1.
• In the trapezoid rule the end points get weight 1, the inner ones weight 2; giving all of them 1 gives the left sum.
• The factor is h/2 for the trapezoid rule and h/3 for Simpson's rule.
• K and M are the largest ABSOLUTE values of f″ and f⁗ on [a, b] (often at an end point, but at an inner point for sin x).
• The error bound is not the actual error; it is only an upper limit.

MINI EXAMPLE
f = x², [0, 2], n = 4, h = 0.5: f values 0; 0.25; 1; 2.25; 4. T₄ = 0.25·(0 + 0.5 + 2 + 4.5 + 4) = 2.75. S₄ = (0.5/3)·(0 + 1 + 2 + 9 + 4) = 8/3. The exact value is 8/3: Simpson is exact for quadratics; the trapezoid error 2.75 − 8/3 = 1/12 = K(b − a)³/(12n²) = 2·8/192 ✓.`);

  let forced = null, fnSel = null, mRg = null, eRg = null, sn = null;
  function createProblem(rng) {
    const fi = rng.nextInt(0, FUNS.length), m = rng.nextInt(0, 2), n = rng.pick([4, 5, 6, 8, 10]), eps = rng.pick(EPS);
    const p = norm({ fi: forced && forced.fi !== undefined ? forced.fi : fi, m: forced && forced.m !== undefined ? forced.m : m, n, eps });
    verify(p);
    if (fnSel) fnSel.refreshFromModel();
    if (mRg) mRg.refreshFromModel();
    if (eRg) eRg.refreshFromModel();
    return p;
  }
  const linkMake = (o) => (rng) => { forced = o; try { return createProblem(rng); } finally { forced = null; } };

  function syncReg(reg) {
    if (!reg) return;
    const v = reg.get();
    reg.valueLabel.textContent = fmt2(v);
    reg.input.value = String(Math.max(0, Math.min(1000, Math.round((v - reg.min) / (reg.max - reg.min) * 1000))));
  }
  function buildControls(rightCol, getProblem, h) {
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); };
    lab(tx('Fonksiyon ve aralık', 'Function and interval'));
    fnSel = h.addSelect({
      options: FUNS.map((u, i) => ({ label: `f(x) = ${u.eq},  [${u.aS}, ${u.bS}]`, value: i })),
      get: () => getProblem().fi, set: (v) => { getProblem().fi = Number(v); },
    });
    lab(tx('Yöntem', 'Method'));
    mRg = h.addRadioGroup({
      name: 'niMethod', options: METH().map((label, value) => ({ label, value })),
      get: () => getProblem().m, set: (v) => { const p = getProblem(); p.m = Number(v); norm(p); syncReg(sn); },
    });
    sn = h.addSlider({ caption: tx('Parça sayısı (n; Simpson için çift)', 'Number of pieces (n; even for Simpson)'), min: 1, max: NMAX, step: 1,
      get: () => norm(getProblem()).n, set: (v) => { const p = getProblem(); p.n = Math.round(v); norm(p); } });
    lab(tx('İstenen hata sınırı ε', 'Required error bound ε'));
    eRg = h.addRadioGroup({
      name: 'niEps', options: EPSS.map((label, i) => ({ label, value: EPS[i] })),
      get: () => getProblem().eps, set: (v) => { getProblem().eps = Number(v); },
    });
  }

  Topics.register('calc2', {
    id: 'numericInt',
    tabTitle: () => tx('Sayısal İntegral: Yamuk ve Simpson', 'Numerical Integration: Trapezoid and Simpson'),
    concept, problemStatement, createProblem, solveSteps, draw, buildControls,
    focus: (p) => { norm(p); const u = FUNS[p.fi]; const y = u.f((u.a + u.b) / 2) / 2; return { x: (u.a + u.b) / 2, y: Number.isFinite(y) ? y : 0 }; },
    challenge: {
      prompt: (p) => { norm(p); const u = FUNS[p.fi]; return tx(`f(x) = ${u.eq} için [${u.aS}, ${u.bS}] aralığında n = ${p.n} parça ile ${METH()[p.m]} değeri ${SYM(p.m)} kaçtır? Önce h'yi, düğümleri ve f değerlerini yazıp hesap makinesiyle bulalım; 4 ondalık basamakla yazalım.`,
        `For f(x) = ${u.eq} on [${u.aS}, ${u.bS}] with n = ${p.n} pieces, what is the ${METH()[p.m]} value ${SYM(p.m)}? Let's write h, the nodes and the values of f first, use a calculator, and give 4 decimals.`); },
      target: (p) => { norm(p); const u = FUNS[p.fi]; return rule(u.f, u.a, u.b, p.n, p.m); },
      tol: (p) => { norm(p); const u = FUNS[p.fi]; return Math.max(5e-4, 1e-4 * Math.abs(rule(u.f, u.a, u.b, p.n, p.m))); },
      format: (v) => neg(v.toFixed(4)),
      hint: (p, g) => { norm(p); const u = FUNS[p.fi], t = rule(u.f, u.a, u.b, p.n, p.m);
        return tx(g > t ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > t ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.') + ' ' +
          tx(`h = ${D((u.b - u.a) / p.n, 4)}; ağırlıklar ${p.m === 0 ? '1, 2, …, 2, 1' : '1, 4, 2, …, 4, 1'}, çarpan ${p.m === 0 ? 'h/2' : 'h/3'}.`, `h = ${D((u.b - u.a) / p.n, 4)}; weights ${p.m === 0 ? '1, 2, …, 2, 1' : '1, 4, 2, …, 4, 1'}, factor ${p.m === 0 ? 'h/2' : 'h/3'}.`); },
    },
    links: [
      { match: /^• (YAMUK KURALI|TRAPEZOID RULE)/, make: linkMake({ m: 0 }) },
      { match: /^• (SIMPSON KURALI|SIMPSON'S RULE)/, make: linkMake({ m: 1 }) },
      { match: /^(HATA SINIRLARI|ERROR BOUNDS)$/, make: (rng) => linkMake({ m: rng.nextInt(0, 2) })(rng) },
      { match: /^(KAÇ PARÇA GEREKİR\?|HOW MANY PIECES ARE NEEDED\?)$/, make: (rng) => linkMake({ m: rng.nextInt(0, 2) })(rng) },
    ],
    _test: { FUNS, rule, trapAlt, simpAlt, midAlt, boundT, boundS, rawN, needN, norm, verify, weights },
  });

  // ---------------------------------------------------------------- quiz
  const Qd = (topic, text, correct, wrongs, notes, solution, rng, dec) => {
    const f = (v) => neg(v.toFixed(dec));
    const c = f(correct), seen = new Set([c]), ws = [], ns = [];
    wrongs.forEach((v, i) => { const s = f(v); if (!seen.has(s) && Number.isFinite(v)) { seen.add(s); ws.push(s); ns.push(notes && notes[i]); } });
    for (const d of dec === 0 ? [1, -1, 2, -2, 3] : [1.1, 0.9, 1.25, 0.8]) {
      if (ws.length >= 3) break;
      const s = f(dec === 0 ? correct + d : correct * d);
      if (!seen.has(s)) { seen.add(s); ws.push(s); ns.push(undefined); }
    }
    return makeQuestion(topic, text, c, ws, solution, rng, ns);
  };
  const T0 = () => tx('Sayısal İntegral: Yamuk ve Simpson', 'Numerical Integration: Trapezoid and Simpson');
  const QF = [
    { eq: 'x²', f: (x) => x * x, a: 0, bs: [2, 4], n: 4, I: (b) => b * b * b / 3 },
    { eq: 'x³', f: (x) => x * x * x, a: 0, bs: [2, 4], n: 4, I: (b) => Math.pow(b, 4) / 4 },
    { eq: '√x', f: Math.sqrt, a: 1, bs: [5, 9], n: 4, I: (b) => 2 / 3 * (Math.pow(b, 1.5) - 1) },
    { eq: '1/x', f: (x) => 1 / x, a: 1, bs: [3, 5], n: 4, I: (b) => Math.log(b) },
    { eq: 'eˣ', f: Math.exp, a: 0, bs: [1, 2], n: 4, I: (b) => Math.exp(b) - 1 },
  ];
  const pickQ = (rng) => { const q = rng.pick(QF), b = rng.pick(q.bs); return { q, b, n: q.n }; };
  const genT = (rng) => {
    const { q, b, n } = pickQ(rng), h = (b - q.a) / n, v = rule(q.f, q.a, b, n, 0);
    const lr = h * [0, 1, 2, 3].reduce((s, i) => s + q.f(q.a + i * h), 0), ss = rule(q.f, q.a, b, n, 1);
    return Qd(T0(), tx(`∫ f(x) dx integralini f(x) = ${q.eq}, [${q.a}, ${b}] üzerinde n = ${n} ile YAMUK kuralıyla (T${sub(n)}) yaklaşık hesaplayalım. Sonuç (3 ondalık) kaçtır?`, `Let's approximate ∫ f(x) dx for f(x) = ${q.eq} on [${q.a}, ${b}] with the TRAPEZOID rule using n = ${n} (T${sub(n)}). What is the result (3 decimals)?`),
      v, [2 * v, lr, ss, q.I(b)],
      [tx('Çarpan h/2 yerine h alınmış: sonuç iki katına çıkmış.', 'Factor h used instead of h/2: the result is doubled.'),
        tx('Sol uç toplamı: bütün ağırlıklar 1 alınıp son nokta unutulmuş.', 'Left sum: all weights taken as 1 and the last node forgotten.'),
        tx('Simpson ağırlıkları (1, 4, 2, 4, 1) kullanılmış.', 'Simpson weights (1, 4, 2, 4, 1) were used.'),
        tx('Tam integral değeri yamuk yaklaşımı sanılmış.', 'The exact integral was given as the trapezoid approximation.')],
      [tx(`h = (${b} − ${q.a})/${n} = ${D(h, 4)}.`, `h = (${b} − ${q.a})/${n} = ${D(h, 4)}.`),
        tx(`T${sub(n)} = (h/2)·[f(x₀) + 2f(x₁) + 2f(x₂) + 2f(x₃) + f(x₄)] = ${D(v, 3)}.`, `T${sub(n)} = (h/2)·[f(x₀) + 2f(x₁) + 2f(x₂) + 2f(x₃) + f(x₄)] = ${D(v, 3)}.`)], rng, 3);
  };
  genT.level = 2;
  const genS = (rng) => {
    const { q, b, n } = pickQ(rng), h = (b - q.a) / n, v = rule(q.f, q.a, b, n, 1), t = rule(q.f, q.a, b, n, 0);
    const wrongH = h * (q.f(q.a) + 4 * q.f(q.a + h) + 2 * q.f(q.a + 2 * h) + 4 * q.f(q.a + 3 * h) + q.f(b)) / 2, s2 = rule(q.f, q.a, b, 2, 1);
    return Qd(T0(), tx(`f(x) = ${q.eq} için [${q.a}, ${b}] üzerinde n = ${n} ile SIMPSON kuralı S${sub(n)} değeri (3 ondalık) kaçtır?`, `What is the SIMPSON value S${sub(n)} for f(x) = ${q.eq} on [${q.a}, ${b}] with n = ${n} (3 decimals)?`),
      v, [t, wrongH, s2, q.I(b) * 1.01 + 0.05],
      [tx('Yamuk kuralı kullanılmış.', 'The trapezoid rule was used.'), tx('Çarpan h/3 yerine h/2 alınmış.', 'Factor h/2 used instead of h/3.'), tx('Yalnızca iki parça (n = 2) kullanılmış.', 'Only two pieces (n = 2) were used.'), tx('Yakın ama yanlış bir değer.', 'Close but wrong.')],
      [tx(`h = ${D(h, 4)}; S${sub(n)} = (h/3)·[f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + f(x₄)].`, `h = ${D(h, 4)}; S${sub(n)} = (h/3)·[f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + f(x₄)].`),
        tx(`S${sub(n)} = ${D(v, 3)}.`, `S${sub(n)} = ${D(v, 3)}.`)], rng, 3);
  };
  genS.level = 2;
  const genBoundT = (rng) => {
    const u = FUNS[rng.nextInt(0, FUNS.length)], n = rng.pick([4, 5, 8, 10]), L = u.b - u.a, v = boundT(u, n);
    return Qd(T0(), tx(`f(x) = ${u.eq}, [${u.aS}, ${u.bS}] aralığında yamuk kuralının n = ${n} için hata sınırını K(b − a)³/(12n²) formülüyle bulalım (K = max|f″|; sonucu 4 ondalıkla yazalım). Sınır kaçtır?`,
      `For f(x) = ${u.eq} on [${u.aS}, ${u.bS}] let's find the trapezoid error bound for n = ${n} with K(b − a)³/(12n²) (K = max|f″|; give 4 decimals). What is the bound?`),
      v, [v * n, v / 2, u.K * L * L / (12 * n * n), u.M * Math.pow(L, 3) / (12 * n * n)],
      [tx('n² yerine n yazılmış.', 'n was used instead of n².'), tx('Paydada 12 yerine 24 kullanılmış.', '24 was used in place of 12 in the denominator.'), tx('(b − a)³ yerine (b − a)² alınmış.', '(b − a)² was used instead of (b − a)³.'), tx('K yerine f⁗ için M kullanılmış.', 'M (for f⁗) was used instead of K.')],
      [tx(`f″ = ${u.d2S}; ${u.kw[0]}: K = ${u.KS}.`, `f″ = ${u.d2S}; ${u.kw[1]}: K = ${u.KS}.`), tx(`|E_T| ≤ K(b − a)³/(12n²) = ${D(v, 4)}.`, `|E_T| ≤ K(b − a)³/(12n²) = ${D(v, 4)}.`)], rng, 4);
  };
  genBoundT.level = 2;
  const genNT = (rng) => {
    const u = FUNS[rng.nextInt(0, FUNS.length)], eps = rng.pick(EPS), es = EPSS[EPS.indexOf(eps)], nn = needN(u, 0, eps), raw = rawN(u, 0, eps), L = u.b - u.a;
    return Qd(T0(), tx(`f(x) = ${u.eq}, [${u.aS}, ${u.bS}] için yamuk kuralıyla hatanın ${es} değerinden küçük olması (hata sınırı formülüyle) garanti edilecekse en az kaç parça (n) gerekir? (K = ${u.KS})`,
      `For f(x) = ${u.eq} on [${u.aS}, ${u.bS}], at least how many pieces n does the trapezoid rule need to GUARANTEE (by the error-bound formula) an error below ${es}? (K = ${u.KS})`),
      nn, [Math.ceil(raw * raw), Math.max(1, Math.floor(raw)), Math.ceil(raw / 2), Math.ceil(raw * 2)],
      [tx('Karekök unutulmuş: n yerine n² çözülmüş.', 'The square root was forgotten: n² was solved instead of n.'), tx('Yukarı yuvarlamak yerine aşağı yuvarlanmış (sınır tutmaz).', 'Rounded down instead of up (the bound fails).'), tx('Paydadaki 12 hatalı kullanılmış.', 'The 12 in the denominator was misused.'), tx('İki katı alınmış.', 'Doubled.')],
      [tx(`K(b − a)³/(12n²) < ${es} ⇒ n > √(${u.KS}·${D(Math.pow(L, 3), 4)}/(12·${es})) ≈ ${D(raw, 3)}.`, `K(b − a)³/(12n²) < ${es} ⇒ n > √(${u.KS}·${D(Math.pow(L, 3), 4)}/(12·${es})) ≈ ${D(raw, 3)}.`), tx(`En küçük tam sayı n = ${nn}.`, `Smallest integer n = ${nn}.`)], rng, 0);
  };
  genNT.level = 3;
  const genNS = (rng) => {
    const u = FUNS[rng.nextInt(0, FUNS.length)], eps = rng.pick(EPS), es = EPSS[EPS.indexOf(eps)], nn = needN(u, 1, eps), raw = rawN(u, 1, eps), L = u.b - u.a;
    return Qd(T0(), tx(`f(x) = ${u.eq}, [${u.aS}, ${u.bS}] için Simpson kuralıyla hatanın ${es} değerinden küçük olması garanti edilecekse en az kaç (ÇİFT) parça n gerekir? (M = ${u.MS})`,
      `For f(x) = ${u.eq} on [${u.aS}, ${u.bS}], at least how many (EVEN) pieces n does Simpson's rule need to guarantee an error below ${es}? (M = ${u.MS})`),
      nn, [Math.ceil(raw), Math.ceil(raw * raw), nn + 2, Math.max(2, nn - 2)],
      [tx('Çift sayıya yuvarlanmamış (n tek kalmış).', 'Not rounded up to an even number (n left odd).'), tx('Dördüncü kök yerine karekök alınmış.', 'A square root was taken instead of the fourth root.'), tx('Bir sonraki çift sayı gereksiz alınmış.', 'The next even number was taken unnecessarily.'), tx('Bir önceki çift sayı yetmez: hata sınırı ε\'dan büyük kalır.', 'The previous even number is not enough: the bound stays above ε.')],
      [tx(`M(b − a)⁵/(180n⁴) < ${es} ⇒ n > (${u.MS}·${D(Math.pow(L, 5), 4)}/(180·${es}))^(1/4) ≈ ${D(raw, 3)}.`, `M(b − a)⁵/(180n⁴) < ${es} ⇒ n > (${u.MS}·${D(Math.pow(L, 5), 4)}/(180·${es}))^(1/4) ≈ ${D(raw, 3)}.`), tx(`n çift olmalı: n = ${nn}.`, `n must be even: n = ${nn}.`)], rng, 0);
  };
  genNS.level = 3;
  const genExact = (rng) => {
    const c = rng.nextInt(1, 5), b = rng.pick([2, 4]), v = c * Math.pow(b, 4) / 4, f3 = (x) => c * x * x * x, t2 = rule(f3, 0, b, 2, 0);
    return Qd(T0(), tx(`f(x) = ${c}x³ için ∫₀^${b} f(x) dx integralini n = 2 parçalı Simpson kuralıyla (S₂) hesaplayalım. Sonuç kaçtır?`, `Let's compute ∫₀^${b} f(x) dx for f(x) = ${c}x³ with Simpson's rule with n = 2 (S₂). What is the result?`),
      v, [t2, c * Math.pow(b, 4) / 3, c * Math.pow(b, 4) / 2, c * Math.pow(b, 3) / 3],
      [tx('Yamuk kuralı (T₂) kullanılmış.', 'The trapezoid rule (T₂) was used.'), tx('x³ yerine x² integrali alınmış (x⁴/3).', 'Integral of x² (x⁴/3) was used instead of x³.'), tx('Ters türevde 4 yerine 2 bölünmüş.', 'Divided by 2 instead of 4 in the antiderivative.'), tx('Kuvvet artırılmadan integral alınmış.', 'The power was not raised when integrating.')],
      [tx(`Simpson üçüncü dereceye kadar tamdır, bu yüzden S₂ = ∫₀^${b} ${c}x³ dx = ${c}·${b}⁴/4 = ${N2(v)}.`, `Simpson's rule is exact up to cubics, so S₂ = ∫₀^${b} ${c}x³ dx = ${c}·${b}⁴/4 = ${N2(v)}.`),
        tx(`Kontrol: h = ${b / 2}; S₂ = (h/3)·[f(0) + 4f(${b / 2}) + f(${b})] = ${N2(rule(f3, 0, b, 2, 1))}.`, `Check: h = ${b / 2}; S₂ = (h/3)·[f(0) + 4f(${b / 2}) + f(${b})] = ${N2(rule(f3, 0, b, 2, 1))}.`)], rng, 2);
  };
  genExact.level = 1;
  const genRatio = (rng) => {
    const simp = rng.nextInt(0, 2) === 1, n = rng.pick([4, 5, 10]), E0 = rng.pick([0.016, 0.032, 0.048, 0.08, 0.0064]);
    const v = E0 / (simp ? 16 : 4);
    return Qd(T0(), tx(`${simp ? 'Simpson' : 'Yamuk'} kuralıyla n = ${n} için hata ${E0} bulunmuştur. f yeterince düzgün ise n = ${2 * n} için hata yaklaşık kaç olur?`, `With ${simp ? "Simpson's" : 'the trapezoid'} rule and n = ${n} the error is ${E0}. If f is smooth enough, roughly what is the error for n = ${2 * n}?`),
      v, [E0 / 2, E0 / (simp ? 4 : 16), E0 / 8, E0 / 3],
      [tx('Hata 1/n gibi sanılmış (yalnızca yarıya iner).', 'The error was assumed to fall like 1/n (only halves).'), tx(simp ? 'Simpson hatası 1/n⁴ ile azalır (16 kat), 4 kat değil.' : 'Yamuk hatası 1/n² ile azalır (4 kat), 16 kat değil.', simp ? 'The Simpson error falls like 1/n⁴ (factor 16), not 4.' : 'The trapezoid error falls like 1/n² (factor 4), not 16.'), tx('Hata 1/n³ gibi sanılmış.', 'The error was assumed to fall like 1/n³.'), tx('Yanlış bir bölen.', 'A wrong divisor.')],
      [tx(`${simp ? 'Simpson' : 'Yamuk'} hatası ${simp ? '1/n⁴' : '1/n²'} ile azalır; n iki katına çıkınca hata ${simp ? '16' : '4'} kat küçülür.`, `The ${simp ? 'Simpson' : 'trapezoid'} error falls like ${simp ? '1/n⁴' : '1/n²'}; doubling n divides the error by ${simp ? '16' : '4'}.`), tx(`${E0}/${simp ? 16 : 4} = ${v}.`, `${E0}/${simp ? 16 : 4} = ${v}.`)], rng, 5);
  };
  genRatio.level = 1;
  window.Calc2Quiz.main.push(genT);
  window.Calc2Quiz.extra.push(genS, genBoundT, genNT, genNS, genExact, genRatio);
})();

// ======================================================================================================================
// 2) Improper integrals
// ======================================================================================================================
(function () {
  const K0 = Calc2, tx = K0.tx, sub = K0.sub, sup = K0.sup, neg = K0.neg, fr = K0.frac;
  const PI = Math.PI, INF = Infinity;
  const D = (v, k) => neg(v.toFixed(k));
  const Dn = (v) => (Math.abs(v) >= 1e5 ? neg(v.toExponential(2)) : D(v, 4));
  const rgba = (hex, a) => {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    return m ? `rgba(${parseInt(m[1].substr(0, 2), 16)},${parseInt(m[1].substr(2, 2), 16)},${parseInt(m[1].substr(4, 2), 16)},${a})` : hex;
  };
  const st = (n, htr, hen, btr, ben) => tx(`── ${n}) ${htr} ──\n${btr}`, `── ${n}) ${hen} ──\n${ben}`);
  // same text in both languages
  const st1 = (n, htr, hen, body) => st(n, htr, hen, body, body);

  // adaptive Simpson with a pre-split (independent numeric integral)
  function asr(f, a, b, fa, fm, fb, whole, tol, d) {
    const m = (a + b) / 2, lm = (a + m) / 2, rm = (m + b) / 2, flm = f(lm), frm = f(rm);
    const l = (m - a) / 6 * (fa + 4 * flm + fm), r = (b - m) / 6 * (fm + 4 * frm + fb), delta = l + r - whole;
    if (d <= 0 || Math.abs(delta) <= 15 * tol) return l + r + delta / 15;
    return asr(f, a, m, fa, flm, fm, l, tol / 2, d - 1) + asr(f, m, b, fm, frm, fb, r, tol / 2, d - 1);
  }
  function integ(f, a, b) {
    if (!(b > a)) return 0;
    const N = 32, geo = a > 0 && b / a > 50;
    let s = 0;
    for (let i = 0; i < N; i++) {
      const x0 = geo ? a * Math.pow(b / a, i / N) : a + (b - a) * i / N, x1 = geo ? a * Math.pow(b / a, (i + 1) / N) : a + (b - a) * (i + 1) / N;
      const fa = f(x0), fb = f(x1), fm = f((x0 + x1) / 2);
      s += asr(f, x0, x1, fa, fm, fb, (x1 - x0) / 6 * (fa + 4 * fm + fb), 1e-11, 28);
    }
    return s;
  }
  const num = (f, ranges) => ranges.reduce((s, r) => s + integ(f, r[0], r[1]), 0);

  const powTxt = (pv) => (pv === 1 ? '1/x' : pv === 0.5 ? '1/√x' : pv === 2 ? '1/x²' : pv === 3 ? '1/x³' : `1/x^(${fr(pv)})`);
  const expTxt = (a) => (a === 1 ? 'e^(−x)' : a === 0.5 ? 'e^(−x/2)' : `e^(−${a}x)`);
  const a2Txt = (a) => `1/(${a === 1 ? '1' : a * a}+x²)`;
  const lnTxt = (m) => (m === 0 ? 'ln x' : m === 1 ? 'x ln x' : `x${sup(m)} ln x`);
  const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };
  const piOver = (n, d) => { const g = gcd(n, d); n /= g; d /= g; return (n === 1 ? 'π' : `${n}π`) + (d === 1 ? '' : `/${d}`); };

  // comparison catalogue: f vs h on (lo, hi]; conv: f <= h and h converges; otherwise f >= h and h diverges
  const CMP = [
    { eq: '1/√(x³ + 1)', f: (x) => 1 / Math.sqrt(x * x * x + 1), h: (x) => Math.pow(x, -1.5), hS: '1/x^(3/2)', lo: 1, hi: INF, conv: true, hInt: 2, hIntS: '2',
      why: ['x ≥ 1 için x³ + 1 > x³ ⇒ √(x³ + 1) > x^(3/2) ⇒ 1/√(x³ + 1) < 1/x^(3/2)', 'for x ≥ 1: x³ + 1 > x³ ⇒ √(x³ + 1) > x^(3/2) ⇒ 1/√(x³ + 1) < 1/x^(3/2)'],
      hn: ['∫₁^∞ x^(−3/2) dx = lim[−2/√x]₁ᵇ = 2 (p = 3/2 > 1: yakınsak)', '∫₁^∞ x^(−3/2) dx = lim[−2/√x]₁ᵇ = 2 (p = 3/2 > 1: converges)'] },
    { eq: 'e^(−x²)', f: (x) => Math.exp(-x * x), h: (x) => Math.exp(-x), hS: 'e^(−x)', lo: 1, hi: INF, conv: true, hInt: Math.exp(-1), hIntS: '1/e',
      why: ['x ≥ 1 için x² ≥ x ⇒ −x² ≤ −x ⇒ e^(−x²) ≤ e^(−x)', 'for x ≥ 1: x² ≥ x ⇒ −x² ≤ −x ⇒ e^(−x²) ≤ e^(−x)'],
      hn: ['∫₁^∞ e^(−x) dx = lim[−e^(−x)]₁ᵇ = 1/e (yakınsak)', '∫₁^∞ e^(−x) dx = lim[−e^(−x)]₁ᵇ = 1/e (converges)'] },
    { eq: 'sin²x/x²', f: (x) => Math.pow(Math.sin(x), 2) / (x * x), h: (x) => 1 / (x * x), hS: '1/x²', lo: 1, hi: INF, conv: true, hInt: 1, hIntS: '1',
      why: ['0 ≤ sin²x ≤ 1 ⇒ 0 ≤ sin²x/x² ≤ 1/x²', '0 ≤ sin²x ≤ 1 ⇒ 0 ≤ sin²x/x² ≤ 1/x²'],
      hn: ['∫₁^∞ x⁻² dx = 1 (p = 2 > 1: yakınsak)', '∫₁^∞ x⁻² dx = 1 (p = 2 > 1: converges)'] },
    { eq: '(2 + cos x)/x', f: (x) => (2 + Math.cos(x)) / x, h: (x) => 1 / x, hS: '1/x', lo: 1, hi: INF, conv: false,
      why: ['2 + cos x ≥ 1 ⇒ (2 + cos x)/x ≥ 1/x', '2 + cos x ≥ 1 ⇒ (2 + cos x)/x ≥ 1/x'],
      hn: ['∫₁^∞ dx/x = lim ln b = ∞ (p = 1 ≤ 1: ıraksak)', '∫₁^∞ dx/x = lim ln b = ∞ (p = 1 ≤ 1: diverges)'] },
    { eq: '1/√(x − 1)', f: (x) => (x > 1 ? 1 / Math.sqrt(x - 1) : NaN), h: (x) => 1 / Math.sqrt(x), hS: '1/√x', lo: 2, hi: INF, conv: false,
      why: ['x − 1 < x ⇒ √(x − 1) < √x ⇒ 1/√(x − 1) > 1/√x', 'x − 1 < x ⇒ √(x − 1) < √x ⇒ 1/√(x − 1) > 1/√x'],
      hn: ['∫₂^∞ x^(−1/2) dx = lim 2(√b − √2) = ∞ (p = 1/2 ≤ 1: ıraksak)', '∫₂^∞ x^(−1/2) dx = lim 2(√b − √2) = ∞ (p = 1/2 ≤ 1: diverges)'] },
    { eq: '1/(x + √x)', f: (x) => 1 / (x + Math.sqrt(x)), h: (x) => 1 / (2 * x), hS: '1/(2x)', lo: 1, hi: INF, conv: false,
      why: ['x ≥ 1 için √x ≤ x ⇒ x + √x ≤ 2x ⇒ 1/(x + √x) ≥ 1/(2x)', 'for x ≥ 1: √x ≤ x ⇒ x + √x ≤ 2x ⇒ 1/(x + √x) ≥ 1/(2x)'],
      hn: ['∫₁^∞ dx/(2x) = lim (ln b)/2 = ∞ (p = 1: ıraksak)', '∫₁^∞ dx/(2x) = lim (ln b)/2 = ∞ (p = 1: diverges)'] },
    { eq: 'x/(x³ + 1)', f: (x) => x / (x * x * x + 1), h: (x) => 1 / (x * x), hS: '1/x²', lo: 1, hi: INF, conv: true, hInt: 1, hIntS: '1',
      why: ['x³ + 1 > x³ ⇒ x/(x³ + 1) < x/x³ = 1/x²', 'x³ + 1 > x³ ⇒ x/(x³ + 1) < x/x³ = 1/x²'],
      hn: ['∫₁^∞ x⁻² dx = 1 (p = 2 > 1: yakınsak)', '∫₁^∞ x⁻² dx = 1 (p = 2 > 1: converges)'] },
    { eq: '1/√(x + x³)', f: (x) => (x > 0 ? 1 / Math.sqrt(x + x * x * x) : NaN), h: (x) => (x > 0 ? 1 / Math.sqrt(x) : NaN), hS: '1/√x', lo: 0, hi: 1, conv: true, hInt: 2, hIntS: '2',
      why: ['0 < x ≤ 1 için x + x³ > x ⇒ 1/√(x + x³) < 1/√x', 'for 0 < x ≤ 1: x + x³ > x ⇒ 1/√(x + x³) < 1/√x'],
      hn: ['∫₀¹ x^(−1/2) dx = lim 2(1 − √ε) = 2 (p = 1/2 < 1: yakınsak)', '∫₀¹ x^(−1/2) dx = lim 2(1 − √ε) = 2 (p = 1/2 < 1: converges)'] },
    { eq: '1/(x + x²)', f: (x) => (x > 0 ? 1 / (x + x * x) : NaN), h: (x) => (x > 0 ? 1 / (2 * x) : NaN), hS: '1/(2x)', lo: 0, hi: 1, conv: false,
      why: ['0 < x ≤ 1 için x² ≤ x ⇒ x + x² ≤ 2x ⇒ 1/(x + x²) ≥ 1/(2x)', 'for 0 < x ≤ 1: x² ≤ x ⇒ x + x² ≤ 2x ⇒ 1/(x + x²) ≥ 1/(2x)'],
      hn: ['∫₀¹ dx/(2x) = lim (−ln ε)/2 = ∞ (p = 1 ≥ 1: ıraksak)', '∫₀¹ dx/(2x) = lim (−ln ε)/2 = ∞ (p = 1 ≥ 1: diverges)'] },
  ];
  const cmpI = (c) => (c.hi === INF ? `∫${sub(c.lo)}^∞ ${c.eq} dx` : `∫${sub(c.lo)}${sup(c.hi)} ${c.eq} dx`);

  const PAR = { 0: [0.5, 2 / 3, 1, 4 / 3, 1.5, 2, 3], 1: [1, 2, 3, 4, 0.5], 2: [1, 2, 3], 3: [1, 2, 3], 4: [0.5, 1 / 3, 2 / 3, 0.75, 1, 1.5, 2], 5: [0, 1, 2, 3], 6: [1, 4, 9, 16], 7: [1, 2, 3] };
  const KINDS = 10;

  // everything the tab needs to know about one example
  function spec(p) {
    const k = p.kind, q = p.par, s = { kind: k, cmp: null, asym: 0 };
    const inf = (lo, both) => {
      s.inf = true; s.lo = lo; s.hi = INF;
      s.ranges = both ? (B) => [[-B, B]] : (B) => [[lo, B]];
      s.qr = s.ranges; s.cuts = [10, 100, 1000]; s.ext = [1e6, 1e12, 1e30];
      s.tmin = (both ? 0 : lo) + 0.5; s.tmax = 20; s.tstep = 0.5; s.tdefs = [2, 3, 4, 5];
      s.vx = [both ? -22 : lo - 1.5, 22]; s.chT = 10;
    };
    const sing = (lo, hi, ranges, vx, vy, qr) => {
      s.inf = false; s.lo = lo; s.hi = hi; s.ranges = ranges; s.qr = qr || ranges;
      s.cuts = [0.1, 0.01, 0.001]; s.ext = [1e-6, 1e-12, 1e-30];
      s.tmin = 0.3; s.tmax = 3; s.tstep = 0.1; s.tdefs = [0.5, 1, 1.5]; s.vx = vx; s.vy = vy; s.chT = 0.01;
    };
    switch (k) {
      case 0: {
        const pv = q.p; inf(1, false); s.conv = pv > 1; s.val = s.conv ? 1 / (pv - 1) : null; s.valS = s.conv ? fr(1 / (pv - 1)) : null;
        s.f = (x) => (x >= 1 ? Math.pow(x, -pv) : NaN); s.eq = powTxt(pv); s.I = `∫₁^∞ ${s.eq} dx`;
        s.F = (B) => (pv === 1 ? Math.log(B) : (Math.pow(B, 1 - pv) - 1) / (1 - pv)); s.vy = [-0.2, 1.3];
        break;
      }
      case 1: {
        const a = q.a; inf(0, false); s.conv = true; s.val = 1 / a; s.valS = fr(1 / a);
        s.f = (x) => (x >= 0 ? Math.exp(-a * x) : NaN); s.eq = expTxt(a); s.I = `∫₀^∞ ${s.eq} dx`;
        s.F = (B) => (1 - Math.exp(-a * B)) / a; s.vy = [-0.2, 1.3];
        break;
      }
      case 2: {
        const a = q.a; inf(0, false); s.conv = true; s.val = PI / (2 * a); s.valS = piOver(1, 2 * a);
        s.f = (x) => (x >= 0 ? 1 / (a * a + x * x) : NaN); s.eq = a2Txt(a); s.I = `∫₀^∞ ${s.eq} dx`;
        s.F = (B) => Math.atan(B / a) / a; s.vy = [-0.2 / (a * a), 1.3 / (a * a)];
        break;
      }
      case 3: {
        const a = q.a; inf(-INF, true); s.conv = true; s.val = PI / a; s.valS = piOver(1, a);
        s.f = (x) => 1 / (a * a + x * x); s.eq = a2Txt(a); s.I = `∫_{−∞}^{∞} ${s.eq} dx`;
        s.F = (B) => 2 * Math.atan(B / a) / a; s.vy = [-0.2 / (a * a), 1.3 / (a * a)];
        break;
      }
      case 4: {
        const pv = q.p; sing(0, 1, (e) => [[e, 1]], [-0.1, 1.1], [-1, 8]); s.conv = pv < 1; s.val = s.conv ? 1 / (1 - pv) : null; s.valS = s.conv ? fr(1 / (1 - pv)) : null;
        s.f = (x) => (x > 0 ? Math.pow(x, -pv) : NaN); s.eq = powTxt(pv); s.I = `∫₀¹ ${s.eq} dx`;
        s.F = (e) => (pv === 1 ? -Math.log(e) : (1 - Math.pow(e, 1 - pv)) / (1 - pv));
        break;
      }
      case 5: {
        const m = q.m, c = m + 1; sing(0, 1, (e) => [[e, 1]], [-0.1, 1.1], [-6, 1.5]); s.conv = true; s.val = -1 / (c * c); s.valS = fr(-1 / (c * c));
        s.f = (x) => (x > 0 ? Math.pow(x, m) * Math.log(x) : NaN); s.eq = lnTxt(m); s.I = `∫₀¹ ${s.eq} dx`;
        const Fa = (x) => Math.pow(x, c) * (Math.log(x) / c - 1 / (c * c)); s.F = (e) => Fa(1) - Fa(e);
        break;
      }
      case 6: {
        const c = q.c; sing(0, c, (e) => [[e, c]], [-0.1 * c, 1.1 * c], [-1, 8]); s.conv = true; s.val = 2 * Math.sqrt(c); s.valS = String(2 * Math.sqrt(c));
        s.f = (x) => (x > 0 ? 1 / Math.sqrt(x) : NaN); s.eq = '1/√x'; s.I = `∫₀^${c} ${s.eq} dx`;
        s.F = (e) => 2 * Math.sqrt(c) - 2 * Math.sqrt(e);
        break;
      }
      case 7: {
        const a = q.a; sing(0, a, (e) => [[0, a - e]], [-0.1 * a, 1.1 * a], [-1, 8]); s.conv = true; s.val = PI / 2; s.valS = 'π/2';
        s.f = (x) => (x < a && x >= 0 ? 1 / Math.sqrt(a * a - x * x) : NaN); s.eq = `1/√(${a === 1 ? '1' : a * a} − x²)`; s.I = `∫₀^${a} ${s.eq} dx`;
        s.F = (e) => Math.asin((a - e) / a); s.cutAt = (e) => a - e; s.asym = a;
        break;
      }
      case 8: {
        const c = q.c, qq = q.q; sing(-c, c, (e) => [[e, c], [-c, -e]], [-1.1 * c, 1.1 * c], [-8, 8], (e) => [[e, c]]); s.conv = false; s.val = null; s.valS = null;
        s.f = (x) => (x !== 0 ? 1 / Math.pow(x, qq) : NaN); s.eq = qq === 1 ? '1/x' : '1/x²'; s.I = `∫_{−${c}}^{${c}} ${s.eq} dx`;
        s.F = (e) => (qq === 1 ? Math.log(c / e) : 1 / e - 1 / c);
        break;
      }
      default: {
        const c = CMP[q.ci]; s.conv = c.conv; s.val = null; s.valS = null; s.eq = c.eq;
        if (c.hi === INF) { inf(c.lo, false); s.vy = [-0.2, 1.3]; } else { sing(0, 1, (e) => [[e, 1]], [-0.1, 1.1], [-1, 8]); }
        s.cmp = c; s.f = c.f; s.hf = c.h; s.I = cmpI(c); s.F = null; s.lo = c.lo; s.hi = c.hi;
        break;
      }
    }
    s.cut = (pp) => (s.inf ? pp.t : Math.pow(10, -pp.t));
    s.area = (c, f) => num(f || s.f, s.qr(c));
    return s;
  }

  // ---- verification (memoised per kind + parameters) ----
  const okK = new Set();
  function verify(p) {
    const key = p.kind + ':' + JSON.stringify(p.par);
    if (okK.has(key)) return;
    const s = spec(p), fail = (m) => { throw new Error('improper ' + key + ': ' + m); };
    if (s.F) {
      s.cuts.forEach((c) => {
        const a = s.area(c), b = s.F(c);
        if (Math.abs(a - b) > 1e-6 * (1 + Math.abs(b))) fail('closed form ' + b + ' vs numeric ' + a + ' at cut ' + c);
      });
      const e = s.ext.map(s.F);
      if (s.conv) { if (Math.abs(e[2] - s.val) > 1e-6) fail('limit ' + e[2] + ' vs value ' + s.val); }
      else if (!(e[0] > 10 && e[1] > e[0] && e[2] > e[1])) fail('does not diverge: ' + e.join(','));
    } else {
      const c = s.cmp, up = c.conv;
      for (let i = 1; i <= 300; i++) {
        const x = c.hi === INF ? c.lo + 1e-6 + Math.pow(1.04, i) - 1 : Math.pow(10, -6 + 6 * i / 300);
        const fv = c.f(x), hv = c.h(x);
        if (!(up ? fv <= hv * (1 + 1e-12) : fv >= hv * (1 - 1e-12)) || !(fv >= 0)) fail('inequality fails at ' + x);
      }
      s.cuts.forEach((cc) => {
        const af = s.area(cc), ah = s.area(cc, c.h);
        if (up ? af > ah + 1e-7 : af < ah - 1e-7) fail('partial areas violate the comparison');
        if (up && af > c.hInt + 1e-7) fail('partial area above bound');
      });
      if (up) { if (Math.abs(s.area(c.hi === INF ? 1e5 : 1e-9, c.h) - c.hInt) > 1e-1) fail('hInt wrong'); }
      else if (!(s.area(c.hi === INF ? 1e6 : 1e-12, c.h) > 5)) fail('h does not diverge');
    }
    okK.add(key);
  }

  function norm(p) {
    p.kind = Math.max(0, Math.min(KINDS - 1, Math.round(p.kind)));
    const s = spec(p);
    p.t = Math.max(s.tmin, Math.min(s.tmax, p.t));
    return p;
  }

  function problemStatement(p) {
    norm(p); const s = spec(p);
    if (s.cmp) return tx(`${s.I} integralinin yakınsak mı ıraksak mı olduğunu, integrali hesaplamadan, uygun bir karşılaştırma fonksiyonu seçerek DOĞRUDAN KARŞILAŞTIRMA testiyle belirleyelim. Seçtiğimiz fonksiyonun integrali hakkında ne söyleyebiliriz?`,
      `Let's decide whether ${s.I} converges or diverges WITHOUT evaluating it, by choosing a suitable comparison function and using the DIRECT COMPARISON test. What can we say about the integral of the function we choose?`);
    if (p.kind === 8) return tx(`${s.I} integralini inceleyelim: integrand x = 0 noktasında (aralığın içinde) sonsuza gider. İntegralin yakınsak olup olmadığını limitlerle belirleyelim; yakınsaksa değerini bulalım.`,
      `Let's examine ${s.I}: the integrand blows up at x = 0, inside the interval. Let's decide with limits whether the integral converges and find its value if it does.`);
    return tx(`${s.I} genelleştirilmiş integralini bir limit olarak yazıp yakınsak mı ıraksak mı olduğunu belirleyelim; yakınsaksa değerini bulalım. Grafikte alanın ${s.inf ? 'üst sınır b' : 'kesim noktası ε'} değiştikçe nasıl davrandığını gözleyelim.`,
      `Let's write the improper integral ${s.I} as a limit and decide whether it converges or diverges; if it converges, let's find its value. On the graph let's watch how the area behaves as ${s.inf ? 'the upper limit b' : 'the cut-off ε'} changes.`);
  }

  function numLine(s) {
    if (s.cmp) {
      const c = s.cmp;
      const rows = s.cuts.map((cc) => `${s.inf ? 'b' : 'ε'} = ${cc}: A_f = ${Dn(s.area(cc))}, A_h = ${Dn(s.area(cc, c.h))}`).join('\n');
      return tx(`${rows}\nHer kesimde A_f ${c.conv ? '≤' : '≥'} A_h ✓ (karşılaştırma doğru).${c.conv ? ` Limit en çok ${c.hIntS} ≈ ${Dn(c.hInt)} olur.` : ' A_h sınırsız büyüdüğü için A_f de büyür.'}`,
        `${rows}\nAt every cut A_f ${c.conv ? '≤' : '≥'} A_h ✓ (the comparison holds).${c.conv ? ` The limit is at most ${c.hIntS} ≈ ${Dn(c.hInt)}.` : ' Since A_h grows without bound, so does A_f.'}`);
    }
    const rows = s.cuts.map((cc) => `${s.inf ? 'b' : 'ε'} = ${cc}: A = ${Dn(s.area(cc))}`).join(',  ');
    return tx(`Sayısal (Simpson) kesilmiş alanlar: ${rows}. Kapalı formülle aynı ✓.${s.conv ? ` Alan ${s.valS} ≈ ${Dn(s.val)} değerine oturuyor.` : ' Alan sınırsız büyüyor.'}${s.kind === 8 ? ' (A: yalnız sağ parça.)' : ''}`,
      `Numerical (Simpson) truncated areas: ${rows}. Same as the closed form ✓.${s.conv ? ` The area settles at ${s.valS} ≈ ${Dn(s.val)}.` : ' The area grows without bound.'}${s.kind === 8 ? ' (A: right piece only.)' : ''}`);
  }

  function solveSteps(p) {
    norm(p); const s = spec(p), q = p.par, k = p.kind, out = [];
    const V = s.valS, Vn = s.val === null ? '' : Dn(s.val), approx = s.conv && /[π√\/]/.test(V) ? ' ≈ ' + Vn : '';
    const verdict = s.conv ? tx(`YAKINSAK, değeri ${V}${approx}`, `CONVERGES, value ${V}${approx}`) : tx('IRAKSAK (alan sınırsız büyür)', 'DIVERGES (the area grows without bound)');
    if (s.cmp) {
      const c = s.cmp;
      out.push(st(1, 'Neden genelleştirilmiş?', 'Why improper?',
        `${s.I}: ${c.hi === INF ? 'üst sınır ∞' : 'integrand x = 0 noktasında sonsuza gider'}. Bu integrali elle hesaplamak zor ya da imkânsız; ama f ≥ 0 olduğundan KARŞILAŞTIRMA testi kullanılabilir.`,
        `${s.I}: ${c.hi === INF ? 'the upper limit is ∞' : 'the integrand blows up at x = 0'}. Evaluating it by hand is hard or impossible; but f ≥ 0, so the COMPARISON test applies.`));
      out.push(st(2, 'Karşılaştırma fonksiyonu', 'Comparison function',
        `Bildiğimiz bir integral seçelim: h(x) = ${c.hS}. ${c.why[0]}.\nYani aralıkta ${c.conv ? '0 ≤ f ≤ h' : '0 ≤ h ≤ f'}.`,
        `Let us pick a known integral: h(x) = ${c.hS}. ${c.why[1]}.\nSo on the interval ${c.conv ? '0 ≤ f ≤ h' : '0 ≤ h ≤ f'}.`));
      out.push(st(3, 'h\'nin integrali', 'The integral of h', c.hn[0], c.hn[1]));
      out.push(st(4, 'Sonuç', 'Conclusion',
        c.conv ? `0 ≤ f ≤ h ve ∫h yakınsak ⇒ ${s.I} YAKINSAKTIR; ayrıca değeri en çok ${c.hIntS} ≈ ${Dn(c.hInt)} (karşılaştırma testi değer vermez, yalnızca üst sınır verir).`
          : `0 ≤ h ≤ f ve ∫h ıraksak ⇒ ${s.I} IRAKSAKTIR.`,
        c.conv ? `0 ≤ f ≤ h and ∫h converges ⇒ ${s.I} CONVERGES; its value is at most ${c.hIntS} ≈ ${Dn(c.hInt)} (the comparison test gives no value, only an upper bound).`
          : `0 ≤ h ≤ f and ∫h diverges ⇒ ${s.I} DIVERGES.`));
      out.push(tx(`── 5) Sayısal kontrol ──\n${numLine(s)}`, `── 5) Numerical check ──\n${numLine(s)}`));
      return out;
    }
    if (k === 0) {
      const pv = q.p, e1 = fr(1 - pv);
      out.push(st(1, 'Neden genelleştirilmiş?', 'Why improper?', 'Üst sınır ∞ (sonsuz aralık). Tanım: ∫₁^∞ f dx = lim(b→∞) ∫₁ᵇ f dx; limit sonlu ise integral yakınsaktır.', 'The upper limit is ∞ (infinite interval). Definition: ∫₁^∞ f dx = lim(b→∞) ∫₁ᵇ f dx; if the limit is finite the integral converges.'));
      out.push(st1(2, 'Limit olarak yazalım', 'Write it as a limit', `${s.I} = lim(b→∞) ∫₁ᵇ x^(−${fr(pv)}) dx`));
      out.push(st1(3, 'Sonlu integrali hesaplayalım', 'Evaluate the finite integral',
        pv === 1 ? '∫₁ᵇ dx/x = [ln x]₁ᵇ = ln b.' : `∫₁ᵇ x^(−${fr(pv)}) dx = [x^(${e1})/(${e1})]₁ᵇ = (b^(${e1}) − 1)/(${e1}).`));
      out.push(st(4, 'Limiti alalım', 'Take the limit',
        pv === 1 ? 'b → ∞ iken ln b → ∞: limit sonlu değil.' : pv > 1 ? `1 − p = ${e1} < 0 olduğundan b → ∞ iken b^(${e1}) → 0. Limit = (0 − 1)/(${e1}) = ${V}.` : `1 − p = ${e1} > 0 olduğundan b → ∞ iken b^(${e1}) → ∞: limit sonlu değil.`,
        pv === 1 ? 'As b → ∞, ln b → ∞: the limit is not finite.' : pv > 1 ? `Since 1 − p = ${e1} < 0, b^(${e1}) → 0 as b → ∞. Limit = (0 − 1)/(${e1}) = ${V}.` : `Since 1 − p = ${e1} > 0, b^(${e1}) → ∞ as b → ∞: the limit is not finite.`));
      out.push(st(5, 'Hüküm ve p-testi', 'Verdict and the p-test', `${s.I}: ${verdict}.\np-testi: ∫₁^∞ dx/xᵖ, p > 1 için yakınsak, p ≤ 1 için ıraksaktır; burada p = ${fr(pv)}.`, `${s.I}: ${verdict}.\np-test: ∫₁^∞ dx/xᵖ converges for p > 1 and diverges for p ≤ 1; here p = ${fr(pv)}.`));
    } else if (k === 1) {
      const a = q.a, as = fr(a), ap = a === 1 ? '' : as;
      out.push(st(1, 'Neden genelleştirilmiş?', 'Why improper?', 'Üst sınır ∞ (sonsuz aralık): ∫₀^∞ f dx = lim(b→∞) ∫₀ᵇ f dx.', 'The upper limit is ∞ (infinite interval): ∫₀^∞ f dx = lim(b→∞) ∫₀ᵇ f dx.'));
      out.push(st1(2, 'Sonlu integral', 'The finite integral', `∫₀ᵇ ${s.eq} dx = [−e^(−${ap}x)/${as}]₀ᵇ = (1 − e^(−${ap}b))/${as}.`));
      out.push(st(3, 'Limit', 'The limit', `b → ∞ iken e^(−${ap}b) → 0 (a > 0). Limit = (1 − 0)/${as} = ${V}.`, `As b → ∞, e^(−${ap}b) → 0 (a > 0). Limit = (1 − 0)/${as} = ${V}.`));
      out.push(st(4, 'Hüküm', 'Verdict', `${s.I}: ${verdict}. Üstel azalma, her kuvvet azalmasından hızlıdır.`, `${s.I}: ${verdict}. Exponential decay beats every power decay.`));
    } else if (k === 2 || k === 3) {
      const a = q.a, a2 = a === 1 ? '1' : a * a;
      const ant = a === 1 ? 'arctan x' : `(1/${a}) arctan(x/${a})`, atb = a === 1 ? 'arctan b' : `(1/${a}) arctan(b/${a})`, pre = a === 1 ? '' : `(1/${a})·`;
      if (k === 2) {
        out.push(st1(1, 'Neden genelleştirilmiş?', 'Why improper?', '∫₀^∞ f dx = lim(b→∞) ∫₀ᵇ f dx (üst sınır ∞ / upper limit ∞).'));
        out.push(st(2, 'Sonlu integral', 'The finite integral', `∫ dx/(${a2}+x²) = ${ant}. Öyleyse ∫₀ᵇ = ${atb} − 0 = ${atb}.`, `∫ dx/(${a2}+x²) = ${ant}. So ∫₀ᵇ = ${atb} − 0 = ${atb}.`));
        out.push(st(3, 'Limit', 'The limit', `b → ∞ iken arctan(b${a === 1 ? '' : '/' + a}) → π/2. Limit = ${pre}π/2 = ${V}.`, `As b → ∞, arctan(b${a === 1 ? '' : '/' + a}) → π/2. Limit = ${pre}π/2 = ${V}.`));
        out.push(st(4, 'Hüküm', 'Verdict', `${s.I}: ${verdict}. Eğri yaklaşık 1/x² hızıyla (p = 2 > 1) söndüğü için alan sonludur.`, `${s.I}: ${verdict}. The curve decays like 1/x² (p = 2 > 1), so the area is finite.`));
      } else {
        out.push(st(1, 'İki sonsuz uç', 'Two infinite ends', 'İki sınır da sonsuz: ∫_{−∞}^{∞} f dx = ∫_{−∞}^0 f dx + ∫₀^∞ f dx. İki integralin HER BİRİ AYRI AYRI yakınsamalıdır (lim(b→∞) ∫₋ᵦᵇ f hesaplamak yeterli değildir).', 'Both limits are infinite: ∫_{−∞}^{∞} f dx = ∫_{−∞}^0 f dx + ∫₀^∞ f dx. EACH of the two integrals must converge separately (computing lim(b→∞) ∫₋ᵦᵇ f is not enough).'));
        out.push(st1(2, 'Sağ yarı', 'Right half', `∫₀^∞ dx/(${a2}+x²) = lim ${atb} = ${pre}π/2 = ${piOver(1, 2 * a)}.`));
        out.push(st(3, 'Sol yarı', 'Left half', `f çifttir, grafik y eksenine göre simetrik: ∫_{−∞}^0 = ∫₀^∞ = ${piOver(1, 2 * a)} (doğrudan: lim(c→−∞) [${ant}] c'den 0'a = ${pre}π/2).`, `f is even, the graph is symmetric about the y axis: ∫_{−∞}^0 = ∫₀^∞ = ${piOver(1, 2 * a)} (directly: lim(c→−∞) [${ant}] from c to 0 = ${pre}π/2).`));
        out.push(st(4, 'Toplam ve hüküm', 'Sum and verdict', `${piOver(1, 2 * a)} + ${piOver(1, 2 * a)} = ${V}.\n${s.I}: ${verdict}.`, `${piOver(1, 2 * a)} + ${piOver(1, 2 * a)} = ${V}.\n${s.I}: ${verdict}.`));
      }
    } else if (k === 4) {
      const pv = q.p, e1 = fr(1 - pv);
      out.push(st(1, 'Neden genelleştirilmiş?', 'Why improper?', 'Integrand x = 0 noktasında sonsuza gider (düşey asimptot). Tanım: ∫₀¹ f dx = lim(ε→0⁺) ∫_ε^1 f dx.', 'The integrand blows up at x = 0 (vertical asymptote). Definition: ∫₀¹ f dx = lim(ε→0⁺) ∫_ε^1 f dx.'));
      out.push(st1(2, 'Sonlu integral', 'The finite integral',
        pv === 1 ? '∫_ε^1 dx/x = [ln x]_ε^1 = −ln ε.' : `∫_ε^1 x^(−${fr(pv)}) dx = [x^(${e1})/(${e1})]_ε^1 = (1 − ε^(${e1}))/(${e1}).`));
      out.push(st(3, 'Limit', 'The limit',
        pv === 1 ? 'ε → 0⁺ iken −ln ε → ∞: limit sonlu değil.' : pv < 1 ? `1 − p = ${e1} > 0 olduğundan ε → 0⁺ iken ε^(${e1}) → 0. Limit = (1 − 0)/(${e1}) = ${V}.` : `1 − p = ${e1} < 0 olduğundan ε → 0⁺ iken ε^(${e1}) → ∞: limit sonlu değil.`,
        pv === 1 ? 'As ε → 0⁺, −ln ε → ∞: the limit is not finite.' : pv < 1 ? `Since 1 − p = ${e1} > 0, ε^(${e1}) → 0 as ε → 0⁺. Limit = (1 − 0)/(${e1}) = ${V}.` : `Since 1 − p = ${e1} < 0, ε^(${e1}) → ∞ as ε → 0⁺: the limit is not finite.`));
      out.push(st(4, 'Hüküm ve p-testi', 'Verdict and the p-test', `${s.I}: ${verdict}.\np-testi: ∫₀¹ dx/xᵖ, p < 1 için yakınsak, p ≥ 1 için ıraksaktır; burada p = ${fr(pv)}.`, `${s.I}: ${verdict}.\np-test: ∫₀¹ dx/xᵖ converges for p < 1 and diverges for p ≥ 1; here p = ${fr(pv)}.`));
    } else if (k === 5) {
      const m = q.m, c = m + 1, xc = c === 1 ? 'x' : 'x' + sup(c), ec = c === 1 ? 'ε' : 'ε' + sup(c), cc = c * c;
      const xm = m === 0 ? '1' : m === 1 ? 'x' : 'x' + sup(m);
      out.push(st(1, 'Neden genelleştirilmiş?', 'Why improper?', 'ln x, x → 0⁺ iken −∞\'a gider: ∫₀¹ f dx = lim(ε→0⁺) ∫_ε^1 f dx.', 'ln x → −∞ as x → 0⁺: ∫₀¹ f dx = lim(ε→0⁺) ∫_ε^1 f dx.'));
      out.push(st1(2, 'Kısmi integrasyon', 'Integration by parts', `u = ln x, dv = ${xm} dx ⇒ du = dx/x, v = ${xc}/${c}.\n∫_ε^1 ${s.eq} dx = [${xc}·ln x/${c}]_ε^1 − (1/${c})∫_ε^1 ${m === 0 ? '1' : xm} dx = −${ec}·ln ε/${c} − (1 − ${ec})/${cc}.`.replace(/\/1(?=[\s·]|$)/g, '').replace('(1/1)', '1')));
      out.push(st(3, 'Limit', 'The limit', `ε → 0⁺ iken ${ec}·ln ε → 0 (kuvvet, logaritmadan baskındır; L'Hôpital: ln ε/ε^(−${c}) → 0) ve ${ec} → 0. Limit = 0 − (1 − 0)/${cc} = ${V}.`, `As ε → 0⁺, ${ec}·ln ε → 0 (a power beats the logarithm; L'Hôpital: ln ε/ε^(−${c}) → 0) and ${ec} → 0. Limit = 0 − (1 − 0)/${cc} = ${V}.`));
      out.push(st(4, 'Hüküm', 'Verdict', `${s.I}: ${verdict}. (Negatif değer: eğri x ekseninin altında kalır; işaretli alan.)`, `${s.I}: ${verdict}. (Negative value: the curve lies below the x axis; signed area.)`));
    } else if (k === 6) {
      const c = q.c, rc = Math.sqrt(c);
      out.push(st1(1, 'Neden genelleştirilmiş?', 'Why improper?', `1/√x, x = 0 noktasında sonsuza gider / blows up at x = 0: ∫₀^${c} f dx = lim(ε→0⁺) ∫_ε^${c} f dx.`));
      out.push(st1(2, 'Sonlu integral', 'The finite integral', `∫_ε^${c} x^(−1/2) dx = [2√x]_ε^${c} = 2√${c} − 2√ε = ${2 * rc} − 2√ε.`));
      out.push(st(3, 'Limit ve hüküm', 'Limit and verdict', `ε → 0⁺ iken 2√ε → 0: limit = ${V}.\n${s.I}: ${verdict}. (p = 1/2 < 1.)`, `As ε → 0⁺, 2√ε → 0: limit = ${V}.\n${s.I}: ${verdict}. (p = 1/2 < 1.)`));
    } else if (k === 7) {
      const a = q.a, rt = a === 1 ? '√(1 − x²)' : `√(${a * a} − x²)`;
      out.push(st(1, 'Neden genelleştirilmiş?', 'Why improper?', `x → ${a} iken ${rt} → 0: integrand üst uçta sonsuza gider. Bu yüzden üst uca İÇERİDEN yaklaşırız: ∫₀^${a} f dx = lim(ε→0⁺) ∫₀^(${a}−ε) f dx.`, `As x → ${a}, ${rt} → 0: the integrand blows up at the upper end. So we approach the upper end from INSIDE: ∫₀^${a} f dx = lim(ε→0⁺) ∫₀^(${a}−ε) f dx.`));
      out.push(st1(2, 'Sonlu integral', 'The finite integral', `∫ dx/√(${a * a} − x²) = arcsin(x/${a}).\n∫₀^(${a}−ε) = arcsin((${a} − ε)/${a}) − arcsin 0 = arcsin(1 − ε/${a}).`));
      out.push(st(3, 'Limit ve hüküm', 'Limit and verdict', `ε → 0⁺ iken arcsin(1 − ε/${a}) → arcsin 1 = π/2.\n${s.I}: ${verdict}. (Değer a'dan bağımsız: çeyrek çemberin açısı.)`, `As ε → 0⁺, arcsin(1 − ε/${a}) → arcsin 1 = π/2.\n${s.I}: ${verdict}. (The value does not depend on a: it is the angle of the quarter circle.)`));
    } else if (k === 8) {
      const c = q.c, qq = q.q;
      out.push(st(1, 'Süreksizlik içeride', 'The discontinuity is inside', `f, x = 0 noktasında sonsuza gider ve 0 ∈ (−${c}, ${c}). İntegrali x = 0'da BÖLMEK zorundayız: ∫_{−${c}}^{${c}} f dx = ∫_{−${c}}^0 f dx + ∫₀^${c} f dx; iki parça ayrı ayrı yakınsamalı.`, `f blows up at x = 0 and 0 ∈ (−${c}, ${c}). We MUST split at x = 0: ∫_{−${c}}^{${c}} f dx = ∫_{−${c}}^0 f dx + ∫₀^${c} f dx; each piece must converge separately.`));
      out.push(st1(2, 'Sağ parça', 'The right piece', qq === 2 ? `∫₀^${c} dx/x² = lim(ε→0⁺) [−1/x]_ε^${c} = lim (1/ε − 1/${c}) = ∞.` : `∫₀^${c} dx/x = lim(ε→0⁺) [ln x]_ε^${c} = lim (ln ${c} − ln ε) = ∞.`));
      out.push(st(3, 'Hüküm', 'Verdict', `Bir parça ıraksadığı için tüm integral IRAKSAKTIR. ${s.I}: ${verdict}.`, `One piece diverges, so the whole integral DIVERGES. ${s.I}: ${verdict}.`));
      out.push(st(4, 'Yaygın hata', 'A common mistake', qq === 2 ? `Ters türevi doğrudan uygulamak: [−1/x] −${c}'den ${c}'ye = −1/${c} − 1/${c} = −${2 / c}. Pozitif bir fonksiyonun integrali negatif olamaz: bu sonuç YANLIŞTIR (Temel Teorem süreksiz noktadan geçerek uygulanamaz).` : `Simetriden "tek fonksiyon ⇒ integral 0" demek YANLIŞTIR: [ln|x|] −${c}'den ${c}'ye = 0 çıkar, ama iki yarı ayrı ayrı +∞ ve −∞'dur (∞ − ∞ belirsiz); integral ıraksaktır.`,
        qq === 2 ? `Applying the antiderivative directly: [−1/x] from −${c} to ${c} = −1/${c} − 1/${c} = −${2 / c}. The integral of a positive function cannot be negative: this result is WRONG (the Fundamental Theorem cannot be applied across the discontinuity).` : `Saying "odd function ⇒ integral 0" by symmetry is WRONG: [ln|x|] from −${c} to ${c} gives 0, but the two halves are +∞ and −∞ separately (∞ − ∞ is indeterminate); the integral diverges.`));
    }
    out.push(tx(`── ${out.length + 1}) Sayısal kontrol ──\n${numLine(s)}`, `── ${out.length + 1}) Numerical check ──\n${numLine(s)}`));
    return out;
  }

  function draw(canvas, p) {
    norm(p); const s = spec(p), c = s.cut(p);
    const [x0, x1] = s.vx, [y0, y1] = s.vy, YT = Math.max(Math.abs(y1), Math.abs(y0));
    canvas.setViewport(x0, x1, y0, y1);
    const cap = (g) => (x) => { const v = g(x); return Number.isFinite(v) ? Math.max(y0 * 1.05, Math.min(v, y1 * 1.05)) : NaN; };
    const f = (x) => { const v = s.f(x); return Number.isFinite(v) && Math.abs(v) < 1e9 ? v : NaN; };
    s.ranges(c).forEach((r, i) => {
      const lo = Math.max(r[0], x0), hi = Math.min(r[1], x1);
      if (hi > lo) canvas.addFilledArea({ evaluator: cap(f), xMin: lo, xMax: hi, color: rgba(i === 0 ? canvas.orange() : canvas.gray(), i === 0 ? 0.4 : 0.22), samples: 300 });
    });
    if (s.hf) canvas.addFunction({ evaluator: cap(s.hf), color: canvas.gray(), thickness: 2, dashed: true, label: `h(x) = ${s.cmp.hS}` });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
    if (!s.inf) canvas.addGuideLine({ axis: 'vertical', position: s.asym, color: canvas.red(), label: tx('düşey asimptot', 'vertical asymptote') });
    const pos = s.inf ? c : (s.cutAt ? s.cutAt(c) : c);
    canvas.addGuideLine({ axis: 'vertical', position: pos, color: canvas.gold(), label: s.inf ? `b = ${fmt2(c)}` : `ε = ${c < 0.01 ? c.toExponential(0) : fmt2(c)}` });
    const my = f(pos), mxy = Number.isFinite(my) ? Math.max(-YT, Math.min(my, YT)) : 0;
    canvas.addMarker({ x: pos, y: mxy, color: canvas.gold(), shape: 'diamond', radius: 6, label: `${s.kind === 8 ? 'A₊' : 'A'} = ${Dn(s.area(c))}  ${s.conv ? '→ ' + s.valS : '→ ∞'}` });
  }

  const concept = () => tx(
    `GENELLEŞTİRİLMİŞ İNTEGRALLER

FİKİR
Belirli integral ∫ₐᵇ f dx, aralık sonlu ve f sınırlı olduğunda tanımlıydı. İki durumda bu bozulur: (1) aralık sonsuz uzunlukta, (2) f aralıkta sonsuza gider (düşey asimptot). Bu integralleri bir LİMİT olarak tanımlarız. Limit sonlu bir sayıysa integral YAKINSAKTIR (değeri o sayıdır); ∞, −∞ ya da limit yoksa IRAKSAKTIR.

TÜRLER
• SONSUZ ARALIK: ∫ₐ^∞ f dx = lim(b→∞) ∫ₐᵇ f dx;  ∫_{−∞}^{∞} f dx = ∫_{−∞}^c f dx + ∫_c^∞ f dx (iki limit AYRI AYRI var olmalı).
• SÜREKSİZ İNTEGRAND: f, a noktasında sonsuza gidiyorsa ∫ₐᵇ f dx = lim(ε→0⁺) ∫_{a+ε}^b f dx; sonsuzluk b uç noktasındaysa ∫ₐ^{b−ε}; sonsuzluk ara bir c noktasındaysa integrali c'de ikiye böleriz.

YÖNTEM
1. Sorunlu uçları bul: ±∞ sınır ya da f'nin sonsuza gittiği nokta.
2. Sorunlu ucu b (ya da ε) ile değiştirip sonlu bir integral yaz, başına lim koy.
3. Sonlu integrali ters türevle hesapla.
4. Limiti al: sonlu ise yakınsak (değer = limit), ∞ ya da yok ise ıraksak.
5. Birden çok sorunlu uç varsa parçala; her parça yakınsamalı.

P-TESTİ (KUVVET İNTEGRALLERİ)
• ∫₁^∞ dx/xᵖ: p > 1 ise yakınsar (değeri 1/(p − 1)), p ≤ 1 ise ıraksar.
• ∫₀¹ dx/xᵖ: p < 1 ise yakınsar (değeri 1/(1 − p)), p ≥ 1 ise ıraksar.
Sonsuzda fonksiyonun hızlı sönmesi gerekir (büyük p); sıfırda patlamanın yavaş olması gerekir (küçük p). Sınır durumu p = 1 (1/x) her iki durumda ıraksaktır.

ÖNEMLİ ÖRNEKLER
• ÜSTEL VE ARKTANJANT TÜRÜ: ∫₀^∞ e^(−ax) dx = 1/a;  ∫_{−∞}^{∞} dx/(a² + x²) = π/a.
• LOGARİTMA TÜRÜ: ∫₀¹ ln x dx = −1; genel olarak ∫₀¹ xᵐ ln x dx = −1/(m + 1)² (kısmi integrasyon).
• KAREKÖK VE ARKSİNÜS TÜRÜ: ∫₀^c dx/√x = 2√c;  ∫₀^a dx/√(a² − x²) = π/2.

DOĞRUDAN KARŞILAŞTIRMA TESTİ
Aralıkta 0 ≤ f ≤ g ise: ∫g yakınsaksa ∫f de yakınsar (∫f ≤ ∫g); 0 ≤ g ≤ f ise: ∫g ıraksaksa ∫f de ıraksar. Pratikte g olarak bir p-integrali ya da e^(−x) seçilir. Test yalnızca karar verir; yakınsak durumda değeri vermez.

TUZAKLAR
• ARA NOKTADA SÜREKSİZLİK: ∫_{−1}^{1} dx/x² için ters türevi (−1/x) doğrudan uygulamak YANLIŞ olur (−2 verir; oysa integrand pozitif). İntegrali x = 0'da bölüp her parçayı ayrı limitle hesaplamalıyız.
• lim(b→∞) ∫_{−b}^{b} f hesaplamak yetmez: 1/x için 0 çıkar ama integral ıraksar.
• f → 0 olması yakınsaklık için yeterli değildir: ∫₁^∞ dx/x ıraksar.
• Karşılaştırmada eşitsizliğin yönü önemlidir: yakınsak bir g'den KÜÇÜK olmak yakınsaklık, ıraksak bir g'den BÜYÜK olmak ıraksaklık verir; ters yönde sonuç çıkmaz.

MİNİ ÖRNEK
∫₁^∞ dx/x² = lim(b→∞) [−1/x]₁ᵇ = lim(1 − 1/b) = 1: yakınsak. ∫₁^∞ dx/x = lim ln b = ∞: ıraksak. İki eğri grafikte benzer görünse de alanları çok farklıdır.

GRAFİK
Mavi eğri f; turuncu bölge b (ya da ε) kesimine kadar olan alan A. Kaydırıcıyı değiştirdikçe A bir değere oturuyor mu yoksa sınırsız mı artıyor?`,
    `IMPROPER INTEGRALS

IDEA
The definite integral ∫ₐᵇ f dx was defined for a finite interval and a bounded f. Two things can break this: (1) the interval has infinite length, (2) f blows up on the interval (vertical asymptote). We define such integrals as a LIMIT. If the limit is a finite number the integral CONVERGES (its value is that number); if it is ∞, −∞ or does not exist it DIVERGES.

TYPES
• INFINITE INTERVAL: ∫ₐ^∞ f dx = lim(b→∞) ∫ₐᵇ f dx;  ∫_{−∞}^{∞} f dx = ∫_{−∞}^c f dx + ∫_c^∞ f dx (the two limits must exist SEPARATELY).
• DISCONTINUOUS INTEGRAND: if f blows up at a then ∫ₐᵇ f dx = lim(ε→0⁺) ∫_{a+ε}^b f dx; if the blow-up is at the end point b use ∫ₐ^{b−ε}; if it is at an inner point c we split the integral at c.

METHOD
1. Find the problem spots: an infinite limit or a point where f blows up.
2. Replace the problem end by b (or ε), write a finite integral and put lim in front.
3. Evaluate the finite integral with an antiderivative.
4. Take the limit: finite means convergent (value = limit), ∞ or nonexistent means divergent.
5. With several problem spots, split the integral; every piece must converge.

P-TEST (POWER INTEGRALS)
• ∫₁^∞ dx/xᵖ: converges if p > 1 (value 1/(p − 1)), diverges if p ≤ 1.
• ∫₀¹ dx/xᵖ: converges if p < 1 (value 1/(1 − p)), diverges if p ≥ 1.
At infinity the function must die out fast (large p); at zero the blow-up must be slow (small p). The borderline p = 1 (1/x) diverges in both cases.

KEY EXAMPLES
• EXPONENTIAL AND ARCTAN TYPE: ∫₀^∞ e^(−ax) dx = 1/a;  ∫_{−∞}^{∞} dx/(a² + x²) = π/a.
• LOGARITHM TYPE: ∫₀¹ ln x dx = −1; in general ∫₀¹ xᵐ ln x dx = −1/(m + 1)² (integration by parts).
• SQUARE ROOT AND ARCSINE TYPE: ∫₀^c dx/√x = 2√c;  ∫₀^a dx/√(a² − x²) = π/2.

DIRECT COMPARISON TEST
If 0 ≤ f ≤ g on the interval: when ∫g converges so does ∫f (∫f ≤ ∫g); if 0 ≤ g ≤ f: when ∫g diverges so does ∫f. In practice g is a p-integral or e^(−x). The test only decides; when it converges it does not give the value.

PITFALLS
• DISCONTINUITY INSIDE the interval: for ∫_{−1}^{1} dx/x² applying the antiderivative (−1/x) directly is WRONG (it gives −2 although the integrand is positive). We must split at x = 0 and take a separate limit for each piece.
• Computing lim(b→∞) ∫_{−b}^{b} f is not enough: for 1/x it gives 0 but the integral diverges.
• f → 0 is not sufficient for convergence: ∫₁^∞ dx/x diverges.
• The direction of the inequality matters: being SMALLER than a convergent g gives convergence, being LARGER than a divergent g gives divergence; the other directions prove nothing.

MINI EXAMPLE
∫₁^∞ dx/x² = lim(b→∞) [−1/x]₁ᵇ = lim(1 − 1/b) = 1: converges. ∫₁^∞ dx/x = lim ln b = ∞: diverges. The two curves look alike on a graph, yet their areas are very different.

GRAPH
The blue curve is f; the orange region is the area A up to the cut b (or ε). As you move the slider, does A settle at a value or keep growing without bound?`);

  // build one example: kind, parameter index, default slider choice
  function build(kind, idx, pick) {
    const par = {};
    if (kind === 0 || kind === 4) par.p = PAR[kind][idx % PAR[kind].length];
    else if (kind === 1 || kind === 2 || kind === 3 || kind === 7) par.a = PAR[kind][idx % PAR[kind].length];
    else if (kind === 5) par.m = PAR[5][idx % 4];
    else if (kind === 6) par.c = PAR[6][idx % 4];
    else if (kind === 8) { par.c = [1, 2, 3][idx % 3]; par.q = (idx >> 2) % 2 === 0 ? 2 : 1; }
    else par.ci = idx % CMP.length;
    const p = { kind, par, t: 0 };
    const s = spec(p);
    p.t = Math.max(s.tmin, s.tdefs[pick % s.tdefs.length]);
    verify(p);
    return p;
  }

  let kindSel = null, sOpts = null, sReg = null, selCount = 0;
  function retune(p) {
    if (!sReg) return;
    const s = spec(p);
    sOpts.min = s.tmin; sOpts.max = s.tmax; sOpts.step = s.tstep;
    sReg.min = s.tmin; sReg.max = s.tmax;
  }
  function createProblem(rng) {
    let kind = rng.nextInt(0, KINDS);
    const idx = rng.nextInt(0, 12), pick = rng.nextInt(0, 4), fk = rng.nextInt(0, 4);
    if (forced) kind = forced[fk % forced.length];
    const p = build(kind, idx, pick);
    retune(p);
    if (kindSel) kindSel.refreshFromModel();
    return p;
  }
  let forced = null;
  const linkMake = (kinds) => (rng) => { forced = kinds; try { return createProblem(rng); } finally { forced = null; } };

  function syncReg(reg) {
    if (!reg) return;
    const v = reg.get();
    reg.valueLabel.textContent = fmt2(v);
    reg.input.value = String(Math.max(0, Math.min(1000, Math.round((v - reg.min) / (reg.max - reg.min) * 1000))));
  }
  const KOPT = [
    [0, 'Sonsuz aralık: ∫₁^∞ x⁻ᵖ dx', 'Infinite interval: ∫₁^∞ x⁻ᵖ dx'], [1, 'Sonsuz aralık: ∫₀^∞ e⁻ᵃˣ dx', 'Infinite interval: ∫₀^∞ e⁻ᵃˣ dx'], [2, 'Sonsuz aralık: ∫₀^∞ 1/(a² + x²) dx', 'Infinite interval: ∫₀^∞ 1/(a² + x²) dx'],
    [3, 'İki ucu sonsuz: ∫ 1/(a² + x²) dx', 'Both ends infinite: ∫ 1/(a² + x²) dx'], [4, 'Süreksiz: ∫₀¹ x⁻ᵖ dx', 'Discontinuous: ∫₀¹ x⁻ᵖ dx'], [5, 'Süreksiz: ∫₀¹ xᵐ ln x dx', 'Discontinuous: ∫₀¹ xᵐ ln x dx'],
    [6, 'Süreksiz: ∫₀^c 1/√x dx', 'Discontinuous: ∫₀^c 1/√x dx'], [7, 'Süreksiz: ∫₀^a 1/√(a² − x²) dx', 'Discontinuous: ∫₀^a 1/√(a² − x²) dx'], [8, 'Ara noktada süreksiz: ∫ 1/x^q dx, [−c, c]', 'Inner discontinuity: ∫ 1/x^q dx on [−c, c]'],
    [9, 'Karşılaştırma testi', 'Comparison test'],
  ];
  function buildControls(rightCol, getProblem, h) {
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); };
    lab(tx('İntegral türü', 'Type of integral'));
    kindSel = h.addSelect({
      options: KOPT.map(([value, a, b]) => ({ label: tx(a, b), value })),
      get: () => getProblem().kind,
      set: (v) => { const cur = getProblem(), np = build(Number(v), ++selCount, 1); cur.kind = np.kind; cur.par = np.par; cur.t = np.t; retune(cur); syncReg(sReg); },
    });
    sOpts = { caption: tx('Kesim: b (sonsuz uçlu) ya da k (ε = 10⁻ᵏ)', 'Cut: b (infinite end) or k (ε = 10⁻ᵏ)'), min: 0.5, max: 20, step: 0.5,
      get: () => norm(getProblem()).t, set: (v) => { const p = getProblem(); p.t = v; norm(p); } };
    sReg = h.addSlider(sOpts);
    retune(getProblem()); syncReg(sReg);
  }

  // challenge: value of a convergent integral; otherwise the truncated integral up to the fixed cut chT
  const chal = (p) => {
    norm(p); const s = spec(p);
    const iv = (a, b) => `[${a}, ${b}]`;
    if (s.cmp) {
      const c = s.cmp, B = s.chT;
      if (c.conv) return { target: c.hInt, tr: `Karşılaştırma testiyle ${s.I} integralinin yakınsak olduğu gösterilebilir. Karşılaştırma fonksiyonu h(x) = ${c.hS} için ∫ h dx (aynı aralıkta, tamamı) kaçtır? 2 ondalık basamakla yazalım.`, en: `The comparison test shows that ${s.I} converges. For the comparison function h(x) = ${c.hS}, what is ∫ h dx over the same whole interval? Let's give 2 decimals.` };
      const a = s.inf ? c.lo : B, b = s.inf ? B : 1;
      return { target: s.area(B, c.h), tr: `${s.I} integralini h(x) = ${c.hS} ile karşılaştırıyoruz. ${iv(a, b)} aralığında ∫ h dx kesilmiş integrali kaçtır? 2 ondalık basamakla yazalım.`, en: `We compare ${s.I} with h(x) = ${c.hS}. What is the truncated integral ∫ h dx over ${iv(a, b)}? Let's give 2 decimals.` };
    }
    if (s.conv) return { target: s.val, tr: `${s.I} integralinin kesilmiş alanı (${s.inf ? 'b → ∞' : 'ε → 0⁺'}) hangi değere yaklaşır? 2 ondalık basamakla yazalım.`, en: `To what value does the truncated area of ${s.I} tend (${s.inf ? 'b → ∞' : 'ε → 0⁺'})? Let's give 2 decimals.` };
    const B = s.chT, r = s.qr(B)[0];
    return { target: s.area(B), tr: `${s.I} integralinin KESİLMİŞ hâli, yani ${iv(r[0], r[1])} aralığında ∫ ${s.eq} dx${s.kind === 8 ? ' (yalnız sağ parça)' : ''}, kaçtır? 2 ondalık basamakla yazalım.`, en: `What is the TRUNCATED version of ${s.I}, i.e. ∫ ${s.eq} dx over ${iv(r[0], r[1])}${s.kind === 8 ? ' (right piece only)' : ''}? Let's give 2 decimals.` };
  };

  Topics.register('calc2', {
    id: 'improper',
    tabTitle: () => tx('Genelleştirilmiş İntegraller', 'Improper Integrals'),
    concept, problemStatement, createProblem, solveSteps, draw, buildControls,
    focus: (p) => { norm(p); const s = spec(p); return { x: (s.vx[0] + s.vx[1]) / 2, y: (s.vy[0] + s.vy[1]) / 2 }; },
    challenge: {
      prompt: (p) => { const c = chal(p); return tx(c.tr, c.en); },
      target: (p) => chal(p).target,
      tol: (p) => Math.max(0.01, 0.005 * Math.abs(chal(p).target)),
      hint: (p, g) => { const t = chal(p).target; return tx(g > t ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > t ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.') + ' ' + tx('Sonlu integrali ters türevle hesaplayıp sınırları yazalım.', 'Let us evaluate the finite integral with an antiderivative and plug in the limits.'); },
    },
    links: [
      { match: /^• (SONSUZ ARALIK|INFINITE INTERVAL)/, make: linkMake([0, 1, 2, 3]) },
      { match: /^• (SÜREKSİZ İNTEGRAND|DISCONTINUOUS INTEGRAND)/, make: linkMake([4, 5, 6, 7]) },
      { match: /^(P-TESTİ|P-TEST) /, make: linkMake([0, 4]) },
      { match: /^• (ÜSTEL VE ARKTANJANT|EXPONENTIAL AND ARCTAN)/, make: linkMake([1, 2, 3]) },
      { match: /^• (LOGARİTMA TÜRÜ|LOGARITHM TYPE)/, make: linkMake([5]) },
      { match: /^• (KAREKÖK VE ARKSİNÜS|SQUARE ROOT AND ARCSINE)/, make: linkMake([6, 7]) },
      { match: /^(DOĞRUDAN KARŞILAŞTIRMA TESTİ|DIRECT COMPARISON TEST)$/, make: linkMake([9]) },
      { match: /^• (ARA NOKTADA SÜREKSİZLİK|DISCONTINUITY INSIDE)/, make: linkMake([8]) },
    ],
    _test: { spec, CMP, PAR, KINDS, integ, verify, norm, build, chal },
  });

  // ---------------------------------------------------------------- quiz
  const T1 = () => tx('Genelleştirilmiş İntegraller', 'Improper Integrals');
  const DIV = () => tx('ıraksar', 'diverges');
  const QS = (text, correct, wrongs, notes, solution, rng) => {
    const seen = new Set([correct]), ws = [], ns = [];
    wrongs.forEach((w, i) => { if (!seen.has(w)) { seen.add(w); ws.push(w); ns.push(notes && notes[i]); } });
    for (const f of [DIV(), '0', '1', '2', '1/2']) { if (ws.length >= 3) break; if (!seen.has(f)) { seen.add(f); ws.push(f); ns.push(undefined); } }
    return makeQuestion(T1(), text, correct, ws, solution, rng, ns);
  };
  const genMain = (rng) => {
    const t = rng.nextInt(0, 3);
    if (t === 0) {
      const pv = rng.pick([1.5, 2, 3, 4, 2.5]), v = 1 / (pv - 1);
      return QS(tx(`∫₁^∞ 1/x^(${fr(pv)}) dx integralinin değeri kaçtır? (Iraksaksa "ıraksar" seçilir.)`, `What is the value of ∫₁^∞ 1/x^(${fr(pv)}) dx? (Choose "diverges" if it diverges.)`),
        fr(v), [fr(-v), fr(1 / pv), fr(pv / (pv - 1)), DIV()],
        [tx('Alt sınırdaki terimin işareti unutulmuş (1/(1 − p) alınmış).', 'The sign of the lower-limit term was lost (1/(1 − p) taken).'), tx('Üssü azaltmadan 1/p alınmış.', 'The exponent was not lowered: 1/p taken.'), tx('Katsayı hatalı: p/(p − 1).', 'Wrong coefficient: p/(p − 1).'), tx('p > 1 olduğundan integral yakınsaktır.', 'Since p > 1 the integral converges.')],
        [tx(`p = ${fr(pv)} > 1: yakınsak. ∫₁ᵇ x^(−${fr(pv)}) dx = (1 − b^(${fr(1 - pv)}))/(${fr(pv - 1)}) → 1/(p − 1).`, `p = ${fr(pv)} > 1: converges. ∫₁ᵇ x^(−${fr(pv)}) dx = (1 − b^(${fr(1 - pv)}))/(${fr(pv - 1)}) → 1/(p − 1).`), tx(`Değer = ${fr(v)}.`, `Value = ${fr(v)}.`)], rng);
    }
    if (t === 1) {
      const a = rng.pick([2, 3, 4, 5, 0.5]), v = 1 / a;
      return QS(tx(`∫₀^∞ e^(−${a === 0.5 ? 'x/2' : a + 'x'}) dx integralinin değeri kaçtır?`, `What is the value of ∫₀^∞ e^(−${a === 0.5 ? 'x/2' : a + 'x'}) dx?`),
        fr(v), [fr(a), fr(-v), DIV(), fr(1 / (a + 1))],
        [tx('Ters türevde 1/a yerine a yazılmış.', 'a written instead of 1/a in the antiderivative.'), tx('Eksi işareti son sonuca taşınmış.', 'The minus sign was carried into the final result.'), tx('Üstel fonksiyon sonsuzda sönümlenir: integral yakınsaktır.', 'The exponential dies out at infinity: the integral converges.'), tx('1/(a + 1) gibi uydurma bir formül.', 'An invented formula such as 1/(a + 1).')],
        [tx(`∫₀ᵇ e^(−ax) dx = (1 − e^(−ab))/a → 1/a (a = ${fr(a)}).`, `∫₀ᵇ e^(−ax) dx = (1 − e^(−ab))/a → 1/a (a = ${fr(a)}).`), tx(`Değer = ${fr(v)}.`, `Value = ${fr(v)}.`)], rng);
    }
    const pv = rng.pick([0.5, 1 / 3, 2 / 3, 0.75]), v = 1 / (1 - pv);
    return QS(tx(`∫₀¹ 1/x^(${fr(pv)}) dx integralinin değeri kaçtır?`, `What is the value of ∫₀¹ 1/x^(${fr(pv)}) dx?`),
      fr(v), [fr(-v), fr(1 / pv), DIV(), fr(1 - pv)],
      [tx('1/(p − 1) alınmış (işaret hatası).', '1/(p − 1) taken (sign error).'), tx('1/p alınmış.', '1/p taken.'), tx('p < 1 olduğundan yakınsaktır.', 'Since p < 1 it converges.'), tx('Ters çevirmeyi unutmuş: 1 − p.', 'Forgot to invert: 1 − p.')],
      [tx(`p = ${fr(pv)} < 1: yakınsak. ∫_ε^1 x^(−p) dx = (1 − ε^(1−p))/(1 − p) → 1/(1 − p).`, `p = ${fr(pv)} < 1: converges. ∫_ε^1 x^(−p) dx = (1 − ε^(1−p))/(1 − p) → 1/(1 − p).`), tx(`Değer = ${fr(v)}.`, `Value = ${fr(v)}.`)], rng);
  };
  genMain.level = 2;
  const genClass = (rng) => {
    const pv = rng.pick([0.5, 2 / 3, 1, 4 / 3, 1.5, 2, 3]), conv = pv > 1, v = 1 / (pv - 1);
    const yak = (x) => tx(`yakınsar, değeri ${x}`, `converges, value ${x}`);
    return QS(tx(`∫₁^∞ 1/x^(${fr(pv)}) dx integrali için hangisi doğrudur?`, `Which statement is true for ∫₁^∞ 1/x^(${fr(pv)}) dx?`),
      conv ? yak(fr(v)) : DIV(), conv ? [DIV(), yak(fr(1 / pv)), yak('0')] : [yak('1'), yak('0'), yak('2')],
      conv ? [tx('p-testi: p > 1 için yakınsar.', 'p-test: converges for p > 1.'), tx('Değer 1/p değil 1/(p − 1).', 'The value is 1/(p − 1), not 1/p.'), tx('Alan sıfır olamaz: integrand pozitif.', 'The area cannot be zero: the integrand is positive.')]
        : [tx('p ≤ 1 olduğundan sonlu bir değere oturmaz.', 'Since p ≤ 1 it does not settle at a finite value.'), tx('Pozitif integrandın alanı 0 olamaz.', 'The area of a positive integrand cannot be 0.'), tx('p ≤ 1: alan sınırsız büyür.', 'p ≤ 1: the area grows without bound.')],
      [tx(`p-testi: ∫₁^∞ dx/xᵖ, p > 1 için yakınsak, p ≤ 1 için ıraksaktır. Burada p = ${fr(pv)}.`, `p-test: ∫₁^∞ dx/xᵖ converges for p > 1 and diverges for p ≤ 1. Here p = ${fr(pv)}.`), conv ? tx(`Değer = 1/(p − 1) = ${fr(v)}.`, `Value = 1/(p − 1) = ${fr(v)}.`) : tx('Sonuç: ıraksar.', 'Result: diverges.')], rng);
  };
  genClass.level = 1;
  const genSqrt = (rng) => {
    const c = rng.pick([1, 4, 9, 16, 25]);
    return QS(tx(`∫₀^${c} 1/√x dx integralinin değeri kaçtır?`, `What is the value of ∫₀^${c} 1/√x dx?`),
      String(2 * Math.sqrt(c)), [String(Math.sqrt(c)), String(4 * Math.sqrt(c)), String(2 * c), DIV()],
      [tx('Ters türevde 2 katsayısı unutulmuş.', 'The factor 2 of the antiderivative was forgotten.'), tx('Katsayı 4 alınmış.', 'Factor 4 taken.'), tx('√c yerine c yazılmış.', 'c written instead of √c.'), tx('p = 1/2 < 1: integral yakınsaktır.', 'p = 1/2 < 1: the integral converges.')],
      [tx(`∫_ε^${c} x^(−1/2) dx = [2√x]_ε^${c} = 2√${c} − 2√ε.`, `∫_ε^${c} x^(−1/2) dx = [2√x]_ε^${c} = 2√${c} − 2√ε.`), tx(`ε → 0⁺: değer 2√${c} = ${2 * Math.sqrt(c)}.`, `ε → 0⁺: value 2√${c} = ${2 * Math.sqrt(c)}.`)], rng);
  };
  genSqrt.level = 2;
  const genAtan = (rng) => {
    const a = rng.pick([2, 3, 4]);
    return QS(tx(`∫_{−∞}^{∞} 1/(${a * a} + x²) dx integralinin değeri kaçtır?`, `What is the value of ∫_{−∞}^{∞} 1/(${a * a} + x²) dx?`),
      piOver(1, a), [piOver(1, 2 * a), piOver(2, a), piOver(1, 1), '0'],
      [tx('Yalnız yarım doğru (0 → ∞) hesaplanmış.', 'Only the half line (0 → ∞) was computed.'), tx('Katsayı iki katı: 1/a yerine 2/a.', 'Factor doubled: 2/a instead of 1/a.'), tx('1/a katsayısı unutulmuş.', 'The factor 1/a was forgotten.'), tx('Çift fonksiyon için "simetriden 0" denmiş.', 'Said "0 by symmetry" for an even function.')],
      [tx(`∫ dx/(${a * a} + x²) = (1/${a}) arctan(x/${a}).`, `∫ dx/(${a * a} + x²) = (1/${a}) arctan(x/${a}).`), tx(`Değer = (1/${a})(π/2 − (−π/2)) = ${piOver(1, a)}.`, `Value = (1/${a})(π/2 − (−π/2)) = ${piOver(1, a)}.`)], rng);
  };
  genAtan.level = 2;
  const genLn = (rng) => {
    const m = rng.pick([1, 2, 3]), c = (m + 1) * (m + 1);
    return QS(tx(`∫₀¹ x^${m} ln x dx integralinin değeri kaçtır?`, `What is the value of ∫₀¹ x^${m} ln x dx?`),
      fr(-1 / c), [fr(1 / c), fr(-1 / (m + 1)), '−1', DIV()],
      [tx('İşaret hatası: ln x, (0,1) üzerinde negatiftir.', 'Sign error: ln x is negative on (0, 1).'), tx('(m + 1)² yerine (m + 1) kullanılmış.', '(m + 1) used instead of (m + 1)².'), tx('Yalnızca m = 0 sonucu (−1) yazılmış.', 'Only the m = 0 result (−1) was written.'), tx('ε^(m+1)·ln ε → 0 olduğundan limit sonludur.', 'ε^(m+1)·ln ε → 0, so the limit is finite.')],
      [tx(`Kısmi integrasyon: ∫_ε^1 x^${m} ln x dx = [x^${m + 1} ln x/${m + 1}]_ε^1 − (1 − ε^${m + 1})/${c}.`, `By parts: ∫_ε^1 x^${m} ln x dx = [x^${m + 1} ln x/${m + 1}]_ε^1 − (1 − ε^${m + 1})/${c}.`), tx(`ε → 0⁺: ε^${m + 1}·ln ε → 0, değer = −1/${c}.`, `ε → 0⁺: ε^${m + 1}·ln ε → 0, value = −1/${c}.`)], rng);
  };
  genLn.level = 3;
  const genTrunc = (rng) => {
    const b = rng.pick([2, 4, 5, 10]);
    return QS(tx(`∫₁^${b} 1/x² dx kesilmiş integrali kaçtır? (b → ∞ iken bu alanın hangi değere yaklaştığını da düşünelim.)`, `What is the truncated integral ∫₁^${b} 1/x² dx? (Think about which value this area approaches as b → ∞.)`),
      fr(1 - 1 / b), [fr(1 / b - 1), '1', fr(1 / b), fr(1 + 1 / b)],
      [tx('Sınırlar ters çıkarılmış: F(1) − F(b).', 'Limits subtracted the wrong way: F(1) − F(b).'), tx('Limit değeri yazılmış, b = ' + b + ' için değil.', 'The limit value was written, not the value for b = ' + b + '.'), tx('Yalnızca üst sınırdaki terim kullanılmış.', 'Only the term at the upper limit was used.'), tx('Alt sınırdaki terim eklenmiş, çıkarılmamış.', 'The lower-limit term was added, not subtracted.')],
      [tx('∫₁ᵇ x⁻² dx = [−1/x]₁ᵇ = 1 − 1/b.', '∫₁ᵇ x⁻² dx = [−1/x]₁ᵇ = 1 − 1/b.'), tx(`b = ${b}: ${fr(1 - 1 / b)}.`, `b = ${b}: ${fr(1 - 1 / b)}.`)], rng);
  };
  genTrunc.level = 1;
  const genCmp = (rng) => {
    const c = CMP[rng.nextInt(0, CMP.length)], other = CMP.filter((d) => d.conv !== c.conv);
    const ver = (cv) => (cv ? tx('yakınsar', 'converges') : tx('ıraksar', 'diverges'));
    const mk = (cv, h) => `${ver(cv)} (${tx(`${h} ile karşılaştırma`, `compared with ${h}`)})`;
    const o1 = other[rng.nextInt(0, other.length)], o2 = other[rng.nextInt(0, other.length)];
    return QS(tx(`${cmpI(c)} integrali için hangi sonuç ve gerekçe doğrudur?`, `Which conclusion and reason is correct for ${cmpI(c)}?`),
      mk(c.conv, c.hS), [mk(!c.conv, c.hS), mk(c.conv, o1.hS), mk(!c.conv, o2.hS)],
      [tx('Eşitsizliğin yönü ters okunmuş.', 'The inequality was read in the wrong direction.'), tx(`Bu fonksiyonla karşılaştırmak sonuç vermez (${c.conv ? 'daha büyük, ıraksak' : 'daha küçük, yakınsak'} bir fonksiyonla karşılaştırılmış).`, `Comparing with that function proves nothing (${c.conv ? 'bigger and divergent' : 'smaller and convergent'}).`), tx('Sonuç ve karşılaştırma fonksiyonu uyuşmuyor.', 'Conclusion and comparison function do not fit.')],
      [tx(c.why[0] + '.', c.why[1] + '.'), tx(c.hn[0], c.hn[1]), tx(`Sonuç: ${ver(c.conv)}.`, `Result: ${ver(c.conv)}.`)], rng);
  };
  genCmp.level = 3;
  const genMid = (rng) => {
    const c = rng.pick([1, 2, 4]);
    return QS(tx(`∫_{−${c}}^{${c}} 1/x² dx integrali için hangisi doğrudur?`, `Which statement is true for ∫_{−${c}}^{${c}} 1/x² dx?`),
      DIV(), [fr(-2 / c), '0', fr(2 / c)],
      [tx('Ters türev −1/x süreksiz noktadan geçerek uygulanmış; pozitif integrandın integrali negatif olamaz.', 'The antiderivative −1/x was applied across the discontinuity; a positive integrand cannot have a negative integral.'), tx('Simetriden 0 sanılmış; 1/x² çift fonksiyondur ve pozitiftir.', 'Assumed 0 by symmetry; 1/x² is even and positive.'), tx('Süreksizlik yok sayılıp yalnızca bir yarı alınmış.', 'The discontinuity was ignored and only one half used.')],
      [tx('x = 0 aralığın içindedir: integrali orada bölmek gerekir.', 'x = 0 lies inside the interval: we must split there.'), tx(`∫₀^${c} dx/x² = lim(1/ε − 1/${c}) = ∞ ⇒ ıraksar.`, `∫₀^${c} dx/x² = lim(1/ε − 1/${c}) = ∞ ⇒ diverges.`)], rng);
  };
  genMid.level = 2;
  window.Calc2Quiz.main.push(genMain);
  window.Calc2Quiz.extra.push(genClass, genSqrt, genAtan, genLn, genTrunc, genCmp, genMid);
})();
