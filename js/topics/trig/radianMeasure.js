// Ported from Modules/Trigonometry/RadianMeasureControl.vb - radian measure and angles in standard position
// (degree/radian conversion, arc length s = r*theta, central angle, direction, turns, coterminal angles).
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const { gcd: Gcd, frac: Frac, piStr: PiStr } = TrigKit;

  // VB-style "0.##" / "0.###" formatting (max `dec` decimals, no trailing zeros).
  function fmt(x, dec) {
    if (!isFinite(x)) return '0';
    let s = x.toFixed(dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }

  const NICE = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];

  function Norm(d) { return ((d % 360) + 360) % 360; }
  function RadStr(d) { return PiStr(d, 180); }
  function Hdr(n, text) { return '── ' + n + ') ' + text + ' ──'; }

  function QuadText(red) {
    switch (red) {
      case 0: return Tx('pozitif x ekseni', 'positive x-axis');
      case 90: return Tx('pozitif y ekseni', 'positive y-axis');
      case 180: return Tx('negatif x ekseni', 'negative x-axis');
      case 270: return Tx('negatif y ekseni', 'negative y-axis');
      default: {
        const q = Math.trunc(red / 90) + 1;
        const roman = ['', 'I', 'II', 'III', 'IV'][q];
        return Tx(`${roman}. bölge`, `quadrant ${roman}`);
      }
    }
  }

  function TurnsText(d) { return fmt(Math.abs(d) / 360.0, 2); }
  function ArcLen(r, d) { return PiStr(r * Math.abs(d), 180); }
  function ArcLenNum(r, d) { return r * Math.abs(d) * Math.PI / 180.0; }

  function createProblem(rng) { return genProblem(rng, rng.nextInt(0, 6)); }

  function genProblem(rng, kind) {
    const p = { kind, r: rng.nextInt(1, 6), d: 0, inRad: false };
    switch (p.kind) {
      case 0: case 5:
        do { p.d = rng.nextInt(-48, 49) * 15; } while (p.d === 0);
        if (p.kind === 0 && rng.nextInt(0, 3) === 0) p.d = NICE[rng.nextInt(0, NICE.length)] * (rng.nextInt(0, 2) === 0 ? 1 : -1);
        break;
      case 1:
        do { p.d = rng.nextInt(-36, 37) * 15; } while (p.d === 0);
        break;
      case 2:
        p.d = NICE[rng.nextInt(0, NICE.length)];
        p.inRad = (rng.nextInt(0, 2) === 0);
        break;
      case 3:
        p.d = NICE[rng.nextInt(0, NICE.length)];
        p.r = rng.nextInt(2, 6);
        break;
      default: {
        const list = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 270, 300, 360, 390, 405, 450, 495, 540, 600, 660, 720];
        p.d = list[rng.nextInt(0, list.length)] * (rng.nextInt(0, 2) === 0 ? 1 : -1);
        if (rng.nextInt(0, 3) === 0) p.d = -60;
      }
    }
    return p;
  }

  // ===================== solution steps =====================

  function convertToRad(p, steps, c) {
    const d = p.d;
    const g = Gcd(d, 180);
    steps.push(Hdr(++c.n, Tx('Verilen ve istenen', 'Given and wanted')));
    steps.push(Tx(`Verilen: θ = ${d}°.   Bulmak istediğimiz: θ'yı radyan cinsinden yazmak ve [0, 2π) aralığındaki denk açıyı bulmak.`,
      `Given: θ = ${d}°.   Wanted: θ in radians, and the equivalent angle in [0, 2π).`));
    steps.push(Hdr(++c.n, Tx('Dönüşüm çarpanı', 'Conversion factor')));
    steps.push(Tx('Tam tur 360° = 2π rad olduğundan π rad = 180°. Buradan 1° = π/180 rad. Dereceyi radyana çevirirken π/180 ile çarparız.',
      'A full turn 360° = 2π rad, so π rad = 180°. Hence 1° = π/180 rad. To go from degrees to radians we multiply by π/180.'));
    steps.push(Hdr(++c.n, Tx('Çarp ve sadeleştir', 'Multiply and simplify')));
    steps.push(Tx(`θ = ${d} · π/180 = ${d}π/180.   OBEB(${Math.abs(d)}, 180) = ${g}, pay ve paydayı ${g} ile bölelim: θ = ${RadStr(d)} rad.`,
      `θ = ${d} · π/180 = ${d}π/180.   GCD(${Math.abs(d)}, 180) = ${g}; we can divide numerator and denominator by ${g}: θ = ${RadStr(d)} rad.`));
    steps.push(Tx(`Sayısal değer: θ ≈ ${fmt(d * Math.PI / 180.0, 3)} rad.`, `Numerical value: θ ≈ ${fmt(d * Math.PI / 180.0, 3)} rad.`));
    steps.push(Hdr(++c.n, Tx('[0, 2π) aralığındaki denk açı', 'Equivalent angle in [0, 2π)')));
    const red = Norm(d);
    const k = (d - red) / 360;
    if (k === 0) {
      steps.push(Tx(`${d}° zaten 0° ile 360° arasındadır, yani θ = ${RadStr(d)} zaten [0, 2π) içindedir.`,
        `${d}° is already between 0° and 360°, so θ = ${RadStr(d)} is already in [0, 2π).`));
    } else {
      const kk = Math.abs(k);
      const op = k > 0 ? '−' : '+';
      const kTxt = kk === 1 ? '' : kk + '·';
      steps.push(Tx(`${d}° aralığın dışında kalıyor; ${kk} tam tur ${k > 0 ? 'çıkarabiliriz' : 'ekleyebiliriz'}. ${d}° ${op} ${kTxt}360° = ${red}°.`,
        `${d}° is outside the interval, so we ${k > 0 ? 'subtract' : 'add'} ${kk} full turn(s). ${d}° ${op} ${kTxt}360° = ${red}°.`));
      steps.push(Tx(`Radyanla: ${RadStr(d)} ${op} ${kTxt}2π = ${RadStr(red)}. Yani θ = ${RadStr(d)}, ${RadStr(red)} ile eş sonludur (aynı bitiş kenarı).`,
        `In radians: ${RadStr(d)} ${op} ${kTxt}2π = ${RadStr(red)}. So θ = ${RadStr(d)} is coterminal with ${RadStr(red)} (same terminal side).`));
    }
    steps.push(Hdr(++c.n, Tx('Kontrol', 'Check')));
    steps.push(Tx(`Geri dönüşüm: ${RadStr(d)} · 180/π = ${d}° ✓.`, `Convert back: ${RadStr(d)} · 180/π = ${d}° ✓.`));
  }

  function convertToDeg(p, steps, c) {
    const d = p.d;
    const g = Gcd(d, 180);
    const nn = Math.trunc(d / g);
    const dd = Math.trunc(180 / g);
    steps.push(Hdr(++c.n, Tx('Verilen ve istenen', 'Given and wanted')));
    steps.push(Tx(`Verilen: θ = ${RadStr(d)} rad.   Bulmak istediğimiz: θ'yı derece cinsinden yazmak, yönünü ve denk açısını söylemek.`,
      `Given: θ = ${RadStr(d)} rad.   Wanted: θ in degrees, with its direction and equivalent angle.`));
    steps.push(Hdr(++c.n, Tx('Dönüşüm çarpanı', 'Conversion factor')));
    steps.push(Tx("π rad = 180° olduğundan 1 rad = 180°/π. Radyanı dereceye çevirirken 180/π ile çarparız; π'ler sadeleşir.",
      "Since π rad = 180°, 1 rad = 180°/π. To go from radians to degrees we multiply by 180/π; the π's cancel."));
    steps.push(Hdr(++c.n, Tx('Çarp ve sadeleştir', 'Multiply and simplify')));
    steps.push(Tx(`θ = ${RadStr(d)} · 180/π = (${Frac(nn, dd)}) · 180°.   ${Math.abs(nn)}·180/${dd} = ${d} olduğundan θ = ${d}°.`,
      `θ = ${RadStr(d)} · 180/π = (${Frac(nn, dd)}) · 180°.   Since ${Math.abs(nn)}·180/${dd} = ${Math.abs(d)}, θ = ${d}°.`));
    steps.push(Tx(`Sayısal kontrol: ${fmt(d * Math.PI / 180.0, 3)} rad · 57,2958°/rad ≈ ${d}°.`,
      `Numerical check: ${fmt(d * Math.PI / 180.0, 3)} rad · 57.2958°/rad ≈ ${d}°.`));
  }

  function arcLengthSteps(p, steps, c) {
    const d = Math.abs(p.d);
    const r = p.r;
    const angleGiven = p.inRad ? RadStr(d) + ' rad' : d + '°';
    steps.push(Hdr(++c.n, Tx('Verilen ve istenen', 'Given and wanted')));
    steps.push(Tx(`Verilen: çember yarıçapı r = ${r}, merkez açı θ = ${angleGiven}.   Bulmak istediğimiz: yay uzunluğu s.`,
      `Given: circle radius r = ${r}, central angle θ = ${angleGiven}.   Wanted: arc length s.`));
    steps.push(Hdr(++c.n, Tx('Formül', 'Formula')));
    steps.push(Tx('Radyan ölçüsü tanımı: θ = s / r. Buradan s = r·θ. Bu formül YALNIZCA θ radyan iken geçerlidir; derece verilmişse önce radyana çeviririz.',
      'Definition of radian measure: θ = s / r. Hence s = r·θ. This holds ONLY when θ is in radians; if degrees are given, we convert first.'));
    if (!p.inRad) {
      steps.push(Hdr(++c.n, Tx('Açıyı radyana çevirelim', 'Convert the angle to radians')));
      steps.push(Tx(`θ = ${d}° · π/180 = ${RadStr(d)} rad.`, `θ = ${d}° · π/180 = ${RadStr(d)} rad.`));
    }
    steps.push(Hdr(++c.n, Tx('Yay uzunluğunu hesaplayalım', 'Compute the arc length')));
    steps.push(Tx(`s = r·θ = ${r} · ${RadStr(d)} = ${ArcLen(r, d)}.`, `s = r·θ = ${r} · ${RadStr(d)} = ${ArcLen(r, d)}.`));
    steps.push(Tx(`Sayısal: s ≈ ${fmt(ArcLenNum(r, d), 3)} (uzunluk birimi). Açı negatif olsaydı yay uzunluğu yine |θ| ile hesaplanırdı: uzunluk negatif olmaz.`,
      `Numerical: s ≈ ${fmt(ArcLenNum(r, d), 3)} (length units). If the angle were negative the arc length would use |θ|: a length is never negative.`));
    steps.push(Hdr(++c.n, Tx('Kontrol', 'Check')));
    steps.push(Tx(`θ = s/r = (${ArcLen(r, d)})/${r} = ${RadStr(d)} ✓.   Çevre 2πr = ${PiStr(2 * r, 1)}; yay çevrenin ${Frac(d, 360)} katıdır (${d}°/360°).`,
      `θ = s/r = (${ArcLen(r, d)})/${r} = ${RadStr(d)} ✓.   Circumference 2πr = ${PiStr(2 * r, 1)}; the arc is ${Frac(d, 360)} of it (${d}°/360°).`));
  }

  function centralAngleSteps(p, steps, c) {
    const d = Math.abs(p.d);
    const r = p.r;
    steps.push(Hdr(++c.n, Tx('Verilen ve istenen', 'Given and wanted')));
    steps.push(Tx(`Verilen: yarıçap r = ${r}, yay uzunluğu s = ${ArcLen(r, d)}.   Bulmak istediğimiz: merkez açı θ (radyan ve derece).`,
      `Given: radius r = ${r}, arc length s = ${ArcLen(r, d)}.   Wanted: the central angle θ (radians and degrees).`));
    steps.push(Hdr(++c.n, Tx('Formül', 'Formula')));
    steps.push(Tx('θ = s / r  (radyan). Yay uzunluğunu yarıçapa böleriz; uzunluk/uzunluk olduğundan sonuç birimsizdir, yani radyandır.',
      'θ = s / r  (radians). Divide the arc length by the radius; length/length is unitless, i.e. radians.'));
    steps.push(Hdr(++c.n, Tx('Bölelim', 'Divide')));
    steps.push(Tx(`θ = (${ArcLen(r, d)}) / ${r} = ${RadStr(d)} rad.`, `θ = (${ArcLen(r, d)}) / ${r} = ${RadStr(d)} rad.`));
    steps.push(Hdr(++c.n, Tx('Dereceye çevirelim', 'Convert to degrees')));
    steps.push(Tx(`θ = ${RadStr(d)} · 180/π = ${d}°.   Sayısal: θ ≈ ${fmt(d * Math.PI / 180.0, 3)} rad.`,
      `θ = ${RadStr(d)} · 180/π = ${d}°.   Numerical: θ ≈ ${fmt(d * Math.PI / 180.0, 3)} rad.`));
    steps.push(Hdr(++c.n, Tx('Kontrol', 'Check')));
    steps.push(Tx(`s = r·θ = ${r} · ${RadStr(d)} = ${ArcLen(r, d)} ✓.`, `s = r·θ = ${r} · ${RadStr(d)} = ${ArcLen(r, d)} ✓.`));
  }

  function standardPositionSteps(p, steps, c) {
    const d = p.d;
    const red = Norm(d);
    const k = (d - red) / 360;
    steps.push(Hdr(++c.n, Tx('Verilen ve istenen', 'Given and wanted')));
    steps.push(Tx(`Verilen: standart konumda θ = ${RadStr(d)} rad (${d}°).   Bulmak istediğimiz: dönüş yönü, tur sayısı, bitiş kenarının bölgesi ve [0, 2π) içindeki denk açı.`,
      `Given: in standard position θ = ${RadStr(d)} rad (${d}°).   Wanted: rotation direction, number of turns, quadrant of the terminal side and the equivalent angle in [0, 2π).`));
    steps.push(Hdr(++c.n, Tx('Yön (işaret kuralı)', 'Direction (sign rule)')));
    if (d > 0) {
      steps.push(Tx('θ > 0 olduğundan açıyı pozitif x ekseninden SAAT YÖNÜNÜN TERSİNE (counter-clockwise) ölçeriz.',
        'Since θ > 0 we measure the angle COUNTER-CLOCKWISE from the positive x-axis.'));
    } else if (d < 0) {
      steps.push(Tx(`θ < 0 olduğundan açıyı SAAT YÖNÜNDE ölçeriz: bitiş kenarı pozitif x ekseninden saat yönünde ${RadStr(-d)} (${-d}°) döner.`,
        `Since θ < 0 we measure the angle CLOCKWISE: the terminal side is ${RadStr(-d)} (${-d}°) clockwise from the positive x-axis.`));
    } else {
      steps.push(Tx('θ = 0: dönüş yok.', 'θ = 0: no rotation.'));
    }
    steps.push(Hdr(++c.n, Tx('Tur sayısı', 'Number of turns')));
    steps.push(Tx(`Bir tam tur 2π (360°). |θ|/2π = ${Math.abs(d)}/360 = ${TurnsText(d)} tur.`,
      `One full turn is 2π (360°). |θ|/2π = ${Math.abs(d)}/360 = ${TurnsText(d)} turns.`));
    const full = Math.trunc(Math.abs(d) / 360);
    const remD = Math.abs(d) - full * 360;
    steps.push(full >= 1
      ? Tx(`${full} tam tur + ${remD}° (${RadStr(remD)}) kalan dönüş.`, `${full} full turn(s) + a remaining ${remD}° (${RadStr(remD)}) of rotation.`)
      : Tx('Bir tamdan az tur var: tam bir dönüş yapılmıyor.', 'Less than one full turn: no complete revolution.'));
    steps.push(Hdr(++c.n, Tx('Denk açı ve bitiş kenarı', 'Equivalent angle and terminal side')));
    if (k === 0) {
      steps.push(Tx(`${d}° zaten [0°, 360°) içinde: denk açı ${RadStr(d)}.`, `${d}° is already in [0°, 360°): the equivalent angle is ${RadStr(d)}.`));
    } else {
      const kk = Math.abs(k);
      const kTxt = kk === 1 ? '' : kk + '·';
      const op = k > 0 ? '−' : '+';
      const s = `${d}° ${op} ${kTxt}360° = ${red}°  ⇒  ${RadStr(d)} ${op} ${kTxt}2π = ${RadStr(red)}.`;
      steps.push(Tx(s, s));
    }
    steps.push(Tx(`Bitiş kenarı: ${QuadText(red)} (${red}° = ${RadStr(red)} konumu).`, `Terminal side: ${QuadText(red)} (at ${red}° = ${RadStr(red)}).`));
    const a = d * Math.PI / 180.0;
    steps.push(Hdr(++c.n, Tx('P noktasının koordinatları', 'Coordinates of the point P')));
    const ps = `P = (r·cos θ, r·sin θ) = (${p.r}·cos(${RadStr(d)}), ${p.r}·sin(${RadStr(d)})) ≈ (${fmt(p.r * Math.cos(a), 2)}, ${fmt(p.r * Math.sin(a), 2)}).`;
    steps.push(Tx(ps, ps));
  }

  function coterminalSteps(p, steps, c) {
    const d = p.d;
    const red = Norm(d);
    const k = (d - red) / 360;
    const neg = red === 0 ? 0 : red - 360;
    steps.push(Hdr(++c.n, Tx('Verilen ve istenen', 'Given and wanted')));
    steps.push(Tx(`Verilen: θ = ${d}° = ${RadStr(d)} rad.   Bulmak istediğimiz: [0, 2π) ve (−2π, 0] aralığındaki eş sonlu açılar ile genel ifade.`,
      `Given: θ = ${d}° = ${RadStr(d)} rad.   Wanted: the coterminal angles in [0, 2π) and (−2π, 0], and the general form.`));
    steps.push(Hdr(++c.n, Tx('Eş sonlu açı nedir?', 'What are coterminal angles?')));
    steps.push(Tx("Aynı bitiş kenarını paylaşan açılardır; birbirinden tam tur (360° = 2π) katı kadar farklıdırlar: θ' = θ + 360°·k (k tam sayı).",
      "Angles that share the same terminal side; they differ by whole turns (360° = 2π): θ' = θ + 360°·k (k an integer)."));
    steps.push(Hdr(++c.n, Tx('[0°, 360°) aralığındaki açı', 'The angle in [0°, 360°)')));
    steps.push(Tx(`${d} = 360·(${k}) + ${red}  (bölme: ${d}/360 ve kalan ${red}).  Yani θ = ${red}° + (${k})·360°.`,
      `${d} = 360·(${k}) + ${red}  (division: ${d}/360 with remainder ${red}).  So θ = ${red}° + (${k})·360°.`));
    steps.push(Tx(`Kalan ${red}° = ${RadStr(red)} rad, [0, 2π) içindeki eş sonlu açıdır. (${k > 0 ? k + ' tam tur çıkarıldı' : (k < 0 ? -k + ' tam tur eklendi' : 'tur eklenmedi')}.)`,
      `The remainder ${red}° = ${RadStr(red)} rad is the coterminal angle in [0, 2π). (${k > 0 ? k + ' full turn(s) removed' : (k < 0 ? -k + ' full turn(s) added' : 'no turn needed')}.)`));
    steps.push(Hdr(++c.n, Tx('(−360°, 0°] aralığındaki açı', 'The angle in (−360°, 0°]')));
    if (red === 0) {
      steps.push(Tx("Denk açı 0° olduğundan negatif denk açı da 0° (= θ'nın tam tur katı).", 'The equivalent angle is 0°, so the non-positive one is 0° as well (a whole number of turns).'));
    } else {
      steps.push(Tx(`${red}° − 360° = ${neg}°, yani ${RadStr(red)} − 2π = ${RadStr(neg)}. Bu açı saat yönünde ölçülmüş olur.`,
        `${red}° − 360° = ${neg}°, i.e. ${RadStr(red)} − 2π = ${RadStr(neg)}. This angle is measured clockwise.`));
    }
    steps.push(Hdr(++c.n, Tx('Genel ifade', 'General form')));
    const gf = `θ' = ${RadStr(red)} + 2πk  (${red}° + 360°·k), k = …, −2, −1, 0, 1, 2, …`;
    steps.push(Tx(`Tüm eş sonlu açılar: ${gf}`, `All coterminal angles: ${gf}`));
    steps.push(Tx(`Kontrol: k = ${k} için ${RadStr(red)} + (${k})·2π = ${RadStr(d)} ✓ (verilen θ).`,
      `Check: for k = ${k}, ${RadStr(red)} + (${k})·2π = ${RadStr(d)} ✓ (the given θ).`));
  }

  function tailSteps(p, steps, c) {
    const d = p.d;
    const r = p.r;
    const red = Norm(d);
    steps.push(Hdr(++c.n, Tx('Çizimde yay, yön ve tur', 'Picture: arc, direction and turns')));
    if (d === 0) {
      steps.push(Tx('θ = 0: bitiş kenarı başlangıç kenarıyla çakışır; yay yoktur.', 'θ = 0: the terminal side coincides with the initial side; there is no arc.'));
    } else {
      steps.push(Tx(`Çizdiğimiz açı θ = ${RadStr(d)} (${d}°): ${d > 0 ? 'saat yönünün tersine (pozitif)' : 'saat yönünde (negatif)'}, ${TurnsText(d)} tur, bitiş kenarı: ${QuadText(red)}.`,
        `Drawn angle θ = ${RadStr(d)} (${d}°): ${d > 0 ? 'counter-clockwise (positive)' : 'clockwise (negative)'}, ${TurnsText(d)} turn(s), terminal side: ${QuadText(red)}.`));
      steps.push(Tx(`Yarıçapı ${r} olan çemberde bu açının kestiği yay: s = r·|θ| = ${r}·${RadStr(Math.abs(d))} = ${ArcLen(r, d)} ≈ ${fmt(ArcLenNum(r, d), 2)}.`,
        `On the circle of radius ${r} the arc cut by this angle is s = r·|θ| = ${r}·${RadStr(Math.abs(d))} = ${ArcLen(r, d)} ≈ ${fmt(ArcLenNum(r, d), 2)}.`));
    }
  }

  function solveSteps(p) {
    const steps = [];
    const c = { n: 0 };
    switch (p.kind) {
      case 0: convertToRad(p, steps, c); break;
      case 1: convertToDeg(p, steps, c); break;
      case 2: arcLengthSteps(p, steps, c); break;
      case 3: centralAngleSteps(p, steps, c); break;
      case 4: standardPositionSteps(p, steps, c); break;
      default: coterminalSteps(p, steps, c);
    }
    tailSteps(p, steps, c);
    return steps;
  }

  // ===================== problem statement =====================

  function problemStatement(p) {
    const d = p.d, ad = Math.abs(d), r = p.r;
    switch (p.kind) {
      case 0:
        return Tx(`${d}° kaç radyandır? Cevabı π cinsinden yazıp [0, 2π) aralığındaki eş sonlu açıyı da bulalım.`,
          `Let's convert ${d}° to radians, give the answer in terms of π, and find the coterminal angle in [0, 2π).`);
      case 1:
        return Tx(`${RadStr(d)} radyan kaç derecedir? Dönüş yönünü ve denk açıyı da söyleyelim.`,
          `Let's convert ${RadStr(d)} radians to degrees and also note the direction and the equivalent angle.`);
      case 2: {
        const ang = p.inRad ? RadStr(ad) + ' rad' : ad + '°';
        return Tx(`Yarıçapı ${r} olan bir çemberde ${ang} ölçüsündeki merkez açının gördüğü yay uzunluğunu bulalım.`,
          `In a circle of radius ${r}, let's find the arc length cut off by a central angle of ${ang}.`);
      }
      case 3:
        return Tx(`Yarıçapı ${r} olan bir çemberde yay uzunluğu s = ${ArcLen(r, ad)} olan yayı gören merkez açıyı radyan ve derece cinsinden bulalım.`,
          `In a circle of radius ${r}, an arc has length s = ${ArcLen(r, ad)}. Let's find its central angle in radians and in degrees.`);
      case 4:
        return Tx(`Standart konumda θ = ${RadStr(d)} rad (${d}°) açısı için dönüş yönünü, tur sayısını, bitiş kenarının bölgesini ve [0, 2π) aralığındaki denk açıyı bulalım. Yarıçapı ${r} olan çember üzerindeki P = (r cos θ, r sin θ) noktasını da hesaplayalım.`,
          `For the angle θ = ${RadStr(d)} rad (${d}°) in standard position, let's find the rotation direction, number of turns, quadrant of the terminal side and the equivalent angle in [0, 2π). We can also compute P = (r cos θ, r sin θ) on the circle of radius ${r}.`);
      default:
        return Tx(`θ = ${d}° = ${RadStr(d)} rad açısının [0, 2π) ve (−2π, 0] aralıklarındaki eş sonlu açılarını ve genel ifadesini bulalım.`,
          `For θ = ${d}° = ${RadStr(d)} rad, let's find the coterminal angles in [0, 2π) and (−2π, 0] and write the general form.`);
    }
  }

  // ===================== drawing =====================

  function addText(canvas, x, y, text, color) {
    canvas.addMarker({ x, y, color, radius: 1.5, label: text });
  }

  function draw(canvas, p) {
    const r = p.r;
    const d = p.d;
    const a = d * Math.PI / 180.0;

    let aspect = 1.4;
    const el = canvas.canvas;
    if (el && el.clientWidth > 50 && el.clientHeight > 50) aspect = el.clientWidth / el.clientHeight;
    let halfH = r * 1.55;
    let halfW = halfH * aspect;
    if (halfW < r * 1.55) { halfW = r * 1.55; halfH = halfW / aspect; }
    canvas.setViewport(-halfW, halfW, -halfH, halfH);

    const accent = canvas.accent();
    const arcColor = '#ff8c00'; // DarkOrange

    canvas.addParametric({ xOfT: (t) => r * Math.cos(t), yOfT: (t) => r * Math.sin(t), tMin: 0, tMax: 2 * Math.PI, samples: 240, color: '#4682b4', thickness: 2 });

    let aVis = a;
    if (Math.abs(d) > 360) {
      const rem360 = Math.abs(d) % 360;
      aVis = Math.sign(d) * ((rem360 === 0 ? 360 : rem360) * Math.PI / 180.0);
    }
    if (d !== 0) {
      const lo = Math.min(0, aVis), hi = Math.max(0, aVis);
      canvas.addParametric({ xOfT: (t) => r * Math.cos(t), yOfT: (t) => r * Math.sin(t), tMin: lo, tMax: hi, samples: 160, color: arcColor, thickness: 5 });
      const ri = 0.28 * r;
      canvas.addParametric({ xOfT: (t) => ri * Math.cos(t), yOfT: (t) => ri * Math.sin(t), tMin: lo, tMax: hi, samples: 120, color: accent, thickness: 3 });
      const sgn = Math.sign(aVis);
      const ex = ri * Math.cos(aVis), ey = ri * Math.sin(aVis);
      const tgx = -sgn * Math.sin(aVis), tgy = sgn * Math.cos(aVis);
      const nx = Math.cos(aVis), ny = Math.sin(aVis);
      const h = 0.09 * r;
      [-1, 1].forEach((side) => {
        canvas.addSegment({ x1: ex, y1: ey, x2: ex - h * tgx + side * 0.5 * h * nx, y2: ey - h * tgy + side * 0.5 * h * ny, color: accent, thickness: 3 });
      });
      if (Math.abs(d) > 360) {
        const rr = 0.42 * r;
        canvas.addParametric({ xOfT: (t) => rr * Math.cos(t), yOfT: (t) => rr * Math.sin(t), tMin: 0, tMax: 2 * Math.PI, samples: 120, color: accent, thickness: 1.5, dashed: true });
      }
    }

    const px = r * Math.cos(a), py = r * Math.sin(a);
    canvas.addSegment({ x1: px, y1: py, x2: px, y2: 0, color: '#808080', thickness: 1.5, dashed: true });
    canvas.addSegment({ x1: 0, y1: py, x2: px, y2: py, color: '#808080', thickness: 1.5, dashed: true });
    canvas.addSegment({ x1: 0, y1: 0, x2: r, y2: 0, color: canvas.green(), thickness: 3 });
    canvas.addSegment({ x1: 0, y1: 0, x2: px, y2: py, color: '#dc143c', thickness: 3 });

    canvas.addMarker({ x: r, y: 0, color: canvas.green(), radius: 5, label: 'A' });
    canvas.addMarker({ x: px, y: py, color: '#dc143c', radius: 6, label: `P(${fmt(px, 2)}, ${fmt(py, 2)})` });

    if (d !== 0) {
      const mid = aVis / 2.0;
      addText(canvas, 1.14 * r * Math.cos(mid), 1.14 * r * Math.sin(mid), `s = ${ArcLen(p.r, d)}`, arcColor);
      addText(canvas, 0.5 * r * Math.cos(mid), 0.5 * r * Math.sin(mid), `θ = ${RadStr(d)}`, accent);
    }

    const lx = -halfW * 0.96;
    const ly = halfH * 0.9;
    const dirText = d > 0 ? Tx('saat yönünün tersi (+)', 'counter-clockwise (+)') : (d < 0 ? Tx('saat yönü (−)', 'clockwise (−)') : Tx('dönüş yok', 'no rotation'));
    addText(canvas, lx, ly, `θ = ${d}° = ${RadStr(d)} rad`, accent);
    addText(canvas, lx, ly - halfH * 0.11, dirText, '#696969');
    addText(canvas, lx, ly - halfH * 0.22, Tx(`${TurnsText(d)} tur   |   r = ${p.r}`, `${TurnsText(d)} turn(s)   |   r = ${p.r}`), '#696969');
  }

  // snap the slider thumb to the quantised value (mirrors VB SnapLabel)
  function snapThumb(reg, getter, min, max) {
    reg.input.addEventListener('input', () => {
      const v = getter();
      reg.input.value = String(Math.max(0, Math.min(1000, Math.round((v - min) / (max - min) * 1000))));
    });
  }

  Topics.register('trig', {
    id: 'radianMeasure',
    tabTitle: () => Tx('Radyan ve Açı Ölçüsü', 'Radians & Angle Measure'),
    concept: () => Tx(
      "RADYAN ÖLÇÜSÜ: Birim çemberde (r = 1) merkez açısı ACB'nin radyan ölçüsü, bu açının kestiği YAY UZUNLUĞUNA eşittir. " +
      "r yarıçaplı bir çemberde θ = s / r olduğundan YAY UZUNLUĞU  s = r·θ  (θ radyan cinsinden!).\n\n" +
      "DÖNÜŞÜM: Tam tur 360° = 2π rad, yani π rad = 180°.\n" +
      "   1° = π/180 rad ,   1 rad = 180°/π ≈ 57,3°\n" +
      "   derece → radyan:  θ(rad) = θ(°) · π/180\n" +
      "   radyan → derece:  θ(°) = θ(rad) · 180/π\n\n" +
      "AÇI KURALI (standart konum): Başlangıç kenarı pozitif x ekseni. x ekseninden SAAT YÖNÜNÜN TERSİNE ölçülen açılar POZİTİF, " +
      "SAAT YÖNÜNDE ölçülen açılar NEGATİFTİR (örn. −π/3 saat yönünde π/3 döner). |θ| > 2π ise birden fazla tam tur dönülmüştür.\n\n" +
      "EŞ SONLU (koterminal) AÇILAR: Aynı bitiş kenarına sahip açılar 2π (360°) katı kadar farklıdır: θ + 2πk (k tam sayı). " +
      "[0, 2π) aralığındaki denk açıyı bulmak için tam turlar eklenir ya da çıkarılır.\n\n" +
      "ÖNEMLİ AÇILAR (derece = radyan):\n" +
      "   0° = 0     30° = π/6     45° = π/4     60° = π/3\n" +
      "   90° = π/2     120° = 2π/3     135° = 3π/4     150° = 5π/6\n" +
      "   180° = π     270° = 3π/2     360° = 2π\n\n" +
      "YÖNTEM: (1) Önce istenen birime bakalım. (2) Dönüşüm çarpanını (π/180 veya 180/π) uygulayıp sadeleştirelim. " +
      "(3) Yay uzunluğunda önce açıyı radyana çevirip sonra s = r·θ yazabiliriz. (4) Yönü (işaret) ve tam tur sayısını söyleyip [0, 2π) aralığındaki denk açıyı bulabiliriz. " +
      "Sağdaki kaydırıcılarla açıyı ve yarıçapı değiştirip gözlemleyebiliriz.",
      "RADIAN MEASURE: On the unit circle (r = 1) the radian measure of the central angle ACB equals the length of the ARC it cuts. " +
      "In a circle of radius r, θ = s / r, so the ARC LENGTH is  s = r·θ  (θ must be in radians!).\n\n" +
      "CONVERSION: A full turn 360° = 2π rad, so π rad = 180°.\n" +
      "   1° = π/180 rad ,   1 rad = 180°/π ≈ 57.3°\n" +
      "   degrees → radians:  θ(rad) = θ(°) · π/180\n" +
      "   radians → degrees:  θ(°) = θ(rad) · 180/π\n\n" +
      "ANGLE CONVENTION (standard position): the initial side is the positive x-axis. Angles measured COUNTER-CLOCKWISE from the x-axis are POSITIVE, " +
      "angles measured CLOCKWISE are NEGATIVE (e.g. −π/3 turns π/3 clockwise). If |θ| > 2π the angle makes more than one full turn.\n\n" +
      "COTERMINAL ANGLES: angles with the same terminal side differ by multiples of 2π (360°): θ + 2πk (k an integer). " +
      "To find the equivalent angle in [0, 2π), we add or subtract full turns.\n\n" +
      "KEY ANGLES (degrees = radians):\n" +
      "   0° = 0     30° = π/6     45° = π/4     60° = π/3\n" +
      "   90° = π/2     120° = 2π/3     135° = 3π/4     150° = 5π/6\n" +
      "   180° = π     270° = 3π/2     360° = 2π\n\n" +
      "METHOD: (1) First we look at the wanted unit. (2) We multiply by the conversion factor (π/180 or 180/π) and simplify. " +
      "(3) For arc length we convert the angle to radians first, then use s = r·θ. (4) We note the direction (sign) and number of turns, and find the equivalent angle in [0, 2π). " +
      "We can use the sliders on the right to change the angle and the radius."),
    problemStatement,
    createProblem,
    solveSteps,
    links: [
      { match: /^(RADYAN ÖLÇÜSÜ|RADIAN MEASURE):/, make: (rng) => genProblem(rng, 2) },
      { match: /^\s+(derece → radyan|degrees → radians):/, make: (rng) => genProblem(rng, 0) },
      { match: /^\s+(radyan → derece|radians → degrees):/, make: (rng) => genProblem(rng, 1) },
      { match: /^(AÇI KURALI|ANGLE CONVENTION)/, make: (rng) => genProblem(rng, 4) },
      { match: /^(EŞ SONLU|COTERMINAL ANGLES)/, make: (rng) => genProblem(rng, 5) },
    ],
    draw,
    // circle is drawn around the origin: keep the whole circle in view
    focus: (p) => ({ x: 0, y: 0 }),
    buildControls: (rightCol, getProblem, h) => {
      window.addEventListener('resize', () => h.refresh());
      const s1 = h.addSlider({
        caption: Tx('Açı θ (derece, adım 15°)', 'Angle θ (degrees, step 15°)'), min: -720, max: 720,
        get: () => getProblem().d, set: (v) => { getProblem().d = Math.round(v / 15.0) * 15; },
      });
      snapThumb(s1, () => getProblem().d, -720, 720);
      const s2 = h.addSlider({
        caption: Tx('Yarıçap r', 'Radius r'), min: 1, max: 5,
        get: () => getProblem().r, set: (v) => { getProblem().r = Math.max(1, Math.min(5, Math.round(v))); },
      });
      snapThumb(s2, () => getProblem().r, 1, 5);
    },
  });
})();
