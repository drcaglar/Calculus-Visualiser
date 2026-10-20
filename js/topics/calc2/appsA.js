// Calculus II - applications A: hydrostatic force on a vertical plate (2D + 3D) and probability density functions (2D).
// Every closed form is checked against an independent Simpson computation inside createProblem (and in the quiz generators).
window.Calc2Quiz = window.Calc2Quiz || { main: [], extra: [] };

(function () {
  const K = Calc2, tx = K.tx, { pEval, pMul, pInt, simpson, N2, frac, neg, withPi, Iexp, sup } = K;
  const RHO = 1000, G = 9.81, RG = RHO * G, PI = Math.PI;

  // plates: k 0 rectangle, 1 triangle apex down, 2 triangle apex up, 3 trapezoid (widths wa at depth d1 and wb at d2 = d1 + H), 4 semicircle (diameter on top, radius R)
  const lin = (k, wa, wb, d1, H) => ({ k, wa, wb, d1, H });
  const S = [
    lin(0, 4, 4, 0, 3), lin(0, 3, 3, 1, 2), lin(0, 6, 6, 2, 3), lin(0, 2, 2, 0, 5),
    lin(1, 4, 0, 0, 3), lin(1, 6, 0, 1, 3), lin(1, 2, 0, 2, 4), lin(1, 3, 0, 0, 2),
    lin(2, 0, 6, 0, 3), lin(2, 0, 4, 1, 2), lin(2, 0, 3, 2, 3), lin(2, 0, 2, 0, 4),
    lin(3, 2, 6, 0, 2), lin(3, 6, 2, 1, 3), lin(3, 4, 8, 0, 4), lin(3, 3, 5, 2, 2),
    { k: 4, R: 1, d1: 0, H: 1 }, { k: 4, R: 2, d1: 0, H: 2 }, { k: 4, R: 1, d1: 1, H: 1 }, { k: 4, R: 2, d1: 1, H: 2 },
  ];
  const KIND = () => [tx('Dikdörtgen', 'Rectangle'), tx('Üçgen (tepe aşağıda)', 'Triangle (apex down)'), tx('Üçgen (tepe yukarıda)', 'Triangle (apex up)'), tx('Yamuk', 'Trapezoid'), tx('Yarım daire', 'Semicircle')];
  const name = (s) => [
    `${tx('Dikdörtgen', 'Rectangle')} ${s.wa} × ${s.H} m, d₁ = ${s.d1} m`,
    `${tx('Üçgen, taban', 'Triangle, base')} ${s.wa} m, ${tx('yükseklik', 'height')} ${s.H} m, d₁ = ${s.d1} m`,
    `${tx('Üçgen, taban', 'Triangle, base')} ${s.wb} m, ${tx('yükseklik', 'height')} ${s.H} m, d₁ = ${s.d1} m`,
    `${tx('Yamuk', 'Trapezoid')} ${s.wa} / ${s.wb} m, ${tx('yükseklik', 'height')} ${s.H} m, d₁ = ${s.d1} m`,
    `${tx('Yarım daire', 'Semicircle')} R = ${s.R} m, d₁ = ${s.d1} m`,
  ][s.k];
  const d2 = (s) => s.d1 + s.H;
  const wPoly = (s) => { const c1 = (s.wb - s.wa) / s.H; return [s.wa - c1 * s.d1, c1]; };
  const maxW = (s) => (s.k === 4 ? 2 * s.R : Math.max(s.wa, s.wb));
  // half width of the plate at depth y
  const hw = (s, y) => (s.k === 4 ? Math.sqrt(Math.max(s.R * s.R - (y - s.d1) * (y - s.d1), 0)) : Math.max(0, (s.wa + (s.wb - s.wa) * (y - s.d1) / s.H) / 2));
  // depths [top, bottom] of the plate along the vertical line at horizontal position x (null outside the plate)
  function edge(s, x) {
    const ax = Math.abs(x);
    if (s.k === 4) return ax > s.R ? null : [s.d1, s.d1 + Math.sqrt(s.R * s.R - ax * ax)];
    const ha = s.wa / 2, hb = s.wb / 2;
    if (ax > Math.max(ha, hb) + 1e-12) return null;
    if (ha === hb) return [s.d1, d2(s)];
    if (hb > ha) return ax <= ha ? [s.d1, d2(s)] : [s.d1 + s.H * (ax - ha) / (hb - ha), d2(s)];
    return ax <= hb ? [s.d1, d2(s)] : [s.d1, s.d1 + s.H * (ax - ha) / (hb - ha)];
  }
  // exact moments: A = ∫w dy, I1 = ∫y·w dy, I2 = ∫y²·w dy over the plate (m², m³, m⁴)
  function mom(s) {
    if (s.k === 4) {
      const R = s.R, d = s.d1;
      return { A: PI * R * R / 2, I1: d * PI * R * R / 2 + 2 * R ** 3 / 3, I2: d * d * PI * R * R / 2 + 4 * d * R ** 3 / 3 + PI * R ** 4 / 8 };
    }
    const w = wPoly(s), ev = (c) => { const P = pInt(c); return pEval(P, d2(s)) - pEval(P, s.d1); };
    return { A: ev(w), I1: ev(pMul([0, 1], w)), I2: ev(pMul([0, 0, 1], w)) };
  }
  // independent numeric moments (Simpson; the semicircle through u = R·sinθ so the integrand is smooth)
  function numMom(s, upTo) {
    const top = upTo === undefined ? d2(s) : upTo;
    if (s.k === 4) {
      const R = s.R, th = Math.asin(Math.min(1, Math.max(0, (top - s.d1) / R)));
      const g = (e) => simpson((t) => Math.pow(s.d1 + R * Math.sin(t), e) * 2 * R * R * Math.cos(t) * Math.cos(t), 0, th, 2000);
      return { A: g(0), I1: g(1), I2: g(2) };
    }
    const g = (e) => simpson((y) => Math.pow(y, e) * 2 * hw(s, y), s.d1, top, 2000);
    return { A: g(0), I1: g(1), I2: g(2) };
  }
  const exact = (p) => mom(p.reg).I1;
  const forcekN = (s) => RG * mom(s).I1 / 1000;
  const ycp = (s) => { const m = mom(s); return m.I2 / m.I1; };

  // polynomial text with exact fractions as coefficients
  const fp = (c, v) => {
    let out = '';
    for (let i = c.length - 1; i >= 0; i--) {
      const a = c[i];
      if (Math.abs(a) < 1e-12) continue;
      const m = Math.abs(a), isInt = Math.abs(m - Math.round(m)) < 1e-9, cs = isInt ? String(Math.round(m)) : '(' + frac(m) + ')';
      const body = i === 0 ? (isInt ? cs : frac(m)) : (cs === '1' ? '' : cs) + v + (i > 1 ? sup(i) : '');
      out += out ? (a < 0 ? ' − ' : ' + ') + body : (a < 0 ? '−' : '') + body;
    }
    return out || '0';
  };
  const kN = (v) => N2(v) + ' kN';
  const Nw = (v) => N2(Math.round(v * 100) / 100) + ' N';
  const sel = { reg: null, kind: null };

  function createProblem(rng) {
    const ri = rng.nextInt(0, S.length);
    const p = { mode: S[ri].k, ri, s: 0.5, reg: S[ri] };
    const e = mom(p.reg), n = numMom(p.reg);
    const same = (a, b) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(b));
    if (!same(e.I1, n.I1) || !same(e.I2, n.I2) || !same(e.A, n.A)) throw new Error('fluidForce: closed form ' + e.I1 + ' != numeric ' + n.I1);
    if (sel.reg) sel.reg.refreshFromModel();
    if (sel.kind) sel.kind.refreshFromModel();
    return p;
  }

  function plateText(s) {
    const top = s.d1 === 0 ? tx('serbest yüzeyle aynı seviyededir', 'is level with the free surface') : tx(`serbest yüzeyin ${s.d1} m altındadır`, `is ${s.d1} m below the free surface`);
    if (s.k === 0) return tx(`Genişliği ${s.wa} m, yüksekliği ${s.H} m olan dikdörtgen bir plaka bir su tankında dikey durmaktadır; üst kenarı ${top}.`, `A rectangular plate ${s.wa} m wide and ${s.H} m high stands vertically in a water tank; its top edge ${top}.`);
    if (s.k === 1) return tx(`Tabanı ${s.wa} m, yüksekliği ${s.H} m olan ikizkenar üçgen bir plaka, tabanı üstte ve tepe noktası aşağıda olacak biçimde suda dikey durmaktadır; tabanı ${top}.`, `An isosceles triangular plate with base ${s.wa} m and height ${s.H} m stands vertically in water with its base on top and its apex down; the base ${top}.`);
    if (s.k === 2) return tx(`Tabanı ${s.wb} m, yüksekliği ${s.H} m olan ikizkenar üçgen bir plaka, tepe noktası üstte ve tabanı altta olacak biçimde suda dikey durmaktadır; tepe noktası ${top}.`, `An isosceles triangular plate with base ${s.wb} m and height ${s.H} m stands vertically in water with its apex on top and its base at the bottom; the apex ${top}.`);
    if (s.k === 3) return tx(`Üst kenarı ${s.wa} m, alt kenarı ${s.wb} m, yüksekliği ${s.H} m olan ikizkenar yamuk bir plaka suda dikey durmaktadır; üst kenarı ${top}.`, `An isosceles trapezoidal plate with top edge ${s.wa} m, bottom edge ${s.wb} m and height ${s.H} m stands vertically in water; its top edge ${top}.`);
    return tx(`Yarıçapı ${s.R} m olan yarım daire biçimli bir plaka, çapı üstte olacak biçimde suda dikey durmaktadır; çapı ${top}.`, `A semicircular plate of radius ${s.R} m stands vertically in water with its diameter on top; the diameter ${top}.`);
  }
  function statement(p) {
    const s = p.reg, cp = s.k < 4;
    return plateText(s) + ' ' + tx(`Plakanın bir yüzüne etkiyen toplam hidrostatik kuvveti ρg cinsinden tam olarak ve kN olarak${cp ? ', ayrıca basınç merkezinin derinliğini' : ''} bulalım (su: ρ = 1000 kg/m³, g = 9.81 m/s²).`,
      `Let's find the total hydrostatic force on one face of the plate exactly in terms of ρg and in kN${cp ? ', and also the depth of the centre of pressure' : ''} (water: ρ = 1000 kg/m³, g = 9.81 m/s²).`);
  }

  function steps(p) {
    const s = p.reg, a = s.d1, b = d2(s), F = Iexp(a, b), M = mom(s), out = [], cpv = ycp(s), lin1 = s.k < 4;
    const first = tx(`── 1) Basınç ve tipik şerit ──\nSerbest yüzeyden aşağı doğru ölçülen y derinliğinde basınç p(y) = ρ·g·y (ölçü basıncı).\nDerinliği y, kalınlığı dy olan yatay şeridin alanı w(y)·dy olduğundan kuvveti dF = ρ·g·y·w(y) dy'dir.`,
      `── 1) Pressure and a typical strip ──\nAt depth y below the free surface the pressure is p(y) = ρ·g·y (gauge pressure).\nA horizontal strip at depth y of thickness dy has area w(y)·dy, so its force is dF = ρ·g·y·w(y) dy.`);
    out.push(first);
    if (lin1) {
      const w = wPoly(s);
      const wr = s.k === 0 ? `w(y) = ${s.wa}` : `w(${N2(a)}) = ${s.wa}, w(${N2(b)}) = ${s.wb}  ⇒  w(y) = ${fp(w, 'y')}`;
      out.push(tx(`── 2) Genişlik w(y) ──\nGenişlik derinlikle ${s.k === 0 ? 'değişmez' : 'doğrusal değişir (benzer üçgenler)'}:\n${wr}  (m)`, `── 2) The width w(y) ──\nThe width ${s.k === 0 ? 'does not change with depth' : 'changes linearly with depth (similar triangles)'}:\n${wr}  (m)`));
      const integ = fp(pMul([0, 1], w), 'y');
      out.push(tx(`── 3) Kuvvet integrali ──\nF = ρg ${F} y·w(y) dy = ρg ${F} (${integ}) dy`, `── 3) The force integral ──\nF = ρg ${F} y·w(y) dy = ρg ${F} (${integ}) dy`));
      const P = pInt(pMul([0, 1], w)), Pb = pEval(P, b), Pa = pEval(P, a);
      out.push(tx(`── 4) Ters türev ve sınırlar ──\nP(y) = ${fp(P, 'y')}\nI = P(${N2(b)}) − P(${N2(a)}) = ${frac(Pb)} − (${frac(Pa)}) = ${frac(M.I1)}  (m³)`,
        `── 4) Antiderivative and limits ──\nP(y) = ${fp(P, 'y')}\nI = P(${N2(b)}) − P(${N2(a)}) = ${frac(Pb)} − (${frac(Pa)}) = ${frac(M.I1)}  (m³)`));
    } else {
      const R = s.R, IR = Iexp(0, R), t2 = frac(2 * R ** 3 / 3), val = a === 0 ? t2 : withPi(a * R * R / 2) + ' + ' + t2;
      out.push(tx(`── 2) Genişlik w(y) ──\nu = y − ${N2(a)} (çaptan aşağı uzaklık) olsun, 0 ≤ u ≤ ${R}. Çember denklemi x² + u² = R² olduğundan\nw = 2√(R² − u²) = 2√(${R * R} − u²)  (m)`, `── 2) The width w(y) ──\nLet u = y − ${N2(a)} (distance below the diameter), 0 ≤ u ≤ ${R}. The circle x² + u² = R² gives\nw = 2√(R² − u²) = 2√(${R * R} − u²)  (m)`));
      out.push(tx(`── 3) Kuvvet integrali ──\nF = ρg ${IR} (${N2(a)} + u)·2√(R² − u²) du = ρg [ ${N2(a)}·${IR} 2√(R² − u²) du + ${IR} 2u√(R² − u²) du ]`,
        `── 3) The force integral ──\nF = ρg ${IR} (${N2(a)} + u)·2√(R² − u²) du = ρg [ ${N2(a)}·${IR} 2√(R² − u²) du + ${IR} 2u√(R² − u²) du ]`));
      out.push(tx(`── 4) İki integral ──\n${IR} 2√(R² − u²) du = πR²/2 = ${withPi(R * R / 2)}  (yarım dairenin alanı)\n${IR} 2u√(R² − u²) du = [−(2/3)(R² − u²)^(3/2)] = (2/3)R³ = ${t2}\nI = ${N2(a)}·${withPi(R * R / 2)} + ${t2} = ${val} ≈ ${N2(M.I1)}  (m³)`,
        `── 4) The two integrals ──\n${IR} 2√(R² − u²) du = πR²/2 = ${withPi(R * R / 2)}  (area of the half disc)\n${IR} 2u√(R² − u²) du = [−(2/3)(R² − u²)^(3/2)] = (2/3)R³ = ${t2}\nI = ${N2(a)}·${withPi(R * R / 2)} + ${t2} = ${val} ≈ ${N2(M.I1)}  (m³)`));
    }
    const exactI = s.k === 4 ? (s.d1 === 0 ? frac(2 * s.R ** 3 / 3) : '(' + withPi(s.d1 * s.R * s.R / 2) + ' + ' + frac(2 * s.R ** 3 / 3) + ')') : frac(M.I1);
    const Fn = RG * M.I1;
    out.push(tx(`── 5) Sonuç ──\nF = ρg·I = ρg·${exactI}  (tam ifade)\nF = 9810·${N2(M.I1)} ≈ ${Nw(Fn)} ≈ ${kN(Fn / 1000)}`, `── 5) Result ──\nF = ρg·I = ρg·${exactI}  (exact expression)\nF = 9810·${N2(M.I1)} ≈ ${Nw(Fn)} ≈ ${kN(Fn / 1000)}`));
    const cpLine = s.k === 4
      ? `y_cp = (d₁²·πR²/2 + 4d₁R³/3 + πR⁴/8) / I = ${N2(M.I2)} / ${N2(M.I1)} ≈ ${N2(cpv)} m`
      : `∫ y²·w dy = ${frac(M.I2)} (m⁴)  ⇒  y_cp = ${frac(M.I2)} / ${frac(M.I1)} = ${frac(cpv)} ≈ ${N2(cpv)} m`;
    const yc = M.I1 / M.A;
    out.push(tx(`── 6) Basınç merkezi ──\nBileşke kuvvetin derinliği y_cp = ∫y²·w dy / ∫y·w dy:\n${cpLine}\nPlakanın ağırlık merkezi ${N2(yc)} m derinliktedir (F = ρg·ȳ·A, A = ${N2(M.A)} m²); basınç merkezi ondan daha derindedir.`,
      `── 6) Centre of pressure ──\nDepth of the resultant force y_cp = ∫y²·w dy / ∫y·w dy:\n${cpLine}\nThe centroid of the plate is at depth ${N2(yc)} m (F = ρg·ȳ·A, A = ${N2(M.A)} m²); the centre of pressure is deeper than it.`));
    const nm = numMom(s);
    out.push(tx(`── 7) Sayısal kontrol ──\nSimpson kuralıyla I ≈ ${N2(nm.I1)} m³ ⇒ F ≈ ${kN(RG * nm.I1 / 1000)}; aynı ✓.`, `── 7) Numerical check ──\nSimpson's rule gives I ≈ ${N2(nm.I1)} m³ ⇒ F ≈ ${kN(RG * nm.I1 / 1000)}; the same ✓.`));
    out.push(tx(`── 8) Varsayımlar ve birimler ──\nVarsayımlar ve birimler: durgun, sıkıştırılamaz akışkan (su, ρ = 1000 kg/m³, g = 9.81 m/s²); serbest yüzeydeki atmosfer basıncı plakanın iki yüzünde birbirini götürdüğünden ölçü (gauge) basıncı p = ρ·g·y kullanıldı. Uzunluk m, basınç Pa = N/m², kuvvet N (1 kN = 1000 N); kuvvet plakaya diktir.`,
      `── 8) Assumptions and units ──\nAssumptions and units: static, incompressible fluid (water, ρ = 1000 kg/m³, g = 9.81 m/s²); atmospheric pressure acts on both faces and cancels, so the gauge pressure p = ρ·g·y is used. Length in m, pressure in Pa = N/m², force in N (1 kN = 1000 N); the force acts normal to the plate.`));
    return out;
  }

  function draw(c, p) {
    const s = p.reg, b = d2(s), W = maxW(s), M = mom(s), cp = ycp(s);
    const y0 = s.d1 + p.s * s.H, dy = s.H / 30, X0 = W / 2 + 0.35, Lmax = 0.6 * Math.max(W, 0.5 * b);
    const L = (y) => Lmax * y / b;
    const xr = [-(X0 + Lmax + 0.7), W / 2 + 0.9];
    c.setViewport(xr[0], xr[1], -(b + 0.6), 0.6);
    const safe = (fn) => (x) => { const e = edge(s, x); if (!e) return NaN; const v = fn(e); return Number.isFinite(v) ? v : NaN; };
    c.addFilledArea({ evaluator: () => 0, baseEvaluator: () => -(b + 0.6), xMin: xr[0], xMax: xr[1], color: K.col(c, 'accent', 0.1) });
    c.addFilledArea({ evaluator: safe((e) => -e[0]), baseEvaluator: safe((e) => -e[1]), xMin: -W / 2, xMax: W / 2, color: K.col(c, 'accent', 0.4), samples: 300 });
    c.addFilledArea({ evaluator: safe((e) => (e[0] < Math.min(e[1], y0) ? -e[0] : NaN)), baseEvaluator: safe((e) => -Math.min(e[1], y0)), xMin: -W / 2, xMax: W / 2, color: K.col(c, 'orange', 0.3), samples: 300 });
    c.addFilledArea({ evaluator: safe((e) => (Math.max(e[0], y0) < Math.min(e[1], y0 + dy) ? -Math.max(e[0], y0) : NaN)), baseEvaluator: safe((e) => -Math.min(e[1], y0 + dy)), xMin: -W / 2, xMax: W / 2, color: K.col(c, 'orange', 0.85), samples: 300 });
    let poly;
    if (s.k === 4) { poly = []; for (let i = 0; i <= 48; i++) { const t = PI * i / 48; poly.push([s.R * Math.cos(t), s.d1 + s.R * Math.sin(t)]); } }
    else poly = [[-s.wa / 2, s.d1], [s.wa / 2, s.d1], [s.wb / 2, b], [-s.wb / 2, b]];
    for (let i = 0; i < poly.length; i++) { const q = poly[i], r = poly[(i + 1) % poly.length]; c.addSegment({ x1: q[0], y1: -q[1], x2: r[0], y2: -r[1], color: c.accent(), thickness: 2.5 }); }
    c.addGuideLine({ axis: 'horizontal', position: 0, color: c.accent(), label: tx('serbest yüzey (y = 0)', 'free surface (y = 0)') });
    // pressure diagram p = ρ·g·y on the left (triangle from the surface) with arrows over the plate
    c.addSegment({ x1: -X0, y1: 0, x2: -X0, y2: -b, color: c.gray(), thickness: 1.5 });
    c.addSegment({ x1: -X0, y1: 0, x2: -X0 - L(b), y2: -b, color: c.gray(), thickness: 1.5 });
    c.addSegment({ x1: -X0, y1: -b, x2: -X0 - L(b), y2: -b, color: c.gray(), thickness: 1.5 });
    const hd = Math.min(0.25, 0.08 * Math.max(W, 1));
    for (let i = 0; i <= 6; i++) {
      const y = s.d1 + s.H * i / 6, ln = L(y);
      if (ln < 1e-6) continue;
      const col = Math.abs(y - y0) < s.H / 12 ? c.orange() : c.gray();
      c.addSegment({ x1: -X0 - ln, y1: -y, x2: -X0, y2: -y, color: col, thickness: 1.5 });
      c.addSegment({ x1: -X0, y1: -y, x2: -X0 - hd, y2: -y + hd * 0.5, color: col, thickness: 1.5 });
      c.addSegment({ x1: -X0, y1: -y, x2: -X0 - hd, y2: -y - hd * 0.5, color: col, thickness: 1.5 });
    }
    c.addMarker({ x: -X0 - L(b), y: -b, color: c.gray(), radius: 3, label: `p = ρg·${N2(b)} = ${N2(RG * b / 1000)} kPa` });
    c.addSegment({ x1: -X0, y1: -y0, x2: -hw(s, y0), y2: -y0, color: c.orange(), thickness: 1.5, dashed: true });
    c.addGuideLine({ axis: 'horizontal', position: -y0, color: c.orange(), label: `y = ${N2(y0)} m` });
    const part = RG * numMom(s, y0).I1 / 1000;
    c.addMarker({ x: 0, y: -(s.d1 + y0) / 2, color: c.orange(), radius: 4, label: tx(`y'ye kadar kuvvet ≈ ${N2(part)} kN`, `force down to y ≈ ${N2(part)} kN`) });
    c.addMarker({ x: Math.max(hw(s, y0), 0.05), y: -y0, color: c.orange(), radius: 5, label: `w = ${N2(2 * hw(s, y0))} m` });
    c.addMarker({ x: 0, y: -cp, color: c.gold(), radius: 6, label: `y_cp = ${N2(cp)} m` });
    c.addMarker({ x: 0, y: -M.I1 / M.A, color: c.gray(), radius: 4, hollow: true, label: `ȳ = ${N2(M.I1 / M.A)} m` });
  }

  // 3D: tank with water, the plate and the pressure ramp p = ρgy shown as arrows
  const fluid3d = ({ THREE, world, V3 }) => ({ update(p, C) {
    const s = p.reg, b = d2(s), W = maxW(s), dy = s.H / 30, y0 = Math.min(b - dy, s.d1 + p.s * s.H);
    const Lmax = 0.35 * Math.max(W + 1.6, b + 0.6, 2.4), Wt = W + 1.6, D = b + 0.6, T = 2 * (Lmax + 0.3);
    const sc = 3.4 / Math.max(Wt, D, T);
    world.scale.setScalar(sc); world.position.set(0, (D / 2) * sc, 0);
    const L = (y) => Lmax * y / b;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(Wt, D, T)), new THREE.LineBasicMaterial({ color: new THREE.Color(C.fg) }));
    edges.position.y = -D / 2; world.add(edges);
    const water = new THREE.Mesh(new THREE.BoxGeometry(Wt, D, T), V3.ghost(C.accent, 0.12)); water.position.y = -D / 2; world.add(water);
    const sh = new THREE.Shape();
    if (s.k === 4) { for (let i = 0; i <= 48; i++) { const t = PI * i / 48, x = s.R * Math.cos(t), y = -(s.d1 + s.R * Math.sin(t)); if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y); } }
    else {
      const pts = [[-s.wa / 2, -s.d1], [s.wa / 2, -s.d1], [s.wb / 2, -b], [-s.wb / 2, -b]].filter((q, i, a) => i === 0 || Math.hypot(q[0] - a[i - 1][0], q[1] - a[i - 1][1]) > 1e-9);
      pts.forEach((q, i) => { if (i === 0) sh.moveTo(q[0], q[1]); else sh.lineTo(q[0], q[1]); });
    }
    const pg = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }); pg.translate(0, 0, -0.06);
    world.add(new THREE.Mesh(pg, V3.mat(C.accent, { transparent: true, opacity: 0.9 })));
    // pressure ramp: the z-y profile extruded along x
    const rw = Math.max(W, 0.5), rs = new THREE.Shape();
    rs.moveTo(0, -s.d1); rs.lineTo(0, -b); rs.lineTo(-L(b), -b); rs.lineTo(-L(s.d1) - 1e-6, -s.d1);
    const rg = new THREE.ExtrudeGeometry(rs, { depth: rw, bevelEnabled: false }); rg.translate(0, 0, -rw / 2);
    const ramp = new THREE.Mesh(rg, V3.ghost(C.good, 0.28)); ramp.rotation.y = PI / 2; ramp.position.z = 0.06; world.add(ramp);
    const hex = new THREE.Color(C.good).getHex(), hexO = new THREE.Color(C.orange).getHex(), hl = 0.22, hwid = 0.14;
    for (let i = 0; i <= 5; i++) {
      const y = s.d1 + s.H * (i + 0.5) / 6, ln = L(y), h = hw(s, y);
      if (ln < 0.08) continue;
      [-0.6, 0, 0.6].forEach((f) => {
        if ((f !== 0 && h < 0.2) || (f === 0 && h < 0.02)) return;
        world.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(f * h, -y, ln + 0.06), ln, hex, Math.min(hl, ln * 0.6), hwid));
      });
    }
    const yc = y0 + dy / 2, strip = new THREE.Mesh(new THREE.BoxGeometry(Math.max(2 * hw(s, yc), 0.04), dy, 0.2), V3.mat(C.orange));
    strip.position.set(0, -yc, 0); world.add(strip);
    if (L(yc) > 0.08) world.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -yc, L(yc) + 0.1), L(yc), hexO, Math.min(hl, L(yc) * 0.6), hwid * 1.4));
    world.add(V3.line([[-Wt / 2, 0, -T / 2], [Wt / 2, 0, -T / 2], [Wt / 2, 0, T / 2], [-Wt / 2, 0, T / 2], [-Wt / 2, 0, -T / 2]], C.sub));
    return tx(`Turuncu şerit y = ${N2(y0)} m derinlikte; yeşil oklar p = ρ·g·y basıncıdır (derinlikle doğrusal artar), eğik yüzey basınç dağılımıdır.`, `The orange strip is at depth y = ${N2(y0)} m; the green arrows are the pressure p = ρ·g·y (linear in depth), the sloped ramp is the pressure distribution.`);
  } });

  function buildControls(rightCol, getProblem, h) {
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); };
    lab(tx('Plaka şekli', 'Plate shape'));
    sel.kind = h.addRadioGroup({ name: 'ffKind', options: KIND().map((l, i) => ({ label: l, value: i })), get: () => getProblem().mode,
      set: (v) => { const p = getProblem(); p.mode = Number(v); if (p.reg.k !== p.mode) { p.ri = S.findIndex((r) => r.k === p.mode); p.reg = S[p.ri]; } if (sel.reg) sel.reg.refreshFromModel(); } });
    lab(tx('Boyutlar (d₁: plakanın üst kenarının derinliği)', 'Dimensions (d₁: depth of the top edge)'));
    sel.reg = h.addSelect({ options: S.map((r, i) => ({ label: name(r), value: i })), get: () => getProblem().ri,
      set: (v) => { const p = getProblem(); p.ri = Number(v); p.reg = S[p.ri]; p.mode = p.reg.k; if (sel.kind) sel.kind.refreshFromModel(); } });
    h.addSlider({ caption: tx('Şerit derinliği y (0 = plakanın üstü, 1 = altı)', 'Strip depth y (0 = top of the plate, 1 = bottom)'), min: 0, max: 1, step: 0.05, get: () => getProblem().s, set: (v) => { getProblem().s = v; } });
  }

  const ofKind = (ks) => (rng) => {
    const idx = S.map((r, i) => i).filter((i) => ks.includes(S[i].k)), ri = idx[rng.nextInt(0, idx.length)];
    return { mode: S[ri].k, ri, s: 0.5, reg: S[ri] };
  };

  Topics.register('calc2', {
    id: 'fluidForce',
    tabTitle: () => tx('Akışkan Kuvveti', 'Fluid Force'),
    concept: () => tx([
      'HİDROSTATİK BASINÇ',
      'Durgun bir sıvıda serbest yüzeyin y kadar altındaki basınç p = ρ·g·y\'dir (ρ yoğunluk, g = 9.81 m/s²). Basınç derinlikle doğrusal artar ve plakaya diktir. Su için ρ = 1000 kg/m³, yani ρg = 9810 N/m³.',
      '',
      'KUVVET İNTEGRALİ',
      'Basınç plakanın her yerinde aynı olmadığından plakayı yatay şeritlere böleriz. Derinliği y, kalınlığı dy olan şeridin alanı w(y)·dy, basıncı yaklaşık ρ·g·y\'dir:',
      '  dF = ρ·g·y·w(y) dy',
      '  F = ρ·g ∫ₐᵇ y·w(y) dy',
      'y: serbest yüzeyden aşağı ölçülen derinlik; a ve b: plakanın üst ve alt kenarının derinliği; w(y): plakanın o derinlikteki genişliği.',
      '',
      'YÖNTEM',
      '1. y eksenini yüzeyden aşağı doğru seç ve tipik bir şerit çiz.',
      '2. Plakanın şekline bakarak w(y)\'yi yaz (benzer üçgenler ya da çember denklemi).',
      '3. F = ρg ∫ₐᵇ y·w(y) dy integralini hesapla; sonucu önce ρg cinsinden bırak.',
      '4. ρg = 9810 N/m³ ile N ya da kN\'a çevir ve birimleri kontrol et.',
      '',
      'DİKDÖRTGEN PLAKA',
      'w(y) genişliğe eşit ve sabittir: F = ρg·genişlik·(b² − a²)/2. Üst kenarı yüzeyde (a = 0) ise F = ½·ρg·genişlik·b².',
      '',
      'ÜÇGEN PLAKA (TEPE AŞAĞIDA)',
      'Taban üstte (genişlik c), tepe aşağıda: genişlik derinlikle azalır, benzer üçgenlerden w(y) = c·(b − y)/(b − a).',
      '',
      'ÜÇGEN PLAKA (TEPE YUKARIDA)',
      'Tepe üstte, taban altta: genişlik derinlikle artar, w(y) = c·(y − a)/(b − a).',
      '',
      'YAMUK PLAKA',
      'Üst ve alt kenar farklıysa w(y) doğrusaldır: w(a) = üst kenar, w(b) = alt kenar, yani w(y) = üst + (alt − üst)·(y − a)/(b − a).',
      '',
      'YARIM DAİRE PLAKA',
      'Çapı üstte, yarıçapı R olan plaka: u = y − a alınırsa w = 2√(R² − u²). Gerekli iki integral ∫₀ᴿ 2√(R² − u²) du = πR²/2 ve ∫₀ᴿ 2u√(R² − u²) du = 2R³/3 olduğundan F = ρg·(a·πR²/2 + 2R³/3) bulunur.',
      '',
      'BASINÇ MERKEZİ',
      'Bileşke kuvvetin etki ettiği derinlik y_cp = ∫y²·w dy / ∫y·w dy\'dir ve ağırlık merkezinden daha derindedir. Üst kenarı yüzeyde olan dikdörtgen için y_cp = 2b/3.',
      '',
      'TUZAKLAR',
      '• Derinlik serbest yüzeyden ölçülür, plakanın üst kenarından değil.',
      '• Alan çarpı ağırlık merkezindeki basınç da doğrudur (F = ρg·ȳ·A) ama basınç merkezi ağırlık merkezi DEĞİLDİR.',
      '• ½ çarpanını, ρg\'yi ya da cm → m dönüşümünü unutmak.',
      '• Atmosfer basıncı iki yüzde birbirini götürür; ölçü basıncı kullanılır.',
      '',
      'KÜÇÜK ÖRNEK',
      'Yüzeye değen, 2 m genişliğinde, 3 m yüksekliğinde dikdörtgen bir kapak: F = ρg·2·(3² − 0)/2 = 9ρg ≈ 88.29 kN.',
      '',
      'MÜHENDİSLİKTE',
      'Baraj cidarları ve kapakları, gemi gövdesi, tank ve vana tasarımı.',
      '',
      'GRAFİK',
      'Plaka önden görülür; mavi bölge su, sol taraftaki üçgen p = ρ·g·y basınç dağılımıdır. Turuncu şerit kaydırıcıdaki derinliktir; turuncu açık bölge o derinliğe kadar olan kuvveti verir. Altın nokta basınç merkezidir. 3B düğmesi tankı ve basınç oklarını gösterir.',
    ].join('\n'), [
      'HYDROSTATIC PRESSURE',
      'In a fluid at rest the pressure at depth y below the free surface is p = ρ·g·y (ρ density, g = 9.81 m/s²). Pressure grows linearly with depth and acts normal to the plate. For water ρ = 1000 kg/m³, so ρg = 9810 N/m³.',
      '',
      'THE FORCE INTEGRAL',
      'The pressure is not the same everywhere on the plate, so we cut the plate into horizontal strips. A strip at depth y of thickness dy has area w(y)·dy and pressure about ρ·g·y:',
      '  dF = ρ·g·y·w(y) dy',
      '  F = ρ·g ∫ₐᵇ y·w(y) dy',
      'y: depth measured down from the free surface; a and b: depths of the top and bottom edges of the plate; w(y): width of the plate at that depth.',
      '',
      'METHOD',
      '1. Take the y axis pointing down from the surface and sketch a typical strip.',
      '2. Write w(y) from the shape of the plate (similar triangles or the circle equation).',
      '3. Evaluate F = ρg ∫ₐᵇ y·w(y) dy; leave the result in terms of ρg first.',
      '4. Convert to N or kN with ρg = 9810 N/m³ and check the units.',
      '',
      'RECTANGULAR PLATE',
      'w(y) equals the width and is constant: F = ρg·width·(b² − a²)/2. If the top edge is at the surface (a = 0), F = ½·ρg·width·b².',
      '',
      'TRIANGLE (APEX DOWN)',
      'Base on top (width c), apex below: the width decreases with depth; similar triangles give w(y) = c·(b − y)/(b − a).',
      '',
      'TRIANGLE (APEX UP)',
      'Apex on top, base below: the width increases with depth, w(y) = c·(y − a)/(b − a).',
      '',
      'TRAPEZOID PLATE',
      'If the top and bottom edges differ, w(y) is linear: w(a) = top edge, w(b) = bottom edge, so w(y) = top + (bottom − top)·(y − a)/(b − a).',
      '',
      'SEMICIRCLE PLATE',
      'Diameter on top, radius R: with u = y − a we get w = 2√(R² − u²). The two integrals needed are ∫₀ᴿ 2√(R² − u²) du = πR²/2 and ∫₀ᴿ 2u√(R² − u²) du = 2R³/3, so F = ρg·(a·πR²/2 + 2R³/3).',
      '',
      'CENTRE OF PRESSURE',
      'The depth at which the resultant acts is y_cp = ∫y²·w dy / ∫y·w dy; it lies below the centroid. For a rectangle whose top edge is at the surface, y_cp = 2b/3.',
      '',
      'PITFALLS',
      '• Depth is measured from the free surface, not from the top edge of the plate.',
      '• Area times the pressure at the centroid is also correct (F = ρg·ȳ·A) but the centre of pressure is NOT the centroid.',
      '• Forgetting the factor ½, forgetting ρg or the cm → m conversion.',
      '• Atmospheric pressure cancels on the two faces; use gauge pressure.',
      '',
      'SMALL EXAMPLE',
      'A rectangular gate 2 m wide and 3 m high touching the surface: F = ρg·2·(3² − 0)/2 = 9ρg ≈ 88.29 kN.',
      '',
      'IN ENGINEERING',
      'Dam walls and gates, ship hulls, tank and valve design.',
      '',
      'GRAPH',
      'The plate is seen from the front; the blue area is the water, the triangle on the left is the pressure distribution p = ρ·g·y. The orange strip is the depth of the slider; the light orange part gives the force down to that depth. The gold dot is the centre of pressure. The 3D button shows the tank and the pressure arrows.',
    ].join('\n')),
    problemStatement: statement,
    createProblem,
    solveSteps: steps,
    draw,
    buildControls,
    view3d: { build: fluid3d, dist: 9 },
    links: [
      { match: /^(KUVVET İNTEGRALİ|THE FORCE INTEGRAL)$/, make: ofKind([0, 1, 2, 3, 4]) },
      { match: /^(DİKDÖRTGEN PLAKA|RECTANGULAR PLATE)$/, make: ofKind([0]) },
      { match: /^(ÜÇGEN PLAKA \(TEPE AŞAĞIDA\)|TRIANGLE \(APEX DOWN\))$/, make: ofKind([1]) },
      { match: /^(ÜÇGEN PLAKA \(TEPE YUKARIDA\)|TRIANGLE \(APEX UP\))$/, make: ofKind([2]) },
      { match: /^(YAMUK PLAKA|TRAPEZOID PLATE)$/, make: ofKind([3]) },
      { match: /^(YARIM DAİRE PLAKA|SEMICIRCLE PLATE)$/, make: ofKind([4]) },
      { match: /^(BASINÇ MERKEZİ|CENTRE OF PRESSURE)$/, make: ofKind([0, 1, 2, 3]) },
    ],
    challenge: {
      title: ['🎯 Önce kuvveti tahmin edelim', '🎯 Let\'s predict the force first'],
      prompt: (p) => plateText(p.reg) + ' ' + tx('Plakanın bir yüzüne etkiyen toplam hidrostatik kuvvet kaç kN\'dur (ρ = 1000 kg/m³, g = 9.81 m/s²)? 2 ondalık basamakla yazalım.', 'What is the total hydrostatic force on one face of the plate in kN (ρ = 1000 kg/m³, g = 9.81 m/s²)? Let\'s type it to 2 decimals.'),
      target: (p) => forcekN(p.reg),
      tol: (p) => Math.max(0.3, 0.005 * forcekN(p.reg)),
      hint: (p, g) => { const t = forcekN(p.reg); return tx(g > t ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > t ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.') + ' ' + tx('F = ρg ∫ y·w(y) dy; derinlik yüzeyden ölçülür.', 'F = ρg ∫ y·w(y) dy; depth is measured from the surface.'); },
    },
    _test: { S, mom, numMom, forcekN, ycp, edge, hw, exact },
  });

  // ---- quiz generators ----
  const T = () => tx('Akışkan Kuvveti', 'Fluid Force');
  const fx = (d) => (v) => neg(v.toFixed(d));
  // wr: [[value, note], ...]; the correct value is checked against an independent value `chk`
  function numQ(text, correct, chk, wr, sol, rng, f, unit) {
    if (!(Math.abs(correct - chk) <= 1e-6 * Math.max(1, Math.abs(chk)))) throw new Error('fluid quiz: ' + correct + ' vs ' + chk);
    const u = unit ? ' ' + unit : '', cs = f(correct) + u, pairs = [];
    wr.forEach(([v, n]) => { const sv = f(v) + u; if (Number.isFinite(v) && sv !== cs && !pairs.some((q) => q[0] === sv)) pairs.push([sv, n]); });
    [1.1, 0.9, 1.25, 0.75, 2, 0.5].forEach((m) => { const sv = f(correct * m) + u; if (pairs.length < 3 && sv !== cs && !pairs.some((q) => q[0] === sv)) pairs.push([sv, '']); });
    return makeQuestion(T(), text, cs, pairs.map((q) => q[0]), sol, rng, pairs.map((q) => q[1]));
  }
  const rectQ = (rng) => {
    const a = rng.nextInt(2, 7), d1 = rng.nextInt(0, 4), H = rng.nextInt(2, 5), b = d1 + H, top = d1 === 0 ? tx('üst kenarı yüzeyle aynı seviyede', 'its top edge level with the surface') : tx(`üst kenarı yüzeyin ${d1} m altında`, `its top edge ${d1} m below the surface`);
    const F = RG * a * (b * b - d1 * d1) / 2 / 1000, s = lin(0, a, a, d1, H);
    return numQ(tx(`Genişliği ${a} m, yüksekliği ${H} m olan dikdörtgen bir kapak suda dikey durmaktadır (${top}; ρ = 1000 kg/m³, g = 9.81 m/s²). Kapağın bir yüzüne etkiyen hidrostatik kuvvet kaç kN'dur?`,
      `A rectangular gate ${a} m wide and ${H} m high stands vertically in water (${top}; ρ = 1000 kg/m³, g = 9.81 m/s²). What is the hydrostatic force on one face of the gate in kN?`), F, forcekN(s),
    [[RG * b * a * H / 1000, tx('Tüm plakaya alt kenardaki basınç uygulanmış.', 'The pressure at the bottom edge was applied to the whole plate.')],
      [RG * a * (b * b - d1 * d1) / 1000, tx('∫ y dy = y²/2 olduğundan ½ çarpanı unutulmuş.', 'The factor ½ of ∫ y dy = y²/2 was forgotten.')],
      [RG * (H / 2) * a * H / 1000, tx('Derinlik plakanın üstünden ölçülmüş (d₁ unutulmuş).', 'Depth was measured from the top of the plate (d₁ forgotten).')]],
    [tx(`F = ρg ∫ y·w dy = ρg·${a}·(${b}² − ${d1}²)/2`, `F = ρg ∫ y·w dy = ρg·${a}·(${b}² − ${d1}²)/2`), tx(`F = 9810·${N2(a * (b * b - d1 * d1) / 2)} N ≈ ${N2(F)} kN`, `F = 9810·${N2(a * (b * b - d1 * d1) / 2)} N ≈ ${N2(F)} kN`)], rng, fx(2), 'kN');
  };
  rectQ.level = 1;
  const cpQ = (rng) => {
    const H = rng.pick([3, 6, 9]), a = rng.nextInt(2, 6), s = lin(0, a, a, 0, H);
    return numQ(tx(`Genişliği ${a} m, yüksekliği ${H} m olan dikdörtgen bir kapağın üst kenarı serbest yüzeydedir. Bileşke basınç kuvvetinin etki ettiği derinlik (basınç merkezi) kaç m'dir?`, `The top edge of a rectangular gate ${a} m wide and ${H} m high is at the free surface. At what depth (centre of pressure) does the resultant pressure force act?`),
      2 * H / 3, ycp(s), [[H / 2, tx('Ağırlık merkezi derinliği ile karıştırılmış.', 'Confused with the depth of the centroid.')], [H, tx('Kuvvet en alt kenara yerleştirilmiş.', 'The force was placed at the bottom edge.')], [3 * H / 4, tx('Üçgen basınç dağılımı için yanlış oran (3/4).', 'Wrong ratio (3/4) for the triangular pressure distribution.')]],
      [tx(`y_cp = ∫y²·${a} dy / ∫y·${a} dy = (H³/3)/(H²/2) = 2H/3`, `y_cp = ∫y²·${a} dy / ∫y·${a} dy = (H³/3)/(H²/2) = 2H/3`), tx(`y_cp = 2·${H}/3 = ${2 * H / 3} m`, `y_cp = 2·${H}/3 = ${2 * H / 3} m`)], rng, fx(2), 'm');
  };
  cpQ.level = 1;
  const triDownQ = (rng) => {
    const a = rng.pick([2, 3, 4, 6]), H = rng.pick([2, 3, 4, 6]), s = lin(1, a, 0, 0, H), F = RG * a * H * H / 6 / 1000;
    return numQ(tx(`Tabanı ${a} m ve yüksekliği ${H} m olan üçgen bir plaka, tabanı serbest yüzeyde ve tepesi aşağıda olacak biçimde suda dikey durmaktadır (ρ = 1000 kg/m³, g = 9.81 m/s²). Bir yüzüne etkiyen hidrostatik kuvvet kaç kN'dur?`,
      `A triangular plate with base ${a} m and height ${H} m stands vertically in water with its base at the free surface and its apex down (ρ = 1000 kg/m³, g = 9.81 m/s²). What is the hydrostatic force on one face in kN?`), F, forcekN(s),
    [[RG * a * H * H / 2 / 1000, tx('Üçgen dikdörtgen gibi alınmış (w = taban).', 'The triangle was treated as a rectangle (w = base).')], [RG * a * H * H / 3 / 1000, tx('Tepe yukarıda olan üçgenin sonucu.', 'The result of the apex-up triangle.')], [RG * a * H * H / 4 / 1000, tx('Alan × derinlik H/2 alınmış (ağırlık merkezi H/3 olmalı).', 'Area × depth H/2 was used (the centroid is at H/3).')]],
    [tx(`w(y) = ${a}(${H} − y)/${H};  F = ρg ∫₀^${H} y·w dy = ρg·${a}·${H}²/6`, `w(y) = ${a}(${H} − y)/${H};  F = ρg ∫₀^${H} y·w dy = ρg·${a}·${H}²/6`), tx(`F ≈ ${N2(F)} kN`, `F ≈ ${N2(F)} kN`)], rng, fx(2), 'kN');
  };
  triDownQ.level = 2;
  const trapQ = (rng) => {
    const a = rng.pick([2, 3, 4]), b = a + rng.pick([2, 4]), H = rng.pick([2, 3, 4]), s = lin(3, a, b, 0, H), F = RG * (a * H * H / 2 + (b - a) * H * H / 3) / 1000;
    return numQ(tx(`Üst kenarı ${a} m, alt kenarı ${b} m, yüksekliği ${H} m olan ikizkenar yamuk bir plakanın üst kenarı serbest yüzeydedir (ρ = 1000 kg/m³, g = 9.81 m/s²). Plakaya etkiyen hidrostatik kuvvet kaç kN'dur?`,
      `The top edge of an isosceles trapezoidal plate (top edge ${a} m, bottom edge ${b} m, height ${H} m) is at the free surface (ρ = 1000 kg/m³, g = 9.81 m/s²). What is the hydrostatic force on the plate in kN?`), F, forcekN(s),
    [[RG * ((a + b) / 2) * H * H / 2 / 1000, tx('Ortalama genişlik sabit alınmış (dikdörtgen gibi).', 'The average width was treated as constant (like a rectangle).')], [RG * b * H * H / 2 / 1000, tx('Alt kenar genişliği tüm plaka için kullanılmış.', 'The bottom width was used for the whole plate.')], [RG * ((a + b) / 2) * H * H / 4 / 1000, tx('Alan × H/2 alınmış (merkez derinliği yanlış).', 'Area × H/2 was used (wrong centroid depth).')]],
    [tx(`w(y) = ${a} + ${fmt2((b - a) / H)}·y;  F = ρg ∫₀^${H} y·w dy = ρg(${a}·${H}²/2 + ${b - a}·${H}²/3)`, `w(y) = ${a} + ${fmt2((b - a) / H)}·y;  F = ρg ∫₀^${H} y·w dy = ρg(${a}·${H}²/2 + ${b - a}·${H}²/3)`), tx(`F ≈ ${N2(F)} kN`, `F ≈ ${N2(F)} kN`)], rng, fx(2), 'kN');
  };
  trapQ.level = 2;
  const triUpQ = (rng) => {
    const a = rng.pick([2, 3, 4, 6]), H = rng.pick([2, 3, 6]), d1 = rng.nextInt(1, 4), s = lin(2, 0, a, d1, H), F = RG * (a * H / 2) * (d1 + 2 * H / 3) / 1000;
    return numQ(tx(`Tabanı ${a} m, yüksekliği ${H} m olan üçgen bir plaka tepesi yukarıda olacak biçimde suda dikey durmaktadır; tepe noktası serbest yüzeyin ${d1} m altındadır (ρ = 1000 kg/m³, g = 9.81 m/s²). Bir yüzüne etkiyen hidrostatik kuvvet kaç kN'dur?`,
      `A triangular plate with base ${a} m and height ${H} m stands vertically in water with its apex up; the apex is ${d1} m below the free surface (ρ = 1000 kg/m³, g = 9.81 m/s²). What is the hydrostatic force on one face in kN?`), F, forcekN(s),
    [[RG * (a * H / 2) * (d1 + H / 3) / 1000, tx('Ağırlık merkezi tepeden H/3 aşağıda alınmış (2H/3 olmalı).', 'The centroid was taken H/3 below the apex (it is 2H/3).')], [RG * a * (Math.pow(d1 + H, 2) - d1 * d1) / 2 / 1000, tx('Üçgen dikdörtgen gibi alınmış.', 'The triangle was treated as a rectangle.')], [RG * a * H * H / 3 / 1000, tx('Derinlik plakanın tepesinden ölçülmüş (d₁ unutulmuş).', 'Depth was measured from the apex of the plate (d₁ forgotten).')]],
    [tx(`F = ρg·ȳ·A,  A = ${a}·${H}/2 = ${a * H / 2} m²,  ȳ = ${d1} + 2·${H}/3`, `F = ρg·ȳ·A,  A = ${a}·${H}/2 = ${a * H / 2} m²,  ȳ = ${d1} + 2·${H}/3`), tx(`F ≈ ${N2(F)} kN`, `F ≈ ${N2(F)} kN`)], rng, fx(2), 'kN');
  };
  triUpQ.level = 3;
  const semiQ = (rng) => {
    const R = rng.pick([1, 2, 3]), s = { k: 4, R, d1: 0, H: R }, F = RG * 2 * R ** 3 / 3 / 1000;
    return numQ(tx(`Yarıçapı ${R} m olan yarım daire biçimli bir plaka, çapı serbest yüzeyde olacak biçimde suda dikey durmaktadır (ρ = 1000 kg/m³, g = 9.81 m/s²). Bir yüzüne etkiyen hidrostatik kuvvet kaç kN'dur?`,
      `A semicircular plate of radius ${R} m stands vertically in water with its diameter at the free surface (ρ = 1000 kg/m³, g = 9.81 m/s²). What is the hydrostatic force on one face in kN?`), F, forcekN(s),
    [[RG * PI * R ** 3 / 4 / 1000, tx('Ağırlık merkezi R/2 derinlikte alınmış (4R/3π olmalı).', 'The centroid was taken at depth R/2 (it is 4R/3π).')], [RG * PI * R ** 3 / 2 / 1000, tx('Tüm alana alt kenardaki basınç uygulanmış.', 'The pressure at the bottom was applied to the whole area.')], [RG * 4 * R ** 3 / 3 / 1000, tx('İntegralde 2 yerine 4 çarpanı yazılmış.', 'A factor 4 was written in front of the integral instead of 2.')]],
    [tx(`F = ρg ∫₀^${R} u·2√(${R * R} − u²) du = ρg·(2/3)·${R}³`, `F = ρg ∫₀^${R} u·2√(${R * R} − u²) du = ρg·(2/3)·${R}³`), tx(`F = 9810·${N2(2 * R ** 3 / 3)} N ≈ ${N2(F)} kN`, `F = 9810·${N2(2 * R ** 3 / 3)} N ≈ ${N2(F)} kN`)], rng, fx(2), 'kN');
  };
  semiQ.level = 3;
  Calc2Quiz.main.push(rectQ);
  Calc2Quiz.extra.push(cpQ, triDownQ, trapQ, triUpQ, semiQ);
})();

(function () {
  const K = Calc2, tx = K.tx, { simpson, N2, frac, neg, Iexp } = K;
  const PI = Math.PI;
  const d4 = (v) => neg(v.toFixed(4));
  const I = (u, v) => (/[−.]/.test(String(u) + String(v)) ? `∫_{${u}}^{${v}}` : Iexp(u, v));
  // standard normal cdf by its power series (independent of the Simpson areas)
  const Phi = (x) => { let t = x, s = x; for (let n = 1; n < 400; n++) { t *= x * x / (2 * n + 1); s += t; if (Math.abs(t) < 1e-18) break; } return 0.5 + s * Math.exp(-x * x / 2) / Math.sqrt(2 * PI); };
  // scenarios: k 0 f = k·x, 1 f = k·x(b − x) (both on [0, b]), 2 uniform on [a, b], 3 exponential (lam), 4 standard normal; c, d: the interval of the question
  const S = [
    { k: 0, b: 2, c: 0.5, d: 1.5 }, { k: 0, b: 3, c: 1, d: 2 }, { k: 0, b: 4, c: 1, d: 3 }, { k: 0, b: 5, c: 2, d: 4 },
    { k: 1, b: 2, c: 0.5, d: 1.5 }, { k: 1, b: 3, c: 1, d: 2 }, { k: 1, b: 4, c: 1, d: 3 }, { k: 1, b: 6, c: 2, d: 4 },
    { k: 2, a: 0, b: 4, c: 1, d: 3 }, { k: 2, a: 1, b: 5, c: 2, d: 4 }, { k: 2, a: 2, b: 8, c: 3, d: 6 }, { k: 2, a: -1, b: 3, c: 0, d: 2 },
    { k: 3, lam: 0.5, c: 1, d: 3 }, { k: 3, lam: 1, c: 1, d: 2 }, { k: 3, lam: 2, c: 0.5, d: 1.5 }, { k: 3, lam: 0.25, c: 2, d: 6 },
    { k: 4, c: -1, d: 1 }, { k: 4, c: -2, d: 2 }, { k: 4, c: -3, d: 3 }, { k: 4, c: 0, d: 1.5 },
  ];
  const KIND = () => [tx('Polinom: k·x', 'Polynomial: k·x'), tx('Polinom: k·x(b − x)', 'Polynomial: k·x(b − x)'), tx('Düzgün (uniform)', 'Uniform'), tx('Üstel', 'Exponential'), tx('Standart normal (sayısal)', 'Standard normal (numeric)')];
  const name = (r) => [`f = k·x, [0, ${r.b}]`, `f = k·x(${r.b} − x), [0, ${r.b}]`, `${tx('Düzgün', 'Uniform')} [${neg(r.a)}, ${r.b}]`, `${tx('Üstel', 'Exponential')} λ = ${r.lam}`, `${tx('Standart normal', 'Standard normal')}`][r.k] + `, P(${neg(r.c)} ≤ X ≤ ${r.d})`;
  const dmax = (r) => (r.k === 3 ? Math.min(20, Math.round(10 / r.lam) / 2) : r.k === 4 ? 4 : r.b);
  // distribution of a scenario: density f, cdf F, support [lo, hi], mean, median, constant kk, peak height
  function pdf(r) {
    if (r.k === 0) { const b = r.b, kk = 2 / (b * b); return { kk, lo: 0, hi: b, f: (x) => (x >= 0 && x <= b ? kk * x : 0), F: (x) => (x <= 0 ? 0 : x >= b ? 1 : x * x / (b * b)), mean: 2 * b / 3, med: b / Math.SQRT2, top: kk * b }; }
    if (r.k === 1) { const b = r.b, kk = 6 / (b ** 3); return { kk, lo: 0, hi: b, f: (x) => (x >= 0 && x <= b ? kk * x * (b - x) : 0), F: (x) => (x <= 0 ? 0 : x >= b ? 1 : 3 * x * x / (b * b) - 2 * x ** 3 / (b ** 3)), mean: b / 2, med: b / 2, top: kk * b * b / 4 }; }
    if (r.k === 2) { const a = r.a, b = r.b, kk = 1 / (b - a); return { kk, lo: a, hi: b, f: (x) => (x >= a && x <= b ? kk : 0), F: (x) => (x <= a ? 0 : x >= b ? 1 : (x - a) * kk), mean: (a + b) / 2, med: (a + b) / 2, top: kk }; }
    if (r.k === 3) { const l = r.lam; return { kk: l, lo: 0, hi: Infinity, f: (x) => (x >= 0 ? l * Math.exp(-l * x) : 0), F: (x) => (x <= 0 ? 0 : 1 - Math.exp(-l * x)), mean: 1 / l, med: Math.LN2 / l, top: l }; }
    const kk = 1 / Math.sqrt(2 * PI);
    return { kk, lo: -Infinity, hi: Infinity, f: (x) => kk * Math.exp(-x * x / 2), F: Phi, mean: 0, med: 0, top: kk };
  }
  const span = (r, q) => (r.k === 3 ? [0, 60 / r.lam] : r.k === 4 ? [-10, 10] : [q.lo, q.hi]);
  const Pex = (r, c, d) => { const q = pdf(r); return q.F(d) - q.F(c); };
  const Pnum = (r, c, d) => { const q = pdf(r); return simpson(q.f, Math.max(c, q.lo), Math.min(d, q.hi), r.k === 4 ? 200 : 4000); };
  const meanNum = (r) => { const q = pdf(r), [a, b] = span(r, q); return simpson((x) => x * q.f(x), a, b); };
  const totalNum = (r) => { const q = pdf(r), [a, b] = span(r, q); return simpson(q.f, a, b); };
  const fix = (p) => { p.d = Math.min(Math.max(p.d, p.reg.c + 0.5), dmax(p.reg)); };
  const ctl = { reg: null, kind: null, slider: null, opts: null };

  function check(r, d) {
    const q = pdf(r), near = (a, b, t) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
    if (!near(totalNum(r), 1, 1e-6)) throw new Error('probDensity: total probability ' + totalNum(r));
    if (!near(Pex(r, r.c, d), Pnum(r, r.c, d), 1e-7)) throw new Error('probDensity: P ' + Pex(r, r.c, d) + ' != ' + Pnum(r, r.c, d));
    if (!near(meanNum(r), q.mean, 1e-5)) throw new Error('probDensity: mean ' + q.mean + ' != ' + meanNum(r));
    if (!near(q.F(q.med), 0.5, 1e-9)) throw new Error('probDensity: median');
  }
  // the slider range (c + 0.5 ... largest d) depends on the scenario
  function setRange(p) {
    fix(p);
    const sl = ctl.slider; if (!sl) return;
    const lo = p.reg.c + 0.5, hi = dmax(p.reg);
    ctl.opts.min = lo; ctl.opts.max = hi; sl.min = lo; sl.max = hi;
    sl.valueLabel.textContent = fmt2(p.d); sl.input.value = String(Math.round(1000 * (p.d - lo) / (hi - lo)));
  }
  function sync(p) { setRange(p); if (ctl.reg) ctl.reg.refreshFromModel(); if (ctl.kind) ctl.kind.refreshFromModel(); }
  function createProblem(rng) {
    const ri = rng.nextInt(0, S.length), r = S[ri], p = { mode: r.k, ri, reg: r, d: r.d };
    fix(p); check(r, p.d); sync(p);
    return p;
  }
  const fromKinds = (ks) => (rng) => {
    const idx = S.map((r, i) => i).filter((i) => ks.includes(S[i].k)), ri = idx[rng.nextInt(0, idx.length)];
    const p = { mode: S[ri].k, ri, reg: S[ri], d: S[ri].d }; fix(p); return p;
  };

  const funcText = (r) => [`f(x) = k·x  (0 ≤ x ≤ ${r.b})`, `f(x) = k·x(${r.b} − x)  (0 ≤ x ≤ ${r.b})`, `f(x) = k  (${neg(r.a)} ≤ x ≤ ${r.b})`, `f(x) = k·e^(−${r.lam}x)  (x ≥ 0)`, 'f(x) = k·e^(−x²/2)  (−∞ < x < ∞)'][r.k];
  function statement(p) {
    const r = p.reg, c = neg(r.c), d = neg(p.d), fx = funcText(r), tail = r.k === 3 ? `, P(X > ${c})` : '';
    return tx(`X sürekli rastgele değişkeninin yoğunluk fonksiyonu ${fx} biçimindedir (başka yerde 0). Önce k sabitini bulalım; sonra P(${c} ≤ X ≤ ${d})${tail}, beklenen değer E[X] ve medyanı bulalım${r.k === 4 ? ' (kapalı biçim yoktur: Simpson kuralını kullanalım, sonuçları 4 ondalık basamakla verelim)' : ''}.`,
      `The probability density function of the continuous random variable X is ${fx} (0 elsewhere). Let's find the constant k first, then P(${c} ≤ X ≤ ${d})${tail}, the mean E[X] and the median${r.k === 4 ? ' (there is no closed form: use Simpson\'s rule and give the results to 4 decimals)' : ''}.`);
  }
  const pf = (v) => `${frac(v)} ≈ ${d4(v)}`;

  function steps(p) {
    const r = p.reg, q = pdf(r), c = r.c, d = p.d, cs = neg(N2(c)), ds = neg(N2(d)), P = Pex(r, c, d), out = [], b = r.b;
    const numLine = tx(`Simpson kuralıyla P ≈ ${d4(Pnum(r, c, d))} ✓,  ∫f dx ≈ ${d4(totalNum(r))} ✓,  E[X] ≈ ${d4(meanNum(r))} ✓`, `Simpson's rule gives P ≈ ${d4(Pnum(r, c, d))} ✓,  ∫f dx ≈ ${d4(totalNum(r))} ✓,  E[X] ≈ ${d4(meanNum(r))} ✓`);
    const T = (a, e) => out.push(tx(a, e));
    if (r.k === 0) {
      T(`── 1) k sabiti ──\n∫f dx = 1 olmalı:\n${I(0, b)} k·x dx = k·${b}²/2 = ${b * b / 2}k = 1  ⇒  k = ${frac(q.kk)}`, `── 1) The constant k ──\nWe need ∫f dx = 1:\n${I(0, b)} k·x dx = k·${b}²/2 = ${b * b / 2}k = 1  ⇒  k = ${frac(q.kk)}`);
      T(`── 2) Birikimli dağılım ──\nF(x) = ∫₀ˣ f(t) dt = x²/${b * b}  (0 ≤ x ≤ ${b})`, `── 2) The cumulative distribution ──\nF(x) = ∫₀ˣ f(t) dt = x²/${b * b}  (0 ≤ x ≤ ${b})`);
      T(`── 3) Olasılık ──\nP(${cs} ≤ X ≤ ${ds}) = F(${ds}) − F(${cs}) = ${frac(q.F(d))} − ${frac(q.F(c))} = ${pf(P)}`, `── 3) The probability ──\nP(${cs} ≤ X ≤ ${ds}) = F(${ds}) − F(${cs}) = ${frac(q.F(d))} − ${frac(q.F(c))} = ${pf(P)}`);
      T(`── 4) Beklenen değer ──\nE[X] = ${I(0, b)} x·f(x) dx = k·${b}³/3 = ${frac(q.kk)}·${b ** 3}/3 = ${pf(q.mean)}`, `── 4) The mean ──\nE[X] = ${I(0, b)} x·f(x) dx = k·${b}³/3 = ${frac(q.kk)}·${b ** 3}/3 = ${pf(q.mean)}`);
      T(`── 5) Medyan ──\nF(m) = 1/2:  m²/${b * b} = 1/2  ⇒  m = ${b}/√2 ≈ ${d4(q.med)}`, `── 5) The median ──\nF(m) = 1/2:  m²/${b * b} = 1/2  ⇒  m = ${b}/√2 ≈ ${d4(q.med)}`);
    } else if (r.k === 1) {
      T(`── 1) k sabiti ──\n${I(0, b)} k·x(${b} − x) dx = k[${b}x²/2 − x³/3] = k·${b}³/6 = ${frac(b ** 3 / 6)}k = 1  ⇒  k = ${frac(q.kk)}`, `── 1) The constant k ──\n${I(0, b)} k·x(${b} − x) dx = k[${b}x²/2 − x³/3] = k·${b}³/6 = ${frac(b ** 3 / 6)}k = 1  ⇒  k = ${frac(q.kk)}`);
      T(`── 2) Birikimli dağılım ──\nF(x) = k(${b}x²/2 − x³/3) = (${frac(3 / (b * b))})x² − (${frac(2 / b ** 3)})x³  (0 ≤ x ≤ ${b})`, `── 2) The cumulative distribution ──\nF(x) = k(${b}x²/2 − x³/3) = (${frac(3 / (b * b))})x² − (${frac(2 / b ** 3)})x³  (0 ≤ x ≤ ${b})`);
      T(`── 3) Olasılık ──\nP(${cs} ≤ X ≤ ${ds}) = F(${ds}) − F(${cs}) = ${frac(q.F(d))} − ${frac(q.F(c))} = ${pf(P)}`, `── 3) The probability ──\nP(${cs} ≤ X ≤ ${ds}) = F(${ds}) − F(${cs}) = ${frac(q.F(d))} − ${frac(q.F(c))} = ${pf(P)}`);
      T(`── 4) Beklenen değer ──\nE[X] = k ${I(0, b)} x²(${b} − x) dx = k·${b}⁴/12 = ${frac(q.kk)}·${b ** 4}/12 = ${pf(q.mean)}  (f, x = ${b}/2 etrafında simetrik)`, `── 4) The mean ──\nE[X] = k ${I(0, b)} x²(${b} − x) dx = k·${b}⁴/12 = ${frac(q.kk)}·${b ** 4}/12 = ${pf(q.mean)}  (f is symmetric about x = ${b}/2)`);
      T(`── 5) Medyan ──\nSimetriden m = ${b}/2 = ${N2(b / 2)}; kontrol: F(${N2(b / 2)}) = ${frac(q.F(b / 2))} ✓`, `── 5) The median ──\nBy symmetry m = ${b}/2 = ${N2(b / 2)}; check: F(${N2(b / 2)}) = ${frac(q.F(b / 2))} ✓`);
    } else if (r.k === 2) {
      const a = r.a, w = b - a, as = neg(a);
      T(`── 1) k sabiti ──\n${I(as, b)} k dx = k·(${b} − (${as})) = ${w}k = 1  ⇒  k = ${frac(q.kk)}`, `── 1) The constant k ──\n${I(as, b)} k dx = k·(${b} − (${as})) = ${w}k = 1  ⇒  k = ${frac(q.kk)}`);
      T(`── 2) Birikimli dağılım ──\nF(x) = (x − (${as}))/${w}  (${as} ≤ x ≤ ${b})`, `── 2) The cumulative distribution ──\nF(x) = (x − (${as}))/${w}  (${as} ≤ x ≤ ${b})`);
      T(`── 3) Olasılık ──\nP(${cs} ≤ X ≤ ${ds}) = (${ds} − (${cs}))/${w} = ${pf(P)}  (dikdörtgenin alanı)`, `── 3) The probability ──\nP(${cs} ≤ X ≤ ${ds}) = (${ds} − (${cs}))/${w} = ${pf(P)}  (area of a rectangle)`);
      T(`── 4) Beklenen değer ──\nE[X] = ${I(as, b)} x/${w} dx = (${b}² − (${as})²)/(2·${w}) = (${as} + ${b})/2 = ${pf(q.mean)}`, `── 4) The mean ──\nE[X] = ${I(as, b)} x/${w} dx = (${b}² − (${as})²)/(2·${w}) = (${as} + ${b})/2 = ${pf(q.mean)}`);
      T(`── 5) Medyan ──\nF(m) = 1/2 ⇒ m = (${as} + ${b})/2 = ${pf(q.med)}  (f simetrik)`, `── 5) The median ──\nF(m) = 1/2 ⇒ m = (${as} + ${b})/2 = ${pf(q.med)}  (f is symmetric)`);
    } else if (r.k === 3) {
      const l = r.lam;
      T(`── 1) k sabiti ──\n∫₀^∞ k·e^(−${l}x) dx = k/${l} = 1  ⇒  k = ${l} = λ`, `── 1) The constant k ──\n∫₀^∞ k·e^(−${l}x) dx = k/${l} = 1  ⇒  k = ${l} = λ`);
      T(`── 2) Birikimli dağılım ──\nF(x) = 1 − e^(−${l}x)  (x ≥ 0)`, `── 2) The cumulative distribution ──\nF(x) = 1 − e^(−${l}x)  (x ≥ 0)`);
      T(`── 3) Olasılık ──\nP(${cs} ≤ X ≤ ${ds}) = e^(−${l}·${cs}) − e^(−${l}·${ds}) = ${d4(Math.exp(-l * c))} − ${d4(Math.exp(-l * d))} = ${d4(P)}\nP(X > ${cs}) = e^(−${l}·${cs}) = ${d4(Math.exp(-l * c))}`, `── 3) The probability ──\nP(${cs} ≤ X ≤ ${ds}) = e^(−${l}·${cs}) − e^(−${l}·${ds}) = ${d4(Math.exp(-l * c))} − ${d4(Math.exp(-l * d))} = ${d4(P)}\nP(X > ${cs}) = e^(−${l}·${cs}) = ${d4(Math.exp(-l * c))}`);
      T(`── 4) Beklenen değer ──\nE[X] = ∫₀^∞ x·λe^(−λx) dx = [−x e^(−λx)] + ∫₀^∞ e^(−λx) dx = 1/λ = ${pf(q.mean)}`, `── 4) The mean ──\nE[X] = ∫₀^∞ x·λe^(−λx) dx = [−x e^(−λx)] + ∫₀^∞ e^(−λx) dx = 1/λ = ${pf(q.mean)}`);
      T(`── 5) Medyan ──\n1 − e^(−${l}m) = 1/2  ⇒  m = ln 2/${l} ≈ ${d4(q.med)}  (ortalamadan küçük)`, `── 5) The median ──\n1 − e^(−${l}m) = 1/2  ⇒  m = ln 2/${l} ≈ ${d4(q.med)}  (smaller than the mean)`);
    } else {
      const area = d4(simpson((x) => Math.exp(-x * x / 2), -8, 8, 2000));
      T(`── 1) k sabiti (sayısal) ──\ne^(−x²/2) için elemanter bir ters türev yoktur. Simpson: ∫₋₈⁸ e^(−x²/2) dx ≈ ${area}\nk = 1/${area} ≈ ${d4(q.kk)}  (gerçekte k = 1/√(2π))`, `── 1) The constant k (numeric) ──\nThere is no elementary antiderivative of e^(−x²/2). Simpson: ∫₋₈⁸ e^(−x²/2) dx ≈ ${area}\nk = 1/${area} ≈ ${d4(q.kk)}  (in fact k = 1/√(2π))`);
      T(`── 2) Olasılık (Simpson) ──\nP(${cs} ≤ X ≤ ${ds}) = k ${I(cs, ds)} e^(−x²/2) dx\nn = 200 parça ile Simpson: ≈ ${d4(Pnum(r, c, d))}`, `── 2) The probability (Simpson) ──\nP(${cs} ≤ X ≤ ${ds}) = k ${I(cs, ds)} e^(−x²/2) dx\nSimpson with n = 200 pieces: ≈ ${d4(Pnum(r, c, d))}`);
      T('── 3) Beklenen değer ──\nx·e^(−x²/2) tek fonksiyondur ⇒ E[X] = 0.', '── 3) The mean ──\nx·e^(−x²/2) is an odd function ⇒ E[X] = 0.');
      T('── 4) Medyan ──\nf çift fonksiyon olduğundan alan x = 0\'da ikiye bölünür: F(0) = 1/2 ⇒ m = 0.', '── 4) The median ──\nf is even, so the area is halved at x = 0: F(0) = 1/2 ⇒ m = 0.');
      const z = [1, 2, 3].map((v) => d4(Pnum({ k: 4 }, -v, v)));
      T(`── 5) 68–95–99.7 kuralı ──\nP(|X| ≤ 1) ≈ ${z[0]},  P(|X| ≤ 2) ≈ ${z[1]},  P(|X| ≤ 3) ≈ ${z[2]}`, `── 5) The 68–95–99.7 rule ──\nP(|X| ≤ 1) ≈ ${z[0]},  P(|X| ≤ 2) ≈ ${z[1]},  P(|X| ≤ 3) ≈ ${z[2]}`);
    }
    const nc = out.length + 1;
    out.push(r.k === 4 ? tx(`── ${nc}) Sayısal kontrol ──\nBağımsız hesap (Φ için kuvvet serisi): P ≈ ${d4(P)} ✓`, `── ${nc}) Numerical check ──\nIndependent value (power series for Φ): P ≈ ${d4(P)} ✓`) : tx(`── ${nc}) Sayısal kontrol ──\n${numLine}`, `── ${nc}) Numerical check ──\n${numLine}`));
    return out;
  }

  function draw(c, p) {
    const r = p.reg, q = pdf(r), cc = r.c, d = p.d, ymax = q.top;
    let xlo, xhi;
    if (r.k <= 1) { xlo = -0.2 * r.b; xhi = 1.2 * r.b; }
    else if (r.k === 2) { xlo = r.a - 1; xhi = r.b + 1; }
    else if (r.k === 3) { xhi = Math.max(4 / r.lam, d + 0.5) * 1.05; xlo = -0.12 * xhi; }
    else { xlo = -4.2; xhi = 4.2; }
    c.setViewport(xlo, xhi, -0.15 * ymax, 1.3 * ymax);
    const a0 = Math.max(cc, q.lo), b0 = Math.min(d, q.hi);
    if (b0 > a0) c.addFilledArea({ evaluator: q.f, xMin: a0, xMax: b0, color: K.col(c, 'orange', 0.4), samples: 200 });
    c.addFunction({ evaluator: (x) => q.f(x), color: c.accent(), thickness: 3, label: 'f(x)' });
    c.addGuideLine({ axis: 'vertical', position: cc, color: c.orange(), label: `c = ${neg(N2(cc))}` });
    c.addGuideLine({ axis: 'vertical', position: d, color: c.orange(), label: `d = ${neg(N2(d))}` });
    c.addGuideLine({ axis: 'vertical', position: q.med, color: c.gray(), label: `m = ${neg(N2(q.med))}` });
    const mid = (a0 + b0) / 2;
    c.addMarker({ x: mid, y: q.f(mid) / 2, color: c.orange(), radius: 3, label: `P = ${d4(Pex(r, cc, d))}` });
    c.addMarker({ x: q.mean, y: q.f(q.mean), color: c.gold(), radius: 6, label: `μ = ${neg(N2(q.mean))}` });
  }

  function buildControls(rightCol, getProblem, h) {
    const lab = (t) => { const e = document.createElement('div'); e.className = 'we-slider-caption'; e.textContent = t; rightCol.appendChild(e); };
    lab(tx('Dağılım türü', 'Distribution type'));
    ctl.kind = h.addRadioGroup({ name: 'pdKind', options: KIND().map((l, i) => ({ label: l, value: i })), get: () => getProblem().mode,
      set: (v) => { const p = getProblem(); p.mode = Number(v); if (p.reg.k !== p.mode) { p.ri = S.findIndex((r) => r.k === p.mode); p.reg = S[p.ri]; p.d = p.reg.d; } sync(p); } });
    lab(tx('Yoğunluk / parametreler', 'Density / parameters'));
    ctl.reg = h.addSelect({ options: S.map((r, i) => ({ label: name(r), value: i })), get: () => getProblem().ri,
      set: (v) => { const p = getProblem(); p.ri = Number(v); p.reg = S[p.ri]; p.mode = p.reg.k; p.d = p.reg.d; sync(p); } });
    const p0 = getProblem();
    ctl.opts = { caption: tx('Üst sınır d', 'Upper bound d'), min: p0.reg.c + 0.5, max: dmax(p0.reg), step: 0.5, get: () => getProblem().d, set: (v) => { getProblem().d = v; } };
    ctl.slider = h.addSlider(ctl.opts);
  }

  const isK = (p) => p.reg.k <= 1;
  Topics.register('calc2', {
    id: 'probDensity',
    tabTitle: () => tx('Olasılık Yoğunluk Fonksiyonları', 'Probability Density Functions'),
    concept: () => tx([
      'OLASILIK YOĞUNLUK FONKSİYONU',
      'Sürekli bir rastgele değişken X için f(x), şu iki koşulu sağlıyorsa yoğunluk fonksiyonudur: f(x) ≥ 0 ve eksenin tamamı üzerinde ∫ f(x) dx = 1. Olasılık, f\'nin altında kalan alandır; tek bir noktanın olasılığı sıfırdır:',
      '  P(c ≤ X ≤ d) = ∫_c^d f(x) dx',
      '',
      'YÖNTEM',
      '1. ∫ f(x) dx = 1 koşulundan bilinmeyen k sabitini bul.',
      '2. Gerekirse birikimli dağılımı F(x) = ∫ f(t) dt (alt uçtan x\'e kadar) hesapla.',
      '3. P(c ≤ X ≤ d) = F(d) − F(c).',
      '4. Beklenen değer E[X] = ∫ x·f(x) dx; medyan: F(m) = 1/2.',
      '',
      'SABİTİN BULUNMASI',
      'Toplam alan 1 olmalıdır: f\'yi k ile birlikte integre edip sonucu 1\'e eşitleriz. Örnek: f = k·x, [0, 2] üzerinde 2k = 1, yani k = 1/2.',
      '',
      'OLASILIK HESABI',
      'P(c ≤ X ≤ d), grafikte c ile d arasındaki gölgeli alandır. F biliniyorsa yalnızca F(d) − F(c) hesaplanır.',
      '',
      'BEKLENEN DEĞER',
      'E[X] = ∫ x·f(x) dx, alanın "denge noktası"dır. Yoğunluk simetrikse simetri ekseni üzerindedir.',
      '',
      'MEDYAN VE BİRİKİMLİ DAĞILIM',
      'F(x) = P(X ≤ x). Medyan m, alanı ikiye bölen noktadır: F(m) = 1/2. Çarpık dağılımlarda ortalamadan farklıdır.',
      '',
      'POLİNOM YOĞUNLUK',
      '[0, b] üzerinde f = k·x ve f = k·x(b − x): integraller polinom olduğundan her şey tam hesaplanır (k = 2/b² ve k = 6/b³).',
      '',
      'DÜZGÜN DAĞILIM',
      '[a, b] üzerinde f = 1/(b − a) sabittir: P(c ≤ X ≤ d) = (d − c)/(b − a), E[X] = medyan = (a + b)/2.',
      '',
      'ÜSTEL DAĞILIM',
      'f = λ·e^(−λx), x ≥ 0: F(x) = 1 − e^(−λx), P(X > t) = e^(−λt), E[X] = 1/λ, medyan = ln 2/λ. Bekleme süresi ve ömür modellerinde kullanılır.',
      '',
      'STANDART NORMAL DAĞILIM',
      'f = k·e^(−x²/2), k = 1/√(2π) ≈ 0.3989. e^(−x²/2) için elemanter ters türev yoktur; alanlar yalnızca sayısal hesaplanır (Simpson). 68–95–99.7 kuralı: P(|X| ≤ 1) ≈ 0.6827, P(|X| ≤ 2) ≈ 0.9545, P(|X| ≤ 3) ≈ 0.9973.',
      '',
      'TUZAKLAR',
      '• Yoğunluk bir olasılık değildir: f(x) 1\'den büyük olabilir, alan 1 olmalıdır.',
      '• k\'yı bulmadan olasılık hesaplamak.',
      '• Üstel dağılımda üst sınırın ∞ olduğunu unutmak; P(X > t) için F(t)\'yi 1\'den çıkarırız.',
      '• Medyanı ortalamayla karıştırmak.',
      '',
      'MÜHENDİSLİKTE',
      'Arıza ve ömür analizi (üstel), ölçüm hataları (normal), tolerans ve güvenilirlik hesapları.',
      '',
      'GRAFİK',
      'Mavi eğri yoğunluk f; turuncu alan P(c ≤ X ≤ d) olasılığıdır. Altın nokta ortalama (μ), gri çizgi medyandır (m). Kaydırıcı d üst sınırını değiştirir.',
    ].join('\n'), [
      'PROBABILITY DENSITY FUNCTION',
      'For a continuous random variable X, f(x) is a density function if f(x) ≥ 0 and ∫ f(x) dx = 1 over the whole axis. A probability is the area under f; a single point has probability zero:',
      '  P(c ≤ X ≤ d) = ∫_c^d f(x) dx',
      '',
      'METHOD',
      '1. Find the unknown constant k from ∫ f(x) dx = 1.',
      '2. If needed compute the cumulative distribution F(x) = ∫ f(t) dt (from the lower end up to x).',
      '3. P(c ≤ X ≤ d) = F(d) − F(c).',
      '4. Mean E[X] = ∫ x·f(x) dx; median: F(m) = 1/2.',
      '',
      'FINDING THE CONSTANT',
      'The total area must be 1: integrate f together with k and set the result equal to 1. Example: f = k·x on [0, 2] gives 2k = 1, so k = 1/2.',
      '',
      'PROBABILITY OF AN INTERVAL',
      'P(c ≤ X ≤ d) is the shaded area between c and d. If F is known just compute F(d) − F(c).',
      '',
      'EXPECTED VALUE',
      'E[X] = ∫ x·f(x) dx is the "balance point" of the area. For a symmetric density it lies on the axis of symmetry.',
      '',
      'MEDIAN AND CDF',
      'F(x) = P(X ≤ x). The median m splits the area in two: F(m) = 1/2. For skewed distributions it differs from the mean.',
      '',
      'POLYNOMIAL DENSITIES',
      'f = k·x and f = k·x(b − x) on [0, b]: the integrals are polynomials so everything is exact (k = 2/b² and k = 6/b³).',
      '',
      'UNIFORM DISTRIBUTION',
      'On [a, b] the density f = 1/(b − a) is constant: P(c ≤ X ≤ d) = (d − c)/(b − a), E[X] = median = (a + b)/2.',
      '',
      'EXPONENTIAL DISTRIBUTION',
      'f = λ·e^(−λx), x ≥ 0: F(x) = 1 − e^(−λx), P(X > t) = e^(−λt), E[X] = 1/λ, median = ln 2/λ. Used for waiting times and lifetime models.',
      '',
      'STANDARD NORMAL DISTRIBUTION',
      'f = k·e^(−x²/2), k = 1/√(2π) ≈ 0.3989. e^(−x²/2) has no elementary antiderivative; areas are computed numerically only (Simpson). The 68–95–99.7 rule: P(|X| ≤ 1) ≈ 0.6827, P(|X| ≤ 2) ≈ 0.9545, P(|X| ≤ 3) ≈ 0.9973.',
      '',
      'PITFALLS',
      '• A density is not a probability: f(x) may exceed 1, the area must equal 1.',
      '• Computing probabilities before finding k.',
      '• Forgetting that the upper limit is ∞ for the exponential; for P(X > t) subtract F(t) from 1.',
      '• Confusing the median with the mean.',
      '',
      'IN ENGINEERING',
      'Failure and lifetime analysis (exponential), measurement errors (normal), tolerance and reliability calculations.',
      '',
      'GRAPH',
      'The blue curve is the density f; the orange area is the probability P(c ≤ X ≤ d). The gold dot is the mean (μ), the grey line is the median (m). The slider changes the upper bound d.',
    ].join('\n')),
    problemStatement: statement,
    createProblem,
    solveSteps: steps,
    draw,
    buildControls,
    links: [
      { match: /^(SABİTİN BULUNMASI|FINDING THE CONSTANT)$/, make: fromKinds([0, 1]) },
      { match: /^(OLASILIK HESABI|PROBABILITY OF AN INTERVAL)$/, make: fromKinds([0, 1, 2, 3, 4]) },
      { match: /^(BEKLENEN DEĞER|EXPECTED VALUE)$/, make: fromKinds([0, 1, 2, 3]) },
      { match: /^(MEDYAN VE BİRİKİMLİ DAĞILIM|MEDIAN AND CDF)$/, make: fromKinds([0, 1, 2, 3]) },
      { match: /^(POLİNOM YOĞUNLUK|POLYNOMIAL DENSITIES)$/, make: fromKinds([0, 1]) },
      { match: /^(DÜZGÜN DAĞILIM|UNIFORM DISTRIBUTION)$/, make: fromKinds([2]) },
      { match: /^(ÜSTEL DAĞILIM|EXPONENTIAL DISTRIBUTION)$/, make: fromKinds([3]) },
      { match: /^(STANDART NORMAL DAĞILIM|STANDARD NORMAL DISTRIBUTION)$/, make: fromKinds([4]) },
    ],
    challenge: {
      title: ['🎯 Önce tahmin edelim', '🎯 Let\'s predict first'],
      prompt: (p) => {
        const r = p.reg;
        return isK(p)
          ? tx(`Yoğunluk fonksiyonu ${funcText(r)} olan X için k sabiti kaçtır? Ondalık olarak 3 basamakla yazalım.`, `For X with density ${funcText(r)}, what is the constant k? Let's type it as a decimal to 3 places.`)
          : tx(`Yoğunluk fonksiyonu ${funcText(r)} olan X için P(${neg(N2(r.c))} ≤ X ≤ ${neg(N2(p.d))}) kaçtır? (k doğru sabit olsun.) 3 ondalık basamakla yazalım.`, `For X with density ${funcText(r)}, what is P(${neg(N2(r.c))} ≤ X ≤ ${neg(N2(p.d))})? (k is the correct constant.) Let's type it to 3 decimals.`);
      },
      target: (p) => (isK(p) ? pdf(p.reg).kk : Pex(p.reg, p.reg.c, p.d)),
      tol: (p) => (isK(p) ? Math.max(0.002, 0.02 * pdf(p.reg).kk) : 0.01),
      hint: (p, g) => { const t = isK(p) ? pdf(p.reg).kk : Pex(p.reg, p.reg.c, p.d); return tx(g > t ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > t ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.') + ' ' + (isK(p) ? tx('Toplam alan 1 olmalı.', 'The total area must be 1.') : tx('Olasılık = F(d) − F(c) = gölgeli alan.', 'Probability = F(d) − F(c) = the shaded area.')); },
    },
    _test: { S, pdf, Pex, Pnum, meanNum, totalNum, dmax, check, Phi },
  });

  // ---- quiz generators ----
  const T = () => tx('Olasılık Yoğunluk Fonksiyonları', 'Probability Density Functions');
  const trim = (v) => d4(v).replace(/0+$/, '');
  function numQ(text, correct, chk, wr, sol, rng, dec) {
    if (!(Math.abs(correct - chk) <= 1e-6 * Math.max(1, Math.abs(chk)))) throw new Error('pdf quiz: ' + correct + ' vs ' + chk);
    const f = (v) => neg(v.toFixed(dec)), cs = f(correct), pairs = [];
    wr.forEach(([v, n]) => { const sv = f(v); if (Number.isFinite(v) && sv !== cs && !pairs.some((q) => q[0] === sv)) pairs.push([sv, n]); });
    [1.1, 0.9, 1.25, 0.75, 0.5].forEach((m) => { const sv = f(correct * m); if (pairs.length < 3 && sv !== cs && !pairs.some((q) => q[0] === sv)) pairs.push([sv, '']); });
    return makeQuestion(T(), text, cs, pairs.map((q) => q[0]), sol, rng, pairs.map((q) => q[1]));
  }
  const mainQ = (rng) => {
    const b = rng.pick([3, 4, 5, 6]), c = rng.nextInt(0, b - 1), d = rng.nextInt(c + 1, b + 1), P = (d * d - c * c) / (b * b), r = { k: 0, b };
    return numQ(tx(`X'in yoğunluk fonksiyonu 0 ≤ x ≤ ${b} için f(x) = k·x, başka yerde 0'dır. P(${c} ≤ X ≤ ${d}) kaçtır (3 ondalık basamak)?`, `The density of X is f(x) = k·x for 0 ≤ x ≤ ${b} and 0 elsewhere. What is P(${c} ≤ X ≤ ${d}) (3 decimals)?`),
      P, Pnum(r, c, d),
      [[(d * d - c * c) / 2, tx('k = 1 alınmış (normalleştirme unutulmuş).', 'k = 1 was used (normalisation forgotten).')], [(d - c) / b, tx('Düzgün dağılım gibi (d − c)/b alınmış.', 'Treated like a uniform density: (d − c)/b.')], [(d * d - c * c) / (2 * b), tx('k = 1/b alınmış.', 'k = 1/b was used.')]],
      [tx(`∫₀^${b} k·x dx = ${b * b / 2}k = 1 ⇒ k = 2/${b * b}`, `∫₀^${b} k·x dx = ${b * b / 2}k = 1 ⇒ k = 2/${b * b}`), tx(`P = k(${d}² − ${c}²)/2 = (${d * d} − ${c * c})/${b * b} ≈ ${trim(P)}`, `P = k(${d}² − ${c}²)/2 = (${d * d} − ${c * c})/${b * b} ≈ ${trim(P)}`)], rng, 3);
  };
  mainQ.level = 2;
  const expTail = (rng) => {
    const lam = rng.pick([0.5, 1, 2]), t = rng.pick([1, 2, 3]), P = Math.exp(-lam * t);
    return numQ(tx(`Bir parçanın ömrü X (saat), λ = ${lam} olan üstel yoğunluğa sahiptir: f(x) = λe^(−λx), x ≥ 0. P(X > ${t}) kaçtır (3 ondalık basamak)?`, `The lifetime X (hours) of a part has the exponential density f(x) = λe^(−λx), x ≥ 0, with λ = ${lam}. What is P(X > ${t}) (3 decimals)?`),
      P, 1 - simpson((x) => lam * Math.exp(-lam * x), 0, t),
      [[1 - P, tx('P(X ≤ t) = F(t) bulunmuş; 1\'den çıkarmak unutulmuş.', 'P(X ≤ t) = F(t) was found; the subtraction from 1 was forgotten.')], [Math.exp(-t / lam), tx('λ yerine 1/λ kullanılmış.', '1/λ was used instead of λ.')], [lam * P, tx('Yoğunluğun değeri f(t) verilmiş, alan değil.', 'The density value f(t) was given instead of the area.')]],
      [tx(`P(X > ${t}) = ∫_${t}^∞ λe^(−λx) dx = e^(−λ·${t})`, `P(X > ${t}) = ∫_${t}^∞ λe^(−λx) dx = e^(−λ·${t})`), tx(`= e^(−${lam * t}) ≈ ${trim(P)}`, `= e^(−${lam * t}) ≈ ${trim(P)}`)], rng, 3);
  };
  expTail.level = 1;
  const kQ = (rng) => {
    const b = rng.pick([2, 3, 4]), k = 6 / (b ** 3), tot = simpson((x) => k * x * (b - x), 0, b);
    return numQ(tx(`X'in yoğunluk fonksiyonu 0 ≤ x ≤ ${b} için f(x) = k·x(${b} − x), başka yerde 0'dır. k sabiti kaçtır (3 ondalık basamak)?`, `The density of X is f(x) = k·x(${b} − x) for 0 ≤ x ≤ ${b} and 0 elsewhere. What is the constant k (3 decimals)?`),
      k, k / tot, [[2 / (b ** 3), tx('∫ x(b − x) dx = b³/6 yerine b³/2 alınmış.', 'b³/2 was used instead of ∫ x(b − x) dx = b³/6.')], [3 / (b ** 3), tx('∫ x(b − x) dx = b³/3 alınmış (x² teriminin 1/3\'ü unutulmuş).', 'b³/3 was used for ∫ x(b − x) dx (the 1/3 of the x² term forgotten).')], [6 / (b * b), tx('Kuvvet yanlış: b³ yerine b².', 'Wrong power: b² instead of b³.')]],
      [tx(`∫₀^${b} x(${b} − x) dx = [${b}x²/2 − x³/3] = ${b}³/6`, `∫₀^${b} x(${b} − x) dx = [${b}x²/2 − x³/3] = ${b}³/6`), tx(`k = 6/${b ** 3} ≈ ${trim(k)}`, `k = 6/${b ** 3} ≈ ${trim(k)}`)], rng, 3);
  };
  kQ.level = 2;
  const meanQ = (rng) => {
    const b = rng.pick([3, 6, 9]), kk = 2 / (b * b), m = 2 * b / 3;
    return numQ(tx(`X'in yoğunluk fonksiyonu 0 ≤ x ≤ ${b} için f(x) = 2x/${b * b}, başka yerde 0'dır. E[X] beklenen değeri kaçtır?`, `The density of X is f(x) = 2x/${b * b} for 0 ≤ x ≤ ${b} and 0 elsewhere. What is the mean E[X]?`),
      m, simpson((x) => x * kk * x, 0, b), [[b / 2, tx('Düzgün dağılımdaki gibi orta nokta alınmış.', 'The midpoint was used, as for a uniform density.')], [b / 3, tx('Ters türevde x çarpanı yanlış işlenmiş (x² yerine x).', 'The factor x was mishandled in the antiderivative (x instead of x²).')], [3 * b / 4, tx('Yanlış kuvvet: x² yerine x³ integre edilmiş.', 'Wrong power: x³ was integrated instead of x².')]],
      [tx(`E[X] = ∫₀^${b} x·(2x/${b * b}) dx = (2/${b * b})·${b}³/3`, `E[X] = ∫₀^${b} x·(2x/${b * b}) dx = (2/${b * b})·${b}³/3`), tx(`E[X] = 2·${b}/3 = ${m}`, `E[X] = 2·${b}/3 = ${m}`)], rng, 2);
  };
  meanQ.level = 2;
  const normQ = (rng) => {
    const n = rng.pick([1, 2, 3]), P = Pnum({ k: 4 }, -n, n), all = [1, 2, 3].map((v) => Pnum({ k: 4 }, -v, v));
    return numQ(tx(`Standart normal yoğunluk f(x) = e^(−x²/2)/√(2π) için P(−${n} ≤ X ≤ ${n}) yaklaşık kaçtır (Simpson kuralı, 4 ondalık basamak)?`, `For the standard normal density f(x) = e^(−x²/2)/√(2π), approximately what is P(−${n} ≤ X ≤ ${n}) (Simpson's rule, 4 decimals)?`),
      P, 2 * Phi(n) - 1,
      [[all[n % 3], tx('Başka bir σ aralığının (68–95–99.7) değeri.', 'The value for a different σ interval (68–95–99.7).')], [all[(n + 1) % 3], tx('Başka bir σ aralığının (68–95–99.7) değeri.', 'The value for a different σ interval (68–95–99.7).')], [P / 2, tx('Yalnızca bir yarı (0 ile n arası) alınmış.', 'Only one half (between 0 and n) was taken.')]],
      [tx(`P = k ∫_{−${n}}^{${n}} e^(−x²/2) dx,  k ≈ 0.3989`, `P = k ∫_{−${n}}^{${n}} e^(−x²/2) dx,  k ≈ 0.3989`), tx(`Simpson: P ≈ ${d4(P)}`, `Simpson: P ≈ ${d4(P)}`)], rng, 4);
  };
  normQ.level = 1;
  const normHalf = (rng) => {
    const n = rng.pick([1, 2, 3]), P = Pnum({ k: 4 }, 0, n);
    return numQ(tx(`Standart normal yoğunluk için P(0 ≤ X ≤ ${n}) yaklaşık kaçtır (4 ondalık basamak)? (Yoğunluk x = 0'a göre simetriktir.)`, `For the standard normal density, approximately what is P(0 ≤ X ≤ ${n}) (4 decimals)? (The density is symmetric about x = 0.)`),
      P, Phi(n) - 0.5,
      [[2 * P, tx('Simetrik aralığın (−n, n) değeri verilmiş.', 'The value of the symmetric interval (−n, n) was given.')], [0.5 + P, tx('P(X ≤ n) verilmiş (sol yarı dahil).', 'P(X ≤ n) was given (left half included).')], [0.5 - P, tx('P(X > n) verilmiş.', 'P(X > n) was given.')]],
      [tx(`P(0 ≤ X ≤ ${n}) = ½·P(−${n} ≤ X ≤ ${n}) (simetri)`, `P(0 ≤ X ≤ ${n}) = ½·P(−${n} ≤ X ≤ ${n}) (symmetry)`), tx(`Simpson: ≈ ${d4(P)}`, `Simpson: ≈ ${d4(P)}`)], rng, 4);
  };
  normHalf.level = 2;
  const uniQ = (rng) => {
    const a = rng.nextInt(-2, 3), L = rng.pick([4, 5, 8, 10]), c = a + rng.nextInt(0, 2), d = c + rng.nextInt(1, L - 1), P = (d - c) / L;
    return numQ(tx(`X, [${neg(a)}, ${a + L}] aralığında düzgün (uniform) dağılmıştır. P(${neg(c)} ≤ X ≤ ${neg(d)}) kaçtır (3 ondalık basamak)?`, `X is uniformly distributed on [${neg(a)}, ${a + L}]. What is P(${neg(c)} ≤ X ≤ ${neg(d)}) (3 decimals)?`),
      P, simpson(() => 1 / L, c, d, 10), [[d - c, tx('k = 1/(b − a) çarpanı unutulmuş.', 'The factor k = 1/(b − a) was forgotten.')], [(d - c) / (L + 1), tx('Aralık uzunluğu yanlış sayılmış (b − a + 1).', 'The interval length was miscounted (b − a + 1).')], [1 - P, tx('Tamamlayıcı olasılık verilmiş.', 'The complementary probability was given.')]],
      [tx(`k = 1/${L};  P = k·(${neg(d)} − (${neg(c)}))`, `k = 1/${L};  P = k·(${neg(d)} − (${neg(c)}))`), tx(`P = ${d - c}/${L} = ${trim(P)}`, `P = ${d - c}/${L} = ${trim(P)}`)], rng, 3);
  };
  uniQ.level = 1;
  const medQ = (rng) => {
    const lam = rng.pick([0.5, 2, 0.25, 4]), m = Math.LN2 / lam;
    return numQ(tx(`Üstel yoğunluk f(x) = λe^(−λx), x ≥ 0, λ = ${lam}. Medyan kaçtır (3 ondalık basamak)?`, `Exponential density f(x) = λe^(−λx), x ≥ 0, with λ = ${lam}. What is the median (3 decimals)?`),
      m, -Math.log(0.5) / lam, [[1 / lam, tx('Medyan yerine ortalama (1/λ) verilmiş.', 'The mean (1/λ) was given instead of the median.')], [Math.LN2 * lam, tx('λ ile bölmek yerine çarpılmış.', 'Multiplied by λ instead of dividing.')], [2 * Math.LN2 / lam, tx('F(m) = 1/2 yerine F(m) = 3/4 çözülmüş.', 'Solved F(m) = 3/4 instead of F(m) = 1/2.')]],
      [tx(`F(m) = 1 − e^(−${lam}m) = 1/2 ⇒ e^(−${lam}m) = 1/2`, `F(m) = 1 − e^(−${lam}m) = 1/2 ⇒ e^(−${lam}m) = 1/2`), tx(`m = ln 2/${lam} ≈ ${trim(m)}`, `m = ln 2/${lam} ≈ ${trim(m)}`)], rng, 3);
  };
  medQ.level = 3;
  Calc2Quiz.main.push(mainQ);
  Calc2Quiz.extra.push(expTail, kQ, meanQ, normQ, normHalf, uniQ, medQ);
})();
