// Higher-Order Derivatives (chapter 'derivatives'). Thomas 3.3 / Stewart 3.x.
// problem.kind:
//   'poly'   polynomial of degree 3..5: f', f'', f''' and f''(x0) (the degree drops by one each time)
//   'nth'    f^(n) for fam 'sin' | 'cos' (cycle of 4, k), 'exp' (e^{kx}), 'pow' (x^m: factorial pattern), 'inv' (1/x), value at x0
//   'prod'   f'' of a product / quotient: sub 'ep' (ax^2+bx+c) e^{kx} | 'xs' x sin kx | 'xc' x cos kx | 'quot' (ax+b)/(cx+d)
//   'interp' concavity from the sign of f'': sub 'cub' x^3+3t x^2+q x+r | 'quart' x^4-6x^2+q x+r (inflection points)
//   'motion' s(t) cubic: v = s', a = s'', jerk = s''' (acceleration changes sign at t*)
// Graph: f, f', f'' on one fixed window (-4..4 x -8..8); slider xs moves the probe point (tangent + osculating parabola).
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (s) => { s = String(s); return (s[0] === '−' || s[0] === '-') ? '(' + s + ')' : s; };
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let t = v.toFixed(dec === undefined ? 3 : dec);
    if (t.indexOf('.') >= 0) t = t.replace(/0+$/, '').replace(/[.]$/, '');
    if (t === '-0') t = '0';
    return M(t);
  }
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const supD = (n) => String(n).split('').map((c) => SUP[c] || c).join('');
  const sup = (n) => (n === 1 ? '' : supD(n));
  const fN = (n) => 'f⁽' + supD(n) + '⁾';
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  function fr(n, d) { if (d === undefined) d = 1; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); n /= g; d /= g; if (n === 0) { n = 0; d = 1; } return { n, d }; }
  const frS = (x) => (x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d);
  const frV = (x) => x.n / x.d;
  const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const ipow = (b, e) => { let r = 1; for (let i = 0; i < e; i++) r *= b; return r; };
  const cf = (n) => (n === 1 ? '' : n === -1 ? '−' : S(n));
  const lc = (ts) => { let o = ''; for (const [c, v] of ts) { if (!c) continue; const ac = Math.abs(c); const b = v === '' ? String(ac) : (ac === 1 ? '' : String(ac)) + v; o += o === '' ? (c < 0 ? '−' : '') + b : (c < 0 ? ' − ' : ' + ') + b; } return o || '0'; };
  function poly(cs, v) {
    v = v || 'x';
    return lc(cs.map((c, i) => [c, i === 0 ? '' : i === 1 ? v : v + sup(i)]).reverse());
  }
  const pd = (cs) => cs.slice(1).map((c, i) => c * (i + 1));
  const pe = (cs, x) => cs.reduceRight((acc, c) => acc * x + c, 0);
  const safe = (v) => (isFinite(v) && Math.abs(v) < 60 ? v : NaN);
  const expS = (q) => (q === 0 ? '1' : q === 1 ? 'e' : 'e^' + (q < 0 ? '(' + S(q) + ')' : q));
  const kxS = (k) => (k === 1 ? 'x' : k === -1 ? '−x' : S(k) + 'x');
  const cd = (c) => (c === 1 ? '' : c === -1 ? '−' : S(c) + '·');
  function piS(n, d) { const f = fr(n, d); if (f.n === 0) return '0'; const a = Math.abs(f.n); return (f.n < 0 ? '−' : '') + (a === 1 ? '' : a) + 'π' + (f.d === 1 ? '' : '/' + f.d); }

  // ---------- nth tables ----------
  const TRIG = { sin: { fn: ['sin', 'cos', 'sin', 'cos'], sg: [1, 1, -1, -1] }, cos: { fn: ['cos', 'sin', 'cos', 'sin'], sg: [1, -1, -1, 1] } };
  const trigTerm = (fam, k, j) => { const c = TRIG[fam].sg[j % 4] * ipow(k, j); return `${cf(c)}${TRIG[fam].fn[j % 4]}(${kxS(k)})`; };
  const trigCoef = (fam, k, j) => TRIG[fam].sg[j % 4] * ipow(k, j);

  // ---------- model ----------
  function model(p) {
    switch (p.kind) {
      case 'poly': {
        const c1 = pd(p.cs), c2 = pd(c1), c3 = pd(c2);
        return { f: (x) => pe(p.cs, x), d1: (x) => pe(c1, x), d2: (x) => pe(c2, x), ans: pe(c2, p.x0), c1, c2, c3 };
      }
      case 'nth': {
        const { fam, k, n, m, x0 } = p;
        if (fam === 'sin') return { f: (x) => Math.sin(k * x), d1: (x) => k * Math.cos(k * x), d2: (x) => -k * k * Math.sin(k * x), ans: trigCoef('sin', k, n) * (TRIG.sin.fn[n % 4] === 'cos' ? 1 : 0), fn: (x) => Math.pow(k, n) * Math.sin(k * x + n * Math.PI / 2) };
        if (fam === 'cos') return { f: (x) => Math.cos(k * x), d1: (x) => -k * Math.sin(k * x), d2: (x) => -k * k * Math.cos(k * x), ans: trigCoef('cos', k, n) * (TRIG.cos.fn[n % 4] === 'cos' ? 1 : 0), fn: (x) => Math.pow(k, n) * Math.cos(k * x + n * Math.PI / 2) };
        if (fam === 'exp') return { f: (x) => Math.exp(k * x), d1: (x) => k * Math.exp(k * x), d2: (x) => k * k * Math.exp(k * x), ans: ipow(k, n), fn: (x) => ipow(k, n) * Math.exp(k * x) };
        if (fam === 'pow') {
          const co = n > m ? 0 : fact(m) / fact(m - n);
          return { f: (x) => Math.pow(x, m), d1: (x) => m * Math.pow(x, m - 1), d2: (x) => m * (m - 1) * Math.pow(x, m - 2), co, ans: n > m ? 0 : co * Math.pow(x0, m - n), fn: (x) => { if (n > m) return 0; let r = 1; for (let i = 0; i < n; i++) r *= (m - i); return r * Math.pow(x, m - n); } };
        }
        const sg = n % 2 === 0 ? 1 : -1, v = fr(sg * fact(n), Math.pow(x0, n + 1));
        return { f: (x) => (Math.abs(x) < 1e-9 ? NaN : 1 / x), d1: (x) => (Math.abs(x) < 1e-9 ? NaN : -1 / (x * x)), d2: (x) => (Math.abs(x) < 1e-9 ? NaN : 2 / (x * x * x)), ans: frV(v), ansFr: v, fn: (x) => sg * fact(n) / Math.pow(x, n + 1) };
      }
      case 'prod': {
        const { sub } = p;
        if (sub === 'ep') {
          const { A, B, C, k } = p;
          const q = [B + C * k, 2 * A + B * k, A * k], r = [2 * A + 2 * B * k + C * k * k, 4 * A * k + B * k * k, A * k * k];
          const e = (x) => Math.exp(k * x);
          return { f: (x) => (A * x * x + B * x + C) * e(x), d1: (x) => pe(q, x) * e(x), d2: (x) => pe(r, x) * e(x), ans: pe(r, p.x0) * e(p.x0), q, r };
        }
        if (sub === 'xs' || sub === 'xc') {
          const k = p.k, s = sub === 'xs';
          return {
            f: (x) => (s ? x * Math.sin(k * x) : x * Math.cos(k * x)),
            d1: (x) => (s ? Math.sin(k * x) + k * x * Math.cos(k * x) : Math.cos(k * x) - k * x * Math.sin(k * x)),
            d2: (x) => (s ? 2 * k * Math.cos(k * x) - k * k * x * Math.sin(k * x) : -2 * k * Math.sin(k * x) - k * k * x * Math.cos(k * x)),
            xv: p.t * Math.PI / k,
            ans: (s ? 2 * k * Math.cos(k * p.t * Math.PI / k) - k * k * (p.t * Math.PI / k) * Math.sin(k * p.t * Math.PI / k) : -2 * k * Math.sin(p.t * Math.PI) - k * k * (p.t * Math.PI / k) * Math.cos(p.t * Math.PI)),
          };
        }
        const { a, b, c, d } = p, D = a * d - b * c;
        const g = (x) => c * x + d;
        const x0 = p.x0, v = fr(-2 * c * D, ipow(g(x0), 3) * 1);
        return { f: (x) => (Math.abs(g(x)) < 1e-9 ? NaN : (a * x + b) / g(x)), d1: (x) => (Math.abs(g(x)) < 1e-9 ? NaN : D / (g(x) * g(x))), d2: (x) => (Math.abs(g(x)) < 1e-9 ? NaN : -2 * c * D / (g(x) * g(x) * g(x))), ans: frV(v), ansFr: v, D };
      }
      case 'interp': {
        const cs = p.cs, c1 = pd(cs), c2 = pd(c1);
        return { f: (x) => pe(cs, x), d1: (x) => pe(c1, x), d2: (x) => pe(c2, x), ans: p.sub === 'cub' ? -p.t : 1, c1, c2 };
      }
      default: {
        const cs = [p.dl, p.ga, p.be, p.al], c1 = pd(cs), c2 = pd(c1), c3 = pd(c2);
        return { f: (x) => pe(cs, x), d1: (x) => pe(c1, x), d2: (x) => pe(c2, x), ans: pe(c2, p.x0), cs, c1, c2, c3 };
      }
    }
  }

  // ---------- generation ----------
  function base() { return { kind: 'poly', cs: [0, 0, 1, 1], x0: 1, xs: 1, fam: 'sin', k: 2, n: 7, m: 6, sub: 'ep', A: 1, B: 0, C: 1, t: 0, a: 1, b: 0, c: 1, d: 1, al: 1, be: 0, ga: 0, dl: 0, tstar: 2 }; }
  function genKind(rng, kind, opt) {
    opt = opt || {};
    const p = Object.assign(base(), { kind });
    if (kind === 'poly') {
      const deg = rng.nextInt(3, 6);
      p.cs = [];
      for (let i = 0; i <= deg; i++) p.cs.push(i === deg ? rng.nonZeroInt(-3, 3) : rng.nextInt(-4, 5));
      p.x0 = rng.nextInt(-2, 4);
    } else if (kind === 'nth') {
      p.fam = rng.pick(['sin', 'cos', 'exp', 'pow', 'inv', 'sin', 'cos']);
      if (opt.fam) p.fam = Array.isArray(opt.fam) ? rng.pick(opt.fam) : opt.fam;
      if (p.fam === 'sin' || p.fam === 'cos') { p.k = rng.pick([1, 2, 3, -1, -2]); p.n = rng.nextInt(5, p.k === 3 ? 10 : 12); p.x0 = 0; }
      else if (p.fam === 'exp') { p.k = rng.pick([2, 3, -1, -2, -3]); p.n = rng.nextInt(3, 8); p.x0 = 0; }
      else if (p.fam === 'pow') { p.m = rng.nextInt(5, 10); p.n = rng.nextInt(2, p.m + 2); p.x0 = rng.pick([1, 2, -1]); }
      else { p.n = rng.nextInt(3, 8); p.x0 = rng.pick([1, 2, -1]); }
    } else if (kind === 'prod') {
      p.sub = rng.pick(['ep', 'ep', 'xs', 'xc', 'quot', 'quot']);
      if (opt.sub) p.sub = opt.sub;
      if (p.sub === 'ep') { p.A = rng.pick([1, 2, -1, 3]); p.B = rng.nextInt(-3, 4); p.C = rng.nextInt(-3, 4); p.k = rng.pick([1, 2, -1, -2]); p.x0 = rng.pick([0, 0, 1, -1]); }
      else if (p.sub === 'xs' || p.sub === 'xc') { p.k = rng.pick([1, 2, 3, -1, -2]); p.t = rng.pick([0, 0.5, 1]); p.x0 = p.t * Math.PI / p.k; }
      else {
        for (let i = 0; i < 300; i++) {
          p.a = rng.nonZeroInt(-3, 3); p.b = rng.nextInt(-3, 4); p.c = rng.pick([1, 2, -1]); p.d = rng.nextInt(-4, 5); p.x0 = rng.nextInt(-3, 4);
          if (p.a * p.d - p.b * p.c !== 0 && p.c * p.x0 + p.d !== 0 && Math.abs(p.c * p.x0 + p.d) <= 5) break;
        }
      }
    } else if (kind === 'interp') {
      p.sub = rng.pick(['cub', 'cub', 'quart']);
      if (p.sub === 'cub') { p.t = rng.pick([-2, -1, 1, 2, 0]); p.cs = [rng.nextInt(-3, 4), rng.nextInt(-3, 4), 3 * p.t, 1]; }
      else p.cs = [rng.nextInt(-3, 4), rng.nextInt(-2, 3), -6, 0, 1];
      p.x0 = 0;
    } else {
      p.al = rng.pick([1, 2, -1, 1]); p.tstar = rng.pick([1, 2, 3]); p.be = -3 * p.al * p.tstar; p.ga = rng.nextInt(-6, 10); p.dl = rng.nextInt(-3, 6);
      p.x0 = rng.nextInt(0, 5);
    }
    p.xs = p.x0;
    return p;
  }
  function createProblem(rng) { return genKind(rng, rng.pick(['poly', 'poly', 'nth', 'nth', 'nth', 'prod', 'prod', 'interp', 'motion'])); }

  // ---------- texts ----------
  function concept() {
    return Tx(
`TANIM
f'(x) türevinin de türevi alınabiliyorsa buna ikinci türev denir; bu işlem tekrarlanabilir:
f'' = (f')',  f''' = (f'')',  f⁽ⁿ⁾ = (f⁽ⁿ⁻¹⁾)'
Leibniz gösterimi: y'' = d²y/dx²,  y''' = d³y/dx³,  y⁽ⁿ⁾ = dⁿy/dxⁿ. (d²y/dx² "dy bölü dx kare" diye okunmaz; "y'nin x'e göre ikinci türevi" denir.)

ANLAMI NE?
• f' eğimi verir; f'' ise eğimin kendisinin nasıl değiştiğini: f'' > 0 ise eğim artar, eğri YUKARI DOĞRU AÇIK (∪, teğetlerinin üstünde); f'' < 0 ise eğim azalır, eğri AŞAĞI DOĞRU AÇIK (∩).
• Konum s(t) için: s' = hız, s'' = ivme, s''' = sarsım (jerk, ivmenin değişim hızı).
• f'' işaret değiştiren noktada büküm noktası vardır.

TEMEL ÖRÜNTÜLER
Polinom: Her türevde derece 1 düşer; n dereceli polinomun (n+1). türevi 0'dır.
eᵏˣ: f⁽ⁿ⁾ = kⁿ·eᵏˣ
sin kx ve cos kx: türevler 4'lü döngüyle tekrarlanır
   sin → cos → −sin → −cos → sin ...   (her adımda bir k çarpanı gelir)
xᵐ: f⁽ⁿ⁾ = m(m−1)...(m−n+1)·xᵐ⁻ⁿ = m!/(m−n)!·xᵐ⁻ⁿ  (n > m için 0)
1/x: f⁽ⁿ⁾ = (−1)ⁿ·n!/xⁿ⁺¹

YÖNTEM
1) Önce f' bulunur; sonra f' fonksiyonuna aynı kurallar yeniden uygulanır.
2) Çarpımda (uv)'' = u''v + 2u'v' + uv'' (iki kez çarpım kuralı); bölümde önce sadeleştirmek işi kolaylaştırır.
3) Değer isteniyorsa x₀ en sona bırakılır (önce türev, sonra yerine koyma).
4) Örüntü varsa n. türev için kapalı formül yazılır; döngülerde n'nin 4'e bölümünden kalana bakılır.

PÜF NOKTALARI
• f''(x)'in (f'(x))² ile karıştırılması çok yaygın bir hatadır: f'' = (f')' dür.
• f''(x₀) = 0 tek başına büküm demek değildir; işaret de değişmelidir (x⁴: x = 0'da f'' = 0 ama büküm yok).
• sin kx'in her türevinde k'nın çarpan olarak geldiği unutulmamalıdır (zincir kuralı).

MİNİ ÖRNEK
f(x) = x⁴ için f' = 4x³, f'' = 12x², f''' = 24x, f⁽⁴⁾ = 24, f⁽⁵⁾ = 0.

MÜHENDİSLİKTE
İvme (kuvvet = kütle·ivme), kiriş eğilmesinde eğrilik (M = EI·y''), sarsım (konfor, darbe) ve titreşim (x'' + ω²x = 0) hep ikinci/üçüncü türevlerle ifade edilir.`,
`DEFINITION
If the derivative f'(x) can itself be differentiated, we get the second derivative, and we can repeat the process:
f'' = (f')',  f''' = (f'')',  f⁽ⁿ⁾ = (f⁽ⁿ⁻¹⁾)'
Leibniz notation: y'' = d²y/dx²,  y''' = d³y/dx³,  y⁽ⁿ⁾ = dⁿy/dxⁿ. (d²y/dx² is read "the second derivative of y with respect to x", not as a fraction to cancel.)

WHAT DOES IT MEAN?
• f' gives the slope; f'' tells how the slope itself changes: f'' > 0 means the slope increases, the curve is CONCAVE UP (∪, above its tangents); f'' < 0 means the slope decreases, the curve is CONCAVE DOWN (∩).
• For a position s(t): s' = velocity, s'' = acceleration, s''' = jerk (the rate of change of acceleration).
• A point where f'' changes sign is an inflection point.

BASIC PATTERNS
Polynomial: every derivative lowers the degree by 1; the (n+1)-th derivative of a degree-n polynomial is 0.
eᵏˣ: f⁽ⁿ⁾ = kⁿ·eᵏˣ
sin kx and cos kx: derivatives repeat in a cycle of 4
   sin → cos → −sin → −cos → sin ...   (each step brings one factor k)
xᵐ: f⁽ⁿ⁾ = m(m−1)...(m−n+1)·xᵐ⁻ⁿ = m!/(m−n)!·xᵐ⁻ⁿ  (0 for n > m)
1/x: f⁽ⁿ⁾ = (−1)ⁿ·n!/xⁿ⁺¹

METHOD
1) Find f' first; then apply the same rules again to f'.
2) For a product, (uv)'' = u''v + 2u'v' + uv'' (the product rule twice); for a quotient, simplify first when possible.
3) If a value is wanted, keep x₀ for the end (differentiate first, substitute afterwards).
4) If there is a pattern, write a closed formula for the n-th derivative; for cycles look at the remainder of n divided by 4.

COMMON PITFALLS
• Confusing f''(x) with (f'(x))² is very common: f'' = (f')'.
• f''(x₀) = 0 alone does not mean an inflection; the sign must also change (x⁴: f'' = 0 at x = 0 but no inflection).
• For sin kx remember that every derivative brings a factor k (chain rule).

MINI EXAMPLE
For f(x) = x⁴: f' = 4x³, f'' = 12x², f''' = 24x, f⁽⁴⁾ = 24, f⁽⁵⁾ = 0.

IN ENGINEERING
Acceleration (force = mass·acceleration), curvature in beam bending (M = EI·y''), jerk (comfort, impact) and vibration (x'' + ω²x = 0) are all expressed with second or third derivatives.`);
  }

  function fStr(p) {
    switch (p.kind) {
      case 'poly': return poly(p.cs);
      case 'nth': return p.fam === 'sin' ? `sin(${kxS(p.k)})` : p.fam === 'cos' ? `cos(${kxS(p.k)})` : p.fam === 'exp' ? `e^(${kxS(p.k)})` : p.fam === 'pow' ? 'x' + supD(p.m) : '1/x';
      case 'prod': {
        if (p.sub === 'ep') return `(${poly([p.C, p.B, p.A])})·e^(${kxS(p.k)})`;
        if (p.sub === 'xs') return `x·sin(${kxS(p.k)})`;
        if (p.sub === 'xc') return `x·cos(${kxS(p.k)})`;
        return `(${lc([[p.a, 'x'], [p.b, '']])})/(${lc([[p.c, 'x'], [p.d, '']])})`;
      }
      case 'interp': return poly(p.cs);
      default: return poly([p.dl, p.ga, p.be, p.al], 't');
    }
  }
  const x0S = (p) => (p.kind === 'prod' && (p.sub === 'xs' || p.sub === 'xc') ? (p.t === 0 ? '0' : piS(p.t * 2, 2 * p.k)) : S(p.x0));

  function statement(p) {
    const f = fStr(p);
    switch (p.kind) {
      case 'poly': return Tx(`f(x) = ${f} fonksiyonu için f'(x), f''(x) ve f'''(x) türevlerini bulalım. f''(${S(p.x0)}) kaç olur ve f'' bu noktada eğrinin nasıl büküldüğünü söyler?`,
        `For f(x) = ${f}, let's find f'(x), f''(x) and f'''(x). What is f''(${S(p.x0)}), and what does it say about how the curve bends there?`);
      case 'nth': {
        const ask = p.x0 === 0 ? `${fN(p.n)}(x) türevini ve ${fN(p.n)}(0) değerini` : `${fN(p.n)}(x) türevini ve ${fN(p.n)}(${S(p.x0)}) değerini`;
        const askE = p.x0 === 0 ? `${fN(p.n)}(x) and the value ${fN(p.n)}(0)` : `${fN(p.n)}(x) and the value ${fN(p.n)}(${S(p.x0)})`;
        return Tx(`f(x) = ${f} için ilk birkaç türevi yazıp örüntüyü görelim; sonra ${ask} bulalım.`, `For f(x) = ${f}, let's write the first few derivatives, spot the pattern, and then find ${askE}.`);
      }
      case 'prod': {
        const at = x0S(p);
        return Tx(`f(x) = ${f} fonksiyonunun ikinci türevini bulalım. f''(${at}) kaç olur?`, `Let's find the second derivative of f(x) = ${f}. What is f''(${at})?`);
      }
      case 'interp': return Tx(`f(x) = ${f} fonksiyonu hangi aralıklarda yukarı, hangilerinde aşağı doğru açıktır? Büküm noktası (noktaları) nerededir?`,
        `On which intervals is f(x) = ${f} concave up and on which concave down? Where is the inflection point (or points)?`);
      default: return Tx(`Bir cismin konumu s(t) = ${f} metre (t saniye). t = ${S(p.x0)} s anında hız, ivme ve sarsımı (jerk) bulalım. İvme ne zaman sıfır olur ve bu anın öncesinde/sonrasında ivmenin işareti ne olur?`,
        `A body has position s(t) = ${f} metres (t in seconds). Let's find its velocity, acceleration and jerk at t = ${S(p.x0)} s. When is the acceleration zero, and what is its sign before and after that moment?`);
    }
  }

  // ---------- steps ----------
  const T = (tr, en) => Tx(tr, en);
  function concavityLine(v, at) {
    if (v > 1e-9) return T(`f''(${at}) = ${nf(v, 3)} > 0 → eğri bu noktada YUKARI DOĞRU AÇIK (∪): eğim artıyor, eğri teğetinin üstünde kalır.`, `f''(${at}) = ${nf(v, 3)} > 0 → the curve is CONCAVE UP (∪) here: the slope is increasing and the curve stays above its tangent.`);
    if (v < -1e-9) return T(`f''(${at}) = ${nf(v, 3)} < 0 → eğri bu noktada AŞAĞI DOĞRU AÇIK (∩): eğim azalıyor, eğri teğetinin altında kalır.`, `f''(${at}) = ${nf(v, 3)} < 0 → the curve is CONCAVE DOWN (∩) here: the slope is decreasing and the curve stays below its tangent.`);
    return T(`f''(${at}) = 0 → bu noktada eğrilik yönü değişebilir (büküm adayı); işarete de bakmak gerekir.`, `f''(${at}) = 0 → the bending direction may change here (inflection candidate); the sign must be checked as well.`);
  }
  const numCheck = (m, x, ans) => { const h = 1e-4; const v = (m.d1(x + h) - m.d1(x - h)) / (2 * h); return T(`── Kontrol ──\nSayısal: (f'(x₀+h) − f'(x₀−h))/(2h), h = 0,0001 ≈ ${nf(v, 3)} ✓ (≈ ${nf(ans, 3)}).`, `── Check ──\nNumerical: (f'(x₀+h) − f'(x₀−h))/(2h), h = 0.0001 ≈ ${nf(v, 3)} ✓ (≈ ${nf(ans, 3)}).`); };

  function stepsPoly(p, m) {
    const out = [], d = p.cs.length - 1;
    const ds = [p.cs, m.c1, m.c2, m.c3];
    out.push(T(`── 1) Fonksiyon ──\nf(x) = ${poly(p.cs)}   (${d}. dereceden polinom)\nGüç kuralı: (xⁿ)' = n·xⁿ⁻¹, sabitin türevi 0.`, `── 1) The function ──\nf(x) = ${poly(p.cs)}   (a polynomial of degree ${d})\nPower rule: (xⁿ)' = n·xⁿ⁻¹, the derivative of a constant is 0.`));
    out.push(T(`── 2) Birinci türev ──\nf'(x) = ${poly(m.c1)}`, `── 2) First derivative ──\nf'(x) = ${poly(m.c1)}`));
    out.push(T(`── 3) İkinci türev (f'nin türevi) ──\nf''(x) = ${poly(m.c2)}`, `── 3) Second derivative (the derivative of f') ──\nf''(x) = ${poly(m.c2)}`));
    let rest = `f'''(x) = ${poly(m.c3)}`;
    let cur = m.c3, idx = 3;
    while (cur.length > 1) { cur = pd(cur); idx++; rest += `\n${fN(idx)}(x) = ${poly(cur)}`; }
    rest += `\n${fN(idx + 1)}(x) = 0`;
    out.push(T(`── 4) Üçüncü ve sonraki türevler ──\n${rest}\nHer türevde derece 1 düştü; ${d}. dereceden polinomun ${d + 1}. türevi 0 olur.`, `── 4) Third and further derivatives ──\n${rest}\nEvery derivative lowered the degree by 1; the ${d + 1}-th derivative of a degree-${d} polynomial is 0.`));
    const at = S(p.x0), v = m.ans;
    out.push(T(`── 5) f''(${at}) değeri ──\nf''(${at}) = ${poly(m.c2).replace(/x/g, '(' + at + ')')} = ${S(v)}\n${concavityLine(v, at).split('\n')[0]}`, `── 5) The value f''(${at}) ──\nf''(${at}) = ${poly(m.c2).replace(/x/g, '(' + at + ')')} = ${S(v)}\n${concavityLine(v, at).split('\n')[0]}`));
    out.push(numCheck(m, p.x0, v));
    void ds;
    return out;
  }

  function stepsNth(p, m) {
    const out = [], { fam, k, n, x0 } = p;
    const at = S(x0);
    const FN = fN(n);
    const q = n % 4;
    if (fam === 'sin' || fam === 'cos') {
      const list = [0, 1, 2, 3, 4].map((j) => `${j === 0 ? 'f' : fN(j).replace('⁽¹⁾', "'").replace('⁽²⁾', "''").replace('⁽³⁾', "'''")}(x) = ${trigTerm(fam, k, j)}`);
      out.push(T(`── 1) İlk türevler ──\n${list.join('\n')}`, `── 1) The first derivatives ──\n${list.join('\n')}`));
      out.push(T(`── 2) Örüntü ──\n4. türevden sonra ${fam} yine ${fam} olur (4'lü döngü), yalnızca k⁴ = ${S(ipow(k, 4))} çarpanı birikir. Yani f⁽ⁿ⁺⁴⁾ = k⁴·f⁽ⁿ⁾.\nBu yüzden n'yi 4'e bölüp kalana bakarız: n = ${n} = 4·${Math.floor(n / 4)} + ${q}  →  kalan ${q}.`,
        `── 2) The pattern ──\nAfter 4 derivatives ${fam} returns to ${fam} (cycle of 4); only the factor k⁴ = ${S(ipow(k, 4))} accumulates, i.e. f⁽ⁿ⁺⁴⁾ = k⁴·f⁽ⁿ⁾.\nSo we divide n by 4 and look at the remainder: n = ${n} = 4·${Math.floor(n / 4)} + ${q}  →  remainder ${q}.`));
      const c = trigCoef(fam, k, n);
      out.push(T(`── 3) n. türev formülü ──\nKalan ${q} → ${TRIG[fam].fn[q]} biçimi, işaret ${TRIG[fam].sg[q] > 0 ? '+' : '−'}:\n${FN}(x) = ${TRIG[fam].sg[q] > 0 ? '' : '−'}k${supD(n)}·${TRIG[fam].fn[q]}(${kxS(k)}) = ${cf(c) === '' ? '' : cf(c)}${TRIG[fam].fn[q]}(${kxS(k)})\n(k${supD(n)} = (${S(k)})${supD(n)} = ${S(ipow(k, n))})`,
        `── 3) Formula for the n-th derivative ──\nRemainder ${q} → ${TRIG[fam].fn[q]} form, sign ${TRIG[fam].sg[q] > 0 ? '+' : '−'}:\n${FN}(x) = ${TRIG[fam].sg[q] > 0 ? '' : '−'}k${supD(n)}·${TRIG[fam].fn[q]}(${kxS(k)}) = ${cf(c) === '' ? '' : cf(c)}${TRIG[fam].fn[q]}(${kxS(k)})\n(k${supD(n)} = (${S(k)})${supD(n)} = ${S(ipow(k, n))})`));
      out.push(T(`── 4) x = 0'da değer ──\nsin 0 = 0, cos 0 = 1 olduğundan ${FN}(0) = ${S(m.ans)}.`, `── 4) Value at x = 0 ──\nSince sin 0 = 0 and cos 0 = 1, ${FN}(0) = ${S(m.ans)}.`));
      out.push(T(`── 5) Kontrol ──\nFaz kaydırma formülüyle: ${FN}(x) = kⁿ·${fam}(${kxS(k)} + n·π/2); x = 0 için kⁿ·${fam}(nπ/2) = ${S(ipow(k, n))}·${nf(Math.round(Math.sin(n * Math.PI / 2 + (fam === 'cos' ? Math.PI / 2 : 0))), 0)} = ${S(m.ans)} ✓`,
        `── 5) Check ──\nWith the phase-shift formula: ${FN}(x) = kⁿ·${fam}(${kxS(k)} + n·π/2); at x = 0: kⁿ·${fam}(nπ/2) = ${S(ipow(k, n))}·${nf(Math.round(fam === 'sin' ? Math.sin(n * Math.PI / 2) : Math.cos(n * Math.PI / 2)), 0)} = ${S(m.ans)} ✓`));
    } else if (fam === 'exp') {
      const list = [`f(x) = e^(${kxS(k)})`, `f'(x) = ${cd(k)}e^(${kxS(k)})`, `f''(x) = ${cd(k * k)}e^(${kxS(k)})`, `f'''(x) = ${cd(k * k * k)}e^(${kxS(k)})`];
      out.push(T(`── 1) İlk türevler ──\n${list.join('\n')}\n(Zincir kuralı: (e^(kx))' = k·e^(kx))`, `── 1) The first derivatives ──\n${list.join('\n')}\n(Chain rule: (e^(kx))' = k·e^(kx))`));
      out.push(T(`── 2) Örüntü ──\nHer türevde bir k çarpanı gelir: ${FN}(x) = kⁿ·e^(${kxS(k)}).`, `── 2) The pattern ──\nEach derivative brings one factor k: ${FN}(x) = kⁿ·e^(${kxS(k)}).`));
      out.push(T(`── 3) n = ${n} için ──\n${FN}(x) = (${S(k)})${supD(n)}·e^(${kxS(k)}) = ${cd(ipow(k, n))}e^(${kxS(k)})`, `── 3) For n = ${n} ──\n${FN}(x) = (${S(k)})${supD(n)}·e^(${kxS(k)}) = ${cd(ipow(k, n))}e^(${kxS(k)})`));
      out.push(T(`── 4) x = 0'da değer ──\ne⁰ = 1 olduğundan ${FN}(0) = ${S(m.ans)}.`, `── 4) Value at x = 0 ──\nSince e⁰ = 1, ${FN}(0) = ${S(m.ans)}.`));
      out.push(T(`── 5) Kontrol ──\n|k| = ${Math.abs(k)} ${Math.abs(k) > 1 ? '> 1' : '= 1'} olduğundan türevlerin büyüklüğü her adımda ${Math.abs(k) > 1 ? 'büyür' : 'aynı kalır'}; k ${k < 0 ? '< 0 olduğu için işaretler dönüşümlü: n = ' + n + (n % 2 ? ' tek → negatif ✓' : ' çift → pozitif ✓') : '> 0 → hepsi pozitif ✓'}.`,
        `── 5) Check ──\nSince |k| = ${Math.abs(k)} ${Math.abs(k) > 1 ? '> 1' : '= 1'}, the size of the derivatives ${Math.abs(k) > 1 ? 'grows' : 'stays the same'} each step; ${k < 0 ? 'k < 0 so the signs alternate: n = ' + n + (n % 2 ? ' is odd → negative ✓' : ' is even → positive ✓') : 'k > 0 → all positive ✓'}.`));
    } else if (fam === 'pow') {
      const mm = p.m;
      const list = [`f(x) = x${supD(mm)}`, `f'(x) = ${mm}x${sup(mm - 1)}`, `f''(x) = ${mm * (mm - 1)}x${sup(mm - 2)}`, `f'''(x) = ${mm * (mm - 1) * (mm - 2)}x${sup(mm - 3)}`];
      out.push(T(`── 1) İlk türevler ──\n${list.join('\n')}`, `── 1) The first derivatives ──\n${list.join('\n')}`));
      out.push(T(`── 2) Örüntü ──\nKatsayı: ${mm}, ${mm}·${mm - 1}, ${mm}·${mm - 1}·${mm - 2}, ... (her adımda üs bir azalır ve katsayı o üsle çarpılır)\n${FN}(x) = m!/(m−n)!·x^(m−n) = ${mm}!/${n <= mm ? (mm - n) + '!' : '(negatif)'}·x^(m−n),  n ≤ m için.`,
        `── 2) The pattern ──\nCoefficient: ${mm}, ${mm}·${mm - 1}, ${mm}·${mm - 1}·${mm - 2}, ... (each step lowers the power by one and multiplies the coefficient by that power)\n${FN}(x) = m!/(m−n)!·x^(m−n) = ${mm}!/${n <= mm ? (mm - n) + '!' : '(negative)'}·x^(m−n),  for n ≤ m.`));
      if (n > mm) {
        out.push(T(`── 3) n = ${n} > m = ${mm} ──\n${mm}. türevde sabit ${S(fact(mm))} kalır, bir sonrakinde 0 olur. Dolayısıyla ${FN}(x) = 0.`, `── 3) n = ${n} > m = ${mm} ──\nAt the ${mm}-th derivative the constant ${S(fact(mm))} remains, and the next derivative is 0. Hence ${FN}(x) = 0.`));
      } else {
        out.push(T(`── 3) n = ${n} için ──\nKatsayı = ${mm}!/${mm - n}! = ${fact(mm)}/${fact(mm - n)} = ${m.co}\n${FN}(x) = ${m.co}${n === mm ? '' : 'x' + sup(mm - n)}`, `── 3) For n = ${n} ──\nCoefficient = ${mm}!/${mm - n}! = ${fact(mm)}/${fact(mm - n)} = ${m.co}\n${FN}(x) = ${m.co}${n === mm ? '' : 'x' + sup(mm - n)}`));
      }
      out.push(T(`── 4) x = ${at} için ──\n${FN}(${at}) = ${S(m.ans)}`, `── 4) At x = ${at} ──\n${FN}(${at}) = ${S(m.ans)}`));
      out.push(T(`── 5) Kontrol ──\n${n > mm ? 'Derecenin üstüne çıkınca sıfır: polinomun (m+1). türevi 0 ✓' : `Katsayıyı ${n} çarpanla elle de yazabiliriz: ${Array.from({ length: n }, (_, i) => mm - i).join('·')} = ${m.co} ✓`}`,
        `── 5) Check ──\n${n > mm ? 'Past the degree it is zero: the (m+1)-th derivative of a degree-m polynomial is 0 ✓' : `Writing the coefficient out with its ${n} factors: ${Array.from({ length: n }, (_, i) => mm - i).join('·')} = ${m.co} ✓`}`));
    } else {
      const list = ['f(x) = 1/x = x⁻¹', "f'(x) = −x⁻² = −1/x²", "f''(x) = 2x⁻³ = 2/x³", "f'''(x) = −6x⁻⁴ = −6/x⁴", 'f⁽⁴⁾(x) = 24x⁻⁵ = 24/x⁵'];
      out.push(T(`── 1) İlk türevler ──\n${list.join('\n')}`, `── 1) The first derivatives ──\n${list.join('\n')}`));
      out.push(T(`── 2) Örüntü ──\nKatsayılar 1, −1, 2, −6, 24: işaret her adımda değişir, büyüklük 1!, 2!, 3!, 4! ... gibi büyür; üs bir artar.\n${FN}(x) = (−1)ⁿ·n!/x^(n+1)`,
        `── 2) The pattern ──\nThe coefficients 1, −1, 2, −6, 24: the sign alternates each step and the size grows like 1!, 2!, 3!, 4! ...; the power of 1/x rises by one.\n${FN}(x) = (−1)ⁿ·n!/x^(n+1)`));
      out.push(T(`── 3) n = ${n} için ──\n${FN}(x) = ${n % 2 ? '−' : '+'}${n}!/x${supD(n + 1)} = ${n % 2 ? '−' : ''}${fact(n)}/x${supD(n + 1)}`, `── 3) For n = ${n} ──\n${FN}(x) = ${n % 2 ? '−' : '+'}${n}!/x${supD(n + 1)} = ${n % 2 ? '−' : ''}${fact(n)}/x${supD(n + 1)}`));
      out.push(T(`── 4) x = ${at} için ──\n${FN}(${at}) = ${n % 2 ? '−' : ''}${fact(n)}/(${at})${supD(n + 1)} = ${frS(m.ansFr)}`, `── 4) At x = ${at} ──\n${FN}(${at}) = ${n % 2 ? '−' : ''}${fact(n)}/(${at})${supD(n + 1)} = ${frS(m.ansFr)}`));
      out.push(T(`── 5) Kontrol ──\n${n}. türevin işareti (−1)${supD(n)} = ${n % 2 ? '−' : '+'}, x = ${at} için payda işareti ${(x0 < 0 && (n + 1) % 2) ? 'negatif' : 'pozitif'}; sonuç ${m.ans < 0 ? 'negatif' : 'pozitif'} ✓`,
        `── 5) Check ──\nThe sign of the ${n}-th derivative is (−1)${supD(n)} = ${n % 2 ? '−' : '+'}, the denominator at x = ${at} is ${(x0 < 0 && (n + 1) % 2) ? 'negative' : 'positive'}; the result is ${m.ans < 0 ? 'negative' : 'positive'} ✓`));
    }
    return out;
  }

  function stepsProd(p, m) {
    const out = [], at = x0S(p);
    if (p.sub === 'ep') {
      const { A, B, C, k } = p;
      const pc = [C, B, A], pd1 = pd(pc), kop = (k < 0 ? '− ' : '+ ') + (Math.abs(k) === 1 ? '' : Math.abs(k));
      out.push(T(`── 1) Çarpım kuralı için parçalar ──\nu = ${poly(pc)},  v = e^(${kxS(k)})\nu' = ${poly(pd1)},  u'' = ${S(2 * A)},  v' = ${cd(k)}e^(${kxS(k)}),  v'' = ${cd(k * k)}e^(${kxS(k)})`, `── 1) The pieces for the product rule ──\nu = ${poly(pc)},  v = e^(${kxS(k)})\nu' = ${poly(pd1)},  u'' = ${S(2 * A)},  v' = ${cd(k)}e^(${kxS(k)}),  v'' = ${cd(k * k)}e^(${kxS(k)})`));
      out.push(T(`── 2) f' ──\nf' = u'v + uv' = [(${poly(pd1)}) ${kop}(${poly(pc)})]·e^(${kxS(k)})\n   = (${poly(m.q)})·e^(${kxS(k)})`, `── 2) f' ──\nf' = u'v + uv' = [(${poly(pd1)}) ${kop}(${poly(pc)})]·e^(${kxS(k)})\n   = (${poly(m.q)})·e^(${kxS(k)})`));
      out.push(T(`── 3) f'' (çarpım kuralını bir kez daha) ──\nf'' = (q' + k·q)·e^(${kxS(k)}) = [(${poly(pd(m.q))}) ${kop}(${poly(m.q)})]·e^(${kxS(k)})\n    = (${poly(m.r)})·e^(${kxS(k)})\nKısayol: (uv)'' = u''v + 2u'v' + uv'' aynı sonucu verir.`, `── 3) f'' (product rule once more) ──\nf'' = (q' + k·q)·e^(${kxS(k)}) = [(${poly(pd(m.q))}) ${kop}(${poly(m.q)})]·e^(${kxS(k)})\n    = (${poly(m.r)})·e^(${kxS(k)})\nShortcut: (uv)'' = u''v + 2u'v' + uv'' gives the same result.`));
      const pv = pe(m.r, p.x0);
      out.push(T(`── 4) x = ${at} için ──\nf''(${at}) = (${S(pv)})·${expS(k * p.x0)} = ${p.x0 === 0 || pv === 0 ? S(pv) : S(pv) + '·' + expS(k * p.x0)} ≈ ${nf(m.ans, 3)}`, `── 4) At x = ${at} ──\nf''(${at}) = (${S(pv)})·${expS(k * p.x0)} = ${p.x0 === 0 || pv === 0 ? S(pv) : S(pv) + '·' + expS(k * p.x0)} ≈ ${nf(m.ans, 3)}`));
    } else if (p.sub === 'xs' || p.sub === 'xc') {
      const k = p.k, s = p.sub === 'xs', fn = s ? 'sin' : 'cos', gn = s ? 'cos' : 'sin';
      const F = `${fn}(${kxS(k)})`, G = `${gn}(${kxS(k)})`;
      const vp = lc([[s ? k : -k, G]]), vpp = lc([[-k * k, F]]);
      const f1 = lc([[1, F], [s ? k : -k, 'x·' + G]]);
      const f2 = lc([[s ? 2 * k : -2 * k, G], [-k * k, 'x·' + F]]);
      out.push(T(`── 1) Parçalar ──
u = x, v = ${F}
u' = 1, u'' = 0
v' = ${vp}, v'' = ${vpp}`, `── 1) The pieces ──
u = x, v = ${F}
u' = 1, u'' = 0
v' = ${vp}, v'' = ${vpp}`));
      out.push(T(`── 2) f' ──
f' = u'v + uv' = ${f1}`, `── 2) f' ──
f' = u'v + uv' = ${f1}`));
      out.push(T(`── 3) f'' ──
f'' = u''v + 2u'v' + uv'' = 0 + 2·(${vp}) + x·(${vpp})
    = ${f2}`, `── 3) f'' ──
f'' = u''v + 2u'v' + uv'' = 0 + 2·(${vp}) + x·(${vpp})
    = ${f2}`));
      const t = p.t, ang = piS(t * 2, 2), exact = s ? (t === 0 ? S(2 * k) : t === 0.5 ? piS(-k, 2) : S(-2 * k)) : (t === 0 ? '0' : t === 0.5 ? S(-2 * k) : piS(k, 1));
      out.push(T(`── 4) x = ${at} için ──\nkx = ${t === 0 ? '0' : ang}:  sin kx = ${nf(Math.sin(t * Math.PI), 0)},  cos kx = ${nf(Math.cos(t * Math.PI), 0)}\nf''(${at}) = ${exact} ≈ ${nf(m.ans, 3)}`, `── 4) At x = ${at} ──\nkx = ${t === 0 ? '0' : ang}:  sin kx = ${nf(Math.sin(t * Math.PI), 0)},  cos kx = ${nf(Math.cos(t * Math.PI), 0)}\nf''(${at}) = ${exact} ≈ ${nf(m.ans, 3)}`));
    } else {
      const { a, b, c, d } = p, D = m.D;
      const num = lc([[a, 'x'], [b, '']]), den = lc([[c, 'x'], [d, '']]);
      out.push(T(`── 1) Bölüm kuralı ──\nf = (${num})/(${den})\nf' = [a·(${den}) − (${num})·c]/(${den})²\n   = [${S(a)}(${den}) − ${P(S(c))}(${num})]/(${den})²\n   = ${S(D)}/(${den})²   (pay: ad − bc = ${S(a)}·${S(d)} − ${P(S(b))}·${P(S(c))} = ${S(D)})`,
        `── 1) Quotient rule ──\nf = (${num})/(${den})\nf' = [a·(${den}) − (${num})·c]/(${den})²\n   = [${S(a)}(${den}) − ${P(S(c))}(${num})]/(${den})²\n   = ${S(D)}/(${den})²   (numerator: ad − bc = ${S(a)}·${S(d)} − ${P(S(b))}·${P(S(c))} = ${S(D)})`));
      out.push(T(`── 2) f'' (kuvvet ve zincir kuralı) ──\nf' = ${S(D)}·(${den})⁻²\nf'' = ${S(D)}·(−2)·(${den})⁻³·${S(c)} = ${S(-2 * c * D)}/(${den})³`, `── 2) f'' (power and chain rules) ──\nf' = ${S(D)}·(${den})⁻²\nf'' = ${S(D)}·(−2)·(${den})⁻³·${S(c)} = ${S(-2 * c * D)}/(${den})³`));
      const gv = c * p.x0 + d;
      out.push(T(`── 3) x = ${at} için ──\n${den} = ${S(gv)}\nf''(${at}) = ${S(-2 * c * D)}/(${S(gv)})³ = ${S(-2 * c * D)}/${S(gv * gv * gv)} = ${frS(m.ansFr)}`, `── 3) At x = ${at} ──\n${den} = ${S(gv)}\nf''(${at}) = ${S(-2 * c * D)}/(${S(gv)})³ = ${S(-2 * c * D)}/${S(gv * gv * gv)} = ${frS(m.ansFr)}`));
    }
    out.push(numCheck(m, p.sub === 'xs' || p.sub === 'xc' ? m.xv : p.x0, m.ans));
    return out;
  }

  function stepsInterp(p, m) {
    const out = [];
    out.push(T(`── 1) f' ve f'' ──\nf(x) = ${poly(p.cs)}\nf'(x) = ${poly(m.c1)}\nf''(x) = ${poly(m.c2)}`, `── 1) f' and f'' ──\nf(x) = ${poly(p.cs)}\nf'(x) = ${poly(m.c1)}\nf''(x) = ${poly(m.c2)}`));
    if (p.sub === 'cub') {
      const x1 = -p.t;
      const eq = p.t === 0 ? '6x = 0 → x = 0' : `6x ${p.t < 0 ? '−' : '+'} ${Math.abs(6 * p.t)} = 0 → 6(x ${p.t < 0 ? '−' : '+'} ${Math.abs(p.t)}) = 0 → x = ${S(x1)}`;
      out.push(T(`── 2) f'' = 0 ──
${eq}`, `── 2) f'' = 0 ──
${eq}`));
      out.push(T(`── 3) İşaret tablosu ──\nx < ${S(x1)}:  f'' < 0 → aşağı doğru açık (∩)\nx > ${S(x1)}:  f'' > 0 → yukarı doğru açık (∪)`, `── 3) Sign table ──\nx < ${S(x1)}:  f'' < 0 → concave down (∩)\nx > ${S(x1)}:  f'' > 0 → concave up (∪)`));
      const y1 = m.f(x1);
      out.push(T(`── 4) Büküm noktası ──\nf'' işaret değiştirdiği için x = ${S(x1)} bir büküm noktasıdır: (${S(x1)}, ${S(y1)}).\nSonuç: (−∞, ${S(x1)}) aralığında ∩, (${S(x1)}, ∞) aralığında ∪.`, `── 4) Inflection point ──\nSince f'' changes sign, x = ${S(x1)} is an inflection point: (${S(x1)}, ${S(y1)}).\nResult: ∩ on (−∞, ${S(x1)}), ∪ on (${S(x1)}, ∞).`));
    } else {
      out.push(T(`── 2) f'' = 0 ──\n12x² − 12 = 0 → 12(x − 1)(x + 1) = 0 → x = −1 ya da x = 1`, `── 2) f'' = 0 ──\n12x² − 12 = 0 → 12(x − 1)(x + 1) = 0 → x = −1 or x = 1`));
      out.push(T(`── 3) İşaret tablosu ──\nx < −1:  f'' > 0 (∪)\n−1 < x < 1:  f'' < 0 (∩)\nx > 1:  f'' > 0 (∪)`, `── 3) Sign table ──\nx < −1:  f'' > 0 (∪)\n−1 < x < 1:  f'' < 0 (∩)\nx > 1:  f'' > 0 (∪)`));
      out.push(T(`── 4) Büküm noktaları ──\nf'' iki noktada da işaret değiştirir: (−1, ${S(m.f(-1))}) ve (1, ${S(m.f(1))}).\nSonuç: (−∞, −1) ve (1, ∞) aralıklarında ∪; (−1, 1) aralığında ∩.`, `── 4) Inflection points ──\nf'' changes sign at both: (−1, ${S(m.f(-1))}) and (1, ${S(m.f(1))}).\nResult: ∪ on (−∞, −1) and (1, ∞); ∩ on (−1, 1).`));
    }
    out.push(T(`── 5) Grafikle kontrol ──\nKaydırıcıyı büküm noktasının iki yanına taşıdığımızda f'' (yeşil eğri) x eksenini keser, osculating parabol (altın kesikli) açılma yönünü değiştirir. Aynı yerde f' (mor) yerel en küçük/en büyük değerini alır.`,
      `── 5) Check on the graph ──\nWhen we move the slider across the inflection point, f'' (green curve) crosses the x-axis and the osculating parabola (dashed gold) flips its opening direction. At the same place f' (purple) has a local minimum/maximum.`));
    return out;
  }

  function stepsMotion(p, m) {
    const out = [], t0 = p.x0, ts = p.tstar, al = p.al;
    const vS = poly(m.c1, 't'), aS = poly(m.c2, 't');
    out.push(T(`── 1) Konum, hız, ivme, sarsım ──\ns(t) = ${poly(m.cs, 't')}  (m)\nv(t) = s'(t) = ${vS}  (m/s)\na(t) = s''(t) = ${aS}  (m/s²)\nj(t) = s'''(t) = ${S(6 * al)}  (m/s³, sabit)`,
      `── 1) Position, velocity, acceleration, jerk ──\ns(t) = ${poly(m.cs, 't')}  (m)\nv(t) = s'(t) = ${vS}  (m/s)\na(t) = s''(t) = ${aS}  (m/s²)\nj(t) = s'''(t) = ${S(6 * al)}  (m/s³, constant)`));
    out.push(T(`── 2) t = ${S(t0)} s anında ──\nv(${S(t0)}) = ${S(pe(m.c1, t0))} m/s\na(${S(t0)}) = ${S(pe(m.c2, t0))} m/s²\nj = ${S(6 * al)} m/s³`, `── 2) At t = ${S(t0)} s ──\nv(${S(t0)}) = ${S(pe(m.c1, t0))} m/s\na(${S(t0)}) = ${S(pe(m.c2, t0))} m/s²\nj = ${S(6 * al)} m/s³`));
    out.push(T(`── 3) İvme ne zaman sıfır? ──\n${aS} = 0 → t = ${S(ts)} s`, `── 3) When is the acceleration zero? ──\n${aS} = 0 → t = ${S(ts)} s`));
    const bef = al > 0 ? ['negatif', 'pozitif'] : ['pozitif', 'negatif'], befE = al > 0 ? ['negative', 'positive'] : ['positive', 'negative'];
    out.push(T(`── 4) İvmenin işareti ──\nSarsım ${S(6 * al)} ${al > 0 ? '> 0' : '< 0'} olduğundan ivme ${al > 0 ? 'artan' : 'azalan'} bir doğru gibi değişir.\nt < ${S(ts)}: ivme ${bef[0]};  t > ${S(ts)}: ivme ${bef[1]}.\nBu, s(t) grafiğinde t = ${S(ts)} s'de bir büküm noktası demektir (s'' işaret değiştirir).`,
      `── 4) Sign of the acceleration ──\nThe jerk ${S(6 * al)} ${al > 0 ? '> 0' : '< 0'}, so the acceleration changes like a ${al > 0 ? 'rising' : 'falling'} straight line.\nt < ${S(ts)}: acceleration ${befE[0]};  t > ${S(ts)}: acceleration ${befE[1]}.\nThis means the graph of s(t) has an inflection point at t = ${S(ts)} s (s'' changes sign).`));
    out.push(numCheck(m, t0, pe(m.c2, t0)));
    return out;
  }
  function solveSteps(p) {
    const m = model(p);
    switch (p.kind) {
      case 'poly': return stepsPoly(p, m);
      case 'nth': return stepsNth(p, m);
      case 'prod': return stepsProd(p, m);
      case 'interp': return stepsInterp(p, m);
      default: return stepsMotion(p, m);
    }
  }

  // ---------- drawing ----------
  function draw(canvas, p) {
    try {
      canvas.setViewport(-4, 4, -8, 8);
      const m = model(p);
      const acc = canvas.accent(), pur = canvas.purple(), grn = canvas.green(), gold = canvas.gold(), org = canvas.orange();
      const mo = p.kind === 'motion';
      const nm = mo ? ['s', 'v', 'a'] : ['f', "f'", "f''"];
      canvas.addFunction({ evaluator: (x) => safe(m.f(x)), color: acc, thickness: 3, label: nm[0] });
      canvas.addFunction({ evaluator: (x) => safe(m.d1(x)), color: pur, thickness: 2.5, label: nm[1] });
      canvas.addFunction({ evaluator: (x) => safe(m.d2(x)), color: grn, thickness: 2.5, label: nm[2] });
      if (p.kind === 'nth' && (p.fam === 'inv')) canvas.addGuideLine({ axis: 'vertical', position: 0, color: canvas.gray() });
      if (p.kind === 'prod' && p.sub === 'quot' && p.c !== 0) canvas.addGuideLine({ axis: 'vertical', position: -p.d / p.c, color: canvas.gray() });
      const x = p.xs, y = m.f(x), d1 = m.d1(x), d2 = m.d2(x);
      if (isFinite(y) && isFinite(d1) && isFinite(d2)) {
        canvas.addFunction({ evaluator: (t) => safe(y + d1 * (t - x)), color: org, thickness: 2, dashed: true });
        canvas.addFunction({ evaluator: (t) => (Math.abs(t - x) <= 2 ? safe(y + d1 * (t - x) + d2 / 2 * (t - x) * (t - x)) : NaN), color: gold, thickness: 2, dashed: true });
        const up = d2 > 1e-9 ? ' ∪' : d2 < -1e-9 ? ' ∩' : '';
        canvas.addMarker({ x, y, color: acc, radius: 6, label: `${nm[0]} = ${nf(y, 2)}` });
        canvas.addMarker({ x, y: d1, color: pur, radius: 5, label: `${nm[1]} = ${nf(d1, 2)}` });
        canvas.addMarker({ x, y: d2, color: grn, radius: 6, label: `${nm[2]} = ${nf(d2, 2)}${up}` });
      }
    } catch (e) { /* never throw */ }
  }

  // ---------- controls ----------
  let selHandle = null;
  function buildControls(rightCol, getProblem, h) {
    const names = {
      poly: Tx('Polinom: f\'\', f\'\'\' ve f\'\'(x₀)', 'Polynomial: f\'\', f\'\'\' and f\'\'(x₀)'), nth: Tx('n. türev örüntüsü', 'n-th derivative pattern'),
      prod: Tx('Çarpım / bölümün ikinci türevi', 'Second derivative of a product / quotient'), interp: Tx('f\'\' işareti ve eğrilik', 'Sign of f\'\' and concavity'),
      motion: Tx('Hız, ivme, sarsım', 'Velocity, acceleration, jerk'),
    };
    selHandle = h.addSelect({
      options: ['poly', 'nth', 'prod', 'interp', 'motion'].map((v) => ({ label: names[v], value: v })),
      get: () => getProblem().kind,
      set: (v) => { Object.assign(getProblem(), genKind(new Rng(), v)); },
    });
    h.addSlider({
      caption: Tx('İncelenen nokta x (teğet ve parabol)', 'Probe point x (tangent and parabola)'), min: -4, max: 4, step: 0.25,
      get: () => getProblem().xs,
      set: (v) => { getProblem().xs = Math.max(-4, Math.min(4, v)); },
    });
  }

  Topics.register('derivatives', {
    id: 'higherDerivatives',
    tabTitle: () => Tx('Yüksek Mertebeden Türevler', 'Higher-Order Derivatives'),
    concept,
    problemStatement: statement,
    createProblem,
    solveSteps,
    draw: (canvas, p) => { try { if (selHandle && selHandle.refreshFromModel) selHandle.refreshFromModel(); } catch (e) { /* ignore */ } draw(canvas, p); },
    buildControls,
    links: [
      { match: /^• (f' eğimi verir|f' gives the slope)/, make: (rng) => genKind(rng, 'interp') },
      { match: /^• (Konum s\(t\) için|For a position s\(t\))/, make: (rng) => genKind(rng, 'motion') },
      { match: /^• (f'' işaret değiştiren|A point where f'' changes sign)/, make: (rng) => genKind(rng, 'interp') },
      { match: /^(Polinom|Polynomial): /, make: (rng) => genKind(rng, 'poly') },
      { match: /^eᵏˣ: /, make: (rng) => genKind(rng, 'nth', { fam: 'exp' }) },
      { match: /^(sin kx ve cos kx|sin kx and cos kx):/, make: (rng) => genKind(rng, 'nth', { fam: ['sin', 'cos'] }) },
      { match: /^xᵐ: /, make: (rng) => genKind(rng, 'nth', { fam: 'pow' }) },
      { match: /^1\/x: /, make: (rng) => genKind(rng, 'nth', { fam: 'inv' }) },
      { match: /^2\) (Çarpımda|For a product)/, make: (rng) => genKind(rng, 'prod') },
    ],
    _model: model,
  });
})();
