// Ported from Modules/Functions/FnTabs2.vb - MathModelsControl ("6) Matematik Modeller ve Orantı").
(function () {
  const N2 = fmt2; // mirrors VB N2 (":0.##")

  function createProblem(rng) {
    const kind = rng.nextInt(0, 2);
    if (kind === 0) {
      return { kind: 0, k: rng.nextInt(2, 6), x1: rng.nextInt(1, 6), xq: rng.nextInt(6, 11), guess: 1 };
    }
    const xs = [4, 9, 16];
    const qs = [9, 16, 25, 36];
    const x1 = xs[rng.nextInt(0, 3)];
    let xq;
    do {
      xq = qs[rng.nextInt(0, 4)];
    } while (xq === x1);
    return { kind: 1, k: rng.nextInt(1, 5), x1, xq, guess: 1 };
  }

  // Link-only extra kinds: 2 inverse proportion y = k/x, 3 affine y = kx + b (b given), 4 exponential y = k*a^x (a given).
  function mkInverse(rng) {
    const xs = [1, 2, 4, 5, 10];
    const x1 = xs[rng.nextInt(0, xs.length)];
    let xq;
    do { xq = xs[rng.nextInt(0, xs.length)]; } while (xq === x1);
    return { kind: 2, k: rng.nextInt(1, 6), x1, xq, guess: 1 };
  }
  function mkAffine(rng) {
    const bs = [1, 2, 3, 4, -1, -2, -3];
    return { kind: 3, k: rng.nextInt(1, 6), b: bs[rng.nextInt(0, bs.length)], x1: rng.nextInt(1, 6), xq: rng.nextInt(6, 11), guess: 1 };
  }
  function mkExp(rng) {
    return { kind: 4, k: rng.nextInt(1, 6), a: rng.nextInt(2, 4), x1: rng.nextInt(0, 4), xq: rng.nextInt(4, 7), guess: 1 };
  }

  function G(kind, x, p) {
    switch (kind) {
      case 0: return x;
      case 2: return x <= 0 ? NaN : 1.0 / x;
      case 4: return Math.pow(p.a, x);
      case 3: return x;
      default: return Math.pow(x, 1.5);
    }
  }
  // Model value with multiplier c (the true k or the trial value); only the affine kind has an extra constant b.
  function M(p, c, x) {
    return c * G(p.kind, x, p) + (p.kind === 3 ? p.b : 0);
  }

  function solveSteps(p) {
    const y1 = M(p, p.k, p.x1);
    const yq = M(p, p.k, p.xq);
    const steps = [];
    if (p.kind === 2) {
      steps.push(I18N.tx(
        `Model: y = k/x (ters orantı). Bilinen veri: x = ${p.x1} iken y = ${N2(y1)}.`,
        `Model: y = k/x (inverse proportion). Known data: when x = ${p.x1}, y = ${N2(y1)}.`
      ));
      steps.push(I18N.tx(`k = x·y = ${p.x1}·${N2(y1)} = ${p.k}`, `k = x·y = ${p.x1}·${N2(y1)} = ${p.k}`));
      steps.push(I18N.tx(`Model: y = ${p.k}/x`, `Model: y = ${p.k}/x`));
      steps.push(I18N.tx(
        `Tahmin: x = ${p.xq} için y = ${p.k}/${p.xq} = ${N2(yq)}`,
        `Prediction: for x = ${p.xq}, y = ${p.k}/${p.xq} = ${N2(yq)}`
      ));
    } else if (p.kind === 3) {
      const bt = FnKit.sg(p.b);
      steps.push(I18N.tx(
        `Model: y = kx ${bt} (doğrusal/afin; b = ${p.b} verilmiş). Bilinen veri: x = ${p.x1} iken y = ${N2(y1)}.`,
        `Model: y = kx ${bt} (linear/affine; b = ${p.b} is given). Known data: when x = ${p.x1}, y = ${N2(y1)}.`
      ));
      steps.push(I18N.tx(`k = (y - b)/x = (${N2(y1)} - (${p.b}))/${p.x1} = ${p.k}`, `k = (y - b)/x = (${N2(y1)} - (${p.b}))/${p.x1} = ${p.k}`));
      steps.push(I18N.tx(`Model: y = ${p.k}x ${bt}`, `Model: y = ${p.k}x ${bt}`));
      steps.push(I18N.tx(
        `Tahmin: x = ${p.xq} için y = ${p.k}·${p.xq} ${bt} = ${N2(yq)}`,
        `Prediction: for x = ${p.xq}, y = ${p.k}·${p.xq} ${bt} = ${N2(yq)}`
      ));
      steps.push(I18N.tx(
        `Not: y/x sabit değil (${N2(y1)}/${p.x1} = ${N2(y1 / p.x1)}, ${N2(yq)}/${p.xq} = ${N2(yq / p.xq)}); b ≠ 0 olduğundan bu bir orantı DEĞİLDİR.`,
        `Note: y/x is not constant (${N2(y1)}/${p.x1} = ${N2(y1 / p.x1)}, ${N2(yq)}/${p.xq} = ${N2(yq / p.xq)}); since b ≠ 0 this is NOT a proportion.`
      ));
    } else if (p.kind === 4) {
      steps.push(I18N.tx(
        `Model: y = k·${p.a}^x (üstel; taban ${p.a} verilmiş). Bilinen veri: x = ${p.x1} iken y = ${N2(y1)}.`,
        `Model: y = k·${p.a}^x (exponential; base ${p.a} is given). Known data: when x = ${p.x1}, y = ${N2(y1)}.`
      ));
      steps.push(I18N.tx(
        `${p.a}^${p.x1} = ${N2(Math.pow(p.a, p.x1))}  →  k = ${N2(y1)}/${N2(Math.pow(p.a, p.x1))} = ${p.k}`,
        `${p.a}^${p.x1} = ${N2(Math.pow(p.a, p.x1))}  →  k = ${N2(y1)}/${N2(Math.pow(p.a, p.x1))} = ${p.k}`
      ));
      steps.push(I18N.tx(`Model: y = ${p.k}·${p.a}^x`, `Model: y = ${p.k}·${p.a}^x`));
      steps.push(I18N.tx(
        `Tahmin: x = ${p.xq} için y = ${p.k}·${p.a}^${p.xq} = ${p.k}·${N2(Math.pow(p.a, p.xq))} = ${N2(yq)}`,
        `Prediction: for x = ${p.xq}, y = ${p.k}·${p.a}^${p.xq} = ${p.k}·${N2(Math.pow(p.a, p.xq))} = ${N2(yq)}`
      ));
    } else if (p.kind === 0) {
      steps.push(I18N.tx(
        `Model: y = kx (orantı). Bilinen veri: x = ${p.x1} iken y = ${N2(y1)}.`,
        `Model: y = kx (proportion). Known data: when x = ${p.x1}, y = ${N2(y1)}.`
      ));
      steps.push(I18N.tx(`k = y/x = ${N2(y1)}/${p.x1} = ${p.k}`, `k = y/x = ${N2(y1)}/${p.x1} = ${p.k}`));
      steps.push(I18N.tx(`Model: y = ${p.k}x`, `Model: y = ${p.k}x`));
      steps.push(I18N.tx(
        `Tahmin: x = ${p.xq} için y = ${p.k}·${p.xq} = ${N2(yq)}`,
        `Prediction: for x = ${p.xq}, y = ${p.k}·${p.xq} = ${N2(yq)}`
      ));
    } else {
      steps.push(I18N.tx(
        `Model: T = k·R^(3/2) (Kepler). Bilinen veri: R = ${p.x1} iken T = ${N2(y1)}.`,
        `Model: T = k·R^(3/2) (Kepler). Known data: when R = ${p.x1}, T = ${N2(y1)}.`
      ));
      steps.push(I18N.tx(
        `R^(3/2) = ${p.x1}^(3/2) = ${N2(G(1, p.x1))}  →  k = ${N2(y1)}/${N2(G(1, p.x1))} = ${p.k}`,
        `R^(3/2) = ${p.x1}^(3/2) = ${N2(G(1, p.x1))}  →  k = ${N2(y1)}/${N2(G(1, p.x1))} = ${p.k}`
      ));
      steps.push(I18N.tx(`Model: T = ${p.k}·R^(3/2)`, `Model: T = ${p.k}·R^(3/2)`));
      steps.push(I18N.tx(
        `Tahmin: R = ${p.xq} için T = ${p.k}·${p.xq}^(3/2) = ${p.k}·${N2(G(1, p.xq))} = ${N2(yq)}`,
        `Prediction: for R = ${p.xq}, T = ${p.k}·${p.xq}^(3/2) = ${p.k}·${N2(G(1, p.xq))} = ${N2(yq)}`
      ));
    }
    steps.push(I18N.tx(
      `Denememiz: k = ${N2(p.guess)} → tahmin ${N2(M(p, p.guess, p.xq))} (gerçek: ${N2(yq)})`,
      `Our trial: k = ${N2(p.guess)} → prediction ${N2(M(p, p.guess, p.xq))} (true: ${N2(yq)})`
    ));
    return steps;
  }

  function draw(canvas, p) {
    const xMax = p.xq * 1.25;
    let yMax = Math.max(p.k, p.guess) * G(p.kind, p.xq, p) * 1.25;
    let yMin = -yMax * 0.08;
    if (p.kind >= 2) { // link-only kinds: make sure both curves and all markers stay in view
      const cm = Math.max(p.k, p.guess);
      const vals = [M(p, cm, p.xq), M(p, cm, p.x1), M(p, p.k, p.x1), M(p, p.k, p.xq), M(p, p.guess, p.x1), M(p, p.guess, p.xq)];
      if (p.kind === 3) vals.push(p.b);
      yMax = Math.max(1, ...vals.map(Math.abs)) * 1.25;
      yMin = Math.min(-yMax * 0.08, Math.min(...vals, 0) * 1.25);
    }
    canvas.setViewport(-xMax * 0.08, xMax, yMin, yMax);
    canvas.addFunction({
      evaluator: (x) => (x < 0 ? NaN : M(p, p.k, x)),
      color: canvas.gray(), thickness: 2, dashed: true,
    });
    canvas.addFunction({
      evaluator: (x) => (x < 0 ? NaN : M(p, p.guess, x)),
      color: canvas.accent(), thickness: 3,
    });
    canvas.addMarker({ x: p.x1, y: M(p, p.k, p.x1), color: canvas.gold(), radius: 7, label: I18N.tx('veri', 'data') });
    canvas.addMarker({ x: p.xq, y: M(p, p.k, p.xq), color: canvas.green(), radius: 6, label: I18N.tx('gerçek', 'true') });
    canvas.addMarker({ x: p.xq, y: M(p, p.guess, p.xq), color: canvas.accent(), radius: 6, hollow: true, label: I18N.tx('tahmin', 'guess') });
  }

  Topics.register('functions', {
    id: 'mathModels',
    problemStatement: (p) => {
      const y1 = N2(M(p, p.k, p.x1));
      if (p.kind === 2) {
        return I18N.tx(`y, x ile ters orantılıdır (y = k/x). x = ${p.x1} iken y = ${y1} ise k sabiti kaç olur? Modeli yazıp x = ${p.xq} için y değerini tahmin edebilir miyiz?`,
                       `y is inversely proportional to x (y = k/x). If y = ${y1} when x = ${p.x1}, let's find k, write the model and predict y for x = ${p.xq}.`);
      }
      if (p.kind === 3) {
        return I18N.tx(`y = kx ${FnKit.sg(p.b)} doğrusal modelinde x = ${p.x1} iken y = ${y1} ise k sabiti kaç olur? Modeli yazıp x = ${p.xq} için y değerini tahmin edelim; bu model bir orantı mıdır?`,
                       `In the linear model y = kx ${FnKit.sg(p.b)}, y = ${y1} when x = ${p.x1}. Let's find k, write the model and predict y for x = ${p.xq}. Is this model a proportion?`);
      }
      if (p.kind === 4) {
        return I18N.tx(`y = k·${p.a}^x üstel modelinde x = ${p.x1} iken y = ${y1} ise k sabiti kaç olur? Modeli yazıp x = ${p.xq} için y değerini tahmin edebilir miyiz?`,
                       `In the exponential model y = k·${p.a}^x, y = ${y1} when x = ${p.x1}. Let's find k, write the model and predict y for x = ${p.xq}.`);
      }
      return p.kind === 0
        ? I18N.tx(`y, x ile orantılıdır (y = kx). x = ${p.x1} iken y = ${y1} ise k sabiti kaç olur? Modeli yazıp x = ${p.xq} için y değerini tahmin edebilir miyiz?`,
                  `y is proportional to x (y = kx). If y = ${y1} when x = ${p.x1}, let's find k, write the model and predict y for x = ${p.xq}.`)
        : I18N.tx(`Kepler modeli T = k·R^(3/2). R = ${p.x1} iken T = ${y1} ise k sabiti kaç olur? Modeli yazıp R = ${p.xq} için T değerini tahmin edebilir miyiz?`,
                  `Kepler model T = k·R^(3/2). If T = ${y1} when R = ${p.x1}, let's find k, write the model and predict T for R = ${p.xq}.`);
    },
    tabTitle: () => I18N.tx('Matematik Modeller', 'Mathematical Models'),
    concept: () => I18N.tx(
      "MATEMATİKSEL MODEL\n" +
      "Gerçek bir durumun denklemlerle idealleştirilmesidir. Model her zaman bir yaklaşıklıktır ve yalnızca geçerlilik aralığında güvenilirdir.\n" +
      "\n" +
      "TEMEL MODEL TÜRLERİ\n" +
      "• DOĞRU ORANTI: y = kx (y/x sabit). Örn. Hooke yasası F = kx (yay).\n" +
      "• TERS ORANTI: y = k/x (x·y sabit). Örn. sabit sıcaklıkta P = k/V; Ohm yasası I = U/R.\n" +
      "• KUVVET YASASI: y = k·xⁿ (y/xⁿ sabit). Örn. Kepler'in 3. yasası T = k·R^(3/2); serbest düşmede s = ½gt².\n" +
      "• DOĞRUSAL (afin): y = mx + b (b ≠ 0 ise orantı DEĞİL).\n" +
      "• ÜSTEL: y = y₀·aˣ (büyüme/sönüm, soğuma, radyoaktif bozunma).\n" +
      "\n" +
      "YÖNTEM\n" +
      "1. Değişkenler ve birimleri belirlenir.\n" +
      "2. Veriye bakılır: y/x sabitse orantı; x·y sabitse ters orantı; y/xⁿ sabitse kuvvet yasası.\n" +
      "3. Bilinen BİR veri noktasından k bulunur: k = y₁/x₁ (ya da k = y₁/x₁ⁿ).\n" +
      "4. Model yazılır ve yeni girdi için tahmin yapılır.\n" +
      "5. Sonucun fiziksel olarak mantıklı olup olmadığına ve geçerlilik aralığında kalıp kalmadığına bakılır.\n" +
      "\n" +
      "MİNİ ÖRNEK\n" +
      "Kepler: Dünya R = 1 AB, T = 1 yıl → k = T/R^(3/2) = 1. Mars R = 1,52 AB → T = 1,52^(3/2) ≈ 1,87 yıl.\n" +
      "Yay: 10 N yayı 2 cm uzatıyorsa k = 5 N/cm; 35 N için x = 35/5 = 7 cm.\n" +
      "\n" +
      "NOTLAR\n" +
      "• Birimleri tutarlı tutmak önemlidir; k'nın da bir birimi vardır.\n" +
      "• Orantı, doğrunun orijinden geçmesi demektir; y = 2x + 3 orantı değildir.\n" +
      "• Veri aralığının çok dışına tahmin (ekstrapolasyon) güvenilmezdir (yay sınırı aşılınca Hooke yasası bozulur).\n" +
      "• Sağdaki kaydırıcı ile k'yı elle deneyebiliriz; mavi eğri bizim modelimiz, kesikli eğri gerçek modeldir.",
      "MATHEMATICAL MODEL\n" +
      "An idealization of a real situation by equations. A model is always an approximation and is reliable only within its range of validity.\n" +
      "\n" +
      "BASIC MODEL TYPES\n" +
      "• DIRECT PROPORTION: y = kx (y/x constant). E.g. Hooke's law F = kx (spring).\n" +
      "• INVERSE PROPORTION: y = k/x (x·y constant). E.g. P = k/V at constant temperature; Ohm's law I = U/R.\n" +
      "• POWER LAW: y = k·xⁿ (y/xⁿ constant). E.g. Kepler's third law T = k·R^(3/2); free fall s = ½gt².\n" +
      "• LINEAR (affine): y = mx + b (NOT a proportion if b ≠ 0).\n" +
      "• EXPONENTIAL: y = y₀·aˣ (growth/decay, cooling, radioactive decay).\n" +
      "\n" +
      "METHOD\n" +
      "1. Identify the variables and their units.\n" +
      "2. Look at the data: y/x constant → proportion; x·y constant → inverse proportion; y/xⁿ constant → power law.\n" +
      "3. Find k from ONE known data point: k = y₁/x₁ (or k = y₁/x₁ⁿ).\n" +
      "4. Write the model and predict for a new input.\n" +
      "5. Check that the result is physically sensible and inside the validity range.\n" +
      "\n" +
      "MINI EXAMPLE\n" +
      "Kepler: Earth R = 1 AU, T = 1 year → k = T/R^(3/2) = 1. Mars R = 1.52 AU → T = 1.52^(3/2) ≈ 1.87 years.\n" +
      "Spring: if 10 N stretches it 2 cm then k = 5 N/cm; for 35 N, x = 35/5 = 7 cm.\n" +
      "\n" +
      "NOTES\n" +
      "• It helps to keep units consistent; k has a unit too.\n" +
      "• Proportional means the line passes through the origin; y = 2x + 3 is not a proportion.\n" +
      "• Predicting far outside the data range (extrapolation) is unreliable (Hooke's law fails beyond the spring's limit).\n" +
      "• We can try k by hand with the slider; the blue curve is our model and the dashed curve is the true model."
    ),
    createProblem,
    links: [
      { match: /^• (DOĞRU ORANTI|DIRECT PROPORTION):/, make: (rng) => ({ kind: 0, k: rng.nextInt(2, 6), x1: rng.nextInt(1, 6), xq: rng.nextInt(6, 11), guess: 1 }) },
      { match: /^• (TERS ORANTI|INVERSE PROPORTION):/, make: (rng) => mkInverse(rng) },
      { match: /^• (KUVVET YASASI|POWER LAW):/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 1) },
      { match: /^• (DOĞRUSAL \(afin\)|LINEAR \(affine\)):/, make: (rng) => mkAffine(rng) },
      { match: /^• (ÜSTEL|EXPONENTIAL):/, make: (rng) => mkExp(rng) },
    ],
    solveSteps,
    draw,
    focus: (p) => ({ x: p.xq, y: M(p, p.k, p.xq) }),
    buildControls: (rightCol, getProblem, h) => {
      h.addSlider({
        caption: I18N.tx('Denenen k değeri', 'Trial value of k'),
        min: 0.1, max: 5,
        get: () => getProblem().guess,
        set: (v) => { getProblem().guess = v; },
      });
    },
  });
})();
