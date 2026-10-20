// Ported from Modules/Functions/FnTabs2.vb - MonotonyParityControl ("5) Artan/Azalan, Tek/Çift").
(function () {
  const N2 = fmt2; // mirrors VB N2 (":0.##")
  function sg(v) { // mirrors VB Sg: "+ 3" / "- 3"
    return v >= 0 ? `+ ${N2(v)}` : `- ${N2(Math.abs(v))}`;
  }

  function createProblem(rng) {
    return {
      kind: rng.nextInt(0, 7),
      h: rng.nextInt(0, 3) === 0 ? rng.nextInt(-2, 3) : 0,
    };
  }

  function base(kind, x) {
    switch (kind) {
      case 0: return x * x;
      case 1: return x * x * x;
      case 2: return Math.abs(x);
      case 3: return x === 0 ? NaN : 1.0 / x;
      case 4: return x * x * x - 3 * x;
      case 5: return x * x + x;
      default: return x === 0 ? NaN : 1.0 / (x * x);
    }
  }

  function name0(kind) {
    return ['x²', 'x³', '|x|', '1/x', 'x³ - 3x', 'x² + x', '1/x²'][kind];
  }

  // 0 = even, 1 = odd, 2 = neither (for the UNSHIFTED base function).
  function baseParity(kind) {
    if (kind === 0 || kind === 2 || kind === 6) return 0;
    if (kind === 1 || kind === 3 || kind === 4) return 1;
    return 2;
  }

  function parity(p) {
    return p.h === 0 ? baseParity(p.kind) : 2;
  }

  // Increasing and decreasing intervals as [xMin, xMax] pairs, with ±9 standing for ∞.
  function intervals(p, inc, dec) {
    const h = p.h;
    switch (p.kind) {
      case 0:
      case 2:
        dec.push([-9, h]); inc.push([h, 9]);
        break;
      case 1:
        inc.push([-9, 9]);
        break;
      case 3:
        dec.push([-9, h - 0.05]); dec.push([h + 0.05, 9]);
        break;
      case 4:
        inc.push([-9, h - 1]); dec.push([h - 1, h + 1]); inc.push([h + 1, 9]);
        break;
      case 5:
        dec.push([-9, h - 0.5]); inc.push([h - 0.5, 9]);
        break;
      default:
        inc.push([-9, h - 0.05]); dec.push([h + 0.05, 9]);
        break;
    }
  }

  function intervalText(list) {
    if (list.length === 0) return I18N.tx('yok', 'none');
    return list.map((r) => {
      const left = r[0] <= -8.9 ? '(-∞' : '[' + N2(r[0]);
      const right = r[1] >= 8.9 ? '∞)' : N2(r[1]) + ']';
      return `${left}, ${right}`;
    }).join(' ∪ ');
  }

  function G(p, x) {
    return base(p.kind, x - p.h);
  }

  function fxText(p) { // mirrors VB FxText
    return p.h === 0 ? name0(p.kind) : name0(p.kind).split('x').join(`(x ${sg(-p.h)})`);
  }

  function solveSteps(p) {
    const fx = fxText(p);
    const steps = [I18N.tx(`Verilen fonksiyon: f(x) = ${fx}`, `Given function: f(x) = ${fx}`)];
    const x0 = 1.5;
    const a = G(p, -x0), b = G(p, x0);
    steps.push(I18N.tx(
      `Önce sayısal bir deneme yapalım (x = ${N2(x0)}): f(${N2(x0)}) = ${N2(b)},  f(${N2(-x0)}) = ${N2(a)}`,
      `First a numeric check (x = ${N2(x0)}): f(${N2(x0)}) = ${N2(b)},  f(${N2(-x0)}) = ${N2(a)}`
    ));
    switch (parity(p)) {
      case 0:
        steps.push(I18N.tx('f(-x) = f(x) → ÇİFT fonksiyon, y eksenine göre simetrik.', 'f(-x) = f(x) → EVEN function, symmetric about the y-axis.'));
        break;
      case 1:
        steps.push(I18N.tx('f(-x) = -f(x) → TEK fonksiyon, orijine göre simetrik.', 'f(-x) = -f(x) → ODD function, symmetric about the origin.'));
        break;
      default:
        steps.push(p.h !== 0
          ? I18N.tx(`Grafik ${p.h} birim kaydırıldığı için ne f(-x) = f(x) ne de f(-x) = -f(x): ikisi de DEĞİL.`, `Because the graph is shifted by ${p.h}, neither f(-x) = f(x) nor f(-x) = -f(x): NEITHER.`)
          : I18N.tx('f(-x), ne f(x) ne de -f(x) ile aynı: ikisi de DEĞİL.', 'f(-x) equals neither f(x) nor -f(x): NEITHER even nor odd.'));
        break;
    }
    const inc = [], dec = [];
    intervals(p, inc, dec);
    steps.push(I18N.tx(`Artan olduğu aralıklar: ${intervalText(inc)}`, `Increasing on: ${intervalText(inc)}`));
    steps.push(I18N.tx(`Azalan olduğu aralıklar: ${intervalText(dec)}`, `Decreasing on: ${intervalText(dec)}`));
    return steps;
  }

  function draw(canvas, p) {
    canvas.setViewport(-6, 6, -6, 6);
    const inc = [], dec = [];
    intervals(p, inc, dec);
    for (const r of inc) {
      canvas.addRegion({ xMin: r[0], xMax: r[1], color: canvas._withAlpha(canvas.green(), 0.18) });
    }
    for (const r of dec) {
      canvas.addRegion({ xMin: r[0], xMax: r[1], color: canvas._withAlpha(canvas.red(), 0.18) });
    }
    canvas.addFunction({ evaluator: (x) => G(p, -x), color: canvas.orange(), thickness: 2, dashed: true });
    canvas.addFunction({ evaluator: (x) => -G(p, x), color: canvas.purple(), thickness: 2, dashed: true });
    canvas.addFunction({ evaluator: (x) => G(p, x), color: canvas.accent(), thickness: 3 });
  }

  Topics.register('functions', {
    id: 'monotonyParity',
    problemStatement: (p) => I18N.tx(
      `f(x) = ${fxText(p)} fonksiyonu tek mi çift mi yoksa ikisi de değil mi? f(-x) değerine bakarak birlikte anlayalım. Artan ve azalan olduğu aralıkları da bulalım.`,
      `Is f(x) = ${fxText(p)} even, odd or neither? Let's see it by computing f(-x), and then find the intervals where it is increasing and decreasing.`),
    tabTitle: () => I18N.tx('Artan/Azalan, Tek/Çift', 'Increasing/Decreasing, Even/Odd'),
    concept: () => I18N.tx(
      "MONOTONLUK\n" +
      "• ARTAN: x₁ < x₂ iken f(x₁) < f(x₂) (grafik soldan sağa yükselir). AZALAN: x₁ < x₂ iken f(x₁) > f(x₂).\n" +
      "• Bir fonksiyon bazı aralıklarda artan, bazılarında azalan olabilir: x² için (-∞, 0] azalan, [0, ∞) artandır; tüm ℝ'de monoton değildir.\n" +
      "• Türevle (ileride): f'(x) > 0 → artan, f'(x) < 0 → azalan.\n" +
      "• Artan ya da azalan fonksiyon bire-birdir (ters fonksiyonu vardır).\n" +
      "\n" +
      "ÇİFT VE TEK FONKSİYON\n" +
      "• ÇİFT: f(-x) = f(x); grafik y eksenine göre simetrik (x², |x|, cos x).\n" +
      "• TEK: f(-x) = -f(x); grafik orijine göre simetrik (x³, x, sin x). Tek ve x = 0'da tanımlıysa f(0) = 0.\n" +
      "\n" +
      "TEST (YÖNTEM)\n" +
      "1. Tanım kümesi 0'a göre simetrik mi? Değilse (örn. √x) fonksiyon ne çift ne tek.\n" +
      "2. f(-x) hesaplanır (x yerine -x yazılıp sadeleştirilir).\n" +
      "3. f(x) ile aynıysa ÇİFT; -f(x) ile aynıysa TEK; hiçbiri değilse İKİSİ DE DEĞİL denir.\n" +
      "\n" +
      "İŞLEM KURALLARI\n" +
      "çift·çift = çift, tek·tek = çift, çift·tek = tek; çift + çift = çift, tek + tek = tek; çift + tek (ikisi de sıfır değilse) = ne çift ne tek. Her f = çift kısım (f(x) + f(-x))/2 + tek kısım (f(x) - f(-x))/2.\n" +
      "\n" +
      "MİNİ ÖRNEK\n" +
      "f(x) = x⁴ - 3x²: f(-x) = x⁴ - 3x² = f(x) → ÇİFT.\n" +
      "g(x) = x³ + x: g(-x) = -x³ - x = -g(x) → TEK.\n" +
      "h(x) = x² + x: h(-x) = x² - x; ne h ne -h → İKİSİ DE DEĞİL.\n" +
      "\n" +
      "MÜHENDİSLİKTE: simetri işi yarıya indirir (simetrik yüklü kiriş, yalnızca kosinüs ya da yalnızca sinüs terimli Fourier serileri).\n" +
      "\n" +
      "NOTLAR\n" +
      "• Kaydırma simetriyi bozar: (x - 1)² ne çift ne tek (f(-x) = (x + 1)²).\n" +
      "• Grafikte turuncu kesikli eğri f(-x), mor kesikli eğri -f(x)'tir; biri f ile çakışıyorsa simetri vardır.\n" +
      "• Yeşil bantlar artan, kırmızı bantlar azalan aralıkları gösterir.",
      "MONOTONICITY\n" +
      "• INCREASING: x₁ < x₂ gives f(x₁) < f(x₂) (the graph rises left to right). DECREASING: x₁ < x₂ gives f(x₁) > f(x₂).\n" +
      "• A function can increase on some intervals and decrease on others: x² decreases on (-∞, 0] and increases on [0, ∞); it is not monotone on all of ℝ.\n" +
      "• With derivatives (later): f'(x) > 0 → increasing, f'(x) < 0 → decreasing.\n" +
      "• An increasing or decreasing function is one-to-one (it has an inverse).\n" +
      "\n" +
      "EVEN AND ODD FUNCTIONS\n" +
      "• EVEN: f(-x) = f(x); the graph is symmetric about the y-axis (x², |x|, cos x).\n" +
      "• ODD: f(-x) = -f(x); the graph is symmetric about the origin (x³, x, sin x). If odd and defined at x = 0, then f(0) = 0.\n" +
      "\n" +
      "TEST (METHOD)\n" +
      "1. Is the domain symmetric about 0? If not (e.g. √x) the function is neither even nor odd.\n" +
      "2. Compute f(-x) (replace x by -x and simplify).\n" +
      "3. Equal to f(x) → EVEN; equal to -f(x) → ODD; neither → NEITHER.\n" +
      "\n" +
      "ARITHMETIC RULES\n" +
      "even·even = even, odd·odd = even, even·odd = odd; even + even = even, odd + odd = odd; even + odd (both nonzero) = neither. Every f = even part (f(x) + f(-x))/2 + odd part (f(x) - f(-x))/2.\n" +
      "\n" +
      "MINI EXAMPLE\n" +
      "f(x) = x⁴ - 3x²: f(-x) = x⁴ - 3x² = f(x) → EVEN.\n" +
      "g(x) = x³ + x: g(-x) = -x³ - x = -g(x) → ODD.\n" +
      "h(x) = x² + x: h(-x) = x² - x; neither h nor -h → NEITHER.\n" +
      "\n" +
      "IN ENGINEERING: symmetry halves the work (symmetrically loaded beams, Fourier series with only cosine or only sine terms).\n" +
      "\n" +
      "NOTES\n" +
      "• A shift destroys symmetry: (x - 1)² is neither even nor odd (f(-x) = (x + 1)²).\n" +
      "• On the graph the orange dashed curve is f(-x) and the purple dashed curve is -f(x); if one coincides with f the symmetry holds.\n" +
      "• Green bands are increasing, red bands decreasing intervals."
    ),
    createProblem,
    links: [
      { match: /^• (ARTAN|INCREASING):/, make: (rng) => FnKit.until(createProblem, rng, (p) => [1,5].includes(p.kind)) },
      { match: /^• (Bir fonksiyon bazı|A function can increase)/, make: (rng) => FnKit.until(createProblem, rng, (p) => [0,2,4].includes(p.kind)) },
      { match: /^• (Türevle|With derivatives)/, make: (rng) => FnKit.until(createProblem, rng, (p) => [4,5].includes(p.kind)) },
      { match: /^• (Artan ya da azalan fonksiyon|An increasing or decreasing function)/, make: (rng) => FnKit.until(createProblem, rng, (p) => [1].includes(p.kind)) },
      { match: /^• (ÇİFT|EVEN):/, make: (rng) => FnKit.until(createProblem, rng, (p) => [0,2,6].includes(p.kind) && p.h === 0) },
      { match: /^• (TEK|ODD):/, make: (rng) => FnKit.until(createProblem, rng, (p) => [1,3,4].includes(p.kind) && p.h === 0) },
      { match: /^1\. (Tanım kümesi 0|Is the domain symmetric)/, make: (rng) => FnKit.until(createProblem, rng, (p) => [3,6].includes(p.kind) && p.h === 0) },
      { match: /^(çift·çift|even·even)/, make: (rng) => FnKit.until(createProblem, rng, (p) => [5].includes(p.kind) && p.h === 0) },
      { match: /^• (Kaydırma simetriyi|A shift destroys)/, make: (rng) => FnKit.until(createProblem, rng, (p) => [0,1,2,4].includes(p.kind) && p.h !== 0) },
    ],
    solveSteps,
    draw,
    focus: (p) => ({ x: p.h, y: 0 }),
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({
        caption: I18N.tx('h (yatay kaydırma)', 'h (horizontal shift)'),
        min: -3, max: 3,
        get: () => getProblem().h,
        set: (v) => { getProblem().h = Math.round(v); },
      });
    },
  });
})();
