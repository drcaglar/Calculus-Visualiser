// Limits at infinity and asymptotes (vertical, horizontal, slant) - new tab (textbook section
// "Limits Involving Infinity; Asymptotes of Graphs").
// problem = { kind, ..., s, neg }   x slider: |x| = 10^s (1..3), neg = look at the x -> -inf end.
//  kind 0: (ux+v)/(D(x-p)(x-q))   1: (Ax^2+Bx+C)/(D(x-p)(x-q))   2: (Ax^2+Bx+C)/(x-p)  (slant)
//  kind 3: c + A e^(-x)   4: L/(1+e^(-x))   5: sqrt(x^2+2hx+c) - x   6: sqrt(q1) - sqrt(q2)   7: (Ax+B)/sqrt(x^2+k)
(function () {
  const M = (n) => (n < 0 ? '−' + (-n) : String(n));
  const INF = (s) => (s > 0 ? '+∞' : '−∞');
  const sig3 = (v) => { const t = Number(Math.abs(v) < 1e-12 ? 0 : v.toPrecision(3)); return String(t === 0 ? 0 : t).replace('-', '−'); };
  const xm = (r) => (r === 0 ? 'x' : (r > 0 ? `x − ${r}` : `x + ${-r}`));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const frac = (n, d) => { const g = gcd(n, d); n /= g; d /= g; if (d < 0) { n = -n; d = -d; } return d === 1 ? M(n) : `${M(n)}/${d}`; };
  const S_MIN = 1, S_MAX = 3;

  function poly(cs) {
    let out = '';
    cs.forEach((c, i) => {
      const d = cs.length - 1 - i;
      if (c === 0) return;
      const ab = Math.abs(c);
      const co = (ab === 1 && d > 0) ? '' : String(ab);
      const v = d === 0 ? '' : (d === 1 ? 'x' : `x${d === 2 ? '²' : '^' + d}`);
      if (out === '') out = (c < 0 ? '−' : '') + co + v;
      else out += (c < 0 ? ' − ' : ' + ') + co + v;
    });
    return out === '' ? '0' : out;
  }
  // c0/x^k style terms of a polynomial divided by its highest power x^n (cs highest-first)
  function divTerms(cs) {
    const n = cs.length - 1; let out = '';
    cs.forEach((c, i) => {
      if (c === 0) return;
      const t = i === 0 ? String(Math.abs(c)) : `${Math.abs(c)}/x${i === 1 ? '' : '²'}`;
      out += out === '' ? (c < 0 ? '−' : '') + t : (c < 0 ? ' − ' : ' + ') + t;
    });
    return out === '' ? '0' : out;
  }
  const oneMinus = (r) => (r === 0 ? '1' : `(1 ${r > 0 ? '−' : '+'} ${Math.abs(r)}/x)`);
  const denDiv = (D, p, q) => [D === 1 ? '1' : String(D), oneMinus(p), oneMinus(q)].filter((t, i) => i === 0 ? D !== 1 : t !== '1').join('·') || '1';
  const hv = (x, cs) => cs.reduce((acc, c) => acc * x + c, 0);
  const lineStr = (m, b) => poly([m, b]);

  function createProblem(rng) { return gen(rng, null); }
  function gen(rng, forced) {
    for (;;) {
      const kind = forced === null ? rng.nextInt(0, 8) : forced;
      const p = { kind, s: 1.0, neg: false, D: rng.nextInt(1, 3), p: 0, q: 0, nc: [], A: 0, B: 0, C: 0, c: 0, L: 0, h: 0, k: 0, t1: 0, t2: 0, k2: 0, u: 0, v: 0 };
      p.p = rng.nextInt(-3, 4);
      p.q = p.p + rng.nonZeroInt(-3, 3);
      if (kind === 0) {
        p.u = rng.nextInt(-3, 4); p.v = rng.nextInt(-4, 5);
        if (p.u === 0 && p.v === 0) continue;
        p.nc = [p.u, p.v];
      } else if (kind === 1) {
        p.A = rng.nonZeroInt(-4, 4); p.B = rng.nextInt(-4, 5); p.C = rng.nextInt(-4, 5);
        p.nc = [p.A, p.B, p.C];
      } else if (kind === 2) {
        p.A = rng.pick([-2, -1, 1, 2, 3]); p.B = rng.nextInt(-4, 5); p.C = rng.nextInt(-4, 5);
        p.D = 1; p.nc = [p.A, p.B, p.C];
      } else if (kind === 3) {
        p.c = rng.nonZeroInt(-3, 3); p.A = rng.nonZeroInt(-3, 3);
      } else if (kind === 4) {
        p.L = rng.pick([-3, -2, 2, 3, 4, 5]);
      } else if (kind === 5) {
        p.h = rng.nonZeroInt(-3, 3); p.t1 = rng.nextInt(0, 3);
      } else if (kind === 6) {
        p.h = rng.nextInt(-3, 4); p.k = rng.nextInt(-3, 4);
        if (p.h === p.k) continue;
        p.t1 = rng.nextInt(0, 3); p.t2 = rng.nextInt(0, 3);
      } else if (kind === 8) {
        p.A = rng.pick([-2, -1, 1, 2]); p.B = rng.nextInt(-3, 4); p.C = rng.nextInt(-4, 5); p.D = 1;
      } else {
        p.A = rng.nonZeroInt(-4, 4); p.B = rng.nextInt(-3, 4); p.k2 = rng.nextInt(1, 10);
      }
      // vertical asymptotes must be genuine (numerator nonzero at the denominator roots)
      const inf = info(p);
      if (!inf) continue;
      if (inf.badVA) continue;
      p.limPos = inf.limPos; p.limNeg = inf.limNeg;
      return p;
    }
  }

  // ---- model ----
  function info(p) {
    const o = { vas: [], has: [], slant: null, g: null, fn: '', limPos: 0, limNeg: 0, posS: '', negS: '', badVA: false };
    const D = p.D;
    const finish = () => {
      o.f = (x) => { const y = o.g(x); return (Number.isFinite(y) && Math.abs(y) <= 1e7) ? y : NaN; };
      return o;
    };
    const num = (x) => hv(x, p.nc);
    if (p.kind <= 2) {
      const roots = p.kind === 2 ? [p.p] : [p.p, p.q];
      const denS = p.kind === 2 ? `(${xm(p.p)})` : `${D === 1 ? '' : D}(${xm(p.p)})(${xm(p.q)})`;
      o.fn = `f(x) = (${poly(p.nc)}) / (${denS})`;
      o.g = (x) => { let d = D; roots.forEach((r) => { d *= (x - r); }); return Math.abs(d) < 1e-9 ? NaN : num(x) / d; };
      roots.forEach((r) => {
        const n = num(r);
        if (n === 0) o.badVA = true;
        let s0 = Math.sign(n) * Math.sign(D);
        roots.forEach((q) => { if (q !== r) s0 *= Math.sign(r - q); });
        o.vas.push({ x: r, num: n, right: s0, left: -s0 });
      });
      if (p.kind === 0) {
        o.limPos = 0; o.limNeg = 0; o.posS = '0'; o.negS = '0';
        o.has.push({ y: 0, ys: '0', side: 'B' });
      } else if (p.kind === 1) {
        o.limPos = o.limNeg = p.A / D; o.posS = o.negS = frac(p.A, D);
        o.has.push({ y: p.A / D, ys: frac(p.A, D), side: 'B' });
      } else {
        const b = p.B + p.A * p.p, R = p.C + p.p * b;
        o.rem = R; o.quot = [p.A, b];
        if (R === 0) o.badVA = true;
        o.limPos = Math.sign(p.A) * Infinity; o.limNeg = -Math.sign(p.A) * Infinity;
        o.posS = INF(p.A); o.negS = INF(-p.A);
        o.slant = { m: p.A, b, side: 'B' };
      }
      return finish();
    }
    if (p.kind === 8) { // n = m + 2: no horizontal / slant asymptote, ends go to infinity
      const nc = [p.A, 0, p.B, p.C];
      o.fn = `f(x) = (${poly(nc)}) / (${xm(p.p)})`;
      o.g = (x) => (Math.abs(x - p.p) < 1e-9 ? NaN : hv(x, nc) / (x - p.p));
      const n = hv(p.p, nc);
      if (n === 0) o.badVA = true;
      o.vas.push({ x: p.p, num: n, right: Math.sign(n), left: -Math.sign(n) });
      o.limPos = o.limNeg = Math.sign(p.A) * Infinity; o.posS = o.negS = INF(p.A);
      return finish();
    }
    if (p.kind === 3) {
      o.fn = `f(x) = ${M(p.c)} ${p.A > 0 ? '+' : '−'} ${Math.abs(p.A) === 1 ? '' : Math.abs(p.A) + '·'}e^(−x)`;
      o.g = (x) => p.c + p.A * Math.exp(-x);
      o.limPos = p.c; o.posS = M(p.c);
      o.limNeg = Math.sign(p.A) * Infinity; o.negS = INF(p.A);
      o.has.push({ y: p.c, ys: M(p.c), side: 'R' });
      return finish();
    }
    if (p.kind === 4) {
      o.fn = `f(x) = ${M(p.L)} / (1 + e^(−x))`;
      o.g = (x) => p.L / (1 + Math.exp(-x));
      o.limPos = p.L; o.posS = M(p.L); o.limNeg = 0; o.negS = '0';
      o.has.push({ y: p.L, ys: M(p.L), side: 'R' }, { y: 0, ys: '0', side: 'L' });
      return finish();
    }
    const qs = (h, t) => poly([1, 2 * h, h * h + t]);
    if (p.kind === 5) {
      const h = p.h, c = h * h + p.t1;
      o.fn = `f(x) = √(${qs(h, p.t1)}) − x`;
      o.g = (x) => { const r = x * x + 2 * h * x + c; return r < 0 ? NaN : Math.sqrt(r) - x; };
      o.limPos = h; o.posS = M(h); o.limNeg = Infinity; o.negS = '+∞';
      o.has.push({ y: h, ys: M(h), side: 'R' });
      o.slant = { m: -2, b: -h, side: 'L' };
      return finish();
    }
    if (p.kind === 6) {
      const h = p.h, k = p.k;
      o.fn = `f(x) = √(${qs(h, p.t1)}) − √(${qs(k, p.t2)})`;
      o.g = (x) => { const r1 = (x + h) * (x + h) + p.t1, r2 = (x + k) * (x + k) + p.t2; return Math.sqrt(r1) - Math.sqrt(r2); };
      o.limPos = h - k; o.posS = M(h - k); o.limNeg = k - h; o.negS = M(k - h);
      o.has.push({ y: h - k, ys: M(h - k), side: 'R' }, { y: k - h, ys: M(k - h), side: 'L' });
      return finish();
    }
    o.fn = `f(x) = (${poly([p.A, p.B])}) / √(x² + ${p.k2})`;
    o.g = (x) => (p.A * x + p.B) / Math.sqrt(x * x + p.k2);
    o.limPos = p.A; o.posS = M(p.A); o.limNeg = -p.A; o.negS = M(-p.A);
    o.has.push({ y: p.A, ys: M(p.A), side: 'R' }, { y: -p.A, ys: M(-p.A), side: 'L' });
    return finish();
  }

  function xOf(p) { const s = Math.max(S_MIN, Math.min(S_MAX, p.s)); return (p.neg ? -1 : 1) * Math.pow(10, s); }

  function bigStr(y) {
    if (Number.isFinite(y) && Math.abs(y) < 1e7) return sig3(y);
    return y > 0 ? I18N.tx('+∞ (çok büyük)', '+∞ (huge)') : I18N.tx('−∞ (çok büyük)', '−∞ (huge)');
  }

  function problemStatement(p) {
    const o = info(p);
    if (p.kind <= 2 || p.kind === 8) {
      return I18N.tx(
        `${o.fn} için lim(x→+∞) f(x) ve lim(x→−∞) f(x) limitlerini bulalım; ardından fonksiyonun TÜM asimptotlarını (düşey, yatay ve varsa eğik) belirleyelim.`,
        `For ${o.fn} let's find lim(x→+∞) f(x) and lim(x→−∞) f(x), and then determine ALL asymptotes of the graph (vertical, horizontal and, if any, slant).`);
    }
    if (p.kind === 5 || p.kind === 6) {
      return I18N.tx(
        `${o.fn} için lim(x→+∞) f(x) ve lim(x→−∞) f(x) limitlerini hesaplayalım (∞ − ∞ belirsizliğine dikkat etmekte fayda var) ve yatay/eğik asimptotları belirleyelim.`,
        `For ${o.fn} let's compute lim(x→+∞) f(x) and lim(x→−∞) f(x) (it helps to watch for the ∞ − ∞ form) and determine the horizontal / slant asymptotes.`);
    }
    return I18N.tx(
      `${o.fn} için lim(x→+∞) f(x) ve lim(x→−∞) f(x) limitlerini bulup yatay asimptotları belirleyelim. İki uçta davranış aynı mı acaba?`,
      `For ${o.fn} let's find lim(x→+∞) f(x) and lim(x→−∞) f(x) and determine the horizontal asymptotes. Is the end behaviour the same at both ends?`);
  }

  function concept() {
    return I18N.tx(
      "SONSUZDA LİMİT VE ASİMPTOTLAR\n" +
      "\n" +
      "TANIM: lim(x→+∞) f(x) = L, x yeterince büyüdüğünde f(x)'in L'ye istenildiği kadar yaklaşması demektir; bu durumda y = L doğrusu f'nin YATAY ASİMPTOTUDUR. x → −∞ için ayrı hesaplanır: iki uçta farklı değerler (iki ayrı yatay asimptot) çıkabilir. lim = ±∞ ise f sınırsızca büyür (yatay asimptot yok).\n" +
      "\n" +
      "ASİMPTOT TÜRLERİ:\n" +
      "   - DÜŞEY x = a: lim(x→a⁺ veya a⁻) f(x) = ±∞ (payda 0, pay ≠ 0).\n" +
      "   - YATAY y = L: lim(x→±∞) f(x) = L.\n" +
      "   - EĞİK (ÇAPRAZ) y = mx + b: lim(x→±∞) [f(x) − (mx + b)] = 0. Katsayılar: m = lim f(x)/x (m ≠ 0, sonlu), b = lim [f(x) − mx].\n" +
      "\n" +
      "RASYONEL FONKSİYONLAR: f = P/Q, deg P = n, deg Q = m. Pay ve payda paydanın en yüksek kuvvetine bölünür; 1/xᵏ → 0 olur.\n" +
      "   n < m : yatay asimptot y = 0\n" +
      "   n = m : yatay asimptot y = (baş katsayıların oranı)\n" +
      "   n = m + 1 : eğik asimptot; polinom bölmesiyle bölüm mx + b'dir (kalan/payda → 0)\n" +
      "   n > m + 1 : yatay ya da eğik asimptot yok (ucu ±∞'a gider)\n" +
      "\n" +
      "KÖKLÜ İFADELER: √(x²) = |x|. x → +∞ iken √(x² + …)/x → +1, x → −∞ iken −1 (çünkü |x| = −x). √A − √B (ya da √A − x) biçiminde ∞ − ∞ belirsizliği çıkarsa EŞLENİKLE çarpıp bölebiliriz: √A − √B = (A − B)/(√A + √B).\n" +
      "\n" +
      "ÜSTEL FONKSİYONLAR: e^(−x) → 0 (x → +∞), e^(−x) → ∞ (x → −∞); e^x tersi. Yani üstel terimler iki uçta farklı davranır.\n" +
      "\n" +
      "YÖNTEM (tüm asimptotlar):\n" +
      "   (1) Payda sıfırlarını buluruz; pay ≠ 0 ise düşey asimptot vardır (tek taraflı işaretlere de bakarız).\n" +
      "   (2) lim(x→+∞) ve lim(x→−∞) ayrı ayrı hesaplanır; sonlu ise yatay asimptot vardır.\n" +
      "   (3) Rasyonel fonksiyonda dereceler karşılaştırılır; n = m + 1 ise eğik asimptot polinom bölmesiyle bulunur.\n" +
      "   (4) Köklü ifadede ∞ − ∞ çıkarsa eşlenikle çarpılır; kökü x'e bölerken x < 0 için işaret farkına dikkat etmek gerekir.\n" +
      "   (5) Tüm asimptotlar kesikli çizgilerle işaretlenir ve eğri bunlara göre düşünülür.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - Yatay asimptotun \"aşılamaz\" olduğunu sanmak; grafik orta bölgede kesebilir, yalnızca uçlarda yaklaşır.\n" +
      "   - x → −∞'de √(x²) = x yazmak; doğrusu −x.\n" +
      "   - ∞ − ∞ = 0 ya da ∞/∞ = 1 saymak; belirsizdir, cebirle çözülür.\n" +
      "   - Yalnızca x → +∞'a bakıp x → −∞'u aynı varsaymak (e^(−x), kök içeren ifadeler).\n" +
      "   - Delik ile düşey asimptotu karıştırmak (pay da 0 ise önce sadeleştirmek iyi olur).\n" +
      "   - n = m + 1 iken yatay asimptot aramak; burada eğik asimptot vardır.\n" +
      "\n" +
      "MİNİ ÖRNEK: f(x) = (x² + 1)/(x − 1). Payda 1'de 0, pay 2 ≠ 0 ⇒ düşey asimptot x = 1. n = 2 = m + 1 ⇒ eğik asimptot: x² + 1 = (x − 1)(x + 1) + 2, yani f = x + 1 + 2/(x − 1) ⇒ y = x + 1. Yatay asimptot yok.\n" +
      "\n" +
      "HAFIZA İPUCU: \"Üst küçükse sıfır, eşitse oran, bir fazlaysa eğik.\"",
      "LIMITS AT INFINITY AND ASYMPTOTES\n" +
      "\n" +
      "DEFINITION: lim(x→+∞) f(x) = L means f(x) gets as close to L as we like once x is large enough; then the line y = L is a HORIZONTAL ASYMPTOTE of f. The x → −∞ end is computed separately: the two ends may give different values (two different horizontal asymptotes). If lim = ±∞ then f grows without bound (no horizontal asymptote there).\n" +
      "\n" +
      "TYPES OF ASYMPTOTES:\n" +
      "   - VERTICAL x = a: lim(x→a⁺ or a⁻) f(x) = ±∞ (denominator 0, numerator ≠ 0).\n" +
      "   - HORIZONTAL y = L: lim(x→±∞) f(x) = L.\n" +
      "   - SLANT (OBLIQUE) y = mx + b: lim(x→±∞) [f(x) − (mx + b)] = 0. Coefficients: m = lim f(x)/x (m ≠ 0, finite), b = lim [f(x) − mx].\n" +
      "\n" +
      "RATIONAL FUNCTIONS: f = P/Q, deg P = n, deg Q = m. We divide numerator and denominator by the highest power in the denominator; 1/xᵏ → 0.\n" +
      "   n < m : horizontal asymptote y = 0\n" +
      "   n = m : horizontal asymptote y = (ratio of leading coefficients)\n" +
      "   n = m + 1 : slant asymptote; polynomial division gives the quotient mx + b (remainder/denominator → 0)\n" +
      "   n > m + 1 : no horizontal or slant asymptote (the ends go to ±∞)\n" +
      "\n" +
      "RADICALS: √(x²) = |x|. As x → +∞, √(x² + …)/x → +1, as x → −∞ it tends to −1 (because |x| = −x). If √A − √B (or √A − x) gives an ∞ − ∞ form, we can multiply and divide by the CONJUGATE: √A − √B = (A − B)/(√A + √B).\n" +
      "\n" +
      "EXPONENTIALS: e^(−x) → 0 as x → +∞ and e^(−x) → ∞ as x → −∞; e^x is the opposite. So exponential terms behave differently at the two ends.\n" +
      "\n" +
      "METHOD (all asymptotes):\n" +
      "   (1) We find the zeros of the denominator; if the numerator ≠ 0 there it is a vertical asymptote (find the one-sided signs).\n" +
      "   (2) We compute lim(x→+∞) and lim(x→−∞) separately; a finite value gives a horizontal asymptote.\n" +
      "   (3) For rational functions we compare degrees; if n = m + 1 we find the slant asymptote by polynomial division.\n" +
      "   (4) With radicals and ∞ − ∞ we use the conjugate; when dividing the root by x it helps to watch the sign for x < 0.\n" +
      "   (5) We mark all asymptotes with dashed lines and picture the curve relative to them.\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Thinking a horizontal asymptote can never be crossed; the graph may cross it in the middle region, it only approaches it at the ends.\n" +
      "   - Writing √(x²) = x as x → −∞; it is −x.\n" +
      "   - Treating ∞ − ∞ as 0 or ∞/∞ as 1; they are indeterminate and need algebra.\n" +
      "   - Looking only at x → +∞ and assuming x → −∞ is the same (e^(−x), radicals).\n" +
      "   - Confusing a hole with a vertical asymptote (if the numerator is also 0, it helps to simplify first).\n" +
      "   - Looking for a horizontal asymptote when n = m + 1; there is a slant asymptote instead.\n" +
      "\n" +
      "MINI EXAMPLE: f(x) = (x² + 1)/(x − 1). The denominator is 0 at 1 and the numerator is 2 ≠ 0 ⇒ vertical asymptote x = 1. n = 2 = m + 1 ⇒ slant asymptote: x² + 1 = (x − 1)(x + 1) + 2, i.e. f = x + 1 + 2/(x − 1) ⇒ y = x + 1. No horizontal asymptote.\n" +
      "\n" +
      "MEMORY AID: \"Smaller on top gives zero, equal gives the ratio, one higher gives a slant.\"");
  }

  // ---- steps ----
  function numericStep(p, o, idx) {
    const f = o.g;
    const row = (sign) => [10, 100, 1000].map((v) => `f(${sign < 0 ? '−' : ''}${v}) ≈ ${bigStr(f(sign * v))}`).join(',  ');
    const X = xOf(p), y = f(X);
    return I18N.tx(
      `── ${idx}) Sayısal kontrol ──\nx → +∞: ${row(1)}  (→ ${o.posS})\nx → −∞: ${row(-1)}  (→ ${o.negS})\nSeçili x = ${M(X)}: f(x) ≈ ${bigStr(y)}.`,
      `── ${idx}) Numerical check ──\nx → +∞: ${row(1)}  (→ ${o.posS})\nx → −∞: ${row(-1)}  (→ ${o.negS})\nSelected x = ${M(X)}: f(x) ≈ ${bigStr(y)}.`);
  }

  function summaryStep(p, o, idx) {
    const va = o.vas.map((v) => `x = ${M(v.x)}`);
    const ha = o.has.map((h) => `y = ${h.ys}` + (h.side === 'B' ? '' : (h.side === 'R' ? I18N.tx(' (yalnız x → +∞)', ' (only x → +∞)') : I18N.tx(' (yalnız x → −∞)', ' (only x → −∞)'))));
    const sl = o.slant ? [`y = ${lineStr(o.slant.m, o.slant.b)}` + (o.slant.side === 'B' ? '' : (o.slant.side === 'L' ? I18N.tx(' (yalnız x → −∞)', ' (only x → −∞)') : I18N.tx(' (yalnız x → +∞)', ' (only x → +∞)')))] : [];
    const none = I18N.tx('yok', 'none');
    return I18N.tx(
      `── ${idx}) Sonuç ──\nlim(x→+∞) f = ${o.posS},  lim(x→−∞) f = ${o.negS}.\nDüşey asimptot(lar): ${va.length ? va.join(', ') : none}\nYatay asimptot(lar): ${ha.length ? ha.join(', ') : none}\nEğik asimptot: ${sl.length ? sl.join(', ') : none}`,
      `── ${idx}) Conclusion ──\nlim(x→+∞) f = ${o.posS},  lim(x→−∞) f = ${o.negS}.\nVertical asymptote(s): ${va.length ? va.join(', ') : none}\nHorizontal asymptote(s): ${ha.length ? ha.join(', ') : none}\nSlant asymptote: ${sl.length ? sl.join(', ') : none}`);
  }

  function vaStep(p, o, idx) {
    const parts = o.vas.map((v) => {
      const lt = v.left, rt = v.right;
      return I18N.tx(
        `x = ${M(v.x)}: pay = ${M(v.num)} ≠ 0 ⇒ düşey asimptot. x → ${M(v.x)}⁻ : ${INF(lt)},  x → ${M(v.x)}⁺ : ${INF(rt)}.`,
        `x = ${M(v.x)}: numerator = ${M(v.num)} ≠ 0 ⇒ vertical asymptote. x → ${M(v.x)}⁻ : ${INF(lt)},  x → ${M(v.x)}⁺ : ${INF(rt)}.`);
    });
    return I18N.tx(
      `── ${idx}) Düşey asimptotlar ──\nPayda sıfırları: ${o.vas.map((v) => 'x = ' + M(v.x)).join(', ')}.\n${parts.join('\n')}`,
      `── ${idx}) Vertical asymptotes ──\nZeros of the denominator: ${o.vas.map((v) => 'x = ' + M(v.x)).join(', ')}.\n${parts.join('\n')}`);
  }

  function solveSteps(p) {
    const o = info(p), steps = [];
    steps.push(I18N.tx(`── 1) Fonksiyon ──\n${o.fn}\nAmacımız: iki uçtaki limitleri ve tüm asimptotları bulmak.`, `── 1) The function ──\n${o.fn}\nGoal: to find the limits at both ends and all asymptotes.`));
    if (p.kind <= 2) {
      steps.push(vaStep(p, o, 2));
      const degN = p.kind === 0 ? (p.u === 0 ? 0 : 1) : 2, degD = p.kind === 2 ? 1 : 2;
      const cmp = degN < degD ? '<' : (degN === degD ? '=' : '>');
      if (p.kind === 0) {
        const lead = p.u === 0 ? M(p.v) : M(p.u);
        steps.push(I18N.tx(
          `── 3) Sonsuzda limit (derece karşılaştırması) ──\ndeg(pay) = ${degN} ${cmp} deg(payda) = 2. Pay ve paydayı x²'ye bölelim:\nf(x) = (${divTerms([0, p.u, p.v])}) / (${denDiv(p.D, p.p, p.q)}) → 0 / ${p.D} = 0\nHer iki uçta (x → ±∞) limit 0 ⇒ yatay asimptot y = 0. (Baş terim: ${lead}.)`,
          `── 3) Limits at infinity (degree comparison) ──\ndeg(numerator) = ${degN} ${cmp} deg(denominator) = 2. Let's divide numerator and denominator by x²:\nf(x) = (${divTerms([0, p.u, p.v])}) / (${denDiv(p.D, p.p, p.q)}) → 0 / ${p.D} = 0\nThe limit is 0 at both ends (x → ±∞) ⇒ horizontal asymptote y = 0. (Leading term: ${lead}.)`));
        steps.push(I18N.tx(
          `── 4) Eğik asimptot? ──\nderece farkı ${degD - degN} > 0 olduğundan (n < m) eğik asimptot yoktur; eğri sonsuzda x-eksenine yapışır.`,
          `── 4) Slant asymptote? ──\nSince n < m (degree gap ${degD - degN} > 0) there is no slant asymptote; the curve hugs the x-axis at infinity.`));
      } else if (p.kind === 1) {
        steps.push(I18N.tx(
          `── 3) Sonsuzda limit (derece karşılaştırması) ──\ndeg(pay) = 2 = deg(payda). Pay ve paydayı x²'ye bölelim:\nf(x) = (${divTerms([p.A, p.B, p.C])}) / (${denDiv(p.D, p.p, p.q)}) → ${M(p.A)} / ${p.D} = ${frac(p.A, p.D)}\nHer iki uçta limit ${frac(p.A, p.D)} (baş katsayıların oranı) ⇒ yatay asimptot y = ${frac(p.A, p.D)}.`,
          `── 3) Limits at infinity (degree comparison) ──\ndeg(numerator) = 2 = deg(denominator). Let's divide numerator and denominator by x²:\nf(x) = (${divTerms([p.A, p.B, p.C])}) / (${denDiv(p.D, p.p, p.q)}) → ${M(p.A)} / ${p.D} = ${frac(p.A, p.D)}\nThe limit is ${frac(p.A, p.D)} at both ends (ratio of leading coefficients) ⇒ horizontal asymptote y = ${frac(p.A, p.D)}.`));
        steps.push(I18N.tx(
          `── 4) Eğik asimptot? ──\nn = m olduğundan eğik asimptot yoktur (yatay asimptot zaten var).`,
          `── 4) Slant asymptote? ──\nSince n = m there is no slant asymptote (the horizontal one already exists).`));
      } else {
        const b = o.quot[1], R = o.rem;
        steps.push(I18N.tx(
          `── 3) Polinom bölmesi (deg pay = ${degN} = deg payda + 1) ──\nSentetik bölme, kök x = ${p.p}:  ${M(p.A)} | ${M(p.B)} | ${M(p.C)}\n   ${M(p.A)}, ${M(p.B)} + ${M(p.A)}·${M(p.p)} = ${M(b)}, ${M(p.C)} + ${M(p.p)}·${M(b)} = ${M(R)}\nBölüm: ${poly([p.A, b])},  kalan: ${M(R)}.\nf(x) = ${poly([p.A, b])} + ${M(R)}/(${xm(p.p)}).`,
          `── 3) Polynomial division (deg numerator = ${degN} = deg denominator + 1) ──\nSynthetic division, root x = ${p.p}:  ${M(p.A)} | ${M(p.B)} | ${M(p.C)}\n   ${M(p.A)}, ${M(p.B)} + ${M(p.A)}·${M(p.p)} = ${M(b)}, ${M(p.C)} + ${M(p.p)}·${M(b)} = ${M(R)}\nQuotient: ${poly([p.A, b])},  remainder: ${M(R)}.\nf(x) = ${poly([p.A, b])} + ${M(R)}/(${xm(p.p)}).`));
        steps.push(I18N.tx(
          `── 4) Sonsuzda limit ve eğik asimptot ──\nx → ±∞ iken ${M(R)}/(${xm(p.p)}) → 0, yani f(x) − (${poly([p.A, b])}) → 0 ⇒ eğik asimptot y = ${lineStr(p.A, b)}.\nYatay asimptot yok: x → +∞ için f → ${INF(p.A)}, x → −∞ için f → ${INF(-p.A)}.`,
          `── 4) Limits at infinity and the slant asymptote ──\nAs x → ±∞, ${M(R)}/(${xm(p.p)}) → 0, i.e. f(x) − (${poly([p.A, b])}) → 0 ⇒ slant asymptote y = ${lineStr(p.A, b)}.\nNo horizontal asymptote: f → ${INF(p.A)} as x → +∞ and f → ${INF(-p.A)} as x → −∞.`));
      }
    } else if (p.kind === 8) {
      const q1 = p.A * p.p, q0 = p.B + q1 * p.p, R = p.C + q0 * p.p;
      const quad = poly([p.A, q1, q0]);
      steps.push(vaStep(p, o, 2));
      steps.push(I18N.tx(
        `── 3) Polinom bölmesi (deg pay = 3, deg payda = 1) ──\nSentetik bölme, kök x = ${p.p}:  ${M(p.A)} | 0 | ${M(p.B)} | ${M(p.C)}\n   ${M(p.A)}, 0 + ${M(p.A)}·${M(p.p)} = ${M(q1)}, ${M(p.B)} + ${M(p.p)}·${M(q1)} = ${M(q0)}, ${M(p.C)} + ${M(p.p)}·${M(q0)} = ${M(R)}\nBölüm: ${quad},  kalan: ${M(R)}.\nf(x) = ${quad} + ${M(R)}/(${xm(p.p)}).`,
        `── 3) Polynomial division (deg numerator = 3, deg denominator = 1) ──\nSynthetic division, root x = ${p.p}:  ${M(p.A)} | 0 | ${M(p.B)} | ${M(p.C)}\n   ${M(p.A)}, 0 + ${M(p.A)}·${M(p.p)} = ${M(q1)}, ${M(p.B)} + ${M(p.p)}·${M(q1)} = ${M(q0)}, ${M(p.C)} + ${M(p.p)}·${M(q0)} = ${M(R)}\nQuotient: ${quad},  remainder: ${M(R)}.\nf(x) = ${quad} + ${M(R)}/(${xm(p.p)}).`));
      steps.push(I18N.tx(
        `── 4) Sonsuzda limit ──\nn = 3 > m + 1 = 2: bölüm bir parabol (2. derece), doğru değil. x → ±∞ iken ${M(R)}/(${xm(p.p)}) → 0 ve f ≈ ${quad} → ${INF(p.A)} (iki uçta da).\nYatay asimptot yok, eğik asimptot da yok (yaklaşılan eğri bir parabol).`,
        `── 4) Limits at infinity ──\nn = 3 > m + 1 = 2: the quotient is a parabola (degree 2), not a line. As x → ±∞, ${M(R)}/(${xm(p.p)}) → 0 and f ≈ ${quad} → ${INF(p.A)} (at both ends).\nThere is no horizontal asymptote and no slant asymptote (the curve approaches a parabola).`));
    } else if (p.kind === 3) {
      steps.push(I18N.tx(
        `── 2) x → +∞ ──\ne^(−x) → 0 olduğundan f(x) → ${M(p.c)} + ${M(p.A)}·0 = ${M(p.c)}. Yatay asimptot: y = ${M(p.c)}.`,
        `── 2) x → +∞ ──\nSince e^(−x) → 0, f(x) → ${M(p.c)} + ${M(p.A)}·0 = ${M(p.c)}. Horizontal asymptote: y = ${M(p.c)}.`));
      steps.push(I18N.tx(
        `── 3) x → −∞ ──\n−x → +∞ olduğundan e^(−x) → +∞ ve ${M(p.A)}·e^(−x) → ${INF(p.A)}. Dolayısıyla f → ${INF(p.A)}: bu uçta yatay asimptot YOK.`,
        `── 3) x → −∞ ──\nSince −x → +∞, e^(−x) → +∞ and ${M(p.A)}·e^(−x) → ${INF(p.A)}. So f → ${INF(p.A)}: there is NO horizontal asymptote at this end.`));
      steps.push(I18N.tx(`── 4) Düşey asimptot? ──\nf her yerde sürekli (payda yok) ⇒ düşey asimptot yok.`, `── 4) Vertical asymptote? ──\nf is continuous everywhere (no denominator) ⇒ no vertical asymptote.`));
    } else if (p.kind === 4) {
      steps.push(I18N.tx(
        `── 2) x → +∞ ──\ne^(−x) → 0 ⇒ f(x) → ${M(p.L)} / (1 + 0) = ${M(p.L)}. Yatay asimptot y = ${M(p.L)}.`,
        `── 2) x → +∞ ──\ne^(−x) → 0 ⇒ f(x) → ${M(p.L)} / (1 + 0) = ${M(p.L)}. Horizontal asymptote y = ${M(p.L)}.`));
      steps.push(I18N.tx(
        `── 3) x → −∞ ──\ne^(−x) → +∞ ⇒ payda → +∞ ⇒ f(x) → ${M(p.L)}/∞ = 0. Yatay asimptot y = 0.\nİki uçta farklı iki yatay asimptot var (lojistik "S" eğrisi).`,
        `── 3) x → −∞ ──\ne^(−x) → +∞ ⇒ denominator → +∞ ⇒ f(x) → ${M(p.L)}/∞ = 0. Horizontal asymptote y = 0.\nThere are two different horizontal asymptotes, one at each end (a logistic "S" curve).`));
      steps.push(I18N.tx(`── 4) Düşey asimptot? ──\n1 + e^(−x) > 0 her x için ⇒ payda hiç 0 olmaz ⇒ düşey asimptot yok.`, `── 4) Vertical asymptote? ──\n1 + e^(−x) > 0 for every x ⇒ the denominator never vanishes ⇒ no vertical asymptote.`));
    } else if (p.kind === 5) {
      const h = p.h, b = 2 * h, c = h * h + p.t1;
      steps.push(I18N.tx(
        `── 2) x → +∞ : ∞ − ∞ belirsizliği, eşlenik ──\nf(x) = (√(${poly([1, b, c])}) − x)·(√(${poly([1, b, c])}) + x) / (√(${poly([1, b, c])}) + x) = (${poly([b, c])}) / (√(${poly([1, b, c])}) + x).`,
        `── 2) x → +∞ : the ∞ − ∞ form, use the conjugate ──\nf(x) = (√(${poly([1, b, c])}) − x)·(√(${poly([1, b, c])}) + x) / (√(${poly([1, b, c])}) + x) = (${poly([b, c])}) / (√(${poly([1, b, c])}) + x).`));
      steps.push(I18N.tx(
        `── 3) x'e bölelim (x > 0 için √(x²…)/x = √(1 + …)) ──\nf(x) = (${divTerms([b, c])}) / (√(${divTerms([1, b, c])}) + 1) → ${M(b)} / (1 + 1) = ${M(h)}.\nYatay asimptot (sağ uç): y = ${M(h)}.`,
        `── 3) Let's divide by x (for x > 0, √(x²…)/x = √(1 + …)) ──\nf(x) = (${divTerms([b, c])}) / (√(${divTerms([1, b, c])}) + 1) → ${M(b)} / (1 + 1) = ${M(h)}.\nHorizontal asymptote (right end): y = ${M(h)}.`));
      steps.push(I18N.tx(
        `── 4) x → −∞ ──\nBurada √(…) > 0 ve −x > 0: iki pozitif terim toplanıyor, belirsizlik yok ⇒ f → +∞. Daha doğrusu √((x + ${M(h)})² + ${p.t1}) ≈ |x + ${M(h)}| = −x − ${M(h)} olduğundan f ≈ −2x − ${M(h)}: eğik asimptot y = ${lineStr(-2, -h)} (sol uç).`,
        `── 4) x → −∞ ──\nHere √(…) > 0 and −x > 0: two positive terms add, there is no indeterminacy ⇒ f → +∞. More precisely √((x + ${M(h)})² + ${p.t1}) ≈ |x + ${M(h)}| = −x − ${M(h)}, so f ≈ −2x − ${M(h)}: slant asymptote y = ${lineStr(-2, -h)} (left end).`));
    } else if (p.kind === 6) {
      const b = 2 * p.h, d = 2 * p.k, c = p.h * p.h + p.t1, e = p.k * p.k + p.t2, h = p.h, k = p.k;
      steps.push(I18N.tx(
        `── 2) ∞ − ∞ belirsizliği: eşlenik ──\nf(x) = (√A − √B)(√A + √B)/(√A + √B) = (A − B)/(√A + √B),  A = ${poly([1, b, c])},  B = ${poly([1, d, e])}.\nA − B = ${poly([b - d, c - e])}  ⇒  f(x) = (${poly([b - d, c - e])}) / (√A + √B).`,
        `── 2) The ∞ − ∞ form: conjugate ──\nf(x) = (√A − √B)(√A + √B)/(√A + √B) = (A − B)/(√A + √B),  A = ${poly([1, b, c])},  B = ${poly([1, d, e])}.\nA − B = ${poly([b - d, c - e])}  ⇒  f(x) = (${poly([b - d, c - e])}) / (√A + √B).`));
      steps.push(I18N.tx(
        `── 3) x → +∞ ──\nx'e bölelim (√A/x → 1, √B/x → 1): f → ${M(b - d)} / (1 + 1) = ${M(h - k)}. Yatay asimptot (sağ): y = ${M(h - k)}.`,
        `── 3) x → +∞ ──\nDividing by x (√A/x → 1, √B/x → 1): f → ${M(b - d)} / (1 + 1) = ${M(h - k)}. Horizontal asymptote (right): y = ${M(h - k)}.`));
      steps.push(I18N.tx(
        `── 4) x → −∞ ──\nx < 0 olduğundan √A/x → −1 ve √B/x → −1 (çünkü √(x²) = −x): f → ${M(b - d)} / (−1 − 1) = ${M(k - h)}. Yatay asimptot (sol): y = ${M(k - h)}.\nİki uç farklı: ${M(h - k)} ≠ ${M(k - h)}.`,
        `── 4) x → −∞ ──\nSince x < 0, √A/x → −1 and √B/x → −1 (because √(x²) = −x): f → ${M(b - d)} / (−1 − 1) = ${M(k - h)}. Horizontal asymptote (left): y = ${M(k - h)}.\nThe two ends differ: ${M(h - k)} ≠ ${M(k - h)}.`));
    } else {
      steps.push(I18N.tx(
        `── 2) x → +∞ ──\nPay ve paydayı x'e bölelim (x > 0 için √(x² + ${p.k2})/x = √(1 + ${p.k2}/x²)):\nf(x) = (${divTerms([p.A, p.B])}) / √(1 + ${p.k2}/x²) → ${M(p.A)} / 1 = ${M(p.A)}. Yatay asimptot (sağ): y = ${M(p.A)}.`,
        `── 2) x → +∞ ──\nDividing numerator and denominator by x (for x > 0, √(x² + ${p.k2})/x = √(1 + ${p.k2}/x²)):\nf(x) = (${divTerms([p.A, p.B])}) / √(1 + ${p.k2}/x²) → ${M(p.A)} / 1 = ${M(p.A)}. Horizontal asymptote (right): y = ${M(p.A)}.`));
      steps.push(I18N.tx(
        `── 3) x → −∞ ──\nx < 0 olduğundan √(x² + ${p.k2})/x = −√(1 + ${p.k2}/x²) (çünkü √(x²) = −x):\nf(x) = (${divTerms([p.A, p.B])}) / (−√(1 + ${p.k2}/x²)) → ${M(p.A)} / (−1) = ${M(-p.A)}. Yatay asimptot (sol): y = ${M(-p.A)}.`,
        `── 3) x → −∞ ──\nSince x < 0, √(x² + ${p.k2})/x = −√(1 + ${p.k2}/x²) (because √(x²) = −x):\nf(x) = (${divTerms([p.A, p.B])}) / (−√(1 + ${p.k2}/x²)) → ${M(p.A)} / (−1) = ${M(-p.A)}. Horizontal asymptote (left): y = ${M(-p.A)}.`));
      steps.push(I18N.tx(`── 4) Düşey asimptot? ──\nx² + ${p.k2} > 0 her x için ⇒ payda hiç 0 olmaz ⇒ düşey asimptot yok.`, `── 4) Vertical asymptote? ──\nx² + ${p.k2} > 0 for every x ⇒ the denominator never vanishes ⇒ no vertical asymptote.`));
    }
    steps.push(numericStep(p, o, steps.length + 1));
    steps.push(summaryStep(p, o, steps.length + 1));
    return steps;
  }

  // ---- drawing ----
  function focusY(o) {
    if (o.has.length) return o.has.reduce((s, h) => s + h.y, 0) / o.has.length;
    if (o.slant) return o.slant.b;
    return 0;
  }

  function viewport(p, o) {
    const X = Math.abs(xOf(p));
    const R = Math.max(12, 1.25 * X);
    const Ymax = 4 * R + 30;
    const unit = Math.max(1, R / 12);
    let lo = Infinity, hi = -Infinity;
    const add = (v) => { if (Number.isFinite(v) && Math.abs(v) <= Ymax) { lo = Math.min(lo, v); hi = Math.max(hi, v); } };
    for (let i = 0; i <= 480; i++) {
      const x = -R + (2 * R) * i / 480;
      if (o.vas.some((v) => Math.abs(x - v.x) < 0.8 * unit)) continue;
      add(o.f(x));
    }
    o.has.forEach((h) => add(h.y));
    if (o.slant) { add(o.slant.m * R * 0.9 + o.slant.b); add(-o.slant.m * R * 0.9 + o.slant.b); }
    if (!Number.isFinite(lo)) { lo = -10; hi = 10; }
    const pad = Math.max(1.5, (hi - lo) * 0.15);
    lo -= pad; hi += pad;
    if (hi - lo < 6) { const mid = (hi + lo) / 2; lo = mid - 3; hi = mid + 3; }
    lo = Math.max(lo, -Ymax); hi = Math.min(hi, Ymax);
    const fy = focusY(o); if (fy > lo && fy < hi) { const hh = Math.max(fy - lo, hi - fy); lo = fy - hh; hi = fy + hh; }
    return { R, lo, hi };
  }

  function draw(canvas, p) {
    const o = info(p), vp = viewport(p, o), R = vp.R;
    canvas.setViewport(-R, R, vp.lo, vp.hi);
    const seg = (x1, y1, x2, y2, col) => canvas.addSegment({ x1, y1, x2, y2, color: col, dashed: true, thickness: 1.8 });
    o.vas.forEach((v) => canvas.addGuideLine({ axis: 'vertical', position: v.x, color: canvas.gray(), label: `x = ${M(v.x)}` }));
    o.has.forEach((h) => {
      if (h.side === 'B') canvas.addGuideLine({ axis: 'horizontal', position: h.y, color: canvas.green(), label: `y = ${h.ys}` });
      else if (h.side === 'R') seg(0, h.y, R * 1.05, h.y, canvas.green());
      else seg(-R * 1.05, h.y, 0, h.y, canvas.green());
    });
    if (o.slant) {
      const s = o.slant, x1 = s.side === 'R' ? 0 : -R * 1.05, x2 = s.side === 'L' ? 0 : R * 1.05;
      seg(x1, s.m * x1 + s.b, x2, s.m * x2 + s.b, canvas.orange());
    }
    canvas.addFunction({ evaluator: o.f, color: canvas.accent(), thickness: 3, label: '' });
    const X = xOf(p), y = o.f(X);
    if (Number.isFinite(y) && y >= vp.lo && y <= vp.hi) {
      canvas.addMarker({ x: X, y, color: canvas.gold(), radius: 6, label: `(${M(X)}, ${sig3(y)})` });
      const lim = X > 0 ? o.limPos : o.limNeg;
      if (Number.isFinite(lim) && lim >= vp.lo && lim <= vp.hi) canvas.addSegment({ x1: X, y1: y, x2: X, y2: lim, color: canvas.red(), dashed: true });
    }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: I18N.tx('|x| ne kadar büyük olsun? (|x| = 10^s)', 'How large should |x| be? (|x| = 10^s)'),
      min: S_MIN, max: S_MAX, step: 0.05,
      get: () => getProblem().s,
      set: (v) => { getProblem().s = Math.max(S_MIN, Math.min(S_MAX, v)); },
    });
    h.addCheckbox({
      caption: I18N.tx('x → −∞ ucuna bakalım', 'Let us look at the x → −∞ end'),
      get: () => getProblem().neg,
      set: (v) => { getProblem().neg = !!v; },
    });
  }

  Topics.register('limits', {
    id: 'limitsAtInfinity',
    tabTitle: () => I18N.tx('Sonsuzda Limit ve Asimptotlar', 'Limits at Infinity & Asymptotes'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: 0, y: focusY(info(p)) }),
    buildControls,
    links: [
      { match: /^\s*- (DÜŞEY|VERTICAL) x = a:/, make: (rng) => gen(rng, rng.pick([0, 1, 2])) },
      { match: /^\s*- (YATAY|HORIZONTAL) y = L:/, make: (rng) => gen(rng, rng.pick([0, 1, 3, 4])) },
      { match: /^\s*- (EĞİK|SLANT)/, make: (rng) => gen(rng, rng.pick([2, 5])) },
      { match: /^\s*n < m :/, make: (rng) => gen(rng, 0) },
      { match: /^\s*n = m :/, make: (rng) => gen(rng, 1) },
      { match: /^\s*n = m \+ 1 :/, make: (rng) => gen(rng, 2) },
      { match: /^\s*n > m \+ 1 :/, make: (rng) => gen(rng, 8) },
      { match: /^(KÖKLÜ İFADELER|RADICALS):/, make: (rng) => gen(rng, rng.pick([5, 6, 7])) },
      { match: /^(ÜSTEL FONKSİYONLAR|EXPONENTIALS):/, make: (rng) => gen(rng, rng.pick([3, 4])) },
    ],
  });
})();
