// Ported from Modules/Preliminaries/LineEquationControl.vb - equations of lines: point-slope form,
// slope-intercept form, two-point form, general line equation, special lines (vertical/horizontal/
// through the origin), and axis intercepts - six classic sub-topics unified by one "everything ends
// up at y = mx + b (or x = a)" logic.
(function () {
  // Mode: 0=point-slope, 1=slope-intercept, 2=two-point, 3=general form, 4=special, 5=intercepts

  function signedTerm(value, suffix) {
    suffix = suffix || '';
    return value >= 0 ? `+ ${fmt2(value)}${suffix}` : `- ${fmt2(Math.abs(value))}${suffix}`;
  }

  const SLOPES_A = [-3, -2, -1, -0.5, 0.5, 1, 2, 3];
  const SLOPES_B = [-3, -2, -1, 1, 2, 3];
  const SLOPES_ORIGIN = [-2, -1, 0.5, 1, 2];
  const GENERAL_COEFFS = [-3, -2, -1, 1, 2, 3];

  function createProblem(rng) {
    const mode = rng.nextInt(0, 6);
    const p = { mode };

    switch (mode) {
      case 0: // point-slope
        p.x1 = rng.nextInt(-6, 7);
        p.y1 = rng.nextInt(-6, 7);
        p.m = rng.pick(SLOPES_A);
        break;

      case 1: // slope-intercept, given directly
        p.m = rng.pick(SLOPES_A);
        p.b = rng.nextInt(-8, 9);
        break;

      case 2: // two points
        p.x1 = rng.nextInt(-6, 4);
        do { p.x2 = rng.nextInt(-3, 8); } while (p.x2 === p.x1);
        p.y1 = rng.nextInt(-6, 7);
        p.y2 = rng.nextInt(-6, 7);
        break;

      case 3: // general form Ax + By = C
        p.generalA = rng.pick(GENERAL_COEFFS);
        p.generalB = rng.pick(GENERAL_COEFFS);
        p.generalC = rng.nextInt(-10, 11);
        break;

      case 4: // special lines
        p.specialKind = rng.nextInt(0, 3);
        p.specialValue = rng.nextInt(-6, 7);
        if (p.specialKind === 2) p.m = rng.pick(SLOPES_ORIGIN);
        break;

      default: // intercepts, from a given slope-intercept line
        p.m = rng.pick(SLOPES_B);
        p.b = rng.nextInt(-8, 9);
        if (p.b === 0) p.b = 4; // avoid a trivial "already at origin" case
        break;
    }

    return p;
  }

  // ---- extra mode 6 (opened only through the "▶ Soru" link): line from its intercepts ----
  const tx = (tr, en) => I18N.tx(tr, en);
  function nz(rng, lo, hi) { let v; do { v = rng.nextInt(lo, hi); } while (v === 0); return v; }
  function makeMode(rng, mode) { let q; do { q = createProblem(rng); } while (q.mode !== mode); return q; }
  function makeIntercepts(rng) { return { mode: 6, ia: nz(rng, -6, 7), ib: nz(rng, -6, 7) }; }
  function interceptStatement(p) {
    return tx(`x-kesimi ${p.ia} ve y-kesimi ${p.ib} olan doğrunun denklemini kesişim formundan yazalım.`, `Let's write the equation of the line with x-intercept ${p.ia} and y-intercept ${p.ib} using the intercept form.`);
  }
  function interceptSteps(p) {
    const a = p.ia, b = p.ib, m = -b / a;
    return [
      tx('── 1) Kesişim formu ──\nx/a + y/b = 1', '── 1) Intercept form ──\nx/a + y/b = 1'),
      `x/${a} + y/${b} = 1`,
      tx(`── 2) Paydaları kaldıralım ──\nHer tarafı ${a}·${b} = ${a * b} ile çarpalım: ${b}x + ${a}y = ${a * b}`, `── 2) Clear the denominators ──\nLet's multiply by ${a}·${b} = ${a * b}: ${b}x + ${a}y = ${a * b}`),
      tx(`── 3) y = mx + b biçimi ──\nm = -${b}/${a} = ${fmt2(m)},  y = ${fmt2(m)}x ${signedTerm(b)}`, `── 3) Slope-intercept form ──\nm = -${b}/${a} = ${fmt2(m)},  y = ${fmt2(m)}x ${signedTerm(b)}`),
      tx(`Kontrol: (${a}, 0) → ${fmt2(m)}·${a} ${signedTerm(b)} = ${fmt2(m * a + b)} ✓`, `Check: (${a}, 0) → ${fmt2(m)}·${a} ${signedTerm(b)} = ${fmt2(m * a + b)} ✓`),
    ];
  }
  function interceptDraw(canvas, p) {
    canvas.setViewport(-10, 10, -8, 8);
    const m = -p.ib / p.ia;
    canvas.addFunction({ evaluator: (x) => m * x + p.ib, color: canvas.accent(), thickness: 3.0 });
    canvas.addMarker({ x: p.ia, y: 0, color: canvas.gold(), radius: 7.0, label: `(${p.ia}, 0)` });
    canvas.addMarker({ x: 0, y: p.ib, color: canvas.gold(), radius: 7.0, label: `(0, ${p.ib})` });
  }

  function solveSteps(p) {
    if (p.mode === 6) return interceptSteps(p);
    const steps = [];

    switch (p.mode) {
      case 0: {
        steps.push(I18N.tx('Nokta-eğim formu: y - y₁ = m(x - x₁)', 'Point-slope form: y - y₁ = m(x - x₁)'));
        steps.push(I18N.tx(`Verilenler: nokta (${p.x1}, ${p.y1}), eğim m = ${fmt2(p.m)}`, `Given: point (${p.x1}, ${p.y1}), slope m = ${fmt2(p.m)}`));
        steps.push(I18N.tx(`Yerine koyalım: y - (${p.y1}) = ${fmt2(p.m)}(x - (${p.x1}))`, `Let's substitute: y - (${p.y1}) = ${fmt2(p.m)}(x - (${p.x1}))`));
        const b = p.y1 - p.m * p.x1;
        steps.push(I18N.tx(`Dağıtıp sadeleştirelim: y = ${fmt2(p.m)}x ${signedTerm(b)}`, `Let's distribute and simplify: y = ${fmt2(p.m)}x ${signedTerm(b)}`));
        break;
      }

      case 1: {
        steps.push(I18N.tx('Eğim-kesim formu: y = mx + b', 'Slope-intercept form: y = mx + b'));
        steps.push(I18N.tx(`Verilenler: eğim m = ${fmt2(p.m)}, y-kesimi b = ${fmt2(p.b)}`, `Given: slope m = ${fmt2(p.m)}, y-intercept b = ${fmt2(p.b)}`));
        steps.push(I18N.tx(`Doğrudan formda yerine koyarız: y = ${fmt2(p.m)}x ${signedTerm(p.b)}`, `We substitute directly into the form: y = ${fmt2(p.m)}x ${signedTerm(p.b)}`));
        steps.push(I18N.tx(`y-kesimi noktası: (0, ${fmt2(p.b)})`, `y-intercept point: (0, ${fmt2(p.b)})`));
        break;
      }

      case 2: {
        steps.push(I18N.tx(`Noktalarımız: A(${p.x1}, ${p.y1}) ve B(${p.x2}, ${p.y2}).`, `Our points are A(${p.x1}, ${p.y1}) and B(${p.x2}, ${p.y2}).`));
        const m = (p.y2 - p.y1) / (p.x2 - p.x1);
        steps.push(I18N.tx(`Önce eğimi hesaplayalım: m = (y₂-y₁)/(x₂-x₁) = (${p.y2}-${p.y1})/(${p.x2}-${p.x1}) = ${fmt2(m)}`, `First, let's compute the slope: m = (y₂-y₁)/(x₂-x₁) = (${p.y2}-${p.y1})/(${p.x2}-${p.x1}) = ${fmt2(m)}`));
        steps.push(I18N.tx(`Nokta-eğim formunu A ile kuralım: y - ${p.y1} = ${fmt2(m)}(x - ${p.x1})`, `Let's set up the point-slope form with A: y - ${p.y1} = ${fmt2(m)}(x - ${p.x1})`));
        const b = p.y1 - m * p.x1;
        steps.push(I18N.tx(`Sadeleştirirsek: y = ${fmt2(m)}x ${signedTerm(b)}`, `Simplifying gives: y = ${fmt2(m)}x ${signedTerm(b)}`));
        break;
      }

      case 3: {
        steps.push(I18N.tx(`Genel form: ${p.generalA}x ${signedTerm(p.generalB, 'y')} = ${p.generalC}`, `General form: ${p.generalA}x ${signedTerm(p.generalB, 'y')} = ${p.generalC}`));
        steps.push(I18N.tx(`y terimini yalnız bırakalım: ${p.generalB}y = ${p.generalC} - ${p.generalA}x`, `Let's isolate the y term: ${p.generalB}y = ${p.generalC} - ${p.generalA}x`));
        const m = -p.generalA / p.generalB;
        const b = p.generalC / p.generalB;
        steps.push(I18N.tx(`Her iki tarafı ${p.generalB} sayısına bölelim: y = ${fmt2(m)}x ${signedTerm(b)}`, `Let's divide both sides by ${p.generalB}: y = ${fmt2(m)}x ${signedTerm(b)}`));
        break;
      }

      case 4: {
        switch (p.specialKind) {
          case 0:
            steps.push(I18N.tx(`Bu doğru x = ${p.specialValue} şeklindedir: her noktasının x-koordinatı aynıdır.`, `This line has the form x = ${p.specialValue}: every point on it has the same x-coordinate.`));
            steps.push(I18N.tx('x = a şeklindeki doğrular DİKEYDİR; eğimleri TANIMSIZDIR.', 'Lines of the form x = a are VERTICAL; their slope is UNDEFINED.'));
            break;
          case 1:
            steps.push(I18N.tx(`Bu doğru y = ${p.specialValue} şeklindedir: her noktasının y-koordinatı aynıdır.`, `This line has the form y = ${p.specialValue}: every point on it has the same y-coordinate.`));
            steps.push(I18N.tx("y = b şeklindeki doğrular YATAYDIR; eğimleri 0'dır.", 'Lines of the form y = b are HORIZONTAL; their slope is 0.'));
            break;
          default:
            steps.push(I18N.tx(`Bu doğru orijinden geçer ve eğimi m = ${fmt2(p.m)}'dir.`, `This line passes through the origin and has slope m = ${fmt2(p.m)}.`));
            steps.push(I18N.tx(`y-kesim formu: y = ${fmt2(p.m)}x + 0 = ${fmt2(p.m)}x  (b = 0 olduğu için orijinden geçer)`, `Slope-intercept form: y = ${fmt2(p.m)}x + 0 = ${fmt2(p.m)}x  (passes through the origin since b = 0)`));
        }
        break;
      }

      default: {
        steps.push(I18N.tx(`Verilen doğru: y = ${fmt2(p.m)}x ${signedTerm(p.b)}`, `Given line: y = ${fmt2(p.m)}x ${signedTerm(p.b)}`));
        const xIntercept = -p.b / p.m;
        steps.push(I18N.tx(`y-kesimi için x = 0 alalım → y = ${fmt2(p.b)}, nokta (0, ${fmt2(p.b)})`, `y-intercept: let's set x = 0 → y = ${fmt2(p.b)}, point (0, ${fmt2(p.b)})`));
        steps.push(I18N.tx(`x-kesimi için y = 0 alalım → 0 = ${fmt2(p.m)}x ${signedTerm(p.b)} → x = ${fmt2(xIntercept)}, nokta (${fmt2(xIntercept)}, 0)`, `x-intercept: let's set y = 0 → 0 = ${fmt2(p.m)}x ${signedTerm(p.b)} → x = ${fmt2(xIntercept)}, point (${fmt2(xIntercept)}, 0)`));
      }
    }

    return steps;
  }

  function draw(canvas, p) {
    if (p.mode === 6) { interceptDraw(canvas, p); return; }
    canvas.setViewport(-10, 10, -8, 8);

    if (p.mode === 4 && p.specialKind === 0) {
      canvas.addGuideLine({ axis: 'vertical', position: p.specialValue, color: canvas.accent() });
      return;
    }

    let m, b;
    switch (p.mode) {
      case 0:
        m = p.m; b = p.y1 - p.m * p.x1;
        canvas.addMarker({ x: p.x1, y: p.y1, color: canvas.gold(), radius: 7.0 });
        break;
      case 1:
        m = p.m; b = p.b;
        break;
      case 2:
        m = (p.y2 - p.y1) / (p.x2 - p.x1);
        b = p.y1 - m * p.x1;
        canvas.addMarker({ x: p.x1, y: p.y1, color: canvas.gold(), radius: 7.0, label: 'A' });
        canvas.addMarker({ x: p.x2, y: p.y2, color: canvas.gold(), radius: 7.0, label: 'B' });
        break;
      case 3:
        m = -p.generalA / p.generalB;
        b = p.generalC / p.generalB;
        break;
      case 4:
        if (p.specialKind === 1) { m = 0; b = p.specialValue; } else { m = p.m; b = 0; }
        break;
      default: {
        m = p.m; b = p.b;
        const xIntercept = -p.b / p.m;
        canvas.addMarker({ x: 0, y: p.b, color: canvas.gold(), radius: 7.0 });
        canvas.addMarker({ x: xIntercept, y: 0, color: canvas.gold(), radius: 7.0 });
      }
    }

    canvas.addFunction({ evaluator: (x) => m * x + b, color: canvas.accent(), thickness: 3.0 });
  }

  Topics.register('numbers', {
    id: 'lineEquation',
    tabTitle: () => I18N.tx('Doğru Denklemleri', 'Equations of Lines'),
    concept: () => I18N.tx(
      [
        "DOĞRU DENKLEMİNİN FORMLARI",
        "• Nokta-eğim formu: y - y₁ = m(x - x₁)   (bir nokta ve eğim biliniyor)",
        "• İki nokta formu: y - y₁ = [(y₂-y₁)/(x₂-x₁)] (x - x₁)   (x₁ ≠ x₂)",
        "• Eğim-kesim formu: y = mx + b   (m eğim, b y-kesimi)",
        "• Kesişim (intercept) formu: x/a + y/b = 1   (x-kesimi a, y-kesimi b; a, b ≠ 0)",
        "• Genel form: Ax + By + C = 0   (A ve B aynı anda 0 olamaz). Bu formda eğim m = -A/B (B ≠ 0), y-kesimi = -C/B, x-kesimi = -C/A (A ≠ 0).",
        "• Dikey doğru: x = a (eğim tanımsız). Yatay doğru: y = b (eğim 0).",
        "",
        "YÖNTEM",
        "1) Önce elimizdeki bilgiye bakalım: (nokta + eğim) mi, (iki nokta) mı, (eğim + y-kesimi) mi?",
        "2) İki nokta verilmişse önce m = (y₂-y₁)/(x₂-x₁) değerini hesaplayalım. x₁ = x₂ ise doğru x = x₁ dikey doğrusudur ve iş biter.",
        "3) Noktalardan birini seçip nokta-eğim formuna yerleştirebiliriz: y - y₁ = m(x - x₁).",
        "4) Parantezi açıp y'yi yalnız bırakırız: y = mx + b. (İstenirse Ax + By + C = 0 biçimine taşıyabilir, kesirli katsayıları tamsayıya çevirebiliriz.)",
        "5) Kontrol için ikinci noktayı denkleme koyabiliriz; denklem sağlanmalıdır.",
        "",
        "MİNİ ÖRNEK",
        "A(1, 2) ve B(3, 8): m = (8-2)/(3-1) = 3. y - 2 = 3(x - 1) → y = 3x - 1. Kontrol: x = 3 → y = 8 ✓. Genel form: 3x - y - 1 = 0. Kesimler: y-kesimi -1, x-kesimi 1/3.",
        "",
        "ÖZEL DURUMLAR / DİKKAT",
        "• Dikey doğrular y = mx + b ile YAZILAMAZ; onlar için x = a kullanılır.",
        "• Nokta-eğim formunda işaret hatası yaygındır: nokta (-2, 5) ise y - 5 = m(x + 2) olur.",
        "• Orijinden geçen doğru: b = 0 → y = mx (kesişim formu kullanılamaz).",
        "• Genel formu bir sabitle çarpmak ya da bölmek aynı doğruyu verir (denklem tek türlü değildir).",
        "• Doğru üzerindeki nokta denklemi sağlar; sağlamıyorsa nokta doğrunun dışındadır.",
        "",
        "HATIRLATMA: 'y-kesimi için x = 0, x-kesimi için y = 0 alınır.'"
      ].join('\n'),
      [
        "FORMS OF A LINE EQUATION",
        "• Point-slope form: y - y₁ = m(x - x₁)   (a point and the slope are known)",
        "• Two-point form: y - y₁ = [(y₂-y₁)/(x₂-x₁)] (x - x₁)   (x₁ ≠ x₂)",
        "• Slope-intercept form: y = mx + b   (m slope, b y-intercept)",
        "• Intercept form: x/a + y/b = 1   (x-intercept a, y-intercept b; a, b ≠ 0)",
        "• General form: Ax + By + C = 0   (A and B not both 0). Here slope m = -A/B (B ≠ 0), y-intercept = -C/B, x-intercept = -C/A (A ≠ 0).",
        "• Vertical line: x = a (slope undefined). Horizontal line: y = b (slope 0).",
        "",
        "METHOD",
        "1) First, let's see what is given: (point + slope), (two points) or (slope + y-intercept)?",
        "2) If two points are given, we first compute m = (y₂-y₁)/(x₂-x₁). If x₁ = x₂ the line is the vertical line x = x₁, and we are done.",
        "3) We can pick one of the points and put it into the point-slope form: y - y₁ = m(x - x₁).",
        "4) We expand and solve for y: y = mx + b. (If needed, we can move it to Ax + By + C = 0 and clear fractions to get integer coefficients.)",
        "5) To check, we substitute the second point; the equation should hold.",
        "",
        "MINI EXAMPLE",
        "A(1, 2) and B(3, 8): m = (8-2)/(3-1) = 3. y - 2 = 3(x - 1) → y = 3x - 1. Check: x = 3 → y = 8 ✓. General form: 3x - y - 1 = 0. Intercepts: y-intercept -1, x-intercept 1/3.",
        "",
        "SPECIAL CASES / PITFALLS",
        "• Vertical lines CANNOT be written as y = mx + b; use x = a.",
        "• Sign errors in point-slope form are common: for the point (-2, 5) it is y - 5 = m(x + 2).",
        "• A line through the origin has b = 0 → y = mx (the intercept form does not apply).",
        "• Multiplying or dividing the general form by a constant gives the same line (the equation is not unique).",
        "• A point on the line satisfies the equation; if it does not, the point is off the line.",
        "",
        "MEMORY AID: 'we set x = 0 for the y-intercept and y = 0 for the x-intercept.'"
      ].join('\n')
    ),
    problemStatement: (p) => {
      if (p.mode === 6) return interceptStatement(p);
      switch (p.mode) {
        case 0:
          return I18N.tx(`Eğimi ${fmt2(p.m)} olan ve P(${p.x1}, ${p.y1}) noktasından geçen doğrunun denklemini y = mx + b biçiminde yazabilir miyiz?`,
            `Can we write the equation of the line with slope ${fmt2(p.m)} through P(${p.x1}, ${p.y1}) in the form y = mx + b?`);
        case 1:
          return I18N.tx(`Eğimi ${fmt2(p.m)} ve y-kesimi ${fmt2(p.b)} olan doğrunun denklemini yazalım; y-eksenini kestiği noktayı da söyleyelim.`,
            `Let's write the equation of the line with slope ${fmt2(p.m)} and y-intercept ${fmt2(p.b)}, and say where it crosses the y-axis.`);
        case 2:
          return I18N.tx(`A(${p.x1}, ${p.y1}) ve B(${p.x2}, ${p.y2}) noktalarından geçen doğrunun denklemini bulalım.`,
            `Let's find the equation of the line through A(${p.x1}, ${p.y1}) and B(${p.x2}, ${p.y2}).`);
        case 3: {
          const g = `${p.generalA}x ${signedTerm(p.generalB, 'y')} = ${p.generalC}`;
          return I18N.tx(`${g} doğrusunu y = mx + b biçiminde yazalım; eğimini ve y-kesimini de söyleyelim.`,
            `Let's write the line ${g} in the form y = mx + b, and give its slope and y-intercept.`);
        }
        case 4:
          switch (p.specialKind) {
            case 0:
              return I18N.tx(`Üzerindeki her noktanın x-koordinatı ${p.specialValue} olan doğrunun denklemini yazalım; eğimi kaç olur?`,
                `Let's write the equation of the line on which every point has x-coordinate ${p.specialValue}. What is its slope?`);
            case 1:
              return I18N.tx(`Üzerindeki her noktanın y-koordinatı ${p.specialValue} olan doğrunun denklemini yazalım; eğimi kaç olur?`,
                `Let's write the equation of the line on which every point has y-coordinate ${p.specialValue}. What is its slope?`);
            default:
              return I18N.tx(`Orijinden geçen ve eğimi ${fmt2(p.m)} olan doğrunun denklemini yazalım.`,
                `Let's write the equation of the line through the origin with slope ${fmt2(p.m)}.`);
          }
        default: {
          const g = `y = ${fmt2(p.m)}x ${signedTerm(p.b)}`;
          return I18N.tx(`${g} doğrusunun x- ve y-eksenlerini kestiği noktaları bulalım.`,
            `Let's find the points where the line ${g} crosses the x- and y-axes.`);
        }
      }
    },
    links: [
      { match: /^• (Nokta-eğim formu|Point-slope form):/, make: (rng) => makeMode(rng, 0) },
      { match: /^• (İki nokta formu|Two-point form):/, make: (rng) => makeMode(rng, 2) },
      { match: /^• (Eğim-kesim formu|Slope-intercept form):/, make: (rng) => makeMode(rng, 1) },
      { match: /^• (Kesişim \(intercept\) formu|Intercept form):/, make: makeIntercepts },
      { match: /^• (Genel form|General form):/, make: (rng) => makeMode(rng, 3) },
      { match: /^• (Dikey doğru|Vertical line):/, make: (rng) => { let q; do { q = makeMode(rng, 4); } while (q.specialKind === 2); return q; } },
      { match: /^• (Orijinden geçen doğru|A line through the origin)/, make: (rng) => { let q; do { q = makeMode(rng, 4); } while (q.specialKind !== 2); return q; } },
    ],
    createProblem,
    solveSteps,
    draw,
    focus: (p) => {
      if (p.mode === 6) return { x: p.ia / 2, y: p.ib / 2 };
      switch (p.mode) {
        case 0: return { x: p.x1, y: p.y1 };
        case 1: return { x: 0, y: p.b };
        case 2: return { x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 };
        case 3: return { x: 0, y: p.generalC / p.generalB };
        case 4: return p.specialKind === 0 ? { x: p.specialValue, y: 0 } : (p.specialKind === 1 ? { x: 0, y: p.specialValue } : { x: 0, y: 0 });
        default: return { x: -p.b / p.m / 2, y: p.b / 2 };
      }
    },
  });
})();
