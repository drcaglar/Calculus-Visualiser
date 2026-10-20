// Ported from Modules/Preliminaries/RealLineOrderingControl.vb - a handful of numbers in mixed
// representations (integer, fraction, decimal) presented in random order, converted to decimal to
// compare, then sorted smallest to largest, matching left-to-right position on the number line.
(function () {
  // Mirrors VB's ":0.####" format - up to 4 decimals, no trailing zeros (fmt2 in graph.js only
  // gives 2 decimals, which the VB source does not use for this particular step).
  function fmt4(v) {
    if (!isFinite(v)) return String(v);
    let s = v.toFixed(4);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }

  function createProblem(rng) {
    const items = [];

    const intValue = rng.nextInt(-6, 7);
    items.push({ display: String(intValue), value: intValue });

    const den1 = [2, 3, 4, 5][rng.nextInt(0, 4)];
    let num1 = rng.nextInt(-3 * den1, 3 * den1 + 1);
    if (num1 === 0) num1 = 1;
    items.push({ display: `${num1}/${den1}`, value: num1 / den1 });

    const decValue = Math.round((rng.nextDouble() * 10.0 - 5.0) * 100) / 100;
    items.push({ display: fmt2(decValue), value: decValue });

    const den2 = [2, 3, 6, 8][rng.nextInt(0, 4)];
    let num2 = rng.nextInt(-2 * den2, 2 * den2 + 1);
    if (num2 === 0) num2 = -1;
    items.push({ display: `${num2}/${den2}`, value: num2 / den2 });

    // Shuffle so the "given" order isn't already sorted.
    shuffleArr(items, rng);
    return { items };
  }

  // ---- extra problem kinds (opened only through the "▶ Soru" links): properties of the ordering ----
  const tx = (tr, en) => I18N.tx(tr, en);
  const item = (display, value) => ({ display, value });
  function distinct(rng, lo, hi, n) {
    const out = [];
    while (out.length < n) { const v = rng.nextInt(lo, hi); if (!out.includes(v)) out.push(v); }
    return out;
  }
  function nzc(rng, lo, hi) { let c; do { c = rng.nextInt(lo, hi); } while (c === 0); return c; }
  function makeProp(rng, kind) {
    switch (kind) {
      case 'trich': { const a = rng.nextInt(-6, 7), b = rng.nextInt(-6, 7); return { items: [item(String(a), a), item(String(b), b)], extra: kind, a, b }; }
      case 'trans': { const [a, b, c] = distinct(rng, -8, 9, 3).sort((x, y) => x - y); return { items: [item(String(a), a), item(String(b), b), item(String(c), c)], extra: kind, a, b, c }; }
      case 'add': { const [a, b] = distinct(rng, -6, 7, 2).sort((x, y) => x - y); const c = nzc(rng, -5, 6); return { items: [item(String(a), a), item(String(b), b), item(String(a + c), a + c), item(String(b + c), b + c)], extra: kind, a, b, c }; }
      case 'mult': { const [a, b] = distinct(rng, -6, 7, 2).sort((x, y) => x - y); const c = nzc(rng, -4, 5); return { items: [item(String(a), a), item(String(b), b), item(String(a * c), a * c), item(String(b * c), b * c)], extra: kind, a, b, c }; }
      case 'recip': { const [a, b] = distinct(rng, 1, 10, 2).sort((x, y) => x - y); return { items: [item(String(a), a), item(String(b), b), item(`1/${a}`, 1 / a), item(`1/${b}`, 1 / b)], extra: kind, a, b }; }
      case 'dens': { const [a, b] = distinct(rng, -6, 7, 2).sort((x, y) => x - y); const m = (a + b) / 2; return { items: [item(String(a), a), item(String(b), b), item(fmt2(m), m)], extra: kind, a, b }; }
      default: { // cross multiplication, positive fractions with different values
        let n1, d1, n2, d2;
        do { d1 = rng.nextInt(2, 10); n1 = rng.nextInt(1, d1 * 2); d2 = rng.nextInt(2, 10); n2 = rng.nextInt(1, d2 * 2); } while (n1 * d2 === n2 * d1);
        return { items: [item(`${n1}/${d1}`, n1 / d1), item(`${n2}/${d2}`, n2 / d2)], extra: 'cross', n1, d1, n2, d2 };
      }
    }
  }
  const rel = (x, y) => (x < y ? '<' : (x > y ? '>' : '='));
  function extraStatement(p) {
    const { a, b, c } = p;
    switch (p.extra) {
      case 'trich': return tx(`a = ${a} ve b = ${b} için a < b, a = b, a > b durumlarından hangisi doğrudur? Birlikte bakalım.`, `For a = ${a} and b = ${b}, which of a < b, a = b, a > b is true? Let's take a look.`);
      case 'trans': return tx(`${a} < ${b} ve ${b} < ${c} olduğunu biliyoruz. Geçişlilik özelliğiyle ${a} ile ${c} arasındaki ilişkiyi bulalım.`, `We know ${a} < ${b} and ${b} < ${c}. Let's use transitivity to find the relation between ${a} and ${c}.`);
      case 'add': return tx(`${a} < ${b} eşitsizliğinin her iki tarafına ${c} ekleyelim ve sonucu sayı doğrusunda görelim.`, `Let's add ${c} to both sides of ${a} < ${b} and see the result on the number line.`);
      case 'mult': return tx(`${a} < ${b} eşitsizliğinin her iki tarafını ${c} ile çarpalım; eşitsizliğin yönü ne olur?`, `Let's multiply both sides of ${a} < ${b} by ${c}; what happens to the direction?`);
      case 'recip': return tx(`0 < ${a} < ${b} iken 1/${a} ile 1/${b} sayılarını karşılaştıralım.`, `For 0 < ${a} < ${b}, let's compare 1/${a} and 1/${b}.`);
      case 'dens': return tx(`${a} ile ${b} arasında bir reel sayı bulalım; daha fazla bulunabilir mi?`, `Let's find a real number between ${a} and ${b}; can we find more?`);
      default: return tx(`${p.n1}/${p.d1} ile ${p.n2}/${p.d2} kesirlerini çapraz çarpımla karşılaştıralım.`, `Let's compare the fractions ${p.n1}/${p.d1} and ${p.n2}/${p.d2} by cross multiplication.`);
    }
  }
  function extraSteps(p) {
    const { a, b, c } = p;
    switch (p.extra) {
      case 'trich': return [
        tx(`Sayıları sayı doğrusunda karşılaştıralım: a = ${a}, b = ${b}`, `Let's compare the numbers on the number line: a = ${a}, b = ${b}`),
        `b - a = ${b} - (${a}) = ${b - a}`,
        tx(`Fark ${b - a > 0 ? "pozitif → a, b'nin solundadır" : (b - a < 0 ? "negatif → a, b'nin sağındadır" : 'sıfır → aynı nokta')}.`, `The difference is ${b - a > 0 ? 'positive → a is to the left of b' : (b - a < 0 ? 'negative → a is to the right of b' : 'zero → the same point')}.`),
        tx(`Sonuç: a ${rel(a, b)} b (üç durumdan TAM OLARAK biri doğrudur)`, `Result: a ${rel(a, b)} b (EXACTLY one of the three cases is true)`),
      ];
      case 'trans': return [
        tx(`── 1) Verilenler ──\n${a} < ${b}  ve  ${b} < ${c}`, `── 1) Given ──\n${a} < ${b}  and  ${b} < ${c}`),
        tx(`── 2) Geçişlilik ──\na < b ve b < c ise a < c: ${a} < ${b} < ${c}`, `── 2) Transitivity ──\nIf a < b and b < c then a < c: ${a} < ${b} < ${c}`),
        tx(`Sonuç: ${a} < ${c} (sayı doğrusunda soldan sağa ${a}, ${b}, ${c})`, `Result: ${a} < ${c} (left to right on the number line: ${a}, ${b}, ${c})`),
      ];
      case 'add': return [
        tx(`── 1) Verilen ──\n${a} < ${b}`, `── 1) Given ──\n${a} < ${b}`),
        tx(`── 2) Her iki tarafa ${c} ekleyelim ──\n${a} + (${c}) = ${a + c},  ${b} + (${c}) = ${b + c}`, `── 2) Add ${c} to both sides ──\n${a} + (${c}) = ${a + c},  ${b} + (${c}) = ${b + c}`),
        tx(`Sonuç: ${a + c} < ${b + c}; toplama eşitsizliğin yönünü değiştirmez (iki nokta birlikte kayar).`, `Result: ${a + c} < ${b + c}; adding does not change the direction (both points shift together).`),
      ];
      case 'mult': return [
        tx(`── 1) Verilen ──\n${a} < ${b}`, `── 1) Given ──\n${a} < ${b}`),
        tx(`── 2) ${c} ile çarpalım ──\n${a}·(${c}) = ${a * c},  ${b}·(${c}) = ${b * c}`, `── 2) Multiply by ${c} ──\n${a}·(${c}) = ${a * c},  ${b}·(${c}) = ${b * c}`),
        c > 0
          ? tx(`c = ${c} > 0 olduğundan yön DEĞİŞMEZ: ${a * c} < ${b * c}`, `Since c = ${c} > 0 the direction does NOT change: ${a * c} < ${b * c}`)
          : tx(`c = ${c} < 0 olduğundan yön TERS DÖNER: ${a * c} > ${b * c}`, `Since c = ${c} < 0 the direction REVERSES: ${a * c} > ${b * c}`),
      ];
      case 'recip': return [
        tx(`── 1) Verilen ──\n0 < ${a} < ${b}`, `── 1) Given ──\n0 < ${a} < ${b}`),
        tx(`── 2) Ters alalım ──\n1/${a} ≈ ${fmt2(1 / a)},  1/${b} ≈ ${fmt2(1 / b)}`, `── 2) Take reciprocals ──\n1/${a} ≈ ${fmt2(1 / a)},  1/${b} ≈ ${fmt2(1 / b)}`),
        tx(`Sonuç: 1/${a} > 1/${b}; pozitif sayılarda büyük sayının tersi küçüktür.`, `Result: 1/${a} > 1/${b}; for positive numbers the larger number has the smaller reciprocal.`),
      ];
      case 'dens': {
        const m = (a + b) / 2, m2 = (a + m) / 2;
        return [
          tx(`── 1) Orta nokta ──\n(${a} + ${b})/2 = ${fmt2(m)}`, `── 1) The midpoint ──\n(${a} + ${b})/2 = ${fmt2(m)}`),
          `${a} < ${fmt2(m)} < ${b}`,
          tx(`── 2) Tekrar edelim ──\n${a} ile ${fmt2(m)} arasındaki orta nokta ${fmt2(m2)}: ${a} < ${fmt2(m2)} < ${fmt2(m)}`, `── 2) Repeat ──\nThe midpoint of ${a} and ${fmt2(m)} is ${fmt2(m2)}: ${a} < ${fmt2(m2)} < ${fmt2(m)}`),
          tx('Bu işlem sonsuza dek sürer: iki reel sayı arasında SONSUZ sayıda reel sayı vardır.', 'This can go on forever: between two real numbers there are INFINITELY many real numbers.'),
        ];
      }
      default: {
        const l = p.n1 * p.d2, r = p.n2 * p.d1;
        return [
          tx(`── 1) Çapraz çarpım ──\n${p.n1}/${p.d1} ? ${p.n2}/${p.d2}  →  ${p.n1}·${p.d2} ? ${p.n2}·${p.d1}`, `── 1) Cross multiplication ──\n${p.n1}/${p.d1} ? ${p.n2}/${p.d2}  →  ${p.n1}·${p.d2} ? ${p.n2}·${p.d1}`),
          `${l} ${rel(l, r)} ${r}`,
          tx(`Paydalar pozitif olduğundan sonuç değişmez: ${p.n1}/${p.d1} ${rel(l, r)} ${p.n2}/${p.d2}`, `The denominators are positive, so the result carries over: ${p.n1}/${p.d1} ${rel(l, r)} ${p.n2}/${p.d2}`),
          tx(`Kontrol (ondalık): ${fmt2(p.n1 / p.d1)} ${rel(l, r)} ${fmt2(p.n2 / p.d2)}`, `Check (decimals): ${fmt2(p.n1 / p.d1)} ${rel(l, r)} ${fmt2(p.n2 / p.d2)}`),
        ];
      }
    }
  }

  function solveSteps(p) {
    if (p.extra) return extraSteps(p);
    const given = p.items.map((it) => it.display).join(', ');
    const steps = [
      I18N.tx(`Verilen sayılar: ${given}`, `Given numbers: ${given}`),
      I18N.tx('Karşılaştırabilmek için her birini ondalık değere çevirelim:', "To compare them, let's convert each one to a decimal value:"),
    ];
    for (const it of p.items) {
      steps.push(`   ${it.display} = ${fmt4(it.value)}`);
    }

    const sorted = [...p.items].sort((a, b) => a.value - b.value);
    const sortedText = sorted.map((it) => it.display).join(' < ');
    steps.push(I18N.tx(`Küçükten büyüğe sıralayalım: ${sortedText}`, `Sorted from smallest to largest: ${sortedText}`));
    steps.push(I18N.tx(
      'Sayı doğrusu üzerinde bu sıralama soldan sağa doğru gerçekleşir: en küçük sayı en solda, en büyük sayı en sağdadır.',
      'On the number line this order runs from left to right: the smallest number is furthest left, the largest furthest right.'
    ));

    return steps;
  }

  function draw(canvas, p) {
    const maxAbs = Math.max(...p.items.map((it) => Math.abs(it.value)));
    const halfWidth = Math.max(4.0, maxAbs * 1.4 + 1.0);
    canvas.setViewport(-halfWidth, halfWidth, -1, 1);

    const sorted = [...p.items].sort((a, b) => a.value - b.value);
    const colors = [canvas.purple(), canvas.blue(), canvas.green(), canvas.gold(), canvas.orange()];
    sorted.forEach((it, i) => {
      canvas.addMarker({ x: it.value, y: 0, color: colors[i % colors.length], radius: 7.0, label: it.display });
    });
  }

  Topics.register('numbers', {
    id: 'realLineOrdering',
    tabTitle: () => I18N.tx('Reel Doğru', 'The Real Line'),
    concept: () => I18N.tx(
      "SAYI DOĞRUSU: her reel sayı doğru üzerinde tam bir noktaya karşılık gelir.\n   a < b  <=>  a noktası b'nin SOLUNDADIR (b - a pozitiftir).\n   Sıfırın solu negatif, sağı pozitiftir; sağa gittikçe değer artar.\n\nTEMEL ÖZELLİKLER\n   Üçlü karşılaştırma: a < b, a = b, a > b durumlarından TAM OLARAK biri doğrudur.\n   Geçişlilik: a < b ve b < c ise a < c.\n   Toplama: a < b ise a + c < b + c (her c için).\n   Çarpma: a < b ve c > 0 ise ac < bc;  a < b ve c < 0 ise ac > bc  (yön TERS DÖNER).\n   Ters alma: 0 < a < b ise 1/a > 1/b.   Örnek: 2 < 3 ama 1/2 > 1/3.\n   Yoğunluk: herhangi iki reel sayı arasında sonsuz sayıda başka reel sayı vardır.\n   a < x < b yazımı 'x, a ile b arasındadır' demektir (x > a VE x < b).\n\nYÖNTEM (farklı biçimlerdeki sayıları sıralama)\n   1) Hepsini aynı forma, genellikle ONDALIĞA çevirebiliriz (kesir: paydaya bölünür; kök: yaklaşık değer alınır).\n   2) İşaretlere bakalım: negatifler < 0 < pozitifler.\n   3) Pozitifleri ondalık basamak basamak karşılaştırabiliriz (önce tam kısım, sonra onda birler, ...).\n   4) Negatiflerde SIRA TERS: -0.75, -0.7'den KÜÇÜKTÜR (sıfırdan uzak olan daha küçük).\n   5) Küçükten büyüğe yazarız. İki kesri karşılaştırırken çapraz çarpım da kullanılabilir (paydalar pozitifse):\n      a/b < c/d  <=>  a·d < c·b.\n\nÖZEL DURUMLAR / SIK HATALAR\n   - -5 < -2: sayı büyük görünüyor diye değil, sayı doğrusunda daha SOLDA olduğu için.\n     (Mutlak değer: |-5| > |-2|, ama sıralama farklıdır.)\n   - 0.5 > 0.45 (0.50 ile 0.45 karşılaştırılır); basamak sayısına bakarak karar verilmez.\n   - Negatif sayıyla çarparken/bölerken eşitsizliğin yönü çevrilir.\n   - Kare alma: a, b ≥ 0 iken a < b <=> a² < b²; negatiflerde bu GEÇERLİ DEĞİLDİR (-3 < 2 ama 9 > 4).\n   - 0.999... = 1 olduğundan 0.999... < 1 yanlıştır.\n\nMİNİ ÖRNEK: -3/4, -0.7, 2/3, √2/2 sayılarını birlikte sıralayalım.\n   Ondalık: -0.75, -0.7, 0.6667, 0.7071.\n   Sıralama: -3/4 < -0.7 < 2/3 < √2/2.\n   Kontrol: 5/7 ile 7/10 için 5·10 = 50 > 7·7 = 49 olduğundan 5/7 > 7/10.",
      "THE NUMBER LINE: every real number corresponds to exactly one point on the line.\n   a < b  <=>  the point a lies to the LEFT of b (b - a is positive).\n   Left of zero is negative, right of zero is positive; values increase to the right.\n\nBASIC PROPERTIES\n   Trichotomy: EXACTLY one of a < b, a = b, a > b is true.\n   Transitivity: if a < b and b < c then a < c.\n   Addition: if a < b then a + c < b + c (for any c).\n   Multiplication: a < b and c > 0 gives ac < bc;  a < b and c < 0 gives ac > bc  (direction REVERSES).\n   Reciprocals: if 0 < a < b then 1/a > 1/b.   Example: 2 < 3 but 1/2 > 1/3.\n   Density: between any two real numbers there are infinitely many other real numbers.\n   Writing a < x < b means 'x is between a and b' (x > a AND x < b).\n\nMETHOD (ordering numbers written in different forms)\n   1) Let's convert all to the same form, usually DECIMAL (fraction: divide; root: approximate value).\n   2) Let's look at the signs: negatives < 0 < positives.\n   3) We can compare positives digit by digit (whole part first, then tenths, ...).\n   4) For negatives the ORDER IS REVERSED: -0.75 is SMALLER than -0.7 (further from zero is smaller).\n   5) We write them from smallest to largest. For two fractions we can also cross-multiply (positive denominators):\n      a/b < c/d  <=>  a·d < c·b.\n\nSPECIAL CASES / COMMON PITFALLS\n   - -5 < -2: not because the number 'looks big', but because it lies further LEFT on the line.\n     (Absolute values: |-5| > |-2|, but the ordering is different.)\n   - 0.5 > 0.45 (compare 0.50 with 0.45); we do not decide by the number of digits.\n   - When multiplying or dividing by a negative number, the inequality reverses.\n   - Squaring: for a, b ≥ 0, a < b <=> a² < b²; this is NOT valid for negatives (-3 < 2 but 9 > 4).\n   - Since 0.999... = 1, saying 0.999... < 1 is wrong.\n\nMINI EXAMPLE: let's order -3/4, -0.7, 2/3, √2/2.\n   Decimals: -0.75, -0.7, 0.6667, 0.7071.\n   Order: -3/4 < -0.7 < 2/3 < √2/2.\n   Check: for 5/7 and 7/10, 5·10 = 50 > 7·7 = 49, so 5/7 > 7/10."
    ),
    problemStatement: (p) => {
      if (p.extra) return extraStatement(p);
      const list = p.items.map((it) => it.display).join(' ;  ');
      return I18N.tx(`${list} sayılarını reel sayı doğrusunda küçükten büyüğe sıralayabilir miyiz?`, `Can we order the numbers ${list} from smallest to largest on the real number line?`);
    },
    links: [
      { match: /^\s*(Üçlü karşılaştırma|Trichotomy):/, make: (rng) => makeProp(rng, 'trich') },
      { match: /^\s*(Geçişlilik|Transitivity):/, make: (rng) => makeProp(rng, 'trans') },
      { match: /^\s*(Toplama|Addition):/, make: (rng) => makeProp(rng, 'add') },
      { match: /^\s*(Çarpma|Multiplication):/, make: (rng) => makeProp(rng, 'mult') },
      { match: /^\s*(Ters alma|Reciprocals):/, make: (rng) => makeProp(rng, 'recip') },
      { match: /^\s*(Yoğunluk|Density):/, make: (rng) => makeProp(rng, 'dens') },
      { match: /^\s*a\/b < c\/d/, make: (rng) => makeProp(rng, 'cross') },
      { match: /^\s*4\) (Negatiflerde SIRA TERS|For negatives the ORDER IS REVERSED)/, make: (rng) => createProblem(rng) },
    ],
    createProblem,
    solveSteps,
    draw,
    focus: (p) => {
      const v = p.items.map((it) => it.value);
      return { x: (Math.min(...v) + Math.max(...v)) / 2, y: 0 };
    },
  });
})();
