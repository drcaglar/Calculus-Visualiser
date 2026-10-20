// Ported from Modules/Preliminaries/QuadraticInequalityControl.vb - (x - r1)(x - r2) op 0 style
// inequalities solved with a sign chart. The same roots and opening direction drive both the
// algebraic steps and the graph, so the sign chart's origin is visible.
(function () {
  // Local alpha helper mirroring graph.js's internal _withAlpha, needed here because the VB
  // source alternates region opacity (70/255 vs 15/255) to shade the satisfying/non-satisfying
  // sign-chart bands.
  function withAlpha(cssColor, alpha) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(cssColor).trim());
    if (!m) return cssColor;
    const r = parseInt(m[1].substr(0, 2), 16), g = parseInt(m[1].substr(2, 2), 16), b = parseInt(m[1].substr(4, 2), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function signedTerm(value) {
    return value >= 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
  }

  function createProblem(rng) {
    const r1 = rng.nextInt(-6, 4);
    let r2;
    do { r2 = rng.nextInt(-2, 8); } while (r2 === r1);

    const ops = ['<', '<=', '>', '>='];
    return {
      rootLeft: Math.min(r1, r2),
      rootRight: Math.max(r1, r2),
      opensUpward: rng.nextInt(0, 2) === 0,
      op: ops[rng.nextInt(0, ops.length)],
    };
  }

  // ---- extra kinds (opened only through the "▶ Soru" links): expanded form, D = 0, D < 0, x² vs constant ----
  const tx = (tr, en) => I18N.tx(tr, en);
  const OPS = ['<', '<=', '>', '>='];
  const pickOp = (rng) => OPS[rng.nextInt(0, OPS.length)];
  function makeWhere(rng, test) { let q; do { q = createProblem(rng); } while (!test(q)); return q; }
  function makeExpanded(rng) {
    const q = createProblem(rng);
    q.opensUpward = true;
    q.extra = 'exp';
    return q;
  }
  function makeSquare(rng) {
    const k = rng.nextInt(2, 7);
    return { rootLeft: -k, rootRight: k, opensUpward: true, op: pickOp(rng), extra: 'sq', k };
  }
  function makeDZero(rng) {
    const r = rng.nextInt(-5, 6);
    return { rootLeft: r, rootRight: r, opensUpward: rng.nextInt(0, 2) === 0, op: pickOp(rng), extra: 'd0', r };
  }
  function makeDNeg(rng) {
    return { rootLeft: -1, rootRight: 1, opensUpward: rng.nextInt(0, 2) === 0, op: pickOp(rng), extra: 'dneg', q: rng.nextInt(1, 7) };
  }
  const sgn = (p) => (p.opensUpward ? 1 : -1);
  function holdsSign(value, op) { return op === '<' ? value < 0 : (op === '<=' ? value <= 0 : (op === '>' ? value > 0 : value >= 0)); }
  function extraText(p) {
    switch (p.extra) {
      case 'exp': return `x² ${signedTerm(-(p.rootLeft + p.rootRight), 'x')} ${signedTerm(p.rootLeft * p.rootRight)} ${p.op} 0`;
      case 'sq': return `x² ${p.op} ${p.k * p.k}`;
      case 'd0': return `${p.opensUpward ? '' : '-'}(x ${signedTerm(-p.r)})² ${p.op} 0`;
      default: return `${p.opensUpward ? 'x² + ' + p.q : '-x² - ' + p.q} ${p.op} 0`;
    }
  }
  function extraStatement(p) {
    return tx(`${extraText(p)} eşitsizliğini çözüp aralık olarak yazalım.`, `Let's solve the inequality ${extraText(p)} and write the answer as an interval.`);
  }
  function degenerateResult(p) {
    // returns 'all', 'none', 'except' or 'point'
    if (p.extra === 'd0') {
      const s = sgn(p);
      if (s > 0) return p.op === '>=' ? 'all' : (p.op === '>' ? 'except' : (p.op === '<=' ? 'point' : 'none'));
      return p.op === '<=' ? 'all' : (p.op === '<' ? 'except' : (p.op === '>=' ? 'point' : 'none'));
    }
    return holdsSign(sgn(p) * (1 + 0), p.op) ? 'all' : 'none'; // sign of the always-nonzero expression
  }
  function extraSteps(p) {
    const lo = p.rootLeft, hi = p.rootRight;
    if (p.extra === 'exp' || p.extra === 'sq') {
      const factored = `(x ${signedTerm(-lo)})(x ${signedTerm(-hi)})`;
      const pre = p.extra === 'exp'
        ? [tx(`── 1) Çarpanlarına ayıralım ──\nÇarpımı ${lo * hi}, toplamı ${lo + hi} olan iki sayı: ${lo} ve ${hi}  →  ${extraText(p).replace(/ [<>]=? 0$/, '')} = ${factored}`, `── 1) Factor ──\nTwo numbers with product ${lo * hi} and sum ${lo + hi}: ${lo} and ${hi}  →  ${extraText(p).replace(/ [<>]=? 0$/, '')} = ${factored}`)]
        : [tx(`── 1) Her şeyi bir tarafa alıp çarpanlayalım ──\nx² - ${p.k * p.k} ${p.op} 0  →  ${factored} ${p.op} 0 (iki kare farkı)`, `── 1) Move everything to one side and factor ──\nx² - ${p.k * p.k} ${p.op} 0  →  ${factored} ${p.op} 0 (difference of squares)`)];
      const base = solveSteps({ rootLeft: lo, rootRight: hi, opensUpward: true, op: p.op });
      if (p.extra === 'sq') base.push(tx(`Dikkat: x² > ${p.k * p.k} demek x > ${p.k} DEĞİL; x² = ${p.k * p.k} için x = ±${p.k} iki kök vardır.`, `Careful: x² > ${p.k * p.k} does not mean just x > ${p.k}; x² = ${p.k * p.k} has two roots x = ±${p.k}.`));
      return pre.concat(base);
    }
    const steps = [];
    const res = degenerateResult(p);
    const resText = { all: 'ℝ = (-∞, ∞)', none: '∅', except: `ℝ \\ {${p.r}} = (-∞, ${p.r}) ∪ (${p.r}, ∞)`, point: `{${p.r}}` }[res];
    if (p.extra === 'd0') {
      steps.push(tx(`Verilen eşitsizlik: ${extraText(p)}`, `Given inequality: ${extraText(p)}`));
      steps.push(tx(`── 1) Kök ──\n(x ${signedTerm(-p.r)})² = 0 → tek (çift katlı) kök x = ${p.r};  D = 0`, `── 1) The root ──\n(x ${signedTerm(-p.r)})² = 0 → one double root x = ${p.r};  D = 0`));
      steps.push(tx(`── 2) İşaret ──\nBir kare hiçbir zaman negatif olmaz: (x ${signedTerm(-p.r)})² ≥ 0, yalnızca x = ${p.r} için 0 olur. ${p.opensUpward ? '' : 'Başındaki eksi işaretiyle ifade ≤ 0 olur.'}`, `── 2) Sign ──\nA square is never negative: (x ${signedTerm(-p.r)})² ≥ 0, and equals 0 only at x = ${p.r}. ${p.opensUpward ? '' : 'With the leading minus the expression is ≤ 0.'}`));
      steps.push(tx(`Sonuç: x ∈ ${resText}`, `Result: x ∈ ${resText}`));
    } else {
      steps.push(tx(`Verilen eşitsizlik: ${extraText(p)}`, `Given inequality: ${extraText(p)}`));
      steps.push(tx(`── 1) Diskriminant ──\nx² = -${p.q} gerçek kök vermez: D = 0² - 4·1·${p.q} = ${-4 * p.q} < 0`, `── 1) Discriminant ──\nx² = -${p.q} has no real root: D = 0² - 4·1·${p.q} = ${-4 * p.q} < 0`));
      steps.push(tx(`── 2) İşaret ──\nx² + ${p.q} ≥ ${p.q} > 0 olduğundan ${p.opensUpward ? 'x² + ' + p.q : '-x² - ' + p.q} her x için ${p.opensUpward ? 'POZİTİFTİR' : 'NEGATİFTİR'}.`, `── 2) Sign ──\nSince x² + ${p.q} ≥ ${p.q} > 0, the expression ${p.opensUpward ? 'x² + ' + p.q : '-x² - ' + p.q} is ${p.opensUpward ? 'POSITIVE' : 'NEGATIVE'} for every x.`));
      steps.push(res === 'all' ? tx(`'${p.op} 0' her x için doğrudur: x ∈ ℝ.`, `'${p.op} 0' is true for every x: x ∈ ℝ.`) : tx(`'${p.op} 0' hiçbir x için doğru değildir: x ∈ ∅.`, `'${p.op} 0' is true for no x: x ∈ ∅.`));
    }
    return steps;
  }
  function extraDraw(canvas, p) {
    if (p.extra === 'exp' || p.extra === 'sq') { draw(canvas, { rootLeft: p.rootLeft, rootRight: p.rootRight, opensUpward: true, op: p.op }); return; }
    const s = sgn(p);
    const c = p.extra === 'd0' ? p.r : 0;
    const q = p.extra === 'dneg' ? p.q : 0;
    canvas.setViewport(c - 6, c + 6, -6, 6);
    canvas.addFunction({ evaluator: (x) => s * 0.3 * ((x - c) * (x - c) + q), color: canvas.accent(), thickness: 3.0 });
    const res = degenerateResult(p);
    if (res === 'all' || res === 'except') canvas.addRegion({ xMin: c - 6, xMax: c + 6, color: withAlpha(canvas.gold(), 70 / 255) });
    if (p.extra === 'd0') canvas.addMarker({ x: c, y: 0, color: canvas.red(), radius: 7.0, hollow: res === 'except' || res === 'none' });
  }

  function solveSteps(p) {
    if (p.extra) return extraSteps(p);
    const steps = [];
    const lo = Math.min(p.rootLeft, p.rootRight);
    const hi = Math.max(p.rootLeft, p.rootRight);
    const expressionText = `${p.opensUpward ? '' : '-'}(x ${signedTerm(-lo)})(x ${signedTerm(-hi)})`;

    steps.push(I18N.tx(`Verilen eşitsizlik: ${expressionText} ${p.op} 0`, `Given inequality: ${expressionText} ${p.op} 0`));
    steps.push(I18N.tx(`Kökler: x = ${lo} ve x = ${hi} (çarpanlardan doğrudan okunabilir)`, `Roots: x = ${lo} and x = ${hi} (read directly from the factors)`));
    steps.push(I18N.tx(
      `Bu iki kök sayı doğrusunu üç bölgeye ayırır: x < ${lo},  ${lo} < x < ${hi},  x > ${hi}`,
      `These two roots split the number line into three regions: x < ${lo},  ${lo} < x < ${hi},  x > ${hi}`
    ));

    const midValue = (lo + hi) / 2.0;
    const outsideSign = p.opensUpward ? I18N.tx('pozitif (+)', 'positive (+)') : I18N.tx('negatif (−)', 'negative (−)');
    const insideSign = p.opensUpward ? I18N.tx('negatif (−)', 'negative (−)') : I18N.tx('pozitif (+)', 'positive (+)');
    steps.push(I18N.tx(
      `Parabol ${p.opensUpward ? 'yukarı' : 'aşağı'} açıldığı için: köklerin DIŞINDA ifade ${outsideSign}, ARASINDA (${lo} ile ${hi} arası, örn. x = ${fmt2(midValue)}) ifade ${insideSign}.`,
      `Since the parabola opens ${p.opensUpward ? 'upward' : 'downward'}: OUTSIDE the roots the expression is ${outsideSign}, BETWEEN them (between ${lo} and ${hi}, e.g. x = ${fmt2(midValue)}) it is ${insideSign}.`
    ));

    let solutionText;
    switch (p.op) {
      case '<':
        solutionText = p.opensUpward ? `(${lo}, ${hi})` : `(-∞, ${lo}) ∪ (${hi}, ∞)`;
        break;
      case '<=':
        solutionText = p.opensUpward ? `[${lo}, ${hi}]` : `(-∞, ${lo}] ∪ [${hi}, ∞)`;
        break;
      case '>':
        solutionText = p.opensUpward ? `(-∞, ${lo}) ∪ (${hi}, ∞)` : `(${lo}, ${hi})`;
        break;
      default:
        solutionText = p.opensUpward ? `(-∞, ${lo}] ∪ [${hi}, ∞)` : `[${lo}, ${hi}]`;
    }
    steps.push(I18N.tx(`'${p.op} 0' koşulunu sağlayan bölgeleri alalım: x ∈ ${solutionText}`, `Let's select the regions satisfying '${p.op} 0': x ∈ ${solutionText}`));

    return steps;
  }

  function draw(canvas, p) {
    if (p.extra) { extraDraw(canvas, p); return; }
    const lo = Math.min(p.rootLeft, p.rootRight);
    const hi = Math.max(p.rootLeft, p.rootRight);
    const sign = p.opensUpward ? 1.0 : -1.0;
    const scale = 0.3;
    const evaluator = (x) => {
      const v = sign * scale * (x - lo) * (x - hi);
      return isFinite(v) ? v : NaN;
    };

    const halfWidth = Math.max(6.0, (hi - lo) * 1.2 + 3.0);
    const xMin = lo - halfWidth * 0.4;
    const xMax = hi + halfWidth * 0.4;
    canvas.setViewport(xMin, xMax, -6, 6);
    canvas.addFunction({ evaluator, color: canvas.accent(), thickness: 3.0 });

    const isClosed = (p.op === '<=' || p.op === '>=');
    const satisfiesOutside = (p.op === '>' || p.op === '>=') === p.opensUpward;
    const gold = canvas.gold();

    canvas.addRegion({ xMin, xMax: lo, color: withAlpha(gold, satisfiesOutside ? 70 / 255 : 15 / 255) });
    canvas.addRegion({ xMin: lo, xMax: hi, color: withAlpha(gold, satisfiesOutside ? 15 / 255 : 70 / 255) });
    canvas.addRegion({ xMin: hi, xMax, color: withAlpha(gold, satisfiesOutside ? 70 / 255 : 15 / 255) });

    canvas.addMarker({ x: lo, y: 0, color: canvas.red(), radius: 7.0, hollow: !isClosed });
    canvas.addMarker({ x: hi, y: 0, color: canvas.red(), radius: 7.0, hollow: !isClosed });
  }

  Topics.register('numbers', {
    id: 'quadraticInequality',
    tabTitle: () => I18N.tx('İkinci Dereceden Eşitsizlikler', 'Quadratic Inequalities'),
    concept: () => I18N.tx(
      "TANIM: ax² + bx + c > 0 (ya da <, ≥, ≤), a ≠ 0. İfadenin grafiği bir parabol: a > 0 ise YUKARI,\n   a < 0 ise AŞAĞI açılır. Çözüm, parabolün x ekseninin üstünde/altında kaldığı x değerleridir.\n\nKÖKLER: ax² + bx + c = 0 için  x = (-b ± √D) / (2a),  D = b² - 4ac  (diskriminant)\n   D > 0: iki farklı kök    D = 0: tek (çift katlı) kök    D < 0: reel kök YOK\n\nYÖNTEM\n   1) Tüm terimleri bir tarafa toplayıp diğer tarafı 0 yapabiliriz. (a negatifse -1 ile çarpıp işareti çevirmek işi kolaylaştırır.)\n   2) Çarpanlara ayırarak ya da kök formülüyle kökleri bulabiliriz: x₁ < x₂.\n   3) Kökleri sayı doğrusuna yazarsak doğru bölgelere ayrılır.\n   4) Her bölgeden bir TEST NOKTASI seçip ifadenin işaretine bakarız (işaret çizelgesi).\n   5) İstenen işarete uyan bölgeleri alırız. ≤ ya da ≥ ise kökler DAHİLDİR (köşeli parantez).\n   6) Sonucu aralık gösterimiyle yazarız.\n\nÖZET (a > 0 ve D > 0 için, kökler x₁ < x₂)\n   ax²+bx+c > 0  =>  x < x₁  veya  x > x₂   (köklerin DIŞINDA)   (-∞, x₁) ∪ (x₂, ∞)\n   ax²+bx+c < 0  =>  x₁ < x < x₂            (köklerin ARASINDA)  (x₁, x₂)\n   a < 0 ise durum TERSİNE döner.\n\nÖZEL DURUMLAR / SIK HATALAR\n   - D = 0 (örn. (x-2)² ): ≥ 0 her x için doğru (ℝ); > 0 için x ≠ 2 (ℝ \\ {2}); ≤ 0 için sadece x = 2;\n     < 0 için çözüm yok.\n   - D < 0 ve a > 0 (örn. x² + 1): ifade HER ZAMAN pozitif; > 0 için çözüm ℝ, < 0 için çözüm yok.\n   - Eşitsizliği x'e bölmemek daha güvenlidir (x negatif olabilir, kök kaybolur); bunun yerine x çarpan olarak ayrılır.\n   - x² > 9 demek x > 3 DEMEK DEĞİLDİR: x < -3 veya x > 3. x² < 9 ise -3 < x < 3.\n   - Kökler bulunmadan işaret tahmin edilmez; ≥ / ≤ durumunda uç noktalar da eklenir.\n\nMİNİ ÖRNEK: x² - x - 6 < 0.\n   Çarpanlara ayıralım: (x - 3)(x + 2) < 0  =>  kökler x = -2 ve x = 3.\n   a = 1 > 0 (yukarı açılır) ve '< 0' istenir  =>  köklerin ARASI.\n   Çözüm: (-2, 3). Kontrol: x = 0  =>  -6 < 0 doğru; x = 4  =>  6 < 0 yanlış.",
      "DEFINITION: ax² + bx + c > 0 (or <, ≥, ≤), a ≠ 0. The graph is a parabola: it opens UPWARD if a > 0,\n   DOWNWARD if a < 0. The solution is the set of x values where the parabola lies above/below the x-axis.\n\nROOTS: for ax² + bx + c = 0,  x = (-b ± √D) / (2a),  D = b² - 4ac  (discriminant)\n   D > 0: two distinct roots    D = 0: one (double) root    D < 0: NO real roots\n\nMETHOD\n   1) We can move all terms to one side so the other side is 0. (If a is negative, multiplying by -1 and flipping the sign helps.)\n   2) We factor or use the quadratic formula to find the roots: x₁ < x₂.\n   3) We mark the roots on the number line; it splits into regions.\n   4) We pick a TEST POINT in each region and look at the sign of the expression (sign chart).\n   5) We take the regions matching the required sign. For ≤ or ≥ the roots ARE included (square brackets).\n   6) We write the result in interval notation.\n\nSUMMARY (for a > 0 and D > 0, roots x₁ < x₂)\n   ax²+bx+c > 0  =>  x < x₁  or  x > x₂   (OUTSIDE the roots)   (-∞, x₁) ∪ (x₂, ∞)\n   ax²+bx+c < 0  =>  x₁ < x < x₂          (BETWEEN the roots)   (x₁, x₂)\n   If a < 0 the situation is REVERSED.\n\nSPECIAL CASES / COMMON PITFALLS\n   - D = 0 (e.g. (x-2)² ): ≥ 0 is true for every x (ℝ); > 0 gives x ≠ 2 (ℝ \\ {2}); ≤ 0 gives only x = 2;\n     < 0 has no solution.\n   - D < 0 and a > 0 (e.g. x² + 1): the expression is ALWAYS positive; > 0 gives ℝ, < 0 has no solution.\n   - It is safer not to divide the inequality by x (x may be negative, and a root is lost); we factor x out instead.\n   - x² > 9 does NOT mean x > 3: it means x < -3 or x > 3. And x² < 9 means -3 < x < 3.\n   - Signs are not guessed before the roots are found; for ≥ / ≤ the endpoints are included.\n\nMINI EXAMPLE: x² - x - 6 < 0.\n   Let's factor: (x - 3)(x + 2) < 0  =>  roots x = -2 and x = 3.\n   a = 1 > 0 (opens upward) and '< 0' is required  =>  BETWEEN the roots.\n   Solution: (-2, 3). Check: x = 0  =>  -6 < 0 true; x = 4  =>  6 < 0 false."
    ),
    problemStatement: (p) => {
      if (p.extra) return extraStatement(p);
      const lo = Math.min(p.rootLeft, p.rootRight);
      const hi = Math.max(p.rootLeft, p.rootRight);
      const text = `${p.opensUpward ? '' : '-'}(x ${signedTerm(-lo)})(x ${signedTerm(-hi)}) ${p.op} 0`;
      return I18N.tx(`${text} eşitsizliğini işaret çizelgesiyle çözebilir miyiz?`, `Can we solve the inequality ${text} with a sign chart?`);
    },
    links: [
      { match: /^(KÖKLER|ROOTS):/, make: (rng) => createProblem(rng) },
      { match: /^\s*2\) (Çarpanlara ayırarak|We factor or use)/, make: makeExpanded },
      { match: /^\s*ax²\+bx\+c > 0  =>/, make: (rng) => { const q = makeWhere(rng, (r) => r.opensUpward); q.op = rng.nextInt(0, 2) === 0 ? '>' : '>='; return q; } },
      { match: /^\s*ax²\+bx\+c < 0  =>/, make: (rng) => { const q = makeWhere(rng, (r) => r.opensUpward); q.op = rng.nextInt(0, 2) === 0 ? '<' : '<='; return q; } },
      { match: /^\s*(a < 0 ise durum TERSİNE döner|If a < 0 the situation is REVERSED)/, make: (rng) => makeWhere(rng, (r) => !r.opensUpward) },
      { match: /^\s*- D = 0 /, make: makeDZero },
      { match: /^\s*- (D < 0 ve a > 0|D < 0 and a > 0)/, make: makeDNeg },
      { match: /^\s*- (x² > 9 demek|x² > 9 does NOT)/, make: makeSquare },
    ],
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: (p.rootLeft + p.rootRight) / 2, y: 0 }),
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({
        caption: I18N.tx('Kök 1 (r1)', 'Root 1 (r1)'), min: -8, max: 6,
        get: () => getProblem().rootLeft,
        set: (v) => { getProblem().rootLeft = Math.round(v); },
      });
      h.addSlider({
        caption: I18N.tx('Kök 2 (r2)', 'Root 2 (r2)'), min: -6, max: 10,
        get: () => getProblem().rootRight,
        set: (v) => { getProblem().rootRight = Math.round(v); },
      });
      h.addCheckbox({
        caption: I18N.tx('Yukarı açılır', 'Opens upward'),
        get: () => getProblem().opensUpward,
        set: (v) => { getProblem().opensUpward = v; },
      });
    },
  });
})();
