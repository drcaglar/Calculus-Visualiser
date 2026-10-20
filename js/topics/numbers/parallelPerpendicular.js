// Ported from Modules/Preliminaries/ParallelPerpendicularControl.vb - parallel and perpendicular
// lines: finding a new line, parallel (same slope) or perpendicular (m₁·m₂ = -1) to a given line,
// that passes through a given point.
(function () {
  const SLOPES = [-3, -2, -1, -0.5, 0.5, 1, 2, 3];

  function signedTerm(value) {
    return value >= 0 ? `+ ${fmt2(value)}` : `- ${fmt2(Math.abs(value))}`;
  }

  function createProblem(rng) {
    const m = rng.pick(SLOPES);
    return {
      givenM: m,
      givenB: rng.nextInt(-6, 7),
      pointX: rng.nextInt(-6, 7),
      pointY: rng.nextInt(-6, 7),
      wantParallel: rng.nextInt(0, 2) === 0,
    };
  }

  // ---- extra kinds (opened only through the "▶ Soru" links): classify two lines, general-form lines, horizontal/vertical lines ----
  const tx = (tr, en) => I18N.tx(tr, en);
  const pickOf = (rng, arr) => arr[rng.nextInt(0, arr.length)];
  const nzInt = (rng, lo, hi) => { let v; do { v = rng.nextInt(lo, hi); } while (v === 0); return v; };
  function baseFields(rng) {
    return { givenM: 1, givenB: 0, pointX: rng.nextInt(-5, 6), pointY: rng.nextInt(-5, 6), wantParallel: true };
  }
  function makeClassify(rng, general, forced) {
    const p = baseFields(rng);
    p.extra = 'cls'; p.general = general;
    p.relation = forced !== undefined ? forced : rng.nextInt(0, 3); // 0 parallel, 1 perpendicular, 2 neither
    if (general) {
      const A1 = nzInt(rng, -4, 5), B1 = nzInt(rng, -4, 5), C1 = rng.nextInt(-6, 7);
      const k = pickOf(rng, [-2, -1, 1, 2]);
      let A2, B2;
      if (p.relation === 0) { A2 = k * A1; B2 = k * B1; }
      else if (p.relation === 1) { A2 = k * B1; B2 = -k * A1; }
      else { A2 = A1 + pickOf(rng, [1, 2]); B2 = B1; if (A1 * A2 + B1 * B2 === 0 || A1 * B2 === A2 * B1) A2 += 3; }
      let C2 = rng.nextInt(-6, 7);
      if (p.relation === 0 && C2 === k * C1) C2 += 1;
      Object.assign(p, { A1, B1, C1, A2, B2, C2 });
      if (B2 === 0 || B1 === 0) return makeClassify(rng, general, forced);
    } else {
      const SL = [-3, -2, -1, -0.5, 0.5, 1, 2, 3];
      const m1 = pickOf(rng, SL);
      const m2 = p.relation === 0 ? m1 : (p.relation === 1 ? -1 / m1 : pickOf(rng, SL.filter((v) => v !== m1 && v !== -1 / m1)));
      const b1 = rng.nextInt(-5, 6);
      let b2 = rng.nextInt(-5, 6);
      if (p.relation === 0 && b2 === b1) b2 += 2;
      Object.assign(p, { m1, b1, m2, b2 });
    }
    return p;
  }
  function makeGenLine(rng) {
    const p = baseFields(rng);
    Object.assign(p, { extra: 'genline', A: nzInt(rng, -4, 5), B: nzInt(rng, -4, 5), C: rng.nextInt(-6, 7), wantParallel: rng.nextInt(0, 2) === 0 });
    return p;
  }
  function makeHV(rng) {
    const p = baseFields(rng);
    Object.assign(p, { extra: 'hv', horizontal: rng.nextInt(0, 2) === 0, c0: rng.nextInt(-5, 6), wantParallel: rng.nextInt(0, 2) === 0 });
    return p;
  }
  const lineText = (A, B, C) => `${A}x ${signedTerm(B)}y ${signedTerm(C)} = 0`;
  function clsLines(p) {
    if (p.general) return { m1: -p.A1 / p.B1, b1: -p.C1 / p.B1, m2: -p.A2 / p.B2, b2: -p.C2 / p.B2 };
    return { m1: p.m1, b1: p.b1, m2: p.m2, b2: p.b2 };
  }
  function clsRelation(p) {
    if (p.general) return p.A1 * p.B2 === p.A2 * p.B1 ? 0 : (p.A1 * p.A2 + p.B1 * p.B2 === 0 ? 1 : 2);
    return p.m1 === p.m2 ? 0 : (p.m1 * p.m2 === -1 ? 1 : 2);
  }
  function extraStatement(p) {
    if (p.extra === 'cls') {
      const l1 = p.general ? lineText(p.A1, p.B1, p.C1) : `y = ${fmt2(p.m1)}x ${signedTerm(p.b1)}`;
      const l2 = p.general ? lineText(p.A2, p.B2, p.C2) : `y = ${fmt2(p.m2)}x ${signedTerm(p.b2)}`;
      return tx(`${l1} ve ${l2} doğruları paralel mi, dik mi, yoksa ikisi de değil mi? Eğimlere bakalım.`, `Are the lines ${l1} and ${l2} parallel, perpendicular, or neither? Let's look at the slopes.`);
    }
    const word = p.wantParallel ? tx('paralel', 'parallel') : tx('dik', 'perpendicular');
    if (p.extra === 'genline') {
      return tx(`${lineText(p.A, p.B, p.C)} doğrusuna ${word} ve P(${p.pointX}, ${p.pointY}) noktasından geçen doğrunun denklemini genel formda yazalım.`, `Let's write, in general form, the equation of the line through P(${p.pointX}, ${p.pointY}) that is ${word} to the line ${lineText(p.A, p.B, p.C)}.`);
    }
    const given = p.horizontal ? `y = ${p.c0}` : `x = ${p.c0}`;
    return tx(`${given} doğrusuna ${word} ve P(${p.pointX}, ${p.pointY}) noktasından geçen doğrunun denklemini bulalım.`, `Let's find the equation of the line through P(${p.pointX}, ${p.pointY}) that is ${word} to the line ${given}.`);
  }
  function extraSteps(p) {
    const steps = [];
    if (p.extra === 'cls') {
      const { m1, m2 } = clsLines(p);
      const rel = clsRelation(p);
      if (p.general) {
        steps.push(tx('── 1) Eğimler (m = -A/B) ──', '── 1) Slopes (m = -A/B) ──'));
        steps.push(`m₁ = -(${p.A1})/(${p.B1}) = ${fmt2(m1)},   m₂ = -(${p.A2})/(${p.B2}) = ${fmt2(m2)}`);
        steps.push(tx(`── 2) Katsayı oranları ──\nA₁B₂ = ${p.A1 * p.B2},  A₂B₁ = ${p.A2 * p.B1},  A₁A₂ + B₁B₂ = ${p.A1 * p.A2 + p.B1 * p.B2}`, `── 2) Coefficient tests ──\nA₁B₂ = ${p.A1 * p.B2},  A₂B₁ = ${p.A2 * p.B1},  A₁A₂ + B₁B₂ = ${p.A1 * p.A2 + p.B1 * p.B2}`));
      } else {
        steps.push(tx('── 1) Eğimler ──', '── 1) Slopes ──'));
        steps.push(`m₁ = ${fmt2(m1)},   m₂ = ${fmt2(m2)}`);
        steps.push(tx(`── 2) Testler ──\nm₁ = m₂ ? ${m1 === m2 ? 'Evet' : 'Hayır'};   m₁·m₂ = ${fmt2(m1 * m2)}`, `── 2) Tests ──\nm₁ = m₂ ? ${m1 === m2 ? 'Yes' : 'No'};   m₁·m₂ = ${fmt2(m1 * m2)}`));
      }
      steps.push(rel === 0
        ? tx('Eğimler eşit (A₁B₂ = A₂B₁) → doğrular PARALELDİR.', 'The slopes are equal (A₁B₂ = A₂B₁) → the lines are PARALLEL.')
        : (rel === 1 ? tx('Eğimler çarpımı -1 → doğrular DİKTİR.', 'The product of the slopes is -1 → the lines are PERPENDICULAR.')
          : tx('Eğimler ne eşit ne de çarpımı -1 → doğrular ne paralel ne dik; eğik kesişirler.', 'The slopes are neither equal nor with product -1 → the lines are neither parallel nor perpendicular; they meet obliquely.')));
    } else if (p.extra === 'genline') {
      const { A, B, C, pointX: px, pointY: py } = p;
      if (p.wantParallel) {
        const C2 = -(A * px + B * py);
        steps.push(tx(`── 1) Paralel kural ──\nAx + By + C' = 0 (A, B aynı kalır)`, `── 1) Parallel rule ──\nAx + By + C' = 0 (A and B stay the same)`));
        steps.push(tx(`── 2) P'yi yerine koyalım ──\n${A}·(${px}) + ${B}·(${py}) + C' = 0  →  C' = ${C2}`, `── 2) Substitute P ──\n${A}·(${px}) + ${B}·(${py}) + C' = 0  →  C' = ${C2}`));
        steps.push(tx(`Sonuç: ${lineText(A, B, C2)}`, `Result: ${lineText(A, B, C2)}`));
      } else {
        const C2 = A * py - B * px;
        steps.push(tx(`── 1) Dik kural ──\nBx - Ay + C'' = 0 (A ile B yer değiştirir, biri işaret değiştirir)`, `── 1) Perpendicular rule ──\nBx - Ay + C'' = 0 (A and B swap, one changes sign)`));
        steps.push(tx(`── 2) P'yi yerine koyalım ──\n${B}·(${px}) - (${A})·(${py}) + C'' = 0  →  C'' = ${C2}`, `── 2) Substitute P ──\n${B}·(${px}) - (${A})·(${py}) + C'' = 0  →  C'' = ${C2}`));
        steps.push(tx(`Sonuç: ${lineText(B, -A, C2)}`, `Result: ${lineText(B, -A, C2)}`));
        steps.push(tx(`Kontrol: A·B + B·(-A) = ${A * B + B * -A} = 0 → dik ✓`, `Check: A·B + B·(-A) = ${A * B + B * -A} = 0 → perpendicular ✓`));
      }
    } else {
      const given = p.horizontal ? `y = ${p.c0}` : `x = ${p.c0}`;
      steps.push(tx(`Verilen doğru ${given}: ${p.horizontal ? 'YATAY (eğim 0)' : 'DİKEY (eğim tanımsız)'}.`, `The given line ${given} is ${p.horizontal ? 'HORIZONTAL (slope 0)' : 'VERTICAL (slope undefined)'}.`));
      steps.push(tx('m·m\' = -1 kuralı yatay-dikey çiftinde çalışmaz; şekle bakarak karar verelim.', 'The rule m·m\' = -1 does not work for a horizontal-vertical pair; we decide from the picture.'));
      const sameKind = p.wantParallel;
      const horizResult = p.horizontal === sameKind;
      steps.push(sameKind
        ? tx(`Paralel doğru aynı yönde kalır: ${p.horizontal ? 'yatay' : 'dikey'}.`, `A parallel line keeps the same direction: ${p.horizontal ? 'horizontal' : 'vertical'}.`)
        : tx(`Dik doğru yön değiştirir: ${p.horizontal ? 'dikey' : 'yatay'}.`, `A perpendicular line turns the direction: ${p.horizontal ? 'vertical' : 'horizontal'}.`));
      steps.push(tx(`P(${p.pointX}, ${p.pointY}) üzerinden geçtiği için: ${horizResult ? 'y = ' + p.pointY : 'x = ' + p.pointX}`, `Since it passes through P(${p.pointX}, ${p.pointY}): ${horizResult ? 'y = ' + p.pointY : 'x = ' + p.pointX}`));
    }
    return steps;
  }
  function extraDraw(canvas, p) {
    canvas.setViewport(-10, 10, -8, 8);
    if (p.extra === 'cls') {
      const l = clsLines(p);
      canvas.addFunction({ evaluator: (x) => l.m1 * x + l.b1, color: canvas.blue(), thickness: 2.5 });
      canvas.addFunction({ evaluator: (x) => l.m2 * x + l.b2, color: canvas.accent(), thickness: 3.0 });
    } else if (p.extra === 'genline') {
      const m = -p.A / p.B, b = -p.C / p.B;
      canvas.addFunction({ evaluator: (x) => m * x + b, color: canvas.blue(), thickness: 2.5 });
      const m2 = p.wantParallel ? m : p.B / p.A;
      canvas.addFunction({ evaluator: (x) => m2 * (x - p.pointX) + p.pointY, color: canvas.accent(), thickness: 3.0 });
      canvas.addMarker({ x: p.pointX, y: p.pointY, color: canvas.gold(), radius: 7.0, label: 'P' });
    } else {
      canvas.addGuideLine({ axis: p.horizontal ? 'horizontal' : 'vertical', position: p.c0, color: canvas.blue() });
      const horizResult = p.horizontal === p.wantParallel;
      canvas.addGuideLine({ axis: horizResult ? 'horizontal' : 'vertical', position: horizResult ? p.pointY : p.pointX, color: canvas.accent() });
      canvas.addMarker({ x: p.pointX, y: p.pointY, color: canvas.gold(), radius: 7.0, label: 'P' });
    }
  }

  function solveSteps(p) {
    if (p.extra) return extraSteps(p);
    const steps = [
      I18N.tx(`Verilen doğru: y = ${fmt2(p.givenM)}x ${signedTerm(p.givenB)}     Verilen nokta: P(${p.pointX}, ${p.pointY})`, `Given line: y = ${fmt2(p.givenM)}x ${signedTerm(p.givenB)}     Given point: P(${p.pointX}, ${p.pointY})`),
      I18N.tx(`İstenen: verilen doğruya ${p.wantParallel ? 'PARALEL' : 'DİK'} ve P'den geçen doğru`, `Required: the line through P that is ${p.wantParallel ? 'PARALLEL' : 'PERPENDICULAR'} to the given line`),
    ];

    let newM;
    if (p.wantParallel) {
      newM = p.givenM;
      steps.push(I18N.tx(`Paralel doğrular aynı eğime sahiptir: yeni eğim m = ${fmt2(p.givenM)}`, `Parallel lines have the same slope: new slope m = ${fmt2(p.givenM)}`));
    } else {
      newM = -1.0 / p.givenM;
      steps.push(I18N.tx(`Dik doğrularda eğimler çarpımı -1'dir: yeni eğim m = -1/${fmt2(p.givenM)} = ${fmt2(newM)}`, `For perpendicular lines the product of slopes is -1: new slope m = -1/${fmt2(p.givenM)} = ${fmt2(newM)}`));
    }

    steps.push(I18N.tx(`Nokta-eğim formunu P ile kuralım: y - ${p.pointY} = ${fmt2(newM)}(x - ${p.pointX})`, `Let's set up the point-slope form with P: y - ${p.pointY} = ${fmt2(newM)}(x - ${p.pointX})`));
    const newB = p.pointY - newM * p.pointX;
    steps.push(I18N.tx(`Sadeleştirince: y = ${fmt2(newM)}x ${signedTerm(newB)}`, `Simplifying: y = ${fmt2(newM)}x ${signedTerm(newB)}`));

    return steps;
  }

  function draw(canvas, p) {
    if (p.extra) { extraDraw(canvas, p); return; }
    canvas.setViewport(-10, 10, -8, 8);

    canvas.addFunction({
      evaluator: (x) => p.givenM * x + p.givenB,
      color: canvas.blue(), thickness: 2.5,
    });

    const newM = p.wantParallel ? p.givenM : -1.0 / p.givenM;
    const newB = p.pointY - newM * p.pointX;
    canvas.addFunction({
      evaluator: (x) => newM * x + newB,
      color: canvas.accent(), thickness: 3.0,
    });

    canvas.addMarker({ x: p.pointX, y: p.pointY, color: canvas.gold(), radius: 7.0, label: 'P' });
  }

  Topics.register('numbers', {
    id: 'parallelPerpendicular',
    tabTitle: () => I18N.tx('Paralel ve Dik Doğrular', 'Parallel and Perpendicular Lines'),
    concept: () => I18N.tx(
      [
        "TEMEL KURALLAR (dikey olmayan doğrular için)",
        "• PARALEL: m₁ = m₂ (eğimler eşit; y-kesimleri farklıysa doğrular farklıdır, b₁ = b₂ ise aynı doğrudur).",
        "• DİK: m₁ · m₂ = -1, yani m₂ = -1/m₁ (ters çevir, işareti değiştir).",
        "• Ne paralel ne dik: eğimler eşit değil ve çarpım -1 değil (doğrular eğik kesişir).",
        "• Genel formda: A₁x + B₁y + C₁ = 0 ve A₂x + B₂y + C₂ = 0 için paralellik A₁B₂ = A₂B₁, diklik A₁A₂ + B₁B₂ = 0 koşuludur (dikey/yatay doğruları da kapsar).",
        "• Doğru Ax + By + C = 0 ise: paralel doğrular Ax + By + C' = 0; dik doğrular Bx - Ay + C'' = 0 biçimindedir.",
        "",
        "YÖNTEM (P noktasından geçen ve verilen doğruya paralel / dik doğru)",
        "1) Önce verilen doğrunun eğimini bulalım (gerekirse y = mx + b biçimine getirebiliriz).",
        "2) Paralel için m' = m; dik için m' = -1/m.",
        "3) Nokta-eğim formunu yazalım: y - y_P = m'(x - x_P).",
        "4) Düzenleyip istenen forma getirelim; kontrol için P'yi denkleme koyabiliriz.",
        "",
        "MİNİ ÖRNEK",
        "Doğru: 2x + 4y = 8 → y = -x/2 + 2, m = -1/2. P(3, 1) noktasından geçen:",
        "• Paralel: m' = -1/2 → y - 1 = -(1/2)(x - 3) → y = -x/2 + 5/2.",
        "• Dik: m' = 2 → y - 1 = 2(x - 3) → y = 2x - 5.",
        "Kontrol: (-1/2)(2) = -1 ✓.",
        "",
        "ÖZEL DURUMLAR / DİKKAT",
        "• Yatay doğru (m = 0) ⟂ dikey doğru (x = a): m·m' = -1 kuralı çalışmaz, çünkü dikeyin eğimi tanımsızdır; bu çifti ayrıca aklımızda tutalım.",
        "• İki dikey doğru (x = a ve x = c) paraleldir.",
        "• -1/m'de işareti değiştirmeyi unutmak ('sadece ters çevirmek') en sık hatadır: 2/3 için dik eğim -3/2'dir, 3/2 değil.",
        "• Paralel doğrular arasındaki uzaklık sabittir; dik doğrular 90° ile kesişir.",
        "",
        "HATIRLATMA: paralel = 'aynı eğim', dik = 'ters çevir ve işareti değiştir'."
      ].join('\n'),
      [
        "BASIC RULES (for non-vertical lines)",
        "• PARALLEL: m₁ = m₂ (equal slopes; the lines are distinct if the y-intercepts differ, identical if b₁ = b₂).",
        "• PERPENDICULAR: m₁ · m₂ = -1, i.e. m₂ = -1/m₁ (flip and change the sign).",
        "• Neither: slopes are unequal and their product is not -1 (the lines intersect obliquely).",
        "• In general form: for A₁x + B₁y + C₁ = 0 and A₂x + B₂y + C₂ = 0, parallel means A₁B₂ = A₂B₁ and perpendicular means A₁A₂ + B₁B₂ = 0 (this also covers vertical/horizontal lines).",
        "• If the line is Ax + By + C = 0: parallels are Ax + By + C' = 0; perpendiculars are Bx - Ay + C'' = 0.",
        "",
        "METHOD (line through P parallel / perpendicular to a given line)",
        "1) First, let's find the slope of the given line (we can rewrite it as y = mx + b if needed).",
        "2) Parallel: m' = m; perpendicular: m' = -1/m.",
        "3) Then we write the point-slope form: y - y_P = m'(x - x_P).",
        "4) We simplify to the requested form and can check by substituting P.",
        "",
        "MINI EXAMPLE",
        "Line: 2x + 4y = 8 → y = -x/2 + 2, m = -1/2. Through P(3, 1):",
        "• Parallel: m' = -1/2 → y - 1 = -(1/2)(x - 3) → y = -x/2 + 5/2.",
        "• Perpendicular: m' = 2 → y - 1 = 2(x - 3) → y = 2x - 5.",
        "Check: (-1/2)(2) = -1 ✓.",
        "",
        "SPECIAL CASES / PITFALLS",
        "• Horizontal line (m = 0) ⟂ vertical line (x = a): the rule m·m' = -1 does not apply because a vertical slope is undefined; remember this pair separately.",
        "• Two vertical lines (x = a and x = c) are parallel.",
        "• Forgetting the sign change in -1/m (only flipping) is the most common error: for 2/3 the perpendicular slope is -3/2, not 3/2.",
        "• Parallel lines stay a constant distance apart; perpendicular lines meet at 90°.",
        "",
        "MEMORY AID: parallel = 'same slope', perpendicular = 'flip and change the sign'."
      ].join('\n')
    ),
    problemStatement: (p) => {
      if (p.extra) return extraStatement(p);
      const line = `y = ${fmt2(p.givenM)}x ${signedTerm(p.givenB)}`;
      return I18N.tx(
        `${line} doğrusuna ${p.wantParallel ? 'paralel' : 'dik'} ve P(${p.pointX}, ${p.pointY}) noktasından geçen doğrunun denklemini bulalım.`,
        `Let's find the equation of the line through P(${p.pointX}, ${p.pointY}) that is ${p.wantParallel ? 'parallel' : 'perpendicular'} to the line ${line}.`);
    },
    links: [
      { match: /^• (PARALEL|PARALLEL):/, make: (rng) => { const q = createProblem(rng); q.wantParallel = true; return q; } },
      { match: /^• (DİK|PERPENDICULAR):/, make: (rng) => { const q = createProblem(rng); q.wantParallel = false; return q; } },
      { match: /^• (Ne paralel ne dik|Neither):/, make: (rng) => makeClassify(rng, rng.nextInt(0, 2) === 0, 2) },
      { match: /^• (Genel formda|In general form)/, make: (rng) => makeClassify(rng, true) },
      { match: /^• (Doğru Ax \+ By \+ C = 0 ise|If the line is Ax \+ By \+ C = 0)/, make: makeGenLine },
      { match: /^• (Yatay doğru|Horizontal line)/, make: makeHV },
    ],
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: p.pointX, y: p.pointY }),
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({
        caption: I18N.tx('Verilen doğrunun eğimi (m, 0 olamaz)', 'Slope of the given line (m, cannot be 0)'),
        min: -5, max: 5,
        get: () => getProblem().givenM,
        set: (v) => {
          if (Math.abs(v) < 0.25) v = v >= 0 ? 0.25 : -0.25;
          getProblem().givenM = v;
        },
      });
      h.addSlider({
        caption: I18N.tx('Verilen doğrunun y-kesimi (b)', 'y-intercept of the given line (b)'),
        min: -8, max: 8,
        get: () => getProblem().givenB,
        set: (v) => { getProblem().givenB = Math.round(v * 10) / 10; },
      });
      h.addSlider({
        caption: I18N.tx('P noktası - x', 'Point P - x'), min: -8, max: 8,
        get: () => getProblem().pointX, set: (v) => { getProblem().pointX = Math.round(v); },
      });
      h.addSlider({
        caption: I18N.tx('P noktası - y', 'Point P - y'), min: -8, max: 8,
        get: () => getProblem().pointY, set: (v) => { getProblem().pointY = Math.round(v); },
      });
      h.addCheckbox({
        caption: I18N.tx('Paralel doğru istiyorum (işaretsiz = dik)', 'I want a parallel line (unchecked = perpendicular)'),
        get: () => getProblem().wantParallel,
        set: (v) => { getProblem().wantParallel = v; },
      });
    },
  });
})();
