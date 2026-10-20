// Ported from Modules/Preliminaries/CartesianPointsControl.vb - the Cartesian plane, the origin,
// the four quadrants, and locating a point by the signs of its coordinates.
(function () {
  function createProblem(rng) {
    let x = rng.nextInt(-8, 9);
    let y = rng.nextInt(-8, 9);
    // Occasionally force an axis case so students see that edge case too.
    if (rng.nextInt(0, 4) === 0) {
      if (rng.nextInt(0, 2) === 0) x = 0; else y = 0;
    }
    return { x, y };
  }

  // ---- extra problem kind: reflections (opened only through the "▶ Soru" link) ----
  const tx = (tr, en) => I18N.tx(tr, en);
  function nz(rng, lo, hi) { let v; do { v = rng.nextInt(lo, hi); } while (v === 0); return v; }
  function reflections(p) {
    return {
      xAxis: { x: p.x, y: -p.y },
      yAxis: { x: -p.x, y: p.y },
      origin: { x: -p.x, y: -p.y },
      diag: { x: p.y, y: p.x },
    };
  }
  function reflectSteps(p) {
    const r = reflections(p);
    const f = (q) => `(${q.x}, ${q.y})`;
    return [
      tx(`── 1) Verilen nokta ──\nP(${p.x}, ${p.y})`, `── 1) The given point ──\nP(${p.x}, ${p.y})`),
      tx('── 2) Eksenlere ve orijine göre ──', '── 2) About the axes and the origin ──'),
      tx(`x eksenine göre: (x, y) → (x, -y) = ${f(r.xAxis)}`, `About the x-axis: (x, y) → (x, -y) = ${f(r.xAxis)}`),
      tx(`y eksenine göre: (x, y) → (-x, y) = ${f(r.yAxis)}`, `About the y-axis: (x, y) → (-x, y) = ${f(r.yAxis)}`),
      tx(`Orijine göre: (x, y) → (-x, -y) = ${f(r.origin)}`, `About the origin: (x, y) → (-x, -y) = ${f(r.origin)}`),
      tx('── 3) y = x doğrusuna göre ──', '── 3) About the line y = x ──'),
      tx(`Koordinatlar yer değiştirir: (x, y) → (y, x) = ${f(r.diag)}`, `The coordinates swap: (x, y) → (y, x) = ${f(r.diag)}`),
    ];
  }
  function reflectDraw(canvas, p) {
    const r = reflections(p);
    const m = Math.max(Math.abs(p.x), Math.abs(p.y));
    const halfWidth = Math.max(10.0, m * 1.4 + 3.0);
    canvas.setViewport(-halfWidth, halfWidth, -halfWidth, halfWidth);
    canvas.addFunction({ evaluator: (x) => x, color: canvas.gray(), thickness: 1.0 });
    canvas.addMarker({ x: p.x, y: p.y, color: canvas.accent(), radius: 8.0, label: `P(${p.x}, ${p.y})` });
    canvas.addMarker({ x: r.xAxis.x, y: r.xAxis.y, color: canvas.blue(), radius: 6.0, label: tx('x-eksenine göre', 'about x-axis') });
    canvas.addMarker({ x: r.yAxis.x, y: r.yAxis.y, color: canvas.green(), radius: 6.0, label: tx('y-eksenine göre', 'about y-axis') });
    canvas.addMarker({ x: r.origin.x, y: r.origin.y, color: canvas.orange(), radius: 6.0, label: tx('orijine göre', 'about origin') });
    canvas.addMarker({ x: r.diag.x, y: r.diag.y, color: canvas.gold(), radius: 6.0, label: 'y = x' });
  }
  function quadrantPoint(rng, qa, qb) {
    const q = rng.nextInt(0, 2) === 0 ? qa : qb;
    const sx = (q === 1 || q === 4) ? 1 : -1;
    const sy = (q === 1 || q === 2) ? 1 : -1;
    return { x: sx * rng.nextInt(1, 9), y: sy * rng.nextInt(1, 9) };
  }

  function solveSteps(p) {
    if (p.extra) return reflectSteps(p);
    const steps = [I18N.tx(`Verilen nokta: P(${p.x}, ${p.y})`, `Given point: P(${p.x}, ${p.y})`)];

    if (p.x === 0 && p.y === 0) {
      steps.push(I18N.tx('x = 0 ve y = 0 olduğu için bu nokta ORİJİNDİR, O(0,0).', 'Since x = 0 and y = 0, this point is the ORIGIN, O(0,0).'));
    } else if (p.x === 0) {
      steps.push(I18N.tx('x-koordinatı 0 olduğu için bu nokta y EKSENİ ÜZERİNDEDİR.', 'Since the x-coordinate is 0, this point lies ON THE y-AXIS.'));
    } else if (p.y === 0) {
      steps.push(I18N.tx('y-koordinatı 0 olduğu için bu nokta x EKSENİ ÜZERİNDEDİR.', 'Since the y-coordinate is 0, this point lies ON THE x-AXIS.'));
    } else {
      steps.push(I18N.tx(`x işareti: ${p.x > 0 ? 'pozitif (+)' : 'negatif (−)'}`, `Sign of x: ${p.x > 0 ? 'positive (+)' : 'negative (−)'}`));
      steps.push(I18N.tx(`y işareti: ${p.y > 0 ? 'pozitif (+)' : 'negatif (−)'}`, `Sign of y: ${p.y > 0 ? 'positive (+)' : 'negative (−)'}`));
      let quadrant;
      if (p.x > 0 && p.y > 0) quadrant = I18N.tx('I. Bölge', 'Quadrant I');
      else if (p.x < 0 && p.y > 0) quadrant = I18N.tx('II. Bölge', 'Quadrant II');
      else if (p.x < 0 && p.y < 0) quadrant = I18N.tx('III. Bölge', 'Quadrant III');
      else quadrant = I18N.tx('IV. Bölge', 'Quadrant IV');
      steps.push(I18N.tx(`(x işareti, y işareti) kombinasyonuna bakarak bölgeyi belirleyebiliriz: ${quadrant}`, `Looking at the combination (sign of x, sign of y), we find the quadrant: ${quadrant}`));
    }

    return steps;
  }

  function draw(canvas, p) {
    if (p.extra) { reflectDraw(canvas, p); return; }
    const halfWidth = Math.max(10.0, Math.max(Math.abs(p.x), Math.abs(p.y)) * 1.4 + 3.0);
    canvas.setViewport(-halfWidth, halfWidth, -halfWidth, halfWidth);
    canvas.addMarker({
      x: p.x, y: p.y, color: canvas.accent(), radius: 8.0,
      label: `P(${p.x}, ${p.y})`,
    });
    canvas.addSegment({ x1: p.x, y1: 0, x2: p.x, y2: p.y, color: canvas.gray(), thickness: 1.0, dashed: true });
    canvas.addSegment({ x1: 0, y1: p.y, x2: p.x, y2: p.y, color: canvas.gray(), thickness: 1.0, dashed: true });
  }

  Topics.register('numbers', {
    id: 'cartesianPoints',
    tabTitle: () => I18N.tx('Kartezyen Düzlem ve Noktalar', 'The Cartesian Plane and Points'),
    concept: () => I18N.tx(
      "KARTEZYEN DÜZLEM: birbirine dik iki sayı doğrusu (x ekseni yatay, y ekseni dikey), kesişim noktası\n   ORİJİN O(0, 0). Düzlemdeki her nokta SIRALI ÇİFT (x, y) ile verilir:\n   x = apsis (yatay konum, sağa +), y = ordinat (dikey konum, yukarı +).\n\nDÖRT BÖLGE (saat yönünün TERSİNE numaralanır)\n   I. bölge:   x > 0, y > 0  (+, +)       II. bölge:  x < 0, y > 0  (-, +)\n   III. bölge: x < 0, y < 0  (-, -)       IV. bölge:  x > 0, y < 0  (+, -)\n   Eksenler üzerindeki noktalar hiçbir bölgede sayılmaz: (a, 0) x ekseni üzerinde,\n   (0, b) y ekseni üzerindedir.\n\nSIK YAPILAN İŞLEMLER\n   Simetri (yansıma):  x eksenine göre (x, y) -> (x, -y);   y eksenine göre (x, y) -> (-x, y);\n                       orijine göre (x, y) -> (-x, -y);      y = x doğrusuna göre (x, y) -> (y, x).\n   Uzaklık:  d = √((x₂ - x₁)² + (y₂ - y₁)²)      Orijine uzaklık: √(x² + y²)\n   Orta nokta: M = ((x₁ + x₂)/2 , (y₁ + y₂)/2)\n\nYÖNTEM (nokta işaretleme / okuma)\n   1) Önce x değerine bakalım: orijinden yatay olarak o kadar gideriz (pozitifse sağa, negatifse sola).\n   2) Sonra y değeri kadar dikey gideriz (pozitifse yukarı, negatifse aşağı).\n   3) İşaretlere bakarak bölgeyi belirleyebiliriz (+,+ => I, vb.).\n   4) Okurken tersini yapabiliriz: noktadan eksenlere dikme indirip değerleri okur, (x, y) sırasıyla yazarız.\n\nÖZEL DURUMLAR / SIK HATALAR\n   - (2, 3) ile (3, 2) FARKLI noktalardır: sıra önemlidir, önce x sonra y yazılır.\n   - Orijin ve eksen üzerindeki noktalar hiçbir bölgede değildir.\n   - Bölge numaraları I'den IV'e saat yönünün tersine gider (II sol üst, III sol alt).\n   - Eksenlerin ölçeği farklı olabilir; ölçeğe bakmadan uzaklığı gözle tahmin etmek yanıltabilir.\n   - Uzaklık formülünde farkların KARESİ alınır, bu yüzden (x₂ - x₁) sırası sonucu değiştirmez.\n\nMİNİ ÖRNEK: P(-3, 4).\n   x < 0, y > 0  =>  II. bölge.  x eksenine göre yansıması (-3, -4);  y eksenine göre (3, 4).\n   Orijine uzaklık: √(9 + 16) = 5.\n   A(1, 2) ve B(5, 8): orta nokta (3, 5);  |AB| = √(16 + 36) = √52 = 2√13 ≈ 7.21.",
      "CARTESIAN PLANE: two perpendicular number lines (x-axis horizontal, y-axis vertical) meeting at the\n   ORIGIN O(0, 0). Every point in the plane is given by an ORDERED PAIR (x, y):\n   x = abscissa (horizontal position, + to the right), y = ordinate (vertical position, + upward).\n\nFOUR QUADRANTS (numbered COUNTERCLOCKWISE)\n   Quadrant I:   x > 0, y > 0  (+, +)       Quadrant II:  x < 0, y > 0  (-, +)\n   Quadrant III: x < 0, y < 0  (-, -)       Quadrant IV:  x > 0, y < 0  (+, -)\n   Points on the axes do not belong to any quadrant: (a, 0) lies on the x-axis,\n   (0, b) lies on the y-axis.\n\nCOMMON OPERATIONS\n   Reflection: about the x-axis (x, y) -> (x, -y);   about the y-axis (x, y) -> (-x, y);\n               about the origin (x, y) -> (-x, -y);   about the line y = x (x, y) -> (y, x).\n   Distance:  d = √((x₂ - x₁)² + (y₂ - y₁)²)      Distance to the origin: √(x² + y²)\n   Midpoint: M = ((x₁ + x₂)/2 , (y₁ + y₂)/2)\n\nMETHOD (plotting / reading a point)\n   1) Let's look at x first: we move that far horizontally from the origin (right if positive, left if negative).\n   2) Then we move y vertically (up if positive, down if negative).\n   3) We can find the quadrant from the signs (+,+ => I, etc.).\n   4) To read a point, we can do the reverse: drop perpendiculars to the axes, read the values and write them as (x, y).\n\nSPECIAL CASES / COMMON PITFALLS\n   - (2, 3) and (3, 2) are DIFFERENT points: order matters, x comes first, then y.\n   - The origin and points on the axes are in no quadrant.\n   - Quadrant numbers run I to IV counterclockwise (II is upper left, III is lower left).\n   - The axes may have different scales; it can be misleading to estimate distances by eye without checking the scale.\n   - In the distance formula the differences are SQUARED, so the order (x₂ - x₁) does not change the result.\n\nMINI EXAMPLE: P(-3, 4).\n   x < 0, y > 0  =>  Quadrant II.  Reflection about the x-axis (-3, -4);  about the y-axis (3, 4).\n   Distance to the origin: √(9 + 16) = 5.\n   A(1, 2) and B(5, 8): midpoint (3, 5);  |AB| = √(16 + 36) = √52 = 2√13 ≈ 7.21."
    ),
    problemStatement: (p) => p.extra ? I18N.tx(`P(${p.x}, ${p.y}) noktasının x eksenine, y eksenine, orijine ve y = x doğrusuna göre yansımalarını bulalım.`, `Let's find the reflections of P(${p.x}, ${p.y}) about the x-axis, the y-axis, the origin and the line y = x.`) : I18N.tx(`P(${p.x}, ${p.y}) noktası Kartezyen düzlemin hangi bölgesindedir (ya da hangi eksen üzerindedir)? Birlikte bakalım.`, `In which quadrant of the Cartesian plane does P(${p.x}, ${p.y}) lie (or on which axis)? Let's take a look.`),
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: p.x, y: p.y }),
    links: [
      { match: /^\s*(I\. bölge|Quadrant I):/, make: (rng) => quadrantPoint(rng, 1, 2) },
      { match: /^\s*(III\. bölge|Quadrant III):/, make: (rng) => quadrantPoint(rng, 3, 4) },
      { match: /^\s*(Eksenler üzerindeki noktalar|Points on the axes)/, make: (rng) => (rng.nextInt(0, 2) === 0 ? { x: nz(rng, -8, 9), y: 0 } : { x: 0, y: nz(rng, -8, 9) }) },
      { match: /^\s*(Simetri \(yansıma\)|Reflection):/, make: (rng) => ({ x: nz(rng, -8, 9), y: nz(rng, -8, 9), extra: 'reflect' }) },
      { match: /^\s*(Uzaklık|Distance):/, tab: 'distance' },
      { match: /^\s*(Orta nokta|Midpoint):/, tab: 'distance' },
    ],
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({ caption: 'x', min: -10, max: 10, get: () => getProblem().x, set: (v) => { getProblem().x = Math.round(v); } });
      h.addSlider({ caption: 'y', min: -10, max: 10, get: () => getProblem().y, set: (v) => { getProblem().y = Math.round(v); } });
    },
  });
})();
