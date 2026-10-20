// Limits & Continuity - NEW tab "One-Sided Limits" (textbook section 'One-Sided Limits').
// problem = { kind, a, s, off, show, ... }; s is the kind-specific slider parameter (see hintText):
//   'absOverX' : f = s|x-a|/(x-a)                      -> L- = -s, L+ = +s            (limit DNE)
//   'sqrtOne'  : f = k sqrt(side (x-a)) + s            -> one side = s, other side not defined (limit DNE)
//   'floor'    : f = s floor(x), a integer              -> L- = s(a-1), L+ = s a       (limit DNE)
//   'paramK'   : f = m1 x + c1 (x<a), s x + c2 (x>=a)   -> find k so that the limit exists (k = kTrue); slider s = trial k
//   'recip'    : f = s/(x-a)^pow                         -> infinite one-sided limits
//   'pieces'   : f = cl(x) (x<a), m2 x + cb + s (x>=a)   -> compare L- and L+; slider s moves the right branch
(function () {
  const T = (tr, en) => I18N.tx(tr, en);
  const OFF_MIN = 0.01, OFF_MAX = 4;
  const SCALE_KINDS = { absOverX: 1, floor: 1, recip: 1 };

  function nf(v, d) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0' || s === '') s = '0';
    return s;
  }
  function par(v) { return v < 0 ? '(' + fmt2(v) + ')' : fmt2(v); }
  function polyStr(c) {
    const n = c.length - 1;
    let s = '';
    for (let i = 0; i <= n; i++) {
      const k = c[i];
      if (k === 0) continue;
      const d = n - i, ab = Math.abs(k);
      const body = d === 0 ? fmt2(ab) : ((ab === 1 ? '' : fmt2(ab)) + 'x' + (d === 1 ? '' : d === 2 ? '²' : '³'));
      if (s === '') s = (k < 0 ? '-' : '') + body; else s += (k < 0 ? ' - ' : ' + ') + body;
    }
    return s || '0';
  }
  function polyEval(c, x) { let r = 0; for (let i = 0; i < c.length; i++) r = r * x + c[i]; return r; }
  function xi(a) { return a === 0 ? 'x' : (a > 0 ? 'x - ' + a : 'x + ' + (-a)); }
  function xm(a) { return a === 0 ? 'x' : '(' + xi(a) + ')'; }
  function ax(a) { return a === 0 ? '-x' : (a > 0 ? a + ' - x' : '-x - ' + (-a)); } // a - x
  function sgnMul(k) { return k === 1 ? '' : k === -1 ? '-' : k + '·'; }
  function addTerm(d) { return d === 0 ? '' : (d > 0 ? ' + ' + d : ' - ' + (-d)); }
  const NUM = (v) => ({ t: 'num', v });
  const INF = (sg) => ({ t: 'inf', sg: sg > 0 ? 1 : -1 });
  const NONE = { t: 'none' };
  function ls(o) {
    if (o.t === 'num') return fmt2(o.v);
    if (o.t === 'inf') return o.sg > 0 ? '+∞' : '−∞';
    return T('mevcut değil', 'not available');
  }
  function twoSided(l, r) {
    if (l.t === 'num' && r.t === 'num') return Math.abs(l.v - r.v) < 1e-9 ? NUM(l.v) : { t: 'dne' };
    if (l.t === 'inf' && r.t === 'inf' && l.sg === r.sg) return INF(l.sg);
    return { t: 'dne' };
  }
  function dirName(i) { return i; }

  // ---------------- model ----------------
  function model(p) {
    const a = p.a, s = p.s, m = { a, kind: p.kind, marks: [], stairs: false };
    let lo, hi;
    switch (p.kind) {
      case 'absOverX': {
        const k = s;
        m.raw = (x) => (Math.abs(x - a) < 1e-9 ? NaN : k * Math.abs(x - a) / (x - a));
        m.f = m.raw; m.fL = (x) => (x < a ? m.raw(x) : NaN); m.fR = (x) => (x > a ? m.raw(x) : NaN);
        m.str = `${sgnMul(k)}|${xi(a)}| / ${xm(a)}`;
        m.Ll = NUM(-k); m.Lp = NUM(k); m.fa = null;
        m.marks = [{ y: -k, hollow: true, side: 'L' }, { y: k, hollow: true, side: 'R' }];
        lo = Math.min(-k, k, 0) - 2; hi = Math.max(-k, k, 0) + 2;
        break;
      }
      case 'sqrtOne': {
        const k = p.k, side = p.side, d = s;
        const inner = side > 0 ? xi(a) : ax(a);
        m.raw = (x) => { const u = side * (x - a); return u < 0 ? NaN : k * Math.sqrt(u) + d; };
        m.f = m.raw; m.fL = (x) => (x < a ? m.raw(x) : NaN); m.fR = (x) => (x > a ? m.raw(x) : NaN);
        m.str = `${sgnMul(k)}√(${inner})${addTerm(d)}`;
        if (side > 0) { m.Ll = NONE; m.Lp = NUM(d); } else { m.Ll = NUM(d); m.Lp = NONE; }
        m.fa = d;
        m.marks = [{ y: d, hollow: false, side: side > 0 ? 'R' : 'L', filled: true }];
        lo = Math.min(d, d + 2 * k) - 2; hi = Math.max(d, d + 2 * k) + 2;
        break;
      }
      case 'floor': {
        const k = s;
        m.raw = (x) => k * Math.floor(x + 1e-12);
        m.f = m.raw; m.fL = (x) => (x < a ? m.raw(x) : NaN); m.fR = (x) => (x >= a ? m.raw(x) : NaN);
        m.str = `${sgnMul(k)}⌊x⌋`;
        m.Ll = NUM(k * (a - 1)); m.Lp = NUM(k * a); m.fa = k * a; m.stairs = true;
        m.marks = [{ y: k * (a - 1), hollow: true, side: 'L' }, { y: k * a, hollow: false, side: 'R' }];
        lo = Math.min(k * (a - 4), k * (a + 3)); hi = Math.max(k * (a - 4), k * (a + 3));
        break;
      }
      case 'paramK': {
        const m1 = p.m1, c2 = p.c2, kT = p.kTrue, c1 = kT * a + c2 - m1 * a;
        m.cl = [m1, c1]; m.cr = [s, c2];
        m.raw = (x) => (x < a ? polyEval(m.cl, x) : polyEval(m.cr, x));
        m.f = m.raw; m.fL = (x) => (x < a ? m.raw(x) : NaN); m.fR = (x) => (x >= a ? m.raw(x) : NaN);
        const Ll = polyEval(m.cl, a), Lr = s * a + c2;
        m.Ll = NUM(Ll); m.Lp = NUM(Lr); m.fa = Lr; m.c1 = c1; m.kTrue = kT;
        m.str = `${polyStr(m.cl)}  (x < ${a}),   k·x${c2 === 0 ? '' : addTerm(c2)}  (x ≥ ${a})`;
        m.marks = [{ y: Ll, hollow: true, side: 'L' }, { y: Lr, hollow: false, side: 'R' }];
        lo = Math.min(Ll, Lr); hi = Math.max(Ll, Lr);
        break;
      }
      case 'recip': {
        const k = s, pw = p.pow;
        m.raw = (x) => { const d = x - a; return Math.abs(d) < 1e-9 ? NaN : k / Math.pow(d, pw); };
        m.f = (x) => { const y = m.raw(x); return Math.abs(y) > 40 ? NaN : y; };
        m.fL = (x) => (x < a ? m.f(x) : NaN); m.fR = (x) => (x > a ? m.f(x) : NaN);
        m.str = `${k}/${xm(a)}${pw === 2 ? '²' : ''}`.replace(/^1\//, '1/');
        const sg = k > 0 ? 1 : -1;
        m.Ll = INF(pw === 1 ? -sg : sg); m.Lp = INF(sg); m.fa = null;
        lo = -8; hi = 8;
        break;
      }
      default: { // pieces
        const cl = p.cl, Ll = polyEval(cl, a), cr = [p.m2, p.cb + s], Lr = polyEval(cr, a);
        m.cl = cl; m.cr = cr;
        m.raw = (x) => (x < a ? polyEval(cl, x) : polyEval(cr, x));
        m.f = m.raw; m.fL = (x) => (x < a ? m.raw(x) : NaN); m.fR = (x) => (x >= a ? m.raw(x) : NaN);
        m.Ll = NUM(Ll); m.Lp = NUM(Lr); m.fa = Lr;
        m.sStar = Ll - p.m2 * a - p.cb;
        m.str = `${polyStr(cl)}  (x < ${a}),   ${polyStr(cr)}  (x ≥ ${a})`;
        m.marks = [{ y: Ll, hollow: true, side: 'L' }, { y: Lr, hollow: false, side: 'R' }];
        lo = Math.min(Ll, Lr); hi = Math.max(Ll, Lr);
      }
    }
    m.two = twoSided(m.Ll, m.Lp);
    m.lo = lo; m.hi = hi;
    return m;
  }

  function createProblem(rng) { return gen(rng, rng.pick(['absOverX', 'sqrtOne', 'floor', 'paramK', 'recip', 'pieces', 'paramK', 'pieces', 'recip'])); }
  function gen(rng, kind) {
    const p = { kind, off: 2, show: false, a: rng.nextInt(-3, 4) };
    if (kind === 'absOverX') p.s = rng.nonZeroInt(-3, 3);
    else if (kind === 'sqrtOne') { p.k = rng.nonZeroInt(-3, 3); p.side = rng.pick([1, -1]); p.s = rng.nextInt(-3, 4); }
    else if (kind === 'floor') p.s = rng.pick([1, 1, 2, 3, -1]);
    else if (kind === 'recip') { p.pow = rng.pick([1, 1, 2]); p.s = rng.nonZeroInt(-3, 3); }
    else if (kind === 'paramK') {
      p.a = rng.nonZeroInt(-3, 3);
      p.m1 = rng.nonZeroInt(-2, 2); p.c2 = rng.nextInt(-4, 5); p.kTrue = rng.nextInt(-3, 4);
      const d = rng.pick([-2, -1, 1, 2]);
      p.s = p.kTrue + d;
    } else {
      p.cl = rng.pick([[rng.nonZeroInt(-2, 2), rng.nextInt(-3, 4)], [1, rng.nextInt(-2, 3), rng.nextInt(-2, 3)], [1, 0, rng.nextInt(-3, 2)]]);
      p.m2 = rng.pick([-2, -1, 0, 1, 2]);
      const star = rng.nextInt(-3, 4);
      p.cb = polyEval(p.cl, p.a) - p.m2 * p.a - star;
      p.s = rng.nextInt(0, 2) === 0 ? star : star + rng.pick([-3, -2, -1, 1, 2, 3]);
    }
    return p;
  }

  function problemStatement(p) {
    const m = model(p), a = p.a;
    if (p.kind === 'paramK') {
      return T(
        `f(x) = ${m.str}\nlim(x→${a}) f(x) limitinin var olması için k kaç olmalıdır? Önce lim(x→${a}⁻) f(x) ve lim(x→${a}⁺) f(x) tek taraflı limitlerini (k cinsinden) yazalım.`,
        `f(x) = ${m.str}\nFor which value of k does lim(x→${a}) f(x) exist? Let's first write the one-sided limits lim(x→${a}⁻) f(x) and lim(x→${a}⁺) f(x) (in terms of k).`);
    }
    if (p.kind === 'recip' || p.kind === 'sqrtOne') {
      return T(
        `f(x) = ${m.str}\nx → ${a}⁻ ve x → ${a}⁺ için tek taraflı limitleri bulalım (sonsuz ya da mevcut değil olabilir). İki taraflı limit var mı dersiniz?`,
        `f(x) = ${m.str}\nLet's find the one-sided limits as x → ${a}⁻ and x → ${a}⁺ (they may be infinite or not available). Do you think the two-sided limit exists?`);
    }
    return T(
      `f(x) = ${m.str}\nlim(x→${a}⁻) f(x) ve lim(x→${a}⁺) f(x) değerlerini bulalım. Bu iki tek taraflı limite bakarak lim(x→${a}) f(x) var mı, varsa değeri nedir?`,
      `f(x) = ${m.str}\nLet's find lim(x→${a}⁻) f(x) and lim(x→${a}⁺) f(x). From these two one-sided limits we can tell whether lim(x→${a}) f(x) exists and, if so, its value.`);
  }

  const CONCEPT_TR = [
    'TANIM',
    '   Soldan limit:  lim(x→a⁻) f(x) = L⁻   (yalnızca x < a değerleri kullanılır; x, a\'ya soldan, artarak yaklaşır).',
    '   Sağdan limit:  lim(x→a⁺) f(x) = L⁺   (yalnızca x > a değerleri kullanılır; x, a\'ya sağdan, azalarak yaklaşır).',
    '   Bir tek taraflı limit, o taraftaki f(x) değerlerinin gittiği sayıdır; f(a)\'nın değeri hiç önemli değildir.',
    '',
    'TEOREM (İKİ TARAFLI LİMİT)',
    '   lim(x→a) f(x) = L   ⇔   lim(x→a⁻) f(x) = L ve lim(x→a⁺) f(x) = L.',
    '   Yani limit VARDIR ancak ve ancak iki tek taraflı limit de vardır ve EŞİTTİR.',
    '   L⁻ ≠ L⁺ ise ya da bir taraf mevcut değilse iki taraflı limit YOKTUR.',
    '',
    'ÖRNEKLER',
    '   - |x|/x, x = 0: L⁻ = −1, L⁺ = +1 ⇒ limit yok (sıçrama).',
    '   - √x, x = 0: soldan f tanımsız (x < 0 için karekök gerçel değil), sağdan L⁺ = 0 ⇒ iki taraflı limit yok; yalnızca sağdan limit vardır. √(a − x) için tersi.',
    '   - ⌊x⌋, bir tam sayı n\'de: L⁻ = n − 1, L⁺ = n ⇒ limit yok; tam sayı olmayan noktalarda limit var.',
    '   - Parçalı fonksiyonlar: her taraf kendi formülüyle hesaplanır (polinom parçalarda x = a yazılır).',
    '   - 1/x, x = 0: L⁻ = −∞, L⁺ = +∞ ⇒ limit yok. 1/x², x = 0: iki taraf da +∞ ⇒ lim = +∞ (sonlu limit yoktur, ama davranış aynıdır).',
    '',
    'YÖNTEM',
    '   (1) a\'nın solundaki ve sağındaki formül belirlenir (mutlak değer, parçalı tanım, tam değer...).',
    '   (2) Her taraf için işaret/aralık yazılıp ifade sadeleştirilir (örn. x < a ⇒ |x − a| = −(x − a)).',
    '   (3) L⁻\'yi sol formülle, L⁺\'yı sağ formülle hesaplarız; payda 0⁺ ya da 0⁻ ise işaret belirlenir (±∞).',
    '   (4) Karşılaştırırız: iki sayı eşitse limit odur; farklıysa ya da bir taraf mevcut değilse limit yoktur.',
    '   (5) Parametre sorusunda (örn. "k kaç olursa limit vardır?") L⁻ = L⁺ denklemi kurulup çözülür.',
    '',
    'SIK HATALAR',
    '   - Yalnızca bir taraftan bakıp "limit var" demek.',
    '   - L⁺ ile L⁻\'yi karıştırmak ya da f(a)\'yı tek taraflı limit sanmak.',
    '   - Tanım kümesinin dışındaki tarafı hesaba katmak (√x için soldan yaklaşım yoktur).',
    '   - ±∞ sonuçlarını "limit var" saymak: ±∞ sayı değildir; yalnızca sınırsız büyümeyi/küçülmeyi anlatır.',
    '   - 0/0 gibi belirsizlikleri sadeleştirmeden bırakmak.',
    '',
    'MİNİ ÖRNEK',
    '   f(x) = x + 1 (x < 2), f(x) = k·x − 3 (x ≥ 2). L⁻ = 2 + 1 = 3, L⁺ = 2k − 3. Limit için 3 = 2k − 3 ⇒ k = 3.',
    '',
    'AKILDA TUTMA: "Limit var ⇔ sol = sağ. İkisi buluşmuyorsa ya da biri yoksa limit yok."',
  ].join('\n');

  const CONCEPT_EN = [
    'DEFINITION',
    '   Left-hand limit:  lim(x→a⁻) f(x) = L⁻   (only x < a is used; x approaches a from the left, increasing).',
    '   Right-hand limit: lim(x→a⁺) f(x) = L⁺   (only x > a is used; x approaches a from the right, decreasing).',
    '   A one-sided limit is the number the values f(x) on that side head to; the value f(a) does not matter at all.',
    '',
    'THEOREM (TWO-SIDED LIMIT)',
    '   lim(x→a) f(x) = L   ⇔   lim(x→a⁻) f(x) = L and lim(x→a⁺) f(x) = L.',
    '   So the limit EXISTS if and only if both one-sided limits exist and are EQUAL.',
    '   If L⁻ ≠ L⁺, or one side is not available, the two-sided limit DOES NOT EXIST.',
    '',
    'EXAMPLES',
    '   - |x|/x at x = 0: L⁻ = −1, L⁺ = +1 ⇒ no limit (jump).',
    '   - √x at x = 0: f is not defined on the left (the square root of a negative number is not real), from the right L⁺ = 0 ⇒ no two-sided limit; only the right-hand limit exists. The reverse holds for √(a − x).',
    '   - ⌊x⌋ at an integer n: L⁻ = n − 1, L⁺ = n ⇒ no limit; at non-integer points the limit exists.',
    '   - Piecewise functions: each side uses its own formula (substitute x = a in polynomial pieces).',
    '   - 1/x at x = 0: L⁻ = −∞, L⁺ = +∞ ⇒ no limit. 1/x² at x = 0: both sides give +∞ ⇒ lim = +∞ (no finite limit, but the behaviour is the same on both sides).',
    '',
    'METHOD',
    '   (1) We identify the formula to the left and to the right of a (absolute value, piecewise definition, floor...).',
    '   (2) For each side we write down the sign/interval and simplify (e.g. x < a ⇒ |x − a| = −(x − a)).',
    '   (3) We compute L⁻ with the left formula and L⁺ with the right formula; if a denominator is 0⁺ or 0⁻ we decide the sign (±∞).',
    '   (4) We compare: if the two numbers are equal that is the limit; if they differ or one side is not available the limit does not exist.',
    '   (5) For parameter questions (e.g. "for which k does the limit exist?") we set up L⁻ = L⁺ and solve it.',
    '',
    'COMMON PITFALLS',
    '   - Looking from one side only and claiming "the limit exists".',
    '   - Mixing up L⁺ and L⁻ or taking f(a) to be a one-sided limit.',
    '   - Including a side outside the domain (there is no left-hand approach for √x).',
    '   - Treating ±∞ as "the limit exists": ±∞ is not a number; it only describes unbounded growth/decrease.',
    '   - Leaving indeterminate forms such as 0/0 without simplifying them.',
    '',
    'MINI EXAMPLE',
    '   f(x) = x + 1 (x < 2), f(x) = k·x − 3 (x ≥ 2). L⁻ = 2 + 1 = 3, L⁺ = 2k − 3. For the limit to exist 3 = 2k − 3 ⇒ k = 3.',
    '',
    'MEMORY AID: "Limit exists ⇔ left = right. If they do not meet, or one is missing, there is no limit."',
  ].join('\n');

  function concept() { return T(CONCEPT_TR, CONCEPT_EN); }

  function twoText(m, a) {
    const L = m.Ll, R = m.Lp, t = m.two;
    if (t.t === 'num') {
      return T(`L⁻ = L⁺ = ${fmt2(t.v)} (iki tek taraflı limit var ve eşit) ⇒ lim(x→${a}) f(x) = ${fmt2(t.v)}.`,
        `L⁻ = L⁺ = ${fmt2(t.v)} (both one-sided limits exist and are equal) ⇒ lim(x→${a}) f(x) = ${fmt2(t.v)}.`);
    }
    if (t.t === 'inf') {
      return T(`İki taraf da ${ls(INF(t.sg))} gidiyor ⇒ lim(x→${a}) f(x) = ${ls(INF(t.sg))} yazılır. Bu "sonsuz limit"tir: sonlu bir sayı yoktur, ama sol ve sağ davranış aynıdır (fonksiyonun dikey asimptotu x = ${a}).`,
        `Both sides head to ${ls(INF(t.sg))} ⇒ we write lim(x→${a}) f(x) = ${ls(INF(t.sg))}. This is an "infinite limit": there is no finite number, but the left and right behaviour agree (vertical asymptote x = ${a}).`);
    }
    if (L.t === 'none' || R.t === 'none') {
      return T(`Bir taraftaki tek taraflı limit mevcut değil (f o tarafta tanımsız) ⇒ lim(x→${a}) f(x) YOKTUR.`,
        `One of the one-sided limits is not available (f is not defined on that side) ⇒ lim(x→${a}) f(x) DOES NOT EXIST.`);
    }
    if (L.t === 'num' && R.t === 'num') {
      return T(`L⁻ = ${ls(L)} ≠ L⁺ = ${ls(R)} ⇒ lim(x→${a}) f(x) YOKTUR (sıçrama büyüklüğü ${fmt2(Math.abs(R.v - L.v))}).`,
        `L⁻ = ${ls(L)} ≠ L⁺ = ${ls(R)} ⇒ lim(x→${a}) f(x) DOES NOT EXIST (jump size ${fmt2(Math.abs(R.v - L.v))}).`);
    }
    return T(`L⁻ = ${ls(L)}, L⁺ = ${ls(R)}: aynı değil ⇒ lim(x→${a}) f(x) YOKTUR (tek taraflı limitler zıt yönde sonsuza gidiyor).`,
      `L⁻ = ${ls(L)}, L⁺ = ${ls(R)}: not the same ⇒ lim(x→${a}) f(x) DOES NOT EXIST (the one-sided limits head to infinity in opposite directions).`);
  }

  function solveSteps(p) {
    const m = model(p), a = p.a, S = [];
    const off = Math.max(OFF_MIN, Math.min(OFF_MAX, p.off));
    S.push(T(`── 1) Tek taraflı limit ne demek? ──\nf(x) = ${m.str}\nx → ${a}⁻: yalnızca x < ${a} değerleri (sol taraf). x → ${a}⁺: yalnızca x > ${a} değerleri (sağ taraf). İki taraflı limit için her ikisine de bakmamız gerekir.`,
      `── 1) What does a one-sided limit mean? ──\nf(x) = ${m.str}\nx → ${a}⁻: only values x < ${a} (the left side). x → ${a}⁺: only values x > ${a} (the right side). For the two-sided limit we look at both.`));

    // 2) left, 3) right: kind specific
    let sl, sr;
    switch (p.kind) {
      case 'absOverX': {
        const k = p.s;
        sl = T(`x < ${a} ⇒ ${xm(a)} < 0 ⇒ |${xi(a)}| = −${xm(a)}.\nf(x) = ${par(k)}·(−${xm(a)}) / ${xm(a)} = ${par(-k)}  (sabit)`, `x < ${a} ⇒ ${xm(a)} < 0 ⇒ |${xi(a)}| = −${xm(a)}.\nf(x) = ${par(k)}·(−${xm(a)}) / ${xm(a)} = ${par(-k)}  (constant)`);
        sr = T(`x > ${a} ⇒ ${xm(a)} > 0 ⇒ |${xi(a)}| = ${xm(a)}.\nf(x) = ${par(k)}·${xm(a)} / ${xm(a)} = ${par(k)}  (sabit)`, `x > ${a} ⇒ ${xm(a)} > 0 ⇒ |${xi(a)}| = ${xm(a)}.\nf(x) = ${par(k)}·${xm(a)} / ${xm(a)} = ${par(k)}  (constant)`);
        break;
      }
      case 'sqrtOne': {
        const lenSide = p.side > 0 ? 'R' : 'L';
        const okTxt = (sd) => T(`x ${sd === 'R' ? '>' : '<'} ${a}: kök içi ${p.side > 0 ? xi(a) : ax(a)} → 0⁺, √ → 0, f(x) → ${par(p.k)}·0 ${p.s >= 0 ? '+' : '−'} ${Math.abs(p.s)} = ${fmt2(p.s)}`,
          `x ${sd === 'R' ? '>' : '<'} ${a}: the radicand ${p.side > 0 ? xi(a) : ax(a)} → 0⁺, √ → 0, f(x) → ${par(p.k)}·0 ${p.s >= 0 ? '+' : '−'} ${Math.abs(p.s)} = ${fmt2(p.s)}`);
        const badTxt = (sd) => T(`x ${sd === 'R' ? '>' : '<'} ${a} için kök içi ${p.side > 0 ? xi(a) : ax(a)} < 0 ⇒ √ gerçel değil: f bu tarafta TANIMSIZDIR. Yaklaşılacak değer olmadığından bu tek taraflı limit mevcut değildir.`,
          `For x ${sd === 'R' ? '>' : '<'} ${a} the radicand ${p.side > 0 ? xi(a) : ax(a)} < 0 ⇒ the root is not real: f is NOT DEFINED on this side. With no values to approach, this one-sided limit is not available.`);
        sl = lenSide === 'L' ? okTxt('L') : badTxt('L');
        sr = lenSide === 'R' ? okTxt('R') : badTxt('R');
        break;
      }
      case 'floor':
        sl = T(`${a - 1} ≤ x < ${a} için ⌊x⌋ = ${a - 1}; yani f(x) = ${par(p.s)}·${par(a - 1)} = ${par(m.Ll.v)} (sabit).`, `For ${a - 1} ≤ x < ${a}, ⌊x⌋ = ${a - 1}; so f(x) = ${par(p.s)}·${par(a - 1)} = ${par(m.Ll.v)} (constant).`);
        sr = T(`${a} ≤ x < ${a + 1} için ⌊x⌋ = ${a}; yani f(x) = ${par(p.s)}·${par(a)} = ${par(m.Lp.v)} (sabit).`, `For ${a} ≤ x < ${a + 1}, ⌊x⌋ = ${a}; so f(x) = ${par(p.s)}·${par(a)} = ${par(m.Lp.v)} (constant).`);
        break;
      case 'paramK':
        sl = T(`x < ${a} için f(x) = ${polyStr(m.cl)} (polinom, süreklidir): L⁻ = ${polyStr(m.cl)} |ₓ₌${a} = ${fmt2(m.Ll.v)}`, `For x < ${a}, f(x) = ${polyStr(m.cl)} (a polynomial, continuous): L⁻ = ${polyStr(m.cl)} at x = ${a} = ${fmt2(m.Ll.v)}`);
        sr = T(`x ≥ ${a} için f(x) = k·x${p.c2 === 0 ? '' : addTerm(p.c2)}: L⁺ = k·${par(a)}${p.c2 === 0 ? '' : addTerm(p.c2)} = ${fmt2(a)}k${p.c2 === 0 ? '' : addTerm(p.c2)}   (k cinsinden)`,
          `For x ≥ ${a}, f(x) = k·x${p.c2 === 0 ? '' : addTerm(p.c2)}: L⁺ = k·${par(a)}${p.c2 === 0 ? '' : addTerm(p.c2)} = ${fmt2(a)}k${p.c2 === 0 ? '' : addTerm(p.c2)}   (in terms of k)`);
        break;
      case 'recip': {
        const k = p.s, pw = p.pow;
        sr = T(`x → ${a}⁺: ${xi(a)} → 0⁺ (küçük pozitif)${pw === 2 ? ', karesi de 0⁺' : ''} ⇒ ${k}/(0⁺) = ${ls(m.Lp)}`, `x → ${a}⁺: ${xi(a)} → 0⁺ (small positive)${pw === 2 ? ', its square is also 0⁺' : ''} ⇒ ${k}/(0⁺) = ${ls(m.Lp)}`);
        sl = T(`x → ${a}⁻: ${xi(a)} → 0⁻ (küçük negatif)${pw === 2 ? ', karesi ise 0⁺' : ''} ⇒ ${k}/(${pw === 2 ? '0⁺' : '0⁻'}) = ${ls(m.Ll)}`, `x → ${a}⁻: ${xi(a)} → 0⁻ (small negative)${pw === 2 ? ', but its square is 0⁺' : ''} ⇒ ${k}/(${pw === 2 ? '0⁺' : '0⁻'}) = ${ls(m.Ll)}`);
        break;
      }
      default: // pieces
        sl = T(`x < ${a} için f(x) = ${polyStr(m.cl)} (polinom): x = ${a} yazılırsa ⇒ ${fmt2(m.Ll.v)}`, `For x < ${a}, f(x) = ${polyStr(m.cl)} (polynomial): putting x = ${a} gives ${fmt2(m.Ll.v)}`);
        sr = T(`x ≥ ${a} için f(x) = ${polyStr(m.cr)} (polinom): x = ${a} yazılırsa ⇒ ${fmt2(m.Lp.v)}`, `For x ≥ ${a}, f(x) = ${polyStr(m.cr)} (polynomial): putting x = ${a} gives ${fmt2(m.Lp.v)}`);
    }
    const lastL = p.kind === 'paramK' ? `${fmt2(m.Ll.v)}` : ls(m.Ll);
    const lastR = p.kind === 'paramK' ? `${fmt2(a)}k${p.c2 === 0 ? '' : addTerm(p.c2)}` : ls(m.Lp);
    S.push(T(`── 2) Soldan limit ──\n${sl}\nlim(x→${a}⁻) f(x) = ${lastL}`, `── 2) Left-hand limit ──\n${sl}\nlim(x→${a}⁻) f(x) = ${lastL}`));
    S.push(T(`── 3) Sağdan limit ──\n${sr}\nlim(x→${a}⁺) f(x) = ${lastR}`, `── 3) Right-hand limit ──\n${sr}\nlim(x→${a}⁺) f(x) = ${lastR}`));

    // 4) theorem
    if (p.kind === 'paramK') {
      const num = m.Ll.v - p.c2;
      S.push(T(`── 4) Teorem: limit var ⇔ L⁻ = L⁺ ──\n${fmt2(m.Ll.v)} = ${fmt2(a)}k${p.c2 === 0 ? '' : addTerm(p.c2)}\n${fmt2(a)}k = ${fmt2(num)}\nk = ${fmt2(num)} / ${par(a)} = ${fmt2(p.kTrue)}\nBu k için iki tek taraflı limit eşittir (= ${fmt2(m.Ll.v)}), dolayısıyla lim(x→${a}) f(x) = ${fmt2(m.Ll.v)} vardır.`,
        `── 4) Theorem: the limit exists ⇔ L⁻ = L⁺ ──\n${fmt2(m.Ll.v)} = ${fmt2(a)}k${p.c2 === 0 ? '' : addTerm(p.c2)}\n${fmt2(a)}k = ${fmt2(num)}\nk = ${fmt2(num)} / ${par(a)} = ${fmt2(p.kTrue)}\nFor this k the two one-sided limits are equal (= ${fmt2(m.Ll.v)}), so lim(x→${a}) f(x) = ${fmt2(m.Ll.v)} exists.`));
      const Lr = p.s * a + p.c2;
      const eq = Math.abs(Lr - m.Ll.v) < 1e-9;
      S.push(T(`── 5) Kaydırıcıdaki deneme değeri k = ${fmt2(p.s)} ──\nL⁺ = ${fmt2(a)}·${par(p.s)}${p.c2 === 0 ? '' : addTerm(p.c2)} = ${fmt2(Lr)}, L⁻ = ${fmt2(m.Ll.v)}.\n${eq ? 'Eşit: grafik kesintisiz birleşir, limit vardır.' : 'Eşit değil (fark ' + fmt2(Math.abs(Lr - m.Ll.v)) + '): grafikte sıçrama var, limit yoktur.'}`,
        `── 5) The trial value on the slider, k = ${fmt2(p.s)} ──\nL⁺ = ${fmt2(a)}·${par(p.s)}${p.c2 === 0 ? '' : addTerm(p.c2)} = ${fmt2(Lr)}, L⁻ = ${fmt2(m.Ll.v)}.\n${eq ? 'Equal: the graph joins without a break, the limit exists.' : 'Not equal (difference ' + fmt2(Math.abs(Lr - m.Ll.v)) + '): the graph jumps, so there is no limit.'}`));
    } else {
      S.push(T(`── 4) Teorem: limit var ⇔ L⁻ = L⁺ ──\n${twoText(m, a)}`, `── 4) Theorem: the limit exists ⇔ L⁻ = L⁺ ──\n${twoText(m, a)}`));
      // 5) f(a) and graph
      let s5;
      if (m.fa === null) {
        s5 = T(`f(${a}) tanımsızdır (payda 0); grafik x = ${a} dikey doğrusuna ${p.kind === 'recip' ? 'sonsuza giderek yaklaşır (dikey asimptot)' : 'iki ayrı yükseklikten yaklaşır, uçlar boş dairedir'}.`,
          `f(${a}) is not defined (zero denominator); the graph ${p.kind === 'recip' ? 'approaches the vertical line x = ' + a + ' while heading to infinity (vertical asymptote)' : 'approaches x = ' + a + ' at two different heights, the ends are open circles'}.`);
      } else {
        s5 = T(`f(${a}) = ${fmt2(m.fa)} tanımlıdır; ancak bu değer limiti belirlemez: yalnızca o taraftaki değerler önemlidir. Dolu nokta (${a}, ${fmt2(m.fa)}), boş daire diğer parçanın ucudur.`,
          `f(${a}) = ${fmt2(m.fa)} is defined, but this value does not determine the limit: only the values on each side matter. Filled dot at (${a}, ${fmt2(m.fa)}); the open circle is the end of the other piece.`);
      }
      if (p.kind === 'pieces') {
        s5 += '\n' + T(`Kaydırıcı s ile sağ parçanın sabit terimi değişir. Limit ancak s = ${fmt2(m.sStar)} iken vardır (şimdi s = ${fmt2(p.s)}).`,
          `The slider s changes the constant term of the right piece. The limit exists only for s = ${fmt2(m.sStar)} (currently s = ${fmt2(p.s)}).`);
      }
      S.push(T(`── 5) f(${a}) ve grafik ──\n${s5}`, `── 5) f(${a}) and the graph ──\n${s5}`));
    }

    // last: numeric
    const xl = a - off, xr = a + off;
    const val = (x) => { const v = m.raw(x); return isFinite(v) ? nf(v, 4) : T('tanımsız', 'not defined'); };
    S.push(T(`── ${p.kind === 'paramK' ? '6' : '6'}) Sayısal kontrol (kaydırıcı) ──\n   x = ${nf(xl, 3)} (soldan)   →   f(x) = ${val(xl)}\n   x = ${nf(xr, 3)} (sağdan)   →   f(x) = ${val(xr)}\nUzaklığı küçülttükçe sol ve sağ değerler kendi tek taraflı limitlerine yerleşir.`,
      `── 6) Numerical check (slider) ──\n   x = ${nf(xl, 3)} (from the left)   →   f(x) = ${val(xl)}\n   x = ${nf(xr, 3)} (from the right)   →   f(x) = ${val(xr)}\nAs the distance shrinks the left and right values settle at their own one-sided limits.`));
    return S;
  }

  function draw(canvas, p) {
    const m = model(p), a = p.a;
    const off = Math.max(OFF_MIN, Math.min(OFF_MAX, p.off));
    const halfX = 4.5;
    let lo = m.lo, hi = m.hi;
    if (!(p.kind === 'floor' || p.kind === 'recip' || p.kind === 'absOverX' || p.kind === 'sqrtOne')) {
      const c = (lo + hi) / 2;
      for (let i = 0; i <= 80; i++) {
        const y = m.f(a - halfX + 2 * halfX * i / 80);
        if (isFinite(y) && Math.abs(y - c) <= 12) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
      }
    }
    let h = hi - lo;
    if (h < 6) { const c = (lo + hi) / 2; lo = c - 3; hi = c + 3; h = 6; }
    canvas.setViewport(a - halfX, a + halfX, lo - h * 0.12, hi + h * 0.12);

    canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gray(), label: 'x = ' + a });
    if (p.show) {
      if (m.Ll.t === 'num') canvas.addGuideLine({ axis: 'horizontal', position: m.Ll.v, color: canvas.blue(), label: 'L⁻ = ' + fmt2(m.Ll.v) });
      if (m.Lp.t === 'num') canvas.addGuideLine({ axis: 'horizontal', position: m.Lp.v, color: canvas.red(), label: 'L⁺ = ' + fmt2(m.Lp.v) });
    }
    if (m.stairs) {
      const k = p.s;
      for (let n = Math.floor(a - halfX) - 1; n <= Math.ceil(a + halfX); n++) {
        canvas.addSegment({ x1: n, y1: k * n, x2: n + 1, y2: k * n, color: canvas.accent(), thickness: 3 });
        canvas.addMarker({ x: n, y: k * n, color: canvas.accent(), radius: 4 });
        canvas.addMarker({ x: n + 1, y: k * n, color: canvas.accent(), radius: 4, hollow: true });
      }
    } else {
      canvas.addFunction({ evaluator: m.fL, color: canvas.accent(), thickness: 3, label: 'f(x)' });
      canvas.addFunction({ evaluator: m.fR, color: canvas.accent(), thickness: 3 });
    }
    m.marks.forEach((mk) => {
      canvas.addMarker({ x: a, y: mk.y, color: mk.side === 'L' ? canvas.blue() : canvas.purple(), radius: 7, hollow: mk.hollow });
    });
    const xl = a - off, xr = a + off;
    const yl = m.f(xl), yr = m.f(xr);
    if (isFinite(yl)) canvas.addMarker({ x: xl, y: yl, color: canvas.blue(), radius: 6 });
    if (isFinite(yr)) canvas.addMarker({ x: xr, y: yr, color: canvas.purple(), radius: 6 });
  }

  function hintText(p) {
    switch (p.kind) {
      case 'absOverX': return T('Bu örnekte s = k : f(x) = k·|x−a|/(x−a)', 'In this example s = k : f(x) = k·|x−a|/(x−a)');
      case 'sqrtOne': return T('Bu örnekte s = d : kök fonksiyonuna eklenen düşey kaydırma', 'In this example s = d : the vertical shift added to the root function');
      case 'floor': return T('Bu örnekte s = k : f(x) = k·⌊x⌋', 'In this example s = k : f(x) = k·⌊x⌋');
      case 'paramK': return T('Bu örnekte s = k için deneme değeridir (doğru k\'yı bulmaya çalışalım)', 'In this example s is a trial value for k (we look for the right k)');
      case 'recip': return T('Bu örnekte s = k : f(x) = k/(x−a)ⁿ', 'In this example s = k : f(x) = k/(x−a)ⁿ');
      default: return T('Bu örnekte s : sağ parçanın sabit terimine eklenen değer', 'In this example s is added to the constant term of the right piece');
    }
  }

  function buildControls(rightCol, getProblem, h) {
    const hint = (typeof document !== 'undefined' && document.createElement) ? document.createElement('div') : {};
    hint.className = 'we-slider-caption';
    h.addSlider({
      caption: T('Limit noktası a', 'Limit point a'), min: -4, max: 4, step: 1,
      get: () => getProblem().a,
      set: (v) => { const p = getProblem(); p.a = Math.round(v); if (p.kind === 'paramK' && p.a === 0) p.a = 1; },
    });
    h.addSlider({
      caption: T('Parametre s (kaydırıcı; aşağıdaki açıklamaya bakabiliriz)', 'Parameter s (the note below the slider explains it)'), min: -5, max: 5, step: 1,
      get: () => { hint.textContent = hintText(getProblem()); return getProblem().s; },
      set: (v) => {
        const p = getProblem();
        let r = Math.round(v);
        if (SCALE_KINDS[p.kind] && r === 0) r = p.s > 0 ? -1 : 1;
        p.s = r;
        hint.textContent = hintText(p);
      },
    });
    try { rightCol.appendChild(hint); } catch (e) { /* stub host */ }
    h.addSlider({
      caption: T('x ile a arasındaki uzaklık (sola çekince küçülür)', 'Distance between x and a (dragging left shrinks it)'),
      min: OFF_MIN, max: OFF_MAX, step: 0.01,
      get: () => getProblem().off, set: (v) => { getProblem().off = Math.max(OFF_MIN, Math.min(OFF_MAX, v)); },
    });
    h.addCheckbox({
      caption: T('Tek taraflı limit çizgilerini göster (L⁻, L⁺)', 'Show the one-sided limit lines (L⁻, L⁺)'),
      get: () => getProblem().show, set: (v) => { getProblem().show = !!v; },
    });
  }

  Topics.register('limits', {
    id: 'oneSidedLimits',
    tabTitle: () => T('Tek Taraflı Limitler', 'One-Sided Limits'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => {
      const m = model(p), v = [];
      if (m.Ll.t === 'num') v.push(m.Ll.v);
      if (m.Lp.t === 'num') v.push(m.Lp.v);
      return { x: p.a, y: v.length ? v.reduce((s, t) => s + t, 0) / v.length : 0 };
    },
    buildControls,
    links: [
      { match: /^\s*- \|x\|\/x/, make: (rng) => gen(rng, 'absOverX') },
      { match: /^\s*- √x/, make: (rng) => gen(rng, 'sqrtOne') },
      { match: /^\s*- ⌊x⌋/, make: (rng) => gen(rng, 'floor') },
      { match: /^\s*- (Parçalı fonksiyonlar|Piecewise functions):/, make: (rng) => gen(rng, 'pieces') },
      { match: /^\s*- 1\/x/, make: (rng) => gen(rng, 'recip') },
      { match: /^\s*\(5\) (Parametre sorusunda|For parameter questions)/, make: (rng) => gen(rng, 'paramK') },
    ],
  });
})();
