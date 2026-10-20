// The Substitution Method / u-substitution (chapter 'integrals'). Thomas 5.5-5.6, Stewart 5.5.
// problem = { type: 'indef' | 'def' | 'rewrite' | 'trap', id: pattern id, ...pattern params, a, b (definite), C, xsF (indef marker) }
// Patterns (PT): pow (ax+b)^n | xexp k x e^(x^2) | sincos sin^n cos / cos^n sin | tan tan(kx) / cot(kx) | lin 1/(ax+b) |
//                xk c x/(x^2+k) | lfn cos(kx) / sec^2(kx) / e^(kx) | lnx (ln x)^n / x | xroot x sqrt(x+c) (x = u - c).
// Graph (definite): f(x) with the area on [a,b] and the u-integrand h(u) over [g(a), g(b)] -> the two areas are equal.
(function () {
  const tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  const N = (v) => M(fmt2(v));
  const PI = Math.PI;
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');
  const isInt = (v) => Math.abs(v - Math.round(v)) < 1e-9;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const CAP = 60;
  let forced = null;

  function fr(n, d) { if (d < 0) { n = -n; d = -d; } const g = gcd(Math.abs(n), d) || 1; return { n: n / g, d: d / g }; }
  function frS(n, d) { const q = fr(n, d); return M(q.d === 1 ? String(q.n) : q.n + '/' + q.d); }
  // coefficient prefix: pfx(1,2) = "(1/2)·", pfx(-1,1) = "−", pfx(3,1) = "3·", pfx(1,1) = ""
  function pfx(n, d) {
    const q = fr(n, d);
    const s = q.n < 0 ? '−' : '';
    const a = Math.abs(q.n);
    if (q.d === 1) return s + (a === 1 ? '' : a + '·');
    return s + `(${a}/${q.d})·`;
  }
  // body / D with sign: quot('u⁴', -8) = "−u⁴/8"
  function quot(body, D) { const a = Math.abs(D); return (D < 0 ? '−' : '') + body + (a === 1 ? '' : '/' + a); }
  const kx = (k) => (k === 1 ? 'x' : k + 'x');
  const lin = (p, q) => { const t = p === 1 ? 'x' : p === -1 ? '−x' : p + 'x'; return M(q === 0 ? t : q > 0 ? t + ' + ' + q : t + ' − ' + (-q)); };
  function eT(v) {
    if (isInt(v) && v >= 0 && v < 10) { const r = Math.round(v); return r === 0 ? '1' : r === 1 ? 'e' : 'e' + sup(r); }
    return 'e^(' + N(v) + ')';
  }
  // nice text of a limit: integers, multiples of pi, e
  function xt(v) {
    if (isInt(v)) return N(Math.round(v));
    if (Math.abs(v - Math.E) < 1e-9) return 'e';
    const r = v / PI;
    for (const d of [1, 2, 3, 4, 6, 8, 12]) {
      if (Math.abs(r * d - Math.round(r * d)) < 1e-9) {
        const n = Math.round(r * d);
        const q = fr(n, d);
        return M((q.n === 1 ? '' : q.n === -1 ? '−' : q.n) + 'π' + (q.d === 1 ? '' : '/' + q.d));
      }
    }
    return N(v);
  }
  function simpson(f, a, b, n) {
    n = n || 600;
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
  const ratio = (n, d) => { const q = fr(n, d); return q.d === 1 ? String(q.n) : q.n + '/' + q.d; };

  // ---------------------------------------------------------------- patterns
  const PT = {
    pow: {
      f: (P, x) => Math.pow(P.p * x + P.q, P.n),
      u: (P, x) => P.p * x + P.q,
      h: (P, u) => Math.pow(u, P.n) / P.p,
      H: (P, u) => Math.pow(u, P.n + 1) / (P.p * (P.n + 1)),
      fS: (P) => `(${lin(P.p, P.q)})${sup(P.n)}`,
      uS: (P) => `u = ${lin(P.p, P.q)}`,
      duS: (P) => `du = ${M(P.p)} dx`,
      fixS: (P) => `dx = ${pfx(1, P.p)}du`,
      innerS: (P) => `${pfx(1, P.p)}∫ u${sup(P.n)} du`,
      HuS: (P) => quot(`u${sup(P.n + 1)}`, P.p * (P.n + 1)),
      backS: (P) => quot(`(${lin(P.p, P.q)})${sup(P.n + 1)}`, P.p * (P.n + 1)),
      hS: (P) => quot(`u${sup(P.n)}`, P.p),
      why: () => tx('Parantezin içi (ax + b) iç fonksiyondur ve türevi sabit olan a olduğu için dx kolayca u cinsinden yazılır.',
        'The bracket (ax + b) is the inside function and its derivative is the constant a, so dx is easy to write in terms of du.'),
      x0: () => 0.4, bLo: (P) => P.a + 0.25, bHi: (P) => (P.p === 2 ? P.a + 1.5 : P.a + 1),
      gen(R, mode) {
        if (mode === 'indef') return { p: R.pick([2, 3, 4, 5, -2, -3, -4]), q: R.nonZeroInt(-5, 6), n: R.pick([2, 3, 4, 5, 6]), a: 0, b: 1 };
        const p = R.pick([2, 3]), a = R.pick([-1, 0, 1]), ua = R.pick([-1, 0]);
        return { p, q: ua - p * a, n: R.pick([2, 3]), a, b: a + 1 };
      },
      exact: (P, ua, ub) => (isInt(ua) && isInt(ub) ? frS(Math.pow(Math.round(ub), P.n + 1) - Math.pow(Math.round(ua), P.n + 1), P.p * (P.n + 1)) : null),
    },
    xexp: {
      f: (P, x) => P.k * x * Math.exp(x * x),
      u: (P, x) => x * x,
      h: (P, u) => P.k / 2 * Math.exp(u),
      H: (P, u) => P.k / 2 * Math.exp(u),
      fS: (P) => `${P.k === 1 ? '' : P.k + '·'}x·e^(x²)`,
      uS: () => 'u = x²',
      duS: () => 'du = 2x dx',
      fixS: (P) => `${P.k === 1 ? '' : P.k + '·'}x dx = ${pfx(P.k, 2)}du`,
      innerS: (P) => `${pfx(P.k, 2)}∫ e^u du`,
      HuS: (P) => `${pfx(P.k, 2)}e^u`,
      backS: (P) => `${pfx(P.k, 2)}e^(x²)`,
      hS: (P) => `${pfx(P.k, 2)}e^u`,
      why: () => tx('Üssün içindeki x² iç fonksiyondur; türevi 2x, integralde x çarpanı olarak zaten görünüyor.',
        'The x² in the exponent is the inside function; its derivative 2x already appears in the integrand as the factor x.'),
      x0: () => 0.5, bLo: (P) => P.a + 0.25, bHi: () => 1.25,
      gen(R, mode) { return mode === 'indef' ? { k: R.pick([1, 2, 3, 4, 5, 6]), a: 0, b: 1 } : { k: R.pick([1, 2]), a: 0, b: 1 }; },
      exact: (P, ua, ub) => (isInt(ua) && isInt(ub) ? `${pfx(P.k, 2)}(${eT(Math.round(ub))} − ${eT(Math.round(ua))})` : null),
    },
    sincos: {
      f: (P, x) => (P.v === 0 ? Math.pow(Math.sin(x), P.n) * Math.cos(x) : Math.pow(Math.cos(x), P.n) * Math.sin(x)),
      u: (P, x) => (P.v === 0 ? Math.sin(x) : Math.cos(x)),
      h: (P, u) => (P.v === 0 ? 1 : -1) * Math.pow(u, P.n),
      H: (P, u) => (P.v === 0 ? 1 : -1) * Math.pow(u, P.n + 1) / (P.n + 1),
      fS: (P) => (P.v === 0 ? `sin${sup(P.n)}x·cos x` : `cos${sup(P.n)}x·sin x`),
      uS: (P) => (P.v === 0 ? 'u = sin x' : 'u = cos x'),
      duS: (P) => (P.v === 0 ? 'du = cos x dx' : 'du = −sin x dx'),
      fixS: (P) => (P.v === 0 ? 'cos x dx = du' : 'sin x dx = −du'),
      innerS: (P) => `${P.v === 0 ? '' : '−'}∫ u${sup(P.n)} du`,
      HuS: (P) => `${P.v === 0 ? '' : '−'}u${sup(P.n + 1)}/${P.n + 1}`,
      backS: (P) => (P.v === 0 ? `sin${sup(P.n + 1)}x/${P.n + 1}` : `−cos${sup(P.n + 1)}x/${P.n + 1}`),
      hS: (P) => `${P.v === 0 ? '' : '−'}u${sup(P.n)}`,
      why: (P) => (P.v === 0 ? tx('Kuvveti alınan sin x iç fonksiyondur; türevi cos x integralde çarpan olarak duruyor.', 'The sin x that is raised to a power is the inside function; its derivative cos x stands in the integrand as a factor.')
        : tx('Kuvveti alınan cos x iç fonksiyondur; türevi −sin x olduğundan sin x dx = −du olur.', 'The cos x that is raised to a power is the inside function; its derivative is −sin x, so sin x dx = −du.')),
      x0: () => 0.7, bLo: () => 0.25, bHi: () => PI / 2,
      gen(R, mode, v) {
        if (mode === 'indef') return { v: v === undefined ? R.nextInt(0, 2) : v, n: R.pick([2, 3, 4, 5]), a: 0, b: PI / 2 };
        return { v: 0, n: R.pick([2, 3, 4]), a: 0, b: R.pick([PI / 2, PI / 6]) };
      },
      exact: (P, ua, ub) => {
        if (P.v !== 0 || Math.abs(P.a) > 1e-9) return null;
        if (Math.abs(P.b - PI / 2) < 1e-9) return frS(1, P.n + 1);
        if (Math.abs(P.b - PI / 6) < 1e-9) return frS(1, Math.pow(2, P.n + 1) * (P.n + 1));
        return null;
      },
    },
    tan: {
      f: (P, x) => (P.v === 0 ? Math.tan(P.k * x) : 1 / Math.tan(P.k * x)),
      u: (P, x) => (P.v === 0 ? Math.cos(P.k * x) : Math.sin(P.k * x)),
      h: (P, u) => (P.v === 0 ? -1 : 1) / (P.k * u),
      H: (P, u) => (P.v === 0 ? -1 : 1) * Math.log(Math.abs(u)) / P.k,
      fS: (P) => (P.v === 0 ? `tan(${kx(P.k)})` : `cot(${kx(P.k)})`),
      uS: (P) => (P.v === 0 ? `u = cos(${kx(P.k)})` : `u = sin(${kx(P.k)})`),
      duS: (P) => (P.v === 0 ? `du = −${P.k === 1 ? '' : P.k + '·'}sin(${kx(P.k)}) dx` : `du = ${P.k === 1 ? '' : P.k + '·'}cos(${kx(P.k)}) dx`),
      fixS: (P) => (P.v === 0 ? `sin(${kx(P.k)}) dx = ${pfx(-1, P.k)}du` : `cos(${kx(P.k)}) dx = ${pfx(1, P.k)}du`),
      innerS: (P) => `${pfx(P.v === 0 ? -1 : 1, P.k)}∫ du/u`,
      HuS: (P) => `${pfx(P.v === 0 ? -1 : 1, P.k)}ln|u|`,
      backS: (P) => `${pfx(P.v === 0 ? -1 : 1, P.k)}ln|${P.v === 0 ? 'cos' : 'sin'}(${kx(P.k)})|`,
      hS: (P) => `${pfx(P.v === 0 ? -1 : 1, P.k)}1/u`,
      why: (P) => (P.v === 0 ? tx('Önce tan = sin/cos yazarız. Paydadaki cos(kx) iç fonksiyondur; türevi −k·sin(kx) payda bulunan sin(kx) ile uyuşur.', 'We first write tan = sin/cos. The cos(kx) in the denominator is the inside function; its derivative −k·sin(kx) matches the sin(kx) in the numerator.')
        : tx('Önce cot = cos/sin yazarız. Paydadaki sin(kx) iç fonksiyondur; türevi k·cos(kx) payda bulunan cos(kx) ile uyuşur.', 'We first write cot = cos/sin. The sin(kx) in the denominator is the inside function; its derivative k·cos(kx) matches the cos(kx) in the numerator.')),
      x0: (P) => (P.v === 0 ? 0.3 : 0.4), bLo: (P) => P.a + 0.25, bHi: (P) => P.a + 1,
      gen(R, mode, v) { return { v: v === undefined ? R.nextInt(0, 2) : v, k: R.pick([1, 2, 3]), a: 0, b: 0.5 }; },
      exact: () => null,
    },
    lin: {
      f: (P, x) => 1 / (P.p * x + P.q),
      u: (P, x) => P.p * x + P.q,
      h: (P, u) => 1 / (P.p * u),
      H: (P, u) => Math.log(Math.abs(u)) / P.p,
      fS: (P) => `1/(${lin(P.p, P.q)})`,
      uS: (P) => `u = ${lin(P.p, P.q)}`,
      duS: (P) => `du = ${M(P.p)} dx`,
      fixS: (P) => `dx = ${pfx(1, P.p)}du`,
      innerS: (P) => `${pfx(1, P.p)}∫ du/u`,
      HuS: (P) => `${pfx(1, P.p)}ln|u|`,
      backS: (P) => `${pfx(1, P.p)}ln|${lin(P.p, P.q)}|`,
      hS: (P) => `${pfx(1, P.p)}1/u`,
      why: () => tx('Paydaki ax + b iç fonksiyondur; türevi a sabit olduğu için 1/(ax + b) bir ln integraline dönüşür.', 'The denominator ax + b is the inside function; its derivative is the constant a, so 1/(ax + b) becomes a ln integral.'),
      x0: (P) => -P.q / P.p + 1.1, bLo: (P) => P.a + 0.25, bHi: (P) => P.a + 2,
      gen(R, mode) {
        if (mode === 'indef') return { p: R.pick([2, 3, 4, 5, 6, -2, -3]), q: R.nonZeroInt(-5, 6), a: 0, b: 1 };
        return { p: R.pick([2, 3]), q: R.pick([1, 2]), a: 0, b: R.pick([1, 2]) };
      },
      exact: (P, ua, ub) => (isInt(ua) && isInt(ub) && ua > 0 ? `${pfx(1, P.p)}ln(${ratio(Math.round(ub), Math.round(ua))})` : null),
    },
    xk: {
      f: (P, x) => P.c * x / (x * x + P.k),
      u: (P, x) => x * x + P.k,
      h: (P, u) => P.c / 2 / u,
      H: (P, u) => P.c / 2 * Math.log(u),
      fS: (P) => `${P.c === 1 ? '' : P.c + '·'}x/(x² + ${P.k})`,
      uS: (P) => `u = x² + ${P.k}`,
      duS: () => 'du = 2x dx',
      fixS: (P) => `${P.c === 1 ? '' : P.c + '·'}x dx = ${pfx(P.c, 2)}du`,
      innerS: (P) => `${pfx(P.c, 2)}∫ du/u`,
      HuS: (P) => `${pfx(P.c, 2)}ln u`,
      backS: (P) => `${pfx(P.c, 2)}ln(x² + ${P.k})`,
      hS: (P) => `${pfx(P.c, 2)}1/u`,
      why: () => tx('Paydaki x² + k iç fonksiyondur; türevi 2x, payda x çarpanı olarak duruyor.', 'The denominator x² + k is the inside function; its derivative 2x stands in the numerator as the factor x.'),
      x0: () => 1.2, bLo: (P) => P.a + 0.25, bHi: () => 3,
      gen(R, mode) {
        if (mode === 'indef') return { c: R.pick([1, 2, 3, 4, 6]), k: R.pick([1, 2, 3, 4, 5, 9]), a: 0, b: 1 };
        if (mode === 'trap') return { c: R.pick([2, 4]), k: R.pick([1, 2, 3]), a: 1, b: R.pick([2, 3]) };
        return { c: R.pick([1, 2, 4]), k: R.pick([1, 2, 3, 4]), a: 0, b: R.pick([1, 2]) };
      },
      exact: (P, ua, ub) => (isInt(ua) && isInt(ub) ? `${pfx(P.c, 2)}ln(${ratio(Math.round(ub), Math.round(ua))})` : null),
    },
    lfn: {
      f: (P, x) => (P.v === 0 ? Math.cos(P.k * x) : P.v === 1 ? 1 / (Math.cos(P.k * x) * Math.cos(P.k * x)) : Math.exp(P.k * x)),
      u: (P, x) => P.k * x,
      h: (P, u) => (P.v === 0 ? Math.cos(u) : P.v === 1 ? 1 / (Math.cos(u) * Math.cos(u)) : Math.exp(u)) / P.k,
      H: (P, u) => (P.v === 0 ? Math.sin(u) : P.v === 1 ? Math.tan(u) : Math.exp(u)) / P.k,
      fS: (P) => (P.v === 0 ? `cos(${kx(P.k)})` : P.v === 1 ? `sec²(${kx(P.k)})` : `e^(${kx(P.k)})`),
      uS: (P) => `u = ${kx(P.k)}`,
      duS: (P) => `du = ${P.k} dx`,
      fixS: (P) => `dx = ${pfx(1, P.k)}du`,
      innerS: (P) => `${pfx(1, P.k)}∫ ${P.v === 0 ? 'cos u' : P.v === 1 ? 'sec² u' : 'e^u'} du`,
      HuS: (P) => `${pfx(1, P.k)}${P.v === 0 ? 'sin u' : P.v === 1 ? 'tan u' : 'e^u'}`,
      backS: (P) => `${pfx(1, P.k)}${P.v === 0 ? `sin(${kx(P.k)})` : P.v === 1 ? `tan(${kx(P.k)})` : `e^(${kx(P.k)})`}`,
      hS: (P) => `${pfx(1, P.k)}${P.v === 0 ? 'cos u' : P.v === 1 ? 'sec² u' : 'e^u'}`,
      why: () => tx('İç fonksiyon doğrusal olan kx\'tir; türevi sabit k olduğu için dx = du/k yazılır ve bilinen tablo integrali kullanılır.', 'The inside function is the linear kx; its derivative is the constant k, so we write dx = du/k and use a known table integral.'),
      x0: () => 0.3,
      bLo: (P) => P.a + 0.2,
      bHi: (P) => (P.v === 0 ? PI / (2 * P.k) + 0.3 : P.v === 1 ? PI / (3 * P.k) : 1.25),
      gen(R, mode, v) {
        const vv = v === undefined ? R.nextInt(0, 3) : v;
        if (mode === 'indef') return { v: vv, k: R.pick(vv === 2 ? [2, 3] : [2, 3, 4]), a: 0, b: 0.5 };
        const k = vv === 2 ? 2 : R.pick(vv === 1 ? [2, 3] : [2, 3, 4]);
        const b = vv === 0 ? PI / (2 * k) : vv === 1 ? PI / (4 * k) : 1;
        return { v: vv, k, a: 0, b };
      },
      exact: (P) => {
        if (Math.abs(P.a) > 1e-9) return null;
        if (P.v === 0 && Math.abs(P.b - PI / (2 * P.k)) < 1e-9) return frS(1, P.k);
        if (P.v === 1 && Math.abs(P.b - PI / (4 * P.k)) < 1e-9) return frS(1, P.k);
        if (P.v === 2 && isInt(P.b)) return `${pfx(1, P.k)}(${eT(P.k * Math.round(P.b))} − 1)`;
        return null;
      },
    },
    lnx: {
      f: (P, x) => Math.pow(Math.log(x), P.n) / x,
      u: (P, x) => Math.log(x),
      h: (P, u) => Math.pow(u, P.n),
      H: (P, u) => Math.pow(u, P.n + 1) / (P.n + 1),
      fS: (P) => (P.n === 1 ? 'ln x / x' : `(ln x)${sup(P.n)}/x`),
      uS: () => 'u = ln x',
      duS: () => 'du = dx/x',
      fixS: () => '(1/x) dx = du',
      innerS: (P) => `∫ ${P.n === 1 ? 'u' : 'u' + sup(P.n)} du`,
      HuS: (P) => `u${sup(P.n + 1)}/${P.n + 1}`,
      backS: (P) => `(ln x)${sup(P.n + 1)}/${P.n + 1}`,
      hS: (P) => (P.n === 1 ? 'u' : 'u' + sup(P.n)),
      why: () => tx('ln x iç fonksiyondur; türevi 1/x integralde çarpan olarak duruyor.', 'ln x is the inside function; its derivative 1/x stands in the integrand as a factor.'),
      x0: () => 1.7, bLo: (P) => P.a + 0.25, bHi: () => 4,
      gen(R, mode) { return { n: R.pick([1, 2, 3]), a: 1, b: mode === 'indef' ? 2 : Math.E }; },
      exact: (P) => (Math.abs(P.a - 1) < 1e-9 && Math.abs(P.b - Math.E) < 1e-9 ? frS(1, P.n + 1) : null),
    },
    xroot: {
      f: (P, x) => x * Math.sqrt(x + P.c),
      u: (P, x) => x + P.c,
      h: (P, u) => (u - P.c) * Math.sqrt(u),
      H: (P, u) => 0.4 * Math.pow(u, 2.5) - 2 * P.c / 3 * Math.pow(u, 1.5),
      fS: (P) => `x·√(x + ${P.c})`,
      uS: (P) => `u = x + ${P.c}`,
      duS: () => 'du = dx',
      fixS: (P) => `x = u − ${P.c}`,
      innerS: (P) => `∫ (u − ${P.c})·√u du = ∫ (u^(3/2) − ${P.c}·u^(1/2)) du`,
      HuS: (P) => `(2/5)·u^(5/2) − ${pfx(2 * P.c, 3)}u^(3/2)`,
      backS: (P) => `(2/5)·(x + ${P.c})^(5/2) − ${pfx(2 * P.c, 3)}(x + ${P.c})^(3/2)`,
      hS: (P) => `u^(3/2) − ${P.c}·u^(1/2)`,
      why: () => tx('Kökün içindeki x + c iç fonksiyondur. Fakat çarpan olarak tek başına bir x var ve bu türev (du = dx) değildir; bu yüzden x\'i de u cinsinden yazarız: x = u − c.', 'The x + c under the root is the inside function. But there is a lone factor x which is not the derivative (du = dx), so we also rewrite x in terms of u: x = u − c.'),
      x0: () => 1, bLo: (P) => P.a + 0.25, bHi: (P) => 5 - P.c,
      gen(R, mode) {
        const c = R.pick([1, 2, 3, 4]);
        if (mode === 'indef') return { c, a: 0, b: 1 };
        const s1 = R.pick([0, 1]);
        return { c, a: s1 * s1 - c, b: 4 - c };
      },
      exact: (P, ua, ub) => {
        if (!isInt(ua) || !isInt(ub)) return null;
        const s1 = Math.sqrt(ua), s2 = Math.sqrt(ub);
        if (!isInt(s1) || !isInt(s2)) return null;
        return frS(6 * (Math.pow(s2, 5) - Math.pow(s1, 5)) - 10 * P.c * (Math.pow(s2, 3) - Math.pow(s1, 3)), 15);
      },
    },
  };
  const DEF_IDS = ['pow', 'xexp', 'sincos', 'lin', 'xk', 'lfn', 'lnx', 'xroot'];
  const INDEF_IDS = ['pow', 'xexp', 'sincos', 'tan', 'lin', 'xk', 'lfn', 'lnx'];
  const TRAP_IDS = ['pow', 'sincos', 'xk'];
  const ENTRIES = [
    { id: 'pow', v: 0, tr: '(ax + b)ⁿ', en: '(ax + b)ⁿ' },
    { id: 'xexp', v: 0, tr: 'k·x·e^(x²)', en: 'k·x·e^(x²)' },
    { id: 'sincos', v: 0, tr: 'sinⁿx·cos x', en: 'sinⁿx·cos x' },
    { id: 'sincos', v: 1, tr: 'cosⁿx·sin x', en: 'cosⁿx·sin x' },
    { id: 'tan', v: 0, tr: 'tan(kx)', en: 'tan(kx)' },
    { id: 'tan', v: 1, tr: 'cot(kx)', en: 'cot(kx)' },
    { id: 'lin', v: 0, tr: '1/(ax + b)', en: '1/(ax + b)' },
    { id: 'xk', v: 0, tr: 'c·x/(x² + k)', en: 'c·x/(x² + k)' },
    { id: 'lfn', v: 0, tr: 'cos(kx)', en: 'cos(kx)' },
    { id: 'lfn', v: 1, tr: 'sec²(kx)', en: 'sec²(kx)' },
    { id: 'lfn', v: 2, tr: 'e^(kx)', en: 'e^(kx)' },
    { id: 'lnx', v: 0, tr: '(ln x)ⁿ/x', en: '(ln x)ⁿ/x' },
    { id: 'xroot', v: 0, tr: 'x·√(x + c)', en: 'x·√(x + c)' },
  ];
  const TYPES = ['indef', 'def', 'rewrite', 'trap'];

  const hasDef = (p) => p.type === 'def' || p.type === 'trap';
  const uOf = (p, x) => PT[p.id].u(p, x);
  function correctVal(p) { const pt = PT[p.id]; return pt.H(p, uOf(p, p.b)) - pt.H(p, uOf(p, p.a)); }
  function wrongVal(p) { const pt = PT[p.id]; return pt.H(p, p.b) - pt.H(p, p.a); }
  function allowed(type, id, v) {
    if (type === 'indef') return INDEF_IDS.indexOf(id) >= 0;
    if (type === 'def') return DEF_IDS.indexOf(id) >= 0 && !(id === 'sincos' && v === 1);
    if (type === 'rewrite') return id === 'xroot';
    return TRAP_IDS.indexOf(id) >= 0 && !(id === 'sincos' && v === 1);
  }
  function build(rng, type, id, v) {
    const pt = PT[id];
    const mode = type === 'indef' || type === 'rewrite' ? 'indef' : type;
    let q = null;
    for (let t = 0; t < 40; t++) {
      q = Object.assign({ type, id }, pt.gen(rng, mode, v), { C: 0, xsF: 0.62 });
      if (type !== 'trap' || Math.abs(wrongVal(q) - correctVal(q)) > 0.05) break;
    }
    return q;
  }
  function pickType(rng) { return TYPES[rng.nextInt(0, TYPES.length)]; }
  function createProblem(rng) {
    let p;
    if (forced) p = build(rng, forced.type, forced.id, forced.v);
    else {
      const type = pickType(rng);
      const ids = type === 'indef' ? INDEF_IDS : type === 'def' ? DEF_IDS : type === 'rewrite' ? ['xroot'] : TRAP_IDS;
      p = build(rng, type, rng.pick(ids));
    }
    syncControls();
    return p;
  }
  function clampB(p) {
    const pt = PT[p.id];
    if (!hasDef(p)) return;
    const lo = pt.bLo(p), hi = pt.bHi(p);
    p.b = Math.max(lo, Math.min(hi, p.b));
  }

  // ---------------------------------------------------------------- texts
  function limTxt(p) { return `[${xt(p.a)}, ${xt(p.b)}]`; }
  function problemStatement(p) {
    const pt = PT[p.id];
    if (p.type === 'indef') {
      return tx(`∫ ${pt.fS(p)} dx integralini yerine koyma yöntemiyle bulalım. Uygun u seçimi ne olur ve sonuç nedir?`,
        `Let's find ∫ ${pt.fS(p)} dx using the substitution method. Which u is a good choice, and what is the result?`);
    }
    if (p.type === 'rewrite') {
      return tx(`∫ ${pt.fS(p)} dx integralini hesaplayalım. Burada x'in de u cinsinden yazılması gerekecek. Sonuç kaç olur?`,
        `Let's compute ∫ ${pt.fS(p)} dx. Here x also has to be rewritten in terms of u. What is the result?`);
    }
    if (p.type === 'def') {
      return tx(`${limTxt(p)} aralığında ∫ ${pt.fS(p)} dx belirli integralinin değerini yerine koyma ile bulalım; sınırları u'ya çevirmeyi unutmayalım. Değer kaç olur?`,
        `Let's find the definite integral ∫ ${pt.fS(p)} dx over ${limTxt(p)} using substitution, remembering to change the limits to u. What is its value?`);
    }
    return tx(`${limTxt(p)} aralığında ∫ ${pt.fS(p)} dx integralini u dönüşümüyle hesaplarken sınırları DEĞİŞTİRMESEK ne olurdu? Doğru değeri ve sınırlar unutulduğunda çıkan değeri bulup karşılaştıralım.`,
      `What would happen if we did NOT change the limits when computing ∫ ${pt.fS(p)} dx over ${limTxt(p)} by substitution? Let's find the correct value and the value we get when the limits are forgotten, and compare them.`);
  }

  function solveSteps(p) {
    clampB(p);
    const pt = PT[p.id];
    const s = [];
    const fS = pt.fS(p);
    const lead = (t) => t;
    // 1) choice of u
    const rewriteNote = p.type === 'rewrite' || p.id === 'xroot'
      ? tx(' Ayrıca x\'i u cinsinden yazmamız gerekecek.', ' We will also have to write x in terms of u.') : '';
    s.push(tx(`── 1) İç fonksiyonu seçelim ──\nİntegral: ∫ ${fS} dx${hasDef(p) ? ` (x: ${xt(p.a)} → ${xt(p.b)})` : ''}. ${pt.why(p)}${rewriteNote} Seçimimiz: ${pt.uS(p)}.`,
      `── 1) Choosing the inside function ──\nIntegral: ∫ ${fS} dx${hasDef(p) ? ` (x: ${xt(p.a)} → ${xt(p.b)})` : ''}. ${pt.why(p)}${rewriteNote} Our choice: ${pt.uS(p)}.`));
    s.push(tx(`── 2) du'yu bulalım ──\n${pt.uS(p)} için türev alırsak ${pt.duS(p)} olur. İntegraldeki çarpanı du cinsinden yazarsak: ${pt.fixS(p)}.${p.id === 'xroot' ? ' (x = u − c, çünkü u = x + c.)' : ' Sabit çarpan eksik kalırsa böyle düzeltilir ve integralin önüne çıkar.'}`,
      `── 2) Finding du ──\nDifferentiating ${pt.uS(p)} gives ${pt.duS(p)}. Writing the factor of the integrand in terms of du: ${pt.fixS(p)}.${p.id === 'xroot' ? ' (x = u − c, because u = x + c.)' : ' If a constant factor is missing, this is how we fix it, and it moves in front of the integral.'}`));
    s.push(tx(`── 3) Her şeyi u cinsinden yazalım ──\n∫ ${fS} dx = ${pt.innerS(p)}.`,
      `── 3) Rewriting everything in terms of u ──\n∫ ${fS} dx = ${pt.innerS(p)}.`));
    if (hasDef(p)) {
      const ua = uOf(p, p.a), ub = uOf(p, p.b);
      const ex = pt.exact(p, ua, ub);
      const val = correctVal(p);
      s.push(tx(`── 4) Sınırları da değiştirelim ──\nu = g(x) olduğundan: x = ${xt(p.a)} iken u = ${N(ua)}; x = ${xt(p.b)} iken u = ${N(ub)}. Yeni integral ∫ ${pt.hS(p)} du, sınırlar u = ${N(ua)} ... ${N(ub)}.`,
        `── 4) Changing the limits too ──\nSince u = g(x): when x = ${xt(p.a)}, u = ${N(ua)}; when x = ${xt(p.b)}, u = ${N(ub)}. The new integral is ∫ ${pt.hS(p)} du with limits u = ${N(ua)} ... ${N(ub)}.`));
      s.push(tx(`── 5) u'da integral alıp sınırları yerine koyalım ──\n[${pt.HuS(p)}] (u = ${N(ua)} ... ${N(ub)}) = H(${N(ub)}) − H(${N(ua)}) = ${N(pt.H(p, ub))} − (${N(pt.H(p, ua))}) = ${N(val)}${ex ? `\nTam değer: ${ex}` : ''}.`,
        `── 5) Integrating in u and plugging in the limits ──\n[${pt.HuS(p)}] (u = ${N(ua)} ... ${N(ub)}) = H(${N(ub)}) − H(${N(ua)}) = ${N(pt.H(p, ub))} − (${N(pt.H(p, ua))}) = ${N(val)}${ex ? `\nExact value: ${ex}` : ''}.`));
      s.push(tx('── 6) x\'e geri dönmüyoruz ──\nSınırlar zaten u cinsinden olduğu için sonucu x\'e çevirmemize gerek yok. Geri dönseydik de aynı değer çıkardı: F(x) = ' + pt.backS(p) + ' için F(b) − F(a).',
        '── 6) No need to go back to x ──\nThe limits are already in terms of u, so we do not convert the result back to x. Going back would give the same value: F(b) − F(a) for F(x) = ' + pt.backS(p) + '.'));
      const sim = simpson((x) => pt.f(p, x), p.a, p.b);
      if (p.type === 'trap') {
        const wr = wrongVal(p);
        s.push(tx(`── 7) Tuzak: sınırları değiştirmeseydik ──\nx sınırlarını (${xt(p.a)} ve ${xt(p.b)}) doğrudan u'lu ifadeye koysaydık H(${N(p.b)}) − H(${N(p.a)}) = ${N(pt.H(p, p.b))} − (${N(pt.H(p, p.a))}) = ${N(wr)} çıkardı. Doğru değer ${N(val)}. Fark: ${N(Math.abs(wr - val))}. Neden? ∫ₐᵇ h(u) du, u = ${N(p.a)} ... ${N(p.b)} arasındaki alandır; oysa asıl alan u = ${N(ua)} ... ${N(ub)} arasındadır. Grafikte kırmızı bölge yanlış alanı, turuncu bölge doğru u-alanını gösterir.`,
          `── 7) The trap: if we had not changed the limits ──\nPlugging the x limits (${xt(p.a)} and ${xt(p.b)}) straight into the u expression would give H(${N(p.b)}) − H(${N(p.a)}) = ${N(pt.H(p, p.b))} − (${N(pt.H(p, p.a))}) = ${N(wr)}. The correct value is ${N(val)}. Difference: ${N(Math.abs(wr - val))}. Why? ∫ₐᵇ h(u) du is the area for u = ${N(p.a)} ... ${N(p.b)}, but the real area belongs to u = ${N(ua)} ... ${N(ub)}. In the graph the red region shows the wrong area and the orange region the correct u-area.`));
      }
      s.push(tx(`── ${p.type === 'trap' ? 8 : 7}) Kontrol ──\nx'te Simpson kuralı (600 dilim) ile ∫ₐᵇ f dx ≈ ${N(sim)}; u'daki sonuç ${N(val)} ile uyuşuyor ✓. Grafikte yeşil (x'teki) ve turuncu (u'daki) alanlar eşittir. Cevap: ${N(val)}${ex ? ' = ' + ex : ''}.`,
        `── ${p.type === 'trap' ? 8 : 7}) Check ──\nSimpson's rule in x (600 slices) gives ∫ₐᵇ f dx ≈ ${N(sim)}, which agrees with ${N(val)} found in u ✓. In the graph the green (x) and orange (u) areas are equal. Answer: ${N(val)}${ex ? ' = ' + ex : ''}.`));
    } else {
      s.push(tx(`── 4) u'da integral alalım ──\n${pt.innerS(p)} = ${pt.HuS(p)} + C.`,
        `── 4) Integrating in u ──\n${pt.innerS(p)} = ${pt.HuS(p)} + C.`));
      s.push(tx(`── 5) x'e geri dönelim (geri yerine koyma) ──\n${pt.uS(p)} idi; u yerine bunu yazarız:\n∫ ${fS} dx = ${pt.backS(p)} + C.`,
        `── 5) Back-substitution ──\nWe had ${pt.uS(p)}; replacing u with it:\n∫ ${fS} dx = ${pt.backS(p)} + C.`));
      const x0 = pt.x0(p), hh = 1e-5;
      const F = (x) => pt.H(p, uOf(p, x));
      const num = (F(x0 + hh) - F(x0 - hh)) / (2 * hh);
      s.push(tx(`── 6) Kontrol: türev alalım ──\nSonucun türevi (zincir kuralıyla) integrandı vermeli. x₀ = ${N(x0)} noktasında F'(x₀) ≈ ${N(num)} ve f(x₀) = ${N(pt.f(p, x0))} ✓. Cevap: ${pt.backS(p)} + C.`,
        `── 6) Check: differentiate ──\nThe derivative of the result (by the chain rule) must give the integrand. At x₀ = ${N(x0)}: F'(x₀) ≈ ${N(num)} and f(x₀) = ${N(pt.f(p, x0))} ✓. Answer: ${pt.backS(p)} + C.`));
    }
    return s;
  }

  // ---------------------------------------------------------------- graph
  function bounds(fns, lo, hi, cap) {
    let m = 0;
    for (let i = 0; i <= 160; i++) {
      const x = lo + (hi - lo) * i / 160;
      fns.forEach((fn) => { const y = fn(x); if (Number.isFinite(y)) m = Math.max(m, Math.abs(y)); });
    }
    return Math.max(1.5, Math.min(cap, m * 1.15));
  }

  function draw(canvas, p) {
    clampB(p);
    const pt = PT[p.id];
    const f = sf((x) => pt.f(p, x));
    const h = (u) => pt.h(p, u);
    const showB = hasDef(p);
    try { if (regB) regB.input.parentNode.style.display = showB ? '' : 'none'; if (regC) regC.input.parentNode.style.display = showB ? 'none' : ''; if (regX) regX.input.parentNode.style.display = showB ? 'none' : ''; } catch (e) { /* stub */ }
    if (!showB) {
      const lo = p.id === 'lnx' ? 0.05 : p.id === 'xroot' ? -p.c : -4;
      const hi = p.id === 'lnx' ? 6 : p.id === 'xroot' ? 6 : 4;
      const F = sf((x) => pt.H(p, uOf(p, x)) + p.C);
      const xm = Math.max(Math.abs(lo), Math.abs(hi)) + 0.5;
      const ym = bounds([f, sf((x) => pt.H(p, uOf(p, x)) + 3), sf((x) => pt.H(p, uOf(p, x)) - 3)], lo, hi, 9);
      canvas.setViewport(-xm, xm, -ym, ym);
      canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x) = ' + pt.fS(p) });
      canvas.addFunction({ evaluator: F, color: canvas.purple(), thickness: 2.5, label: `F(x) = ${pt.backS(p)} + C,  C = ${N(p.C)}` });
      const xs = lo + p.xsF * (hi - lo);
      const yv = F(xs), sl = f(xs);
      if (Number.isFinite(yv) && Number.isFinite(sl)) {
        const d = 0.6;
        canvas.addSegment({ x1: xs - d, y1: yv - d * sl, x2: xs + d, y2: yv + d * sl, color: canvas.orange(), thickness: 2.5, dashed: true });
        canvas.addMarker({ x: xs, y: yv, color: canvas.orange(), radius: 6, label: `${tx('eğim', 'slope')} = f(${N(xs)}) = ${N(sl)}` });
        canvas.addMarker({ x: xs, y: sl, color: canvas.accent(), shape: 'diamond', radius: 5 });
      }
      return;
    }
    const ua = uOf(p, p.a), ub = uOf(p, p.b);
    const bHi = pt.bHi(p), ubHi = uOf(p, bHi);
    const dlo = p.id === 'lnx' ? 0.1 : p.id === 'xroot' ? -p.c : p.a - 0.75;
    const dhi = bHi + 0.25;
    const hAll = sf(h);
    const hRes = sf((u) => (u >= ua - 1e-9 && u <= ub + 1e-9 ? h(u) : NaN));
    const xm = Math.max(Math.abs(dlo), Math.abs(dhi), Math.abs(ua), Math.abs(ubHi), Math.abs(p.a), Math.abs(p.b)) + 0.5;
    const ym = Math.max(bounds([f], dlo, dhi, 9), bounds([hAll], Math.min(ua, p.a), Math.max(ubHi, bHi), 9));
    canvas.setViewport(-Math.max(xm, 2.5), Math.max(xm, 2.5), -ym, ym);
    canvas.addFilledArea({ evaluator: f, xMin: p.a, xMax: p.b, color: rgba(canvas.green(), 0.4), samples: 160 });
    if (p.type === 'trap') {
      canvas.addFilledArea({ evaluator: hAll, xMin: Math.min(p.a, p.b), xMax: Math.max(p.a, p.b), color: rgba(canvas.red(), 0.3), samples: 160 });
      canvas.addFunction({ evaluator: hAll, color: canvas.orange(), thickness: 2, label: `h(u) = ${pt.hS(p)}  (${tx('u-integrand', 'u-integrand')})` });
    } else {
      canvas.addFunction({ evaluator: hRes, color: canvas.orange(), thickness: 3, label: `h(u) = ${pt.hS(p)}  (${tx('u-integrand', 'u-integrand')})` });
    }
    canvas.addFilledArea({ evaluator: hAll, xMin: Math.min(ua, ub), xMax: Math.max(ua, ub), color: rgba(canvas.orange(), 0.32), samples: 160 });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x) = ' + pt.fS(p) });
    canvas.addGuideLine({ axis: 'vertical', position: p.a, color: canvas.gold(), label: `x = ${xt(p.a)}` });
    canvas.addGuideLine({ axis: 'vertical', position: p.b, color: canvas.green(), label: `x = ${xt(p.b)}` });
    const fb = f(p.b), hb = hAll(ub);
    if (Number.isFinite(fb)) canvas.addMarker({ x: p.b, y: fb, color: canvas.green(), radius: 6, label: `x = ${xt(p.b)}` });
    if (Number.isFinite(hb)) canvas.addMarker({ x: ub, y: hb, color: canvas.orange(), shape: 'diamond', radius: 7, label: `u = ${xt(ub)}` });
    const ha = hAll(ua);
    if (Number.isFinite(ha)) canvas.addMarker({ x: ua, y: ha, color: canvas.gold(), shape: 'diamond', radius: 6, label: `u = ${xt(ua)}` });
    canvas.addMarker({ x: ua, y: 0, color: canvas.gold(), hollow: true, radius: 4 });
    canvas.addMarker({ x: ub, y: 0, color: canvas.orange(), hollow: true, radius: 4 });
  }

  // ---------------------------------------------------------------- concept
  const HELP_TR = 'YERİNE KOYMA (u-DÖNÜŞÜMÜ) NEDİR?\n' +
    'Yerine koyma, zincir kuralının integraldeki karşılığıdır. İntegrand f(g(x))·g\'(x) biçimindeyse, yani bir fonksiyonun içindeki fonksiyon (g) ve onun türevi (g\') birlikte duruyorsa, u = g(x) dersek du = g\'(x) dx olur ve\n' +
    '  ∫ f(g(x))·g\'(x) dx = ∫ f(u) du\n' +
    'olur. Karmaşık görünen integral, tablodaki basit bir integrale dönüşür.\n\n' +
    'NE ANLAMA GELİR?\n' +
    'Zincir kuralı d/dx[F(g(x))] = F\'(g(x))·g\'(x) idi. Yerine koyma bunu tersine çevirir: iç fonksiyonu tek bir harfle (u) gösterip dış fonksiyonu integre ederiz.\n\n' +
    'YÖNTEM (adım adım)\n' +
    '1. İç fonksiyonu seçelim: u = g(x). İyi seçim, türevi de integralde görünen ifadedir (parantezin içi, kökün içi, üs, payda, ln x …).\n' +
    '2. du = g\'(x) dx yazalım ve integraldeki dx\'li çarpanı du cinsinden ifade edelim.\n' +
    '3. Sabit çarpan eksikse düzeltelim: du = 2x dx ise x dx = du/2 olur; sabit integralin önüne çıkar.\n' +
    '4. Her şeyi u cinsinden yazıp ∫ … du integralini alalım.\n' +
    '5. Belirsiz integralde u yerine g(x) yazarak x\'e dönelim ve + C ekleyelim; sonucu türevleyip kontrol edelim.\n\n' +
    'BELİRLİ İNTEGRALDE SINIRLARI DEĞİŞTİRELİM\n' +
    '  ∫ₐᵇ f(g(x))·g\'(x) dx = ∫ f(u) du  (u = g(a) ... g(b))\n' +
    'x = a iken u = g(a), x = b iken u = g(b) olur. Sınırları u cinsinden yazarsak x\'e geri dönmemize gerek kalmaz. Sınırları değiştirmeyi unutursak başka bir sayı buluruz (aşağıdaki "tuzak" örneğinde görüldüğü gibi); grafikte x\'teki ve u\'daki alanlar ancak yeni sınırlarla eşit olur.\n\n' +
    'SIK KALIPLAR\n' +
    '• (ax + b)ⁿ → u = ax + b, dx = du/a\n' +
    '• x·e^(x²) → u = x², x dx = du/2\n' +
    '• sinⁿx·cos x → u = sin x;  cosⁿx·sin x → u = cos x (sin x dx = −du)\n' +
    '• tan x → u = cos x, sonuç −ln|cos x| + C;  cot x → ln|sin x| + C\n' +
    '• 1/(ax + b) → (1/a)·ln|ax + b| + C\n' +
    '• x/(x² + k) → ½·ln(x² + k) + C\n' +
    '• cos(kx), sec²(kx), e^(kx) → u = kx, dx = du/k\n' +
    '• ln x / x → u = ln x\n' +
    '• x·√(x + c) → u = x + c ve x = u − c (x\'i de değiştirmek gerekir)\n\n' +
    'TUZAKLAR\n' +
    '• dx = du/a gibi sabit çarpanı unutmak.\n' +
    '• Belirsiz integralde sonucu u\'lu bırakmak (x\'e dönmemek).\n' +
    '• Belirli integralde sınırları değiştirmeden x sınırlarını u\'lu ifadede kullanmak.\n' +
    '• İç fonksiyonun türevi integralde görünmüyorsa o seçim işe yaramaz; başka bir iç fonksiyon deneyelim.\n\n' +
    'MİNİ ÖRNEK\n' +
    '∫ 2x(x² + 1)³ dx: u = x² + 1, du = 2x dx → ∫ u³ du = u⁴/4 + C = (x² + 1)⁴/4 + C. Belirli hâli ∫₀¹ için sınırlar u: 1 → 2 olur: [u⁴/4]₁² = (16 − 1)/4 = 15/4.\n\n' +
    'MÜHENDİSLİKTE\n' +
    'İş ve enerji (W = ∫F dx), alternatif akımda etkin (RMS) değer (∫sin² dt), RC/RL devrelerindeki üstel sönümler (∫e^(−t/τ) dt) ve akışkanlarda debi hesabında sürekli kullanılır.';
  const HELP_EN = 'WHAT IS SUBSTITUTION (u-SUBSTITUTION)?\n' +
    'Substitution is the integral version of the chain rule. If the integrand has the form f(g(x))·g\'(x), i.e. an inside function g and its derivative g\' stand together, then with u = g(x) we get du = g\'(x) dx and\n' +
    '  ∫ f(g(x))·g\'(x) dx = ∫ f(u) du\n' +
    'A complicated-looking integral becomes a simple table integral.\n\n' +
    'WHAT DOES IT MEAN?\n' +
    'The chain rule said d/dx[F(g(x))] = F\'(g(x))·g\'(x). Substitution runs this backwards: we name the inside function with one letter (u) and integrate the outside function.\n\n' +
    'METHOD (step by step)\n' +
    '1. Choose the inside function: u = g(x). A good choice is an expression whose derivative also appears in the integrand (bracket, root, exponent, denominator, ln x …).\n' +
    '2. Write du = g\'(x) dx and express the dx-factor of the integrand in terms of du.\n' +
    '3. Fix a missing constant factor: if du = 2x dx then x dx = du/2; the constant moves in front of the integral.\n' +
    '4. Write everything in u and compute ∫ … du.\n' +
    '5. For an indefinite integral, replace u by g(x) to go back to x and add + C; then differentiate to check.\n\n' +
    'DEFINITE INTEGRALS: WE CHANGE THE LIMITS\n' +
    '  ∫ₐᵇ f(g(x))·g\'(x) dx = ∫ f(u) du  (u = g(a) ... g(b))\n' +
    'When x = a, u = g(a); when x = b, u = g(b). With the limits written in u we do not go back to x. If we forget to change the limits we get a different number (see the "trap" example below); in the graph the areas in x and in u are equal only with the new limits.\n\n' +
    'COMMON PATTERNS\n' +
    '• (ax + b)ⁿ → u = ax + b, dx = du/a\n' +
    '• x·e^(x²) → u = x², x dx = du/2\n' +
    '• sinⁿx·cos x → u = sin x;  cosⁿx·sin x → u = cos x (sin x dx = −du)\n' +
    '• tan x → u = cos x, result −ln|cos x| + C;  cot x → ln|sin x| + C\n' +
    '• 1/(ax + b) → (1/a)·ln|ax + b| + C\n' +
    '• x/(x² + k) → ½·ln(x² + k) + C\n' +
    '• cos(kx), sec²(kx), e^(kx) → u = kx, dx = du/k\n' +
    '• ln x / x → u = ln x\n' +
    '• x·√(x + c) → u = x + c and x = u − c (x must be rewritten too)\n\n' +
    'PITFALLS\n' +
    '• Forgetting the constant factor such as dx = du/a.\n' +
    '• Leaving an indefinite result in u (not going back to x).\n' +
    '• In a definite integral, using the x limits in the u expression without changing them.\n' +
    '• If the derivative of the inside function does not appear in the integrand, that choice will not work; we try another inside function.\n\n' +
    'MINI EXAMPLE\n' +
    '∫ 2x(x² + 1)³ dx: u = x² + 1, du = 2x dx → ∫ u³ du = u⁴/4 + C = (x² + 1)⁴/4 + C. For the definite version over [0, 1] the limits become u: 1 → 2: [u⁴/4]₁² = (16 − 1)/4 = 15/4.\n\n' +
    'IN ENGINEERING\n' +
    'Used constantly for work and energy (W = ∫F dx), the RMS value of an AC signal (∫sin² dt), exponential decays in RC/RL circuits (∫e^(−t/τ) dt) and flow-rate calculations in fluids.';

  function concept(p) {
    const pt = PT[p.id];
    return tx('YERİNE KOYMA YÖNTEMİ (u-DÖNÜŞÜMÜ)', 'THE SUBSTITUTION METHOD (u-SUBSTITUTION)') + '\n' + tx(HELP_TR, HELP_EN) + '\n\n' +
      tx('ŞU ANKİ ÖRNEK', 'CURRENT EXAMPLE') + '\n' + `∫ ${pt.fS(p)} dx   →   ${pt.uS(p)}`;
  }

  // ---------------------------------------------------------------- controls
  let regB = null, regC = null, regX = null, selPat = null, rgType = null, curP = null;
  function syncControls() {
    try {
      [regB, regC, regX].forEach((reg) => {
        if (!reg || !curP) return;
        const v = reg.get();
        reg.valueLabel.textContent = fmt2(v);
        const r = (v - reg.min) / (reg.max - reg.min);
        reg.input.value = String(Math.max(0, Math.min(1000, Math.round(r * 1000))));
      });
      if (selPat) selPat.refreshFromModel();
      if (rgType) rgType.refreshFromModel();
    } catch (e) { /* stub */ }
  }
  function entryIndex(p) {
    const v = (p.id === 'sincos' || p.id === 'tan' || p.id === 'lfn') ? p.v : 0;
    const i = ENTRIES.findIndex((e) => e.id === p.id && e.v === v);
    return i < 0 ? 0 : i;
  }
  function replace(p, q) { Object.keys(p).forEach((k) => delete p[k]); Object.assign(p, q); }
  function buildControls(rightCol, getProblem, h) {
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); };
    curP = getProblem();
    lab(tx('Kalıp', 'Pattern'));
    selPat = h.addSelect({
      options: ENTRIES.map((e, i) => ({ label: tx(e.tr, e.en), value: i })),
      get: () => entryIndex(getProblem()),
      set: (i) => {
        const p = getProblem(); const e = ENTRIES[Number(i)];
        let type = p.type;
        if (!allowed(type, e.id, e.v)) type = allowed('indef', e.id, e.v) ? 'indef' : 'def';
        replace(p, build(new Rng(), type, e.id, e.v));
        syncControls();
      },
    });
    lab(tx('Soru türü', 'Problem type'));
    rgType = h.addRadioGroup({
      name: 'subsType',
      options: [
        { label: tx('Belirsiz integral', 'Indefinite integral'), value: 'indef' },
        { label: tx('Belirli integral (yeni sınırlar)', 'Definite integral (new limits)'), value: 'def' },
        { label: tx('x\'i de yeniden yazma (x√(x + c))', 'Rewriting x too (x√(x + c))'), value: 'rewrite' },
        { label: tx('Tuzak: sınırları değiştirmemek', 'Trap: not changing the limits'), value: 'trap' },
      ],
      get: () => getProblem().type,
      set: (t) => {
        const p = getProblem();
        let id = p.id, v = (p.id === 'sincos' || p.id === 'tan' || p.id === 'lfn') ? p.v : 0;
        if (t === 'rewrite') id = 'xroot';
        else if (!allowed(t, id, v)) { id = t === 'trap' ? 'pow' : 'pow'; v = 0; }
        replace(p, build(new Rng(), t, id, v));
        syncControls();
      },
    });
    regB = h.addSlider({
      caption: tx('Üst sınır b (izinli aralıkta: 0 = en küçük, 1 = en büyük) - alanları karşılaştırabiliriz', 'Upper limit b (within the allowed range: 0 = smallest, 1 = largest) - we can compare the areas'),
      min: 0, max: 1, step: 0.05,
      get: () => { const p = getProblem(); if (!hasDef(p)) return 1; const pt = PT[p.id]; const lo = pt.bLo(p), hi = pt.bHi(p); return Math.max(0, Math.min(1, (p.b - lo) / (hi - lo))); },
      set: (v) => { const p = getProblem(); if (!hasDef(p)) return; const pt = PT[p.id]; p.b = pt.bLo(p) + v * (pt.bHi(p) - pt.bLo(p)); },
    });
    regC = h.addSlider({
      caption: tx('Sabit C (F(x) + C eğri ailesi)', 'Constant C (the family F(x) + C)'),
      min: -3, max: 3, step: 0.5,
      get: () => getProblem().C, set: (v) => { getProblem().C = v; },
    });
    regX = h.addSlider({
      caption: tx('Teğet noktası x (eğim = f(x))', 'Tangent point x (slope = f(x))'),
      min: 0, max: 1, step: 0.02,
      get: () => getProblem().xsF, set: (v) => { getProblem().xsF = v; },
    });
  }

  // links: a problem of one pattern / type (same shape as createProblem)
  const makeSub = (type, id, v) => (rng) => {
    const p = build(rng, type, id, v === undefined ? (id === 'lfn' ? rng.nextInt(0, 3) : 0) : v);
    syncControls();
    return p;
  };
  const makeDef = (rng) => {
    const id = rng.pick(DEF_IDS);
    return makeSub('def', id)(rng);
  };

  Topics.register('integrals', {
    id: 'substitution',
    tabTitle: () => tx('Yerine Koyma Yöntemi (u-Dönüşümü)', 'The Substitution Method (u-Substitution)'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^• \(ax \+ b\)ⁿ/, make: makeSub('indef', 'pow') },
      { match: /^• x·e\^\(x²\)/, make: makeSub('indef', 'xexp') },
      { match: /^• sinⁿx·cos x/, make: makeSub('indef', 'sincos', 0) },
      { match: /^• tan x →/, make: makeSub('indef', 'tan', 0) },
      { match: /^• 1\/\(ax \+ b\)/, make: makeSub('indef', 'lin') },
      { match: /^• x\/\(x² \+ k\)/, make: makeSub('indef', 'xk') },
      { match: /^• cos\(kx\)/, make: makeSub('indef', 'lfn') },
      { match: /^• ln x \/ x/, make: makeSub('indef', 'lnx') },
      { match: /^• x·√\(x \+ c\)/, make: makeSub('rewrite', 'xroot') },
      { match: /^(BELİRLİ İNTEGRALDE SINIRLARI DEĞİŞTİRELİM|DEFINITE INTEGRALS: WE CHANGE THE LIMITS)$/, make: makeDef },
      { match: /^• (Belirli integralde sınırları değiştirmeden|In a definite integral, using the x limits)/, make: (rng) => makeSub('trap', rng.pick(TRAP_IDS), 0)(rng) },
    ],
    _scenarioCount: () => ENTRIES.length * 2,
    _setScenario: (i) => {
      const e = ENTRIES[i % ENTRIES.length];
      let type = i < ENTRIES.length ? 'indef' : 'def';
      if (!allowed(type, e.id, e.v)) type = 'indef';
      if (e.id === 'xroot' && type === 'indef') type = 'rewrite';
      forced = { type, id: e.id, v: e.v };
    },
  });
})();
