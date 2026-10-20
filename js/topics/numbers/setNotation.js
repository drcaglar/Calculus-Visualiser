// Ported from Modules/Preliminaries/SetNotationControl.vb - membership, union, intersection and
// subset checks on two randomly generated finite integer sets A and B, with a Venn diagram drawn
// using GraphCanvas's parametric-curve and labelled-marker primitives.
(function () {
  function setDisplay(values) {
    if (values.length === 0) return I18N.tx('∅ (boş küme)', '∅ (empty set)');
    return '{' + values.join(', ') + '}';
  }

  function createProblem(rng) {
    const pool = [];
    for (let i = -6; i <= 12; i++) pool.push(i); // Enumerable.Range(-6, 19) -> -6..12 shuffled
    shuffleArr(pool, rng);

    const commonCount = rng.nextInt(0, 3);
    const aOnlyCount = rng.nextInt(0, 4);
    const bOnlyCount = rng.nextInt(1, 4);

    const common = pool.slice(0, commonCount);
    const aOnly = pool.slice(commonCount, commonCount + aOnlyCount);
    const bOnly = pool.slice(commonCount + aOnlyCount, commonCount + aOnlyCount + bOnlyCount);

    const p = {
      setA: common.concat(aOnly).sort((a, b) => a - b),
      setB: common.concat(bOnly).sort((a, b) => a - b),
      taskType: rng.nextInt(0, 4), // 0 = membership, 1 = union, 2 = intersection, 3 = subset
      testValue: 0,
    };

    if (p.taskType === 0) {
      if (rng.nextInt(0, 2) === 0 && p.setA.length > 0) {
        p.testValue = p.setA[rng.nextInt(0, p.setA.length)];
      } else {
        let candidate = 20;
        while (p.setA.includes(candidate) || p.setB.includes(candidate)) candidate++;
        p.testValue = candidate;
      }
    }

    return p;
  }

  // ---- extra task types (opened only through the "▶ Soru" links): 4 = difference, 5 = complement, 6 = interval notation, 7 = number of subsets ----
  const tx = (tr, en) => I18N.tx(tr, en);
  function makeTask(rng, taskType) {
    let q;
    do { q = createProblem(rng); } while (q.setA.length === 0 && taskType !== 4 ? false : false);
    q.taskType = taskType;
    q.testValue = 0;
    if (taskType === 5) {
      const extra = [];
      for (let v = -6; v <= 12 && extra.length < 3; v++) { if (!q.setA.includes(v) && !q.setB.includes(v) && rng.nextInt(0, 3) === 0) extra.push(v); }
      q.universe = Array.from(new Set(q.setA.concat(q.setB, extra))).sort((a, b) => a - b);
    }
    return q;
  }
  function makeInterval(rng, infinite) {
    const lo = rng.nextInt(-6, 4), hi = lo + rng.nextInt(2, 7);
    const q = { setA: [], setB: [], taskType: 6, testValue: 0, lo, hi, leftClosed: rng.nextInt(0, 2) === 0, rightClosed: rng.nextInt(0, 2) === 0, infinite: !!infinite };
    q.testValue = [lo, hi, Math.floor((lo + hi) / 2), hi + 1][rng.nextInt(0, 4)];
    return q;
  }
  function makeSubsets(rng) {
    const n = rng.nextInt(1, 4);
    const pool = [];
    for (let i = -6; i <= 12; i++) pool.push(i);
    shuffleArr(pool, rng);
    return { setA: pool.slice(0, n).sort((a, b) => a - b), setB: [], taskType: 7, testValue: 0 };
  }
  function subsetsOf(arr) {
    let out = [[]];
    arr.forEach((x) => { out = out.concat(out.map((s) => s.concat([x]))); });
    return out;
  }
  function intervalText(p) {
    if (p.infinite) return `${p.leftClosed ? '[' : '('}${p.lo}, ∞)`;
    return `${p.leftClosed ? '[' : '('}${p.lo}, ${p.hi}${p.rightClosed ? ']' : ')'}`;
  }
  function intervalIneq(p) {
    const l = `${p.lo} ${p.leftClosed ? '≤' : '<'} x`;
    return p.infinite ? (p.leftClosed ? `x ≥ ${p.lo}` : `x > ${p.lo}`) : `${l} ${p.rightClosed ? '≤' : '<'} ${p.hi}`;
  }
  function inInterval(p, t) {
    const okL = p.leftClosed ? t >= p.lo : t > p.lo;
    const okR = p.infinite ? true : (p.rightClosed ? t <= p.hi : t < p.hi);
    return okL && okR;
  }
  function extraStatement(p) {
    const a = setDisplay(p.setA), b = setDisplay(p.setB);
    switch (p.taskType) {
      case 4: return tx(`A = ${a} ve B = ${b} kümeleri için A \\ B farkını yazabilir miyiz?`, `For A = ${a} and B = ${b}, can we write the difference A \\ B?`);
      case 5: return tx(`Evrensel küme U = ${setDisplay(p.universe)} ve A = ${a} için A' tümleyenini bulalım.`, `For the universal set U = ${setDisplay(p.universe)} and A = ${a}, let's find the complement A'.`);
      case 6: return tx(`${intervalText(p)} aralığını eşitsizlik olarak yazalım ve ${p.testValue} sayısının bu aralıkta olup olmadığına bakalım.`, `Let's write the interval ${intervalText(p)} as an inequality and check whether ${p.testValue} lies in it.`);
      default: return tx(`A = ${a} kümesinin kaç alt kümesi vardır? Hepsini yazalım.`, `How many subsets does A = ${a} have? Let's list them all.`);
    }
  }
  function extraSteps(p) {
    const steps = [];
    if (p.taskType === 4) {
      const diff = p.setA.filter((x) => !p.setB.includes(x));
      steps.push(`A = ${setDisplay(p.setA)}`, `B = ${setDisplay(p.setB)}`);
      steps.push(tx("A \\ B için A'nın elemanlarından B'de OLMAYANları alırız.", "For A \\ B we keep the elements of A that are NOT in B."));
      p.setA.forEach((x) => steps.push(tx(`${x} ∈ B mi? ${p.setB.includes(x) ? 'Evet → çıkarılır' : 'Hayır → kalır'}`, `Is ${x} ∈ B? ${p.setB.includes(x) ? 'Yes → removed' : 'No → kept'}`)));
      steps.push(`A \\ B = ${setDisplay(diff)}`);
    } else if (p.taskType === 5) {
      const comp = p.universe.filter((x) => !p.setA.includes(x));
      steps.push(`U = ${setDisplay(p.universe)}`, `A = ${setDisplay(p.setA)}`);
      steps.push(tx("A' için evrensel kümede olup A'da olmayan elemanları alırız.", "For A' we keep the elements of U that are not in A."));
      steps.push(`A' = ${setDisplay(comp)}`);
      steps.push(tx(`Kontrol: |A| + |A'| = ${p.setA.length} + ${comp.length} = ${p.universe.length} = |U| ✓`, `Check: |A| + |A'| = ${p.setA.length} + ${comp.length} = ${p.universe.length} = |U| ✓`));
    } else if (p.taskType === 6) {
      const t = p.testValue, ok = inInterval(p, t);
      steps.push(tx(`── 1) Parantezleri okuyalım ──\n${intervalText(p)}: ${p.leftClosed ? 'köşeli parantez → ' + p.lo + ' DAHİL' : 'yuvarlak parantez → ' + p.lo + ' dahil DEĞİL'}${p.infinite ? '; ∞ için her zaman yuvarlak' : ', ' + (p.rightClosed ? 'köşeli → ' + p.hi + ' DAHİL' : 'yuvarlak → ' + p.hi + ' dahil DEĞİL')}`,
        `── 1) Read the brackets ──\n${intervalText(p)}: ${p.leftClosed ? 'square bracket → ' + p.lo + ' INCLUDED' : 'round bracket → ' + p.lo + ' NOT included'}${p.infinite ? '; always round next to ∞' : ', ' + (p.rightClosed ? 'square → ' + p.hi + ' INCLUDED' : 'round → ' + p.hi + ' NOT included')}`));
      steps.push(tx(`── 2) Eşitsizlik ──\n${intervalIneq(p)}`, `── 2) Inequality ──\n${intervalIneq(p)}`));
      steps.push(tx(`── 3) Eleman testi ──\n${t} sayısı için ${intervalIneq(p)} ifadesi ${ok ? 'doğru' : 'yanlış'} → ${t} ${ok ? '∈' : '∉'} ${intervalText(p)}`, `── 3) Membership test ──\nFor ${t}, ${intervalIneq(p)} is ${ok ? 'true' : 'false'} → ${t} ${ok ? '∈' : '∉'} ${intervalText(p)}`));
    } else {
      const subs = subsetsOf(p.setA);
      steps.push(`A = ${setDisplay(p.setA)},  n = ${p.setA.length}`);
      steps.push(tx(`Her eleman için iki seçenek vardır (alt kümede ya da değil): 2ⁿ = 2^${p.setA.length} = ${subs.length}`, `Each element has two choices (in the subset or not): 2ⁿ = 2^${p.setA.length} = ${subs.length}`));
      steps.push(tx(`Hepsini yazalım: ${subs.map((s) => (s.length ? '{' + s.join(', ') + '}' : '∅')).join(', ')}`, `Let's list them all: ${subs.map((s) => (s.length ? '{' + s.join(', ') + '}' : '∅')).join(', ')}`));
      steps.push(tx('Boş küme ∅ ve A kümesinin kendisi de alt kümelerdendir.', 'The empty set ∅ and A itself are also subsets.'));
    }
    return steps;
  }
  function intervalDraw(canvas, p) {
    const hi = p.infinite ? p.lo + 6 : p.hi;
    const w = Math.max(8, Math.abs(p.lo) + Math.abs(hi) + 4);
    canvas.setViewport(-w, w, -1, 1);
    canvas.addRegion({ xMin: p.lo, xMax: p.infinite ? w : p.hi });
    canvas.addMarker({ x: p.lo, y: 0, color: canvas.accent(), radius: 7.0, hollow: !p.leftClosed, label: String(p.lo) });
    if (!p.infinite) canvas.addMarker({ x: p.hi, y: 0, color: canvas.accent(), radius: 7.0, hollow: !p.rightClosed, label: String(p.hi) });
    canvas.addMarker({ x: p.testValue, y: 0, color: inInterval(p, p.testValue) ? canvas.green() : canvas.orange(), radius: 5.0, label: `t = ${p.testValue}` });
  }

  function solveSteps(p) {
    if (p.taskType >= 4) return extraSteps(p);
    const steps = [`A = ${setDisplay(p.setA)}`, `B = ${setDisplay(p.setB)}`];

    switch (p.taskType) {
      case 0: {
        const isMember = p.setA.includes(p.testValue);
        steps.push(I18N.tx(`Test edeceğimiz eleman: x = ${p.testValue}`, `The element we will test: x = ${p.testValue}`));
        steps.push(I18N.tx(`A kümesinin elemanlarını sırayla kontrol edelim: ${setDisplay(p.setA)}`, `Let's check the elements of A one by one: ${setDisplay(p.setA)}`));
        steps.push(isMember
          ? I18N.tx(`${p.testValue} sayısı A listesinde bulundu.`, `${p.testValue} was found in the list of A.`)
          : I18N.tx(`${p.testValue} sayısı A listesinde bulunamadı.`, `${p.testValue} was not found in the list of A.`));
        steps.push(I18N.tx(`Sonuç: ${p.testValue} ${isMember ? '∈' : '∉'} A`, `Result: ${p.testValue} ${isMember ? '∈' : '∉'} A`));
        break;
      }
      case 1: {
        const union = Array.from(new Set(p.setA.concat(p.setB))).sort((a, b) => a - b);
        steps.push(I18N.tx('A ∪ B için iki kümedeki TÜM elemanları bir araya getirebiliriz (ortak olanlar bir kez yazılır).', 'For A ∪ B, we can gather ALL elements of both sets (common ones are written once).'));
        steps.push(`A ∪ B = ${setDisplay(union)}`);
        break;
      }
      case 2: {
        const inter = p.setA.filter((x) => p.setB.includes(x)).sort((a, b) => a - b);
        steps.push(I18N.tx('A ∩ B için SADECE her iki kümede birden bulunan elemanları alırız.', 'For A ∩ B, we pick ONLY the elements that are in both sets.'));
        steps.push(inter.length === 0
          ? I18N.tx('A ve B kümelerinin hiçbir ortak elemanı yok.', 'Sets A and B have no common elements.')
          : I18N.tx(`Ortak elemanlar: ${setDisplay(inter)}`, `Common elements: ${setDisplay(inter)}`));
        steps.push(`A ∩ B = ${inter.length === 0 ? I18N.tx('∅ (boş küme)', '∅ (empty set)') : setDisplay(inter)}`);
        break;
      }
      default: {
        steps.push(I18N.tx("A ⊆ B olması için A'nın HER elemanının B'de de bulunması gerekir.", 'For A ⊆ B, EVERY element of A must also be in B.'));
        let isSubset = true;
        for (const a of p.setA) {
          const inB = p.setB.includes(a);
          steps.push(I18N.tx(`${a} ∈ B mi? ${inB ? 'Evet' : 'Hayır'}`, `Is ${a} ∈ B? ${inB ? 'Yes' : 'No'}`));
          if (!inB) isSubset = false;
        }
        if (p.setA.length === 0) {
          steps.push(I18N.tx("A boş küme olduğu için (kontrol edilecek eleman yok) her zaman B'nin alt kümesidir.", 'Since A is the empty set (no elements to check), it is always a subset of B.'));
        }
        steps.push(I18N.tx(`Sonuç: A ${isSubset ? '⊆' : '⊄'} B`, `Result: A ${isSubset ? '⊆' : '⊄'} B`));
      }
    }

    return steps;
  }

  function placeElementLabels(canvas, values, centerX, color) {
    const startY = 0.7 * (values.length - 1) / 2.0;
    for (let i = 0; i < values.length; i++) {
      canvas.addMarker({ x: centerX, y: startY - i * 0.7, color, radius: 3.0, label: String(values[i]) });
    }
  }

  function draw(canvas, p) {
    if (p.taskType === 6) { intervalDraw(canvas, p); return; }
    canvas.setViewport(-5, 5, -3.5, 3.5);
    canvas.showGridAndAxes = false; // Venn diagram - a coordinate grid behind it would only clutter it.

    canvas.addParametric({
      xOfT: (t) => -1.3 + 2.0 * Math.cos(t), yOfT: (t) => 2.0 * Math.sin(t),
      tMin: 0, tMax: 2 * Math.PI, color: canvas.blue(), thickness: 2.5,
    });
    canvas.addParametric({
      xOfT: (t) => 1.3 + 2.0 * Math.cos(t), yOfT: (t) => 2.0 * Math.sin(t),
      tMin: 0, tMax: 2 * Math.PI, color: canvas.green(), thickness: 2.5,
    });

    canvas.addMarker({ x: -1.3, y: 2.4, color: canvas.blue(), radius: 1, label: 'A' });
    canvas.addMarker({ x: 1.3, y: 2.4, color: canvas.green(), radius: 1, label: 'B' });

    const common = p.setA.filter((x) => p.setB.includes(x)).sort((a, b) => a - b);
    const aOnly = p.setA.filter((x) => !p.setB.includes(x)).sort((a, b) => a - b);
    const bOnly = p.setB.filter((x) => !p.setA.includes(x)).sort((a, b) => a - b);

    placeElementLabels(canvas, aOnly, -2.6, canvas.blue());
    placeElementLabels(canvas, bOnly, 2.6, canvas.green());
    placeElementLabels(canvas, common, 0.0, canvas.gold());
  }

  Topics.register('numbers', {
    id: 'setNotation',
    tabTitle: () => I18N.tx('Küme Gösterimi', 'Set Notation'),
    concept: () => I18N.tx(
      "KÜME NEDİR? Elemanları net biçimde belirlenmiş nesneler topluluğu.\n   Liste yöntemi: A = {1, 2, 3, 4}  (sıra önemsiz, tekrar yazılmaz: {1, 2, 2, 3} = {1, 2, 3})\n   Kural yöntemi: B = {x | x ∈ ℤ ve 1 ≤ x ≤ 4}  ('|' işareti 'öyle ki' okunur)\n   Boş küme: ∅ = { }  (hiç eleman içermez)\n\nTEMEL GÖSTERİM\n   x ∈ A      x, A'nın elemanıdır          x ∉ A      x, A'nın elemanı değildir\n   A ⊆ B      A'nın her elemanı B'dedir (alt küme)\n   A = B      A ⊆ B ve B ⊆ A\n   A ∪ B      birleşim: A'da YA DA B'de olan (ya da her ikisinde) tüm elemanlar\n   A ∩ B      kesişim: HEM A'da HEM B'de olan elemanlar (ortak yoksa ∅)\n   A \\ B     fark: A'da olup B'de olmayanlar\n   A'         tümleyen: evrensel kümede olup A'da olmayanlar\n\nARALIK GÖSTERİMİ (ℝ'nin alt kümeleri)\n   (a, b)  a < x < b      [a, b]  a ≤ x ≤ b      [a, b)  a ≤ x < b\n   (a, ∞)  x > a          (-∞, b]  x ≤ b          ℝ = (-∞, ∞)\n   Köşeli parantez ucu DAHİL eder, yuvarlak parantez dahil ETMEZ. ∞ ve -∞ için her zaman\n   yuvarlak parantez kullanılır. Eşitsizlik çözümleri genellikle aralıkların birleşimidir,\n   örn. (-∞, -3) ∪ (3, ∞).\n\nYÖNTEM (iki kümeyle işlem)\n   1) Her iki kümeyi liste biçiminde yazalım; tekrarları atalım.\n   2) Birleşim için her iki listedeki tüm elemanları, birer kez yazarak toplayabiliriz.\n   3) Kesişim için sadece iki listede de bulunanları alırız.\n   4) Fark için A'daki elemanlardan B'de bulunanları çıkarırız.\n   5) Alt küme için A'nın HER elemanını B'de arayabiliriz; biri bile yoksa A, B'nin alt kümesi değildir.\n\nÖZEL DURUMLAR / SIK HATALAR\n   - ∈ eleman-küme, ⊆ küme-küme ilişkisidir: 2 ∈ A doğru, {2} ⊆ A doğru, 2 ⊆ A yanlış biçimdir.\n   - ∅ her kümenin alt kümesidir (∅ ⊆ A); ancak ∅ ≠ {∅} ve ∅ ≠ {0}.\n   - n elemanlı kümenin 2ⁿ alt kümesi vardır (3 elemanlı kümenin 8 alt kümesi).\n   - Birleşimde ortak eleman iki kez yazılmaz.\n   - [a, b] ile (a, b) farklıdır: uç noktalar dahil mi, değil mi?\n\nMİNİ ÖRNEK: A = {1, 2, 3, 4}, B = {3, 4, 5}.\n   A ∪ B = {1, 2, 3, 4, 5}      A ∩ B = {3, 4}      A \\ B = {1, 2}\n   {3, 4} ⊆ A doğru; 5 ∉ A; B ⊆ A yanlış (5 ∈ B ama 5 ∉ A).",
      "WHAT IS A SET? A collection of objects whose membership is clearly determined.\n   Roster method: A = {1, 2, 3, 4}  (order is irrelevant, no repeats: {1, 2, 2, 3} = {1, 2, 3})\n   Rule method: B = {x | x ∈ ℤ and 1 ≤ x ≤ 4}  (the bar '|' is read 'such that')\n   Empty set: ∅ = { }  (contains no elements)\n\nBASIC NOTATION\n   x ∈ A      x is an element of A         x ∉ A      x is not an element of A\n   A ⊆ B      every element of A is in B (subset)\n   A = B      A ⊆ B and B ⊆ A\n   A ∪ B      union: all elements in A OR in B (or both)\n   A ∩ B      intersection: elements in BOTH A AND B (∅ if nothing in common)\n   A \\ B     difference: elements in A that are not in B\n   A'         complement: elements of the universal set that are not in A\n\nINTERVAL NOTATION (subsets of ℝ)\n   (a, b)  a < x < b      [a, b]  a ≤ x ≤ b      [a, b)  a ≤ x < b\n   (a, ∞)  x > a          (-∞, b]  x ≤ b          ℝ = (-∞, ∞)\n   A square bracket INCLUDES the endpoint, a round bracket does NOT. Always use a round\n   bracket next to ∞ and -∞. Inequality solutions are often unions of intervals,\n   e.g. (-∞, -3) ∪ (3, ∞).\n\nMETHOD (operations on two sets)\n   1) Let's write both sets in roster form and drop repeats.\n   2) Union: we collect all elements of both lists, writing each once.\n   3) Intersection: we keep only the elements that appear in both lists.\n   4) Difference: we remove from A's elements those that appear in B.\n   5) Subset: we look for EVERY element of A in B; if even one is missing, A is not a subset of B.\n\nSPECIAL CASES / COMMON PITFALLS\n   - ∈ relates an element to a set, ⊆ relates a set to a set: 2 ∈ A is right, {2} ⊆ A is right,\n     writing 2 ⊆ A is the wrong form.\n   - ∅ is a subset of every set (∅ ⊆ A); but ∅ ≠ {∅} and ∅ ≠ {0}.\n   - A set with n elements has 2ⁿ subsets (a 3-element set has 8 subsets).\n   - In a union a common element is written only once.\n   - [a, b] and (a, b) are different: are the endpoints included or not?\n\nMINI EXAMPLE: A = {1, 2, 3, 4}, B = {3, 4, 5}.\n   A ∪ B = {1, 2, 3, 4, 5}      A ∩ B = {3, 4}      A \\ B = {1, 2}\n   {3, 4} ⊆ A is true; 5 ∉ A; B ⊆ A is false (5 ∈ B but 5 ∉ A)."
    ),
    problemStatement: (p) => {
      if (p.taskType >= 4) return extraStatement(p);
      const a = setDisplay(p.setA);
      const b = setDisplay(p.setB);
      switch (p.taskType) {
        case 0: return I18N.tx(`A = ${a} A kümesi için ${p.testValue} ∈ A midir?`, `For A = ${a}, is ${p.testValue} ∈ A?`);
        case 1: return I18N.tx(`A = ${a} ve B = ${b} kümeleri için A ∪ B kümesini yazabilir miyiz?`, `For A = ${a} and B = ${b}, can we write the set A ∪ B?`);
        case 2: return I18N.tx(`A = ${a} ve B = ${b} kümeleri için A ∩ B kümesini yazabilir miyiz?`, `For A = ${a} and B = ${b}, can we write the set A ∩ B?`);
        default: return I18N.tx(`A = ${a} ve B = ${b} kümeleri için A ⊆ B olup olmadığına bakalım.`, `For A = ${a} and B = ${b}, let's see whether A ⊆ B.`);
      }
    },
    links: [
      { match: /^\s*x ∈ A {2,}\S/, make: (rng) => { let q; do { q = createProblem(rng); } while (q.taskType !== 0); return q; } },
      { match: /^\s*A ⊆ B {2,}\S/, make: (rng) => { let q; do { q = createProblem(rng); } while (q.taskType !== 3); return q; } },
      { match: /^\s*A ∪ B {2,}\S/, make: (rng) => { let q; do { q = createProblem(rng); } while (q.taskType !== 1); return q; } },
      { match: /^\s*A ∩ B {2,}\S/, make: (rng) => { let q; do { q = createProblem(rng); } while (q.taskType !== 2); return q; } },
      { match: /^\s*A \\ B {2,}\S/, make: (rng) => makeTask(rng, 4) },
      { match: /^\s*A' /, make: (rng) => makeTask(rng, 5) },
      { match: /^\s*\(a, b\)  a < x < b/, make: (rng) => makeInterval(rng, false) },
      { match: /^\s*\(a, ∞\)  x > a/, make: (rng) => makeInterval(rng, true) },
      { match: /^\s*- (n elemanlı kümenin|A set with n elements)/, make: makeSubsets },
    ],
    createProblem,
    solveSteps,
    draw,
    focus: () => ({ x: 0, y: 0 }),
  });
})();
