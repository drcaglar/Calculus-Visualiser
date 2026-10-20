// The Precise (epsilon-delta) Definition of a Limit (chapter 'limits').
// problem = { kind: 'linear'|'square'|'sqrt'|'recip', a, m, b (linear), eps, delta, epsMin, epsMax, dMax }
// Sliders change eps and delta; the verdict compares delta with the exact largest working delta* ("deltaStar").
// deltaFormula(p, eps) is the delta produced by the textbook bounding argument (always <= deltaStar).
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    n = n / g; d = d / g;
    if (n === 0) n = 0;
    return { n, d };
  }
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (n) => (n < 0 ? '(' + S(n) + ')' : S(n));
  function frS(x) { return x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d; }
  function nf(v, dec) {
    if (!isFinite(v)) return Tx('tanımsız', 'not defined');
    let s = v.toFixed(dec === undefined ? 4 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  function poly(terms) {
    let s = '';
    terms.forEach((t) => {
      const c = t[0], l = t[1];
      if (c === 0) return;
      const ab = Math.abs(c);
      const body = l === '' ? String(ab) : (ab === 1 ? l : ab + l);
      if (s === '') s = (c < 0 ? '−' : '') + body; else s += (c < 0 ? ' − ' : ' + ') + body;
    });
    return s || '0';
  }
  const r4 = (v) => Math.round(v * 1e4) / 1e4;
  const ap = (v) => (Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-6 ? '=' : '≈');

  // ---------- model ----------
  function F(p, x) {
    let y;
    switch (p.kind) {
      case 'linear': y = p.m * x + p.b; break;
      case 'square': y = x * x; break;
      case 'sqrt': y = x < 0 ? NaN : Math.sqrt(x); break;
      default: y = Math.abs(x) < 1e-12 ? NaN : 1 / x;
    }
    return (isFinite(y) && Math.abs(y) < 1e4) ? y : NaN;
  }
  const rootA = (p) => Math.round(Math.sqrt(p.a));
  function Lnum(p) {
    switch (p.kind) {
      case 'linear': return p.m * p.a + p.b;
      case 'square': return p.a * p.a;
      case 'sqrt': return rootA(p);
      default: return 1 / p.a;
    }
  }
  function LStr(p) {
    switch (p.kind) {
      case 'linear': return S(p.m * p.a + p.b);
      case 'square': return S(p.a * p.a);
      case 'sqrt': return S(rootA(p));
      default: return frS(fr(1, p.a));
    }
  }
  function fStr(p) {
    switch (p.kind) {
      case 'linear': return poly([[p.m, 'x'], [p.b, '']]);
      case 'square': return 'x²';
      case 'sqrt': return '√x';
      default: return '1/x';
    }
  }
  // exact largest delta that works (for the symmetric punctured neighbourhood)
  function deltaStar(p, eps) {
    const a = p.a;
    switch (p.kind) {
      case 'linear': return eps / Math.abs(p.m);
      case 'square': return Math.sqrt(a * a + eps) - Math.abs(a);
      case 'sqrt': {
        const r = rootA(p);
        return eps < r ? 2 * eps * r - eps * eps : Math.min(a, (r + eps) * (r + eps) - a);
      }
      default: return a * a * eps / (1 + a * eps);
    }
  }
  // delta from the bounding argument
  function deltaFormula(p, eps) {
    const a = p.a;
    switch (p.kind) {
      case 'linear': return eps / Math.abs(p.m);
      case 'square': return Math.min(1, eps / (2 * Math.abs(a) + 1));
      case 'sqrt': return Math.min(a, eps * rootA(p));
      default: return Math.min(a / 2, eps * a * a / 2);
    }
  }

  function setRanges(p, eps0) {
    p.eps = eps0;
    p.epsMin = Math.max(0.01, Math.round(eps0 / 5 * 1000) / 1000);
    p.epsMax = Math.round(eps0 * 3 * 1000) / 1000;
    if (p.kind === 'sqrt') p.epsMax = Math.min(p.epsMax, Math.round(rootA(p) * 0.9 * 1000) / 1000);
    p.dMax = Math.max(0.01, Math.ceil(deltaStar(p, p.epsMax) * 1.2 * 1e4) / 1e4);
    p.delta = r4(Math.min(1.5 * deltaStar(p, eps0), p.dMax));
  }

  function createProblem(rng) {
    const r = rng.nextInt(0, 10);
    return genKind(rng, r <= 3 ? 'linear' : r <= 6 ? 'square' : r <= 8 ? 'sqrt' : 'recip');
  }
  function genKind(rng, kind) {
    const p = {};
    if (kind === 'linear') {
      p.kind = 'linear'; p.m = rng.nonZeroInt(-5, 5); p.b = rng.nextInt(-4, 5); p.a = rng.nextInt(-3, 4);
      setRanges(p, rng.pick([1, 2, 0.5, 0.2, 0.1, 0.25]));
    } else if (kind === 'square') {
      p.kind = 'square'; p.a = rng.nextInt(-4, 5);
      setRanges(p, rng.pick([1, 0.5, 0.25, 0.2, 0.1]));
    } else if (kind === 'sqrt') {
      p.kind = 'sqrt'; p.a = rng.pick([1, 4, 9, 16]);
      setRanges(p, rng.pick([0.5, 0.25, 0.2, 0.1]));
    } else {
      p.kind = 'recip'; p.a = rng.nextInt(1, 6);
      setRanges(p, rng.pick([0.5, 0.25, 0.2, 0.1]));
    }
    return p;
  }

  function problemStatement(p) {
    return Tx(
      `lim(x→${S(p.a)}) ${p.kind === 'linear' ? '(' + fStr(p) + ')' : fStr(p)} = ${LStr(p)} olduğunu ε–δ tanımıyla birlikte görelim: ε = ${nf(p.eps, 3)} için uygun bir δ > 0 bulalım, sonra her ε > 0 için δ'nın nasıl yazılacağına bakalım.`,
      `Let's see with the ε–δ definition that lim(x→${S(p.a)}) ${p.kind === 'linear' ? '(' + fStr(p) + ')' : fStr(p)} = ${LStr(p)}: we find a suitable δ > 0 for ε = ${nf(p.eps, 3)}, then see how δ looks for a general ε > 0.`);
  }

  function concept() {
    return Tx(
      "ε–δ LİMİT TANIMI: 'x, a'ya yaklaşırken f(x), L'ye yaklaşır' cümlesinin kesin biçimidir.\n" +
      "\n" +
      "TANIM: lim(x→a) f(x) = L demek: HER ε > 0 için ÖYLE BİR δ > 0 vardır ki\n" +
      "   0 < |x − a| < δ  ⇒  |f(x) − L| < ε.\n" +
      "ε çıktıdaki (y) hata payı, δ girdideki (x) hata payıdır. 0 < |x − a| koşulu x = a'yı dışarıda bırakır: limit f(a)'ya değil, çevresine bakar.\n" +
      "\n" +
      "GEOMETRİK RESİM: Yatay bir şerit (L − ε, L + ε) düşünelim. δ öyle seçilir ki dikey şerit (a − δ, a + δ) içindeki grafik (x = a hariç) yatay şeridin dışına taşmasın. Grafik şeridi aşıyorsa δ çok büyüktür; küçültmek her zaman işe yarar (δ'dan küçük her sayı da çalışır).\n" +
      "\n" +
      "OYUN GİBİ DÜŞÜNELİM: Rakip ε verir (ne kadar hassas olmak istediğini), biz δ ile cevap veririz. Her ε için bir cevabımız varsa limit doğrudur.\n" +
      "\n" +
      "YÖNTEM (önce karalama, sonra ispat):\n" +
      "   (1) |f(x) − L| ifadesini yazıp |x − a| çarpanını ortaya çıkarırız (çarpanlara ayırarak).\n" +
      "   (2) Geri kalan çarpanı, δ'ya bir üst sınır koyarak (ör. |x − a| < 1) sabit bir sayıyla sınırlarız.\n" +
      "   (3) |f(x) − L| < C·|x − a| < ε olması için |x − a| < ε/C yeterlidir.\n" +
      "   (4) δ = min(ek sınır, ε/C) olarak seçeriz.\n" +
      "   (5) İspat: 'ε > 0 verilsin, δ = … seçelim. 0 < |x − a| < δ ise … < ε.' (zincir ileriye doğru yazılır).\n" +
      "\n" +
      "DOĞRUSAL ŞABLON: f(x) = mx + b, m ≠ 0. |f(x) − L| = |m||x − a|. Verilen ε için δ = ε/|m| seçebiliriz: 0 < |x − a| < δ ⇒ |f(x) − L| = |m||x − a| < |m|δ = ε. Bu durumda δ = ε/|m|, mümkün olan EN BÜYÜK δ'dır.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - δ'yı x'e bağlı seçmek; δ yalnızca ε ve a'ya bağlı olabilir.\n" +
      "   - δ'yı ε'dan bağımsız sabit seçmek.\n" +
      "   - Tersini yazmak: |x − a| < ε ⇒ |f − L| < δ (rollerin karışması).\n" +
      "   - x²'de |x + a| terimini sınırlamayı unutmak (δ ≤ 1 ile |x + a| < 2|a| + 1).\n" +
      "   - Tanım kümesi dışına çıkan δ seçmek (√x için δ ≤ a, 1/x için δ ≤ a/2).\n" +
      "\n" +
      "MİNİ ÖRNEK: f(x) = 3x − 1, a = 2, L = 5, ε = 0,3. |f(x) − 5| = |3x − 6| = 3|x − 2| < 0,3 ⇔ |x − 2| < 0,1. Yani δ = ε/3 = 0,1. Kaydırıcılarla δ'yı 0,1'in üstüne çıkarırsak grafiğin şeridi aştığını görürüz.",
      "THE ε–δ DEFINITION OF A LIMIT: the exact form of 'f(x) approaches L as x approaches a'.\n" +
      "\n" +
      "DEFINITION: lim(x→a) f(x) = L means: for EVERY ε > 0 there EXISTS a δ > 0 such that\n" +
      "   0 < |x − a| < δ  ⇒  |f(x) − L| < ε.\n" +
      "ε is the tolerance on the output (y), δ is the tolerance on the input (x). The condition 0 < |x − a| leaves x = a out: the limit looks near a, not at f(a).\n" +
      "\n" +
      "GEOMETRIC PICTURE: let's picture the horizontal band (L − ε, L + ε). δ is chosen so that the graph over the vertical band (a − δ, a + δ) (except at x = a) stays inside the horizontal band. If the graph escapes, δ is too big; making δ smaller always helps (any smaller number also works).\n" +
      "\n" +
      "THINK OF A GAME: an opponent gives ε (how precise they want to be) and we answer with δ. If we have an answer for every ε, the limit is correct.\n" +
      "\n" +
      "METHOD (scratch work first, then the proof):\n" +
      "   (1) We write |f(x) − L| and bring out a factor |x − a| (factor it).\n" +
      "   (2) We bound the remaining factor by a constant, by first restricting δ (e.g. |x − a| < 1).\n" +
      "   (3) |f(x) − L| < C·|x − a| < ε holds when |x − a| < ε/C.\n" +
      "   (4) We choose δ = min(extra restriction, ε/C).\n" +
      "   (5) Proof: 'Let ε > 0, choose δ = …. If 0 < |x − a| < δ then … < ε.' (the chain is written forwards).\n" +
      "\n" +
      "LINEAR TEMPLATE: f(x) = mx + b, m ≠ 0. |f(x) − L| = |m||x − a|. Given ε we can choose δ = ε/|m|: 0 < |x − a| < δ ⇒ |f(x) − L| = |m||x − a| < |m|δ = ε. Here δ = ε/|m| is also the LARGEST possible δ.\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Choosing δ depending on x; δ may depend only on ε and a.\n" +
      "   - Choosing a fixed δ independent of ε.\n" +
      "   - Reversing the implication (|x − a| < ε ⇒ |f − L| < δ): mixing up the roles.\n" +
      "   - For x², forgetting to bound |x + a| (with δ ≤ 1: |x + a| < 2|a| + 1).\n" +
      "   - Choosing a δ that leaves the domain (δ ≤ a for √x, δ ≤ a/2 for 1/x).\n" +
      "\n" +
      "MINI EXAMPLE: f(x) = 3x − 1, a = 2, L = 5, ε = 0.3. |f(x) − 5| = |3x − 6| = 3|x − 2| < 0.3 ⇔ |x − 2| < 0.1. So δ = ε/3 = 0.1. If we push δ above 0.1 with the sliders, we see the graph leave the band.");
  }

  function solveSteps(p) {
    const a = p.a, A = S(a), Pa = P(a), eps = p.eps, delta = p.delta, L = LStr(p);
    const dF = deltaFormula(p, eps), dS = deltaStar(p, eps);
    const steps = [];
    let n = 0;
    const add = (tt, te, bt, be) => { n++; steps.push(`── ${n}) ${Tx(tt, te)} ──\n${Tx(bt, be === undefined ? bt : be)}`); };
    const lim = `lim(x→${A}) ${p.kind === 'linear' ? '(' + fStr(p) + ')' : fStr(p)}`;
    add('Ne gösterilecek?', 'What must be shown?',
      `${lim} = ${L}. Her ε > 0 için öyle bir δ > 0 bulabilmeliyiz ki:  0 < |x − ${A}| < δ  ⇒  |f(x) − ${L}| < ε.`,
      `${lim} = ${L}. For every ε > 0 we want to find a δ > 0 such that:  0 < |x − ${A}| < δ  ⇒  |f(x) − ${L}| < ε.`);
    // scratch work
    let scratchT, scratchE, deltaT, deltaE;
    const r = p.kind === 'sqrt' ? rootA(p) : 0;
    const rc = r === 1 ? '' : String(r), a2c = a * a === 1 ? '' : String(a * a);
    switch (p.kind) {
      case 'linear':
        scratchT = scratchE = `|f(x) − ${L}| = |${fStr(p)} − ${P(p.m * a + p.b)}| = |${poly([[p.m, 'x'], [-p.m * a, '']])}| = ${Math.abs(p.m)}|x − ${Pa}|\n${Math.abs(p.m)}|x − ${Pa}| < ε  ⇔  |x − ${Pa}| < ε/${Math.abs(p.m)}`;
        deltaT = deltaE = `δ = ε/${Math.abs(p.m)}`;
        break;
      case 'square':
        scratchT = `|x² − ${S(a * a)}| = |x − ${Pa}|·|x + ${Pa}|\nδ ≤ 1 olsun diyelim: |x − ${Pa}| < 1 ⇒ |x + ${Pa}| = |(x − ${Pa}) + ${S(2 * a)}| ≤ |x − ${Pa}| + ${2 * Math.abs(a)} < ${2 * Math.abs(a) + 1}\nO halde |x² − ${S(a * a)}| < ${2 * Math.abs(a) + 1}|x − ${Pa}| < ε  eğer  |x − ${Pa}| < ε/${2 * Math.abs(a) + 1}.`;
        scratchE = `|x² − ${S(a * a)}| = |x − ${Pa}|·|x + ${Pa}|\nRestrict δ ≤ 1: |x − ${Pa}| < 1 ⇒ |x + ${Pa}| = |(x − ${Pa}) + ${S(2 * a)}| ≤ |x − ${Pa}| + ${2 * Math.abs(a)} < ${2 * Math.abs(a) + 1}\nSo |x² − ${S(a * a)}| < ${2 * Math.abs(a) + 1}|x − ${Pa}| < ε  if  |x − ${Pa}| < ε/${2 * Math.abs(a) + 1}.`;
        deltaT = deltaE = `δ = min(1, ε/${2 * Math.abs(a) + 1})`;
        break;
      case 'sqrt':
        scratchT = `|√x − ${r}| = |x − ${a}| / (√x + ${r}) ≤ |x − ${a}| / ${r}   (√x ≥ 0 olduğundan; x ≥ 0 için δ ≤ ${a} gerekir)\n|x − ${a}|/${r} < ε  ⇔  |x − ${a}| < ${rc}ε`;
        scratchE = `|√x − ${r}| = |x − ${a}| / (√x + ${r}) ≤ |x − ${a}| / ${r}   (since √x ≥ 0; we need δ ≤ ${a} so that x ≥ 0)\n|x − ${a}|/${r} < ε  ⇔  |x − ${a}| < ${rc}ε`;
        deltaT = deltaE = `δ = min(${a}, ${rc}ε)`;
        break;
      default:
        scratchT = `|1/x − 1/${a}| = |x − ${a}| / (x·${a})\nδ ≤ ${a}/2 alalım: |x − ${a}| < ${a}/2 ⇒ x > ${a}/2 ⇒ 1/x < 2/${a}\nO halde |1/x − 1/${a}| < 2|x − ${a}|/${a * a} < ε  eğer  |x − ${a}| < ${a2c}ε/2.`;
        scratchE = `|1/x − 1/${a}| = |x − ${a}| / (x·${a})\nRestrict δ ≤ ${a}/2: |x − ${a}| < ${a}/2 ⇒ x > ${a}/2 ⇒ 1/x < 2/${a}\nSo |1/x − 1/${a}| < 2|x − ${a}|/${a * a} < ε  if  |x − ${a}| < ${a2c}ε/2.`;
        deltaT = deltaE = `δ = min(${a}/2, ${a2c}ε/2)`;
    }
    add('Karalama: |f(x) − L| ifadesini |x − a| cinsinden yazalım', 'Scratch work: express |f(x) − L| through |x − a|', scratchT, scratchE);
    add('δ seçimi', 'Choosing δ', `${deltaT}`);
    // numeric delta
    let calc;
    switch (p.kind) {
      case 'linear': calc = `δ = ${nf(eps, 3)}/${Math.abs(p.m)} ${ap(dF)} ${nf(dF, 4)}`; break;
      case 'square': calc = `δ = min(1, ${nf(eps, 3)}/${2 * Math.abs(a) + 1}) = min(1, ${nf(eps / (2 * Math.abs(a) + 1), 4)}) ${ap(dF)} ${nf(dF, 4)}`; break;
      case 'sqrt': calc = `δ = min(${a}, ${r}·${nf(eps, 3)}) = min(${a}, ${nf(r * eps, 4)}) = ${nf(dF, 4)}`; break;
      default: calc = `δ = min(${a}/2, ${a * a}·${nf(eps, 3)}/2) = min(${nf(a / 2, 4)}, ${nf(a * a * eps / 2, 4)}) = ${nf(dF, 4)}`;
    }
    add('Verilen ε için δ', 'δ for the given ε', `ε = ${nf(eps, 3)}:  ${calc}\n(Bu δ yeterlidir; daha küçük her δ da işe yarar.)`,
      `ε = ${nf(eps, 3)}:  ${calc}\n(This δ is sufficient; any smaller δ also works.)`);
    // proof
    let proofT, proofE;
    switch (p.kind) {
      case 'linear':
        proofT = `ε > 0 verilsin, δ = ε/${Math.abs(p.m)} olsun.\n0 < |x − ${Pa}| < δ ⇒ |f(x) − ${L}| = ${Math.abs(p.m)}|x − ${Pa}| < ${Math.abs(p.m)}δ = ε.  ∎`;
        proofE = `Let ε > 0 and δ = ε/${Math.abs(p.m)}.\n0 < |x − ${Pa}| < δ ⇒ |f(x) − ${L}| = ${Math.abs(p.m)}|x − ${Pa}| < ${Math.abs(p.m)}δ = ε.  ∎`;
        break;
      case 'square':
        proofT = `ε > 0 verilsin, δ = min(1, ε/${2 * Math.abs(a) + 1}) olsun. 0 < |x − ${Pa}| < δ ise |x − ${Pa}| < 1 olduğundan |x + ${Pa}| < ${2 * Math.abs(a) + 1};\n|x² − ${S(a * a)}| = |x − ${Pa}||x + ${Pa}| < δ·${2 * Math.abs(a) + 1} ≤ ε.  ∎`;
        proofE = `Let ε > 0 and δ = min(1, ε/${2 * Math.abs(a) + 1}). If 0 < |x − ${Pa}| < δ then |x − ${Pa}| < 1, so |x + ${Pa}| < ${2 * Math.abs(a) + 1};\n|x² − ${S(a * a)}| = |x − ${Pa}||x + ${Pa}| < δ·${2 * Math.abs(a) + 1} ≤ ε.  ∎`;
        break;
      case 'sqrt':
        proofT = `ε > 0 verilsin, δ = min(${a}, ${rc}ε) olsun. 0 < |x − ${a}| < δ ise x > 0 ve\n|√x − ${r}| = |x − ${a}|/(√x + ${r}) ≤ |x − ${a}|/${r} < δ/${r} ≤ ε.  ∎`;
        proofE = `Let ε > 0 and δ = min(${a}, ${rc}ε). If 0 < |x − ${a}| < δ then x > 0 and\n|√x − ${r}| = |x − ${a}|/(√x + ${r}) ≤ |x − ${a}|/${r} < δ/${r} ≤ ε.  ∎`;
        break;
      default:
        proofT = `ε > 0 verilsin, δ = min(${a}/2, ${a2c}ε/2) olsun. 0 < |x − ${a}| < δ ise x > ${a}/2 ve\n|1/x − 1/${a}| = |x − ${a}|/(x·${a}) < 2|x − ${a}|/${a * a} < 2δ/${a * a} ≤ ε.  ∎`;
        proofE = `Let ε > 0 and δ = min(${a}/2, ${a2c}ε/2). If 0 < |x − ${a}| < δ then x > ${a}/2 and\n|1/x − 1/${a}| = |x − ${a}|/(x·${a}) < 2|x − ${a}|/${a * a} < 2δ/${a * a} ≤ ε.  ∎`;
    }
    add('İspat (ileriye doğru)', 'Proof (written forwards)', proofT, proofE);
    // live verdict
    const ok = delta <= dS * (1 + 1e-9);
    const yl = F(p, a - delta), yr = F(p, a + delta), Ln = Lnum(p);
    const dl = Math.abs(yl - Ln), dr = Math.abs(yr - Ln);
    const bandT = `Yatay şerit: (${nf(Ln - eps, 4)}, ${nf(Ln + eps, 4)}),  dikey şerit: (${nf(a - delta, 4)}, ${nf(a + delta, 4)})`;
    const bandE = `Horizontal band: (${nf(Ln - eps, 4)}, ${nf(Ln + eps, 4)}),  vertical band: (${nf(a - delta, 4)}, ${nf(a + delta, 4)})`;
    const endT = `Uçlarda: |f(${nf(a - delta, 4)}) − ${L}| = ${nf(dl, 4)},  |f(${nf(a + delta, 4)}) − ${L}| = ${nf(dr, 4)}  (ε = ${nf(eps, 3)})`;
    const endE = `At the ends: |f(${nf(a - delta, 4)}) − ${L}| = ${nf(dl, 4)},  |f(${nf(a + delta, 4)}) − ${L}| = ${nf(dr, 4)}  (ε = ${nf(eps, 3)})`;
    add(`Kaydırıcı: ε = ${nf(eps, 3)}, δ = ${nf(delta, 4)}`, `Sliders: ε = ${nf(eps, 3)}, δ = ${nf(delta, 4)}`,
      `${bandT}\n${endT}\nEn büyük çalışan δ* = ${nf(dS, 4)};  δ ${ok ? '≤' : '>'} δ*  ⇒  ${ok ? 'δ yeterince KÜÇÜK: grafik şeridin içinde kalıyor.' : 'δ çok BÜYÜK: grafik şeridin dışına taşar; δ\'yı küçültün.'}`,
      `${bandE}\n${endE}\nLargest working δ* = ${nf(dS, 4)};  δ ${ok ? '≤' : '>'} δ*  ⇒  ${ok ? 'δ is small enough: the graph stays inside the band.' : 'δ is too big: the graph leaves the band; we can try a smaller δ.'}`);
    add('Formüldeki δ ile karşılaştıralım', 'Comparing with the formula δ',
      `Formülden δ = ${nf(dF, 4)} ≤ δ* = ${nf(dS, 4)}${p.kind === 'linear' ? ' (eşit: doğrusal durumda formül en iyisidir)' : ' (formülün en iyisi olması gerekmez; yeterli olması yeter)'}.`,
      `Formula δ = ${nf(dF, 4)} ≤ δ* = ${nf(dS, 4)}${p.kind === 'linear' ? ' (equal: for linear f the formula is optimal)' : ' (the formula need not be optimal, only sufficient)'}.`);
    return steps;
  }

  function draw(canvas, p) {
    try {
      const a = p.a, eps = p.eps, delta = p.delta, L = Lnum(p);
      const yh = 1.5 * p.epsMax, w = 1.6 * p.dMax;
      canvas.setViewport(a - w, a + w, L - yh, L + yh);
      const ok = delta <= deltaStar(p, eps) * (1 + 1e-9);
      canvas.addRegion({ xMin: a - delta, xMax: a + delta, color: canvas._withAlpha(ok ? canvas.green() : canvas.red(), 0.2) });
      canvas.addFunction({ evaluator: (x) => F(p, x), color: canvas.accent(), thickness: 2.5, label: `f(x) = ${fStr(p)}` });
      canvas.addGuideLine({ axis: 'horizontal', position: L + eps, color: canvas.orange(), label: 'L + ε' });
      canvas.addGuideLine({ axis: 'horizontal', position: L - eps, color: canvas.orange(), label: 'L − ε' });
      canvas.addGuideLine({ axis: 'horizontal', position: L, color: canvas.green(), label: `L = ${LStr(p)}` });
      canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gray(), label: `a = ${S(a)}` });
      canvas.addGuideLine({ axis: 'vertical', position: a - delta, color: canvas.blue() });
      canvas.addGuideLine({ axis: 'vertical', position: a + delta, color: canvas.blue() });
      canvas.addMarker({ x: a, y: L, color: canvas.gold(), radius: 6, hollow: true });
      [a - delta, a + delta].forEach((x) => {
        const y = F(p, x);
        if (isFinite(y)) {
          const inside = Math.abs(y - L) < eps + 1e-12;
          canvas.addMarker({ x, y, color: inside ? canvas.green() : canvas.red(), radius: 5, shape: 'diamond' });
        }
      });
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, hp) {
    // normalised sliders (0..1) mapped onto the per-problem ranges
    hp.addSlider({
      caption: Tx('ε (çıktı toleransı; 0 = en küçük, 1 = en büyük)', 'ε (output tolerance; 0 = smallest, 1 = largest)'),
      min: 0, max: 1, step: 0.005,
      get: () => { const q = getProblem(); return (q.eps - q.epsMin) / (q.epsMax - q.epsMin); },
      set: (v) => { const q = getProblem(); q.eps = Math.round((q.epsMin + Math.max(0, Math.min(1, v)) * (q.epsMax - q.epsMin)) * 1000) / 1000; },
    });
    hp.addSlider({
      caption: Tx('δ (girdi toleransı; 1 = en geniş)', 'δ (input tolerance; 1 = widest)'),
      min: 0, max: 1, step: 0.005,
      get: () => { const q = getProblem(); return q.delta / q.dMax; },
      set: (v) => { const q = getProblem(); q.delta = r4(Math.max(q.dMax / 200, Math.min(1, v) * q.dMax)); },
    });
  }

  Topics.register('limits', {
    id: 'epsilonDelta',
    tabTitle: () => Tx('ε–δ Limit Tanımı', 'The Precise (ε–δ) Definition of a Limit'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: p.a, y: Lnum(p) }),
    buildControls,
    links: [
      { match: /^(DOĞRUSAL ŞABLON|LINEAR TEMPLATE):/, make: (rng) => genKind(rng, 'linear') },
      { match: /^\s*\(2\) (Geri kalan çarpanı|We bound the remaining factor)/, make: (rng) => genKind(rng, 'square') },
    ],
  });
})();
