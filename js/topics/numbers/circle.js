// Ported from Modules/Preliminaries/CircleControl.vb - circles: basic concepts (center, radius),
// standard equation (x-h)^2 + (y-k)^2 = r^2, building the equation from center/radius, completing
// the square to convert general form to standard form, and testing whether a point is inside/on/
// outside the circle. Mode: 0 = build equation, 1 = read from equation, 2 = complete the square,
// 3 = point test.
(function () {
  function signedTerm(value, suffix) {
    suffix = suffix || '';
    return value >= 0 ? `+ ${value}${suffix}` : `- ${Math.abs(value)}${suffix}`;
  }

  function createProblem(rng) {
    const h = rng.nextInt(-6, 7);
    const k = rng.nextInt(-6, 7);
    const r = rng.nextInt(2, 7);
    const mode = rng.nextInt(0, 4);

    let testX = 0;
    let testY = 0;
    if (mode === 3) {
      // Sometimes place the test point exactly on the circle, sometimes not, for variety.
      if (rng.nextInt(0, 3) === 0) {
        const angle = rng.nextInt(0, 360) * Math.PI / 180.0;
        testX = h + Math.round(r * Math.cos(angle));
        testY = k + Math.round(r * Math.sin(angle));
      } else {
        testX = h + rng.nextInt(-r - 3, r + 4);
        testY = k + rng.nextInt(-r - 3, r + 4);
      }
    }

    return { mode, h, k, r, testX, testY };
  }

  // ---- extra problem modes (opened only through the "▶ Soru" links): 4 = r² <= 0 check, 5 = diameter endpoints, 6 = a circle is not a function ----
  const tx = (tr, en) => I18N.tx(tr, en);
  const TRIPLES = [[3, 4, 5], [4, 3, 5], [0, 5, 5], [5, 0, 5], [6, 8, 10], [8, 6, 10]];
  const HALF = [[3, 5, 4], [4, 5, 3], [6, 10, 8], [8, 10, 6], [5, 13, 12]]; // [d, r, dy] with d² + dy² = r²
  function makeMode(rng, mode) {
    let q;
    do { q = createProblem(rng); } while (q.mode !== mode);
    return q;
  }
  function makeOrigin(rng) {
    const q = makeMode(rng, rng.nextInt(0, 2));
    q.h = 0; q.k = 0;
    return q;
  }
  function makeDegenerate(rng) {
    return { mode: 4, h: rng.nextInt(-5, 6), k: rng.nextInt(-5, 6), r: 1, testX: 0, testY: 0, s: rng.nextInt(0, 2) === 0 ? 0 : rng.nextInt(1, 7) };
  }
  function makeDiameter(rng) {
    const t = TRIPLES[rng.nextInt(0, TRIPLES.length)];
    const sa = rng.nextInt(0, 2) === 0 ? 1 : -1, sb = rng.nextInt(0, 2) === 0 ? 1 : -1;
    const h = rng.nextInt(-4, 5), k = rng.nextInt(-4, 5);
    const a = sa * t[0], b = sb * t[1];
    return { mode: 5, h, k, r: t[2], testX: 0, testY: 0, x1: h - a, y1: k - b, x2: h + a, y2: k + b };
  }
  function makeHalf(rng) {
    const t = HALF[rng.nextInt(0, HALF.length)];
    return { mode: 6, h: rng.nextInt(-4, 5), k: rng.nextInt(-4, 5), r: t[1], testX: 0, testY: 0, d: t[0] * (rng.nextInt(0, 2) === 0 ? 1 : -1), dy: t[2] };
  }
  function diameterCircle(p) {
    return { h: (p.x1 + p.x2) / 2, k: (p.y1 + p.y2) / 2, r: Math.sqrt((p.x2 - p.x1) ** 2 + (p.y2 - p.y1) ** 2) / 2 };
  }
  function extraStatement(p) {
    if (p.mode === 4) {
      const g = `x² + y² ${signedTerm(-2 * p.h, 'x')} ${signedTerm(-2 * p.k, 'y')} ${signedTerm(p.h * p.h + p.k * p.k + p.s)} = 0`;
      return tx(`${g} denklemi gerçek bir çember belirtir mi? Kare tamamlayarak r² değerine bakalım.`, `Does ${g} describe a real circle? Let's complete the square and look at r².`);
    }
    if (p.mode === 5) {
      return tx(`Bir çemberin çapının uç noktaları A(${p.x1}, ${p.y1}) ve B(${p.x2}, ${p.y2}) olsun. Çemberin denklemini yazalım.`, `The endpoints of a diameter of a circle are A(${p.x1}, ${p.y1}) and B(${p.x2}, ${p.y2}). Let's write the equation of the circle.`);
    }
    const std = `(x ${signedTerm(-p.h)})² + (y ${signedTerm(-p.k)})² = ${p.r * p.r}`;
    return tx(`${std} çemberinde x = ${p.h + p.d} için y değerlerini bulalım. Çember bir fonksiyon mudur?`, `On the circle ${std}, let's find the y values for x = ${p.h + p.d}. Is a circle a function?`);
  }
  function extraSteps(p) {
    const h = p.h, k = p.k, steps = [];
    if (p.mode === 4) {
      const D = -2 * h, E = -2 * k, F = h * h + k * k + p.s;
      steps.push(tx(`Verilen denklem: x² + y² ${signedTerm(D, 'x')} ${signedTerm(E, 'y')} ${signedTerm(F)} = 0`, `Given equation: x² + y² ${signedTerm(D, 'x')} ${signedTerm(E, 'y')} ${signedTerm(F)} = 0`));
      steps.push(tx(`── 1) Gruplayalım ──\n(x² ${signedTerm(D, 'x')}) + (y² ${signedTerm(E, 'y')}) = ${-F}`, `── 1) Group the terms ──\n(x² ${signedTerm(D, 'x')}) + (y² ${signedTerm(E, 'y')}) = ${-F}`));
      steps.push(tx(`── 2) Kareyi tamamlayalım ──\nx için (${D}/2)² = ${h * h}, y için (${E}/2)² = ${k * k} ekleyelim: (x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${-F} + ${h * h} + ${k * k}`, `── 2) Complete the square ──\nLet's add (${D}/2)² = ${h * h} for x and (${E}/2)² = ${k * k} for y: (x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${-F} + ${h * h} + ${k * k}`));
      steps.push(`(x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${-p.s}   →   r² = ${-p.s}`);
      steps.push(p.s === 0
        ? tx(`r² = 0 olduğundan denklem yalnızca (${h}, ${k}) NOKTASINI belirtir; gerçek bir çember değildir.`, `Since r² = 0, the equation describes only the POINT (${h}, ${k}); it is not a real circle.`)
        : tx(`r² = ${-p.s} < 0 olduğundan kareler toplamı negatif olamaz: GERÇEL ÇEMBER YOKTUR, çözüm kümesi boştur.`, `Since r² = ${-p.s} < 0 and a sum of squares cannot be negative, there is NO REAL CIRCLE: the solution set is empty.`));
    } else if (p.mode === 5) {
      const c = diameterCircle(p);
      const dd = (p.x2 - p.x1) ** 2 + (p.y2 - p.y1) ** 2;
      steps.push(tx('── 1) Merkez = orta nokta ──', '── 1) Center = midpoint ──'));
      steps.push(`(h, k) = ((${p.x1} + (${p.x2}))/2 , (${p.y1} + (${p.y2}))/2) = (${fmt2(c.h)}, ${fmt2(c.k)})`);
      steps.push(tx('── 2) Yarıçap = çap / 2 ──', '── 2) Radius = diameter / 2 ──'));
      steps.push(`|AB| = √[(${p.x2 - p.x1})² + (${p.y2 - p.y1})²] = √${dd} = ${fmt2(Math.sqrt(dd))}`);
      steps.push(`r = ${fmt2(Math.sqrt(dd))}/2 = ${fmt2(c.r)}`);
      steps.push(tx('── 3) Denklem ──', '── 3) Equation ──'));
      steps.push(`(x ${signedTerm(-c.h)})² + (y ${signedTerm(-c.k)})² = ${fmt2(c.r * c.r)}`);
    } else {
      const X = h + p.d, y1 = k + p.dy, y2 = k - p.dy;
      steps.push(tx(`── 1) x = ${X} değerini yerine koyalım ──\n(${X} ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${p.r * p.r}`, `── 1) Substitute x = ${X} ──\n(${X} ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${p.r * p.r}`));
      steps.push(`(${p.d})² + (y ${signedTerm(-k)})² = ${p.r * p.r}   →   (y ${signedTerm(-k)})² = ${p.r * p.r} - ${p.d * p.d} = ${p.dy * p.dy}`);
      steps.push(tx(`── 2) Karekök ──\ny ${signedTerm(-k)} = ±${p.dy}   →   y = ${y1}  veya  y = ${y2}`, `── 2) Square root ──\ny ${signedTerm(-k)} = ±${p.dy}   →   y = ${y1}  or  y = ${y2}`));
      steps.push(tx(`── 3) Yorum ──\nAynı x = ${X} için iki farklı y bulundu: (${X}, ${y1}) ve (${X}, ${y2}). Dikey doğru testini geçemediği için çember bir FONKSİYON DEĞİLDİR.`, `── 3) Interpretation ──\nThe same x = ${X} gives two different y values: (${X}, ${y1}) and (${X}, ${y2}). It fails the vertical line test, so a circle is NOT a function.`));
      steps.push(tx(`Üst yarım y = k + √(r² - (x-h)²) = ${y1}, alt yarım y = k - √(r² - (x-h)²) = ${y2}.`, `Upper half y = k + √(r² - (x-h)²) = ${y1}, lower half y = k - √(r² - (x-h)²) = ${y2}.`));
    }
    return steps;
  }
  function extraDraw(canvas, p) {
    let h = p.h, k = p.k, r = p.r;
    if (p.mode === 5) { const c = diameterCircle(p); h = c.h; k = c.k; r = c.r; }
    const halfWidth = Math.max(8.0, r * 1.8 + Math.max(Math.abs(h), Math.abs(k)));
    canvas.setViewport(h - halfWidth, h + halfWidth, k - halfWidth, k + halfWidth);
    if (p.mode === 4) {
      canvas.addMarker({ x: h, y: k, color: p.s === 0 ? canvas.gold() : canvas.gray(), radius: p.s === 0 ? 7.0 : 4.0, label: p.s === 0 ? tx('Tek nokta', 'Single point') : tx('Çember yok (r² < 0)', 'No circle (r² < 0)') });
      return;
    }
    canvas.addParametric({ xOfT: (t) => h + r * Math.cos(t), yOfT: (t) => k + r * Math.sin(t), tMin: 0, tMax: 2 * Math.PI, color: canvas.accent(), thickness: 3.0 });
    canvas.addMarker({ x: h, y: k, color: canvas.gold(), radius: 5.0, label: tx('Merkez', 'Center') });
    if (p.mode === 5) {
      canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, color: canvas.gray(), thickness: 1.5, dashed: true });
      canvas.addMarker({ x: p.x1, y: p.y1, color: canvas.green(), radius: 7.0, label: 'A' });
      canvas.addMarker({ x: p.x2, y: p.y2, color: canvas.green(), radius: 7.0, label: 'B' });
    } else {
      canvas.addGuideLine({ axis: 'vertical', position: h + p.d, color: canvas.gray() });
      canvas.addMarker({ x: h + p.d, y: k + p.dy, color: canvas.green(), radius: 7.0 });
      canvas.addMarker({ x: h + p.d, y: k - p.dy, color: canvas.orange(), radius: 7.0 });
    }
  }

  function solveSteps(p) {
    if (p.mode >= 4) return extraSteps(p);
    const steps = [];
    const h = p.h, k = p.k, r = p.r;

    switch (p.mode) {
      case 0: {
        steps.push(I18N.tx(`Verilenler: merkez (${h}, ${k}), yarıçap r = ${r}`, `Given: center (${h}, ${k}), radius r = ${r}`));
        steps.push(I18N.tx('Standart denklemde yerine koyalım: (x - h)² + (y - k)² = r²', "Let's substitute into the standard equation: (x - h)² + (y - k)² = r²"));
        steps.push(`(x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${r}²`);
        steps.push(I18N.tx(`Sonuç: (x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${r * r}`, `Result: (x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${r * r}`));
        break;
      }
      case 1: {
        steps.push(I18N.tx(`Verilen denklem: (x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${r * r}`, `Given equation: (x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${r * r}`));
        steps.push(I18N.tx('Standart formla (x-h)² + (y-k)² = r² karşılaştıralım.', "Let's compare with the standard form (x-h)² + (y-k)² = r²."));
        steps.push(I18N.tx(`Merkez: (h, k) = (${h}, ${k})`, `Center: (h, k) = (${h}, ${k})`));
        steps.push(I18N.tx(`Yarıçap: r² = ${r * r} → r = ${r}`, `Radius: r² = ${r * r} → r = ${r}`));
        break;
      }
      case 2: {
        const dCoeff = -2 * h;
        const eCoeff = -2 * k;
        const fConst = h * h + k * k - r * r;
        steps.push(I18N.tx(`Verilen genel denklem: x² + y² ${signedTerm(dCoeff, 'x')} ${signedTerm(eCoeff, 'y')} ${signedTerm(fConst)} = 0`, `Given general equation: x² + y² ${signedTerm(dCoeff, 'x')} ${signedTerm(eCoeff, 'y')} ${signedTerm(fConst)} = 0`));
        steps.push(I18N.tx(`x ve y terimlerini gruplayalım: (x² ${signedTerm(dCoeff, 'x')}) + (y² ${signedTerm(eCoeff, 'y')}) = ${-fConst}`, `Let's group the x and y terms: (x² ${signedTerm(dCoeff, 'x')}) + (y² ${signedTerm(eCoeff, 'y')}) = ${-fConst}`));
        steps.push(I18N.tx(`Her grup için kareyi tamamlayalım: x için (${dCoeff}/2)² = ${fmt2(Math.pow(dCoeff / 2.0, 2))}, y için (${eCoeff}/2)² = ${fmt2(Math.pow(eCoeff / 2.0, 2))}`, `Let's complete the square for each group: for x, (${dCoeff}/2)² = ${fmt2(Math.pow(dCoeff / 2.0, 2))}; for y, (${eCoeff}/2)² = ${fmt2(Math.pow(eCoeff / 2.0, 2))}`));
        steps.push(I18N.tx(`Aynı sayıları her iki tarafa ekleyince: (x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${r * r}`, `Adding the same numbers to both sides: (x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${r * r}`));
        steps.push(I18N.tx(`Sonuç: merkez (${h}, ${k}), yarıçap ${r}`, `Result: center (${h}, ${k}), radius ${r}`));
        break;
      }
      default: {
        const dx = p.testX - h;
        const dy = p.testY - k;
        const distSquared = dx * dx + dy * dy;
        const dist = Math.sqrt(distSquared);
        steps.push(I18N.tx(`Çember: merkez (${h}, ${k}), yarıçap ${r}     Test noktası: (${p.testX}, ${p.testY})`, `Circle: center (${h}, ${k}), radius ${r}     Test point: (${p.testX}, ${p.testY})`));
        steps.push(I18N.tx(`Noktanın merkeze uzaklığını hesaplayalım: d = √[(${dx})² + (${dy})²] = √${distSquared} ≈ ${fmt2(dist)}`, `Let's compute the distance from the point to the center: d = √[(${dx})² + (${dy})²] = √${distSquared} ≈ ${fmt2(dist)}`));
        steps.push(I18N.tx(`d'yi r = ${r} ile karşılaştıralım:`, `Let's compare d with r = ${r}:`));
        if (Math.abs(dist - r) < 0.05) {
          steps.push(I18N.tx('d = r  →  nokta çemberin TAM ÜZERİNDEDİR.', 'd = r  →  the point lies EXACTLY ON the circle.'));
        } else if (dist < r) {
          steps.push(I18N.tx('d < r  →  nokta çemberin İÇİNDEDİR.', 'd < r  →  the point is INSIDE the circle.'));
        } else {
          steps.push(I18N.tx('d > r  →  nokta çemberin DIŞINDADIR.', 'd > r  →  the point is OUTSIDE the circle.'));
        }
      }
    }

    return steps;
  }

  function draw(canvas, p) {
    if (p.mode >= 4) { extraDraw(canvas, p); return; }
    const h = p.h, k = p.k, r = p.r;
    const halfWidth = Math.max(8.0, r * 1.8 + Math.max(Math.abs(h), Math.abs(k)));
    canvas.setViewport(h - halfWidth, h + halfWidth, k - halfWidth, k + halfWidth);

    canvas.addParametric({
      xOfT: (t) => h + r * Math.cos(t),
      yOfT: (t) => k + r * Math.sin(t),
      tMin: 0, tMax: 2 * Math.PI,
      color: canvas.accent(), thickness: 3.0,
    });
    canvas.addMarker({ x: h, y: k, color: canvas.gold(), radius: 5.0, label: I18N.tx('Merkez', 'Center') });

    if (p.mode === 3) {
      const dx = p.testX - h;
      const dy = p.testY - k;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pointColor = Math.abs(dist - r) < 0.05 ? canvas.gold() : (dist < r ? canvas.green() : canvas.orange());
      canvas.addSegment({ x1: h, y1: k, x2: p.testX, y2: p.testY, color: canvas.gray(), thickness: 1.5, dashed: true });
      canvas.addMarker({ x: p.testX, y: p.testY, color: pointColor, radius: 7.0 });
    }
  }

  Topics.register('numbers', {
    id: 'circle',
    tabTitle: () => I18N.tx('Çemberler', 'Circles'),
    concept: () => I18N.tx(
      [
        "ÇEMBERİN DENKLEMİ",
        "Çember, merkeze eşit (r) uzaklıktaki noktaların kümesidir. Uzaklık formülünden:",
        "• Standart form: (x - h)² + (y - k)² = r²   (merkez (h, k), yarıçap r > 0)",
        "• Merkez orijinde: x² + y² = r².",
        "• Genel (açılmış) form: x² + y² + Dx + Ey + F = 0, burada h = -D/2, k = -E/2, r² = h² + k² - F = (D² + E² - 4F)/4.",
        "• r² > 0 ise çember; r² = 0 ise tek bir NOKTA; r² < 0 ise GERÇEL ÇEMBER YOKTUR.",
        "• Çap uç noktaları verilirse: merkez = orta nokta, r = çap uzunluğu / 2.",
        "",
        "YÖNTEM 1: standart denklem yazma",
        "1) Önce merkez (h, k) ve r'yi belirleyelim (r, merkezin verilen bir noktaya uzaklığından da bulunabilir).",
        "2) (x - h)² + (y - k)² = r² yazalım. İşaretlere bakalım: merkez (-2, 3) → (x + 2)² + (y - 3)².",
        "",
        "YÖNTEM 2: KARE TAMAMLAMA ile genel formdan standart forma",
        "1) x terimlerini ve y terimlerini gruplayalım: (x² + Dx) + (y² + Ey) = -F.",
        "2) Her gruba (katsayı/2)² ekleyelim, sağ tarafa da ekleyelim: (x² + Dx + D²/4) + (y² + Ey + E²/4) = -F + D²/4 + E²/4.",
        "3) Tam kareleri yazalım: (x + D/2)² + (y + E/2)² = r².",
        "4) Merkezi ve r = √(sağ taraf) değerini okuyabiliriz.",
        "",
        "MİNİ ÖRNEK",
        "x² + y² - 6x + 4y - 12 = 0 → (x² - 6x + 9) + (y² + 4y + 4) = 12 + 9 + 4 → (x - 3)² + (y + 2)² = 25. Merkez (3, -2), r = 5.",
        "",
        "DİKKAT EDİLECEKLER",
        "• Sol tarafa eklediğimiz sayıyı sağ tarafa da eklemeyi unutmayalım: denklem her zaman dengede kalmalı.",
        "• x² ve y² katsayıları 1 olmalı; 2x² + 2y² + ... gibi durumda önce 2'ye bölebiliriz.",
        "• Standart formun sağ tarafı r²'dir, r değil: = 16 → r = 4.",
        "• Noktanın konumu: (x₀-h)² + (y₀-k)² değerini r² ile karşılaştırabiliriz: < r² içeride, = r² üzerinde, > r² dışarıda.",
        "• Çember bir FONKSİYON DEĞİLDİR (dikey doğru testini geçemez); üst ve alt yarım: y = k ± √(r² - (x-h)²).",
        "",
        "HATIRLATMA: parantez içindeki işaret TERSTİR: merkezin x-koordinatı h, parantezde 'x - h' olarak görünür."
      ].join('\n'),
      [
        "EQUATION OF A CIRCLE",
        "A circle is the set of points at a fixed distance r from the center. From the distance formula:",
        "• Standard form: (x - h)² + (y - k)² = r²   (center (h, k), radius r > 0)",
        "• Center at the origin: x² + y² = r².",
        "• General (expanded) form: x² + y² + Dx + Ey + F = 0, where h = -D/2, k = -E/2, r² = h² + k² - F = (D² + E² - 4F)/4.",
        "• r² > 0: a circle; r² = 0: a single POINT; r² < 0: NO REAL CIRCLE.",
        "• If the endpoints of a diameter are given: center = midpoint, r = diameter length / 2.",
        "",
        "METHOD 1: writing the standard equation",
        "1) First, let's identify the center (h, k) and r (r can also be found as the distance from the center to a given point).",
        "2) We write (x - h)² + (y - k)² = r². Notice the signs: center (-2, 3) → (x + 2)² + (y - 3)².",
        "",
        "METHOD 2: general → standard form by COMPLETING THE SQUARE",
        "1) We group the x terms and y terms: (x² + Dx) + (y² + Ey) = -F.",
        "2) We add (coefficient/2)² to each group and to the right side: (x² + Dx + D²/4) + (y² + Ey + E²/4) = -F + D²/4 + E²/4.",
        "3) We write the perfect squares: (x + D/2)² + (y + E/2)² = r².",
        "4) We can read off the center and r = √(right side).",
        "",
        "MINI EXAMPLE",
        "x² + y² - 6x + 4y - 12 = 0 → (x² - 6x + 9) + (y² + 4y + 4) = 12 + 9 + 4 → (x - 3)² + (y + 2)² = 25. Center (3, -2), r = 5.",
        "",
        "PITFALLS",
        "• Whatever you add on the left to complete the square must also be added on the right: keep the equation balanced.",
        "• The coefficients of x² and y² must be 1; for 2x² + 2y² + ... we can divide by 2 first.",
        "• The right side of the standard form is r², not r: = 16 → r = 4.",
        "• Position of a point: compare (x₀-h)² + (y₀-k)² with r²: < r² inside, = r² on, > r² outside.",
        "• A circle is NOT a function (it fails the vertical line test); the upper and lower halves are y = k ± √(r² - (x-h)²).",
        "",
        "MEMORY AID: the sign inside the parentheses is OPPOSITE: the center x-coordinate h appears as 'x - h'."
      ].join('\n')
    ),
    problemStatement: (p) => {
      if (p.mode >= 4) return extraStatement(p);
      const std = `(x ${signedTerm(-p.h)})² + (y ${signedTerm(-p.k)})² = ${p.r * p.r}`;
      switch (p.mode) {
        case 0:
          return I18N.tx(`Merkezi (${p.h}, ${p.k}) ve yarıçapı ${p.r} olan çemberin denklemini yazalım.`,
            `Let's write the equation of the circle with center (${p.h}, ${p.k}) and radius ${p.r}.`);
        case 1:
          return I18N.tx(`${std} çemberinin merkezini ve yarıçapını bulalım.`, `Let's find the center and radius of the circle ${std}.`);
        case 2: {
          const g = `x² + y² ${signedTerm(-2 * p.h, 'x')} ${signedTerm(-2 * p.k, 'y')} ${signedTerm(p.h * p.h + p.k * p.k - p.r * p.r)} = 0`;
          return I18N.tx(`${g} denklemini kare tamamlayarak standart forma getirelim; çemberin merkezini ve yarıçapını bulalım.`,
            `Let's complete the square to put ${g} in standard form, and find the center and radius of the circle.`);
        }
        default:
          return I18N.tx(`Merkezi (${p.h}, ${p.k}) ve yarıçapı ${p.r} olan çemberde, (${p.testX}, ${p.testY}) noktası çemberin içinde mi, üzerinde mi, dışında mıdır?`,
            `For the circle with center (${p.h}, ${p.k}) and radius ${p.r}, is the point (${p.testX}, ${p.testY}) inside, on, or outside the circle?`);
      }
    },
    createProblem,
    solveSteps,
    draw,
    focus: (p) => (p.mode === 5 ? { x: diameterCircle(p).h, y: diameterCircle(p).k } : { x: p.h, y: p.k }),
    links: [
      { match: /^• (Standart form|Standard form):/, make: (rng) => makeMode(rng, rng.nextInt(0, 2)) },
      { match: /^• (Merkez orijinde|Center at the origin):/, make: makeOrigin },
      { match: /^• (Genel \(açılmış\) form|General \(expanded\) form):/, make: (rng) => makeMode(rng, 2) },
      { match: /^• r² > 0/, make: makeDegenerate },
      { match: /^• (Çap uç noktaları verilirse|If the endpoints of a diameter are given):/, make: makeDiameter },
      { match: /^(YÖNTEM 1|METHOD 1):/, make: (rng) => makeMode(rng, 0) },
      { match: /^(YÖNTEM 2|METHOD 2):/, make: (rng) => makeMode(rng, 2) },
      { match: /^• (Noktanın konumu|Position of a point):/, make: (rng) => makeMode(rng, 3) },
      { match: /^• (Çember bir FONKSİYON DEĞİLDİR|A circle is NOT a function)/, make: makeHalf },
    ],
    buildControls: (rightCol, getProblem, hlp) => {
      hlp.addSlider({ caption: I18N.tx('Merkez - h', 'Center - h'), min: -8, max: 8,
        get: () => getProblem().h, set: (v) => { getProblem().h = Math.round(v); } });
      hlp.addSlider({ caption: I18N.tx('Merkez - k', 'Center - k'), min: -8, max: 8,
        get: () => getProblem().k, set: (v) => { getProblem().k = Math.round(v); } });
      hlp.addSlider({ caption: I18N.tx('Yarıçap - r', 'Radius - r'), min: 1, max: 8,
        get: () => getProblem().r, set: (v) => { getProblem().r = Math.round(v); } });
      hlp.addSlider({ caption: I18N.tx('Test noktası - x (sadece nokta testi modunda etkili)', 'Test point - x (only effective in point-test mode)'), min: -12, max: 12,
        get: () => getProblem().testX, set: (v) => { getProblem().testX = Math.round(v); } });
      hlp.addSlider({ caption: I18N.tx('Test noktası - y (sadece nokta testi modunda etkili)', 'Test point - y (only effective in point-test mode)'), min: -12, max: 12,
        get: () => getProblem().testY, set: (v) => { getProblem().testY = Math.round(v); } });
    },
  });
})();
