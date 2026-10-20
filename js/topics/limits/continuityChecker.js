// Three-part continuity test. Ported from Modules/Limits/ContinuityCheckerControl.vb (continuous / removable / jump),
// extended with infinite, oscillating and mismatch cases.
// problem = { kind, a, ..., s }   s = closeness slider (delta = 2*10^(-s)).
//  kind 0: polynomial (continuous)           1: (x+b)/(x-d) (continuous)      2: hole filled with f(c)=2c (continuous)
//  kind 3: (x^2-c^2)/(x-c), f(c) undefined   4: same with f(c) = m != 2c      5: piecewise lines (jump)
//  kind 6: K/(x-a)^m (infinite)              7: A sin(1/x), f(0)=0 (oscillating)
(function () {
  const M = (n) => (n < 0 ? '−' + (-n) : String(n));
  const N = (v) => (Number.isFinite(v) ? fmt2(v).replace('-', '−') : I18N.tx('tanımsız', 'undefined'));
  const INF = (s) => (s > 0 ? '+∞' : '−∞');
  const S_MAX = 2.5;
  const coef = (A) => (A === 1 ? '' : String(A));
  const xm = (r) => (r === 0 ? 'x' : (r > 0 ? `x − ${r}` : `x + ${-r}`));

  function lin(u, v) {
    let s = u === 0 ? '' : (u === 1 ? 'x' : (u === -1 ? '−x' : `${M(u)}x`));
    if (v !== 0 || s === '') s += (s === '' ? M(v) : (v > 0 ? ` + ${v}` : ` − ${-v}`));
    return s;
  }
  function quad(c2, c1, c0) {
    let s = c2 === 1 ? 'x²' : (c2 === -1 ? '−x²' : `${M(c2)}x²`);
    if (c1 !== 0) s += c1 > 0 ? ` + ${c1 === 1 ? '' : c1}x` : ` − ${c1 === -1 ? '' : -c1}x`;
    if (c0 !== 0) s += c0 > 0 ? ` + ${c0}` : ` − ${-c0}`;
    return s;
  }

  function createProblem(rng) { return gen(rng, null); }
  function gen(rng, forced) {
    for (;;) {
      const kind = forced === null ? rng.nextInt(0, 8) : forced;
      const p = { kind, a: rng.nextInt(-2, 4), c2: rng.nonZeroInt(-2, 2), c1: rng.nextInt(-3, 4), c0: rng.nextInt(-3, 4),
        b: rng.nextInt(-3, 4), d: 0, c: rng.nonZeroInt(-3, 3), m: 0, K: rng.nonZeroInt(-3, 3), pw: rng.nextInt(1, 3),
        u1: rng.nonZeroInt(-2, 2), v1: rng.nextInt(-3, 4), u2: rng.nonZeroInt(-2, 2), v2: rng.nextInt(-3, 4),
        side: rng.pick(['L', 'R']), A: rng.nextInt(1, 4), s: 1.0 };
      p.d = p.a + rng.pick([-1, 1]);
      if (kind >= 2 && kind <= 4) p.a = p.c;
      if (kind === 4) { p.m = rng.nextInt(-4, 5); if (p.m === 2 * p.c) continue; }
      if (kind === 5 && p.u1 * p.a + p.v1 === p.u2 * p.a + p.v2) continue;
      if (kind === 7) p.a = 0;
      return p;
    }
  }

  function delta(p) { return 2 * Math.pow(10, -Math.max(0, Math.min(S_MAX, p.s))); }

  // analysis: f(a) (null = undefined), left / right limits, evaluator away from a
  function model(p) {
    const a = p.a;
    let g, fa, L, R;
    switch (p.kind) {
      case 0: g = (x) => p.c2 * x * x + p.c1 * x + p.c0; fa = g(a); L = R = { t: 'num', v: fa }; break;
      case 1: g = (x) => (Math.abs(x - p.d) < 1e-9 ? NaN : (x + p.b) / (x - p.d)); fa = (a + p.b) / (a - p.d); L = R = { t: 'num', v: fa }; break;
      case 2: g = (x) => (Math.abs(x - p.c) < 1e-9 ? NaN : (x * x - p.c * p.c) / (x - p.c)); fa = 2 * p.c; L = R = { t: 'num', v: 2 * p.c }; break;
      case 3: g = (x) => (Math.abs(x - p.c) < 1e-9 ? NaN : (x * x - p.c * p.c) / (x - p.c)); fa = null; L = R = { t: 'num', v: 2 * p.c }; break;
      case 4: g = (x) => (Math.abs(x - p.c) < 1e-9 ? NaN : (x * x - p.c * p.c) / (x - p.c)); fa = p.m; L = R = { t: 'num', v: 2 * p.c }; break;
      case 5: {
        g = (x) => (x < a ? p.u1 * x + p.v1 : p.u2 * x + p.v2);
        const l1 = p.u1 * a + p.v1, l2 = p.u2 * a + p.v2;
        fa = p.side === 'R' ? l2 : l1; L = { t: 'num', v: l1 }; R = { t: 'num', v: l2 }; break;
      }
      case 6: {
        g = (x) => { const d = Math.pow(x - a, p.pw); return Math.abs(d) < 1e-9 ? NaN : p.K / d; };
        fa = null;
        const sR = Math.sign(p.K), sL = p.pw === 2 ? sR : -sR;
        L = { t: 'inf', s: sL }; R = { t: 'inf', s: sR }; break;
      }
      default:
        g = (x) => (Math.abs(x) < 1e-12 ? NaN : p.A * Math.sin(1 / x)); fa = 0; L = R = { t: 'osc' };
    }
    const f = (x) => {
      if (Math.abs(x - a) < 1e-12) return NaN;
      const y = g(x);
      return (Number.isFinite(y) && Math.abs(y) <= 1e7) ? y : NaN;
    };
    const c1 = fa !== null;
    const c2 = L.t === 'num' && R.t === 'num' && Math.abs(L.v - R.v) < 1e-9;
    const c3 = c1 && c2 && Math.abs(fa - L.v) < 1e-9;
    let disc = null;
    if (!c3) {
      if (L.t === 'inf' || R.t === 'inf') disc = 'inf';
      else if (L.t === 'osc') disc = 'osc';
      else if (c2) disc = 'removable';
      else disc = 'jump';
    }
    return { f, fa, L, R, c1, c2, c3, ok: c3, disc };
  }

  function limStr(x) { return x.t === 'num' ? N(x.v) : (x.t === 'inf' ? INF(x.s) : '—'); }
  function sideStr(x, dir, a) {
    return x.t === 'osc' ? `lim(x→${M(a)}${dir}) f(x): ${I18N.tx('salınır, bir değere yerleşmez', 'oscillates, does not settle')}` : `lim(x→${M(a)}${dir}) f(x) = ${limStr(x)}`;
  }

  function fnStr(p) {
    const a = M(p.a);
    switch (p.kind) {
      case 0: return `f(x) = ${quad(p.c2, p.c1, p.c0)}`;
      case 1: return `f(x) = (${p.b === 0 ? 'x' : (p.b > 0 ? 'x + ' + p.b : 'x − ' + (-p.b))}) / (${xm(p.d)})`;
      case 2: return `f(x) = (x² − ${p.c * p.c}) / (${xm(p.c)})  (x ≠ ${M(p.c)}),   f(${M(p.c)}) = ${M(2 * p.c)}`;
      case 3: return `f(x) = (x² − ${p.c * p.c}) / (${xm(p.c)})`;
      case 4: return `f(x) = (x² − ${p.c * p.c}) / (${xm(p.c)})  (x ≠ ${M(p.c)}),   f(${M(p.c)}) = ${M(p.m)}`;
      case 5: return p.side === 'R'
        ? `f(x) = ${lin(p.u1, p.v1)}  (x < ${a}),   f(x) = ${lin(p.u2, p.v2)}  (x ≥ ${a})`
        : `f(x) = ${lin(p.u1, p.v1)}  (x ≤ ${a}),   f(x) = ${lin(p.u2, p.v2)}  (x > ${a})`;
      case 6: return `f(x) = ${M(p.K)} / (${xm(p.a)})${p.pw === 2 ? '²' : ''}`;
      default: return `f(x) = ${coef(p.A)}sin(1/x)  (x ≠ 0),   f(0) = 0`;
    }
  }

  function problemStatement(p) {
    const a = M(p.a);
    return I18N.tx(
      `${fnStr(p)} fonksiyonu x = ${a} noktasında sürekli midir? Süreklilik testinin üç koşuluna sırayla bakalım; süreksizse hangi koşulun sağlanmadığını ve süreksizliğin türünü bulalım.`,
      `Is ${fnStr(p)} continuous at x = ${a}? Let's check the three conditions of the continuity test in order; if it is discontinuous, we find which condition fails and the type of discontinuity.`);
  }

  function concept() {
    return I18N.tx(
      "SÜREKLİLİK TESTİ\n" +
      "\n" +
      "TANIM: f, x = a noktasında SÜREKLİDİR ancak ve ancak şu üç koşulun HEPSİ sağlanıyorsa:\n" +
      "   (1) f(a) tanımlıdır (a, tanım kümesindedir).\n" +
      "   (2) lim(x→a) f(x) vardır ve sonludur (soldan limit = sağdan limit = L).\n" +
      "   (3) lim(x→a) f(x) = f(a).\n" +
      "Kısaca: lim(x→a) f(x) = f(a). Grafik açısından: a'da kalemi kaldırmadan çizilebilir.\n" +
      "\n" +
      "YÖNTEM (üç adım):\n" +
      "   (1) Önce f(a)'yı hesaplarız; tanımsızsa (0'a bölme, olmayan değer) süreksizdir, burada durulur.\n" +
      "   (2) Soldan ve sağdan limiti hesaplarız; eşit ve sonlu mu diye bakarız.\n" +
      "   (3) L ile f(a)'yı karşılaştırırız.\n" +
      "   (4) Hangi koşulun bozulduğuna bakarak süreksizliği sınıflandırırız.\n" +
      "\n" +
      "SÜREKSİZLİK TÜRLERİ:\n" +
      "   - KALDIRILABİLİR (delik): lim vardır ama f(a) tanımsız ya da f(a) ≠ lim. f(a) := lim yapılarak onarılır. Örnek: (x²−1)/(x−1), x = 1.\n" +
      "   - SIÇRAMA: soldan ve sağdan limitler sonlu ama farklı. Onarılamaz.\n" +
      "   - SONSUZ: en az bir tek taraflı limit ±∞ (düşey asimptot).\n" +
      "   - SALINIM (esaslı): limit hiçbir değere oturmaz, örnek sin(1/x).\n" +
      "\n" +
      "BİLİNEN SÜREKLİ FONKSİYONLAR: polinomlar her yerde; rasyonel fonksiyonlar paydası sıfır olmayan yerlerde; sin, cos, eᵡ her yerde; √x, ln x kendi tanım kümelerinde. Sürekli fonksiyonların toplamı, çarpımı, bileşkesi ve (paydası ≠ 0 olan) bölümü süreklidir.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - Yalnızca limitin var olmasını yeterli sanmak; f(a)'nın da tanımlı ve limite eşit olması gerekir.\n" +
      "   - Sadeleştirilmiş formla (x+1) çalışıp orijinal fonksiyonun x = 1'de tanımsız olduğunu unutmak.\n" +
      "   - Parçalı fonksiyonda a'nın hangi dala ait olduğuna bakmayı atlamak (≤ ya da <).\n" +
      "   - Sonsuz limiti \"limit var\" sayıp koşul 2'yi geçmiş saymak.\n" +
      "\n" +
      "MİNİ ÖRNEK: f(x) = (x²−1)/(x−1), a = 1. (1) f(1) = 0/0 tanımsız ⇒ koşul 1 bozulur. (2) x ≠ 1 için f(x) = x+1 ⇒ iki yandan limit 2 (var). (3) Karşılaştırılamaz. Sonuç: süreksiz, KALDIRILABİLİR; f(1) := 2 tanımlanırsa sürekli olur.\n" +
      "\n" +
      "HAFIZA İPUCU: \"Var mı, yerleşiyor mu, eşit mi?\"  f(a) var mı? limit var mı? ikisi eşit mi?",
      "THE CONTINUITY TEST\n" +
      "\n" +
      "DEFINITION: f is CONTINUOUS at x = a if and only if ALL THREE of the following hold:\n" +
      "   (1) f(a) is defined (a lies in the domain).\n" +
      "   (2) lim(x→a) f(x) exists and is finite (left limit = right limit = L).\n" +
      "   (3) lim(x→a) f(x) = f(a).\n" +
      "In short: lim(x→a) f(x) = f(a). Graphically: we can draw through a without lifting the pen.\n" +
      "\n" +
      "METHOD (three steps):\n" +
      "   (1) We first compute f(a); if it is undefined (division by zero, no value) f is discontinuous and we can stop.\n" +
      "   (2) We compute the left and right limits and see whether they are equal and finite.\n" +
      "   (3) We compare L with f(a).\n" +
      "   (4) We classify the discontinuity by the condition that fails.\n" +
      "\n" +
      "TYPES OF DISCONTINUITY:\n" +
      "   - REMOVABLE (hole): the limit exists but f(a) is undefined or f(a) ≠ lim. Repaired by setting f(a) := lim. Example: (x²−1)/(x−1) at x = 1.\n" +
      "   - JUMP: the one-sided limits are finite but different. Cannot be repaired.\n" +
      "   - INFINITE: at least one one-sided limit is ±∞ (vertical asymptote).\n" +
      "   - OSCILLATING (essential): the limit settles at no value, e.g. sin(1/x).\n" +
      "\n" +
      "KNOWN CONTINUOUS FUNCTIONS: polynomials everywhere; rational functions wherever the denominator is nonzero; sin, cos, eˣ everywhere; √x, ln x on their domains. Sums, products, compositions and quotients (denominator ≠ 0) of continuous functions are continuous.\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Believing that the existence of the limit alone is enough; f(a) must be defined and equal to it.\n" +
      "   - Working with the simplified form (x+1) and forgetting the original function is undefined at x = 1.\n" +
      "   - In a piecewise function, not checking which branch contains a (≤ versus <).\n" +
      "   - Counting an infinite limit as \"the limit exists\" and passing condition 2.\n" +
      "\n" +
      "MINI EXAMPLE: f(x) = (x²−1)/(x−1), a = 1. (1) f(1) = 0/0 is undefined ⇒ condition 1 fails. (2) For x ≠ 1, f(x) = x+1 ⇒ the limit is 2 from both sides (it exists). (3) Cannot compare. Result: discontinuous, REMOVABLE; defining f(1) := 2 makes it continuous.\n" +
      "\n" +
      "MEMORY AID: \"Exists? Settles? Equal?\"  Is f(a) there? Is the limit there? Are they equal?");
  }

  function solveSteps(p) {
    const a = M(p.a), mo = model(p), d = delta(p), steps = [];
    const yn = (b) => (b ? I18N.tx('EVET', 'YES') : I18N.tx('HAYIR', 'NO'));
    steps.push(I18N.tx(
      `── 1) Fonksiyon ve test noktası ──\n${fnStr(p)}\nTest noktası: x = ${a}. Üç koşula sırayla bakalım.`,
      `── 1) The function and the test point ──\n${fnStr(p)}\nTest point: x = ${a}. Let's check the three conditions in order.`));
    steps.push(I18N.tx(
      `── 2) Koşul 1: f(${a}) tanımlı mı? ──\n` + (mo.c1 ? `f(${a}) = ${N(mo.fa)}  ⇒ ${yn(true)}` : `f(${a}) tanımsız (${p.kind === 6 ? 'payda 0' : '0/0'})  ⇒ ${yn(false)}`),
      `── 2) Condition 1: is f(${a}) defined? ──\n` + (mo.c1 ? `f(${a}) = ${N(mo.fa)}  ⇒ ${yn(true)}` : `f(${a}) is undefined (${p.kind === 6 ? 'denominator 0' : '0/0'})  ⇒ ${yn(false)}`)));
    let hint = '';
    if (p.kind === 2 || p.kind === 3 || p.kind === 4) hint = I18N.tx(`\nx ≠ ${M(p.c)} için (x²−${p.c * p.c})/(${xm(p.c)}) = ${xm(-p.c)} (sadeleştirme), dolayısıyla x → ${M(p.c)} iken değer 2·(${M(p.c)}) = ${M(2 * p.c)} olur.`, `\nFor x ≠ ${M(p.c)}, (x²−${p.c * p.c})/(${xm(p.c)}) = ${xm(-p.c)} (cancelling), so as x → ${M(p.c)} the value tends to 2·(${M(p.c)}) = ${M(2 * p.c)}.`);
    if (p.kind === 6) hint = I18N.tx(`\nPay ${M(p.K)} ≠ 0, payda 0'a gidiyor ⇒ sonsuz davranış.`, `\nNumerator ${M(p.K)} ≠ 0 while the denominator tends to 0 ⇒ infinite behaviour.`);
    if (p.kind === 7) hint = I18N.tx(`\nx_n = 1/(π/2 + 2πn) için f = ${M(p.A)}, y_n = 1/(3π/2 + 2πn) için f = ${M(-p.A)}; ikisi de 0'a yaklaşır.`, `\nFor x_n = 1/(π/2 + 2πn) f = ${M(p.A)}, for y_n = 1/(3π/2 + 2πn) f = ${M(-p.A)}; both tend to 0.`);
    steps.push(I18N.tx(
      `── 3) Koşul 2: limit var mı? ──\n${sideStr(mo.L, '⁻', p.a)}\n${sideStr(mo.R, '⁺', p.a)}\nSoldan = sağdan ve sonlu mu? ⇒ ${yn(mo.c2)}` + hint,
      `── 3) Condition 2: does the limit exist? ──\n${sideStr(mo.L, '⁻', p.a)}\n${sideStr(mo.R, '⁺', p.a)}\nLeft = right and finite? ⇒ ${yn(mo.c2)}` + hint));
    let c3tr, c3en;
    if (!mo.c1) { c3tr = 'Karşılaştırılamaz: f(a) yok, dolayısıyla bu koşul kendiliğinden sağlanmaz.'; c3en = "Cannot compare: f(a) does not exist, so this condition fails automatically."; }
    else if (!mo.c2) { c3tr = 'Karşılaştırılamaz: iki taraflı limit (sonlu olarak) yok, dolayısıyla bu koşul kendiliğinden sağlanmaz.'; c3en = 'Cannot compare: there is no (finite) two-sided limit, so this condition fails automatically.'; }
    else { c3tr = `lim f = ${N(mo.L.v)}, f(${a}) = ${N(mo.fa)}  ⇒ ${yn(mo.c3)}${mo.c3 ? ', eşit' : ', farklı'}`; c3en = `lim f = ${N(mo.L.v)}, f(${a}) = ${N(mo.fa)}  ⇒ ${yn(mo.c3)}${mo.c3 ? ', equal' : ', different'}`; }
    steps.push(I18N.tx(`── 4) Koşul 3: lim f(x) = f(${a}) mi? ──\n${c3tr}`, `── 4) Condition 3: lim f(x) = f(${a})? ──\n${c3en}`));
    const fail = [!mo.c1 ? 1 : 0, !mo.c2 ? 2 : 0, !mo.c3 ? 3 : 0].filter((x) => x).join(', ');
    let kindTr = '', kindEn = '';
    if (mo.disc === 'removable') {
      kindTr = `Süreksizlik türü: KALDIRILABİLİR (delik). Limit ${N(mo.L.v)} var; f(${a}) := ${N(mo.L.v)} tanımlanırsa fonksiyon sürekli olur.`;
      kindEn = `Type of discontinuity: REMOVABLE (hole). The limit ${N(mo.L.v)} exists; defining f(${a}) := ${N(mo.L.v)} makes the function continuous.`;
    } else if (mo.disc === 'jump') {
      kindTr = `Süreksizlik türü: SIÇRAMA. Soldan ${N(mo.L.v)}, sağdan ${N(mo.R.v)}; sıçrama boyu ${N(Math.abs(mo.R.v - mo.L.v))}. Tek bir değer tanımlayarak onarılamaz.`;
      kindEn = `Type of discontinuity: JUMP. ${N(mo.L.v)} from the left, ${N(mo.R.v)} from the right; jump size ${N(Math.abs(mo.R.v - mo.L.v))}. It cannot be repaired by defining a single value.`;
    } else if (mo.disc === 'inf') {
      kindTr = `Süreksizlik türü: SONSUZ. x = ${a} düşey asimptottur (soldan ${limStr(mo.L)}, sağdan ${limStr(mo.R)}).`;
      kindEn = `Type of discontinuity: INFINITE. x = ${a} is a vertical asymptote (${limStr(mo.L)} from the left, ${limStr(mo.R)} from the right).`;
    } else if (mo.disc === 'osc') {
      kindTr = 'Süreksizlik türü: SALINIM (esaslı). Limit hiçbir değere oturmaz; f(0) = 0 tanımlı olması bunu düzeltmez.';
      kindEn = 'Type of discontinuity: OSCILLATING (essential). The limit settles at no value; defining f(0) = 0 does not help.';
    }
    steps.push(I18N.tx(
      mo.ok ? `── 5) Sonuç ──\nx = ${a} noktasında SÜREKLİ: üç koşulun hepsi sağlanıyor.` : `── 5) Sonuç ──\nx = ${a} noktasında SÜREKLİ DEĞİL: sağlanmayan koşul(lar): ${fail}.\n${kindTr}`,
      mo.ok ? `── 5) Conclusion ──\nCONTINUOUS at x = ${a}: all three conditions hold.` : `── 5) Conclusion ──\nNOT CONTINUOUS at x = ${a}: failing condition(s): ${fail}.\n${kindEn}`));
    const xl = p.a - d, xr = p.a + d;
    steps.push(I18N.tx(
      `── 6) Sayısal kontrol (δ = ${fmt2(d)}) ──\nf(${N(xl)}) = ${N(mo.f(xl))},  f(${N(xr)}) = ${N(mo.f(xr))}` + (mo.c1 ? `,  f(${a}) = ${N(mo.fa)}.` : `,  f(${a}) tanımsız.`),
      `── 6) Numerical check (δ = ${fmt2(d)}) ──\nf(${N(xl)}) = ${N(mo.f(xl))},  f(${N(xr)}) = ${N(mo.f(xr))}` + (mo.c1 ? `,  f(${a}) = ${N(mo.fa)}.` : `,  f(${a}) is undefined.`)));
    return steps;
  }

  function focusPt(p) {
    const mo = model(p);
    if (p.kind === 6 || p.kind === 7) return { x: p.a, y: 0 };
    if (mo.L.t === 'num' && mo.R.t === 'num' && Math.abs(mo.L.v - mo.R.v) > 1e-9) return { x: p.a, y: (mo.L.v + mo.R.v) / 2 };
    return { x: p.a, y: mo.L.t === 'num' ? mo.L.v : 0 };
  }

  function draw(canvas, p) {
    const mo = model(p), a = p.a, d = delta(p), f = mo.f;
    let lo = Infinity, hi = -Infinity;
    const add = (v) => { if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } };
    if (p.kind === 6) { lo = -8; hi = 8; }
    else if (p.kind === 7) { lo = -p.A * 1.5; hi = p.A * 1.5; }
    else {
      for (let i = 0; i <= 160; i++) add(f(a - 4 + i * 8 / 160));
      add(mo.fa); if (mo.L.t === 'num') add(mo.L.v); if (mo.R.t === 'num') add(mo.R.v);
      const pad = Math.max(1, (hi - lo) * 0.2);
      lo -= pad; hi += pad;
      if (hi - lo < 4) { const mid = (hi + lo) / 2; lo = mid - 2; hi = mid + 2; }
      const fy = focusPt(p).y, hh = Math.max(fy - lo, hi - fy); lo = fy - hh; hi = fy + hh;
    }
    canvas.setViewport(a - 4, a + 4, lo, hi);
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: '' });
    if (p.kind === 6) canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gray(), label: `x = ${a}` });
    // limit markers (hollow) and f(a) (filled)
    const limits = [];
    if (mo.L.t === 'num') limits.push({ v: mo.L.v, col: canvas.orange(), tag: mo.R.t === 'num' && Math.abs(mo.R.v - mo.L.v) < 1e-9 ? 'lim' : 'L₁' });
    if (mo.R.t === 'num' && !(mo.L.t === 'num' && Math.abs(mo.R.v - mo.L.v) < 1e-9)) limits.push({ v: mo.R.v, col: canvas.green(), tag: 'L₂' });
    limits.forEach((l) => {
      if (mo.fa !== null && Math.abs(mo.fa - l.v) < 1e-9) return;
      canvas.addMarker({ x: a, y: l.v, color: l.col, hollow: true, radius: 6, label: `${l.tag} = ${N(l.v)}` });
    });
    if (mo.fa !== null) canvas.addMarker({ x: a, y: mo.fa, color: canvas.gold(), radius: 6, label: `f(${M(a)}) = ${N(mo.fa)}` });
    const yl = f(a - d), yr = f(a + d);
    const inView = (y) => Number.isFinite(y) && y >= lo && y <= hi;
    if (inView(yl)) canvas.addMarker({ x: a - d, y: yl, color: canvas.purple(), radius: 4, label: N(yl) });
    if (inView(yr)) canvas.addMarker({ x: a + d, y: yr, color: canvas.blue(), radius: 4, label: N(yr) });
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
    id: 'continuityChecker',
    tabTitle: () => I18N.tx('Süreklilik Testi', 'Continuity Test'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: focusPt,
    buildControls,
    links: [
      { match: /^\s*- (KALDIRILABİLİR|REMOVABLE)/, make: (rng) => gen(rng, rng.pick([3, 4])) },
      { match: /^\s*- (SIÇRAMA|JUMP):/, make: (rng) => gen(rng, 5) },
      { match: /^\s*- (SONSUZ|INFINITE):/, make: (rng) => gen(rng, 6) },
      { match: /^\s*- (SALINIM|OSCILLATING)/, make: (rng) => gen(rng, 7) },
      { match: /^(BİLİNEN SÜREKLİ FONKSİYONLAR|KNOWN CONTINUOUS FUNCTIONS):/, make: (rng) => gen(rng, rng.pick([0, 1, 2])) },
    ],
  });
})();
