// Ported from Modules/Preliminaries/ParabolaControl.vb - parabolas: basic parabola y=x^2, y=ax^2
// (direction of opening and width), general parabola y=ax^2+bx+c, axis of symmetry, vertex, axis
// intercepts, and the full graph combining all of these. Examples are always built from the roots
// (two distinct roots, a repeated root, or no real roots) so the numbers stay clean and the
// "no real roots" case shows up naturally.
(function () {
  function signedTerm(value, suffix) {
    suffix = suffix || '';
    return value >= 0 ? `+ ${value}${suffix}` : `- ${Math.abs(value)}${suffix}`;
  }

  function createProblem(rng) {
    const a = [-2, -1, 1, 1, 2][rng.nextInt(0, 5)];
    const mode = rng.nextInt(0, 3);

    switch (mode) {
      case 0: { // two distinct real roots
        const r1 = rng.nextInt(-5, 3);
        let r2;
        do { r2 = rng.nextInt(-2, 6); } while (r2 === r1);
        const b = -a * (r1 + r2);
        const c = a * r1 * r2;
        return { a, b, c };
      }
      case 1: { // repeated root
        const r = rng.nextInt(-4, 5);
        const b = -2 * a * r;
        const c = a * r * r;
        return { a, b, c };
      }
      default: { // no real roots: vertex strictly above the axis (a>0) or below it (a<0)
        const h = rng.nextInt(-4, 5);
        const k = rng.nextInt(1, 6) * Math.sign(a);
        const b = -2 * a * h;
        const c = a * h * h + k;
        return { a, b, c };
      }
    }
  }

  // ---- extra kinds (opened only through the "▶ Soru" links): vertex form, factored form, completing the square, focus/directrix ----
  const tx = (tr, en) => I18N.tx(tr, en);
  const pick = (rng, arr) => arr[rng.nextInt(0, arr.length)];
  function makeVertexForm(rng, extra, aList) {
    const a = pick(rng, aList || [-2, -1, 1, 2]);
    const h = rng.nextInt(-4, 5), k = rng.nextInt(-5, 6);
    return { a, b: -2 * a * h, c: a * h * h + k, extra, h0: h, k0: k };
  }
  function makeFactored(rng) {
    const a = pick(rng, [-2, -1, 1, 2]);
    const r1 = rng.nextInt(-5, 3);
    let r2;
    do { r2 = rng.nextInt(-2, 6); } while (r2 === r1);
    return { a, b: -a * (r1 + r2), c: a * r1 * r2, extra: 'ff', r1: Math.min(r1, r2), r2: Math.max(r1, r2) };
  }
  const coefTerm = (a) => (a === 1 ? '' : (a === -1 ? '-' : String(a)));
  function vfText(p) { return `y = ${coefTerm(p.a)}(x ${signedTerm(-p.h0)})² ${signedTerm(p.k0)}`; }
  function ffText(p) { return `y = ${coefTerm(p.a)}(x ${signedTerm(-p.r1)})(x ${signedTerm(-p.r2)})`; }
  function genText(p) { return `y = ${p.a}x² ${signedTerm(p.b, 'x')} ${signedTerm(p.c)}`; }
  function extraStatement(p) {
    switch (p.extra) {
      case 'vf': return tx(`${vfText(p)} tepe formunu açıp genel forma getirelim; tepe noktasını ve y-kesimini söyleyelim.`, `Let's expand the vertex form ${vfText(p)} into the general form, and give the vertex and the y-intercept.`);
      case 'ff': return tx(`${ffText(p)} çarpan formunu açıp genel forma getirelim; x-kesimlerini ve tepe noktasını bulalım.`, `Let's expand the factored form ${ffText(p)} into the general form, and find the x-intercepts and the vertex.`);
      case 'cts': return tx(`${genText(p)} parabolünü kare tamamlayarak tepe formuna getirelim.`, `Let's use completing the square to write the parabola ${genText(p)} in vertex form.`);
      default: return tx(`${vfText(p)} parabolünün odağını ve doğrultmanını bulalım.`, `Let's find the focus and directrix of the parabola ${vfText(p)}.`);
    }
  }
  function extraSteps(p) {
    const { a, b, c } = p;
    const steps = [];
    if (p.extra === 'vf') {
      steps.push(tx(`── 1) Karesini açalım ──\n(x ${signedTerm(-p.h0)})² = x² ${signedTerm(-2 * p.h0, 'x')} ${signedTerm(p.h0 * p.h0)}`, `── 1) Expand the square ──\n(x ${signedTerm(-p.h0)})² = x² ${signedTerm(-2 * p.h0, 'x')} ${signedTerm(p.h0 * p.h0)}`));
      steps.push(tx(`── 2) a ile çarpıp k'yı ekleyelim ──\n${genText(p)}`, `── 2) Multiply by a and add k ──\n${genText(p)}`));
      steps.push(tx(`Tepe noktası doğrudan okunur: (h, k) = (${p.h0}, ${p.k0})`, `The vertex can be read directly: (h, k) = (${p.h0}, ${p.k0})`));
      steps.push(tx(`y-kesimi: x = 0 → y = ${c}, nokta (0, ${c})`, `y-intercept: x = 0 → y = ${c}, point (0, ${c})`));
      steps.push(tx(`Kontrol: x = ${p.h0} → ${a}·${p.h0}² ${signedTerm(b)}·${p.h0} ${signedTerm(c)} = ${a * p.h0 * p.h0 + b * p.h0 + c} = k ✓`, `Check: x = ${p.h0} → ${a}·${p.h0}² ${signedTerm(b)}·${p.h0} ${signedTerm(c)} = ${a * p.h0 * p.h0 + b * p.h0 + c} = k ✓`));
    } else if (p.extra === 'ff') {
      const h = (p.r1 + p.r2) / 2, k = a * h * h + b * h + c;
      steps.push(tx(`── 1) x-kesimleri ──\nÇarpanlar sıfır: x = ${p.r1}  ve  x = ${p.r2}`, `── 1) x-intercepts ──\nThe factors are zero at x = ${p.r1}  and  x = ${p.r2}`));
      steps.push(tx(`── 2) Çarpanları açalım ──\n(x ${signedTerm(-p.r1)})(x ${signedTerm(-p.r2)}) = x² ${signedTerm(-(p.r1 + p.r2), 'x')} ${signedTerm(p.r1 * p.r2)}`, `── 2) Expand the factors ──\n(x ${signedTerm(-p.r1)})(x ${signedTerm(-p.r2)}) = x² ${signedTerm(-(p.r1 + p.r2), 'x')} ${signedTerm(p.r1 * p.r2)}`));
      steps.push(`${genText(p)}`);
      steps.push(tx(`── 3) Tepe ──\nKöklerin ortası: h = (${p.r1} + ${p.r2})/2 = ${fmt2(h)},  k = f(h) = ${fmt2(k)}  →  tepe (${fmt2(h)}, ${fmt2(k)})`, `── 3) Vertex ──\nMidpoint of the roots: h = (${p.r1} + ${p.r2})/2 = ${fmt2(h)},  k = f(h) = ${fmt2(k)}  →  vertex (${fmt2(h)}, ${fmt2(k)})`));
    } else if (p.extra === 'cts') {
      const h = p.h0, k = p.k0;
      steps.push(tx(`── 1) a'yı parantezine alalım ──\ny = ${a}[x² ${signedTerm(b / a, 'x')}] ${signedTerm(c)}`, `── 1) Factor out a ──\ny = ${a}[x² ${signedTerm(b / a, 'x')}] ${signedTerm(c)}`));
      steps.push(tx(`── 2) Kareyi tamamlayalım ──\n(${b / a}/2)² = ${h * h} ekleyip çıkaralım: y = ${a}[(x ${signedTerm(-h)})² - ${h * h}] ${signedTerm(c)}`, `── 2) Complete the square ──\nLet's add and subtract (${b / a}/2)² = ${h * h}: y = ${a}[(x ${signedTerm(-h)})² - ${h * h}] ${signedTerm(c)}`));
      steps.push(tx(`── 3) Sadeleştirelim ──\ny = ${a}(x ${signedTerm(-h)})² ${signedTerm(c - a * h * h)}`, `── 3) Simplify ──\ny = ${a}(x ${signedTerm(-h)})² ${signedTerm(c - a * h * h)}`));
      steps.push(tx(`Tepe noktası: (h, k) = (${h}, ${k})`, `Vertex: (h, k) = (${h}, ${k})`));
    } else {
      const h = p.h0, k = p.k0, pf = 1 / (4 * a);
      steps.push(tx(`── 1) Parametre ──\np = 1/(4a) = 1/(4·${a}) = ${fmt2(pf)}`, `── 1) The parameter ──\np = 1/(4a) = 1/(4·${a}) = ${fmt2(pf)}`));
      steps.push(tx(`── 2) Odak ──\n(h, k + p) = (${h}, ${k} + (${fmt2(pf)})) = (${h}, ${fmt2(k + pf)})`, `── 2) Focus ──\n(h, k + p) = (${h}, ${k} + (${fmt2(pf)})) = (${h}, ${fmt2(k + pf)})`));
      steps.push(tx(`── 3) Doğrultman ──\ny = k - p = ${k} - (${fmt2(pf)}) = ${fmt2(k - pf)}`, `── 3) Directrix ──\ny = k - p = ${k} - (${fmt2(pf)}) = ${fmt2(k - pf)}`));
      steps.push(tx('Tepe, odak ile doğrultmanın tam ortasındadır.', 'The vertex lies exactly halfway between the focus and the directrix.'));
    }
    return steps;
  }
  function extraDraw(canvas, p) {
    if (p.extra === 'focus') {
      const pf = 1 / (4 * p.a);
      canvas.addMarker({ x: p.h0, y: p.k0 + pf, color: canvas.red(), radius: 6.0, label: tx('Odak', 'Focus') });
      canvas.addGuideLine({ axis: 'horizontal', position: p.k0 - pf, color: canvas.orange() });
    }
  }

  function solveSteps(p) {
    if (p.extra) return extraSteps(p);
    const a = p.a, b = p.b, c = p.c;
    const steps = [
      I18N.tx(`Verilen parabol: y = ${a}x² ${signedTerm(b, 'x')} ${signedTerm(c)}`, `Given parabola: y = ${a}x² ${signedTerm(b, 'x')} ${signedTerm(c)}`),
      I18N.tx(`Açılma yönü: a = ${a} → ${a > 0 ? 'YUKARI açılır (minimum noktası var)' : 'AŞAĞI açılır (maksimum noktası var)'}`, `Direction of opening: a = ${a} → ${a > 0 ? 'opens UPWARD (has a minimum point)' : 'opens DOWNWARD (has a maximum point)'}`),
    ];

    const axisX = -b / (2.0 * a);
    const vertexY = a * axisX * axisX + b * axisX + c;
    steps.push(I18N.tx(`Simetri ekseni: x = -b/(2a) = -(${b})/(2·${a}) = ${fmt2(axisX)}`, `Axis of symmetry: x = -b/(2a) = -(${b})/(2·${a}) = ${fmt2(axisX)}`));
    steps.push(I18N.tx(`Tepe noktası: y'yi x = ${fmt2(axisX)} için hesaplayalım → tepe = (${fmt2(axisX)}, ${fmt2(vertexY)})`, `Vertex: let's compute y at x = ${fmt2(axisX)} → vertex = (${fmt2(axisX)}, ${fmt2(vertexY)})`));
    steps.push(I18N.tx(`y-kesimi: x = 0 alalım → y = ${c}, nokta (0, ${c})`, `y-intercept: let's set x = 0 → y = ${c}, point (0, ${c})`));

    const discriminant = b * b - 4 * a * c;
    steps.push(I18N.tx(`Diskriminant: b² - 4ac = ${b}² - 4·${a}·${c} = ${discriminant}`, `Discriminant: b² - 4ac = ${b}² - 4·${a}·${c} = ${discriminant}`));
    if (discriminant > 0) {
      const sqrtDisc = Math.sqrt(discriminant);
      const root1 = (-b - sqrtDisc) / (2.0 * a);
      const root2 = (-b + sqrtDisc) / (2.0 * a);
      steps.push(I18N.tx(`Diskriminant pozitif → iki farklı gerçek kök: x = ${fmt2(Math.min(root1, root2))}  ve  x = ${fmt2(Math.max(root1, root2))}`, `Discriminant is positive → two distinct real roots: x = ${fmt2(Math.min(root1, root2))}  and  x = ${fmt2(Math.max(root1, root2))}`));
    } else if (discriminant === 0) {
      steps.push(I18N.tx(`Diskriminant sıfır → tek (çakışık) kök: x = ${fmt2(-b / (2.0 * a))}`, `Discriminant is zero → one repeated root: x = ${fmt2(-b / (2.0 * a))}`));
    } else {
      steps.push(I18N.tx('Diskriminant negatif → gerçek kök yok, parabol x eksenini hiç kesmiyor.', 'Discriminant is negative → no real roots, the parabola never crosses the x-axis.'));
    }

    return steps;
  }

  function draw(canvas, p) {
    const a = p.a, b = p.b, c = p.c;
    const axisX = -b / (2.0 * a);
    const vertexY = a * axisX * axisX + b * axisX + c;

    const halfWidth = Math.max(6.0, Math.abs(axisX) + 5.0);
    canvas.setViewport(axisX - halfWidth, axisX + halfWidth, vertexY - halfWidth, vertexY + halfWidth);

    canvas.addFunction({ evaluator: (x) => a * x * x + b * x + c, color: canvas.accent(), thickness: 3.0 });
    if (p.extra) extraDraw(canvas, p);
    canvas.addGuideLine({ axis: 'vertical', position: axisX, color: canvas.gray() });

    canvas.addMarker({ x: axisX, y: vertexY, color: canvas.gold(), shape: 'diamond', radius: 7.0 });
    canvas.addMarker({ x: 0, y: c, color: canvas.blue(), radius: 6.0 });

    // Roots are always recomputed from the current a, b, c (via the discriminant) rather than
    // relying on any stored root fields, which would go stale as soon as a slider changes a, b, or c.
    const discriminant = b * b - 4.0 * a * c;
    if (discriminant >= 0) {
      const sqrtDisc = Math.sqrt(discriminant);
      const root1 = (-b - sqrtDisc) / (2.0 * a);
      const root2 = (-b + sqrtDisc) / (2.0 * a);
      canvas.addMarker({ x: root1, y: 0, color: canvas.green(), radius: 6.0 });
      if (Math.abs(root2 - root1) > 0.0001) {
        canvas.addMarker({ x: root2, y: 0, color: canvas.green(), radius: 6.0 });
      }
    }
  }

  Topics.register('numbers', {
    id: 'parabola',
    tabTitle: () => I18N.tx('Paraboller', 'Parabolas'),
    concept: () => I18N.tx(
      [
        "PARABOLUN BİÇİMLERİ",
        "• Genel form: y = ax² + bx + c   (a ≠ 0)",
        "• Tepe (vertex) formu: y = a(x - h)² + k   (tepe noktası (h, k))",
        "• Çarpan formu: y = a(x - x₁)(x - x₂)   (x₁, x₂ x-kesimleri)",
        "• Tepe noktası: h = -b/(2a), k = f(h) = c - b²/(4a).",
        "• Simetri ekseni: x = h = -b/(2a). Parabol bu eksene göre simetriktir.",
        "• a > 0: YUKARI açılır, tepe MİNİMUM; a < 0: AŞAĞI açılır, tepe MAKSİMUM. |a| büyüdükçe parabol DARALIR.",
        "• y-kesimi: (0, c).",
        "• x-kesimleri: ax² + bx + c = 0 → x = [-b ± √(b² - 4ac)] / (2a). Diskriminant D = b² - 4ac: D > 0 iki kök, D = 0 bir kök (tepe x ekseni üzerinde), D < 0 gerçel kök yok (x eksenini kesmez).",
        "• Odak ve doğrultman (y = a(x-h)² + k için): p = 1/(4a); odak (h, k + p), doğrultman y = k - p. Parabol üzerindeki her nokta odağa ve doğrultmana eşit uzaklıktadır.",
        "",
        "YÖNTEM (grafik/özellikleri bulma)",
        "1) a'nın işaretine bakarak açılma yönünü belirleyebiliriz.",
        "2) h = -b/(2a), sonra k = f(h) ile tepeyi bulabiliriz.",
        "3) y-kesimi c'yi ve (varsa) kökleri hesaplayalım; D'ye de bakalım.",
        "4) Simetri eksenine göre noktaları yansıtarak eğriyi çizebiliriz.",
        "",
        "KARE TAMAMLAMA ile tepe formu: y = ax² + bx + c = a[x² + (b/a)x] + c = a(x + b/(2a))² + c - b²/(4a).",
        "",
        "MİNİ ÖRNEK",
        "y = x² - 4x + 3: a = 1 > 0 (yukarı). h = 4/2 = 2, k = 4 - 8 + 3 = -1 → tepe (2, -1). Tepe formu: y = (x - 2)² - 1. y-kesimi 3. D = 16 - 12 = 4 → x = (4 ± 2)/2 = 1, 3. Odak: p = 1/4 → (2, -3/4), doğrultman y = -5/4.",
        "",
        "DİKKAT EDİLECEKLER",
        "• h = -b/(2a) formülünde a ve b'nin işaretlerine dikkat edelim; (x - h)² formunda h'nin işareti TERS görünür: (x + 3)² → h = -3.",
        "• a < 0 iken k MAKSİMUM değerdir (örneğin atış yüksekliği).",
        "• Köklerin ortası tepenin x'idir: h = (x₁ + x₂)/2.",
        "• x = ay² + by + c biçimi YANA açılan parabol verir ve fonksiyon değildir.",
        "",
        "HATIRLATMA: a işareti = 'gülen yüz (a > 0) / üzgün yüz (a < 0)'."
      ].join('\n'),
      [
        "FORMS OF A PARABOLA",
        "• General form: y = ax² + bx + c   (a ≠ 0)",
        "• Vertex form: y = a(x - h)² + k   (vertex (h, k))",
        "• Factored form: y = a(x - x₁)(x - x₂)   (x₁, x₂ are the x-intercepts)",
        "• Vertex: h = -b/(2a), k = f(h) = c - b²/(4a).",
        "• Axis of symmetry: x = h = -b/(2a). The parabola is symmetric about this line.",
        "• a > 0: opens UPWARD, vertex is a MINIMUM; a < 0: opens DOWNWARD, vertex is a MAXIMUM. As |a| grows the parabola gets NARROWER.",
        "• y-intercept: (0, c).",
        "• x-intercepts: ax² + bx + c = 0 → x = [-b ± √(b² - 4ac)] / (2a). Discriminant D = b² - 4ac: D > 0 two roots, D = 0 one root (vertex on the x-axis), D < 0 no real roots (no x-axis crossing).",
        "• Focus and directrix (for y = a(x-h)² + k): p = 1/(4a); focus (h, k + p), directrix y = k - p. Every point of the parabola is equally far from the focus and the directrix.",
        "",
        "METHOD (graph / properties)",
        "1) The sign of a tells us the opening direction.",
        "2) We find the vertex: h = -b/(2a), then k = f(h).",
        "3) We compute the y-intercept c and the roots (if any), and look at D.",
        "4) We can reflect points across the axis of symmetry and sketch the curve.",
        "",
        "COMPLETING THE SQUARE gives the vertex form: y = ax² + bx + c = a[x² + (b/a)x] + c = a(x + b/(2a))² + c - b²/(4a).",
        "",
        "MINI EXAMPLE",
        "y = x² - 4x + 3: a = 1 > 0 (opens up). h = 4/2 = 2, k = 4 - 8 + 3 = -1 → vertex (2, -1). Vertex form: y = (x - 2)² - 1. y-intercept 3. D = 16 - 12 = 4 → x = (4 ± 2)/2 = 1, 3. Focus: p = 1/4 → (2, -3/4), directrix y = -5/4.",
        "",
        "PITFALLS",
        "• In h = -b/(2a) watch the signs of a and b; in (x - h)² the sign of h looks OPPOSITE: (x + 3)² → h = -3.",
        "• For a < 0, k is the MAXIMUM value (e.g. the peak height of a projectile).",
        "• The midpoint of the roots is the vertex x: h = (x₁ + x₂)/2.",
        "• x = ay² + by + c gives a sideways parabola and is not a function.",
        "",
        "MEMORY AID: sign of a = 'smiley (a > 0) / frown (a < 0)'."
      ].join('\n')
    ),
    problemStatement: (p) => {
      if (p.extra) return extraStatement(p);
      const f = `y = ${p.a}x² ${signedTerm(p.b, 'x')} ${signedTerm(p.c)}`;
      return I18N.tx(
        `${f} parabolünün açılma yönünü, simetri eksenini, tepe noktasını ve eksen kesişimlerini (varsa) bulalım.`,
        `For the parabola ${f}, let's find its direction of opening, axis of symmetry, vertex and axis intercepts (if any).`);
    },
    links: [
      { match: /^• (Genel form|General form):/, make: (rng) => createProblem(rng) },
      { match: /^• (Tepe \(vertex\) formu|Vertex form):/, make: (rng) => makeVertexForm(rng, 'vf') },
      { match: /^• (Çarpan formu|Factored form):/, make: makeFactored },
      { match: /^• (Tepe noktası|Vertex):/, make: (rng) => createProblem(rng) },
      { match: /^• (Simetri ekseni|Axis of symmetry):/, make: (rng) => createProblem(rng) },
      { match: /^• a > 0:/, make: (rng) => createProblem(rng) },
      { match: /^• (y-kesimi|y-intercept):/, make: (rng) => createProblem(rng) },
      { match: /^• (x-kesimleri|x-intercepts):/, make: (rng) => createProblem(rng) },
      { match: /^• (Odak ve doğrultman|Focus and directrix)/, make: (rng) => makeVertexForm(rng, 'focus', [-1, 1]) },
      { match: /^(KARE TAMAMLAMA|COMPLETING THE SQUARE)/, make: (rng) => makeVertexForm(rng, 'cts') },
    ],
    createProblem,
    solveSteps,
    draw,
    focus: (p) => { const ax = -p.b / (2.0 * p.a); return { x: ax, y: p.a * ax * ax + p.b * ax + p.c }; },
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({
        caption: I18N.tx('a (0 olamaz - sıfıra yaklaşınca en yakın işaretli tam sayıya atlar)', 'a (cannot be 0 - near zero it jumps to the nearest signed integer)'),
        min: -4, max: 4,
        get: () => getProblem().a,
        set: (v) => {
          let rounded = Math.round(v);
          if (rounded === 0) rounded = v >= 0 ? 1 : -1;
          const q = getProblem();
          q.a = rounded;
          // the link-only kinds keep their own parameters (h0, k0 / r1, r2): keep b and c consistent with the new a
          if (q.extra === 'vf' || q.extra === 'focus') { q.b = -2 * q.a * q.h0; q.c = q.a * q.h0 * q.h0 + q.k0; }
          else if (q.extra === 'ff') { q.b = -q.a * (q.r1 + q.r2); q.c = q.a * q.r1 * q.r2; }
        },
      });
      h.addSlider({ caption: 'b', min: -12, max: 12,
        get: () => getProblem().b, set: (v) => { const q = getProblem(); if (q.extra === 'vf' || q.extra === 'ff' || q.extra === 'focus') return; q.b = Math.round(v); } });
      h.addSlider({ caption: 'c', min: -12, max: 12,
        get: () => getProblem().c, set: (v) => { const q = getProblem(); if (q.extra === 'vf' || q.extra === 'ff' || q.extra === 'focus') return; q.c = Math.round(v); } });
    },
  });
})();
