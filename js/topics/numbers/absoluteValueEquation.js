// Ported from Modules/Preliminaries/AbsoluteValueEquationControl.vb - |x-h|=k, |ax+b|=c,
// |x-h|<k, |x-h|>k: each solved via the same "distance from zero" idea.
(function () {
  function signedTerm(value) {
    return value >= 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
  }

  function createProblem(rng) {
    const mode = rng.nextInt(0, 4);
    const h = rng.nextInt(-6, 7);
    const k = rng.nextInt(1, 8);
    const a = [-3, -2, 2, 3][rng.nextInt(0, 4)];
    return { mode, a, h, k };
  }

  // ---- extra problem kinds (opened only through the "▶ Soru" links) ----
  const tx = (tr, en) => I18N.tx(tr, en);
  function extraBase(rng, extra) {
    return { mode: 0, a: 2, h: rng.nextInt(-6, 7), k: rng.nextInt(1, 8), extra };
  }
  function makeAbs2(rng) {
    const p = extraBase(rng, 'abs2');
    p.h = 0;
    p.q = rng.nextInt(-6, 7);
    p.s = rng.nextInt(-6, 7);
    p.r = [2, 3, -2, -3][rng.nextInt(0, 4)];
    return p;
  }
  function makeExtr(rng) {
    const p = extraBase(rng, 'extr');
    p.h = 0;
    p.c = rng.nextInt(1, 7);
    p.d = rng.nextInt(2, 5);
    return p;
  }
  function makeNegK(rng) {
    const p = extraBase(rng, 'negk');
    p.negOp = rng.nextInt(0, 2) === 0 ? '<' : '>';
    return p;
  }
  function abs2Solutions(p) {
    return { x1: (p.s - p.q) / (1 - p.r), x2: -(p.s + p.q) / (1 + p.r) };
  }
  function extrSolutions(p) {
    return { valid: p.c / (p.d - 1), invalid: -p.c / (p.d + 1) };
  }
  function extraStatement(p) {
    const { h, k } = p;
    const inner = `x ${signedTerm(-h)}`;
    switch (p.extra) {
      case 'zero': return tx(`|${inner}| = 0 denklemini çözelim.`, `Let's solve the equation |${inner}| = 0.`);
      case 'none': return tx(`|${inner}| = -${k} denklemini çözelim.`, `Let's solve the equation |${inner}| = -${k}.`);
      case 'abs2': return tx(`|x ${signedTerm(p.q)}| = |${p.r}x ${signedTerm(p.s)}| denklemini çözelim.`, `Let's solve the equation |x ${signedTerm(p.q)}| = |${p.r}x ${signedTerm(p.s)}|.`);
      case 'extr': return tx(`|x + ${p.c}| = ${p.d}x denklemini çözelim; bulduğumuz değerleri kontrol edelim.`, `Let's solve the equation |x + ${p.c}| = ${p.d}x and check the values we find.`);
      case 'le': return tx(`|${inner}| ≤ ${k} eşitsizliğini çözüp aralık olarak yazalım.`, `Let's solve the inequality |${inner}| ≤ ${k} and write the answer as an interval.`);
      case 'ge': return tx(`|${inner}| ≥ ${k} eşitsizliğini çözüp aralık olarak yazalım.`, `Let's solve the inequality |${inner}| ≥ ${k} and write the answer as an interval.`);
      default: return tx(`|${inner}| ${p.negOp} -${k} eşitsizliğini çözelim.`, `Let's solve the inequality |${inner}| ${p.negOp} -${k}.`);
    }
  }
  function extraSteps(p) {
    const { h, k } = p;
    const inner = `x ${signedTerm(-h)}`;
    const steps = [];
    switch (p.extra) {
      case 'zero':
        steps.push(tx(`Verilen denklem: |${inner}| = 0`, `Given equation: |${inner}| = 0`));
        steps.push(tx('Uzaklığın 0 olması için içindeki ifadenin kendisi 0 olmalıdır.', 'A distance is 0 only when the expression inside is itself 0.'));
        steps.push(`${inner} = 0   →   x = ${h}`);
        steps.push(tx(`Sonuç: tek çözüm x = ${h}`, `Result: the single solution x = ${h}`));
        break;
      case 'none':
        steps.push(tx(`Verilen denklem: |${inner}| = -${k}`, `Given equation: |${inner}| = -${k}`));
        steps.push(tx(`Mutlak değer bir uzaklıktır ve her zaman ≥ 0'dır; -${k} ise negatiftir.`, `An absolute value is a distance and is always ≥ 0, but -${k} is negative.`));
        steps.push(tx('Sonuç: çözüm yoktur, çözüm kümesi ∅.', 'Result: there is no solution, the solution set is ∅.'));
        break;
      case 'abs2': {
        const { x1, x2 } = abs2Solutions(p);
        const L = `x ${signedTerm(p.q)}`, R = `${p.r}x ${signedTerm(p.s)}`;
        steps.push(tx(`Verilen denklem: |${L}| = |${R}|`, `Given equation: |${L}| = |${R}|`));
        steps.push(tx('İki ifadenin uzaklıkları eşitse ya ifadeler eşittir ya da biri diğerinin tersidir.', 'If two expressions have equal absolute values, they are either equal or opposite.'));
        steps.push(tx(`Birinci durum: ${L} = ${R}   →   x = ${fmt2(x1)}`, `First case: ${L} = ${R}   →   x = ${fmt2(x1)}`));
        steps.push(tx(`İkinci durum: ${L} = -(${R})   →   x = ${fmt2(x2)}`, `Second case: ${L} = -(${R})   →   x = ${fmt2(x2)}`));
        [x1, x2].forEach((x) => steps.push(tx(`Kontrol: x = ${fmt2(x)} → |${fmt2(x + p.q)}| = ${fmt2(Math.abs(x + p.q))},  |${fmt2(p.r * x + p.s)}| = ${fmt2(Math.abs(p.r * x + p.s))} ✓`, `Check: x = ${fmt2(x)} → |${fmt2(x + p.q)}| = ${fmt2(Math.abs(x + p.q))},  |${fmt2(p.r * x + p.s)}| = ${fmt2(Math.abs(p.r * x + p.s))} ✓`)));
        steps.push(tx(`Sonuç: x = ${fmt2(Math.min(x1, x2))}  veya  x = ${fmt2(Math.max(x1, x2))}`, `Result: x = ${fmt2(Math.min(x1, x2))}  or  x = ${fmt2(Math.max(x1, x2))}`));
        break;
      }
      case 'extr': {
        const { valid, invalid } = extrSolutions(p);
        steps.push(tx(`Verilen denklem: |x + ${p.c}| = ${p.d}x`, `Given equation: |x + ${p.c}| = ${p.d}x`));
        steps.push(tx(`Sağ taraf bir uzaklığa eşit olduğundan ${p.d}x ≥ 0, yani x ≥ 0 olmalıdır.`, `The right side equals a distance, so ${p.d}x ≥ 0, that is x ≥ 0, is required.`));
        steps.push(tx(`Birinci durum: x + ${p.c} = ${p.d}x   →   x = ${fmt2(valid)}`, `First case: x + ${p.c} = ${p.d}x   →   x = ${fmt2(valid)}`));
        steps.push(tx(`İkinci durum: x + ${p.c} = -${p.d}x   →   x = ${fmt2(invalid)}`, `Second case: x + ${p.c} = -${p.d}x   →   x = ${fmt2(invalid)}`));
        steps.push(tx(`Kontrol: x = ${fmt2(valid)} ≥ 0 → |${fmt2(valid + p.c)}| = ${fmt2(p.d * valid)} ✓ (GEÇERLİ)`, `Check: x = ${fmt2(valid)} ≥ 0 → |${fmt2(valid + p.c)}| = ${fmt2(p.d * valid)} ✓ (VALID)`));
        steps.push(tx(`Kontrol: x = ${fmt2(invalid)} < 0 → sol taraf ${fmt2(Math.abs(invalid + p.c))}, sağ taraf ${fmt2(p.d * invalid)} negatif ✗ (yabancı kök)`, `Check: x = ${fmt2(invalid)} < 0 → left side ${fmt2(Math.abs(invalid + p.c))}, right side ${fmt2(p.d * invalid)} is negative ✗ (extraneous root)`));
        steps.push(tx(`Sonuç: x = ${fmt2(valid)}`, `Result: x = ${fmt2(valid)}`));
        break;
      }
      case 'le':
        steps.push(tx(`Verilen eşitsizlik: |${inner}| ≤ ${k}`, `Given inequality: |${inner}| ≤ ${k}`));
        steps.push(tx(`Çift taraflı yazalım: -${k} ≤ ${inner} ≤ ${k}`, `Let's write it as a double inequality: -${k} ≤ ${inner} ≤ ${k}`));
        steps.push(tx(`Her tarafa ${h} ekleyelim: ${h - k} ≤ x ≤ ${h + k}`, `Let's add ${h} to every part: ${h - k} ≤ x ≤ ${h + k}`));
        steps.push(tx(`Uçlar dahil olduğundan köşeli parantez: x ∈ [${h - k}, ${h + k}]`, `The endpoints are included, so square brackets: x ∈ [${h - k}, ${h + k}]`));
        break;
      case 'ge':
        steps.push(tx(`Verilen eşitsizlik: |${inner}| ≥ ${k}`, `Given inequality: |${inner}| ≥ ${k}`));
        steps.push(tx(`İki ayrı durum: ${inner} ≤ -${k}   veya   ${inner} ≥ ${k}`, `Two separate cases: ${inner} ≤ -${k}   or   ${inner} ≥ ${k}`));
        steps.push(tx(`Her birini çözelim: x ≤ ${h - k}   veya   x ≥ ${h + k}`, `Let's solve each: x ≤ ${h - k}   or   x ≥ ${h + k}`));
        steps.push(tx(`Aralık gösterimi: x ∈ (-∞, ${h - k}] ∪ [${h + k}, ∞)`, `Interval notation: x ∈ (-∞, ${h - k}] ∪ [${h + k}, ∞)`));
        break;
      default:
        steps.push(tx(`Verilen eşitsizlik: |${inner}| ${p.negOp} -${k}`, `Given inequality: |${inner}| ${p.negOp} -${k}`));
        steps.push(tx(`Mutlak değer her zaman ≥ 0'dır, sağ taraf ise negatif (-${k}).`, `The absolute value is always ≥ 0, while the right side is negative (-${k}).`));
        steps.push(p.negOp === '<'
          ? tx(`Negatif bir sayıdan KÜÇÜK olması imkânsızdır: çözüm yoktur, x ∈ ∅.`, `Being LESS than a negative number is impossible: no solution, x ∈ ∅.`)
          : tx(`Negatif bir sayıdan BÜYÜK olması her x için doğrudur: x ∈ ℝ = (-∞, ∞).`, `Being GREATER than a negative number is true for every x: x ∈ ℝ = (-∞, ∞).`));
    }
    return steps;
  }
  function extraDraw(canvas, p) {
    const { h, k } = p;
    let halfWidth = Math.max(8.0, Math.abs(h) + k * 1.5 + 4.0);
    if (p.extra === 'abs2') {
      const s = abs2Solutions(p);
      halfWidth = Math.max(8.0, Math.abs(s.x1) + Math.abs(s.x2) + 4.0);
      canvas.setViewport(-halfWidth, halfWidth, -1, 1);
      canvas.addMarker({ x: s.x1, y: 0, color: canvas.gold(), radius: 7.0, label: fmt2(s.x1) });
      canvas.addMarker({ x: s.x2, y: 0, color: canvas.gold(), radius: 7.0, label: fmt2(s.x2) });
      return;
    }
    if (p.extra === 'extr') {
      const s = extrSolutions(p);
      halfWidth = Math.max(8.0, Math.abs(s.valid) + Math.abs(s.invalid) + 4.0);
      canvas.setViewport(-halfWidth, halfWidth, -1, 1);
      canvas.addMarker({ x: s.valid, y: 0, color: canvas.green(), radius: 7.0, label: fmt2(s.valid) });
      canvas.addMarker({ x: s.invalid, y: 0, color: canvas.red(), radius: 7.0, hollow: true, label: fmt2(s.invalid) });
      return;
    }
    canvas.setViewport(-halfWidth, halfWidth, -1, 1);
    switch (p.extra) {
      case 'zero':
        canvas.addMarker({ x: h, y: 0, color: canvas.gold(), radius: 7.0, label: String(h) });
        break;
      case 'none':
        canvas.addMarker({ x: h, y: 0, color: Theme.palette().subtleForeground, radius: 4.0, label: `h = ${h}` });
        break;
      case 'le':
        canvas.addRegion({ xMin: h - k, xMax: h + k });
        canvas.addMarker({ x: h - k, y: 0, color: canvas.accent(), radius: 7.0 });
        canvas.addMarker({ x: h + k, y: 0, color: canvas.accent(), radius: 7.0 });
        break;
      case 'ge':
        canvas.addRegion({ xMin: canvas.worldMinX, xMax: h - k });
        canvas.addRegion({ xMin: h + k, xMax: canvas.worldMaxX });
        canvas.addMarker({ x: h - k, y: 0, color: canvas.accent(), radius: 7.0 });
        canvas.addMarker({ x: h + k, y: 0, color: canvas.accent(), radius: 7.0 });
        break;
      default:
        if (p.negOp === '>') canvas.addRegion({ xMin: canvas.worldMinX, xMax: canvas.worldMaxX });
        canvas.addMarker({ x: h, y: 0, color: Theme.palette().subtleForeground, radius: 4.0, label: `h = ${h}` });
    }
  }

  function solveSteps(p) {
    if (p.extra) return extraSteps(p);
    const steps = [];
    const { h, k, a } = p;

    switch (p.mode) {
      case 0: {
        steps.push(I18N.tx(`Verilen denklem: |x ${signedTerm(-h)}| = ${k}`, `Given equation: |x ${signedTerm(-h)}| = ${k}`));
        steps.push(I18N.tx(`Mutlak değer içindeki ifade ya ${k}'ya ya da -${k}'ya eşit olabilir:`, `The expression inside the absolute value can equal either ${k} or -${k}:`));
        steps.push(`   x ${signedTerm(-h)} = ${k}   →   x = ${h + k}`);
        steps.push(`   x ${signedTerm(-h)} = -${k}   →   x = ${h - k}`);
        steps.push(I18N.tx(`Sonuç: x = ${h - k}  veya  x = ${h + k}`, `Result: x = ${h - k}  or  x = ${h + k}`));
        break;
      }
      case 1: {
        const bValue = -a * h; // so that a*x + bValue = a*(x-h)
        steps.push(I18N.tx(`Verilen denklem: |${a}x ${signedTerm(bValue)}| = ${k}`, `Given equation: |${a}x ${signedTerm(bValue)}| = ${k}`));
        steps.push(I18N.tx(`İki durum: ${a}x ${signedTerm(bValue)} = ${k}   veya   ${a}x ${signedTerm(bValue)} = -${k}`, `Two cases: ${a}x ${signedTerm(bValue)} = ${k}   or   ${a}x ${signedTerm(bValue)} = -${k}`));
        const sol1 = (k - bValue) / a;
        const sol2 = (-k - bValue) / a;
        steps.push(I18N.tx(`Birinci durumu çözelim: x = ${fmt2(sol1)}`, `Let's solve the first case: x = ${fmt2(sol1)}`));
        steps.push(I18N.tx(`İkinci durumu çözelim: x = ${fmt2(sol2)}`, `Let's solve the second case: x = ${fmt2(sol2)}`));
        steps.push(I18N.tx(`Sonuç: x = ${fmt2(Math.min(sol1, sol2))}  veya  x = ${fmt2(Math.max(sol1, sol2))}`, `Result: x = ${fmt2(Math.min(sol1, sol2))}  or  x = ${fmt2(Math.max(sol1, sol2))}`));
        break;
      }
      case 2: {
        steps.push(I18N.tx(`Verilen eşitsizlik: |x ${signedTerm(-h)}| < ${k}`, `Given inequality: |x ${signedTerm(-h)}| < ${k}`));
        steps.push(I18N.tx(`Bu, x'in ${h}'ye uzaklığının ${k}'dan KÜÇÜK olduğu anlamına gelir.`, `This means the distance from x to ${h} is LESS than ${k}.`));
        steps.push(I18N.tx(`Çift taraflı eşitsizlik olarak yazalım: -${k} < x ${signedTerm(-h)} < ${k}`, `Let's write it as a double inequality: -${k} < x ${signedTerm(-h)} < ${k}`));
        steps.push(I18N.tx(`Her tarafa ${h} ekleyelim: ${h - k} < x < ${h + k}`, `Let's add ${h} to every part: ${h - k} < x < ${h + k}`));
        steps.push(I18N.tx(`Aralık gösterimi: x ∈ (${h - k}, ${h + k})`, `Interval notation: x ∈ (${h - k}, ${h + k})`));
        break;
      }
      default: {
        steps.push(I18N.tx(`Verilen eşitsizlik: |x ${signedTerm(-h)}| > ${k}`, `Given inequality: |x ${signedTerm(-h)}| > ${k}`));
        steps.push(I18N.tx(`Bu, x'in ${h}'ye uzaklığının ${k}'dan BÜYÜK olduğu anlamına gelir - x, ${h}'nin ya çok solunda ya da çok sağındadır.`, `This means the distance from x to ${h} is GREATER than ${k} - x lies either far to the left or far to the right of ${h}.`));
        steps.push(I18N.tx(`İki ayrı durum: x ${signedTerm(-h)} < -${k}   veya   x ${signedTerm(-h)} > ${k}`, `Two separate cases: x ${signedTerm(-h)} < -${k}   or   x ${signedTerm(-h)} > ${k}`));
        steps.push(I18N.tx(`Her birini çözelim: x < ${h - k}   veya   x > ${h + k}`, `Let's solve each: x < ${h - k}   or   x > ${h + k}`));
        steps.push(I18N.tx(`Aralık gösterimi: x ∈ (-∞, ${h - k}) ∪ (${h + k}, ∞)`, `Interval notation: x ∈ (-∞, ${h - k}) ∪ (${h + k}, ∞)`));
      }
    }

    return steps;
  }

  function draw(canvas, p) {
    if (p.extra) { extraDraw(canvas, p); return; }
    const { h, k, a } = p;
    const halfWidth = Math.max(8.0, Math.abs(h) + k * 1.5 + 4.0);
    canvas.setViewport(-halfWidth, halfWidth, -1, 1);

    switch (p.mode) {
      case 0: {
        canvas.addMarker({ x: h - k, y: 0, color: canvas.gold(), radius: 7.0, label: String(h - k) });
        canvas.addMarker({ x: h + k, y: 0, color: canvas.gold(), radius: 7.0, label: String(h + k) });
        canvas.addMarker({ x: h, y: 0, color: Theme.palette().subtleForeground, radius: 4.0 });
        break;
      }
      case 1: {
        const bValue = -a * h;
        const sol1 = (k - bValue) / a;
        const sol2 = (-k - bValue) / a;
        canvas.addMarker({ x: sol1, y: 0, color: canvas.gold(), radius: 7.0, label: fmt2(sol1) });
        canvas.addMarker({ x: sol2, y: 0, color: canvas.gold(), radius: 7.0, label: fmt2(sol2) });
        break;
      }
      case 2: {
        canvas.addRegion({ xMin: h - k, xMax: h + k });
        canvas.addMarker({ x: h - k, y: 0, color: canvas.accent(), radius: 7.0, hollow: true });
        canvas.addMarker({ x: h + k, y: 0, color: canvas.accent(), radius: 7.0, hollow: true });
        break;
      }
      default: {
        canvas.addRegion({ xMin: canvas.worldMinX, xMax: h - k });
        canvas.addRegion({ xMin: h + k, xMax: canvas.worldMaxX });
        canvas.addMarker({ x: h - k, y: 0, color: canvas.accent(), radius: 7.0, hollow: true });
        canvas.addMarker({ x: h + k, y: 0, color: canvas.accent(), radius: 7.0, hollow: true });
      }
    }
  }

  Topics.register('numbers', {
    id: 'absoluteValueEquation',
    tabTitle: () => I18N.tx('Mutlak Değer Denklem ve Eşitsizlikleri', 'Absolute Value Equations and Inequalities'),
    concept: () => I18N.tx(
      "TEMEL FİKİR: |A| = uzaklık. |x - h| ifadesi 'x ile h arasındaki uzaklık' demektir.\n\nDENKLEMLER (k bir sayı)\n   |A| = k  (k > 0)   =>  A = k  VEYA  A = -k   (iki denklem, iki çözüm)\n   |A| = 0            =>  A = 0                  (tek çözüm)\n   |A| = k  (k < 0)   =>  ÇÖZÜM YOK\n   |A| = |B|          =>  A = B  VEYA  A = -B\n   |A| = B            =>  önce B ≥ 0 olması gerekir; sonra A = B veya A = -B yazılır; sonuçlar kontrol edilir.\n\nEŞİTSİZLİKLER (k > 0)\n   |A| < k   =>  -k < A < k            (TEK parça, 'arasında')\n   |A| ≤ k   =>  -k ≤ A ≤ k\n   |A| > k   =>  A < -k  VEYA  A > k   (İKİ parça, birleşim)\n   |A| ≥ k   =>  A ≤ -k  VEYA  A ≥ k\n   Özel: |x - h| < k  <=>  (h - k, h + k) ; merkez h, yarıçap k.\n   k < 0 için: |A| < k çözümsüz, |A| > k her x için doğrudur.\n\nYÖNTEM\n   1) Mutlak değeri YALNIZ bırakabiliriz (|A| = k biçimine getirip katsayılara böleriz).\n   2) k'nın işaretine bakalım: k < 0 ise denklemde çözüm yok.\n   3) Denklemde A = k ve A = -k denklemlerini AYRI çözebiliriz.\n   4) Eşitsizlikte '<' ise çift taraflı eşitsizlik, '>' ise iki ayrı eşitsizlik yazılır.\n   5) Aralıkları sadeleştirebiliriz (A içindeki ifadede x yalnız bırakılır; negatifle bölerken yön çevrilir).\n   6) |A| = B türü denklemlerde bulunan x değerlerini orijinal denklemde KONTROL edebiliriz.\n\nÖZEL DURUMLAR / SIK HATALAR\n   - |A| < k'yı 'A < k veya A > -k' diye yazmak yanlıştır; doğrusu -k < A < k (VE).\n   - |A| > k için '-k > A > k' yazmak imkânsız bir ifadedir; bunun yerine iki ayrı ışın yazılır.\n   - Mutlak değerin DIŞINDA kalan sabitler/katsayılar önce taşınır: |2x - 3| + 1 = 8  =>  |2x - 3| = 7.\n   - Eşitsizlikte uç noktalar: < ve > için yuvarlak, ≤ ve ≥ için köşeli parantez.\n   - Yabancı kök: |x + 2| = 3x'te sadece 3x ≥ 0 olan çözümler geçerlidir.\n\nMİNİ ÖRNEKLER\n   1) |2x - 3| = 7  =>  2x - 3 = 7 => x = 5;  2x - 3 = -7 => x = -2.  Çözüm: {-2, 5}.\n   2) |x - 2| < 3  =>  -3 < x - 2 < 3  =>  -1 < x < 5.  Çözüm: (-1, 5).\n   3) |x + 1| ≥ 2  =>  x + 1 ≤ -2 veya x + 1 ≥ 2  =>  x ≤ -3 veya x ≥ 1.  Çözüm: (-∞, -3] ∪ [1, ∞).\n   4) |x + 2| = 3x: 3x ≥ 0 olmalı. x + 2 = 3x => x = 1 (geçerli);  x + 2 = -3x => x = -1/2 (3x < 0, GEÇERSİZ).\n      Çözüm: {1}.",
      "KEY IDEA: |A| = distance. The expression |x - h| means 'the distance between x and h'.\n\nEQUATIONS (k a number)\n   |A| = k  (k > 0)   =>  A = k  OR  A = -k   (two equations, two solutions)\n   |A| = 0            =>  A = 0                (one solution)\n   |A| = k  (k < 0)   =>  NO SOLUTION\n   |A| = |B|          =>  A = B  OR  A = -B\n   |A| = B            =>  first B ≥ 0 is required; then A = B or A = -B; check the results.\n\nINEQUALITIES (k > 0)\n   |A| < k   =>  -k < A < k            (ONE piece, 'between')\n   |A| ≤ k   =>  -k ≤ A ≤ k\n   |A| > k   =>  A < -k  OR  A > k     (TWO pieces, a union)\n   |A| ≥ k   =>  A ≤ -k  OR  A ≥ k\n   Special: |x - h| < k  <=>  (h - k, h + k) ; centre h, radius k.\n   For k < 0: |A| < k has no solution, |A| > k is true for every x.\n\nMETHOD\n   1) We can ISOLATE the absolute value (bring it to the form |A| = k; divide by coefficients).\n   2) Let's look at the sign of k: if k < 0 the equation has no solution.\n   3) For an equation, we solve A = k and A = -k as SEPARATE equations.\n   4) For an inequality, '<' gives a double inequality and '>' gives two separate inequalities.\n   5) We can simplify the intervals (isolate x in the expression for A; the sign reverses when dividing by a negative).\n   6) For equations of type |A| = B, we CHECK the x values found in the original equation.\n\nSPECIAL CASES / COMMON PITFALLS\n   - Writing |A| < k as 'A < k or A > -k' is wrong; the correct form is -k < A < k (AND).\n   - For |A| > k, writing '-k > A > k' is impossible; we write two separate rays instead.\n   - Constants and coefficients OUTSIDE the bars are moved first: |2x - 3| + 1 = 8  =>  |2x - 3| = 7.\n   - Endpoints in inequalities: round brackets for < and >, square brackets for ≤ and ≥.\n   - Extraneous roots: in |x + 2| = 3x only solutions with 3x ≥ 0 are valid.\n\nMINI EXAMPLES\n   1) |2x - 3| = 7  =>  2x - 3 = 7 => x = 5;  2x - 3 = -7 => x = -2.  Solution: {-2, 5}.\n   2) |x - 2| < 3  =>  -3 < x - 2 < 3  =>  -1 < x < 5.  Solution: (-1, 5).\n   3) |x + 1| ≥ 2  =>  x + 1 ≤ -2 or x + 1 ≥ 2  =>  x ≤ -3 or x ≥ 1.  Solution: (-∞, -3] ∪ [1, ∞).\n   4) |x + 2| = 3x: need 3x ≥ 0. x + 2 = 3x => x = 1 (valid);  x + 2 = -3x => x = -1/2 (3x < 0, INVALID).\n      Solution: {1}."
    ),
    problemStatement: (p) => {
      if (p.extra) return extraStatement(p);
      const h = p.h;
      const k = p.k;
      switch (p.mode) {
        case 0: return I18N.tx(`|x ${signedTerm(-h)}| = ${k} denklemini çözelim.`, `Let's solve the equation |x ${signedTerm(-h)}| = ${k}.`);
        case 1: {
          const bValue = -p.a * h;
          return I18N.tx(`|${p.a}x ${signedTerm(bValue)}| = ${k} denklemini çözelim.`, `Let's solve the equation |${p.a}x ${signedTerm(bValue)}| = ${k}.`);
        }
        case 2: return I18N.tx(`|x ${signedTerm(-h)}| < ${k} eşitsizliğini çözüp aralık olarak yazalım.`, `Let's solve the inequality |x ${signedTerm(-h)}| < ${k} and write the answer as an interval.`);
        default: return I18N.tx(`|x ${signedTerm(-h)}| > ${k} eşitsizliğini çözüp aralık olarak yazalım.`, `Let's solve the inequality |x ${signedTerm(-h)}| > ${k} and write the answer as an interval.`);
      }
    },
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: p.h, y: 0 }),
    links: [
      { match: /^\s*\|A\| = k  \(k > 0\)/, make: (rng) => { const q = createProblem(rng); q.mode = rng.nextInt(0, 2); return q; } },
      { match: /^\s*\|A\| = 0 /, make: (rng) => extraBase(rng, 'zero') },
      { match: /^\s*\|A\| = k  \(k < 0\)/, make: (rng) => extraBase(rng, 'none') },
      { match: /^\s*\|A\| = \|B\|/, make: makeAbs2 },
      { match: /^\s*\|A\| = B /, make: makeExtr },
      { match: /^\s*\|A\| < k /, make: (rng) => { const q = createProblem(rng); q.mode = 2; return q; } },
      { match: /^\s*\|A\| ≤ k /, make: (rng) => extraBase(rng, 'le') },
      { match: /^\s*\|A\| > k /, make: (rng) => { const q = createProblem(rng); q.mode = 3; return q; } },
      { match: /^\s*\|A\| ≥ k /, make: (rng) => extraBase(rng, 'ge') },
      { match: /^\s*(k < 0 için|For k < 0):/, make: makeNegK },
    ],
    buildControls: (rightCol, getProblem, helpers) => {
      helpers.addSlider({
        caption: 'h', min: -10, max: 10,
        get: () => getProblem().h, set: (v) => { getProblem().h = Math.round(v); },
      });
      helpers.addSlider({
        caption: I18N.tx('k (uzaklık, pozitif)', 'k (distance, positive)'), min: 1, max: 10,
        get: () => getProblem().k, set: (v) => { getProblem().k = Math.round(v); },
      });
    },
  });
})();
