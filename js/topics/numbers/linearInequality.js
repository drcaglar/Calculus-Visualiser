// Ported from Modules/Preliminaries/LinearInequalityControl.vb - three shapes of linear
// inequality (a(x+b) op c, ax+b op cx+d, x/den+b op c) inside one general solver, so the
// negative-coefficient sign-flip rule and the equality-to-interval conversion appear naturally
// as steps of the same method.
(function () {
  // Local alpha helper mirroring graph.js's internal _withAlpha, needed here because the VB
  // source draws its solution-region band with a specific translucency (Color.FromArgb(70, accent)).
  function withAlpha(cssColor, alpha) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(cssColor).trim());
    if (!m) return cssColor;
    const r = parseInt(m[1].substr(0, 2), 16), g = parseInt(m[1].substr(2, 2), 16), b = parseInt(m[1].substr(4, 2), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function signedTerm(value) {
    return value >= 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
  }

  function flipOperator(op) {
    switch (op) {
      case '<': return '>';
      case '<=': return '>=';
      case '>': return '<';
      default: return '<=';
    }
  }

  function toInterval(op, value) {
    const v = fmt2(value);
    switch (op) {
      case '<': return `(-∞, ${v})`;
      case '<=': return `(-∞, ${v}]`;
      case '>': return `(${v}, ∞)`;
      default: return `[${v}, ∞)`;
    }
  }

  function createProblem(rng) {
    const ops = ['<', '<=', '>', '>='];
    const op = ops[rng.nextInt(0, ops.length)];
    const mode = rng.nextInt(0, 3); // 0 = a(x+b) op c, 1 = ax+b op cx+d, 2 = x/den + b op c

    if (mode === 0) {
      const a = [-3, -2, 2, 3, 4][rng.nextInt(0, 5)];
      const b = rng.nextInt(-5, 6);
      const c = rng.nextInt(-10, 11);
      return { mode: 0, a, b, c, op };
    }
    if (mode === 1) {
      const a = rng.nextInt(2, 6) * (rng.nextInt(0, 2) === 0 ? 1 : -1);
      let c;
      do { c = rng.nextInt(-5, 6); } while (c === a);
      const b = rng.nextInt(-8, 9);
      const d = rng.nextInt(-8, 9);
      return { mode: 1, a, b, c, d, op };
    }
    const den = [2, 3, 4][rng.nextInt(0, 3)];
    const b = rng.nextInt(-5, 6);
    const c = rng.nextInt(-8, 9);
    return { mode: 2, den, b, c, op };
  }

  // Re-derives the final (coefficient, constant) the same way SolveSteps does, so the picture
  // always matches the text - mirrors the VB source's DrawProblem re-derivation.
  function computeFinal(p) {
    if (p.mode === 0) return { finalCoefficient: p.a, finalConstant: p.c - p.a * p.b };
    if (p.mode === 1) return { finalCoefficient: p.a - p.c, finalConstant: p.d - p.b };
    return { finalCoefficient: 1, finalConstant: (p.c - p.b) * p.den };
  }

  // ---- extra modes (opened only through the "▶ Soru" links): 3 = compound inequality, 4 = x-terms cancel ----
  const tx = (tr, en) => I18N.tx(tr, en);
  function makeMode(rng, mode) { let q; do { q = createProblem(rng); } while (q.mode !== mode); return q; }
  function makeNegative(rng) { let q; do { q = createProblem(rng); } while (computeFinal(q).finalCoefficient >= 0); return q; }
  function makeCompound(rng) {
    const u = [2, 3, 4][rng.nextInt(0, 3)];
    const v = rng.nextInt(-5, 6);
    const x1 = rng.nextInt(-5, 3), x2 = x1 + rng.nextInt(1, 6);
    return { mode: 3, u, v, lo: u * x1 + v, hi: u * x2 + v, opL: rng.nextInt(0, 2) === 0 ? '<' : '<=', opR: rng.nextInt(0, 2) === 0 ? '<' : '<=', op: '<' };
  }
  function makeCancel(rng) {
    const ops = ['<', '<=', '>', '>='];
    const a = rng.nextInt(2, 6) * (rng.nextInt(0, 2) === 0 ? 1 : -1);
    const b = rng.nextInt(-8, 9);
    let d; do { d = rng.nextInt(-8, 9); } while (d === b);
    return { mode: 4, a, b, d, op: ops[rng.nextInt(0, 4)] };
  }
  function holds(l, op, r) {
    switch (op) { case '<': return l < r; case '<=': return l <= r; case '>': return l > r; default: return l >= r; }
  }
  function compoundText(p) { return `${p.lo} ${p.opL} ${p.u}x ${signedTerm(p.v)} ${p.opR} ${p.hi}`; }
  function cancelText(p) { return `${p.a}x ${signedTerm(p.b)} ${p.op} ${p.a}x ${signedTerm(p.d)}`; }
  function extraStatement(p) {
    if (p.mode === 3) return tx(`${compoundText(p)} birleşik eşitsizliğinin çözüm kümesini bulup aralık olarak yazalım.`, `Let's solve the compound inequality ${compoundText(p)} and write the answer as an interval.`);
    return tx(`${cancelText(p)} eşitsizliğinin çözüm kümesini bulalım.`, `Let's find the solution set of the inequality ${cancelText(p)}.`);
  }
  function extraSteps(p) {
    const steps = [];
    if (p.mode === 3) {
      const l = (p.lo - p.v) / p.u, r = (p.hi - p.v) / p.u;
      steps.push(tx(`Verilen eşitsizlik: ${compoundText(p)}`, `Given inequality: ${compoundText(p)}`));
      steps.push(tx(`── 1) Her üç parçadan ${p.v >= 0 ? p.v + ' çıkaralım' : Math.abs(p.v) + ' ekleyelim'} ──\n${p.lo - p.v} ${p.opL} ${p.u}x ${p.opR} ${p.hi - p.v}`, `── 1) ${p.v >= 0 ? 'Subtract ' + p.v : 'Add ' + Math.abs(p.v)} in all three parts ──\n${p.lo - p.v} ${p.opL} ${p.u}x ${p.opR} ${p.hi - p.v}`));
      steps.push(tx(`── 2) Üç parçayı da ${p.u} ile bölelim (pozitif, yön değişmez) ──\n${fmt2(l)} ${p.opL} x ${p.opR} ${fmt2(r)}`, `── 2) Divide all three parts by ${p.u} (positive, direction unchanged) ──\n${fmt2(l)} ${p.opL} x ${p.opR} ${fmt2(r)}`));
      const lb = p.opL === '<=' ? '[' : '(', rb = p.opR === '<=' ? ']' : ')';
      steps.push(tx(`Aralık gösterimi: x ∈ ${lb}${fmt2(l)}, ${fmt2(r)}${rb}`, `Interval notation: x ∈ ${lb}${fmt2(l)}, ${fmt2(r)}${rb}`));
    } else {
      const truth = holds(p.b, p.op, p.d);
      steps.push(tx(`Verilen eşitsizlik: ${cancelText(p)}`, `Given inequality: ${cancelText(p)}`));
      steps.push(tx(`── 1) x'li terimleri toplayalım ──\n(${p.a} − ${p.a})x ${p.op} ${p.d} − (${p.b})  →  0 ${p.op} ${p.d - p.b}`, `── 1) Collect the x terms ──\n(${p.a} − ${p.a})x ${p.op} ${p.d} − (${p.b})  →  0 ${p.op} ${p.d - p.b}`));
      steps.push(tx(`── 2) x yok oldu; ifade doğru mu? ──\n0 ${p.op} ${p.d - p.b} ifadesi ${truth ? 'DOĞRUDUR' : 'YANLIŞTIR'}.`, `── 2) The x vanished; is the statement true? ──\n0 ${p.op} ${p.d - p.b} is ${truth ? 'TRUE' : 'FALSE'}.`));
      steps.push(truth
        ? tx('Doğru olduğu için her x sağlar: x ∈ ℝ = (-∞, ∞).', 'Since it is true, every x works: x ∈ ℝ = (-∞, ∞).')
        : tx('Yanlış olduğu için hiçbir x sağlamaz: çözüm kümesi ∅.', 'Since it is false, no x works: the solution set is ∅.'));
    }
    return steps;
  }
  function extraDraw(canvas, p) {
    if (p.mode === 3) {
      const l = (p.lo - p.v) / p.u, r = (p.hi - p.v) / p.u;
      const halfWidth = Math.max(6.0, Math.max(Math.abs(l), Math.abs(r)) * 1.5 + 4.0);
      canvas.setViewport(-halfWidth, halfWidth, -1, 1);
      canvas.addRegion({ xMin: l, xMax: r, color: withAlpha(canvas.accent(), 70 / 255) });
      canvas.addMarker({ x: l, y: 0, color: canvas.accent(), radius: 8.0, hollow: p.opL === '<', label: fmt2(l) });
      canvas.addMarker({ x: r, y: 0, color: canvas.accent(), radius: 8.0, hollow: p.opR === '<', label: fmt2(r) });
      return;
    }
    canvas.setViewport(-8, 8, -1, 1);
    if (holds(p.b, p.op, p.d)) canvas.addRegion({ xMin: canvas.worldMinX, xMax: canvas.worldMaxX, color: withAlpha(canvas.accent(), 70 / 255) });
    canvas.addMarker({ x: 0, y: 0, color: Theme.palette().subtleForeground, radius: 4.0, label: '0' });
  }

  function solveSteps(p) {
    if (p.mode >= 3) return extraSteps(p);
    const steps = [];
    const currentOp = p.op;
    let finalCoefficient, finalConstant;

    if (p.mode === 0) {
      steps.push(I18N.tx(`Verilen eşitsizlik: ${p.a}(x ${signedTerm(p.b)}) ${currentOp} ${p.c}`, `Given inequality: ${p.a}(x ${signedTerm(p.b)}) ${currentOp} ${p.c}`));
      const expandedB = p.a * p.b;
      steps.push(I18N.tx(`Parantezi dağıtalım: ${p.a}x ${signedTerm(expandedB)} ${currentOp} ${p.c}`, `Let's distribute: ${p.a}x ${signedTerm(expandedB)} ${currentOp} ${p.c}`));
      const rhs = p.c - expandedB;
      steps.push(I18N.tx(`Sabit terimi karşı tarafa geçirelim: ${p.a}x ${currentOp} ${rhs}`, `Let's move the constant term to the other side: ${p.a}x ${currentOp} ${rhs}`));
      finalCoefficient = p.a;
      finalConstant = rhs;
    } else if (p.mode === 1) {
      steps.push(I18N.tx(`Verilen eşitsizlik: ${p.a}x ${signedTerm(p.b)} ${currentOp} ${p.c}x ${signedTerm(p.d)}`, `Given inequality: ${p.a}x ${signedTerm(p.b)} ${currentOp} ${p.c}x ${signedTerm(p.d)}`));
      const newA = p.a - p.c;
      const newC = p.d - p.b;
      steps.push(I18N.tx(`Değişkenleri bir tarafa, sabitleri diğer tarafa toplayalım: (${p.a} − ${p.c})x ${currentOp} (${p.d} − ${p.b})`, `Let's collect variables on one side and constants on the other: (${p.a} − ${p.c})x ${currentOp} (${p.d} − ${p.b})`));
      steps.push(I18N.tx(`Sadeleştirirsek: ${newA}x ${currentOp} ${newC}`, `Simplifying gives: ${newA}x ${currentOp} ${newC}`));
      finalCoefficient = newA;
      finalConstant = newC;
    } else {
      steps.push(I18N.tx(`Verilen eşitsizlik: x/${p.den} ${signedTerm(p.b)} ${currentOp} ${p.c}`, `Given inequality: x/${p.den} ${signedTerm(p.b)} ${currentOp} ${p.c}`));
      const rhsAfterConstant = p.c - p.b;
      steps.push(I18N.tx(`Sabit terimi karşı tarafa geçirelim: x/${p.den} ${currentOp} ${rhsAfterConstant}`, `Let's move the constant term to the other side: x/${p.den} ${currentOp} ${rhsAfterConstant}`));
      steps.push(I18N.tx(
        `Kesri yok etmek için her iki tarafı ${p.den} ile çarpabiliriz (pozitif olduğu için yön değişmez): x ${currentOp} ${rhsAfterConstant * p.den}`,
        `To clear the fraction, we can multiply both sides by ${p.den} (positive, so the direction does not change): x ${currentOp} ${rhsAfterConstant * p.den}`
      ));
      finalCoefficient = 1;
      finalConstant = rhsAfterConstant * p.den;
    }

    let solutionOp = currentOp;
    const solutionValue = finalConstant / finalCoefficient;
    if (finalCoefficient !== 1) {
      if (finalCoefficient < 0) {
        solutionOp = flipOperator(currentOp);
        steps.push(I18N.tx(
          `Her iki tarafı ${finalCoefficient} ile bölelim - NEGATİF bir sayıyla bölündüğü için eşitsizlik yönü TERSİNE döner: x ${solutionOp} ${fmt2(solutionValue)}`,
          `Let's divide both sides by ${finalCoefficient} - dividing by a NEGATIVE number REVERSES the inequality: x ${solutionOp} ${fmt2(solutionValue)}`
        ));
      } else {
        steps.push(I18N.tx(`Her iki tarafı ${finalCoefficient} ile bölelim: x ${solutionOp} ${fmt2(solutionValue)}`, `Let's divide both sides by ${finalCoefficient}: x ${solutionOp} ${fmt2(solutionValue)}`));
      }
    }

    const intervalText = toInterval(solutionOp, solutionValue);
    steps.push(I18N.tx(`Aralık gösterimi: x ${solutionOp} ${fmt2(solutionValue)}  ⟺  x ∈ ${intervalText}`, `Interval notation: x ${solutionOp} ${fmt2(solutionValue)}  ⟺  x ∈ ${intervalText}`));

    return steps;
  }

  function draw(canvas, p) {
    if (p.mode >= 3) { extraDraw(canvas, p); return; }
    const { finalCoefficient, finalConstant } = computeFinal(p);
    let solutionOp = p.op;
    const solutionValue = finalCoefficient !== 0 ? finalConstant / finalCoefficient : 0;
    if (finalCoefficient < 0) solutionOp = flipOperator(p.op);

    const halfWidth = Math.max(6.0, Math.abs(solutionValue) * 1.5 + 4.0);
    canvas.setViewport(-halfWidth, halfWidth, -1, 1);

    const isLessThan = (solutionOp === '<' || solutionOp === '<=');
    const regionMin = isLessThan ? -halfWidth : solutionValue;
    const regionMax = isLessThan ? solutionValue : halfWidth;
    canvas.addRegion({ xMin: regionMin, xMax: regionMax, color: withAlpha(canvas.accent(), 70 / 255) });

    const isClosed = (solutionOp === '<=' || solutionOp === '>=');
    canvas.addMarker({ x: solutionValue, y: 0, color: canvas.accent(), radius: 8.0, hollow: !isClosed, label: fmt2(solutionValue) });
  }

  Topics.register('numbers', {
    id: 'linearInequality',
    tabTitle: () => I18N.tx('Doğrusal Eşitsizlikler', 'Linear Inequalities'),
    concept: () => I18N.tx(
      "TANIM: ax + b < c, ax + b ≤ c, ax + b > c, ax + b ≥ c biçimindeki (a ≠ 0) eşitsizliklere\n   birinci dereceden (lineer) eşitsizlik denir. Çözümü genellikle bir ARALIKTIR.\n\nKURALLAR (eşitsizlik denklem gibi çözülür)\n   - Her iki tarafa aynı sayı eklenir/çıkarılır: yön DEĞİŞMEZ.\n   - Her iki taraf POZİTİF sayıyla çarpılır/bölünür: yön DEĞİŞMEZ.\n   - Her iki taraf NEGATİF sayıyla çarpılır/bölünür: yön TERS DÖNER  (< <-> >,  ≤ <-> ≥).\n\nYÖNTEM\n   1) Paydalar varsa tüm terimleri (pozitif) ortak payda ile çarpabiliriz.\n   2) Parantezleri açıp benzer terimleri toplarız.\n   3) x'li terimleri bir tarafa, sabitleri diğer tarafa toplarız (taşınan terimin işareti değişir).\n   4) x'in katsayısına böleriz; katsayı NEGATİFSE işaret çevrilir.\n   5) Sonucu eşitsizlik, sayı doğrusu ve aralık gösterimiyle yazabiliriz.\n   6) Kontrol için aralıktan bir sayı seçip ilk eşitsizlikte deneyebiliriz.\n\nBİRLEŞİK EŞİTSİZLİK  (a < ux + v ≤ b)\n   Üç parçanın HER birine aynı işlem uygulanır (ortadaki x yalnız kalana kadar).\n   Örnek: -2 < 3x + 1 ≤ 7  =>  -3 < 3x ≤ 6  =>  -1 < x ≤ 2  =>  (-1, 2].\n\nÖZEL DURUMLAR / SIK HATALAR\n   - Negatifle bölerken işareti çevirmeyi atlamak EN SIK yapılan hatadır: -2x < 6  =>  x > -3 (x < -3 değil).\n   - x'ler birbirini götürürse: 0 < 5 gibi DOĞRU kalırsa çözüm TÜM reel sayılar (-∞, ∞);\n     0 > 5 gibi YANLIŞ kalırsa ÇÖZÜM YOKTUR (∅).\n   - ≤ ve ≥ için uç nokta dahildir (köşeli parantez), < ve > için dahil değildir (yuvarlak).\n   - Değişken paydadaysa (örn. 1/x < 2) eşitsizlik lineer değildir; x'in işareti bilinmeden\n     iki tarafı x ile çarpmamak gerekir.\n\nMİNİ ÖRNEK: -3x + 5 ≤ 14.\n   -3x ≤ 9   (her iki taraftan 5 çıkarırız)\n   x ≥ -3    (-3'e böleriz: negatif olduğu için ≤ işareti ≥ olur)\n   Çözüm: [-3, ∞). Kontrol: x = 0  =>  5 ≤ 14 doğru; x = -4  =>  17 ≤ 14 yanlış.",
      "DEFINITION: inequalities of the form ax + b < c, ax + b ≤ c, ax + b > c, ax + b ≥ c (a ≠ 0)\n   are called first-degree (linear) inequalities. The solution is usually an INTERVAL.\n\nRULES (solve it like an equation)\n   - Add/subtract the same number on both sides: direction does NOT change.\n   - Multiply/divide both sides by a POSITIVE number: direction does NOT change.\n   - Multiply/divide both sides by a NEGATIVE number: direction REVERSES  (< <-> >,  ≤ <-> ≥).\n\nMETHOD\n   1) If there are denominators, we can multiply every term by the (positive) common denominator.\n   2) We expand brackets and combine like terms.\n   3) We collect the x-terms on one side and the constants on the other (a term changes sign when it moves).\n   4) We divide by the coefficient of x; if the coefficient is NEGATIVE, the sign reverses.\n   5) We can write the answer as an inequality, on the number line and in interval notation.\n   6) To check, we can pick a number from the interval and test it in the original inequality.\n\nCOMPOUND INEQUALITY  (a < ux + v ≤ b)\n   Each operation is applied to ALL THREE parts until x is alone in the middle.\n   Example: -2 < 3x + 1 ≤ 7  =>  -3 < 3x ≤ 6  =>  -1 < x ≤ 2  =>  (-1, 2].\n\nSPECIAL CASES / COMMON PITFALLS\n   - Forgetting to reverse the sign when dividing by a negative is THE most common error:\n     -2x < 6  =>  x > -3 (not x < -3).\n   - If the x-terms cancel: when the result is TRUE like 0 < 5, the solution is ALL real numbers (-∞, ∞);\n     when it is FALSE like 0 > 5, there is NO SOLUTION (∅).\n   - For ≤ and ≥ the endpoint is included (square bracket); for < and > it is not (round bracket).\n   - If the variable is in a denominator (e.g. 1/x < 2) the inequality is not linear; do not\n     multiply both sides by x unless you know the sign of x.\n\nMINI EXAMPLE: -3x + 5 ≤ 14.\n   -3x ≤ 9   (we subtract 5 from both sides)\n   x ≥ -3    (we divide by -3: because it is negative, ≤ becomes ≥)\n   Solution: [-3, ∞). Check: x = 0  =>  5 ≤ 14 true; x = -4  =>  17 ≤ 14 false."
    ),
    problemStatement: (p) => {
      if (p.mode >= 3) return extraStatement(p);
      let text;
      switch (p.mode) {
        case 0: text = `${p.a}(x ${signedTerm(p.b)}) ${p.op} ${p.c}`; break;
        case 1: text = `${p.a}x ${signedTerm(p.b)} ${p.op} ${p.c}x ${signedTerm(p.d)}`; break;
        default: text = `x/${p.den} ${signedTerm(p.b)} ${p.op} ${p.c}`; break;
      }
      return I18N.tx(`${text} eşitsizliğinin çözüm kümesini bulup aralık olarak yazalım.`, `Let's find the solution set of the inequality ${text} and write it as an interval.`);
    },
    links: [
      { match: /^\s*- (Her iki taraf POZİTİF|Multiply\/divide both sides by a POSITIVE)/, make: (rng) => makeMode(rng, 2) },
      { match: /^\s*- (Her iki taraf NEGATİF|Multiply\/divide both sides by a NEGATIVE)/, make: makeNegative },
      { match: /^\s*1\) (Paydalar varsa|If there are denominators)/, make: (rng) => makeMode(rng, 2) },
      { match: /^(BİRLEŞİK EŞİTSİZLİK|COMPOUND INEQUALITY)/, make: makeCompound },
      { match: /^\s*- (x'ler birbirini götürürse|If the x-terms cancel)/, make: makeCancel },
    ],
    createProblem,
    solveSteps,
    draw,
    focus: (p) => {
      if (p.mode === 3) return { x: ((p.lo + p.hi) / 2 - p.v) / p.u, y: 0 };
      if (p.mode === 4) return { x: 0, y: 0 };
      const { finalCoefficient, finalConstant } = computeFinal(p);
      return { x: finalCoefficient !== 0 ? finalConstant / finalCoefficient : 0, y: 0 };
    },
  });
})();
