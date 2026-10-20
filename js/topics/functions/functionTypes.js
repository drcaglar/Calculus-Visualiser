// Ported from Modules/Functions/FnTabs2.vb - FunctionTypesControl ("4) Fonksiyon Çeşitleri").
(function () {
  const N2 = fmt2; // mirrors VB N2 (":0.##")
  function sg(v) { // mirrors VB Sg: "+ 3" / "- 3"
    return v >= 0 ? `+ ${N2(v)}` : `- ${N2(Math.abs(v))}`;
  }

  function createProblem(rng) {
    return { kind: rng.nextInt(0, 9), p: rng.nextInt(-3, 4), q: rng.nextInt(-3, 4) };
  }

  function base2(p) { return Math.abs(p.p) + 2; }
  function rootIndex(p) { return Math.max(2, Math.min(4, Math.abs(p.q))); }

  function F(p, x) {
    const y = F0(p, x);
    return Number.isNaN(y) || Number.isFinite(y) ? y : NaN; // poles are gaps, never Infinity
  }

  function F0(p, x) {
    switch (p.kind) {
      case 0: return p.p * x + p.q;
      case 1: return Math.pow(x, p.p);
      case 2:
        if (x < 0) return NaN;
        return Math.pow(x, 1.0 / rootIndex(p));
      case 3: return x * x * x + p.p * x + p.q;
      case 4: return (x + p.p) / (x - p.q);
      case 5: return Math.sqrt(x * x + p.p * p.p + 1);
      case 6: return p.p * Math.sin(x) + p.q;
      case 7: return Math.pow(base2(p), x);
      default:
        if (x <= 0) return NaN;
        return Math.log(x) / Math.log(base2(p));
    }
  }

  function formula(p) {
    switch (p.kind) {
      case 0: return `f(x) = ${p.p}x ${sg(p.q)}`;
      case 1: return `f(x) = x^${p.p}`;
      case 2: return `f(x) = x^(1/${rootIndex(p)})`;
      case 3: return `f(x) = x³ ${sg(p.p)}x ${sg(p.q)}`;
      case 4: return `f(x) = (x ${sg(p.p)}) / (x ${sg(-p.q)})`;
      case 5: return `f(x) = √(x² + ${p.p * p.p + 1})`;
      case 6: return `f(x) = ${p.p} sin x ${sg(p.q)}`;
      case 7: return `f(x) = ${N2(base2(p))}^x`;
      default: return `f(x) = log_${N2(base2(p))}(x)`;
    }
  }

  function category(p) {
    switch (p.kind) {
      case 0:
        return p.p === 0
          ? I18N.tx('Lineer (m = 0 → SABİT fonksiyon)', 'Linear (m = 0 → CONSTANT function)')
          : I18N.tx('LİNEER fonksiyon', 'LINEAR function');
      case 1:
        return p.p >= 0
          ? I18N.tx('KUVVET fonksiyonu (pozitif tam sayı üs) - aynı zamanda bir polinom', 'POWER function (positive integer exponent) - also a polynomial')
          : I18N.tx('KUVVET fonksiyonu (negatif tam sayı üs) - rasyonel bir fonksiyon (1/xⁿ)', 'POWER function (negative integer exponent) - a rational function (1/xⁿ)');
      case 2:
        return I18N.tx('KUVVET fonksiyonu (rasyonel üs = kök) - cebirsel', 'POWER function (rational exponent = root) - algebraic');
      case 3:
        return I18N.tx('POLİNOM (3. derece)', 'POLYNOMIAL (degree 3)');
      case 4:
        return I18N.tx('RASYONEL fonksiyon (iki polinomun oranı)', 'RATIONAL function (quotient of two polynomials)');
      case 5:
        return I18N.tx('CEBİRSEL fonksiyon (polinomun karekökü)', 'ALGEBRAIC function (root of a polynomial)');
      case 6:
        return I18N.tx('TRANSANDANT: trigonometrik fonksiyon', 'TRANSCENDENTAL: trigonometric function');
      case 7:
        return I18N.tx('TRANSANDANT: üstel fonksiyon (değişken üsse)', 'TRANSCENDENTAL: exponential function (variable in the exponent)');
      default:
        return I18N.tx('TRANSANDANT: logaritmik fonksiyon', 'TRANSCENDENTAL: logarithmic function');
    }
  }

  function reason(p) {
    switch (p.kind) {
      case 0: return I18N.tx('x\'in derecesi 1 olduğundan grafik bir doğrudur; eğimi m, y-kesimi b olur.', 'x has degree 1: the graph is a line with slope m and y-intercept b.');
      case 1: return I18N.tx('Değişken tabanda, üs sabit: xᵃ biçimi.', 'The variable is in the base and the exponent is constant: the form xᵃ.');
      case 2: return I18N.tx('x^(1/n) = n. dereceden kök: tanım kümesi (n çift ise) x ≥ 0.', 'x^(1/n) is an nth root: domain x ≥ 0 (for even n).');
      case 3: return I18N.tx('Yalnızca x\'in tam sayı kuvvetleri ve sabit katsayılar bulunur: polinom.', 'Only whole-number powers of x with constant coefficients: a polynomial.');
      case 4: return I18N.tx('Pay ve payda polinom: p(x)/q(x). Payda sıfır olan yerde dikey asimptot olabilir.', 'Numerator and denominator are polynomials: p(x)/q(x). A vertical asymptote may occur where the denominator is 0.');
      case 5: return I18N.tx('Polinomlar ve kök alma ile elde edilir: cebirsel, ama polinom veya rasyonel değil.', 'Built from polynomials and a root: algebraic, but neither a polynomial nor rational.');
      case 6: return I18N.tx('sin x periyodik: cebirsel işlemlerle yazılamaz → transandant.', 'sin x is periodic: it cannot be written with algebraic operations → transcendental.');
      case 7: return I18N.tx('Değişken üste: aˣ. Her zaman pozitiftir; a > 1 için artandır.', 'The variable is in the exponent: aˣ. Always positive, increasing for a > 1.');
      default: return I18N.tx('logₐ x, aˣ\'in tersi: yalnızca x > 0 için tanımlı.', 'logₐ x is the inverse of aˣ: defined only for x > 0.');
    }
  }

  function solveSteps(p) {
    const dom = FnKit.domainText((x) => F(p, x));
    return [
      I18N.tx(`Verilen fonksiyon: ${formula(p)}`, `Given function: ${formula(p)}`),
      I18N.tx(`Önce değişkenin nasıl kullanıldığına bakalım: ${reason(p)}`, `Let's look at how the variable is used: ${reason(p)}`),
      I18N.tx(`SINIF: ${category(p)}`, `CLASS: ${category(p)}`),
      I18N.tx(`Doğal tanım kümesi: ${dom}`, `Natural domain: ${dom}`),
    ];
  }

  function draw(canvas, p) {
    canvas.setViewport(-6, 6, -6, 6);
    canvas.addFunction({ evaluator: (x) => F(p, x), color: canvas.accent(), thickness: 3 });
    if (p.kind === 4) {
      canvas.addGuideLine({ axis: 'vertical', position: p.q, color: canvas.gray() });
    }
  }

  Topics.register('functions', {
    id: 'functionTypes',
    problemStatement: (p) => I18N.tx(
      `${formula(p)} fonksiyonu hangi sınıfa girer (lineer, kuvvet, polinom, rasyonel, cebirsel, transandant)? Nedenini birlikte açıklayıp doğal tanım kümesini de bulalım.`,
      `Which class does ${formula(p)} belong to (linear, power, polynomial, rational, algebraic, transcendental)? Let's explain why and find its natural domain.`),
    tabTitle: () => I18N.tx('Fonksiyon Çeşitleri', 'Types of Functions'),
    concept: () => I18N.tx(
      "TEMEL FONKSİYON AİLELERİ\n" +
      "1. LİNEER f(x) = mx + b: m eğim (Δy/Δx), b y-kesimi. m = 0 ise sabit fonksiyondur. Tanım kümesi ℝ; m ≠ 0 için değer kümesi de ℝ.\n" +
      "2. KUVVET f(x) = xᵃ: x tabanda, üs sabit. a = 2 parabol, a = 3 kübik, a = 1/2 karekök (x ≥ 0), a = -1 hiperbol 1/x (x ≠ 0).\n" +
      "3. POLİNOM aₙxⁿ + … + a₁x + a₀ (aₙ ≠ 0, n = DERECE). Tanım kümesi ℝ; en fazla n kök. Çift derece: iki uç aynı yöne gider; tek derece: zıt yöne (baş katsayının işaretine bağlı).\n" +
      "4. RASYONEL p(x)/q(x): tanım kümesi q(x) ≠ 0. q(x) = 0 olan ve sadeleşmeyen noktalar düşey asimptottur. Yatay asimptot: der p < der q → y = 0; der p = der q → y = baş katsayıların oranı; der p = der q + 1 → eğik asimptot; daha büyükse yok.\n" +
      "5. CEBİRSEL: polinomlardan toplama, çıkarma, çarpma, bölme ve kök almayla elde edilen her fonksiyon (√(x² + 1) gibi).\n" +
      "6. TRANSANDANT: cebirsel olmayanlar.\n" +
      "   – ÜSTEL aˣ (a > 0, a ≠ 1): tanım ℝ, değer (0, ∞). Burada x ÜSTTE.\n" +
      "   – LOGARİTMİK logₐ x: tanım (0, ∞), değer ℝ; aˣ'in tersidir.\n" +
      "   – TRİGONOMETRİK sin, cos, tan, ...: periyodiktir.\n" +
      "\n" +
      "SINIFLANDIRMA YÖNTEMİ\n" +
      "1. x nerede duruyor? Tabanda (xⁿ) → kuvvet/polinom/cebirsel. Üstte (2ˣ) → üstel.\n" +
      "2. Paydada x var mı? → rasyonel.\n" +
      "3. Kök var mı? → cebirsel (polinom/rasyonel değilse).\n" +
      "4. sin, cos, ln ya da eˣ varsa → transandant.\n" +
      "\n" +
      "MİNİ ÖRNEK\n" +
      "x³ - 2x + 1 → polinom (derece 3).  (x² + 1)/(x - 2) → rasyonel (x ≠ 2).  √x + x → cebirsel.  3ˣ → üstel.  x³ ile 3ˣ aynı değildir: biri kuvvet, diğeri üsteldir.\n" +
      "\n" +
      "DİKKAT\n" +
      "• 2ˣ ile x² farklı sınıflardır; taban ve üsse bakmak işimizi kolaylaştırır.\n" +
      "• eˣ'in Taylor serisi sonsuz bir toplamdır; bu onu polinom yapmaz.\n" +
      "• Örnekte P ve Q kaydırıcıları formüldeki sayıları değiştirir; sınıf aynı kalır.",
      "THE MAIN FUNCTION FAMILIES\n" +
      "1. LINEAR f(x) = mx + b: m is the slope (Δy/Δx), b the y-intercept. If m = 0 it is a constant function. Domain ℝ; for m ≠ 0 the range is ℝ too.\n" +
      "2. POWER f(x) = xᵃ: x in the base, a constant exponent. a = 2 parabola, a = 3 cubic, a = 1/2 square root (x ≥ 0), a = -1 hyperbola 1/x (x ≠ 0).\n" +
      "3. POLYNOMIAL aₙxⁿ + … + a₁x + a₀ (aₙ ≠ 0, n = DEGREE). Domain ℝ; at most n roots. Even degree: both ends go the same way; odd degree: opposite ways (set by the sign of the leading coefficient).\n" +
      "4. RATIONAL p(x)/q(x): domain q(x) ≠ 0. Zeros of q that do not cancel are vertical asymptotes. Horizontal asymptote: deg p < deg q → y = 0; deg p = deg q → y = ratio of leading coefficients; deg p = deg q + 1 → oblique asymptote; larger → none.\n" +
      "5. ALGEBRAIC: anything built from polynomials by adding, subtracting, multiplying, dividing and taking roots (like √(x² + 1)).\n" +
      "6. TRANSCENDENTAL: everything non-algebraic.\n" +
      "   – EXPONENTIAL aˣ (a > 0, a ≠ 1): domain ℝ, range (0, ∞). Here x is in the EXPONENT.\n" +
      "   – LOGARITHMIC logₐ x: domain (0, ∞), range ℝ; the inverse of aˣ.\n" +
      "   – TRIGONOMETRIC sin, cos, tan, ...: periodic.\n" +
      "\n" +
      "CLASSIFICATION METHOD\n" +
      "1. Where is x? In the base (xⁿ) → power/polynomial/algebraic. In the exponent (2ˣ) → exponential.\n" +
      "2. Is there a division by something containing x? → rational.\n" +
      "3. Is there a root? → algebraic (if not polynomial/rational).\n" +
      "4. If sin, cos, ln or eˣ appear → transcendental.\n" +
      "\n" +
      "MINI EXAMPLE\n" +
      "x³ - 2x + 1 → polynomial (degree 3).  (x² + 1)/(x - 2) → rational (x ≠ 2).  √x + x → algebraic.  3ˣ → exponential.  x³ and 3ˣ are not the same kind: one is a power, the other exponential.\n" +
      "\n" +
      "PITFALLS\n" +
      "• 2ˣ and x² are different classes; it helps to look at the base and the exponent.\n" +
      "• The Taylor series of eˣ is an infinite sum; that does not make it a polynomial.\n" +
      "• In the example the P and Q sliders change the numbers in the formula; the class stays the same."
    ),
    createProblem,
    links: [
      [/^1\. (LİNEER|LINEAR) /, [0]], [/^2\. (KUVVET|POWER) /, [1, 2]], [/^3\. (POLİNOM|POLYNOMIAL) /, [3]],
      [/^4\. (RASYONEL|RATIONAL) /, [4]], [/^5\. (CEBİRSEL|ALGEBRAIC):/, [5]], [/^6\. (TRANSANDANT|TRANSCENDENTAL):/, [6, 7, 8]],
      [/^\s*– (ÜSTEL|EXPONENTIAL) /, [7]], [/^\s*– (LOGARİTMİK|LOGARITHMIC) /, [8]], [/^\s*– (TRİGONOMETRİK|TRIGONOMETRIC) /, [6]],
    ].map(([match, kinds]) => ({ match, make: (rng) => FnKit.until(createProblem, rng, (p) => kinds.includes(p.kind)) })),
    solveSteps,
    draw,
    focus: (p) => ({ x: p.kind === 4 ? p.q : 0, y: 0 }),
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({
        caption: I18N.tx('P (formüldeki ilk sayı)', 'P (first number in the formula)'),
        min: -4, max: 4,
        get: () => getProblem().p,
        set: (v) => { getProblem().p = Math.round(v); },
      });
      h.addSlider({
        caption: I18N.tx('Q (formüldeki ikinci sayı)', 'Q (second number in the formula)'),
        min: -4, max: 4,
        get: () => getProblem().q,
        set: (v) => { getProblem().q = Math.round(v); },
      });
    },
  });
})();
