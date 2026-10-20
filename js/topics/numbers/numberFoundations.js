// Ported from Modules/Preliminaries/NumberFoundationsControl.vb - merges decimal representation,
// number-set classification and set notation into one worked example.
(function () {
  const MEM = { NATURAL: 'N', INTEGER: 'Z', RATIONAL: 'Q', REAL_ONLY: 'R' };

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b !== 0) { const t = b; b = a % b; a = t; }
    return Math.max(1, a);
  }

  function computeDecimalExpansion(numerator, denominator, maxDigits) {
    let integerPart = Math.trunc(numerator / denominator);
    let remainder = numerator % denominator;
    const seenAt = new Map();
    let digits = '';
    let repeatStart = -1;
    while (remainder !== 0 && digits.length < maxDigits) {
      if (seenAt.has(remainder)) { repeatStart = seenAt.get(remainder); break; }
      seenAt.set(remainder, digits.length);
      remainder *= 10;
      digits += String(Math.trunc(remainder / denominator));
      remainder = remainder % denominator;
    }
    return { integerPart, digits, repeatStart };
  }

  function appendFractionDecimalSteps(steps, numerator, denominator) {
    const g = gcd(numerator, denominator);
    const simplifiedNum = numerator / g, simplifiedDen = denominator / g;
    if (g > 1) {
      steps.push(I18N.tx(`Önce kesri sadeleştirelim (OBEB = ${g}): ${numerator}/${denominator} = ${simplifiedNum}/${simplifiedDen}`, `Let's simplify the fraction first (GCD = ${g}): ${numerator}/${denominator} = ${simplifiedNum}/${simplifiedDen}`));
    }
    const r = computeDecimalExpansion(simplifiedNum, simplifiedDen, 12);
    if (r.repeatStart === -1) {
      steps.push(I18N.tx(`Şimdi bölme yapalım: ${simplifiedNum} ÷ ${simplifiedDen} = ${r.integerPart}.${r.digits}`, `Now let's divide: ${simplifiedNum} ÷ ${simplifiedDen} = ${r.integerPart}.${r.digits}`));
      steps.push(I18N.tx('Sadeleşmiş paydada yalnızca 2 ve/veya 5 çarpanı var → ondalık açılım SONLUDUR.', 'The simplified denominator has only 2 and/or 5 as factors → the decimal expansion is FINITE.'));
    } else {
      const repeating = r.digits.substring(r.repeatStart);
      steps.push(I18N.tx(`Şimdi bölme yapalım: ${simplifiedNum} ÷ ${simplifiedDen} = ${r.integerPart}.${r.digits}...`, `Now let's divide: ${simplifiedNum} ÷ ${simplifiedDen} = ${r.integerPart}.${r.digits}...`));
      steps.push(I18N.tx(`Payda 2 ve 5 dışında bir asal çarpan içeriyor → ondalık açılım SONSUZ ve TEKRARLIDIR (tekrar eden blok: ${repeating}).`, `The denominator has a prime factor other than 2 and 5 → the decimal expansion is INFINITE and REPEATING (repeating block: ${repeating}).`));
    }
  }

  function appendRepeatingDecimalSteps(steps, integerPart, repeatBlock) {
    const n = repeatBlock.length;
    const repeatAsInt = parseInt(repeatBlock, 10);
    const denomPart = Math.pow(10, n) - 1;
    const displayValue = `${integerPart}.${repeatBlock}${repeatBlock}...`;
    steps.push(I18N.tx(`Elimizdeki tekrarlı ondalık: x = ${displayValue}`, `Our repeating decimal is: x = ${displayValue}`));
    steps.push(I18N.tx(`Tekrar eden blok ${n} basamaklı; her iki tarafı 10^${n} ile çarpıp x'i çıkarabiliriz: ${denomPart}·x = ${repeatAsInt}`, `The repeating block has ${n} digit(s); we can multiply both sides by 10^${n} and subtract x: ${denomPart}·x = ${repeatAsInt}`));
    steps.push(I18N.tx(`x'i yalnız bırakırsak: x = ${repeatAsInt}/${denomPart}`, `Isolating x gives: x = ${repeatAsInt}/${denomPart}`));
    const g = gcd(repeatAsInt, denomPart);
    const fracNum = repeatAsInt / g, fracDen = denomPart / g;
    let finalNum = fracNum, finalDen = fracDen;
    if (integerPart > 0) {
      finalNum = integerPart * fracDen + fracNum;
      steps.push(I18N.tx(`Tam kısmı geri ekleyelim: ${integerPart} + ${fracNum}/${fracDen} = ${finalNum}/${finalDen}`, `Let's add the integer part back: ${integerPart} + ${fracNum}/${fracDen} = ${finalNum}/${finalDen}`));
    } else if (g > 1) {
      steps.push(I18N.tx(`Sadeleştirelim (OBEB = ${g}): x = ${fracNum}/${fracDen}`, `Let's simplify (GCD = ${g}): x = ${fracNum}/${fracDen}`));
    }
    steps.push(I18N.tx(`Sonuç olarak: ${displayValue} = ${finalNum}/${finalDen}`, `So: ${displayValue} = ${finalNum}/${finalDen}`));
  }

  function buildClassificationSteps(p) {
    let setsText;
    switch (p.membership) {
      case MEM.NATURAL: setsText = 'ℕ, ℤ, ℚ, ℝ'; break;
      case MEM.INTEGER: setsText = 'ℤ, ℚ, ℝ'; break;
      case MEM.RATIONAL: setsText = 'ℚ, ℝ'; break;
      default: setsText = I18N.tx('sadece ℝ (irrasyonel)', 'only ℝ (irrational)');
    }
    p.classificationSteps.push(I18N.tx(`${p.expression} sayısı şu kümelere aittir: ${setsText}`, `The number ${p.expression} belongs to these sets: ${setsText}`));
  }

  function buildSetNotationTask(p, rng) {
    const pool = [];
    for (let i = -6; i <= 12; i++) pool.push(i);
    shuffleArr(pool, rng);
    const commonCount = rng.nextInt(0, 3);
    const aOnlyCount = rng.nextInt(0, 4);
    const bOnlyCount = rng.nextInt(1, 4);
    const common = pool.slice(0, commonCount);
    const aOnly = pool.slice(commonCount, commonCount + aOnlyCount);
    const bOnly = pool.slice(commonCount + aOnlyCount, commonCount + aOnlyCount + bOnlyCount);

    if (p.seedIsInteger && !aOnly.includes(p.seedAsInteger) && !common.includes(p.seedAsInteger)) {
      aOnly.push(p.seedAsInteger);
    }
    const uniqSort = (arr) => Array.from(new Set(arr)).sort((a, b) => a - b);
    p.setA = uniqSort(common.concat(aOnly));
    p.setB = uniqSort(common.concat(bOnly));
    p.setTaskType = p.seedIsInteger ? 0 : rng.nextInt(0, 4);
    p.setTestValue = p.seedIsInteger ? p.seedAsInteger : 0;

    if (p.setTaskType === 0 && !p.seedIsInteger) {
      if (rng.nextInt(0, 2) === 0 && p.setA.length > 0) {
        p.setTestValue = p.setA[rng.nextInt(0, p.setA.length)];
      } else {
        let candidate = 20;
        while (p.setA.includes(candidate) || p.setB.includes(candidate)) candidate++;
        p.setTestValue = candidate;
      }
    }
  }

  function setDisplay(values) {
    if (values.length === 0) return I18N.tx('∅ (boş küme)', '∅ (empty set)');
    return '{' + values.join(', ') + '}';
  }

  function createProblem(rng) {
    const p = { kind: rng.nextInt(0, 8), decimalSteps: [], classificationSteps: [], setA: [], setB: [] };
    switch (p.kind) {
      case 0: { // plain integer
        const n = rng.nextInt(-10, 16);
        p.expression = String(n);
        p.numericValue = n;
        p.membership = n >= 0 ? MEM.NATURAL : MEM.INTEGER;
        p.decimalSteps.push(I18N.tx(`${n} zaten bir tam sayıdır; ondalık gösterimi kendisiyle aynıdır: ${n}.0`, `${n} is already an integer; its decimal representation is the same: ${n}.0`));
        p.seedIsInteger = true; p.seedAsInteger = n;
        break;
      }
      case 1: { // non-integer fraction
        const den = [2, 3, 4, 5, 6, 7, 8][rng.nextInt(0, 7)];
        let num = rng.nextInt(1, den * 3 + 1);
        if (num % den === 0) num += 1;
        if (rng.nextInt(0, 2) === 0) num = -num;
        p.expression = `${num}/${den}`;
        p.numericValue = num / den;
        p.membership = MEM.RATIONAL;
        appendFractionDecimalSteps(p.decimalSteps, num, den);
        p.seedIsInteger = false;
        break;
      }
      case 2: { // terminating decimal
        const decimals = [0.5, 0.25, 0.75, 1.5, -2.5, 0.2, 0.6, 3.75, -0.8, 2.25];
        const value = decimals[rng.nextInt(0, decimals.length)];
        p.expression = fmt2(value) === '' ? '0' : String(value);
        p.numericValue = value;
        p.membership = MEM.RATIONAL;
        p.decimalSteps.push(I18N.tx(`${p.expression} zaten sonlu bir ondalık sayıdır; bir kesre dönüştürülebilir, bu yüzden RASYONELDİR.`, `${p.expression} is already a finite decimal; it can be written as a fraction, so it is RATIONAL.`));
        p.seedIsInteger = false;
        break;
      }
      case 3: { // perfect-square trap
        const radicand = [4, 9, 16, 25, 36, 49, 64, 81, 100][rng.nextInt(0, 9)];
        const root = Math.round(Math.sqrt(radicand));
        p.expression = `√${radicand}`;
        p.numericValue = root;
        p.membership = MEM.NATURAL;
        p.decimalSteps.push(I18N.tx(`Küçük bir tuzak: ${radicand} bir tam kare olduğu için √${radicand} = ${root} - artık bir tam sayı, ondalık gösterimi kendisidir: ${root}.0`, `A small trap: since ${radicand} is a perfect square, √${radicand} = ${root} - now an integer, and its decimal representation is itself: ${root}.0`));
        p.seedIsInteger = true; p.seedAsInteger = root;
        break;
      }
      case 4: { // irrational root
        const radicand = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13][rng.nextInt(0, 10)];
        p.expression = `√${radicand}`;
        p.numericValue = Math.sqrt(radicand);
        p.membership = MEM.REAL_ONLY;
        p.decimalSteps.push(I18N.tx(`${radicand} bir tam kare olmadığı için √${radicand} sadeleşmez; ondalık açılımı (${p.numericValue.toFixed(8)}...) hiç bitmez ve hiç tekrar etmez.`, `Since ${radicand} is not a perfect square, √${radicand} does not simplify; its decimal expansion (${p.numericValue.toFixed(8)}...) never ends and never repeats.`));
        p.seedIsInteger = false;
        break;
      }
      case 5: { // multiple of pi
        const multiplier = rng.nextInt(1, 4);
        p.expression = multiplier === 1 ? 'π' : `${multiplier}π`;
        p.numericValue = multiplier * Math.PI;
        p.membership = MEM.REAL_ONLY;
        p.decimalSteps.push(I18N.tx('π irrasyoneldir (ondalık açılımı hiç bitmez, hiç tekrar etmez); sıfırdan farklı bir tam sayı katı da irrasyoneldir.', 'π is irrational (its decimal expansion never ends and never repeats); a nonzero integer multiple of it is irrational too.'));
        p.seedIsInteger = false;
        break;
      }
      case 6: { // fraction trap simplifying to an integer
        const den = [2, 3, 4, 5][rng.nextInt(0, 4)];
        const multiplier = rng.nextInt(2, 6);
        let num = den * multiplier;
        if (rng.nextInt(0, 2) === 0) num = -num;
        p.expression = `${num}/${den}`;
        p.numericValue = num / den;
        p.membership = p.numericValue >= 0 ? MEM.NATURAL : MEM.INTEGER;
        const iv = Math.trunc(p.numericValue);
        p.decimalSteps.push(I18N.tx(`Küçük bir tuzak: ${num}/${den} tam bölünüyor → ${num}/${den} = ${iv}, ondalık gösterimi ${iv}.0`, `A small trap: ${num}/${den} divides evenly → ${num}/${den} = ${iv}, decimal representation ${iv}.0`));
        p.seedIsInteger = true; p.seedAsInteger = iv;
        break;
      }
      default: { // repeating decimal -> fraction
        const intPart = rng.nextInt(0, 4);
        const blockLength = rng.nextInt(1, 3);
        const maxValue = Math.pow(10, blockLength) - 1;
        const blockValue = rng.nextInt(1, maxValue + 1);
        const blockText = String(blockValue).padStart(blockLength, '0');
        appendRepeatingDecimalSteps(p.decimalSteps, intPart, blockText);
        const n = blockText.length;
        const denomPart = Math.pow(10, n) - 1;
        p.numericValue = intPart + blockValue / denomPart;
        p.expression = `${intPart}.${blockText}${blockText}...`;
        p.membership = MEM.RATIONAL;
        p.seedIsInteger = false;
      }
    }
    buildClassificationSteps(p);
    buildSetNotationTask(p, rng);
    return p;
  }

  // ---- helper for the "▶ Soru" links: keep generating until the wanted sub-topic comes up ----
  function makeWhere(rng, test) {
    let q;
    do { q = createProblem(rng); } while (!test(q));
    return q;
  }

  function solveSteps(p) {
    // (links below)
    const steps = [];
    steps.push(I18N.tx('── 1) REEL SAYI: ONDALIK GÖSTERİM ──', '── 1) REAL NUMBER: DECIMAL REPRESENTATION ──'));
    steps.push(I18N.tx(`Elimizdeki sayı: ${p.expression}`, `Our number is: ${p.expression}`));
    steps.push(...p.decimalSteps);

    steps.push(I18N.tx('── 2) SAYI KÜMELERİ ──', '── 2) NUMBER SETS ──'));
    steps.push(...p.classificationSteps);

    steps.push(I18N.tx('── 3) KÜME GÖSTERİMİ ──', '── 3) SET NOTATION ──'));
    steps.push(`A = ${setDisplay(p.setA)}`);
    steps.push(`B = ${setDisplay(p.setB)}`);

    switch (p.setTaskType) {
      case 0: {
        const isMember = p.setA.includes(p.setTestValue);
        if (p.seedIsInteger) {
          steps.push(I18N.tx(`Az önce ${p.expression} sayısının ${p.seedAsInteger}'e sadeleştiğini bulmuştuk - şimdi x = ${p.seedAsInteger} için A kümesinde eleman testi yapalım.`, `We just found that ${p.expression} simplifies to ${p.seedAsInteger} - now let us test membership in A for x = ${p.seedAsInteger}.`));
        } else {
          steps.push(I18N.tx(`Eleman olup olmadığına bakacağımız sayı: x = ${p.setTestValue}`, `The element we will test: x = ${p.setTestValue}`));
        }
        steps.push(I18N.tx(`A kümesinin elemanlarına bakalım: ${setDisplay(p.setA)}`, `Let's look at the elements of A: ${setDisplay(p.setA)}`));
        steps.push(I18N.tx(`Sonuç: ${p.setTestValue} ${isMember ? '∈' : '∉'} A`, `Result: ${p.setTestValue} ${isMember ? '∈' : '∉'} A`));
        break;
      }
      case 1: {
        const union = Array.from(new Set(p.setA.concat(p.setB))).sort((a, b) => a - b);
        steps.push(I18N.tx('A ∪ B için iki kümedeki TÜM elemanlar bir araya getirilir (ortak elemanlar bir kez yazılır).', 'For A ∪ B, we combine ALL elements of both sets (common elements are written once).'));
        steps.push(`A ∪ B = ${setDisplay(union)}`);
        break;
      }
      case 2: {
        const inter = p.setA.filter((x) => p.setB.includes(x)).sort((a, b) => a - b);
        steps.push(I18N.tx('A ∩ B için SADECE her iki kümede birden bulunan elemanlar alınır.', 'For A ∩ B, we take ONLY the elements that are in both sets.'));
        steps.push(`A ∩ B = ${inter.length === 0 ? I18N.tx('∅ (boş küme)', '∅ (empty set)') : setDisplay(inter)}`);
        break;
      }
      default: {
        const isSubset = p.setA.every((x) => p.setB.includes(x));
        steps.push(I18N.tx('A ⊆ B olması için A\'nın HER elemanının B\'de de bulunması gerekir.', 'For A ⊆ B, EVERY element of A must also be in B.'));
        steps.push(I18N.tx(`Sonuç: A ${isSubset ? '⊆' : '⊄'} B`, `Result: A ${isSubset ? '⊆' : '⊄'} B`));
      }
    }
    return steps;
  }

  function draw(canvas, p) {
    const halfWidth = Math.max(6.0, Math.abs(p.numericValue) * 1.5 + 3.0);
    canvas.setViewport(-halfWidth, halfWidth, -1, 1);
    let color;
    switch (p.membership) {
      case MEM.NATURAL: color = canvas.gold(); break;
      case MEM.INTEGER: color = canvas.green(); break;
      case MEM.RATIONAL: color = canvas.blue(); break;
      default: color = canvas.purple();
    }
    canvas.addMarker({ x: p.numericValue, y: 0, color, radius: 8, label: p.expression });
  }

  Topics.register('numbers', {
    id: 'numberFoundations',
    tabTitle: () => I18N.tx('Reel Sayılar, Kümeler ve Gösterim', 'Real Numbers, Sets and Notation'),
    concept: () => I18N.tx(
      "SAYI KÜMELERİ (her biri bir sonrakinin içindedir): ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ\n   ℕ  Doğal sayılar: {0, 1, 2, 3, ...} (bazı kitaplarda 1'den başlar)\n   ℤ  Tam sayılar: {..., -2, -1, 0, 1, 2, ...}\n   ℚ  Rasyonel sayılar: p/q biçiminde yazılabilenler (p, q ∈ ℤ, q ≠ 0)\n   ℝ  Reel sayılar: ℚ ile irrasyonellerin (√2, π, e, ...) birleşimi\n\nONDALIK GÖSTERİM\n   Rasyonel sayı  <=>  ondalık açılımı SONLU ya da SONSUZ VE TEKRARLI.\n   İrrasyonel sayı <=>  açılımı sonsuz ve TEKRARSIZ (√2 = 1.41421356..., π = 3.14159...).\n   Sadeleşmiş p/q kesri SONLU açılıma sahiptir <=> q'nun asal çarpanları sadece 2 ve/veya 5.\n   Örnekler: 3/8 = 0.375 (8 = 2³, sonlu);  7/20 = 0.35 (20 = 2²·5, sonlu);\n             1/3 = 0.333... (3 var, tekrarlı);  5/12 = 0.41666... (12 = 2²·3, tekrarlı).\n   Tekrarlı ondalığı kesre çevirme: x = 0.2727... ise 100x - x = 27, yani x = 27/99 = 3/11.\n\nKÜME GÖSTERİMİ\n   x ∈ A (eleman), x ∉ A (eleman değil), A ∪ B (birleşim), A ∩ B (kesişim),\n   A ⊆ B (alt küme). Bu gösterimler bir sayının hangi kümelere ait olduğunu söylemenin\n   resmi yoludur: örneğin -2 ∈ ℤ, -2 ∉ ℕ, -2 ∈ ℚ, -2 ∈ ℝ.\n\nYÖNTEM (bir sayıyı sınıflandırma)\n   1) Önce SADELEŞTİRELİM: √16 = 4, 8/2 = 4, -6/3 = -2, 0.5 = 1/2.\n   2) Sonuç tam sayı mı diye bakalım. Evetse ℤ'dedir (negatif değilse ℕ'dedir de).\n   3) p/q kesri, sonlu ya da tekrarlı ondalık olarak yazılabiliyorsa ℚ'dadır.\n   4) Hiçbiri değilse (√2, π, e gibi) irrasyoneldir; sadece ℝ'dedir.\n   5) Sonra tüm üst kümeleri sıralayabiliriz: ℕ'deki bir sayı ℤ, ℚ ve ℝ'dedir de.\n\nÖZEL DURUMLAR / SIK HATALAR\n   - √16 = 4 bir DOĞAL sayıdır; √2 ise irrasyoneldir. Kök işaretini görünce hemen irrasyonel demeyelim.\n   - 0.999... = 1 (tam eşittir); 22/7 ve 3.14, π'nin sadece YAKLAŞIK değeridir, π değildir.\n   - 0 ∈ ℤ, ℚ, ℝ; negatif sayılar ℕ'de DEĞİLDİR.\n   - İrrasyonel + irrasyonel rasyonel olabilir: √2 + (-√2) = 0. Rasyonel + irrasyonel ise\n     her zaman irrasyoneldir.\n   - Sıfıra bölme tanımsızdır: x/0 hiçbir kümede bir sayı değildir.\n\nMİNİ ÖRNEK: -6/3 ve 5/12 sayılarını birlikte sınıflandıralım.\n   -6/3 = -2: tam sayı => -2 ∈ ℤ, ℚ, ℝ ama -2 ∉ ℕ.\n   5/12: payda 12 = 2²·3 (3 var) => ondalık açılım 0.41666... tekrarlıdır; 5/12 ∈ ℚ, ℝ; ∉ ℤ.",
      "NUMBER SETS (each one lies inside the next): ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ\n   ℕ  Natural numbers: {0, 1, 2, 3, ...} (some books start at 1)\n   ℤ  Integers: {..., -2, -1, 0, 1, 2, ...}\n   ℚ  Rational numbers: those that can be written as p/q (p, q ∈ ℤ, q ≠ 0)\n   ℝ  Real numbers: the union of ℚ and the irrationals (√2, π, e, ...)\n\nDECIMAL REPRESENTATION\n   Rational number   <=>  decimal expansion is FINITE or INFINITE AND REPEATING.\n   Irrational number <=>  expansion is infinite and NON-repeating (√2 = 1.41421356..., π = 3.14159...).\n   A reduced fraction p/q has a FINITE expansion <=> the only prime factors of q are 2 and/or 5.\n   Examples: 3/8 = 0.375 (8 = 2³, finite);  7/20 = 0.35 (20 = 2²·5, finite);\n             1/3 = 0.333... (has 3, repeating);  5/12 = 0.41666... (12 = 2²·3, repeating).\n   Repeating decimal to fraction: if x = 0.2727..., then 100x - x = 27, so x = 27/99 = 3/11.\n\nSET NOTATION\n   x ∈ A (element of), x ∉ A (not an element of), A ∪ B (union), A ∩ B (intersection),\n   A ⊆ B (subset). This notation is the formal way of saying which sets a number belongs to:\n   for example -2 ∈ ℤ, -2 ∉ ℕ, -2 ∈ ℚ, -2 ∈ ℝ.\n\nMETHOD (classifying a number)\n   1) Let's SIMPLIFY first: √16 = 4, 8/2 = 4, -6/3 = -2, 0.5 = 1/2.\n   2) Let's check whether the result is an integer. If yes it is in ℤ (and in ℕ if it is not negative).\n   3) If it can be written as a fraction p/q, or as a finite/repeating decimal, it is in ℚ.\n   4) If none of these (like √2, π, e) it is irrational; it lies only in ℝ.\n   5) Then we can list all the larger sets: a number in ℕ is also in ℤ, ℚ and ℝ.\n\nSPECIAL CASES / COMMON PITFALLS\n   - √16 = 4 is a NATURAL number; √2 is irrational. A root sign alone does not mean 'irrational'.\n   - 0.999... = 1 (exactly equal); 22/7 and 3.14 are only APPROXIMATIONS of π, not π itself.\n   - 0 ∈ ℤ, ℚ, ℝ; negative numbers are NOT in ℕ.\n   - Irrational + irrational can be rational: √2 + (-√2) = 0. Rational + irrational is\n     always irrational.\n   - Division by zero is undefined: x/0 is not a number in any set.\n\nMINI EXAMPLE: let's classify -6/3 and 5/12.\n   -6/3 = -2: an integer => -2 ∈ ℤ, ℚ, ℝ but -2 ∉ ℕ.\n   5/12: denominator 12 = 2²·3 (contains 3) => decimal 0.41666... repeats; 5/12 ∈ ℚ, ℝ; ∉ ℤ."
    ),
    problemStatement: (p) => {
      const a = setDisplay(p.setA);
      const b = setDisplay(p.setB);
      let setTaskTr, setTaskEn;
      switch (p.setTaskType) {
        case 0: setTaskTr = `A = ${a} için ${p.setTestValue} ∈ A mı?`; setTaskEn = `For A = ${a}, is ${p.setTestValue} ∈ A?`; break;
        case 1: setTaskTr = `A = ${a}, B = ${b} için A ∪ B kümesini yazabilir miyiz?`; setTaskEn = `For A = ${a}, B = ${b}, can we write A ∪ B?`; break;
        case 2: setTaskTr = `A = ${a}, B = ${b} için A ∩ B kümesini yazabilir miyiz?`; setTaskEn = `For A = ${a}, B = ${b}, can we write A ∩ B?`; break;
        default: setTaskTr = `A = ${a}, B = ${b} için A ⊆ B midir?`; setTaskEn = `For A = ${a}, B = ${b}, is A ⊆ B?`; break;
      }
      return I18N.tx(`${p.expression} sayısı hangi sayı kümelerine (ℕ, ℤ, ℚ, ℝ) aittir? Ondalık gösterimini yazalım; ${setTaskTr}`,
                     `Which of the sets ℕ, ℤ, ℚ, ℝ does ${p.expression} belong to? Let's write its decimal representation; ${setTaskEn}`);
    },
    links: [
      { match: /^\s*ℕ  /, make: (rng) => makeWhere(rng, (q) => q.membership === MEM.NATURAL) },
      { match: /^\s*ℤ  /, make: (rng) => makeWhere(rng, (q) => q.membership === MEM.INTEGER) },
      { match: /^\s*ℚ  /, make: (rng) => makeWhere(rng, (q) => q.membership === MEM.RATIONAL) },
      { match: /^\s*ℝ  /, make: (rng) => makeWhere(rng, (q) => q.membership === MEM.REAL_ONLY) },
      { match: /^\s*(Rasyonel sayı|Rational number)  /, make: (rng) => makeWhere(rng, (q) => q.kind === 1 || q.kind === 2 || q.kind === 7) },
      { match: /^\s*(İrrasyonel sayı|Irrational number) /, make: (rng) => makeWhere(rng, (q) => q.membership === MEM.REAL_ONLY) },
      { match: /^\s*(Sadeleşmiş p\/q kesri|A reduced fraction p\/q)/, make: (rng) => makeWhere(rng, (q) => q.kind === 1) },
      { match: /^\s*(Tekrarlı ondalığı kesre çevirme|Repeating decimal to fraction):/, make: (rng) => makeWhere(rng, (q) => q.kind === 7) },
      { match: /^\s*x ∈ A \(/, tab: 'setNotation' },
      { match: /^\s*1\) (Önce SADELEŞTİRELİM|Let's SIMPLIFY first)/, make: (rng) => makeWhere(rng, (q) => q.kind === 3 || q.kind === 6) },
      { match: /^\s*4\) (Hiçbiri değilse|If none of these)/, make: (rng) => makeWhere(rng, (q) => q.kind === 4 || q.kind === 5) },
    ],
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: p.numericValue, y: 0 }),
  });
})();
