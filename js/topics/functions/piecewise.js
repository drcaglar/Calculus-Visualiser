// Ported from Modules/Functions/FnTabs1.vb's PiecewiseControl ("3) Parçalı Fonksiyonlar").
(function () {
  function round1(v) {
    return Math.round(v * 10) / 10;
  }

  function createProblem(rng) {
    return {
      kind: rng.nextInt(0, 4),
      h: rng.nextInt(-2, 3),
      a: rng.nextInt(-3, 4),
      b: rng.nextInt(-3, 4),
      x0: round1(rng.nextDouble() * 8 - 4),
    };
  }

  function F(p, x) {
    switch (p.kind) {
      case 0: return Math.abs(x - p.h);
      case 1: return Math.floor(x);
      case 2: return Math.ceil(x);
      default: return x < 0 ? x + p.a : p.b - x;
    }
  }

  function formula(p) {
    switch (p.kind) {
      case 0: return `f(x) = |x ${FnKit.sg(-p.h)}|`;
      case 1: return 'f(x) = ⌊x⌋';
      case 2: return 'f(x) = ⌈x⌉';
      default: return `f(x) = { x ${FnKit.sg(p.a)}  (x < 0);   ${p.b} - x  (x ≥ 0) }`;
    }
  }

  function solveSteps(problem) {
    const p = problem;
    const x0 = p.x0;
    const steps = [
      I18N.tx(`Verilen fonksiyon: ${formula(p)}`, `Given function: ${formula(p)}`),
      I18N.tx(`Bulmak istediğimiz değer: f(${FnKit.n2(x0)})`, `We want to find: f(${FnKit.n2(x0)})`),
    ];
    switch (p.kind) {
      case 0: {
        const inner = x0 - p.h;
        steps.push(I18N.tx(`Önce içerideki ifadeye bakalım: x ${FnKit.sg(-p.h)} = ${FnKit.n2(inner)}`, `First, the expression inside: x ${FnKit.sg(-p.h)} = ${FnKit.n2(inner)}`));
        steps.push(inner >= 0
          ? I18N.tx(`${FnKit.n2(inner)} ≥ 0 olduğundan mutlak değer değeri değiştirmez: ${FnKit.n2(inner)}`, `${FnKit.n2(inner)} ≥ 0, so the absolute value leaves it unchanged: ${FnKit.n2(inner)}`)
          : I18N.tx(`${FnKit.n2(inner)} < 0 olduğundan işaret değişir: -(${FnKit.n2(inner)}) = ${FnKit.n2(-inner)}`, `${FnKit.n2(inner)} < 0, so the sign flips: -(${FnKit.n2(inner)}) = ${FnKit.n2(-inner)}`));
        break;
      }
      case 1:
        steps.push(I18N.tx(`${FnKit.n2(x0)} sayısına eşit ya da küçük en büyük tam sayı: ${Math.floor(x0)}`, `The largest integer ≤ ${FnKit.n2(x0)} is ${Math.floor(x0)}`));
        break;
      case 2:
        steps.push(I18N.tx(`${FnKit.n2(x0)} sayısına eşit ya da büyük en küçük tam sayı: ${Math.ceil(x0)}`, `The smallest integer ≥ ${FnKit.n2(x0)} is ${Math.ceil(x0)}`));
        break;
      default:
        if (x0 < 0) {
          steps.push(I18N.tx(`${FnKit.n2(x0)} < 0 → birinci kural: x ${FnKit.sg(p.a)} = ${FnKit.n2(x0 + p.a)}`, `${FnKit.n2(x0)} < 0 → first rule: x ${FnKit.sg(p.a)} = ${FnKit.n2(x0 + p.a)}`));
        } else {
          steps.push(I18N.tx(`${FnKit.n2(x0)} ≥ 0 → ikinci kural: ${p.b} - x = ${FnKit.n2(p.b - x0)}`, `${FnKit.n2(x0)} ≥ 0 → second rule: ${p.b} - x = ${FnKit.n2(p.b - x0)}`));
        }
        if (p.a !== p.b) {
          steps.push(I18N.tx(`x = 0'da sıçrama var: soldan ${p.a}, x = 0'da değer ${p.b}.`, `There is a jump at x = 0: ${p.a} from the left, value ${p.b} at x = 0.`));
        } else {
          steps.push(I18N.tx("İki kural x = 0'da aynı değeri verir: grafik kopmadan devam eder.", 'Both rules agree at x = 0: the graph joins without a break.'));
        }
    }
    steps.push(I18N.tx(`SONUÇ: f(${FnKit.n2(x0)}) = ${FnKit.n2(F(p, x0))}`, `RESULT: f(${FnKit.n2(x0)}) = ${FnKit.n2(F(p, x0))}`));
    return steps;
  }

  function draw(canvas, problem) {
    const p = problem;
    canvas.setViewport(-6, 6, -6, 6);
    switch (p.kind) {
      case 0:
        canvas.addFunction({ evaluator: (x) => Math.abs(x - p.h), color: canvas.accent(), thickness: 3 });
        break;
      case 1:
      case 2:
        for (let n = -16; n <= 15; n++) {
          if (p.kind === 1) {
            canvas.addSegment({ x1: n, y1: n, x2: n + 1, y2: n, color: canvas.accent(), thickness: 3 });
            canvas.addMarker({ x: n, y: n, color: canvas.accent(), radius: 4 });
            canvas.addMarker({ x: n + 1, y: n, color: canvas.accent(), radius: 4, hollow: true });
          } else {
            canvas.addSegment({ x1: n, y1: n + 1, x2: n + 1, y2: n + 1, color: canvas.accent(), thickness: 3 });
            canvas.addMarker({ x: n, y: n + 1, color: canvas.accent(), radius: 4, hollow: true });
            canvas.addMarker({ x: n + 1, y: n + 1, color: canvas.accent(), radius: 4 });
          }
        }
        break;
      default:
        canvas.addFunction({ evaluator: (x) => (x < 0 ? x + p.a : NaN), color: canvas.accent(), thickness: 3 });
        canvas.addFunction({ evaluator: (x) => (x >= 0 ? p.b - x : NaN), color: canvas.green(), thickness: 3 });
        canvas.addMarker({ x: 0, y: p.a, color: canvas.accent(), radius: 5, hollow: true });
        canvas.addMarker({ x: 0, y: p.b, color: canvas.green(), radius: 5 });
    }
    const y0 = F(p, p.x0);
    canvas.addGuideLine({ axis: 'vertical', position: p.x0, color: canvas.gray() });
    canvas.addMarker({ x: p.x0, y: y0, color: canvas.gold(), shape: 'diamond', radius: 7, label: `f(${FnKit.n2(p.x0)}) = ${FnKit.n2(y0)}` });
  }

  function focus(p) {
    return { x: p.x0, y: F(p, p.x0) };
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: I18N.tx('İncelenen nokta x', 'Point x we look at'), min: -5.5, max: 5.5,
      get: () => getProblem().x0, set: (v) => { getProblem().x0 = round1(v); },
    });
    h.addSlider({
      caption: I18N.tx('h (yalnızca |x - h| örneğinde)', 'h (only in the |x - h| example)'), min: -3, max: 3,
      get: () => getProblem().h, set: (v) => { getProblem().h = Math.round(v); },
    });
    h.addSlider({
      caption: I18N.tx('A (yalnızca parçalı kural örneğinde)', 'A (only in the two-rule example)'), min: -4, max: 4,
      get: () => getProblem().a, set: (v) => { getProblem().a = Math.round(v); },
    });
    h.addSlider({
      caption: I18N.tx('B (yalnızca parçalı kural örneğinde)', 'B (only in the two-rule example)'), min: -4, max: 4,
      get: () => getProblem().b, set: (v) => { getProblem().b = Math.round(v); },
    });
  }

  Topics.register('functions', {
    id: 'piecewise',
    problemStatement: (p) => I18N.tx(`${formula(p)} için f(${FnKit.n2(p.x0)}) değerini hesaplayabilir miyiz?`, `For ${formula(p)}, let's evaluate f(${FnKit.n2(p.x0)}).`),
    tabTitle: () => I18N.tx('Parçalı Fonksiyonlar', 'Piecewise Functions'),
    concept: () => I18N.tx(
      "TANIM\n" +
      "Tanım kümesinin farklı bölgelerinde farklı kurallarla verilen fonksiyona PARÇALI fonksiyon denir:\n" +
      "  f(x) = { kural₁ , x bölge₁'de ;  kural₂ , x bölge₂'de }\n" +
      "Bölgeler çakışmaz ve her x tam olarak bir bölgeye düşer.\n" +
      "\n" +
      "DEĞER HESAPLAMA (YÖNTEM)\n" +
      "1. x'in hangi bölgede olduğuna bakılır (sınır noktasında ≤ mi <, ≥ mi > olduğuna dikkat etmek yardımcı olur).\n" +
      "2. Yalnızca o bölgenin kuralı kullanılır.\n" +
      "3. Grafikte: dolu nokta değerin alındığını, boş nokta alınmadığını gösterir.\n" +
      "\n" +
      "MUTLAK DEĞER\n" +
      "|x| = x (x ≥ 0), -x (x < 0). Sıfırdan uzaklıktır; her zaman ≥ 0.\n" +
      "• |x - h|, x ile h arasındaki uzaklıktır; grafiği h'de köşeli bir V şeklidir.\n" +
      "• |x| < a ⇔ -a < x < a;   |x| > a ⇔ x < -a veya x > a.\n" +
      "• √(x²) = |x|;  |a·b| = |a|·|b|;  ama genelde |a + b| ≠ |a| + |b| (her zaman |a + b| ≤ |a| + |b|).\n" +
      "\n" +
      "EN BÜYÜK TAM SAYI ⌊x⌋ ve EN KÜÇÜK TAM SAYI ⌈x⌉\n" +
      "• ⌊x⌋ = x'e eşit ya da küçük en büyük tam sayı:  ⌊2,7⌋ = 2,  ⌊-2,3⌋ = -3 (-2 değil).\n" +
      "• ⌈x⌉ = x'e eşit ya da büyük en küçük tam sayı:  ⌈2,3⌉ = 3,  ⌈-2,7⌉ = -2.\n" +
      "• Grafik merdiven şeklindedir, her tam sayıda atlama süreksizliği vardır; ⌈x⌉ = -⌊-x⌋.\n" +
      "\n" +
      "SÜREKLİLİK KONTROLÜ (sınır x = c noktasında)\n" +
      "Soldan değer, sağdan değer ve f(c) karşılaştırılır; üçü eşitse grafik kopmadan geçer, değilse atlama vardır.\n" +
      "\n" +
      "MİNİ ÖRNEK\n" +
      "f(x) = x + 2 (x < 0),  4 - x (x ≥ 0).\n" +
      "f(-1) = 1 (ilk kural);  f(0) = 4 (x = 0 ikinci bölgede);  f(3) = 1.\n" +
      "x = 0'da soldan değer 2, f(0) = 4 → atlama var, süreksiz.\n" +
      "\n" +
      "MÜHENDİSLİKTE: basamak yükler, rampa/doyma fonksiyonları, kesme kuvveti ve eğilme momenti diyagramları, tarife/vergi dilimleri parçalı fonksiyonlardır.\n" +
      "\n" +
      "DİKKAT\n" +
      "• Negatif sayılarda ⌊x⌋ sıfırdan uzağa (aşağı) yuvarlar, sıfıra doğru değil.\n" +
      "• |x| için 'işareti sil' diye düşünmemek iyi olur; |-3| = 3 ama |x| = x yalnızca x ≥ 0 için doğrudur.",
      "DEFINITION\n" +
      "A function given by different rules on different parts of its domain is PIECEWISE:\n" +
      "  f(x) = { rule₁ , x in part₁ ;  rule₂ , x in part₂ }\n" +
      "The parts must not overlap and every x must lie in exactly one part.\n" +
      "\n" +
      "EVALUATING (METHOD)\n" +
      "1. We decide which part x lies in (it helps to check the boundary: ≤ or <, ≥ or >).\n" +
      "2. Use only that part's rule.\n" +
      "3. On the graph a filled dot means the value is taken, an open dot means it is not.\n" +
      "\n" +
      "ABSOLUTE VALUE\n" +
      "|x| = x (x ≥ 0), -x (x < 0). It is the distance from 0 and is always ≥ 0.\n" +
      "• |x - h| is the distance between x and h; its graph is a V with its corner at h.\n" +
      "• |x| < a ⇔ -a < x < a;   |x| > a ⇔ x < -a or x > a.\n" +
      "• √(x²) = |x|;  |a·b| = |a|·|b|;  but in general |a + b| ≠ |a| + |b| (always |a + b| ≤ |a| + |b|).\n" +
      "\n" +
      "GREATEST INTEGER ⌊x⌋ AND LEAST INTEGER ⌈x⌉\n" +
      "• ⌊x⌋ = the largest integer ≤ x:  ⌊2.7⌋ = 2,  ⌊-2.3⌋ = -3 (not -2).\n" +
      "• ⌈x⌉ = the smallest integer ≥ x:  ⌈2.3⌉ = 3,  ⌈-2.7⌉ = -2.\n" +
      "• The graph is a staircase with a jump discontinuity at every integer; ⌈x⌉ = -⌊-x⌋.\n" +
      "\n" +
      "CONTINUITY CHECK (at a boundary x = c)\n" +
      "We compare the left-hand value, the right-hand value and f(c); if all three agree the graph passes without a break, otherwise there is a jump.\n" +
      "\n" +
      "MINI EXAMPLE\n" +
      "f(x) = x + 2 (x < 0),  4 - x (x ≥ 0).\n" +
      "f(-1) = 1 (first rule);  f(0) = 4 (x = 0 lies in the second part);  f(3) = 1.\n" +
      "At x = 0 the left value is 2 but f(0) = 4 → a jump, discontinuous.\n" +
      "\n" +
      "IN ENGINEERING: step loads, ramp/saturation functions, shear-force and bending-moment diagrams, tariff or tax brackets are all piecewise functions.\n" +
      "\n" +
      "PITFALLS\n" +
      "• For negative numbers ⌊x⌋ rounds down (away from zero), not toward zero.\n" +
      "• It is better not to think of |x| as 'delete the sign'; |-3| = 3 but |x| = x only holds for x ≥ 0."
    ),
    createProblem,
    links: [
      { match: /^  f\(x\) = \{ (kural₁|rule₁)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 3) },
      { match: /^\|x\| = x \(x ≥ 0\)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 0) },
      { match: /^• \|x - h\|/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 0 && p.h !== 0) },
      { match: /^• ⌊x⌋ =/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 1) },
      { match: /^• ⌈x⌉ =/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 2) },
      { match: /^(SÜREKLİLİK KONTROLÜ|CONTINUITY CHECK)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 3 && p.a !== p.b) },
    ],
    solveSteps,
    draw,
    focus,
    buildControls,
  });
})();
