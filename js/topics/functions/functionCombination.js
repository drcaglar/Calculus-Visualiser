// Ported from Modules/Functions/FnTabs3.vb (FunctionCombinationControl) - combining two fixed
// functions f, g with +, -, *, / and composition (f∘g / g∘f), evaluated at a slider-controlled
// point x0. Blue = f, green = g, thick accent curve = the chosen result.
(function () {
  // domainText: numeric domain finder on [-10, 10] (mirrors FnKit.DomainText in FnTabs1.vb).
  // Prefer the shared FnKit port if it is loaded before this file; else fall back locally.
  function boundary(ok, badX, goodX) {
    let bad = badX, good = goodX;
    for (let i = 0; i < 40; i++) {
      const mid = (bad + good) / 2;
      if (ok(mid)) good = mid; else bad = mid;
    }
    return (bad + good) / 2;
  }

  function localDomainText(f) {
    const ok = (x) => {
      let y;
      try { y = f(x); } catch (e) { return false; }
      return isFinite(y);
    };
    const lo = -10.0, hi = 10.0;
    const pieces = [];
    let start = NaN;
    let prevX = lo;
    let prevOk = ok(lo);
    if (prevOk) start = lo;
    for (let i = 1; i <= 2000; i++) {
      const x = lo + i * (hi - lo) / 2000.0;
      const cur = ok(x);
      if (cur && !prevOk) {
        start = boundary(ok, prevX, x);
      } else if (!cur && prevOk) {
        pieces.push([start, boundary(ok, x, prevX)]);
        start = NaN;
      }
      prevX = x; prevOk = cur;
    }
    if (prevOk) pieces.push([start, hi]);
    if (pieces.length === 0) return I18N.tx('Boş küme', 'Empty set');

    const parts = pieces.map(([a, b]) => {
      let left, right;
      if (a <= lo + 0.0001) {
        left = '(-∞';
      } else {
        const ra = Math.round(a * 100) / 100;
        left = (ok(ra) ? '[' : '(') + fmt2(ra);
      }
      if (b >= hi - 0.0001) {
        right = '∞)';
      } else {
        const rb = Math.round(b * 100) / 100;
        right = fmt2(rb) + (ok(rb) ? ']' : ')');
      }
      return `${left}, ${right}`;
    });
    return parts.join(' ∪ ');
  }

  function domainText(f) {
    if (typeof FnKit !== 'undefined' && FnKit && typeof FnKit.domainText === 'function') {
      return FnKit.domainText(f);
    }
    return localDomainText(f);
  }

  function w(v) { return v === 'x' ? 'x' : '(' + v + ')'; }

  const TEMPLATES = [
    (v) => w(v) + '²',
    (v) => w(v) + ' - 1',
    (v) => '√' + w(v),
    (v) => '1/' + w(v),
    (v) => '2' + w(v) + ' + 3',
  ];

  function evalF(index, x) {
    switch (index) {
      case 0: return x * x;
      case 1: return x - 1;
      case 2: return x >= 0 ? Math.sqrt(x) : NaN;
      case 3: return x === 0 ? NaN : 1.0 / x;
      default: return 2 * x + 3;
    }
  }

  // Fixed math notation - identical in both languages, so no I18N.tx needed (mirrors VB OpNames()).
  const OP_NAMES = ['f + g', 'f - g', 'f · g', 'f / g', 'f ∘ g  (f(g(x)))', 'g ∘ f  (g(f(x)))'];

  // Mirrors VB's private `_op` control field: the chosen operation is NOT part of the random
  // problem, so it persists across "New Example" clicks, exactly like the desktop control.
  let op = 0;

  function createProblem(rng) {
    const f = rng.nextInt(0, 5);
    let g;
    do { g = rng.nextInt(0, 5); } while (g === f);
    return { fIndex: f, gIndex: g, x0: rng.nextInt(-3, 4) };
  }

  function result(p, x) {
    const fv = evalF(p.fIndex, x), gv = evalF(p.gIndex, x);
    switch (op) {
      case 0: return fv + gv;
      case 1: return fv - gv;
      case 2: return fv * gv;
      case 3: return gv === 0 ? NaN : fv / gv;
      case 4: return evalF(p.fIndex, gv);
      default: return evalF(p.gIndex, fv);
    }
  }

  function resultFormula(p) {
    const fT = TEMPLATES[p.fIndex]('x'), gT = TEMPLATES[p.gIndex]('x');
    switch (op) {
      case 0: return `${fT} + ${gT}`;
      case 1: return `${fT} - (${gT})`;
      case 2: return `(${fT})·(${gT})`;
      case 3: return `(${fT}) / (${gT})`;
      case 4: return TEMPLATES[p.fIndex](gT);
      default: return TEMPLATES[p.gIndex](fT);
    }
  }

  function solveSteps(p) {
    const fT = TEMPLATES[p.fIndex]('x'), gT = TEMPLATES[p.gIndex]('x');
    const opName = OP_NAMES[op];
    const steps = [
      `f(x) = ${fT}     g(x) = ${gT}`,
      I18N.tx(`Seçilen işlem: ${opName}`, `Operation: ${opName}`),
    ];
    const formula = resultFormula(p);
    steps.push(I18N.tx(`Formül: ${formula}`, `Formula: ${formula}`));
    if (op >= 4) {
      steps.push(op === 4
        ? I18N.tx('Önce içteki g(x) değerini yazalım, sonra f\'de x yerine koyalım.', 'Let\'s write the inner g(x) first, then substitute it for x in f.')
        : I18N.tx('Önce içteki f(x) değerini yazalım, sonra g\'de x yerine koyalım.', 'Let\'s write the inner f(x) first, then substitute it for x in g.'));
    }
    const dom = domainText((x) => result(p, x));
    steps.push(I18N.tx(`Tanım kümesi: ${dom}`, `Domain: ${dom}`));
    const x0 = p.x0;
    const r = result(p, x0);
    const fvT = (i) => { const v = evalF(i, x0); return (Number.isNaN(v) || !isFinite(v)) ? I18N.tx('tanımsız', 'undefined') : fmt2(v); };
    const rText = (Number.isNaN(r) || !isFinite(r)) ? I18N.tx('tanımsız', 'undefined') : fmt2(r);
    steps.push(I18N.tx(
      `x = ${fmt2(x0)} için: f = ${fvT(p.fIndex)}, g = ${fvT(p.gIndex)}, sonuç = ${rText}`,
      `At x = ${fmt2(x0)}: f = ${fvT(p.fIndex)}, g = ${fvT(p.gIndex)}, result = ${rText}`,
    ));
    return steps;
  }

  function draw(canvas, p) {
    canvas.setViewport(-7, 7, -6, 6);
    canvas.addFunction({ evaluator: (x) => evalF(p.fIndex, x), color: canvas.blue(), thickness: 2.0, dashed: true });
    canvas.addFunction({ evaluator: (x) => evalF(p.gIndex, x), color: canvas.green(), thickness: 2.0, dashed: true });
    canvas.addFunction({ evaluator: (x) => result(p, x), color: canvas.accent(), thickness: 3.5 });
    const r = result(p, p.x0);
    if (!Number.isNaN(r) && isFinite(r)) {
      canvas.addMarker({ x: p.x0, y: r, color: canvas.gold(), radius: 6 });
    }
  }

  Topics.register('functions', {
    id: 'functionCombination',
    problemStatement: (p) => {
      const fT = TEMPLATES[p.fIndex]('x'), gT = TEMPLATES[p.gIndex]('x');
      const opName = OP_NAMES[op];
      const x0 = fmt2(p.x0);
      return I18N.tx(`f(x) = ${fT} ve g(x) = ${gT} için ${opName} ifadesini ve tanım kümesini bulalım; ardından x = ${x0} için sonucu hesaplayalım.`,
                     `For f(x) = ${fT} and g(x) = ${gT}, let's find ${opName} and its domain; then evaluate the result at x = ${x0}.`);
    },
    tabTitle: () => I18N.tx('Fonksiyon Cebiri ve Bileşke', 'Combining Functions & Composition'),
    concept: () => I18N.tx(
      "CEBİRSEL İŞLEMLER\n" +
      "(f ± g)(x) = f(x) ± g(x),  (f·g)(x) = f(x)·g(x),  (f/g)(x) = f(x)/g(x).\n" +
      "Tanım kümesi: D_f ∩ D_g (İKİSİNİN DE tanımlı olduğu ortak küme); bölmede ayrıca g(x) ≠ 0.\n" +
      "\n" +
      "BİLEŞKE\n" +
      "(f ∘ g)(x) = f(g(x)): önce İÇTEKİ g(x) hesaplanır, sonuç f'de x yerine yazılır. Genelde f ∘ g ≠ g ∘ f.\n" +
      "\n" +
      "BİLEŞKENİN TANIM KÜMESİ (YÖNTEM)\n" +
      "1. x, İÇ fonksiyon g'nin tanım kümesinde olmalı.\n" +
      "2. g(x), DIŞ fonksiyon f'nin tanım kümesinde olmalı (f'nin kısıtları g(x) için yazılır).\n" +
      "3. İki koşulun kesişimi alınır.\n" +
      "\n" +
      "MİNİ ÖRNEK\n" +
      "f(x) = √x, g(x) = x - 4.\n" +
      "(f ∘ g)(x) = √(x - 4): D = [4, ∞).\n" +
      "(g ∘ f)(x) = √x - 4: D = [0, ∞).  Farklı fonksiyonlar!\n" +
      "f(x) = x², g(x) = x + 1: (f ∘ g)(x) = (x + 1)², (g ∘ f)(x) = x² + 1; x = 2'de sonuçlar 9 ve 5.\n" +
      "f(x) = 1/x, g(x) = x - 2: (f ∘ g)(x) = 1/(x - 2), D: x ≠ 2.\n" +
      "\n" +
      "AYRIŞTIRMA\n" +
      "h(x) = sin(x² + 1) = f(g(x)); g(x) = x² + 1 (iç), f = sin (dış). Türevde zincir kuralı için bu ayrıştırmayı kullanacağız.\n" +
      "\n" +
      "MÜHENDİSLİKTE: zincirleme sistemler bileşkedir: A(r(t)) = π·r(t)² (yarıçapı zamanla değişen dairenin alanı).\n" +
      "\n" +
      "İPUÇLARI\n" +
      "• f(g(x)) ile f(x)·g(x) farklıdır.\n" +
      "• Sadeleştirme tanım kümesini genişletmez (D, sadeleştirmeden ÖNCE belirlenir).\n" +
      "• f ∘ f⁻¹ = x ve f⁻¹ ∘ f = x (uygun tanım kümelerinde).\n" +
      "• Sağdaki düğmelerle işlemi seçebiliriz; mavi f, yeşil g, kalın eğri sonuçtur.",
      "ALGEBRAIC OPERATIONS\n" +
      "(f ± g)(x) = f(x) ± g(x),  (f·g)(x) = f(x)·g(x),  (f/g)(x) = f(x)/g(x).\n" +
      "Domain: D_f ∩ D_g (the common set where BOTH are defined); for division also g(x) ≠ 0.\n" +
      "\n" +
      "COMPOSITION\n" +
      "(f ∘ g)(x) = f(g(x)): first compute the INNER g(x), then substitute it for x in f. In general f ∘ g ≠ g ∘ f.\n" +
      "\n" +
      "DOMAIN OF A COMPOSITION (METHOD)\n" +
      "1. x must be in the domain of the INNER function g.\n" +
      "2. g(x) must be in the domain of the OUTER function f (write f's restrictions for g(x)).\n" +
      "3. We take the intersection of both conditions.\n" +
      "\n" +
      "MINI EXAMPLE\n" +
      "f(x) = √x, g(x) = x - 4.\n" +
      "(f ∘ g)(x) = √(x - 4): D = [4, ∞).\n" +
      "(g ∘ f)(x) = √x - 4: D = [0, ∞).  Different functions!\n" +
      "f(x) = x², g(x) = x + 1: (f ∘ g)(x) = (x + 1)², (g ∘ f)(x) = x² + 1; at x = 2 these give 9 and 5.\n" +
      "f(x) = 1/x, g(x) = x - 2: (f ∘ g)(x) = 1/(x - 2), D: x ≠ 2.\n" +
      "\n" +
      "DECOMPOSITION\n" +
      "h(x) = sin(x² + 1) = f(g(x)) with g(x) = x² + 1 (inner), f = sin (outer). This split will help us with the chain rule in derivatives.\n" +
      "\n" +
      "IN ENGINEERING: chained systems are compositions: A(r(t)) = π·r(t)² (area of a circle whose radius changes with time).\n" +
      "\n" +
      "GOOD TO KNOW\n" +
      "• f(g(x)) is not f(x)·g(x).\n" +
      "• Cancelling does not enlarge the domain (it helps to find D BEFORE simplifying).\n" +
      "• f ∘ f⁻¹ = x and f⁻¹ ∘ f = x (on suitable domains).\n" +
      "• We can choose the operation with the buttons; blue is f, green is g, the thick curve is the result."
    ),
    createProblem,
    links: [
      { match: /^\(f ± g\)\(x\)/, make: (rng) => { op = rng.nextInt(0, 4); return createProblem(rng); } },
      { match: /^(Tanım kümesi: D_f|Domain: D_f)/, make: (rng) => { op = 3; return createProblem(rng); } },
      { match: /^\(f ∘ g\)\(x\) = f\(g\(x\)\)/, make: (rng) => { op = rng.nextInt(4, 6); return createProblem(rng); } },
      { match: /^(BİLEŞKENİN TANIM KÜMESİ|DOMAIN OF A COMPOSITION)/, make: (rng) => { op = rng.nextInt(4, 6); return createProblem(rng); } },
    ],
    solveSteps,
    draw,
    focus: (p) => { const r = result(p, p.x0); return { x: p.x0, y: (Number.isNaN(r) || !isFinite(r)) ? 0 : r }; },
    buildControls: (rightCol, getProblem, h) => {
      const header = document.createElement('div');
      header.className = 'we-slider-caption';
      header.style.fontWeight = 'bold';
      header.style.marginTop = '4px';
      header.textContent = I18N.tx('İşlem:', 'Operation:');
      rightCol.appendChild(header);

      h.addRadioGroup({
        name: 'fc-op',
        options: OP_NAMES.map((label, i) => ({ label, value: i })),
        get: () => op,
        set: (v) => { op = v; },
      });

      h.addSlider({
        caption: I18N.tx('Değerlendirilen nokta x', 'Evaluation point x'), min: -5, max: 5, step: 0.1,
        get: () => getProblem().x0, set: (v) => { getProblem().x0 = Math.round(v * 10) / 10; },
      });
    },
  });
})();
