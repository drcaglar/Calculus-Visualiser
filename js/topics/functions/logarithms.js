// Logarithmic Functions (chapter 'functions'). Thomas 1.6, Stewart 1.5.
// problem.kind: 'eval' | 'special' | 'condense' | 'expand' | 'cob' | 'expEq' | 'expEq2' | 'logEq1' | 'logEq2' | 'domain' | 'inverse' | 'scale'
// Graph: y = log_b x (solid), its inverse y = b^x, the mirror line y = x, asymptote x = 0, marked points.
// Sliders move an "explorer" curve g(x) = log_b(x - h), its inverse and a mirror pair of points (fixed axes).
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
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const SUBD = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
  const subs = (n) => String(n).split('').map((c) => SUBD[c] || c).join('');
  const LG = (b) => (b === 'e' ? 'ln' : (b === 10 ? 'log' : 'log' + subs(b)));
  const bv = (b) => (b === 'e' ? Math.E : b);
  const bs = (b) => (b === 'e' ? 'e' : String(b));
  const lnb = (b) => Math.log(bv(b));
  const ipow = (c, v) => (v >= 0 ? String(Math.pow(c, v)) : '1/' + Math.pow(c, -v));
  const pw = (c, v) => (v < 0 ? c + '^' + S(v) : c + '^' + v);
  const nice = (v) => { const s = [8, 10, 12, 15, 20, 30, 40, 60]; return s.find((q) => q >= v) || 60; };
  // (x + p) style factor
  const xp = (p) => (p === 0 ? 'x' : (p > 0 ? `(x + ${p})` : `(x − ${-p})`));
  const lin = (a, c) => { // a x + c
    let s = a === 1 ? 'x' : (a === -1 ? '−x' : S(a) + 'x');
    if (c !== 0) s += c < 0 ? ' − ' + (-c) : ' + ' + c;
    return s;
  };
  const poly = (B, C) => 'x²' + (B === 0 ? '' : (B < 0 ? ' − ' + (-B === 1 ? '' : -B) + 'x' : ' + ' + (B === 1 ? '' : B) + 'x')) + (C === 0 ? '' : (C < 0 ? ' − ' + (-C) : ' + ' + C));

  // pre-computed 'logEq2' candidates: log_b(x+p) + log_b(x+q) = s with one valid and one extraneous root
  const LE2 = [];
  [2, 3, 5].forEach((b) => [1, 2].forEach((s) => {
    const B = Math.pow(b, s);
    for (let p = -4; p <= 4; p++) for (let q = p; q <= 4; q++) {
      const D2 = (p - q) * (p - q) + 4 * B, D = Math.round(Math.sqrt(D2));
      if (D * D !== D2 || (p + q + D) % 2 !== 0) continue;
      const r1 = (-(p + q) - D) / 2, r2 = (-(p + q) + D) / 2, lo = -Math.min(p, q);
      if (r2 > lo && r1 < lo && r2 <= 8) LE2.push({ b, s, p, q, B, r1, r2 });
    }
  }));

  // ---------- problem generation ----------
  function finish(p) {
    const gb = p.gb === undefined ? 2 : p.gb;
    p.gb = gb;
    p.ex = { b: clamp(Math.round(bv(gb) * 4) / 4, 0.25, 6), h: 0, x: clamp(p.xt === undefined ? 2 : p.xt, 0.2, 7.5) };
    if (Math.abs(p.ex.b - 1) < 1e-9) p.ex.b = 1.25;
    return p;
  }
  function createProblem(rng) {
    const kinds = ['eval', 'eval', 'special', 'condense', 'condense', 'expand', 'cob', 'expEq', 'expEq', 'expEq2', 'logEq1', 'logEq1', 'logEq2', 'logEq2', 'domain', 'domain', 'inverse', 'inverse', 'scale'];
    const kind = rng.pick(kinds);
    const p = { kind, pts: [], view: { X: 8, Y: 8 } };
    if (kind === 'eval') {
      for (let t = 0; t < 100; t++) {
        p.c = rng.pick([2, 2, 3, 5]); p.u = rng.pick(p.c === 5 ? [1, 2] : [1, 2, 3]); p.v = rng.nextInt(-3, 6);
        if (p.v === 0 || (p.c === 5 && Math.abs(p.v) > 3)) continue;
        break;
      }
      p.b = Math.pow(p.c, p.u); p.N = Math.pow(p.c, p.v); p.y = fr(p.v, p.u); p.gb = p.b;
      p.xt = clamp(p.N, 0.2, 7.5);
      p.pts = [{ x: p.N, y: frV(p.y), l: true }, { x: frV(p.y), y: p.N, l: true }];
    } else if (kind === 'special') {
      p.a = rng.nextInt(-3, 6); p.bb = rng.nextInt(1, 5); p.c = rng.pick([2, 3, 5, 7, 9]);
      p.cb = rng.pick([2, 3, 5]); p.cc = rng.nextInt(2, 9); p.res = p.a + p.bb + p.cc; p.gb = 'e'; p.xt = 2;
      p.pts = [{ x: Math.E, y: 1, l: true }, { x: 1, y: 0, l: true }];
    } else if (kind === 'condense') {
      for (let t = 0; t < 400; t++) {
        p.b = rng.pick([2, 3, 5, 10]); p.k = rng.nextInt(1, 4); p.m = rng.nextInt(1, 4); p.u = rng.pick([2, 3, 4, 5, 6]); p.w = rng.pick([2, 3, 4, 5, 6, 8, 9]);
        const R = Math.pow(p.b, p.k), num = R * p.w, den = Math.pow(p.u, p.m);
        if (num % den !== 0) continue;
        p.v = num / den;
        if (p.v < 2 || p.v > 80 || p.v === p.w) continue;
        break;
      }
      p.R = Math.pow(p.b, p.k); p.gb = p.b; p.xt = clamp(p.R, 0.2, 7.5);
      p.pts = [{ x: p.R, y: p.k, l: true }];
    } else if (kind === 'expand') {
      do { p.i = rng.nextInt(-3, 5); p.j = rng.nextInt(-2, 5); } while ((p.i === 0 && p.j === 0) || (p.i === 0) || (p.j === 0) || (p.i === 1 && p.j === 1));
      p.num = Math.pow(2, Math.max(p.i, 0)) * Math.pow(3, Math.max(p.j, 0)); p.den = Math.pow(2, Math.max(-p.i, 0)) * Math.pow(3, Math.max(-p.j, 0));
      p.val = p.i * Math.LN2 + p.j * Math.log(3); p.gb = 'e'; p.xt = clamp(p.num / p.den, 0.2, 7.5);
      p.pts = [{ x: p.num / p.den, y: p.val, l: true }];
    } else if (kind === 'cob') {
      p.b = rng.pick([2, 3, 5, 7]);
      do { p.N = rng.nextInt(3, 61); } while (Math.abs(Math.log(p.N) / Math.log(p.b) - Math.round(Math.log(p.N) / Math.log(p.b))) < 1e-9 || p.N === p.b);
      p.y = Math.log(p.N) / Math.log(p.b); p.gb = p.b; p.xt = clamp(p.N, 0.2, 7.5);
      p.pts = [{ x: p.N, y: p.y, l: true }];
    } else if (kind === 'expEq') {
      for (let t = 0; t < 300; t++) {
        p.b = rng.pick([2, 3, 5, 10, 'e']); p.a = rng.pick([1, 2, 3, 5]); p.m = rng.pick([1, 1, 2, 3, -1]); p.q = rng.nextInt(-2, 3); p.c = rng.pick([5, 10, 12, 20, 30, 40]);
        if (p.c === p.a) continue;
        p.xs = (Math.log(p.c / p.a) / lnb(p.b) - p.q) / p.m;
        if (Math.abs(p.xs) > 6) continue;
        break;
      }
      p.gb = p.b; p.xt = clamp(Math.abs(p.xs) < 0.2 ? 1 : p.xs, 0.2, 7.5);
      p.view = { X: 8, Y: nice(Math.max(8, p.c * 1.2)) };
      p.pts = [{ x: p.xs, y: p.c, l: true }];
    } else if (kind === 'expEq2') {
      for (let t = 0; t < 300; t++) {
        const bb = [2, 3, 5]; p.b1 = rng.pick(bb); p.b2 = rng.pick(bb); p.m1 = rng.nextInt(1, 4); p.m2 = rng.nextInt(1, 4); p.q1 = rng.nextInt(-2, 4); p.q2 = rng.nextInt(-2, 4);
        const den = p.m1 * Math.log(p.b1) - p.m2 * Math.log(p.b2);
        if (p.b1 === p.b2 || Math.abs(den) < 0.2) continue;
        p.xs = (p.q2 * Math.log(p.b2) - p.q1 * Math.log(p.b1)) / den;
        const yv = Math.pow(p.b1, p.m1 * p.xs + p.q1);
        if (Math.abs(p.xs) > 6 || !(yv < 60) || Math.abs(p.xs) < 0.05) continue;
        p.yv = yv;
        break;
      }
      p.gb = p.b1; p.xt = clamp(Math.abs(p.xs) < 0.2 ? 1 : Math.abs(p.xs), 0.2, 7.5);
      p.view = { X: 8, Y: nice(Math.max(8, p.yv * 1.3)) };
      p.pts = [{ x: p.xs, y: p.yv, l: true }];
    } else if (kind === 'logEq1') {
      p.b = rng.pick([2, 3, 5, 10, 'e']); p.a = rng.nextInt(1, 4);
      if (p.b === 'e') {
        p.s = rng.nextInt(1, 4); p.c = rng.nextInt(-3, 4); p.xs = (Math.exp(p.s) - p.c) / p.a;
      } else {
        p.s = p.b === 10 ? rng.nextInt(1, 3) : rng.nextInt(1, 4); p.x0 = rng.nextInt(-3, 6);
        p.c = Math.pow(p.b, p.s) - p.a * p.x0; p.xs = p.x0;
      }
      p.gb = p.b; p.xt = clamp(Math.abs(p.xs), 0.2, 7.5);
      p.pts = [{ x: p.xs, y: p.s, l: true }];
    } else if (kind === 'logEq2') {
      const e = rng.pick(LE2);
      p.b = e.b; p.s = e.s; p.p = e.p; p.q = e.q; p.B = e.B; p.r1 = e.r1; p.r2 = e.r2; p.xs = e.r2; p.gb = p.b; p.xt = clamp(p.r2, 0.2, 7.5);
      p.view = { X: 8, Y: 8 };
      p.pts = [{ x: p.r2, y: p.s, l: true }];
    } else if (kind === 'domain') {
      p.dt = rng.nextInt(0, 3);
      if (p.dt === 0) {
        p.b = rng.pick([2, 3, 10, 'e']); p.a = rng.pick([1, 2, 3, -1, -2, -3]); p.c = rng.nextInt(-6, 7); p.x0 = fr(-p.c, p.a);
      } else if (p.dt === 1) {
        p.r1 = rng.nextInt(-5, 3); p.r2 = p.r1 + rng.nextInt(1, 6);
        if (rng.nextInt(0, 3) === 0) { p.r2 = rng.nextInt(1, 5); p.r1 = -p.r2; }
        p.b = rng.pick([2, 10, 'e']);
      } else {
        p.r1 = rng.nextInt(-4, 5); p.r2 = rng.nextInt(-4, 5);
        while (p.r2 === p.r1) p.r2 = rng.nextInt(-4, 5);
        p.b = rng.pick([2, 10, 'e']); // ln((x - r1)/(x - r2)): zero at r1, undefined at r2
      }
      p.gb = p.b; p.xt = 2;
    } else if (kind === 'inverse') {
      p.it = rng.nextInt(0, 2);
      p.b = rng.pick([2, 3, 2, 5]);
      if (p.it === 0) {
        p.a = rng.pick([1, 2, 3, 4]); p.j = rng.nextInt(0, 3); p.t = p.a * Math.pow(p.b, p.j);
        p.pts = [{ x: p.j, y: p.t, l: true }, { x: p.t, y: p.j, l: true }];
      } else {
        p.h = rng.nextInt(-3, 4); p.k = rng.nextInt(-3, 4); p.j = rng.nextInt(0, 3); p.t = p.k + p.j; p.val = Math.pow(p.b, p.j) + p.h;
        p.pts = [{ x: p.val, y: p.t, l: true }, { x: p.t, y: p.val, l: true }];
      }
      p.gb = p.b; p.xt = 2; p.view = { X: 8, Y: 8 };
    } else { // scale
      p.sc = rng.nextInt(0, 3); p.gb = 10;
      if (p.sc === 0) { p.n = rng.nextInt(2, 11); p.am = rng.pick([1, 1, 2, 4, 5, 8]); p.val = p.n - Math.log10(p.am); p.arg = p.am * Math.pow(10, -p.n); p.pts = [{ x: p.am, y: Math.log10(p.am), l: true }]; }
      else if (p.sc === 1) { p.k = rng.nextInt(1, 10); p.n = rng.nextInt(2, 5); p.val = 10 * p.k; p.pts = [{ x: 10, y: 1, l: true }]; }
      else { p.k1 = rng.nextInt(5, 9); p.k2 = p.k1 - rng.nextInt(1, 4); p.d = p.k1 - p.k2; p.pts = [{ x: 10, y: 1, l: true }]; }
      p.xt = 2;
    }
    return finish(p);
  }

  // ---------- problem statement ----------
  function problemStatement(p) {
    switch (p.kind) {
      case 'eval': {
        const Ns = ipow(p.c, p.v);
        return Tx(`${LG(p.b)} ${Ns} değerini hesaplayalım, yani ${bs(p.b)}^y = ${Ns} eşitliğini sağlayan y kaç olur?`,
          `Let's evaluate ${LG(p.b)} ${Ns}, i.e. which y satisfies ${bs(p.b)}^y = ${Ns}?`);
      }
      case 'special':
        return Tx(`ln(e^${S(p.a)}) + log(10^${p.bb}) + ${p.cb}^(${LG(p.cb)} ${p.cc}) ifadesinin değeri kaç olur?`,
          `What is the value of ln(e^${S(p.a)}) + log(10^${p.bb}) + ${p.cb}^(${LG(p.cb)} ${p.cc})?`);
      case 'condense': {
        const e = `${p.m === 1 ? '' : p.m + '·'}${LG(p.b)} ${p.u} + ${LG(p.b)} ${p.v} − ${LG(p.b)} ${p.w}`;
        return Tx(`${e} ifadesini logaritma kurallarıyla tek bir logaritma olarak yazalım ve değerini bulalım.`,
          `Let's write ${e} as a single logarithm using the log laws and find its value.`);
      }
      case 'expand': {
        const Nst = p.den === 1 ? String(p.num) : p.num + '/' + p.den;
        return Tx(`ln 2 ≈ 0,6931 ve ln 3 ≈ 1,0986 olduğuna göre ln(${Nst}) yaklaşık kaç olur? (Hesap makinesi kullanmadan, logaritma kurallarıyla düşünelim.)`,
          `Given ln 2 ≈ 0.6931 and ln 3 ≈ 1.0986, what is ln(${Nst}) approximately? (Let's use the log laws, not a calculator.)`);
      }
      case 'cob':
        return Tx(`${LG(p.b)} ${p.N} değerini taban değiştirme formülüyle (ln kullanarak) 4 ondalık basamağa kadar hesaplayalım.`,
          `Let's compute ${LG(p.b)} ${p.N} to 4 decimal places using the change-of-base formula (with ln).`);
      case 'expEq': {
        const f = `${p.a === 1 ? '' : p.a + '·'}${bs(p.b)}^(${lin(p.m, p.q)}) = ${p.c}`;
        return Tx(`${f} denklemini logaritma yardımıyla çözelim. x kaç olur?`, `Let's solve ${f} using logarithms. What is x?`);
      }
      case 'expEq2': {
        const f = `${p.b1}^(${lin(p.m1, p.q1)}) = ${p.b2}^(${lin(p.m2, p.q2)})`;
        return Tx(`${f} denkleminin çözümünü bulalım. İki taraf aynı tabana getirilemediği için logaritmadan yararlanalım.`,
          `Let's find the solution of ${f}. The two sides cannot be written with the same base, so we use logarithms.`);
      }
      case 'logEq1': {
        const f = `${LG(p.b)}(${lin(p.a, p.c)}) = ${p.s}`;
        return Tx(`${f} denklemini çözelim ve çözümün tanım kümesine uyup uymadığını kontrol edelim.`,
          `Let's solve ${f} and check that the solution lies in the domain.`);
      }
      case 'logEq2': {
        const f = `${LG(p.b)}${xp(p.p)} + ${LG(p.b)}${xp(p.q)} = ${p.s}`;
        return Tx(`${f} denklemini çözelim. Bulduğumuz köklerden hangileri gerçekten çözümdür?`,
          `Let's solve ${f}. Which of the roots we find are real solutions?`);
      }
      case 'domain': {
        let f;
        if (p.dt === 0) f = `f(x) = ${LG(p.b)}(${lin(p.a, p.c)})`;
        else if (p.dt === 1) f = `f(x) = ${LG(p.b)}(${poly(-(p.r1 + p.r2), p.r1 * p.r2)})`;
        else f = `f(x) = ${LG(p.b)}(${xp(-p.r1)}/${xp(-p.r2)})`;
        return Tx(`${f} fonksiyonunun tanım kümesini ve (varsa) dikey asimptotlarını bulalım.`,
          `Let's find the domain of ${f} and its vertical asymptote(s), if any.`);
      }
      case 'inverse': {
        if (p.it === 0) return Tx(`f(x) = ${p.a === 1 ? '' : p.a + '·'}${p.b}^x fonksiyonunun tersini f⁻¹(x) bulalım ve f⁻¹(${p.t}) değerini hesaplayalım.`,
          `Let's find the inverse f⁻¹(x) of f(x) = ${p.a === 1 ? '' : p.a + '·'}${p.b}^x and compute f⁻¹(${p.t}).`);
        const f = `f(x) = ${LG(p.b)}(${lin(1, -p.h)}) ${p.k < 0 ? '−' : '+'} ${Math.abs(p.k)}`.replace(' + 0', '').replace(' − 0', '');
        return Tx(`${f} fonksiyonunun tersini f⁻¹(x) bulalım ve f⁻¹(${S(p.t)}) değerini hesaplayalım.`,
          `Let's find the inverse f⁻¹(x) of ${f} and compute f⁻¹(${S(p.t)}).`);
      }
      default:
        if (p.sc === 0) {
          const h = p.am === 1 ? `10^(−${p.n})` : `${p.am}·10^(−${p.n})`;
          return Tx(`Bir çözeltide hidrojen iyonu derişimi [H⁺] = ${h} mol/L ise pH = −log[H⁺] değeri kaç olur?`,
            `If a solution has hydrogen-ion concentration [H⁺] = ${h} mol/L, what is its pH = −log[H⁺]?`);
        }
        if (p.sc === 1) return Tx(`Ses şiddeti I, referans şiddet I₀'ın 10^${p.k} katıdır. Ses düzeyi L = 10·log(I/I₀) desibel (dB) cinsinden kaç olur? Şiddet 10 katına çıkarsa L kaç dB artar?`,
          `A sound has intensity I = 10^${p.k} times the reference I₀. What is its level L = 10·log(I/I₀) in decibels (dB)? By how many dB does L rise if the intensity is multiplied by 10?`);
        return Tx(`Richter ölçeğinde M = log(A/A₀) olduğuna göre, ${p.k1} büyüklüğündeki deprem, ${p.k2} büyüklüğündekinden kaç kat daha büyük genlikli sismograf kaydı verir?`,
          `On the Richter scale M = log(A/A₀). How many times larger is the seismograph amplitude of a magnitude ${p.k1} earthquake than that of a magnitude ${p.k2} one?`);
    }
  }

  // ---------- worked solution ----------
  function solveSteps(p) {
    const steps = []; let n = 0;
    const add = (tt, te, bt, be) => { n++; steps.push(`── ${n}) ${Tx(tt, te)} ──\n${Tx(bt, be === undefined ? bt : be)}`); };
    if (p.kind === 'eval') {
      const Ns = ipow(p.c, p.v), b = p.b, c = p.c;
      add('Tanıma dönelim', 'Going back to the definition', `${LG(b)} ${Ns} = y  ⇔  ${b}^y = ${Ns}.`, `${LG(b)} ${Ns} = y  ⇔  ${b}^y = ${Ns}.`);
      add('Aynı tabanda yazalım', 'Writing both sides with the same base',
        `${b} = ${p.u === 1 ? c : c + '^' + p.u}  ve  ${Ns} = ${pw(c, p.v)}\n(${p.u === 1 ? c : c + '^' + p.u})^y = ${pw(c, p.v)}  ⇒  ${c}^(${p.u === 1 ? '' : p.u + '·'}y) = ${pw(c, p.v)}`,
        `${b} = ${p.u === 1 ? c : c + '^' + p.u}  and  ${Ns} = ${pw(c, p.v)}\n(${p.u === 1 ? c : c + '^' + p.u})^y = ${pw(c, p.v)}  ⇒  ${c}^(${p.u === 1 ? '' : p.u + '·'}y) = ${pw(c, p.v)}`);
      add('Üsleri eşitleyelim', 'Equating the exponents', `Üstel fonksiyon bire bir olduğundan: ${p.u === 1 ? '' : p.u + '·'}y = ${S(p.v)}  ⇒  y = ${frS(p.y)}${p.y.d > 1 ? '  ≈ ' + nf(frV(p.y), 4) : ''}.`,
        `The exponential is one-to-one, so ${p.u === 1 ? '' : p.u + '·'}y = ${S(p.v)}  ⇒  y = ${frS(p.y)}${p.y.d > 1 ? '  ≈ ' + nf(frV(p.y), 4) : ''}.`);
      add('Sağlama', 'Check', `${b}^(${frS(p.y)}) = (${p.u === 1 ? c : c + '^' + p.u})^(${frS(p.y)}) = ${pw(c, p.v)} = ${Ns} ✓\nGrafikte (${nf(p.N, 3)}, ${nf(frV(p.y), 3)}) noktası y = ${LG(b)} x üzerindedir; y = x'e göre aynası (${nf(frV(p.y), 3)}, ${nf(p.N, 3)}) ise y = ${b}^x üzerindedir.`,
        `${b}^(${frS(p.y)}) = (${p.u === 1 ? c : c + '^' + p.u})^(${frS(p.y)}) = ${pw(c, p.v)} = ${Ns} ✓\nOn the graph (${nf(p.N, 3)}, ${nf(frV(p.y), 3)}) lies on y = ${LG(b)} x; its mirror image in y = x, (${nf(frV(p.y), 3)}, ${nf(p.N, 3)}), lies on y = ${b}^x.`);
    } else if (p.kind === 'special') {
      add('Ters olma özelliği', 'Inverse property', `log_b(b^x) = x  ve  b^(log_b x) = x  (x > 0).\nln, taban e'li; log ise taban 10'lu logaritmadır.`, `log_b(b^x) = x  and  b^(log_b x) = x  (x > 0).\nln has base e; log has base 10.`);
      add('Terimleri sadeleştirelim', 'Simplifying each term',
        `ln(e^${S(p.a)}) = ${S(p.a)}\nlog(10^${p.bb}) = ${p.bb}\n${p.cb}^(${LG(p.cb)} ${p.cc}) = ${p.cc}`, `ln(e^${S(p.a)}) = ${S(p.a)}\nlog(10^${p.bb}) = ${p.bb}\n${p.cb}^(${LG(p.cb)} ${p.cc}) = ${p.cc}`);
      add('Toplayalım', 'Adding up', `${S(p.a)} + ${p.bb} + ${p.cc} = ${S(p.res)}`, `${S(p.a)} + ${p.bb} + ${p.cc} = ${S(p.res)}`);
      add('Sağlama', 'Check', `Logaritma ile üstel fonksiyon birbirinin tersi olduğundan birbirini "götürür"; sonuç ${S(p.res)} ✓.`, `Logarithm and exponential are inverses, so they "undo" each other; the result is ${S(p.res)} ✓.`);
    } else if (p.kind === 'condense') {
      const L = LG(p.b), co = p.m === 1 ? '' : p.m + '·', up = p.m === 1 ? p.u : `${p.u}^${p.m}`, upv = Math.pow(p.u, p.m);
      add('Kuralları hatırlayalım', 'Recalling the laws', `Çarpım: log(AB) = log A + log B\nBölüm: log(A/B) = log A − log B\nKuvvet: n·log A = log(A^n)`, `Product: log(AB) = log A + log B\nQuotient: log(A/B) = log A − log B\nPower: n·log A = log(A^n)`);
      add('Katsayıyı üs yapalım', 'Moving the coefficient into the exponent', p.m === 1 ? `Katsayı 1 olduğu için bu adım gerekmez.` : `${co}${L} ${p.u} = ${L} ${up} = ${L} ${upv}`, p.m === 1 ? `The coefficient is 1, so nothing to do here.` : `${co}${L} ${p.u} = ${L} ${up} = ${L} ${upv}`);
      add('Tek logaritmada birleştirelim', 'Combining into one logarithm', `${L} ${upv} + ${L} ${p.v} − ${L} ${p.w} = ${L}(${upv}·${p.v} / ${p.w}) = ${L}(${upv * p.v}/${p.w}) = ${L} ${p.R}`, `${L} ${upv} + ${L} ${p.v} − ${L} ${p.w} = ${L}(${upv}·${p.v} / ${p.w}) = ${L}(${upv * p.v}/${p.w}) = ${L} ${p.R}`);
      add('Değeri bulalım', 'Evaluating', `${p.R} = ${p.b}^${p.k} olduğundan ${L} ${p.R} = ${p.k}.`, `Since ${p.R} = ${p.b}^${p.k}, ${L} ${p.R} = ${p.k}.`);
      add('Sağlama', 'Check', `Ondalık kontrol: ${nf(p.m * Math.log(p.u) / lnb(p.b) + Math.log(p.v) / lnb(p.b) - Math.log(p.w) / lnb(p.b), 4)} ≈ ${p.k} ✓`, `Decimal check: ${nf(p.m * Math.log(p.u) / lnb(p.b) + Math.log(p.v) / lnb(p.b) - Math.log(p.w) / lnb(p.b), 4)} ≈ ${p.k} ✓`);
    } else if (p.kind === 'expand') {
      const Nst = p.den === 1 ? String(p.num) : p.num + '/' + p.den;
      add('Sayıyı asal çarpanlarla yazalım', 'Factoring into primes', `${Nst} = 2^${S(p.i)}·3^${S(p.j)}`, `${Nst} = 2^${S(p.i)}·3^${S(p.j)}`);
      add('Çarpım ve kuvvet kuralları', 'Product and power laws', `ln(2^${S(p.i)}·3^${S(p.j)}) = ln(2^${S(p.i)}) + ln(3^${S(p.j)}) = ${S(p.i)}·ln 2 + ${S(p.j)}·ln 3\n(Negatif üs, bölüm kuralının sonucudur: ln(1/A) = −ln A.)`,
        `ln(2^${S(p.i)}·3^${S(p.j)}) = ln(2^${S(p.i)}) + ln(3^${S(p.j)}) = ${S(p.i)}·ln 2 + ${S(p.j)}·ln 3\n(A negative exponent comes from the quotient law: ln(1/A) = −ln A.)`);
      add('Değerleri yerine koyalım', 'Substituting', `= ${P(p.i)}·0,6931 + ${P(p.j)}·1,0986 = ${nf(p.i * 0.6931, 4)} ${p.j * 1.0986 < 0 ? '−' : '+'} ${nf(Math.abs(p.j * 1.0986), 4)} ≈ ${nf(p.i * 0.6931 + p.j * 1.0986, 4)}`,
        `= ${P(p.i)}·0.6931 + ${P(p.j)}·1.0986 = ${nf(p.i * 0.6931, 4)} ${p.j * 1.0986 < 0 ? '−' : '+'} ${nf(Math.abs(p.j * 1.0986), 4)} ≈ ${nf(p.i * 0.6931 + p.j * 1.0986, 4)}`);
      add('Sağlama', 'Check', `Hesap makinesi: ln(${nf(p.num / p.den, 6)}) = ${nf(Math.log(p.num / p.den), 4)} ✓ (küçük fark yuvarlamadandır).`, `Calculator: ln(${nf(p.num / p.den, 6)}) = ${nf(Math.log(p.num / p.den), 4)} ✓ (the tiny difference is rounding).`);
    } else if (p.kind === 'cob') {
      add('Taban değiştirme formülü', 'Change-of-base formula', `log_b N = ln N / ln b  (aynı şekilde log N / log b de kullanılabilir).`, `log_b N = ln N / ln b  (log N / log b works equally well).`);
      add('Değerleri yazalım', 'Plugging in', `${LG(p.b)} ${p.N} = ln ${p.N} / ln ${p.b} = ${nf(Math.log(p.N), 4)} / ${nf(Math.log(p.b), 4)}`, `${LG(p.b)} ${p.N} = ln ${p.N} / ln ${p.b} = ${nf(Math.log(p.N), 4)} / ${nf(Math.log(p.b), 4)}`);
      add('Bölelim', 'Dividing', `≈ ${nf(p.y, 4)}`, `≈ ${nf(p.y, 4)}`);
      const lo = Math.floor(p.y);
      add('Mantık kontrolü', 'Sanity check', `${p.b}^${lo} = ${Math.pow(p.b, lo)} < ${p.N} < ${p.b}^${lo + 1} = ${Math.pow(p.b, lo + 1)} olduğundan sonuç ${lo} ile ${lo + 1} arasında olmalı ✓.\nGeri: ${p.b}^${nf(p.y, 4)} ≈ ${nf(Math.pow(p.b, p.y), 3)} ≈ ${p.N} ✓`,
        `${p.b}^${lo} = ${Math.pow(p.b, lo)} < ${p.N} < ${p.b}^${lo + 1} = ${Math.pow(p.b, lo + 1)}, so the answer must lie between ${lo} and ${lo + 1} ✓.\nBack-check: ${p.b}^${nf(p.y, 4)} ≈ ${nf(Math.pow(p.b, p.y), 3)} ≈ ${p.N} ✓`);
    } else if (p.kind === 'expEq') {
      const cs = frS(fr(p.c, p.a)), L = p.b === 'e' ? 'ln' : (p.b === 10 ? 'log' : 'ln'), Lbs = p.b === 'e' ? '' : (p.b === 10 ? '' : ` / ln ${p.b}`);
      add('Üstel terimi yalnız bırakalım', 'Isolating the exponential', `${p.a === 1 ? '' : p.a + '·'}${bs(p.b)}^(${lin(p.m, p.q)}) = ${p.c}${p.a === 1 ? '' : `\n${bs(p.b)}^(${lin(p.m, p.q)}) = ${p.c}/${p.a} = ${cs}`}\n(Sağ taraf pozitif; üstel ifade hep pozitif olduğundan çözüm vardır.)`,
        `${p.a === 1 ? '' : p.a + '·'}${bs(p.b)}^(${lin(p.m, p.q)}) = ${p.c}${p.a === 1 ? '' : `\n${bs(p.b)}^(${lin(p.m, p.q)}) = ${p.c}/${p.a} = ${cs}`}\n(The right side is positive, and an exponential is always positive, so a solution exists.)`);
      const E = Math.log(p.c / p.a) / lnb(p.b);
      add('Logaritma alalım', 'Taking the logarithm', `${p.b === 'e' ? 'Her iki tarafın ln\'ini alırız' : p.b === 10 ? 'Her iki tarafın log\'unu alırız' : 'Her iki tarafın ln\'ini alıp ln b ile böleriz'}:\n${lin(p.m, p.q)} = ${L}(${cs})${Lbs} = ${nf(E, 4)}`,
        `${p.b === 'e' ? 'Take ln of both sides' : p.b === 10 ? 'Take log of both sides' : 'Take ln of both sides and divide by ln b'}:\n${lin(p.m, p.q)} = ${L}(${cs})${Lbs} = ${nf(E, 4)}`);
      add('x için çözelim', 'Solving for x', `${p.m === 1 ? '' : (p.m === -1 ? '−' : S(p.m))}x = ${nf(E, 4)} ${p.q < 0 ? '+' : '−'} ${Math.abs(p.q)} = ${nf(E - p.q, 4)}  ⇒  x = ${nf(p.xs, 4)}`.replace(' + 0', '').replace(' − 0', ''),
        `${p.m === 1 ? '' : (p.m === -1 ? '−' : S(p.m))}x = ${nf(E, 4)} ${p.q < 0 ? '+' : '−'} ${Math.abs(p.q)} = ${nf(E - p.q, 4)}  ⇒  x = ${nf(p.xs, 4)}`.replace(' + 0', '').replace(' − 0', ''));
      add('Sağlama', 'Check', `${p.a === 1 ? '' : p.a + '·'}${bs(p.b)}^(${P(p.m)}·${nf(p.xs, 4)} ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)}) = ${nf(p.a * Math.pow(bv(p.b), p.m * p.xs + p.q), 3)} ≈ ${p.c} ✓`,
        `${p.a === 1 ? '' : p.a + '·'}${bs(p.b)}^(${P(p.m)}·${nf(p.xs, 4)} ${p.q < 0 ? '−' : '+'} ${Math.abs(p.q)}) = ${nf(p.a * Math.pow(bv(p.b), p.m * p.xs + p.q), 3)} ≈ ${p.c} ✓`);
    } else if (p.kind === 'expEq2') {
      const l1 = Math.log(p.b1), l2 = Math.log(p.b2), den = p.m1 * l1 - p.m2 * l2, num = p.q2 * l2 - p.q1 * l1;
      add('Her iki tarafın ln\'ini alalım', 'Taking ln of both sides', `(${lin(p.m1, p.q1)})·ln ${p.b1} = (${lin(p.m2, p.q2)})·ln ${p.b2}\n(ln ${p.b1} = ${nf(l1, 4)},  ln ${p.b2} = ${nf(l2, 4)})`, `(${lin(p.m1, p.q1)})·ln ${p.b1} = (${lin(p.m2, p.q2)})·ln ${p.b2}\n(ln ${p.b1} = ${nf(l1, 4)},  ln ${p.b2} = ${nf(l2, 4)})`);
      add('x\'li terimleri toplayalım', 'Collecting the x terms', `x·(${p.m1}·ln ${p.b1} − ${p.m2}·ln ${p.b2}) = ${P(p.q2)}·ln ${p.b2} − ${P(p.q1)}·ln ${p.b1}\nx·(${nf(den, 4)}) = ${nf(num, 4)}`, `x·(${p.m1}·ln ${p.b1} − ${p.m2}·ln ${p.b2}) = ${P(p.q2)}·ln ${p.b2} − ${P(p.q1)}·ln ${p.b1}\nx·(${nf(den, 4)}) = ${nf(num, 4)}`);
      add('x değeri', 'Value of x', `x = ${nf(num, 4)} / ${P(Number(nf(den, 4).replace('−', '-')))} ≈ ${nf(p.xs, 4)}`, `x = ${nf(num, 4)} / ${P(Number(nf(den, 4).replace('−', '-')))} ≈ ${nf(p.xs, 4)}`);
      add('Sağlama', 'Check', `Sol: ${p.b1}^(${nf(p.m1 * p.xs + p.q1, 4)}) = ${nf(Math.pow(p.b1, p.m1 * p.xs + p.q1), 4)}\nSağ: ${p.b2}^(${nf(p.m2 * p.xs + p.q2, 4)}) = ${nf(Math.pow(p.b2, p.m2 * p.xs + p.q2), 4)}  → eşit ✓ (grafikte iki eğrinin kesişimi).`,
        `Left: ${p.b1}^(${nf(p.m1 * p.xs + p.q1, 4)}) = ${nf(Math.pow(p.b1, p.m1 * p.xs + p.q1), 4)}\nRight: ${p.b2}^(${nf(p.m2 * p.xs + p.q2, 4)}) = ${nf(Math.pow(p.b2, p.m2 * p.xs + p.q2), 4)}  → equal ✓ (the two curves intersect there).`);
    } else if (p.kind === 'logEq1') {
      const L = LG(p.b), arg = lin(p.a, p.c);
      add('Tanım kümesi', 'Domain', `Logaritmanın içi pozitif olmalı: ${arg} > 0  ⇒  x > ${frS(fr(-p.c, p.a))}.`, `The argument must be positive: ${arg} > 0  ⇒  x > ${frS(fr(-p.c, p.a))}.`);
      add('Üstel biçime geçelim', 'Switching to exponential form', `${L}(${arg}) = ${p.s}  ⇔  ${arg} = ${bs(p.b)}^${p.s} = ${nf(Math.pow(bv(p.b), p.s), 4)}`, `${L}(${arg}) = ${p.s}  ⇔  ${arg} = ${bs(p.b)}^${p.s} = ${nf(Math.pow(bv(p.b), p.s), 4)}`);
      add('x için çözelim', 'Solving for x', `${p.a === 1 ? '' : S(p.a)}x = ${nf(Math.pow(bv(p.b), p.s), 4)} ${p.c < 0 ? '+' : '−'} ${Math.abs(p.c)} = ${nf(Math.pow(bv(p.b), p.s) - p.c, 4)}  ⇒  x = ${nf(p.xs, 4)}`.replace(' + 0', '').replace(' − 0', ''),
        `${p.a === 1 ? '' : S(p.a)}x = ${nf(Math.pow(bv(p.b), p.s), 4)} ${p.c < 0 ? '+' : '−'} ${Math.abs(p.c)} = ${nf(Math.pow(bv(p.b), p.s) - p.c, 4)}  ⇒  x = ${nf(p.xs, 4)}`.replace(' + 0', '').replace(' − 0', ''));
      const inside = p.a * p.xs + p.c;
      add('Tanım kümesi kontrolü ve sağlama', 'Domain check and verification', `Logaritmanın içi: ${nf(inside, 4)} > 0 ✓ (çözüm tanım kümesinde).\n${L}(${nf(inside, 4)}) = ${nf(Math.log(inside) / lnb(p.b), 4)} ≈ ${p.s} ✓`,
        `Argument: ${nf(inside, 4)} > 0 ✓ (the solution is in the domain).\n${L}(${nf(inside, 4)}) = ${nf(Math.log(inside) / lnb(p.b), 4)} ≈ ${p.s} ✓`);
    } else if (p.kind === 'logEq2') {
      const L = LG(p.b), lo = -Math.min(p.p, p.q);
      add('Önce tanım kümesi', 'Domain first', `${xp(p.p)} > 0 ve ${xp(p.q)} > 0 olmalı ⇒ x > ${S(lo)}.\n(Köklerin bu koşulu sağlayıp sağlamadığını sonda kontrol edeceğiz.)`, `We need ${xp(p.p)} > 0 and ${xp(p.q)} > 0 ⇒ x > ${S(lo)}.\n(At the end we check whether the roots satisfy this.)`);
      add('Çarpım kuralı', 'Product law', `${L}${xp(p.p)} + ${L}${xp(p.q)} = ${L}[${xp(p.p)}${xp(p.q)}] = ${p.s}\n⇔  ${xp(p.p)}${xp(p.q)} = ${p.b}^${p.s} = ${p.B}`, `${L}${xp(p.p)} + ${L}${xp(p.q)} = ${L}[${xp(p.p)}${xp(p.q)}] = ${p.s}\n⇔  ${xp(p.p)}${xp(p.q)} = ${p.b}^${p.s} = ${p.B}`);
      add('İkinci derece denklem', 'Quadratic equation', `${poly(p.p + p.q, p.p * p.q)} = ${p.B}  ⇒  ${poly(p.p + p.q, p.p * p.q - p.B)} = 0\n(x ${p.r1 < 0 ? '+' : '−'} ${Math.abs(p.r1)})(x ${p.r2 < 0 ? '+' : '−'} ${Math.abs(p.r2)}) = 0  ⇒  x = ${S(p.r1)}  veya  x = ${S(p.r2)}`.replace('x − 0', 'x').replace('x + 0', 'x'),
        `${poly(p.p + p.q, p.p * p.q)} = ${p.B}  ⇒  ${poly(p.p + p.q, p.p * p.q - p.B)} = 0\n(x ${p.r1 < 0 ? '+' : '−'} ${Math.abs(p.r1)})(x ${p.r2 < 0 ? '+' : '−'} ${Math.abs(p.r2)}) = 0  ⇒  x = ${S(p.r1)}  or  x = ${S(p.r2)}`.replace('x − 0', 'x').replace('x + 0', 'x'));
      add('Köklerin kontrolü', 'Checking the roots', `x = ${S(p.r1)}: ${S(p.r1)} > ${S(lo)} değil ⇒ logaritmanın içi negatif/sıfır olur ⇒ YABANCI KÖK, atılır.\nx = ${S(p.r2)}: ${S(p.r2)} > ${S(lo)} ✓ ⇒ çözüm.`,
        `x = ${S(p.r1)}: ${S(p.r1)} > ${S(lo)} fails ⇒ an argument is negative/zero ⇒ EXTRANEOUS root, rejected.\nx = ${S(p.r2)}: ${S(p.r2)} > ${S(lo)} ✓ ⇒ a solution.`);
      add('Sağlama', 'Check', `${L}${P(p.r2 + p.p)} + ${L}${P(p.r2 + p.q)} = ${L}(${(p.r2 + p.p) * (p.r2 + p.q)}) = ${L}(${p.b}^${p.s}) = ${p.s} ✓`, `${L}${P(p.r2 + p.p)} + ${L}${P(p.r2 + p.q)} = ${L}(${(p.r2 + p.p) * (p.r2 + p.q)}) = ${L}(${p.b}^${p.s}) = ${p.s} ✓`);
    } else if (p.kind === 'domain') {
      domainSteps(p, add);
    } else if (p.kind === 'inverse') {
      if (p.it === 0) {
        const a = p.a, b = p.b;
        add('y = f(x) yazalım', 'Writing y = f(x)', `y = ${a === 1 ? '' : a + '·'}${b}^x`, `y = ${a === 1 ? '' : a + '·'}${b}^x`);
        add('x\'i yalnız bırakalım', 'Solving for x', `${a === 1 ? '' : `y/${a} = ${b}^x\n`}x = ${LG(b)}(${a === 1 ? 'y' : 'y/' + a})   (logaritma, üstelin tersidir)`, `${a === 1 ? '' : `y/${a} = ${b}^x\n`}x = ${LG(b)}(${a === 1 ? 'y' : 'y/' + a})   (the logarithm undoes the exponential)`);
        add('x ile y\'yi değiştirelim', 'Swapping x and y', `f⁻¹(x) = ${LG(b)}(${a === 1 ? 'x' : 'x/' + a}),  tanım kümesi x > 0, görüntü kümesi ℝ.\n(f'nin tanım kümesi ℝ ve görüntü kümesi (0, ∞) idi: roller yer değiştirir.)`, `f⁻¹(x) = ${LG(b)}(${a === 1 ? 'x' : 'x/' + a}),  domain x > 0, range ℝ.\n(f had domain ℝ and range (0, ∞): the roles swap.)`);
        add(`f⁻¹(${p.t}) değeri`, `Value of f⁻¹(${p.t})`, `f⁻¹(${p.t}) = ${LG(b)}(${a === 1 ? p.t : p.t + '/' + a}) = ${LG(b)}(${p.t / a}) = ${LG(b)}(${b}^${p.j}) = ${p.j}`, `f⁻¹(${p.t}) = ${LG(b)}(${a === 1 ? p.t : p.t + '/' + a}) = ${LG(b)}(${p.t / a}) = ${LG(b)}(${b}^${p.j}) = ${p.j}`);
        add('Sağlama', 'Check', `f(${p.j}) = ${a === 1 ? '' : a + '·'}${b}^${p.j} = ${p.t} ✓ ⇒ (${p.j}, ${p.t}) f üzerinde, (${p.t}, ${p.j}) f⁻¹ üzerindedir; ikisi y = x'e göre simetriktir.`, `f(${p.j}) = ${a === 1 ? '' : a + '·'}${b}^${p.j} = ${p.t} ✓ ⇒ (${p.j}, ${p.t}) is on f, (${p.t}, ${p.j}) is on f⁻¹; they mirror each other in y = x.`);
      } else {
        const b = p.b, h = p.h, k = p.k, hs = h === 0 ? 'x' : (h < 0 ? `x + ${-h}` : `x − ${h}`);
        const fs = `${LG(b)}(${hs}) ${k < 0 ? '−' : '+'} ${Math.abs(k)}`.replace(' + 0', '').replace(' − 0', '');
        add('y = f(x) yazalım', 'Writing y = f(x)', `y = ${fs}\nTanım: x > ${S(h)};  görüntü: ℝ;  dikey asimptot x = ${S(h)}.`, `y = ${fs}\nDomain: x > ${S(h)};  range: ℝ;  vertical asymptote x = ${S(h)}.`);
        add('Logaritmayı yalnız bırakalım', 'Isolating the logarithm', `y ${k < 0 ? '+' : '−'} ${Math.abs(k)} = ${LG(b)}(${hs})`.replace(' + 0', '').replace(' − 0', ''), `y ${k < 0 ? '+' : '−'} ${Math.abs(k)} = ${LG(b)}(${hs})`.replace(' + 0', '').replace(' − 0', ''));
        add('Üstel biçime geçelim', 'Switching to exponential form', `${hs} = ${b}^(y ${k < 0 ? '+' : '−'} ${Math.abs(k)})  ⇒  x = ${b}^(y ${k < 0 ? '+' : '−'} ${Math.abs(k)}) ${h < 0 ? '−' : '+'} ${Math.abs(h)}`.replace(' + 0', '').replace(' − 0', '').replace('(y + 0)', 'y').replace('(y − 0)', 'y'),
          `${hs} = ${b}^(y ${k < 0 ? '+' : '−'} ${Math.abs(k)})  ⇒  x = ${b}^(y ${k < 0 ? '+' : '−'} ${Math.abs(k)}) ${h < 0 ? '−' : '+'} ${Math.abs(h)}`.replace(' + 0', '').replace(' − 0', '').replace('(y + 0)', 'y').replace('(y − 0)', 'y'));
        const ex = `${b}^(x ${k < 0 ? '+' : '−'} ${Math.abs(k)}) ${h < 0 ? '−' : '+'} ${Math.abs(h)}`.replace(' + 0', '').replace(' − 0', '').replace('(x + 0)', 'x').replace('(x − 0)', 'x');
        add('Ters fonksiyon', 'The inverse function', `x ile y'yi değiştirelim: f⁻¹(x) = ${ex}\n(Tanım ℝ; görüntü y > ${S(h)}; yatay asimptot y = ${S(h)}.)`, `Swapping x and y: f⁻¹(x) = ${ex}\n(Domain ℝ; range y > ${S(h)}; horizontal asymptote y = ${S(h)}.)`);
        add(`f⁻¹(${S(p.t)}) değeri`, `Value of f⁻¹(${S(p.t)})`, `f⁻¹(${S(p.t)}) = ${b}^(${S(p.t)} ${k < 0 ? '+' : '−'} ${Math.abs(k)}) ${h < 0 ? '−' : '+'} ${Math.abs(h)} = ${b}^${p.j} ${h < 0 ? '−' : '+'} ${Math.abs(h)} = ${S(p.val)}`.replace(' + 0', '').replace(' − 0', ''),
          `f⁻¹(${S(p.t)}) = ${b}^(${S(p.t)} ${k < 0 ? '+' : '−'} ${Math.abs(k)}) ${h < 0 ? '−' : '+'} ${Math.abs(h)} = ${b}^${p.j} ${h < 0 ? '−' : '+'} ${Math.abs(h)} = ${S(p.val)}`.replace(' + 0', '').replace(' − 0', ''));
        add('Sağlama', 'Check', `f(${S(p.val)}) = ${LG(b)}(${S(p.val - h)}) ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${S(p.j)} ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${S(p.t)} ✓`.replace(' + 0', '').replace(' − 0', ''),
          `f(${S(p.val)}) = ${LG(b)}(${S(p.val - h)}) ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${S(p.j)} ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${S(p.t)} ✓`.replace(' + 0', '').replace(' − 0', ''));
      }
    } else { // scale
      if (p.sc === 0) {
        const h = p.am === 1 ? `10^(−${p.n})` : `${p.am}·10^(−${p.n})`;
        add('Formül', 'Formula', `pH = −log[H⁺],  [H⁺] = ${h}`, `pH = −log[H⁺],  [H⁺] = ${h}`);
        add('Logaritma kurallarını uygulayalım', 'Applying the log laws', p.am === 1 ? `log(10^(−${p.n})) = −${p.n}  ⇒  pH = −(−${p.n}) = ${p.n}` : `log(${p.am}·10^(−${p.n})) = log ${p.am} + log 10^(−${p.n}) = ${nf(Math.log10(p.am), 4)} − ${p.n} = ${nf(Math.log10(p.am) - p.n, 4)}\npH = −(${nf(Math.log10(p.am) - p.n, 4)}) = ${nf(p.val, 4)}`,
          p.am === 1 ? `log(10^(−${p.n})) = −${p.n}  ⇒  pH = −(−${p.n}) = ${p.n}` : `log(${p.am}·10^(−${p.n})) = log ${p.am} + log 10^(−${p.n}) = ${nf(Math.log10(p.am), 4)} − ${p.n} = ${nf(Math.log10(p.am) - p.n, 4)}\npH = −(${nf(Math.log10(p.am) - p.n, 4)}) = ${nf(p.val, 4)}`);
        add('Yorum', 'Interpretation', `pH ${p.val < 7 ? '< 7 ⇒ çözelti asidik' : p.val > 7 ? '> 7 ⇒ çözelti bazik' : '= 7 ⇒ nötr'}. pH 1 birim düşünce [H⁺] 10 kat artar (logaritmik ölçek).`, `pH ${p.val < 7 ? '< 7 ⇒ the solution is acidic' : p.val > 7 ? '> 7 ⇒ the solution is basic' : '= 7 ⇒ neutral'}. Each 1-unit drop in pH multiplies [H⁺] by 10 (logarithmic scale).`);
        add('Sağlama', 'Check', `10^(−${nf(p.val, 4)}) = ${nf(Math.pow(10, -p.val), 10)} ≈ ${nf(p.arg, 10)} ✓`, `10^(−${nf(p.val, 4)}) = ${nf(Math.pow(10, -p.val), 10)} ≈ ${nf(p.arg, 10)} ✓`);
      } else if (p.sc === 1) {
        add('Formül', 'Formula', `L = 10·log(I/I₀),  I/I₀ = 10^${p.k}`, `L = 10·log(I/I₀),  I/I₀ = 10^${p.k}`);
        add('Değeri bulalım', 'Evaluating', `L = 10·log(10^${p.k}) = 10·${p.k} = ${10 * p.k} dB`, `L = 10·log(10^${p.k}) = 10·${p.k} = ${10 * p.k} dB`);
        add('10 katı şiddet', 'Ten times the intensity', `L' = 10·log(10·10^${p.k}) = 10·(1 + ${p.k}) = ${10 * (p.k + 1)} dB  ⇒  artış = 10 dB.\nYani şiddet 10 kat artınca ses düzeyi hep 10 dB artar: çarpma, toplamaya dönüşür.`,
          `L' = 10·log(10·10^${p.k}) = 10·(1 + ${p.k}) = ${10 * (p.k + 1)} dB  ⇒  increase = 10 dB.\nSo every tenfold increase in intensity adds 10 dB: multiplication turns into addition.`);
        add('Sağlama', 'Check', `10^(${10 * p.k}/10) = 10^${p.k} ✓`, `10^(${10 * p.k}/10) = 10^${p.k} ✓`);
      } else {
        add('Formül', 'Formula', `M = log(A/A₀)  ⇒  A/A₀ = 10^M`, `M = log(A/A₀)  ⇒  A/A₀ = 10^M`);
        add('Oranı bulalım', 'Finding the ratio', `A₁/A₂ = 10^${p.k1} / 10^${p.k2} = 10^(${p.k1} − ${p.k2}) = 10^${p.d} = ${Math.pow(10, p.d)}`, `A₁/A₂ = 10^${p.k1} / 10^${p.k2} = 10^(${p.k1} − ${p.k2}) = 10^${p.d} = ${Math.pow(10, p.d)}`);
        add('Sağlama', 'Check', `Büyüklük farkı ${p.d} ise genlik oranı 10^${p.d} = ${Math.pow(10, p.d)} ✓. (Not: salınan enerji ise yaklaşık 10^(1,5·${p.d}) ≈ ${nf(Math.pow(10, 1.5 * p.d), 0)} kat artar.)`,
          `A magnitude difference of ${p.d} means an amplitude ratio of 10^${p.d} = ${Math.pow(10, p.d)} ✓. (The released energy rises about 10^(1.5·${p.d}) ≈ ${nf(Math.pow(10, 1.5 * p.d), 0)} times.)`);
      }
    }
    return steps;
  }

  function domainSteps(p, add) {
    const L = LG(p.b);
    if (p.dt === 0) {
      const f = lin(p.a, p.c), x0 = p.x0, xs = frS(x0);
      add('İçi pozitif olmalı', 'The argument must be positive', `${L}(${f}) tanımlı olması için ${f} > 0 olmalı.`, `${L}(${f}) is defined only when ${f} > 0.`);
      add('Eşitsizliği çözelim', 'Solving the inequality', p.a > 0 ? `${p.a === 1 ? '' : S(p.a)}x > ${S(-p.c)}  ⇒  x > ${xs}` : `${S(p.a)}x > ${S(-p.c)}  ⇒  (negatif sayıya bölünce yön değişir)  x < ${xs}`,
        p.a > 0 ? `${p.a === 1 ? '' : S(p.a)}x > ${S(-p.c)}  ⇒  x > ${xs}` : `${S(p.a)}x > ${S(-p.c)}  ⇒  (dividing by a negative flips the sign)  x < ${xs}`);
      add('Tanım kümesi ve asimptot', 'Domain and asymptote', `Tanım kümesi: ${p.a > 0 ? `(${xs}, ∞)` : `(−∞, ${xs})`}.\nDikey asimptot: x = ${xs} (içi 0'a giderken logaritma −∞'a gider).`,
        `Domain: ${p.a > 0 ? `(${xs}, ∞)` : `(−∞, ${xs})`}.\nVertical asymptote: x = ${xs} (the log tends to −∞ as the argument tends to 0).`);
      const tx = frV(x0) + (p.a > 0 ? 1 : -1);
      add('Sağlama', 'Check', `x = ${nf(tx, 3)} için içi ${nf(p.a * tx + p.c, 3)} > 0 ✓;  asimptotun diğer yanında negatif olurdu.`, `For x = ${nf(tx, 3)} the argument is ${nf(p.a * tx + p.c, 3)} > 0 ✓; on the other side of the asymptote it would be negative.`);
    } else if (p.dt === 1) {
      const B = -(p.r1 + p.r2), C = p.r1 * p.r2;
      add('İçi pozitif olmalı', 'The argument must be positive', `${poly(B, C)} > 0 olmalı.`, `We need ${poly(B, C)} > 0.`);
      add('Çarpanlara ayıralım', 'Factoring', `${poly(B, C)} = (x ${p.r1 < 0 ? '+' : '−'} ${Math.abs(p.r1)})(x ${p.r2 < 0 ? '+' : '−'} ${Math.abs(p.r2)})  ⇒  kökler x = ${S(p.r1)} ve x = ${S(p.r2)}`.replace('x − 0', 'x').replace('x + 0', 'x'),
        `${poly(B, C)} = (x ${p.r1 < 0 ? '+' : '−'} ${Math.abs(p.r1)})(x ${p.r2 < 0 ? '+' : '−'} ${Math.abs(p.r2)})  ⇒  roots x = ${S(p.r1)} and x = ${S(p.r2)}`.replace('x − 0', 'x').replace('x + 0', 'x'));
      add('İşaret tablosu', 'Sign chart', `Yukarı açılan parabol köklerin dışında pozitif, arasında negatiftir:\nx < ${S(p.r1)}: (+)   |   ${S(p.r1)} < x < ${S(p.r2)}: (−)   |   x > ${S(p.r2)}: (+)`, `An upward parabola is positive outside the roots and negative between them:\nx < ${S(p.r1)}: (+)   |   ${S(p.r1)} < x < ${S(p.r2)}: (−)   |   x > ${S(p.r2)}: (+)`);
      add('Tanım kümesi', 'Domain', `(−∞, ${S(p.r1)}) ∪ (${S(p.r2)}, ∞).\nDikey asimptotlar: x = ${S(p.r1)} ve x = ${S(p.r2)}.`, `(−∞, ${S(p.r1)}) ∪ (${S(p.r2)}, ∞).\nVertical asymptotes: x = ${S(p.r1)} and x = ${S(p.r2)}.`);
      const mid = (p.r1 + p.r2) / 2;
      add('Sağlama', 'Check', `x = ${nf(mid, 2)} (köklerin arası) için içi ${nf(mid * mid + B * mid + C, 3)} < 0 ⇒ tanımsız ✓; x = ${S(p.r2 + 1)} için içi ${S((p.r2 + 1) * (p.r2 + 1) + B * (p.r2 + 1) + C)} > 0 ✓.`,
        `For x = ${nf(mid, 2)} (between the roots) the argument is ${nf(mid * mid + B * mid + C, 3)} < 0 ⇒ undefined ✓; for x = ${S(p.r2 + 1)} it is ${S((p.r2 + 1) * (p.r2 + 1) + B * (p.r2 + 1) + C)} > 0 ✓.`);
    } else {
      const lo = Math.min(p.r1, p.r2), hi = Math.max(p.r1, p.r2);
      add('İçi pozitif olmalı', 'The argument must be positive', `(${xp(-p.r1)})/(${xp(-p.r2)}) > 0 olmalı; ayrıca payda 0 olamaz: x ≠ ${S(p.r2)}.`.replace(/\(\(/g, '(').replace(/\)\)/g, ')'), `We need (${xp(-p.r1)})/(${xp(-p.r2)}) > 0, and the denominator cannot be 0: x ≠ ${S(p.r2)}.`.replace(/\(\(/g, '(').replace(/\)\)/g, ')'));
      add('Kritik noktalar', 'Critical points', `Pay x = ${S(p.r1)} noktasında, payda x = ${S(p.r2)} noktasında 0 olur. Bölüm pozitifse pay ile payda aynı işaretlidir; işaret yalnızca bu iki noktada değişir.`, `The numerator is 0 at x = ${S(p.r1)} and the denominator at x = ${S(p.r2)}. A quotient is positive when numerator and denominator share a sign, and the sign can only change at these two points.`);
      add('İşaret tablosu', 'Sign chart', `x < ${S(lo)}: (+)   |   ${S(lo)} < x < ${S(hi)}: (−)   |   x > ${S(hi)}: (+)\n(Çarpım/bölüm işaret tablosu aynıdır; iki çarpan da büyük x için pozitiftir.)`, `x < ${S(lo)}: (+)   |   ${S(lo)} < x < ${S(hi)}: (−)   |   x > ${S(hi)}: (+)\n(A product and a quotient have the same sign chart; both factors are positive for large x.)`);
      add('Tanım kümesi ve asimptot', 'Domain and asymptote', `Tanım kümesi: (−∞, ${S(lo)}) ∪ (${S(hi)}, ∞).\nx = ${S(p.r2)} dikey asimptottur (payda 0). x = ${S(p.r1)} ise tanım kümesinin dışında kalır (içi 0): orada logaritma −∞ olur, yani o da asimptottur.`,
        `Domain: (−∞, ${S(lo)}) ∪ (${S(hi)}, ∞).\nx = ${S(p.r2)} is a vertical asymptote (denominator 0). x = ${S(p.r1)} is also excluded (argument 0), where the log tends to −∞, so it is an asymptote too.`);
      const t = hi + 1, v = (t - p.r1) / (t - p.r2);
      add('Sağlama', 'Check', `x = ${S(t)} için (${S(t)} ${p.r1 < 0 ? '+' : '−'} ${Math.abs(p.r1)})/(${S(t)} ${p.r2 < 0 ? '+' : '−'} ${Math.abs(p.r2)}) = ${nf(v, 4)} > 0 ✓.`.replace(' + 0', '').replace(' − 0', ''),
        `For x = ${S(t)}: (${S(t)} ${p.r1 < 0 ? '+' : '−'} ${Math.abs(p.r1)})/(${S(t)} ${p.r2 < 0 ? '+' : '−'} ${Math.abs(p.r2)}) = ${nf(v, 4)} > 0 ✓.`.replace(' + 0', '').replace(' − 0', ''));
    }
  }

  // ---------- drawing ----------
  function draw(canvas, p) {
    try {
      const X = p.view.X, Y = p.view.Y;
      canvas.setViewport(-X, X, -Y, Y);
      const ev = (g) => (x) => { const y = g(x); return isFinite(y) && Math.abs(y) < 1e5 ? y : NaN; };
      const gb = bv(p.gb), lg = Math.log(gb);
      const L = (x) => (x > 0 && Math.abs(lg) > 1e-9 ? Math.log(x) / lg : NaN);
      const kind = p.kind;
      const base = !(kind === 'inverse');
      if (base) {
        canvas.addFunction({ evaluator: ev(L), color: canvas.accent(), thickness: 2.8, label: `y = ${LG(p.gb)} x` });
        canvas.addFunction({ evaluator: ev((x) => Math.pow(gb, x)), color: canvas.orange(), thickness: 2.2, label: `y = ${bs(p.gb)}^x` });
        canvas.addFunction({ evaluator: ev((x) => x), color: canvas.gray(), thickness: 1.4, dashed: true, label: 'y = x' });
        canvas.addGuideLine({ axis: 'vertical', position: 0, color: canvas.green(), label: 'x = 0' });
      }
      if (kind === 'expEq') canvas.addFunction({ evaluator: ev((x) => p.a * Math.pow(bv(p.b), p.m * x + p.q)), color: canvas.blue(), thickness: 2.4, label: Tx('sol taraf', 'left side') });
      if (kind === 'expEq') canvas.addGuideLine({ axis: 'horizontal', position: p.c, color: canvas.green(), label: `y = ${p.c}` });
      if (kind === 'expEq2') {
        canvas.addFunction({ evaluator: ev((x) => Math.pow(p.b1, p.m1 * x + p.q1)), color: canvas.blue(), thickness: 2.4, label: Tx('sol', 'left') });
        canvas.addFunction({ evaluator: ev((x) => Math.pow(p.b2, p.m2 * x + p.q2)), color: canvas.red(), thickness: 2.4, label: Tx('sağ', 'right') });
      }
      if (kind === 'logEq1') {
        canvas.addFunction({ evaluator: ev((x) => L(p.a * x + p.c)), color: canvas.blue(), thickness: 2.4, label: Tx('sol taraf', 'left side') });
        canvas.addGuideLine({ axis: 'horizontal', position: p.s, color: canvas.green(), label: `y = ${p.s}` });
        canvas.addGuideLine({ axis: 'vertical', position: -p.c / p.a, color: canvas.red(), label: '' });
      }
      if (kind === 'logEq2') {
        canvas.addFunction({ evaluator: ev((x) => (x + p.p > 0 && x + p.q > 0 ? L(x + p.p) + L(x + p.q) : NaN)), color: canvas.blue(), thickness: 2.4, label: Tx('sol taraf', 'left side') });
        canvas.addGuideLine({ axis: 'horizontal', position: p.s, color: canvas.green(), label: `y = ${p.s}` });
        canvas.addGuideLine({ axis: 'vertical', position: -Math.min(p.p, p.q), color: canvas.red(), label: '' });
        if (Math.abs(p.r1) <= X) canvas.addMarker({ x: p.r1, y: 0, color: canvas.red(), radius: 5, hollow: true, label: Tx('yabancı kök', 'extraneous') });
      }
      if (kind === 'domain') {
        let fn, crit = [];
        if (p.dt === 0) { fn = (x) => L(p.a * x + p.c); crit = [-p.c / p.a]; }
        else if (p.dt === 1) { fn = (x) => L((x - p.r1) * (x - p.r2)); crit = [p.r1, p.r2]; }
        else { fn = (x) => L((x - p.r1) / (x - p.r2)); crit = [p.r1, p.r2]; }
        canvas.addFunction({ evaluator: ev(fn), color: canvas.blue(), thickness: 2.6, label: 'f(x)' });
        crit.forEach((c) => { if (Math.abs(c) <= X) { canvas.addGuideLine({ axis: 'vertical', position: c, color: canvas.red(), label: `x = ${nf(c, 2)}` }); canvas.addMarker({ x: c, y: 0, color: canvas.red(), radius: 5, hollow: true }); } });
      }
      if (kind === 'inverse') {
        let f, fi;
        if (p.it === 0) { f = (x) => p.a * Math.pow(p.b, x); fi = (x) => (x > 0 ? Math.log(x / p.a) / Math.log(p.b) : NaN); }
        else { f = (x) => (x > p.h ? Math.log(x - p.h) / Math.log(p.b) + p.k : NaN); fi = (x) => Math.pow(p.b, x - p.k) + p.h; }
        canvas.addFunction({ evaluator: ev(f), color: canvas.accent(), thickness: 2.8, label: 'f' });
        canvas.addFunction({ evaluator: ev(fi), color: canvas.orange(), thickness: 2.8, label: 'f⁻¹' });
        canvas.addFunction({ evaluator: ev((x) => x), color: canvas.gray(), thickness: 1.4, dashed: true, label: 'y = x' });
        if (p.it === 1) { canvas.addGuideLine({ axis: 'vertical', position: p.h, color: canvas.green(), label: `x = ${S(p.h)}` }); canvas.addGuideLine({ axis: 'horizontal', position: p.h, color: canvas.green(), label: `y = ${S(p.h)}` }); }
        else canvas.addGuideLine({ axis: 'horizontal', position: 0, color: canvas.green(), label: '' });
      }
      const ex = p.ex;
      const gx = (x) => (x - ex.h > 0 ? Math.log(x - ex.h) / Math.log(ex.b) : NaN);
      canvas.addFunction({ evaluator: ev(gx), color: canvas.purple(), thickness: 1.8, dashed: true, label: `g = log_${nf(ex.b, 2)}(x ${ex.h < 0 ? '+' : '−'} ${nf(Math.abs(ex.h), 1)})` });
      canvas.addFunction({ evaluator: ev((x) => Math.pow(ex.b, x) + ex.h), color: canvas.purple(), thickness: 1.2, dashed: true, label: '' });
      if (ex.h !== 0) canvas.addGuideLine({ axis: 'vertical', position: ex.h, color: canvas.purple(), label: '' });
      (p.pts || []).forEach((q) => {
        if (!isFinite(q.x) || !isFinite(q.y) || Math.abs(q.y) > Y || Math.abs(q.x) > X) return;
        canvas.addMarker({ x: q.x, y: q.y, color: canvas.gold(), radius: 6, label: q.l ? `(${nf(q.x, 2)}, ${nf(q.y, 2)})` : '' });
      });
      const ty = gx(ex.x), tx2 = ex.x + 0;
      if (isFinite(ty) && Math.abs(ty) <= Y && Math.abs(tx2) <= X) {
        canvas.addMarker({ x: ex.x, y: ty, color: canvas.purple(), radius: 5, label: `(${nf(ex.x, 1)}, ${nf(ty, 2)})` });
        const ix = ty, iy = ex.x - 0;
        if (Math.abs(ix) <= X && Math.abs(iy) <= Y) {
          canvas.addMarker({ x: ix, y: iy, color: canvas.purple(), radius: 5, shape: 'diamond', label: `(${nf(ix, 2)}, ${nf(iy, 1)})` });
          canvas.addSegment({ x1: ex.x, y1: ty, x2: ix, y2: iy, color: canvas.purple(), dashed: true, thickness: 1.2 });
        }
      }
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({ caption: Tx('b (g için taban)', 'b (base of g)'), min: 0.25, max: 6, step: 0.25, get: () => getProblem().ex.b, set: (v) => { getProblem().ex.b = Math.abs(v - 1) < 1e-9 ? 1.25 : v; } });
    h.addSlider({ caption: Tx('h (yatay kayma, asimptot x = h)', 'h (horizontal shift, asymptote x = h)'), min: -3, max: 3, step: 0.5, get: () => getProblem().ex.h, set: (v) => { getProblem().ex.h = v; } });
    h.addSlider({ caption: Tx('x (izlenen nokta)', 'x (tracking point)'), min: 0.2, max: 7.5, step: 0.1, get: () => getProblem().ex.x, set: (v) => { getProblem().ex.x = v; } });
  }

  function concept() {
    return Tx(
      'LOGARİTMA FONKSİYONLARI\n\n' +
      'TANIM: b > 0, b ≠ 1 için  log_b x = y  ⇔  b^y = x.\n' +
      '   Yani logaritma, "b tabanını kaçıncı kuvvete çıkarırsak x olur?" sorusunun cevabıdır; üstel fonksiyonun TERSİDİR.\n' +
      '   ln x = log_e x (doğal logaritma),  log x = log₁₀ x (onluk logaritma).\n\n' +
      'ÖZELLİKLER (y = log_b x):\n' +
      '   Tanım kümesi x > 0 (içi pozitif olmalı), görüntü kümesi ℝ.\n' +
      '   Dikey asimptot x = 0; grafik (1, 0) ve (b, 1) noktalarından geçer.\n' +
      '   b > 1: artan;  0 < b < 1: azalan.  Grafiği y = b^x\'in y = x doğrusuna göre aynasıdır.\n\n' +
      'KURALLAR (A, B > 0):\n' +
      '   log(AB) = log A + log B      log(A/B) = log A − log B\n' +
      '   log(A^n) = n·log A           log_b 1 = 0,  log_b b = 1\n' +
      '   Taban değiştirme: log_b x = ln x / ln b\n' +
      '   Ters olma: log_b(b^x) = x,  b^(log_b x) = x,  ln(e^x) = x,  e^(ln x) = x\n\n' +
      'ÖLÇEKLER: pH = −log[H⁺];  ses düzeyi L = 10·log(I/I₀) dB;  Richter M = log(A/A₀). Girdi 10 kat artınca değer 1 birim (ses için 10 dB) artar.\n\n' +
      'YÖNTEM:\n' +
      '   Üstel denklem: üstel terimi yalnız bırakalım, ln alalım, x\'i çözelim.\n' +
      '   Logaritmalı denklem: önce tanım kümesini yazalım; logaritmaları tek terimde birleştirelim; üstel biçime geçelim; kökleri tanım kümesiyle KONTROL edelim.\n' +
      '   Tanım kümesi: log(f(x)) için f(x) > 0 eşitsizliğini çözeriz.\n\n' +
      'DİKKAT: log(A + B) ≠ log A + log B;  log(A)/log(B) ≠ log(A/B);  logaritmanın içi negatif ya da sıfır olamaz; denklem çözerken bulunan bazı kökler YABANCI olabilir.\n\n' +
      'MİNİ ÖRNEK: log₂(x) + log₂(x − 2) = 3  ⇒  x(x − 2) = 8  ⇒  x = 4 veya x = −2. Tanım kümesi x > 2 olduğundan x = −2 yabancı kök; çözüm x = 4.\n' +
      'MÜHENDİSLİKTE: desibel, pH, Richter, logaritmik eksenli grafikler (Bode diyagramı), kararlı büyüme/azalma sürelerinin hesabında.',
      'LOGARITHMIC FUNCTIONS\n\n' +
      'DEFINITION: for b > 0, b ≠ 1,  log_b x = y  ⇔  b^y = x.\n' +
      '   A logarithm answers "to which power must we raise b to get x?"; it is the INVERSE of the exponential function.\n' +
      '   ln x = log_e x (natural log),  log x = log₁₀ x (common log).\n\n' +
      'PROPERTIES (y = log_b x):\n' +
      '   Domain x > 0 (the argument must be positive), range ℝ.\n' +
      '   Vertical asymptote x = 0; the graph passes through (1, 0) and (b, 1).\n' +
      '   b > 1: increasing;  0 < b < 1: decreasing.  Its graph is the mirror image of y = b^x in the line y = x.\n\n' +
      'LAWS (A, B > 0):\n' +
      '   log(AB) = log A + log B      log(A/B) = log A − log B\n' +
      '   log(A^n) = n·log A           log_b 1 = 0,  log_b b = 1\n' +
      '   Change of base: log_b x = ln x / ln b\n' +
      '   Inverse: log_b(b^x) = x,  b^(log_b x) = x,  ln(e^x) = x,  e^(ln x) = x\n\n' +
      'SCALES: pH = −log[H⁺];  sound level L = 10·log(I/I₀) dB;  Richter M = log(A/A₀). Multiplying the input by 10 adds 1 unit (10 dB for sound).\n\n' +
      'METHOD:\n' +
      '   Exponential equation: isolate the exponential term, take ln, solve for x.\n' +
      '   Logarithmic equation: write the domain first; combine the logs into one term; switch to exponential form; CHECK the roots against the domain.\n' +
      '   Domain: for log(f(x)) solve f(x) > 0.\n\n' +
      'PITFALLS: log(A + B) ≠ log A + log B;  log A / log B ≠ log(A/B);  the argument can never be negative or zero; some roots found while solving may be EXTRANEOUS.\n\n' +
      'MINI EXAMPLE: log₂(x) + log₂(x − 2) = 3  ⇒  x(x − 2) = 8  ⇒  x = 4 or x = −2. The domain is x > 2, so x = −2 is extraneous; the solution is x = 4.\n' +
      'IN ENGINEERING: decibels, pH, Richter, log-scale plots (Bode diagrams), growth/decay time calculations.');
  }

  Topics.register('functions', {
    id: 'logarithms',
    tabTitle: () => Tx('Logaritma Fonksiyonları', 'Logarithmic Functions'),
    concept,
    problemStatement,
    createProblem,
    links: [
      { match: /^(TANIM|DEFINITION):/, make: (rng) => FnKit.until(createProblem, rng, (p) => ['eval'].includes(p.kind)) },
      { match: /^\s*(ln x = log_e x)/, make: (rng) => FnKit.until(createProblem, rng, (p) => ['special'].includes(p.kind)) },
      { match: /^\s*(Dikey asimptot|Vertical asymptote) x = 0/, make: (rng) => FnKit.until(createProblem, rng, (p) => ['inverse'].includes(p.kind)) },
      { match: /^\s*log\(AB\) =/, make: (rng) => FnKit.until(createProblem, rng, (p) => ['condense','expand'].includes(p.kind)) },
      { match: /^\s*log\(A\^n\) =/, make: (rng) => FnKit.until(createProblem, rng, (p) => ['expand','condense'].includes(p.kind)) },
      { match: /^\s*(Taban değiştirme|Change of base):/, make: (rng) => FnKit.until(createProblem, rng, (p) => ['cob'].includes(p.kind)) },
      { match: /^\s*(Ters olma|Inverse): /, make: (rng) => FnKit.until(createProblem, rng, (p) => ['inverse'].includes(p.kind)) },
      { match: /^(ÖLÇEKLER|SCALES):/, make: (rng) => FnKit.until(createProblem, rng, (p) => ['scale'].includes(p.kind)) },
      { match: /^\s*(Üstel denklem|Exponential equation):/, make: (rng) => FnKit.until(createProblem, rng, (p) => ['expEq','expEq2'].includes(p.kind)) },
      { match: /^\s*(Logaritmalı denklem|Logarithmic equation):/, make: (rng) => FnKit.until(createProblem, rng, (p) => ['logEq1','logEq2'].includes(p.kind)) },
      { match: /^\s*(Tanım kümesi: log|Domain: for log)/, make: (rng) => FnKit.until(createProblem, rng, (p) => ['domain'].includes(p.kind)) },
    ],
    solveSteps,
    draw,
    buildControls,
  });
})();
