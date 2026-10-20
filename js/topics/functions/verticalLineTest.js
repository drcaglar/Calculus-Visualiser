// Ported from Modules/Functions/FnTabs1.vb's VerticalLineTestControl ("2) Dikey Doğru Testi").
(function () {
  function round1(v) {
    return Math.round(v * 10) / 10;
  }

  function createProblem(rng) {
    return {
      kind: rng.nextInt(0, 4),
      s: rng.nextInt(1, 5),
      lineX: round1(rng.nextDouble() * 4 - 2),
    };
  }

  // Returns the array of y-values where the curve meets the vertical line x = x.
  function ys(p, x) {
    const r = [];
    switch (p.kind) {
      case 0:
        r.push(x * x - p.s);
        break;
      case 1: {
        const rad = p.s + 1;
        const d = rad * rad - x * x;
        if (d >= 0) {
          r.push(Math.sqrt(d));
          if (d > 0.0000001) r.push(-Math.sqrt(d));
        }
        break;
      }
      case 2: {
        const d = x + p.s;
        if (d >= 0) {
          r.push(Math.sqrt(d));
          if (d > 0.0000001) r.push(-Math.sqrt(d));
        }
        break;
      }
      default:
        if (x + p.s >= 0) r.push(Math.sqrt(x + p.s));
    }
    return r;
  }

  function equation(p) {
    switch (p.kind) {
      case 0: return `y = x² - ${p.s}`;
      case 1: return `x² + y² = ${(p.s + 1) * (p.s + 1)}`;
      case 2: return `x = y² - ${p.s}`;
      default: return `y = √(x + ${p.s})`;
    }
  }

  function isFunction(p) {
    return p.kind === 0 || p.kind === 3;
  }

  function solveSteps(problem) {
    const p = problem;
    const steps = [I18N.tx(`Eğri: ${equation(p)}`, `Curve: ${equation(p)}`)];
    const hits = ys(p, p.lineX);
    steps.push(I18N.tx(`Dikey doğru x = ${FnKit.n2(p.lineX)} için eğriyi ${hits.length} noktada kesiyor; bunu sayarak başlayalım.`, `The vertical line x = ${FnKit.n2(p.lineX)} meets the curve in ${hits.length} point(s); let's start by counting them.`));
    switch (p.kind) {
      case 0:
        steps.push(I18N.tx('Her x için y = x² - c yalnızca bir değer verir: her dikey doğru en çok 1 kez keser.', 'For every x, y = x² - c gives just one value: every vertical line meets it at most once.'));
        break;
      case 1:
        steps.push(I18N.tx(`x = 0 alırsak y² = ${(p.s + 1) * (p.s + 1)} → y = +${p.s + 1} ve y = -${p.s + 1}: aynı x için İKİ y değeri.`, `If we take x = 0: y² = ${(p.s + 1) * (p.s + 1)} → y = +${p.s + 1} and y = -${p.s + 1}: TWO y-values for the same x.`));
        break;
      case 2:
        steps.push(I18N.tx(`x = 0 alırsak y² = ${p.s} → iki y değeri (±√${p.s}). Yan yatmış parabol.`, `If we take x = 0: y² = ${p.s} → two y-values (±√${p.s}). A sideways parabola.`));
        break;
      default:
        steps.push(I18N.tx('Karekök tek (negatif olmayan) değer verir: her dikey doğru en çok 1 kez keser.', 'A square root gives one non-negative value: every vertical line meets it at most once.'));
    }
    steps.push(isFunction(p)
      ? I18N.tx('SONUÇ: Dikey doğru testini geçiyor → bu eğri BİR FONKSİYONUN grafiğidir.', 'RESULT: it passes the vertical line test → this curve IS the graph of a function.')
      : I18N.tx('SONUÇ: Bazı dikey doğrular eğriyi 2 kez kesiyor → bu eğri bir fonksiyonun grafiği DEĞİLDİR.', 'RESULT: some vertical lines cut the curve twice → this curve is NOT the graph of a function.'));
    return steps;
  }

  function aspectOf(canvas) {
    const el = canvas.canvas;
    const w = el ? el.clientWidth : 0;
    const h = el ? el.clientHeight : 0;
    return (h > 50 && w > 50) ? w / h : 1.4;
  }

  function draw(canvas, problem) {
    const p = problem;
    const aspect = aspectOf(canvas);
    canvas.setViewport(-6 * aspect, 6 * aspect, -6, 6);
    switch (p.kind) {
      case 0:
        canvas.addFunction({ evaluator: (x) => x * x - p.s, color: canvas.accent(), thickness: 3 });
        break;
      case 3:
        canvas.addFunction({ evaluator: (x) => (x + p.s >= 0 ? Math.sqrt(x + p.s) : NaN), color: canvas.accent(), thickness: 3 });
        break;
      case 1:
        canvas.addParametric({
          xOfT: (t) => (p.s + 1) * Math.cos(t), yOfT: (t) => (p.s + 1) * Math.sin(t),
          color: canvas.accent(), thickness: 3,
        });
        break;
      default:
        canvas.addParametric({
          xOfT: (t) => t * t - p.s, yOfT: (t) => t, tMin: -3.5, tMax: 3.5, samples: 300,
          color: canvas.accent(), thickness: 3,
        });
    }
    canvas.addGuideLine({ axis: 'vertical', position: p.lineX, color: canvas.orange() });
    for (const y of ys(p, p.lineX)) {
      canvas.addMarker({ x: p.lineX, y, color: canvas.gold(), radius: 6 });
    }
  }

  function focus(p) {
    const hits = ys(p, p.lineX);
    return { x: p.lineX, y: hits.length ? hits[0] : 0 };
  }

  function buildControls(rightCol, getProblem, h) {
    window.addEventListener('resize', () => h.refresh());
    h.addSlider({
      caption: I18N.tx('Dikey doğrunun konumu (x)', 'Position of the vertical line (x)'), min: -7, max: 7,
      get: () => getProblem().lineX, set: (v) => { getProblem().lineX = round1(v); },
    });
    h.addSlider({
      caption: I18N.tx('Eğrinin boyutu', 'Size of the curve'), min: 1, max: 5,
      get: () => getProblem().s, set: (v) => { getProblem().s = Math.max(1, Math.round(v)); },
    });
  }

  Topics.register('functions', {
    id: 'verticalLineTest',
    problemStatement: (p) => I18N.tx(
      `${equation(p)} eğrisi bir fonksiyonun grafiği midir? Dikey doğru testiyle gösteriniz. x = ${FnKit.n2(p.lineX)} doğrusu eğriyi kaç noktada keser?`,
      `Is the curve ${equation(p)} the graph of a function? Let's check with the vertical line test. How many points does the line x = ${FnKit.n2(p.lineX)} meet it in?`),
    tabTitle: () => I18N.tx('Dikey Doğru Testi', 'Vertical Line Test'),
    concept: () => I18N.tx(
      "TANIM\n" +
      "f fonksiyonunun grafiği, Kartezyen düzlemde (x, f(x)) noktalarının kümesidir. Bir x değerine birden çok y karşılık geliyorsa bu bir fonksiyon değil, yalnızca bir BAĞINTI'dır.\n" +
      "\n" +
      "DİKEY DOĞRU TESTİ\n" +
      "Bir eğri ancak ve ancak hiçbir dikey doğru (x = a) onu birden fazla noktada kesmiyorsa bir fonksiyonun grafiğidir. Sebep: x = a doğrusu, girdi a için olası tüm çıktıları aynı anda gösterir; birden fazla kesişim = bir girdiye birden çok çıktı.\n" +
      "• 0 kesişim: a tanım kümesinde değil.\n" +
      "• 1 kesişim: a tanım kümesinde, f(a) tek.\n" +
      "• 2 veya daha fazla kesişim: fonksiyon DEĞİL.\n" +
      "\n" +
      "CEBİRSEL KONTROL (denklemden)\n" +
      "1. Denklem y için çözülür.\n" +
      "2. ± işareti çıkıyorsa (y = ±√...) bir x'e iki y düşer → fonksiyon değil.\n" +
      "3. y tek bir ifadeyle yazılabiliyorsa fonksiyondur.\n" +
      "\n" +
      "ÖRNEKLER\n" +
      "• y = x² - 4: her x için tek y → fonksiyon.\n" +
      "• x² + y² = 25 (çember): x = 3 için y = ±4 → fonksiyon değil. Üst yarı y = √(25 - x²) ve alt yarı y = -√(25 - x²) ayrı ayrı fonksiyondur.\n" +
      "• x = y² (yan yatmış parabol): x = 4 için y = ±2 → fonksiyon değil.\n" +
      "• x = 2 doğrusu (dikey) fonksiyon değildir; y = 2 doğrusu (yatay) fonksiyondur.\n" +
      "\n" +
      "HATIRLATMA\n" +
      "• Dikey doğru testi \"FONKSİYON MU?\" sorusunu yanıtlar. YATAY doğru testi ise \"bire-bir mi, yani ters fonksiyonu var mı?\" sorusunu yanıtlar (Ters Fonksiyon sekmesi).\n" +
      "• Parçalı grafiklerde dolu ve boş noktalara bakmak yardımcı olur: aynı x'te bir dolu ve bir boş nokta sorun değildir, ama iki DOLU nokta üst üste ise fonksiyon değildir.\n" +
      "\n" +
      "NASIL KULLANILABİLİR?\n" +
      "Sağdaki kaydırıcıyla dikey doğruyu hareket ettirip kesişim sayısını gözlemleyebiliriz; bir yerde 2 kesişim görürsek eğri fonksiyon değildir.",
      "DEFINITION\n" +
      "The graph of f is the set of points (x, f(x)) in the Cartesian plane. If one x belongs to more than one y, the curve is not a function, only a RELATION.\n" +
      "\n" +
      "VERTICAL LINE TEST\n" +
      "A curve is the graph of a function if and only if no vertical line (x = a) meets it more than once. Reason: the line x = a shows all possible outputs for the input a at once; several intersections mean one input with several outputs.\n" +
      "• 0 intersections: a is not in the domain.\n" +
      "• 1 intersection: a is in the domain, f(a) is unique.\n" +
      "• 2 or more intersections: NOT a function.\n" +
      "\n" +
      "ALGEBRAIC CHECK (from an equation)\n" +
      "1. We solve the equation for y.\n" +
      "2. If a ± sign appears (y = ±√...), one x gives two y-values → not a function.\n" +
      "3. If y can be written as one single expression, it is a function.\n" +
      "\n" +
      "EXAMPLES\n" +
      "• y = x² - 4: one y for every x → a function.\n" +
      "• x² + y² = 25 (circle): at x = 3, y = ±4 → not a function. The upper half y = √(25 - x²) and the lower half y = -√(25 - x²) are each functions.\n" +
      "• x = y² (sideways parabola): at x = 4, y = ±2 → not a function.\n" +
      "• The line x = 2 (vertical) is not a function; the line y = 2 (horizontal) is.\n" +
      "\n" +
      "REMEMBER\n" +
      "• The vertical line test answers \"IS IT A FUNCTION?\". The HORIZONTAL line test answers \"is it one-to-one, i.e. does it have an inverse?\" (Inverse Functions tab).\n" +
      "• On piecewise graphs it helps to look at filled and open dots: a filled and an open dot at the same x is fine, but two FILLED dots above each other is not a function.\n" +
      "\n" +
      "HOW TO USE\n" +
      "We can move the vertical line with the slider and watch the number of intersections; if we ever see 2, the curve is not a function."
    ),
    createProblem,
    links: [
      { match: /^• 0 (kesişim|intersections):/, make: (rng) => { const p = FnKit.until(createProblem, rng, (q) => q.kind === 2 || q.kind === 3); p.lineX = round1(-p.s - 0.5 - rng.nextInt(0, 3) * 0.5); return p; } },
      { match: /^• 1 (kesişim|intersection):/, make: (rng) => FnKit.until(createProblem, rng, (p) => ys(p, p.lineX).length === 1) },
      { match: /^• 2 (veya daha fazla|or more)/, make: (rng) => FnKit.until(createProblem, rng, (p) => ys(p, p.lineX).length >= 2) },
      { match: /^2\. (± işareti|If a ± sign)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 2) },
      { match: /^3\. (y tek bir|If y can be)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 3) },
      { match: /^• y = x² - 4:/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 0) },
      { match: /^• x² \+ y² = 25/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 1) },
      { match: /^• x = y² \((yan yatmış|sideways)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 2) },
    ],
    solveSteps,
    draw,
    focus,
    buildControls,
  });
})();
