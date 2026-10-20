// Ported from Modules/Preliminaries/QuizBankPart1.vb - QuizBankFunctions module only (the FxXxx
// generators). QuizBankTrig and QuizBankLimits in the same .vb file belong to a different chapter
// and are not ported here. Local helpers below mirror the subset of the shared QuizKit module
// (NonZero, PolyStr, Sup, IPow) actually used by the Functions generators, plus QuizBank.vb's
// Plus/XTerm helpers used throughout QuizBankFunctions.
(function () {
  // ---------- local helpers (mirror QuizKit / QuizBank.vb) ----------

  // Mirrors QuizKit.NonZero: rng.Next(lo, hi + 1) while v = 0 (inclusive range [lo, hi]).
  function nonZero(rng, lo, hi) {
    let v;
    do {
      v = rng.nextInt(lo, hi + 1);
    } while (v === 0);
    return v;
  }

  // Mirrors QuizKit.Sup: superscript digit, or "^n" fallback.
  function sup(n) {
    const s = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    return n >= 0 && n <= 9 ? s[n] : '^' + n;
  }

  // Mirrors QuizKit.IPow: integer power via repeated multiplication.
  function ipow(b, e) {
    let r = 1;
    for (let i = 1; i <= e; i++) r *= b;
    return r;
  }

  // Mirrors QuizKit.PolyStr: coefficients listed lowest degree first, e.g. polyStr(5,-2,3) = "3x² - 2x + 5".
  function polyStr(...c) {
    let out = '';
    for (let d = c.length - 1; d >= 0; d--) {
      const v = c[d];
      if (v === 0) continue;
      const mag = Math.abs(v);
      let body;
      if (d === 0) {
        body = String(mag);
      } else {
        const x = d === 1 ? 'x' : 'x' + sup(d);
        body = mag === 1 ? x : mag + x;
      }
      if (out.length === 0) {
        out += (v < 0 ? '-' : '') + body;
      } else {
        out += (v < 0 ? ' - ' : ' + ') + body;
      }
    }
    return out.length === 0 ? '0' : out;
  }

  // Mirrors QuizBank.vb Plus: "+ n" / "- |n|".
  function plus(n) {
    return n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`;
  }

  // Mirrors QuizBank.vb XTerm: "x" for h=0, else "(x - h)" / "(x + |h|)".
  function xTerm(h) {
    if (h === 0) return 'x';
    return h > 0 ? `(x - ${h})` : `(x + ${-h})`;
  }

  // Mirrors QuizBank.vb IntWrongNotes: specific notes (parallel to intWrongs' specific values)
  // followed by six generic "off by a little" notes matching the correct±1..3 filler values.
  function intWrongNotes(...specificNotes) {
    return [
      ...specificNotes,
      I18N.tx('Doğru sonuçtan 1 fazla: son adımda küçük bir toplama/çıkarma hatası.', 'One more than the correct result: a small addition/subtraction slip in the last step.'),
      I18N.tx('Doğru sonuçtan 1 eksik: son adımda küçük bir toplama/çıkarma hatası.', 'One less than the correct result: a small addition/subtraction slip in the last step.'),
      I18N.tx('Doğru sonuçtan 2 fazla: bir terimi yanlış hesaplamış olabilirsin.', 'Two more than the correct result: one term may have been computed wrongly.'),
      I18N.tx('Doğru sonuçtan 2 eksik: bir terimi yanlış hesaplamış olabilirsin.', 'Two less than the correct result: one term may have been computed wrongly.'),
      I18N.tx('Doğru sonuçtan 3 fazla: birkaç adımda hata birikmiş olabilir.', 'Three more than the correct result: errors may have piled up over several steps.'),
      I18N.tx('Doğru sonuçtan 3 eksik: birkaç adımda hata birikmiş olabilir.', 'Three less than the correct result: errors may have piled up over several steps.'),
    ];
  }

  // ---------- generators ----------

  function fxEval(rng) {
    const a = nonZero(rng, -4, 4), b = rng.nextInt(-6, 7), k = rng.nextInt(-4, 5);
    const ans = a * k + b;
    return makeQuestion(
      I18N.tx('Fonksiyon değeri', 'Function value'),
      I18N.tx(`f(x) = ${polyStr(b, a)} ise f(${k}) kaçtır?`, `If f(x) = ${polyStr(b, a)}, what is f(${k})?`),
      String(ans),
      intWrongs(ans, a * k - b, a + b + k, -ans),
      [
        I18N.tx(`x yerine ${k} yaz: f(${k}) = ${a}·(${k}) + (${b})`, `Substitute x = ${k}: f(${k}) = ${a}·(${k}) + (${b})`),
        `= ${a * k} + (${b}) = ${ans}`,
      ],
      rng,
      intWrongNotes(
        I18N.tx('Sabit terimi eklemek yerine çıkarıp a·k - b hesaplamış olabilirsin.', 'You may have computed a·k - b, subtracting the constant instead of adding it.'),
        I18N.tx("a, b ve k'yi toplamışsın; f(x) = ax + b'de a, x ile çarpılır.", 'You added a, b and k instead of multiplying a by k; in ax + b the slope multiplies x.'),
        I18N.tx('Sonucun işaretini ters çevirmişsin; her çarpımın işaretini yeniden kontrol et.', 'You flipped the sign of the final value; recheck the sign of each product.')
      )
    );
  }

  function fxComp(rng) {
    const c = rng.nextInt(-4, 5), a = nonZero(rng, -3, 3), b = rng.nextInt(-4, 5), k = rng.nextInt(-3, 4);
    const inner = a * k + b;
    const ans = inner * inner + c;
    return makeQuestion(
      I18N.tx('Bileşke fonksiyon', 'Composite function'),
      I18N.tx(`f(x) = ${polyStr(c, 0, 1)} ve g(x) = ${polyStr(b, a)} ise (f∘g)(${k}) kaçtır?`, `If f(x) = ${polyStr(c, 0, 1)} and g(x) = ${polyStr(b, a)}, what is (f∘g)(${k})?`),
      String(ans),
      intWrongs(ans, a * (k * k + c) + b, (k * k + c) + (a * k + b), (k * k + c) * (a * k + b)),
      [
        I18N.tx("(f∘g)(x) = f(g(x)): önce içteki g'yi hesapla.", '(f∘g)(x) = f(g(x)): evaluate the inner g first.'),
        `g(${k}) = ${inner}`,
        `f(${inner}) = ${inner}² + (${c}) = ${ans}`,
      ],
      rng,
      intWrongNotes(
        I18N.tx('Sırayı ters uygulamışsın: önce f sonra g; oysa (f∘g)(x) = f(g(x)) önce g\'yi uygular.', 'You applied f first and then g; but (f∘g)(x) = f(g(x)) applies g first.'),
        I18N.tx('f ve g değerlerini ayrı ayrı hesaplayıp toplamışsın; bileşke iç içe yerleştirmedir.', 'You computed f and g separately and added them; composition means substituting one into the other.'),
        I18N.tx('f ve g değerlerini ayrı ayrı hesaplayıp çarpmışsın; bileşke iç içe yerleştirmedir.', 'You computed f and g separately and multiplied them; composition means substituting one into the other.')
      )
    );
  }

  function fxDomSqrt(rng) {
    const a = nonZero(rng, -6, 6);
    return makeQuestion(
      I18N.tx('Tanım kümesi', 'Domain'),
      I18N.tx(`f(x) = √(x ${plus(-a)}) fonksiyonunun tanım kümesi hangisidir?`, `Which is the domain of f(x) = √(x ${plus(-a)})?`),
      `x ≥ ${a}`,
      [`x > ${a}`, `x ≤ ${a}`, `x ≥ ${-a}`, I18N.tx('Tüm reel sayılar', 'All real numbers')],
      [
        I18N.tx('Karekökün içi negatif olamaz.', 'The radicand cannot be negative.'),
        `x ${plus(-a)} ≥ 0`,
        `x ≥ ${a}`,
      ],
      rng,
      [
        I18N.tx('Kökün içi 0 olabilir; eşitliği dışarıda bırakmışsın.', 'The radicand may equal 0; you excluded the boundary point.'),
        I18N.tx('Eşitsizliğin yönünü ters yazmışsın; kökün içi negatif değil, sıfır ya da pozitif olmalı.', 'You reversed the inequality; the radicand must be zero or positive, not negative.'),
        I18N.tx('Sabit terimi karşı tarafa geçirirken işareti değiştirmeyi unutmuşsın.', 'You forgot to change the sign when moving the constant to the other side.'),
        I18N.tx('Kökün içi negatif olamayacağı için tüm reel sayılar mümkün değildir.', 'A square root restricts x, since the radicand cannot be negative; not all reals work.'),
      ]
    );
  }

  function fxDomRat(rng) {
    const a = nonZero(rng, -6, 6);
    return makeQuestion(
      I18N.tx('Tanım kümesi', 'Domain'),
      I18N.tx(`f(x) = 1/(x ${plus(-a)}) fonksiyonunun tanım kümesi hangisidir?`, `Which is the domain of f(x) = 1/(x ${plus(-a)})?`),
      `x ≠ ${a}`,
      [`x > ${a}`, `x = ${a}`, `x ≠ ${-a}`, I18N.tx('Tüm reel sayılar', 'All real numbers')],
      [
        I18N.tx('Payda sıfır olamaz.', 'The denominator cannot be zero.'),
        `x ${plus(-a)} ≠ 0  →  x ≠ ${a}`,
      ],
      rng,
      [
        I18N.tx('Yalnızca paydayı sıfır yapan nokta çıkarılır; sen bir yarım doğruyu dışarıda bırakmışsın.', 'Only the point making the denominator zero is excluded; you cut out a whole half-line.'),
        I18N.tx("Bu, yalnızca yasaklı noktanın kendisidir; o nokta dışındaki her x'e izin verilir.", 'This is the forbidden point itself; every x except that point is allowed.'),
        I18N.tx('Paydayı sıfıra eşitlerken işareti kaybetmişsin; x - a = 0 iken x = a çıkar.', 'You lost a sign solving denominator = 0; the excluded value comes from setting x - a = 0.'),
        I18N.tx('Payda bir noktada sıfır olabildiği için tüm reel sayılar tanım kümesinde değildir.', 'The denominator vanishes at one point, so not all real numbers are in the domain.'),
      ]
    );
  }

  function fxEvenOdd(rng) {
    const c = nonZero(rng, -5, 5), p = nonZero(rng, -4, 4);
    if (rng.nextInt(0, 2) === 0) {
      return makeQuestion(
        I18N.tx('Çift / tek fonksiyon', 'Even / odd function'),
        I18N.tx('Aşağıdakilerden hangisi ÇİFT fonksiyondur?', 'Which of the following is an EVEN function?'),
        `f(x) = ${polyStr(c, 0, 0, 0, 1)}`,
        [`f(x) = ${polyStr(0, p, 0, 1)}`, `f(x) = ${polyStr(c, 1)}`, `f(x) = ${polyStr(0, 1, 1)}`],
        [
          I18N.tx('Çift: f(-x) = f(x) (y eksenine göre simetrik).', 'Even: f(-x) = f(x) (symmetric about the y-axis).'),
          I18N.tx('Yalnızca çift kuvvetli terimler (ve sabit) içeren fonksiyon çifttir.', 'A function with only even-power terms (and a constant) is even.'),
        ],
        rng,
        [
          I18N.tx('Yalnızca tek kuvvetli terimler içerir: bu bir tek fonksiyondur, çift değil.', 'It has only odd powers: this is an odd function, not an even one.'),
          I18N.tx('Hem çift hem tek kuvvetli terim içerir; f(-x) ne f(x) ne -f(x) olur.', 'It mixes even and odd powers; f(-x) is neither f(x) nor -f(x).'),
          I18N.tx('Hem çift hem tek kuvvetli terim içerir; f(-x) ne f(x) ne -f(x) olur.', 'It mixes even and odd powers; f(-x) is neither f(x) nor -f(x).'),
        ]
      );
    }
    return makeQuestion(
      I18N.tx('Çift / tek fonksiyon', 'Even / odd function'),
      I18N.tx('Aşağıdakilerden hangisi TEK fonksiyondur?', 'Which of the following is an ODD function?'),
      `f(x) = ${polyStr(0, p, 0, 1)}`,
      [`f(x) = ${polyStr(c, 0, 1)}`, `f(x) = ${polyStr(c, 0, 0, 1)}`, `f(x) = ${polyStr(c, 1)}`],
      [
        I18N.tx('Tek: f(-x) = -f(x) (orijine göre simetrik).', 'Odd: f(-x) = -f(x) (symmetric about the origin).'),
        I18N.tx('Yalnızca tek kuvvetli terimler içeren fonksiyon tektir (sabit terim olmamalı).', 'A function with only odd-power terms is odd (no constant term).'),
      ],
      rng,
      [
        I18N.tx('Yalnızca çift kuvvetli terimler içerir: f(-x) = f(x), yani çift fonksiyon; tek değil.', 'It has only even powers: f(-x) = f(x), so it is even, not odd.'),
        I18N.tx('Sabit terim ve tek kuvvet birlikte olduğundan f(-x) ne f(x) ne -f(x) olur.', 'With a constant and an odd power together, f(-x) is neither f(x) nor -f(x).'),
        I18N.tx('Sabit terim ve tek kuvvet birlikte olduğundan f(-x) ne f(x) ne -f(x) olur.', 'With a constant and an odd power together, f(-x) is neither f(x) nor -f(x).'),
      ]
    );
  }

  function fxInverse(rng) {
    const a = nonZero(rng, -4, 4), b = rng.nextInt(-6, 7), x0 = rng.nextInt(-4, 5);
    const k = a * x0 + b;
    return makeQuestion(
      I18N.tx('Ters fonksiyon', 'Inverse function'),
      I18N.tx(`f(x) = ${polyStr(b, a)} ise f⁻¹(${k}) kaçtır?`, `If f(x) = ${polyStr(b, a)}, what is f⁻¹(${k})?`),
      String(x0),
      intWrongs(x0, k - b, -x0, k + b),
      [
        I18N.tx(`f⁻¹(${k}) = t demek f(t) = ${k} demektir.`, `f⁻¹(${k}) = t means f(t) = ${k}.`),
        `${a}t ${plus(b)} = ${k}  →  t = ${x0}`,
      ],
      rng,
      intWrongNotes(
        I18N.tx("Sabiti çıkarıp a'ya bölmeyi unutmuşsun; ax + b = k'de x = (k - b)/a olur.", 'You subtracted the constant but forgot to divide by a; in ax + b = k, x = (k - b)/a.'),
        I18N.tx('Sonucun işaretini değiştirmişsin; f⁻¹(k), f(x) = k denklemini çözer, işaret çevirmez.', 'You negated the value; f⁻¹(k) solves f(x) = k, it does not flip a sign.'),
        I18N.tx("Sabiti çıkarmak yerine eklemişsin ve a'ya bölmemişsin.", 'You added the constant instead of subtracting it, and also did not divide by a.')
      )
    );
  }

  function fxVertex(rng) {
    const h = nonZero(rng, -5, 5), c = rng.nextInt(-6, 7);
    const ans = c - h * h;
    return makeQuestion(
      I18N.tx('Parabol: en küçük değer', 'Parabola: minimum value'),
      I18N.tx(`f(x) = ${polyStr(c, -2 * h, 1)} fonksiyonunun en küçük değeri kaçtır?`, `What is the minimum value of f(x) = ${polyStr(c, -2 * h, 1)}?`),
      String(ans),
      intWrongs(ans, c, h, -h * h),
      [
        I18N.tx(`Tepe noktası x = -b/(2a) = ${h}`, `Vertex at x = -b/(2a) = ${h}`),
        `f(${h}) = ${h * h} - ${2 * h * h} + (${c}) = ${ans}`,
      ],
      rng,
      intWrongNotes(
        I18N.tx("Sabit terimi en küçük değer sanmışsın; bu f(0)'dır, tepe değeri değil.", 'You took the constant term as the minimum; that is f(0), not the vertex value.'),
        I18N.tx('Tepe noktasının x koordinatını vermişsin; en küçük değer y koordinatıdır.', 'You gave the vertex x-coordinate; the minimum value is the y-coordinate.'),
        I18N.tx('Yalnızca -h² terimini almışsın; sabit terimi eklemeyi unutmuşsun.', 'You kept only the -h² part and forgot to add the constant term.')
      )
    );
  }

  function fxShift(rng) {
    const h = nonZero(rng, -4, 4), k = nonZero(rng, -4, 4);
    const hs = h > 0 ? I18N.tx(`${h} birim sağa`, `${h} units right`) : I18N.tx(`${-h} birim sola`, `${-h} units left`);
    const vs = k > 0 ? I18N.tx(`${k} birim yukarı`, `${k} units up`) : I18N.tx(`${-k} birim aşağı`, `${-k} units down`);
    const hf = h > 0 ? I18N.tx(`${h} birim sola`, `${h} units left`) : I18N.tx(`${-h} birim sağa`, `${-h} units right`);
    const vf = k > 0 ? I18N.tx(`${k} birim aşağı`, `${k} units down`) : I18N.tx(`${-k} birim yukarı`, `${-k} units up`);
    return makeQuestion(
      I18N.tx('Grafik kaydırma', 'Graph shifts'),
      I18N.tx(`y = f(x ${plus(-h)}) ${plus(k)} grafiği, y = f(x) grafiğinin nasıl kaydırılmışıdır?`, `The graph of y = f(x ${plus(-h)}) ${plus(k)} is the graph of y = f(x) shifted how?`),
      `${hs}, ${vs}`,
      [`${hf}, ${vs}`, `${hs}, ${vf}`, `${hf}, ${vf}`],
      [
        I18N.tx('f(x - h): yatay kayma, işaret TERS (h>0 ise sağa).', 'f(x - h): horizontal shift, sign is REVERSED (right if h>0).'),
        I18N.tx('+k: dikey kayma, işaret AYNI (k>0 ise yukarı).', '+k: vertical shift, sign is the SAME (up if k>0).'),
      ],
      rng,
      [
        I18N.tx('Yatay kaymanın yönünü ters okumuşsun: x - h sağa, x + h sola kaydırır.', 'You read the horizontal shift with the wrong sign: x - h moves right, x + h moves left.'),
        I18N.tx('Dikey kaymanın yönü ters: + k yukarı, - k aşağı kaydırır.', 'The vertical direction is reversed: + k moves up, - k moves down.'),
        I18N.tx('Hem yatay hem dikey kaymanın yönünü ters almışsın.', 'You reversed both the horizontal and the vertical direction.'),
      ],
      { xMin: -6, xMax: 6, yMin: -3, yMax: 9, curves: [{ f: (x) => 0.5 * x * x }] }
    );
  }

  function fxRoots(rng) {
    const r1 = rng.nextInt(-5, 4);
    const r2 = r1 + rng.nextInt(1, 6);
    const s = r1 + r2, p = r1 * r2;
    return makeQuestion(
      I18N.tx('Kökler', 'Roots'),
      I18N.tx(`${polyStr(p, -s, 1)} = 0 denkleminin büyük kökü kaçtır?`, `What is the larger root of ${polyStr(p, -s, 1)} = 0?`),
      String(r2),
      intWrongs(r2, r1, s, p),
      [
        I18N.tx(`Toplamları ${s}, çarpımları ${p} olan iki sayı ara.`, `Find two numbers with sum ${s} and product ${p}.`),
        `(${xTerm(r1)})(${xTerm(r2)}) = 0`,
        I18N.tx(`Kökler ${r1} ve ${r2}; büyüğü ${r2}.`, `The roots are ${r1} and ${r2}; the larger is ${r2}.`),
      ],
      rng,
      intWrongNotes(
        I18N.tx('Küçük kökü vermişsin; soru büyük kökü soruyor.', 'You gave the smaller root; the question asks for the larger one.'),
        I18N.tx('Köklerin toplamını (-b/a) kök sanmışsın; toplam kökün kendisi değildir.', 'You gave the sum of the roots; the sum is not itself a root.'),
        I18N.tx('Köklerin çarpımını (c/a) kök sanmışsın; çarpım kökün kendisi değildir.', 'You gave the product of the roots; the product is not itself a root.')
      )
    );
  }

  function fxPiece(rng) {
    const p = rng.nextInt(-3, 4), a = rng.nextInt(1, 5), b = rng.nextInt(1, 5);
    const ans = -a + p + b * b;
    return makeQuestion(
      I18N.tx('Parçalı fonksiyon', 'Piecewise function'),
      I18N.tx(`f(x) = { x ${plus(p)}, x < 0 ;  x², x ≥ 0 }  ise f(${-a}) + f(${b}) kaçtır?`, `If f(x) = { x ${plus(p)}, x < 0 ;  x², x ≥ 0 }, what is f(${-a}) + f(${b})?`),
      String(ans),
      intWrongs(ans, a + p + b * b, -a + p + b, -a + b * b),
      [
        I18N.tx(`${-a} < 0 olduğundan f(${-a}) = ${-a} ${plus(p)} = ${-a + p}`, `Since ${-a} < 0, f(${-a}) = ${-a} ${plus(p)} = ${-a + p}`),
        I18N.tx(`${b} ≥ 0 olduğundan f(${b}) = ${b * b}`, `Since ${b} ≥ 0, f(${b}) = ${b * b}`),
        I18N.tx(`Toplam = ${ans}`, `Sum = ${ans}`),
      ],
      rng,
      intWrongNotes(
        I18N.tx("f(-a)'da -a yerine pozitif a yazmışsın; x negatif olduğundan işareti korumalısın.", 'In f(-a) you substituted a positive a; the negative sign of the input must be kept.'),
        I18N.tx("f(b) için x² yerine x kullanmışsın; x ≥ 0 için kural x²'dir.", 'For f(b) you used x instead of x²; for x ≥ 0 the rule is x².'),
        I18N.tx('Birinci parçadaki sabit terimi unutmuşsun; f(-a) = -a + p olmalı.', 'You dropped the constant in the first piece; f(-a) must include the added term p.')
      ),
      {
        xMin: -5, xMax: 5, yMin: -8, yMax: 16,
        curves: [
          { f: (x) => (x < 0 ? x + p : NaN) },
          { f: (x) => (x >= 0 ? x * x : NaN) },
        ],
        points: [
          { x: 0, y: p, label: '', hollow: true },
          { x: 0, y: 0, label: '', hollow: false },
        ],
      }
    );
  }

  function fxExp(rng) {
    const a = nonZero(rng, -3, 4), k = rng.nextInt(0, 5);
    const ans = a * ipow(2, k);
    return makeQuestion(
      I18N.tx('Üstel fonksiyon', 'Exponential function'),
      I18N.tx(`f(x) = ${a}·2^x ise f(${k}) kaçtır?`, `If f(x) = ${a}·2^x, what is f(${k})?`),
      String(ans),
      intWrongs(ans, a * k * 2, a * 2 * k + 1, a + k),
      [
        `2^${k} = ${ipow(2, k)}`,
        `f(${k}) = ${a}·${ipow(2, k)} = ${ans}`,
      ],
      rng,
      intWrongNotes(
        I18N.tx('2^k yerine 2·k hesaplamışsın; üs tekrarlı çarpımdır.', 'You computed 2·k instead of 2^k; an exponent means repeated multiplication.'),
        I18N.tx('2^k yerine 2·k hesaplayıp bir de 1 eklemişsin.', 'You computed 2·k plus 1 instead of the power 2^k.'),
        I18N.tx("a ile k'yi toplamışsın; f(k) = a·2^k bir çarpım ve kuvvettir.", 'You added a and k; f(k) = a·2^k is a product with a power.')
      )
    );
  }

  function fxFloor(rng) {
    let v = parseFloat((rng.nextInt(-49, 50) / 10 + 0.05).toFixed(1));
    if (v === Math.floor(v)) v += 0.5;
    const useFloor = rng.nextInt(0, 2) === 0;
    const ans = useFloor ? Math.floor(v) : Math.ceil(v);
    const vs = v.toFixed(1);
    const sym = useFloor ? `⌊${vs}⌋` : `⌈${vs}⌉`;
    const segments = [];
    const points = [];
    for (let n = -6; n <= 5; n++) {
      if (useFloor) {
        segments.push({ x1: n, y1: n, x2: n + 1, y2: n });
        points.push({ x: n, y: n, label: '', hollow: false });
        points.push({ x: n + 1, y: n, label: '', hollow: true });
      } else {
        segments.push({ x1: n, y1: n + 1, x2: n + 1, y2: n + 1 });
        points.push({ x: n, y: n + 1, label: '', hollow: true });
        points.push({ x: n + 1, y: n + 1, label: '', hollow: false });
      }
    }
    return makeQuestion(
      I18N.tx('Parçalı / tam sayı fonksiyonları', 'Piecewise / integer functions'),
      I18N.tx(`${sym} değeri kaçtır?`, `What is the value of ${sym}?`),
      String(ans),
      intWrongs(ans, useFloor ? Math.ceil(v) : Math.floor(v), Math.round(v) + 2),
      [
        useFloor
          ? I18N.tx("⌊x⌋: x'e eşit ya da küçük en büyük tam sayı.", '⌊x⌋: the largest integer ≤ x.')
          : I18N.tx("⌈x⌉: x'e eşit ya da büyük en küçük tam sayı.", '⌈x⌉: the smallest integer ≥ x.'),
        `${sym} = ${ans}`,
      ],
      rng,
      intWrongNotes(
        I18N.tx('Yuvarlama yönünü karıştırmışsın: taban ve tavan fonksiyonları zıt yöne yuvarlar.', 'You mixed up the rounding direction: floor and ceiling round in opposite ways.'),
        I18N.tx('En yakın tam sayıya yuvarlayıp kaydırmışsın; taban/tavan sıradan yuvarlama değildir.', 'You rounded to the nearest integer and shifted it; floor/ceiling are not ordinary rounding.')
      ),
      { xMin: -5.5, xMax: 5.5, yMin: -6.5, yMax: 6.5, segments, points }
    );
  }

  function fxEllipse(rng) {
    const a = rng.nextInt(2, 7);
    let b;
    do {
      b = rng.nextInt(1, 6);
    } while (b === a);
    const lim = Math.max(a, b) + 1.5;
    // The shared quiz plot contract only supports curves/points/segments (no parametric curves),
    // so the ellipse is drawn as two explicit function branches (y = ±b·sqrt(1 - x²/a²)) instead
    // of VB's AddParam(...) call.
    return makeQuestion(
      I18N.tx('Elipsler', 'Ellipses'),
      I18N.tx(`x²/${a * a} + y²/${b * b} = 1 elipsinin y eksenini kestiği noktalar hangileridir?`, `Where does the ellipse x²/${a * a} + y²/${b * b} = 1 cross the y-axis?`),
      `(0, ±${b})`,
      [`(0, ±${b * b})`, `(±${b}, 0)`, `(0, ±${a})`, `(±${a}, 0)`],
      [
        I18N.tx('x = 0 koy: y²/b² = 1 → y = ±b.', 'Set x = 0: y²/b² = 1 → y = ±b.'),
        `y² = ${b * b} → y = ±${b}`,
      ],
      rng,
      [
        I18N.tx('Paydanın kendisini almışsın; y = ±b bulmak için paydanın karekökü gerekir.', 'You used the denominator itself; y = ±b needs the square root of the denominator.'),
        I18N.tx('Bu noktalar x eksenindedir; y eksenini keserken x = 0 alınıp y çözülür.', 'Those points lie on the x-axis; crossing the y-axis means x = 0 and solving for y.'),
        I18N.tx("Yarı eksenleri karıştırmışsın; x'in paydasındaki değer y-kesişimlerini vermez.", 'You mixed up the semi-axes; the x-denominator does not give the y-intercepts.'),
        I18N.tx('Bunlar x eksenini kestiği noktalardır; yarı eksenleri ve eksenleri karıştırmışsın.', 'These are the x-axis crossings; the axes and semi-axes are mixed up.'),
      ],
      {
        xMin: -lim, xMax: lim, yMin: -lim, yMax: lim,
        curves: [
          { f: (x) => (Math.abs(x) <= a ? b * Math.sqrt(Math.max(0, 1 - (x * x) / (a * a))) : NaN) },
          { f: (x) => (Math.abs(x) <= a ? -b * Math.sqrt(Math.max(0, 1 - (x * x) / (a * a))) : NaN) },
        ],
      }
    );
  }

  function fxReflect(rng) {
    const which = rng.nextInt(0, 3);
    let ques, correct, why;
    if (which === 0) {
      ques = I18N.tx('y = -f(x) grafiği, y = f(x) grafiğinin hangi yansımasıdır?', 'The graph of y = -f(x) is the reflection of y = f(x) about which line?');
      correct = I18N.tx('x eksenine göre', 'the x-axis');
      why = I18N.tx('Tüm y değerlerinin işareti değişir → x eksenine göre yansıma.', 'Every y-value changes sign → reflection about the x-axis.');
    } else if (which === 1) {
      ques = I18N.tx('y = f(-x) grafiği, y = f(x) grafiğinin hangi yansımasıdır?', 'The graph of y = f(-x) is the reflection of y = f(x) about which line?');
      correct = I18N.tx('y eksenine göre', 'the y-axis');
      why = I18N.tx('Tüm x değerlerinin işareti değişir → y eksenine göre yansıma.', 'Every x-value changes sign → reflection about the y-axis.');
    } else {
      ques = I18N.tx('y = -f(-x) grafiği, y = f(x) grafiğinin neresine göre simetriğidir?', 'The graph of y = -f(-x) is the mirror image of y = f(x) about what?');
      correct = I18N.tx('orijine göre', 'the origin');
      why = I18N.tx('Hem x hem y işareti değişir → orijine göre simetri.', 'Both x and y change sign → symmetry about the origin.');
    }
    return makeQuestion(
      I18N.tx('Yansıtma', 'Reflection'),
      ques,
      correct,
      [
        I18N.tx('x eksenine göre', 'the x-axis'),
        I18N.tx('y eksenine göre', 'the y-axis'),
        I18N.tx('orijine göre', 'the origin'),
        I18N.tx('y = x doğrusuna göre', 'the line y = x'),
      ],
      [why],
      rng,
      [
        I18N.tx('x eksenine göre yansımada yalnızca y değerlerinin işareti değişir, yani -f(x) elde edilir.', 'Reflecting about the x-axis changes only the sign of the y-values, giving -f(x).'),
        I18N.tx("y eksenine göre yansımada yalnızca x'in işareti değişir, yani f(-x) elde edilir.", 'Reflecting about the y-axis changes only the sign of x, giving f(-x).'),
        I18N.tx('Orijine göre simetride hem x hem y işareti değişir, yani -f(-x) elde edilir.', 'Symmetry about the origin changes both signs, giving -f(-x).'),
        I18N.tx("y = x doğrusuna göre yansıma x ile y'yi yer değiştirir (ters fonksiyon); işaret değiştirmez.", 'Reflecting about y = x swaps x and y (the inverse); it does not change signs.'),
      ],
      { xMin: -4, xMax: 4, yMin: -4, yMax: 6, curves: [{ f: (x) => 0.25 * (x - 1) * (x - 1) * (x + 2) }] }
    );
  }

  function fxVertLine(rng) {
    const r = rng.nextInt(2, 7), c = rng.nextInt(1, 6);
    const correct = rng.nextInt(0, 2) === 0 ? `x² + y² = ${r * r}` : `x = y² + ${c}`;
    return makeQuestion(
      I18N.tx('Dikey doğru testi', 'Vertical line test'),
      I18N.tx("Aşağıdakilerden hangisi y'nin x'in bir FONKSİYONU OLMADIĞI bir bağıntıdır?", 'Which of these is NOT a function y of x?'),
      correct,
      [`y = x² + ${c}`, `y = √(x + ${c})`, `y = |x - ${c}|`, `y = x³ - ${c}`],
      [
        I18N.tx('Bir x değeri için iki y değeri varsa fonksiyon değildir.', 'If some x gives two y-values, it is not a function.'),
        I18N.tx(`${correct} için bir dikey doğru eğriyi iki noktada keser.`, `For ${correct} a vertical line meets the curve twice.`),
      ],
      rng,
      [
        I18N.tx('Parabol her x için tek bir y verir; bu bir fonksiyondur.', 'A parabola gives exactly one y for each x; this is a function.'),
        I18N.tx('Karekök yalnızca negatif olmayan değeri verir, her x için tek y vardır; fonksiyondur.', 'A square root gives only the nonnegative value, so each x has one y; it is a function.'),
        I18N.tx('Mutlak değer her x için tek bir y verir; fonksiyondur.', 'An absolute value gives one y for each x; it is a function.'),
        I18N.tx('Kübik ifade her x için tek bir y verir; fonksiyondur.', 'A cubic gives one y for each x; it is a function.'),
      ]
    );
  }

  // ---------- Inverse functions (QuizBankInverse.vb) ----------
  const ivTx = (tr, en) => I18N.tx(tr, en);
  const ivDn = (a) => (a < 0 ? '(' + a + ')' : String(a));
  const ivSgTerm = (c, v) => { if (c === 0) return ''; const m = Math.abs(c); return (c < 0 ? ' - ' : ' + ') + (m === 1 ? v : m + v); };
  const ivPick = (rng, items) => items[rng.nextInt(0, items.length)];
  const ivCf = (n) => (n === 1 ? '' : (n === -1 ? '-' : String(n)));
  const ivSuffix = (v) => (v === 0 ? '' : v > 0 ? ` + ${v}` : ` - ${-v}`);
  function ivGcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b !== 0) { const t = a % b; a = b; b = t; } return a === 0 ? 1 : a; }
  function ivFrac(n, d) {
    if (d === 0) return ivTx('tanımsız', 'undefined');
    const g = ivGcd(n, d);
    n = Math.trunc(n / g); d = Math.trunc(d / g);
    if (d < 0) { n = -n; d = -d; }
    return d === 1 ? String(n) : `${n}/${d}`;
  }

  function ivLinEval(rng) {
    const a = ivPick(rng, [-4, -3, -2, 2, 3, 4]);
    const b = rng.nextInt(-6, 7), x0 = nonZero(rng, -4, 4);
    const k = a * x0 + b;
    const f = polyStr(b, a);
    const wrongs = [String(a * k + b), String(k - b), ivFrac(k + b, a), String(-x0), String(x0 + 1)];
    const notes = [
      ivTx(`k = ${k} değerini f'de x yerine yazmışsın (f(${k})); oysa f⁻¹(${k}), f(t) = ${k} denklemini çözer.`, `You substituted ${k} into f (that is f(${k})); but f⁻¹(${k}) solves the equation f(t) = ${k}.`),
      ivTx("Sabiti çıkardıktan sonra x'in katsayısına bölmeyi unutmuşsun.", 'You subtracted the constant but forgot to divide by the coefficient of x.'),
      ivTx('Sabiti çıkarmak yerine eklemişsin: (k + b)/a yerine (k - b)/a olmalı.', 'You added the constant instead of subtracting it: it must be (k - b)/a, not (k + b)/a.'),
      ivTx('Doğru sayının işaretini ters yazmışsın.', 'You wrote the correct number with the opposite sign.'),
      ivTx('Doğru sonuçtan 1 fazla: son adımda küçük bir hata.', 'One more than the correct value: a small slip in the last step.'),
    ];
    return makeQuestion(
      ivTx('Ters fonksiyon değeri', 'Value of an inverse function'),
      ivTx(`f(x) = ${f} fonksiyonu bire-birdir. f⁻¹(${k}) kaçtır?`, `The function f(x) = ${f} is one-to-one. What is f⁻¹(${k})?`),
      String(x0), wrongs,
      [
        ivTx(`f⁻¹(${k}) = t demek f(t) = ${k} demektir.`, `f⁻¹(${k}) = t means f(t) = ${k}.`),
        `${polyStr(b, a).replace(/x/g, 't')} = ${k}  →  ${a}t = ${k - b}`,
        `t = ${k - b}/${ivDn(a)} = ${x0}`,
      ], rng, notes);
  }

  function ivFormulaSimple(rng) {
    if (rng.nextInt(0, 2) === 0) {
      const a = ivPick(rng, [-4, -3, -2, 2, 3, 4]);
      const b = nonZero(rng, -5, 5);
      const f = polyStr(b, a);
      const correct = `(x ${plus(-b)})/${ivDn(a)}`;
      const wrongs = [`(x ${plus(b)})/${ivDn(a)}`, polyStr(-b, a), `x/${ivDn(a)} ${plus(-b)}`, `1/(${f})`];
      const notes = [
        ivTx("Sabiti ters işaretle taşımamışsın: y = ax + b'den x = (y - b)/a çıkar, (y + b)/a değil.", 'You did not move the constant with the opposite sign: y = ax + b gives x = (y - b)/a, not (y + b)/a.'),
        ivTx("Yalnızca sabitin işaretini değiştirmişsin; oysa x'i yalnız bırakmak için a'ya da bölmek gerekir.", 'You only changed the sign of the constant; to isolate x you must also divide by a.'),
        ivTx("a'ya yalnızca x terimi için bölmüşsün; sabit terim de (x - b) ile birlikte a'ya bölünür: (x - b)/a.", 'You divided only the x part by a; the constant is divided too: (x - b)/a.'),
        ivTx("1/f(x) çarpmaya göre ters (çarpmaya göre devir) demektir, ters FONKSİYON değildir.", '1/f(x) is the reciprocal, not the inverse FUNCTION.'),
      ];
      return makeQuestion(
        ivTx('Ters fonksiyon formülü (doğrusal)', 'Inverse formula (linear)'),
        ivTx(`f(x) = ${f} için f⁻¹(x) hangisidir?`, `For f(x) = ${f}, which is f⁻¹(x)?`),
        correct, wrongs,
        [`y = ${f}`, `y ${plus(-b)} = ${ivCf(a)}x  →  x = (y ${plus(-b)})/${ivDn(a)}`, ivTx(`x ile y'yi değiştir: f⁻¹(x) = ${correct}`, `Swap x and y: f⁻¹(x) = ${correct}`)],
        rng, notes);
    }
    const c = nonZero(rng, -6, 6);
    const f = `x³ ${plus(c)}`;
    const correct = `∛(x ${plus(-c)})`;
    const wrongs = [`∛x ${plus(-c)}`, `∛(x ${plus(c)})`, `(x ${plus(-c)})³`, `1/(x³ ${plus(c)})`];
    const notes = [
      ivTx("Küp kökü yalnızca x'e uygulamışsın; önce sabit çıkarılır, SONRA tüm ifadenin küp kökü alınır.", 'You took the cube root of x only; first subtract the constant, THEN take the cube root of the whole expression.'),
      ivTx('Sabiti çıkarmak yerine eklemişsin.', 'You added the constant instead of subtracting it.'),
      ivTx('Küp alma işlemini tekrar uygulamışsın; ters, küpün tersi olan küp köktür.', 'You cubed again; the inverse of cubing is the cube root.'),
      ivTx('1/f(x) çarpmaya göre ters demektir, ters fonksiyon değildir.', '1/f(x) is the reciprocal, not the inverse function.'),
    ];
    return makeQuestion(
      ivTx('Ters fonksiyon formülü (kübik)', 'Inverse formula (cubic)'),
      ivTx(`f(x) = ${f} için f⁻¹(x) hangisidir?`, `For f(x) = ${f}, which is f⁻¹(x)?`),
      correct, wrongs,
      [`y = x³ ${plus(c)}  →  y ${plus(-c)} = x³`, ivTx(`Küp kök al: x = ∛(y ${plus(-c)})`, `Take the cube root: x = ∛(y ${plus(-c)})`), ivTx(`x ile y'yi değiştir: f⁻¹(x) = ${correct}`, `Swap x and y: f⁻¹(x) = ${correct}`)],
      rng, notes);
  }

  function ivFormulaAdv(rng) {
    if (rng.nextInt(0, 2) === 0) {
      let a, b, d;
      do {
        a = ivPick(rng, [-2, -1, 1, 2, 3]);
        b = nonZero(rng, -3, 3); d = nonZero(rng, -3, 3);
      } while (a * d - b === 0);
      const f = `(${polyStr(b, a)})/(${polyStr(d, 1)})`;
      const correct = `(${polyStr(-b, d)})/(${polyStr(a, -1)})`;
      const wrongs = [`(${polyStr(b, d)})/(${polyStr(a, -1)})`, `(${polyStr(-b, d)})/(${polyStr(a, 1)})`, `(${polyStr(d, 1)})/(${polyStr(b, a)})`, `(${polyStr(-b, -d)})/(${polyStr(a, -1)})`];
      const notes = [
        ivTx("Payda temizlenip x toplanırken b'nin işaretini kaçırmışsın: pay (dy - b) olmalı.", 'You lost the sign of b while collecting x: the numerator must be (dy - b).'),
        ivTx('Paydadaki -x terimini +x yazmışsın; x(y - 1) = ... den payda (a - y) olur.', 'You wrote +x instead of -x in the denominator; x(y - 1) = ... leads to a denominator (a - y).'),
        ivTx('Kesri sadece ters çevirmişsin ((cx+d)/(ax+b)); bu f\'nin tersi değil, çarpmaya göre tersidir.', 'You just flipped the fraction ((cx+d)/(ax+b)); that is the reciprocal, not the inverse function.'),
        ivTx('Pay ve paydadaki işaretleri düzgün düzenlememişsin; -1 ile çarparken her terimin işareti değişir.', 'The signs in numerator and denominator are mixed up; multiplying by -1 flips every term.'),
      ];
      const yX = (s) => s.replace(/x/g, 'y');
      return makeQuestion(
        ivTx('Ters fonksiyon formülü (kesirli)', 'Inverse formula (rational)'),
        ivTx(`f(x) = ${f} için f⁻¹(x) hangisidir?`, `For f(x) = ${f}, which is f⁻¹(x)?`),
        correct, wrongs,
        [
          `y(${polyStr(d, 1)}) = ${polyStr(b, a)}  →  xy${ivSgTerm(d, 'y')} = ${polyStr(b, a)}`,
          `xy${ivSgTerm(-a, 'x')} = ${b}${ivSgTerm(-d, 'y')}  →  x(y ${plus(-a)}) = ${b}${ivSgTerm(-d, 'y')}`,
          ivTx(`x = (${yX(polyStr(-b, d))})/(${yX(polyStr(a, -1))})  (pay ve paydayı -1 ile çarptık)`, `x = (${yX(polyStr(-b, d))})/(${yX(polyStr(a, -1))})  (numerator and denominator multiplied by -1)`),
          ivTx(`x ile y'yi değiştir: f⁻¹(x) = ${correct}`, `Swap x and y: f⁻¹(x) = ${correct}`),
        ], rng, notes);
    }
    const bs = ivPick(rng, [2, 3, 5]);
    const c = nonZero(rng, -3, 3);
    const lg = 'log' + '₀₁₂₃₄₅₆₇₈₉'[bs];
    const f = `${bs}^x ${plus(c)}`;
    const correct = `${lg}(x ${plus(-c)})`;
    const wrongs = [`${lg}(x) ${plus(-c)}`, `${lg}(x ${plus(c)})`, `${bs}^(x ${plus(-c)})`, `${lg}(x) ${plus(c)}`];
    const notes = [
      ivTx('Sabit logaritmanın İÇİNDEN çıkarılmalıdır: y - c = a^x olduğundan x = log(y - c).', 'The constant belongs INSIDE the logarithm: y - c = a^x gives x = log(y - c).'),
      ivTx('Sabitin işaretini ters yazmışsın: y - c = a^x olduğundan log(y - c) olmalı.', 'You used the wrong sign for the constant: y - c = a^x gives log(y - c).'),
      ivTx('Üstel fonksiyonu yeniden uygulamışsın; üstelin tersi logaritmadır.', 'You applied the exponential again; the inverse of an exponential is a logarithm.'),
      ivTx('Sabit hem dışarıda hem yanlış işaretle; önce sabit çıkarılır, sonra logaritma alınır.', 'The constant is outside and has the wrong sign; first subtract it, then take the logarithm.'),
    ];
    return makeQuestion(
      ivTx('Ters fonksiyon formülü (üstel)', 'Inverse formula (exponential)'),
      ivTx(`f(x) = ${f} için f⁻¹(x) hangisidir?`, `For f(x) = ${f}, which is f⁻¹(x)?`),
      correct, wrongs,
      [`y = ${bs}^x ${plus(c)}  →  y ${plus(-c)} = ${bs}^x`, ivTx(`${bs} tabanında logaritma al: x = ${lg}(y ${plus(-c)})`, `Take log base ${bs}: x = ${lg}(y ${plus(-c)})`), ivTx(`x ile y'yi değiştir: f⁻¹(x) = ${correct}  (x > ${c} için)`, `Swap x and y: f⁻¹(x) = ${correct}  (for x > ${c})`)],
      rng, notes);
  }

  function ivWhichOne(rng) {
    const c = nonZero(rng, -5, 5), a = ivPick(rng, [-3, -2, 2, 3]), b = rng.nextInt(-4, 5);
    const m = rng.nextInt(-3, 4), n = rng.nextInt(1, 4);
    const good = [`x³ ${plus(c)}`, polyStr(b, a), `x⁵ ${plus(c)}`, `-x³ ${plus(c)}`];
    const correct = good[rng.nextInt(0, good.length)];
    const bad = [
      [`x² ${plus(c)}`, ivTx(`Çift fonksiyon: f(-2) = f(2) = ${4 + c}; yatay doğru grafiği iki kez keser.`, `An even function: f(-2) = f(2) = ${4 + c}; a horizontal line meets the graph twice.`), `f(-2) = f(2) = ${4 + c}`],
      [`x⁴ ${plus(c)}`, ivTx(`Çift fonksiyon: f(-1) = f(1) = ${1 + c}; bire-bir değil.`, `An even function: f(-1) = f(1) = ${1 + c}; it is not one-to-one.`), `f(-1) = f(1) = ${1 + c}`],
      [`|x${ivSuffix(-m)}|`, ivTx(`x = ${m - 1} ve x = ${m + 1} aynı değeri verir (f = 1): bire-bir değil.`, `x = ${m - 1} and x = ${m + 1} give the same value (f = 1): not one-to-one.`), `f(${m - 1}) = f(${m + 1}) = 1`],
      [`x² ${plus(-2 * n)}x`, ivTx(`f(0) = f(${2 * n}) = 0: iki farklı girdi aynı çıktıyı verir.`, `f(0) = f(${2 * n}) = 0: two different inputs give the same output.`), `f(0) = f(${2 * n}) = 0`],
    ];
    const idx = [0, 1, 2, 3];
    for (let i = idx.length - 1; i > 0; i--) { const j = rng.nextInt(0, i + 1); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    const picked = idx.slice(0, 3).map((i) => bad[i]);
    const dec = correct.startsWith('-');
    return makeQuestion(
      ivTx('Bire-bir fonksiyon', 'One-to-one function'),
      ivTx('Aşağıdaki fonksiyonlardan hangisi tüm reel sayılarda BİRE-BİRDİR (ters fonksiyonu vardır)?', 'Which of these functions is ONE-TO-ONE on all real numbers (has an inverse function)?'),
      correct,
      picked.map((t) => t[0]),
      [
        ivTx(`${correct} fonksiyonu kesin ${dec ? 'azalan' : 'artan'}dır: yatay doğru testini geçer, bire-birdir.`, `${correct} is strictly ${dec ? 'decreasing' : 'increasing'}: it passes the horizontal line test, so it is one-to-one.`),
        ivTx('Diğerlerinde farklı iki girdi aynı çıktıyı verir:', 'In the others two different inputs give the same output:'),
        picked.map((t) => t[0] + ' → ' + t[2]).join(';  '),
      ], rng,
      picked.map((t) => t[1]));
  }

  function ivGraphTest(rng) {
    const kind = rng.nextInt(0, 5);
    const h = rng.nextInt(-2, 3), k = rng.nextInt(-2, 3);
    const s = ivPick(rng, [-1.0, 0.5, 1.0, 2.0]);
    let f;
    switch (kind) {
      case 0: f = (x) => s * (x - h) + k; break;
      case 1: f = (x) => 0.1 * Math.pow(x - h, 3) + k; break;
      case 2: f = (x) => Math.pow(1.5, x - h) + k - 2; break;
      case 3: f = (x) => 0.4 * (x - h) * (x - h) + k - 2; break;
      default: f = (x) => 0.25 * Math.pow(x - h, 3) - 1.5 * (x - h) + k;
    }
    const oneToOne = kind <= 2;
    const t1 = ivTx('f bire-birdir: her yatay doğru grafiği en çok bir noktada keser.', 'f is one-to-one: every horizontal line meets the graph at most once.');
    const t2 = ivTx('f bire-bir DEĞİLDİR: bazı yatay doğrular grafiği iki ya da daha çok noktada keser.', 'f is NOT one-to-one: some horizontal lines meet the graph two or more times.');
    const t3 = ivTx('f bire-birdir: her dikey doğru grafiği en çok bir noktada keser.', 'f is one-to-one: every vertical line meets the graph at most once.');
    const t4 = ivTx('f bire-bir DEĞİLDİR: grafik dikey doğru testini geçemez (f bir fonksiyon bile değildir).', 'f is NOT one-to-one: the graph fails the vertical line test (f is not even a function).');
    const correct = oneToOne ? t1 : t2;
    let wrongs, notes;
    if (oneToOne) {
      wrongs = [t2, t3, t4];
      notes = [
        ivTx('Grafik hep yükseliyor (ya da hep alçalıyor); hiçbir yatay doğru iki kez kesmez.', 'The graph keeps rising (or keeps falling); no horizontal line meets it twice.'),
        ivTx("Dikey doğru testi yalnızca 'fonksiyon mu?' sorusunu yanıtlar; bire-birlik için YATAY doğru testi gerekir.", "The vertical line test only tells whether it is a function; one-to-one needs the HORIZONTAL line test."),
        ivTx('Grafik her dikey doğruyla bir kez kesiştiği için bir fonksiyondur.', 'Every vertical line meets the graph once, so it is a function.'),
      ];
    } else {
      wrongs = [t1, t3, t4];
      notes = [
        ivTx('Grafiğin tepe/çukur kısmında bir yatay doğru eğriyi iki kez keser; yalnızca bir kolu görüp karar vermişsin.', 'Near the turning point a horizontal line meets the curve twice; you judged from just one branch.'),
        ivTx('Dikey doğru testi bire-birliği değil, fonksiyon olmayı sınar.', 'The vertical line test checks for being a function, not for being one-to-one.'),
        ivTx('Grafik her x için tek bir y verir, yani fonksiyondur; sorun yatay doğru testindedir.', 'The graph gives one y for each x, so it is a function; the problem is the horizontal line test.'),
      ];
    }
    return makeQuestion(
      ivTx('Yatay doğru testi (grafik)', 'Horizontal line test (graph)'),
      ivTx('Grafiği verilen f için hangi ifade doğrudur?', 'Which statement about the function f whose graph is shown is correct?'),
      correct, wrongs,
      [
        ivTx('Yatay doğru testi: grafiği birden çok noktada kesen bir yatay doğru varsa f bire-bir değildir.', 'Horizontal line test: if some horizontal line meets the graph more than once, f is not one-to-one.'),
        oneToOne ? ivTx('Bu grafik kesin monoton: hiçbir yatay doğru iki kez kesmez, f bire-birdir.', 'This graph is strictly monotone: no horizontal line meets it twice, so f is one-to-one.')
          : ivTx('Bu grafikte bir yatay doğru iki (ya da üç) kez keser: farklı x değerleri aynı y değerini verir.', 'In this graph a horizontal line meets it twice (or three times): different x give the same y.'),
      ], rng, notes,
      { xMin: -6, xMax: 6, yMin: -6, yMax: 6, curves: [{ f, dashed: false }] });
  }

  function ivRestrict(rng) {
    const h = rng.nextInt(1, 6), c = rng.nextInt(-4, 5);
    const kk = c - h * h;
    const f = polyStr(c, -2 * h, 1);
    const correct = `x ≥ ${h}`;
    const wrongs = ['x ≥ 0', `x ≥ ${-h}`, `x ≤ ${h + 1}`, `x ≥ ${h - 1}`];
    const notes = [
      ivTx(`x ≥ 0 hem tepenin solunu hem sağını içerir: f(0) = f(${2 * h}) = ${c}, bire-bir değil.`, `x ≥ 0 contains points on both sides of the vertex: f(0) = f(${2 * h}) = ${c}, not one-to-one.`),
      ivTx(`Tepe noktası x = ${h}; x ≥ ${-h} her iki kolu da içerir (f(0) = f(${2 * h})).`, `The vertex is at x = ${h}; x ≥ ${-h} still contains both branches (f(0) = f(${2 * h})).`),
      ivTx(`x ≤ ${h + 1} tepenin iki yanındaki noktaları içerir: f(${h - 1}) = f(${h + 1}).`, `x ≤ ${h + 1} contains points on both sides of the vertex: f(${h - 1}) = f(${h + 1}).`),
      ivTx(`x ≥ ${h - 1} tepeden hemen önce başlıyor: f(${h - 1}) = f(${h + 1}), bire-bir değil.`, `x ≥ ${h - 1} starts just before the vertex: f(${h - 1}) = f(${h + 1}), not one-to-one.`),
    ];
    return makeQuestion(
      ivTx('Tanım kümesini kısıtlama', 'Restricting the domain'),
      ivTx(`f(x) = ${f} fonksiyonu tüm reel sayılarda bire-bir değildir. Aşağıdaki kısıtlamalardan hangisi f'yi bire-bir yapar?`, `f(x) = ${f} is not one-to-one on all real numbers. Which of these domain restrictions makes f one-to-one?`),
      correct, wrongs,
      [
        ivTx(`Tam kare: f(x) = (x - ${h})² ${plus(kk)}; tepe noktası x = -b/(2a) = ${h}.`, `Complete the square: f(x) = (x - ${h})² ${plus(kk)}; the vertex is at x = -b/(2a) = ${h}.`),
        ivTx(`f(x) = f(${2 * h} - x): tepenin iki yanı aynı değerleri verir.`, `f(x) = f(${2 * h} - x): the two sides of the vertex repeat the same values.`),
        ivTx(`Tek bir kol seçilir: x ≥ ${h} (artan) ya da x ≤ ${h} (azalan). Seçeneklerde yalnızca x ≥ ${h} bunu sağlar.`, `Keep a single branch: x ≥ ${h} (increasing) or x ≤ ${h} (decreasing). Of the options only x ≥ ${h} does that.`),
      ], rng, notes);
  }

  function ivDomRange(rng) {
    let a, b;
    do { a = nonZero(rng, -4, 4); b = nonZero(rng, -4, 4); } while (a === b);
    const f = `√(x ${plus(-a)}) ${plus(b)}`;
    const domW = ivTx('Tanım', 'Domain'), rngW = ivTx('Değer', 'Range');
    const correct = `${domW}: [${b}, ∞)   ${rngW}: [${a}, ∞)`;
    const wrongs = [
      `${domW}: [${a}, ∞)   ${rngW}: [${b}, ∞)`, `${domW}: (${b}, ∞)   ${rngW}: [${a}, ∞)`, `${domW}: [${b}, ∞)   ${rngW}: (-∞, ${a}]`, `${domW}: [${-b}, ∞)   ${rngW}: [${-a}, ∞)`];
    const notes = [
      ivTx("f'nin kümelerini aynen yazmışsın; ters fonksiyonda tanım ve değer kümeleri YER DEĞİŞTİRİR.", 'You copied the sets of f; for the inverse the domain and the range SWAP.'),
      ivTx(`Uç nokta ${b} dahildir: f(x) = ${b} değerini alır (x = ${a} için), bu yüzden köşeli parantez.`, `The endpoint ${b} is included: f takes the value ${b} (at x = ${a}), so a closed bracket is needed.`),
      ivTx("Değer kümesinin yönünü ters almışsın: f⁻¹ artandır, değer kümesi f'nin tanım kümesi [a, ∞)'dir.", 'You reversed the direction of the range: f⁻¹ is increasing and its range is the domain [a, ∞) of f.'),
      ivTx('Uç noktaların işaretini değiştirmişsin; yalnızca yer değiştirirler, işaretleri değişmez.', 'You changed the signs of the endpoints; they only swap places, they do not change sign.'),
    ];
    return makeQuestion(
      ivTx('Ters fonksiyonun tanım ve değer kümesi', 'Domain and range of the inverse'),
      ivTx(`f(x) = ${f} bire-birdir. f⁻¹ fonksiyonunun tanım ve değer kümeleri hangisidir?`, `f(x) = ${f} is one-to-one. Which are the domain and the range of f⁻¹?`),
      correct, wrongs,
      [
        ivTx(`f: kökün içi ≥ 0 ⇒ tanım x ≥ ${a}; kök ≥ 0 ⇒ değer y ≥ ${b}.`, `f: radicand ≥ 0 ⇒ domain x ≥ ${a}; root ≥ 0 ⇒ range y ≥ ${b}.`),
        ivTx('Tanım(f⁻¹) = Değer(f) ve Değer(f⁻¹) = Tanım(f).', 'Domain(f⁻¹) = Range(f) and Range(f⁻¹) = Domain(f).'),
        ivTx(`Yani f⁻¹: tanım [${b}, ∞), değer [${a}, ∞)  (f⁻¹(x) = (x ${plus(-b)})² ${plus(a)}).`, `So f⁻¹: domain [${b}, ∞), range [${a}, ∞)  (f⁻¹(x) = (x ${plus(-b)})² ${plus(a)}).`),
      ], rng, notes);
  }

  function ivGivenPoint(rng) {
    const p = nonZero(rng, -5, 5);
    let q;
    do { q = nonZero(rng, -9, 9); } while (Math.abs(q) < 2 || q === p || q === -p);
    if (rng.nextInt(0, 2) === 0) {
      const wrongs = [String(q), ivFrac(1, q), String(-p), String(p + q), String(p * q)];
      const notes = [
        ivTx(`${q} f'nin ÇIKTISI; f⁻¹(${q}) ise f'nin ${q} çıktısını veren GİRDİSİDİR.`, `${q} is the OUTPUT of f; f⁻¹(${q}) is the INPUT for which f gives ${q}.`),
        ivTx('1/f değerini yazmışsın; f⁻¹ çarpmaya göre ters değil, ters fonksiyondur.', 'You wrote a reciprocal; f⁻¹ is the inverse function, not 1/f.'),
        ivTx('İşaretini değiştirmişsin; f⁻¹ işaret çevirmez, girdi ve çıktının rollerini değiştirir.', 'You flipped a sign; f⁻¹ does not negate, it swaps the roles of input and output.'),
        ivTx('Girdi ile çıktıyı toplamışsın; ters fonksiyon yalnızca rolleri değiştirir.', 'You added input and output; the inverse just swaps their roles.'),
        ivTx('Girdi ile çıktıyı çarpmışsın; ters fonksiyon yalnızca rolleri değiştirir.', 'You multiplied input and output; the inverse just swaps their roles.'),
      ];
      return makeQuestion(
        ivTx('f(a) = b ve f⁻¹(b)', 'f(a) = b and f⁻¹(b)'),
        ivTx(`f bire-bir bir fonksiyon ve f(${p}) = ${q} ise f⁻¹(${q}) kaçtır?`, `If f is one-to-one and f(${p}) = ${q}, what is f⁻¹(${q})?`),
        String(p), wrongs,
        [
          ivTx(`f⁻¹ f'yi geri alır: f(${p}) = ${q} ⇔ f⁻¹(${q}) = ${p}.`, `f⁻¹ undoes f: f(${p}) = ${q} ⇔ f⁻¹(${q}) = ${p}.`),
          ivTx(`Girdi ${p}, çıktı ${q}; ters fonksiyonda girdi ${q}, çıktı ${p} olur.`, `Input ${p}, output ${q}; for the inverse the input is ${q} and the output is ${p}.`),
        ], rng, notes);
    }
    const correct = `(${q}, ${p})`;
    const wrongs = [`(${p}, ${q})`, `(${-q}, ${-p})`, `(${-p}, ${q})`, `(${p}, ${-q})`];
    const notes = [
      ivTx('Aynı noktayı yazmışsın; ters fonksiyonun grafiğinde koordinatlar yer değiştirir.', "You wrote the same point; on the inverse's graph the coordinates swap."),
      ivTx('y = -x doğrusuna göre yansıtmışsın; ters fonksiyon için ayna y = x doğrusudur (işaret değişmez).', 'You reflected in y = -x; for the inverse the mirror is y = x (no sign changes).'),
      ivTx("Yalnızca x'in işaretini çevirmişsin; bu y eksenine göre yansımadır, ters fonksiyon değil.", 'You only flipped the sign of x; that is a reflection in the y-axis, not an inverse.'),
      ivTx("Yalnızca y'nin işaretini çevirmişsin; bu x eksenine göre yansımadır, ters fonksiyon değil.", 'You only flipped the sign of y; that is a reflection in the x-axis, not an inverse.'),
    ];
    return makeQuestion(
      ivTx('Ters fonksiyonun grafiğindeki nokta', 'A point on the graph of the inverse'),
      ivTx(`f bire-birdir ve (${p}, ${q}) noktası y = f(x) grafiği üzerindedir. y = f⁻¹(x) grafiği üzerinde HANGİ nokta kesinlikle bulunur?`, `f is one-to-one and the point (${p}, ${q}) lies on the graph of y = f(x). Which point MUST lie on the graph of y = f⁻¹(x)?`),
      correct, wrongs,
      [
        ivTx(`(${p}, ${q}) f üzerinde ⇔ f(${p}) = ${q} ⇔ f⁻¹(${q}) = ${p}.`, `(${p}, ${q}) on f ⇔ f(${p}) = ${q} ⇔ f⁻¹(${q}) = ${p}.`),
        ivTx(`Yani (${q}, ${p}) noktası f⁻¹ üzerindedir (y = x doğrusuna göre ayna görüntüsü).`, `So (${q}, ${p}) lies on f⁻¹ (the mirror image in the line y = x).`),
      ], rng, notes);
  }

  function ivComposition(rng) {
    let k;
    do { k = nonZero(rng, -6, 6); } while (Math.abs(k) < 2);
    const linear = rng.nextInt(0, 2) === 0;
    const firstOuter = rng.nextInt(0, 2) === 0; // true: f(f⁻¹(k)); false: f⁻¹(f(k))
    const a = ivPick(rng, [-3, -2, 2, 3]);
    const b = nonZero(rng, -5, 5);
    const f = linear ? polyStr(b, a) : `x³ ${plus(b)}`;
    const fk = linear ? a * k + b : k * k * k + b;
    const expr = firstOuter ? `f(f⁻¹(${k}))` : `f⁻¹(f(${k}))`;
    const wrongs = [String(fk), '1', String(-k), '0', ivFrac(1, k)];
    const notes = [
      ivTx(`f'yi yalnızca bir kez uygulamışsın (f(${k}) = ${fk}); ters fonksiyon onu geri aldığı için iki işlem birbirini götürür.`, `You applied f only once (f(${k}) = ${fk}); the inverse cancels it, so the two operations undo each other.`),
      ivTx("f ile f⁻¹'in 'çarpımı' 1 değildir; BİLEŞKELERİ özdeşlik fonksiyonudur (x'i x'e götürür).", 'f and f⁻¹ do not multiply to 1; their COMPOSITION is the identity function (it returns x).'),
      ivTx('İşareti ters çevirmişsin; bileşke x\'i aynen verir.', 'You flipped the sign; the composition returns x unchanged.'),
      ivTx("Bileşke 0 vermez; f⁻¹(f(x)) = x ve f(f⁻¹(x)) = x'tir.", 'The composition does not give 0; f⁻¹(f(x)) = x and f(f⁻¹(x)) = x.'),
      ivTx("1/x değil: bileşke x'in kendisini verir.", 'Not 1/x: the composition returns x itself.'),
    ];
    return makeQuestion(
      ivTx('Ters fonksiyonun bileşkesi', 'Composition with the inverse'),
      ivTx(`f(x) = ${f} bire-bir bir fonksiyondur (tüm reel sayılarda). ${expr} kaçtır?`, `f(x) = ${f} is one-to-one (on all real numbers). What is ${expr}?`),
      String(k), wrongs,
      [
        ivTx('Ters fonksiyonun tanımı: f⁻¹(f(x)) = x ve f(f⁻¹(x)) = x.', 'Definition of the inverse: f⁻¹(f(x)) = x and f(f⁻¹(x)) = x.'),
        firstOuter ? ivTx(`f⁻¹(${k}) = t, f(t) = ${k} sayısıdır; sonra f(t) = ${k}.`, `f⁻¹(${k}) = t is the number with f(t) = ${k}; then f(t) = ${k}.`)
          : ivTx(`f(${k}) = ${fk}; f⁻¹(${fk}) = ${k} (f(t) = ${fk} denkleminin çözümü).`, `f(${k}) = ${fk}; f⁻¹(${fk}) = ${k} (the solution of f(t) = ${fk}).`),
      ], rng, notes);
  }

  function ivTrap(rng) {
    const a = ivPick(rng, [-3, -2, 2, 3, 4]);
    const b = rng.nextInt(-5, 6);
    let x0, k, v;
    do {
      x0 = nonZero(rng, -4, 4);
      k = a * x0 + b;
      v = a * k + b;
    } while (Math.abs(v) < 2 || Math.abs(x0) < 2 || k === 0 || v === x0);
    const f = polyStr(b, a);
    const correct = ivFrac(1, v);
    const wrongs = [String(x0), String(v), ivFrac(1, x0), ivFrac(1, k)];
    const notes = [
      ivTx(`${x0} değeri f⁻¹(${k})'dir (ters FONKSİYON); soru ise 1/f(${k}) yani çarpmaya göre tersi soruyor.`, `${x0} is f⁻¹(${k}) (the inverse FUNCTION); the question asks for 1/f(${k}), the reciprocal.`),
      ivTx(`f(${k}) = ${v} değerini bulup tersini (1/·) almayı unutmuşsun.`, `You found f(${k}) = ${v} but forgot to take its reciprocal.`),
      ivTx(`1/f⁻¹(${k}) hesaplamışsın; istenen 1/f(${k}).`, `You computed 1/f⁻¹(${k}); the question asks for 1/f(${k}).`),
      ivTx(`f(${k}) yerine x = ${k} değerinin tersini almışsın; önce f(${k}) hesaplanmalı.`, `You took the reciprocal of ${k} instead of f(${k}); compute f(${k}) first.`),
    ];
    return makeQuestion(
      ivTx('f⁻¹(x) ile 1/f(x) farkı', 'f⁻¹(x) versus 1/f(x)'),
      ivTx(`f(x) = ${f} olsun. 1/f(${k}) değeri kaçtır? (Dikkat: f⁻¹(${k}) değil, f(${k})'nın çarpmaya göre tersi.)`, `Let f(x) = ${f}. What is 1/f(${k})? (Careful: not f⁻¹(${k}), but the reciprocal of f(${k}).)`),
      correct, wrongs,
      [
        `f(${k}) = ${ivDn(a)}·(${k}) ${plus(b)} = ${v}`,
        `1/f(${k}) = 1/${ivDn(v)} = ${correct}`,
        ivTx(`Karşılaştır: f⁻¹(${k}) = ${x0}. Yani f⁻¹(x) ≠ 1/f(x).`, `Compare: f⁻¹(${k}) = ${x0}. So f⁻¹(x) ≠ 1/f(x).`),
      ], rng, notes);
  }

  // ---------- Exam-pool-only generators (used by window.ExamPools.functions, not by the 10-question quiz) ----------
  const nm = (n) => (n < 0 ? '−' + (-n) : String(n)); // interval endpoint with a true minus sign
  const dirX = (h) => (h > 0 ? I18N.tx(`${h} birim sağa`, `${h} units right`) : I18N.tx(`${-h} birim sola`, `${-h} units left`));
  const dirY = (k) => (k > 0 ? I18N.tx(`${k} birim yukarı`, `${k} units up`) : I18N.tx(`${-k} birim aşağı`, `${-k} units down`));
  const subDigit = (n) => '₀₁₂₃₄₅₆₇₈₉'[n];
  const allReals = () => I18N.tx('Tüm reel sayılar', 'All real numbers');

  // Level 1
  function fxRangeAbs(rng) {
    const a = nonZero(rng, -5, 5), b = nonZero(rng, -5, 5);
    const up = rng.nextInt(0, 2) === 0;
    const f = up ? `|x ${plus(-a)}| ${plus(b)}` : `${b} - |x ${plus(-a)}|`;
    const correct = up ? `[${nm(b)}, ∞)` : `(−∞, ${nm(b)}]`;
    const wrongs = up
      ? [`(−∞, ${nm(b)}]`, `[${nm(a)}, ∞)`, `[${nm(-b)}, ∞)`, allReals()]
      : [`[${nm(b)}, ∞)`, `(−∞, ${nm(a)}]`, `(−∞, ${nm(-b)}]`, allReals()];
    return makeQuestion(
      I18N.tx('Değer kümesi', 'Range'),
      I18N.tx(`f(x) = ${f} fonksiyonunun değer kümesi hangisidir?`, `Which is the range of f(x) = ${f}?`),
      correct, wrongs,
      [
        I18N.tx(`|x ${plus(-a)}| ifadesi en az 0 değerini alır (x = ${a} için).`, `|x ${plus(-a)}| is at least 0 and equals 0 at x = ${a}.`),
        up ? I18N.tx(`En küçük değer ${b}; f yukarı doğru sınırsızdır: [${nm(b)}, ∞).`, `The minimum is ${b} and f is unbounded above: [${nm(b)}, ∞).`)
           : I18N.tx(`Mutlak değerin önündeki eksi nedeniyle en büyük değer ${b}; aşağı sınırsız: (−∞, ${nm(b)}].`, `Because of the minus sign the maximum is ${b} and f is unbounded below: (−∞, ${nm(b)}].`),
      ],
      rng,
      up ? [
        I18N.tx('Mutlak değer negatif olmaz; fonksiyon aşağı değil yukarı doğru sınırsızdır.', 'An absolute value is never negative; f is unbounded upward, not downward.'),
        I18N.tx('x = a tepe noktasının x-koordinatıdır; değer kümesi y-koordinatına bakar.', 'x = a is the x-coordinate of the vertex; the range uses the y-coordinate.'),
        I18N.tx('Sabitin işaretini değiştirmişsin; en küçük değer sabitin kendisidir.', 'You changed the sign of the constant; the minimum is the constant itself.'),
        I18N.tx('Değerler bir yönden sınırlıdır; tüm reel sayılar olamaz.', 'The values are bounded on one side; not all reals.'),
      ] : [
        I18N.tx('Eksi işareti grafiği aşağı çevirir; sabit en büyük değerdir, en küçük değil.', 'The minus sign flips the graph down; the constant is the maximum, not the minimum.'),
        I18N.tx('x = a tepe noktasının x-koordinatıdır; değer kümesi y-koordinatına bakar.', 'x = a is the x-coordinate of the vertex; the range uses the y-coordinate.'),
        I18N.tx('Sabitin işaretini değiştirmişsin; en büyük değer sabitin kendisidir.', 'You changed the sign of the constant; the maximum is the constant itself.'),
        I18N.tx('Değerler yukarıdan sınırlıdır; tüm reel sayılar olamaz.', 'The values are bounded above; not all reals.'),
      ]
    );
  }

  function fxFloorEq(rng) {
    const n = rng.nextInt(-4, 5);
    return makeQuestion(
      I18N.tx('Tam değer fonksiyonu', 'Floor function'),
      I18N.tx(`⌊x⌋ = ${n} eşitliğini sağlayan x değerleri hangi aralıktadır?`, `For which x does ⌊x⌋ = ${n} hold?`),
      `[${nm(n)}, ${nm(n + 1)})`,
      [`(${nm(n)}, ${nm(n + 1)}]`, `[${nm(n - 1)}, ${nm(n)})`, `[${nm(n)}, ${nm(n + 1)}]`, `(${nm(n - 1)}, ${nm(n)}]`],
      [
        I18N.tx("⌊x⌋, x'i aşmayan en büyük tam sayıdır.", '⌊x⌋ is the greatest integer not exceeding x.'),
        `⌊x⌋ = ${n} ⇔ ${n} ≤ x < ${n + 1}.`,
      ],
      rng,
      [
        I18N.tx(`x = ${n} için ⌊x⌋ = ${n} olur, dahil edilmelidir; x = ${n + 1} için ${n + 1} olur, dışarıda kalmalıdır.`, `x = ${n} gives ${n} and must be included; x = ${n + 1} gives ${n + 1} and must be excluded.`),
        I18N.tx(`Bu aralıkta ⌊x⌋ = ${n - 1} olur.`, `On this interval ⌊x⌋ = ${n - 1}.`),
        I18N.tx(`x = ${n + 1} için ⌊x⌋ = ${n + 1} olur; sağ uç dahil değildir.`, `At x = ${n + 1} we get ⌊x⌋ = ${n + 1}; the right endpoint is excluded.`),
        I18N.tx(`Bu aralıkta ⌊x⌋ = ${n - 1} olur (x = ${n} için ise ${n}).`, `On this interval ⌊x⌋ = ${n - 1} (and ⌊${n}⌋ = ${n}).`),
      ]
    );
  }

  function fxInvExpVal(rng) {
    const b = rng.pick([2, 3, 5]), e = rng.nextInt(1, 5);
    const N = ipow(b, e);
    return makeQuestion(
      I18N.tx('Üstel / logaritma ters ilişkisi', 'Exponential / logarithm inverse'),
      I18N.tx(`f(x) = ${b}^x ise f⁻¹(${N}) kaçtır?`, `If f(x) = ${b}^x, what is f⁻¹(${N})?`),
      String(e),
      [String(b), String(N), String(e + 1), String(e - 1), String(e + 2)],
      [
        I18N.tx(`f⁻¹(${N}) = t demek ${b}^t = ${N} demektir.`, `f⁻¹(${N}) = t means ${b}^t = ${N}.`),
        `${N} = ${b}^${e}  →  t = ${e}`,
        I18N.tx(`(Yani f⁻¹(x) = log${subDigit(b)}(x).)`, `(That is, f⁻¹(x) = log${subDigit(b)}(x).)`),
      ],
      rng,
      [
        I18N.tx('Bu, üssün tabanıdır; aranan ise üssün kendisidir.', 'This is the base; the question asks for the exponent.'),
        I18N.tx(`Bu f(${e}) değeridir; f⁻¹ ise girdi ile çıktının rollerini değiştirir.`, `That is f(${e}); the inverse swaps the roles of input and output.`),
        I18N.tx(`Üssü bir fazla bulmuşsun; ${b}^${e + 1} = ${ipow(b, e + 1)} olur.`, `The exponent is one too large; ${b}^${e + 1} = ${ipow(b, e + 1)}.`),
        I18N.tx(`Üssü bir eksik bulmuşsun; ${b}^${e - 1} = ${ipow(b, e - 1)} olur.`, `The exponent is one too small; ${b}^${e - 1} = ${ipow(b, e - 1)}.`),
        I18N.tx(`Üssü iki fazla bulmuşsun; ${b}^${e + 2} = ${ipow(b, e + 2)} olur.`, `The exponent is two too large; ${b}^${e + 2} = ${ipow(b, e + 2)}.`),
      ]
    );
  }

  // Level 2
  function fxCompFormula(rng) {
    const a = nonZero(rng, -3, 3), c = nonZero(rng, -3, 3), b = nonZero(rng, -4, 4), d = nonZero(rng, -4, 4);
    const correct = `(f∘g)(x) = ${polyStr(a * d + b, a * c)}`;
    return makeQuestion(
      I18N.tx('Bileşke fonksiyon', 'Composite function'),
      I18N.tx(`f(x) = ${polyStr(b, a)} ve g(x) = ${polyStr(d, c)} ise (f∘g)(x) hangisidir?`, `If f(x) = ${polyStr(b, a)} and g(x) = ${polyStr(d, c)}, which is (f∘g)(x)?`),
      correct,
      [`(f∘g)(x) = ${polyStr(c * b + d, a * c)}`, `(f∘g)(x) = ${polyStr(b + d, a * c)}`, `(f∘g)(x) = ${polyStr(a * d + b, a + c)}`, `(f∘g)(x) = ${polyStr(a * d - b, a * c)}`, `(f∘g)(x) = ${polyStr(a * d + b + 1, a * c)}`, `(f∘g)(x) = ${polyStr(a * d + b - 1, a * c)}`, `(f∘g)(x) = ${polyStr(a * d + b, -a * c)}`],
      [
        I18N.tx("(f∘g)(x) = f(g(x)): g(x) ifadesini f'de x yerine yaz.", '(f∘g)(x) = f(g(x)): substitute g(x) for x in f.'),
        `f(g(x)) = ${a}·(${polyStr(d, c)}) ${plus(b)}`,
        `= ${polyStr(a * d + b, a * c)}`,
      ],
      rng,
      [
        I18N.tx('Bu (g∘f)(x) ifadesidir; sıra ters uygulanmış.', 'This is (g∘f)(x); the order was reversed.'),
        I18N.tx("Sabit terimleri doğrudan toplamışsın; f dış fonksiyon olduğu için g'nin sabiti a ile çarpılmalı.", "You just added the constants; g's constant must be multiplied by a because f is outer."),
        I18N.tx("Katsayıları çarpmak yerine toplamışsın; x'in katsayısı a·c olur.", 'You added the x-coefficients instead of multiplying; it is a·c.'),
        I18N.tx("Sabit terimi hesaplarken b'nin işaretini ters almışsın.", 'You flipped the sign of b when computing the constant.'),
        I18N.tx('Sabit terimde küçük bir toplama hatası var.', 'There is a small addition slip in the constant term.'),
      ]
    );
  }

  function fxModelRect(rng) {
    const s = rng.nextInt(3, 13), P = 4 * s;
    return makeQuestion(
      I18N.tx('Matematiksel modelleme', 'Mathematical models'),
      I18N.tx(`Çevresi ${P} m olan dikdörtgen biçimli bir bahçenin bir kenarı x m ise alan A(x) = x(${2 * s} − x) olur. Alanın alabileceği en büyük değer kaç m²'dir?`, `A rectangular garden has perimeter ${P} m. If one side is x m, its area is A(x) = x(${2 * s} − x). What is the largest possible area in m²?`),
      String(s * s),
      [String(4 * s * s), String(2 * s * s), String(s * (s + 1)), String(s * (s - 1))],
      [
        I18N.tx(`A(x) = −x² + ${2 * s}x: aşağı açılan parabol, en büyük değer tepe noktasındadır.`, `A(x) = −x² + ${2 * s}x: a downward parabola; the maximum is at the vertex.`),
        `x = −b/(2a) = ${2 * s}/2 = ${s}`,
        `A(${s}) = ${s}·(${2 * s} − ${s}) = ${s * s}`,
      ],
      rng,
      [
        I18N.tx(`${4 * s * s} = (${2 * s})² değeri, yarı çevrenin tamamını bir kenar sanmaktır; x + y = ${2 * s} olmalı.`, `${4 * s * s} = (${2 * s})² treats the whole semi-perimeter as one side; the two sides must add to ${2 * s}.`),
        I18N.tx('Kenarı yanlış (gereken değerin yarısı) almışsın.', 'You used a wrong side length (half of what it should be).'),
        I18N.tx(`Kenarlar ${s} ve ${s + 1} olamaz: toplamları ${2 * s} değil, ${2 * s + 1} olur.`, `Sides ${s} and ${s + 1} cannot work: they add to ${2 * s + 1}, not ${2 * s}.`),
        I18N.tx(`Kenarlar ${s} ve ${s - 1} olamaz: toplamları ${2 * s} değil, ${2 * s - 1} olur.`, `Sides ${s} and ${s - 1} cannot work: they add to ${2 * s - 1}, not ${2 * s}.`),
      ]
    );
  }

  function fxEvenOddCombo(rng) {
    const v = rng.nextInt(0, 4);
    const defs = [
      [I18N.tx('f ÇİFT, g TEK ise f·g fonksiyonu için ne söylenebilir?', 'If f is EVEN and g is ODD, what is f·g?'), 'odd', '(fg)(−x) = f(−x)·g(−x) = f(x)·(−g(x)) = −(fg)(x)'],
      [I18N.tx('g TEK ise g·g (yani g²) fonksiyonu için ne söylenebilir?', 'If g is ODD, what is g² = g·g?'), 'even', '(g(−x))² = (−g(x))² = g(x)²'],
      [I18N.tx('f ÇİFT, g TEK ise (f∘g)(x) = f(g(x)) için ne söylenebilir?', 'If f is EVEN and g is ODD, what is f∘g?'), 'even', 'f(g(−x)) = f(−g(x)) = f(g(x))'],
      [I18N.tx('g TEK ise (g∘g)(x) için ne söylenebilir?', 'If g is ODD, what is g∘g?'), 'odd', 'g(g(−x)) = g(−g(x)) = −g(g(x))'],
    ][v];
    const names = { even: I18N.tx('Çift', 'Even'), odd: I18N.tx('Tek', 'Odd'), neither: I18N.tx('Ne çift ne tek', 'Neither even nor odd'), both: I18N.tx('Hem çift hem tek', 'Both even and odd') };
    const notes = {
      even: I18N.tx('Çift olsaydı F(−x) = F(x) sağlanırdı; burada işaret değişiyor.', 'If it were even, F(−x) = F(x) would hold; here the sign flips.'),
      odd: I18N.tx('Tek olsaydı F(−x) = −F(x) olurdu; burada işaret değişmiyor.', 'If it were odd, F(−x) = −F(x) would hold; here the sign does not flip.'),
      neither: I18N.tx('Hesap sonucu açıkça F(x) ya da −F(x) çıkıyor; "ne çift ne tek" denemez.', 'The computation clearly gives F(x) or −F(x); "neither" is wrong.'),
      both: I18N.tx('Hem çift hem tek olan tek fonksiyon sıfır fonksiyonudur; genel olarak doğru değildir.', 'The zero function is the only function that is both even and odd; not true in general.'),
    };
    const keys = ['even', 'odd', 'neither', 'both'].filter((k) => k !== defs[1]);
    return makeQuestion(
      I18N.tx('Çift / tek fonksiyon', 'Even / odd function'), defs[0], names[defs[1]],
      keys.map((k) => names[k]),
      [I18N.tx('−x değerini yerine koy ve sadeleştir:', 'Substitute −x and simplify:'), defs[2], I18N.tx(`Sonuç: ${defs[1] === 'odd' ? 'tek' : 'çift'} fonksiyon.`, `Result: ${defs[1]} function.`)],
      rng, keys.map((k) => notes[k])
    );
  }

  function fxMonotony(rng) {
    const a = rng.pick([-3, -2, -1, 1, 2, 3]), h = nonZero(rng, -5, 5), k = rng.nextInt(-5, 6);
    const wantDec = rng.nextInt(0, 2) === 0;
    const f = `${ivCf(a)}(x ${plus(-h)})² ${plus(k)}`;
    const left = `(−∞, ${nm(h)}]`, right = `[${nm(h)}, ∞)`;
    const leftN = `(−∞, ${nm(-h)}]`, rightN = `[${nm(-h)}, ∞)`;
    const decLeft = a > 0; // a>0: decreasing on (−∞,h]
    const correct = wantDec ? (decLeft ? left : right) : (decLeft ? right : left);
    const opposite = correct === left ? right : left;
    const wr = [opposite, leftN, rightN, allReals()];
    const noteFor = (w) => (w === opposite ? I18N.tx('Artan ve azalan aralıkları karıştırmışsın; a\'nın işaretine bak.', 'You swapped increasing and decreasing; check the sign of a.')
      : (w === leftN || w === rightN) ? I18N.tx("Tepe noktasının x-koordinatının işaretini ters almışsın; tepe x = h'dadır.", 'You flipped the sign of the vertex x-coordinate; the vertex is at x = h.')
      : I18N.tx('Parabol tüm reel sayılarda monoton değildir.', 'A parabola is not monotone on all of ℝ.'));
    return makeQuestion(
      I18N.tx('Monotonluk', 'Monotonicity'),
      I18N.tx(`f(x) = ${f} fonksiyonunun ${wantDec ? 'azalan' : 'artan'} olduğu en geniş aralık hangisidir?`, `On which largest interval is f(x) = ${f} ${wantDec ? 'decreasing' : 'increasing'}?`),
      correct, wr,
      [
        I18N.tx(`Tepe noktasının x-koordinatı x = ${h}.`, `The vertex has x-coordinate x = ${h}.`),
        a > 0 ? I18N.tx('a > 0: parabol yukarı açılır; tepenin solunda azalan, sağında artan.', 'a > 0: opens upward; decreasing left of the vertex, increasing right of it.')
              : I18N.tx('a < 0: parabol aşağı açılır; tepenin solunda artan, sağında azalan.', 'a < 0: opens downward; increasing left of the vertex, decreasing right of it.'),
        I18N.tx(`Sonuç: ${correct}.`, `Result: ${correct}.`),
      ],
      rng, wr.map(noteFor)
    );
  }

  // Level 3
  function fxDomRatSqrt(rng) {
    const a = rng.nextInt(-4, 3), b = a + rng.nextInt(1, 5);
    return makeQuestion(
      I18N.tx('Tanım kümesi', 'Domain'),
      I18N.tx(`f(x) = √(x ${plus(-a)}) / (x ${plus(-b)}) fonksiyonunun tanım kümesi hangisidir?`, `Which is the domain of f(x) = √(x ${plus(-a)}) / (x ${plus(-b)})?`),
      `[${nm(a)}, ${nm(b)}) ∪ (${nm(b)}, ∞)`,
      [`[${nm(a)}, ∞)`, `(${nm(a)}, ${nm(b)}) ∪ (${nm(b)}, ∞)`, `[${nm(a)}, ${nm(b)})`, `(−∞, ${nm(b)}) ∪ (${nm(b)}, ∞)`],
      [
        I18N.tx(`Kökün içi: x ${plus(-a)} ≥ 0 → x ≥ ${a}.`, `Radicand: x ${plus(-a)} ≥ 0 → x ≥ ${a}.`),
        I18N.tx(`Payda: x ${plus(-b)} ≠ 0 → x ≠ ${b}.`, `Denominator: x ${plus(-b)} ≠ 0 → x ≠ ${b}.`),
        I18N.tx(`İkisini birleştir: x ≥ ${a} ve x ≠ ${b} (${b} > ${a} olduğundan çıkarılır).`, `Combine: x ≥ ${a} and x ≠ ${b} (${b} > ${a}, so it is removed).`),
      ],
      rng,
      [
        I18N.tx(`Paydanın sıfır olduğu x = ${b} noktasını çıkarmayı unutmuşsun.`, `You forgot to remove x = ${b}, where the denominator vanishes.`),
        I18N.tx(`x = ${a} için kökün içi 0'dır, kabul edilir; başlangıcı dışarıda bırakmışsın.`, `At x = ${a} the radicand is 0, which is allowed; you excluded the start.`),
        I18N.tx(`${b} sonrasındaki değerleri de atmışsın; yalnızca x = ${b} çıkarılır.`, `You dropped everything after ${b}; only x = ${b} itself is removed.`),
        I18N.tx('Kök koşulunu (x ≥ a) uygulamamışsın; yalnızca paydaya bakmışsın.', 'You ignored the root condition (x ≥ a) and only checked the denominator.'),
      ]
    );
  }

  function fxDomSqrtRatio(rng) {
    const a = rng.nextInt(-4, 3), b = a + rng.nextInt(1, 6);
    const neg = I18N.tx('Kesrin negatif olduğu aralığı seçmişsin; kökün içi ≥ 0 olmalı.', 'You chose the interval where the fraction is negative; the radicand must be ≥ 0.');
    return makeQuestion(
      I18N.tx('Tanım kümesi', 'Domain'),
      I18N.tx(`f(x) = √((x ${plus(-a)})/(x ${plus(-b)})) fonksiyonunun tanım kümesi hangisidir?`, `Which is the domain of f(x) = √((x ${plus(-a)})/(x ${plus(-b)}))?`),
      `(−∞, ${nm(a)}] ∪ (${nm(b)}, ∞)`,
      [`(−∞, ${nm(a)}) ∪ (${nm(b)}, ∞)`, `(−∞, ${nm(a)}] ∪ [${nm(b)}, ∞)`, `[${nm(a)}, ${nm(b)})`, `(${nm(a)}, ${nm(b)}]`],
      [
        I18N.tx(`Gerekli: (x ${plus(-a)})/(x ${plus(-b)}) ≥ 0 ve x ≠ ${b}.`, `Needed: (x ${plus(-a)})/(x ${plus(-b)}) ≥ 0 and x ≠ ${b}.`),
        I18N.tx(`İşaret tablosu: x < ${a} için (−)/(−) = +; ${a} < x < ${b} için (+)/(−) = −; x > ${b} için (+)/(+) = +.`, `Sign table: x < ${a}: (−)/(−) = +; ${a} < x < ${b}: (+)/(−) = −; x > ${b}: (+)/(+) = +.`),
        I18N.tx(`x = ${a} kesri 0 yapar (kabul); x = ${b} paydayı 0 yapar (red).`, `x = ${a} makes the fraction 0 (allowed); x = ${b} makes the denominator 0 (excluded).`),
      ],
      rng,
      [
        I18N.tx(`x = ${a} için kesir 0'dır ve √0 tanımlıdır; ${a} dahil edilmelidir.`, `At x = ${a} the fraction is 0 and √0 is defined; ${a} must be included.`),
        I18N.tx(`x = ${b} paydayı sıfır yapar; ${b} dahil edilemez.`, `x = ${b} makes the denominator zero; ${b} cannot be included.`),
        neg, neg,
      ]
    );
  }

  function fxLogDomain(rng) {
    const a = rng.nextInt(-4, 3), b = a + rng.nextInt(2, 7);
    return makeQuestion(
      I18N.tx('Tanım kümesi', 'Domain'),
      I18N.tx(`f(x) = ln(x ${plus(-a)}) + √(${b} − x) fonksiyonunun tanım kümesi hangisidir?`, `Which is the domain of f(x) = ln(x ${plus(-a)}) + √(${b} − x)?`),
      `(${nm(a)}, ${nm(b)}]`,
      [`[${nm(a)}, ${nm(b)}]`, `(${nm(a)}, ${nm(b)})`, `(${nm(a)}, ∞)`, `[${nm(a)}, ${nm(b)})`],
      [
        I18N.tx(`ln için argüman pozitif: x ${plus(-a)} > 0 → x > ${a}.`, `ln needs a positive argument: x ${plus(-a)} > 0 → x > ${a}.`),
        I18N.tx(`Kök için: ${b} − x ≥ 0 → x ≤ ${b}.`, `Root: ${b} − x ≥ 0 → x ≤ ${b}.`),
        I18N.tx(`Kesişim: ${a} < x ≤ ${b}.`, `Intersection: ${a} < x ≤ ${b}.`),
      ],
      rng,
      [
        I18N.tx(`x = ${a} için ln(0) tanımsızdır; sol uç açık olmalı.`, `ln(0) is undefined at x = ${a}; the left end must be open.`),
        I18N.tx(`x = ${b} için √0 = 0 tanımlıdır; sağ uç dahil olmalı.`, `√0 = 0 is defined at x = ${b}; the right end must be included.`),
        I18N.tx('Kök koşulunu (x ≤ b) unutmuşsun.', 'You forgot the root condition (x ≤ b).'),
        I18N.tx('Hem sol ucu (ln(0) tanımsız) hem sağ ucu (√0 tanımlı) ters almışsın.', 'You reversed both ends (ln(0) is undefined; √0 is defined).'),
      ]
    );
  }

  function fxComp3(rng) {
    const c = rng.nextInt(-4, 5), m = rng.pick([-3, -2, 2, 3]), d = nonZero(rng, -4, 4), k = nonZero(rng, -3, 3);
    const h = (x) => x + d, g = (x) => m * x, f = (x) => x * x + c;
    const ans = f(g(h(k)));
    return makeQuestion(
      I18N.tx('Üç fonksiyonun bileşkesi', 'Composition of three functions'),
      I18N.tx(`f(x) = ${polyStr(c, 0, 1)}, g(x) = ${polyStr(0, m)}, h(x) = ${polyStr(d, 1)} ise (f∘g∘h)(${k}) kaçtır?`, `If f(x) = ${polyStr(c, 0, 1)}, g(x) = ${polyStr(0, m)}, h(x) = ${polyStr(d, 1)}, what is (f∘g∘h)(${k})?`),
      String(ans),
      intWrongs(ans, h(g(f(k))), g(f(h(k))), f(h(g(k)))),
      [
        I18N.tx("(f∘g∘h)(x) = f(g(h(x))): en içteki h'den başla.", '(f∘g∘h)(x) = f(g(h(x))): start with the innermost h.'),
        `h(${k}) = ${h(k)}`,
        `g(${h(k)}) = ${g(h(k))}`,
        `f(${g(h(k))}) = ${g(h(k))}² ${plus(c)} = ${ans}`,
      ],
      rng,
      intWrongNotes(
        I18N.tx("Sırayı tersine (h∘g∘f) uygulamışsın; f∘g∘h önce h'yi uygular.", 'You applied them in reverse (h∘g∘f); f∘g∘h applies h first.'),
        I18N.tx('Sırayı g, f, h olarak karıştırmışsın; doğru sıra h, sonra g, sonra f.', 'You used the order g, f, h; the correct order is h, then g, then f.'),
        I18N.tx('Sırayı g, h, f olarak karıştırmışsın; doğru sıra h, sonra g, sonra f.', 'You used the order g, h, f; the correct order is h, then g, then f.')
      )
    );
  }

  function fxInvExp(rng) {
    if (rng.nextInt(0, 2) === 0) {
      const b = rng.pick([2, 3]), c = nonZero(rng, -5, 5), L = `log${subDigit(b)}`;
      return makeQuestion(
        I18N.tx('Ters fonksiyon: üstel', 'Inverse function: exponential'),
        I18N.tx(`f(x) = ${b}^x ${plus(c)} fonksiyonunun tersi ve tersinin tanım kümesi hangisidir?`, `Which is the inverse of f(x) = ${b}^x ${plus(c)} together with its domain?`),
        `f⁻¹(x) = ${L}(x ${plus(-c)}),  x > ${c}`,
        [`f⁻¹(x) = ${L}(x ${plus(c)}),  x > ${-c}`, `f⁻¹(x) = ${L}(x) ${plus(-c)},  x > 0`, `f⁻¹(x) = ${L}(x ${plus(-c)}),  x > 0`, `f⁻¹(x) = ${L}(x ${plus(-c)}),  x ≠ ${c}`],
        [
          `y = ${b}^x ${plus(c)}  →  ${b}^x = y ${plus(-c)}`,
          I18N.tx(`x = ${L}(y ${plus(-c)}); x ile y yer değiştirir: f⁻¹(x) = ${L}(x ${plus(-c)}).`, `x = ${L}(y ${plus(-c)}); swap x and y: f⁻¹(x) = ${L}(x ${plus(-c)}).`),
          I18N.tx(`f'nin değer kümesi (${c}, ∞) olduğundan f⁻¹'in tanım kümesi x > ${c}.`, `The range of f is (${c}, ∞), so the domain of f⁻¹ is x > ${c}.`),
        ],
        rng,
        [
          I18N.tx('Sabiti ters işaretle taşımamışsın: üstel ifade y − c olur.', 'You moved the constant with the wrong sign: the exponential equals y − c.'),
          I18N.tx('Sabiti logaritmanın dışına almışsın; önce sabiti çıkarıp sonra logaritma alınır.', 'You took the constant outside the logarithm; subtract it first, then take the log.'),
          I18N.tx('Tanım kümesi yanlış: log argümanı pozitif olmalı, yani x > c (x > 0 değil).', 'The domain is wrong: the log argument must be positive, i.e. x > c (not x > 0).'),
          I18N.tx('Tanım kümesi bir yarım doğrudur (x > c); yalnızca bir nokta dışlanmaz.', 'The domain is a half-line (x > c), not all reals except one point.'),
        ]
      );
    }
    const h = nonZero(rng, -4, 4), k = nonZero(rng, -4, 4);
    return makeQuestion(
      I18N.tx('Ters fonksiyon: logaritma', 'Inverse function: logarithm'),
      I18N.tx(`f(x) = ln(x ${plus(-h)}) ${plus(k)} fonksiyonunun tersi ve tersinin değer kümesi hangisidir?`, `Which is the inverse of f(x) = ln(x ${plus(-h)}) ${plus(k)} together with its range?`),
      `f⁻¹(x) = e^(x ${plus(-k)}) ${plus(h)},  y > ${h}`,
      [`f⁻¹(x) = e^(x ${plus(k)}) ${plus(h)},  y > ${h}`, `f⁻¹(x) = e^(x ${plus(-k)}) ${plus(-h)},  y > ${-h}`, `f⁻¹(x) = e^(x ${plus(-k)}) ${plus(h)},  y > 0`, `f⁻¹(x) = ln(x ${plus(-k)}) ${plus(h)},  y > ${h}`],
      [
        `y = ln(x ${plus(-h)}) ${plus(k)}  →  ln(x ${plus(-h)}) = y ${plus(-k)}`,
        `x ${plus(-h)} = e^(y ${plus(-k)})  →  x = e^(y ${plus(-k)}) ${plus(h)}`,
        I18N.tx(`f'nin tanım kümesi x > ${h}, bu yüzden f⁻¹'in değer kümesi y > ${h}.`, `The domain of f is x > ${h}, so the range of f⁻¹ is y > ${h}.`),
      ],
      rng,
      [
        I18N.tx('Sabiti ters işaretle taşımamışsın: ln(...) = y − k olur.', 'You moved the constant with the wrong sign: ln(...) = y − k.'),
        I18N.tx('Kaydırmanın işaretini ters almışsın; x − h = e^(...) ise x = e^(...) + h.', 'You flipped the shift sign: x − h = e^(...) gives x = e^(...) + h.'),
        I18N.tx("Değer kümesi e^(·) + h için (h, ∞)'dir; (0, ∞) yalnızca h = 0 ise.", 'The range of e^(·) + h is (h, ∞); (0, ∞) only when h = 0.'),
        I18N.tx("Ters fonksiyon logaritma değil üstel ifadedir; ln'in tersi e^x'tir.", 'The inverse is exponential, not a logarithm; the inverse of ln is e^x.'),
      ]
    );
  }

  function fxInvRat(rng) {
    let a, b;
    do { a = nonZero(rng, -4, 4); b = nonZero(rng, -4, 4); } while (a + b === 0);
    const num = polyStr(b, a);
    return makeQuestion(
      I18N.tx('Ters fonksiyon: rasyonel', 'Inverse function: rational'),
      I18N.tx(`f(x) = (x ${plus(b)})/(x ${plus(-a)}) fonksiyonunun tersi ve tersinin tanım kümesi hangisidir?`, `Which is the inverse of f(x) = (x ${plus(b)})/(x ${plus(-a)}) together with its domain?`),
      `f⁻¹(x) = (${num})/(x - 1),  x ≠ 1`,
      [`f⁻¹(x) = (${polyStr(-b, a)})/(x - 1),  x ≠ 1`, `f⁻¹(x) = (${num})/(x + 1),  x ≠ -1`, `f⁻¹(x) = (${num})/(x - 1),  x ≠ ${a}`, `f⁻¹(x) = (x ${plus(-a)})/(x ${plus(b)}),  x ≠ ${-b}`],
      [
        `y = (x ${plus(b)})/(x ${plus(-a)})  →  y(x ${plus(-a)}) = x ${plus(b)}`,
        `xy - ${ivDn(a)}y = x ${plus(b)}  →  x(y - 1) = ${ivDn(a)}y ${plus(b)}`,
        I18N.tx('x = (ay + b)/(y − 1); x ile y yer değiştirir. Payda ≠ 0 olmalı: x ≠ 1.', 'x = (ay + b)/(y − 1); swap x and y. The denominator must be nonzero: x ≠ 1.'),
        I18N.tx("(f, 1 değerini hiç almaz; bu yüzden f⁻¹'in tanım kümesi x ≠ 1.)", '(f never takes the value 1, so the domain of f⁻¹ is x ≠ 1.)'),
      ],
      rng,
      [
        I18N.tx('Sabit terimin işaretini yanlış taşımışsın: x(y − 1) = ay + b.', 'You moved the constant with the wrong sign: x(y − 1) = ay + b.'),
        I18N.tx('x terimlerini toplarken işareti yanlış almışsın; x(y − 1) elde edilir, x(y + 1) değil.', 'You got the wrong sign collecting x terms; you get x(y − 1), not x(y + 1).'),
        I18N.tx(`x ≠ ${a} f'nin tanım kümesidir; f⁻¹'in tanım kümesi f'nin değer kümesidir (x ≠ 1).`, `x ≠ ${a} is the domain of f; the domain of f⁻¹ is the range of f (x ≠ 1).`),
        I18N.tx('Kesri yalnızca ters çevirmişsin; bu çarpmaya göre ters, ters fonksiyon değildir.', 'You just flipped the fraction; that is the reciprocal, not the inverse function.'),
      ]
    );
  }

  function fxTransPoint(rng) {
    const h = nonZero(rng, -4, 4), k = nonZero(rng, -4, 4), q = nonZero(rng, -5, 5);
    const P = (x, y) => `(${nm(x)}, ${nm(y)})`;
    if (rng.nextInt(0, 2) === 0) {
      const p = nonZero(rng, -4, 4), s = rng.pick([-1, -2, 2, 3]);
      const sf = s === -1 ? '−' : String(s);
      return makeQuestion(
        I18N.tx('Grafik dönüşümleri', 'Graph transformations'),
        I18N.tx(`(${p}, ${q}) noktası y = f(x) grafiği üzerindedir. y = ${sf}f(x ${plus(-h)}) ${plus(k)} grafiği üzerinde hangi nokta vardır?`, `The point (${p}, ${q}) lies on y = f(x). Which point lies on y = ${sf}f(x ${plus(-h)}) ${plus(k)}?`),
        P(p + h, s * q + k),
        [P(p - h, s * q + k), P(p + h, s * q - k), P(p + h, s * (q + k)), P(p + h, q + k), P(p, s * q)],
        [
          I18N.tx(`x ${plus(-h)} = ${p} → x = ${p + h} (yatay kayma, ters işaretle).`, `x ${plus(-h)} = ${p} → x = ${p + h} (horizontal shift, opposite sign).`),
          `y = ${sf === '−' ? '−1' : sf}·(${q}) ${plus(k)} = ${s * q + k}`,
          I18N.tx(`Yeni nokta ${P(p + h, s * q + k)}.`, `New point ${P(p + h, s * q + k)}.`),
        ],
        rng,
        [
          I18N.tx('Yatay kaymayı ters yöne uygulamışsın; f(x − h) grafiği h kadar SAĞA kayar.', 'You shifted horizontally the wrong way; f(x − h) moves h units RIGHT.'),
          I18N.tx('Dikey kaymanın işaretini ters almışsın; +k yukarı kaydırır.', 'You flipped the sign of the vertical shift; +k moves the graph up.'),
          I18N.tx('Önce k ekleyip sonra katsayıyla çarpmışsın; katsayı yalnızca f(x) ile çarpılır, sonra k eklenir.', 'You added k before multiplying; the factor multiplies f(x) first, then k is added.'),
          I18N.tx('Katsayıyı (yansıma/ölçekleme) uygulamayı unutmuşsun.', 'You forgot to apply the scaling/reflection factor.'),
          I18N.tx('Kaymaları hiç uygulamamışsın; yalnızca katsayıyı uygulamışsın.', 'You did not apply the shifts, only the factor.'),
        ]
      );
    }
    const r = nonZero(rng, -3, 3), p = 2 * r;
    return makeQuestion(
      I18N.tx('Grafik dönüşümleri', 'Graph transformations'),
      I18N.tx(`(${p}, ${q}) noktası y = f(x) grafiği üzerindedir. y = f(2(x ${plus(-h)})) ${plus(k)} grafiği üzerinde hangi nokta vardır?`, `The point (${p}, ${q}) lies on y = f(x). Which point lies on y = f(2(x ${plus(-h)})) ${plus(k)}?`),
      P(r + h, q + k),
      [P(2 * p + h, q + k), P(r - h, q + k), P(p + h, q + k), P(r + h, q - k)],
      [
        I18N.tx(`2(x ${plus(-h)}) = ${p} → x ${plus(-h)} = ${r} → x = ${r + h}.`, `2(x ${plus(-h)}) = ${p} → x ${plus(-h)} = ${r} → x = ${r + h}.`),
        `y = ${q} ${plus(k)} = ${q + k}`,
        I18N.tx(`Yeni nokta ${P(r + h, q + k)}.`, `New point ${P(r + h, q + k)}.`),
      ],
      rng,
      [
        I18N.tx('x değerini 2 ile çarpmışsın; içte 2 ile çarpma grafiği yatayda yarıya SIKIŞTIRIR (x/2).', 'You multiplied x by 2; the factor 2 inside compresses the graph horizontally (x/2).'),
        I18N.tx('Yatay kaymayı ters yöne uygulamışsın; f(2(x − h)) grafiği h kadar SAĞA kayar.', 'You shifted the wrong way; f(2(x − h)) moves h units RIGHT.'),
        I18N.tx('Yatay sıkıştırmayı (x/2) uygulamayı unutmuşsun.', 'You forgot the horizontal compression (x/2).'),
        I18N.tx('Dikey kaymanın işaretini ters almışsın; +k yukarı kaydırır.', 'You flipped the sign of the vertical shift; +k moves the graph up.'),
      ]
    );
  }

  function fxTransPoly(rng) {
    const b = nonZero(rng, -4, 4), c = rng.nextInt(-4, 5), h = nonZero(rng, -3, 3), k = nonZero(rng, -4, 4);
    const f = polyStr(c, b, 1);
    const g = (hh, kk) => polyStr(hh * hh - b * hh + c + kk, b - 2 * hh, 1);
    return makeQuestion(
      I18N.tx('Grafik dönüşümleri', 'Graph transformations'),
      I18N.tx(`f(x) = ${f} fonksiyonunun grafiği ${dirX(h)} ve ${dirY(k)} kaydırılırsa elde edilen g(x) hangisidir?`, `The graph of f(x) = ${f} is shifted ${dirX(h)} and ${dirY(k)}. Which is the resulting g(x)?`),
      `g(x) = ${g(h, k)}`,
      [`g(x) = ${g(-h, k)}`, `g(x) = ${g(h, -k)}`, `g(x) = ${polyStr(h * h + c + k, b - 2 * h, 1)}`, `g(x) = ${polyStr(c + k - h, b, 1)}`],
      [
        `g(x) = f(x ${plus(-h)}) ${plus(k)}`,
        `g(x) = (x ${plus(-h)})² ${plus(b)}(x ${plus(-h)}) ${plus(c)} ${plus(k)}`,
        `(x ${plus(-h)})² = ${polyStr(h * h, -2 * h, 1)};  ${b}(x ${plus(-h)}) = ${polyStr(-b * h, b)}`,
        `g(x) = ${g(h, k)}`,
      ],
      rng,
      [
        I18N.tx('Yatay kaymayı ters yöne uygulamışsın: f(x + h) elde etmişsin.', 'You shifted horizontally the wrong way: you built f(x + h).'),
        I18N.tx('Dikey kaymayı ters yöne uygulamışsın.', 'You shifted vertically the wrong way.'),
        I18N.tx('Doğrusal terimde x yerine (x − h) yazmayı unutmuşsun; b·h terimi kayıp.', 'You did not replace x by (x − h) in the linear term; the b·h term is missing.'),
        I18N.tx('Kaymaları sabit terime ekleyip çıkarmışsın; yatay kayma x yerine (x − h) yazmaktır.', 'You added the shifts to the constant; a horizontal shift replaces x with (x − h).'),
      ]
    );
  }

  function fxPieceCont(rng) {
    const a = nonZero(rng, -3, 3), b = nonZero(rng, -5, 5), t = nonZero(rng, -3, 3);
    const m = a * t + b - t * t;
    return makeQuestion(
      I18N.tx('Parçalı fonksiyon', 'Piecewise function'),
      I18N.tx(`f(x) = { ${polyStr(b, a)}, x < ${t} ;  x² + m, x ≥ ${t} } fonksiyonu x = ${t} noktasında sürekli ise m kaçtır?`, `f(x) = { ${polyStr(b, a)}, x < ${t} ;  x² + m, x ≥ ${t} } is continuous at x = ${t}. What is m?`),
      String(m),
      intWrongs(m, a * t + b + t * t, a * t + b, b - t * t),
      [
        I18N.tx('Süreklilik için soldan limit = sağdaki değer olmalı.', 'For continuity the left-hand limit must equal the right-hand value.'),
        I18N.tx(`Soldan: ${a}·(${t}) ${plus(b)} = ${a * t + b}`, `From the left: ${a}·(${t}) ${plus(b)} = ${a * t + b}`),
        I18N.tx(`Sağdan: (${t})² + m = ${t * t} + m`, `From the right: (${t})² + m = ${t * t} + m`),
        `${t * t} + m = ${a * t + b}  →  m = ${m}`,
      ],
      rng,
      intWrongNotes(
        I18N.tx('t² değerini çıkarmak yerine eklemişsin: m = (sol değer) − t².', 'You added t² instead of subtracting: m = (left value) − t².'),
        I18N.tx("t² terimini hesaba katmamışsın; sağ taraf t² + m'dir.", 'You ignored the t² term; the right side is t² + m.'),
        I18N.tx("Soldaki a·t terimini unutmuşsun; sol değer a·t + b'dir.", 'You forgot the a·t term on the left; the left value is a·t + b.')
      )
    );
  }

  function fxPieceNested(rng) {
    const a = rng.pick([2, 3]), b = rng.nextInt(-1, 4), c = rng.nextInt(2, 8), k = rng.nextInt(-3, 4);
    const g1 = (x) => a * x + b, g2 = (x) => c - x * x;
    const f = (x) => (x < 1 ? g1(x) : g2(x));
    const inner = f(k), ans = f(inner);
    const other = inner < 1 ? g2(inner) : g1(inner);
    const innerCond = k < 1 ? '< 1' : '≥ 1', outerCond = inner < 1 ? '< 1' : '≥ 1';
    const outerForm = inner < 1 ? `${a}·(${inner}) ${plus(b)}` : `${c} − (${inner})²`;
    return makeQuestion(
      I18N.tx('Parçalı fonksiyon', 'Piecewise function'),
      I18N.tx(`f(x) = { ${polyStr(b, a)}, x < 1 ;  ${c} − x², x ≥ 1 } ise f(f(${k})) kaçtır?`, `If f(x) = { ${polyStr(b, a)}, x < 1 ;  ${c} − x², x ≥ 1 }, what is f(f(${k}))?`),
      String(ans),
      intWrongs(ans, inner, other, g1(g1(k))),
      [
        I18N.tx(`İç değer: ${k} ${innerCond} olduğundan f(${k}) = ${inner}.`, `Inner value: since ${k} ${innerCond}, f(${k}) = ${inner}.`),
        I18N.tx(`Dış değer: ${inner} ${outerCond} olduğundan f(${inner}) = ${outerForm} = ${ans}.`, `Outer value: since ${inner} ${outerCond}, f(${inner}) = ${outerForm} = ${ans}.`),
      ],
      rng,
      intWrongNotes(
        I18N.tx('Yalnızca bir kez f uygulamışsın (f(k)); iki kez uygulanmalı.', 'You applied f only once (f(k)); it must be applied twice.'),
        I18N.tx('İkinci adımda yanlış kolu seçmişsin; hangi kolun kullanılacağına f(k) değeri karar verir.', 'You used the wrong branch in the second step; the value f(k) decides which branch applies.'),
        I18N.tx('Her iki adımda da ilk kolu kullanmışsın; ikinci adımda kol yeniden seçilmeli.', 'You used the first branch twice; the branch must be re-chosen in the second step.')
      )
    );
  }

  function fxInvRestricted(rng) {
    const h = nonZero(rng, -4, 4), k = nonZero(rng, -4, 4);
    return makeQuestion(
      I18N.tx('Ters fonksiyon: kısıtlı tanım', 'Inverse function: restricted domain'),
      I18N.tx(`f(x) = (x ${plus(-h)})² ${plus(k)}, x ≥ ${h} fonksiyonunun tersi ve tersinin tanım kümesi hangisidir?`, `Which is the inverse of f(x) = (x ${plus(-h)})² ${plus(k)}, x ≥ ${h}, with its domain?`),
      `f⁻¹(x) = √(x ${plus(-k)}) ${plus(h)},  x ≥ ${k}`,
      [`f⁻¹(x) = √(x ${plus(k)}) ${plus(h)},  x ≥ ${-k}`, `f⁻¹(x) = √(x ${plus(-k)}) ${plus(-h)},  x ≥ ${k}`, `f⁻¹(x) = −√(x ${plus(-k)}) ${plus(h)},  x ≥ ${k}`, `f⁻¹(x) = √(x ${plus(-k)}) ${plus(h)},  x ≥ ${h}`],
      [
        `y = (x ${plus(-h)})² ${plus(k)}  →  (x ${plus(-h)})² = y ${plus(-k)}`,
        I18N.tx(`x ≥ ${h} olduğundan x ${plus(-h)} ≥ 0: pozitif kök alınır, x = √(y ${plus(-k)}) ${plus(h)}.`, `Since x ≥ ${h}, x ${plus(-h)} ≥ 0: take the positive root, x = √(y ${plus(-k)}) ${plus(h)}.`),
        I18N.tx(`f'nin değer kümesi [${k}, ∞) olduğundan f⁻¹'in tanım kümesi x ≥ ${k}.`, `The range of f is [${k}, ∞), so the domain of f⁻¹ is x ≥ ${k}.`),
      ],
      rng,
      [
        I18N.tx('Sabiti ters işaretle taşımamışsın: (x − h)² = y − k.', 'You moved the constant with the wrong sign: (x − h)² = y − k.'),
        I18N.tx('Kaymanın işaretini ters almışsın: x = h + √(...).', 'You flipped the shift sign: x = h + √(...).'),
        I18N.tx('Negatif kökü seçmişsin; x ≥ h kısıtlaması pozitif kökü gerektirir.', 'You chose the negative root; the restriction x ≥ h requires the positive root.'),
        I18N.tx("Tanım kümesini f'nin tanım kümesi olarak yazmışsın; f⁻¹'in tanım kümesi f'nin değer kümesidir.", 'You used the domain of f; the domain of f⁻¹ is the range of f.'),
      ]
    );
  }

  function fxEllipseRange(rng) {
    const a = rng.nextInt(2, 6);
    let b; do { b = rng.nextInt(1, 5); } while (b === a);
    let h, k; do { h = nonZero(rng, -4, 4); k = nonZero(rng, -4, 4); } while (h === k);
    const I = (c, r) => `[${nm(c - r)}, ${nm(c + r)}]`;
    const R = (xc, xr, yc, yr) => `x ∈ ${I(xc, xr)},  y ∈ ${I(yc, yr)}`;
    return makeQuestion(
      I18N.tx('Elipsler', 'Ellipses'),
      I18N.tx(`(x ${plus(-h)})²/${a * a} + (y ${plus(-k)})²/${b * b} = 1 elipsi için x ve y'nin alabildiği aralıklar hangisidir?`, `For the ellipse (x ${plus(-h)})²/${a * a} + (y ${plus(-k)})²/${b * b} = 1, which gives the ranges of x and y?`),
      R(h, a, k, b),
      [R(h, b, k, a), R(0, a, 0, b), R(k, a, h, b), R(h, a * a, k, b * b)],
      [
        I18N.tx(`Merkez (${h}, ${k}); yatay yarıeksen ${a}, dikey yarıeksen ${b}.`, `Centre (${h}, ${k}); horizontal semi-axis ${a}, vertical semi-axis ${b}.`),
        `x: ${h} ± ${a} → ${I(h, a)}`,
        `y: ${k} ± ${b} → ${I(k, b)}`,
      ],
      rng,
      [
        I18N.tx('Yarıeksenleri karıştırmışsın; x için x-paydasının karekökü, y için y-paydasının karekökü kullanılır.', 'You swapped the semi-axes; use the root of the x-denominator for x and of the y-denominator for y.'),
        I18N.tx('Merkezi (0, 0) almışsın; elips (h, k) merkezlidir ve aralıklar kayar.', 'You took the centre as (0, 0); the ellipse is centred at (h, k) so the intervals shift.'),
        I18N.tx('Merkezin koordinatlarını yer değiştirmişsin (h ile k karışmış).', 'You swapped the centre coordinates (h and k mixed up).'),
        I18N.tx('Paydaları (a², b²) doğrudan yarıeksen sanmışsın; yarıeksenler bunların karekökleridir.', 'You used the denominators (a², b²) as semi-axes; the semi-axes are their square roots.'),
      ]
    );
  }

  function fxFloorHalf(rng) {
    const n = rng.nextInt(-5, 6);
    const fr = (num) => ivFrac(num, 2).replace(/^-/, '−');
    return makeQuestion(
      I18N.tx('Tam değer fonksiyonu', 'Floor function'),
      I18N.tx(`⌊2x⌋ = ${n} eşitliğini sağlayan x değerleri hangi aralıktadır?`, `For which x does ⌊2x⌋ = ${n} hold?`),
      `[${fr(n)}, ${fr(n + 1)})`,
      [`[${nm(2 * n)}, ${nm(2 * n + 2)})`, `[${nm(n)}, ${nm(n + 1)})`, `(${fr(n)}, ${fr(n + 1)}]`, `[${fr(n - 1)}, ${fr(n)})`],
      [
        `⌊2x⌋ = ${n} ⇔ ${n} ≤ 2x < ${n + 1}`,
        I18N.tx(`Her tarafı 2'ye böl: ${ivFrac(n, 2)} ≤ x < ${ivFrac(n + 1, 2)}.`, `Divide by 2: ${ivFrac(n, 2)} ≤ x < ${ivFrac(n + 1, 2)}.`),
      ],
      rng,
      [
        I18N.tx("2 ile çarpmışsın; eşitsizlik 2x için yazıldı, x'e geçmek için 2'ye BÖLMEK gerekir.", 'You multiplied by 2; the inequality is for 2x, so divide by 2 to get x.'),
        I18N.tx("2x yerine x'i almışsın (⌊x⌋ = n aralığı); 2 katsayısını hesaba kat.", 'You solved ⌊x⌋ = n instead; take the factor 2 into account.'),
        I18N.tx('Uç noktaların dahil/dışlanma durumunu ters almışsın: sol uç dahil, sağ uç değil.', 'You reversed the endpoint conventions: left endpoint included, right excluded.'),
        I18N.tx('Aralığı bir basamak sola kaydırmışsın (bu ⌊2x⌋ = n − 1 aralığıdır).', 'You shifted the interval one step left (that is ⌊2x⌋ = n − 1).'),
      ]
    );
  }

  // Difficulty levels (1 = easy, 2 = medium, 3 = hard) used only by the printable exam-set builder; never shown to students.
  fxEval.level = 1; fxDomSqrt.level = 1; fxDomRat.level = 1; fxEvenOdd.level = 1; fxExp.level = 1; fxReflect.level = 1; fxVertLine.level = 1; ivGivenPoint.level = 1;
  fxComp.level = 2; fxInverse.level = 2; fxVertex.level = 2; fxShift.level = 2; fxRoots.level = 2; fxPiece.level = 2; fxFloor.level = 2; fxEllipse.level = 2;
  ivLinEval.level = 2; ivFormulaSimple.level = 2; ivWhichOne.level = 2; ivGraphTest.level = 2; ivRestrict.level = 2; ivComposition.level = 2;
  ivFormulaAdv.level = 3; ivDomRange.level = 3; ivTrap.level = 3;
  fxRangeAbs.level = 1; fxFloorEq.level = 1; fxInvExpVal.level = 1;
  fxCompFormula.level = 2; fxModelRect.level = 2; fxEvenOddCombo.level = 2; fxMonotony.level = 2;
  fxDomRatSqrt.level = 3; fxDomSqrtRatio.level = 3; fxLogDomain.level = 3; fxComp3.level = 3; fxInvExp.level = 3; fxInvRat.level = 3; fxTransPoint.level = 3;
  fxTransPoly.level = 3; fxPieceCont.level = 3; fxPieceNested.level = 3; fxInvRestricted.level = 3; fxEllipseRange.level = 3; fxFloorHalf.level = 3;

  const EXAM_EXTRA = [
    fxRangeAbs, fxFloorEq, fxInvExpVal,
    fxCompFormula, fxModelRect, fxEvenOddCombo, fxMonotony,
    fxDomRatSqrt, fxDomSqrtRatio, fxLogDomain, fxComp3, fxInvExp, fxInvRat, fxTransPoint,
    fxTransPoly, fxPieceCont, fxPieceNested, fxInvRestricted, fxEllipseRange, fxFloorHalf,
  ];

  const GENERATORS = [
    fxEval, fxComp, fxDomSqrt, fxDomRat, fxEvenOdd,
    fxInverse, fxVertex, fxShift, fxRoots, fxPiece, fxExp,
    fxFloor, fxEllipse, fxReflect, fxVertLine,
    ivLinEval, ivFormulaSimple, ivFormulaAdv, ivWhichOne, ivGraphTest,
    ivRestrict, ivDomRange, ivGivenPoint, ivComposition, ivTrap,
  ];

  Topics.register('functions', { type: 'quiz', tabTitle: () => I18N.tx('Sınav (Quiz)', 'Quiz'), generators: GENERATORS });

  // Printable exam-set pool: the quiz generators plus extra exam-only ones; each has a numeric .level (1-3).
  window.ExamPools = window.ExamPools || {};
  window.ExamPools.functions = GENERATORS.concat(EXAM_EXTRA);
})();
