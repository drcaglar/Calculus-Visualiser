// Ported from Modules/Preliminaries/AbsoluteValueConceptControl.vb - the absolute value concept
// (|a| = distance of a from zero) plus one of four classic properties, verified numerically.
(function () {
  function createProblem(rng) {
    return {
      value: rng.nextInt(-12, 13),
      secondValue: rng.nextInt(0, 2) === 0 ? rng.nextInt(1, 8) : -rng.nextInt(1, 8),
      propertyKind: rng.nextInt(0, 4),
    };
  }

  // ---- extra problem kinds (opened only through the "▶ Soru" links) ----
  const tx = (tr, en) => I18N.tx(tr, en);
  function extraProblem(kind, a, b) { return { value: a, secondValue: b, propertyKind: 0, extra: kind }; }
  function nz(rng, lo, hi) { let v; do { v = rng.nextInt(lo, hi); } while (v === 0); return v; }
  function insideText(p) { return `${p.pa === 1 ? '' : p.pa}x ${p.pb >= 0 ? '+' : '-'} ${Math.abs(p.pb)}`; }
  function extraStatement(p) {
    const a = p.value, b = p.secondValue;
    switch (p.extra) {
      case 'tri': return tx(`a = ${a} ve b = ${b} için üçgen eşitsizliğini |a + b| ≤ |a| + |b| deneyelim.`, `For a = ${a} and b = ${b}, let's test the triangle inequality |a + b| ≤ |a| + |b|.`);
      case 'dist': return tx(`Sayı doğrusunda ${a} ile ${b} arasındaki uzaklığı d = |a - b| ile bulalım.`, `Let's find the distance between ${a} and ${b} on the number line with d = |a - b|.`);
      default: return tx(`f(x) = |${insideText(p)}| ifadesini parçalı fonksiyon olarak yazalım.`, `Let's write f(x) = |${insideText(p)}| as a piecewise function.`);
    }
  }
  function extraSteps(p) {
    const a = p.value, b = p.secondValue, steps = [];
    if (p.extra === 'tri') {
      const eq = Math.abs(a + b) === Math.abs(a) + Math.abs(b);
      steps.push(tx('── 1) Sol taraf ──', '── 1) Left side ──'));
      steps.push(`a + b = ${a} + (${b}) = ${a + b},  |a + b| = ${Math.abs(a + b)}`);
      steps.push(tx('── 2) Sağ taraf ──', '── 2) Right side ──'));
      steps.push(`|a| + |b| = ${Math.abs(a)} + ${Math.abs(b)} = ${Math.abs(a) + Math.abs(b)}`);
      steps.push(tx('── 3) Karşılaştırma ──', '── 3) Comparison ──'));
      steps.push(`${Math.abs(a + b)} ${eq ? '=' : '<'} ${Math.abs(a) + Math.abs(b)}`);
      steps.push(eq
        ? tx('a ve b aynı işaretli olduğu için eşitlik oluşur.', 'Since a and b have the same sign, equality holds.')
        : tx('a ve b zıt işaretli olduğu için biri diğerini kısmen götürür; sol taraf KESİN küçüktür.', 'Since a and b have opposite signs, they partly cancel; the left side is STRICTLY smaller.'));
    } else if (p.extra === 'dist') {
      steps.push(tx('── 1) Fark ──', '── 1) Difference ──'));
      steps.push(`a - b = ${a} - (${b}) = ${a - b}`);
      steps.push(tx('── 2) Mutlak değer ──', '── 2) Absolute value ──'));
      steps.push(`d = |a - b| = |${a - b}| = ${Math.abs(a - b)}`);
      steps.push(tx(`Kontrol: |b - a| = |${b - a}| = ${Math.abs(b - a)}; sıra değişse de uzaklık aynıdır.`, `Check: |b - a| = |${b - a}| = ${Math.abs(b - a)}; the distance is the same in either order.`));
    } else {
      const x0 = -p.pb / p.pa;
      const inside = insideText(p);
      const t1 = x0 + 2, t2 = x0 - 2;
      steps.push(tx('── 1) Kritik nokta ──', '── 1) Critical point ──'));
      steps.push(tx(`İçini sıfır yapan değer: ${inside} = 0  →  x = ${fmt2(x0)}`, `The value that makes the inside zero: ${inside} = 0  →  x = ${fmt2(x0)}`));
      steps.push(tx('── 2) İşaret ──', '── 2) Sign ──'));
      steps.push(tx(`x ≥ ${fmt2(x0)} için içi ≥ 0 olduğundan çubuklar aynen kalkar: ${inside}`, `For x ≥ ${fmt2(x0)} the inside is ≥ 0, so the bars simply drop: ${inside}`));
      steps.push(tx(`x < ${fmt2(x0)} için içi < 0 olduğundan işaret değişir: -(${inside})`, `For x < ${fmt2(x0)} the inside is < 0, so the sign flips: -(${inside})`));
      steps.push(tx('── 3) Parçalı yazım ──', '── 3) Piecewise form ──'));
      steps.push(`f(x) = ${inside}  (x ≥ ${fmt2(x0)}),   f(x) = -(${inside})  (x < ${fmt2(x0)})`);
      steps.push(tx(`Kontrol: x = ${fmt2(t1)} → ${fmt2(Math.abs(p.pa * t1 + p.pb))};  x = ${fmt2(t2)} → -(${fmt2(p.pa * t2 + p.pb)}) = ${fmt2(-(p.pa * t2 + p.pb))} ✓`, `Check: x = ${fmt2(t1)} → ${fmt2(Math.abs(p.pa * t1 + p.pb))};  x = ${fmt2(t2)} → -(${fmt2(p.pa * t2 + p.pb)}) = ${fmt2(-(p.pa * t2 + p.pb))} ✓`));
    }
    return steps;
  }
  function extraDraw(canvas, p) {
    const a = p.value, b = p.secondValue;
    if (p.extra === 'piece') {
      const x0 = -p.pb / p.pa;
      canvas.setViewport(x0 - 7, x0 + 7, -2, 12);
      canvas.addFunction({ evaluator: (x) => Math.abs(p.pa * x + p.pb), color: canvas.accent(), thickness: 3.0 });
      canvas.addMarker({ x: x0, y: 0, color: canvas.gold(), radius: 7.0, label: `x = ${fmt2(x0)}` });
      return;
    }
    const halfWidth = Math.max(6.0, Math.max(Math.abs(a), Math.abs(b), Math.abs(a + b)) * 1.5 + 3.0);
    canvas.setViewport(-halfWidth, halfWidth, -1, 1);
    canvas.addMarker({ x: 0, y: 0, color: Theme.palette().subtleForeground, radius: 4.0, label: '0' });
    if (p.extra === 'dist') {
      canvas.addSegment({ x1: a, y1: 0, x2: b, y2: 0, color: canvas.gold(), thickness: 3.0 });
      canvas.addMarker({ x: a, y: 0, color: canvas.accent(), radius: 7.0, label: `a = ${a}` });
      canvas.addMarker({ x: b, y: 0, color: canvas.accent(), radius: 7.0, label: `b = ${b}` });
    } else {
      canvas.addMarker({ x: a, y: 0, color: canvas.accent(), radius: 7.0, label: `a = ${a}` });
      canvas.addMarker({ x: b, y: 0, color: canvas.blue(), radius: 7.0, label: `b = ${b}` });
      canvas.addMarker({ x: a + b, y: 0, color: canvas.gold(), radius: 7.0, label: `a + b = ${a + b}` });
    }
  }

  function solveSteps(p) {
    if (p.extra) return extraSteps(p);
    const a = p.value;
    const b = p.secondValue;
    const steps = [];

    steps.push(`a = ${a}`);
    steps.push(I18N.tx(`|a| = a'nın sıfırdan uzaklığı = ${Math.abs(a)}`, `|a| = distance of a from zero = ${Math.abs(a)}`));
    steps.push(a >= 0
      ? I18N.tx(`a zaten pozitif (veya sıfır) olduğu için |a| = a = ${a}.`, `Since a is already positive (or zero), |a| = a = ${a}.`)
      : I18N.tx(`a negatif olduğu için |a| = -a = -(${a}) = ${Math.abs(a)}.`, `Since a is negative, |a| = -a = -(${a}) = ${Math.abs(a)}.`));

    switch (p.propertyKind) {
      case 0: {
        steps.push(I18N.tx('Özellik: |-a| = |a|', 'Property: |-a| = |a|'));
        steps.push(I18N.tx(`-a = ${-a},  |-a| = ${Math.abs(-a)},  |a| = ${Math.abs(a)}  →  eşit, doğrulandı.`, `-a = ${-a},  |-a| = ${Math.abs(-a)},  |a| = ${Math.abs(a)}  →  equal, verified.`));
        break;
      }
      case 1: {
        steps.push(I18N.tx(`Özellik: |a·b| = |a|·|b|   (b = ${b})`, `Property: |a·b| = |a|·|b|   (b = ${b})`));
        steps.push(`a·b = ${a * b},  |a·b| = ${Math.abs(a * b)}`);
        steps.push(I18N.tx(`|a|·|b| = ${Math.abs(a)}·${Math.abs(b)} = ${Math.abs(a) * Math.abs(b)}  →  eşit, doğrulandı.`, `|a|·|b| = ${Math.abs(a)}·${Math.abs(b)} = ${Math.abs(a) * Math.abs(b)}  →  equal, verified.`));
        break;
      }
      case 2: {
        const safeB = b === 0 ? 1 : b;
        steps.push(I18N.tx(`Özellik: |a/b| = |a|/|b|   (b = ${safeB})`, `Property: |a/b| = |a|/|b|   (b = ${safeB})`));
        steps.push(`a/b = ${a}/${safeB} = ${fmt2(a / safeB)},  |a/b| = ${fmt2(Math.abs(a / safeB))}`);
        steps.push(I18N.tx(`|a|/|b| = ${Math.abs(a)}/${Math.abs(safeB)} = ${fmt2(Math.abs(a) / Math.abs(safeB))}  →  eşit, doğrulandı.`, `|a|/|b| = ${Math.abs(a)}/${Math.abs(safeB)} = ${fmt2(Math.abs(a) / Math.abs(safeB))}  →  equal, verified.`));
        break;
      }
      default: {
        steps.push(I18N.tx('Özellik: √(a²) = |a|', 'Property: √(a²) = |a|'));
        steps.push(`a² = ${a * a},  √(a²) = ${fmt2(Math.sqrt(a * a))}`);
        steps.push(I18N.tx(`|a| = ${Math.abs(a)}  →  eşit, doğrulandı. (Kök işareti a negatif olsa bile hiçbir zaman negatif sonuç vermez.)`, `|a| = ${Math.abs(a)}  →  equal, verified. (The square root sign never gives a negative result, even when a is negative.)`));
      }
    }

    return steps;
  }

  function draw(canvas, p) {
    if (p.extra) { extraDraw(canvas, p); return; }
    const halfWidth = Math.max(6.0, Math.abs(p.value) * 1.5 + 3.0);
    canvas.setViewport(-halfWidth, halfWidth, -1, 1);

    canvas.addSegment({ x1: 0, y1: 0, x2: p.value, y2: 0, color: canvas.gold(), thickness: 3.0 });
    canvas.addMarker({ x: 0, y: 0, color: Theme.palette().subtleForeground, radius: 5.0, label: '0' });
    canvas.addMarker({
      x: p.value, y: 0, color: canvas.accent(), radius: 7.0,
      label: I18N.tx(`a = ${p.value}  (uzaklık = ${Math.abs(p.value)})`, `a = ${p.value}  (distance = ${Math.abs(p.value)})`),
    });
  }

  Topics.register('numbers', {
    id: 'absoluteValueConcept',
    tabTitle: () => I18N.tx('Mutlak Değer Kavramı', 'The Absolute Value Concept'),
    concept: () => I18N.tx(
      "TANIM: |a|, a'nın sayı doğrusunda 0'a olan UZAKLIĞIDIR.\n   |a| = a      (a ≥ 0 ise)\n   |a| = -a     (a < 0 ise)    -a burada POZİTİF bir sayıdır: |-5| = 5.\n   İki nokta arasındaki uzaklık: d(a, b) = |a - b| = |b - a|.\n\nÖZELLİKLER\n   |a| ≥ 0 ve |a| = 0 <=> a = 0\n   |-a| = |a|            |a·b| = |a|·|b|          |a/b| = |a|/|b|  (b ≠ 0)\n   |a|² = a²             √(a²) = |a|  (kök işareti negatif olmayan sonuç verir)\n   Üçgen eşitsizliği:  |a + b| ≤ |a| + |b|\n   |x| < k  <=>  -k < x < k   ;   |x| > k  <=>  x < -k veya x > k   (k > 0)\n\nYÖNTEM (mutlak değerli ifadeyi parçalı yazma)\n   1) Mutlak değerin İÇİNİ sıfır yapan x değerini bulabiliriz (kritik nokta).\n   2) Sayı doğrusunu bu noktada ikiye böleriz.\n   3) İçi ≥ 0 olan bölgede mutlak değer aynen kaldırılır: |ifade| = ifade.\n   4) İçi < 0 olan bölgede işaret değiştirilerek kaldırılır: |ifade| = -(ifade).\n   5) Sonucu parçalı fonksiyon olarak yazabiliriz.\n   Örnek: |x - 3| = x - 3  (x ≥ 3 için),  = 3 - x  (x < 3 için).\n\nÖZEL DURUMLAR / SIK HATALAR\n   - |a + b| ≠ |a| + |b| (genelde): |3 + (-5)| = 2 iken |3| + |-5| = 8.\n   - |-5| = 5'tir; -5 DEĞİL. Ancak -|5| = -5 (eksi mutlak değerin DIŞINDADIR).\n   - |x| = -3 denkleminin çözümü YOKTUR (uzaklık negatif olamaz).\n   - √(x²) = x yanlıştır; doğrusu |x|. (x = -2 için √4 = 2 = |-2|.)\n   - |x| işaretini 'sadece eksiyi at' diye düşünmek yanıltıcıdır: x'in işareti bilinmiyorsa -x bile pozitif olmayabilir.\n\nMÜHENDİSLİK BAĞLAMI: tolerans ve hata |ölçülen - nominal| ≤ tolerans biçiminde yazılır.\n\nMİNİ ÖRNEK\n   |3 - 7| = |-4| = 4 (3 ile 7 arasındaki uzaklık).\n   x = -1 için |x - 2| = |-3| = 3.\n   √((-6)²) = √36 = 6 = |-6|.",
      "DEFINITION: |a| is the DISTANCE of a from 0 on the number line.\n   |a| = a      (if a ≥ 0)\n   |a| = -a     (if a < 0)    here -a is a POSITIVE number: |-5| = 5.\n   The distance between two points: d(a, b) = |a - b| = |b - a|.\n\nPROPERTIES\n   |a| ≥ 0 and |a| = 0 <=> a = 0\n   |-a| = |a|            |a·b| = |a|·|b|          |a/b| = |a|/|b|  (b ≠ 0)\n   |a|² = a²             √(a²) = |a|  (the root sign gives a non-negative result)\n   Triangle inequality:  |a + b| ≤ |a| + |b|\n   |x| < k  <=>  -k < x < k   ;   |x| > k  <=>  x < -k or x > k   (k > 0)\n\nMETHOD (writing an absolute value expression piecewise)\n   1) We can find the x value that makes the INSIDE zero (critical point).\n   2) We split the number line at that point.\n   3) Where the inside is ≥ 0, the bars are removed unchanged: |expr| = expr.\n   4) Where the inside is < 0, they are removed with a sign change: |expr| = -(expr).\n   5) We can write the result as a piecewise function.\n   Example: |x - 3| = x - 3  (for x ≥ 3),  = 3 - x  (for x < 3).\n\nSPECIAL CASES / COMMON PITFALLS\n   - |a + b| ≠ |a| + |b| (in general): |3 + (-5)| = 2 while |3| + |-5| = 8.\n   - |-5| = 5, NOT -5. But -|5| = -5 (the minus is OUTSIDE the bars).\n   - The equation |x| = -3 has NO solution (a distance cannot be negative).\n   - √(x²) = x is wrong; the correct result is |x|. (For x = -2: √4 = 2 = |-2|.)\n   - It is misleading to think of |x| as 'just drop the minus sign': if the sign of x is unknown, even -x need not be positive.\n\nENGINEERING CONTEXT: tolerance and error are written as |measured - nominal| ≤ tolerance.\n\nMINI EXAMPLE\n   |3 - 7| = |-4| = 4 (the distance between 3 and 7).\n   For x = -1: |x - 2| = |-3| = 3.\n   √((-6)²) = √36 = 6 = |-6|."
    ),
    problemStatement: (p) => {
      if (p.extra) return extraStatement(p);
      const a = p.value;
      const b = p.secondValue;
      const safeB = b === 0 ? 1 : b;
      switch (p.propertyKind) {
        case 0: return I18N.tx(`a = ${a} için |a| değerini bulalım ve |-a| = |a| özelliğini doğrulayalım.`, `For a = ${a}, let's find |a| and verify the property |-a| = |a|.`);
        case 1: return I18N.tx(`a = ${a} için |a| değerini bulalım; b = ${b} için |a·b| = |a|·|b| özelliğini doğrulayalım.`, `For a = ${a}, let's find |a|; for b = ${b}, verify the property |a·b| = |a|·|b|.`);
        case 2: return I18N.tx(`a = ${a} için |a| değerini bulalım; b = ${safeB} için |a/b| = |a|/|b| özelliğini doğrulayalım.`, `For a = ${a}, let's find |a|; for b = ${safeB}, verify the property |a/b| = |a|/|b|.`);
        default: return I18N.tx(`a = ${a} için |a| değerini bulalım ve √(a²) = |a| özelliğini doğrulayalım.`, `For a = ${a}, let's find |a| and verify the property √(a²) = |a|.`);
      }
    },
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: p.extra === 'piece' ? -p.pb / p.pa : (p.extra === 'dist' ? (p.value + p.secondValue) / 2 : p.value / 2), y: 0 }),
    links: [
      { match: /^(TANIM|DEFINITION):/, make: (rng) => ({ value: nz(rng, -12, 13), secondValue: nz(rng, -7, 8), propertyKind: 0 }) },
      { match: /^\s*(İki nokta arasındaki uzaklık|The distance between two points):/, make: (rng) => { const a = rng.nextInt(-9, 10); let b; do { b = rng.nextInt(-9, 10); } while (b === a); return extraProblem('dist', a, b); } },
      { match: /^\s*\|-a\| = \|a\|\s+\|a·b\|/, make: (rng) => ({ value: rng.nextInt(-12, 13), secondValue: nz(rng, -7, 8), propertyKind: rng.nextInt(0, 3) }) },
      { match: /^\s*\|a\|² = a²/, make: (rng) => ({ value: nz(rng, -12, 13), secondValue: nz(rng, -7, 8), propertyKind: 3 }) },
      { match: /^\s*(Üçgen eşitsizliği|Triangle inequality):/, make: (rng) => extraProblem('tri', nz(rng, -9, 10), nz(rng, -9, 10)) },
      { match: /^\s*\|x\| < k  <=>/, tab: 'absoluteValueEquation' },
      { match: /^(YÖNTEM|METHOD) \(/, make: (rng) => { const pa = [1, 2, 3][rng.nextInt(0, 3)]; const x0 = rng.nextInt(-5, 6); const q = extraProblem('piece', 0, 1); q.pa = pa; q.pb = -pa * x0; return q; } },
    ],
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({
        caption: I18N.tx('Sayı (a)', 'Number (a)'), min: -15, max: 15,
        get: () => getProblem().value, set: (v) => { getProblem().value = Math.round(v); },
      });
    },
  });
})();
