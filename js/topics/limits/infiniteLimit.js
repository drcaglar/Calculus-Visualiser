// Infinite limits / vertical asymptotes. Ported from Modules/Limits/InfiniteLimitControl.vb (f = 1/(x-2) with
// the closing-in points), extended with several function families and a sign-chart method.
// problem = { type, a, K, r, m, c, s }:  f(x) = K*(x-r)^[r!=null] / ( (x-a)^m * (x-c)^[c!=null] )
// s = "closeness" slider, delta = 2*10^(-s).
(function () {
  const M = (n) => (n < 0 ? '−' + (-n) : String(n));
  const xm = (r) => (r === 0 ? 'x' : (r > 0 ? `x − ${r}` : `x + ${-r}`));
  const INF = (s) => (s > 0 ? '+∞' : '−∞');
  const SG = (v) => (v > 0 ? '(+)' : '(−)');
  const CAP = 1e7;
  const V = (v) => (Number.isFinite(v) ? fmt2(v).replace('-', '−') : I18N.tx('tanımsız', 'undefined'));
  const S_MAX = 2.5;

  function createProblem(rng) { return gen(rng, null, 0); }
  // forced = fixed type (or null = random); sgn = forced sign of K (0 = free)
  function gen(rng, forced, sgn) {
    for (;;) {
      const type = forced === null ? rng.nextInt(0, 7) : forced;
      const a = rng.nextInt(-3, 4);
      let K = rng.nonZeroInt(-3, 3);
      if (sgn) K = sgn * Math.abs(K);
      const m = (type === 1 || type === 3 || type === 6) ? 2 : 1;
      let c = null, r = null;
      if (type >= 4) c = a + rng.nonZeroInt(-3, 3);
      if (type === 2 || type === 3 || type === 5) r = a + rng.nonZeroInt(-3, 3);
      if (r !== null && c !== null && r === c) continue;
      return { type, a, K, r, m, c, s: 1.0 };
    }
  }

  function delta(p) { return 2 * Math.pow(10, -Math.max(0, Math.min(S_MAX, p.s))); }

  function evaluator(p) {
    return (x) => {
      const den = Math.pow(x - p.a, p.m) * (p.c === null ? 1 : (x - p.c));
      if (!(Math.abs(den) > 1e-9)) return NaN;
      const y = p.K * (p.r === null ? 1 : (x - p.r)) / den;
      return (Number.isFinite(y) && Math.abs(y) <= CAP) ? y : NaN;
    };
  }

  function poles(p) {
    const L = [{ x: p.a, m: p.m }];
    if (p.c !== null) L.push({ x: p.c, m: 1 });
    return L;
  }

  // numerator value and product of the other denominator factors, evaluated at pole q
  function parts(p, q) {
    const num = p.K * (p.r === null ? 1 : (q.x - p.r));
    let other = 1;
    if (q.x !== p.a) other *= Math.pow(q.x - p.a, p.m);
    if (p.c !== null && q.x !== p.c) other *= (q.x - p.c);
    return { num, other };
  }

  function sides(p, q) {
    const pt = parts(p, q);
    const s0 = Math.sign(pt.num) * Math.sign(pt.other);
    return { s0, left: s0 * (q.m % 2 === 0 ? 1 : -1), right: s0, pt };
  }

  function fnStr(p) {
    let num;
    if (p.r === null) num = M(p.K);
    else if (p.r === 0) num = p.K === 1 ? 'x' : (p.K === -1 ? '−x' : `${M(p.K)}x`);
    else num = p.K === 1 ? xm(p.r) : (p.K === -1 ? `−(${xm(p.r)})` : `${M(p.K)}(${xm(p.r)})`);
    let den = `(${xm(p.a)})` + (p.m === 2 ? '²' : '');
    if (p.c !== null) den += `(${xm(p.c)})`;
    return `f(x) = ${num} / ${den}`;
  }

  function problemStatement(p) {
    const lst = poles(p).map((q) => 'x = ' + M(q.x)).join(', ');
    return I18N.tx(
      `${fnStr(p)} fonksiyonu için x = ${M(p.a)} noktasında soldan, sağdan ve iki taraflı limiti (x → ${M(p.a)}⁻, x → ${M(p.a)}⁺, x → ${M(p.a)}) bulalım. Ardından fonksiyonun tüm düşey asimptotlarını (${lst} noktalarına bakarak) belirleyelim.`,
      `For ${fnStr(p)}, let's find the left-hand, right-hand and two-sided limits at x = ${M(p.a)} (x → ${M(p.a)}⁻, x → ${M(p.a)}⁺, x → ${M(p.a)}). Then we can determine all vertical asymptotes (by looking at the points ${lst}).`);
  }

  function concept() {
    return I18N.tx(
      "SONSUZ LİMİT VE DÜŞEY ASİMPTOT\n" +
      "\n" +
      "TANIM: lim(x→a) f(x) = +∞ ifadesi, x → a iken f(x)'in her sınırı aşarak sınırsızca artması demektir (−∞: sınırsızca azalması). Burada ∞ bir sayı değildir; limitin bir gerçek sayı olarak VAR OLMADIĞINI, ama nasıl davrandığını anlatır. Tek taraflı limitlerden en az biri ±∞ ise x = a doğrusu f'nin DÜŞEY ASİMPTOTUDUR.\n" +
      "\n" +
      "TEMEL MODELLER:\n" +
      "   1/(x − a):  x → a⁻ için −∞, x → a⁺ için +∞  (iki taraflı limit yok, ama asimptot var)\n" +
      "   1/(x − a)²: iki yandan +∞  ⇒  lim = +∞\n" +
      "   −1/(x − a)²: iki yandan −∞  ⇒  lim = −∞\n" +
      "Kural: (x − a)^m için m ÇİFT ise çarpan iki yanda da pozitif, m TEK ise soldan negatif sağdan pozitiftir.\n" +
      "\n" +
      "YÖNTEM (işaret çizelgesi):\n" +
      "   (1) x = a'yı yerine koyarız. Pay ≠ 0 ve payda = 0 ise \"sıfırdan farklı / 0\" biçimidir: belirsiz değil, sonsuz limit. (0/0 çıkarsa önce sadeleştirmek gerekir; delik olabilir.)\n" +
      "   (2) a noktasında payın ve (x − a) dışındaki tüm çarpanların işaretine bakarız.\n" +
      "   (3) (x − a)^m çarpanının soldan (x < a) ve sağdan (x > a) işaretini belirleriz.\n" +
      "   (4) İşaretleri çarparız: sonuç + ise +∞, − ise −∞ olur. Soldan ve sağdan ayrı ayrı bakarız.\n" +
      "   (5) İki yan aynı işaretteyse lim = ±∞; farklıysa iki taraflı limit YOK, ama x = a yine de düşey asimptottur.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - \"1/0 = ∞\" yazmak (yanlıştır); bölme tanımsızdır, ∞ yalnızca limitin yönünü anlatır.\n" +
      "   - lim = ∞ yazınca \"limit var\" sanmak; sonlu bir sayı olarak limit yoktur.\n" +
      "   - Payın ya da diğer çarpanların işaretini unutmak (−1/(x−a)² ve 1/(x−a)² farklıdır).\n" +
      "   - 0/0 biçiminde sadeleştirmeden asimptot ilan etmek: (x²−1)/(x−1) için x = 1 delik, asimptot değil.\n" +
      "   - İki yanın işaretinin her zaman aynı olduğunu varsaymak; tek kuvvette işaret değişir.\n" +
      "\n" +
      "MİNİ ÖRNEK: lim(x→1) (x + 2)/(x − 1)². Pay 1'de 3 > 0. (x − 1)² iki yanda da pozitif ⇒ iki yandan +∞, dolayısıyla lim = +∞. Kontrol: x = 1,01 için 3,01/0,0001 = 30100.\n" +
      "\n" +
      "HAFIZA İPUCU: \"Sıfır olmayan bölü küçücük\" = devasa. İşareti soldan/sağdan (x − a)'nın işareti belirler.",
      "INFINITE LIMITS AND VERTICAL ASYMPTOTES\n" +
      "\n" +
      "DEFINITION: lim(x→a) f(x) = +∞ means that as x → a, f(x) increases without bound, beating every number (−∞: decreases without bound). ∞ is not a number here: it says the limit does NOT exist as a real number, but it describes how f behaves. If at least one one-sided limit is ±∞, the line x = a is a VERTICAL ASYMPTOTE of f.\n" +
      "\n" +
      "BASIC MODELS:\n" +
      "   1/(x − a):  −∞ as x → a⁻, +∞ as x → a⁺  (no two-sided limit, yet there is an asymptote)\n" +
      "   1/(x − a)²: +∞ from both sides  ⇒  lim = +∞\n" +
      "   −1/(x − a)²: −∞ from both sides  ⇒  lim = −∞\n" +
      "Rule: for (x − a)^m with m EVEN the factor is positive on both sides; with m ODD it is negative on the left and positive on the right.\n" +
      "\n" +
      "METHOD (sign chart):\n" +
      "   (1) We substitute x = a. If numerator ≠ 0 and denominator = 0 the form is \"nonzero / 0\": not indeterminate, an infinite limit. (If we get 0/0, it helps to simplify first; it may be a hole.)\n" +
      "   (2) We find the sign at x = a of the numerator and of every factor other than (x − a).\n" +
      "   (3) We find the sign of (x − a)^m on the left (x < a) and on the right (x > a).\n" +
      "   (4) We multiply the signs: + gives +∞, − gives −∞. We treat the left and the right separately.\n" +
      "   (5) If both sides agree, lim = ±∞; if not, the two-sided limit does NOT exist, but x = a is still a vertical asymptote.\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Writing \"1/0 = ∞\"; the division is undefined, ∞ only describes the direction of the limit.\n" +
      "   - Reading lim = ∞ as \"the limit exists\"; it does not exist as a finite number.\n" +
      "   - Forgetting the sign of the numerator or of the other factors (−1/(x−a)² differs from 1/(x−a)²).\n" +
      "   - Declaring an asymptote in a 0/0 case without simplifying: for (x²−1)/(x−1), x = 1 is a hole, not an asymptote.\n" +
      "   - Assuming the two sides always have the same sign; with an odd power the sign flips.\n" +
      "\n" +
      "MINI EXAMPLE: lim(x→1) (x + 2)/(x − 1)². The numerator at 1 is 3 > 0. (x − 1)² is positive on both sides ⇒ +∞ from both sides, so lim = +∞. Check: x = 1.01 gives 3.01/0.0001 = 30100.\n" +
      "\n" +
      "MEMORY AID: \"nonzero over tiny\" = huge. The sign comes from the sign of (x − a) on each side.");
  }

  function poleBlock(p, q, idx) {
    const sd = sides(p, q);
    const a = q.x, m = q.m;
    const numOnly = p.r === null ? M(p.K) : (p.r === 0 ? `${M(p.K)}·(${M(a)})` : `${M(p.K)}·(${M(a)} ${p.r < 0 ? '+ ' + (-p.r) : '− ' + p.r})`);
    const multi = poles(p).length > 1;
    const numSign = Math.sign(sd.pt.num), othSign = Math.sign(sd.pt.other);
    const leftM = m % 2 === 0 ? 1 : -1;
    const lt = sd.left, rt = sd.right;
    const out = [];
    out.push(I18N.tx(
      `── ${idx}) x = ${M(a)} noktasında işaret çizelgesi ──\nPay (x = ${M(a)} için): ${numOnly} = ${M(sd.pt.num)}  ${SG(numSign)} ≠ 0.\n` +
      (multi ? `Diğer payda çarpanlarının çarpımı (x = ${M(a)} için): ${M(sd.pt.other)}  ${SG(othSign)}.\n` : '') +
      `(${xm(a)})${m === 2 ? '²' : ''} çarpanı: soldan ${SG(leftM)}, sağdan (+).`,
      `── ${idx}) Sign chart at x = ${M(a)} ──\nNumerator (at x = ${M(a)}): ${numOnly} = ${M(sd.pt.num)}  ${SG(numSign)} ≠ 0.\n` +
      (multi ? `Product of the other denominator factors (at x = ${M(a)}): ${M(sd.pt.other)}  ${SG(othSign)}.\n` : '') +
      `Factor (${xm(a)})${m === 2 ? '²' : ''}: ${SG(leftM)} from the left, (+) from the right.`));
    out.push(I18N.tx(
      `x → ${M(a)}⁻ : ${SG(numSign)}·${SG(othSign)} / ${SG(leftM)} ⇒ ${SG(lt)}  ⇒  lim = ${INF(lt)}\nx → ${M(a)}⁺ : ${SG(numSign)}·${SG(othSign)} / (+) ⇒ ${SG(rt)}  ⇒  lim = ${INF(rt)}\n` +
      (lt === rt ? `İki yan aynı: lim(x→${M(a)}) f(x) = ${INF(lt)}.` : `İki yan farklı: lim(x→${M(a)}) f(x) VAR DEĞİL (−∞ ve +∞), fakat x = ${M(a)} düşey asimptottur.`),
      `x → ${M(a)}⁻ : ${SG(numSign)}·${SG(othSign)} / ${SG(leftM)} ⇒ ${SG(lt)}  ⇒  lim = ${INF(lt)}\nx → ${M(a)}⁺ : ${SG(numSign)}·${SG(othSign)} / (+) ⇒ ${SG(rt)}  ⇒  lim = ${INF(rt)}\n` +
      (lt === rt ? `Both sides agree: lim(x→${M(a)}) f(x) = ${INF(lt)}.` : `The sides differ: lim(x→${M(a)}) f(x) DOES NOT EXIST (−∞ vs +∞), yet x = ${M(a)} is a vertical asymptote.`)));
    return [out.join('\n')];
  }

  function solveSteps(p) {
    const f = evaluator(p), d = delta(p), ps = poles(p);
    const steps = [];
    steps.push(I18N.tx(
      `── 1) Fonksiyon ve payda sıfırları ──\n${fnStr(p)}\nPayda sıfırları: ${ps.map((q) => `x = ${M(q.x)}` + (q.m === 2 ? ' (çift kat)' : '')).join(', ')}.\nBu noktalarda pay: ${ps.map((q) => `x = ${M(q.x)} için ${M(parts(p, q).num)} ≠ 0`).join('; ')}. Pay sıfırdan farklı olduğundan 0/0 değil, "sıfırdan farklı / 0" biçimidir ⇒ sonsuz limit var, delik yok.`,
      `── 1) Function and zeros of the denominator ──\n${fnStr(p)}\nZeros of the denominator: ${ps.map((q) => `x = ${M(q.x)}` + (q.m === 2 ? ' (double)' : '')).join(', ')}.\nNumerator there: ${ps.map((q) => `${M(parts(p, q).num)} ≠ 0 at x = ${M(q.x)}`).join('; ')}. Since the numerator is nonzero it is not 0/0 but "nonzero / 0" ⇒ an infinite limit, not a hole.`));
    poleBlock(p, ps[0], 2).forEach((s) => steps.push(s));
    const sdA = sides(p, ps[0]);
    if (ps.length > 1) poleBlock(p, ps[1], 3).forEach((s) => steps.push(s));
    const k = steps.length + 1;
    const xl = p.a - d, xr = p.a + d;
    steps.push(I18N.tx(
      `── ${k}) Sayısal kontrol (δ = ${fmt2(d)}) ──\nx = ${V(xl)} için f = ${V(f(xl))};  x = ${V(xr)} için f = ${V(f(xr))}.\nSürgüyü ilerleterek δ'yı küçültebiliriz: değerler ${sdA.left === sdA.right ? 'iki yanda da aynı yönde' : 'soldan ve sağdan ters yönlerde'} sınırsızca büyür.`,
      `── ${k}) Numerical check (δ = ${fmt2(d)}) ──\nAt x = ${V(xl)}: f = ${V(f(xl))};  at x = ${V(xr)}: f = ${V(f(xr))}.\nIf we move the slider to shrink δ, the values grow without bound ${sdA.left === sdA.right ? 'in the same direction on both sides' : 'in opposite directions on the two sides'}.`));
    steps.push(I18N.tx(
      `── ${k + 1}) Sonuç ──\nlim(x→${M(p.a)}⁻) f = ${INF(sdA.left)},  lim(x→${M(p.a)}⁺) f = ${INF(sdA.right)},  ` +
      (sdA.left === sdA.right ? `lim(x→${M(p.a)}) f = ${INF(sdA.left)}.` : `iki taraflı limit yok.`) +
      `\nDüşey asimptot(lar): ${ps.map((q) => `x = ${M(q.x)}`).join(' ve ')}.`,
      `── ${k + 1}) Conclusion ──\nlim(x→${M(p.a)}⁻) f = ${INF(sdA.left)},  lim(x→${M(p.a)}⁺) f = ${INF(sdA.right)},  ` +
      (sdA.left === sdA.right ? `lim(x→${M(p.a)}) f = ${INF(sdA.left)}.` : `the two-sided limit does not exist.`) +
      `\nVertical asymptote(s): ${ps.map((q) => `x = ${M(q.x)}`).join(' and ')}.`));
    return steps;
  }

  function draw(canvas, p) {
    const f = evaluator(p), d = delta(p);
    const xl = p.a - d, xr = p.a + d;
    const vals = [p.a, p.c === null ? p.a : p.c, p.r === null ? p.a : p.r];
    const hw = Math.max(...vals.map((v) => Math.abs(v - p.a))) + 4;
    const xMin = p.a - hw, xMax = p.a + hw;
    const yl = f(xl), yr = f(xr);
    let big = 8;
    [yl, yr].forEach((v) => { if (Number.isFinite(v)) big = Math.max(big, Math.abs(v) * 1.25); });
    canvas.setViewport(xMin, xMax, -big, big);
    canvas.addRegion({ xMin: xl, xMax: xr });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: '' });
    poles(p).forEach((q) => canvas.addGuideLine({ axis: 'vertical', position: q.x, color: canvas.gray(), label: `x = ${M(q.x)}` }));
    if (Number.isFinite(yl)) canvas.addMarker({ x: xl, y: yl, color: canvas.orange(), radius: 6, label: `(${fmt2(xl)}, ${fmt2(yl)})` });
    if (Number.isFinite(yr)) canvas.addMarker({ x: xr, y: yr, color: canvas.green(), radius: 6, label: `(${fmt2(xr)}, ${fmt2(yr)})` });
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: I18N.tx('x = a noktasına yaklaşalım (δ küçülür)', 'Let us close in on x = a (δ shrinks)'),
      min: 0, max: S_MAX, step: 0.05,
      get: () => getProblem().s,
      set: (v) => { getProblem().s = Math.max(0, Math.min(S_MAX, v)); },
    });
  }

  Topics.register('limits', {
    id: 'infiniteLimit',
    tabTitle: () => I18N.tx('Sonsuz Limit', 'Infinite Limits'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: p.a, y: 0 }),
    buildControls,
    links: [
      { match: /^\s*1\/\(x − a\):/, make: (rng) => gen(rng, 0, 1) },
      { match: /^\s*1\/\(x − a\)²:/, make: (rng) => gen(rng, 1, 1) },
      { match: /^\s*−1\/\(x − a\)²:/, make: (rng) => gen(rng, 1, -1) },
      { match: /^\s*\(2\) (a noktasında payın|We find the sign at x = a)/, make: (rng) => gen(rng, rng.pick([2, 3, 4, 5, 6]), 0) },
    ],
  });
})();
