// Süreklilik: Aralıklar, Parametre, Ara Değer / Continuity: Intervals, Parameters & IVT.
// problem = { type: 'domain'|'param'|'ivt', kind, v: [numbers], ... }.
//  domain : on which intervals is f continuous? (rational / sqrt / log / tan / piecewise, one-sided continuity)
//  param  : constants that make a piecewise function continuous (solve L = R = f(c)), with a "try k" slider
//  ivt    : Intermediate Value Theorem - root / value existence on [a,b], bisection narrowing, y = N line
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const N2 = (v) => fmt2(v);
  const PI = Math.PI;
  let forcedType = 'random';
  let sliderRows = [];
  let offLang = null;

  // ---------------------------------------------------------------- helpers
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
  // reduced fraction string ("3", "-7/2")
  function frS(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d); n /= g; d /= g;
    return d === 1 ? String(n) : n + '/' + d;
  }
  // fraction with decimal hint when not an integer
  function frA(n, d) {
    const s = frS(n, d);
    return s.indexOf('/') >= 0 ? s + ' (≈ ' + N2(n / d) + ')' : s;
  }
  // number with ≤4 decimals, trailing zeros removed
  function F4(v) {
    if (!isFinite(v)) return String(v);
    let s = v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }
  const sg = (v) => (v < 0 ? '−' + N2(-v) : N2(v)); // signed number with true minus
  const par = (v) => (v < 0 ? '(−' + N2(-v) + ')' : N2(v)); // parenthesise negatives
  // "x + 3", "x − 2", "x"
  function xPlus(n, name) {
    const x = name || 'x';
    if (n === 0) return x;
    return n > 0 ? x + ' + ' + N2(n) : x + ' − ' + N2(-n);
  }
  // linear αx + β
  function linStr(al, be) {
    let s = al === 1 ? 'x' : al === -1 ? '−x' : N2(al) + 'x';
    if (be > 0) s += ' + ' + N2(be); else if (be < 0) s += ' − ' + N2(-be);
    return s;
  }
  // polynomial from coefficients highest -> lowest degree
  function polyStr(cs) {
    const deg = cs.length - 1;
    let out = '';
    cs.forEach((c, i) => {
      const d = deg - i;
      if (Math.abs(c) < 1e-12) return;
      const a = Math.abs(c);
      let t;
      if (d === 0) t = N2(a);
      else t = (a === 1 ? '' : N2(a)) + 'x' + (d === 1 ? '' : d === 2 ? '²' : '³');
      if (out === '') out = (c < 0 ? '−' : '') + t;
      else out += (c < 0 ? ' − ' : ' + ') + t;
    });
    return out === '' ? '0' : out;
  }
  const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
  function yRange(fns, lo, hi, extra, cap) {
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i <= 120; i++) {
      const u = lo + (hi - lo) * i / 120;
      for (const f of fns) {
        const y = f(u);
        if (Number.isFinite(y)) { if (y < mn) mn = y; if (y > mx) mx = y; }
      }
    }
    (extra || []).forEach((y) => { if (Number.isFinite(y)) { if (y < mn) mn = y; if (y > mx) mx = y; } });
    if (!Number.isFinite(mn)) { mn = -5; mx = 5; }
    if (mx - mn < 2) { const mid = (mx + mn) / 2; mn = mid - 1; mx = mid + 1; }
    const pad = (mx - mn) * 0.18;
    const c = cap || 1e3;
    return [Math.max(-c, mn - pad), Math.min(c, mx + pad)];
  }
  const Hdr = (n, tr, en) => '── ' + n + ') ' + tx(tr, en) + ' ──\n';
  const pick = (rng, arr) => arr[rng.nextInt(0, arr.length)];
  const int = (rng, lo, hi) => rng.nextInt(lo, hi + 1);

  // ================================================================= TYPE A: where is f continuous?
  // each kind: make(rng) -> v ; specs ; expr(v) ; f(v) ; analysis(v) ; draw(canvas, v)
  const A = {};

  A.rational = {
    make: (rng) => [int(rng, -4, 2), int(rng, 1, 4), int(rng, -4, 4)],
    specs: () => [
      { cap: tx('a (ilk kök)', 'a (first zero of the denominator)'), min: -5, max: 3, step: 1, idx: 0 },
      { cap: tx('aralık g (b = a + g)', 'gap g (b = a + g)'), min: 1, max: 5, step: 1, idx: 1 },
      { cap: tx('n (payda: x + n)', 'n (numerator x + n)'), min: -5, max: 5, step: 1, idx: 2 },
    ],
    pts: (v) => ({ a: v[0], b: v[0] + v[1], n: v[2] }),
    expr: (v) => { const p = A.rational.pts(v); return '(' + xPlus(p.n) + ') / ((' + xPlus(-p.a) + ')(' + xPlus(-p.b) + '))'; },
    f: (v) => { const p = A.rational.pts(v); return safe((x) => { const d = (x - p.a) * (x - p.b); return Math.abs(d) < 1e-9 ? NaN : (x + p.n) / d; }); },
    analysis: (v) => {
      const { a, b, n } = A.rational.pts(v);
      const rem = (-n === a) ? a : (-n === b) ? b : null;
      const other = rem === null ? null : (rem === a ? b : a);
      const denTR = `(x ${a >= 0 ? '−' : '+'} ${N2(Math.abs(a))})(x ${b >= 0 ? '−' : '+'} ${N2(Math.abs(b))})`;
      const ans = `(−∞, ${N2(a)}) ∪ (${N2(a)}, ${N2(b)}) ∪ (${N2(b)}, ∞)`;
      let disc = tx(
        `x = ${N2(a)} ve x = ${N2(b)}: f burada tanımsız, dolayısıyla süreksiz. Pay bu noktaların hiçbirinde sıfır değil: ikisi de DÜŞEY ASİMPTOT (sonsuz süreksizlik).`,
        `x = ${N2(a)} and x = ${N2(b)}: f is not defined there, hence discontinuous. The numerator does not vanish at either point: both are VERTICAL ASYMPTOTS (infinite discontinuities).`);
      if (rem !== null) {
        disc = tx(
          `x = ${N2(rem)}: pay da sıfır (${xPlus(n)} = 0) → (x − ${N2(rem)}) sadeleşir: f(x) = ${n === -a ? '1/(x − ' + N2(b) + ')' : '1/(x − ' + N2(a) + ')'} (x ≠ ${N2(rem)}). Limit ${N2(1 / (rem - other))} sonlu, f(${N2(rem)}) tanımsız: GİDERİLEBİLİR süreksizlik (delik, hollow nokta). x = ${N2(other)}: DÜŞEY ASİMPTOT. İkisi de tanım kümesinde olmadığı için süreklilik aralıkları yine aynıdır.`,
          `x = ${N2(rem)}: the numerator is also zero (${xPlus(n)} = 0) → the factor (x − ${N2(rem)}) cancels: f(x) = ${n === -a ? '1/(x − ' + N2(b) + ')' : '1/(x − ' + N2(a) + ')'} (x ≠ ${N2(rem)}). The limit ${N2(1 / (rem - other))} is finite but f(${N2(rem)}) is not defined: a REMOVABLE discontinuity (a hole, hollow dot). x = ${N2(other)}: VERTICAL ASYMPTOTE. Neither point is in the domain, so the intervals of continuity are still the same.`);
      }
      return {
        blocks: tx('Pay ve payda polinomdur; polinomlar her yerde süreklidir. İki sürekli fonksiyonun oranı, payda ≠ 0 olan her yerde süreklidir (rasyonel fonksiyon kendi tanım kümesinde süreklidir).',
          'The numerator and denominator are polynomials, continuous everywhere. A quotient of continuous functions is continuous wherever the denominator ≠ 0 (a rational function is continuous on its domain).'),
        cond: tx(`Tek kısıt: payda ≠ 0, yani ${denTR} ≠ 0.`, `The only restriction: denominator ≠ 0, i.e. ${denTR} ≠ 0.`),
        solve: tx(`${denTR} = 0 ⇒ x = ${N2(a)} veya x = ${N2(b)}. Bu iki nokta tanım kümesinden çıkarılır.`, `${denTR} = 0 ⇒ x = ${N2(a)} or x = ${N2(b)}. These two points are removed from the domain.`),
        ans, end: tx('Aralıkların uçlarında (−∞, ∞ ve a, b) açık aralık kullanılır; tanım kümesinde olmayan noktada tek taraflı süreklilik sorulmaz.', 'The intervals are open at a and b (and at ±∞); one-sided continuity is not asked at points outside the domain.'),
        disc,
      };
    },
    draw: (canvas, v) => {
      const { a, b, n } = A.rational.pts(v);
      canvas.setViewport(a - 4, b + 4, -8, 8);
      canvas.addFunction({ evaluator: A.rational.f(v), color: canvas.accent(), thickness: 3 });
      canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gray(), label: 'x = ' + N2(a) });
      canvas.addGuideLine({ axis: 'vertical', position: b, color: canvas.gray(), label: 'x = ' + N2(b) });
      if (-n === a) canvas.addMarker({ x: a, y: 1 / (a - b), color: canvas.gold(), hollow: true, radius: 7, label: tx('delik', 'hole') });
      if (-n === b) canvas.addMarker({ x: b, y: 1 / (b - a), color: canvas.gold(), hollow: true, radius: 7, label: tx('delik', 'hole') });
    },
  };

  // sqrt(alpha x + beta) and ln(alpha x + beta)
  function linKind(isLog) {
    return {
      make: (rng) => [pick(rng, [-3, -2, -1, 1, 2, 3]), int(rng, -6, 6)],
      specs: () => [
        { cap: tx('α (x katsayısı, 0 olamaz)', 'α (coefficient of x, not 0)'), min: -3, max: 3, step: 1, idx: 0 },
        { cap: 'β', min: -6, max: 6, step: 1, idx: 1 },
      ],
      norm: (v) => { if (v[0] === 0) v[0] = 1; },
      expr: (v) => (isLog ? 'ln(' : '√(') + linStr(v[0], v[1]) + ')',
      f: (v) => safe((x) => { const u = v[0] * x + v[1]; return isLog ? (u > 1e-12 ? Math.log(u) : NaN) : (u >= 0 ? Math.sqrt(u) : NaN); }),
      analysis: (v) => {
        const al = v[0], be = v[1];
        const e = -be / al, eS = frS(-be, al), eA = frA(-be, al);
        const inner = linStr(al, be);
        const pos = al > 0;
        const rel = isLog ? '>' : '≥';
        const flipRel = pos ? rel : (isLog ? '<' : '≤');
        const ans = isLog ? (pos ? `(${eS}, ∞)` : `(−∞, ${eS})`) : (pos ? `[${eS}, ∞)` : `(−∞, ${eS}]`);
        const solveTR = `${inner} ${rel} 0 ⇒ ${linStr(al, 0)} ${rel} ${-be}` + (pos ? ` ⇒ x ${flipRel} ${eS}.` : ` ⇒ x ${flipRel} ${eS}  (negatif sayıya bölünce eşitsizlik yön değiştirir).`);
        const solveEN = `${inner} ${rel} 0 ⇒ ${linStr(al, 0)} ${rel} ${-be}` + (pos ? ` ⇒ x ${flipRel} ${eS}.` : ` ⇒ x ${flipRel} ${eS}  (dividing by a negative number flips the inequality).`);
        return {
          blocks: isLog
            ? tx('ln u, u > 0 için süreklidir; içteki αx + β bir polinomdur (sürekli). Sürekli fonksiyonların bileşkesi sürekli olduğundan f tanım kümesinin her noktasında süreklidir.', 'ln u is continuous for u > 0; the inside αx + β is a polynomial (continuous). A composite of continuous functions is continuous, so f is continuous at every point of its domain.')
            : tx('√u, u ≥ 0 için süreklidir (u = 0\'da sağdan süreklilik); içteki αx + β polinomdur. Bileşke olduğundan f tanım kümesinin her noktasında süreklidir.', '√u is continuous for u ≥ 0 (at u = 0 from the right); the inside αx + β is a polynomial. As a composite, f is continuous at every point of its domain.'),
          cond: isLog ? tx(`ln'in içi kesinlikle pozitif olmalı: ${inner} > 0.`, `The argument of ln must be strictly positive: ${inner} > 0.`)
            : tx(`Karekökün içi negatif olamaz: ${inner} ≥ 0.`, `The radicand cannot be negative: ${inner} ≥ 0.`),
          solve: tx(solveTR, solveEN),
          ans,
          end: isLog
            ? tx(`x = ${eA} tanım kümesinde DEĞİL (ln 0 tanımsız). Bu uçta f sınırsız azalır: lim ln(${inner}) = −∞, düşey asimptot x = ${eS}. Açık uçta süreklilik sorulmaz.`, `x = ${eA} is NOT in the domain (ln 0 is not defined). At this end f decreases without bound: lim ln(${inner}) = −∞, vertical asymptote x = ${eS}. Continuity is not asked at an open end.`)
            : tx(`x = ${eA} tanım kümesindedir (f = √0 = 0). ${pos ? 'Sağdan' : 'Soldan'} limit: lim √(${inner}) = √0 = 0 = f(${eS}). Dolayısıyla f bu uçta ${pos ? 'SAĞDAN' : 'SOLDAN'} süreklidir; aralığın kapalı ucudur.`, `x = ${eA} is in the domain (f = √0 = 0). The ${pos ? 'right' : 'left'}-hand limit: lim √(${inner}) = √0 = 0 = f(${eS}). So f is continuous from the ${pos ? 'RIGHT' : 'LEFT'} at this end; it is the closed end of the interval.`),
          disc: tx(`Tanım kümesi dışındaki her nokta süreksizdir (f orada tanımsız). ${isLog ? 'x = ' + eS + ' düşey asimptottur.' : 'f, x = ' + eS + ' noktasından sonra reel değildir.'}`, `Every point outside the domain is a discontinuity (f is not defined there). ${isLog ? 'x = ' + eS + ' is a vertical asymptote.' : 'f is not real beyond x = ' + eS + '.'}`),
        };
      },
      draw: (canvas, v) => {
        const e = -v[1] / v[0];
        canvas.setViewport(e - 5, e + 5, isLog ? -5 : -1.5, isLog ? 5 : 5);
        canvas.addFunction({ evaluator: linKind(isLog).f(v), color: canvas.accent(), thickness: 3 });
        if (isLog) canvas.addGuideLine({ axis: 'vertical', position: e, color: canvas.gray(), label: 'x = ' + N2(e) });
        else canvas.addMarker({ x: e, y: 0, color: canvas.gold(), radius: 7, label: tx('kapalı uç', 'closed end') });
      },
    };
  }
  A.sqrtLin = linKind(false);
  A.logLin = linKind(true);

  function sqrtQuad(outside) {
    return {
      make: (rng) => [int(rng, 1, 5)],
      specs: () => [{ cap: 'k', min: 1, max: 5, step: 1, idx: 0 }],
      expr: (v) => outside ? `√(x² − ${N2(v[0] * v[0])})` : `√(${N2(v[0] * v[0])} − x²)`,
      f: (v) => safe((x) => { const u = outside ? x * x - v[0] * v[0] : v[0] * v[0] - x * x; return u >= 0 ? Math.sqrt(u) : NaN; }),
      analysis: (v) => {
        const k = v[0], k2 = k * k;
        return {
          blocks: tx('x² bir polinomdur; √u, u ≥ 0 için süreklidir. Bileşke olarak f, tanım kümesinde süreklidir (kapalı uçlarda tek taraflı).', 'x² is a polynomial; √u is continuous for u ≥ 0. As a composite, f is continuous on its domain (one-sided at closed ends).'),
          cond: outside ? tx(`x² − ${N2(k2)} ≥ 0.`, `x² − ${N2(k2)} ≥ 0.`) : tx(`${N2(k2)} − x² ≥ 0.`, `${N2(k2)} − x² ≥ 0.`),
          solve: outside
            ? tx(`x² ≥ ${N2(k2)} ⇒ |x| ≥ ${N2(k)} ⇒ x ≤ −${N2(k)} veya x ≥ ${N2(k)} (iki ayrık aralık).`, `x² ≥ ${N2(k2)} ⇒ |x| ≥ ${N2(k)} ⇒ x ≤ −${N2(k)} or x ≥ ${N2(k)} (two separate intervals).`)
            : tx(`x² ≤ ${N2(k2)} ⇒ |x| ≤ ${N2(k)} ⇒ −${N2(k)} ≤ x ≤ ${N2(k)}.`, `x² ≤ ${N2(k2)} ⇒ |x| ≤ ${N2(k)} ⇒ −${N2(k)} ≤ x ≤ ${N2(k)}.`),
          ans: outside ? `(−∞, −${N2(k)}] ∪ [${N2(k)}, ∞)` : `[−${N2(k)}, ${N2(k)}]`,
          end: outside
            ? tx(`x = −${N2(k)}: soldan limit √(x² − ${N2(k2)}) → 0 = f(−${N2(k)}) ⇒ SOLDAN sürekli. x = ${N2(k)}: sağdan limit 0 = f(${N2(k)}) ⇒ SAĞDAN sürekli. Aradaki (−${N2(k)}, ${N2(k)}) tanım dışıdır.`, `x = −${N2(k)}: the left limit √(x² − ${N2(k2)}) → 0 = f(−${N2(k)}) ⇒ continuous from the LEFT. x = ${N2(k)}: the right limit is 0 = f(${N2(k)}) ⇒ continuous from the RIGHT. The gap (−${N2(k)}, ${N2(k)}) is outside the domain.`)
            : tx(`x = −${N2(k)}: sağdan limit 0 = f(−${N2(k)}) ⇒ SAĞDAN sürekli. x = ${N2(k)}: soldan limit 0 = f(${N2(k)}) ⇒ SOLDAN sürekli. Dolayısıyla f, kapalı [−${N2(k)}, ${N2(k)}] aralığında süreklidir (uçlarda tek taraflı anlamda).`, `x = −${N2(k)}: the right limit is 0 = f(−${N2(k)}) ⇒ continuous from the RIGHT. x = ${N2(k)}: the left limit is 0 = f(${N2(k)}) ⇒ continuous from the LEFT. Hence f is continuous on the closed interval [−${N2(k)}, ${N2(k)}] (one-sided at the ends).`),
          disc: tx('Tanım kümesi dışındaki noktalarda f tanımsızdır (reel değil), yani süreksizdir.', 'Outside the domain f is not defined (not real), hence discontinuous there.'),
        };
      },
      draw: (canvas, v) => {
        const k = v[0];
        canvas.setViewport(-k - 3, k + 3, -2, outside ? Math.sqrt(6 * k + 9) + 1 : k + 2);
        canvas.addFunction({ evaluator: sqrtQuad(outside).f(v), color: canvas.accent(), thickness: 3 });
        canvas.addMarker({ x: -k, y: 0, color: canvas.gold(), radius: 7, label: '(−' + N2(k) + ', 0)' });
        canvas.addMarker({ x: k, y: 0, color: canvas.gold(), radius: 7, label: '(' + N2(k) + ', 0)' });
      },
    };
  }
  A.sqrtOut = sqrtQuad(true);
  A.sqrtIn = sqrtQuad(false);

  A.sqrtOverX = {
    make: (rng) => [int(rng, -4, 4), int(rng, 1, 5)],
    specs: () => [
      { cap: tx('a (√(x + a))', 'a (√(x + a))'), min: -4, max: 4, step: 1, idx: 0 },
      { cap: tx('g (b = g − a)', 'g (b = g − a)'), min: 1, max: 5, step: 1, idx: 1 },
    ],
    b: (v) => v[1] - v[0],
    expr: (v) => `√(${xPlus(v[0])}) / (${xPlus(-A.sqrtOverX.b(v))})`,
    f: (v) => safe((x) => { const b = A.sqrtOverX.b(v); const u = x + v[0]; return (u < 0 || Math.abs(x - b) < 1e-9) ? NaN : Math.sqrt(u) / (x - b); }),
    analysis: (v) => {
      const a = v[0], b = A.sqrtOverX.b(v), lo = -a;
      const ans = `[${N2(lo)}, ${N2(b)}) ∪ (${N2(b)}, ∞)`;
      return {
        blocks: tx('√(x + a) tanım kümesinde süreklidir; x − b polinomdur. Sürekli fonksiyonların oranı, payda ≠ 0 yerlerde süreklidir.', '√(x + a) is continuous on its domain; x − b is a polynomial. A quotient of continuous functions is continuous where the denominator ≠ 0.'),
        cond: tx(`İki kısıt birlikte: (i) karekök: ${xPlus(a)} ≥ 0, (ii) payda: ${xPlus(-b)} ≠ 0.`, `Two restrictions together: (i) square root: ${xPlus(a)} ≥ 0, (ii) denominator: ${xPlus(-b)} ≠ 0.`),
        solve: tx(`(i) x ≥ ${N2(lo)}.  (ii) x ≠ ${N2(b)}.  ${N2(b)} > ${N2(lo)} olduğundan çıkarılan nokta aralığın içindedir: [${N2(lo)}, ∞) \\ {${N2(b)}}.`, `(i) x ≥ ${N2(lo)}.  (ii) x ≠ ${N2(b)}.  Since ${N2(b)} > ${N2(lo)}, the removed point lies inside the interval: [${N2(lo)}, ∞) \\ {${N2(b)}}.`),
        ans,
        end: tx(`x = ${N2(lo)}: f = 0/(${N2(lo - b)}) = 0 ve sağdan limit de 0 ⇒ SAĞDAN sürekli (kapalı uç).`, `x = ${N2(lo)}: f = 0/(${N2(lo - b)}) = 0 and the right limit is also 0 ⇒ continuous from the RIGHT (closed end).`),
        disc: tx(`x = ${N2(b)}: pay √(${N2(b + a)}) = √${N2(b + a)} ≠ 0, payda 0 ⇒ DÜŞEY ASİMPTOT; tanım dışı, süreksiz. x < ${N2(lo)}: f reel değil.`, `x = ${N2(b)}: numerator √(${N2(b + a)}) = √${N2(b + a)} ≠ 0, denominator 0 ⇒ VERTICAL ASYMPTOTE; outside the domain, discontinuous. For x < ${N2(lo)}: f is not real.`),
      };
    },
    draw: (canvas, v) => {
      const b = A.sqrtOverX.b(v);
      canvas.setViewport(-v[0] - 2, b + 6, -8, 8);
      canvas.addFunction({ evaluator: A.sqrtOverX.f(v), color: canvas.accent(), thickness: 3 });
      canvas.addGuideLine({ axis: 'vertical', position: b, color: canvas.gray(), label: 'x = ' + N2(b) });
      canvas.addMarker({ x: -v[0], y: 0, color: canvas.gold(), radius: 7, label: tx('kapalı uç', 'closed end') });
    },
  };

  A.tan = {
    make: (rng) => [int(rng, 1, 3)],
    specs: () => [{ cap: 'm (tan(mx))', min: 1, max: 3, step: 1, idx: 0 }],
    expr: (v) => (v[0] === 1 ? 'tan x' : `tan(${v[0]}x)`),
    f: (v) => safe((x) => { const c = Math.cos(v[0] * x); return Math.abs(c) < 1e-9 ? NaN : Math.sin(v[0] * x) / c; }),
    analysis: (v) => {
      const m = v[0], q = 2 * m;
      const pt = m === 1 ? 'π/2' : 'π/' + q;
      const per = m === 1 ? 'π' : 'π/' + m;
      return {
        blocks: tx('sin ve cos her yerde süreklidir; mx içteki doğrusal fonksiyondur. tan(mx) = sin(mx)/cos(mx) oranı, cos(mx) ≠ 0 olan her yerde süreklidir.', 'sin and cos are continuous everywhere; mx is a linear inside function. The quotient tan(mx) = sin(mx)/cos(mx) is continuous wherever cos(mx) ≠ 0.'),
        cond: tx('cos(' + (m === 1 ? 'x' : m + 'x') + ') ≠ 0.', 'cos(' + (m === 1 ? 'x' : m + 'x') + ') ≠ 0.'),
        solve: tx(`cos(${m === 1 ? 'x' : m + 'x'}) = 0 ⇒ ${m === 1 ? 'x' : m + 'x'} = π/2 + kπ ⇒ x = ${pt} + k·${per}  (k tam sayı). Bunlar tanım kümesinden çıkar.`, `cos(${m === 1 ? 'x' : m + 'x'}) = 0 ⇒ ${m === 1 ? 'x' : m + 'x'} = π/2 + kπ ⇒ x = ${pt} + k·${per}  (k an integer). These are removed from the domain.`),
        ans: `⋃ ( −${pt} + k·${per}, ${pt} + k·${per} ),  k ∈ ℤ`,
        end: tx('Aralıklar açıktır (uçlar tanım dışı). Her aralıkta tan(mx) süreklidir ve uçlarda ±∞\'a gider.', 'The intervals are open (the ends are outside the domain). On each interval tan(mx) is continuous and tends to ±∞ at the ends.'),
        disc: tx(`x = ${pt} + k·${per}: payda 0, pay ±1 ≠ 0 ⇒ düşey asimptot (sonsuz süreksizlik). Ardışık asimptotlar arası ${per} kadardır.`, `x = ${pt} + k·${per}: denominator 0, numerator ±1 ≠ 0 ⇒ vertical asymptotes (infinite discontinuities). Consecutive asymptotes are ${per} apart.`),
      };
    },
    draw: (canvas, v) => {
      const m = v[0];
      canvas.setViewport(-PI, PI, -6, 6);
      canvas.addFunction({ evaluator: A.tan.f(v), color: canvas.accent(), thickness: 2.5 });
      for (let k = -8; k <= 8; k++) {
        const x = PI / (2 * m) + k * PI / m;
        if (x > -PI - 0.5 && x < PI + 0.5) canvas.addGuideLine({ axis: 'vertical', position: x, color: canvas.gray() });
      }
    },
  };

  A.piece = {
    make: (rng) => {
      const c = int(rng, -3, 3), p = int(rng, -5, 5);
      let q = int(rng, -5, 5);
      if (c + p === q - c) q += 2; // make a genuine jump by default
      return [c, p, q];
    },
    specs: () => [
      { cap: tx('c (geçiş noktası)', 'c (switch point)'), min: -3, max: 3, step: 1, idx: 0 },
      { cap: tx('p (sol: x + p)', 'p (left: x + p)'), min: -5, max: 5, step: 1, idx: 1 },
      { cap: tx('q (sağ: q − x)', 'q (right: q − x)'), min: -5, max: 5, step: 1, idx: 2 },
    ],
    expr: (v) => `{ ${xPlus(v[1])}  (x < ${N2(v[0])});  ${N2(v[2])} − x  (x ≥ ${N2(v[0])}) }`,
    f: (v) => safe((x) => (x < v[0] ? x + v[1] : v[2] - x)),
    analysis: (v) => {
      const c = v[0], p = v[1], q = v[2];
      const L = c + p, R = q - c;
      const cont = Math.abs(L - R) < 1e-9;
      const ans = cont ? '(−∞, ∞)' : `(−∞, ${N2(c)}) ∪ [${N2(c)}, ∞)`;
      return {
        blocks: tx('Her parça bir polinomdur; kendi açık aralığında süreklidir. Tek şüpheli nokta parçaların birleştiği x = c\'dir.', 'Each piece is a polynomial and is continuous on its own open interval. The only suspect is the junction x = c.'),
        cond: tx(`x = ${N2(c)}\'de üç koşul: (1) f(${N2(c)}) var, (2) lim f var (sol = sağ), (3) lim = f(${N2(c)}). Ayrıca tek taraflı süreklilik: soldan lim = f(c), sağdan lim = f(c).`, `At x = ${N2(c)} the three conditions: (1) f(${N2(c)}) exists, (2) lim f exists (left = right), (3) lim = f(${N2(c)}). Also one-sided: left limit = f(c)? right limit = f(c)?`),
        solve: tx(`f(${N2(c)}) = ${N2(q)} − ${par(c)} = ${N2(R)} (x ≥ c parçası).  Soldan: lim (x→${N2(c)}⁻) (${xPlus(p)}) = ${N2(c)} + ${par(p)} = ${N2(L)}.  Sağdan: lim (x→${N2(c)}⁺) (${N2(q)} − x) = ${N2(R)}.`, `f(${N2(c)}) = ${N2(q)} − ${par(c)} = ${N2(R)} (the x ≥ c piece).  From the left: lim (x→${N2(c)}⁻) (${xPlus(p)}) = ${N2(c)} + ${par(p)} = ${N2(L)}.  From the right: lim (x→${N2(c)}⁺) (${N2(q)} − x) = ${N2(R)}.`),
        ans: cont ? ans : ans + '   ' + tx('(x = c\'de yalnızca sağdan sürekli)', '(at x = c only right-continuous)'),
        end: cont
          ? tx(`Sol limit = sağ limit = f(c) = ${N2(R)} ⇒ f, x = ${N2(c)}'de sürekli; f tüm ℝ'de süreklidir.`, `Left limit = right limit = f(c) = ${N2(R)} ⇒ f is continuous at x = ${N2(c)}; f is continuous on all of ℝ.`)
          : tx(`Soldan limit ${N2(L)} ≠ f(${N2(c)}) = ${N2(R)} ⇒ soldan SÜREKSİZ. Sağdan limit ${N2(R)} = f(${N2(c)}) ⇒ SAĞDAN SÜREKLİ. Bu yüzden [${N2(c)}, ∞) aralığında (c dahil) süreklidir, (−∞, ${N2(c)}) aralığında da süreklidir; ama c'de iki taraflı limit olmadığından f x = c'de sürekli değildir.`, `The left limit ${N2(L)} ≠ f(${N2(c)}) = ${N2(R)} ⇒ discontinuous from the left. The right limit ${N2(R)} = f(${N2(c)}) ⇒ CONTINUOUS FROM THE RIGHT. So f is continuous on [${N2(c)}, ∞) (including c) and on (−∞, ${N2(c)}), but since the two-sided limit does not exist, f is not continuous at x = c.`),
        disc: cont ? tx('Süreksizlik noktası yok.', 'There is no point of discontinuity.')
          : tx(`x = ${N2(c)}: SIÇRAMA süreksizliği, sıçrama büyüklüğü |${N2(R)} − ${par(L)}| = ${N2(Math.abs(R - L))}.`, `x = ${N2(c)}: a JUMP discontinuity, of size |${N2(R)} − ${par(L)}| = ${N2(Math.abs(R - L))}.`),
      };
    },
    draw: (canvas, v) => {
      const c = v[0], p = v[1], q = v[2];
      const L = c + p, R = q - c;
      const lf = (x) => (x < c ? x + p : NaN), rf = (x) => (x >= c ? q - x : NaN);
      const yr = yRange([lf, rf], c - 5, c + 5, [L, R]);
      canvas.setViewport(c - 5, c + 5, yr[0], yr[1]);
      canvas.addFunction({ evaluator: lf, color: canvas.green(), thickness: 3 });
      canvas.addFunction({ evaluator: rf, color: canvas.accent(), thickness: 3 });
      canvas.addGuideLine({ axis: 'vertical', position: c, color: canvas.gray() });
      canvas.addMarker({ x: c, y: R, color: canvas.gold(), radius: 7, label: `f(c) = ${N2(R)}` });
      if (Math.abs(L - R) > 1e-9) canvas.addMarker({ x: c, y: L, color: canvas.gold(), hollow: true, radius: 7, label: N2(L) });
    },
  };

  const A_KINDS = ['rational', 'sqrtLin', 'sqrtOut', 'sqrtIn', 'logLin', 'sqrtOverX', 'tan', 'piece'];

  function stepsA(p) {
    const K = A[p.kind];
    if (K.norm) K.norm(p.v);
    const an = K.analysis(p.v);
    const s = [];
    s.push(Hdr(1, 'Soru ve fonksiyon', 'The question and the function') + 'f(x) = ' + K.expr(p.v) +
      '\n' + tx('Hangi aralıklarda sürekli? Her açık aralık için iç noktalarda, kapalı uçlar için tek taraflı süreklilik kontrol edilir.', 'On which intervals is f continuous? Interior points of intervals are checked directly; closed ends need one-sided continuity.'));
    s.push(Hdr(2, 'Hangi teorem kullanılır?', 'Which theorem applies?') + an.blocks + '\n' +
      tx('Genel kural: polinom, rasyonel, kök, trigonometrik, üstel ve logaritmik fonksiyonlar KENDİ TANIM KÜMELERİNDE süreklidir; toplam, fark, çarpım, oran (payda ≠ 0) ve bileşke bunu korur.', 'General rule: polynomial, rational, root, trigonometric, exponential and logarithmic functions are continuous ON THEIR DOMAINS; sums, differences, products, quotients (denominator ≠ 0) and composites preserve this.'));
    s.push(Hdr(3, 'Tanım kümesi kısıtları', 'Domain restrictions') + an.cond);
    s.push(Hdr(4, 'Kısıtları çöz', 'Solve the restrictions') + an.solve);
    s.push(Hdr(5, 'Süreklilik aralıkları', 'Intervals of continuity') + tx('Cevap: ', 'Answer: ') + an.ans);
    s.push(Hdr(6, 'Uç noktalar ve tek taraflı süreklilik', 'End points and one-sided continuity') + an.end);
    s.push(Hdr(7, 'Süreksizlik noktaları ve türleri', 'Points of discontinuity and their types') + an.disc);
    s.push(Hdr(8, 'Grafikle kontrol', 'Check with the graph') + tx('Grafikte kesikli dikey çizgiler asimptotları/geçiş noktalarını, dolu noktalar kapalı uçları, içi boş noktalar delikleri gösterir. Eğri, cevaptaki aralıklarda kalemi kaldırmadan çizilebilir.', 'On the graph, dashed vertical lines mark asymptotes/switch points, filled dots mark closed ends and hollow dots mark holes. In each interval of the answer the curve can be drawn without lifting the pencil.'));
    return s;
  }

  // ================================================================= TYPE B: find the constant(s)
  const B = {};
  const trialSpec = (idx, lo, hi) => ({ cap: tx('Deneme değeri (k)', 'Trial value (k)'), min: lo, max: hi, step: 0.5, idx });

  B.k1 = { // m x + k (x<c) ; a x² + d (x>=c)
    make: (rng) => { const c = int(rng, 1, 4), m = int(rng, 1, 4), a = int(rng, 1, 3), d = int(rng, -5, 5); return [m, c, a, d, 0]; },
    specs: () => [
      { cap: tx('m (sol eğim)', 'm (left slope)'), min: 1, max: 4, step: 1, idx: 0 },
      { cap: tx('c (geçiş)', 'c (switch)'), min: 1, max: 4, step: 1, idx: 1 },
      { cap: tx('a (sağ: ax² + d)', 'a (right: ax² + d)'), min: 1, max: 3, step: 1, idx: 2 },
      { cap: 'd', min: -5, max: 5, step: 1, idx: 3 },
      trialSpec(4, -40, 40),
    ],
    ans: (v) => ({ n: v[2] * v[1] * v[1] + v[3] - v[0] * v[1], d: 1 }),
    expr: (v) => `{ ${N2(v[0])}x + k  (x < ${N2(v[1])});  ${polyStr([v[2], 0, v[3]])}  (x ≥ ${N2(v[1])}) }`,
    f: (v, k) => safe((x) => (x < v[1] ? v[0] * x + k : v[2] * x * x + v[3])),
    dom: (v) => [v[1] - 4, v[1] + 4],
    junction: (v, k) => ({ L: v[0] * v[1] + k, R: v[2] * v[1] * v[1] + v[3], c: v[1] }),
    steps: (v) => {
      const [m, c, a, d] = v, c2 = c * c, R = a * c2 + d, k = R - m * c;
      return [
        Hdr(2, 'f(c) ve sağ limit', 'f(c) and the right limit') + tx(`x = ${N2(c)} için sağ parça (x ≥ ${N2(c)}) kullanılır: f(${N2(c)}) = ${N2(a)}·${N2(c2)} + ${par(d)} = ${N2(R)}.\nSağdan limit: lim (x→${N2(c)}⁺) (${polyStr([a, 0, d])}) = ${N2(R)} (polinom sürekli).`, `At x = ${N2(c)} the right piece (x ≥ ${N2(c)}) is used: f(${N2(c)}) = ${N2(a)}·${N2(c2)} + ${par(d)} = ${N2(R)}.\nRight limit: lim (x→${N2(c)}⁺) (${polyStr([a, 0, d])}) = ${N2(R)} (polynomial, continuous).`),
        Hdr(3, 'Sol limit', 'The left limit') + tx(`lim (x→${N2(c)}⁻) (${N2(m)}x + k) = ${N2(m)}·${N2(c)} + k = ${N2(m * c)} + k.`, `lim (x→${N2(c)}⁻) (${N2(m)}x + k) = ${N2(m)}·${N2(c)} + k = ${N2(m * c)} + k.`),
        Hdr(4, 'Süreklilik denklemi', 'The continuity equation') + tx(`Süreklilik: sol limit = sağ limit = f(${N2(c)}):\n${N2(m * c)} + k = ${N2(R)}.`, `Continuity: left limit = right limit = f(${N2(c)}):\n${N2(m * c)} + k = ${N2(R)}.`),
        Hdr(5, 'k\'yı çöz', 'Solve for k') + `k = ${N2(R)} − ${N2(m * c)} = ${N2(k)}.`,
        Hdr(6, 'Doğrulama', 'Verification') + tx(`k = ${N2(k)}: sol parça ${N2(m)}·${N2(c)} + ${par(k)} = ${N2(m * c + k)} = f(${N2(c)}) = ${N2(R)} ✓. Üç koşul da sağlanır; grafik kopmadan birleşir.`, `k = ${N2(k)}: left piece ${N2(m)}·${N2(c)} + ${par(k)} = ${N2(m * c + k)} = f(${N2(c)}) = ${N2(R)} ✓. All three conditions hold; the graph joins without a break.`),
      ];
    },
  };

  B.k2 = { // k x² + e (x<c) ; g x + h (x>=c)
    make: (rng) => {
      for (let i = 0; i < 200; i++) {
        const c = int(rng, 1, 3), e = int(rng, -5, 5), g = int(rng, -4, 4), h = int(rng, -5, 5);
        if ((g * c + h - e) % (c * c) === 0 && g !== 0) return [c, e, g, h, 0];
      }
      return [1, 0, 2, 1, 0];
    },
    specs: () => [
      { cap: tx('c (geçiş)', 'c (switch)'), min: 1, max: 3, step: 1, idx: 0 },
      { cap: tx('e (sol: kx² + e)', 'e (left: kx² + e)'), min: -5, max: 5, step: 1, idx: 1 },
      { cap: tx('g (sağ: gx + h)', 'g (right: gx + h)'), min: -4, max: 4, step: 1, idx: 2 },
      { cap: 'h', min: -5, max: 5, step: 1, idx: 3 },
      trialSpec(4, -30, 30),
    ],
    ans: (v) => ({ n: v[2] * v[0] + v[3] - v[1], d: v[0] * v[0] }),
    expr: (v) => `{ kx² ${v[1] >= 0 ? '+' : '−'} ${N2(Math.abs(v[1]))}  (x < ${N2(v[0])});  ${linStr(v[2], v[3])}  (x ≥ ${N2(v[0])}) }`,
    f: (v, k) => safe((x) => (x < v[0] ? k * x * x + v[1] : v[2] * x + v[3])),
    dom: (v) => [v[0] - 4, v[0] + 4],
    junction: (v, k) => ({ L: k * v[0] * v[0] + v[1], R: v[2] * v[0] + v[3], c: v[0] }),
    steps: (v) => {
      const [c, e, g, h] = v, c2 = c * c, R = g * c + h, num = R - e;
      return [
        Hdr(2, 'f(c) ve sağ limit', 'f(c) and the right limit') + tx(`f(${N2(c)}) = ${N2(g)}·${N2(c)} + ${par(h)} = ${N2(R)}; sağdan limit de ${N2(R)} (doğrusal parça sürekli).`, `f(${N2(c)}) = ${N2(g)}·${N2(c)} + ${par(h)} = ${N2(R)}; the right limit is also ${N2(R)} (the linear piece is continuous).`),
        Hdr(3, 'Sol limit', 'The left limit') + tx(`lim (x→${N2(c)}⁻) (kx² ${e >= 0 ? '+' : '−'} ${N2(Math.abs(e))}) = k·${N2(c2)} ${e >= 0 ? '+' : '−'} ${N2(Math.abs(e))}.`, `lim (x→${N2(c)}⁻) (kx² ${e >= 0 ? '+' : '−'} ${N2(Math.abs(e))}) = k·${N2(c2)} ${e >= 0 ? '+' : '−'} ${N2(Math.abs(e))}.`),
        Hdr(4, 'Süreklilik denklemi', 'The continuity equation') + `${N2(c2)}k ${e >= 0 ? '+' : '−'} ${N2(Math.abs(e))} = ${N2(R)}.`,
        Hdr(5, 'k\'yı çöz', 'Solve for k') + `${N2(c2)}k = ${N2(R)} ${e >= 0 ? '−' : '+'} ${N2(Math.abs(e))} = ${N2(num)}  ⇒  k = ${frA(num, c2)}.`,
        Hdr(6, 'Doğrulama', 'Verification') + tx(`k = ${frS(num, c2)}: sol limit = ${N2(c2)}·(${frS(num, c2)}) ${e >= 0 ? '+' : '−'} ${N2(Math.abs(e))} = ${N2(num + e)} = ${N2(R)} = f(${N2(c)}) ✓.`, `k = ${frS(num, c2)}: left limit = ${N2(c2)}·(${frS(num, c2)}) ${e >= 0 ? '+' : '−'} ${N2(Math.abs(e))} = ${N2(num + e)} = ${N2(R)} = f(${N2(c)}) ✓.`),
      ];
    },
  };

  B.k4 = { // hole: (x-c)(x-r)/(x-c), f(c)=k
    make: (rng) => [int(rng, -3, 4), int(rng, -4, 4), 0],
    specs: () => [
      { cap: tx('c (delik noktası)', 'c (hole point)'), min: -3, max: 4, step: 1, idx: 0 },
      { cap: tx('r (ikinci kök)', 'r (second root)'), min: -4, max: 4, step: 1, idx: 1 },
      trialSpec(2, -10, 10),
    ],
    ans: (v) => ({ n: v[0] - v[1], d: 1 }),
    expr: (v) => `{ (${polyStr([1, -(v[0] + v[1]), v[0] * v[1]])}) / (${xPlus(-v[0])})  (x ≠ ${N2(v[0])});  k  (x = ${N2(v[0])}) }`,
    f: (v) => safe((x) => (Math.abs(x - v[0]) < 1e-9 ? NaN : (x - v[0]) * (x - v[1]) / (x - v[0]))),
    dom: (v) => [v[0] - 5, v[0] + 5],
    junction: (v, k) => ({ L: v[0] - v[1], R: k, c: v[0], hole: true }),
    steps: (v) => {
      const [c, r] = v, S = c + r, P = c * r, lim = c - r;
      return [
        Hdr(2, 'f(c) tanım gereği', 'f(c) by definition') + tx(`f(${N2(c)}) = k (verilmiş). Bu bir sayıdır ama bilinmiyor.`, `f(${N2(c)}) = k (given). It is a number, but unknown.`),
        Hdr(3, 'Limit (x ≠ c için)', 'The limit (for x ≠ c)') + tx(`x = ${N2(c)} koyunca 0/0 olur: pay ${polyStr([1, -S, P])} çarpanlara ayrılır: (x − ${par(c)})(x − ${par(r)}).\nx ≠ ${N2(c)} için (x − ${par(c)}) sadeleşir: f(x) = x − ${par(r)}.\nLimit: lim (x→${N2(c)}) (x − ${par(r)}) = ${N2(c)} − ${par(r)} = ${N2(lim)}.`, `Putting x = ${N2(c)} gives 0/0: the numerator ${polyStr([1, -S, P])} factors as (x − ${par(c)})(x − ${par(r)}).\nFor x ≠ ${N2(c)} the factor (x − ${par(c)}) cancels: f(x) = x − ${par(r)}.\nLimit: lim (x→${N2(c)}) (x − ${par(r)}) = ${N2(c)} − ${par(r)} = ${N2(lim)}.`),
        Hdr(4, 'Süreklilik denklemi', 'The continuity equation') + tx(`Süreklilik: lim f = f(${N2(c)}) ⇒ k = ${N2(lim)}.`, `Continuity: lim f = f(${N2(c)}) ⇒ k = ${N2(lim)}.`),
        Hdr(5, 'Yorum ve doğrulama', 'Interpretation and check') + tx(`k = ${N2(lim)} seçilirse delik (${N2(c)}, ${N2(lim)}) noktası doldurulur: GİDERİLEBİLİR süreksizlik giderilir; f(x) = x − ${par(r)} doğrusuna dönüşür. Başka bir k, tek bir noktada "sıçrayan" bir değer bırakır.`, `Choosing k = ${N2(lim)} fills the hole at (${N2(c)}, ${N2(lim)}): the REMOVABLE discontinuity is removed and f becomes the line x − ${par(r)}. Any other k leaves a single isolated point off the line.`),
      ];
    },
  };

  B.k5 = { // sin(kx)/x ... f(0) = m
    make: (rng) => [int(rng, 1, 5), 0],
    specs: () => [
      { cap: tx('m (f(0) = m)', 'm (f(0) = m)'), min: 1, max: 5, step: 1, idx: 0 },
      trialSpec(1, -10, 10),
    ],
    ans: (v) => ({ n: v[0], d: 1 }),
    expr: (v) => `{ sin(kx) / x  (x ≠ 0);  ${N2(v[0])}  (x = 0) }`,
    f: (v, k) => safe((x) => (Math.abs(x) < 1e-9 ? NaN : Math.sin(k * x) / x)),
    dom: () => [-6, 6],
    junction: (v, k) => ({ L: k, R: v[0], c: 0, hole: true }),
    steps: (v) => {
      const m = v[0];
      return [
        Hdr(2, 'f(0) tanım gereği', 'f(0) by definition') + tx(`f(0) = ${N2(m)}.`, `f(0) = ${N2(m)}.`),
        Hdr(3, 'Limit (x ≠ 0 için)', 'The limit (for x ≠ 0)') + tx(`lim (x→0) sin(kx)/x: pay ve payda kx ile genişletilir: sin(kx)/x = k · [sin(kx)/(kx)].\nu = kx → 0 iken sin u / u → 1 (temel limit). O halde limit = k·1 = k.`, `lim (x→0) sin(kx)/x: multiply and divide by k: sin(kx)/x = k · [sin(kx)/(kx)].\nAs u = kx → 0, sin u / u → 1 (fundamental limit). So the limit is k·1 = k.`),
        Hdr(4, 'Süreklilik denklemi', 'The continuity equation') + tx(`lim f = f(0) ⇒ k = ${N2(m)}.`, `lim f = f(0) ⇒ k = ${N2(m)}.`),
        Hdr(5, 'Doğrulama', 'Verification') + tx(`k = ${N2(m)}: sin(${N2(m)}x)/x → ${N2(m)} (x → 0), f(0) = ${N2(m)} ✓. Sayısal: x = 0,01 için sin(${N2(m * 0.01)})/0,01 ≈ ${F4(Math.sin(m * 0.01) / 0.01)}.`, `k = ${N2(m)}: sin(${N2(m)}x)/x → ${N2(m)} as x → 0, f(0) = ${N2(m)} ✓. Numerically: for x = 0.01, sin(${N2(m * 0.01)})/0.01 ≈ ${F4(Math.sin(m * 0.01) / 0.01)}.`),
      ];
    },
  };

  // two constants a, b: left 2x + n1 (x<c1) ; a x + b (c1<=x<=c2) ; right x² + n3 (x>c2)
  B.ab = {
    make: (rng) => {
      for (let i = 0; i < 200; i++) {
        const c1 = int(rng, -4, -1), c2 = int(rng, 1, 4), a = pick(rng, [-3, -2, -1, 1, 2, 3, 4]), b = int(rng, -6, 6);
        const V1 = a * c1 + b, V2 = a * c2 + b;
        const n1 = V1 - 2 * c1, n3 = V2 - c2 * c2;
        if (Math.abs(n1) <= 30 && Math.abs(n3) <= 30) return [c1, c2, n1, n3, 0, 0];
      }
      return [-1, 2, 3, 1, 0, 0];
    },
    specs: () => [
      { cap: tx('c₁ (ilk geçiş)', 'c₁ (first switch)'), min: -4, max: -1, step: 1, idx: 0 },
      { cap: tx('c₂ (ikinci geçiş)', 'c₂ (second switch)'), min: 1, max: 4, step: 1, idx: 1 },
      { cap: tx('n₁ (sol: 2x + n₁)', 'n₁ (left: 2x + n₁)'), min: -30, max: 30, step: 1, idx: 2 },
      { cap: tx('n₃ (sağ: x² + n₃)', 'n₃ (right: x² + n₃)'), min: -30, max: 30, step: 1, idx: 3 },
      { cap: tx('Deneme a', 'Trial a'), min: -10, max: 10, step: 0.5, idx: 4 },
      { cap: tx('Deneme b', 'Trial b'), min: -15, max: 15, step: 0.5, idx: 5 },
    ],
    sol: (v) => {
      const [c1, c2, n1, n3] = v, V1 = 2 * c1 + n1, V2 = c2 * c2 + n3, dd = c2 - c1;
      return { V1, V2, aN: V2 - V1, bN: V1 * c2 - V2 * c1, d: dd, a: (V2 - V1) / dd, b: (V1 * c2 - V2 * c1) / dd };
    },
    expr: (v) => `{ ${linStr(2, v[2])}  (x < ${N2(v[0])});  ax + b  (${N2(v[0])} ≤ x ≤ ${N2(v[1])});  ${polyStr([1, 0, v[3]])}  (x > ${N2(v[1])}) }`,
    f: (v, a, b) => safe((x) => (x < v[0] ? 2 * x + v[2] : x <= v[1] ? a * x + b : x * x + v[3])),
  };

  const B_KINDS = ['k1', 'k2', 'k4', 'k5', 'ab'];

  function exprB(p) {
    if (p.kind === 'ab') return B.ab.expr(p.v);
    return B[p.kind].expr(p.v);
  }

  function stepsB(p) {
    const v = p.v;
    const s = [];
    if (p.kind === 'ab') {
      const [c1, c2, n1, n3] = v, S = B.ab.sol(v);
      const { V1, V2, aN, bN, d } = S;
      s.push(Hdr(1, 'Soru ve strateji', 'The question and the strategy') + 'f(x) = ' + exprB(p) + '\n' +
        tx(`İki bilinmeyen (a, b) için iki süreklilik koşulu gerekir: x = ${N2(c1)} ve x = ${N2(c2)} noktalarında. Her noktada: sol limit = sağ limit = f(nokta).`, `Two unknowns (a, b) need two continuity conditions: at x = ${N2(c1)} and at x = ${N2(c2)}. At each point: left limit = right limit = f(point).`));
      s.push(Hdr(2, 'x = c₁ noktasında', 'At x = c₁') + tx(`Soldan: lim (x→${N2(c1)}⁻) (2x + ${par(n1)}) = 2·${par(c1)} + ${par(n1)} = ${N2(V1)}.\nOrta parça (c₁ dahil): f(${N2(c1)}) = a·${par(c1)} + b = ${N2(c1)}a + b.\nSüreklilik: ${N2(c1)}a + b = ${N2(V1)}.   (Denklem 1)`, `From the left: lim (x→${N2(c1)}⁻) (2x + ${par(n1)}) = 2·${par(c1)} + ${par(n1)} = ${N2(V1)}.\nMiddle piece (includes c₁): f(${N2(c1)}) = a·${par(c1)} + b = ${N2(c1)}a + b.\nContinuity: ${N2(c1)}a + b = ${N2(V1)}.   (Equation 1)`));
      s.push(Hdr(3, 'x = c₂ noktasında', 'At x = c₂') + tx(`Sağdan: lim (x→${N2(c2)}⁺) (x² + ${par(n3)}) = ${N2(c2 * c2)} + ${par(n3)} = ${N2(V2)}.\nOrta parça (c₂ dahil): f(${N2(c2)}) = ${N2(c2)}a + b.\nSüreklilik: ${N2(c2)}a + b = ${N2(V2)}.   (Denklem 2)`, `From the right: lim (x→${N2(c2)}⁺) (x² + ${par(n3)}) = ${N2(c2 * c2)} + ${par(n3)} = ${N2(V2)}.\nMiddle piece (includes c₂): f(${N2(c2)}) = ${N2(c2)}a + b.\nContinuity: ${N2(c2)}a + b = ${N2(V2)}.   (Equation 2)`));
      s.push(Hdr(4, 'Sistemi çöz', 'Solve the system') + tx(`(2) − (1): (${N2(c2)} − ${par(c1)})a = ${N2(V2)} − ${par(V1)} ⇒ ${N2(c2 - c1)}a = ${N2(V2 - V1)} ⇒ a = ${frA(aN, d)}.\n(1)'den: b = ${N2(V1)} − ${par(c1)}·a = ${frA(bN, d)}.`, `(2) − (1): (${N2(c2)} − ${par(c1)})a = ${N2(V2)} − ${par(V1)} ⇒ ${N2(c2 - c1)}a = ${N2(V2 - V1)} ⇒ a = ${frA(aN, d)}.\nFrom (1): b = ${N2(V1)} − ${par(c1)}·a = ${frA(bN, d)}.`));
      s.push(Hdr(5, 'Doğrulama', 'Verification') + tx(`a = ${frS(aN, d)}, b = ${frS(bN, d)}:\nx = ${N2(c1)}: ${N2(c1)}a + b = ${N2(c1 * S.a + S.b)} = ${N2(V1)} ✓.\nx = ${N2(c2)}: ${N2(c2)}a + b = ${N2(c2 * S.a + S.b)} = ${N2(V2)} ✓.\nHer iki birleşim noktasında üç süreklilik koşulu sağlanır.`, `a = ${frS(aN, d)}, b = ${frS(bN, d)}:\nx = ${N2(c1)}: ${N2(c1)}a + b = ${N2(c1 * S.a + S.b)} = ${N2(V1)} ✓.\nx = ${N2(c2)}: ${N2(c2)}a + b = ${N2(c2 * S.a + S.b)} = ${N2(V2)} ✓.\nAll three continuity conditions hold at both junctions.`));
      s.push(Hdr(6, 'Yorum', 'Interpretation') + tx('Orta parça, sol ve sağ parçaları birbirine bağlayan "köprüdür": doğrusal parçanın iki ucu iki verilen noktadan geçmek zorundadır; iki nokta bir doğruyu belirler.', 'The middle piece is the "bridge" joining the left and right pieces: the line must pass through the two given endpoints, and two points determine a line.'));
      return s;
    }
    const K = B[p.kind];
    s.push(Hdr(1, 'Soru ve strateji', 'The question and the strategy') + 'f(x) = ' + K.expr(v) + '\n' +
      tx('Parçalı fonksiyon, parçaların birleştiği noktada sürekli olmalı: (1) f(c) tanımlı, (2) sol limit = sağ limit, (3) limit = f(c). Bilinmeyen sabit bu eşitlikten çıkar.', 'A piecewise function must be continuous where the pieces meet: (1) f(c) defined, (2) left limit = right limit, (3) limit = f(c). The unknown constant comes from this equality.'));
    K.steps(v).forEach((x) => s.push(x));
    return s;
  }

  // ================================================================= TYPE C: Intermediate Value Theorem
  const C = {
    cubic: {
      name: () => tx('üçüncü derece polinom', 'cubic polynomial'),
      expr: (p) => polyStr([1, p.co[0], p.co[1], p.co[2]]),
      f: (p) => (x) => ((x + p.co[0]) * x + p.co[1]) * x + p.co[2],
      contTR: 'Polinom her yerde süreklidir; dolayısıyla [a, b] üzerinde de süreklidir.',
      contEN: 'A polynomial is continuous everywhere, hence on [a, b].',
      dom: () => -Infinity,
    },
    exp: {
      expr: () => 'eˣ + x',
      f: () => (x) => Math.exp(x) + x,
      contTR: 'eˣ ve x her yerde sürekli; toplamları da sürekli, dolayısıyla [a, b] üzerinde süreklidir.',
      contEN: 'eˣ and x are continuous everywhere, so their sum is continuous, hence on [a, b].',
      dom: () => -Infinity,
    },
    log: {
      expr: () => 'ln x + x',
      f: () => (x) => (x > 0 ? Math.log(x) + x : NaN),
      contTR: 'ln x yalnızca x > 0 için tanımlı ve süreklidir; x sürekli. Toplam, (0, ∞) üzerinde süreklidir. [a, b] ⊂ (0, ∞) olması gerekir, yani a > 0.',
      contEN: 'ln x is defined and continuous only for x > 0; x is continuous. The sum is continuous on (0, ∞). We need [a, b] ⊂ (0, ∞), i.e. a > 0.',
      dom: () => 0,
    },
    trig: {
      expr: (p) => (p.m === 1 ? 'cos x − x' : p.m + ' cos x − x'),
      f: (p) => (x) => p.m * Math.cos(x) - x,
      contTR: 'cos x ve x her yerde sürekli; sabit katı ve farkı da sürekli, dolayısıyla [a, b] üzerinde süreklidir. (x radyan cinsindedir.)',
      contEN: 'cos x and x are continuous everywhere; constant multiples and differences stay continuous, hence on [a, b]. (x is in radians.)',
      dom: () => -Infinity,
    },
  };
  const C_KINDS = ['cubic', 'exp', 'log', 'trig'];
  const cf = (p) => C[p.kind].f(p);

  function makeC(rng) {
    for (let tries = 0; tries < 400; tries++) {
      const kind = pick(rng, C_KINDS);
      const p = { type: 'ivt', kind, co: [0, 0, 0], m: 1, v: [0, 1, 0] };
      let step = 1, lo0 = -5, hi0 = 4;
      if (kind === 'cubic') { p.co = [int(rng, -3, 3), int(rng, -6, 3), int(rng, -5, 5)]; }
      else if (kind === 'trig') { p.m = int(rng, 1, 3); step = 0.5; lo0 = 0; hi0 = 2.5; }
      else if (kind === 'log') { step = 0.5; lo0 = 0.5; hi0 = 6; }
      else { step = 1; lo0 = -1; hi0 = 2; }
      const f = cf(p);
      const useN = rng.nextDouble() < 0.5;
      let N = 0;
      if (useN) {
        if (kind === 'exp') N = int(rng, 2, 9);
        else if (kind === 'log') N = int(rng, 2, 6);
        else if (kind === 'trig') N = int(rng, -1, 1);
        else N = int(rng, -4, 4);
      }
      const cands = [];
      for (let a = lo0; a + step <= hi0 + 1e-9; a += step) {
        const fa = f(a) - N, fb = f(a + step) - N;
        if (Number.isFinite(fa) && Number.isFinite(fb) && fa * fb < 0 && Math.abs(fa) > 1e-6 && Math.abs(fb) > 1e-6) cands.push(a);
      }
      if (cands.length === 0) continue;
      const a = cands[rng.nextInt(0, cands.length)];
      p.v = [a, a + step, N];
      return p;
    }
    return { type: 'ivt', kind: 'cubic', co: [0, -3, 1], m: 1, v: [0, 1, 0] }; // x³ − 3x + 1 on [0,1]
  }

  function eqStr(p) {
    const N = p.v[2];
    return C[p.kind].expr(p) + ' = ' + N2(N);
  }

  function analyzeC(p) {
    const lo = Math.min(p.v[0], p.v[1]), hi = Math.max(p.v[0], p.v[1]), N = p.v[2];
    const f = cf(p);
    const flo = f(lo), fhi = f(hi);
    const domOK = lo > C[p.kind].dom(p);
    const finiteEnds = Number.isFinite(flo) && Number.isFinite(fhi);
    const degenerate = hi - lo < 1e-9;
    let rel = 'none';
    if (finiteEnds && !degenerate) {
      const mn = Math.min(flo, fhi), mx = Math.max(flo, fhi);
      if (Math.abs(flo - N) < 1e-9 || Math.abs(fhi - N) < 1e-9) rel = 'end';
      else if (N > mn && N < mx) rel = 'between';
    }
    const ok = domOK && !degenerate && finiteEnds && rel === 'between';
    // bisection on g = f - N
    const g = (x) => f(x) - N;
    const rows = [];
    let a = lo, b = hi, root = NaN;
    if (ok) {
      for (let i = 0; i < 5; i++) {
        const mid = (a + b) / 2, gm = g(mid), ga = g(a);
        let nxt;
        if (Math.abs(gm) < 1e-12) { rows.push({ a, b, mid, gm, na: mid, nb: mid }); a = mid; b = mid; break; }
        if (ga * gm < 0) { nxt = [a, mid]; } else { nxt = [mid, b]; }
        rows.push({ a, b, mid, gm, na: nxt[0], nb: nxt[1] });
        a = nxt[0]; b = nxt[1];
      }
      // refine to ~1e-10
      let x0 = lo, x1 = hi;
      for (let i = 0; i < 60; i++) {
        const mid = (x0 + x1) / 2;
        if (g(x0) * g(mid) <= 0) x1 = mid; else x0 = mid;
      }
      root = (x0 + x1) / 2;
    }
    return { lo, hi, N, flo, fhi, domOK, degenerate, finiteEnds, rel, ok, rows, root, finalA: a, finalB: b };
  }

  function stepsC(p) {
    const A_ = analyzeC(p);
    const { lo, hi, N } = A_;
    const s = [];
    const K = C[p.kind];
    const fx = K.expr(p);
    s.push(Hdr(1, 'Soru ve fonksiyon', 'The question and the function') + tx(`f(x) = ${fx},  [a, b] = [${N2(lo)}, ${N2(hi)}],  N = ${N2(N)}.\nİstenen: f(x) = ${N2(N)} denkleminin (a, b) içinde çözümü olduğunu göstermek.${N === 0 ? ' (N = 0: kök varlığı.)' : ''}`, `f(x) = ${fx},  [a, b] = [${N2(lo)}, ${N2(hi)}],  N = ${N2(N)}.\nWanted: show that the equation f(x) = ${N2(N)} has a solution in (a, b).${N === 0 ? ' (N = 0: existence of a root.)' : ''}`));
    s.push(Hdr(2, 'Ara Değer Teoremi (AdT)', 'The Intermediate Value Theorem (IVT)') + tx('f, [a, b] kapalı aralığında SÜREKLİ ve N, f(a) ile f(b) arasında (f(a) ≠ f(b)) ise (a, b) içinde f(c) = N olan en az bir c vardır.\nKoşullar: (i) kapalı aralık, (ii) süreklilik, (iii) N kesinlikle f(a) ile f(b) arasında. Kök için N = 0: f(a) ve f(b) zıt işaretli olmalı.', 'If f is CONTINUOUS on the closed interval [a, b] and N lies between f(a) and f(b) (f(a) ≠ f(b)), then there is at least one c in (a, b) with f(c) = N.\nConditions: (i) closed interval, (ii) continuity, (iii) N strictly between f(a) and f(b). For a root N = 0: f(a) and f(b) must have opposite signs.'));
    if (A_.degenerate) {
      s.push(Hdr(3, 'Aralık kontrolü', 'Interval check') + tx('a = b olduğundan aralık tek noktadır; teorem bir aralık gerektirir. Sürgüleri a < b olacak şekilde ayarlayabiliriz.', 'Since a = b the "interval" is a single point; the theorem needs an actual interval. We can adjust the sliders so that a < b.'));
      return s;
    }
    s.push(Hdr(3, 'Süreklilik kontrolü', 'Check continuity') + tx(K.contTR, K.contEN) + (K.dom(p) > -Infinity ? tx(`\na = ${N2(lo)}: ${A_.domOK ? 'a > 0 sağlandı ⇒ f [a, b] üzerinde sürekli ✓.' : 'a ≤ 0: f bu aralıkta TANIMLI/SÜREKLİ DEĞİL ✗ ⇒ teorem uygulanamaz.'}`, `\na = ${N2(lo)}: ${A_.domOK ? 'a > 0 holds ⇒ f is continuous on [a, b] ✓.' : 'a ≤ 0: f is NOT defined/continuous on this interval ✗ ⇒ the theorem cannot be applied.'}`) : tx(' ✓', ' ✓')));
    if (!A_.domOK || !A_.finiteEnds) {
      s.push(Hdr(4, 'Sonuç', 'Conclusion') + tx('Süreklilik koşulu sağlanmadığı için Ara Değer Teoremi bu aralıkta HİÇBİR ŞEY söylemez (çözüm olup olmadığı bu yöntemle belirlenemez). Aralığı f\'nin sürekli olduğu bölgeye (ör. a > 0) taşıyın.', 'Because the continuity condition fails, the IVT says NOTHING on this interval (it cannot decide whether a solution exists). Move the interval to where f is continuous (e.g. a > 0).'));
      return s;
    }
    s.push(Hdr(4, 'Uç değerlerini hesapla', 'Compute the end values') + tx(`f(${N2(lo)}) = ${F4(A_.flo)}\nf(${N2(hi)}) = ${F4(A_.fhi)}\nN = ${N2(N)}`, `f(${N2(lo)}) = ${F4(A_.flo)}\nf(${N2(hi)}) = ${F4(A_.fhi)}\nN = ${N2(N)}`));
    const mn = Math.min(A_.flo, A_.fhi), mx = Math.max(A_.flo, A_.fhi);
    if (A_.rel === 'between') {
      s.push(Hdr(5, 'N arada mı?', 'Is N in between?') + `${F4(mn)} < ${N2(N)} < ${F4(mx)} ✓` + (N === 0 ? tx(`\nf(a) ve f(b) zıt işaretli: f(${N2(lo)})·f(${N2(hi)}) = ${F4(A_.flo * A_.fhi)} < 0.`, `\nf(a) and f(b) have opposite signs: f(${N2(lo)})·f(${N2(hi)}) = ${F4(A_.flo * A_.fhi)} < 0.`) : ''));
      s.push(Hdr(6, 'Teoremi uygula', 'Apply the theorem') + tx(`f, [${N2(lo)}, ${N2(hi)}] üzerinde sürekli ve ${N2(N)}, f(${N2(lo)}) = ${F4(A_.flo)} ile f(${N2(hi)}) = ${F4(A_.fhi)} arasında olduğundan AdT gereği (${N2(lo)}, ${N2(hi)}) içinde f(c) = ${N2(N)} olan en az bir c vardır. ∎`, `f is continuous on [${N2(lo)}, ${N2(hi)}] and ${N2(N)} lies between f(${N2(lo)}) = ${F4(A_.flo)} and f(${N2(hi)}) = ${F4(A_.fhi)}, so by the IVT there is at least one c in (${N2(lo)}, ${N2(hi)}) with f(c) = ${N2(N)}. ∎`));
      let tbl = '';
      A_.rows.forEach((r, i) => {
        tbl += `${i + 1}. [${F4(r.a)}, ${F4(r.b)}]  ${tx("orta nokta", "midpoint")} = ${F4(r.mid)},  f − N = ${F4(r.gm)}  →  [${F4(r.na)}, ${F4(r.nb)}]\n`;
      });
      s.push(Hdr(7, 'Kökü daralt (ikiye bölme)', 'Narrow it down (bisection)') + tx('Orta noktanın işaretine bakıp işaret değişiminin olduğu yarıyı seç; her adım aralığı yarıya indirir:\n', 'Look at the sign at the midpoint and keep the half where the sign changes; each step halves the interval:\n') + tbl.trim());
      const w = (hi - lo) / Math.pow(2, A_.rows.length);
      s.push(Hdr(8, 'Yaklaşık çözüm', 'Approximate solution') + tx(`${A_.rows.length} adım sonra c, [${F4(A_.finalA)}, ${F4(A_.finalB)}] içindedir (genişlik ${F4(w)}). Daha çok adımla c ≈ ${F4(A_.root)}; kontrol: f(c) − N ≈ ${F4(f_(p, A_.root) - N)}.`, `After ${A_.rows.length} steps c lies in [${F4(A_.finalA)}, ${F4(A_.finalB)}] (width ${F4(w)}). With more steps c ≈ ${F4(A_.root)}; check: f(c) − N ≈ ${F4(f_(p, A_.root) - N)}.`));
      s.push(Hdr(9, 'Uyarılar', 'Remarks') + tx('AdT yalnızca VARLIĞI garanti eder; çözüm sayısı hakkında bir şey söylemez (üçüncü dereceden bir polinom aynı aralıkta 1 veya 3 kök de içerebilir). Teklik için ek bilgi (ör. f artan) gerekir. AdT çözümü bulmaz; ikiye bölme gibi bir yöntem gerekir.', 'The IVT guarantees only EXISTENCE; it says nothing about how many solutions there are (a cubic may have 1 or 3 roots in the same interval). Uniqueness needs extra information (e.g. f increasing). The IVT does not find the solution; a method such as bisection does.'));
    } else if (A_.rel === 'end') {
      s.push(Hdr(5, 'N uç değerlerden biri', 'N equals an end value') + tx('N = f(a) veya N = f(b): çözüm doğrudan uç noktadadır (c = a veya c = b); AdT\'ye gerek kalmaz.', 'N = f(a) or N = f(b): the solution is directly an end point (c = a or c = b); the IVT is not needed.'));
    } else {
      s.push(Hdr(5, 'N arada mı?', 'Is N in between?') + tx(`${N2(N)} değeri [${F4(mn)}, ${F4(mx)}] aralığının DIŞINDA ✗. Bu durumda AdT çözüm varlığını GARANTİ ETMEZ.`, `${N2(N)} lies OUTSIDE [${F4(mn)}, ${F4(mx)}] ✗. In this case the IVT does NOT guarantee a solution.`));
      s.push(Hdr(6, 'Sonuç', 'Conclusion') + tx('Bu aralıkta çözüm olabilir de olmayabilir de (ör. grafik N doğrusunu ikişer kez kesebilir). "Çözüm yok" demek de yanlıştır. Uç değerleri zıt işaretli yapan başka bir [a, b] seçebiliriz (sürgülerden yararlanabiliriz).', 'There may or may not be a solution on this interval (e.g. the graph can cross the line y = N twice). Saying "no solution" would also be wrong. It helps to choose another [a, b] whose end values straddle N (the sliders can do this).'));
    }
    return s;
  }
  function f_(p, x) { return cf(p)(x); }

  function drawC(canvas, p) {
    const A_ = analyzeC(p);
    const f = safe(cf(p));
    const lo = A_.lo, hi = A_.hi, N = A_.N;
    const xlo = lo - Math.max(1.5, (hi - lo) * 0.4), xhi = hi + Math.max(1.5, (hi - lo) * 0.4);
    const yr = yRange([f], xlo, xhi, [N, A_.flo, A_.fhi], 400);
    canvas.setViewport(xlo, xhi, yr[0], yr[1]);
    if (hi - lo > 1e-9) canvas.addRegion({ xMin: lo, xMax: hi });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3 });
    canvas.addGuideLine({ axis: 'horizontal', position: N, color: canvas.orange(), label: 'y = ' + N2(N) });
    canvas.addGuideLine({ axis: 'vertical', position: lo, color: canvas.gray(), label: 'a' });
    if (hi - lo > 1e-9) canvas.addGuideLine({ axis: 'vertical', position: hi, color: canvas.gray(), label: 'b' });
    if (Number.isFinite(A_.flo)) canvas.addMarker({ x: lo, y: A_.flo, color: canvas.blue(), radius: 7, label: `f(a) = ${F4(A_.flo)}` });
    if (Number.isFinite(A_.fhi) && hi - lo > 1e-9) canvas.addMarker({ x: hi, y: A_.fhi, color: canvas.green(), radius: 7, label: `f(b) = ${F4(A_.fhi)}` });
    if (A_.ok) {
      A_.rows.slice(0, 4).forEach((r) => canvas.addMarker({ x: r.mid, y: f(r.mid), color: canvas.gray(), radius: 4 }));
      canvas.addMarker({ x: A_.root, y: N, color: canvas.gold(), radius: 8, label: `c ≈ ${F4(A_.root)}` });
    }
  }

  // ================================================================= problem creation / dispatch
  function createProblem(rng) {
    return gen(rng, forcedType === 'random' ? pick(rng, ['domain', 'param', 'ivt']) : forcedType, null);
  }
  function gen(rng, type, kindForced) {
    if (type === 'domain') {
      const kind = kindForced || pick(rng, A_KINDS);
      const K = A[kind];
      return { type, kind, v: K.make(rng) };
    }
    if (type === 'param') {
      const kind = kindForced || pick(rng, B_KINDS);
      const p = { type, kind, v: B[kind].make(rng), showSolved: false };
      // trial values: start at a deliberately wrong value
      if (kind === 'ab') {
        const S = B.ab.sol(p.v);
        p.v[4] = Math.max(-10, Math.min(10, Math.round((S.a + pick(rng, [-2, -1, 1, 2])) * 2) / 2));
        p.v[5] = Math.max(-15, Math.min(15, Math.round((S.b + pick(rng, [-2, -1, 1, 2])) * 2) / 2));
      } else {
        const an = B[kind].ans(p.v), kt = an.n / an.d;
        const idx = B[kind].specs().length - 1;
        const sp = B[kind].specs()[idx];
        p.v[idx] = Math.max(sp.min, Math.min(sp.max, Math.round((kt + pick(rng, [-3, -2, -1, 1, 2, 3])) * 2) / 2));
      }
      return p;
    }
    return makeC(rng);
  }

  function specsOf(p) {
    if (p.type === 'domain') return A[p.kind].specs();
    if (p.type === 'param') return B[p.kind].specs();
    return [
      { cap: tx('a (sol uç)', 'a (left end)'), min: -6, max: 6, step: 0.5, idx: 0 },
      { cap: tx('b (sağ uç)', 'b (right end)'), min: -6, max: 6, step: 0.5, idx: 1 },
      { cap: tx('N (hedef değer)', 'N (target value)'), min: -10, max: 10, step: 0.5, idx: 2 },
    ];
  }

  function problemStatement(p) {
    if (p.type === 'domain') {
      const K = A[p.kind];
      if (K.norm) K.norm(p.v);
      const extra = p.kind === 'piece'
        ? tx(' (c noktasında tek taraflı sürekliliğe de bakalım.)', ' (we also look at one-sided continuity at c.)')
        : tx(' (Uç noktalarda tek taraflı sürekliliği de ayrıca söyleyelim.)', ' (We also state one-sided continuity at the end points.)');
      return tx(`f(x) = ${K.expr(p.v)} fonksiyonu hangi aralıklarda sürekli olur, bulalım.` + extra, `Let's find the intervals on which f(x) = ${K.expr(p.v)} is continuous.` + extra);
    }
    if (p.type === 'param') {
      if (p.kind === 'ab') {
        return tx(`f(x) = ${exprB(p)} fonksiyonunun TÜM ℝ'de sürekli olması için a ve b sabitlerini bulalım.`, `Let's find the constants a and b that make f(x) = ${exprB(p)} continuous on all of ℝ.`);
      }
      return tx(`f(x) = ${exprB(p)} fonksiyonunun sürekli olması için k sabiti kaç olmalıdır?`, `What must the constant k be so that f(x) = ${exprB(p)} is continuous?`);
    }
    return tx(`f(x) = ${C[p.kind].expr(p)} için f(x) = ${N2(p.v[2])} denkleminin [${N2(Math.min(p.v[0], p.v[1]))}, ${N2(Math.max(p.v[0], p.v[1]))}] aralığında bir çözümü olduğunu Ara Değer Teoremi ile gösterebilir miyiz?` + (p.v[2] === 0 ? ' (Yani bir kök.)' : ''),
      `Can we use the Intermediate Value Theorem to show that the equation f(x) = ${N2(p.v[2])} has a solution in [${N2(Math.min(p.v[0], p.v[1]))}, ${N2(Math.max(p.v[0], p.v[1]))}] for f(x) = ${C[p.kind].expr(p)}?` + (p.v[2] === 0 ? ' (i.e. a root.)' : ''));
  }

  function solveSteps(p) {
    try {
      if (p.type === 'domain') return stepsA(p);
      if (p.type === 'param') return stepsB(p);
      return stepsC(p);
    } catch (e) {
      return [tx('Çözüm hesaplanamadı.', 'The solution could not be computed.')];
    }
  }

  function drawB(canvas, p) {
    const v = p.v;
    if (p.kind === 'ab') {
      const S = B.ab.sol(v);
      const a = p.showSolved ? S.a : v[4], b = p.showSolved ? S.b : v[5];
      const [c1, c2] = v;
      const f = B.ab.f(v, a, b);
      const yr = yRange([f], c1 - 3, c2 + 3, [S.V1, S.V2], 100);
      canvas.setViewport(c1 - 3, c2 + 3, yr[0], yr[1]);
      canvas.addFunction({ evaluator: (x) => (x < c1 ? f(x) : NaN), color: canvas.green(), thickness: 3 });
      canvas.addFunction({ evaluator: (x) => (x >= c1 && x <= c2 ? f(x) : NaN), color: canvas.accent(), thickness: 3 });
      canvas.addFunction({ evaluator: (x) => (x > c2 ? f(x) : NaN), color: canvas.purple(), thickness: 3 });
      canvas.addGuideLine({ axis: 'vertical', position: c1, color: canvas.gray() });
      canvas.addGuideLine({ axis: 'vertical', position: c2, color: canvas.gray() });
      // required values (left piece end / right piece start) as hollow targets, actual middle values as filled
      canvas.addMarker({ x: c1, y: S.V1, color: canvas.gold(), hollow: true, radius: 8, label: N2(S.V1) });
      canvas.addMarker({ x: c2, y: S.V2, color: canvas.gold(), hollow: true, radius: 8, label: N2(S.V2) });
      canvas.addMarker({ x: c1, y: a * c1 + b, color: canvas.gold(), radius: 5 });
      canvas.addMarker({ x: c2, y: a * c2 + b, color: canvas.gold(), radius: 5 });
      return;
    }
    const K = B[p.kind];
    const idx = K.specs().length - 1;
    const an = K.ans(v);
    const kv = p.showSolved ? an.n / an.d : v[idx];
    const j = K.junction(v, kv);
    const dm = K.dom(v);
    const f = K.f(v, kv);
    const yr = yRange([f], dm[0], dm[1], [j.L, j.R], 120);
    canvas.setViewport(dm[0], dm[1], yr[0], yr[1]);
    if (p.kind === 'k4' || p.kind === 'k5') {
      // line/curve with a hole + isolated point f(c)=k
      canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3 });
      canvas.addGuideLine({ axis: 'vertical', position: j.c, color: canvas.gray() });
      canvas.addMarker({ x: j.c, y: j.L, color: canvas.orange(), hollow: true, radius: 8, label: tx('limit', 'limit') + ' ' + N2(j.L) });
      canvas.addMarker({ x: j.c, y: j.R, color: canvas.gold(), radius: 6, label: 'f(c) = ' + N2(j.R) });
    } else {
      const c = j.c;
      canvas.addFunction({ evaluator: (x) => (x < c ? f(x) : NaN), color: canvas.green(), thickness: 3 });
      canvas.addFunction({ evaluator: (x) => (x >= c ? f(x) : NaN), color: canvas.accent(), thickness: 3 });
      canvas.addGuideLine({ axis: 'vertical', position: c, color: canvas.gray() });
      canvas.addMarker({ x: c, y: j.R, color: canvas.gold(), radius: 7, label: 'f(c) = ' + N2(j.R) });
      canvas.addMarker({ x: c, y: j.L, color: canvas.gold(), hollow: true, radius: 7, label: tx('sol limit ', 'left limit ') + N2(j.L) });
    }
  }

  function draw(canvas, p) {
    try {
      if (p.type === 'domain') { const K = A[p.kind]; if (K.norm) K.norm(p.v); K.draw(canvas, p.v); }
      else if (p.type === 'param') drawB(canvas, p);
      else drawC(canvas, p);
    } catch (e) { canvas.setViewport(-5, 5, -5, 5); }
  }

  // point the question is about (centre of the graph window)
  function focus(p) {
    try {
      if (p.type === 'domain') {
        const K = A[p.kind];
        if (K.norm) K.norm(p.v);
        let vp = null;
        const rec = new Proxy({}, { get: (t, k) => (k === 'setViewport' ? (a, b, c, d) => { vp = [a, b, c, d]; } : () => 'x') });
        K.draw(rec, p.v);
        if (p.kind === 'rational') { const q = A.rational.pts(p.v); return { x: (q.a + q.b) / 2, y: 0 }; }
        return vp ? { x: (vp[0] + vp[1]) / 2, y: (vp[2] + vp[3]) / 2 } : null;
      }
      if (p.type === 'param') {
        const v = p.v;
        if (p.kind === 'ab') { const S = B.ab.sol(v); return { x: (v[0] + v[1]) / 2, y: (S.V1 + S.V2) / 2 }; }
        const K = B[p.kind];
        const idx = K.specs().length - 1;
        const an = K.ans(v);
        const kv = p.showSolved ? an.n / an.d : v[idx];
        const j = K.junction(v, kv);
        return { x: j.c, y: (j.L + j.R) / 2 };
      }
      const A_ = analyzeC(p);
      const x = A_.ok ? A_.root : (A_.lo + A_.hi) / 2;
      return Number.isFinite(x) && Number.isFinite(A_.N) ? { x, y: A_.N } : null;
    } catch (e) { return null; }
  }

  // ================================================================= concept
  function concept(p) {
    const base = tx(
      "SÜREKLİLİK — TANIM: f fonksiyonu x = c noktasında SÜREKLİDİR ⇔ üç koşul birlikte sağlanır:\n" +
      "   (1) f(c) tanımlı,\n" +
      "   (2) lim (x→c) f(x) var (sol limit = sağ limit),\n" +
      "   (3) lim (x→c) f(x) = f(c).\n" +
      "   Tek taraflı süreklilik: soldan sürekli ⇔ lim (x→c⁻) f(x) = f(c); sağdan sürekli ⇔ lim (x→c⁺) f(x) = f(c). f, c'de sürekli ⇔ hem soldan hem sağdan sürekli.\n" +
      "\n" +
      "ARALIKTA SÜREKLİLİK: f bir AÇIK aralıkta (a, b) sürekli ⇔ aralığın her noktasında sürekli. f KAPALI [a, b] aralığında sürekli ⇔ (a, b)'de sürekli, a'da SAĞDAN sürekli ve b'de SOLDAN sürekli. Uç noktalarda yalnızca içe doğru olan tek taraflı limit istenir.\n" +
      "\n" +
      "HANGİ FONKSİYONLAR SÜREKLİDİR?\n" +
      "   - Polinomlar: her yerde.   - Rasyonel fonksiyonlar: payda ≠ 0 olan her yerde (tanım kümesinde).\n" +
      "   - Kök fonksiyonları: √x [0, ∞)'da (0'da sağdan).   - sin, cos: her yerde; tan, sec: cos ≠ 0 yerlerde; cot, csc: sin ≠ 0 yerlerde.\n" +
      "   - eˣ: her yerde.   - ln x: (0, ∞)'da.   - |x|: her yerde.\n" +
      "   Cebir: f, g sürekli ⇒ f ± g, f·g, kf sürekli; f/g, g ≠ 0 yerlerde sürekli; f∘g (g sürekli, f g(c)'de sürekli) sürekli.\n" +
      "   Bu yüzden 'nerede süreklidir?' sorusu çoğunlukla TANIM KÜMESİ sorusudur: payda ≠ 0, kök içi ≥ 0, ln içi > 0, cos ≠ 0.\n" +
      "\n" +
      "PARAMETRELİ PARÇALI FONKSİYON: Birleşim noktasında sol limit = sağ limit = f(c) eşitliklerini yazıp bilinmeyen sabiti çöz. İki bilinmeyen için iki birleşim noktası (iki denklem) gerekir.\n" +
      "\n" +
      "ARA DEĞER TEOREMİ (AdT): f, [a, b]'de SÜREKLİ ve N, f(a) ile f(b) arasında ise (a, b)'de f(c) = N olan en az bir c vardır. Özel durum: f(a)·f(b) < 0 ⇒ (a, b)'de en az bir KÖK. AdT VARLIĞI söyler; kökü bulmaz, sayısını vermez. Kökü daraltmak için ikiye bölme: orta noktanın işaretine bak, işaret değişen yarıyı al.\n" +
      "\n" +
      "YÖNTEM:\n" +
      "   (1) Fonksiyonun türünü belirle (polinom, oran, kök, ln, parçalı).\n" +
      "   (2) Tanım kümesi kısıtlarını yaz ve çöz; parçalı ise birleşim noktalarını incele.\n" +
      "   (3) Sürekli olduğu aralıkları ve uçlardaki tek taraflı süreklilikleri yaz.\n" +
      "   (4) Parametre varsa: sol limit = sağ limit = f(c) denklemini çöz ve DOĞRULA.\n" +
      "   (5) AdT için: sürekliliği gerekçelendir, f(a), f(b) hesapla, N'nin arada olduğunu göster, sonucu yaz.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - 'Tanımlı olduğu her yerde sürekli' ile 'her yerde sürekli' karıştırmak (1/x, x = 0'da tanımsız ama kendi tanım kümesinde süreklidir).\n" +
      "   - Kapalı aralıkta uçlarda iki taraflı limit aramak; tek taraflı yeterlidir.\n" +
      "   - AdT'de sürekliliği kontrol etmemek (ör. 1/x, [−1, 1]'de işaret değiştirir ama kök yoktur).\n" +
      "   - AdT'yi 'N dışarıdaysa çözüm yoktur' diye yorumlamak; teorem bu durumda sessizdir.\n" +
      "   - Parametre denkleminde değeri f(c) için yanlış parçadan almak (hangi parça '≥ c' ise f(c) oradan gelir).\n" +
      "   - ln x için a ≤ 0 aralığında AdT uygulamak.\n" +
      "\n" +
      "MİNİ ÖRNEK: f(x) = x³ − 3x + 1, [0, 1]. Polinom ⇒ sürekli. f(0) = 1 > 0, f(1) = −1 < 0 ⇒ 0 değeri arada ⇒ (0, 1)'de en az bir kök. Orta nokta 0,5: f = −0,375 < 0 ⇒ kök (0, 0,5)'te; 0,25: f ≈ 0,266 > 0 ⇒ kök (0,25, 0,5)'te; ... kök ≈ 0,3473.\n" +
      "\n" +
      "HAFIZA KARTI: 'Kalem kalkmadan çiz!' Süreksizlik = kalem kalkar: delik, sıçrama, asimptot. AdT = 'Sürekli yol, iki yükseklik arasındaki her yüksekliği geçer'.",
      "CONTINUITY — DEFINITION: f is CONTINUOUS at x = c ⇔ all three conditions hold:\n" +
      "   (1) f(c) is defined,\n" +
      "   (2) lim (x→c) f(x) exists (left limit = right limit),\n" +
      "   (3) lim (x→c) f(x) = f(c).\n" +
      "   One-sided continuity: continuous from the left ⇔ lim (x→c⁻) f(x) = f(c); from the right ⇔ lim (x→c⁺) f(x) = f(c). f is continuous at c ⇔ continuous from both sides.\n" +
      "\n" +
      "CONTINUITY ON AN INTERVAL: f is continuous on an OPEN interval (a, b) ⇔ it is continuous at every point of it. f is continuous on the CLOSED interval [a, b] ⇔ continuous on (a, b), continuous from the RIGHT at a and from the LEFT at b. At end points only the inward one-sided limit is required.\n" +
      "\n" +
      "WHICH FUNCTIONS ARE CONTINUOUS?\n" +
      "   - Polynomials: everywhere.   - Rational functions: wherever the denominator ≠ 0 (on their domain).\n" +
      "   - Root functions: √x on [0, ∞) (from the right at 0).   - sin, cos: everywhere; tan, sec: where cos ≠ 0; cot, csc: where sin ≠ 0.\n" +
      "   - eˣ: everywhere.   - ln x: on (0, ∞).   - |x|: everywhere.\n" +
      "   Algebra: f, g continuous ⇒ f ± g, f·g, kf continuous; f/g continuous where g ≠ 0; f∘g (g continuous, f continuous at g(c)) is continuous.\n" +
      "   So 'where is f continuous?' is mostly a DOMAIN question: denominator ≠ 0, radicand ≥ 0, ln argument > 0, cos ≠ 0.\n" +
      "\n" +
      "PIECEWISE FUNCTION WITH A PARAMETER: at each junction write left limit = right limit = f(c) and solve for the unknown constant. Two unknowns need two junctions (two equations).\n" +
      "\n" +
      "INTERMEDIATE VALUE THEOREM (IVT): if f is CONTINUOUS on [a, b] and N lies between f(a) and f(b), then there is at least one c in (a, b) with f(c) = N. Special case: f(a)·f(b) < 0 ⇒ at least one ROOT in (a, b). The IVT states EXISTENCE; it does not find the root or count roots. To narrow a root use bisection: look at the sign at the midpoint and keep the half where the sign changes.\n" +
      "\n" +
      "METHOD:\n" +
      "   (1) Identify the type of function (polynomial, quotient, root, ln, piecewise).\n" +
      "   (2) Write and solve the domain restrictions; for piecewise functions examine the junctions.\n" +
      "   (3) State the intervals of continuity and the one-sided continuity at the ends.\n" +
      "   (4) With a parameter: solve left limit = right limit = f(c) and VERIFY.\n" +
      "   (5) For the IVT: justify continuity, compute f(a), f(b), show N is in between, state the conclusion.\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Confusing 'continuous wherever defined' with 'continuous everywhere' (1/x is not defined at 0 but continuous on its own domain).\n" +
      "   - Looking for two-sided limits at the ends of a closed interval; one-sided is enough.\n" +
      "   - Forgetting to check continuity in the IVT (e.g. 1/x changes sign on [−1, 1] but has no root).\n" +
      "   - Reading the IVT as 'if N is outside, there is no solution'; the theorem is silent in that case.\n" +
      "   - Taking f(c) from the wrong piece in the parameter equation (the piece with '≥ c' gives f(c)).\n" +
      "   - Applying the IVT to ln x on an interval with a ≤ 0.\n" +
      "\n" +
      "MINI EXAMPLE: f(x) = x³ − 3x + 1 on [0, 1]. Polynomial ⇒ continuous. f(0) = 1 > 0, f(1) = −1 < 0 ⇒ 0 is in between ⇒ at least one root in (0, 1). Midpoint 0.5: f = −0.375 < 0 ⇒ root in (0, 0.5); 0.25: f ≈ 0.266 > 0 ⇒ root in (0.25, 0.5); ... root ≈ 0.3473.\n" +
      "\n" +
      "MEMORY AID: 'Draw without lifting the pencil!' A discontinuity = the pencil lifts: hole, jump, asymptote. The IVT = 'a continuous path crosses every height between its two end heights'.");
    let hint = '';
    if (p.type === 'domain') hint = tx('\n\nŞİMDİKİ SORU: tanım kümesi analizi. Kısıtları (payda, kök içi, ln içi, cos) yazın.', '\n\nCURRENT PROBLEM: domain analysis. Write the restrictions (denominator, radicand, ln argument, cos).');
    else if (p.type === 'param') hint = tx('\n\nŞİMDİKİ SORU: parametre. Sürgü ile bir deneme değeri verebiliriz; sıçrama sıfırlanınca süreklilik sağlanır. "Çözümü göster" ile doğru değeri görebiliriz.', '\n\nCURRENT PROBLEM: parameter. We can try a value with the slider; the jump closes once the function is continuous. "Show the solution" reveals the exact value.');
    else hint = tx('\n\nŞİMDİKİ SORU: Ara Değer Teoremi. a, b ve N sürgülerini oynatın: N, f(a) ile f(b) arasındaysa turuncu y = N doğrusu eğriyi (a, b) içinde keser.', '\n\nCURRENT PROBLEM: Intermediate Value Theorem. Move the a, b and N sliders: when N lies between f(a) and f(b), the orange line y = N meets the curve inside (a, b).');
    return base + hint;
  }

  // ================================================================= controls
  function syncRows(p) {
    if (sliderRows.length === 0 || !p) return;
    const specs = specsOf(p);
    for (let i = 0; i < sliderRows.length; i++) {
      const row = sliderRows[i];
      if (i >= specs.length) { row.block.style.display = 'none'; continue; }
      const sp = specs[i];
      row.block.style.display = '';
      row.captionEl.textContent = sp.cap;
      const val = p.v[sp.idx];
      row.valueEl.textContent = fmt2(val);
      const ratio = (val - sp.min) / (sp.max - sp.min);
      row.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
    }
  }

  function buildControls(rightCol, getProblem, helpers) {
    const sel = helpers.addSelect({
      options: [
        { label: tx('Soru türü: rastgele', 'Problem type: random'), value: 'random' },
        { label: tx('Nerede sürekli? (aralıklar)', 'Where is f continuous? (intervals)'), value: 'domain' },
        { label: tx('Parametre / sabit bulma', 'Find the constant(s)'), value: 'param' },
        { label: tx('Ara Değer Teoremi', 'Intermediate Value Theorem'), value: 'ivt' },
      ],
      get: () => forcedType,
      set: (v) => { forcedType = String(v); helpers.regenerate(); },
    });

    const solvedRow = document.createElement('label');
    solvedRow.className = 'we-checkbox-row';
    const solvedIn = document.createElement('input');
    solvedIn.type = 'checkbox';
    const solvedSpan = document.createElement('span');
    solvedRow.appendChild(solvedIn);
    solvedRow.appendChild(solvedSpan);
    rightCol.appendChild(solvedRow);
    solvedIn.addEventListener('change', () => { const p = getProblem(); p.showSolved = solvedIn.checked; helpers.refresh(); });
    function updSolved() {
      const p = getProblem();
      solvedSpan.textContent = tx('Çözülen değeri çiz (parametre sorusu)', 'Draw the solved value (parameter problems)');
      solvedRow.style.display = p && p.type === 'param' ? '' : 'none';
      solvedIn.checked = !!(p && p.showSolved);
    }

    sliderRows = [];
    for (let i = 0; i < 6; i++) {
      const idx = i;
      const block = document.createElement('div');
      block.className = 'we-slider-block';
      const captionEl = document.createElement('div');
      captionEl.className = 'we-slider-caption';
      const valueEl = document.createElement('div');
      valueEl.className = 'we-slider-value';
      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'we-slider';
      input.min = '0'; input.max = '1000'; input.step = '1';
      block.appendChild(captionEl);
      block.appendChild(valueEl);
      block.appendChild(input);
      rightCol.appendChild(block);
      input.addEventListener('input', () => {
        const p = getProblem();
        const specs = specsOf(p);
        if (idx >= specs.length) return;
        const sp = specs[idx];
        let val = sp.min + (Number(input.value) / 1000) * (sp.max - sp.min);
        val = Math.round(val / sp.step) * sp.step;
        val = Math.max(sp.min, Math.min(sp.max, val));
        p.v[sp.idx] = Math.round(val * 10000) / 10000;
        if (p.type === 'domain' && A[p.kind].norm) A[p.kind].norm(p.v);
        if (p.type === 'param') p.showSolved = false;
        valueEl.textContent = fmt2(p.v[sp.idx]);
        updSolved();
        helpers.refresh();
      });
      sliderRows.push({ block, captionEl, valueEl, input });
    }
    syncRows(getProblem());
    updSolved();

    if (offLang) offLang();
    offLang = I18N.onChange(() => {
      const labels = [
        tx('Soru türü: rastgele', 'Problem type: random'),
        tx('Nerede sürekli? (aralıklar)', 'Where is f continuous? (intervals)'),
        tx('Parametre / sabit bulma', 'Find the constant(s)'),
        tx('Ara Değer Teoremi', 'Intermediate Value Theorem'),
      ];
      for (let i = 0; i < sel.select.options.length && i < labels.length; i++) sel.select.options[i].textContent = labels[i];
      syncRows(getProblem());
      updSolved();
    });
    // keep rows in sync after "New Example" (framework calls createProblem then refresh): wrap via refresh hook
    const origRefresh = helpers.refresh;
    void origRefresh;
    buildControls._sync = () => { syncRows(getProblem()); updSolved(); };
  }

  // after createProblem the framework only resyncs registered sliders; sync ours lazily from draw
  function drawWithSync(canvas, p) {
    if (buildControls._sync) buildControls._sync();
    draw(canvas, p);
  }

  Topics.register('limits', {
    id: 'continuityAdvanced',
    tabTitle: () => tx('Süreklilik: Aralıklar, Parametre, Ara Değer', 'Continuity: Intervals, Parameters & IVT'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw: drawWithSync,
    focus,
    buildControls,
    links: [
      { match: /^(ARALIKTA SÜREKLİLİK|CONTINUITY ON AN INTERVAL):/, make: (rng) => gen(rng, 'domain', rng.pick(['rational', 'sqrtLin', 'sqrtIn', 'piece'])) },
      { match: /^\s*(Tek taraflı süreklilik|One-sided continuity):/, make: (rng) => gen(rng, 'domain', 'piece') },
      { match: /^\s*- (Polinomlar|Polynomials):/, make: (rng) => gen(rng, 'domain', 'rational') },
      { match: /^\s*- (Kök fonksiyonları|Root functions):/, make: (rng) => gen(rng, 'domain', rng.pick(['sqrtLin', 'sqrtOut', 'sqrtIn', 'sqrtOverX'])) },
      { match: /^\s*- eˣ: /, make: (rng) => gen(rng, 'domain', 'logLin') },
      { match: /^(PARAMETRELİ PARÇALI FONKSİYON|PIECEWISE FUNCTION WITH A PARAMETER):/, make: (rng) => gen(rng, 'param', null) },
      { match: /^(ARA DEĞER TEOREMİ|INTERMEDIATE VALUE THEOREM) /, make: (rng) => gen(rng, 'ivt', null) },
    ],
    _specs: specsOf,
  });
})();
