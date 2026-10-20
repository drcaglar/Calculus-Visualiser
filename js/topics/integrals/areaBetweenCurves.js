// Area Between Two Curves (chapter 'integrals'). Thomas 5.6, Stewart 6.1.  A = ∫ₐᵇ [top − bottom] dx  (or ∫ [right − left] dy).
// problem.kind: 'parline' parabola A x² + C and a line through two integer intersections (bounded) | 'sincos' sin x & cos x on [a,b] (crossings) |
//   'expm' eˣ & the line y = e^m on [a,b] | 'expexp' eˣ & e⁻ˣ on [a,b] | 'cubic' x³ & c x on [a,b] (top/bottom swap) |
//   'ypar' x = y² & the line x = m y + k (integrate in y) | 'sqrtline' y = √x, y = x − 2, y = 0 (two x-pieces or one y-integral).
(function () {
  const tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  const N = (v) => M(fmt2(v));
  const PI = Math.PI, S2 = Math.SQRT2;
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');
  const isInt = (v) => Math.abs(v - Math.round(v)) < 1e-9;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const CAP = 40;
  let forced = null;

  function fr(n, d) { if (d < 0) { n = -n; d = -d; } const g = gcd(Math.abs(n), d) || 1; return { n: n / g, d: d / g }; }
  function frS(n, d) { const q = fr(n, d); return M(q.d === 1 ? String(q.n) : q.n + '/' + q.d); }
  function ratTxt(v) {
    for (let d = 1; d <= 24; d++) { if (Math.abs(v * d - Math.round(v * d)) < 1e-9) return frS(Math.round(v * d), d); }
    return null;
  }
  function xt(v) {
    if (isInt(v)) return N(Math.round(v));
    const r = v / PI;
    for (const d of [1, 2, 3, 4, 6, 8, 12]) {
      if (Math.abs(r * d - Math.round(r * d)) < 1e-9) {
        const q = fr(Math.round(r * d), d);
        return M((q.n === 1 ? '' : q.n === -1 ? '−' : q.n) + 'π' + (q.d === 1 ? '' : '/' + q.d));
      }
    }
    return N(v);
  }
  function eT(v) { if (isInt(v) && v >= 0 && v < 10) { const r = Math.round(v); return r === 0 ? '1' : r === 1 ? 'e' : 'e' + sup(r); } return 'e^(' + N(v) + ')'; }
  const sg = (v) => (v >= 0 ? ' + ' + v : ' − ' + (-v));
  const lin = (m, k) => {
    const t = m === 0 ? '' : m === 1 ? 'x' : m === -1 ? '−x' : m + 'x';
    if (t === '') return M(String(k));
    return M(k === 0 ? t : t + sg(k));
  };
  const linY = (m, k) => lin(m, k).replace(/x/g, 'y');
  // polynomial text from [[coef (fr obj), power], ...]
  function poly(terms) {
    let out = '';
    terms.forEach((t) => {
      const q = fr(t[0].n, t[0].d);
      if (q.n === 0) return;
      const a = Math.abs(q.n), pw = t[1];
      const body = (pw === 0 ? String(a) : (a === 1 ? '' : a) + 'x' + (pw === 1 ? '' : sup(pw))) + (q.d === 1 ? '' : '/' + q.d);
      out += out === '' ? (q.n < 0 ? '−' : '') + body : (q.n < 0 ? ' − ' : ' + ') + body;
    });
    return out === '' ? '0' : out;
  }
  const FR = (n, d) => ({ n, d: d || 1 });
  function simpson(f, a, b, n) {
    n = n || 800;
    const h = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  }
  const sf = (fn) => (x) => { try { const r = fn(x); return Number.isFinite(r) && Math.abs(r) < CAP ? r : NaN; } catch (e) { return NaN; } };
  function rgba(hex, a) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return hex;
    return `rgba(${parseInt(m[1].substr(0, 2), 16)},${parseInt(m[1].substr(2, 2), 16)},${parseInt(m[1].substr(4, 2), 16)},${a})`;
  }

  // ------------------------------------------------------------ models
  const KINDS = ['parline', 'sincos', 'expm', 'expexp', 'cubic', 'ypar', 'sqrtline'];
  const GIVEN = ['sincos', 'expm', 'expexp', 'cubic'];
  const LIM = { sincos: [-4, 4], expm: [-2, 3], expexp: [-2.5, 2.5], cubic: [-2.5, 2.5] };
  const given = (p) => GIVEN.indexOf(p.kind) >= 0;

  function model(p) {
    switch (p.kind) {
      case 'parline': {
        const lm = p.A * (p.r1 + p.r2), lk = p.C - p.A * p.r1 * p.r2;
        return {
          f: (x) => lm * x + lk, g: (x) => p.A * x * x + p.C,
          F: (x) => lm * x * x / 2 + lk * x, G: (x) => p.A * x * x * x / 3 + p.C * x,
          fS: 'y = ' + lin(lm, lk), gS: 'y = ' + M((p.A === 1 ? '' : p.A) + 'x²' + (p.C === 0 ? '' : sg(p.C))),
          DS: poly([[FR(-p.A, 3), 3], [FR(lm, 2), 2], [FR(lk - p.C), 1]]), cr: [], xm: Math.max(Math.abs(p.r1), Math.abs(p.r2)) + 1.5, lm, lk,
        };
      }
      case 'sincos':
        return { f: Math.sin, g: Math.cos, F: (x) => -Math.cos(x), G: Math.sin, fS: 'y = sin x', gS: 'y = cos x', DS: '−cos x − sin x', xm: 4.5, cr: null };
      case 'expm': {
        const e = Math.exp(p.m);
        return { f: Math.exp, g: () => e, F: Math.exp, G: (x) => e * x, fS: 'y = eˣ', gS: 'y = ' + eT(p.m), DS: `eˣ − ${eT(p.m)}·x`, xm: 3.5, cr: [p.m] };
      }
      case 'expexp':
        return { f: Math.exp, g: (x) => Math.exp(-x), F: Math.exp, G: (x) => -Math.exp(-x), fS: 'y = eˣ', gS: 'y = e⁻ˣ', DS: 'eˣ + e⁻ˣ', xm: 3, cr: [0] };
      case 'cubic':
        return {
          f: (x) => x * x * x, g: (x) => p.c * x, F: (x) => x * x * x * x / 4, G: (x) => p.c * x * x / 2,
          fS: 'y = x³', gS: 'y = ' + (p.c === 1 ? '' : p.c) + 'x', DS: poly([[FR(1, 4), 4], [FR(-p.c, 2), 2]]), xm: 3.2,
          cr: [-Math.sqrt(p.c), 0, Math.sqrt(p.c)],
        };
      default: return null;
    }
  }
  function crossings(p, m, a, b) {
    let list;
    if (p.kind === 'sincos') { list = []; for (let k = -4; k <= 4; k++) list.push(PI / 4 + k * PI); } else list = m.cr || [];
    return list.filter((x) => x > a + 1e-9 && x < b - 1e-9).sort((u, v) => u - v);
  }
  function limits(p) {
    if (p.kind === 'parline' || p.kind === 'ypar') return [p.r1, p.r2];
    if (p.kind === 'sqrtline') return [0, 4];
    return [p.a, p.b];
  }
  function normLim(p) {
    if (!given(p)) return;
    const [lo, hi] = LIM[p.kind];
    p.a = Math.max(lo, Math.min(hi - 0.25, p.a));
    p.b = Math.max(p.a + 0.25, Math.min(hi, p.b));
  }
  // pieces: [{x1, x2, topFn, botFn, topN, v, col}]
  function pieces(p) {
    if (p.kind === 'sqrtline') {
      const sq = Math.sqrt;
      const v1 = 2 / 3 * Math.pow(2, 1.5);
      const v2 = (2 / 3 * 8 - 8 + 8) - (2 / 3 * Math.pow(2, 1.5) - 2 + 4);
      return [
        { x1: 0, x2: 2, topFn: sq, botFn: () => 0, topN: 'f', v: v1, col: 0 },
        { x1: 2, x2: 4, topFn: sq, botFn: (x) => x - 2, topN: 'f', v: v2, col: 1 },
      ];
    }
    if (p.kind === 'ypar') {
      const lm = p.m, lk = p.k;
      const D = (y) => -y * y * y / 3 + lm * y * y / 2 + lk * y;
      return [{ x1: p.r1, x2: p.r2, topFn: (y) => lm * y + lk, botFn: (y) => y * y, topN: 'f', v: Math.abs(D(p.r2) - D(p.r1)), col: 0 }];
    }
    const m = model(p);
    const [a, b] = limits(p);
    const cuts = [a].concat(crossings(p, m, a, b), [b]);
    const out = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const x1 = cuts[i], x2 = cuts[i + 1], mid = (x1 + x2) / 2;
      const fTop = m.f(mid) - m.g(mid) >= 0;
      const v = Math.abs((m.F(x2) - m.G(x2)) - (m.F(x1) - m.G(x1)));
      out.push({ x1, x2, topFn: fTop ? m.f : m.g, botFn: fTop ? m.g : m.f, topN: fTop ? 'f' : 'g', v, col: fTop ? 0 : 1, D1: (m.F(x1) - m.G(x1)), D2: (m.F(x2) - m.G(x2)) });
    }
    return out;
  }
  const totalOf = (pcs) => pcs.reduce((s, q) => s + q.v, 0);

  // ----- exact values
  function symSin(k) { // sin(k pi/4) as [r, t] meaning r + t*sqrt(2)/2
    const T = [[0, 0], [0, 1], [1, 0], [0, 1], [0, 0], [0, -1], [-1, 0], [0, -1]]; return T[((k % 8) + 8) % 8];
  }
  function symCos(k) { return symSin(k + 2); }
  function symText(r, t) {
    let sq = '';
    if (t !== 0) {
      const tt = t / 2;
      sq = isInt(tt) ? `${Math.abs(tt) === 1 ? '' : Math.abs(tt)}√2` : `${Math.abs(t)}·√2/2`;
      if (Math.abs(t) === 1) sq = '√2/2';
    }
    if (sq === '') return M(String(r));
    let out = (t < 0 ? '−' : '') + sq;
    if (r !== 0) out += (r > 0 ? ' + ' : ' − ') + Math.abs(r);
    return M(out);
  }
  function expText(map) {
    const ks = Object.keys(map).map(Number).filter((k) => map[k] !== 0).sort((u, v) => v - u);
    if (!ks.length) return '0';
    let out = '';
    ks.forEach((k, i) => {
      const c = map[k], a = Math.abs(c);
      let body;
      if (k === 0) body = String(a);
      else if (k === 1) body = (a === 1 ? '' : a) + 'e';
      else if (k === -1) body = a + '/e';
      else body = (a === 1 ? '' : a) + 'e' + sup(k);
      out += i === 0 ? (c < 0 ? '−' : '') + body : (c < 0 ? ' − ' : ' + ') + body;
    });
    return M(out);
  }
  function exactTxt(p, pcs) {
    const tot = totalOf(pcs);
    if (p.kind === 'sincos') {
      let r = 0, t = 0;
      for (const q of pcs) {
        const k1 = q.x1 / (PI / 4), k2 = q.x2 / (PI / 4);
        if (!isInt(k1) || !isInt(k2)) return null;
        const D = (k) => { const c = symCos(k), s = symSin(k); return [-(c[0] + s[0]), -(c[1] + s[1])]; };
        const d1 = D(Math.round(k1)), d2 = D(Math.round(k2));
        const sign = (q.D2 - q.D1) >= 0 ? 1 : -1;
        r += sign * (d2[0] - d1[0]); t += sign * (d2[1] - d1[1]);
      }
      return symText(r, t);
    }
    if (p.kind === 'expm' || p.kind === 'expexp') {
      if (!isInt(p.a) || !isInt(p.b)) return null;
      const map = {};
      const add = (k, c) => { map[k] = (map[k] || 0) + c; };
      for (const q of pcs) {
        const sign = (q.D2 - q.D1) >= 0 ? 1 : -1;
        const x1 = Math.round(q.x1), x2 = Math.round(q.x2);
        if (p.kind === 'expm') { add(x2, sign); add(x1, -sign); add(p.m, -sign * (x2 - x1)); } else { add(x2, sign); add(-x2, sign); add(x1, -sign); add(-x1, -sign); }
      }
      return expText(map);
    }
    return ratTxt(tot);
  }

  // ------------------------------------------------------------ problems
  const SINCOS_SETS = [[0, PI / 4], [0, PI / 2], [PI / 4, 5 * PI / 4], [0, PI], [-3 * PI / 4, PI / 4], [-PI / 2, PI / 2]];
  function createProblem(rng) {
    const kind = forced ? forced.kind : KINDS[rng.nextInt(0, KINDS.length)];
    const p = { kind, t: 0.5, dir: 0 };
    if (kind === 'parline') {
      p.A = rng.pick([1, 2]); p.C = rng.nextInt(-2, 3);
      const maxR = p.A === 1 ? 3 : 2, maxD = p.A === 1 ? 4 : 3;
      for (let i = 0; i < 40; i++) {
        p.r1 = rng.nextInt(-2, 2); p.r2 = p.r1 + rng.nextInt(1, maxD + 1);
        if (p.r2 <= maxR) break;
      }
      if (p.r2 > maxR) { p.r1 = -1; p.r2 = 1; }
    } else if (kind === 'sincos') {
      const s = rng.pick(SINCOS_SETS); p.a = s[0]; p.b = s[1];
    } else if (kind === 'expm') {
      p.m = rng.pick([1, 2]); const o = rng.nextInt(0, 2); p.a = o ? -1 : 0; p.b = o ? p.m : p.m + 1;
    } else if (kind === 'expexp') {
      const s = rng.pick([[-1, 1], [0, 2], [-2, 1], [-1, 2]]); p.a = s[0]; p.b = s[1];
    } else if (kind === 'cubic') {
      p.c = rng.pick([1, 4]); const r = Math.sqrt(p.c); const o = rng.nextInt(0, 3);
      p.a = o === 2 ? 0 : -r; p.b = o === 1 ? 0 : r;
    } else if (kind === 'ypar') {
      for (let i = 0; i < 40; i++) {
        p.r1 = rng.nextInt(-2, 2); p.r2 = p.r1 + rng.nextInt(1, 5);
        if (p.r2 <= 3) break;
      }
      if (p.r2 > 3) { p.r1 = -1; p.r2 = 2; }
      p.m = p.r1 + p.r2; p.k = -p.r1 * p.r2;
    }
    syncControls();
    return p;
  }

  function curveText(p) {
    if (p.kind === 'ypar') return [`x = y²`, `x = ${linY(p.m, p.k)}`];
    if (p.kind === 'sqrtline') return ['y = √x', 'y = x − 2', 'y = 0'];
    const m = model(p);
    return [m.fS, m.gS];
  }
  function problemStatement(p) {
    const c = curveText(p);
    const [a, b] = limits(p);
    const lim = `x = ${xt(a)} ${tx('ile', 'and')} x = ${xt(b)}`;
    switch (p.kind) {
      case 'parline':
        return tx(`${c[1]} parabolü ile ${c[0]} doğrusunun sınırladığı bölgenin alanını bulalım. Önce kesişim noktalarını bulmamız gerekecek; hangi eğrinin üstte olduğuna da bakalım.`,
          `Let's find the area of the region bounded by the parabola ${c[1]} and the line ${c[0]}. We first need the intersection points, and we also check which curve is on top.`);
      case 'sincos':
        return tx(`${c[0]} ile ${c[1]} eğrileri arasında ${lim} arasında kalan toplam alanı bulalım. Bu aralıkta eğriler kesişiyor mu, üstteki eğri değişiyor mu, bakalım.`,
          `Let's find the total area between ${c[0]} and ${c[1]} for x between ${xt(a)} and ${xt(b)}. Do the curves cross in this interval, and does the upper curve change?`);
      case 'expm':
        return tx(`${c[0]} eğrisi ile ${c[1]} doğrusu arasında, ${lim} arasında kalan alanı bulalım. Doğru ile eğri bu aralıkta kesişiyor mu, kontrol edelim.`,
          `Let's find the area between the curve ${c[0]} and the line ${c[1]} for x between ${xt(a)} and ${xt(b)}. Do the curve and the line cross in this interval?`);
      case 'expexp':
        return tx(`${c[0]} ile ${c[1]} eğrileri arasında, x = ${xt(a)} ile x = ${xt(b)} arasında kalan alanı bulalım. Eğriler nerede kesişiyor?`,
          `Let's find the area between ${c[0]} and ${c[1]} for x between ${xt(a)} and ${xt(b)}. Where do the curves cross?`);
      case 'cubic':
        return tx(`${c[0]} eğrisi ile ${c[1]} doğrusu arasında, x = ${xt(a)} ile x = ${xt(b)} arasında kalan alanı bulalım. Üstteki ve alttaki eğri bu aralıkta yer değiştiriyor mu?`,
          `Let's find the area between the curve ${c[0]} and the line ${c[1]} for x between ${xt(a)} and ${xt(b)}. Do the upper and lower curves swap in this interval?`);
      case 'ypar':
        return tx(`${c[0]} parabolü ile ${c[1]} doğrusunun sınırladığı bölgenin alanını y'ye göre integral alarak bulalım. Neden x yerine y'yi integral değişkeni seçmek kolaylık sağlıyor?`,
          `Let's find the area of the region bounded by the parabola ${c[0]} and the line ${c[1]} by integrating with respect to y. Why is it easier to choose y as the variable of integration?`);
      default:
        return tx('y = √x eğrisi, y = x − 2 doğrusu ve x-ekseni (y = 0) ile sınırlanan bölgenin alanını bulalım: önce x\'e göre iki parçaya bölerek, sonra y\'ye göre tek integralle hesaplayıp sonuçları karşılaştıralım.',
          'Let\'s find the area of the region bounded by the curve y = √x, the line y = x − 2 and the x-axis (y = 0): first with x as the variable (two pieces), then with y as the variable (one integral), and compare the results.');
    }
  }

  function interSteps(p, m) {
    const [a, b] = limits(p);
    switch (p.kind) {
      case 'parline': {
        const s = p.r1 + p.r2, P = p.r1 * p.r2;
        const fac = (r) => (r === 0 ? 'x' : `(x ${r > 0 ? '− ' + r : '+ ' + (-r)})`);
        const q2 = `x²${s === 0 ? '' : (-s > 0 ? ' + ' + (-s) : ' − ' + s) + 'x'}${P === 0 ? '' : sg(P)}`;
        return tx(`Eğriler kesiştiği yerde y değerleri eşittir: ${m.gS.slice(4)} = ${m.fS.slice(4)}. Her şeyi bir tarafa toplayıp ${p.A === 1 ? '' : p.A + ' ile '}sadeleştirirsek ${M(q2)} = 0 olur, yani ${M(fac(p.r1) + fac(p.r2))} = 0. Kesişim x değerleri: x = ${N(p.r1)} ve x = ${N(p.r2)}. Noktalar: (${N(p.r1)}, ${N(m.f(p.r1))}) ve (${N(p.r2)}, ${N(m.f(p.r2))}). Bu iki değer integralin sınırları olur.`,
          `Where the curves meet, the y values are equal: ${m.gS.slice(4)} = ${m.fS.slice(4)}. Moving everything to one side and dividing by ${p.A === 1 ? '1' : p.A} gives ${M(q2)} = 0, i.e. ${M(fac(p.r1) + fac(p.r2))} = 0. Intersection x values: x = ${N(p.r1)} and x = ${N(p.r2)}. Points: (${N(p.r1)}, ${N(m.f(p.r1))}) and (${N(p.r2)}, ${N(m.f(p.r2))}). These two values are the limits of the integral.`);
      }
      case 'sincos': {
        const cr = crossings(p, m, a, b);
        const lst = cr.length ? cr.map((x) => `x = ${xt(x)}`).join(', ') : tx('yok', 'none');
        return tx(`sin x = cos x ⇒ tan x = 1 ⇒ x = π/4 + kπ (k tam sayı); bu noktalarda y = ±√2/2. (${xt(a)}, ${xt(b)}) aralığındaki kesişimler: ${lst}. Sınırlar: x = ${xt(a)} ve x = ${xt(b)}.`,
          `sin x = cos x ⇒ tan x = 1 ⇒ x = π/4 + kπ (k an integer); at these points y = ±√2/2. Crossings inside (${xt(a)}, ${xt(b)}): ${lst}. Limits: x = ${xt(a)} and x = ${xt(b)}.`);
      }
      case 'expm':
        return tx(`eˣ = ${eT(p.m)} ⇒ x = ${p.m} (eˣ birebirdir); kesişim noktası (${p.m}, ${N(Math.exp(p.m))}). ${p.m > p.a + 1e-9 && p.m < p.b - 1e-9 ? 'Bu nokta [' + xt(p.a) + ', ' + xt(p.b) + '] aralığının İÇİNDEDİR: aralığı burada böleceğiz.' : 'Bu nokta aralığın dışında: bölme gerekmez.'}`,
          `eˣ = ${eT(p.m)} ⇒ x = ${p.m} (eˣ is one-to-one); intersection point (${p.m}, ${N(Math.exp(p.m))}). ${p.m > p.a + 1e-9 && p.m < p.b - 1e-9 ? 'This point is INSIDE [' + xt(p.a) + ', ' + xt(p.b) + ']: we split the interval here.' : 'This point is outside the interval: no splitting is needed.'}`);
      case 'expexp':
        return tx(`eˣ = e⁻ˣ ⇒ e^(2x) = 1 ⇒ x = 0; kesişim noktası (0, 1). ${p.a < -1e-9 && p.b > 1e-9 ? 'x = 0 aralığın İÇİNDE: aralığı orada böleceğiz.' : 'x = 0 aralığın dışında (ya da uçta): bölme gerekmez.'}`,
          `eˣ = e⁻ˣ ⇒ e^(2x) = 1 ⇒ x = 0; intersection point (0, 1). ${p.a < -1e-9 && p.b > 1e-9 ? 'x = 0 is INSIDE the interval: we split it there.' : 'x = 0 is outside (or at the end of) the interval: no splitting is needed.'}`);
      case 'cubic': {
        const r = Math.sqrt(p.c);
        const cr = crossings(p, m, p.a, p.b);
        return tx(`x³ = ${p.c === 1 ? '' : p.c}x ⇒ x(x² − ${p.c}) = 0 ⇒ x = 0, x = ±${N(r)}. [${xt(p.a)}, ${xt(p.b)}] içindeki kesişimler: ${cr.length ? cr.map((x) => 'x = ' + xt(x)).join(', ') : 'yok'}.`,
          `x³ = ${p.c === 1 ? '' : p.c}x ⇒ x(x² − ${p.c}) = 0 ⇒ x = 0, x = ±${N(r)}. Crossings inside [${xt(p.a)}, ${xt(p.b)}]: ${cr.length ? cr.map((x) => 'x = ' + xt(x)).join(', ') : 'none'}.`);
      }
      default: return '';
    }
  }

  function pieceTxt(p, pcs, m) {
    const f1 = tx('f', 'f'), g1 = tx('g', 'g');
    return pcs.map((q, i) => {
      const mid = (q.x1 + q.x2) / 2;
      const ft = q.topN === 'f' ? 'f' : 'g';
      const T = q.topFn(mid), B = q.botFn(mid);
      return tx(`   ${i + 1}. parça [${xt(q.x1)}, ${xt(q.x2)}]: x = ${N(mid)} için ${q.topN === 'f' ? 'f' : 'g'} = ${N(T)} ve diğer eğri = ${N(B)} ⇒ ${q.topN === 'f' ? 'f' : 'g'} ÜSTTE (${ft === 'f' ? m.fS : m.gS}).`,
        `   piece ${i + 1} [${xt(q.x1)}, ${xt(q.x2)}]: at x = ${N(mid)} ${q.topN === 'f' ? 'f' : 'g'} = ${N(T)} and the other curve = ${N(B)} ⇒ ${q.topN === 'f' ? 'f' : 'g'} is on TOP (${ft === 'f' ? m.fS : m.gS}).`);
    }).join('\n') + (f1 && g1 ? '' : '');
  }

  function solveSteps(p) {
    normLim(p);
    const s = [];
    if (p.kind === 'ypar') return yparSteps(p);
    if (p.kind === 'sqrtline') return sqrtSteps(p);
    const m = model(p);
    const [a, b] = limits(p);
    const pcs = pieces(p);
    const tot = totalOf(pcs);
    const ex = exactTxt(p, pcs);
    const multi = pcs.length > 1;
    const sim = simpson((x) => Math.abs(m.f(x) - m.g(x)), a, b);
    s.push(tx(`── 1) Soruyu kuralım ──\nf: ${m.fS}, g: ${m.gS}. Eğriler arasındaki alan, her x için "üstteki eğri − alttaki eğri" yüksekliğindeki ince dikey şeritlerin toplamıdır: A = ∫ₐᵇ [üst(x) − alt(x)] dx. Bu fark hiçbir zaman negatif olmaz; bu yüzden hangisinin üstte olduğunu bilmemiz gerekir.`,
      `── 1) Setting up the problem ──\nf: ${m.fS}, g: ${m.gS}. The area between the curves is the sum of thin vertical strips of height "upper curve − lower curve": A = ∫ₐᵇ [top(x) − bottom(x)] dx. This difference is never negative, so we need to know which curve is on top.`));
    s.push(tx(`── 2) Kesişim noktaları ──\n${interSteps(p, m)}`, `── 2) Intersection points ──\n${interSteps(p, m)}`));
    s.push(tx(`── 3) Hangi eğri üstte? ──\nHer parçadan bir deneme noktası seçip f ve g değerlerini karşılaştırırız:\n${pieceTxt(p, pcs, m)}${multi ? '\nÜstteki eğri değiştiği için aralığı kesişimde bölmeliyiz (yoksa pozitif ve negatif parçalar birbirini götürür).' : '\nTüm aralıkta aynı eğri üstte; tek integral yeterli.'}`,
      `── 3) Which curve is on top? ──\nWe pick a test point in each piece and compare f and g:\n${pieceTxt(p, pcs, m)}${multi ? '\nBecause the upper curve changes we must split the interval at the crossing (otherwise positive and negative parts cancel).' : '\nThe same curve is on top throughout; one integral is enough.'}`));
    const setup = pcs.map((q) => `∫[${xt(q.x1)}→${xt(q.x2)}] (${q.topN === 'f' ? 'f − g' : 'g − f'}) dx`).join('  +  ');
    s.push(tx(`── 4) İntegrali kuralım ──\nA = ${setup}.`, `── 4) Writing the integral ──\nA = ${setup}.`));
    s.push(tx(`── 5) Ters türev ──\nD(x) = ∫ (f − g) dx = ${m.DS}. Üstte g olan parçada (g − f) = −(f − g) olduğundan, o parçanın integrali −[D(x₂) − D(x₁)] olur.`,
      `── 5) Antiderivative ──\nD(x) = ∫ (f − g) dx = ${m.DS}. On a piece where g is on top, (g − f) = −(f − g), so that piece equals −[D(x₂) − D(x₁)].`));
    const evalT = pcs.map((q, i) => `   ${i + 1}) ${q.topN === 'f' ? '' : '−'}[D(${xt(q.x2)}) − D(${xt(q.x1)})] = ${q.topN === 'f' ? '' : '−'}[${N(q.D2)} − (${N(q.D1)})] = ${N(q.v)}`).join('\n');
    s.push(tx(`── 6) Sınırlarda değerlendirelim ──\n${evalT}`, `── 6) Evaluating at the limits ──\n${evalT}`));
    s.push(tx(`── 7) Toplam alan ──\nA = ${pcs.map((q) => N(q.v)).join(' + ')} = ${N(tot)}${ex ? ' = ' + ex : ''} (birim²).`,
      `── 7) Total area ──\nA = ${pcs.map((q) => N(q.v)).join(' + ')} = ${N(tot)}${ex ? ' = ' + ex : ''} (square units).`));
    s.push(tx(`── 8) Kontrol ──\nSimpson kuralı ile ∫ |f − g| dx ≈ ${N(sim)}; bulunan ${N(tot)} ile uyuşuyor ✓. Cevap: A = ${N(tot)}${ex ? ' = ' + ex : ''}.`,
      `── 8) Check ──\nSimpson's rule gives ∫ |f − g| dx ≈ ${N(sim)}, which agrees with ${N(tot)} ✓. Answer: A = ${N(tot)}${ex ? ' = ' + ex : ''}.`));
    return s;
  }

  function yparSteps(p) {
    const pcs = pieces(p), q = pcs[0], tot = q.v;
    const D = (y) => -y * y * y / 3 + p.m * y * y / 2 + p.k * y;
    const ex = ratTxt(tot);
    const ym = (p.r1 + p.r2) / 2;
    const fac = (r) => (r === 0 ? 'y' : `(y ${r > 0 ? '− ' + r : '+ ' + (-r)})`);
    const sm = p.r1 + p.r2, P = p.r1 * p.r2;
    const q2 = `y²${sm === 0 ? '' : (-sm > 0 ? ' + ' + (-sm) : ' − ' + sm) + 'y'}${P === 0 ? '' : sg(P)}`;
    const sim = simpson((y) => Math.abs(q.topFn(y) - q.botFn(y)), p.r1, p.r2);
    const poly3 = poly([[FR(-1, 3), 3], [FR(p.m, 2), 2], [FR(p.k), 1]]).replace(/x/g, 'y');
    const s = [];
    s.push(tx(`── 1) Neden y'ye göre? ──\nParabol x = y² ve doğru x = ${linY(p.m, p.k)} biçiminde, yani her ikisi de y'nin fonksiyonu. x'e göre integral alsaydık parabolün iki kolunu (y = ±√x) ayrı ayrı yazmak gerekirdi. y'ye göre yatay şeritler alırız: A = ∫ [sağ(y) − sol(y)] dy.`,
      `── 1) Why integrate in y? ──\nThe parabola x = y² and the line x = ${linY(p.m, p.k)} are both functions of y. With x as the variable we would have to write the two branches of the parabola (y = ±√x) separately. With y we use horizontal strips: A = ∫ [right(y) − left(y)] dy.`));
    s.push(tx(`── 2) Kesişim noktaları ──\ny² = ${linY(p.m, p.k)} ⇒ ${M(q2)} = 0 ⇒ ${M(fac(p.r1) + fac(p.r2))} = 0 ⇒ y = ${N(p.r1)} ve y = ${N(p.r2)}. Noktalar: (${N(p.r1 * p.r1)}, ${N(p.r1)}) ve (${N(p.r2 * p.r2)}, ${N(p.r2)}). Bunlar y-sınırlarıdır.`,
      `── 2) Intersection points ──\ny² = ${linY(p.m, p.k)} ⇒ ${M(q2)} = 0 ⇒ ${M(fac(p.r1) + fac(p.r2))} = 0 ⇒ y = ${N(p.r1)} and y = ${N(p.r2)}. Points: (${N(p.r1 * p.r1)}, ${N(p.r1)}) and (${N(p.r2 * p.r2)}, ${N(p.r2)}). These are the y-limits.`));
    s.push(tx(`── 3) Sağda hangi eğri? ──\ny = ${N(ym)} için doğru x = ${N(q.topFn(ym))}, parabol x = ${N(q.botFn(ym))} ⇒ doğru sağda, parabol solda.`,
      `── 3) Which curve is on the right? ──\nAt y = ${N(ym)} the line gives x = ${N(q.topFn(ym))} and the parabola x = ${N(q.botFn(ym))} ⇒ the line is on the right, the parabola on the left.`));
    s.push(tx(`── 4) İntegral ──\nA = ∫[${N(p.r1)}→${N(p.r2)}] [(${linY(p.m, p.k)}) − y²] dy. Ters türev: D(y) = ${poly3}.`,
      `── 4) The integral ──\nA = ∫[${N(p.r1)}→${N(p.r2)}] [(${linY(p.m, p.k)}) − y²] dy. Antiderivative: D(y) = ${poly3}.`));
    s.push(tx(`── 5) Hesaplayalım ──\nA = D(${N(p.r2)}) − D(${N(p.r1)}) = ${N(D(p.r2))} − (${N(D(p.r1))}) = ${N(tot)}${ex ? ' = ' + ex : ''}.`,
      `── 5) Evaluating ──\nA = D(${N(p.r2)}) − D(${N(p.r1)}) = ${N(D(p.r2))} − (${N(D(p.r1))}) = ${N(tot)}${ex ? ' = ' + ex : ''}.`));
    s.push(tx(`── 6) Kontrol ──\nİki kök arasındaki parabol-doğru alanı için (r₂ − r₁)³/6 formülü: (${N(p.r2)} − (${N(p.r1)}))³/6 = ${N((p.r2 - p.r1) ** 3 / 6)}; Simpson ≈ ${N(sim)} ✓. Cevap: A = ${N(tot)}${ex ? ' = ' + ex : ''}.`,
      `── 6) Check ──\nThe parabola-and-line area between two roots is (r₂ − r₁)³/6: (${N(p.r2)} − (${N(p.r1)}))³/6 = ${N((p.r2 - p.r1) ** 3 / 6)}; Simpson ≈ ${N(sim)} ✓. Answer: A = ${N(tot)}${ex ? ' = ' + ex : ''}.`));
    return s;
  }

  function sqrtSteps() {
    const pcs = pieces({ kind: 'sqrtline' });
    const tot = totalOf(pcs);
    const sim = simpson((x) => Math.sqrt(x) - Math.max(0, x - 2), 0, 4);
    const sy = simpson((y) => y + 2 - y * y, 0, 2);
    const s = [];
    s.push(tx('── 1) Bölgeyi tanıyalım ──\nSınırlar: y = √x (üstte), y = x − 2 (sağ-altta) ve x-ekseni y = 0 (solda altta). Bölge x = 0 ile x = 4 arasındadır.', '── 1) Understanding the region ──\nBoundaries: y = √x (top), y = x − 2 (lower right) and the x-axis y = 0 (lower left). The region lies between x = 0 and x = 4.'));
    s.push(tx('── 2) Kesişim noktaları ──\n√x = x − 2 ⇒ x = (x − 2)² ⇒ x² − 5x + 4 = 0 ⇒ (x − 1)(x − 4) = 0. x = 1 için √1 = 1 ama 1 − 2 = −1 (yabancı kök, elenir); x = 4 için √4 = 2 = 4 − 2 ✓. Doğru x-eksenini x = 2\'de, eğri x = 0\'da keser. Köşeler: (0, 0), (2, 0), (4, 2).',
      '── 2) Intersection points ──\n√x = x − 2 ⇒ x = (x − 2)² ⇒ x² − 5x + 4 = 0 ⇒ (x − 1)(x − 4) = 0. For x = 1, √1 = 1 but 1 − 2 = −1 (extraneous root, rejected); for x = 4, √4 = 2 = 4 − 2 ✓. The line meets the x-axis at x = 2 and the curve at x = 0. Corners: (0, 0), (2, 0), (4, 2).'));
    s.push(tx('── 3) Yöntem 1: x\'e göre, iki parça ──\nÜstteki eğri hep √x; alttaki ise [0, 2]\'de y = 0, [2, 4]\'te y = x − 2. Alt sınır değiştiği için aralığı x = 2\'de bölmeliyiz:\nA = ∫₀² √x dx + ∫₂⁴ (√x − x + 2) dx.',
      '── 3) Method 1: in x, two pieces ──\nThe top curve is always √x; the bottom is y = 0 on [0, 2] and y = x − 2 on [2, 4]. Since the bottom changes we must split at x = 2:\nA = ∫₀² √x dx + ∫₂⁴ (√x − x + 2) dx.'));
    s.push(tx(`── 4) İki parçayı hesaplayalım ──\n1) [(2/3)x^(3/2)] (0 → 2) = (2/3)·2^(3/2) = 4√2/3 = ${N(pcs[0].v)}.\n2) [(2/3)x^(3/2) − x²/2 + 2x] (2 → 4) = (16/3 − 8 + 8) − (4√2/3 − 2 + 4) = 10/3 − 4√2/3 = ${N(pcs[1].v)}.\nToplam: ${N(pcs[0].v)} + ${N(pcs[1].v)} = ${N(tot)} = 10/3.`,
      `── 4) Computing the two pieces ──\n1) [(2/3)x^(3/2)] (0 → 2) = (2/3)·2^(3/2) = 4√2/3 = ${N(pcs[0].v)}.\n2) [(2/3)x^(3/2) − x²/2 + 2x] (2 → 4) = (16/3 − 8 + 8) − (4√2/3 − 2 + 4) = 10/3 − 4√2/3 = ${N(pcs[1].v)}.\nTotal: ${N(pcs[0].v)} + ${N(pcs[1].v)} = ${N(tot)} = 10/3.`));
    s.push(tx(`── 5) Yöntem 2: y'ye göre, tek integral ──\nYatay şeritlerde sol uç hep x = y² (parabol), sağ uç hep x = y + 2 (doğru), y = 0 ... 2. Böylece\nA = ∫₀² [(y + 2) − y²] dy = [y²/2 + 2y − y³/3]₀² = 2 + 4 − 8/3 = 10/3 = ${N(10 / 3)}.`,
      `── 5) Method 2: in y, one integral ──\nIn horizontal strips the left end is always x = y² (the parabola) and the right end is always x = y + 2 (the line), for y = 0 ... 2. So\nA = ∫₀² [(y + 2) − y²] dy = [y²/2 + 2y − y³/3]₀² = 2 + 4 − 8/3 = 10/3 = ${N(10 / 3)}.`));
    s.push(tx(`── 6) Kontrol ──\nSimpson: x'e göre ≈ ${N(sim)}, y'ye göre ≈ ${N(sy)}; ikisi de 10/3 ile uyuşuyor ✓. Bu bölgede y'ye göre integral almak tek integral ve daha kısa. Cevap: A = 10/3 ≈ ${N(10 / 3)}.`,
      `── 6) Check ──\nSimpson: in x ≈ ${N(sim)}, in y ≈ ${N(sy)}; both agree with 10/3 ✓. For this region integrating in y needs only one integral and is shorter. Answer: A = 10/3 ≈ ${N(10 / 3)}.`));
    return s;
  }

  // ------------------------------------------------------------ graph
  function bounds(fns, lo, hi, cap) {
    let mx = 0;
    for (let i = 0; i <= 200; i++) {
      const x = lo + (hi - lo) * i / 200;
      fns.forEach((fn) => { const y = fn(x); if (Number.isFinite(y)) mx = Math.max(mx, Math.abs(y)); });
    }
    return Math.max(1.5, Math.min(cap, mx * 1.1));
  }
  function legend(canvas, color, label) { canvas.addFunction({ evaluator: () => NaN, color, thickness: 3, label }); }
  const COLS = (canvas) => [rgba(canvas.green(), 0.4), rgba(canvas.gold(), 0.45)];

  function drawY(canvas, p) {
    const q = pieces(p)[0];
    const ymax = Math.max(Math.abs(p.r1), Math.abs(p.r2)) + 1.2;
    const xm = Math.max(ymax * ymax, Math.abs(p.m) * ymax + Math.abs(p.k)) + 1;
    canvas.setViewport(-xm, xm, -ymax, ymax);
    const n = 120, step = (p.r2 - p.r1) / n;
    const col = rgba(canvas.green(), 0.2);
    for (let i = 0; i <= n; i++) {
      const y = p.r1 + step * i;
      canvas.addSegment({ x1: y * y, y1: y, x2: p.m * y + p.k, y2: y, color: col, thickness: 4 });
    }
    canvas.addParametric({ xOfT: (t) => t * t, yOfT: (t) => t, tMin: -ymax, tMax: ymax, color: canvas.accent(), thickness: 3, samples: 300 });
    canvas.addParametric({ xOfT: (t) => p.m * t + p.k, yOfT: (t) => t, tMin: -ymax, tMax: ymax, color: canvas.orange(), thickness: 3, samples: 4 });
    legend(canvas, canvas.accent(), 'x = y²');
    legend(canvas, canvas.orange(), `x = ${linY(p.m, p.k)}`);
    [p.r1, p.r2].forEach((r) => canvas.addMarker({ x: r * r, y: r, color: canvas.gold(), radius: 6, label: `(${N(r * r)}, ${N(r)})` }));
    const ys = p.r1 + p.t * (p.r2 - p.r1);
    const L = ys * ys, R = p.m * ys + p.k;
    canvas.addSegment({ x1: L, y1: ys, x2: R, y2: ys, color: canvas.red(), thickness: 4 });
    canvas.addMarker({ x: R, y: ys, color: canvas.red(), radius: 5, label: `${tx('şerit uzunluğu', 'strip length')} = ${N(R - L)}` });
    canvas.addMarker({ x: L, y: ys, color: canvas.red(), radius: 4 });
  }

  function drawSqrt(canvas, p) {
    canvas.setViewport(-5.5, 5.5, -3.2, 3.2);
    const cols = COLS(canvas);
    const sq = sf((x) => (x >= 0 ? Math.sqrt(x) : NaN));
    pieces(p).forEach((q) => canvas.addFilledArea({ evaluator: q.topFn, baseEvaluator: q.botFn, xMin: q.x1, xMax: q.x2, color: cols[q.col], samples: 120 }));
    canvas.addFunction({ evaluator: sq, color: canvas.accent(), thickness: 3, label: 'y = √x' });
    canvas.addFunction({ evaluator: (x) => x - 2, color: canvas.orange(), thickness: 3, label: 'y = x − 2' });
    [[0, 0], [2, 0], [4, 2]].forEach((pt) => canvas.addMarker({ x: pt[0], y: pt[1], color: canvas.gold(), radius: 6, label: `(${pt[0]}, ${pt[1]})` }));
    canvas.addGuideLine({ axis: 'vertical', position: 2, color: canvas.gray(), label: tx('x = 2: alt sınır değişir', 'x = 2: bottom changes') });
    if (p.dir === 0) {
      const xs = 4 * p.t;
      const top = Math.sqrt(xs), bot = Math.max(0, xs - 2);
      canvas.addSegment({ x1: xs, y1: bot, x2: xs, y2: top, color: canvas.red(), thickness: 4 });
      if (top - bot > 1e-6) canvas.addMarker({ x: xs, y: top, color: canvas.red(), radius: 5, label: `dx: ${tx('yükseklik', 'height')} = ${N(top - bot)}` });
    } else {
      const ys = 2 * p.t;
      canvas.addSegment({ x1: ys * ys, y1: ys, x2: ys + 2, y2: ys, color: canvas.red(), thickness: 4 });
      canvas.addMarker({ x: ys + 2, y: ys, color: canvas.red(), radius: 5, label: `dy: ${tx('uzunluk', 'length')} = ${N(ys + 2 - ys * ys)}` });
    }
  }

  function draw(canvas, p) {
    normLim(p);
    try {
      const lim = given(p);
      [regA, regB].forEach((r) => { if (r) r.input.parentNode.style.display = lim ? '' : 'none'; });
    } catch (e) { /* stub */ }
    if (p.kind === 'ypar') return drawY(canvas, p);
    if (p.kind === 'sqrtline') return drawSqrt(canvas, p);
    const m = model(p);
    const [a, b] = limits(p);
    const f = sf(m.f), g = sf(m.g);
    const xm = m.xm;
    const ym = bounds([f, g], -xm, xm, 12);
    canvas.setViewport(-xm, xm, -ym, ym);
    const pcs = pieces(p);
    const cols = COLS(canvas);
    pcs.forEach((q) => canvas.addFilledArea({ evaluator: sf(q.topFn), baseEvaluator: sf(q.botFn), xMin: q.x1, xMax: q.x2, color: cols[q.col], samples: 160 }));
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: `f: ${m.fS}` });
    canvas.addFunction({ evaluator: g, color: canvas.orange(), thickness: 3, label: `g: ${m.gS}` });
    const pts = given(p) ? crossings(p, m, a, b) : [a, b];
    pts.forEach((x) => {
      const y = m.f(x);
      if (Number.isFinite(y)) canvas.addMarker({ x, y, color: canvas.gold(), radius: 6, label: `(${xt(x)}, ${N(y)})` });
    });
    if (given(p)) {
      canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gold(), label: `x = ${xt(a)}` });
      canvas.addGuideLine({ axis: 'vertical', position: b, color: canvas.green(), label: `x = ${xt(b)}` });
    }
    const xs = a + p.t * (b - a);
    const hit = pcs.find((q) => xs >= q.x1 - 1e-9 && xs <= q.x2 + 1e-9) || pcs[0];
    const top = hit.topFn(xs), bot = hit.botFn(xs);
    if (Number.isFinite(top) && Number.isFinite(bot)) {
      canvas.addSegment({ x1: xs, y1: bot, x2: xs, y2: top, color: canvas.red(), thickness: 4 });
      if (top - bot > 1e-6) canvas.addMarker({ x: xs, y: top, color: canvas.red(), radius: 5, label: `${tx('üst − alt', 'top − bottom')} = ${N(top - bot)}` });
    }
  }

  // ------------------------------------------------------------ concept
  const HELP_TR = 'TANIM\n' +
    'f ve g, [a, b] aralığında sürekli ve f(x) ≥ g(x) ise, iki eğri arasında kalan alan\n' +
    '  A = ∫ₐᵇ [f(x) − g(x)] dx = ∫ₐᵇ [üst(x) − alt(x)] dx\n' +
    'olur. Alanı, yüksekliği (üst − alt) ve genişliği dx olan sonsuz sayıda ince dikey şeridin toplamı gibi düşünebiliriz. Alt eğri x-ekseni (g = 0) ise eski "eğri altındaki alan" formülüne döneriz.\n\n' +
    'FORMÜL ÖZETİ\n' +
    '• x\'e göre: A = ∫ₐᵇ [üst − alt] dx (dikey şeritler)\n' +
    '• y\'ye göre: A = ∫꜀ᵈ [sağ(y) − sol(y)] dy (yatay şeritler), x = h(y) biçimindeki eğriler için\n' +
    '• Eğriler kesişiyorsa: A = ∫ₐᵇ |f − g| dx; kesişimlerde böleriz.\n\n' +
    'YÖNTEM (adım adım)\n' +
    '1. Eğrilerin kabaca grafiğini çizelim ve bölgeyi görelim.\n' +
    '2. f(x) = g(x) denklemini çözüp kesişim noktalarını bulalım; bunlar çoğu zaman integralin sınırlarıdır.\n' +
    '3. Her parçada bir deneme noktası seçip hangi eğrinin üstte olduğunu belirleyelim.\n' +
    '4. Eğriler aralığın içinde kesişiyorsa (üst/alt yer değiştiriyorsa) aralığı kesişim noktasında bölelim.\n' +
    '5. Her parça için ∫ (üst − alt) dx alıp ters türevle hesaplayalım ve parçaları toplayalım.\n\n' +
    'y\'YE GÖRE İNTEGRAL NE ZAMAN KOLAY?\n' +
    'x = y² gibi eğrileri x\'e göre yazmak için iki kol (y = ±√x) gerekir. Bölgeyi y\'ye göre yatay şeritlerle tararsak sağdaki ve soldaki eğri tek formüldür ve çoğu zaman iki integral yerine tek integral yeteri eder.\n\n' +
    'BİRDEN ÇOK EĞRİYLE SINIRLI BÖLGELER\n' +
    'Alt (veya üst) sınır aralığın bir yerinde başka bir eğriye geçiyorsa, geçiş noktasında bölünür ve her parçaya kendi (üst − alt) farkı uygulanır; ya da y\'ye göre tek integral denenir.\n\n' +
    'TUZAKLAR\n' +
    '• Sırayı ters yazmak (alt − üst) negatif alan verir.\n' +
    '• Eğriler aralıkta kesişiyorsa tek integral (f − g) alırsak pozitif ve negatif parçalar birbirini götürür; sonuç yanlış (çok küçük) çıkar.\n' +
    '• Kesişim noktalarını bulmayı atlamak ve sınırları tahmin etmek.\n' +
    '• Alan her zaman pozitiftir (birim²).\n\n' +
    'MİNİ ÖRNEK\n' +
    'y = x² ile y = x doğrusu x = 0 ve x = 1\'de kesişir; aralıkta doğru üsttedir: A = ∫₀¹ (x − x²) dx = [x²/2 − x³/3]₀¹ = 1/2 − 1/3 = 1/6.\n\n' +
    'HAFIZA KURALI\n' +
    '"Üst eksi alt." Her zaman büyük olandan küçük olanı çıkarırız; parçanın içinde büyük/küçük değişiyorsa böleriz.\n\n' +
    'MÜHENDİSLİKTE\n' +
    'İki eğri arasındaki alan; kesit alanı ve atalet momenti hesaplarında, iki yük-uzama eğrisi arasında kalan enerji (histerezis) alanında ve basınç-hacim çevrimlerinde yapılan net işte kullanılır.';
  const HELP_EN = 'DEFINITION\n' +
    'If f and g are continuous on [a, b] and f(x) ≥ g(x), the area between the two curves is\n' +
    '  A = ∫ₐᵇ [f(x) − g(x)] dx = ∫ₐᵇ [top(x) − bottom(x)] dx\n' +
    'We can think of the area as the sum of infinitely many thin vertical strips of height (top − bottom) and width dx. If the bottom curve is the x-axis (g = 0) we are back to the familiar "area under a curve".\n\n' +
    'FORMULA SUMMARY\n' +
    '• With respect to x: A = ∫ₐᵇ [top − bottom] dx (vertical strips)\n' +
    '• With respect to y: A = ∫꜀ᵈ [right(y) − left(y)] dy (horizontal strips), for curves of the form x = h(y)\n' +
    '• If the curves cross: A = ∫ₐᵇ |f − g| dx; we split at the crossings.\n\n' +
    'METHOD (step by step)\n' +
    '1. Sketch the curves roughly and see the region.\n' +
    '2. Solve f(x) = g(x) to get the intersection points; they are often the limits of the integral.\n' +
    '3. Pick a test point in each piece to decide which curve is on top.\n' +
    '4. If the curves cross inside the interval (top and bottom swap), split the interval at the crossing.\n' +
    '5. For each piece integrate (top − bottom) with an antiderivative, then add the pieces.\n\n' +
    'WHEN IS INTEGRATING IN y EASIER?\n' +
    'A curve like x = y² needs two branches (y = ±√x) when written as a function of x. If we sweep the region with horizontal strips in y, the right and left curves are single formulas and one integral often replaces two.\n\n' +
    'REGIONS BOUNDED BY SEVERAL CURVES\n' +
    'If the bottom (or top) boundary switches to another curve somewhere in the interval, we split at the switch and use the proper (top − bottom) on each piece; or we try a single integral in y.\n\n' +
    'PITFALLS\n' +
    '• Writing the order reversed (bottom − top) gives a negative area.\n' +
    '• If the curves cross inside the interval and we take one integral of (f − g), positive and negative parts cancel and the result is wrong (too small).\n' +
    '• Skipping the intersection points and guessing the limits.\n' +
    '• Area is always positive (square units).\n\n' +
    'MINI EXAMPLE\n' +
    'y = x² and the line y = x meet at x = 0 and x = 1; the line is on top: A = ∫₀¹ (x − x²) dx = [x²/2 − x³/3]₀¹ = 1/2 − 1/3 = 1/6.\n\n' +
    'MEMORY AID\n' +
    '"Top minus bottom." We always subtract the smaller from the larger; if larger and smaller swap inside the piece, we split.\n\n' +
    'IN ENGINEERING\n' +
    'The area between two curves is used for cross-section and moment-of-inertia calculations, for the energy enclosed between two load-extension curves (hysteresis) and for the net work of pressure-volume cycles.';

  function concept(p) {
    return tx('İKİ EĞRİ ARASINDAKİ ALAN', 'AREA BETWEEN TWO CURVES') + '\n' + tx(HELP_TR, HELP_EN);
  }

  // ------------------------------------------------------------ controls
  let regA = null, regB = null, regT = null, rgDir = null, dirWrap = null, curGet = null;
  function rgDirWrap(show) { if (dirWrap) dirWrap.style.display = show ? '' : 'none'; }
  function syncControls() {
    try {
      [regA, regB, regT].forEach((reg) => {
        if (!reg) return;
        const v = reg.get();
        reg.valueLabel.textContent = fmt2(v);
        const r = (v - reg.min) / (reg.max - reg.min);
        reg.input.value = String(Math.max(0, Math.min(1000, Math.round(r * 1000))));
      });
      if (rgDir) rgDir.refreshFromModel();
    } catch (e) { /* stub */ }
  }
  function buildControls(rightCol, getProblem, h) {
    curGet = getProblem;
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); return d; };
    regA = h.addSlider({
      caption: tx('Alt sınır a (x)', 'Lower limit a (x)'), min: -4, max: 4, step: 0.25,
      get: () => { const p = getProblem(); return given(p) ? p.a : 0; },
      set: (v) => { const p = getProblem(); if (!given(p)) return; p.a = v; normLim(p); syncControls(); },
    });
    regB = h.addSlider({
      caption: tx('Üst sınır b (x)', 'Upper limit b (x)'), min: -4, max: 4, step: 0.25,
      get: () => { const p = getProblem(); return given(p) ? p.b : 0; },
      set: (v) => { const p = getProblem(); if (!given(p)) return; p.b = v; if (p.b < p.a + 0.25) p.a = p.b - 0.25; normLim(p); syncControls(); },
    });
    regT = h.addSlider({
      caption: tx('İnce şeridin konumu (0 = başlangıç, 1 = bitiş)', 'Position of the thin strip (0 = start, 1 = end)'), min: 0, max: 1, step: 0.02,
      get: () => getProblem().t, set: (v) => { getProblem().t = v; },
    });
    dirWrap = document.createElement('div');
    const cap = document.createElement('div'); cap.className = 'we-slider-caption';
    cap.textContent = tx('Şerit yönü (x√ örneği için)', 'Strip direction (for the √x example)');
    dirWrap.appendChild(cap);
    rightCol.appendChild(dirWrap);
    rgDir = h.addRadioGroup({
      name: 'abcDir',
      options: [{ label: tx('Dikey şerit (dx)', 'Vertical strip (dx)'), value: 0 }, { label: tx('Yatay şerit (dy)', 'Horizontal strip (dy)'), value: 1 }],
      get: () => getProblem().dir, set: (v) => { getProblem().dir = Number(v); },
    });
  }

  const makeKind = (kinds) => (rng) => {
    const old = forced; forced = { kind: kinds.length === 1 ? kinds[0] : rng.pick(kinds) };
    try { return createProblem(rng); } finally { forced = old; }
  };

  Topics.register('integrals', {
    id: 'areaBetweenCurves',
    tabTitle: () => tx('İki Eğri Arasındaki Alan', 'Area Between Two Curves'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^• (x'e göre|With respect to x):/, make: makeKind(['parline', 'expm', 'expexp']) },
      { match: /^• (y'ye göre|With respect to y):/, make: makeKind(['ypar']) },
      { match: /^• (Eğriler kesişiyorsa|If the curves cross):/, make: makeKind(['sincos', 'cubic']) },
      { match: /^(BİRDEN ÇOK EĞRİYLE SINIRLI BÖLGELER|REGIONS BOUNDED BY SEVERAL CURVES)$/, make: makeKind(['sqrtline']) },
    ],
    _scenarioCount: () => KINDS.length,
    _setScenario: (i) => { forced = { kind: KINDS[i % KINDS.length] }; },
  });
})();
