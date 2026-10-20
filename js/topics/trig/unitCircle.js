// Ported from Modules/Trigonometry/UnitCircleControl.vb (static adaptation, no animation).
// The VB tab shows the unit circle + dynamic right triangle (hypotenuse, horizontal leg cos, vertical
// leg sin) and a second canvas with the sine/cosine waves. Here: problem = { deg } (angle theta, 0..720
// in half-degree steps, mirrors AngleSliderResolution = 720 over two turns), concept = the VB help text,
// steps = the readout facts, draw = circle + triangle + markers (+ the angle arc).
(function () {
  function tanText(deg) {
    const c = Math.cos(deg * Math.PI / 180);
    if (Math.abs(c) < 1e-9) return I18N.tx('tanımsız', 'undefined');
    return fmt2(Math.sin(deg * Math.PI / 180) / c);
  }

  function norm(deg) { return ((deg % 360) + 360) % 360; }

  function quadrantOf(d) {
    if (d === 0 || d === 90 || d === 180 || d === 270) return 0;
    if (d < 90) return 1;
    if (d < 180) return 2;
    if (d < 270) return 3;
    return 4;
  }

  function refAngle(d) {
    if (d <= 90) return d;
    if (d <= 180) return 180 - d;
    if (d <= 270) return d - 180;
    return 360 - d;
  }

  function createProblem() { return { deg: 0 }; }

  function problemStatement(p) {
    return I18N.tx(
      `θ = ${fmt2(p.deg)}° (${fmt2(TrigKit.toRad(p.deg))} rad) açısı için birim çember üzerindeki noktanın koordinatlarını ve sin θ, cos θ, tan θ değerlerini bulalım.`,
      `For the angle θ = ${fmt2(p.deg)}° (${fmt2(TrigKit.toRad(p.deg))} rad), let's find the coordinates of the point on the unit circle and the values of sin θ, cos θ and tan θ.`);
  }

  function concept() {
    return I18N.tx(
      "BİRİM ÇEMBER: Orijin merkezli, yarıçapı 1 olan çember (x² + y² = 1). Pozitif x ekseninden saat yönünün tersine ölçülen θ açısının bitiş kenarı, çemberi P noktasında keser.\n" +
      "   P = (cos θ, sin θ)\n" +
      "   cos θ = P'nin x koordinatı (yatay dik kenar)\n" +
      "   sin θ = P'nin y koordinatı (dikey dik kenar)\n" +
      "   tan θ = sin θ / cos θ = y/x   (x = 0 iken tanımsız)\n" +
      "\n" +
      "DİK ÜÇGEN: Orijin, P ve P'nin x eksenindeki izdüşümü bir dik üçgen oluşturur; hipotenüs 1'dir. Pisagor: sin²θ + cos²θ = 1. Sağdaki grafik, P döndükçe y koordinatının (sinüs) ve x koordinatının (kosinüs) θ'ya karşı çizilmesiyle oluşur; ikisi de 2π'de tekrarlanır.\n" +
      "\n" +
      "İŞARETLER (ASTC): I. bölge: hepsi +.  II: yalnız sin +.  III: yalnız tan +.  IV: yalnız cos +.\n" +
      "\n" +
      "ÖZEL AÇILAR:\n" +
      "   θ:     0     π/6     π/4     π/3     π/2\n" +
      "   cos:   1     √3/2    √2/2    1/2     0\n" +
      "   sin:   0     1/2     √2/2    √3/2    1\n" +
      "Diğer açılar yansımayla: referans açı α (en yakın x eksenine göre dar açı) bulunur; değer aynı kalır, işareti bölge belirler. Negatif θ saat yönünde, θ > 2π birden fazla tam tur demektir; θ + 2π aynı noktayı verir.\n" +
      "\n" +
      "YÖNTEM:\n" +
      "   (1) Önce açıyı [0, 2π) aralığına indirebiliriz (2π katı ekleyip çıkararak).\n" +
      "   (2) Sonra bölgeye (ya da eksen üzerinde olup olmadığına) bakarız.\n" +
      "   (3) Referans açı α bulunur: II'de π − θ, III'te θ − π, IV'te 2π − θ.\n" +
      "   (4) cos α ve sin α değerleri özel açı tablosundan okunur.\n" +
      "   (5) Bölgenin işareti eklenir: P = (±cos α, ±sin α). tan θ = y/x.\n" +
      "   (6) Son olarak x² + y² = 1 olduğunu kontrol edebiliriz.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - cos ile sin'in karışması: cos x'tir (yatay), sin y'dir (dikey).\n" +
      "   - Referans açının y eksenine göre alınması; her zaman en yakın x eksenine göre alınır.\n" +
      "   - İşaretin unutulması; referans açı yalnızca büyüklüğü verir.\n" +
      "   - Derece ile radyanın karışması (180° = π rad).\n" +
      "   - 90° ve 270°'de tan'ın hesaplanmaya çalışılması: x = 0 olduğu için tanımsızdır.\n" +
      "\n" +
      "MİNİ ÖRNEK: θ = 150°. II. bölge (90° < 150° < 180°), α = 180° − 150° = 30°. cos 30° = √3/2, sin 30° = 1/2. II'de x < 0, y > 0 olduğundan P = (−√3/2, 1/2); tan 150° = (1/2)/(−√3/2) = −√3/3. Kontrol: 3/4 + 1/4 = 1.",
      "THE UNIT CIRCLE: the circle of radius 1 centred at the origin (x² + y² = 1). The terminal side of the angle θ, measured counter-clockwise from the positive x-axis, meets the circle at a point P.\n" +
      "   P = (cos θ, sin θ)\n" +
      "   cos θ = the x-coordinate of P (the horizontal leg)\n" +
      "   sin θ = the y-coordinate of P (the vertical leg)\n" +
      "   tan θ = sin θ / cos θ = y/x   (undefined when x = 0)\n" +
      "\n" +
      "THE RIGHT TRIANGLE: the origin, P and the projection of P on the x-axis form a right triangle whose hypotenuse is 1. Pythagoras: sin²θ + cos²θ = 1. The graph on the right is built by plotting the y-coordinate (sine) and the x-coordinate (cosine) against θ as P goes round; both repeat every 2π.\n" +
      "\n" +
      "SIGNS (ASTC): quadrant I: all +.  II: only sin +.  III: only tan +.  IV: only cos +.\n" +
      "\n" +
      "SPECIAL ANGLES:\n" +
      "   θ:     0     π/6     π/4     π/3     π/2\n" +
      "   cos:   1     √3/2    √2/2    1/2     0\n" +
      "   sin:   0     1/2     √2/2    √3/2    1\n" +
      "Other angles by reflection: find the reference angle α (the acute angle to the nearest x-axis); the magnitude stays the same and the quadrant decides the sign. A negative θ means clockwise, θ > 2π means more than one full turn; θ + 2π gives the same point.\n" +
      "\n" +
      "METHOD:\n" +
      "   (1) First we can reduce the angle into [0, 2π) (adding or subtracting multiples of 2π).\n" +
      "   (2) Then we see which quadrant it is in (or whether it is on an axis).\n" +
      "   (3) We get the reference angle α: π − θ in II, θ − π in III, 2π − θ in IV.\n" +
      "   (4) cos α and sin α can be read from the special-angle table.\n" +
      "   (5) We attach the quadrant signs: P = (±cos α, ±sin α). tan θ = y/x.\n" +
      "   (6) Finally, we can check that x² + y² = 1.\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Mixing up cos and sin: cos is x (horizontal), sin is y (vertical).\n" +
      "   - Measuring the reference angle to the y-axis; it is always taken to the nearest x-axis.\n" +
      "   - Forgetting the sign; the reference angle only gives the magnitude.\n" +
      "   - Mixing degrees and radians (180° = π rad).\n" +
      "   - Trying to evaluate tan at 90° or 270°; x = 0 there, so it is undefined.\n" +
      "\n" +
      "MINI EXAMPLE: θ = 150°. Quadrant II (90° < 150° < 180°), α = 180° − 150° = 30°. cos 30° = √3/2, sin 30° = 1/2. In II, x < 0 and y > 0, so P = (−√3/2, 1/2); tan 150° = (1/2)/(−√3/2) = −√3/3. Check: 3/4 + 1/4 = 1.");
  }

  function solveSteps(p) {
    const rad = TrigKit.toRad(p.deg);
    const s = Math.sin(rad), c = Math.cos(rad);
    const d = norm(p.deg);
    const steps = [];
    steps.push(I18N.tx(`θ = ${fmt2(p.deg)}°  (${fmt2(rad)} rad)`, `θ = ${fmt2(p.deg)}°  (${fmt2(rad)} rad)`));
    steps.push(I18N.tx(`Birim çember üzerindeki nokta: (cos θ, sin θ) = (${fmt2(c)}, ${fmt2(s)})`,
      `Point on the unit circle: (cos θ, sin θ) = (${fmt2(c)}, ${fmt2(s)})`));
    steps.push(I18N.tx(`sin(θ) = ${fmt2(s)}  (noktanın yüksekliği, dikey dik kenar)`, `sin(θ) = ${fmt2(s)}  (the point's height, the vertical leg)`));
    steps.push(I18N.tx(`cos(θ) = ${fmt2(c)}  (noktanın yatay konumu, yatay dik kenar)`, `cos(θ) = ${fmt2(c)}  (the point's horizontal position, the horizontal leg)`));
    steps.push(I18N.tx(`tan(θ) = sin(θ) / cos(θ) = ${tanText(p.deg)}`, `tan(θ) = sin(θ) / cos(θ) = ${tanText(p.deg)}`));

    const q = quadrantOf(d);
    if (q === 0) {
      steps.push(I18N.tx('Açı bir eksen üzerinde (çeyrek sınırı): nokta eksenlerden birinin üzerindedir.', 'The angle lies on an axis (quadrant boundary): the point is on one of the axes.'));
    } else {
      const sSign = (q === 1 || q === 2) ? '+' : '-';
      const cSign = (q === 1 || q === 4) ? '+' : '-';
      const tSign = (q === 1 || q === 3) ? '+' : '-';
      steps.push(I18N.tx(`Bölge: ${q}. bölge  →  sin ${sSign}, cos ${cSign}, tan ${tSign}`, `Quadrant ${q}  →  sin ${sSign}, cos ${cSign}, tan ${tSign}`));
    }
    steps.push(I18N.tx(`Referans açı: ${fmt2(refAngle(d))}°  (0° ile 360° arasına indirilmiş açı: ${fmt2(d)}°)`,
      `Reference angle: ${fmt2(refAngle(d))}°  (angle reduced to 0°-360°: ${fmt2(d)}°)`));

    if (Number.isInteger(d) && (d % 30 === 0 || d % 45 === 0)) {
      steps.push(I18N.tx(
        `Tam değerler: sin = ${TrigKit.exactTrig('sin', d)},  cos = ${TrigKit.exactTrig('cos', d)},  tan = ${TrigKit.exactTrig('tan', d)}`,
        `Exact values: sin = ${TrigKit.exactTrig('sin', d)},  cos = ${TrigKit.exactTrig('cos', d)},  tan = ${TrigKit.exactTrig('tan', d)}`));
    }
    steps.push(I18N.tx(`Pisagor ile kontrol edelim: sin² + cos² = ${fmt2(s * s + c * c)}`, `Pythagorean check, to be sure: sin² + cos² = ${fmt2(s * s + c * c)}`));
    return steps;
  }

  function aspectOf(canvas) {
    const el = canvas.canvas;
    if (el && el.clientWidth > 50 && el.clientHeight > 50) return el.clientWidth / el.clientHeight;
    return 1.4;
  }

  function draw(canvas, p) {
    const rad = TrigKit.toRad(p.deg);
    const s = Math.sin(rad), c = Math.cos(rad);
    const aspect = aspectOf(canvas);
    canvas.setViewport(-1.6 * aspect, 1.6 * aspect, -1.6, 1.6);

    canvas.addParametric({ xOfT: (t) => Math.cos(t), yOfT: (t) => Math.sin(t), tMin: 0, tMax: 2 * Math.PI, color: canvas.gray(), thickness: 2 });
    // angle arc
    const tEnd = rad;
    if (Math.abs(tEnd) > 1e-6) {
      canvas.addParametric({ xOfT: (t) => 0.25 * Math.cos(t), yOfT: (t) => 0.25 * Math.sin(t), tMin: 0, tMax: tEnd, color: canvas.gold(), thickness: 2 });
    }
    // hypotenuse, horizontal leg (cos), vertical leg (sin)
    canvas.addSegment({ x1: 0, y1: 0, x2: c, y2: s, color: canvas.accent(), thickness: 2 });
    canvas.addSegment({ x1: 0, y1: 0, x2: c, y2: 0, color: canvas.blue(), thickness: 3 });
    canvas.addSegment({ x1: c, y1: 0, x2: c, y2: s, color: canvas.purple(), thickness: 3 });
    canvas.addMarker({ x: c, y: s, color: canvas.accent(), radius: 7, label: `(${fmt2(c)}, ${fmt2(s)})` });
    canvas.addMarker({ x: 0, y: 0, color: canvas.gray(), radius: 3 });
  }

  function buildControls(rightCol, getProblem, h) {
    window.addEventListener('resize', () => h.refresh());
    h.addSlider({
      caption: I18N.tx('Açı θ (derece)', 'Angle θ (degrees)'), min: 0, max: 720, step: 0.5,
      get: () => getProblem().deg, set: (v) => { getProblem().deg = Math.max(0, Math.min(720, v)); },
    });
  }

  Topics.register('trig', {
    id: 'unitCircle',
    tabTitle: () => I18N.tx('Birim Çember', 'The Unit Circle'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    links: [
      { match: /^(BİRİM ÇEMBER|THE UNIT CIRCLE):/, make: (rng) => ({ deg: rng.pick([15, 40, 75, 100, 130, 165, 200, 235, 260, 290, 320, 345, 400, 460, 560]) }) },
      { match: /^(DİK ÜÇGEN|THE RIGHT TRIANGLE):/, make: (rng) => ({ deg: rng.pick([20, 25, 35, 40, 50, 55, 65, 70, 80]) }) },
      { match: /^(İŞARETLER|SIGNS) \(ASTC\):/, make: (rng) => ({ deg: rng.pick([120, 135, 150, 210, 225, 240, 300, 315, 330, 480, 570, 660]) }) },
      { match: /^(ÖZEL AÇILAR|SPECIAL ANGLES):/, make: (rng) => ({ deg: rng.pick([30, 45, 60, 120, 135, 150, 180, 210, 225, 240, 300, 315, 330, 360]) }) },
    ],
    draw,
    focus: () => ({ x: 0, y: 0 }),
    buildControls,
  });
})();
