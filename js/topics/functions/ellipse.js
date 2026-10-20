// Ported from Modules/Functions/FnTabs3.vb (EllipseControl) - x²/a² + y²/b² = 1, obtained by
// vertically scaling the circle x² + y² = a² by a factor b/a. Dashed = original circle,
// thick accent curve = the ellipse.
(function () {
  function createProblem(rng) {
    return { a: rng.nextInt(2, 7), b: rng.nextInt(1, 6) };
  }

  function solveSteps(problem) {
    const a = problem.a, b = problem.b;
    const steps = [
      I18N.tx(`Elips: x²/${a * a} + y²/${b * b} = 1`, `Ellipse: x²/${a * a} + y²/${b * b} = 1`),
      I18N.tx(
        `Standart forma göre a² = ${a * a} → a = ${a} (x yönü);  b² = ${b * b} → b = ${b} (y yönü)`,
        `Comparing with the standard form: a² = ${a * a} → a = ${a} (x direction);  b² = ${b * b} → b = ${b} (y direction)`,
      ),
      I18N.tx(`x-kesimleri: (±${a}, 0);   y-kesimleri: (0, ±${b})`, `x-intercepts: (±${a}, 0);   y-intercepts: (0, ±${b})`),
    ];
    if (a === b) {
      steps.push(I18N.tx(`a = b olduğundan bu bir ÇEMBERDİR (yarıçap ${a}); odak yoktur (c = 0).`, `Since a = b this is a CIRCLE (radius ${a}); there are no separate foci (c = 0).`));
    } else {
      const c = Math.sqrt(Math.abs(a * a - b * b));
      const major = a > b ? I18N.tx('yatay', 'horizontal') : I18N.tx('dikey', 'vertical');
      steps.push(I18N.tx(
        `Büyük eksen ${major}: uzunluk 2·${Math.max(a, b)} = ${2 * Math.max(a, b)};  küçük eksen: 2·${Math.min(a, b)} = ${2 * Math.min(a, b)}`,
        `The major axis is ${major}: length 2·${Math.max(a, b)} = ${2 * Math.max(a, b)};  minor axis: 2·${Math.min(a, b)} = ${2 * Math.min(a, b)}`,
      ));
      const foci = a > b ? `(±${fmt2(c)}, 0)` : `(0, ±${fmt2(c)})`;
      steps.push(I18N.tx(
        `Odak uzaklığı c = √(${Math.max(a, b) * Math.max(a, b)} - ${Math.min(a, b) * Math.min(a, b)}) = ${fmt2(c)};  odaklar ${foci}`,
        `Focal distance c = √(${Math.max(a, b) * Math.max(a, b)} - ${Math.min(a, b) * Math.min(a, b)}) = ${fmt2(c)};  foci ${foci}`,
      ));
    }
    steps.push(I18N.tx(
      `Çemberden elipse: x² + y² = ${a * a} çemberi dikey yönde ${b}/${a} katsayısıyla ölçeklenir.`,
      `From circle to ellipse: the circle x² + y² = ${a * a} is scaled vertically by the factor ${b}/${a}.`,
    ));
    return steps;
  }

  // Width/height of the canvas so a circle really looks like a circle (equal units on both axes) -
  // mirrors VB's AspectOf(canvas). If the canvas hasn't been laid out yet, fall back to 1.4 like the VB code did.
  function aspectOf(canvas) {
    const el = canvas.canvas;
    if (el && el.clientWidth > 50 && el.clientHeight > 50) return el.clientWidth / el.clientHeight;
    return 1.4;
  }

  function draw(canvas, problem) {
    const a = problem.a, b = problem.b;
    const lim = Math.max(a, b) + 2;
    const aspect = aspectOf(canvas);
    canvas.setViewport(-lim * aspect, lim * aspect, -lim, lim);
    canvas.addParametric({ xOfT: (t) => a * Math.cos(t), yOfT: (t) => a * Math.sin(t), color: canvas.gray(), thickness: 1.8, dashed: true });
    canvas.addParametric({ xOfT: (t) => a * Math.cos(t), yOfT: (t) => b * Math.sin(t), color: canvas.accent(), thickness: 3.0 });
    canvas.addMarker({ x: a, y: 0, color: canvas.gold(), radius: 6 });
    canvas.addMarker({ x: -a, y: 0, color: canvas.gold(), radius: 6 });
    canvas.addMarker({ x: 0, y: b, color: canvas.blue(), radius: 6 });
    canvas.addMarker({ x: 0, y: -b, color: canvas.blue(), radius: 6 });
    if (a !== b) {
      const c = Math.sqrt(Math.abs(a * a - b * b));
      if (a > b) {
        canvas.addMarker({ x: c, y: 0, color: canvas.green(), shape: 'diamond', radius: 6 });
        canvas.addMarker({ x: -c, y: 0, color: canvas.green(), shape: 'diamond', radius: 6 });
      } else {
        canvas.addMarker({ x: 0, y: c, color: canvas.green(), shape: 'diamond', radius: 6 });
        canvas.addMarker({ x: 0, y: -c, color: canvas.green(), shape: 'diamond', radius: 6 });
      }
    }
  }

  Topics.register('functions', {
    id: 'ellipse',
    problemStatement: (p) => {
      const a2 = p.a * p.a, b2 = p.b * p.b;
      return I18N.tx(`x²/${a2} + y²/${b2} = 1 elipsinin eksenlerle kesişimlerini, eksen uzunluklarını ve odaklarını bulalım.`,
                     `Let's find the intercepts, the axis lengths and the foci of the ellipse x²/${a2} + y²/${b2} = 1.`);
    },
    tabTitle: () => I18N.tx('Elipsler', 'Ellipses'),
    concept: () => I18N.tx(
      "ÇEMBERDEN ELİPSE\n" +
      "Merkezi orijinde r yarıçaplı çember: x² + y² = r². Bu çemberi yatay ya da dikey yönde sıkıştırıp uzatınca ELİPS elde edilir:\n" +
      "  x²/a² + y²/b² = 1\n" +
      "• a: x yönündeki yarı eksen (x-kesimleri ±a); b: y yönündeki yarı eksen (y-kesimleri ±b). a = b ise çemberdir.\n" +
      "• Merkez (h, k) ise:  (x - h)²/a² + (y - k)²/b² = 1.\n" +
      "\n" +
      "BÜYÜK/KÜÇÜK EKSEN VE ODAKLAR\n" +
      "• m = max(a, b) büyük yarı eksen, n = min(a, b) küçük yarı eksen.\n" +
      "• Odak uzaklığı c = √(m² - n²). Odaklar BÜYÜK eksen üzerindedir: a > b ise (±c, 0); b > a ise (0, ±c).\n" +
      "• Dışmerkezlik e = c/m (0 ≤ e < 1); e = 0 çemberdir. Elips üzerindeki her noktanın iki odağa uzaklıklarının toplamı 2m'dir.\n" +
      "• Alan = πab. Parametrik: x = a·cos t, y = b·sin t.\n" +
      "\n" +
      "NASIL ÇÖZÜLÜR? (YÖNTEM)\n" +
      "1. Önce denklemi sağ taraf = 1 olacak şekilde yazalım.\n" +
      "2. x² ve y² altındaki paydalar a² ve b²'dir; karekök alarak a ve b'yi bulabiliriz.\n" +
      "3. Büyük payda hangi değişkenin altındaysa büyük eksen o yöndedir; buna bakalım.\n" +
      "4. Son olarak c = √(m² - n²) ile odakları, e = c/m ile dışmerkezliği bulabiliriz.\n" +
      "\n" +
      "MİNİ ÖRNEK\n" +
      "x²/25 + y²/9 = 1: a = 5, b = 3 (a > b: büyük eksen yatay). c = √(25 - 9) = 4 → odaklar (±4, 0); e = 4/5 = 0,8; alan = 15π. Tepe noktaları (±5, 0), (0, ±3).\n" +
      "\n" +
      "FONKSİYON MU?\n" +
      "Elips dikey doğru testini geçemez (x = 0'da y = ±b). Üst yarı y = b·√(1 - x²/a²) bir fonksiyondur: D = [-a, a], R = [0, b].\n" +
      "\n" +
      "DİKKAT\n" +
      "• Paydalar a² ve b²'dir, a ve b değil: x²/16 + y²/9 = 1 için a = 4, b = 3.\n" +
      "• c² = m² - n² (eksi). Hiperbolde artı olur; ikisini karıştırmamaya özen gösterebiliriz.\n" +
      "• Büyük payda y'nin altındaysa odaklar y ekseni üzerindedir.\n" +
      "• MÜHENDİSLİKTE: gezegen yörüngeleri, eliptik kemerler, silindirin eğik kesiti.\n" +
      "• Kesikli çember yarıçapı a olan asıl çemberdir; elips onun dikey olarak b/a katsayısıyla ölçeklenmişidir.",
      "FROM CIRCLE TO ELLIPSE\n" +
      "The circle centred at the origin with radius r is x² + y² = r². Compressing or stretching it horizontally or vertically gives an ELLIPSE:\n" +
      "  x²/a² + y²/b² = 1\n" +
      "• a: semi-axis in the x direction (x-intercepts ±a); b: semi-axis in the y direction (y-intercepts ±b). If a = b it is a circle.\n" +
      "• With centre (h, k):  (x - h)²/a² + (y - k)²/b² = 1.\n" +
      "\n" +
      "MAJOR/MINOR AXIS AND FOCI\n" +
      "• m = max(a, b) is the semi-major axis, n = min(a, b) the semi-minor axis.\n" +
      "• Focal distance c = √(m² - n²). The foci lie on the MAJOR axis: (±c, 0) if a > b; (0, ±c) if b > a.\n" +
      "• Eccentricity e = c/m (0 ≤ e < 1); e = 0 is a circle. For every point of the ellipse the distances to the two foci add up to 2m.\n" +
      "• Area = πab. Parametric form: x = a·cos t, y = b·sin t.\n" +
      "\n" +
      "HOW TO SOLVE (METHOD)\n" +
      "1. Let's first write the equation with the right-hand side = 1.\n" +
      "2. The denominators under x² and y² are a² and b²; we can take square roots to get a and b.\n" +
      "3. The major axis lies along the variable with the larger denominator.\n" +
      "4. We can find the foci from c = √(m² - n²) and the eccentricity from e = c/m.\n" +
      "\n" +
      "MINI EXAMPLE\n" +
      "x²/25 + y²/9 = 1: a = 5, b = 3 (a > b: horizontal major axis). c = √(25 - 9) = 4 → foci (±4, 0); e = 4/5 = 0.8; area = 15π. Vertices (±5, 0), (0, ±3).\n" +
      "\n" +
      "IS IT A FUNCTION?\n" +
      "An ellipse fails the vertical line test (at x = 0, y = ±b). The upper half y = b·√(1 - x²/a²) is a function: D = [-a, a], R = [0, b].\n" +
      "\n" +
      "PITFALLS\n" +
      "• The denominators are a² and b², not a and b: for x²/16 + y²/9 = 1, a = 4, b = 3.\n" +
      "• c² = m² - n² (minus). For a hyperbola it is plus; it helps not to mix them up.\n" +
      "• If the larger denominator is under y, the foci are on the y-axis.\n" +
      "• IN ENGINEERING: planetary orbits, elliptical arches, the oblique cut of a cylinder.\n" +
      "• The dashed circle of radius a is the original circle; the ellipse is that circle scaled vertically by the factor b/a."
    ),
    createProblem,
    links: [
      { match: /^• (a: x yönündeki|a: semi-axis in the x)/, make: (rng) => { const a = rng.nextInt(2, 7); return { a, b: a }; } },
      { match: /^• (m = max|m = max\(a, b\) is)/, make: (rng) => { const b = rng.nextInt(3, 7); return { a: rng.nextInt(1, b), b }; } },
      { match: /^• (Odak uzaklığı|Focal distance)/, make: (rng) => { const a = rng.nextInt(3, 7); return { a, b: rng.nextInt(1, a) }; } },
    ],
    solveSteps,
    draw,
    focus: () => ({ x: 0, y: 0 }),
    buildControls: (rightCol, getProblem, h) => {
      // Mirrors VB's `AddHandler Canvas.Resize, Sub() RefreshDisplay()` - the aspect-corrected
      // viewport depends on the canvas's pixel size, so re-run draw() when the window resizes.
      window.addEventListener('resize', () => h.refresh());

      h.addSlider({
        caption: I18N.tx('a (x yönündeki yarı eksen)', 'a (semi-axis in x)'), min: 1, max: 7,
        get: () => getProblem().a, set: (v) => { getProblem().a = Math.max(1, Math.round(v)); },
      });
      h.addSlider({
        caption: I18N.tx('b (y yönündeki yarı eksen)', 'b (semi-axis in y)'), min: 1, max: 7,
        get: () => getProblem().b, set: (v) => { getProblem().b = Math.max(1, Math.round(v)); },
      });
    },
  });
})();
