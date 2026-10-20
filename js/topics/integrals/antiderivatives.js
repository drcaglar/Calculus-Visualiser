// Antiderivatives and indefinite integrals (Thomas 4.8 / 5.5, Stewart 4.9 / 5.4).
// problem = { type: 0 polynomial | 1 radicals & negative powers | 2 mixed (trig, exp, ...) | 3 initial-value problem |
//             4 motion a(t) -> v(t) -> s(t) | 5 "is F an antiderivative of f?",  terms: [...], ... }
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const M = (s) => String(s).replace(/-/g, '−');
  const N2 = (v) => M(fmt2(v));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const fr = (n, d) => { if (d === undefined) d = 1; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
  const fadd = (x, y) => fr(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
  const fmul = (x, y) => fr(x[0] * y[0], x[1] * y[1]);
  const fval = (x) => x[0] / x[1];
  const fstr = (x) => (x[1] === 1 ? M(x[0]) : `${x[0] < 0 ? '−' : ''}${Math.abs(x[0])}/${x[1]}`);
  const safeFn = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) && Math.abs(r) < 1e3 ? r : NaN; } catch (e) { return NaN; } };
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] || '⁻').join('');
  // x^e as text (e = [num, den] reduced)
  const xp = (e) => {
    if (e[1] === 1) { if (e[0] === 0) return ''; if (e[0] === 1) return 'x'; return 'x' + sup(e[0]); }
    return `x^(${fstr(e)})`;
  };
  let forced = null;

  // basic formulas: f, base antiderivative B (F = sgn·c·B), texts
  const KINDS = {
    sin: { f: Math.sin, B: Math.cos, sgn: -1, fs: 'sin x', Fs: 'cos x', B0: 1 },
    cos: { f: Math.cos, B: Math.sin, sgn: 1, fs: 'cos x', Fs: 'sin x', B0: 0 },
    exp: { f: Math.exp, B: Math.exp, sgn: 1, fs: 'eˣ', Fs: 'eˣ', B0: 1 },
    sec2: { f: (x) => 1 / (Math.cos(x) * Math.cos(x)), B: Math.tan, sgn: 1, fs: 'sec² x', Fs: 'tan x', B0: 0 },
    csc2: { f: (x) => 1 / (Math.sin(x) * Math.sin(x)), B: (x) => Math.cos(x) / Math.sin(x), sgn: -1, fs: 'csc² x', Fs: 'cot x', B0: null },
    sectan: { f: (x) => Math.sin(x) / (Math.cos(x) * Math.cos(x)), B: (x) => 1 / Math.cos(x), sgn: 1, fs: 'sec x tan x', Fs: 'sec x', B0: 1 },
    inv: { f: (x) => 1 / x, B: (x) => Math.log(Math.abs(x)), sgn: 1, fs: '1/x', Fs: 'ln|x|', B0: null },
    atan: { f: (x) => 1 / (1 + x * x), B: Math.atan, sgn: 1, fs: '1/(1+x²)', Fs: 'arctan x', B0: 0 },
    asin: { f: (x) => 1 / Math.sqrt(1 - x * x), B: Math.asin, sgn: 1, fs: '1/√(1−x²)', Fs: 'arcsin x', B0: 0 },
    sinh: { f: Math.sinh, B: Math.cosh, sgn: 1, fs: 'sinh x', Fs: 'cosh x', B0: 1 },
    cosh: { f: Math.cosh, B: Math.sinh, sgn: 1, fs: 'cosh x', Fs: 'sinh x', B0: 0 },
  };
  const ORIG = { '1/2': '√x', '1/3': '∛x', '3/2': 'x√x', '2/3': '∛(x²)', '-1/2': '1/√x', '-2/1': '1/x²', '-3/1': '1/x³', '-3/2': '1/(x√x)', '-1/3': '1/∛x' };
  const origBase = (t) => {
    if (t.k !== 'pow') return KINDS[t.k].fs;
    if (t.e[1] === 1 && t.e[0] >= 0) return xp(t.e);
    return ORIG[t.e[0] + '/' + t.e[1]] || xp(t.e);
  };
  const rewBase = (t) => (t.k === 'pow' ? xp(t.e) : KINDS[t.k].fs);
  const Fexp = (t) => fr(t.e[0] + t.e[1], t.e[1]);
  const Fcoef = (t) => (t.k === 'pow' ? fr(t.c * t.e[1], t.e[0] + t.e[1]) : fr(KINDS[t.k].sgn * t.c));
  const FBase = (t) => (t.k === 'pow' ? xp(Fexp(t)) : KINDS[t.k].Fs);
  const pw = (x, e) => (e[1] === 1 ? Math.pow(x, e[0]) : (x > 0 ? Math.pow(x, e[0] / e[1]) : NaN));
  const fT = (t, x) => (t.k === 'pow' ? t.c * pw(x, t.e) : t.c * KINDS[t.k].f(x));
  const fSum = (terms, x) => terms.reduce((s, t) => s + fT(t, x), 0);
  const Bx = (t, x) => (t.k === 'pow' ? pw(x, Fexp(t)) : KINDS[t.k].B(x));
  const GSum = (parts, x) => parts.reduce((s, q) => s + fval(q.fr) * Bx(q.t, x), 0);
  const Gparts = (terms) => terms.map((t) => ({ t, fr: Fcoef(t) }));

  // expression joiner: parts = [{fr:[n,d], base}] ('' base = pure number)
  function join(parts) {
    let s = '';
    parts.forEach((q, i) => {
      const neg = q.fr[0] < 0, a = fr(Math.abs(q.fr[0]), q.fr[1]);
      let body;
      if (q.base === '') body = fstr(a);
      else if (a[0] === 1 && a[1] === 1) body = q.base;
      else if (q.base.indexOf('1/') === 0) body = a[1] === 1 ? `${a[0]}/${q.base.slice(2)}` : `${fstr(a)}·(${q.base})`;
      else {
        const co = a[1] === 1 ? String(a[0]) : `(${fstr(a)})`;
        body = co + (/^[x√∛eᵉ(]/.test(q.base) ? '' : ' ') + q.base;
      }
      s += i === 0 ? (neg ? '−' : '') + body : (neg ? ' − ' : ' + ') + body;
    });
    return s || '0';
  }
  const origParts = (terms) => terms.map((t) => ({ fr: fr(t.c), base: origBase(t) }));
  const rewParts = (terms) => terms.map((t) => ({ fr: fr(t.c), base: rewBase(t) }));
  const FParts = (parts) => parts.map((q) => ({ fr: q.fr, base: FBase(q.t) }));
  const paren = (s) => (/[/^]|^−/.test(s) ? `(${s})` : s);

  // exact value of a power with rational exponent m = [mn, md] at integer x0 (perfect md-th power)
  function powFr(x0, m) {
    const v = m[1] === 1 ? x0 : Math.round(Math.pow(x0, 1 / m[1]));
    const a = Math.pow(v, Math.abs(m[0]));
    return m[0] >= 0 ? fr(a, 1) : fr(1, a);
  }
  function Gexact(terms, x0) {
    let s = [0, 1];
    terms.forEach((t) => {
      if (t.k === 'pow') s = fadd(s, fmul(Fcoef(t), powFr(x0, Fexp(t))));
      else s = fadd(s, fmul(Fcoef(t), fr(KINDS[t.k].B0)));
    });
    return s;
  }

  // ---------- problem generators ----------
  const nz = (rng, lo, hi) => rng.nonZeroInt(lo, hi);
  function genPoly(rng) {
    const pool = [0, 1, 2, 3, 4];
    const cnt = rng.pick([3, 3, 4]);
    const es = [];
    while (es.length < cnt) { const e = rng.pick(pool); if (es.indexOf(e) < 0) es.push(e); }
    es.sort((a, b) => b - a);
    return es.map((e) => ({ k: 'pow', c: (e + 1) * nz(rng, -3, 3), e: [e, 1] }));
  }
  function genRad(rng, pool) {
    pool = pool || [[1, 2], [3, 2], [-1, 2], [1, 3], [2, 3], [-2, 1], [-3, 1], [-3, 2], [2, 1], [1, 1]];
    const es = [];
    while (es.length < 3) { const e = rng.pick(pool); if (!es.some((q) => q[0] === e[0] && q[1] === e[1])) es.push(e); }
    es.sort((a, b) => b[0] / b[1] - a[0] / a[1]);
    return es.map((e) => { const m = e[0] + e[1]; const big = Math.abs(m) >= 4; return { k: 'pow', c: m * (big ? rng.pick([-1, 1]) : nz(rng, -2, 2)), e }; });
  }
  function genMix(rng, forIvp) {
    const A = ['sin', 'cos', 'exp', 'atan', 'sinh', 'cosh'];
    let B = ['sec2', 'csc2', 'sectan', 'inv', 'asin'];
    if (forIvp) B = ['sec2', 'sectan', 'asin'];
    const ks = [];
    while (ks.length < 2) { const k = rng.pick(A); if (ks.indexOf(k) < 0) ks.push(k); }
    if (rng.nextInt(0, 2) === 0) ks[1] = rng.pick(B);
    const terms = [{ k: 'pow', c: (rng.pick([1, 2]) + 1) * nz(rng, -2, 2), e: [rng.pick([1, 2]), 1] }];
    ks.forEach((k) => terms.push({ k, c: nz(rng, -4, 4) }));
    return terms;
  }
  function genMotion(rng) {
    if (rng.nextInt(0, 2) === 0) {
      const k = rng.pick([1, 2]), v0 = 9.8 * k, s0 = rng.pick([0, 5, 10, 15]);
      return { kind: 'grav', k, a: [-9.8], v: [v0, -9.8], s: [s0, v0, -4.9], v0, s0, T: rng.pick([1, 2, 3, 4]) };
    }
    const al = rng.pick([6, -6]), be = rng.pick([-4, -2, 0, 2, 4]), v0 = rng.nextInt(-4, 5), s0 = rng.nextInt(-4, 5);
    return { kind: 'lin', al, be, a: [be, al], v: [v0, be, al / 2], s: [s0, v0, be / 2, al / 6], v0, s0, T: rng.pick([1, 2, 3]) };
  }
  const polyEval = (c, t) => c.reduce((s, q, d) => s + q * Math.pow(t, d), 0);
  function polyStr(c, v) {
    const parts = [];
    for (let d = c.length - 1; d >= 0; d--) if (Math.abs(c[d]) > 1e-12) parts.push({ num: c[d], d });
    if (!parts.length) return '0';
    let s = '';
    parts.forEach((q, i) => {
      const a = Math.abs(q.num);
      const body = q.d === 0 ? N2(a) : (Math.abs(a - 1) < 1e-12 ? '' : N2(a)) + v + (q.d > 1 ? sup(q.d) : '');
      s += i === 0 ? (q.num < 0 ? '−' : '') + body : (q.num < 0 ? ' − ' : ' + ') + body;
    });
    return s;
  }
  function polyAt(c, T) {
    const parts = [];
    for (let d = c.length - 1; d >= 0; d--) if (Math.abs(c[d]) > 1e-12) parts.push(`${N2(Math.abs(c[d]))}${d === 0 ? '' : '·' + T + (d > 1 ? sup(d) : '')}`.replace(/^/, c[d] < 0 ? '−' : '+'));
    let r = parts.join(' ');
    r = r.replace(/^\+/, '').replace(/ \+/g, ' + ').replace(/ −/g, ' − ');
    return r;
  }

  function createProblem(rng) {
    const type = forced !== null ? forced : rng.pick([0, 1, 2, 3, 3, 4, 5]);
    const p = { type, Cs: 0 };
    if (type === 0) { p.terms = genPoly(rng); p.xt = rng.pick([1, 2]); }
    else if (type === 1) { p.terms = genRad(rng); p.xt = rng.pick([1, 2, 4]); }
    else if (type === 2) { p.terms = genMix(rng, false); p.xt = rng.pick([0.5, 1, 1.5]); }
    else if (type === 3) {
      p.sub = rng.pick(['poly', 'rad', 'mix']);
      if (p.sub === 'poly') { p.terms = genPoly(rng); p.x0 = rng.pick([-2, -1, 0, 1, 2]); }
      else if (p.sub === 'rad') { p.terms = genRad(rng, [[1, 2], [3, 2], [-1, 2], [-3, 2], [2, 1], [1, 1], [0, 1], [-2, 1]]); p.x0 = rng.pick([1, 4]); }
      else { p.terms = genMix(rng, true); p.x0 = 0; }
      p.y0 = rng.nextInt(-4, 5);
      p.Cf = fadd(fr(p.y0), fmul(Gexact(p.terms, p.x0), fr(-1)));
      p.xt = p.x0;
    } else if (type === 4) { p.m = genMotion(rng); p.t0 = p.m.T; }
    else {
      p.sub = rng.pick(['poly', 'rad', 'mix']);
      p.terms = p.sub === 'poly' ? genPoly(rng) : p.sub === 'rad' ? genRad(rng) : genMix(rng, false);
      p.claim = Gparts(p.terms);
      p.wrong = rng.nextInt(0, 2) === 0;
      p.bad = rng.nextInt(0, p.terms.length);
      if (p.wrong) p.claim[p.bad] = { t: p.terms[p.bad], fr: fadd(p.claim[p.bad].fr, fr(rng.pick([1, -1]))) };
      p.xt = 1;
    }
    return p;
  }

  // derivative of a part of the claimed antiderivative: returns {fr, base}
  function dPart(q) {
    if (q.t.k === 'pow') { const m = Fexp(q.t); return { fr: fmul(q.fr, m), base: xp(fr(m[0] - m[1], m[1])) }; }
    return { fr: fmul(q.fr, fr(KINDS[q.t.k].sgn)), base: KINDS[q.t.k].fs };
  }

  // ---------- statement ----------
  function problemStatement(p) {
    if (p.type <= 2) return tx(`f(x) = ${join(origParts(p.terms))} fonksiyonunun belirsiz integralini, yani ∫ f(x) dx ifadesini bulalım. Sonucu türev alarak kontrol edebilir miyiz?`,
      `Let's find the indefinite integral ∫ f(x) dx of f(x) = ${join(origParts(p.terms))}. Can we check the result by differentiating?`);
    if (p.type === 3) return tx(`F′(x) = ${join(origParts(p.terms))} olan ve F(${M(p.x0)}) = ${M(p.y0)} koşulunu sağlayan F(x) fonksiyonunu bulalım. (Yani grafiği (${M(p.x0)}, ${M(p.y0)}) noktasından geçen ters türevi arıyoruz.)`,
      `Let's find the function F(x) with F′(x) = ${join(origParts(p.terms))} that satisfies F(${M(p.x0)}) = ${M(p.y0)}. (In other words, the antiderivative whose graph passes through (${M(p.x0)}, ${M(p.y0)}).)`);
    if (p.type === 4) {
      const m = p.m;
      const aTr = m.kind === 'grav' ? 'a(t) = −9,8 m/s² (yerçekimi)' : `a(t) = ${polyStr(m.a, 't')} m/s²`;
      const aEn = m.kind === 'grav' ? 'a(t) = −9.8 m/s² (gravity)' : `a(t) = ${polyStr(m.a, 't')} m/s²`;
      return tx(`Doğru boyunca hareket eden bir cismin ivmesi ${aTr}, ilk hızı v(0) = ${N2(m.v0)} m/s ve ilk konumu s(0) = ${N2(m.s0)} m olsun. v(t) ve s(t) fonksiyonlarını bulup t = ${m.T} s anındaki konumu hesaplayalım.${m.kind === 'grav' ? ' Cismin ulaştığı en büyük yükseklik kaç metre olur?' : ''}`,
        `A body moves along a line with acceleration ${aEn}, initial velocity v(0) = ${N2(m.v0)} m/s and initial position s(0) = ${N2(m.s0)} m. Let's find v(t) and s(t) and compute the position at t = ${m.T} s.${m.kind === 'grav' ? ' What is the greatest height the body reaches?' : ''}`);
    }
    const Ftr = join(FParts(p.claim));
    return tx(`F(x) = ${Ftr} fonksiyonu, f(x) = ${join(origParts(p.terms))} fonksiyonunun bir ters türevi midir? F′(x) türevini alarak karar verelim; değilse doğrusu ne olmalıydı?`,
      `Is F(x) = ${Ftr} an antiderivative of f(x) = ${join(origParts(p.terms))}? Let's decide by computing F′(x); if not, what should it have been?`);
  }

  // ---------- solution ----------
  function termLines(terms) {
    return terms.map((t) => {
      const lhs = join([{ fr: fr(t.c), base: rewBase(t) }]);
      const rhsF = join([{ fr: Fcoef(t), base: FBase(t) }]);
      if (t.k === 'pow') {
        const m = Fexp(t);
        return `∫ ${lhs} dx = ${fstr(fr(t.c))}·${xp(m)}/${paren(fstr(m))} = ${rhsF}`;
      }
      return `∫ ${lhs} dx = ${rhsF}`;
    }).join('\n');
  }
  function needsRewrite(terms) { return terms.some((t) => t.k === 'pow' && (t.e[1] !== 1 || t.e[0] < 0)); }
  function checkLine(terms, extra) {
    return terms.map((t) => `d/dx [ ${join([{ fr: Fcoef(t), base: FBase(t) }])} ] = ${join([{ fr: fr(t.c), base: rewBase(t) }])}`).join('\n') + (extra || '');
  }

  function solveSteps(p) {
    const s = [];
    if (p.type === 4) return motionSteps(p, s);
    if (p.type === 5) return claimSteps(p, s);
    const T = p.terms;
    s.push(tx(`── 1) Ters türev fikri ──\nF′(x) = f(x) olan F'ye f'nin ters türevi denir. Bir tane bulursak, sabiti değiştirerek hepsi elde edilir: ∫ f(x) dx = F(x) + C. Sabitin türevi 0 olduğu için C her zaman eklenir.\nf(x) = ${join(origParts(T))}.`,
      `── 1) The idea of an antiderivative ──\nA function F with F′(x) = f(x) is called an antiderivative of f. Once we have one, changing the constant gives all of them: ∫ f(x) dx = F(x) + C. Since the derivative of a constant is 0, the C is always added.\nf(x) = ${join(origParts(T))}.`));
    if (needsRewrite(T)) {
      s.push(tx(`── 2) Kuvvet biçiminde yazalım ──\nKökleri ve paydadaki x'leri kuvvet olarak yazarsak (√x = x^(1/2), 1/xⁿ = x⁻ⁿ) kuvvet kuralı uygulanabilir:\nf(x) = ${join(rewParts(T))}.`,
        `── 2) Writing everything as powers ──\nWriting roots and x in the denominator as powers (√x = x^(1/2), 1/xⁿ = x⁻ⁿ) lets us use the power rule:\nf(x) = ${join(rewParts(T))}.`));
    } else {
      s.push(tx(`── 2) Terim terim integral (doğrusallık) ──\nToplamın ve sabitle çarpımın integrali terimlere ayrılabilir: ∫ (c·g) dx = c·∫ g dx, ∫ (g + h) dx = ∫ g dx + ∫ h dx. Her terim zaten x'in kuvveti ya da bilinen bir fonksiyon.`,
        `── 2) Term by term (linearity) ──\nThe integral of a sum or a constant multiple splits: ∫ (c·g) dx = c·∫ g dx, ∫ (g + h) dx = ∫ g dx + ∫ h dx. Each term is already a power of x or a known function.`));
    }
    s.push(tx(`── 3) Her terimin ters türevi ──\nKuvvet kuralı: ∫ xⁿ dx = xⁿ⁺¹/(n+1) (n ≠ −1); temel formüller tablosundan: ∫ sin x dx = −cos x, ∫ cos x dx = sin x, ∫ eˣ dx = eˣ, ∫ sec² x dx = tan x, ∫ csc² x dx = −cot x, ∫ sec x tan x dx = sec x, ∫ 1/x dx = ln|x|, ∫ 1/(1+x²) dx = arctan x, ∫ 1/√(1−x²) dx = arcsin x, ∫ sinh x dx = cosh x, ∫ cosh x dx = sinh x.\n${termLines(T)}`,
      `── 3) Antiderivative of each term ──\nPower rule: ∫ xⁿ dx = xⁿ⁺¹/(n+1) (n ≠ −1); from the table of basic formulas: ∫ sin x dx = −cos x, ∫ cos x dx = sin x, ∫ eˣ dx = eˣ, ∫ sec² x dx = tan x, ∫ csc² x dx = −cot x, ∫ sec x tan x dx = sec x, ∫ 1/x dx = ln|x|, ∫ 1/(1+x²) dx = arctan x, ∫ 1/√(1−x²) dx = arcsin x, ∫ sinh x dx = cosh x, ∫ cosh x dx = sinh x.\n${termLines(T)}`));
    const G = join(FParts(Gparts(T)));
    if (p.type !== 3) {
      s.push(tx(`── 4) Sonuç ──\nTerimleri toplayıp tek bir sabit ekleyelim:\n∫ f(x) dx = ${G} + C.`, `── 4) Result ──\nAdding the terms and one single constant:\n∫ f(x) dx = ${G} + C.`));
      s.push(tx(`── 5) Türev alarak kontrol ──\nF′(x) = f(x) olmalı:\n${checkLine(T)}\nBu terimlerin toplamı f(x)'tir ✓; sabitin türevi 0 olduğundan her C için doğrudur.`,
        `── 5) Check by differentiating ──\nWe need F′(x) = f(x):\n${checkLine(T)}\nThese add up to f(x) ✓; the derivative of the constant is 0, so this works for every C.`));
      s.push(tx(`── 6) Yorum ──\nSonuç tek bir fonksiyon değil, bir AİLE: C = 0, 1, 2, … için birbirinin dikey kaymış kopyaları. Hepsinin aynı x'te teğet eğimi aynıdır (f(x)); grafikte C kaydırıcısı ile görebiliriz.`,
        `── 6) Interpretation ──\nThe answer is not a single function but a FAMILY: vertical shifts of each other for C = 0, 1, 2, … All have the same tangent slope f(x) at the same x; the C slider in the graph shows this.`));
      return s;
    }
    s.push(tx(`── 4) Genel ters türev ──\nF(x) = ${G} + C.`, `── 4) General antiderivative ──\nF(x) = ${G} + C.`));
    const parts = Gparts(T).map((q) => {
      const t = q.t;
      const val = t.k === 'pow' ? fmul(q.fr, powFr(p.x0, Fexp(t))) : fmul(q.fr, fr(KINDS[t.k].B0));
      return `${join([{ fr: q.fr, base: FBase(t) }])}  → x = ${M(p.x0)} için  ${fstr(val)}`;
    }).join('\n');
    const g0 = Gexact(T, p.x0);
    const partsEn = parts.replace(/→ x = (\S+) için/g, '→ at x = $1:');
    s.push(tx(`── 5) Koşulu uygulayalım: F(${M(p.x0)}) = ${M(p.y0)} ──\nSabitsiz kısmın x = ${M(p.x0)} değerleri:\n${parts}\nToplam: ${fstr(g0)}. Böylece ${fstr(g0)} + C = ${M(p.y0)}  ⇒  C = ${M(p.y0)} − (${fstr(g0)}) = ${fstr(p.Cf)}.`,
      `── 5) Using the condition F(${M(p.x0)}) = ${M(p.y0)} ──\nValues of the constant-free part at x = ${M(p.x0)}:\n${partsEn}\nTotal: ${fstr(g0)}. So ${fstr(g0)} + C = ${M(p.y0)}  ⇒  C = ${M(p.y0)} − (${fstr(g0)}) = ${fstr(p.Cf)}.`));
    const fin = join(FParts(Gparts(T)).concat(p.Cf[0] === 0 ? [] : [{ fr: p.Cf, base: '' }]));
    s.push(tx(`── 6) Çözüm ──\nF(x) = ${fin}.`, `── 6) The solution ──\nF(x) = ${fin}.`));
    s.push(tx(`── 7) Kontrol ──\nF′(x):\n${checkLine(T)}\nToplam f(x)'e eşit ✓ (sabitin türevi 0). Ayrıca F(${M(p.x0)}) = ${fstr(Gexact(T, p.x0))} + ${fstr(p.Cf)} = ${M(p.y0)} ✓. Grafikte kalın eğri (${M(p.x0)}, ${M(p.y0)}) noktasından geçen tek üyedir.`,
      `── 7) Check ──\nF′(x):\n${checkLine(T)}\nThe sum equals f(x) ✓ (the derivative of the constant is 0). Also F(${M(p.x0)}) = ${fstr(Gexact(T, p.x0))} + ${fstr(p.Cf)} = ${M(p.y0)} ✓. In the graph the thick curve is the only family member through (${M(p.x0)}, ${M(p.y0)}).`));
    return s;
  }

  function motionSteps(p, s) {
    const m = p.m;
    const a = polyStr(m.a, 't'), v = polyStr(m.v, 't'), sx = polyStr(m.s, 't');
    const vH = polyStr([0].concat(m.a.map((q, d) => q / (d + 1))), 't');
    const sInt = polyStr([0].concat(m.v.map((q, d) => q / (d + 1))), 't');
    const T = m.T;
    s.push(tx(`── 1) Bilinenler ──\nİvme hızın türevi, hız konumun türevidir: v′ = a, s′ = v. Yani geri dönerken iki kez ters türev alırız: a → v → s. Verilenler: a(t) = ${a}, v(0) = ${N2(m.v0)}, s(0) = ${N2(m.s0)}.`,
      `── 1) What we know ──\nAcceleration is the derivative of velocity and velocity is the derivative of position: v′ = a, s′ = v. Going backwards we take two antiderivatives: a → v → s. Given: a(t) = ${a}, v(0) = ${N2(m.v0)}, s(0) = ${N2(m.s0)}.`));
    s.push(tx(`── 2) Hız: v(t) = ∫ a(t) dt ──\nv(t) = ${vH} + C₁.\nv(0) = ${N2(m.v0)} olduğundan C₁ = ${N2(m.v0)} bulunur.\nv(t) = ${v}  (m/s).`,
      `── 2) Velocity: v(t) = ∫ a(t) dt ──\nv(t) = ${vH} + C₁.\nSince v(0) = ${N2(m.v0)}, we get C₁ = ${N2(m.v0)}.\nv(t) = ${v}  (m/s).`));
    s.push(tx(`── 3) Konum: s(t) = ∫ v(t) dt ──\ns(t) = ${sInt} + C₂.\ns(0) = ${N2(m.s0)} olduğundan C₂ = ${N2(m.s0)} bulunur.\ns(t) = ${sx}  (m).`,
      `── 3) Position: s(t) = ∫ v(t) dt ──\ns(t) = ${sInt} + C₂.\nSince s(0) = ${N2(m.s0)}, we get C₂ = ${N2(m.s0)}.\ns(t) = ${sx}  (m).`));
    const sT = polyEval(m.s, T), vT = polyEval(m.v, T);
    const at = polyAt(m.s, T);
    s.push(tx(`── 4) t = ${T} s anında ──
s(${T}) = ${at} = ${N2(sT)} m,   v(${T}) = ${N2(vT)} m/s.`,
      `── 4) At t = ${T} s ──
s(${T}) = ${at} = ${N2(sT)} m,   v(${T}) = ${N2(vT)} m/s.`));
    if (m.kind === 'grav') {
      const tm = m.v0 / 9.8, hm = polyEval(m.s, tm);
      s.push(tx(`── 5) En büyük yükseklik ──\nEn yüksek noktada hız sıfırdır: v(t) = ${N2(m.v0)} − 9,8t = 0  ⇒  t = ${N2(tm)} s. Konum: s(${N2(tm)}) = ${N2(m.s0)} + ${N2(m.v0)}·${N2(tm)} − 4,9·${N2(tm)}² = ${N2(hm)} m.`,
        `── 5) Greatest height ──\nAt the highest point the velocity is zero: v(t) = ${N2(m.v0)} − 9.8t = 0  ⇒  t = ${N2(tm)} s. Position: s(${N2(tm)}) = ${N2(m.s0)} + ${N2(m.v0)}·${N2(tm)} − 4.9·${N2(tm)}² = ${N2(hm)} m.`));
    }
    s.push(tx(`── ${m.kind === 'grav' ? 6 : 5}) Kontrol ──\ns′(t) türevi alınınca ${polyStr(m.s.slice(1).map((q, d) => q * (d + 1)), 't')} = v(t) ✓; v′(t) = ${polyStr(m.v.slice(1).map((q, d) => q * (d + 1)), 't')} = a(t) ✓; ayrıca v(0) = ${N2(m.v0)}, s(0) = ${N2(m.s0)} ✓. Grafikte yeşil a, turuncu v, mavi s eğrisidir; v'nin eğimi a, s'nin eğimi v'dir.`,
      `── ${m.kind === 'grav' ? 6 : 5}) Check ──\nDifferentiating: s′(t) = ${polyStr(m.s.slice(1).map((q, d) => q * (d + 1)), 't')} = v(t) ✓; v′(t) = ${polyStr(m.v.slice(1).map((q, d) => q * (d + 1)), 't')} = a(t) ✓; also v(0) = ${N2(m.v0)}, s(0) = ${N2(m.s0)} ✓. In the graph green is a, orange is v, blue is s; the slope of v is a and the slope of s is v.`));
    return s;
  }

  function claimSteps(p, s) {
    const T = p.terms;
    const dl = p.claim.map((q) => {
      const d = dPart(q);
      return `d/dx [ ${join([{ fr: q.fr, base: FBase(q.t) }])} ] = ${join([d])}`;
    }).join('\n');
    const Fd = join(p.claim.map(dPart));
    s.push(tx(`── 1) Ne yapacağız? ──\nF, f'nin ters türevi ise F′(x) = f(x) olmalı. O halde F'nin türevini alıp f ile karşılaştıralım.\nF(x) = ${join(FParts(p.claim))},  f(x) = ${join(origParts(T))}${needsRewrite(T) ? ` = ${join(rewParts(T))}` : ''}.`,
      `── 1) Plan ──\nIf F is an antiderivative of f then F′(x) = f(x). So let's differentiate F and compare with f.\nF(x) = ${join(FParts(p.claim))},  f(x) = ${join(origParts(T))}${needsRewrite(T) ? ` = ${join(rewParts(T))}` : ''}.`));
    s.push(tx(`── 2) F′(x) terim terim ──\n${dl}\nF′(x) = ${Fd}.`, `── 2) F′(x) term by term ──\n${dl}\nF′(x) = ${Fd}.`));
    if (!p.wrong) {
      s.push(tx(`── 3) Karşılaştırma ──\nF′(x) = ${Fd} = f(x) ✓. Evet, F bir ters türevdir; ${join(FParts(p.claim))} + C ailesinin bir üyesidir.`,
        `── 3) Comparison ──\nF′(x) = ${Fd} = f(x) ✓. Yes, F is an antiderivative; it is one member of the family ${join(FParts(p.claim))} + C.`));
    } else {
      const q = p.claim[p.bad], right = Gparts(T)[p.bad];
      s.push(tx(`── 3) Karşılaştırma ──\nF′(x) = ${Fd}, f(x) = ${join(rewParts(T))}. Terimlerden biri uyuşmuyor: ${join([dPart(q)])} ile ${join([{ fr: fr(T[p.bad].c), base: rewBase(T[p.bad]) }])}. Yani F, f'nin ters türevi DEĞİLDİR.`,
        `── 3) Comparison ──\nF′(x) = ${Fd}, f(x) = ${join(rewParts(T))}. One term does not match: ${join([dPart(q)])} versus ${join([{ fr: fr(T[p.bad].c), base: rewBase(T[p.bad]) }])}. So F is NOT an antiderivative of f.`));
      s.push(tx(`── 4) Doğrusu ──\nHatalı terim ${join([{ fr: q.fr, base: FBase(q.t) }])} yerine ${join([{ fr: right.fr, base: FBase(right.t) }])} olmalıydı. Doğru ters türev: ${join(FParts(Gparts(T)))} + C.`,
        `── 4) The correct version ──\nThe faulty term ${join([{ fr: q.fr, base: FBase(q.t) }])} should have been ${join([{ fr: right.fr, base: FBase(right.t) }])}. The correct antiderivative: ${join(FParts(Gparts(T)))} + C.`));
    }
    s.push(tx(`── ${p.wrong ? 5 : 4}) Not ──\nTürev almak her zaman güvenli bir kontroldür: sonucun türevi integrandı vermiyorsa bir yerde hata var demektir.`, `── ${p.wrong ? 5 : 4}) Note ──\nDifferentiating is always a safe check: if the derivative of our answer is not the integrand, a mistake has slipped in.`));
    return s;
  }

  // ---------- graph ----------
  function draw(canvas, p) {
    if (p.type === 4) return drawMotion(canvas, p);
    const f = safeFn((x) => fSum(p.terms, x));
    const Gp = Gparts(p.terms);
    const G = safeFn((x) => GSum(Gp, x));
    canvas.setViewport(-6, 6, -8, 8);
    const base = p.type === 3 ? fval(p.Cf) : 0;
    for (let k = -3; k <= 3; k++) {
      if (p.type === 3 && k === 0) continue;
      const C = base + 2 * k;
      canvas.addFunction({ evaluator: (x) => G(x) + C, color: canvas.gray(), thickness: 1 });
    }
    if (p.type === 3) {
      const Cp = fval(p.Cf);
      canvas.addFunction({ evaluator: (x) => G(x) + Cp, color: canvas.accent(), thickness: 3.5, label: tx('F(x) çözüm', 'F(x) solution') });
      canvas.addMarker({ x: p.x0, y: p.y0, color: canvas.gold(), radius: 7, label: `(${N2(p.x0)}, ${N2(p.y0)})` });
    }
    if (p.type === 5 && p.wrong) {
      const cl = safeFn((x) => GSum(p.claim, x));
      canvas.addFunction({ evaluator: cl, color: canvas.red(), thickness: 2.5, dashed: true, label: tx('verilen F', 'given F') });
      canvas.addFunction({ evaluator: G, color: canvas.accent(), thickness: 3, label: tx('doğru ters türev (C=0)', 'true antiderivative (C=0)') });
    } else if (p.type === 5) {
      const cl = safeFn((x) => GSum(p.claim, x));
      canvas.addFunction({ evaluator: cl, color: canvas.accent(), thickness: 3, label: tx('verilen F', 'given F') });
    }
    const Cs = p.Cs;
    canvas.addFunction({ evaluator: (x) => G(x) + Cs, color: canvas.orange(), thickness: 2.5, label: `G(x) + C,  C = ${N2(Cs)}` });
    const y = G(p.xt) + Cs, sl = f(p.xt);
    if (Number.isFinite(y) && Number.isFinite(sl) && Math.abs(sl) < 40) {
      canvas.addSegment({ x1: p.xt - 0.8, y1: y - 0.8 * sl, x2: p.xt + 0.8, y2: y + 0.8 * sl, color: canvas.green(), thickness: 2.5 });
      canvas.addMarker({ x: p.xt, y, color: canvas.green(), radius: 5, label: tx(`teğet eğimi f(${N2(p.xt)}) = ${N2(sl)}`, `tangent slope f(${N2(p.xt)}) = ${N2(sl)}`) });
    }
  }
  function drawMotion(canvas, p) {
    const m = p.m;
    canvas.setViewport(-1, 7, -60, 60);
    const tr = (c) => (t) => (t >= 0 ? polyEval(c, t) : NaN);
    canvas.addFunction({ evaluator: tr(m.s), color: canvas.accent(), thickness: 3, label: 's(t)' });
    canvas.addFunction({ evaluator: tr(m.v), color: canvas.orange(), thickness: 2.5, label: 'v(t)' });
    canvas.addFunction({ evaluator: tr(m.a), color: canvas.green(), thickness: 2.5, label: 'a(t)' });
    const t0 = p.t0;
    canvas.addSegment({ x1: t0, y1: -60, x2: t0, y2: 60, color: canvas.gray(), thickness: 1, dashed: true });
    canvas.addMarker({ x: t0, y: polyEval(m.s, t0), color: canvas.accent(), radius: 5, label: `s = ${N2(polyEval(m.s, t0))}` });
    canvas.addMarker({ x: t0, y: polyEval(m.v, t0), color: canvas.orange(), radius: 5, label: `v = ${N2(polyEval(m.v, t0))}` });
    canvas.addMarker({ x: t0, y: polyEval(m.a, t0), color: canvas.green(), radius: 5, label: `a = ${N2(polyEval(m.a, t0))}` });
  }

  // ---------- concept ----------
  function concept() {
    return tx(
      `TANIM
F′(x) = f(x) ise F'ye f'nin bir TERS TÜREVİ denir. Sabitin türevi sıfır olduğundan, bir ters türev bulunursa F(x) + C ailesinin hepsi ters türevdir; bu aileye BELİRSİZ İNTEGRAL denir:
  ∫ f(x) dx = F(x) + C.

NE ANLAMA GELİR?
Türev alma "hızı bulmak" ise, ters türev "hızdan konuma geri dönmek"tir. C'ye karşılık gelen eğriler birbirinin dikey kaymış kopyalarıdır; hepsinin aynı x'teki teğet eğimi f(x)'tir.

TEMEL FORMÜLLER
• ∫ xⁿ dx = xⁿ⁺¹/(n+1) + C  (n ≠ −1);   n = −1 için ∫ 1/x dx = ln|x| + C
• ∫ eˣ dx = eˣ + C;   ∫ aˣ dx = aˣ/ln a + C
• ∫ sin x dx = −cos x + C;   ∫ cos x dx = sin x + C
• ∫ sec² x dx = tan x + C;   ∫ csc² x dx = −cot x + C;   ∫ sec x tan x dx = sec x + C
• ∫ 1/√(1−x²) dx = arcsin x + C;   ∫ 1/(1+x²) dx = arctan x + C
• ∫ sinh x dx = cosh x + C;   ∫ cosh x dx = sinh x + C
DOĞRUSALLIK: ∫ [a·f + b·g] dx = a∫ f dx + b∫ g dx.

YÖNTEM
1. Kökleri ve paydadaki x'leri kuvvet olarak yazalım (√x = x^(1/2), 1/x³ = x⁻³).
2. Terimlere ayıralım; sabitleri dışarı alalım.
3. Her terim için tablodan ters türevi yazalım.
4. Sonuna tek bir + C ekleyelim.
5. Türev alarak kontrol edelim: F′ = f olmalı.
BAŞLANGIÇ DEĞER PROBLEMİ: F(x₀) = y₀ verilirse genel çözümde x = x₀ koyup C'yi buluruz.

HAREKET: a(t) → v(t) = ∫a dt + v₀ → s(t) = ∫v dt + s₀. Yerçekiminde a = −9,8 m/s².

TUZAKLAR
• C'yi unutmayalım. • n = −1 için kuvvet kuralı çalışmaz (ln|x| gelir). • ∫ sin x dx = −cos x (eksi işaretini kaçırmayalım). • Çarpımı ve bölümü terim terim integral alınmaz (∫ f·g ≠ ∫f·∫g).

MİNİ ÖRNEK
∫ (3x² + 4/√x) dx = ∫ (3x² + 4x^(−1/2)) dx = x³ + 8x^(1/2) + C. Kontrol: (x³ + 8√x)′ = 3x² + 4/√x ✓.

NEREDE KULLANILIR?
İvmeden hız ve konum, yük dağılımından kesme kuvveti ve eğilme momenti, akış hızından hacim gibi "birikim" hesaplarında.`,
      `DEFINITION
If F′(x) = f(x), then F is called an ANTIDERIVATIVE of f. Because the derivative of a constant is zero, once we find one antiderivative every member of F(x) + C is one too; this family is the INDEFINITE INTEGRAL:
  ∫ f(x) dx = F(x) + C.

WHAT DOES IT MEAN?
If differentiating means "finding the rate", antidifferentiating means "going from the rate back to the quantity". The curves for different C are vertical shifts of each other; all have tangent slope f(x) at the same x.

BASIC FORMULAS
• ∫ xⁿ dx = xⁿ⁺¹/(n+1) + C  (n ≠ −1);   for n = −1: ∫ 1/x dx = ln|x| + C
• ∫ eˣ dx = eˣ + C;   ∫ aˣ dx = aˣ/ln a + C
• ∫ sin x dx = −cos x + C;   ∫ cos x dx = sin x + C
• ∫ sec² x dx = tan x + C;   ∫ csc² x dx = −cot x + C;   ∫ sec x tan x dx = sec x + C
• ∫ 1/√(1−x²) dx = arcsin x + C;   ∫ 1/(1+x²) dx = arctan x + C
• ∫ sinh x dx = cosh x + C;   ∫ cosh x dx = sinh x + C
LINEARITY: ∫ [a·f + b·g] dx = a∫ f dx + b∫ g dx.

METHOD
1. Let's write roots and x in the denominator as powers (√x = x^(1/2), 1/x³ = x⁻³).
2. Split into terms and pull out the constants.
3. Write the antiderivative of each term from the table.
4. Add a single + C at the end.
5. Check by differentiating: F′ must equal f.
INITIAL-VALUE PROBLEM: if F(x₀) = y₀ is given, we substitute x = x₀ in the general solution and solve for C.

MOTION: a(t) → v(t) = ∫a dt + v₀ → s(t) = ∫v dt + s₀. Under gravity a = −9.8 m/s².

PITFALLS
• Don't forget C. • The power rule fails for n = −1 (we get ln|x|). • ∫ sin x dx = −cos x (watch the minus sign). • Products and quotients are not integrated term by term (∫ f·g ≠ ∫f·∫g).

MINI EXAMPLE
∫ (3x² + 4/√x) dx = ∫ (3x² + 4x^(−1/2)) dx = x³ + 8x^(1/2) + C. Check: (x³ + 8√x)′ = 3x² + 4/√x ✓.

WHERE IS IT USED?
Velocity and position from acceleration, shear force and bending moment from a load distribution, volume from flow rate: all "accumulation" calculations.`);
  }

  // ---------- controls ----------
  let sC = null, sX = null, sT = null;
  function syncReg(reg) {
    if (!reg) return;
    const v = reg.get();
    reg.valueLabel.textContent = fmt2(v);
    const ratio = (v - reg.min) / (reg.max - reg.min);
    reg.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
  }
  function buildControls(rightCol, getProblem, h) {
    sC = h.addSlider({ caption: tx('Sabit C (G(x) + C)', 'Constant C (G(x) + C)'), min: -20, max: 20, step: 0.5, get: () => getProblem().Cs, set: (v) => { getProblem().Cs = v; } });
    sX = h.addSlider({ caption: tx('Teğet noktası x (eğri ailesi)', 'Tangent point x (curve family)'), min: -4, max: 4, step: 0.5, get: () => getProblem().xt, set: (v) => { getProblem().xt = v; } });
    sT = h.addSlider({ caption: tx('Zaman t (hareket sorusunda)', 'Time t (motion problem)'), min: 0, max: 6, step: 0.5, get: () => getProblem().t0 === undefined ? 0 : getProblem().t0, set: (v) => { getProblem().t0 = v; } });
  }

  // links: force a problem type / a basic formula for the "▶ Soru" buttons
  function makeType(t) {
    return (rng) => { const old = forced; forced = t; try { return createProblem(rng); } finally { forced = old; } };
  }
  function makeKind(kind) {
    return (rng) => {
      const p = makeType(2)(rng);
      if (p.terms[1].k !== kind) {
        if (p.terms[2].k === kind) p.terms[2].k = p.terms[1].k === 'sin' ? 'cos' : 'sin';
        p.terms[1].k = kind;
        if (p.terms[2].k === kind) p.terms[2].k = kind === 'sin' ? 'cos' : 'sin';
      }
      return p;
    };
  }

  Topics.register('integrals', {
    id: 'antiderivatives',
    tabTitle: () => tx('Ters Türev ve Belirsiz İntegral', 'Antiderivatives and Indefinite Integrals'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s*• ∫ xⁿ dx/, make: makeType(0) },
      { match: /^\s*• ∫ eˣ dx/, make: makeKind('exp') },
      { match: /^\s*• ∫ sin x dx/, make: makeKind('sin') },
      { match: /^\s*• ∫ sec² x dx/, make: makeKind('sec2') },
      { match: /^\s*• ∫ 1\/√\(1−x²\) dx/, make: makeKind('asin') },
      { match: /^\s*• ∫ sinh x dx/, make: makeKind('sinh') },
      { match: /^(BAŞLANGIÇ DEĞER PROBLEMİ|INITIAL-VALUE PROBLEM):/, make: makeType(3) },
      { match: /^(HAREKET|MOTION):/, make: makeType(4) },
    ],
    _scenarioCount: () => 6,
    _setScenario: (i) => { forced = i % 6; },
    _answer: (p) => p,
    _lib: { fSum, GSum, Gparts, Gexact, polyEval },
  });
})();
