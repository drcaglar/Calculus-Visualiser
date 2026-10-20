// Exponential Functions (chapter 'functions'). Thomas 1.5, Stewart 1.4.
// General model:  f(x) = a * B^(m x + q) + k      (B = bf.n/bf.d, or e when isE)
// problem.kind: 'eval' | 'compare' | 'range' | 'twoPoints' | 'dbl' | 'half' | 'dtime' | 'compound' | 'same' | 'rewrite' | 'ln'
// The sliders move an "explorer" curve g(x) = A B^x + K and a tracking point (problem curve stays fixed).
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (n) => (n < 0 ? '(' + S(n) + ')' : S(n));
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(dec === undefined ? 4 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  const money = (v) => M(v.toFixed(2));
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
  function frPow(b, e) { // rational base, integer exponent
    const bn = e >= 0 ? b.n : b.d, bd = e >= 0 ? b.d : b.n;
    return fr(Math.pow(bn, Math.abs(e)), Math.pow(bd, Math.abs(e)));
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const nice = (v) => { const s = [5, 8, 10, 15, 20, 30, 40, 60, 80, 100, 150]; return s.find((q) => q >= v) || 150; };

  // ---------- expression strings ----------
  const bS = (p) => (p.isE ? 'e' : (p.bf.d === 1 ? String(p.bf.n) : '(' + p.bf.n + '/' + p.bf.d + ')'));
  function expStr(m, q) {
    let s = m === 1 ? 'x' : (m === -1 ? '−x' : S(m) + 'x');
    if (q !== 0) s += q < 0 ? ' − ' + (-q) : ' + ' + q;
    return s;
  }
  function fStr(p) {
    const co = p.a === 1 ? '' : (p.a === -1 ? '−' : S(p.a) + '·');
    const ex = (p.m === 1 && p.q === 0) ? 'x' : '(' + expStr(p.m, p.q) + ')';
    let s = `${co}${bS(p)}^${ex}`;
    if (p.k !== 0) s += p.k < 0 ? ' − ' + (-p.k) : ' + ' + p.k;
    return s;
  }
  const F = (p, x) => {
    const y = p.a * Math.pow(p.B, p.m * x + p.q) + p.k;
    return (isFinite(y) && Math.abs(y) < 1e7) ? y : NaN;
  };
  const isInc = (p) => (p.a > 0) === (p.B > 1);

  // ---------- problem generation ----------
  const BASES = [{ n: 2, d: 1 }, { n: 3, d: 1 }, { n: 4, d: 1 }, { n: 1, d: 2 }, { n: 1, d: 3 }, { n: 3, d: 2 }, { n: 2, d: 3 }];
  function setBase(p, bf) { p.bf = bf; p.isE = false; p.B = bf.n / bf.d; }
  function finish(p) {
    p.ex = { a: clamp(p.a, -4, 4), b: clamp(Math.round(p.B * 20) / 20, 0.25, 4), k: clamp(p.k, -4, 4), x: clamp(p.xt === undefined ? 1 : p.xt, -5, 5) };
    p.showE = false;
    return p;
  }
  function createProblem(rng) {
    const kinds = ['eval', 'eval', 'compare', 'range', 'range', 'twoPoints', 'dbl', 'half', 'dtime', 'compound', 'compound', 'same', 'rewrite', 'ln', 'ln'];
    const kind = rng.pick(kinds);
    const p = { kind, a: 1, m: 1, q: 0, h: 0, k: 0 };
    if (kind === 'eval') {
      for (let t = 0; t < 200; t++) {
        p.a = rng.pick([1, 2, 3, -1, -2, 4]); setBase(p, rng.pick(BASES));
        p.h = rng.pick([0, 0, 1, -1, 2]); p.k = rng.nextInt(-3, 4); p.x0 = rng.nextInt(-2, 4);
        const e = p.x0 - p.h;
        if (e < -3 || e > 4) continue;
        p.q = -p.h;
        const t1 = frPow(p.bf, e), at = fr(p.a * t1.n, t1.d);
        p.val = fr(at.n + p.k * at.d, at.d);
        if (Math.abs(frV(p.val)) > 60 || p.val.d > 200) continue;
        break;
      }
      p.q = -p.h; p.xt = p.x0;
      p.pts = [{ x: p.x0, y: frV(p.val), l: true }, { x: 0, y: F(p, 0), l: false }];
    } else if (kind === 'compare') {
      const c = rng.pick([[2, 2], [3, 2], [3, 3]]);
      p.a = 1; setBase(p, { n: c[0], d: 1 }); p.pw = c[1]; p.x0 = rng.nextInt(1, 7); p.xt = p.x0;
      let big = 0; for (let x = 1; x <= 60; x++) if (Math.pow(c[0], x) <= Math.pow(x, c[1])) big = x;
      p.N = big + 1;
      p.pts = [{ x: p.x0, y: Math.pow(c[0], p.x0), l: true }, { x: p.x0, y: Math.pow(p.x0, c[1]), l: true }, { x: p.N, y: Math.pow(c[0], p.N), l: true }];
    } else if (kind === 'range') {
      p.a = rng.pick([1, 2, 3, -1, -2, -3]);
      const bs = rng.nextInt(0, 5);
      if (bs === 4) { p.isE = true; p.B = Math.E; p.bf = { n: 0, d: 1 }; } else setBase(p, rng.pick([{ n: 2, d: 1 }, { n: 3, d: 1 }, { n: 1, d: 2 }, { n: 1, d: 3 }]));
      p.h = rng.nextInt(-2, 3); p.k = rng.nextInt(-4, 5); p.q = -p.h; p.xt = 1;
      p.pts = [{ x: 0, y: F(p, 0), l: true }];
    } else if (kind === 'twoPoints') {
      p.dec = rng.nextInt(0, 2) === 1;
      const Bb = rng.pick([2, 3, 4]);
      p.x1 = rng.nextInt(0, 2); p.n = rng.pick([1, 2, 2, 3]); p.x2 = p.x1 + p.n;
      if (!p.dec) { p.a = rng.pick([1, 2, 3, 5]); setBase(p, { n: Bb, d: 1 }); if (Bb === 4 && p.n === 3) p.n = 2, p.x2 = p.x1 + 2; }
      else { const mm = rng.pick([1, 2, 3]); p.a = mm * Math.pow(Bb, p.x2); setBase(p, { n: 1, d: Bb }); }
      p.y1 = p.a * Math.pow(p.B, p.x1); p.y2 = p.a * Math.pow(p.B, p.x2);
      p.y1 = Math.round(p.y1); p.y2 = Math.round(p.y2);
      p.xt = p.x1;
      p.pts = [{ x: p.x1, y: p.y1, l: true }, { x: p.x2, y: p.y2, l: true }];
      if (p.a > 60) p.pts.push({ x: 0, y: 0, l: false });
    } else if (kind === 'dbl') {
      p.N0 = rng.pick([100, 200, 500, 1000]); p.d = rng.pick([2, 3, 4, 5, 6]); p.mm = rng.nextInt(1, 5);
      do { p.j = rng.nextInt(3, 6); } while (p.j === p.mm);
      setBase(p, { n: 2, d: 1 }); p.xt = p.mm;
      p.pts = [{ x: p.mm, y: Math.pow(2, p.mm), l: true }, { x: p.j, y: Math.pow(2, p.j), l: true }];
    } else if (kind === 'half') {
      p.c = rng.nextInt(1, 10); p.N0 = 64 * p.c; p.h = rng.pick([3, 5, 8, 12, 20]); p.mm = rng.nextInt(1, 5);
      do { p.j = rng.nextInt(2, 6); } while (p.j === p.mm);
      setBase(p, { n: 1, d: 2 }); p.xt = p.mm;
      p.pts = [{ x: p.mm, y: Math.pow(0.5, p.mm), l: true }, { x: p.j, y: Math.pow(0.5, p.j), l: true }];
    } else if (kind === 'dtime') {
      p.r = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 10]); p.B = Math.exp(p.r / 100); p.isE = false; p.bf = { n: 1, d: 1 };
      p.td = Math.LN2 / (p.r / 100); p.xt = Math.round(p.td);
      p.pts = [{ x: p.td, y: 2, l: true }, { x: Math.log(3) / (p.r / 100), y: 3, l: true }];
      p.view = { X: 40, Y: 8 };
    } else if (kind === 'compound') {
      p.P0 = rng.pick([1000, 2000, 5000, 10000]); p.r = rng.pick([3, 4, 5, 6, 8]); p.n = rng.pick([1, 2, 4, 12]); p.t = rng.pick([2, 3, 5, 8, 10]);
      p.B = Math.pow(1 + p.r / 100 / p.n, p.n); p.isE = false; p.bf = { n: 1, d: 1 };
      p.A1 = p.P0 * Math.pow(1 + p.r / 100 / p.n, p.n * p.t); p.A2 = p.P0 * Math.exp(p.r / 100 * p.t); p.xt = p.t;
      p.pts = [{ x: p.t, y: p.A1 / p.P0, l: true }, { x: p.t, y: p.A2 / p.P0, l: true }];
      p.view = { X: 12, Y: 5 };
    } else if (kind === 'same') {
      for (let t = 0; t < 300; t++) {
        setBase(p, rng.pick([{ n: 2, d: 1 }, { n: 3, d: 1 }, { n: 5, d: 1 }, { n: 1, d: 2 }, { n: 1, d: 3 }]));
        p.m = rng.pick([1, 2, 3, -1, -2]); p.q = rng.nextInt(-3, 4); p.x0 = rng.nextInt(-2, 4);
        p.e = p.m * p.x0 + p.q;
        if (p.e < -3 || p.e > 3) continue;
        p.R = frPow(p.bf, p.e);
        if (frV(p.R) > 100 || p.R.d > 200) continue;
        break;
      }
      p.xt = p.x0; p.pts = [{ x: p.x0, y: frV(p.R), l: true }];
    } else if (kind === 'rewrite') {
      p.cb = rng.pick([2, 2, 3]); p.u = rng.pick([2, 3]); p.v = rng.nextInt(1, p.cb === 2 ? 7 : 4); p.q = rng.nextInt(-3, 4);
      if (p.cb === 2 && p.u === 3 && p.v === 0) p.v = 1;
      p.B = Math.pow(p.cb, p.u); p.bf = { n: p.B, d: 1 }; p.isE = false; p.m = 1;
      p.xs = fr(p.v, p.u); p.xsv = frV(p.xs) - p.q; p.R = Math.pow(p.cb, p.v);
      p.xsF = fr(p.v - p.q * p.u, p.u);
      p.xt = clamp(Math.round(p.xsv), -5, 5); p.pts = [{ x: p.xsv, y: p.R, l: true }];
    } else { // ln
      p.a = rng.pick([1, 2, 3, 4, 5]); const bs = rng.pick(['e', 'e', 2, 3, 10]);
      if (bs === 'e') { p.isE = true; p.B = Math.E; p.bf = { n: 0, d: 1 }; } else setBase(p, { n: bs, d: 1 });
      p.m = rng.pick([1, 2, 3, -1]); p.c = rng.pick([5, 10, 20, 40]);
      if (p.c === p.a) p.c += 5;
      p.xs = Math.log(p.c / p.a) / (p.m * Math.log(p.B)); p.xt = clamp(Math.round(p.xs), -5, 5);
      p.pts = [{ x: p.xs, y: p.c, l: true }];
    }
    return finish(p);
  }

  // ---------- problem statement ----------
  function problemStatement(p) {
    const f = fStr(p);
    switch (p.kind) {
      case 'eval':
        return Tx(`f(x) = ${f} fonksiyonu için f(${S(p.x0)}) değerini hesaplayalım. Fonksiyon büyüyor mu, azalıyor mu; yatay asimptotu ve görüntü kümesi nedir?`,
          `For f(x) = ${f}, let's compute f(${S(p.x0)}). Is the function growing or decaying, and what are its horizontal asymptote and range?`);
      case 'compare':
        return Tx(`f(x) = ${p.bf.n}^x ve g(x) = x^${p.pw} fonksiyonlarını x = ${p.x0} noktasında karşılaştıralım. Üstel fonksiyon hangi tamsayıdan sonra g'yi kalıcı olarak geçer?`,
          `Let's compare f(x) = ${p.bf.n}^x and g(x) = x^${p.pw} at x = ${p.x0}. From which integer on does the exponential stay permanently above g?`);
      case 'range':
        return Tx(`f(x) = ${f} fonksiyonunun tanım kümesini, görüntü kümesini, yatay asimptotunu ve eksenleri kestiği noktaları bulalım.`,
          `For f(x) = ${f}, let's find the domain, range, horizontal asymptote and the axis intercepts.`);
      case 'twoPoints':
        return Tx(`f(x) = a·b^x üstel fonksiyonunun grafiği (${p.x1}, ${p.y1}) ve (${p.x2}, ${p.y2}) noktalarından geçiyor. a ve b kaç olur? Fonksiyon büyüyor mu azalıyor mu?`,
          `The exponential f(x) = a·b^x passes through (${p.x1}, ${p.y1}) and (${p.x2}, ${p.y2}). What are a and b? Is it growth or decay?`);
      case 'dbl':
        return Tx(`Bir bakteri kültürü her ${p.d} saatte bir ikiye katlanıyor ve başlangıçta ${p.N0} bakteri var. ${p.mm * p.d} saat sonra kaç bakteri olur; ${p.N0 * Math.pow(2, p.j)} bakteriye kaç saatte ulaşılır?`,
          `A bacteria culture doubles every ${p.d} hours and starts with ${p.N0} cells. How many cells are there after ${p.mm * p.d} hours, and how long until it reaches ${p.N0 * Math.pow(2, p.j)} cells?`);
      case 'half':
        return Tx(`Bir radyoaktif örneğin yarı ömrü ${p.h} gündür ve başlangıçta ${p.N0} mg vardır. ${p.mm * p.h} gün sonra kaç mg kalır; miktar ${p.N0 / Math.pow(2, p.j)} mg'a kaç günde iner?`,
          `A radioactive sample has half-life ${p.h} days and starts at ${p.N0} mg. How much remains after ${p.mm * p.h} days, and when does it drop to ${p.N0 / Math.pow(2, p.j)} mg?`);
      case 'dtime':
        return Tx(`Bir nüfus P(t) = P₀·e^(${p.r / 100}t) yasasıyla (t yıl) sürekli büyüyor. İkiye katlanma süresi kaç yıldır? 3 katına çıkma süresi kaç yıldır?`,
          `A population grows continuously as P(t) = P₀·e^(${p.r / 100}t) (t in years). What is its doubling time? And its tripling time?`);
      case 'compound':
        return Tx(`${p.P0} TL, yıllık %${p.r} faizle ${p.t} yıl yatırılıyor. Faiz yılda ${p.n} kez eklenirse ve sürekli eklenirse son para ne olur? Aradaki fark kaç TL'dir?`,
          `${p.P0} TL is invested at ${p.r}% per year for ${p.t} years. What is the final amount with ${p.n} compounding(s) per year and with continuous compounding? How big is the difference?`);
      case 'same':
        return Tx(`${bS(p)}^(${expStr(p.m, p.q)}) = ${frS(p.R)} denklemini taban eşitleyerek çözelim.`,
          `Let's solve ${bS(p)}^(${expStr(p.m, p.q)}) = ${frS(p.R)} by matching the bases.`);
      case 'rewrite':
        return Tx(`${p.B}^(x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)}) = ${p.R} denklemini, iki tarafı aynı tabanda yazarak çözelim.`.replace(' + 0', '').replace(' − 0', ''),
          `Let's solve ${p.B}^(x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)}) = ${p.R} by writing both sides with the same base.`.replace(' + 0', '').replace(' − 0', ''));
      default:
        return Tx(`${p.a === 1 ? '' : p.a + '·'}${bS(p)}^(${expStr(p.m, 0)}) = ${p.c} denklemini ln kullanarak çözelim. x kaç olur?`,
          `Let's solve ${p.a === 1 ? '' : p.a + '·'}${bS(p)}^(${expStr(p.m, 0)}) = ${p.c} using ln. What is x?`);
    }
  }

  // ---------- worked solution ----------
  function growthLine(p) {
    const inc = isInc(p);
    const b = p.isE ? 'e ≈ 2,718' : bS(p);
    let tr, en;
    if (p.a > 0) {
      tr = p.B > 1 ? `Taban b = ${b} > 1 ve a > 0 olduğundan fonksiyon ARTAN (üstel büyüme).` : `Taban b = ${b} 0 ile 1 arasında ve a > 0 olduğundan fonksiyon AZALAN (üstel azalma).`;
      en = p.B > 1 ? `Base b = ${b} > 1 and a > 0, so the function is INCREASING (exponential growth).` : `Base b = ${b} is between 0 and 1 and a > 0, so the function is DECREASING (exponential decay).`;
    } else {
      tr = `a < 0 olduğundan grafik x-eksenine göre yansır; b ${p.B > 1 ? '> 1' : '< 1'} olduğu için fonksiyon ${inc ? 'ARTAN' : 'AZALAN'}.`;
      en = `Since a < 0 the graph is reflected in the x-axis; with b ${p.B > 1 ? '> 1' : '< 1'} the function is ${inc ? 'INCREASING' : 'DECREASING'}.`;
    }
    return Tx(tr, en);
  }
  function rangeLines(p) {
    const k = S(p.k);
    return Tx(`Tanım kümesi: ℝ (üs her x için tanımlı).\nYatay asimptot: y = ${k}.\nGörüntü kümesi: ${p.a > 0 ? `(${k}, ∞)` : `(−∞, ${k})`} — çünkü b^(...) > 0 olduğundan ${p.a > 0 ? 'a·b^(...) > 0' : 'a·b^(...) < 0'} ve f(x) ${p.a > 0 ? '>' : '<'} ${k}.`,
      `Domain: ℝ (the exponent is defined for every x).\nHorizontal asymptote: y = ${k}.\nRange: ${p.a > 0 ? `(${k}, ∞)` : `(−∞, ${k})`} — because b^(...) > 0 gives ${p.a > 0 ? 'a·b^(...) > 0' : 'a·b^(...) < 0'}, so f(x) ${p.a > 0 ? '>' : '<'} ${k}.`);
  }

  function solveSteps(p) {
    const steps = []; let n = 0;
    const add = (tt, te, bt, be) => { n++; steps.push(`── ${n}) ${Tx(tt, te)} ──\n${Tx(bt, be === undefined ? bt : be)}`); };
    const f = fStr(p);
    if (p.kind === 'eval') {
      const e = p.x0 - p.h;
      add('Fonksiyonu tanıyalım', 'Reading the function',
        `f(x) = a·b^(x − h) + k biçiminde:\na = ${S(p.a)},  b = ${p.bf.d === 1 ? p.bf.n : p.bf.n + '/' + p.bf.d},  h = ${S(p.h)} (yatay kayma),  k = ${S(p.k)} (dikey kayma).\n${growthLine(p)}`,
        `In the form f(x) = a·b^(x − h) + k:\na = ${S(p.a)},  b = ${p.bf.d === 1 ? p.bf.n : p.bf.n + '/' + p.bf.d},  h = ${S(p.h)} (horizontal shift),  k = ${S(p.k)} (vertical shift).\n${growthLine(p)}`);
      const t1 = frPow(p.bf, e), at = fr(p.a * t1.n, t1.d);
      add(`x = ${S(p.x0)} yazalım`, `Substituting x = ${S(p.x0)}`,
        `Üs: x − h = ${P(p.x0)} − ${P(p.h)} = ${S(e)}\n${bS(p)}^${P(e)} = ${frS(t1)}${e < 0 ? '   (negatif üs tabanı ters çevirir)' : ''}\na·b^(x − h) = ${P(p.a)}·${frS(t1).includes('/') ? '(' + frS(t1) + ')' : frS(t1)} = ${frS(at)}\nf(${S(p.x0)}) = ${frS(at)} ${p.k < 0 ? '−' : '+'} ${Math.abs(p.k)} = ${frS(p.val)}  ≈ ${nf(frV(p.val), 4)}`,
        `Exponent: x − h = ${P(p.x0)} − ${P(p.h)} = ${S(e)}\n${bS(p)}^${P(e)} = ${frS(t1)}${e < 0 ? '   (a negative exponent flips the base)' : ''}\na·b^(x − h) = ${P(p.a)}·${frS(t1).includes('/') ? '(' + frS(t1) + ')' : frS(t1)} = ${frS(at)}\nf(${S(p.x0)}) = ${frS(at)} ${p.k < 0 ? '−' : '+'} ${Math.abs(p.k)} = ${frS(p.val)}  ≈ ${nf(frV(p.val), 4)}`);
      add('Alan, görüntü, asimptot', 'Domain, range, asymptote', rangeLines(p));
      const f0 = F(p, 0);
      add('y-kesişimi ve sağlama', 'y-intercept and check',
        `f(0) = ${f0 === Math.round(f0) ? S(f0) : nf(f0, 4)} noktasında y-eksenini keseriz.\nSağlama: f(${S(p.x0)}) = ${nf(F(p, p.x0), 4)} (hesap makinesiyle aynı).`,
        `The graph meets the y-axis at f(0) = ${f0 === Math.round(f0) ? S(f0) : nf(f0, 4)}.\nCheck: f(${S(p.x0)}) = ${nf(F(p, p.x0), 4)} (matches a calculator).`);
    } else if (p.kind === 'compare') {
      const B = p.bf.n, pw = p.pw, x0 = p.x0, fv = Math.pow(B, x0), gv = Math.pow(x0, pw);
      add('İki fonksiyon', 'The two functions', `f(x) = ${B}^x  (üstel: değişken üste)\ng(x) = x^${pw}  (kuvvet: değişken tabanda)`,
        `f(x) = ${B}^x  (exponential: variable in the exponent)\ng(x) = x^${pw}  (power: variable in the base)`);
      add(`x = ${x0} değerleri`, `Values at x = ${x0}`, `f(${x0}) = ${B}^${x0} = ${fv}\ng(${x0}) = ${x0}^${pw} = ${gv}\n${fv > gv ? 'Burada üstel fonksiyon daha büyüktür' : fv < gv ? 'Burada kuvvet fonksiyonu daha büyüktür' : 'İkisi eşittir'}.`,
        `f(${x0}) = ${B}^${x0} = ${fv}\ng(${x0}) = ${x0}^${pw} = ${gv}\n${fv > gv ? 'Here the exponential is larger' : fv < gv ? 'Here the power function is larger' : 'The two are equal'}.`);
      let rows = '';
      for (let x = 1; x <= p.N + 1; x++) { const a = Math.pow(B, x), b = Math.pow(x, pw); rows += `x = ${x}:  ${B}^x = ${a},  x^${pw} = ${b}   ${a > b ? '→ f > g' : a < b ? '→ f < g' : '→ eşit'}\n`; }
      add('Küçük bir tablo', 'A small table', rows.trim(), rows.trim().replace(/eşit/g, 'equal'));
      add('Sonuç', 'Conclusion', `x = ${p.N - 1} değerinden sonra ilk kez f(x) > g(x) oluyor ve (üstel büyüme kuvvet büyümesini hep geride bıraktığı için) bu durum kalıcıdır: x ≥ ${p.N} için ${B}^x > x^${pw}.\nGenel ilke: b > 1 için bˣ, her x^p'den sonunda daha hızlı büyür.`,
        `From x = ${p.N} on we get f(x) > g(x), and it stays that way (an exponential eventually outgrows every power): for x ≥ ${p.N}, ${B}^x > x^${pw}.\nGeneral principle: for b > 1, bˣ eventually grows faster than any x^p.`);
    } else if (p.kind === 'range') {
      const bd = p.isE ? 'e' : bS(p);
      add('Parametreleri okuyalım', 'Reading the parameters', `f(x) = a·b^(x − h) + k:  a = ${S(p.a)}, b = ${bd}, h = ${S(p.h)}, k = ${S(p.k)}.\n${growthLine(p)}`,
        `f(x) = a·b^(x − h) + k:  a = ${S(p.a)}, b = ${bd}, h = ${S(p.h)}, k = ${S(p.k)}.\n${growthLine(p)}`);
      add('Alan, görüntü, asimptot', 'Domain, range, asymptote', rangeLines(p) + Tx(`\nAsimptota ${(p.B > 1) === true ? 'x → −∞' : 'x → +∞'} iken yaklaşırız.`, `\nWe approach the asymptote as ${(p.B > 1) === true ? 'x → −∞' : 'x → +∞'}.`));
      const f0 = F(p, 0);
      add('y-kesişimi', 'y-intercept', `f(0) = ${S(p.a)}·${bd}^(${S(-p.h)}) ${p.k < 0 ? '−' : '+'} ${Math.abs(p.k)} = ${p.isE ? nf(f0, 4) : (() => { const t = frPow(p.bf, -p.h), v = fr(p.a * t.n + p.k * t.d, t.d); return frS(v) + (v.d === 1 ? '' : '  ≈ ' + nf(frV(v), 4)); })()}`,
        `f(0) = ${S(p.a)}·${bd}^(${S(-p.h)}) ${p.k < 0 ? '−' : '+'} ${Math.abs(p.k)} = ${p.isE ? nf(f0, 4) : (() => { const t = frPow(p.bf, -p.h), v = fr(p.a * t.n + p.k * t.d, t.d); return frS(v) + (v.d === 1 ? '' : '  ≈ ' + nf(frV(v), 4)); })()}`);
      const r = -p.k / p.a;
      if (r > 0) {
        const xi = p.h + Math.log(r) / Math.log(p.B);
        add('x-kesişimi', 'x-intercept', `f(x) = 0  ⇒  ${bd}^(x − ${S(p.h)}) = ${frS(fr(-p.k, p.a))}  ⇒  x − ${S(p.h)} = ln(${frS(fr(-p.k, p.a))}) / ln ${p.isE ? 'e' : nf(p.B, 4)}\nx = ${nf(xi, 4)}  (f(${nf(xi, 4)}) ≈ ${nf(F(p, xi), 4)})`,
          `f(x) = 0  ⇒  ${bd}^(x − ${S(p.h)}) = ${frS(fr(-p.k, p.a))}  ⇒  x − ${S(p.h)} = ln(${frS(fr(-p.k, p.a))}) / ln ${p.isE ? 'e' : nf(p.B, 4)}\nx = ${nf(xi, 4)}  (f(${nf(xi, 4)}) ≈ ${nf(F(p, xi), 4)})`);
      } else {
        add('x-kesişimi', 'x-intercept', `f(x) = 0 olması için b^(x − h) = ${frS(fr(-p.k, p.a))} ≤ 0 gerekir; üstel terim hiçbir zaman ≤ 0 olmaz. Bu nedenle x-eksenini kesmez (0, görüntü kümesinde değildir).`,
          `f(x) = 0 would need b^(x − h) = ${frS(fr(-p.k, p.a))} ≤ 0, but an exponential term is never ≤ 0. So there is no x-intercept (0 is not in the range).`);
      }
      add('Sağlama', 'Check', `Grafikte y = ${S(p.k)} doğrusuna yaklaşan ve ${isInc(p) ? 'yukarı doğru artan' : 'aşağı doğru azalan'} bir eğri bekleriz; bulduklarımız bununla tutarlıdır.`,
        `We expect a curve that approaches the line y = ${S(p.k)} and ${isInc(p) ? 'rises' : 'falls'}; our results agree with that.`);
    } else if (p.kind === 'twoPoints') {
      const rt = fr(p.y2, p.y1);
      add('Koşulları yazalım', 'Writing the conditions', `a·b^${p.x1} = ${p.y1}     ve     a·b^${p.x2} = ${p.y2}`, `a·b^${p.x1} = ${p.y1}     and     a·b^${p.x2} = ${p.y2}`);
      add('Oranlayalım', 'Dividing', `İkinci eşitliği birinciye bölersek a sadeleşir:\nb^(${p.x2} − ${p.x1}) = b^${p.n} = ${p.y2}/${p.y1} = ${frS(rt)}`,
        `Dividing the second equation by the first cancels a:\nb^(${p.x2} − ${p.x1}) = b^${p.n} = ${p.y2}/${p.y1} = ${frS(rt)}`);
      add('b değerini bulalım', 'Finding b', `b = (${frS(rt)})^(1/${p.n}) = ${frS(p.bf)}   (b > 0 alınır; sağlama: (${frS(p.bf)})^${p.n} = ${frS(frPow(p.bf, p.n))})`,
        `b = (${frS(rt)})^(1/${p.n}) = ${frS(p.bf)}   (we take b > 0; check: (${frS(p.bf)})^${p.n} = ${frS(frPow(p.bf, p.n))})`);
      const t = frPow(p.bf, p.x1), av = fr(p.y1 * t.d, t.n);
      add('a değerini bulalım', 'Finding a', `a = ${p.y1} / b^${p.x1} = ${p.y1} / ${frS(t)} = ${frS(av)}`, `a = ${p.y1} / b^${p.x1} = ${p.y1} / ${frS(t)} = ${frS(av)}`);
      add('Sonuç ve sağlama', 'Result and check', `f(x) = ${frS(av)}·${bS(p)}^x  —  ${p.dec ? '0 < b < 1 olduğundan üstel AZALMA' : 'b > 1 olduğundan üstel BÜYÜME'}.\nSağlama: f(${p.x2}) = ${frS(av)}·${frS(frPow(p.bf, p.x2))} = ${p.y2} ✓`,
        `f(x) = ${frS(av)}·${bS(p)}^x  —  ${p.dec ? 'since 0 < b < 1 this is exponential DECAY' : 'since b > 1 this is exponential GROWTH'}.\nCheck: f(${p.x2}) = ${frS(av)}·${frS(frPow(p.bf, p.x2))} = ${p.y2} ✓`);
    } else if (p.kind === 'dbl') {
      const t1 = p.mm * p.d, T = p.N0 * Math.pow(2, p.j);
      add('Modeli kuralım', 'Setting up the model', `N(t) = N₀·2^(t/d), burada N₀ = ${p.N0}, d = ${p.d} saat.\n(Her d saatte bir çarpan 2 olur; t/d kaç kez ikiye katlandığını söyler.)`,
        `N(t) = N₀·2^(t/d) with N₀ = ${p.N0}, d = ${p.d} h.\n(The factor 2 is applied once per d hours; t/d counts the doublings.)`);
      add(`t = ${t1} saat`, `t = ${t1} hours`, `t/d = ${t1}/${p.d} = ${p.mm}\nN(${t1}) = ${p.N0}·2^${p.mm} = ${p.N0}·${Math.pow(2, p.mm)} = ${p.N0 * Math.pow(2, p.mm)}`,
        `t/d = ${t1}/${p.d} = ${p.mm}\nN(${t1}) = ${p.N0}·2^${p.mm} = ${p.N0}·${Math.pow(2, p.mm)} = ${p.N0 * Math.pow(2, p.mm)}`);
      add(`${T} bakteriye ulaşma süresi`, `Time to reach ${T} cells`, `${p.N0}·2^(t/${p.d}) = ${T}  ⇒  2^(t/${p.d}) = ${T / p.N0} = 2^${p.j}\nTabanlar eşit: t/${p.d} = ${p.j}  ⇒  t = ${p.j}·${p.d} = ${p.j * p.d} saat.`,
        `${p.N0}·2^(t/${p.d}) = ${T}  ⇒  2^(t/${p.d}) = ${T / p.N0} = 2^${p.j}\nBases are equal: t/${p.d} = ${p.j}  ⇒  t = ${p.j}·${p.d} = ${p.j * p.d} hours.`);
      add('Sağlama', 'Check', `${p.j} kez ikiye katlanma: ${p.N0}·2^${p.j} = ${T} ✓ (grafikte x = t/d ekseninde y = 2^x eğrisi).`, `${p.j} doublings: ${p.N0}·2^${p.j} = ${T} ✓ (the graph shows y = 2^x against x = t/d).`);
    } else if (p.kind === 'half') {
      const t1 = p.mm * p.h, X = p.N0 / Math.pow(2, p.j);
      add('Modeli kuralım', 'Setting up the model', `N(t) = N₀·(1/2)^(t/h), burada N₀ = ${p.N0} mg, h = ${p.h} gün.\n(Her yarı ömürde miktar yarıya iner; 0 < b = 1/2 < 1 olduğundan üstel azalma.)`,
        `N(t) = N₀·(1/2)^(t/h) with N₀ = ${p.N0} mg, h = ${p.h} days.\n(The amount halves every half-life; 0 < b = 1/2 < 1 gives exponential decay.)`);
      add(`t = ${t1} gün`, `t = ${t1} days`, `t/h = ${t1}/${p.h} = ${p.mm}\nN(${t1}) = ${p.N0}·(1/2)^${p.mm} = ${p.N0}/${Math.pow(2, p.mm)} = ${nf(p.N0 / Math.pow(2, p.mm), 4)} mg`,
        `t/h = ${t1}/${p.h} = ${p.mm}\nN(${t1}) = ${p.N0}·(1/2)^${p.mm} = ${p.N0}/${Math.pow(2, p.mm)} = ${nf(p.N0 / Math.pow(2, p.mm), 4)} mg`);
      add(`${X} mg'a iniş süresi`, `Time to drop to ${X} mg`, `${p.N0}·(1/2)^(t/${p.h}) = ${X}  ⇒  (1/2)^(t/${p.h}) = ${X}/${p.N0} = 1/${Math.pow(2, p.j)} = (1/2)^${p.j}\nt/${p.h} = ${p.j}  ⇒  t = ${p.j}·${p.h} = ${p.j * p.h} gün.`,
        `${p.N0}·(1/2)^(t/${p.h}) = ${X}  ⇒  (1/2)^(t/${p.h}) = ${X}/${p.N0} = 1/${Math.pow(2, p.j)} = (1/2)^${p.j}\nt/${p.h} = ${p.j}  ⇒  t = ${p.j}·${p.h} = ${p.j * p.h} days.`);
      add('Sağlama', 'Check', `${p.j} yarı ömür sonra ${p.N0}/${Math.pow(2, p.j)} = ${X} mg ✓.`, `After ${p.j} half-lives: ${p.N0}/${Math.pow(2, p.j)} = ${X} mg ✓.`);
    } else if (p.kind === 'dtime') {
      const r = p.r / 100, t3 = Math.log(3) / r;
      add('Denklemi kuralım', 'Setting up', `İkiye katlanma: P₀·e^(${r}·t) = 2P₀  ⇒  e^(${r}t) = 2.`, `Doubling: P₀·e^(${r}·t) = 2P₀  ⇒  e^(${r}t) = 2.`);
      add('ln alalım', 'Taking ln', `Her iki tarafın ln'ini alalım: ${r}·t = ln 2 ≈ ${nf(Math.LN2, 4)}\nt = ln 2 / ${r} = ${nf(p.td, 4)} yıl.\n(70 kuralı: 70/${p.r} = ${nf(70 / p.r, 2)} yıl; yaklaşık sonuç ✓)`,
        `Take ln of both sides: ${r}·t = ln 2 ≈ ${nf(Math.LN2, 4)}\nt = ln 2 / ${r} = ${nf(p.td, 4)} years.\n(Rule of 70: 70/${p.r} = ${nf(70 / p.r, 2)} years; a good approximation ✓)`);
      add('3 katına çıkma', 'Tripling', `e^(${r}t) = 3  ⇒  t = ln 3 / ${r} = ${nf(Math.log(3), 4)} / ${r} = ${nf(t3, 4)} yıl.`, `e^(${r}t) = 3  ⇒  t = ln 3 / ${r} = ${nf(Math.log(3), 4)} / ${r} = ${nf(t3, 4)} years.`);
      add('Sağlama', 'Check', `e^(${r}·${nf(p.td, 4)}) = ${nf(Math.exp(r * p.td), 4)} ≈ 2 ✓,  e^(${r}·${nf(t3, 4)}) = ${nf(Math.exp(r * t3), 4)} ≈ 3 ✓.\nNot: süre, P₀'dan bağımsızdır.`,
        `e^(${r}·${nf(p.td, 4)}) = ${nf(Math.exp(r * p.td), 4)} ≈ 2 ✓,  e^(${r}·${nf(t3, 4)}) = ${nf(Math.exp(r * t3), 4)} ≈ 3 ✓.\nNote: the time does not depend on P₀.`);
    } else if (p.kind === 'compound') {
      const rd = p.r / 100, nt = p.n * p.t, base = 1 + rd / p.n, rt = rd * p.t;
      add('Formüller', 'Formulas', `Dönemsel: A = P(1 + r/n)^(nt)      Sürekli: A = P·e^(rt)\nP = ${p.P0}, r = ${rd}, n = ${p.n}, t = ${p.t}`, `Periodic: A = P(1 + r/n)^(nt)      Continuous: A = P·e^(rt)\nP = ${p.P0}, r = ${rd}, n = ${p.n}, t = ${p.t}`);
      add('Dönemsel bileşik', 'Periodic compounding', `r/n = ${rd}/${p.n} = ${nf(rd / p.n, 6)}  ⇒  1 + r/n = ${nf(base, 6)}\nnt = ${p.n}·${p.t} = ${nt}\nA = ${p.P0}·${nf(base, 6)}^${nt} = ${p.P0}·${nf(Math.pow(base, nt), 6)} = ${money(p.A1)} TL`,
        `r/n = ${rd}/${p.n} = ${nf(rd / p.n, 6)}  ⇒  1 + r/n = ${nf(base, 6)}\nnt = ${p.n}·${p.t} = ${nt}\nA = ${p.P0}·${nf(base, 6)}^${nt} = ${p.P0}·${nf(Math.pow(base, nt), 6)} = ${money(p.A1)} TL`);
      add('Sürekli bileşik', 'Continuous compounding', `rt = ${rd}·${p.t} = ${nf(rt, 4)}\nA = ${p.P0}·e^${nf(rt, 4)} = ${p.P0}·${nf(Math.exp(rt), 6)} = ${money(p.A2)} TL`, `rt = ${rd}·${p.t} = ${nf(rt, 4)}\nA = ${p.P0}·e^${nf(rt, 4)} = ${p.P0}·${nf(Math.exp(rt), 6)} = ${money(p.A2)} TL`);
      add('Fark ve yorum', 'Difference and comment', `Fark = ${money(p.A2)} − ${money(p.A1)} = ${money(p.A2 - p.A1)} TL.\nn büyüdükçe (1 + r/n)^n → e^r olur; sürekli bileşik, dönemsel bileşiğin üst sınırıdır.`,
        `Difference = ${money(p.A2)} − ${money(p.A1)} = ${money(p.A2 - p.A1)} TL.\nAs n grows, (1 + r/n)^n → e^r; continuous compounding is the upper limit of periodic compounding.`);
    } else if (p.kind === 'same') {
      const Rs = frS(p.R);
      add('Sağ tarafı aynı tabanda yazalım', 'Writing the right side in the same base', `${bS(p)}^(${expStr(p.m, p.q)}) = ${Rs}\n${Rs} = ${bS(p)}^${P(p.e)}   (${bS(p)}^${P(p.e)} = ${Rs} ✓)`, `${bS(p)}^(${expStr(p.m, p.q)}) = ${Rs}\n${Rs} = ${bS(p)}^${P(p.e)}   (${bS(p)}^${P(p.e)} = ${Rs} ✓)`);
      add('Üsleri eşitleyelim', 'Equating exponents', `Üstel fonksiyon bire birdir (b > 0, b ≠ 1): tabanlar eşitse üsler eşittir.\n${expStr(p.m, p.q)} = ${S(p.e)}`, `The exponential is one-to-one (b > 0, b ≠ 1): equal bases force equal exponents.\n${expStr(p.m, p.q)} = ${S(p.e)}`);
      const rhs = p.e - p.q;
      add('x için çözelim', 'Solving for x', `${p.m === 1 ? '' : (p.m === -1 ? '−' : S(p.m))}x = ${S(p.e)} ${p.q < 0 ? '+' : '−'} ${Math.abs(p.q)} = ${S(rhs)}  ⇒  x = ${S(p.x0)}`, `${p.m === 1 ? '' : (p.m === -1 ? '−' : S(p.m))}x = ${S(p.e)} ${p.q < 0 ? '+' : '−'} ${Math.abs(p.q)} = ${S(rhs)}  ⇒  x = ${S(p.x0)}`);
      add('Sağlama', 'Check', `${bS(p)}^(${P(p.m)}·${P(p.x0)} ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)}) = ${bS(p)}^${P(p.e)} = ${Rs} ✓`, `${bS(p)}^(${P(p.m)}·${P(p.x0)} ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)}) = ${bS(p)}^${P(p.e)} = ${Rs} ✓`);
    } else if (p.kind === 'rewrite') {
      const lhs = `${p.B}^(x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)})`.replace(' + 0', '').replace(' − 0', '');
      add('İki tarafı da ' + p.cb + ' tabanında yazalım', 'Writing both sides with base ' + p.cb, `${p.B} = ${p.cb}^${p.u}  ve  ${p.R} = ${p.cb}^${p.v}\n(${p.cb}^${p.u})^(x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)}) = ${p.cb}^${p.v}`.replace(' + 0', '').replace(' − 0', ''),
        `${p.B} = ${p.cb}^${p.u}  and  ${p.R} = ${p.cb}^${p.v}\n(${p.cb}^${p.u})^(x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)}) = ${p.cb}^${p.v}`.replace(' + 0', '').replace(' − 0', ''));
      add('Üs kuralı', 'Power-of-a-power rule', `(a^m)^n = a^(mn) olduğundan:\n${p.cb}^(${p.u}(x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)})) = ${p.cb}^${p.v}  ⇒  ${p.u}(x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)}) = ${p.v}`.replace(' + 0', '').replace(' − 0', ''),
        `Since (a^m)^n = a^(mn):\n${p.cb}^(${p.u}(x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)})) = ${p.cb}^${p.v}  ⇒  ${p.u}(x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)}) = ${p.v}`.replace(' + 0', '').replace(' − 0', ''));
      add('x için çözelim', 'Solving for x', `x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)} = ${p.v}/${p.u} = ${frS(p.xs)}\nx = ${frS(p.xs)} ${p.q < 0 ? '+' : '−'} ${Math.abs(p.q)} = ${frS(p.xsF)}  ≈ ${nf(p.xsv, 4)}`.replace(' + 0', '').replace(' − 0', ''),
        `x ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)} = ${p.v}/${p.u} = ${frS(p.xs)}\nx = ${frS(p.xs)} ${p.q < 0 ? '+' : '−'} ${Math.abs(p.q)} = ${frS(p.xsF)}  ≈ ${nf(p.xsv, 4)}`.replace(' + 0', '').replace(' − 0', ''));
      add('Sağlama', 'Check', `${lhs} = ${p.B}^(${nf(p.xsv + p.q, 4)}) = ${nf(Math.pow(p.B, p.xsv + p.q), 4)} ≈ ${p.R} ✓`, `${lhs} = ${p.B}^(${nf(p.xsv + p.q, 4)}) = ${nf(Math.pow(p.B, p.xsv + p.q), 4)} ≈ ${p.R} ✓`);
    } else { // ln
      const co = p.a === 1 ? '' : p.a + '·', lnB = p.isE ? 1 : Math.log(p.B), cs = frS(fr(p.c, p.a));
      add('Üstel terimi yalnız bırakalım', 'Isolating the exponential', `${co}${bS(p)}^(${expStr(p.m, 0)}) = ${p.c}${p.a === 1 ? '' : `\n${bS(p)}^(${expStr(p.m, 0)}) = ${p.c}/${p.a} = ${cs}`}`, `${co}${bS(p)}^(${expStr(p.m, 0)}) = ${p.c}${p.a === 1 ? '' : `\n${bS(p)}^(${expStr(p.m, 0)}) = ${p.c}/${p.a} = ${cs}`}`);
      add('Her iki tarafın ln\'ini alalım', 'Taking ln of both sides', `ln(b^u) = u·ln b kuralıyla:\n${expStr(p.m, 0)}·ln ${p.isE ? 'e' : p.B} = ln(${cs})${p.isE ? '   (ln e = 1)' : ''}\n${expStr(p.m, 0)}·${nf(lnB, 4)} = ${nf(Math.log(p.c / p.a), 4)}`,
        `Using ln(b^u) = u·ln b:\n${expStr(p.m, 0)}·ln ${p.isE ? 'e' : p.B} = ln(${cs})${p.isE ? '   (ln e = 1)' : ''}\n${expStr(p.m, 0)}·${nf(lnB, 4)} = ${nf(Math.log(p.c / p.a), 4)}`);
      add('x değeri', 'Value of x', `x = ln(${cs}) / (${S(p.m)}·${nf(lnB, 4)}) = ${nf(p.xs, 4)}`, `x = ln(${cs}) / (${S(p.m)}·${nf(lnB, 4)}) = ${nf(p.xs, 4)}`);
      add('Sağlama', 'Check', `${co}${bS(p)}^(${S(p.m)}·${nf(p.xs, 4)}) = ${nf(p.a * Math.pow(p.B, p.m * p.xs), 3)} ≈ ${p.c} ✓`, `${co}${bS(p)}^(${S(p.m)}·${nf(p.xs, 4)}) = ${nf(p.a * Math.pow(p.B, p.m * p.xs), 3)} ≈ ${p.c} ✓`);
    }
    return steps;
  }

  // ---------- drawing ----------
  function view(p) {
    let X = 6, Y = 8;
    (p.pts || []).forEach((q) => { if (isFinite(q.x) && isFinite(q.y)) { X = Math.max(X, Math.abs(q.x) + 1); Y = Math.max(Y, Math.abs(q.y) * 1.15); } });
    if (p.view) { X = Math.max(X, p.view.X); Y = Math.max(Y, p.view.Y); }
    if (p.kind === 'compare') Y = Math.max(Y, 40);
    return [Math.min(X, 45), nice(Math.min(Y, 150))];
  }
  function draw(canvas, p) {
    try {
      const [X, Y] = view(p);
      canvas.setViewport(-X, X, -Y, Y);
      const ev = (g) => (x) => { const y = g(x); return isFinite(y) && Math.abs(y) < 1e6 ? y : NaN; };
      if (p.showE) canvas.addFunction({ evaluator: ev((x) => Math.exp(x)), color: canvas.gray(), thickness: 1.6, dashed: true, label: 'eˣ' });
      if (p.kind === 'compound') canvas.addFunction({ evaluator: ev((x) => Math.exp(p.r / 100 * x)), color: canvas.orange(), thickness: 2, dashed: true, label: Tx('sürekli', 'continuous') });
      if (p.kind === 'compare') canvas.addFunction({ evaluator: ev((x) => Math.pow(x, p.pw)), color: canvas.orange(), thickness: 2, dashed: false, label: `x^${p.pw}` });
      const ex = p.ex, g = (x) => ex.a * Math.pow(ex.b, x) + ex.k;
      canvas.addFunction({ evaluator: ev(g), color: canvas.purple(), thickness: 1.6, dashed: true, label: 'g' });
      canvas.addFunction({ evaluator: ev((x) => F(p, x)), color: canvas.accent(), thickness: 2.8, label: p.kind === 'compound' ? Tx('dönemsel', 'periodic') : 'f(x)' });
      if (p.k !== 0) canvas.addGuideLine({ axis: 'horizontal', position: p.k, color: canvas.green(), label: `y = ${nf(p.k, 2)}` });
      if (ex.k !== 0) canvas.addGuideLine({ axis: 'horizontal', position: ex.k, color: canvas.purple(), label: '' });
      if (p.kind === 'same' || p.kind === 'ln' || p.kind === 'rewrite') {
        const c = p.kind === 'ln' ? p.c : frV(p.R), xs = p.kind === 'ln' ? p.xs : (p.kind === 'same' ? p.x0 : p.xsv);
        canvas.addGuideLine({ axis: 'horizontal', position: c, color: canvas.green(), label: `y = ${nf(c, 2)}` });
        canvas.addSegment({ x1: xs, y1: 0, x2: xs, y2: c, color: canvas.gray(), dashed: true });
      }
      (p.pts || []).forEach((q) => {
        if (!isFinite(q.x) || !isFinite(q.y) || Math.abs(q.y) > Y || Math.abs(q.x) > X) return;
        canvas.addMarker({ x: q.x, y: q.y, color: canvas.gold(), radius: 6, label: q.l ? `(${nf(q.x, 2)}, ${nf(q.y, 2)})` : '' });
      });
      const ty = F(p, ex.x), gy = g(ex.x);
      if (isFinite(ty) && Math.abs(ty) <= Y) canvas.addMarker({ x: ex.x, y: ty, color: canvas.accent(), radius: 5, label: `f(${nf(ex.x, 1)}) = ${nf(ty, 2)}` });
      if (isFinite(gy) && Math.abs(gy) <= Y) canvas.addMarker({ x: ex.x, y: gy, color: canvas.purple(), radius: 5, shape: 'diamond', label: `g = ${nf(gy, 2)}` });
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({ caption: Tx('a (g için çarpan)', 'a (multiplier of g)'), min: -4, max: 4, step: 0.5, get: () => getProblem().ex.a, set: (v) => { getProblem().ex.a = v; } });
    h.addSlider({ caption: Tx('b (g için taban)', 'b (base of g)'), min: 0.25, max: 4, step: 0.05, get: () => getProblem().ex.b, set: (v) => { getProblem().ex.b = clamp(v, 0.25, 4); } });
    h.addSlider({ caption: Tx('k (g için dikey kayma)', 'k (vertical shift of g)'), min: -4, max: 4, step: 0.5, get: () => getProblem().ex.k, set: (v) => { getProblem().ex.k = v; } });
    h.addSlider({ caption: Tx('x (izlenen nokta)', 'x (tracking point)'), min: -5, max: 5, step: 0.1, get: () => getProblem().ex.x, set: (v) => { getProblem().ex.x = v; } });
    h.addCheckbox({ caption: Tx('eˣ eğrisini de çiz', 'Also draw eˣ'), get: () => getProblem().showE, set: (v) => { getProblem().showE = !!v; } });
  }

  function concept() {
    return Tx(
      'ÜSTEL FONKSİYONLAR\n\n' +
      'TANIM: b > 0 ve b ≠ 1 için f(x) = bˣ fonksiyonuna üstel fonksiyon denir. Değişken ÜSTTEDİR, taban sabittir (x² ise kuvvet fonksiyonudur: taban değişir, üs sabittir).\n\n' +
      'GENEL BİÇİM: f(x) = a·b^(x − h) + k\n' +
      '   a: dikey ölçek (a < 0 ise x-eksenine göre yansıma)\n' +
      '   h: yatay kayma,   k: dikey kayma (yatay asimptot y = k)\n\n' +
      'ÖZELLİKLER (f(x) = bˣ için):\n' +
      '   Tanım kümesi ℝ, görüntü kümesi (0, ∞); hep pozitif.\n' +
      '   Yatay asimptot y = 0; grafik (0, 1) noktasından geçer; x-eksenini kesmez.\n' +
      '   b > 1: artan, ÜSTEL BÜYÜME (x → ∞ iken hızla büyür, x → −∞ iken 0\'a yaklaşır).\n' +
      '   0 < b < 1: azalan, ÜSTEL AZALMA (b^x = (1/b)^(−x), grafik y-eksenine göre yansır).\n' +
      '   Bire birdir: bᵘ = bᵛ ise u = v.\n\n' +
      'ÜS KURALLARI: b^(u+v) = bᵘ·bᵛ,  b^(u−v) = bᵘ/bᵛ,  (bᵘ)ᵛ = b^(uv),  (ab)ˣ = aˣbˣ,  b^(−u) = 1/bᵘ,  b⁰ = 1.\n\n' +
      'e SAYISI: e ≈ 2,71828; (1 + 1/n)ⁿ ifadesinin n → ∞ limitidir. y = eˣ eğrisinin (0, 1) noktasındaki teğetinin eğimi tam 1\'dir; bu yüzden analizde doğal tabandır.\n\n' +
      'UYGULAMALAR:\n' +
      '   Bileşik faiz: A = P(1 + r/n)^(nt);  sürekli bileşik: A = P·e^(rt).\n' +
      '   Büyüme / azalma: N(t) = N₀·e^(kt). İkiye katlanma süresi t = ln 2 / k; yarı ömür t = ln 2 / |k|.\n\n' +
      'YÖNTEM (denklem/problem çözerken):\n' +
      '   1) Genel biçimi (a, b, h, k) tanıyalım.\n' +
      '   2) Veriyi yerine koyalım; iki nokta varsa oranlayarak b\'yi bulalım.\n' +
      '   3) Tabanlar aynı yapılabiliyorsa üsleri eşitleyelim; yapılamıyorsa ln alalım.\n' +
      '   4) Sonucu geri yerine koyup sağlayalım.\n\n' +
      'DİKKAT: bˣ ile x^b karıştırılmasın; (−2)ˣ gibi negatif tabanlar üstel fonksiyon değildir; f(x) = a·bˣ + k\'da asimptot k\'dır, 0 değil.\n\n' +
      'MİNİ ÖRNEK: f(x) = 2·3^x − 1: görüntü kümesi (−1, ∞), asimptot y = −1, f(0) = 1, f(2) = 17.\n' +
      'MÜHENDİSLİKTE: soğuma/ısınma, kondansatör deşarjı, radyoaktif bozunma, nüfus ve korozyon modellerinde.',
      'EXPONENTIAL FUNCTIONS\n\n' +
      'DEFINITION: For b > 0, b ≠ 1, f(x) = bˣ is an exponential function. The variable is in the EXPONENT and the base is constant (x² is a power function: variable base, constant exponent).\n\n' +
      'GENERAL FORM: f(x) = a·b^(x − h) + k\n' +
      '   a: vertical scale (a < 0 reflects in the x-axis)\n' +
      '   h: horizontal shift,   k: vertical shift (horizontal asymptote y = k)\n\n' +
      'PROPERTIES (for f(x) = bˣ):\n' +
      '   Domain ℝ, range (0, ∞); always positive.\n' +
      '   Horizontal asymptote y = 0; the graph passes through (0, 1); no x-intercept.\n' +
      '   b > 1: increasing, EXPONENTIAL GROWTH (rises quickly as x → ∞, tends to 0 as x → −∞).\n' +
      '   0 < b < 1: decreasing, EXPONENTIAL DECAY (b^x = (1/b)^(−x), a reflection in the y-axis).\n' +
      '   One-to-one: bᵘ = bᵛ implies u = v.\n\n' +
      'LAWS OF EXPONENTS: b^(u+v) = bᵘ·bᵛ,  b^(u−v) = bᵘ/bᵛ,  (bᵘ)ᵛ = b^(uv),  (ab)ˣ = aˣbˣ,  b^(−u) = 1/bᵘ,  b⁰ = 1.\n\n' +
      'THE NUMBER e: e ≈ 2.71828 is the limit of (1 + 1/n)ⁿ as n → ∞. The tangent to y = eˣ at (0, 1) has slope exactly 1, which is why e is the natural base of calculus.\n\n' +
      'APPLICATIONS:\n' +
      '   Compound interest: A = P(1 + r/n)^(nt);  continuous: A = P·e^(rt).\n' +
      '   Growth / decay: N(t) = N₀·e^(kt). Doubling time t = ln 2 / k; half-life t = ln 2 / |k|.\n\n' +
      'METHOD (equations / problems):\n' +
      '   1) Recognise the general form (a, b, h, k).\n' +
      '   2) Substitute the data; with two points, divide to find b.\n' +
      '   3) If the bases can be matched, equate the exponents; otherwise take ln.\n' +
      '   4) Substitute back to check.\n\n' +
      'PITFALLS: do not confuse bˣ with x^b; negative bases such as (−2)ˣ are not exponential functions; for f(x) = a·bˣ + k the asymptote is y = k, not 0.\n\n' +
      'MINI EXAMPLE: f(x) = 2·3^x − 1: range (−1, ∞), asymptote y = −1, f(0) = 1, f(2) = 17.\n' +
      'IN ENGINEERING: cooling/heating, capacitor discharge, radioactive decay, population and corrosion models.');
  }

  Topics.register('functions', {
    id: 'exponentialFunctions',
    tabTitle: () => Tx('Üstel Fonksiyonlar', 'Exponential Functions'),
    concept,
    problemStatement,
    createProblem,
    links: [
      { match: /^\s*(TANIM|DEFINITION)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'eval') },
      { match: /^\s*(GENEL BİÇİM|GENERAL FORM)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'range') },
      { match: /^\s*(ÖZELLİKLER \(|PROPERTIES \()/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'range') },
      { match: /^\s*(b > 1: artan|b > 1: increasing)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'dbl') },
      { match: /^\s*(0 < b < 1: azalan|0 < b < 1: decreasing)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'half') },
      { match: /^\s*(Bire birdir|One-to-one)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'rewrite') },
      { match: /^\s*(ÜS KURALLARI|LAWS OF EXPONENTS)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'same') },
      { match: /^\s*(Bileşik faiz|Compound interest)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'compound') },
      { match: /^\s*(Büyüme \/ azalma|Growth \/ decay)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'dtime') },
      { match: /^\s*(e SAYISI|THE NUMBER e)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'ln' && p.isE) },
    ],
    solveSteps,
    draw,
    buildControls,
  });
})();
