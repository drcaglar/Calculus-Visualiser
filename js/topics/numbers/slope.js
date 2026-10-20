// Ported from Modules/Preliminaries/SlopeControl.vb - slope m = Δy/Δx, angle of inclination
// (counter-clockwise from the positive x-axis), and the slope of the perpendicular line.
(function () {
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b !== 0) { const t = a % b; a = b; b = t; }
    return a === 0 ? 1 : a;
  }
  function frac(n, d) {
    if (d === 0) return I18N.tx('tanımsız', 'undefined');
    const g = gcd(n, d);
    n = Math.trunc(n / g); d = Math.trunc(d / g);
    if (d < 0) { n = -n; d = -d; }
    return d === 1 ? String(n) : `${n}/${d}`;
  }
  function fmt3(v) {
    const s = v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  const rad = (deg) => fmt3(deg * Math.PI / 180.0);
  const inclinationDeg = (m) => { const a = Math.atan(m) * 180.0 / Math.PI; return m < 0 ? 180.0 + a : a; };
  const TRANSPARENT = 'rgba(0,0,0,0)';

  function createProblem(rng) {
    const x1 = rng.nextInt(-6, 5);
    const y1 = rng.nextInt(-6, 5);
    let x2, y2;
    if (rng.nextInt(0, 6) === 0) {
      x2 = x1;
      do { y2 = rng.nextInt(-6, 7); } while (y2 === y1);
    } else {
      do { x2 = rng.nextInt(-6, 7); } while (x2 === x1);
      y2 = rng.nextInt(-6, 7);
    }
    return { x1, y1, x2, y2 };
  }

  function problemStatement(p) {
    return I18N.tx(
      `A(${p.x1}, ${p.y1}) ve B(${p.x2}, ${p.y2}) noktalarından geçen doğrunun eğimini, x ekseniyle yaptığı açıyı (saat yönünün tersine) ve bu doğruya dik doğrunun eğimini bulalım. (Eğim tanımsızsa bunu da söyleyebiliriz.)`,
      `Let's find the slope of the line through A(${p.x1}, ${p.y1}) and B(${p.x2}, ${p.y2}), its angle with the x-axis (counter-clockwise), and the slope of the line perpendicular to it. (If the slope is undefined, we can say so.)`);
  }

  // ---- links helpers + extra kind 'col' (three points collinear) ----
  const tx = (tr, en) => I18N.tx(tr, en);
  function makeWhere(rng, test) {
    let q;
    do { q = createProblem(rng); } while (!test(q));
    return q;
  }
  function makeSpecial(rng) {
    const x1 = rng.nextInt(-5, 1), y1 = rng.nextInt(-5, 1), k = rng.nextInt(1, 6);
    const s = rng.nextInt(0, 2) === 0 ? 1 : -1;
    return { x1, y1, x2: x1 + k, y2: y1 + s * k };
  }
  function makeCollinear(rng) {
    const x1 = rng.nextInt(-5, 1), y1 = rng.nextInt(-5, 6);
    let dx, dy;
    do { dx = rng.nextInt(1, 4); dy = rng.nextInt(-3, 4); } while (dy === 0 && false);
    const x2 = x1 + dx, y2 = y1 + dy;
    const t = rng.nextInt(2, 4);
    const onLine = rng.nextInt(0, 2) === 0;
    const x3 = x1 + t * dx, y3 = y1 + t * dy + (onLine ? 0 : (rng.nextInt(0, 2) === 0 ? 1 : -1));
    return { x1, y1, x2, y2, x3, y3, extra: 'col' };
  }
  function colStatement(p) {
    return tx(`A(${p.x1}, ${p.y1}), B(${p.x2}, ${p.y2}) ve C(${p.x3}, ${p.y3}) noktaları doğrudaş mıdır? Eğimlere bakalım.`, `Are A(${p.x1}, ${p.y1}), B(${p.x2}, ${p.y2}) and C(${p.x3}, ${p.y3}) collinear? Let's compare the slopes.`);
  }
  function colSteps(p) {
    const dxAB = p.x2 - p.x1, dyAB = p.y2 - p.y1, dxAC = p.x3 - p.x1, dyAC = p.y3 - p.y1;
    const same = dyAB * dxAC === dyAC * dxAB;
    return [
      tx('── 1) AB eğimi ──', '── 1) Slope of AB ──'),
      `m(AB) = ${dyAB}/${dxAB} = ${fmt2(dyAB / dxAB)}`,
      tx('── 2) AC eğimi ──', '── 2) Slope of AC ──'),
      `m(AC) = ${dyAC}/${dxAC} = ${fmt2(dyAC / dxAC)}`,
      tx('── 3) Karşılaştırma ──', '── 3) Comparison ──'),
      same
        ? tx(`Eğimler eşit (${fmt2(dyAB / dxAB)}) ve ikisi de A'dan geçiyor → A, B, C DOĞRUDAŞTIR.`, `The slopes are equal (${fmt2(dyAB / dxAB)}) and both lines pass through A → A, B, C are COLLINEAR.`)
        : tx(`Eğimler farklı (${fmt2(dyAB / dxAB)} ≠ ${fmt2(dyAC / dxAC)}) → A, B, C doğrudaş DEĞİLDİR.`, `The slopes differ (${fmt2(dyAB / dxAB)} ≠ ${fmt2(dyAC / dxAC)}) → A, B, C are NOT collinear.`),
    ];
  }
  function colDraw(canvas, p) {
    const m = Math.max(...[p.x1, p.x2, p.x3, p.y1, p.y2, p.y3].map(Math.abs));
    const half = Math.max(8.0, m * 1.4 + 3.0);
    canvas.setViewport(-half, half, -half, half);
    canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, color: canvas.accent(), thickness: 2.5 });
    canvas.addSegment({ x1: p.x1, y1: p.y1, x2: p.x3, y2: p.y3, color: canvas.orange(), thickness: 2.0, dashed: true });
    canvas.addMarker({ x: p.x1, y: p.y1, color: canvas.gold(), radius: 7.0, label: 'A' });
    canvas.addMarker({ x: p.x2, y: p.y2, color: canvas.gold(), radius: 7.0, label: 'B' });
    canvas.addMarker({ x: p.x3, y: p.y3, color: canvas.gold(), radius: 7.0, label: 'C' });
  }

  function solveSteps(p) {
    if (p.extra) return colSteps(p);
    const tx = I18N.tx;
    const deltaX = p.x2 - p.x1;
    const deltaY = p.y2 - p.y1;
    const steps = [
      tx('── 1) EĞİM ──', '── 1) SLOPE ──') + '\n' +
        tx(`Noktalarımız: A(${p.x1}, ${p.y1}) ve B(${p.x2}, ${p.y2}).`, `Our points are A(${p.x1}, ${p.y1}) and B(${p.x2}, ${p.y2}).`),
      `Δy = ${p.y2} - (${p.y1}) = ${deltaY}     Δx = ${p.x2} - (${p.x1}) = ${deltaX}`,
    ];
    const hdr2 = tx('── 2) EĞİM AÇISI ──', '── 2) ANGLE OF INCLINATION ──') + '\n';
    const hdr3 = tx('── 3) DİK DOĞRUNUN EĞİMİ ──', '── 3) SLOPE OF THE PERPENDICULAR ──') + '\n';
    const rule = tx('θ, pozitif x ekseninden doğruya doğru saat yönünün tersine ölçülür; m = tan θ olur.',
                    'θ is measured counter-clockwise from the positive x-axis to the line, and m = tan θ.');

    if (deltaX === 0) {
      steps.push(tx('Δx = 0 olduğu için m = Δy/Δx ifadesinde sıfıra bölme gerekir.', 'Since Δx = 0, m = Δy/Δx would require division by zero.'));
      steps.push(tx('Sonuç olarak doğru DİKEYDİR ve eğim TANIMSIZDIR.', 'So the line is VERTICAL and the slope is UNDEFINED.'));
      steps.push(hdr2 + rule);
      steps.push(tx('Dikey doğru pozitif x eksenine dik durur: θ = 90° = π/2 rad (tan 90° tanımsızdır, eğimle uyumludur).', 'A vertical line is perpendicular to the positive x-axis: θ = 90° = π/2 rad (tan 90° is undefined, matching the undefined slope).'));
      steps.push(tx('Not: aynı doğru için θ + 180° = 270° de geçerlidir; ana değer 0° ≤ θ < 180° aralığında alınır → θ = 90°.', 'Note: the same line also has θ + 180° = 270°; the principal value is taken in 0° ≤ θ < 180° → θ = 90°.'));
      steps.push(hdr3 + tx('Eğim tanımsız olduğundan m⊥ = -1/m formülünü kullanamayız; dikeye dik olan doğru YATAYDIR: m⊥ = 0.', 'Since the slope is undefined the formula m⊥ = -1/m cannot be used; a line perpendicular to a vertical line is HORIZONTAL: m⊥ = 0.'));
      steps.push(tx('Açı ilişkisi: θ ≥ 90° olduğundan θ⊥ = θ - 90° = 90° - 90° = 0°. Kontrol: yatay doğru için θ = 0° olur ✓.', 'Angle relation: since θ ≥ 90°, θ⊥ = θ - 90° = 90° - 90° = 0°. Check: θ = 0° for a horizontal line ✓.'));
      steps.push(tx("Dik doğruyu, AB'nin orta noktasından geçen kesikli doğru olarak çizdik; kesişimde dik açı işareti görülür.", 'We draw the perpendicular as the dashed line through the midpoint of AB; the right-angle mark sits at the intersection.'));
      return steps;
    }

    const slope = deltaY / deltaX;
    steps.push(`m = Δy/Δx = ${deltaY}/${deltaX} = ${fmt2(slope)}`);
    if (slope > 0) steps.push(tx('Eğim pozitif olduğundan doğru soldan sağa YÜKSELİR.', 'Slope is positive → the line RISES from left to right.'));
    else if (slope < 0) steps.push(tx('Eğim negatif olduğundan doğru soldan sağa ALÇALIR.', 'Slope is negative → the line FALLS from left to right.'));
    else steps.push(tx('Eğim sıfır → doğru YATAYDIR.', 'Slope is zero → the line is HORIZONTAL.'));

    const a = Math.atan(slope) * 180.0 / Math.PI;
    const theta = inclinationDeg(slope);
    steps.push(hdr2 + rule);
    if (slope === 0) {
      steps.push(tx('m = 0 → tan θ = 0 → θ = arctan(0) = 0° = 0 rad (yatay doğru).', 'm = 0 → tan θ = 0 → θ = arctan(0) = 0° = 0 rad (horizontal line).'));
    } else if (slope > 0) {
      steps.push(tx(`m > 0 olduğundan θ = arctan(m) = arctan(${fmt2(slope)}) ≈ ${fmt2(a)}°`, `Since m > 0, θ = arctan(m) = arctan(${fmt2(slope)}) ≈ ${fmt2(a)}°`));
      steps.push(tx(`Radyan: θ ≈ ${fmt2(a)}° × π/180 ≈ ${rad(theta)} rad. 0° < θ < 90° (dar açı) ✓`, `Radians: θ ≈ ${fmt2(a)}° × π/180 ≈ ${rad(theta)} rad. 0° < θ < 90° (acute) ✓`));
    } else {
      steps.push(tx(`m < 0 olduğundan arctan(m) = arctan(${fmt2(slope)}) ≈ ${fmt2(a)}° negatiftir; bu, x ekseninin ALTINA doğru ölçülen açıdır.`, `Since m < 0, arctan(m) = arctan(${fmt2(slope)}) ≈ ${fmt2(a)}° is negative; it is the angle measured BELOW the x-axis.`));
      steps.push(tx(`Saat yönünün tersine ölçmek için 180° ekleriz: θ = 180° + (${fmt2(a)}°) = 180° - ${fmt2(Math.abs(a))}° = ${fmt2(theta)}°`, `To measure counter-clockwise we add 180°: θ = 180° + (${fmt2(a)}°) = 180° - ${fmt2(Math.abs(a))}° = ${fmt2(theta)}°`));
      steps.push(tx(`Radyan: θ = π - ${rad(Math.abs(a))} ≈ ${rad(theta)} rad. 90° < θ < 180° (geniş açı) ✓`, `Radians: θ = π - ${rad(Math.abs(a))} ≈ ${rad(theta)} rad. 90° < θ < 180° (obtuse) ✓`));
    }
    steps.push(tx(`Dikleşme: |m| = ${fmt2(Math.abs(slope))}; |m| büyüdükçe doğru dikleşir. Aynı doğru için θ + 180° = ${fmt2(theta + 180)}° de yazılabilir, fakat ana değer 0° ≤ θ < 180° aralığındaki ${fmt2(theta)}° değeridir.`,
                  `Steepness: |m| = ${fmt2(Math.abs(slope))}; the bigger |m|, the steeper the line. The same line also has θ + 180° = ${fmt2(theta + 180)}°, but the principal value is ${fmt2(theta)}° in 0° ≤ θ < 180°.`));

    if (slope === 0) {
      steps.push(hdr3 + tx('m = 0 olduğundan m⊥ = -1/0 tanımsızdır: yataya dik olan doğru DİKEYDİR ve eğimi TANIMSIZDIR.', 'Since m = 0, m⊥ = -1/0 is undefined: a line perpendicular to a horizontal line is VERTICAL with an UNDEFINED slope.'));
      steps.push(tx('Açı ilişkisi: θ = 0° < 90° olduğundan θ⊥ = θ + 90° = 90° ✓ (dikey doğru).', 'Angle relation: since θ = 0° < 90°, θ⊥ = θ + 90° = 90° ✓ (vertical line).'));
      steps.push(tx('Kontrol: m · m⊥ çarpımı burada tanımsızdır; yatay-dikey çifti kuralın özel halidir.', 'Check: m · m⊥ is undefined here; the horizontal-vertical pair is the special case of the rule.'));
    } else {
      const mp = -1.0 / slope;
      const mText = frac(deltaY, deltaX);
      const mpText = frac(-deltaX, deltaY);
      const thetaP = theta < 90 ? theta + 90 : theta - 90;
      steps.push(hdr3 + tx(`Dik doğrularda m · m⊥ = -1 olduğundan m⊥ = -1/m bulunur (ters çevirip işareti değiştiririz). m = ${mText} için:`, `For perpendicular lines m · m⊥ = -1 → m⊥ = -1/m (we flip and change the sign). For m = ${mText}:`));
      steps.push(`m⊥ = -1/(${mText}) = ${mpText} ≈ ${fmt2(mp)}`);
      steps.push(tx(`Kontrol: m · m⊥ = (${mText}) × (${mpText}) = ${fmt2(slope * mp)} ✓`, `Check: m · m⊥ = (${mText}) × (${mpText}) = ${fmt2(slope * mp)} ✓`));
      if (theta < 90) {
        steps.push(tx(`Açı ilişkisi: θ = ${fmt2(theta)}° < 90° olduğundan θ⊥ = θ + 90° = ${fmt2(theta)}° + 90° = ${fmt2(thetaP)}°`, `Angle relation: since θ = ${fmt2(theta)}° < 90°, θ⊥ = θ + 90° = ${fmt2(theta)}° + 90° = ${fmt2(thetaP)}°`));
      } else {
        steps.push(tx(`Açı ilişkisi: θ = ${fmt2(theta)}° ≥ 90° olduğundan θ⊥ = θ - 90° = ${fmt2(theta)}° - 90° = ${fmt2(thetaP)}°`, `Angle relation: since θ = ${fmt2(theta)}° ≥ 90°, θ⊥ = θ - 90° = ${fmt2(theta)}° - 90° = ${fmt2(thetaP)}°`));
      }
      steps.push(tx("Özel haller: m = 0 ise dik doğru dikeydir (tanımsız eğim); eğim tanımsızsa dik doğrunun eğimi 0'dır. Dik doğruyu, AB'nin orta noktasından geçen kesikli doğru olarak çizdik.",
                    'Special cases: if m = 0 the perpendicular is vertical (undefined slope); if the slope is undefined the perpendicular has slope 0. We draw the perpendicular as the dashed line through the midpoint of AB.'));
    }
    return steps;
  }

  function label(canvas, x, y, text) {
    canvas.addMarker({ x, y, color: TRANSPARENT, radius: 1.0, label: text });
  }

  function draw(canvas, p) {
    if (p.extra) { colDraw(canvas, p); return; }
    const tx = I18N.tx;
    const maxAbs = Math.max(Math.abs(p.x1), Math.abs(p.x2), Math.abs(p.y1), Math.abs(p.y2));
    const halfH = Math.max(8.0, maxAbs * 1.4 + 3.0);
    const cw = canvas.canvas.clientWidth, ch = canvas.canvas.clientHeight;
    const aspect = (ch > 50 && cw > 50) ? cw / ch : 1.4;
    const halfW = halfH * aspect;
    canvas.setViewport(-halfW, halfW, -halfH, halfH); // equal x and y scale, so angles look true

    const x1 = p.x1, y1 = p.y1, x2 = p.x2, y2 = p.y2;
    const vertical = p.x1 === p.x2;
    const dx = x2 - x1, dy = y2 - y1;
    let len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.000001) len = 1.0;
    const lineColor = canvas.accent();
    const angColor = canvas.gold();
    const perpColor = canvas.purple();
    const big = 4.0 * (halfW + halfH);

    // whole line (thin) + the segment AB (thick)
    canvas.addSegment({ x1: x1 - dx / len * big, y1: y1 - dy / len * big, x2: x1 + dx / len * big, y2: y1 + dy / len * big, color: lineColor, thickness: 1.2 });
    canvas.addSegment({ x1, y1, x2, y2, color: lineColor, thickness: 3.0 });

    if (!vertical) {
      canvas.addSegment({ x1, y1, x2, y2: y1, color: canvas.orange(), thickness: 1.5, dashed: true });
      canvas.addSegment({ x1: x2, y1, x2, y2, color: canvas.blue(), thickness: 1.5, dashed: true });
    }

    // angle of inclination: arc from the positive x-axis counter-clockwise to the line
    const slope = vertical ? NaN : dy / dx;
    const thetaDeg = vertical ? 90.0 : inclinationDeg(slope);
    let vx = x1, vy = y1;
    if (vertical) { vx = x1; vy = 0; }
    else if (slope !== 0) {
      const xi = x1 - y1 / slope;
      if (Math.abs(xi) < halfW - 3) { vx = xi; vy = 0; }
    }
    const r = Math.max(1.6, halfH * 0.18);
    const th = thetaDeg * Math.PI / 180.0;
    canvas.addSegment({ x1: vx, y1: vy, x2: vx + r * 1.6, y2: vy, color: angColor, thickness: 1.5 });
    if (th > 0.001) {
      const cx = vx, cy = vy, rr = r;
      canvas.addParametric({ xOfT: (t) => cx + rr * Math.cos(t), yOfT: (t) => cy + rr * Math.sin(t), tMin: 0, tMax: th, samples: 90, color: angColor, thickness: 3.5 });
    }
    const mid = Math.max(th / 2, 0.25);
    label(canvas, vx + r * 1.7 * Math.cos(mid), vy + r * 1.7 * Math.sin(mid) + (th < 0.9 ? 0.9 : 0.0), `θ = ${fmt2(thetaDeg)}°`);

    // perpendicular through the midpoint of AB (dashed) + right-angle square
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    canvas.addSegment({ x1: mx - px * big, y1: my - py * big, x2: mx + px * big, y2: my + py * big, color: perpColor, thickness: 2.0, dashed: true });
    const s = Math.max(0.5, halfH * 0.05);
    canvas.addSegment({ x1: mx + ux * s, y1: my + uy * s, x2: mx + (ux + px) * s, y2: my + (uy + py) * s, color: perpColor, thickness: 1.5 });
    canvas.addSegment({ x1: mx + (ux + px) * s, y1: my + (uy + py) * s, x2: mx + px * s, y2: my + py * s, color: perpColor, thickness: 1.5 });
    let perpText;
    if (vertical) perpText = tx('dik doğru: m⊥ = 0', 'perpendicular: m⊥ = 0');
    else if (slope === 0) perpText = tx('dik doğru: m⊥ tanımsız', 'perpendicular: m⊥ undefined');
    else { const f = frac(-dx, dy); perpText = tx(`dik doğru: m⊥ = ${f}`, `perpendicular: m⊥ = ${f}`); }
    const d = Math.min(halfH * 0.38, 4.0);
    let lx = mx + px * d, ly = my + py * d;
    const lx2 = mx - px * d, ly2 = my - py * d;
    if (Math.abs(lx2) / halfW + Math.abs(ly2) / halfH < Math.abs(lx) / halfW + Math.abs(ly) / halfH) { lx = lx2; ly = ly2; }
    label(canvas, lx, ly, perpText);

    canvas.addMarker({ x: p.x1, y: p.y1, color: canvas.accent(), radius: 7.0, label: 'A' });
    canvas.addMarker({ x: p.x2, y: p.y2, color: canvas.accent(), radius: 7.0, label: 'B' });
  }

  Topics.register('numbers', {
    id: 'slope',
    tabTitle: () => I18N.tx('Eğim', 'Slope'),
    concept: () => I18N.tx(
      [
        "1) EĞİM: İki nokta arasındaki eğim, dikey değişimin yatay değişime oranıdır: m = Δy/Δx = (y₂-y₁)/(x₂-x₁). Eğim pozitifse doğru soldan sağa yükselir, negatifse alçalır, sıfırsa doğru YATAYDIR (Δy=0). Δx=0 ise doğru DİKEYDİR ve eğim TANIMSIZDIR (sıfıra bölme).",
        "Anlamı: x 1 birim arttığında y, m birim değişir. Örneğin m = 3 → 1 sağa, 3 yukarı; m = -1/2 → 2 sağa, 1 aşağı. Eğim noktaların SIRASINDAN bağımsızdır (pay ve paydada işaretler birlikte değişir), ama pay ile paydada aynı sırayı kullanmamız gerekir.",
        "",
        "YÖNTEM (iki noktadan eğim)",
        "1) Aynı sırayla Δy = y₂ - y₁ ve Δx = x₂ - x₁ değerlerini hesaplayalım.",
        "2) Δx = 0 ise doğru dikeydir ve eğim tanımsızdır. Aksi halde m = Δy/Δx olur.",
        "3) Gerekirse sadeleştirip işareti yorumlayabiliriz (yükselen / alçalan / yatay).",
        "Mini örnek: A(1, 2), B(5, -6): Δy = -8, Δx = 4 → m = -2 (alçalan doğru).",
        "",
        "2) EĞİM AÇISI: θ, doğrunun POZİTİF x ekseniyle yaptığı açıdır ve x ekseninden doğruya doğru SAAT YÖNÜNÜN TERSİNE ölçülür. m = tan θ olduğundan:",
        "• m > 0: θ = arctan m  (0° < θ < 90°, dar açı)",
        "• m = 0: θ = 0° (yatay doğru)",
        "• m < 0: arctan m negatiftir; θ = 180° + arctan m = 180° - |arctan m|  (90° < θ < 180°, geniş açı)",
        "• Dikey doğru: θ = 90°, eğim tanımsız (tan 90° tanımsızdır).",
        "Aynı doğru için θ ile θ+180° de geçerlidir; ana değer 0° ≤ θ < 180° aralığındadır. Eğimin mutlak değeri büyüdükçe θ, 0° ya da 180°'den uzaklaşır ve doğru dikleşir (|m| büyük → dik, |m| küçük → yatık).",
        "Özel değerler: m = 1 → 45°, m = √3 → 60°, m = 1/√3 → 30°, m = -1 → 135°.",
        "Mini örnek: m = -√3 → arctan(-√3) = -60°, θ = 180° - 60° = 120°.",
        "Dikkat: Hesap makinesi m < 0 için negatif açı verir; bu durumda 180° eklemeyi unutmayalım.",
        "",
        "3) DİK DOĞRUNUN EĞİMİ: Birbirine dik iki doğrunun eğimleri için m · m⊥ = -1, yani m⊥ = -1/m olur (ters çevirip işareti değiştiririz). Yatay doğruya dik olan doğru dikeydir (eğimi tanımsız), dikeye dik olan yataydır (eğimi 0). Açılar: θ⊥ = θ + 90° (θ < 90° ise), θ⊥ = θ - 90° (θ ≥ 90° ise).",
        "Mini örnek: m = 2/3 → m⊥ = -3/2. Kontrol: (2/3)(-3/2) = -1.",
        "",
        "ÖZET / DİKKAT",
        "• Eğim tanımsız ≠ eğim sıfır: dikey doğru x = a, yatay doğru y = b.",
        "• Üç noktanın doğrudaş olması için A-B ve A-C eğimlerinin eşit olması gerekir.",
        "• Hatırlatma: eğim = 'yükseliş / koşu' (rise/run). Yol eğimi %8 demek m = 0,08 demektir."
      ].join('\n'),
      [
        "1) SLOPE: The slope between two points is the ratio of the vertical change to the horizontal change: m = Δy/Δx = (y₂-y₁)/(x₂-x₁). If the slope is positive the line rises from left to right, if negative it falls, and if zero the line is HORIZONTAL (Δy=0). If Δx=0 the line is VERTICAL and the slope is UNDEFINED (division by zero).",
        "Meaning: when x increases by 1, y changes by m. For example m = 3 → 1 right, 3 up; m = -1/2 → 2 right, 1 down. The slope does not depend on the ORDER of the points (numerator and denominator both change sign), but it helps to use the same order in both.",
        "",
        "METHOD (slope from two points)",
        "1) Let's compute Δy = y₂ - y₁ and Δx = x₂ - x₁ in the same order.",
        "2) If Δx = 0, the line is vertical and the slope is undefined. Otherwise m = Δy/Δx.",
        "3) We can simplify and interpret the sign (rising / falling / horizontal).",
        "Mini example: A(1, 2), B(5, -6): Δy = -8, Δx = 4 → m = -2 (falling line).",
        "",
        "2) ANGLE OF INCLINATION: θ is the angle the line makes with the POSITIVE x-axis, measured COUNTER-CLOCKWISE from the x-axis to the line. Since m = tan θ:",
        "• m > 0: θ = arctan m  (0° < θ < 90°, acute)",
        "• m = 0: θ = 0° (horizontal line)",
        "• m < 0: arctan m is negative; θ = 180° + arctan m = 180° - |arctan m|  (90° < θ < 180°, obtuse)",
        "• Vertical line: θ = 90°, slope undefined (tan 90° is undefined).",
        "The same line also has θ + 180°; the principal value lies in 0° ≤ θ < 180°. The bigger |m| is, the farther θ is from 0° or 180° and the steeper the line (large |m| → steep, small |m| → flat).",
        "Special values: m = 1 → 45°, m = √3 → 60°, m = 1/√3 → 30°, m = -1 → 135°.",
        "Mini example: m = -√3 → arctan(-√3) = -60°, so θ = 180° - 60° = 120°.",
        "Pitfall: a calculator gives a negative angle for m < 0; in that case let's remember to add 180°.",
        "",
        "3) SLOPE OF A PERPENDICULAR LINE: for two perpendicular lines m · m⊥ = -1, i.e. m⊥ = -1/m (we flip and change the sign). A line perpendicular to a horizontal line is vertical (slope undefined), and one perpendicular to a vertical line is horizontal (slope 0). Angles: θ⊥ = θ + 90° (if θ < 90°), θ⊥ = θ - 90° (if θ ≥ 90°).",
        "Mini example: m = 2/3 → m⊥ = -3/2. Check: (2/3)(-3/2) = -1.",
        "",
        "SUMMARY / PITFALLS",
        "• Undefined slope ≠ zero slope: vertical line x = a, horizontal line y = b.",
        "• Three points are collinear if the slopes A-B and A-C are equal.",
        "• Memory aid: slope = rise / run. A road grade of 8% means m = 0.08."
      ].join('\n')
    ),
    problemStatement: (p) => (p.extra ? colStatement(p) : problemStatement(p)),
    links: [
      { match: /^1\) (EĞİM|SLOPE):/, make: (rng) => makeWhere(rng, (q) => q.x1 !== q.x2) },
      { match: /^• m > 0:/, make: (rng) => makeWhere(rng, (q) => q.x1 !== q.x2 && (q.y2 - q.y1) / (q.x2 - q.x1) > 0) },
      { match: /^• m = 0:/, make: (rng) => { const q = createProblem(rng); if (q.x1 === q.x2) q.x2 = q.x1 + 3; q.y2 = q.y1; return q; } },
      { match: /^• m < 0:/, make: (rng) => makeWhere(rng, (q) => q.x1 !== q.x2 && (q.y2 - q.y1) / (q.x2 - q.x1) < 0) },
      { match: /^• (Dikey doğru|Vertical line):/, make: (rng) => { const q = createProblem(rng); q.x2 = q.x1; if (q.y2 === q.y1) q.y2 = q.y1 + 3; return q; } },
      { match: /^(Özel değerler|Special values):/, make: makeSpecial },
      { match: /^2\) (EĞİM AÇISI|ANGLE OF INCLINATION)/, make: (rng) => makeWhere(rng, (q) => q.x1 !== q.x2) },
      { match: /^3\) (DİK DOĞRUNUN EĞİMİ|SLOPE OF A PERPENDICULAR LINE)/, make: (rng) => makeWhere(rng, (q) => q.x1 !== q.x2 && q.y1 !== q.y2) },
      { match: /^• (Üç noktanın doğrudaş|Three points are collinear)/, make: makeCollinear },
    ],
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 }),
    buildControls: (rightCol, getProblem, h) => {
      window.addEventListener('resize', () => { try { h.refresh(); } catch (e) { /* topic not mounted */ } });
      h.addSlider({
        caption: I18N.tx('A noktası - x₁', 'Point A - x₁'), min: -10, max: 10,
        get: () => getProblem().x1, set: (v) => { getProblem().x1 = Math.round(v); },
      });
      h.addSlider({
        caption: I18N.tx('A noktası - y₁', 'Point A - y₁'), min: -10, max: 10,
        get: () => getProblem().y1, set: (v) => { getProblem().y1 = Math.round(v); },
      });
      h.addSlider({
        caption: I18N.tx("B noktası - x₂  (x₁'e eşit olursa doğru dikey olur)", 'Point B - x₂  (if equal to x₁, the line is vertical)'), min: -10, max: 10,
        get: () => getProblem().x2, set: (v) => { getProblem().x2 = Math.round(v); },
      });
      h.addSlider({
        caption: I18N.tx('B noktası - y₂', 'Point B - y₂'), min: -10, max: 10,
        get: () => getProblem().y2, set: (v) => { getProblem().y2 = Math.round(v); },
      });
    },
  });
})();
