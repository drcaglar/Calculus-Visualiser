// Ported from Modules/Preliminaries/DistanceControl.vb - distance between two points, a direct
// application of the Pythagorean theorem: d = sqrt[(x2-x1)^2 + (y2-y1)^2].
(function () {
  function createProblem(rng) {
    return {
      x1: rng.nextInt(-6, 5),
      y1: rng.nextInt(-6, 5),
      x2: rng.nextInt(-5, 7),
      y2: rng.nextInt(-5, 7),
    };
  }

  // ---- extra problem kinds (opened only through the "▶ Soru" links) ----
  const tx = (tr, en) => I18N.tx(tr, en);
  const dist = (ax, ay, bx, by) => Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
  function makeMid(rng) {
    const q = createProblem(rng);
    q.extra = 'mid';
    return q;
  }
  function makeEndpoint(rng) {
    const x1 = rng.nextInt(-4, 5), y1 = rng.nextInt(-4, 5);
    let kx, ky;
    do { kx = rng.nextInt(-3, 4); ky = rng.nextInt(-3, 4); } while (kx === 0 && ky === 0);
    return { x1, y1, x2: x1 + 2 * kx, y2: y1 + 2 * ky, xm: x1 + kx, ym: y1 + ky, extra: 'endpoint' };
  }
  function makeTri(rng) {
    const q = createProblem(rng);
    q.x3 = rng.nextInt(-6, 7); q.y3 = rng.nextInt(-6, 7);
    q.extra = 'tri3';
    return q;
  }
  function makeOrigin(rng) {
    let x1, y1;
    do { x1 = rng.nextInt(-7, 8); y1 = rng.nextInt(-7, 8); } while (x1 === 0 && y1 === 0);
    return { x1, y1, x2: 0, y2: 0 };
  }
  function extraStatement(p) {
    const A = `A(${p.x1}, ${p.y1})`, B = `B(${p.x2}, ${p.y2})`;
    switch (p.extra) {
      case 'mid': return tx(`${A} ve ${B} noktalarının orta noktasını bulalım.`, `Let's find the midpoint of ${A} and ${B}.`);
      case 'endpoint': return tx(`Bir doğru parçasının orta noktası M(${p.xm}, ${p.ym}) ve bir ucu ${A} olsun. Diğer ucu bulalım.`, `A segment has midpoint M(${p.xm}, ${p.ym}) and one endpoint ${A}. Let's find the other endpoint.`);
      default: return tx(`${A}, ${B} ve C(${p.x3}, ${p.y3}) noktaları için d(A,C) ≤ d(A,B) + d(B,C) üçgen eşitsizliğini sayılarla deneyelim.`, `For ${A}, ${B} and C(${p.x3}, ${p.y3}), let's test the triangle inequality d(A,C) ≤ d(A,B) + d(B,C) with numbers.`);
    }
  }
  function extraSteps(p) {
    const steps = [];
    if (p.extra === 'mid') {
      const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
      steps.push(tx(`── 1) Orta nokta ──\nM = ((x₁+x₂)/2 , (y₁+y₂)/2) = ((${p.x1} + (${p.x2}))/2 , (${p.y1} + (${p.y2}))/2)`, `── 1) The midpoint ──\nM = ((x₁+x₂)/2 , (y₁+y₂)/2) = ((${p.x1} + (${p.x2}))/2 , (${p.y1} + (${p.y2}))/2)`));
      steps.push(`M = (${fmt2(mx)}, ${fmt2(my)})`);
      steps.push(tx('── 2) Kontrol ──', '── 2) Check ──'));
      steps.push(`d(A,M) = ${fmt2(dist(p.x1, p.y1, mx, my))},  d(M,B) = ${fmt2(dist(mx, my, p.x2, p.y2))},  d(A,B)/2 = ${fmt2(dist(p.x1, p.y1, p.x2, p.y2) / 2)}`);
      steps.push(tx('Orta nokta iki uca eşit uzaklıktadır ve uzaklığın yarısı kadar yürürüz.', 'The midpoint is equally far from both ends, each at half of the distance.'));
    } else if (p.extra === 'endpoint') {
      steps.push(tx(`── 1) Orta nokta ilişkisi ──\nM = ((x₁+x₂)/2 , (y₁+y₂)/2)  →  x₂ = 2·xₘ - x₁,  y₂ = 2·yₘ - y₁`, `── 1) Midpoint relation ──\nM = ((x₁+x₂)/2 , (y₁+y₂)/2)  →  x₂ = 2·xₘ - x₁,  y₂ = 2·yₘ - y₁`));
      steps.push(tx('── 2) Yerine koyalım ──', '── 2) Substituting ──'));
      steps.push(`x₂ = 2·(${p.xm}) - (${p.x1}) = ${p.x2},   y₂ = 2·(${p.ym}) - (${p.y1}) = ${p.y2}`);
      steps.push(tx(`Diğer uç: B(${p.x2}, ${p.y2})`, `The other endpoint: B(${p.x2}, ${p.y2})`));
      steps.push(tx(`Kontrol: ((${p.x1} + (${p.x2}))/2 , (${p.y1} + (${p.y2}))/2) = (${fmt2((p.x1 + p.x2) / 2)}, ${fmt2((p.y1 + p.y2) / 2)}) = M ✓`, `Check: ((${p.x1} + (${p.x2}))/2 , (${p.y1} + (${p.y2}))/2) = (${fmt2((p.x1 + p.x2) / 2)}, ${fmt2((p.y1 + p.y2) / 2)}) = M ✓`));
    } else {
      const ab = dist(p.x1, p.y1, p.x2, p.y2), bc = dist(p.x2, p.y2, p.x3, p.y3), ac = dist(p.x1, p.y1, p.x3, p.y3);
      const eq = Math.abs(ac - (ab + bc)) < 1e-9;
      steps.push(tx('── 1) Üç uzaklık ──', '── 1) The three distances ──'));
      steps.push(`d(A,B) = √${(p.x2 - p.x1) ** 2 + (p.y2 - p.y1) ** 2} ≈ ${fmt2(ab)}`);
      steps.push(`d(B,C) = √${(p.x3 - p.x2) ** 2 + (p.y3 - p.y2) ** 2} ≈ ${fmt2(bc)}`);
      steps.push(`d(A,C) = √${(p.x3 - p.x1) ** 2 + (p.y3 - p.y1) ** 2} ≈ ${fmt2(ac)}`);
      steps.push(tx('── 2) Karşılaştırma ──', '── 2) Comparison ──'));
      steps.push(`d(A,C) ≈ ${fmt2(ac)}  ${eq ? '=' : '≤'}  d(A,B) + d(B,C) ≈ ${fmt2(ab + bc)}`);
      steps.push(eq
        ? tx('B, AC doğru parçası üzerinde olduğu için eşitlik oluşur.', 'B lies on the segment AC, so equality holds.')
        : tx('B, AC doğru parçası üzerinde olmadığından AB + BC yolu daha uzundur (üçgenin iki kenarı toplamı üçüncüden büyüktür).', 'B is not on the segment AC, so the path AB + BC is longer (two sides of a triangle add up to more than the third).'));
    }
    return steps;
  }
  function extraDraw(canvas, p) {
    const xs = [p.x1, p.x2], ys = [p.y1, p.y2];
    if (p.extra === 'tri3') { xs.push(p.x3); ys.push(p.y3); }
    const maxAbs = Math.max(...xs.map(Math.abs), ...ys.map(Math.abs));
    const halfWidth = Math.max(8.0, maxAbs * 1.4 + 3.0);
    canvas.setViewport(-halfWidth, halfWidth, -halfWidth, halfWidth);
    if (p.extra === 'tri3') {
      canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, color: canvas.blue(), thickness: 2.0 });
      canvas.addSegment({ x1: p.x2, y1: p.y2, x2: p.x3, y2: p.y3, color: canvas.blue(), thickness: 2.0 });
      canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x3, y2: p.y3, color: canvas.accent(), thickness: 3.0 });
      canvas.addMarker({ x: p.x1, y: p.y1, color: canvas.gold(), radius: 7.0, label: 'A' });
      canvas.addMarker({ x: p.x2, y: p.y2, color: canvas.gold(), radius: 7.0, label: 'B' });
      canvas.addMarker({ x: p.x3, y: p.y3, color: canvas.gold(), radius: 7.0, label: 'C' });
      return;
    }
    canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, color: canvas.accent(), thickness: 3.0 });
    canvas.addMarker({ x: p.x1, y: p.y1, color: canvas.gold(), radius: 7.0, label: 'A' });
    canvas.addMarker({ x: p.x2, y: p.y2, color: canvas.gold(), radius: 7.0, label: 'B' });
    canvas.addMarker({ x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2, color: canvas.green(), radius: 7.0, label: 'M' });
  }

  function solveSteps(p) {
    if (p.extra) return extraSteps(p);
    const deltaX = p.x2 - p.x1;
    const deltaY = p.y2 - p.y1;
    const sumOfSquares = deltaX * deltaX + deltaY * deltaY;
    const distance = Math.sqrt(sumOfSquares);

    return [
      I18N.tx(`Noktalarımız: A(${p.x1}, ${p.y1}) ve B(${p.x2}, ${p.y2}).`, `Points: A(${p.x1}, ${p.y1})   B(${p.x2}, ${p.y2})`),
      `Δx = ${p.x2} - (${p.x1}) = ${deltaX}     Δy = ${p.y2} - (${p.y1}) = ${deltaY}`,
      `d = √[(Δx)² + (Δy)²] = √[${deltaX}² + ${deltaY}²] = √[${deltaX * deltaX} + ${deltaY * deltaY}]`,
      `d = √${sumOfSquares} ≈ ${fmt2(distance)}`,
    ];
  }

  function draw(canvas, p) {
    if (p.extra) { extraDraw(canvas, p); return; }
    const maxAbs = Math.max(Math.abs(p.x1), Math.abs(p.x2), Math.abs(p.y1), Math.abs(p.y2));
    const halfWidth = Math.max(8.0, maxAbs * 1.4 + 3.0);
    canvas.setViewport(-halfWidth, halfWidth, -halfWidth, halfWidth);

    canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, color: canvas.accent(), thickness: 3.0 });
    canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y1, color: canvas.gray(), thickness: 1.5, dashed: true });
    canvas.addSegment({ x1: p.x2, y1: p.y1, x2: p.x2, y2: p.y2, color: canvas.gray(), thickness: 1.5, dashed: true });

    canvas.addMarker({ x: p.x1, y: p.y1, color: canvas.gold(), radius: 7.0, label: 'A' });
    canvas.addMarker({ x: p.x2, y: p.y2, color: canvas.gold(), radius: 7.0, label: 'B' });
  }

  Topics.register('numbers', {
    id: 'distance',
    tabTitle: () => I18N.tx('İki Nokta Arası Uzaklık', 'Distance Between Two Points'),
    concept: () => I18N.tx(
      [
        "UZAKLIK FORMÜLÜ",
        "P₁(x₁, y₁) ve P₂(x₂, y₂) noktaları arasındaki uzaklık Pisagor teoreminden gelir: Δx ve Δy bir dik üçgenin dik kenarları, doğru parçası hipotenüstür.",
        "• d = √[(x₂-x₁)² + (y₂-y₁)²] = √(Δx² + Δy²)",
        "• Orijine uzaklık: d = √(x² + y²).",
        "• Kare alındığı için sıra önemsizdir: d(P₁,P₂) = d(P₂,P₁) ve d ≥ 0.",
        "",
        "ORTA NOKTA",
        "M = ( (x₁+x₂)/2 , (y₁+y₂)/2 )  - koordinatların ortalaması. Orta nokta her iki uca eşit uzaklıktadır: d(P₁,M) = d(M,P₂) = d/2.",
        "Uç nokta bulma: M orta nokta ve P₁ bir uç ise diğer uç P₂ = (2·xₘ - x₁, 2·yₘ - y₁).",
        "",
        "YÖNTEM",
        "1) Önce Δx = x₂ - x₁ ve Δy = y₂ - y₁ değerlerini hesaplayalım.",
        "2) İkisinin de karesini alıp toplarız (negatifler artık pozitif olur).",
        "3) Karekökünü alırız; mümkünse sadeleştirebiliriz (√50 = 5√2), gerekirse ondalık yaklaşık değerini yazabiliriz.",
        "4) Orta nokta için koordinatları ayrı ayrı toplayıp 2'ye böleriz.",
        "",
        "MİNİ ÖRNEK",
        "A(-1, 2), B(5, 10): Δx = 6, Δy = 8 → d = √(36 + 64) = √100 = 10. Orta nokta M = (2, 6). (3-4-5 üçgeninin 2 katı: 6-8-10.)",
        "",
        "DİKKAT EDİLECEKLER",
        "• Kök, toplamın TAMAMINI kapsar: √(a² + b²) ≠ a + b. Örnek: √(9+16) = 5, 3+4 = 7 değil.",
        "• Karesini alırken parantez: (-3)² = 9, -3² = -9 değildir.",
        "• Aynı yatay/dikey doğru üzerindeki noktalarda formül |Δx| veya |Δy|'ye iner.",
        "• Üçgen eşitsizliği: d(A,C) ≤ d(A,B) + d(B,C); eşitlik ancak B, AC doğru parçası üzerindeyse geçerlidir.",
        "• Mühendislikte iki noktanın (örn. iki delik merkezinin) arasındaki mesafeyi bulurken işimize yarar."
      ].join('\n'),
      [
        "DISTANCE FORMULA",
        "The distance between P₁(x₁, y₁) and P₂(x₂, y₂) comes from the Pythagorean theorem: Δx and Δy are the legs of a right triangle and the segment is the hypotenuse.",
        "• d = √[(x₂-x₁)² + (y₂-y₁)²] = √(Δx² + Δy²)",
        "• Distance to the origin: d = √(x² + y²).",
        "• Because of the squares the order does not matter: d(P₁,P₂) = d(P₂,P₁) and d ≥ 0.",
        "",
        "MIDPOINT",
        "M = ( (x₁+x₂)/2 , (y₁+y₂)/2 )  - the average of the coordinates. The midpoint is equally far from both ends: d(P₁,M) = d(M,P₂) = d/2.",
        "Finding an endpoint: if M is the midpoint and P₁ is one end, the other end is P₂ = (2·xₘ - x₁, 2·yₘ - y₁).",
        "",
        "METHOD",
        "1) First, let's compute Δx = x₂ - x₁ and Δy = y₂ - y₁.",
        "2) We square both and add them (negatives become positive).",
        "3) We take the square root, simplify if possible (√50 = 5√2), and give a decimal approximation if needed.",
        "4) For the midpoint, we add the coordinates separately and divide by 2.",
        "",
        "MINI EXAMPLE",
        "A(-1, 2), B(5, 10): Δx = 6, Δy = 8 → d = √(36 + 64) = √100 = 10. Midpoint M = (2, 6). (Twice a 3-4-5 triangle: 6-8-10.)",
        "",
        "PITFALLS",
        "• The root covers the WHOLE sum: √(a² + b²) ≠ a + b. Example: √(9+16) = 5, not 3+4 = 7.",
        "• It helps to use parentheses when squaring: (-3)² = 9, whereas -3² = -9.",
        "• For points on the same horizontal/vertical line the formula reduces to |Δx| or |Δy|.",
        "• Triangle inequality: d(A,C) ≤ d(A,B) + d(B,C); equality only if B lies on the segment AC.",
        "• In engineering it helps, for example, to find the center-to-center distance of two holes."
      ].join('\n')
    ),
    problemStatement: (p) => p.extra ? extraStatement(p) : I18N.tx(
      `A(${p.x1}, ${p.y1}) ve B(${p.x2}, ${p.y2}) noktaları arasındaki uzaklığı bulalım.`,
      `Let's find the distance between A(${p.x1}, ${p.y1}) and B(${p.x2}, ${p.y2}).`),
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 }),
    links: [
      { match: /^• d = √\[/, make: (rng) => createProblem(rng) },
      { match: /^• (Orijine uzaklık|Distance to the origin):/, make: makeOrigin },
      { match: /^M = \( \(x₁\+x₂\)\/2/, make: makeMid },
      { match: /^(Uç nokta bulma|Finding an endpoint):/, make: makeEndpoint },
      { match: /^• (Üçgen eşitsizliği|Triangle inequality):/, make: makeTri },
    ],
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({ caption: I18N.tx('A noktası - x₁', 'Point A - x₁'), min: -10, max: 10,
        get: () => getProblem().x1, set: (v) => { getProblem().x1 = Math.round(v); } });
      h.addSlider({ caption: I18N.tx('A noktası - y₁', 'Point A - y₁'), min: -10, max: 10,
        get: () => getProblem().y1, set: (v) => { getProblem().y1 = Math.round(v); } });
      h.addSlider({ caption: I18N.tx('B noktası - x₂', 'Point B - x₂'), min: -10, max: 10,
        get: () => getProblem().x2, set: (v) => { getProblem().x2 = Math.round(v); } });
      h.addSlider({ caption: I18N.tx('B noktası - y₂', 'Point B - y₂'), min: -10, max: 10,
        get: () => getProblem().y2, set: (v) => { getProblem().y2 = Math.round(v); } });
    },
  });
})();
