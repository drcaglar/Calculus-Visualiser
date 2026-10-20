// Ported from Modules/Trigonometry/TrigFunctionsControl.vb - the six basic trigonometric functions:
// definitions, ASTC signs, exact values at multiples of 15 degrees, domain/range/period.
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const { frac: Frac, piStr: PiStr } = TrigKit;
  const Names = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc'];

  function fmt(x, dec) {
    if (!isFinite(x)) return '0';
    let s = x.toFixed(dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }

  let radioCtl = null; // radio group (kept in sync with problem.fn after "New Example")

  // ===================== numeric and exact helpers =====================

  function FnNum(fn, x) {
    try {
      const s = Math.sin(x), c = Math.cos(x);
      let v;
      switch (fn) {
        case 0: v = s; break;
        case 1: v = c; break;
        case 2: v = Math.abs(c) < 0.001 ? NaN : s / c; break;
        case 3: v = Math.abs(s) < 0.001 ? NaN : c / s; break;
        case 4: v = Math.abs(c) < 0.001 ? NaN : 1.0 / c; break;
        default: v = Math.abs(s) < 0.001 ? NaN : 1.0 / s;
      }
      if (!isFinite(v) || Math.abs(v) > 60.0) return NaN;
      return v;
    } catch (e) { return NaN; }
  }

  const SinT = ['0', '(√6-√2)/4', '1/2', '√2/2', '√3/2', '(√6+√2)/4', '1'];
  const CosT = ['1', '(√6+√2)/4', '√3/2', '√2/2', '1/2', '(√6-√2)/4', '0'];
  const TanT = ['0', '2-√3', '√3/3', '1', '√3', '2+√3', 'U'];
  const CotT = ['U', '2+√3', '√3', '1', '√3/3', '2-√3', '0'];
  const SecT = ['1', '√6-√2', '2√3/3', '√2', '2', '√6+√2', 'U'];
  const CscT = ['U', '√6+√2', '2', '√2', '2√3/3', '√6-√2', '1'];

  function TableVal(fn, refDeg) {
    const i = Math.trunc(refDeg / 15);
    switch (fn) {
      case 0: return SinT[i];
      case 1: return CosT[i];
      case 2: return TanT[i];
      case 3: return CotT[i];
      case 4: return SecT[i];
      default: return CscT[i];
    }
  }

  function Neg(s) {
    if (s === '0') return s;
    if (s.startsWith('(') || (!s.includes('-') && !s.includes('+'))) return '-' + s;
    return '-(' + s + ')';
  }

  function Norm(d) { return ((d % 360) + 360) % 360; }
  function QuadOf(red) { return red % 90 === 0 ? 0 : Math.trunc(red / 90) + 1; }
  function RefAngle(red) {
    switch (QuadOf(red)) {
      case 1: return red;
      case 2: return 180 - red;
      case 3: return red - 180;
      case 4: return 360 - red;
      default: return 0;
    }
  }
  function PositiveIn(fn, quad) {
    switch (fn) {
      case 0: case 5: return quad === 1 || quad === 2;
      case 1: case 4: return quad === 1 || quad === 4;
      default: return quad === 1 || quad === 3;
    }
  }

  function ExactStr(fn, deg) {
    const red = Norm(deg);
    const q = QuadOf(red);
    if (q === 0) {
      const x = red === 0 ? 1 : (red === 180 ? -1 : 0);
      const y = red === 90 ? 1 : (red === 270 ? -1 : 0);
      switch (fn) {
        case 0: return String(y);
        case 1: return String(x);
        case 2: return x === 0 ? 'U' : '0';
        case 3: return y === 0 ? 'U' : '0';
        case 4: return x === 0 ? 'U' : String(x);
        default: return y === 0 ? 'U' : String(y);
      }
    }
    const v = TableVal(fn, RefAngle(red));
    if (v === 'U') return 'U';
    return PositiveIn(fn, q) ? v : Neg(v);
  }

  function ValText(v) { return v === 'U' ? Tx('tanımsız', 'undefined') : v; }
  function Hdr(n, text) { return '── ' + n + ') ' + text + ' ──'; }
  function QuadName(q) { const roman = ['', 'I', 'II', 'III', 'IV'][q]; return Tx(`${roman}. bölge`, `quadrant ${roman}`); }

  function AxisName(red) {
    switch (red) {
      case 0: return Tx('pozitif x ekseni', 'positive x-axis');
      case 90: return Tx('pozitif y ekseni', 'positive y-axis');
      case 180: return Tx('negatif x ekseni', 'negative x-axis');
      default: return Tx('negatif y ekseni', 'negative y-axis');
    }
  }

  function DefText(fn) {
    switch (fn) {
      case 0: return 'sin θ = y/r';
      case 1: return 'cos θ = x/r';
      case 2: return 'tan θ = y/x = sin θ / cos θ';
      case 3: return 'cot θ = x/y = cos θ / sin θ';
      case 4: return 'sec θ = r/x = 1/cos θ';
      default: return 'csc θ = r/y = 1/sin θ';
    }
  }

  function DomainText(fn) {
    switch (fn) {
      case 0: case 1: return Tx('ℝ (tüm reel sayılar)', 'ℝ (all real numbers)');
      case 2: case 4: return Tx('θ ≠ π/2 + kπ (k tam sayı)', 'θ ≠ π/2 + kπ (k an integer)');
      default: return Tx('θ ≠ kπ (k tam sayı)', 'θ ≠ kπ (k an integer)');
    }
  }

  function RangeText(fn) {
    switch (fn) {
      case 0: case 1: return '[−1, 1]';
      case 2: case 3: return '(−∞, ∞)';
      default: return '(−∞, −1] ∪ [1, ∞)';
    }
  }

  function PeriodStr(fn) { return (fn === 2 || fn === 3) ? 'π' : '2π'; }
  function PeriodVal(fn) { return (fn === 2 || fn === 3) ? Math.PI : 2.0 * Math.PI; }

  function drpSteps(fn, steps, c) {
    steps.push(Hdr(++c.n, Tx(`${Names[fn]} için tanım kümesi, değer kümesi, periyot`, `Domain, range and period of ${Names[fn]}`)));
    steps.push(Tx(`Tanım kümesi: ${DomainText(fn)}.`, `Domain: ${DomainText(fn)}.`));
    steps.push(Tx(`Değer kümesi: ${RangeText(fn)}.`, `Range: ${RangeText(fn)}.`));
    steps.push(Tx(`Periyot: ${PeriodStr(fn)}  (${Names[fn]}(θ + ${PeriodStr(fn)}) = ${Names[fn]}(θ)).`, `Period: ${PeriodStr(fn)}  (${Names[fn]}(θ + ${PeriodStr(fn)}) = ${Names[fn]}(θ)).`));
  }

  function probeStep(p, steps, c) {
    const deg = p.t12 * 15;
    steps.push(Hdr(++c.n, Tx('Kaydırıcıdaki açı', 'The angle on the slider')));
    steps.push(Tx(`θ = ${PiStr(p.t12, 12)} (${deg}°) için ${Names[p.fn]} θ = ${ValText(ExactStr(p.fn, deg))}.`,
      `At θ = ${PiStr(p.t12, 12)} (${deg}°): ${Names[p.fn]} θ = ${ValText(ExactStr(p.fn, deg))}.`));
  }

  // ===================== problem generation =====================

  function createProblem(rng) { return genProblem(rng, rng.nextInt(0, 4)); }

  function genProblem(rng, kind) {
    const p = { kind, fn: 0, t12: 0, givenFn: 0, legA: 0, legB: 0, hyp: 0, quad: 1, theta0: 0 };
    const units = [];
    for (let u = -24; u <= 24; u++) if (u % 2 === 0 || u % 3 === 0) units.push(u);
    p.t12 = units[rng.nextInt(0, units.length)];
    p.fn = rng.nextInt(0, 6);
    if (p.kind === 1) {
      const trip = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
      const t = trip[rng.nextInt(0, trip.length)];
      p.givenFn = rng.nextInt(0, 3);
      p.quad = rng.nextInt(1, 5);
      if (rng.nextInt(0, 2) === 0) { p.legA = t[0]; p.legB = t[1]; } else { p.legA = t[1]; p.legB = t[0]; }
      p.hyp = t[2];
      if (p.fn === 0) p.fn = 2;
    } else if (p.kind === 2) {
      const list = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
      p.theta0 = list[rng.nextInt(0, list.length)];
      p.fn = rng.nextInt(0, 3);
    }
    return p;
  }

  // ===================== problem statement =====================

  function othersGiven(p) {
    const sy = p.quad <= 2 ? 1 : -1;
    const sx = (p.quad === 1 || p.quad === 4) ? 1 : -1;
    const y = sy * p.legA, x = sx * p.legB;
    switch (p.givenFn) {
      case 0: return `sin θ = ${Frac(y, p.hyp)}`;
      case 1: return `cos θ = ${Frac(x, p.hyp)}`;
      default: return `tan θ = ${Frac(y, x)}`;
    }
  }

  function problemStatement(p) {
    const f = Names[p.fn];
    switch (p.kind) {
      case 0: {
        const a = PiStr(p.t12, 12);
        return Tx(`${f}(${a}) değerini tam olarak hesaplayabilir miyiz? (Açıyı [0, 2π) aralığına indirip referans açı ve bölge işaretini kullanabiliriz.)`,
          `Can we evaluate ${f}(${a}) exactly? (We can reduce the angle to [0, 2π), then use the reference angle and the quadrant sign.)`);
      }
      case 1: {
        const given = othersGiven(p);
        return Tx(`${given} ve θ ${QuadName(p.quad)}'de olduğuna göre diğer beş trigonometrik fonksiyonu bulalım.`,
          `Given ${given} and θ in ${QuadName(p.quad)}, let's find the other five trigonometric functions.`);
      }
      case 2: {
        const v = ExactStr(p.fn, p.theta0);
        return Tx(`${f} θ = ${v} denklemini [0, 2π) aralığında çözelim.`, `Let's solve ${f} θ = ${v} for θ in [0, 2π).`);
      }
      default:
        return Tx(`${f} fonksiyonunun tanım kümesini, değer kümesini, periyodunu, paritesini, sıfırlarını ve asimptotlarını bulalım.`,
          `Let's find the domain, range, period, parity, zeros and asymptotes of ${f}.`);
    }
  }

  // ===================== solution steps =====================

  function solveSteps(p) {
    const steps = [];
    const c = { n: 0 };
    switch (p.kind) {
      case 0: evalSteps(p, steps, c); break;
      case 1: othersSteps(p, steps, c); break;
      case 2: solveEqSteps(p, steps, c); break;
      default: drpFullSteps(p, steps, c);
    }
    return steps;
  }

  function selectCalc(q, redUnits, refDeg) {
    const refUnits = Math.trunc(refDeg / 15);
    switch (q) {
      case 1: return `α = ${PiStr(redUnits, 12)} = ${refDeg}°`;
      case 2: return `α = π − ${PiStr(redUnits, 12)} = ${PiStr(refUnits, 12)} = ${refDeg}°`;
      case 3: return `α = ${PiStr(redUnits, 12)} − π = ${PiStr(refUnits, 12)} = ${refDeg}°`;
      default: return `α = 2π − ${PiStr(redUnits, 12)} = ${PiStr(refUnits, 12)} = ${refDeg}°`;
    }
  }

  function evalSteps(p, steps, c) {
    const fn = p.fn;
    const f = Names[fn];
    const nn = p.t12;
    const d = nn * 15;
    const red = Norm(d);
    const k = (d - red) / 360;
    const q = QuadOf(red);
    const redUnits = Math.trunc(red / 15);
    const result = ExactStr(fn, d);

    steps.push(Hdr(++c.n, Tx('Verilen ve tanım', 'Given and definition')));
    steps.push(Tx(`Hesaplayacağımız değer: ${f}(${PiStr(nn, 12)})   (θ = ${PiStr(nn, 12)} = ${d}°).`, `Let's evaluate ${f}(${PiStr(nn, 12)})   (θ = ${PiStr(nn, 12)} = ${d}°).`));
    steps.push(Tx(`Tanım: ${DefText(fn)}; burada P(x, y) bitiş kenarındaki nokta, r = √(x² + y²) > 0.`,
      `Definition: ${DefText(fn)}, where P(x, y) is a point on the terminal side and r = √(x² + y²) > 0.`));

    steps.push(Hdr(++c.n, Tx('Açıyı [0, 2π) aralığına indirelim', 'Reduce the angle to [0, 2π)')));
    if (k === 0) {
      steps.push(Tx(`${d}° zaten 0° ≤ θ < 360° aralığında; indirgemeye gerek yoktur: θ = ${PiStr(nn, 12)}.`,
        `${d}° already satisfies 0° ≤ θ < 360°; no reduction is needed: θ = ${PiStr(nn, 12)}.`));
    } else {
      const kk = Math.abs(k);
      const kTxt = kk === 1 ? '' : kk + '·';
      const op = k > 0 ? '−' : '+';
      steps.push(Tx(`${d}° aralığın dışında; ${kk} tam tur (${kTxt}2π) ${k > 0 ? 'çıkarabiliriz' : 'ekleyebiliriz'}: ${d}° ${op} ${kTxt}360° = ${red}°.`,
        `${d}° is outside the interval; we can ${k > 0 ? 'subtract' : 'add'} ${kk} full turn(s) (${kTxt}2π): ${d}° ${op} ${kTxt}360° = ${red}°.`));
      steps.push(Tx(`Radyanla: ${PiStr(nn, 12)} ${op} ${kTxt}2π = ${PiStr(redUnits, 12)}. Eş sonlu açıların trigonometrik değerleri aynıdır, bu yüzden ${f}(${PiStr(nn, 12)}) = ${f}(${PiStr(redUnits, 12)}).`,
        `In radians: ${PiStr(nn, 12)} ${op} ${kTxt}2π = ${PiStr(redUnits, 12)}. Coterminal angles have the same trig values, so ${f}(${PiStr(nn, 12)}) = ${f}(${PiStr(redUnits, 12)}).`));
    }

    if (q === 0) {
      const x = red === 0 ? 1 : (red === 180 ? -1 : 0);
      const y = red === 90 ? 1 : (red === 270 ? -1 : 0);
      steps.push(Hdr(++c.n, Tx('Eksen üzerindeki açı: koordinatlardan yararlanalım', 'Quadrantal angle: use the coordinates')));
      steps.push(Tx(`${red}° bir bölgede değil, ${AxisName(red)} üzerindedir. Bitiş kenarında r = 1 için P = (${x}, ${y}).`,
        `${red}° is not inside a quadrant: the terminal side is the ${AxisName(red)}. With r = 1 the point is P = (${x}, ${y}).`));
      steps.push(Hdr(++c.n, Tx('Tanımı uygulayalım', 'Apply the definition')));
      switch (fn) {
        case 0: steps.push(Tx(`sin θ = y/r = ${y}/1 = ${y}.`, `sin θ = y/r = ${y}/1 = ${y}.`)); break;
        case 1: steps.push(Tx(`cos θ = x/r = ${x}/1 = ${x}.`, `cos θ = x/r = ${x}/1 = ${x}.`)); break;
        case 2: steps.push(Tx(`tan θ = y/x = ${y}/${x}` + (x === 0 ? ': sıfıra bölme, TANIMSIZ.' : ` = ${ValText(result)}.`),
          `tan θ = y/x = ${y}/${x}` + (x === 0 ? ': division by zero, UNDEFINED.' : ` = ${ValText(result)}.`))); break;
        case 3: steps.push(Tx(`cot θ = x/y = ${x}/${y}` + (y === 0 ? ': sıfıra bölme, TANIMSIZ.' : ` = ${ValText(result)}.`),
          `cot θ = x/y = ${x}/${y}` + (y === 0 ? ': division by zero, UNDEFINED.' : ` = ${ValText(result)}.`))); break;
        case 4: steps.push(Tx(`sec θ = r/x = 1/${x}` + (x === 0 ? ': sıfıra bölme, TANIMSIZ.' : ` = ${ValText(result)}.`),
          `sec θ = r/x = 1/${x}` + (x === 0 ? ': division by zero, UNDEFINED.' : ` = ${ValText(result)}.`))); break;
        default: steps.push(Tx(`csc θ = r/y = 1/${y}` + (y === 0 ? ': sıfıra bölme, TANIMSIZ.' : ` = ${ValText(result)}.`),
          `csc θ = r/y = 1/${y}` + (y === 0 ? ': division by zero, UNDEFINED.' : ` = ${ValText(result)}.`)));
      }
    } else {
      const refDeg = RefAngle(red);
      const refU = Math.trunc(refDeg / 15);
      steps.push(Hdr(++c.n, Tx('Bölgeyi bulalım', 'Find the quadrant')));
      const lo = (q - 1) * 90;
      steps.push(Tx(`${lo}° < ${red}° < ${lo + 90}°  ⇒  bitiş kenarı ${QuadName(q)}'dedir.`, `${lo}° < ${red}° < ${lo + 90}°  ⇒  the terminal side lies in ${QuadName(q)}.`));
      steps.push(Hdr(++c.n, Tx('Referans açıya bakalım', 'Reference angle')));
      let formulaTr, formulaEn;
      switch (q) {
        case 1: formulaTr = 'I. bölgede α = θ'; formulaEn = 'In quadrant I, α = θ'; break;
        case 2: formulaTr = 'II. bölgede α = π − θ'; formulaEn = 'In quadrant II, α = π − θ'; break;
        case 3: formulaTr = 'III. bölgede α = θ − π'; formulaEn = 'In quadrant III, α = θ − π'; break;
        default: formulaTr = 'IV. bölgede α = 2π − θ'; formulaEn = 'In quadrant IV, α = 2π − θ';
      }
      const calc = selectCalc(q, redUnits, refDeg);
      steps.push(Tx(`${formulaTr} (bitiş kenarının en yakın x eksenine göre dar açısı): ${calc}.`, `${formulaEn} (the acute angle between the terminal side and the nearest x-axis): ${calc}.`));
      steps.push(Hdr(++c.n, Tx('İşareti ASTC ile bulalım', 'Determine the sign (ASTC)')));
      const pos = PositiveIn(fn, q);
      steps.push(Tx('ASTC (Hepsi–Sinüs–Tanjant–Kosinüs): I: hepsi +, II: sin ve csc +, III: tan ve cot +, IV: cos ve sec +.',
        'ASTC (All–Students–Take–Calculus): I: all +, II: sin and csc +, III: tan and cot +, IV: cos and sec +.'));
      const xs = (q === 1 || q === 4) ? '> 0' : '< 0';
      const ys = (q === 1 || q === 2) ? '> 0' : '< 0';
      steps.push(Tx(`${QuadName(q)}'de ${f} ${pos ? 'POZİTİF' : 'NEGATİF'} (x ${xs}, y ${ys}).`, `In ${QuadName(q)}, ${f} is ${pos ? 'POSITIVE' : 'NEGATIVE'} (x ${xs}, y ${ys}).`));
      steps.push(Hdr(++c.n, Tx('Referans açının kesin değeri', 'Exact value of the reference angle')));
      const t1 = `sin ${PiStr(refU, 12)} = ${ValText(TableVal(0, refDeg))},  cos ${PiStr(refU, 12)} = ${ValText(TableVal(1, refDeg))}.`;
      steps.push(Tx(t1, t1));
      steps.push(Tx(`${f} ${PiStr(refU, 12)} = ${ValText(TableVal(fn, refDeg))}   (${DefText(fn)} ile bulunur).`,
        `${f} ${PiStr(refU, 12)} = ${ValText(TableVal(fn, refDeg))}   (found from ${DefText(fn)}).`));
      steps.push(Hdr(++c.n, Tx('İşareti ekleyelim', 'Apply the sign')));
      const ap = `${f}(${PiStr(nn, 12)}) = ${pos ? '+' : '−'}${f} ${PiStr(refU, 12)} = ${ValText(result)}.`;
      steps.push(Tx(ap, ap));
    }

    steps.push(Hdr(++c.n, Tx('Kontrol', 'Check')));
    const num = FnNum(fn, d * Math.PI / 180.0);
    if (result === 'U') {
      steps.push(Tx(`${f} bu açıda tanımsızdır: grafikte x = ${PiStr(nn, 12)} doğrusu bir dikey asimptottur.`, `${f} is undefined at this angle: x = ${PiStr(nn, 12)} is a vertical asymptote of the graph.`));
    } else {
      steps.push(Tx(`Hesap makinesiyle (radyan modu): ${f}(${PiStr(nn, 12)}) ≈ ${fmt(num, 4)}. Kesin değer ${result} aynı sayıdır ✓.`,
        `Calculator (radian mode): ${f}(${PiStr(nn, 12)}) ≈ ${fmt(num, 4)}. The exact value ${result} is the same number ✓.`));
    }
    drpSteps(fn, steps, c);
  }

  function othersSteps(p, steps, c) {
    const sy = p.quad <= 2 ? 1 : -1;
    const sx = (p.quad === 1 || p.quad === 4) ? 1 : -1;
    const a = p.legA, b = p.legB, h = p.hyp;
    const y = sy * a, x = sx * b;
    const given = othersGiven(p);
    steps.push(Hdr(++c.n, Tx('Verilen', 'Given')));
    steps.push(Tx(`${given} ve θ ${QuadName(p.quad)}'de. Diğer beş trigonometrik fonksiyonu bulalım.`, `${given} and θ lies in ${QuadName(p.quad)}. Let's find the other five trigonometric functions.`));
    steps.push(Hdr(++c.n, Tx('Dik üçgeni oluşturalım', 'Build the reference triangle')));
    switch (p.givenFn) {
      case 0: steps.push(Tx(`sin θ = y/r olduğundan |y| = ${a}, r = ${h} alırız (r her zaman pozitiftir).`, `Since sin θ = y/r, we take |y| = ${a} and r = ${h} (r is always positive).`)); break;
      case 1: steps.push(Tx(`cos θ = x/r olduğundan |x| = ${b}, r = ${h} alırız (r her zaman pozitiftir).`, `Since cos θ = x/r, we take |x| = ${b} and r = ${h} (r is always positive).`)); break;
      default: steps.push(Tx(`tan θ = y/x olduğundan |y| = ${a}, |x| = ${b} alırız.`, `Since tan θ = y/x, we take |y| = ${a} and |x| = ${b}.`));
    }
    steps.push(Hdr(++c.n, Tx('Pisagor ile eksik kenarı bulalım', 'Find the missing side with Pythagoras')));
    switch (p.givenFn) {
      case 0: { const s = `x² + y² = r²  ⇒  x² = ${h}² − ${a}² = ${h * h} − ${a * a} = ${b * b}  ⇒  |x| = ${b}.`; steps.push(Tx(s, s)); break; }
      case 1: { const s = `x² + y² = r²  ⇒  y² = ${h}² − ${b}² = ${h * h} − ${b * b} = ${a * a}  ⇒  |y| = ${a}.`; steps.push(Tx(s, s)); break; }
      default: { const s = `r = √(x² + y²) = √(${b * b} + ${a * a}) = √${h * h} = ${h}.`; steps.push(Tx(s, s)); }
    }
    steps.push(Hdr(++c.n, Tx('İşaretleri bölgeden alalım', 'Take the signs from the quadrant')));
    steps.push(Tx(`${QuadName(p.quad)}'de x ${sx > 0 ? '> 0' : '< 0'} ve y ${sy > 0 ? '> 0' : '< 0'}. Dolayısıyla x = ${x}, y = ${y}, r = ${h}.`,
      `In ${QuadName(p.quad)}, x ${sx > 0 ? '> 0' : '< 0'} and y ${sy > 0 ? '> 0' : '< 0'}. Therefore x = ${x}, y = ${y}, r = ${h}.`));
    steps.push(Hdr(++c.n, Tx('Altı tanımı uygulayalım', 'Apply the six definitions')));
    steps.push(`sin θ = y/r = ${y}/${h} = ${Frac(y, h)}`);
    steps.push(`cos θ = x/r = ${x}/${h} = ${Frac(x, h)}`);
    steps.push(`tan θ = y/x = ${y}/${x} = ${Frac(y, x)}`);
    steps.push(`cot θ = x/y = ${x}/${y} = ${Frac(x, y)}`);
    steps.push(`sec θ = r/x = ${h}/${x} = ${Frac(h, x)}`);
    steps.push(`csc θ = r/y = ${h}/${y} = ${Frac(h, y)}`);
    steps.push(Hdr(++c.n, Tx('Kontrol edelim (özdeşlikler)', 'Check (identities)')));
    const i1 = `sin²θ + cos²θ = (${y}/${h})² + (${x}/${h})² = ${y * y}/${h * h} + ${x * x}/${h * h} = ${y * y + x * x}/${h * h} = 1 ✓.`;
    steps.push(Tx(i1, i1));
    const i2 = `1 + tan²θ = 1 + ${y * y}/${x * x} = ${x * x + y * y}/${x * x} = (${h}/${Math.abs(x)})² = sec²θ ✓.`;
    steps.push(Tx(i2, i2));
    steps.push(Tx(`İşaret kontrolü (${QuadName(p.quad)}): sin ${sy > 0 ? '+' : '−'}, cos ${sx > 0 ? '+' : '−'}, tan ${sx * sy > 0 ? '+' : '−'} ASTC ile uyumlu ✓.`,
      `Sign check (${QuadName(p.quad)}): sin ${sy > 0 ? '+' : '−'}, cos ${sx > 0 ? '+' : '−'}, tan ${sx * sy > 0 ? '+' : '−'} agree with ASTC ✓.`));
    let ang = Math.atan2(y, x) * 180.0 / Math.PI;
    if (ang < 0) ang += 360.0;
    steps.push(Tx(`θ ≈ ${fmt(ang, 1)}° (${fmt(ang * Math.PI / 180.0, 3)} rad); bu özel bir açı değildir, bu yüzden değerleri kesirlerle yazarız.`,
      `θ ≈ ${fmt(ang, 1)}° (${fmt(ang * Math.PI / 180.0, 3)} rad); this is not a special angle, so we write the values as fractions.`));
    drpSteps(p.fn, steps, c);
    probeStep(p, steps, c);
  }

  function solveEqSteps(p, steps, c) {
    const fn = p.fn;
    const f = Names[fn];
    const v = ExactStr(fn, p.theta0);
    const negative = v.startsWith('-');
    let absV = negative ? v.substring(1) : v;
    if (absV.startsWith('(') && absV.endsWith(')')) absV = absV.substring(1, absV.length - 1);
    let refDeg = 0;
    for (let cand = 15; cand <= 75; cand += 15) {
      if (TableVal(fn, cand) === absV) { refDeg = cand; break; }
    }
    const sols = [];
    for (let deg = 0; deg <= 345; deg += 15) if (ExactStr(fn, deg) === v) sols.push(deg);
    const solTxt = sols.map((s) => PiStr(Math.trunc(s / 15), 12)).join(',  ');

    steps.push(Hdr(++c.n, Tx('Verilen', 'Given')));
    steps.push(Tx(`${f} θ = ${v} denklemini 0 ≤ θ < 2π için çözelim.`, `Let's solve ${f} θ = ${v} for 0 ≤ θ < 2π.`));
    steps.push(Hdr(++c.n, Tx('Önce değer kümesine bakalım', 'Check the range')));
    steps.push(Tx(`${f} fonksiyonunun değer kümesi ${RangeText(fn)}; ${v} bu kümededir, çözüm vardır.`, `The range of ${f} is ${RangeText(fn)}; ${v} belongs to it, so solutions exist.`));
    steps.push(Hdr(++c.n, Tx('Referans açıyı bulalım', 'Find the reference angle')));
    const ru = Math.trunc(refDeg / 15);
    steps.push(Tx(`Önce işareti hesaba katmayalım: ${f} α = ${absV}. Tablodan α = ${PiStr(ru, 12)} (${refDeg}°).`, `Let's ignore the sign first: ${f} α = ${absV}. From the table α = ${PiStr(ru, 12)} (${refDeg}°).`));
    steps.push(Hdr(++c.n, Tx('Hangi bölgelerde? (ASTC)', 'Which quadrants? (ASTC)')));
    const qs = [];
    for (let q = 1; q <= 4; q++) if (PositiveIn(fn, q) !== negative) qs.push(q);
    const qTxt = qs.map(QuadName).join(' ve ');
    const qTxtEn = qs.map(QuadName).join(' and ');
    steps.push(Tx(`${f} değeri ${negative ? 'NEGATİF' : 'POZİTİF'} olduğundan çözümler ${qTxt}'dedir.`, `${f} is ${negative ? 'NEGATIVE' : 'POSITIVE'}, so the solutions lie in ${qTxtEn}.`));
    steps.push(Hdr(++c.n, Tx('Her bölgede açıyı oluşturalım', 'Build the angle in each quadrant')));
    qs.forEach((q) => {
      switch (q) {
        case 1: steps.push(Tx(`I. bölge: θ = α = ${PiStr(ru, 12)}.`, `Quadrant I: θ = α = ${PiStr(ru, 12)}.`)); break;
        case 2: steps.push(Tx(`II. bölge: θ = π − α = π − ${PiStr(ru, 12)} = ${PiStr(12 - ru, 12)}.`, `Quadrant II: θ = π − α = π − ${PiStr(ru, 12)} = ${PiStr(12 - ru, 12)}.`)); break;
        case 3: steps.push(Tx(`III. bölge: θ = π + α = π + ${PiStr(ru, 12)} = ${PiStr(12 + ru, 12)}.`, `Quadrant III: θ = π + α = π + ${PiStr(ru, 12)} = ${PiStr(12 + ru, 12)}.`)); break;
        default: steps.push(Tx(`IV. bölge: θ = 2π − α = 2π − ${PiStr(ru, 12)} = ${PiStr(24 - ru, 12)}.`, `Quadrant IV: θ = 2π − α = 2π − ${PiStr(ru, 12)} = ${PiStr(24 - ru, 12)}.`));
      }
    });
    steps.push(Hdr(++c.n, Tx('Çözüm kümesi', 'Solution set')));
    const degList = sols.map((s) => s + '°').join(', ');
    steps.push(Tx(`[0, 2π) içinde θ ∈ { ${solTxt} }   (derece: ${degList}).`, `In [0, 2π): θ ∈ { ${solTxt} }   (degrees: ${degList}).`));
    if (fn === 2 || fn === 3) {
      steps.push(Tx(`Periyot π olduğundan tüm çözümler: θ = ${PiStr(Math.trunc(sols[0] / 15), 12)} + kπ (k tam sayı).`, `Since the period is π, all solutions are θ = ${PiStr(Math.trunc(sols[0] / 15), 12)} + kπ (k an integer).`));
    } else {
      steps.push(Tx('Periyot 2π olduğundan her çözüme 2πk ekleyebiliriz (k tam sayı).', 'Since the period is 2π, we can add 2πk (k an integer) to every solution.'));
    }
    steps.push(Hdr(++c.n, Tx('Kontrol edelim', 'Check')));
    sols.forEach((s) => { steps.push(`${f}(${PiStr(Math.trunc(s / 15), 12)}) = ${ValText(ExactStr(fn, s))}  ✓`); });
    drpSteps(fn, steps, c);
    probeStep(p, steps, c);
  }

  function drpFullSteps(p, steps, c) {
    const fn = p.fn;
    const f = Names[fn];
    steps.push(Hdr(++c.n, Tx('Verilen ve tanım', 'Given and definition')));
    steps.push(Tx(`${f} fonksiyonunun tanım kümesini, değer kümesini, periyodunu, paritesini, sıfırlarını ve asimptotlarını bulalım.`, `Let's find the domain, range, period, parity, zeros and asymptotes of ${f}.`));
    steps.push(Tx(`Tanım: ${DefText(fn)}  (P(x, y), r > 0).`, `Definition: ${DefText(fn)}  (P(x, y), r > 0).`));
    steps.push(Hdr(++c.n, Tx('Tanım kümesi', 'Domain')));
    switch (fn) {
      case 0: steps.push(Tx('sin θ = y/r ve r > 0 olduğundan her θ için tanımlıdır: tanım kümesi ℝ.', 'sin θ = y/r with r > 0 is defined for every θ: domain ℝ.')); break;
      case 1: steps.push(Tx('cos θ = x/r ve r > 0 olduğundan her θ için tanımlıdır: tanım kümesi ℝ.', 'cos θ = x/r with r > 0 is defined for every θ: domain ℝ.')); break;
      case 2: steps.push(Tx('tan θ = y/x, x = 0 iken tanımsız. x = 0 ⇔ cos θ = 0 ⇔ θ = π/2 + kπ. Tanım kümesi: θ ≠ π/2 + kπ.', 'tan θ = y/x is undefined when x = 0. x = 0 ⇔ cos θ = 0 ⇔ θ = π/2 + kπ. Domain: θ ≠ π/2 + kπ.')); break;
      case 3: steps.push(Tx('cot θ = x/y, y = 0 iken tanımsız. y = 0 ⇔ sin θ = 0 ⇔ θ = kπ. Tanım kümesi: θ ≠ kπ.', 'cot θ = x/y is undefined when y = 0. y = 0 ⇔ sin θ = 0 ⇔ θ = kπ. Domain: θ ≠ kπ.')); break;
      case 4: steps.push(Tx('sec θ = 1/cos θ, cos θ = 0 iken tanımsız: θ = π/2 + kπ. Tanım kümesi: θ ≠ π/2 + kπ.', 'sec θ = 1/cos θ is undefined when cos θ = 0: θ = π/2 + kπ. Domain: θ ≠ π/2 + kπ.')); break;
      default: steps.push(Tx('csc θ = 1/sin θ, sin θ = 0 iken tanımsız: θ = kπ. Tanım kümesi: θ ≠ kπ.', 'csc θ = 1/sin θ is undefined when sin θ = 0: θ = kπ. Domain: θ ≠ kπ.'));
    }
    steps.push(Hdr(++c.n, Tx('Değer kümesi', 'Range')));
    switch (fn) {
      case 0: case 1: steps.push(Tx('−r ≤ y ≤ r ve −r ≤ x ≤ r olduğundan −1 ≤ sin θ ≤ 1, −1 ≤ cos θ ≤ 1. Değer kümesi [−1, 1] (her değer alınır).', 'Since −r ≤ y ≤ r and −r ≤ x ≤ r, −1 ≤ sin θ ≤ 1 and −1 ≤ cos θ ≤ 1. Range [−1, 1] (every value is attained).')); break;
      case 2: case 3: steps.push(Tx('y/x (veya x/y) oranı, bitiş kenarı eksene yaklaşırken sınırsız büyür ve her reel değeri alır. Değer kümesi (−∞, ∞).', 'The ratio y/x (or x/y) grows without bound as the terminal side nears an axis and attains every real value. Range (−∞, ∞).')); break;
      default: steps.push(Tx('|cos θ| ≤ 1 (|sin θ| ≤ 1) olduğundan |sec θ| = 1/|cos θ| ≥ 1 (|csc θ| ≥ 1). Değer kümesi (−∞, −1] ∪ [1, ∞); (−1, 1) aralığına hiç girmez.', 'Since |cos θ| ≤ 1 (|sin θ| ≤ 1), |sec θ| = 1/|cos θ| ≥ 1 (|csc θ| ≥ 1). Range (−∞, −1] ∪ [1, ∞); it never enters (−1, 1).'));
    }
    steps.push(Hdr(++c.n, Tx('Periyot', 'Period')));
    if (fn === 2 || fn === 3) {
      steps.push(Tx("θ'ya π eklemek P(x, y) noktasını (−x, −y)'ye taşır; oran y/x değişmez. Periyot π (daha küçük pozitif bir sayı yok).", 'Adding π to θ moves P(x, y) to (−x, −y); the ratio y/x is unchanged. The period is π (no smaller positive number works).'));
    } else {
      steps.push(Tx("θ'ya 2π eklemek tam tur döndürür: P aynı yerde kalır. Periyot 2π (π eklemek işareti değiştirir).", 'Adding 2π to θ is a full turn: P stays where it is. The period is 2π (adding π flips the sign).'));
    }
    steps.push(Hdr(++c.n, Tx('Parite, sıfırlar, asimptotlar', 'Parity, zeros, asymptotes')));
    const parity = (fn === 1 || fn === 4)
      ? Tx('ÇİFT: f(−θ) = f(θ) (y eksenine göre simetrik)', 'EVEN: f(−θ) = f(θ) (symmetric about the y-axis)')
      : Tx('TEK: f(−θ) = −f(θ) (orijine göre simetrik)', 'ODD: f(−θ) = −f(θ) (symmetric about the origin)');
    steps.push(Tx(`Parite: ${Names[fn]} ${parity}.`, `Parity: ${Names[fn]} is ${parity}.`));
    switch (fn) {
      case 0: steps.push(Tx('Sıfırlar: θ = kπ.  Asimptot yok.', 'Zeros: θ = kπ.  No asymptotes.')); break;
      case 1: steps.push(Tx('Sıfırlar: θ = π/2 + kπ.  Asimptot yok.', 'Zeros: θ = π/2 + kπ.  No asymptotes.')); break;
      case 2: steps.push(Tx('Sıfırlar: θ = kπ.  Dikey asimptotlar: θ = π/2 + kπ.', 'Zeros: θ = kπ.  Vertical asymptotes: θ = π/2 + kπ.')); break;
      case 3: steps.push(Tx('Sıfırlar: θ = π/2 + kπ.  Dikey asimptotlar: θ = kπ.', 'Zeros: θ = π/2 + kπ.  Vertical asymptotes: θ = kπ.')); break;
      case 4: steps.push(Tx('Sıfır yok (1/cos hiç 0 olmaz).  Dikey asimptotlar: θ = π/2 + kπ.', 'No zeros (1/cos is never 0).  Vertical asymptotes: θ = π/2 + kπ.')); break;
      default: steps.push(Tx('Sıfır yok (1/sin hiç 0 olmaz).  Dikey asimptotlar: θ = kπ.', 'No zeros (1/sin is never 0).  Vertical asymptotes: θ = kπ.'));
    }
    steps.push(Hdr(++c.n, Tx('Özel değerler', 'Special values')));
    const vals = [];
    for (let deg = 0; deg <= 90; deg += 15) {
      if (deg % 30 === 0 || deg === 45) vals.push(`${Names[fn]}(${PiStr(Math.trunc(deg / 15), 12)}) = ${ValText(TableVal(fn, deg))}`);
    }
    steps.push(vals.join(';   '));
    steps.push(Hdr(++c.n, Tx('Özet', 'Summary')));
    steps.push(Tx(`${Names[fn]}: tanım kümesi ${DomainText(fn)}; değer kümesi ${RangeText(fn)}; periyot ${PeriodStr(fn)}.`,
      `${Names[fn]}: domain ${DomainText(fn)}; range ${RangeText(fn)}; period ${PeriodStr(fn)}.`));
    probeStep(p, steps, c);
  }

  // ===================== drawing =====================

  // the probe point (theta, f(theta)); on an asymptote the axis point (theta, 0)
  function focusPoint(p) {
    const th = p.t12 * Math.PI / 12.0;
    const yv = FnNum(p.fn, th);
    return { x: th, y: (ExactStr(p.fn, p.t12 * 15) === 'U' || isNaN(yv)) ? 0 : yv };
  }

  function draw(canvas, p) {
    if (radioCtl) radioCtl.refreshFromModel(); // keep the radios in step with a freshly generated problem
    const fn = p.fn;
    const twoPi = 2.0 * Math.PI;
    const bounded = fn <= 1;
    const yHi = bounded ? 1.9 : 4.5;
    const fp = focusPoint(p);
    const cx = 0, cy = 0; // fixed axes: the origin stays where it is
    canvas.setViewport(cx - twoPi - 0.6, cx + twoPi + 0.6, cy - yHi, cy + yHi);

    const accent = canvas.accent();
    canvas.addFunction({ evaluator: (x) => FnNum(fn, x), color: accent, thickness: 3 });

    if (fn >= 2) {
      for (let k = -9; k <= 9; k++) {
        const x = (fn === 2 || fn === 4) ? Math.PI / 2.0 + k * Math.PI : k * Math.PI;
        if (Math.abs(x - cx) <= twoPi + 0.6) canvas.addGuideLine({ axis: 'vertical', position: x, color: '#cd5c5c' });
      }
    }
    if (fn !== 2 && fn !== 3) {
      canvas.addGuideLine({ axis: 'horizontal', position: 1, color: '#808080' });
      canvas.addGuideLine({ axis: 'horizontal', position: -1, color: '#808080' });
    }

    const u0 = Math.round(cx / (Math.PI / 2.0));
    for (let u = u0 - 4; u <= u0 + 4; u++) {
      if (u !== 0) canvas.addMarker({ x: u * Math.PI / 2.0, y: 0, color: '#696969', radius: 2, label: PiStr(u, 2) });
    }

    const period = PeriodVal(fn);
    const yb = cy - yHi * 0.78;
    const x0 = cx - twoPi;
    const orange = '#ff8c00';
    canvas.addSegment({ x1: x0, y1: yb, x2: x0 + period, y2: yb, color: orange, thickness: 4 });
    canvas.addSegment({ x1: x0, y1: yb - yHi * 0.05, x2: x0, y2: yb + yHi * 0.05, color: orange, thickness: 3 });
    canvas.addSegment({ x1: x0 + period, y1: yb - yHi * 0.05, x2: x0 + period, y2: yb + yHi * 0.05, color: orange, thickness: 3 });
    canvas.addMarker({ x: x0 + period / 2.0, y: yb + yHi * 0.1, color: orange, radius: 1.5, label: Tx(`1 periyot = ${PeriodStr(fn)}`, `one period = ${PeriodStr(fn)}`) });

    const th = p.t12 * Math.PI / 12.0;
    const deg = p.t12 * 15;
    const yv = FnNum(fn, th);
    const ex = ExactStr(fn, deg);
    const crimson = '#dc143c';
    if (ex === 'U' || isNaN(yv)) {
      canvas.addGuideLine({ axis: 'vertical', position: th, color: crimson });
      canvas.addMarker({ x: th, y: 0, color: crimson, radius: 5, hollow: true, label: Tx(`θ = ${PiStr(p.t12, 12)}: tanımsız`, `θ = ${PiStr(p.t12, 12)}: undefined`) });
    } else {
      canvas.addSegment({ x1: th, y1: 0, x2: th, y2: yv, color: crimson, thickness: 2, dashed: true });
      canvas.addMarker({ x: th, y: yv, color: crimson, radius: 6, label: `${Names[fn]}(${PiStr(p.t12, 12)}) = ${ex}` });
      const th2 = th + period <= twoPi + 0.3 ? th + period : th - period;
      if (Math.abs(th2 - cx) <= twoPi + 0.3) {
        canvas.addMarker({ x: th2, y: yv, color: orange, radius: 5, hollow: true });
      }
    }

    if (p.kind === 2) {
      const v = ExactStr(fn, p.theta0);
      const kv = FnNum(fn, p.theta0 * Math.PI / 180.0);
      if (!isNaN(kv)) {
        canvas.addGuideLine({ axis: 'horizontal', position: kv, color: canvas.green() });
        for (let d2 = 0; d2 <= 345; d2 += 15) {
          if (ExactStr(fn, d2) === v) {
            canvas.addMarker({ x: d2 * Math.PI / 180.0, y: kv, color: canvas.green(), radius: 5, label: PiStr(Math.trunc(d2 / 15), 12) });
          }
        }
      }
    }

    canvas.addMarker({ x: cx - twoPi - 0.45, y: cy + yHi * 0.88, color: accent, radius: 1.5, label: `y = ${Names[fn]} θ    θ = ${PiStr(p.t12, 12)} (${deg}°)` });
  }

  Topics.register('trig', {
    id: 'trigFunctions',
    tabTitle: () => Tx('Trigonometrik Fonksiyonlar', 'Trigonometric Functions'),
    concept: () => Tx(
      "ALTI TEMEL FONKSİYON: Standart konumdaki θ açısının bitiş kenarı üzerinde r yarıçaplı çemberde P(x, y) noktasını alalım (r = √(x² + y²) > 0).\n" +
      "   sin θ = y/r\n" +
      "   cos θ = x/r\n" +
      "   tan θ = y/x = sin θ / cos θ\n" +
      "   cot θ = x/y = cos θ / sin θ = 1/tan θ\n" +
      "   sec θ = r/x = 1/cos θ\n" +
      "   csc θ = r/y = 1/sin θ\n\n" +
      "İŞARETLER (ASTC): I. bölge: HEPSİ (+).  II: yalnız SİNÜS (ve csc) +.  III: yalnız TANJANT (ve cot) +.  IV: yalnız KOSİNÜS (ve sec) +. " +
      "Anımsatıcı: \"Hepsi Sinüs Tanjant Kosinüs\" – \"Her Sabah Tatlı Kahve\" (İngilizce: All Students Take Calculus).\n\n" +
      "ÖZEL DEĞERLER:\n" +
      "   θ:     0     π/6     π/4     π/3     π/2\n" +
      "   sin:   0     1/2     √2/2    √3/2    1\n" +
      "   cos:   1     √3/2    √2/2    1/2     0\n" +
      "   tan:   0     √3/3    1       √3      tanımsız\n" +
      "Diğer açılar yansıtmalarla: 5π/6 = π − π/6, 7π/6 = π + π/6, 11π/6 = 2π − π/6 ... (referans açı + işaret).\n\n" +
      "TANIM KÜMESİ / DEĞER KÜMESİ / PERİYOT:\n" +
      "   sin, cos: ℝ ;  [−1, 1] ;  2π\n" +
      "   tan: θ ≠ π/2 + kπ ;  (−∞, ∞) ;  π\n" +
      "   cot: θ ≠ kπ ;  (−∞, ∞) ;  π\n" +
      "   sec: θ ≠ π/2 + kπ ;  (−∞, −1] ∪ [1, ∞) ;  2π\n" +
      "   csc: θ ≠ kπ ;  (−∞, −1] ∪ [1, ∞) ;  2π\n\n" +
      "YÖNTEM (kesin değer): (1) Açıyı 2π katları ekleyip çıkararak [0, 2π) aralığına indirebiliriz. (2) Bölgesine bakarız. (3) Referans açıyı buluruz (en yakın x ekseniyle yaptığı dar açı). " +
      "(4) Referans açının kesin değerini tablodan alırız. (5) ASTC ile işareti ekleriz. Dikey kesikli çizgiler tan, cot, sec, csc için asimptotlardır; grafikteki işaretli aralık bir periyodu gösterir.",
      "THE SIX BASIC FUNCTIONS: let's take a point P(x, y) on the terminal side of the angle θ in standard position, on a circle of radius r (r = √(x² + y²) > 0).\n" +
      "   sin θ = y/r\n" +
      "   cos θ = x/r\n" +
      "   tan θ = y/x = sin θ / cos θ\n" +
      "   cot θ = x/y = cos θ / sin θ = 1/tan θ\n" +
      "   sec θ = r/x = 1/cos θ\n" +
      "   csc θ = r/y = 1/sin θ\n\n" +
      "SIGNS (ASTC): quadrant I: ALL (+).  II: only SINE (and csc) +.  III: only TANGENT (and cot) +.  IV: only COSINE (and sec) +. " +
      "Mnemonic: \"All Students Take Calculus\" (Turkish: \"Hepsi Sinüs Tanjant Kosinüs\").\n\n" +
      "SPECIAL VALUES:\n" +
      "   θ:     0     π/6     π/4     π/3     π/2\n" +
      "   sin:   0     1/2     √2/2    √3/2    1\n" +
      "   cos:   1     √3/2    √2/2    1/2     0\n" +
      "   tan:   0     √3/3    1       √3      undefined\n" +
      "Other angles by reflection: 5π/6 = π − π/6, 7π/6 = π + π/6, 11π/6 = 2π − π/6 ... (reference angle + sign).\n\n" +
      "DOMAIN / RANGE / PERIOD:\n" +
      "   sin, cos: ℝ ;  [−1, 1] ;  2π\n" +
      "   tan: θ ≠ π/2 + kπ ;  (−∞, ∞) ;  π\n" +
      "   cot: θ ≠ kπ ;  (−∞, ∞) ;  π\n" +
      "   sec: θ ≠ π/2 + kπ ;  (−∞, −1] ∪ [1, ∞) ;  2π\n" +
      "   csc: θ ≠ kπ ;  (−∞, −1] ∪ [1, ∞) ;  2π\n\n" +
      "METHOD (exact value): (1) We reduce the angle into [0, 2π) by adding or subtracting multiples of 2π. (2) We find the quadrant. (3) We find the reference angle (the acute angle to the nearest x-axis). " +
      "(4) We read the exact value of the reference angle from the table. (5) We attach the sign using ASTC. Dashed vertical lines are the asymptotes of tan, cot, sec, csc; the marked span on the graph is one period."),
    problemStatement,
    createProblem,
    solveSteps,
    links: [
      { match: /^\s+sin θ = y\/r/, make: (rng) => Object.assign(genProblem(rng, 0), { fn: 0 }) },
      { match: /^\s+cos θ = x\/r/, make: (rng) => Object.assign(genProblem(rng, 0), { fn: 1 }) },
      { match: /^\s+tan θ = y\/x/, make: (rng) => Object.assign(genProblem(rng, 0), { fn: 2 }) },
      { match: /^\s+cot θ = x\/y/, make: (rng) => Object.assign(genProblem(rng, 0), { fn: 3 }) },
      { match: /^\s+sec θ = r\/x/, make: (rng) => Object.assign(genProblem(rng, 0), { fn: 4 }) },
      { match: /^\s+csc θ = r\/y/, make: (rng) => Object.assign(genProblem(rng, 0), { fn: 5 }) },
      { match: /^(İŞARETLER|SIGNS) \(ASTC\):/, make: (rng) => genProblem(rng, 1) },
      { match: /^(ÖZEL DEĞERLER|SPECIAL VALUES):/, make: (rng) => Object.assign(genProblem(rng, 0), { t12: rng.pick([0, 2, 3, 4, 6, 8, 9, 10, 12]) }) },
      { match: /^\s+sin, cos: ℝ/, make: (rng) => Object.assign(genProblem(rng, 3), { fn: rng.nextInt(0, 2) }) },
      { match: /^\s+tan: θ ≠/, make: (rng) => Object.assign(genProblem(rng, 3), { fn: 2 }) },
      { match: /^\s+cot: θ ≠/, make: (rng) => Object.assign(genProblem(rng, 3), { fn: 3 }) },
      { match: /^\s+sec: θ ≠/, make: (rng) => Object.assign(genProblem(rng, 3), { fn: 4 }) },
      { match: /^\s+csc: θ ≠/, make: (rng) => Object.assign(genProblem(rng, 3), { fn: 5 }) },
    ],
    draw,
    focus: (p) => focusPoint(p),
    buildControls: (rightCol, getProblem, h) => {
      const header = document.createElement('div');
      header.className = 'we-slider-caption';
      header.style.fontWeight = '600';
      header.textContent = Tx('Gösterilen fonksiyon:', 'Function shown:');
      rightCol.appendChild(header);
      radioCtl = h.addRadioGroup({
        name: 'trigFnShown',
        options: Names.map((nm, i) => ({ label: nm + ' θ', value: i })),
        get: () => getProblem().fn,
        set: (v) => { getProblem().fn = v; },
      });
      const reg = h.addSlider({
        caption: Tx('Açı θ (radyan, adım π/12 ≈ 0,26)', 'Angle θ (radians, step π/12 ≈ 0.26)'),
        min: -2.0 * Math.PI, max: 2.0 * Math.PI,
        get: () => getProblem().t12 * Math.PI / 12.0,
        set: (v) => { getProblem().t12 = Math.max(-24, Math.min(24, Math.round(v / (Math.PI / 12.0)))); },
      });
      reg.input.addEventListener('input', () => {
        const v = getProblem().t12 * Math.PI / 12.0;
        reg.input.value = String(Math.max(0, Math.min(1000, Math.round((v + 2.0 * Math.PI) / (4.0 * Math.PI) * 1000))));
      });
    },
  });
})();
