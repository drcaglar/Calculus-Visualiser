// Ported from Modules/Preliminaries/IncrementsControl.vb - Δx and Δy, the horizontal and vertical
// change between two points; the building blocks of slope (Δy/Δx), the next topic.
(function () {
  function createProblem(rng) {
    const x1 = rng.nextInt(-6, 5);
    const y1 = rng.nextInt(-6, 5);
    let x2;
    do {
      x2 = rng.nextInt(-6, 7);
    } while (x2 === x1);
    const y2 = rng.nextInt(-6, 7);
    return { x1, y1, x2, y2 };
  }

  // ---- extra problem kinds (opened only through the "▶ Soru" links) ----
  const tx = (tr, en) => I18N.tx(tr, en);
  function makeReverse(rng) { const q = createProblem(rng); q.extra = 'reverse'; return q; }
  function makePath(rng) {
    const q = createProblem(rng);
    q.x3 = rng.nextInt(-6, 7); q.y3 = rng.nextInt(-6, 7);
    q.extra = 'path';
    return q;
  }
  function extraStatement(p) {
    if (p.extra === 'reverse') {
      return tx(`A(${p.x1}, ${p.y1}) ve B(${p.x2}, ${p.y2}) noktaları verilmiş. A'dan B'ye ve B'den A'ya giderken Δx ve Δy değerlerini karşılaştıralım.`,
        `Points A(${p.x1}, ${p.y1}) and B(${p.x2}, ${p.y2}) are given. Let's compare Δx and Δy going from A to B and from B to A.`);
    }
    return tx(`A(${p.x1}, ${p.y1}) → B(${p.x2}, ${p.y2}) → C(${p.x3}, ${p.y3}) yolunda artışların toplandığını görelim: Δx(A→C) ve Δy(A→C) değerlerini iki yoldan bulalım.`,
      `Along the path A(${p.x1}, ${p.y1}) → B(${p.x2}, ${p.y2}) → C(${p.x3}, ${p.y3}), let's see that increments add up: we find Δx(A→C) and Δy(A→C) in two ways.`);
  }
  function extraSteps(p) {
    if (p.extra === 'reverse') {
      const dx = p.x2 - p.x1, dy = p.y2 - p.y1;
      return [
        tx('── 1) A → B ──', '── 1) A → B ──'),
        `Δx = ${p.x2} - (${p.x1}) = ${dx},   Δy = ${p.y2} - (${p.y1}) = ${dy}`,
        tx('── 2) B → A ──', '── 2) B → A ──'),
        `Δx' = ${p.x1} - (${p.x2}) = ${p.x1 - p.x2},   Δy' = ${p.y1} - (${p.y2}) = ${p.y1 - p.y2}`,
        tx(`── 3) Karşılaştırma ──
Δx' = -Δx = ${-dx},  Δy' = -Δy = ${-dy}: yön değişince iki işaret de değişir.`, `── 3) Comparison ──
Δx' = -Δx = ${-dx},  Δy' = -Δy = ${-dy}: reversing the direction flips both signs.`),
      ];
    }
    const abx = p.x2 - p.x1, aby = p.y2 - p.y1, bcx = p.x3 - p.x2, bcy = p.y3 - p.y2;
    return [
      tx('── 1) Parça parça ──', '── 1) Piece by piece ──'),
      `A→B:  Δx = ${abx},  Δy = ${aby}`,
      `B→C:  Δx = ${bcx},  Δy = ${bcy}`,
      tx('── 2) Toplayalım ──', '── 2) Adding them ──'),
      `Δx(A→B) + Δx(B→C) = ${abx} + (${bcx}) = ${abx + bcx}`,
      `Δy(A→B) + Δy(B→C) = ${aby} + (${bcy}) = ${aby + bcy}`,
      tx('── 3) Doğrudan A → C ──', '── 3) Directly A → C ──'),
      `Δx = ${p.x3} - (${p.x1}) = ${p.x3 - p.x1},   Δy = ${p.y3} - (${p.y1}) = ${p.y3 - p.y1}`,
      tx('İki yol aynı sonucu verir: artışlar yol boyunca toplanır ✓', 'Both ways give the same result: increments add up along the path ✓'),
    ];
  }
  function extraDraw(canvas, p) {
    const xs = [p.x1, p.x2], ys = [p.y1, p.y2];
    if (p.extra === 'path') { xs.push(p.x3); ys.push(p.y3); }
    const maxAbs = Math.max(...xs.map(Math.abs), ...ys.map(Math.abs));
    const halfWidth = Math.max(8.0, maxAbs * 1.4 + 3.0);
    canvas.setViewport(-halfWidth, halfWidth, -halfWidth, halfWidth);
    canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, color: canvas.accent(), thickness: 3.0 });
    canvas.addMarker({ x: p.x1, y: p.y1, color: canvas.accent(), radius: 7.0, label: 'A' });
    canvas.addMarker({ x: p.x2, y: p.y2, color: canvas.accent(), radius: 7.0, label: 'B' });
    if (p.extra === 'path') {
      canvas.addSegment({ x1: p.x2, y1: p.y2, x2: p.x3, y2: p.y3, color: canvas.blue(), thickness: 3.0 });
      canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x3, y2: p.y3, color: canvas.gray(), thickness: 1.5, dashed: true });
      canvas.addMarker({ x: p.x3, y: p.y3, color: canvas.gold(), radius: 7.0, label: 'C' });
    }
  }

  function solveSteps(p) {
    if (p.extra) return extraSteps(p);
    const deltaX = p.x2 - p.x1;
    const deltaY = p.y2 - p.y1;
    const deltaXDesc = deltaX > 0
      ? I18N.tx('pozitif → sağa doğru hareket', 'positive → moving right')
      : (deltaX < 0
        ? I18N.tx('negatif → sola doğru hareket', 'negative → moving left')
        : I18N.tx('sıfır → yatayda hareket yok', 'zero → no horizontal movement'));
    const deltaYDesc = deltaY > 0
      ? I18N.tx('pozitif → yukarı doğru hareket', 'positive → moving up')
      : (deltaY < 0
        ? I18N.tx('negatif → aşağı doğru hareket', 'negative → moving down')
        : I18N.tx('sıfır → dikeyde hareket yok', 'zero → no vertical movement'));

    return [
      I18N.tx(`Başlangıç noktamız A(${p.x1}, ${p.y1}), bitiş noktamız B(${p.x2}, ${p.y2}).`, `Our start point is A(${p.x1}, ${p.y1}) and our end point is B(${p.x2}, ${p.y2}).`),
      `Δx = x₂ - x₁ = ${p.x2} - (${p.x1}) = ${deltaX}`,
      `Δy = y₂ - y₁ = ${p.y2} - (${p.y1}) = ${deltaY}`,
      `Δx ${deltaXDesc}`,
      `Δy ${deltaYDesc}`,
    ];
  }

  function draw(canvas, p) {
    if (p.extra) { extraDraw(canvas, p); return; }
    const maxAbs = Math.max(Math.abs(p.x1), Math.abs(p.x2), Math.abs(p.y1), Math.abs(p.y2));
    const halfWidth = Math.max(8.0, maxAbs * 1.4 + 3.0);
    canvas.setViewport(-halfWidth, halfWidth, -halfWidth, halfWidth);

    canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y1, color: canvas.orange(), thickness: 3.0 });
    canvas.addSegment({ x1: p.x2, y1: p.y1, x2: p.x2, y2: p.y2, color: canvas.blue(), thickness: 3.0 });
    canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, color: canvas.gray(), thickness: 1.5, dashed: true });

    canvas.addMarker({ x: p.x1, y: p.y1, color: canvas.accent(), radius: 7.0, label: 'A' });
    canvas.addMarker({ x: p.x2, y: p.y2, color: canvas.accent(), radius: 7.0, label: 'B' });
  }

  Topics.register('numbers', {
    id: 'increments',
    tabTitle: () => I18N.tx('Artışlar (Δx, Δy)', 'Increments (Δx, Δy)'),
    concept: () => I18N.tx(
      [
        "ARTIŞ (DEĞİŞİM) NEDİR?",
        "Bir noktadan diğerine giderken koordinatlardaki değişime ARTIŞ denir. P₁(x₁, y₁) başlangıç, P₂(x₂, y₂) bitiş noktasıysa:",
        "• Δx = x₂ - x₁  (yatay değişim)",
        "• Δy = y₂ - y₁  (dikey değişim)",
        "Δ (delta) 'değişim' anlamına gelir; her zaman SON - İLK şeklinde hesaplanır.",
        "",
        "İŞARETİN ANLAMI",
        "• Δx > 0: sağa, Δx < 0: sola, Δx = 0: yatayda hareket yok (dikey doğru parçası).",
        "• Δy > 0: yukarı, Δy < 0: aşağı, Δy = 0: dikeyde hareket yok (yatay doğru parçası).",
        "• Yön değişirse işaret de değişir: P₂'den P₁'e giderken Δx ve Δy'nin işaretleri tersine döner (Δx' = -Δx, Δy' = -Δy).",
        "",
        "YÖNTEM",
        "1) Önce başlangıç ve bitiş noktalarını belirleyelim (sıra önemlidir).",
        "2) Δx = x₂ - x₁ değerini hesaplayalım. Negatif koordinatlarda parantez kullanmak işimizi kolaylaştırır: 3 - (-2) = 5.",
        "3) Aynı sırayla Δy = y₂ - y₁ değerini hesaplayalım.",
        "4) İşaretlere bakarak hareketin yönünü söyleyebiliriz.",
        "",
        "DİKKAT EDİLECEKLER",
        "• x'te P₂ - P₁, y'de P₁ - P₂ gibi sırayı karıştırmak en sık yapılan hatadır.",
        "• Δx ve Δy bir KONUM değil, KONUM FARKIDIR; negatif olabilirler (uzunluk ise her zaman ≥ 0'dır, bkz. Uzaklık).",
        "• Ardışık hareketlerde artışlar toplanır: A→B→C için Δx(A→C) = Δx(A→B) + Δx(B→C).",
        "• Δx = 0 ise ileride eğim tanımsız olacaktır (Δy/Δx'te sıfıra bölme).",
        "",
        "MİNİ ÖRNEK",
        "A(-2, 3) → B(4, -1): Δx = 4 - (-2) = 6 (sağa 6), Δy = -1 - 3 = -4 (aşağı 4). Geri dönüşte B→A: Δx = -6, Δy = +4.",
        "",
        "HATIRLATMA: Δy/Δx oranı bir sonraki konunun konusu olan EĞİMDİR. Mühendislikte aynı fikir 'Δ = son değer - ilk değer' olarak her yerde (sıcaklık farkı ΔT, yer değiştirme Δs) karşımıza çıkar."
      ].join('\n'),
      [
        "WHAT IS AN INCREMENT?",
        "When moving from one point to another, the change in the coordinates is called an INCREMENT. With start P₁(x₁, y₁) and end P₂(x₂, y₂):",
        "• Δx = x₂ - x₁  (horizontal change)",
        "• Δy = y₂ - y₁  (vertical change)",
        "Δ (delta) means 'change'; it is always computed as FINAL - INITIAL.",
        "",
        "MEANING OF THE SIGN",
        "• Δx > 0: right, Δx < 0: left, Δx = 0: no horizontal motion (vertical segment).",
        "• Δy > 0: up, Δy < 0: down, Δy = 0: no vertical motion (horizontal segment).",
        "• Reversing the direction flips both signs: going from P₂ to P₁ gives Δx' = -Δx and Δy' = -Δy.",
        "",
        "METHOD",
        "1) First, let's identify the start and end points (order matters).",
        "2) Let's compute Δx = x₂ - x₁. Parentheses help with negative coordinates: 3 - (-2) = 5.",
        "3) Then we compute Δy = y₂ - y₁ in the same order.",
        "4) The signs tell us the direction of motion.",
        "",
        "PITFALLS",
        "• Mixing the order (P₂ - P₁ for x but P₁ - P₂ for y) is the most common mistake.",
        "• Δx and Δy are not positions but POSITION DIFFERENCES; they can be negative (a length, in contrast, is always ≥ 0, see Distance).",
        "• Increments add up along a path: for A→B→C, Δx(A→C) = Δx(A→B) + Δx(B→C).",
        "• If Δx = 0 the slope will be undefined later (division by zero in Δy/Δx).",
        "",
        "MINI EXAMPLE",
        "A(-2, 3) → B(4, -1): Δx = 4 - (-2) = 6 (right 6), Δy = -1 - 3 = -4 (down 4). Going back B→A: Δx = -6, Δy = +4.",
        "",
        "MEMORY AID: the ratio Δy/Δx is the SLOPE, the next topic. In engineering the same idea 'Δ = final - initial' shows up everywhere (temperature change ΔT, displacement Δs)."
      ].join('\n')
    ),
    problemStatement: (p) => p.extra ? extraStatement(p) : I18N.tx(
      `A(${p.x1}, ${p.y1}) ve B(${p.x2}, ${p.y2}) noktaları verilmiş. Δx ve Δy değerlerini bulalım; A'dan B'ye hareketin yönünü (sağ/sol, yukarı/aşağı) da söyleyebilir miyiz?`,
      `Points A(${p.x1}, ${p.y1}) and B(${p.x2}, ${p.y2}) are given. Let's find Δx and Δy, and describe the direction of motion from A to B (right/left, up/down).`),
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 }),
    links: [
      { match: /^• Δx = x₂ - x₁/, make: (rng) => createProblem(rng) },
      { match: /^• Δx > 0:/, make: (rng) => { const q = createProblem(rng); if (rng.nextInt(0, 4) === 0) q.x2 = q.x1; return q; } },
      { match: /^• Δy > 0:/, make: (rng) => { const q = createProblem(rng); if (rng.nextInt(0, 3) === 0) q.y2 = q.y1; return q; } },
      { match: /^• (Yön değişirse işaret de değişir|Reversing the direction flips both signs)/, make: makeReverse },
      { match: /^• (Ardışık hareketlerde artışlar toplanır|Increments add up along a path)/, make: makePath },
    ],
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({ caption: I18N.tx('A noktası - x₁', 'Point A - x₁'), min: -10, max: 10, get: () => getProblem().x1, set: (v) => { getProblem().x1 = Math.round(v); } });
      h.addSlider({ caption: I18N.tx('A noktası - y₁', 'Point A - y₁'), min: -10, max: 10, get: () => getProblem().y1, set: (v) => { getProblem().y1 = Math.round(v); } });
      h.addSlider({ caption: I18N.tx('B noktası - x₂', 'Point B - x₂'), min: -10, max: 10, get: () => getProblem().x2, set: (v) => { getProblem().x2 = Math.round(v); } });
      h.addSlider({ caption: I18N.tx('B noktası - y₂', 'Point B - y₂'), min: -10, max: 10, get: () => getProblem().y2, set: (v) => { getProblem().y2 = Math.round(v); } });
    },
  });
})();
