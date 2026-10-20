// Ported from Modules/Functions/FunctionExplorerControl.vb + FunctionDefinitions.vb.
// The VB control is a live "pick a family, drag sliders" explorer (no random problem, no Apply
// button - every slider move redraws immediately). It is adapted to the worked-example contract:
//   problem = { familyIndex, coefficients: [...] } (plain object, mutated in place by the sliders)
//   createProblem() always starts on the first family (Linear) with its VB DefaultValue coefficients,
//     mirroring `SelectFamily(_families(0))` in the VB constructor - there is no randomness to port.
//   concept() = the VB help-dialog text (translated 1:1) + the CURRENT family name/formula.
//   solveSteps() turns the same facts the VB UpdateMarkersAndGuides() method draws as markers/guide
//     lines (roots, vertex, asymptotes, y-intercept) into step sentences, plus a general-form step
//     and a "what does each coefficient do" step (VB has no on-screen text for these, so they are
//     short generic factual sentences).
//   draw() plots the curve and the same roots/vertex/asymptote/y-intercept markers as the VB source.
(function () {
  // Mirrors FunctionLibrary.Private Function SignedTerm(value, suffix) - always prints the term,
  // even when the value is zero (VB does not suppress zero terms here).
  function signedTerm(value, suffix) {
    suffix = suffix || '';
    return value >= 0 ? `+ ${fmt2(value)}${suffix}` : `- ${fmt2(Math.abs(value))}${suffix}`;
  }

  // Mirrors FunctionLibrary.Private Function SignedInner(value) - used inside "(x - h)" / "|x - h|".
  function signedInner(value) {
    return value >= 0 ? `- ${fmt2(value)}` : `+ ${fmt2(Math.abs(value))}`;
  }

  // Mirrors FunctionLibrary.SafeEvaluate - never lets an evaluator throw.
  function safeEvaluate(f, x) {
    try {
      const y = f(x);
      return typeof y === 'number' ? y : NaN;
    } catch (e) {
      return NaN;
    }
  }

  // Mirrors FunctionLibrary.Bisect.
  function bisect(f, a, b) {
    let lo = a;
    let hi = b;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2.0;
      const fMid = safeEvaluate(f, mid);
      const fLo = safeEvaluate(f, lo);
      if (Number.isNaN(fMid) || Number.isNaN(fLo)) return NaN;
      if (Math.sign(fMid) === Math.sign(fLo)) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2.0;
  }

  // Mirrors FunctionLibrary.FindRootsNumeric - samples and bisects on sign changes; a sign change
  // across a pole (e.g. 1/x) is only kept as a root if f is really ~0 there.
  function findRootsNumeric(f, xMin, xMax, samples) {
    samples = samples || 400;
    const roots = [];
    const step = (xMax - xMin) / samples;
    let prevX = xMin;
    let prevY = safeEvaluate(f, prevX);
    for (let i = 1; i <= samples; i++) {
      const x = xMin + i * step;
      const y = safeEvaluate(f, x);
      if (!Number.isNaN(prevY) && !Number.isNaN(y)) {
        if (Math.abs(y) < 0.0000001) {
          roots.push(x);
        } else if (Math.sign(prevY) !== Math.sign(y)) {
          const root = bisect(f, prevX, x);
          const fRoot = safeEvaluate(f, root);
          if (!Number.isNaN(root) && !Number.isNaN(fRoot) && Math.abs(fRoot) < 0.001) roots.push(root);
        }
      }
      prevX = x;
      prevY = y;
    }
    return roots;
  }

  // Viewport mirrors GraphCanvas's default (-10..10, -6..6); the VB canvas' ResetViewport() is
  // called whenever the family changes, so we just use the same fixed range every draw/step pass.
  const VIEW_X_MIN = -10, VIEW_X_MAX = 10, VIEW_Y_MIN = -6, VIEW_Y_MAX = 6;

  // ---- the catalogue of function families (FunctionLibrary.GetAllFamilies) ----
  // Names/roles/slider labels are stored as Turkish/English pairs (NOT pre-resolved through
  // I18N.tx) so they stay correct if the language is toggled - I18N.tx() is only called at the
  // point of use, inside functions that run again on every mount/refresh.
  const FAMILY_DEFS = [
    { // Linear: f(x) = a*x + b
      nameTr: 'Doğrusal', nameEn: 'Linear',
      sliders: [
        { nameTr: 'Eğim', nameEn: 'Slope', symbol: 'a', min: -5, max: 5, default: 1 },
        { nameTr: 'Sabit terim', nameEn: 'Intercept', symbol: 'b', min: -10, max: 10, default: 0 },
      ],
      generalForm: 'f(x) = a·x + b',
      roleTr: 'a doğrunun eğimini (yönünü ve ne kadar dik olduğunu) belirler; b ise y eksenini kestiği noktayı (düşey kaymayı) belirler.',
      roleEn: 'a sets the slope of the line (its direction and steepness); b sets where it crosses the y-axis (the vertical shift).',
      evaluate: (c, x) => c[0] * x + c[1],
      equationText: (c) => `f(x) = ${fmt2(c[0])}x ${signedTerm(c[1])}`,
      vertex: null,
      verticalAsymptotes: null,
      horizontalAsymptotes: null,
    },
    { // Quadratic: f(x) = a*x^2 + b*x + c
      nameTr: 'İkinci Derece', nameEn: 'Quadratic',
      sliders: [
        { nameTr: 'Baş katsayı', nameEn: 'Leading coeff.', symbol: 'a', min: -3, max: 3, default: 1 },
        { nameTr: 'Doğrusal katsayı', nameEn: 'Linear coeff.', symbol: 'b', min: -10, max: 10, default: 0 },
        { nameTr: 'Sabit', nameEn: 'Constant', symbol: 'c', min: -10, max: 10, default: 0 },
      ],
      generalForm: 'f(x) = a·x² + b·x + c',
      roleTr: 'a parabolün yukarı/aşağı açılmasını ve ne kadar dar/geniş olduğunu belirler; b tepe noktasını yatayda kaydırır; c ise y eksenini kestiği noktayı (düşey kaymayı) belirler.',
      roleEn: 'a sets whether the parabola opens up or down and how narrow/wide it is; b shifts the vertex horizontally; c sets the y-intercept (vertical shift).',
      evaluate: (c, x) => c[0] * x * x + c[1] * x + c[2],
      equationText: (c) => `f(x) = ${fmt2(c[0])}x² ${signedTerm(c[1], 'x')} ${signedTerm(c[2])}`,
      vertex: (c) => {
        if (c[0] === 0) return null;
        const vx = -c[1] / (2 * c[0]);
        const vy = c[0] * vx * vx + c[1] * vx + c[2];
        return [vx, vy];
      },
      verticalAsymptotes: null,
      horizontalAsymptotes: null,
    },
    { // Cubic: f(x) = a*x^3 + b*x^2 + c*x + d
      nameTr: 'Üçüncü Derece', nameEn: 'Cubic',
      sliders: [
        { nameTr: 'x³ katsayısı', nameEn: 'x³ coeff.', symbol: 'a', min: -2, max: 2, default: 1 },
        { nameTr: 'x² katsayısı', nameEn: 'x² coeff.', symbol: 'b', min: -5, max: 5, default: 0 },
        { nameTr: 'x katsayısı', nameEn: 'x coeff.', symbol: 'c', min: -10, max: 10, default: 0 },
        { nameTr: 'Sabit', nameEn: 'Constant', symbol: 'd', min: -10, max: 10, default: 0 },
      ],
      generalForm: 'f(x) = a·x³ + b·x² + c·x + d',
      roleTr: 'a eğrinin uç davranışını ve dikliğini belirler; b eğriyi çarpıtır (simetriyi bozar); c dönüm bölgesindeki eğimi etkiler; d ise düşey kaymadır.',
      roleEn: 'a sets the end behaviour and steepness of the curve; b skews the curve (breaks symmetry); c affects the slope near the turning region; d is the vertical shift.',
      evaluate: (c, x) => c[0] * Math.pow(x, 3) + c[1] * Math.pow(x, 2) + c[2] * x + c[3],
      equationText: (c) => `f(x) = ${fmt2(c[0])}x³ ${signedTerm(c[1], 'x²')} ${signedTerm(c[2], 'x')} ${signedTerm(c[3])}`,
      vertex: null,
      verticalAsymptotes: null,
      horizontalAsymptotes: null,
    },
    { // Absolute value: f(x) = a*|x - h| + k
      nameTr: 'Mutlak Değer', nameEn: 'Absolute Value',
      sliders: [
        { nameTr: 'Ölçek', nameEn: 'Scale', symbol: 'a', min: -3, max: 3, default: 1 },
        { nameTr: 'Yatay kayma', nameEn: 'Horiz. shift', symbol: 'h', min: -8, max: 8, default: 0 },
        { nameTr: 'Düşey kayma', nameEn: 'Vert. shift', symbol: 'k', min: -8, max: 8, default: 0 },
      ],
      generalForm: 'f(x) = a·|x - h| + k',
      roleTr: 'a "V" şeklini gerer/daraltır ve a < 0 olduğunda ters çevirir; h köşeyi yatayda, k ise düşeyde kaydırır.',
      roleEn: 'a stretches/narrows the "V" shape and flips it when a < 0; h shifts the corner horizontally, k shifts it vertically.',
      evaluate: (c, x) => c[0] * Math.abs(x - c[1]) + c[2],
      equationText: (c) => `f(x) = ${fmt2(c[0])}|x ${signedInner(c[1])}| ${signedTerm(c[2])}`,
      vertex: (c) => [c[1], c[2]],
      verticalAsymptotes: null,
      horizontalAsymptotes: null,
    },
    { // Reciprocal: f(x) = a / (x - h) + k
      nameTr: 'Ters (1/x)', nameEn: 'Reciprocal',
      sliders: [
        { nameTr: 'Ölçek', nameEn: 'Scale', symbol: 'a', min: -5, max: 5, default: 1 },
        { nameTr: 'Yatay kayma', nameEn: 'Horiz. shift', symbol: 'h', min: -8, max: 8, default: 0 },
        { nameTr: 'Düşey kayma', nameEn: 'Vert. shift', symbol: 'k', min: -8, max: 8, default: 0 },
      ],
      generalForm: 'f(x) = a / (x - h) + k',
      roleTr: 'a dalların açıklığını ve yönünü belirler; h düşey asimptotu (yatay kayma), k ise yatay asimptotu (düşey kayma) belirler.',
      roleEn: 'a sets how open the branches are and which way they face; h sets the vertical asymptote (horizontal shift), k sets the horizontal asymptote (vertical shift).',
      evaluate: (c, x) => {
        if (Math.abs(x - c[1]) < 0.0001) return NaN;
        return c[0] / (x - c[1]) + c[2];
      },
      equationText: (c) => `f(x) = ${fmt2(c[0])} / (x ${signedInner(c[1])}) ${signedTerm(c[2])}`,
      vertex: null,
      verticalAsymptotes: (c) => [c[1]],
      horizontalAsymptotes: (c) => [c[2]],
    },
    { // Exponential: f(x) = a * b^(x - h) + k
      nameTr: 'Üstel', nameEn: 'Exponential',
      sliders: [
        { nameTr: 'Ölçek', nameEn: 'Scale', symbol: 'a', min: -3, max: 3, default: 1 },
        { nameTr: 'Taban', nameEn: 'Base', symbol: 'b', min: 1.05, max: 3, default: Math.E },
        { nameTr: 'Yatay kayma', nameEn: 'Horiz. shift', symbol: 'h', min: -5, max: 5, default: 0 },
        { nameTr: 'Düşey kayma', nameEn: 'Vert. shift', symbol: 'k', min: -8, max: 8, default: 0 },
      ],
      generalForm: 'f(x) = a·b^(x - h) + k',
      roleTr: 'a ölçekler ve a < 0 olduğunda yansıtır; b (taban) büyüme hızını belirler; h yatay kaymadır; k ise yatay asimptottur (düşey kayma).',
      roleEn: 'a scales the curve and reflects it when a < 0; b (the base) sets the growth rate; h is the horizontal shift; k is the horizontal asymptote (vertical shift).',
      evaluate: (c, x) => {
        const v = c[0] * Math.pow(c[1], x - c[2]) + c[3];
        return Number.isFinite(v) ? v : NaN;
      },
      equationText: (c) => `f(x) = ${fmt2(c[0])}·${fmt2(c[1])}^(x ${signedInner(c[2])}) ${signedTerm(c[3])}`,
      vertex: null,
      verticalAsymptotes: null,
      horizontalAsymptotes: (c) => [c[3]],
    },
    { // Logarithmic: f(x) = a * ln(x - h) + k, domain x > h
      nameTr: 'Logaritmik', nameEn: 'Logarithmic',
      sliders: [
        { nameTr: 'Ölçek', nameEn: 'Scale', symbol: 'a', min: -3, max: 3, default: 1 },
        { nameTr: 'Yatay kayma', nameEn: 'Horiz. shift', symbol: 'h', min: -5, max: 5, default: 0 },
        { nameTr: 'Düşey kayma', nameEn: 'Vert. shift', symbol: 'k', min: -8, max: 8, default: 0 },
      ],
      generalForm: 'f(x) = a·ln(x - h) + k,  tanım kümesi: x > h',
      roleTr: 'a ölçekler ve a < 0 olduğunda yansıtır; h düşey asimptotu ve tanım kümesinin başlangıcını belirler; k düşey kaymadır.',
      roleEn: 'a scales the curve and reflects it when a < 0; h sets the vertical asymptote and where the domain starts; k is the vertical shift.',
      evaluate: (c, x) => {
        if (x - c[1] <= 0) return NaN;
        return c[0] * Math.log(x - c[1]) + c[2];
      },
      equationText: (c) => `f(x) = ${fmt2(c[0])}·ln(x ${signedInner(c[1])}) ${signedTerm(c[2])}`,
      vertex: null,
      verticalAsymptotes: (c) => [c[1]],
      horizontalAsymptotes: null,
    },
    { // Square root: f(x) = a * sqrt(x - h) + k, domain x >= h
      nameTr: 'Karekök', nameEn: 'Square Root',
      sliders: [
        { nameTr: 'Ölçek', nameEn: 'Scale', symbol: 'a', min: -3, max: 3, default: 1 },
        { nameTr: 'Yatay kayma', nameEn: 'Horiz. shift', symbol: 'h', min: -8, max: 8, default: 0 },
        { nameTr: 'Düşey kayma', nameEn: 'Vert. shift', symbol: 'k', min: -8, max: 8, default: 0 },
      ],
      generalForm: 'f(x) = a·√(x - h) + k,  tanım kümesi: x ≥ h',
      roleTr: 'a ölçekler ve a < 0 olduğunda yansıtır; h tanım kümesinin başladığı noktayı (yatay kayma) belirler; k düşey kaymadır.',
      roleEn: 'a scales the curve and reflects it when a < 0; h sets where the domain starts (horizontal shift); k is the vertical shift.',
      evaluate: (c, x) => {
        if (x - c[1] < 0) return NaN;
        return c[0] * Math.sqrt(x - c[1]) + c[2];
      },
      equationText: (c) => `f(x) = ${fmt2(c[0])}·√(x ${signedInner(c[1])}) ${signedTerm(c[2])}`,
      vertex: (c) => [c[1], c[2]],
      verticalAsymptotes: null,
      horizontalAsymptotes: null,
    },
    { // Piecewise: two linear pieces meeting at x = 0
      nameTr: 'Parçalı (doğrusal)', nameEn: 'Piecewise (linear)',
      sliders: [
        { nameTr: 'Eğim (x<0)', nameEn: 'Slope (x<0)', symbol: 'a₁', min: -5, max: 5, default: -1 },
        { nameTr: 'Sabit terim (x<0)', nameEn: 'Intercept (x<0)', symbol: 'b₁', min: -8, max: 8, default: 0 },
        { nameTr: 'Eğim (x≥0)', nameEn: 'Slope (x≥0)', symbol: 'a₂', min: -5, max: 5, default: 1 },
        { nameTr: 'Sabit terim (x≥0)', nameEn: 'Intercept (x≥0)', symbol: 'b₂', min: -8, max: 8, default: 0 },
      ],
      generalForm: 'f(x) = a₁x + b₁  (x<0);   a₂x + b₂  (x≥0)',
      roleTr: 'a₁ ve b₁ sol parçanın (x<0) eğimini ve sabit terimini belirler; a₂ ve b₂ ise sağ parçanın (x≥0) eğimini ve sabit terimini belirler.',
      roleEn: 'a₁ and b₁ set the slope and intercept of the left piece (x<0); a₂ and b₂ set the slope and intercept of the right piece (x≥0).',
      evaluate: (c, x) => (x < 0 ? c[0] * x + c[1] : c[2] * x + c[3]),
      equationText: (c) => `f(x) = ${fmt2(c[0])}x ${signedTerm(c[1])}  (x<0);   ${fmt2(c[2])}x ${signedTerm(c[3])}  (x≥0)`,
      vertex: null,
      verticalAsymptotes: null,
      horizontalAsymptotes: null,
    },
  ];

  function familyName(f) { return I18N.tx(f.nameTr, f.nameEn); }
  function familyRole(f) { return I18N.tx(f.roleTr, f.roleEn); }
  function sliderName(s) { return I18N.tx(s.nameTr, s.nameEn); }

  // ---- worked-example contract ----

  // "New Example" picks a RANDOM family with random (rounded) coefficients inside each slider's range, so
  // every click gives a visibly different function. (The first mount still starts on Linear defaults.)
  let lastRng = null; // each mount creates its own Rng: the first problem of a mount starts on Linear defaults
  function createProblem(rng) {
    if (!rng || rng !== lastRng) {
      lastRng = rng;
      const family = FAMILY_DEFS[0];
      return { familyIndex: 0, coefficients: family.sliders.map((s) => s.default) };
    }
    return randomFamily(rng, rng.nextInt(0, FAMILY_DEFS.length));
  }

  function randomFamily(rng, familyIndex) {
    const family = FAMILY_DEFS[familyIndex];
    const coefficients = family.sliders.map((s, i) => {
      let v = Math.round((s.min + rng.nextDouble() * (s.max - s.min)) * 2) / 2; // multiples of 0.5
      v = Math.max(s.min, Math.min(s.max, v));
      if (i === 0 && Math.abs(v) < 0.5) v = rng.nextInt(0, 2) === 0 ? 1 : -1; // keep the leading scale away from 0
      return Math.max(s.min, Math.min(s.max, v));
    });
    return { familyIndex, coefficients };
  }

  // Set by buildControls: re-syncs the family dropdown and the slider rows to the CURRENT problem
  // (needed after "New Example", which replaces the problem behind the controls' back).
  let syncUi = null;

  function concept(p) {
    const family = FAMILY_DEFS[p.familyIndex];
    const formula = family.equationText(p.coefficients);
    return I18N.tx(
      "Bu modül; doğrusal, ikinci dereceden, üçüncü dereceden, mutlak değer, ters (1/x), üstel, logaritmik, karekök ve parçalı fonksiyon olmak üzere on fonksiyon ailesini, katsayılar için kaydırıcıları sürükleyerek (veya tam değerleri yazarak) incelememize yardımcı olur.\n" +
      "\n" +
      "Bir katsayıyı değiştirdiğimizde grafik anında yeniden çizilir; Uygula düğmesi yoktur. Kökler, y eksenini kesim noktası, tepe/dönüm noktaları ve asimptotlar var oldukları her yerde otomatik olarak işaretlenir; böylece her katsayının grafiği nasıl biçimlendirdiğini, kaydırdığını, gerdiğini veya yansıttığını görebiliriz.\n" +
      "\n" +
      "AİLELER VE ANAHTAR BİLGİLER\n" +
      "• DOĞRUSAL mx + b: m eğim, b y-kesimi; kök x = -b/m.\n" +
      "• İKİNCİ DERECE ax² + bx + c: parabol; tepe x = -b/(2a); Δ = b² - 4ac (Δ > 0 iki kök, Δ = 0 çift kök, Δ < 0 reel kök yok); a > 0 yukarı, a < 0 aşağı açılır.\n" +
      "• ÜÇÜNCÜ DERECE: en az 1, en fazla 3 reel kök; uçlar zıt yöndedir.\n" +
      "• MUTLAK DEĞER a|x - h| + k: köşe noktası (h, k).\n" +
      "• TERS a/(x - h) + k: düşey asimptot x = h, yatay asimptot y = k; tanım x ≠ h.\n" +
      "• ÜSTEL a·b^(x - h) + k: yatay asimptot y = k; b > 1 büyüme, 0 < b < 1 sönüm.\n" +
      "• LOGARİTMİK a·ln(x - h) + k: düşey asimptot x = h; tanım x > h.\n" +
      "• KAREKÖK a·√(x - h) + k: tanım x ≥ h.\n" +
      "• PARÇALI: x < 0 ve x ≥ 0 için iki doğru.\n" +
      "\n" +
      "NASIL KULLANILIR?\n" +
      "1. Önce bir aile seçilir. 2. Kaydırıcılar sürüklenir ya da değer yazılır. 3. Kök, kesim, tepe ve asimptotların nasıl hareket ettiğini birlikte gözlemleyelim. 4. Tanım ve değer kümesini grafikten okuyabiliriz.\n" +
      "\n" +
      "İPUCU: a katsayısı dikey ölçekleme/yansıtmadır; h yatay kayma (x - h; işaretin ters olduğuna dikkat edelim); k dikey kaymadır. Bu etkileri her ailede karşılaştırabiliriz (Kaydırma, Ölçekleme, Yansıtma sekmesine bakın).\n\nMevcut aile: " + familyName(family) + "\nMevcut fonksiyon: " + formula,
      "This module helps us explore ten families of functions - linear, quadratic, cubic, absolute value, reciprocal, exponential, logarithmic, square root, and piecewise - by dragging sliders (or typing exact values) for their coefficients.\n" +
      "\n" +
      "When we change a coefficient, the graph redraws instantly - there is no Apply button. Roots, the y-intercept, vertices/turning points, and asymptotes are highlighted automatically wherever they exist, so we can see how each coefficient reshapes, shifts, stretches, or reflects the graph.\n" +
      "\n" +
      "THE FAMILIES AND KEY FACTS\n" +
      "• LINEAR mx + b: m is the slope, b the y-intercept; root x = -b/m.\n" +
      "• QUADRATIC ax² + bx + c: a parabola; vertex x = -b/(2a); Δ = b² - 4ac (Δ > 0 two roots, Δ = 0 double root, Δ < 0 no real root); a > 0 opens up, a < 0 opens down.\n" +
      "• CUBIC: at least 1 and at most 3 real roots; the ends point opposite ways.\n" +
      "• ABSOLUTE VALUE a|x - h| + k: corner at (h, k).\n" +
      "• RECIPROCAL a/(x - h) + k: vertical asymptote x = h, horizontal asymptote y = k; domain x ≠ h.\n" +
      "• EXPONENTIAL a·b^(x - h) + k: horizontal asymptote y = k; b > 1 growth, 0 < b < 1 decay.\n" +
      "• LOGARITHMIC a·ln(x - h) + k: vertical asymptote x = h; domain x > h.\n" +
      "• SQUARE ROOT a·√(x - h) + k: domain x ≥ h.\n" +
      "• PIECEWISE: two lines, for x < 0 and x ≥ 0.\n" +
      "\n" +
      "HOW TO USE\n" +
      "1. Pick a family. 2. Drag the sliders or type values. 3. Let's watch how roots, intercepts, vertices and asymptotes move. 4. We can read the domain and range from the graph.\n" +
      "\n" +
      "TIP: the coefficient a is vertical scaling/reflection; h is the horizontal shift (x - h, the sign is reversed, so it is worth noticing); k is the vertical shift. We can compare these effects in every family (see the Shifting, Scaling, Reflecting tab).\n\nCurrent family: " + familyName(family) + "\nCurrent function: " + formula
    );
  }

  function solveSteps(p) {
    const family = FAMILY_DEFS[p.familyIndex];
    const coef = p.coefficients;
    const evaluator = (x) => family.evaluate(coef, x);
    const steps = [];

    steps.push(I18N.tx(`Genel form: ${family.generalForm}`, `General form: ${family.generalForm}`));
    steps.push(familyRole(family));

    const coeffList = family.sliders.map((s, i) => `${s.symbol} (${sliderName(s)}) = ${fmt2(coef[i])}`).join(',  ');
    steps.push(I18N.tx(`Katsayılar: ${coeffList}`, `Coefficients: ${coeffList}`));
    steps.push(I18N.tx(`Şu anki fonksiyon: ${family.equationText(coef)}`, `Current function: ${family.equationText(coef)}`));

    const roots = findRootsNumeric(evaluator, VIEW_X_MIN, VIEW_X_MAX);
    if (roots.length > 0) {
      const rootsText = roots.map((r) => fmt2(r)).join(', ');
      steps.push(I18N.tx(`Kökler (x eksenini kestiği noktalar): x = ${rootsText}`, `Roots (x-intercepts): x = ${rootsText}`));
    } else {
      steps.push(I18N.tx(`Görünen aralıkta [${VIEW_X_MIN}, ${VIEW_X_MAX}] kök bulunamadı.`, `No roots were found in the visible range [${VIEW_X_MIN}, ${VIEW_X_MAX}].`));
    }

    if (family.vertex) {
      const v = family.vertex(coef);
      if (v) {
        steps.push(I18N.tx(`Tepe/dönüm noktası: (${fmt2(v[0])}, ${fmt2(v[1])})`, `Vertex/turning point: (${fmt2(v[0])}, ${fmt2(v[1])})`));
      }
    }

    if (family.verticalAsymptotes) {
      const vas = family.verticalAsymptotes(coef) || [];
      if (vas.length > 0) {
        steps.push(I18N.tx(`Düşey asimptot: x = ${vas.map(fmt2).join(', ')}`, `Vertical asymptote: x = ${vas.map(fmt2).join(', ')}`));
      }
    }
    if (family.horizontalAsymptotes) {
      const has = family.horizontalAsymptotes(coef) || [];
      if (has.length > 0) {
        steps.push(I18N.tx(`Yatay asimptot: y = ${has.map(fmt2).join(', ')}`, `Horizontal asymptote: y = ${has.map(fmt2).join(', ')}`));
      }
    }

    const yAtZero = evaluator(0);
    if (Number.isFinite(yAtZero)) {
      steps.push(I18N.tx(`y eksenini kestiği nokta: (0, ${fmt2(yAtZero)})`, `y-intercept: (0, ${fmt2(yAtZero)})`));
    } else {
      steps.push(I18N.tx('x = 0 tanım kümesinde değil, bu yüzden y eksenini kestiği bir nokta yok.', 'x = 0 is not in the domain, so there is no y-intercept.'));
    }

    return steps;
  }

  function draw(canvas, p) {
    if (syncUi) syncUi();
    const family = FAMILY_DEFS[p.familyIndex];
    const coef = p.coefficients;
    const evaluator = (x) => family.evaluate(coef, x);

    canvas.setViewport(VIEW_X_MIN, VIEW_X_MAX, VIEW_Y_MIN, VIEW_Y_MAX);
    canvas.addFunction({ evaluator, color: canvas.accent(), thickness: 3 });

    // Roots (numeric, mirrors FunctionLibrary.FindRootsNumeric -> Color.LimeGreen circles).
    const roots = findRootsNumeric(evaluator, VIEW_X_MIN, VIEW_X_MAX);
    for (const root of roots) {
      canvas.addMarker({ x: root, y: 0, color: canvas.green(), shape: 'circle', radius: 6, label: `x = ${fmt2(root)}` });
    }

    // Vertex / turning point (Color.OrangeRed diamond).
    if (family.vertex) {
      const v = family.vertex(coef);
      if (v) {
        canvas.addMarker({ x: v[0], y: v[1], color: canvas.orange(), shape: 'diamond', radius: 7, label: `(${fmt2(v[0])}, ${fmt2(v[1])})` });
      }
    }

    // Asymptotes (Color.Gray guide lines).
    if (family.verticalAsymptotes) {
      for (const x of family.verticalAsymptotes(coef) || []) {
        canvas.addGuideLine({ axis: 'vertical', position: x, color: canvas.gray() });
      }
    }
    if (family.horizontalAsymptotes) {
      for (const y of family.horizontalAsymptotes(coef) || []) {
        canvas.addGuideLine({ axis: 'horizontal', position: y, color: canvas.gray() });
      }
    }

    // y-intercept, shown whenever x = 0 is in the domain (Color.Gold square).
    const yAtZero = evaluator(0);
    if (Number.isFinite(yAtZero)) {
      canvas.addMarker({ x: 0, y: yAtZero, color: canvas.gold(), shape: 'square', radius: 6, label: `(0, ${fmt2(yAtZero)})` });
    }
  }

  // ---- controls: family dropdown + up to 4 sliders that repurpose themselves per family ----
  //
  // helpers.addSlider bakes its min/max into a fixed registration at buildControls() time (called
  // once per mount), so it cannot be reused across families with different ranges. Instead we build
  // our own slider rows (same CSS classes as helpers.addSlider, for a matching look) and rebuild
  // them from scratch - up to 4 rows, one per coefficient of the currently active family - every
  // time the family dropdown changes, reading ranges from FAMILY_DEFS[getProblem().familyIndex].
  function buildControls(rightCol, getProblem, helpers) {
    const familySelect = helpers.addSelect({
      options: FAMILY_DEFS.map((f, i) => ({ label: familyName(f), value: i })),
      get: () => getProblem().familyIndex,
      set: (v) => {
        const idx = Number(v);
        const p = getProblem();
        p.familyIndex = idx;
        p.coefficients = FAMILY_DEFS[idx].sliders.map((s) => s.default);
        rebuildSliders();
        // helpers.addSelect calls helpers.refresh() itself right after this set() returns.
      },
    });

    const slidersHost = document.createElement('div');
    slidersHost.style.marginTop = '12px';
    rightCol.appendChild(slidersHost);

    function makeSliderRow(sliderDef, index) {
      const block = document.createElement('div');
      block.className = 'we-slider-block';

      const caption = document.createElement('div');
      caption.className = 'we-slider-caption';
      caption.textContent = `${sliderName(sliderDef)} (${sliderDef.symbol})`;

      const valueLabel = document.createElement('div');
      valueLabel.className = 'we-slider-value';

      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'we-slider';
      input.min = '0';
      input.max = '1000';
      input.step = '1';

      const readValue = () => getProblem().coefficients[index];
      const writeValue = (v) => { getProblem().coefficients[index] = v; };
      const syncFromModel = () => {
        const v = readValue();
        valueLabel.textContent = fmt2(v);
        const ratio = (v - sliderDef.min) / (sliderDef.max - sliderDef.min);
        input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
      };
      syncFromModel();
      rowSyncs.push(syncFromModel);

      input.addEventListener('input', () => {
        const ratio = Number(input.value) / 1000;
        const v = sliderDef.min + ratio * (sliderDef.max - sliderDef.min);
        writeValue(v);
        valueLabel.textContent = fmt2(readValue());
        helpers.refresh();
      });

      block.appendChild(caption);
      block.appendChild(valueLabel);
      block.appendChild(input);
      return block;
    }

    let rowSyncs = [];
    let builtFamily = -1;
    function rebuildSliders() {
      slidersHost.innerHTML = '';
      rowSyncs = [];
      builtFamily = getProblem().familyIndex;
      const family = FAMILY_DEFS[getProblem().familyIndex];
      family.sliders.forEach((sliderDef, i) => {
        slidersHost.appendChild(makeSliderRow(sliderDef, i));
      });
    }

    rebuildSliders();

    syncUi = () => {
      const p = getProblem();
      familySelect.select.value = String(p.familyIndex);
      if (p.familyIndex !== builtFamily) rebuildSliders();
      else rowSyncs.forEach((f) => f());
    };
  }

  Topics.register('functions', {
    id: 'functionExplorer',
    tabTitle: () => I18N.tx('Fonksiyon Gezgini', 'Function Explorer'),
    concept,
    createProblem,
    links: [
      [/^• (DOĞRUSAL|LINEAR) /, 0], [/^• (İKİNCİ DERECE|QUADRATIC) /, 1], [/^• (ÜÇÜNCÜ DERECE|CUBIC):/, 2],
      [/^• (MUTLAK DEĞER|ABSOLUTE VALUE) /, 3], [/^• (TERS|RECIPROCAL) /, 4], [/^• (ÜSTEL|EXPONENTIAL) /, 5],
      [/^• (LOGARİTMİK|LOGARITHMIC) /, 6], [/^• (KAREKÖK|SQUARE ROOT) /, 7], [/^• (PARÇALI|PIECEWISE):/, 8],
    ].map(([match, idx]) => ({ match, make: (rng) => { lastRng = rng; return randomFamily(rng, idx); } })),
    solveSteps,
    draw,
    focus: (p) => {
      const fam = FAMILY_DEFS[p.familyIndex];
      const v = fam.vertex ? fam.vertex(p.coefficients) : null;
      if (v && Number.isFinite(v[0]) && Number.isFinite(v[1])) return { x: v[0], y: v[1] };
      const y0 = fam.evaluate(p.coefficients, 0);
      return Number.isFinite(y0) ? { x: 0, y: y0 } : null;
    },
    buildControls,
  });
})();
