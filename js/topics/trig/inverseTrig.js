// Ported from Modules/Trigonometry/InverseTrigControl.vb - inverse trigonometric functions: restricted
// branch, exact values, the arcsin(sin x) trap, compositions, equations, triangle angles, domain checks.
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const piStr = TrigKit.piStr, frac = TrigKit.frac, exactTrig = TrigKit.exactTrig;
  const SQ3 = Math.sqrt(3), SQ2 = Math.sqrt(2);

  const SIN_COS_TEXTS = ['-1', '-√3/2', '-√2/2', '-1/2', '0', '1/2', '√2/2', '√3/2', '1'];
  const SIN_COS_VALS = [-1, -SQ3 / 2, -SQ2 / 2, -0.5, 0, 0.5, SQ2 / 2, SQ3 / 2, 1];
  const TAN_TEXTS = ['-√3', '-1', '-1/√3', '0', '1/√3', '1', '√3'];
  const TAN_VALS = [-SQ3, -1, -1 / SQ3, 0, 1 / SQ3, 1, SQ3];
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];

  let forcedFn = -1;

  const FN = ['sin', 'cos', 'tan'];
  const ARC = ['arcsin', 'arccos', 'arctan'];
  const RANGE = ['[−π/2, π/2]', '[0, π]', '(−π/2, π/2)'];
  const fnName = (fn) => FN[fn];
  const arcName = (fn) => ARC[fn];
  const rangeText = (fn) => RANGE[fn];

  function orig(fn, x) { return fn === 0 ? Math.sin(x) : (fn === 1 ? Math.cos(x) : Math.tan(x)); }

  function inv(fn, x) {
    if (typeof x !== 'number' || !isFinite(x)) return NaN;
    if (fn === 0) return Math.abs(x) <= 1.0000001 ? Math.asin(Math.max(-1, Math.min(1, x))) : NaN;
    if (fn === 1) return Math.abs(x) <= 1.0000001 ? Math.acos(Math.max(-1, Math.min(1, x))) : NaN;
    return Math.atan(x);
  }
  const branchLo = (fn) => (fn === 1 ? 0 : -Math.PI / 2);
  const branchHi = (fn) => (fn === 1 ? Math.PI : Math.PI / 2);
  function inBranch(fn, x) {
    if (fn === 2) return x > -Math.PI / 2 + 0.0005 && x < Math.PI / 2 - 0.0005;
    return x >= branchLo(fn) - 1e-7 && x <= branchHi(fn) + 1e-7;
  }
  const ang = (deg) => `${piStr(deg, 180)} (${deg}°)`;
  const norm360 = (d) => ((d % 360) + 360) % 360;
  const valText = (fn, idx) => (fn === 2 ? TAN_TEXTS[idx] : SIN_COS_TEXTS[idx]);
  const valNum = (fn, idx) => (fn === 2 ? TAN_VALS[idx] : SIN_COS_VALS[idx]);
  const tableSize = (fn) => (fn === 2 ? TAN_VALS.length : SIN_COS_VALS.length);
  const exactDeg = (fn, idx) => Math.round(inv(fn, valNum(fn, idx)) * 180 / Math.PI);
  const rnd = (v, d) => { const f = Math.pow(10, d); return Math.round(v * f) / f; };
  function numTx(x) { const r = rnd(x, 3); return String(r === 0 ? 0 : r); }
  const f2 = (v) => { const r = v.toFixed(2); return r === '-0.00' ? '0.00' : r; };

  function innerText(fn, deg) {
    if (deg % 30 === 0 || deg % 45 === 0) return exactTrig(fnName(fn), deg);
    return numTx(orig(fn, deg * Math.PI / 180));
  }

  // principal angle (deg) of arc-fn(fn(deg)); null when tan undefined
  function trapResult(fn, deg) {
    if (fn === 0) {
      let r = ((deg + 180) % 360 + 360) % 360 - 180;
      if (r > 90) r = 180 - r; else if (r < -90) r = -180 - r;
      return r;
    }
    if (fn === 1) return Math.abs(((deg + 180) % 360 + 360) % 360 - 180);
    if (((deg % 180) + 180) % 180 === 90) return null;
    return ((deg + 90) % 180 + 180) % 180 - 90;
  }

  function createProblem(rng) {
    const fn = forcedFn >= 0 ? forcedFn : rng.nextInt(0, 3);
    return genProblem(rng, fn, rng.nextInt(0, 6));
  }

  function genProblem(rng, fn, kind) {
    const p = { fn, kind, idx: 0, trapDeg: 0, comp: 0, a: 0, b: 0, c: 0, x: 0 };
    switch (p.kind) {
      case 0: case 3:
        p.idx = rng.nextInt(0, tableSize(fn)); p.x = valNum(fn, p.idx); break;
      case 1: {
        const pool = fn === 0 ? [120, 135, 150, 210, 225, 240, 300, 315, 330, -120, -135, -150, -210]
          : (fn === 1 ? [-30, -45, -60, -120, -135, 210, 225, 240, 300, 315, 330, 270]
            : [120, 135, 150, 210, 225, 240, 300, 315, 330, -120, -135, -150]);
        p.trapDeg = rng.pick(pool);
        p.x = fn === 2 ? 1 : 0.5;
        break;
      }
      case 2: {
        p.comp = fn * 2 + rng.nextInt(0, 2);
        const t = rng.pick(TRIPLES);
        const swap = rng.nextInt(0, 2) === 0;
        p.a = swap ? t[1] : t[0]; p.b = swap ? t[0] : t[1]; p.c = t[2];
        p.x = fn === 0 ? p.a / p.c : (fn === 1 ? p.b / p.c : p.a / p.b);
        break;
      }
      case 4:
        if (fn === 2) {
          p.a = rng.nextInt(2, 10);
          do { p.b = rng.nextInt(2, 10); } while (p.b === p.a);
          p.x = p.a / p.b;
        } else {
          p.c = rng.pick([4, 5, 6, 8, 10, 12]);
          p.a = rng.nextInt(2, p.c);
          p.x = p.a / p.c;
        }
        break;
      default:
        p.x = fn === 2 ? rng.pick([-4.5, -3, -2.5, 2, 3.5, 4.5, 0.75, -0.6])
          : rng.pick([2, -2, 1.5, -1.5, 3, -3, 1.2, -1.25, 0.5, -0.5, 0.8, -0.8, 1, -1, 0.25]);
    }
    return p;
  }

  function compInfo(p) {
    const innerFn = Math.floor(p.comp / 2);
    const outerFn = [1, 2, 0, 2, 0, 1][p.comp];
    const argT = [frac(p.a, p.c), frac(p.b, p.c), frac(p.a, p.b)][innerFn];
    return { innerFn, outerFn, argT };
  }

  function problemStatement(p) {
    const fn = p.fn, a = arcName(fn), f = fnName(fn);
    switch (p.kind) {
      case 0: { const vt = valText(fn, p.idx);
        return tx(`${a}(${vt}) değerini bulalım (sonucu ana aralıkta, radyan olarak yazabiliriz).`, `Let's find ${a}(${vt}) (giving the result in radians, in the principal range).`); }
      case 1:
        return tx(`${a}(${f} ${piStr(p.trapDeg, 180)}) değerini bulalım.`, `Let's find ${a}(${f} ${piStr(p.trapDeg, 180)}).`);
      case 2: { const { innerFn, outerFn, argT } = compInfo(p); const ia = arcName(innerFn), o = fnName(outerFn);
        return tx(`${o}(${ia} ${argT}) değerini bir dik üçgen çizerek bulalım.`, `Let's find ${o}(${ia} ${argT}) by drawing a right triangle.`); }
      case 3: { const vt = valText(fn, p.idx);
        return tx(`${f} x = ${vt} denklemini [0, 2π) aralığında birlikte çözelim.`, `Let's solve ${f} x = ${vt} for x in [0, 2π).`); }
      case 4:
        if (fn === 0) return tx(`${p.c} m uzunluğundaki bir merdiven duvara dayanıyor ve duvarda yerden ${p.a} m yüksekliğe değiyor. Merdivenin zeminle yaptığı açı kaç derece olur?`,
          `A ${p.c} m ladder leans against a wall and touches it ${p.a} m above the ground. What angle does the ladder make with the ground?`);
        if (fn === 1) return tx(`${p.c} m uzunluğundaki bir merdivenin alt ucu duvardan ${p.a} m uzakta. Merdivenin zeminle yaptığı açı kaç derece olur?`,
          `The foot of a ${p.c} m ladder is ${p.a} m from the wall. What angle does the ladder make with the ground?`);
        return tx(`Bir dik üçgende θ açısının karşı kenarı ${p.a} cm, komşu kenarı ${p.b} cm'dir. θ kaç derece olur?`,
          `In a right triangle the side opposite θ is ${p.a} cm and the side adjacent to θ is ${p.b} cm. How many degrees is θ?`);
      default:
        return tx(`${a}(${numTx(p.x)}) tanımlı mıdır? Tanımlıysa değerini bulalım.`, `Is ${a}(${numTx(p.x)}) defined? If so, let's find its value.`);
    }
  }

  function stepsExact(p, steps) {
    const fn = p.fn, a = arcName(fn), f = fnName(fn), vt = valText(fn, p.idx), d = exactDeg(fn, p.idx);
    const neg = vt.startsWith('-'), absT = neg ? vt.substring(1) : vt;
    const refDeg = fn === 1 ? (d <= 90 ? d : 180 - d) : Math.abs(d);
    steps.push(tx(`Soru: ${a}(${vt}) = ?`, `Question: ${a}(${vt}) = ?`));
    steps.push(tx(`${a}(${vt}) = θ demek: ${f} θ = ${vt} ve θ, ana aralık ${rangeText(fn)} içinde.`, `${a}(${vt}) = θ means: ${f} θ = ${vt} and θ lies in the principal range ${rangeText(fn)}.`));
    steps.push(tx(`Hangi açının ${f} değeri ${vt} olur? Referans açıya bakalım: ${f} ${refDeg}° = ${absT} olduğundan referans açı ${ang(refDeg)}.`, `Which angle has ${f} equal to ${vt}? Reference angle: ${f} ${refDeg}° = ${absT}, so the reference angle is ${ang(refDeg)}.`));
    if (fn === 0) {
      steps.push(vt === '0' ? tx('sin θ = 0 ve θ ∈ [−π/2, π/2] ⇒ θ = 0.', 'sin θ = 0 and θ ∈ [−π/2, π/2] ⇒ θ = 0.')
        : neg ? tx('Sinüs negatif ⇒ açı [−π/2, π/2] aralığının negatif yarısında: θ = −referans açı.', 'Sine is negative ⇒ the angle is in the negative half of [−π/2, π/2]: θ = −reference angle.')
          : tx('Sinüs pozitif ⇒ açı aralığın pozitif yarısında (I. bölge): θ = referans açı.', 'Sine is positive ⇒ the angle is in the positive half of the range (quadrant I): θ = reference angle.'));
    } else if (fn === 1) {
      steps.push(vt === '0' ? tx('cos θ = 0 ve θ ∈ [0, π] ⇒ θ = π/2.', 'cos θ = 0 and θ ∈ [0, π] ⇒ θ = π/2.')
        : neg ? tx('Kosinüs negatif ⇒ açı II. bölgede: θ = π − referans açı (aralık [0, π]).', 'Cosine is negative ⇒ the angle is in quadrant II: θ = π − reference angle (range [0, π]).')
          : tx('Kosinüs pozitif ⇒ açı I. bölgede: θ = referans açı.', 'Cosine is positive ⇒ the angle is in quadrant I: θ = reference angle.'));
    } else {
      steps.push(vt === '0' ? tx('tan θ = 0 ve θ ∈ (−π/2, π/2) ⇒ θ = 0.', 'tan θ = 0 and θ ∈ (−π/2, π/2) ⇒ θ = 0.')
        : neg ? tx('Tanjant negatif ⇒ açı (−π/2, 0) aralığında: θ = −referans açı.', 'Tangent is negative ⇒ the angle is in (−π/2, 0): θ = −reference angle.')
          : tx('Tanjant pozitif ⇒ açı (0, π/2) aralığında: θ = referans açı.', 'Tangent is positive ⇒ the angle is in (0, π/2): θ = reference angle.'));
    }
    steps.push(tx(`Aralık kontrolü: ${ang(d)}, ${rangeText(fn)} içinde mi? Evet. (Aynı ${f} değerine sahip diğer açılar, örneğin θ + 2π, bu aralığın dışındadır; ters fonksiyon tek bir çıktı verir.)`,
      `Range check: is ${ang(d)} in ${rangeText(fn)}? Yes. (Other angles with the same ${f}, such as θ + 2π, lie OUTSIDE this interval; the inverse gives exactly one output.)`));
    steps.push(tx(`SONUÇ: ${a}(${vt}) = ${piStr(d, 180)} radyan = ${d}°.   Doğrulayalım: ${f}(${d}°) = ${vt}.`, `RESULT: ${a}(${vt}) = ${piStr(d, 180)} radians = ${d}°.   Check: ${f}(${d}°) = ${vt}.`));
  }

  function stepsTrap(p, steps) {
    const fn = p.fn, a = arcName(fn), f = fnName(fn), deg = p.trapDeg, res = trapResult(fn, deg);
    steps.push(tx(`Soru: ${a}(${f} ${piStr(deg, 180)}) = ?   (θ = ${ang(deg)})`, `Question: ${a}(${f} ${piStr(deg, 180)}) = ?   (θ = ${ang(deg)})`));
    if (res === null) {
      steps.push(tx(`tan ${piStr(deg, 180)} TANIMSIZDIR (cos θ = 0), bu yüzden arctan(tan θ) bu açı için tanımsızdır.`, `tan ${piStr(deg, 180)} is UNDEFINED (cos θ = 0), so arctan(tan θ) is undefined for this angle.`));
      return;
    }
    const inner = innerText(fn, deg);
    steps.push(tx(`Önce içerideki ifadeyi hesaplayalım: ${f} ${piStr(deg, 180)} = ${inner}.`, `Let's evaluate the inside first: ${f} ${piStr(deg, 180)} = ${inner}.`));
    steps.push(tx(`Şimdi ${a}(${inner}), sadece ana aralık ${rangeText(fn)} içindeki açıyı verir; bu yüzden otomatik olarak ${piStr(deg, 180)} DEĞİLDİR.`,
      `Now ${a}(${inner}) only returns the angle in the principal range ${rangeText(fn)}, so it is NOT automatically ${piStr(deg, 180)}.`));
    const inRange = res === deg;
    steps.push(tx(`θ = ${ang(deg)} aralık ${rangeText(fn)} içinde mi? ${inRange ? 'Evet' : 'HAYIR'}.`, `Is θ = ${ang(deg)} in ${rangeText(fn)}? ${inRange ? 'Yes' : 'NO'}.`));
    if (inRange) {
      steps.push(tx('Açı zaten ana aralıkta olduğu için burada ters fonksiyon açıyı aynen geri verir.', 'The angle is already in the principal range, so the inverse function simply returns it.'));
    } else {
      if (fn === 0) {
        const r = ((deg + 180) % 360 + 360) % 360 - 180;
        const refA = Math.abs(Math.abs(r) > 90 ? 180 - Math.abs(r) : r);
        steps.push(tx(`θ'yı (−π, π] aralığına indirgeyelim: ${ang(r)}. Referans açı (x-eksenine uzaklık) ${refA}°.`, `We can reduce θ to (−π, π]: ${ang(r)}. The reference angle (distance to the x-axis) is ${refA}°.`));
        const neg = Math.sin(deg * Math.PI / 180) < 0;
        const expr = (r > 90 || r < -90) ? `${r > 0 ? 180 : -180}° − (${r}°)` : `${r}°`;
        steps.push(tx(`Sinüs ${neg ? 'negatif' : 'pozitif'}; aynı sinüse sahip, [−π/2, π/2] içindeki açı: ${expr} = ${res}°.`, `The sine is ${neg ? 'negative' : 'positive'}; the angle in [−π/2, π/2] with the same sine is ${expr} = ${res}°.`));
      } else if (fn === 1) {
        const r = ((deg + 180) % 360 + 360) % 360 - 180;
        steps.push(tx(`θ'yı (−π, π] aralığına indirgeyelim: ${ang(r)}. Kosinüs çifttir: cos(−r) = cos r, yani aynı kosinüs ${ang(Math.abs(r))} açısında da elde edilir.`, `We can reduce θ to (−π, π]: ${ang(r)}. Cosine is even: cos(−r) = cos r, so the same cosine occurs at ${ang(Math.abs(r))}.`));
        steps.push(tx(`${ang(Math.abs(r))}, [0, π] aralığında; bu yüzden ana değer ${res}°.`, `${ang(Math.abs(r))} lies in [0, π]; hence the principal value is ${res}°.`));
      } else {
        const sgn = deg > res ? '−' : '+';
        steps.push(tx(`tan'ın periyodu π: π'nin katlarını ekleyip çıkararak açı (−π/2, π/2) aralığına getirilebilir: ${deg}° ${sgn} ${Math.abs(deg - res)}° = ${res}°.`, `tan has period π: we can add or subtract multiples of π to bring the angle into (−π/2, π/2): ${deg}° ${sgn} ${Math.abs(deg - res)}° = ${res}°.`));
      }
      steps.push(tx(`Peki neden ${piStr(deg, 180)} değil? Çünkü ${a} bir FONKSİYONDUR: tek bir çıktı verir ve bu çıktı tanım gereği ${rangeText(fn)} aralığındadır; ${piStr(deg, 180)} bu aralığın dışındadır.`,
        `WHY not ${piStr(deg, 180)}? Because ${a} is a FUNCTION: it gives exactly one output and, by definition, that output lies in ${rangeText(fn)}; ${piStr(deg, 180)} is outside this interval.`));
    }
    steps.push(tx(`SONUÇ: ${a}(${f} ${piStr(deg, 180)}) = ${piStr(res, 180)}  (${res}°).`, `RESULT: ${a}(${f} ${piStr(deg, 180)}) = ${piStr(res, 180)}  (${res}°).`));
  }

  function stepsComposition(p, steps) {
    const { innerFn, outerFn, argT } = compInfo(p);
    const a = arcName(innerFn), o = fnName(outerFn);
    const ansT = [frac(p.b, p.c), frac(p.a, p.b), frac(p.a, p.c), frac(p.a, p.b), frac(p.a, p.c), frac(p.b, p.c)][p.comp];
    steps.push(tx(`Soru: ${o}(${a}(${argT})) = ?`, `Question: ${o}(${a}(${argT})) = ?`));
    steps.push(tx(`θ = ${a}(${argT}) olsun. Yani ${fnName(innerFn)} θ = ${argT} ve θ ∈ ${rangeText(innerFn)}. Argüman pozitif olduğundan θ birinci bölgededir.`,
      `Let θ = ${a}(${argT}). So ${fnName(innerFn)} θ = ${argT} and θ ∈ ${rangeText(innerFn)}. The argument is positive, so θ is in the first quadrant.`));
    if (innerFn === 0) {
      steps.push(tx(`Bir dik üçgen çizelim: karşı kenar = ${p.a}, hipotenüs = ${p.c} (çünkü sin θ = karşı/hipotenüs).`, `Let's draw a right triangle: opposite = ${p.a}, hypotenuse = ${p.c} (since sin θ = opposite/hypotenuse).`));
      steps.push(tx(`Pisagor: komşu = √(${p.c}² − ${p.a}²) = √${p.c * p.c - p.a * p.a} = ${p.b}.`, `Pythagoras: adjacent = √(${p.c}² − ${p.a}²) = √${p.c * p.c - p.a * p.a} = ${p.b}.`));
    } else if (innerFn === 1) {
      steps.push(tx(`Bir dik üçgen çizelim: komşu kenar = ${p.b}, hipotenüs = ${p.c} (çünkü cos θ = komşu/hipotenüs).`, `Let's draw a right triangle: adjacent = ${p.b}, hypotenuse = ${p.c} (since cos θ = adjacent/hypotenuse).`));
      steps.push(tx(`Pisagor: karşı = √(${p.c}² − ${p.b}²) = √${p.c * p.c - p.b * p.b} = ${p.a}.`, `Pythagoras: opposite = √(${p.c}² − ${p.b}²) = √${p.c * p.c - p.b * p.b} = ${p.a}.`));
    } else {
      steps.push(tx(`Bir dik üçgen çizelim: karşı kenar = ${p.a}, komşu kenar = ${p.b} (çünkü tan θ = karşı/komşu).`, `Let's draw a right triangle: opposite = ${p.a}, adjacent = ${p.b} (since tan θ = opposite/adjacent).`));
      steps.push(tx(`Pisagor: hipotenüs = √(${p.a}² + ${p.b}²) = √${p.a * p.a + p.b * p.b} = ${p.c}.`, `Pythagoras: hypotenuse = √(${p.a}² + ${p.b}²) = √${p.a * p.a + p.b * p.b} = ${p.c}.`));
    }
    steps.push(tx(`Üçgenin kenarları: karşı = ${p.a}, komşu = ${p.b}, hipotenüs = ${p.c}. Şimdi ${o} θ değerini üçgenden okuyabiliriz.`, `The triangle has opposite = ${p.a}, adjacent = ${p.b}, hypotenuse = ${p.c}. Now we can read ${o} θ off the triangle.`));
    const def = ['karşı/hipotenüs', 'komşu/hipotenüs', 'karşı/komşu'][outerFn];
    const defEn = ['opposite/hypotenuse', 'adjacent/hypotenuse', 'opposite/adjacent'][outerFn];
    steps.push(tx(`${o} θ = ${def} = ${ansT}. (θ ∈ ${rangeText(innerFn)} olduğundan işaret sorunu yok.)`, `${o} θ = ${defEn} = ${ansT}. (Since θ ∈ ${rangeText(innerFn)}, there is no sign ambiguity.)`));
    steps.push(tx(`SONUÇ: ${o}(${a}(${argT})) = ${ansT}.`, `RESULT: ${o}(${a}(${argT})) = ${ansT}.`));
  }

  function solutionList(fn, pdeg) {
    const r = fn === 0 ? [norm360(pdeg), norm360(180 - pdeg)]
      : (fn === 1 ? [norm360(pdeg), norm360(360 - pdeg)] : [norm360(pdeg), norm360(pdeg + 180)]);
    return Array.from(new Set(r)).sort((u, v) => u - v);
  }

  function stepsSolve(p, steps) {
    const fn = p.fn, a = arcName(fn), f = fnName(fn), vt = valText(fn, p.idx), d = exactDeg(fn, p.idx);
    steps.push(tx(`Soru: ${f} x = ${vt} denklemini [0, 2π) aralığında çöz.`, `Question: solve ${f} x = ${vt} for x in [0, 2π).`));
    steps.push(tx(`1) Ana çözüm: x₁ = ${a}(${vt}) = ${ang(d)}  (ana aralık ${rangeText(fn)} içinde).`, `1) Principal solution: x₁ = ${a}(${vt}) = ${ang(d)}  (in the principal range ${rangeText(fn)}).`));
    if (fn === 0) steps.push(tx('2) Sinüs için ikinci çözüm: π − x₁ (y eksenine göre simetrik nokta, aynı yükseklik).', '2) Second solution for sine: π − x₁ (the mirror point across the y-axis has the same height).'));
    else if (fn === 1) steps.push(tx('2) Kosinüs için ikinci çözüm: −x₁ + 2π (x eksenine göre simetrik nokta, aynı yatay konum).', '2) Second solution for cosine: −x₁ + 2π (the mirror point across the x-axis has the same horizontal position).'));
    else steps.push(tx('2) Tanjant için ikinci çözüm: x₁ + π (çemberin karşı noktası; tan\'ın periyodu π).', '2) Second solution for tangent: x₁ + π (the opposite point on the circle; tan has period π).'));
    const sols = solutionList(fn, d);
    const raw2 = [180 - d, 360 - d, d + 180][fn];
    steps.push(tx(`   x₂ = ${ang(raw2)}.`, `   x₂ = ${ang(raw2)}.`));
    steps.push(tx('3) Her iki değer de [0, 2π) aralığına getirilir (gerekirse 2π eklenir).', '3) We bring both values into [0, 2π) (add 2π where needed).'));
    steps.push(sols.length === 1
      ? tx(`İki çözüm aynı noktada birleşir: tek çözüm x = ${ang(sols[0])}.`, `The two solutions coincide: a single solution x = ${ang(sols[0])}.`)
      : tx(`SONUÇ: x = ${ang(sols[0])}  ve  x = ${ang(sols[1])}.`, `RESULT: x = ${ang(sols[0])}  and  x = ${ang(sols[1])}.`));
    steps.push(tx(`Doğrulayalım: ${f}(${sols[0]}°) = ${innerText(fn, sols[0])}.`, `Check: ${f}(${sols[0]}°) = ${innerText(fn, sols[0])}.`));
  }

  function stepsTriangle(p, steps) {
    const fn = p.fn, x = p.a / (fn === 2 ? p.b : p.c), th = inv(fn, x) * 180 / Math.PI;
    const a = arcName(fn), f = fnName(fn);
    if (fn === 0) {
      steps.push(tx(`Soru: ${p.c} m uzunluğundaki bir merdiven duvara dayanıyor ve duvarda yerden ${p.a} m yüksekliğe değiyor. Merdivenin zeminle yaptığı açı kaç derecedir?`, `Question: a ${p.c} m ladder leans against a wall and touches it ${p.a} m above the ground. What angle does the ladder make with the ground?`));
      steps.push(tx(`Dik üçgen: hipotenüs = merdiven = ${p.c} m, θ'nın karşısındaki kenar = duvar yüksekliği = ${p.a} m.`, `Right triangle: hypotenuse = ladder = ${p.c} m, the side opposite θ = height on the wall = ${p.a} m.`));
      steps.push(tx(`sin θ = karşı/hipotenüs = ${p.a}/${p.c} = ${numTx(x)}.`, `sin θ = opposite/hypotenuse = ${p.a}/${p.c} = ${numTx(x)}.`));
    } else if (fn === 1) {
      steps.push(tx(`Soru: ${p.c} m uzunluğundaki bir merdivenin alt ucu duvardan ${p.a} m uzakta. Merdivenin zeminle yaptığı açı kaç derecedir?`, `Question: the foot of a ${p.c} m ladder is ${p.a} m from the wall. What angle does the ladder make with the ground?`));
      steps.push(tx(`Dik üçgen: hipotenüs = merdiven = ${p.c} m, θ'ya komşu kenar = zemindeki uzaklık = ${p.a} m.`, `Right triangle: hypotenuse = ladder = ${p.c} m, the side adjacent to θ = distance along the ground = ${p.a} m.`));
      steps.push(tx(`cos θ = komşu/hipotenüs = ${p.a}/${p.c} = ${numTx(x)}.`, `cos θ = adjacent/hypotenuse = ${p.a}/${p.c} = ${numTx(x)}.`));
    } else {
      steps.push(tx(`Soru: Bir dik üçgende θ açısının karşı kenarı ${p.a} cm, komşu kenarı ${p.b} cm'dir. θ kaç derecedir?`, `Question: in a right triangle the side opposite θ is ${p.a} cm and the side adjacent to θ is ${p.b} cm. Find θ in degrees.`));
      steps.push(tx(`tan θ = karşı/komşu = ${p.a}/${p.b} = ${numTx(x)}.`, `tan θ = opposite/adjacent = ${p.a}/${p.b} = ${numTx(x)}.`));
    }
    steps.push(tx(`Açıyı bulmak için ters fonksiyon: θ = ${a}(${numTx(x)}). Hesap makinesini derece kipine alabiliriz.`, `To get the angle we use the inverse function: θ = ${a}(${numTx(x)}). We can put the calculator in degree mode.`));
    steps.push(tx(`θ = ${f2(th)}°  (≈ ${numTx(th * Math.PI / 180)} rad). Bu açı ana aralıkta ve üçgenin dar açısı olarak anlamlıdır.`, `θ = ${f2(th)}°  (≈ ${numTx(th * Math.PI / 180)} rad). This lies in the principal range and makes sense as an acute angle of the triangle.`));
    steps.push(tx(`Kontrol edelim: ${f}(${f2(th)}°) ≈ ${numTx(orig(fn, th * Math.PI / 180))}. Diğer dar açı: 90° − ${f2(th)}° = ${f2(90 - th)}°.`, `Check: ${f}(${f2(th)}°) ≈ ${numTx(orig(fn, th * Math.PI / 180))}. The other acute angle: 90° − ${f2(th)}° = ${f2(90 - th)}°.`));
  }

  function stepsDomain(p, steps) {
    const fn = p.fn, a = arcName(fn), f = fnName(fn), X = numTx(p.x);
    steps.push(tx(`Soru: ${a}(${X}) tanımlı mı?`, `Question: is ${a}(${X}) defined?`));
    if (fn === 2) {
      const at = Math.atan(p.x);
      steps.push(tx('tan fonksiyonu (−π/2, π/2) üzerinde tüm reel sayıları alır; bu yüzden arctan\'ın tanım kümesi ℝ\'dir.', 'On (−π/2, π/2) the tangent takes every real value, so the domain of arctan is ℝ.'));
      steps.push(tx(`${X} bir reel sayıdır ⇒ arctan(${X}) TANIMLIDIR: = ${numTx(at)} rad = ${numTx(at * 180 / Math.PI)}°.`, `${X} is a real number ⇒ arctan(${X}) IS defined: = ${numTx(at)} rad = ${numTx(at * 180 / Math.PI)}°.`));
      steps.push(tx('Şuna dikkat edilebilir: arctan her zaman (−π/2, π/2) içinde kalır, uçlara ulaşmaz (yatay asimptotlar y = ±π/2).', 'Notice that arctan always stays inside (−π/2, π/2) and never reaches the ends (horizontal asymptotes y = ±π/2).'));
    } else {
      steps.push(tx(`${a} x, ana aralıkta ${f} θ = x denklemini sağlayan bir θ ister. ${f} yalnızca −1 ile 1 arasındaki değerleri alır; dolayısıyla tanım kümesi [−1, 1].`,
        `${a} x needs an angle θ in the principal range with ${f} θ = x. The ${f} function only takes values from −1 to 1, so the domain is [−1, 1].`));
      if (Math.abs(p.x) <= 1.0000001) {
        const v = inv(fn, p.x);
        steps.push(tx(`|${X}| ≤ 1 ⇒ ${a}(${X}) TANIMLIDIR: = ${numTx(v)} rad = ${numTx(v * 180 / Math.PI)}°.`, `|${X}| ≤ 1 ⇒ ${a}(${X}) IS defined: = ${numTx(v)} rad = ${numTx(v * 180 / Math.PI)}°.`));
      } else {
        steps.push(tx(`${X} ∉ [−1, 1] ⇒ ${a}(${X}) TANIMSIZDIR: hiçbir açının ${f} değeri ${X} olamaz.`, `${X} ∉ [−1, 1] ⇒ ${a}(${X}) is UNDEFINED: no angle has a ${f} equal to ${X}.`));
        steps.push(tx('Hesap makinesinin "hata" vermesinin nedeni budur. Grafikte x = ±1\'den sonra eğri yoktur.', 'This is why a calculator reports an error. On the graph there is no curve beyond x = ±1.'));
      }
    }
  }

  function solveSteps(p) {
    const steps = [];
    switch (p.kind) {
      case 0: stepsExact(p, steps); break;
      case 1: stepsTrap(p, steps); break;
      case 2: stepsComposition(p, steps); break;
      case 3: stepsSolve(p, steps); break;
      case 4: stepsTriangle(p, steps); break;
      default: stepsDomain(p, steps);
    }
    const a = arcName(p.fn), v = inv(p.fn, p.x), X = numTx(p.x);
    if (isNaN(v)) {
      steps.push(tx(`Grafikteki nokta: x = ${X} için ${a} x TANIMSIZ (x ∈ [−1, 1] değil), bu yüzden eğri üzerinde nokta yok.`, `Point on the graph: for x = ${X}, ${a} x is UNDEFINED (x is not in [−1, 1]), so there is no point on the curve.`));
    } else {
      const V = numTx(v), D = numTx(v * 180 / Math.PI);
      steps.push(tx(`Grafikteki nokta: ${a}(${X}) = ${V} rad = ${D}°. Nokta (x, y) = (${X}, ${V}); aynası y = x'e göre (${V}, ${X}) kısıtlanmış ${fnName(p.fn)} grafiği üzerindedir.`,
        `Point on the graph: ${a}(${X}) = ${V} rad = ${D}°. The point (x, y) = (${X}, ${V}); its mirror image about y = x, (${V}, ${X}), lies on the restricted ${fnName(p.fn)} graph.`));
    }
    return steps;
  }

  function aspectOf(canvas) {
    const el = canvas.canvas;
    if (el && el.clientWidth > 50 && el.clientHeight > 50) return el.clientWidth / el.clientHeight;
    return 1.4;
  }

  function draw(canvas, p) {
    const fn = p.fn, aspect = aspectOf(canvas), trap = p.kind === 1;
    let cx = 0, cy = 0, hx, hy;
    if (trap) { hx = 6.7; hy = hx / aspect; }
    else {
      if (fn === 0) hy = 2.2;
      else if (fn === 1) { hy = 2.4; cx = Math.PI / 2; cy = Math.PI / 2; }
      else hy = 3.4;
      hx = hy * aspect;
    }
    canvas.setViewport(cx - hx, cx + hx, cy - hy, cy + hy);
    const lo = branchLo(fn), hi = branchHi(fn);
    const accent = canvas.accent(), orange = canvas.orange();
    if (trap) canvas.addRegion({ xMin: lo, xMax: hi, color: 'rgba(255,140,0,0.16)' });
    canvas.addFunction({ evaluator: (x) => orig(fn, x), color: canvas.gray(), thickness: 1.5, dashed: true });
    canvas.addFunction({ evaluator: (x) => (inBranch(fn, x) ? orig(fn, x) : NaN), color: orange, thickness: 3.5, label: tx(`${fnName(fn)} (kısıtlanmış)`, `${fnName(fn)} (restricted)`) });
    if (!trap) {
      canvas.addFunction({ evaluator: (x) => inv(fn, x), color: accent, thickness: 3.5, label: arcName(fn) });
      canvas.addFunction({ evaluator: (x) => x, color: canvas.gray(), thickness: 1.5, dashed: true, label: 'y = x' });
      if (fn === 1) canvas.addGuideLine({ axis: 'horizontal', position: Math.PI, color: canvas.gray(), label: 'π' });
      else {
        canvas.addGuideLine({ axis: 'horizontal', position: Math.PI / 2, color: canvas.gray(), label: 'π/2' });
        canvas.addGuideLine({ axis: 'horizontal', position: -Math.PI / 2, color: canvas.gray(), label: '−π/2' });
      }
      if (fn !== 2) {
        canvas.addGuideLine({ axis: 'vertical', position: 1, color: canvas.gray(), label: '1' });
        canvas.addGuideLine({ axis: 'vertical', position: -1, color: canvas.gray(), label: '−1' });
      }
      const y0 = inv(fn, p.x);
      if (isNaN(y0)) {
        canvas.addGuideLine({ axis: 'vertical', position: p.x, color: canvas.red() });
        canvas.addMarker({ x: p.x, y: 0, color: canvas.red(), hollow: true, radius: 6, label: tx('tanımsız', 'undefined') });
      } else {
        canvas.addSegment({ x1: p.x, y1: y0, x2: y0, y2: p.x, color: canvas.gray(), thickness: 1.5, dashed: true });
        canvas.addMarker({ x: p.x, y: y0, color: canvas.gold(), radius: 6.5, label: `(${numTx(p.x)}, ${numTx(y0)})` });
        canvas.addMarker({ x: y0, y: p.x, color: orange, shape: 'diamond', radius: 6.5, label: `(${numTx(y0)}, ${numTx(p.x)})` });
      }
    } else {
      const res = trapResult(fn, p.trapDeg), a = p.trapDeg * Math.PI / 180;
      canvas.addGuideLine({ axis: 'vertical', position: lo, color: orange, label: fn === 1 ? '0' : '−π/2' });
      canvas.addGuideLine({ axis: 'vertical', position: hi, color: orange, label: fn === 1 ? 'π' : 'π/2' });
      if (res !== null) {
        const y0 = orig(fn, a), rr = res * Math.PI / 180;
        canvas.addSegment({ x1: a, y1: y0, x2: rr, y2: y0, color: canvas.gray(), thickness: 1.5, dashed: true });
        canvas.addMarker({ x: a, y: y0, color: canvas.red(), hollow: !inBranch(fn, a), radius: 6.5, label: `θ = ${piStr(p.trapDeg, 180)}` });
        canvas.addMarker({ x: rr, y: y0, color: canvas.gold(), radius: 6.5, label: `${arcName(fn)}: ${piStr(res, 180)}` });
      } else {
        canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.red(), label: tx('tanımsız', 'undefined') });
      }
    }
  }

  const CONCEPT = () => tx(
    'Ters trigonometrik fonksiyonlar, bir üçgenin kenar uzunluklarından AÇIYI bulmak istediğimizde ortaya çıkar; ayrıca integral alırken çok işe yarayan ters türevler verirler.\n\n' +
    'NEDEN TANIM KÜMESİNİ KISITLIYORUZ?\n' +
    'Altı temel trigonometrik fonksiyon periyodiktir: aynı değer sonsuz çok açıda tekrarlanır (sin 30° = sin 150° = sin 390° = 1/2). Bire-bir olmadıkları için tersleri yoktur. Çözüm olarak her fonksiyonu bire-bir olduğu bir aralığa KISITLAYIP o parçanın tersini alabiliriz.\n\n' +
    'KISITLAMALAR (ana dal)\n' +
    'sin : [−π/2, π/2] → [−1, 1]   ⇒   arcsin : [−1, 1] → [−π/2, π/2]\n' +
    'cos : [0, π] → [−1, 1]   ⇒   arccos : [−1, 1] → [0, π]\n' +
    'tan : (−π/2, π/2) → ℝ   ⇒   arctan : ℝ → (−π/2, π/2)\n' +
    '(cot, sec, csc için de benzer kısıtlanmış kollar vardır: arccot, arcsec, arccsc.)\n\n' +
    'TANIM\n' +
    'arcsin x = "sinüsü x olan ve [−π/2, π/2] aralığında bulunan TEK açı". Bu açı ters fonksiyonun çıktısıdır; çıktı hep ana aralıktadır.\n' +
    'y = arcsin x  ⇔  sin y = x  ve  −π/2 ≤ y ≤ π/2.\n\n' +
    'TUZAK 1: arcsin x ≠ 1/sin x = csc x. Buradaki −1 üs DEĞİL, "ters fonksiyon" işaretidir (sin⁻¹ x = arcsin x).\n\n' +
    'TUZAK 2: sin(arcsin x) = x yalnızca x ∈ [−1, 1] için doğrudur. Ama arcsin(sin x) = x yalnızca x ∈ [−π/2, π/2] için doğrudur; örneğin arcsin(sin 7π/6) = −π/6 (7π/6 DEĞİL). Benzer şekilde arccos(cos x) = x ancak x ∈ [0, π], arctan(tan x) = x ancak x ∈ (−π/2, π/2) için.\n\n' +
    'GRAFİK: Ters fonksiyonun grafiği, kısıtlanmış fonksiyonun grafiğinin y = x doğrusuna göre SİMETRİĞİDİR: (a, b) noktası f\'de ise (b, a) noktası f⁻¹\'dedir. Turuncu kalın eğri kısıtlanmış parça, kesikli eğri atılan kısım, mavi eğri ters fonksiyondur. arcsin ve arccos yalnızca |x| ≤ 1 için tanımlıdır.\n\n' +
    'YÖNTEM: Özel değer için "bu sinüse sahip hangi açı ANA ARALIKTA?" diye sorabiliriz; bileşik ifadelerde bir dik üçgen çizip hipotenüsü Pisagor ile bulabiliriz.',
    'Inverse trigonometric functions arise whenever we want an ANGLE from the side lengths of a triangle, and they give very useful antiderivatives in integration.\n\n' +
    'WHY RESTRICT THE DOMAIN?\n' +
    'The six basic trig functions are periodic: the same value repeats at infinitely many angles (sin 30° = sin 150° = sin 390° = 1/2). They are not one-to-one, so they have no inverse. The fix: RESTRICT each function to an interval where it IS one-to-one and invert that restricted piece.\n\n' +
    'THE RESTRICTIONS (principal branch)\n' +
    'sin : [−π/2, π/2] → [−1, 1]   ⇒   arcsin : [−1, 1] → [−π/2, π/2]\n' +
    'cos : [0, π] → [−1, 1]   ⇒   arccos : [−1, 1] → [0, π]\n' +
    'tan : (−π/2, π/2) → ℝ   ⇒   arctan : ℝ → (−π/2, π/2)\n' +
    '(cot, sec, csc have similar restricted versions: arccot, arcsec, arccsc.)\n\n' +
    'DEFINITION\n' +
    'arcsin x means "the angle in [−π/2, π/2] whose sine is x". That angle is the output of the inverse function; the output always lies in the principal interval.\n' +
    'y = arcsin x  ⇔  sin y = x  and  −π/2 ≤ y ≤ π/2.\n\n' +
    'TRAP 1: arcsin x ≠ 1/sin x = csc x. The −1 in sin⁻¹ x is NOT an exponent, it marks the "inverse function" (sin⁻¹ x = arcsin x).\n\n' +
    'TRAP 2: sin(arcsin x) = x holds for x in [−1, 1]. But arcsin(sin x) = x holds only for x in [−π/2, π/2]; e.g. arcsin(sin 7π/6) = −π/6 (NOT 7π/6). Likewise arccos(cos x) = x only for x in [0, π], and arctan(tan x) = x only for x in (−π/2, π/2).\n\n' +
    'GRAPH: the graph of the inverse is the REFLECTION of the restricted function\'s graph about the line y = x: if (a, b) is on f then (b, a) is on f⁻¹. The thick orange curve is the restricted piece, the dashed curve is the part we discard, the blue curve is the inverse. arcsin and arccos exist only for |x| ≤ 1.\n\n' +
    'METHOD: for an exact value we can ask "which angle IN THE PRINCIPAL RANGE has this sine?"; for compositions we can draw a right triangle (and get the hypotenuse with Pythagoras).');

  Topics.register('trig', {
    id: 'inverseTrig',
    tabTitle: () => tx('Ters Trigonometrik Fonksiyonlar', 'Inverse Trigonometric Functions'),
    concept: CONCEPT,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    links: [
      { match: /^sin : \[/, make: (rng) => genProblem(rng, 0, 0) },
      { match: /^cos : \[/, make: (rng) => genProblem(rng, 1, 0) },
      { match: /^tan : \(/, make: (rng) => genProblem(rng, 2, 0) },
      { match: /^(TANIM|DEFINITION)$/, make: (rng) => genProblem(rng, rng.nextInt(0, 3), 3) },
      { match: /^(TUZAK|TRAP) 2:/, make: (rng) => genProblem(rng, rng.nextInt(0, 3), 1) },
    ],
    focus: (p) => {
      if (p.kind === 1) {
        const a = p.trapDeg * Math.PI / 180;
        return trapResult(p.fn, p.trapDeg) === null ? { x: a, y: 0 } : { x: a, y: orig(p.fn, a) };
      }
      const y0 = inv(p.fn, p.x);
      return isNaN(y0) ? { x: p.x, y: 0 } : { x: p.x, y: y0 };
    },
    buildControls: (rightCol, getProblem, h) => {
      window.addEventListener('resize', () => h.refresh());
      forcedFn = -1;
      h.addRadioGroup({
        name: 'invTrigFn',
        options: [
          { label: tx('Rastgele', 'Random'), value: -1 },
          { label: 'arcsin  (sin)', value: 0 },
          { label: 'arccos  (cos)', value: 1 },
          { label: 'arctan  (tan)', value: 2 },
        ],
        get: () => forcedFn,
        set: (v) => { forcedFn = v; h.regenerate(); },
      });
      h.addSlider({
        caption: tx('Argüman x (−5 … 5)', 'Argument x (−5 … 5)'), min: -5, max: 5, step: 0.01,
        get: () => getProblem().x, set: (v) => { getProblem().x = rnd(v, 2); },
      });
      h.addSlider({
        caption: tx('Açı θ (°), tuzak örneği', 'Angle θ (°), trap example'), min: -360, max: 360, step: 15,
        get: () => getProblem().trapDeg, set: (v) => { getProblem().trapDeg = Math.round(v / 15) * 15; },
      });
    },
  });
})();
