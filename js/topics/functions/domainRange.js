// Ported from Modules/Functions/FnTabs1.vb's DomainRangeControl ("1) Tanım ve Değer Kümesi").
(function () {
  function createProblem(rng) {
    return {
      kind: rng.nextInt(0, 5),
      h: rng.nextInt(-3, 4),
      k: rng.nextInt(-3, 4),
      r: rng.nextInt(1, 5),
    };
  }

  function mk(rng, kind) {
    return { kind, h: rng.nextInt(-3, 4), k: rng.nextInt(-3, 4), r: rng.nextInt(1, 5) };
  }

  function F(p, x) {
    switch (p.kind) {
      case 0: return Math.sqrt(x - p.h) + p.k;
      case 1: return 1.0 / (x - p.h) + p.k;
      case 2: return (x - p.h) * (x - p.h) + p.k;
      case 3: return Math.sqrt(p.r * p.r - (x - p.h) * (x - p.h)) + p.k;
      case 5: return Math.log(x - p.h) + p.k;
      default: return -(x - p.h) * (x - p.h) + p.k;
    }
  }

  function formula(p) {
    switch (p.kind) {
      case 0: return `f(x) = √(x ${FnKit.sg(-p.h)})${FnKit.suffix(p.k)}`;
      case 1: return `f(x) = 1/(x ${FnKit.sg(-p.h)})${FnKit.suffix(p.k)}`;
      case 2: return `f(x) = (x ${FnKit.sg(-p.h)})²${FnKit.suffix(p.k)}`;
      case 3: return `f(x) = √(${p.r * p.r} - (x ${FnKit.sg(-p.h)})²)${FnKit.suffix(p.k)}`;
      case 5: return `f(x) = ln(x ${FnKit.sg(-p.h)})${FnKit.suffix(p.k)}`;
      default: return `f(x) = -(x ${FnKit.sg(-p.h)})²${FnKit.suffix(p.k)}`;
    }
  }

  function rangeText(p) {
    switch (p.kind) {
      case 0: return `[${p.k}, ∞)`;
      case 1: return I18N.tx(`y ≠ ${p.k}`, `y ≠ ${p.k}`);
      case 2: return `[${p.k}, ∞)`;
      case 3: return `[${p.k}, ${p.k + p.r}]`;
      case 5: return '(-∞, ∞)';
      default: return `(-∞, ${p.k}]`;
    }
  }

  function solveSteps(problem) {
    const p = problem;
    const steps = [I18N.tx(`Verilen fonksiyon: ${formula(p)}`, `Given function: ${formula(p)}`)];
    switch (p.kind) {
      case 0:
        steps.push(I18N.tx(`Karekökün içinin ≥ 0 olması gerekir: x ${FnKit.sg(-p.h)} ≥ 0 → x ≥ ${p.h}`, `The radicand needs to be ≥ 0: x ${FnKit.sg(-p.h)} ≥ 0 → x ≥ ${p.h}`));
        steps.push(I18N.tx(`Karekök en az 0 olduğundan f(x) ≥ ${p.k} olur; değer kümesi [${p.k}, ∞)`, `A square root is at least 0, so f(x) ≥ ${p.k}: range [${p.k}, ∞)`));
        break;
      case 1:
        steps.push(I18N.tx(`Payda sıfır olamaz, o hâlde x ${FnKit.sg(-p.h)} ≠ 0 → x ≠ ${p.h}`, `The denominator cannot be 0, so x ${FnKit.sg(-p.h)} ≠ 0 → x ≠ ${p.h}`));
        steps.push(I18N.tx(`1/(x ${FnKit.sg(-p.h)}) hiçbir zaman 0 olamaz, bu yüzden f(x) ≠ ${p.k} olur; değer kümesi y ≠ ${p.k}`, `1/(x ${FnKit.sg(-p.h)}) can never be 0, so f(x) ≠ ${p.k}: range y ≠ ${p.k}`));
        break;
      case 2:
        steps.push(I18N.tx('Polinom her reel x için tanımlıdır → tanım kümesi (-∞, ∞)', 'A polynomial is defined for every real x → domain (-∞, ∞)'));
        steps.push(I18N.tx(`Bir kare ≥ 0 olduğundan en küçük değer x = ${p.h} için ${p.k} olur → değer kümesi [${p.k}, ∞)`, `A square is ≥ 0, so the minimum value is ${p.k} at x = ${p.h} → range [${p.k}, ∞)`));
        break;
      case 3:
        steps.push(I18N.tx(`Karekökün içi ≥ 0: ${p.r * p.r} - (x ${FnKit.sg(-p.h)})² ≥ 0 → |x ${FnKit.sg(-p.h)}| ≤ ${p.r}`, `Radicand ≥ 0: ${p.r * p.r} - (x ${FnKit.sg(-p.h)})² ≥ 0 → |x ${FnKit.sg(-p.h)}| ≤ ${p.r}`));
        steps.push(I18N.tx(`Tanım kümesi [${p.h - p.r}, ${p.h + p.r}] (yarım çember)`, `Domain [${p.h - p.r}, ${p.h + p.r}] (a semicircle)`));
        steps.push(I18N.tx(`Karekök 0 ile ${p.r} arasında değer alır; böylece değer kümesi [${p.k}, ${p.k + p.r}]`, `The root takes values from 0 to ${p.r}: range [${p.k}, ${p.k + p.r}]`));
        break;
      case 5:
        steps.push(I18N.tx(`Logaritmanın içi > 0 olmalı: x ${FnKit.sg(-p.h)} > 0 → x > ${p.h}`, `The argument of a logarithm must be > 0: x ${FnKit.sg(-p.h)} > 0 → x > ${p.h}`));
        steps.push(I18N.tx(`ln, x → ${p.h}⁺ iken -∞'a iner, x büyüdükçe sınırsız artar; her değeri alır → değer kümesi (-∞, ∞)`, `ln falls to -∞ as x → ${p.h}⁺ and grows without bound as x increases; it takes every value → range (-∞, ∞)`));
        break;
      default:
        steps.push(I18N.tx('Polinom olduğundan tanım kümesi (-∞, ∞)', 'It is a polynomial, so the domain is (-∞, ∞)'));
        steps.push(I18N.tx(`-(bir kare) ≤ 0 olduğundan en büyük değer x = ${p.h} için ${p.k} olur → değer kümesi (-∞, ${p.k}]`, `-(a square) ≤ 0, so the maximum is ${p.k} at x = ${p.h} → range (-∞, ${p.k}]`));
    }
    const dom = FnKit.domainText((x) => F(p, x));
    steps.push(I18N.tx(`SONUÇ: Tanım kümesi = ${dom},  Değer kümesi = ${rangeText(p)}`, `RESULT: Domain = ${dom},  Range = ${rangeText(p)}`));
    return steps;
  }

  function draw(canvas, problem) {
    const p = problem;
    canvas.setViewport(-9, 9, -7, 7);
    canvas.addFunction({ evaluator: (x) => F(p, x), color: canvas.accent(), thickness: 3 });
    switch (p.kind) {
      case 0:
        canvas.addRegion({ xMin: p.h, xMax: 60 });
        canvas.addMarker({ x: p.h, y: p.k, color: canvas.gold(), radius: 6 });
        break;
      case 1:
        canvas.addRegion({ xMin: -60, xMax: p.h - 0.03 });
        canvas.addRegion({ xMin: p.h + 0.03, xMax: 60 });
        canvas.addGuideLine({ axis: 'vertical', position: p.h, color: canvas.gray() });
        canvas.addGuideLine({ axis: 'horizontal', position: p.k, color: canvas.gray() });
        break;
      case 3:
        canvas.addRegion({ xMin: p.h - p.r, xMax: p.h + p.r });
        break;
      case 5:
        canvas.addRegion({ xMin: p.h, xMax: 60 });
        canvas.addGuideLine({ axis: 'vertical', position: p.h, color: canvas.gray() });
        break;
      default: // matches VB's "Case Else" in DrawProblem, which also catches Kind = 2
        canvas.addRegion({ xMin: -60, xMax: 60 });
        canvas.addMarker({ x: p.h, y: p.k, color: canvas.gold(), shape: 'diamond', radius: 7 });
    }
  }

  function focus(p) {
    return { x: p.h, y: p.k };
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: 'h', min: -4, max: 4,
      get: () => getProblem().h, set: (v) => { getProblem().h = Math.round(v); },
    });
    h.addSlider({
      caption: 'k', min: -4, max: 4,
      get: () => getProblem().k, set: (v) => { getProblem().k = Math.round(v); },
    });
    h.addSlider({
      caption: I18N.tx('R (yalnızca yarım çember örneğinde)', 'R (only in the semicircle example)'), min: 1, max: 5,
      get: () => getProblem().r, set: (v) => { getProblem().r = Math.max(1, Math.round(v)); },
    });
  }

  Topics.register('functions', {
    id: 'domainRange',
    problemStatement: (p) => I18N.tx(`${formula(p)} fonksiyonunun (doğal) tanım kümesini ve değer kümesini bulalım.`, `Let's find the (natural) domain and the range of ${formula(p)}.`),
    tabTitle: () => I18N.tx('Tanım ve Değer Kümesi', 'Domain and Range'),
    concept: () => I18N.tx(
      "TANIM\n" +
      "f : D → Y bir fonksiyon ise D'deki her x için Y'de TEK bir f(x) vardır. Girdilerin (x değerlerinin) kümesi TANIM KÜMESİ (D), fonksiyonun gerçekten aldığı çıktıların kümesi DEĞER KÜMESİ (R)'dir. Yalnızca formül verilmişse DOĞAL tanım kümesi düşünülür: formülün gerçek sayı üretebildiği en geniş x kümesi.\n" +
      "\n" +
      "TANIM KÜMESİ KURALLARI\n" +
      "• Payda ≠ 0:  1/(x - 3) için x ≠ 3.\n" +
      "• Çift kökün (√, ⁴√, ...) içi ≥ 0:  √(x - 3) için x ≥ 3. (Tek kökler, örn. ∛x, her x için tanımlıdır.)\n" +
      "• Logaritmanın içi > 0:  ln(x - 3) için x > 3.\n" +
      "• Birden fazla koşul varsa hepsinin birlikte sağlanması gerekir (kesişim alınır). Örn. √(x + 2)/(x - 1): x ≥ -2 ve x ≠ 1.\n" +
      "• Polinomlar, aˣ ve sin, cos her x için tanımlıdır; tan x için x ≠ π/2 + kπ.\n" +
      "• Fiziksel problemlerde tanım kümesini ayrıca durumun kendisi belirler (örn. depo yüksekliği 0 ≤ h ≤ H).\n" +
      "\n" +
      "DEĞER KÜMESİ NASIL BULUNUR?\n" +
      "1. Grafik varsa eğrinin en alt ve en üst y değerlerine bakılır (asimptot, değere ulaşılmadığını gösterir).\n" +
      "2. Tam kareye tamamlanabilir: y = a(x - h)² + k için a > 0 ise R = [k, ∞), a < 0 ise R = (-∞, k].\n" +
      "3. Temel kurallardan yola çıkılabilir: √(...) ≥ 0, (...)² ≥ 0, 1/(...) ≠ 0, eˣ > 0.\n" +
      "4. y = f(x) denklemi x için çözülür; çözümün var olduğu y değerleri değer kümesidir (ters fonksiyon fikri).\n" +
      "\n" +
      "ARALIK GÖSTERİMİ: ( ) uç dahil değil, [ ] uç dahil. ∞ için her zaman parantez kullanılır: [3, ∞).\n" +
      "\n" +
      "MİNİ ÖRNEK\n" +
      "f(x) = √(x - 3) + 2.  Karekökün içi: x - 3 ≥ 0 → D = [3, ∞).  √(...) ≥ 0 olduğundan f(x) ≥ 2 → R = [2, ∞).\n" +
      "g(x) = 1/(x + 1) - 4:  D: x ≠ -1;  1/(...) hiçbir zaman 0 olmaz → R: y ≠ -4.\n" +
      "\n" +
      "DİKKAT\n" +
      "• Sadeleştirme tanım kümesini genişletmez: (x² - 1)/(x - 1) için x ≠ 1 kalır, x + 1'e eşit olsa bile.\n" +
      "• Değer kümesiyle tanım kümesi karıştırılmasın: x girdi, y çıktıdır.\n" +
      "• Kök işareti hep ≥ 0 değer verir: √(x²) = |x|, x değil.\n" +
      "• Grafikte mavi bant tanım kümesini gösterir.",
      "DEFINITION\n" +
      "If f : D → Y is a function, every x in D has exactly ONE value f(x) in Y. The set of inputs is the DOMAIN (D); the set of outputs the function actually takes is the RANGE (R). When only a formula is given, we take the NATURAL domain: the largest set of x for which the formula gives a real number.\n" +
      "\n" +
      "DOMAIN RULES\n" +
      "• Denominator ≠ 0:  1/(x - 3) needs x ≠ 3.\n" +
      "• Inside of an even root (√, ⁴√, ...) ≥ 0:  √(x - 3) needs x ≥ 3. (Odd roots such as ∛x are defined for every x.)\n" +
      "• Argument of a logarithm > 0:  ln(x - 3) needs x > 3.\n" +
      "• When there are several conditions, ALL of them must hold together (we take the intersection). E.g. √(x + 2)/(x - 1): x ≥ -2 and x ≠ 1.\n" +
      "• Polynomials, aˣ, sin and cos are defined for all x; tan x needs x ≠ π/2 + kπ.\n" +
      "• In physical problems the situation adds its own limits (e.g. tank height 0 ≤ h ≤ H).\n" +
      "\n" +
      "HOW TO FIND THE RANGE\n" +
      "1. With a graph, we can read the lowest and highest y-values of the curve (an asymptote means the value is never reached).\n" +
      "2. We can complete the square: for y = a(x - h)² + k, a > 0 gives R = [k, ∞), a < 0 gives R = (-∞, k].\n" +
      "3. We can build up from basic facts: √(...) ≥ 0, (...)² ≥ 0, 1/(...) ≠ 0, eˣ > 0.\n" +
      "4. We can solve y = f(x) for x; the y-values for which a solution exists form the range (the inverse-function idea).\n" +
      "\n" +
      "INTERVAL NOTATION: ( ) endpoint excluded, [ ] endpoint included. We always put a parenthesis at ∞: [3, ∞).\n" +
      "\n" +
      "MINI EXAMPLE\n" +
      "f(x) = √(x - 3) + 2.  Radicand: x - 3 ≥ 0 → D = [3, ∞).  Since √(...) ≥ 0, f(x) ≥ 2 → R = [2, ∞).\n" +
      "g(x) = 1/(x + 1) - 4:  D: x ≠ -1;  1/(...) is never 0 → R: y ≠ -4.\n" +
      "\n" +
      "PITFALLS\n" +
      "• Cancelling does not enlarge the domain: (x² - 1)/(x - 1) still needs x ≠ 1, even though it equals x + 1.\n" +
      "• It helps not to mix up domain and range: x is the input, y the output.\n" +
      "• A root sign always gives a value ≥ 0: √(x²) = |x|, not x.\n" +
      "• On the graph the blue band shows the domain."
    ),
    createProblem,
    links: [
      { match: /^• (Payda|Denominator) ≠ 0/, make: (rng) => mk(rng, 1) },
      { match: /^• (Çift kökün|Inside of an even root)/, make: (rng) => mk(rng, 0) },
      { match: /^• (Logaritmanın içi|Argument of a logarithm)/, make: (rng) => mk(rng, 5) },
      { match: /^• (Polinomlar,|Polynomials,)/, make: (rng) => mk(rng, 2) },
    ],
    solveSteps,
    draw,
    focus,
    buildControls,
  });
})();
