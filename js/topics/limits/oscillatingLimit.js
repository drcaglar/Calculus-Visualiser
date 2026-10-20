// Why does a limit not exist? Ported from Modules/Limits/OscillatingLimitControl.vb (sin(1/x) with a zoom bar),
// extended with the other standard reasons (different one-sided limits, unbounded growth) and the squeeze contrast.
// problem = { type, a, A, k, K, m, fn, u1, v1, u2, v2, z, showSeq, showBounds }
//  type 0: A sin(k/x)   1: A cos(k/x)   2: A|x|/x   3: K/x^m   4: piecewise lines with a jump at a   5: A x sin|cos(k/x)  (limit EXISTS)
// z = zoom slider: half window w = 2*10^(-z).
(function () {
  const M = (n) => (n < 0 ? '−' + (-n) : String(n));
  const INF = (s) => (s > 0 ? '+∞' : '−∞');
  const sig3 = (v) => { const t = Number(Math.abs(v) < 1e-12 ? 0 : v.toPrecision(3)); return String(t === 0 ? 0 : t).replace('-', '−'); };
  const Z_MAX = 2.7;
  const TWO_PI = 2 * Math.PI;

  function lin(u, v) {
    let s = u === 0 ? '' : (u === 1 ? 'x' : (u === -1 ? '−x' : `${M(u)}x`));
    if (v !== 0 || s === '') s += (s === '' ? M(v) : (v > 0 ? ` + ${v}` : ` − ${-v}`));
    return s;
  }
  const coef = (A) => (A === 1 ? '' : String(A));

  function createProblem(rng) { return gen(rng, null); }
  function gen(rng, forced) {
    for (;;) {
      const type = forced === null ? rng.nextInt(0, 6) : forced;
      const p = { type, a: 0, A: rng.nextInt(1, 4), k: rng.nextInt(1, 4), K: rng.nonZeroInt(-3, 3), m: rng.nextInt(1, 3),
        fn: rng.pick(['sin', 'cos']), u1: 0, v1: 0, u2: 0, v2: 0, z: 1.0, showSeq: true, showBounds: true };
      if (type === 4) {
        p.a = rng.nextInt(-2, 3);
        p.u1 = rng.nonZeroInt(-2, 2); p.u2 = rng.nonZeroInt(-2, 2);
        p.v1 = rng.nextInt(-3, 4); p.v2 = rng.nextInt(-3, 4);
        if (p.u1 * p.a + p.v1 === p.u2 * p.a + p.v2) continue;
      }
      return p;
    }
  }

  function halfW(p) { return 2 * Math.pow(10, -Math.max(0, Math.min(Z_MAX, p.z))); }
  function leftL(p) { return p.u1 * p.a + p.v1; }
  function rightL(p) { return p.u2 * p.a + p.v2; }

  function evaluator(p) {
    return (x) => {
      let y;
      switch (p.type) {
        case 0: if (Math.abs(x) < 1e-12) return NaN; y = p.A * Math.sin(p.k / x); break;
        case 1: if (Math.abs(x) < 1e-12) return NaN; y = p.A * Math.cos(p.k / x); break;
        case 2: if (Math.abs(x) < 1e-12) return NaN; y = p.A * Math.abs(x) / x; break;
        case 3: if (Math.abs(x) < 1e-6) return NaN; y = p.K / Math.pow(x, p.m); break;
        case 4: if (Math.abs(x - p.a) < 1e-12) return NaN; y = x < p.a ? p.u1 * x + p.v1 : p.u2 * x + p.v2; break;
        default:
          if (Math.abs(x) < 1e-12) return NaN;
          y = p.A * x * (p.fn === 'sin' ? Math.sin(p.k / x) : Math.cos(p.k / x));
      }
      return (Number.isFinite(y) && Math.abs(y) <= 1e7) ? y : NaN;
    };
  }

  function fnStr(p) {
    const kx = p.k === 1 ? '1/x' : `${p.k}/x`;
    switch (p.type) {
      case 0: return `f(x) = ${coef(p.A)}sin(${kx})`;
      case 1: return `f(x) = ${coef(p.A)}cos(${kx})`;
      case 2: return `f(x) = ${coef(p.A)}|x| / x`;
      case 3: return `f(x) = ${M(p.K)} / x${p.m === 2 ? '²' : ''}`;
      case 4: return `f(x) = ${lin(p.u1, p.v1)}  (x < ${M(p.a)}),   f(x) = ${lin(p.u2, p.v2)}  (x > ${M(p.a)})`;
      default: return `f(x) = ${coef(p.A)}x·${p.fn}(${kx})`;
    }
  }

  function exists(p) { return p.type === 5; }

  function problemStatement(p) {
    const a = M(p.a);
    return I18N.tx(
      `${fnStr(p)} için lim(x → ${a}) f(x) limiti var mı? Soldan ve sağdan davranışa bakarak karar verelim; varsa değerini, yoksa nedenini (üç standart nedenden hangisi olduğunu) söyleyelim.`,
      `For ${fnStr(p)}, does lim(x → ${a}) f(x) exist? Let's look at the behaviour from the left and from the right; we give its value if it exists, or the reason (which of the three standard reasons) if it does not.`);
  }

  function concept() {
    return I18N.tx(
      "LİMİT NEDEN YOK?\n" +
      "\n" +
      "TANIM: lim(x→a) f(x) = L (L bir GERÇEK SAYI) olması için x, a'ya hangi yandan yaklaşırsa yaklaşsın f(x)'in L'ye yaklaşması gerekir. Bu koşul bozulursa limit YOKTUR. Eşdeğer ifade: lim(x→a) f(x) = L ⇔ lim(x→a⁻) f(x) = lim(x→a⁺) f(x) = L.\n" +
      "\n" +
      "LİMİTİN VAR OLMAMASININ ÜÇ STANDART NEDENİ:\n" +
      "   (1) FARKLI TEK TARAFLI LİMİTLER (sıçrama): soldan L₁, sağdan L₂, L₁ ≠ L₂. Örnek: |x|/x, x = 0'da soldan −1, sağdan +1.\n" +
      "   (2) SINIRSIZ ARTMA: f(x) → ±∞ (ya da yaklaşım yönüne göre −∞ / +∞). Sonlu bir L yoktur. Örnek: 1/x, 1/x² (x → 0).\n" +
      "   (3) SALINIM: f(x) bir değere oturmaz, iki ya da daha fazla değer arasında sonsuz kez gidip gelir. Örnek: sin(1/x), cos(1/x) (x → 0). Ne kadar küçük bir aralık alırsak alalım, içinde f = 1 ve f = −1 olan noktalar vardır.\n" +
      "\n" +
      "YÖNTEM:\n" +
      "   (1) Önce doğrudan yerine koymayı deneyebiliriz; tanımsızsa tek taraflı limitlere geçilir.\n" +
      "   (2) Soldan (x → a⁻) ve sağdan (x → a⁺) limiti ayrı ayrı hesaplarız.\n" +
      "   (3) Eşit ve sonluysa limit vardır; değilse hangi nedenin geçerli olduğuna bakarız.\n" +
      "   (4) Salınımı görmek için a'ya yaklaşan iki dizi seçebiliriz: f'nin bu dizilerde farklı değerler aldığı görülür (x_n → 0 iken f(x_n) = 1, y_n → 0 iken f(y_n) = −1).\n" +
      "   (5) f'yi g ≤ f ≤ h ile sıkıştırabiliyorsak SIKIŞTIRMA TEOREMİNİ deneyebiliriz.\n" +
      "\n" +
      "SIKIŞTIRMA TEOREMİ: a'nın yakınında g(x) ≤ f(x) ≤ h(x) ve lim g = lim h = L ise lim f = L. Karşıt örnek: x·sin(1/x) için −|x| ≤ x·sin(1/x) ≤ |x| ve lim(±|x|) = 0 ⇒ lim(x→0) x·sin(1/x) = 0 VARDIR (oysa sin(1/x)'in limiti yoktur). Genlik x ile sönümlenir, salınım kaybolur.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - Salınan bir fonksiyonun limitini \"ortalaması\" 0 diye 0 sanmak.\n" +
      "   - Tek bir tek taraflı limit hesaplayıp iki taraflı limit var saymak.\n" +
      "   - f(a)'nın değerini limit sanmak; limit f(a)'dan bağımsızdır.\n" +
      "   - lim = ∞ yazınca limitin \"var olduğunu\" düşünmek; sonlu bir sayı yoktur.\n" +
      "\n" +
      "MİNİ ÖRNEK: sin(1/x), x → 0. x_n = 1/(π/2 + 2πn) → 0 için sin(1/x_n) = 1; y_n = 1/(3π/2 + 2πn) → 0 için sin(1/y_n) = −1. İki dizi farklı değerlere gider ⇒ limit yok. Ama x·sin(1/x) → 0.\n" +
      "\n" +
      "HAFIZA İPUCU: \"Soldan ≠ sağdan, sonsuz, ya da titreşim\" = limit yok.",
      "WHY DOES THE LIMIT NOT EXIST?\n" +
      "\n" +
      "DEFINITION: for lim(x→a) f(x) = L (L a REAL NUMBER) f(x) must approach L no matter which side x approaches a from. If this fails the limit does NOT exist. Equivalently: lim(x→a) f(x) = L ⇔ lim(x→a⁻) f(x) = lim(x→a⁺) f(x) = L.\n" +
      "\n" +
      "THE THREE STANDARD REASONS A LIMIT FAILS TO EXIST:\n" +
      "   (1) DIFFERENT ONE-SIDED LIMITS (jump): L₁ from the left, L₂ from the right, L₁ ≠ L₂. Example: |x|/x at x = 0 gives −1 from the left, +1 from the right.\n" +
      "   (2) UNBOUNDED GROWTH: f(x) → ±∞ (or −∞ / +∞ depending on the side). There is no finite L. Examples: 1/x, 1/x² (x → 0).\n" +
      "   (3) OSCILLATION: f(x) never settles; it swings between two or more values infinitely often. Examples: sin(1/x), cos(1/x) (x → 0). However small an interval we take, it contains points where f = 1 and points where f = −1.\n" +
      "\n" +
      "METHOD:\n" +
      "   (1) We can try direct substitution first; if it is undefined, go to one-sided limits.\n" +
      "   (2) We compute the left (x → a⁻) and right (x → a⁺) limits separately.\n" +
      "   (3) If they are equal and finite the limit exists; otherwise we look at which reason applies.\n" +
      "   (4) To see oscillation we can pick two sequences tending to a on which f takes different values (x_n → 0 with f(x_n) = 1, y_n → 0 with f(y_n) = −1).\n" +
      "   (5) If we can trap f as g ≤ f ≤ h, we can try the SQUEEZE THEOREM.\n" +
      "\n" +
      "SQUEEZE THEOREM: if g(x) ≤ f(x) ≤ h(x) near a and lim g = lim h = L then lim f = L. Contrast: for x·sin(1/x), −|x| ≤ x·sin(1/x) ≤ |x| and lim(±|x|) = 0 ⇒ lim(x→0) x·sin(1/x) = 0 EXISTS (while sin(1/x) has no limit). The amplitude is damped by x and the oscillation dies out.\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Thinking an oscillating function has limit 0 because its \"average\" is 0.\n" +
      "   - Computing a single one-sided limit and declaring the two-sided limit exists.\n" +
      "   - Mistaking f(a) for the limit; the limit is independent of f(a).\n" +
      "   - Writing lim = ∞ and thinking the limit \"exists\"; there is no finite number.\n" +
      "\n" +
      "MINI EXAMPLE: sin(1/x), x → 0. For x_n = 1/(π/2 + 2πn) → 0, sin(1/x_n) = 1; for y_n = 1/(3π/2 + 2πn) → 0, sin(1/y_n) = −1. Two sequences go to different values ⇒ no limit. But x·sin(1/x) → 0.\n" +
      "\n" +
      "MEMORY AID: \"left ≠ right, infinite, or wiggling\" = no limit.");
  }

  // positions where the oscillating function reaches +A / -A (x > 0) inside the window
  function seqPoints(p, w, count) {
    const hi = [], lo = [];
    for (let n = 0; n < 400 && (hi.length < count || lo.length < count); n++) {
      let xh, xl;
      if (p.type === 0) { xh = p.k / (Math.PI / 2 + TWO_PI * n); xl = p.k / (3 * Math.PI / 2 + TWO_PI * n); }
      else { xh = n === 0 ? Infinity : p.k / (TWO_PI * n); xl = p.k / (Math.PI + TWO_PI * n); }
      if (xh <= w && hi.length < count) hi.push(xh);
      if (xl <= w && lo.length < count) lo.push(xl);
    }
    return { hi, lo };
  }

  function seqStep(p, idx) {
    const name = p.type === 0 ? 'sin' : 'cos', A = p.A;
    const hiF = (n) => (p.type === 0 ? p.k / (Math.PI / 2 + TWO_PI * n) : p.k / (TWO_PI * (n + 1)));
    const loF = (n) => (p.type === 0 ? p.k / (3 * Math.PI / 2 + TWO_PI * n) : p.k / (Math.PI + TWO_PI * n));
    const hiForm = p.type === 0 ? `x_n = ${p.k}/(π/2 + 2πn)` : `x_n = ${p.k}/(2π(n+1))`;
    const loForm = p.type === 0 ? `y_n = ${p.k}/(3π/2 + 2πn)` : `y_n = ${p.k}/(π + 2πn)`;
    const hv = [0, 1, 2].map((n) => sig3(hiF(n))).join(', ');
    const lv = [0, 1, 2].map((n) => sig3(loF(n))).join(', ');
    const v1 = p.type === 0 ? 'sin(π/2 + 2πn) = 1' : 'cos(2π(n+1)) = 1';
    const v2 = p.type === 0 ? 'sin(3π/2 + 2πn) = −1' : 'cos(π + 2πn) = −1';
    return I18N.tx(
      `── ${idx}) İki dizi seçelim ──\n${hiForm}, n = 0, 1, 2, … → 0  (${hv}, …). Burada ${name}(${p.k}/x_n) = ${v1}, yani f(x_n) = ${M(A)}.\n${loForm} → 0  (${lv}, …). Burada ${v2}, yani f(y_n) = ${M(-A)}.`,
      `── ${idx}) Let's pick two sequences ──\n${hiForm}, n = 0, 1, 2, … → 0  (${hv}, …). Here ${name}(${p.k}/x_n) = ${v1}, so f(x_n) = ${M(A)}.\n${loForm} → 0  (${lv}, …). Here ${v2}, so f(y_n) = ${M(-A)}.`);
  }

  function solveSteps(p) {
    const a = M(p.a), f = evaluator(p), w = halfW(p), steps = [];
    const probe = w / 2;
    steps.push(I18N.tx(
      `── 1) Fonksiyon ve doğrudan yerine koyma ──\n${fnStr(p)}\n` + (p.type === 4 ? `x = ${a} noktasında iki dal birleşiyor; her dalın değeri farklı olabilir, bu yüzden tek taraflı limitlere bakılır.` : `x = 0 yerine konursa ifade tanımsızdır (0'a bölme); bu yüzden tek taraflı davranış ve diziler incelenir.`),
      `── 1) The function and direct substitution ──\n${fnStr(p)}\n` + (p.type === 4 ? `At x = ${a} the two pieces meet; each piece may give a different value, so we look at one-sided limits.` : `Substituting x = 0 gives an undefined expression (division by zero), so we examine the one-sided behaviour and sequences.`)));

    if (p.type === 0 || p.type === 1) {
      steps.push(seqStep(p, 2));
      steps.push(I18N.tx(
        `── 3) Karşılaştıralım ──\nx_n → 0 ve y_n → 0 olduğu hâlde f(x_n) = ${M(p.A)} ve f(y_n) = ${M(-p.A)}. Bir limit L olsaydı iki dizide de f → L olmalıydı; ${M(p.A)} ≠ ${M(-p.A)} olduğundan imkânsız. Üstelik f, ${M(-p.A)} ile ${M(p.A)} arasındaki her değeri sonsuz kez alır.`,
        `── 3) Let's compare ──\nAlthough x_n → 0 and y_n → 0, f(x_n) = ${M(p.A)} and f(y_n) = ${M(-p.A)}. If a limit L existed, f → L on both sequences; since ${M(p.A)} ≠ ${M(-p.A)} that is impossible. Moreover f takes every value between ${M(-p.A)} and ${M(p.A)} infinitely often.`));
      steps.push(I18N.tx(
        `── 4) Sonuç ──\nlim(x→0) f(x) VAR DEĞİL. Neden: SALINIM (üç standart nedenden 3.sü). Sürgüyle yakınlaştırdığımızda salınımın hiç sönmediğini, her ölçekte tekrar ettiğini görürüz.`,
        `── 4) Conclusion ──\nlim(x→0) f(x) DOES NOT EXIST. Reason: OSCILLATION (the 3rd of the three standard reasons). Zooming in with the slider, we see that the oscillation never dies out; it repeats at every scale.`));
    } else if (p.type === 2) {
      steps.push(I18N.tx(
        `── 2) Soldan limit ──\nx < 0 için |x| = −x, dolayısıyla f(x) = ${coef(p.A)}(−x)/x = ${M(-p.A)}. Örnek: f(${sig3(-probe)}) = ${fmt2(f(-probe))}. lim(x→0⁻) f = ${M(-p.A)}.`,
        `── 2) Left-hand limit ──\nFor x < 0, |x| = −x, so f(x) = ${coef(p.A)}(−x)/x = ${M(-p.A)}. Example: f(${sig3(-probe)}) = ${fmt2(f(-probe))}. lim(x→0⁻) f = ${M(-p.A)}.`));
      steps.push(I18N.tx(
        `── 3) Sağdan limit ──\nx > 0 için |x| = x, dolayısıyla f(x) = ${M(p.A)}. Örnek: f(${sig3(probe)}) = ${fmt2(f(probe))}. lim(x→0⁺) f = ${M(p.A)}.`,
        `── 3) Right-hand limit ──\nFor x > 0, |x| = x, so f(x) = ${M(p.A)}. Example: f(${sig3(probe)}) = ${fmt2(f(probe))}. lim(x→0⁺) f = ${M(p.A)}.`));
      steps.push(I18N.tx(
        `── 4) Sonuç ──\nSoldan ${M(-p.A)}, sağdan ${M(p.A)}: tek taraflı limitler farklı ⇒ lim(x→0) f(x) VAR DEĞİL. Neden: FARKLI TEK TARAFLI LİMİTLER (sıçrama). f(0) tanımsızdır; tanımlı olsaydı bile limit değişmezdi.`,
        `── 4) Conclusion ──\n${M(-p.A)} from the left, ${M(p.A)} from the right: the one-sided limits differ ⇒ lim(x→0) f(x) DOES NOT EXIST. Reason: DIFFERENT ONE-SIDED LIMITS (jump). f(0) is undefined; even if it were defined the limit would not change.`));
    } else if (p.type === 3) {
      const sR = Math.sign(p.K), sL = p.m === 2 ? sR : -sR;
      steps.push(I18N.tx(
        `── 2) İşaret çizelgesi ──\nPay ${M(p.K)} ${sR > 0 ? '(+)' : '(−)'} ≠ 0, payda 0'a gidiyor: "sıfırdan farklı / 0" biçimi. x${p.m === 2 ? '²' : ''}: soldan ${p.m === 2 ? '(+)' : '(−)'}, sağdan (+).\nx → 0⁻ : ${INF(sL)};  x → 0⁺ : ${INF(sR)}.`,
        `── 2) Sign chart ──\nNumerator ${M(p.K)} ${sR > 0 ? '(+)' : '(−)'} ≠ 0, the denominator tends to 0: a "nonzero / 0" form. x${p.m === 2 ? '²' : ''}: ${p.m === 2 ? '(+)' : '(−)'} on the left, (+) on the right.\nx → 0⁻ : ${INF(sL)};  x → 0⁺ : ${INF(sR)}.`));
      steps.push(I18N.tx(
        `── 3) Sayısal kontrol ──\nf(${sig3(-probe)}) = ${fmt2(f(-probe))},  f(${sig3(probe)}) = ${fmt2(f(probe))}. Pencereyi daraltınca |f| büyür ve hiçbir sayıda durmaz.`,
        `── 3) Numerical check ──\nf(${sig3(-probe)}) = ${fmt2(f(-probe))},  f(${sig3(probe)}) = ${fmt2(f(probe))}. Narrowing the window makes |f| grow and it settles at no number.`));
      steps.push(I18N.tx(
        `── 4) Sonuç ──\nf(x) sınırsızca büyüdüğü için sonlu bir L yoktur ⇒ lim(x→0) f(x) gerçek sayı olarak VAR DEĞİL. Neden: SINIRSIZ ARTMA.` + (sL === sR ? ` (İki yandan da ${INF(sR)}, yani "lim = ${INF(sR)}" yazılabilir ama bu sonlu bir limit değildir.)` : ` Üstelik soldan ${INF(sL)}, sağdan ${INF(sR)} olduğundan iki yan da farklıdır. x = 0 düşey asimptottur.`),
        `── 4) Conclusion ──\nBecause f(x) grows without bound there is no finite L ⇒ lim(x→0) f(x) DOES NOT EXIST as a real number. Reason: UNBOUNDED GROWTH.` + (sL === sR ? ` (It is ${INF(sR)} from both sides so one may write "lim = ${INF(sR)}", but that is not a finite limit.)` : ` In addition ${INF(sL)} from the left and ${INF(sR)} from the right differ. x = 0 is a vertical asymptote.`)));
    } else if (p.type === 4) {
      const L1 = leftL(p), L2 = rightL(p);
      steps.push(I18N.tx(
        `── 2) Soldan limit ──\nx < ${a} için f(x) = ${lin(p.u1, p.v1)}. x → ${a}⁻ iken f → ${M(p.u1)}·${M(p.a)} + ${M(p.v1)} = ${M(L1)}.`,
        `── 2) Left-hand limit ──\nFor x < ${a}, f(x) = ${lin(p.u1, p.v1)}. As x → ${a}⁻, f → ${M(p.u1)}·${M(p.a)} + ${M(p.v1)} = ${M(L1)}.`));
      steps.push(I18N.tx(
        `── 3) Sağdan limit ──\nx > ${a} için f(x) = ${lin(p.u2, p.v2)}. x → ${a}⁺ iken f → ${M(p.u2)}·${M(p.a)} + ${M(p.v2)} = ${M(L2)}.`,
        `── 3) Right-hand limit ──\nFor x > ${a}, f(x) = ${lin(p.u2, p.v2)}. As x → ${a}⁺, f → ${M(p.u2)}·${M(p.a)} + ${M(p.v2)} = ${M(L2)}.`));
      steps.push(I18N.tx(
        `── 4) Sonuç ──\n${M(L1)} ≠ ${M(L2)}: tek taraflı limitler farklı ⇒ lim(x→${a}) f(x) VAR DEĞİL. Neden: FARKLI TEK TARAFLI LİMİTLER (sıçrama boyu |${M(L2)} − ${M(L1)}| = ${Math.abs(L2 - L1)}).`,
        `── 4) Conclusion ──\n${M(L1)} ≠ ${M(L2)}: the one-sided limits differ ⇒ lim(x→${a}) f(x) DOES NOT EXIST. Reason: DIFFERENT ONE-SIDED LIMITS (jump size |${M(L2)} − ${M(L1)}| = ${Math.abs(L2 - L1)}).`));
    } else {
      const name = p.fn;
      steps.push(I18N.tx(
        `── 2) Sınırlayalım ──\n−1 ≤ ${name}(${p.k === 1 ? '1' : p.k}/x) ≤ 1 her x ≠ 0 için. |x| ile çarpınca: −${coef(p.A)}|x| ≤ f(x) ≤ ${coef(p.A)}|x|. (Genlik ${M(p.A)}|x| ile sönümlenir.)`,
        `── 2) Let's bound it ──\n−1 ≤ ${name}(${p.k === 1 ? '1' : p.k}/x) ≤ 1 for every x ≠ 0. Multiplying by |x|: −${coef(p.A)}|x| ≤ f(x) ≤ ${coef(p.A)}|x|. (The amplitude is damped by ${M(p.A)}|x|.)`));
      steps.push(I18N.tx(
        `── 3) Sıkıştırma ──\nlim(x→0) (−${coef(p.A)}|x|) = 0 ve lim(x→0) ${coef(p.A)}|x| = 0. Sıkıştırma Teoremi ile lim(x→0) f(x) = 0. Sayısal kontrol: f(${sig3(probe)}) = ${fmt2(f(probe))}.`,
        `── 3) Squeeze ──\nlim(x→0) (−${coef(p.A)}|x|) = 0 and lim(x→0) ${coef(p.A)}|x| = 0. By the Squeeze Theorem lim(x→0) f(x) = 0. Numerical check: f(${sig3(probe)}) = ${fmt2(f(probe))}.`));
      steps.push(I18N.tx(
        `── 4) Sonuç (karşıtlık) ──\nlim(x→0) f(x) = 0 VARDIR. Aynı salınım ${name}(${p.k === 1 ? '1' : p.k}/x) tek başına olsaydı limit olmazdı; x çarpanı salınımı sıfıra sıkıştırdı.`,
        `── 4) Conclusion (contrast) ──\nlim(x→0) f(x) = 0 EXISTS. The bare factor ${name}(${p.k === 1 ? '1' : p.k}/x) alone has no limit; the factor x squeezes the oscillation down to zero.`));
    }
    return steps;
  }

  function draw(canvas, p) {
    const f = evaluator(p), w = halfW(p), a = p.a;
    let yH;
    switch (p.type) {
      case 0: case 1: yH = p.A * 1.4; break;
      case 2: yH = p.A * 1.6; break;
      case 3: yH = Math.max(4, Math.min(1000, 1.3 * Math.abs(p.K) / Math.pow(w, p.m))); break;
      case 5: yH = Math.max(1e-3, p.A * w * 1.3); break;
      default: yH = 0;
    }
    if (p.type === 4) {
      const lo = Math.min(leftL(p), rightL(p)) - (Math.max(Math.abs(p.u1), Math.abs(p.u2)) * w + 1);
      const hi = Math.max(leftL(p), rightL(p)) + (Math.max(Math.abs(p.u1), Math.abs(p.u2)) * w + 1);
      canvas.setViewport(a - w, a + w, lo, hi);
    } else {
      canvas.setViewport(-w, w, -yH, yH);
    }
    if (p.type === 5 && p.showBounds) {
      canvas.addFunction({ evaluator: (x) => p.A * Math.abs(x), color: canvas.gray(), thickness: 1.5, dashed: true, label: '' });
      canvas.addFunction({ evaluator: (x) => -p.A * Math.abs(x), color: canvas.gray(), thickness: 1.5, dashed: true, label: '' });
    }
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 2.5, label: '' });
    if (p.type === 3) canvas.addGuideLine({ axis: 'vertical', position: 0, color: canvas.gray(), label: 'x = 0' });
    if (p.type === 5) canvas.addMarker({ x: 0, y: 0, color: canvas.green(), hollow: true, radius: 6, label: 'L = 0' });
    if (p.type === 2) {
      canvas.addMarker({ x: 0, y: -p.A, color: canvas.orange(), hollow: true, radius: 6, label: `${M(-p.A)}` });
      canvas.addMarker({ x: 0, y: p.A, color: canvas.green(), hollow: true, radius: 6, label: `${M(p.A)}` });
    }
    if (p.type === 4) {
      canvas.addMarker({ x: a, y: leftL(p), color: canvas.orange(), hollow: true, radius: 6, label: `L₁ = ${M(leftL(p))}` });
      canvas.addMarker({ x: a, y: rightL(p), color: canvas.green(), hollow: true, radius: 6, label: `L₂ = ${M(rightL(p))}` });
    }
    if ((p.type === 0 || p.type === 1) && p.showSeq) {
      const sp = seqPoints(p, w, 6);
      sp.hi.forEach((x) => { if (Number.isFinite(x)) canvas.addMarker({ x, y: p.A, color: canvas.green(), radius: 4 }); });
      sp.lo.forEach((x) => canvas.addMarker({ x, y: -p.A, color: canvas.orange(), radius: 4 }));
      canvas.addSegment({ x1: -w, y1: p.A, x2: w, y2: p.A, color: canvas.green(), dashed: true });
      canvas.addSegment({ x1: -w, y1: -p.A, x2: w, y2: -p.A, color: canvas.orange(), dashed: true });
    }
    if ((p.type === 2 || p.type === 3) && p.showSeq) {
      [-w / 2, w / 2].forEach((x, i) => {
        const y = f(x);
        if (Number.isFinite(y) && Math.abs(y) <= yH) canvas.addMarker({ x, y, color: i === 0 ? canvas.orange() : canvas.green(), radius: 5, label: `(${sig3(x)}, ${fmt2(y)})` });
      });
    }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: I18N.tx('x = a noktasına yakınlaşalım (pencere daralır)', 'Let us zoom towards x = a (window shrinks)'),
      min: 0, max: Z_MAX, step: 0.05,
      get: () => getProblem().z,
      set: (v) => { getProblem().z = Math.max(0, Math.min(Z_MAX, v)); },
    });
    h.addCheckbox({
      caption: I18N.tx('Test dizilerini / örnek noktaları gösterelim', 'Let us show test sequences / sample points'),
      get: () => getProblem().showSeq,
      set: (v) => { getProblem().showSeq = !!v; },
    });
    h.addCheckbox({
      caption: I18N.tx('Sıkıştırma sınırlarını gösterelim (±A|x|, yalnız x·sin/cos(k/x))', 'Let us show squeeze bounds (±A|x|, only for x·sin/cos(k/x))'),
      get: () => getProblem().showBounds,
      set: (v) => { getProblem().showBounds = !!v; },
    });
  }

  Topics.register('limits', {
    id: 'oscillatingLimit',
    tabTitle: () => I18N.tx('Limit Neden Yok?', 'Why Does the Limit Not Exist?'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => (p.type === 4 ? { x: p.a, y: (leftL(p) + rightL(p)) / 2 } : { x: 0, y: 0 }),
    buildControls,
    links: [
      { match: /^\s*\(1\) (FARKLI TEK TARAFLI|DIFFERENT ONE-SIDED)/, make: (rng) => gen(rng, rng.pick([2, 4])) },
      { match: /^\s*\(2\) (SINIRSIZ ARTMA|UNBOUNDED GROWTH)/, make: (rng) => gen(rng, 3) },
      { match: /^\s*\(3\) (SALINIM|OSCILLATION)/, make: (rng) => gen(rng, rng.pick([0, 1])) },
      { match: /^(SIKIŞTIRMA TEOREMİ|SQUEEZE THEOREM):/, make: (rng) => gen(rng, 5) },
    ],
  });
})();
