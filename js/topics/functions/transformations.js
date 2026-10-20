// Ported from Modules/Functions/FnTabs3.vb (TransformationsControl) - shifting, scaling and
// reflecting y = f(x): y = s_y·c·f(s_x·d·(x + h)) + k. The dashed curve is the original f(x).
(function () {
  // Local FnKit-style helpers (Sg/Suffix are not part of the shared FnKit port, so they live here).
  function sg(v) { return v >= 0 ? `+ ${fmt2(v)}` : `- ${fmt2(Math.abs(v))}`; }
  function suffix(v) { return Math.abs(v) < 0.0000001 ? '' : ' ' + sg(v); }

  // 0 = random; 1 = slide example (a); 2 = slide example (b). Consumed by createProblem.
  let preset = 0;

  function createProblem(rng) {
    if (preset === 1) { preset = 0; return { base: 6, k: 0, h: 0, c: 1, d: 2, sy: 1, sx: -1 }; }
    if (preset === 2) { preset = 0; return { base: 6, k: 0, h: 0, c: 0.5, d: 1, sy: -1, sx: 1 }; }
    const p = { base: rng.nextInt(0, 7), k: 0, h: 0, c: 1, d: 1, sy: 1, sx: 1 };
    const picks = rng.nextInt(2, 4);
    for (let i = 1; i <= picks; i++) {
      switch (rng.nextInt(0, 6)) {
        case 0: p.k = rng.nextInt(1, 4) * (rng.nextInt(0, 2) === 0 ? 1 : -1); break;
        case 1: p.h = rng.nextInt(1, 4) * (rng.nextInt(0, 2) === 0 ? 1 : -1); break;
        case 2: p.c = [0.5, 2, 3][rng.nextInt(0, 3)]; break;
        case 3: p.d = [0.5, 2][rng.nextInt(0, 2)]; break;
        case 4: p.sy = -1; break;
        default: p.sx = -1; break;
      }
    }
    return p;
  }

  // Link helper: one base function with exactly one transformation applied.
  function single(rng, mod) {
    const p = { base: rng.nextInt(0, 7), k: 0, h: 0, c: 1, d: 1, sy: 1, sx: 1 };
    mod(p);
    return p;
  }

  function baseF(kind, x) {
    switch (kind) {
      case 0: return x * x;
      case 1: return Math.abs(x);
      case 2: return x >= 0 ? Math.sqrt(x) : NaN;
      case 3: return x * x * x;
      case 4: return Math.sin(x);
      case 5: return x === 0 ? NaN : 1.0 / x;
      default: return x * x * x * x - 4 * x * x * x + 10;
    }
  }

  const BASE_NAMES = ['x²', '|x|', '√x', 'x³', 'sin x', '1/x', 'x⁴ - 4x³ + 10'];

  function g(p, x) {
    return p.sy * p.c * baseF(p.base, p.sx * p.d * (x + p.h)) + p.k;
  }

  function formula(p) {
    let inner = Math.abs(p.h) < 0.0000001 ? 'x' : `(x ${sg(p.h)})`;
    if (Math.abs(p.d - 1) > 0.0000001) inner = `${fmt2(p.d)}·${inner}`;
    if (p.sx < 0) inner = '-' + inner;
    let outer = 'f(' + inner + ')';
    if (Math.abs(p.c - 1) > 0.0000001) outer = `${fmt2(p.c)}·${outer}`;
    if (p.sy < 0) outer = '-' + outer;
    return 'y = ' + outer + suffix(p.k);
  }

  // ---------------- small polynomial helper (coefficient arrays, index = power) ----------------
  function basePoly(kind) {
    switch (kind) {
      case 0: return [0, 0, 1];
      case 3: return [0, 0, 0, 1];
      case 6: return [10, 0, 0, -4, 1];
      default: return null;
    }
  }
  function polyMul(a, b) {
    const r = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) r[i + j] += a[i] * b[j];
    return r;
  }
  function polyPow(u, n) {
    let r = [1];
    for (let i = 1; i <= n; i++) r = polyMul(r, u);
    return r;
  }
  function sup(n) { return n <= 1 ? '' : n === 2 ? '²' : n === 3 ? '³' : n === 4 ? '⁴' : '^' + n; }
  function n4(v) { let r = Math.round(v * 10000) / 10000; if (r === 0) r = 0; return String(r); }
  function joinTerms(isNeg, terms) {
    if (terms.length === 0) return '0';
    let sb = '';
    for (let i = 0; i < terms.length; i++) {
      sb += i === 0 ? (isNeg[i] ? '-' : '') : (isNeg[i] ? ' - ' : ' + ');
      sb += terms[i];
    }
    return sb;
  }
  function polyStr(c) {
    const neg = [], terms = [];
    for (let i = c.length - 1; i >= 0; i--) {
      const v = Math.round(c[i] * 1e6) / 1e6;
      if (Math.abs(v) < 0.0000005) continue;
      const a = Math.abs(v);
      const coef = (i > 0 && Math.abs(a - 1) < 0.0000005) ? '' : n4(a);
      neg.push(v < 0);
      terms.push(coef + (i === 0 ? '' : 'x' + sup(i)));
    }
    return joinTerms(neg, terms);
  }
  function substStr(c, uStr) {
    const neg = [], terms = [];
    const wrapped = uStr === 'x' ? 'x' : '(' + uStr + ')';
    for (let i = c.length - 1; i >= 0; i--) {
      if (Math.abs(c[i]) < 0.0000005) continue;
      const a = Math.abs(c[i]);
      const coef = (i > 0 && Math.abs(a - 1) < 0.0000005) ? '' : n4(a);
      neg.push(c[i] < 0);
      terms.push(coef + (i === 0 ? '' : wrapped + sup(i)));
    }
    return joinTerms(neg, terms);
  }
  function innerStr(p) {
    const a = p.sx * p.d;
    const hasH = Math.abs(p.h) > 0.0000001;
    const core = hasH ? 'x ' + sg(p.h) : 'x';
    if (Math.abs(a - 1) < 0.0000001) return core;
    const aTxt = Math.abs(a + 1) < 0.0000001 ? '-' : fmt2(a);
    return hasH ? aTxt + '(' + core + ')' : aTxt + 'x';
  }
  function factorStr(m) {
    for (let d = 2; d <= 8; d++) {
      const n = Math.round(m * d);
      if (n !== 0 && Math.abs(m * d - n) < 0.000001 && Math.abs(n) % d !== 0) return '(' + n + '/' + d + ')';
    }
    return m < 0 ? '(' + n4(m) + ')' : n4(m);
  }

  function polySteps(p) {
    const res = [];
    const bp = basePoly(p.base);
    if (!bp) return res;
    const a = p.sx * p.d;
    const m = p.sy * p.c;
    const hasK = Math.abs(p.k) > 0.0000001;
    const mIsOne = Math.abs(m - 1) < 0.0000001;
    const mIsMinusOne = Math.abs(m + 1) < 0.0000001;
    const uStr = innerStr(p);
    const fxStr = polyStr(bp);

    const u = [a * p.h, a];
    const fu = new Array(bp.length).fill(0);
    for (let i = 0; i < bp.length; i++) {
      if (bp[i] === 0) continue;
      const pw = polyPow(u, i);
      for (let j = 0; j < pw.length; j++) fu[j] += bp[i] * pw[j];
    }
    const fin = fu.map((v) => m * v);
    fin[0] += p.k;
    const finStr = polyStr(fin);

    const subst = substStr(bp, uStr);
    const outer = (mIsOne ? subst : mIsMinusOne ? '-(' + subst + ')' : factorStr(m) + '(' + subst + ')') + suffix(p.k);

    res.push(I18N.tx(
      `POLİNOM YAZILIŞI (slayttaki gibi): f(x) = ${fxStr}. ${uStr === 'x' ? 'x aynı kalır; dış çarpan ve kaydırma uygulanır' : 'x yerine ' + uStr + ' yazılır'}: y = ${outer}.`,
      `WRITING THE POLYNOMIAL OUT (as in the slides): f(x) = ${fxStr}. ${uStr === 'x' ? 'x stays the same; we apply the outer factor and shift' : 'Replace x by ' + uStr}: y = ${outer}.`));

    const pows = [];
    for (let i = bp.length - 1; i >= 2; i--) {
      if (bp[i] === 0 || uStr === 'x') continue;
      pows.push(`(${uStr})${sup(i)} = ${polyStr(polyPow(u, i))}`);
    }
    if (pows.length > 0) {
      res.push(I18N.tx('Önce kuvvetleri açalım: ' + pows.join(';  ') + '.', 'First, let\'s expand the powers: ' + pows.join(';  ') + '.'));
    }

    if (uStr !== 'x' && (!mIsOne || hasK)) {
      const fuStr = polyStr(fu);
      const pre = mIsOne ? '' : factorStr(m) + '·';
      res.push(I18N.tx(
        `Şimdi katsayıları toplayalım: f(${uStr}) = ${fuStr}. Sonra dış çarpan ve kaydırma uygulanır: y = ${pre}(${fuStr})${suffix(p.k)}.`,
        `Now let\'s collect the terms: f(${uStr}) = ${fuStr}. Then apply the outer factor and shift: y = ${pre}(${fuStr})${suffix(p.k)}.`));
    }
    res.push(I18N.tx(`SADELEŞTİRİLMİŞ SONUÇ: y = ${finStr}`, `SIMPLIFIED RESULT: y = ${finStr}`));
    return res;
  }

  function problemStatement(p) {
    const tr = [], en = [];
    if (Math.abs(p.d - 1) > 0.0000001) {
      if (p.d > 1) { tr.push(`yatay olarak ${fmt2(p.d)} kat sıkıştırıp`); en.push(`compress it horizontally by a factor of ${fmt2(p.d)}`); }
      else { tr.push(`yatay olarak ${fmt2(1 / p.d)} kat uzatıp`); en.push(`stretch it horizontally by a factor of ${fmt2(1 / p.d)}`); }
    }
    if (p.sx < 0) { tr.push('y eksenine göre yansıtıp'); en.push('reflect it across the y-axis'); }
    if (Math.abs(p.c - 1) > 0.0000001) {
      if (p.c > 1) { tr.push(`dikey olarak ${fmt2(p.c)} kat uzatıp`); en.push(`stretch it vertically by a factor of ${fmt2(p.c)}`); }
      else { tr.push(`dikey olarak ${fmt2(1 / p.c)} kat sıkıştırıp`); en.push(`compress it vertically by a factor of ${fmt2(1 / p.c)}`); }
    }
    if (p.sy < 0) { tr.push('x eksenine göre yansıtıp'); en.push('reflect it across the x-axis'); }
    if (Math.abs(p.h) > 0.0000001) {
      tr.push(`yatayda ${fmt2(Math.abs(p.h))} birim ${p.h > 0 ? 'sola' : 'sağa'} kaydırıp`);
      en.push(`shift it ${fmt2(Math.abs(p.h))} units ${p.h > 0 ? 'left' : 'right'}`);
    }
    if (Math.abs(p.k) > 0.0000001) {
      tr.push(`dikeyde ${fmt2(Math.abs(p.k))} birim ${p.k > 0 ? 'yukarı' : 'aşağı'} kaydırıp`);
      en.push(`shift it ${fmt2(Math.abs(p.k))} units ${p.k > 0 ? 'up' : 'down'}`);
    }
    const fx = BASE_NAMES[p.base];
    if (tr.length === 0) {
      return I18N.tx(`f(x) = ${fx} grafiğine hiçbir dönüşüm uygulanmazsa denklem ne olur? (Kaydırıcıları oynatarak bir dönüşüm seçebiliriz.)`,
        `What is the equation of the graph of f(x) = ${fx} when no transformation is applied? (We can move the sliders to choose one.)`);
    }
    // VB trims the trailing suffix; here the final participle is kept so the Turkish sentence stays grammatical.
    const trText = tr.join(' ') + ' elde edilen grafiğin denklemini yazalım.';
    const enText = en.length === 1 ? en[0] : en.slice(0, -1).join(', ') + ' and then ' + en[en.length - 1];
    return I18N.tx(`f(x) = ${fx} grafiğini ${trText}`, `Let\'s write the equation of the graph obtained from f(x) = ${fx} when we ${enText}.`);
  }

  function solveSteps(p) {
    const baseName = BASE_NAMES[p.base];
    const steps = [
      I18N.tx(`f(x) = ${baseName};  yeni grafik: ${formula(p)}`, `f(x) = ${baseName};  new graph: ${formula(p)}`),
    ];
    let any = false;
    if (Math.abs(p.h) > 0.0000001) {
      any = true;
      steps.push(p.h > 0
        ? I18N.tx(`x + ${fmt2(p.h)}: yatay kaydırma, ${fmt2(p.h)} birim SOLA.`, `x + ${fmt2(p.h)}: horizontal shift, ${fmt2(p.h)} units LEFT.`)
        : I18N.tx(`x - ${fmt2(-p.h)}: yatay kaydırma, ${fmt2(-p.h)} birim SAĞA.`, `x - ${fmt2(-p.h)}: horizontal shift, ${fmt2(-p.h)} units RIGHT.`));
    }
    if (Math.abs(p.d - 1) > 0.0000001) {
      any = true;
      steps.push(p.d > 1
        ? I18N.tx(`x'i ${fmt2(p.d)} ile çarpmak: yatay SIKIŞTIRMA (x'ler ${fmt2(p.d)} kat yaklaşır).`, `Multiplying x by ${fmt2(p.d)}: horizontal COMPRESSION (x-distances shrink by a factor ${fmt2(p.d)}).`)
        : I18N.tx(`x'i ${fmt2(p.d)} ile çarpmak: yatay UZATMA (x'ler ${fmt2(1 / p.d)} kat uzar).`, `Multiplying x by ${fmt2(p.d)}: horizontal STRETCH (x-distances grow by a factor ${fmt2(1 / p.d)}).`));
    }
    if (p.sx < 0) {
      any = true;
      steps.push(I18N.tx('f(-x): grafik y eksenine göre yansıtılır.', 'f(-x): the graph is reflected about the y-axis.'));
    }
    if (Math.abs(p.c - 1) > 0.0000001) {
      any = true;
      steps.push(p.c > 1
        ? I18N.tx(`${fmt2(p.c)}·f: dikey UZATMA (${fmt2(p.c)} kat).`, `${fmt2(p.c)}·f: vertical STRETCH (factor ${fmt2(p.c)}).`)
        : I18N.tx(`${fmt2(p.c)}·f: dikey SIKIŞTIRMA (${fmt2(p.c)} kat).`, `${fmt2(p.c)}·f: vertical COMPRESSION (factor ${fmt2(p.c)}).`));
    }
    if (p.sy < 0) {
      any = true;
      steps.push(I18N.tx('-f(x): grafik x eksenine göre yansıtılır.', '-f(x): the graph is reflected about the x-axis.'));
    }
    if (Math.abs(p.k) > 0.0000001) {
      any = true;
      steps.push(p.k > 0
        ? I18N.tx(`+ ${fmt2(p.k)}: dikey kaydırma, ${fmt2(p.k)} birim YUKARI.`, `+ ${fmt2(p.k)}: vertical shift, ${fmt2(p.k)} units UP.`)
        : I18N.tx(`- ${fmt2(-p.k)}: dikey kaydırma, ${fmt2(-p.k)} birim AŞAĞI.`, `- ${fmt2(-p.k)}: vertical shift, ${fmt2(-p.k)} units DOWN.`));
    }
    if (!any) {
      steps.push(I18N.tx('Hiçbir dönüşüm yok: grafik f(x) ile aynı. Kaydırıcıları oynatarak bir dönüşüm deneyebiliriz.', 'No transformation: the graph equals f(x). We can move the sliders to try one.'));
    }
    steps.push(...polySteps(p));
    steps.push(I18N.tx(
      'İpucu: yatay işlemler x\'in İÇİNDE, dikey işlemler f\'nin DIŞINDA olur; yatay olanlar ilk bakışta tersine görünür.',
      'Tip: horizontal changes happen INSIDE f, vertical ones OUTSIDE; horizontal effects look \'backwards\' at first.',
    ));
    return steps;
  }

  // Point we look at: image of the origin (-h, k); for the quartic, the image of its minimum (x = 3).
  function focusPoint(p) {
    if (p.base === 6) {
      const x = 3 / (p.sx * p.d) - p.h;
      return { x, y: g(p, x) };
    }
    return { x: -p.h, y: p.k };
  }

  function draw(canvas, p) {
    const fp = focusPoint(p);
    if (p.base === 6) {
      // Window sized from the sampled range of both curves (capped so a steep curve may leave the window).
      const xl = fp.x - 4.5, xr = fp.x + 4.5;
      let lo = 0, hi = 0;
      for (let i = 0; i <= 240; i++) {
        const x = xl + (xr - xl) * i / 240;
        for (const y0 of [baseF(p.base, x), g(p, x)]) {
          if (!isFinite(y0)) continue;
          const y = Math.max(-150, Math.min(150, y0));
          if (y < lo) lo = y;
          if (y > hi) hi = y;
        }
      }
      const pad = Math.max(2, (hi - lo) * 0.08);
      canvas.setViewport(xl, xr, lo - pad, hi + pad);
    } else {
      canvas.setViewport(-8, 8, -6, 6);
    }
    canvas.addFunction({ evaluator: (x) => baseF(p.base, x), color: canvas.gray(), thickness: 2.0, dashed: true });
    canvas.addFunction({ evaluator: (x) => g(p, x), color: canvas.accent(), thickness: 3.0 });
  }

  Topics.register('functions', {
    id: 'transformations',
    tabTitle: () => I18N.tx('Kaydırma, Ölçekleme, Yansıtma', 'Shifting, Scaling, Reflecting'),
    concept: () => I18N.tx(
      "YENİ GRAFİKLER y = f(x)'ten\n" +
      "• DİKEY KAYDIRMA y = f(x) + k (k > 0 yukarı, k < 0 aşağı).\n" +
      "• YATAY KAYDIRMA y = f(x + h) (h > 0 SOLA, h < 0 SAĞA; örn. y = (x - 2)² grafiği 2 birim sağa kayar).\n" +
      "• DİKEY ÖLÇEKLEME y = c·f(x) (c > 1 uzatır, 0 < c < 1 sıkıştırır).\n" +
      "• YATAY ÖLÇEKLEME y = f(d·x) (d > 1 yatay SIKIŞTIRIR, 0 < d < 1 yatay UZATIR).\n" +
      "• YANSITMA: y = -f(x) x eksenine göre, y = f(-x) y eksenine göre yansıtır.\n" +
      "• Hepsi birden: y = s·c·f(t·d·(x + h)) + k. Kesikli eğri asıl f(x)'tir.\n" +
      "\n" +
      "ÖZET: dikey = f'nin DIŞINDA (c·f(x)); yatay = f'nin İÇİNDE (f(c·x)); yatay etkiler sayının düşündürdüğünün TERSİDİR (f(2x) sıkıştırır, f(x/2) uzatır). İŞLEM SIRASI: önce ölçekle/yansıt, sonra kaydır. Yatay kaydırma ölçekten ÖNCE x'e uygulanır; bu yüzden y = c·f(d·(x + h)) + k yazabilir ve h'yi ölçeklenmiş grafiğin kayması olarak okuyabiliriz.\n" +
      "\n" +
      "NOKTA TAŞIMA YÖNTEMİ\n" +
      "1. İçteki ifadeyi çarpanlara ayıralım: f(2x - 6) → f(2(x - 3)) (kayma 3 olur, 6 değil).\n" +
      "2. f'nin bilinen birkaç noktasını (a, b) seçelim (köşe, kesim noktaları).\n" +
      "3. y = c·f(d(x + h)) + k altında her nokta ((a/d) - h, c·b + k) noktasına gider.\n" +
      "4. Noktaları birleştirip kesikli f ile karşılaştıralım.\n" +
      "\n" +
      "MİNİ ÖRNEK\n" +
      "y = -2√(x - 3) + 1, temel f(x) = √x: sağa 3, x eksenine yansıtma, dikeyde 2 kat uzatma, yukarı 1. (0,0) → (3,1); (1,1) → (4,-1); (4,2) → (7,-3).\n" +
      "\n" +
      "EK: |f(x)| grafiğin x ekseninin altındaki kısmını yukarı katlar; f(|x|) sağ yarıyı sola yansıtır ve y eksenine göre simetrik yapar.\n" +
      "\n" +
      "İPUÇLARI\n" +
      "• Önce çarpan, sonra kayma: f(2x - 6) için kayma 3 birimdir.\n" +
      "• Yatay yönde etkiler 'ters' çalışır: f(-x) yatay yansıma, f(x/2) yatay genişleme.\n" +
      "• Her adımı kesikli asıl f ile karşılaştırarak kontrol edebiliriz.",
      "NEW GRAPHS FROM y = f(x)\n" +
      "• VERTICAL SHIFT y = f(x) + k (k > 0 up, k < 0 down).\n" +
      "• HORIZONTAL SHIFT y = f(x + h) (h > 0 shifts LEFT, h < 0 shifts RIGHT; e.g. the graph of y = (x - 2)² is shifted 2 units right).\n" +
      "• VERTICAL SCALING y = c·f(x) (c > 1 stretches, 0 < c < 1 compresses).\n" +
      "• HORIZONTAL SCALING y = f(d·x) (d > 1 COMPRESSES horizontally, 0 < d < 1 STRETCHES horizontally).\n" +
      "• REFLECTION: y = -f(x) reflects about the x-axis, y = f(-x) about the y-axis.\n" +
      "• All together: y = s·c·f(t·d·(x + h)) + k. The dashed curve is the original f(x).\n" +
      "\n" +
      "CHEAT SHEET: vertical = OUTSIDE f (c·f(x)); horizontal = INSIDE f (f(c·x)); horizontal effects are OPPOSITE to what the number suggests (f(2x) compresses, f(x/2) stretches). ORDER: scale/reflect first, then shift. The horizontal shift is applied to x BEFORE the scaling is read, so we can write y = c·f(d·(x + h)) + k and read h as a shift of the already-scaled graph.\n" +
      "\n" +
      "POINT-MOVING METHOD\n" +
      "1. Let\'s factor the inside: f(2x - 6) → f(2(x - 3)) (the shift is 3, not 6).\n" +
      "2. We pick a few known points (a, b) of f (vertex, intercepts).\n" +
      "3. Under y = c·f(d(x + h)) + k each point moves to ((a/d) - h, c·b + k).\n" +
      "4. We join the points and compare with the dashed f.\n" +
      "\n" +
      "MINI EXAMPLE\n" +
      "y = -2√(x - 3) + 1, base f(x) = √x: right 3, reflect in the x-axis, stretch 2 vertically, up 1. (0,0) → (3,1); (1,1) → (4,-1); (4,2) → (7,-3).\n" +
      "\n" +
      "EXTRA: |f(x)| folds the part of the graph below the x-axis upward; f(|x|) copies the right half to the left, making it symmetric about the y-axis.\n" +
      "\n" +
      "GOOD TO KNOW\n" +
      "• Factor first, then read the shift: f(2x - 6) shifts by 3.\n" +
      "• Horizontal effects work 'backwards': f(-x) is a horizontal reflection, f(x/2) a horizontal stretch.\n" +
      "• It helps to check every step against the dashed original f."
    ),
    problemStatement,
    createProblem,
    links: [
      { match: /^• (DİKEY KAYDIRMA|VERTICAL SHIFT)/, make: (rng) => single(rng, (p) => { p.k = rng.nextInt(1, 4) * (rng.nextInt(0, 2) === 0 ? 1 : -1); }) },
      { match: /^• (YATAY KAYDIRMA|HORIZONTAL SHIFT)/, make: (rng) => single(rng, (p) => { p.h = rng.nextInt(1, 4) * (rng.nextInt(0, 2) === 0 ? 1 : -1); }) },
      { match: /^• (DİKEY ÖLÇEKLEME|VERTICAL SCALING)/, make: (rng) => single(rng, (p) => { p.c = [0.5, 2, 3][rng.nextInt(0, 3)]; }) },
      { match: /^• (YATAY ÖLÇEKLEME|HORIZONTAL SCALING)/, make: (rng) => single(rng, (p) => { p.d = [0.5, 2][rng.nextInt(0, 2)]; }) },
      { match: /^• (YANSITMA|REFLECTION):/, make: (rng) => single(rng, (p) => { if (rng.nextInt(0, 2) === 0) p.sy = -1; else p.sx = -1; }) },
      { match: /^• (Hepsi birden|All together):/, make: (rng) => createProblem(rng) },
    ],
    solveSteps,
    draw,
    focus: (p) => focusPoint(p),
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({
        caption: I18N.tx('k (dikey kaydırma)', 'k (vertical shift)'), min: -4, max: 4, step: 0.1,
        get: () => getProblem().k, set: (v) => { getProblem().k = Math.round(v * 10) / 10; },
      });
      h.addSlider({
        caption: I18N.tx('h (x + h: yatay kaydırma)', 'h (x + h: horizontal shift)'), min: -4, max: 4, step: 0.1,
        get: () => getProblem().h, set: (v) => { getProblem().h = Math.round(v * 10) / 10; },
      });
      h.addSlider({
        caption: I18N.tx('c (dikey ölçek)', 'c (vertical scale)'), min: 0.25, max: 3, step: 0.01,
        get: () => getProblem().c, set: (v) => { getProblem().c = Math.round(v * 100) / 100; },
      });
      h.addSlider({
        caption: I18N.tx('d (yatay ölçek)', 'd (horizontal scale)'), min: 0.25, max: 3, step: 0.01,
        get: () => getProblem().d, set: (v) => { getProblem().d = Math.round(v * 100) / 100; },
      });
      h.addSlider({
        caption: I18N.tx('x eksenine yansıtma (−1 = evet, +1 = hayır)', 'Reflect about x-axis (−1 = yes, +1 = no)'), min: -1, max: 1,
        get: () => getProblem().sy, set: (v) => { getProblem().sy = v < 0 ? -1 : 1; },
      });
      h.addSlider({
        caption: I18N.tx('y eksenine yansıtma (−1 = evet, +1 = hayır)', 'Reflect about y-axis (−1 = yes, +1 = no)'), min: -1, max: 1,
        get: () => getProblem().sx, set: (v) => { getProblem().sx = v < 0 ? -1 : 1; },
      });
      const head = document.createElement('div');
      head.style.fontWeight = 'bold';
      head.style.margin = '8px 0 4px';
      head.textContent = I18N.tx('Alıştırma ön ayarları (f = x⁴ - 4x³ + 10)', 'Practice presets (f = x⁴ - 4x³ + 10)');
      rightCol.appendChild(head);
      const mk = (tr, en, val) => {
        const b = document.createElement('button');
        b.className = 'flat-btn';
        b.textContent = I18N.tx(tr, en);
        b.addEventListener('click', () => { preset = val; h.regenerate(); });
        rightCol.appendChild(b);
      };
      mk('Slayt örneği (a): yatay 2 kat sıkıştırma + y eksenine yansıtma', 'Slide example (a): compress horizontally by 2 + reflect across the y-axis', 1);
      mk('Slayt örneği (b): dikey 2 kat sıkıştırma + x eksenine yansıtma', 'Slide example (b): compress vertically by 2 + reflect across the x-axis', 2);
    },
  });
})();
