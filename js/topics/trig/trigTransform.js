// Ported from Modules/Trigonometry/TrigTransformControl.vb: y = A*sin(Bx + C) + D (or cosine).
// problem = { isSine, A, B, C, D }; sliders use the VB ranges (A -3..3, B 0.1..4, C -2pi..2pi, D -3..3).
(function () {
  const A_MIN = -3, A_MAX = 3, B_MIN = 0.1, B_MAX = 4, C_MIN = -6.283185, C_MAX = 6.283185, D_MIN = -3, D_MAX = 3;

  function createProblem() { return { isSine: true, A: 1, B: 1, C: 0, D: 0 }; }

  function waveName(p) { return p.isSine ? 'sin' : 'cos'; }

  function equation(p) {
    return `f(x) = ${fmt2(p.A)}·${waveName(p)}(${fmt2(p.B)}x ${p.C >= 0 ? '+' : '-'} ${fmt2(Math.abs(p.C))}) ${p.D >= 0 ? '+' : '-'} ${fmt2(Math.abs(p.D))}`;
  }

  function periodOf(p) { return p.B > 0.0001 ? 2 * Math.PI / p.B : Infinity; }

  function evaluator(p) {
    return (x) => {
      const arg = p.B * x + p.C;
      return p.A * (p.isSine ? Math.sin(arg) : Math.cos(arg)) + p.D;
    };
  }

  function problemStatement(p) {
    return I18N.tx(
      `${equation(p)} fonksiyonunun genliğini, periyodunu, faz kaymasını ve orta çizgisini birlikte bulalım.`,
      `For ${equation(p)}, let's find the amplitude, period, phase shift and midline.`);
  }

  function concept() {
    return I18N.tx(
      "GENEL FORM: y = A·sin(Bx + C) + D  (veya A·cos(Bx + C) + D). Çarpanlara ayrılmış biçimi: y = A·sin(B(x − h)) + D, burada h = −C/B.\n" +
      "\n" +
      "DÖRT PARAMETRE:\n" +
      "   Genlik = |A|: orta çizgiden tepeye yükseklik. A < 0 ise dalga orta çizgiye göre ters çevrilir (genlik yine |A|).\n" +
      "   Periyot = 2π / |B|: bir tam dalganın yatay uzunluğu. B büyüdükçe dalga sıkışır.\n" +
      "   Faz kayması = −C/B: C > 0 ise sola, C < 0 ise sağa kayma (modüldeki C kaydırıcısı Bx + C biçimindedir).\n" +
      "   Düşey kayma = D: orta çizgi y = D.\n" +
      "   Değer kümesi: [D − |A|, D + |A|].\n" +
      "\n" +
      "ANAHTAR NOKTALAR: Bir periyodu dört eşit parçaya bölebiliriz (her biri periyodun 1/4'ü). Sinüs: orta çizgi (yukarı) → tepe → orta çizgi (aşağı) → çukur → orta çizgi. Kosinüs: tepe → orta → çukur → orta → tepe.\n" +
      "\n" +
      "YÖNTEM (grafikten okuma):\n" +
      "   (1) Önce D = (maksimum + minimum)/2 ile orta çizgiyi bulabiliriz.\n" +
      "   (2) Sonra |A| = (maksimum − minimum)/2 olur.\n" +
      "   (3) Art arda iki tepe (ya da iki çukur) arasındaki uzaklık periyottur, P diyelim; B = 2π / P olur.\n" +
      "   (4) Sinüs için eğrinin orta çizgiyi yukarı doğru kestiği bir nokta seçilir (kosinüs için bir tepe); bu noktanın x değeri h'dir (faz kayması). C = −B·h.\n" +
      "   (5) Denklem y = A·sin(B(x − h)) + D olarak yazılır; grafiğe bakıp A'nın işaretini (yansıma) kontrol edebiliriz.\n" +
      "   (6) Son olarak bir noktayla kontrol edebiliriz.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - Faz kaymasının C sanılması; gerçek kayma −C/B'dir (B ≠ 1 iken fark eder) ve yönü ters görünür.\n" +
      "   - Genliğin maksimum − minimum (tepeden çukura) alınması; bu 2|A|'dır.\n" +
      "   - D'nin maksimum sanılması; D orta çizgidir.\n" +
      "   - Periyodun 2π·B alınması; doğrusu 2π/B'dir.\n" +
      "   - A < 0 yansımasının fark edilmeyip kayma hesabının bozulması.\n" +
      "\n" +
      "MİNİ ÖRNEK: Grafikte maksimum 5, minimum −1, periyot π ve dalga x = π/4'te orta çizgiyi yukarı kesiyor. D = (5 + (−1))/2 = 2, |A| = (5 − (−1))/2 = 3, B = 2π/π = 2, h = π/4, C = −B·h = −π/2. Denklem: y = 3·sin(2x − π/2) + 2. Kontrol: x = π/4'te sin(0) = 0 ⇒ y = 2 (orta çizgi, yukarı) ✓.",
      "GENERAL FORM: y = A·sin(Bx + C) + D  (or A·cos(Bx + C) + D). Factored form: y = A·sin(B(x − h)) + D, where h = −C/B.\n" +
      "\n" +
      "THE FOUR PARAMETERS:\n" +
      "   Amplitude = |A|: the height from the midline to a peak. If A < 0 the wave is flipped over the midline (the amplitude is still |A|).\n" +
      "   Period = 2π / |B|: the horizontal length of one full wave. A larger B compresses the wave.\n" +
      "   Phase shift = −C/B: left if C > 0, right if C < 0 (the C slider in this module is in the Bx + C form).\n" +
      "   Vertical shift = D: the midline is y = D.\n" +
      "   Range: [D − |A|, D + |A|].\n" +
      "\n" +
      "KEY POINTS: split one period into four equal parts (each a quarter of the period). Sine: midline (rising) → peak → midline (falling) → trough → midline. Cosine: peak → midline → trough → midline → peak.\n" +
      "\n" +
      "METHOD (reading a graph):\n" +
      "   (1) First, D = (maximum + minimum)/2 gives us the midline.\n" +
      "   (2) Then |A| = (maximum − minimum)/2.\n" +
      "   (3) The distance between two successive peaks (or two troughs) is the period P; B = 2π / P.\n" +
      "   (4) For sine, we can pick a point where the curve crosses the midline going up (for cosine a peak); its x-value is h (the phase shift). C = −B·h.\n" +
      "   (5) We write the equation: y = A·sin(B(x − h)) + D; it helps to check the sign of A (reflection) against the graph.\n" +
      "   (6) Finally, we can verify with one point.\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Taking the phase shift to be C; the true shift is −C/B (it matters when B ≠ 1) and its direction looks reversed.\n" +
      "   - Using maximum − minimum (peak to trough) as the amplitude; that is 2|A|.\n" +
      "   - Calling D the maximum; D is the midline.\n" +
      "   - Using 2π·B for the period; it is 2π/B.\n" +
      "   - Missing an A < 0 reflection and spoiling the shift calculation.\n" +
      "\n" +
      "MINI EXAMPLE: The graph has maximum 5, minimum −1, period π, and crosses the midline going up at x = π/4. D = (5 + (−1))/2 = 2, |A| = (5 − (−1))/2 = 3, B = 2π/π = 2, h = π/4, C = −B·h = −π/2. Equation: y = 3·sin(2x − π/2) + 2. Check: at x = π/4, sin(0) = 0 ⇒ y = 2 (midline, rising) ✓.");
  }

  function solveSteps(p) {
    const period = periodOf(p);
    const steps = [];
    steps.push(I18N.tx(`Genel form: y = A·${waveName(p)}(Bx + C) + D`, `General form: y = A·${waveName(p)}(Bx + C) + D`));
    steps.push(I18N.tx(`Şu anki fonksiyon: ${equation(p)}`, `Current function: ${equation(p)}`));
    steps.push(I18N.tx(`Genlik = |A| = ${fmt2(Math.abs(p.A))}` + (p.A < 0 ? '  (A < 0: dalga x eksenine göre yansır)' : ''),
      `Amplitude = |A| = ${fmt2(Math.abs(p.A))}` + (p.A < 0 ? '  (A < 0: the wave is reflected)' : '')));
    steps.push(I18N.tx(`Periyot = 2π / B = ${fmt2(period)}`, `Period = 2π / B = ${fmt2(period)}`));
    const shift = -p.C / p.B;
    steps.push(I18N.tx(
      `Faz kayması = -C / B = ${fmt2(shift)}  (${shift >= 0 ? 'sağa' : 'sola'} ${fmt2(Math.abs(shift))} birim)`,
      `Phase shift = -C / B = ${fmt2(shift)}  (${fmt2(Math.abs(shift))} units to the ${shift >= 0 ? 'right' : 'left'})`));
    steps.push(I18N.tx(`Orta çizgi: y = D = ${fmt2(p.D)}`, `Midline: y = D = ${fmt2(p.D)}`));
    steps.push(I18N.tx(`Değer aralığı: [${fmt2(p.D - Math.abs(p.A))}, ${fmt2(p.D + Math.abs(p.A))}]`,
      `Range: [${fmt2(p.D - Math.abs(p.A))}, ${fmt2(p.D + Math.abs(p.A))}]`));
    return steps;
  }

  function draw(canvas, p) {
    canvas.setViewport(-2 * Math.PI, 2 * Math.PI, -4, 4);
    canvas.addFunction({ evaluator: evaluator(p), color: canvas.accent(), thickness: 3 });
    canvas.addGuideLine({ axis: 'horizontal', position: p.D, color: canvas.gray() });
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSelect({
      options: [{ label: I18N.tx('Sinüs', 'Sine'), value: 'sin' }, { label: I18N.tx('Kosinüs', 'Cosine'), value: 'cos' }],
      get: () => (getProblem().isSine ? 'sin' : 'cos'),
      set: (v) => { getProblem().isSine = (v === 'sin'); },
    });
    const mk = (caption, min, max, key) => h.addSlider({
      caption, min, max, step: 0.05,
      get: () => getProblem()[key],
      set: (v) => { getProblem()[key] = Math.max(min, Math.min(max, v)); },
    });
    mk(I18N.tx('Genlik (A)', 'Amplitude (A)'), A_MIN, A_MAX, 'A');
    mk(I18N.tx('Frekans (B)', 'Frequency (B)'), B_MIN, B_MAX, 'B');
    mk(I18N.tx('Faz kayması (C)', 'Phase shift (C)'), C_MIN, C_MAX, 'C');
    mk(I18N.tx('Düşey kayma (D)', 'Vertical shift (D)'), D_MIN, D_MAX, 'D');
  }

  Topics.register('trig', {
    id: 'trigTransform',
    tabTitle: () => I18N.tx('Sinüs ve Kosinüs Dönüşümleri', 'Sine & Cosine Transformations'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    links: [
      { match: /^\s+(Genlik|Amplitude) = /, make: (rng) => ({ isSine: rng.nextInt(0, 2) === 0, A: rng.pick([2, 3, -2, -3, 1.5, -1]), B: 1, C: 0, D: 0 }) },
      { match: /^\s+(Periyot|Period) = /, make: (rng) => ({ isSine: rng.nextInt(0, 2) === 0, A: rng.pick([1, 2, -1]), B: rng.pick([2, 3, 0.5, 4, 1.5]), C: 0, D: 0 }) },
      { match: /^\s+(Faz kayması|Phase shift) = /, make: (rng) => ({ isSine: rng.nextInt(0, 2) === 0, A: 1, B: rng.pick([1, 2]), C: rng.pick([-3, -2, -1.5, -1, 1, 1.5, 2, 3]), D: 0 }) },
      { match: /^\s+(Düşey kayma|Vertical shift) = /, make: (rng) => ({ isSine: rng.nextInt(0, 2) === 0, A: rng.pick([1, 2]), B: 1, C: 0, D: rng.pick([-2, -1, 1, 2, 2.5]) }) },
      { match: /^\s+(Değer kümesi|Range):/, make: (rng) => ({ isSine: rng.nextInt(0, 2) === 0, A: rng.pick([2, -2, 1.5, 3]), B: 1, C: 0, D: rng.pick([-1, 0, 1, -0.5]) }) },
    ],
    draw,
    focus: (p) => ({ x: -p.C / p.B, y: p.D }),
    buildControls,
  });
})();
