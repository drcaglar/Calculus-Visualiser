// 3D views for all 16 scenarios of the engineering tab "statics" (View3D builder attached as spec.view3d).
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  // slider ranges of Specs()/ExtSpecs() (clamped again here so the scene never degenerates)
  const R = [
    [[2, 6], [3, 9]], [[2, 10], [2, 8]], [[2, 4], [10, 20]], [[1, 4], [3, 6]], [[40, 120], [60, 180]], [[6, 18], [2, 6], [4000, 12000]], [[50, 200], [1, 4]], [[90, 270], [2, 8]],
    [[6, 18], [2, 6]], [[2, 8], [4, 8], [5000, 15000]], [[2, 8], [1, 3], [40, 80]], [[3, 9], [2, 6]], [[2, 6], [1, 3], [4, 8]], [[2, 6], [20, 40], [4, 6]], [[20, 60], [1, 3], [2, 4]], [[200, 400], [10, 30]],
  ];
  const f2 = (v) => (Number.isFinite(v) ? (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')) : '0');

  const builder = ({ THREE, world }) => {
    const V3 = View3D.V3;
    const V = (x, y, z) => new THREE.Vector3(x, y, z || 0);
    const mesh = (geo, color, o) => new THREE.Mesh(geo, V3.mat(color, o));
    const gh = (geo, color, op) => new THREE.Mesh(geo, V3.ghost(color, op));
    const add = (o, x, y, z) => { if (x !== undefined) o.position.set(x, y || 0, z || 0); world.add(o); return o; };
    const arrow = (from, dir, len, color, hl, hw) => {
      const l = Math.max(len, 0.06);
      const a = new THREE.ArrowHelper(dir.clone().normalize(), from, l, new THREE.Color(color).getHex(), hl === undefined ? Math.min(0.2, l * 0.5) : Math.min(hl, l * 0.6), hw === undefined ? 0.1 : hw);
      world.add(a); return a;
    };
    const dot = (x, y, z, r, color) => add(mesh(new THREE.SphereGeometry(r, 20, 14), color), x, y, z);
    const ln = (pts, color) => world.add(V3.line(pts, color));
    // filled polygon (x,y) extruded in z by th, centred on z = 0
    const plate = (pts, color, op, th) => {
      const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
      const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); g.translate(0, 0, -th / 2);
      return add(mesh(g, color, { transparent: true, opacity: op }));
    };
    const outline = (pts, color, z) => ln(pts.concat([pts[0]]).map((q) => [q[0], q[1], z || 0]), color);
    const tube = (pts, r, color) => add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(40, pts.length * 3), r, 8), color));
    const beamBox = (Ls, C) => add(mesh(new THREE.BoxGeometry(Ls, 0.3, 0.7), C.accent, { transparent: true, opacity: 0.75 }), 0, -0.15, 0);
    const support = (x, C, y) => { const m = mesh(new THREE.ConeGeometry(0.28, 0.45, 4), C.sub); m.rotation.y = Math.PI / 4; add(m, x, (y === undefined ? -0.3 : y) - 0.22, 0); };
    const wall = (x, hh, C) => add(mesh(new THREE.BoxGeometry(0.25, hh, 1.2), C.sub), x - 0.125, 0, 0);
    const fit = (cx, cy, cz, span) => { const s = 6.4 / Math.max(span, 1e-6); world.scale.setScalar(s); world.position.set(-cx * s, -cy * s, -cz * s); return s; };
    const hsl = (t) => new THREE.Color().setHSL(0.6 - 0.5 * t, 0.65, 0.55).getStyle();
    const nz = (t) => (t > 1 ? 1 : t < 0 ? 0 : t);
    // run fn() and shift every object it adds down by dy
    const shifted = (dy, fn) => { const k = world.children.length; fn(); world.children.slice(k).forEach((o) => { o.position.y += dy; }); };

    const upd = (p, C) => {
      world.position.set(0, 0, 0); world.scale.setScalar(1);
      const scn = Math.max(0, Math.min(15, Math.round(Number(p && p.scn) || 0)));
      const g = (i) => { const r = R[scn][i]; let v = Number(p && p.p && p.p[i]); if (!Number.isFinite(v)) v = r[0]; return Math.min(r[1], Math.max(r[0], v)); };
      const down = V(0, -1, 0), up = V(0, 1, 0), right = V(1, 0, 0);
      // diagram ribbon (V, M ...) from sampled world coordinates, baseline at y = 0
      const diagram = (xs, ys, color) => {
        const pts = [[xs[0], 0]]; for (let i = 0; i < xs.length; i++) pts.push([xs[i], ys[i]]); pts.push([xs[xs.length - 1], 0]);
        plate(pts, color, 0.45, 0.25); ln(pts.map((q) => [q[0], q[1], 0.13]), color); ln([[xs[0], 0, 0.13], [xs[xs.length - 1], 0, 0.13]], C.sub);
      };
      let note = '';

      if (scn === 0) {
        const a = g(0), L = g(1), Ls = 0.65 * L, hl = 0.25 + 2.2 * (a * L) / 54, x0 = -Ls / 2, W = a * L * L / 2, xb = 2 * L / 3;
        world.position.y = -0.7; beamBox(Ls, C); support(x0 + 0.15, C); support(-x0 - 0.15, C);
        const tri = [[x0, 0], [-x0, 0], [-x0, hl]]; plate(tri, C.accent, 0.22, 0.5); outline(tri, C.accent, 0.26);
        for (let i = 0; i <= 12; i++) { const t = i / 12, h = hl * t; if (h > 0.06) arrow(V(x0 + Ls * t, h, 0), down, h, C.fg, 0.14, 0.08); }
        const xr = x0 + Ls * xb / L; arrow(V(xr, hl + 0.9, 0), down, hl + 0.9, C.orange, 0.26, 0.16); dot(xr, hl / 3, 0, 0.09, C.gold);
        note = tx(`Üçgen yük w = ${f2(a)}·x (soldan sağa artar); bileşke W = ∫w dx = ${f2(W)} kN (turuncu ok) üçgenin ağırlık merkezinde, soldan x̄ = 2L/3 = ${f2(xb)} m'de (altın nokta).`, `Triangular load w = ${f2(a)}·x (grows left to right); the resultant W = ∫w dx = ${f2(W)} kN (orange arrow) acts at the centroid of the triangle, x̄ = 2L/3 = ${f2(xb)} m from the left (gold dot).`);
      } else if (scn === 1) {
        const w = g(0), L = g(1), Ls = 0.75 * L, hl = 0.3 + 1.2 * w / 10, x0 = -Ls / 2, r = w * L / 2, Vs = 0.75 / 40, Ms = 1.0 / 80, N = 24;
        world.position.y = 1.0; beamBox(Ls, C); support(x0 + 0.15, C); support(-x0 - 0.15, C);
        plate([[x0, 0], [-x0, 0], [-x0, hl], [x0, hl]], C.accent, 0.2, 0.5); for (let i = 0; i <= 10; i++) arrow(V(x0 + Ls * i / 10, hl, 0), down, hl, C.fg, 0.14, 0.08);
        arrow(V(x0 + 0.15, -0.85, 0), up, 0.5 + 0.7 * r / 40, C.orange, 0.2, 0.12); arrow(V(-x0 - 0.15, -0.85, 0), up, 0.5 + 0.7 * r / 40, C.orange, 0.2, 0.12);
        const xs = [], vs = [], ms = []; for (let i = 0; i <= N; i++) { const x = L * i / N; xs.push(x0 + Ls * i / N); vs.push(Vs * (r - w * x)); ms.push(Ms * (r * x - w * x * x / 2)); }
        shifted(-2.2, () => diagram(xs, vs, C.good)); shifted(-3.9, () => diagram(xs, ms, C.purple));
        dot(0, -3.9 + Ms * w * L * L / 8, 0.13, 0.09, C.gold);
        note = tx(`Düzgün yük w = ${f2(w)} kN/m: yeşil kesme diyagramı V = wL/2 − wx doğrusal (orta açıklıkta 0), mor moment diyagramı M parabolik; maksimum M = wL²/8 = ${f2(w * L * L / 8)} kN·m orta noktada (V = 0).`, `Uniform load w = ${f2(w)} kN/m: the green shear diagram V = wL/2 − wx is linear (zero at midspan), the purple moment diagram M is a parabola; maximum M = wL²/8 = ${f2(w * L * L / 8)} kN·m at midspan (V = 0).`);
      } else if (scn === 2) {
        const w = g(0), P = g(1), Ls = 6.5, s = Ls / 10, x0 = -Ls / 2, hl = 0.25 + 0.6 * w / 4, RB = (w * 50 + 8 * P) / 10, RA = 10 * w + P - RB, xz = RA / w, Vs = 0.8 / 40;
        world.position.y = 0.9; beamBox(Ls, C); support(x0 + 0.1, C); support(-x0 - 0.1, C);
        plate([[x0, 0], [-x0, 0], [-x0, hl], [x0, hl]], C.accent, 0.2, 0.5); for (let i = 0; i <= 10; i++) arrow(V(x0 + Ls * i / 10, hl, 0), down, hl, C.fg, 0.12, 0.07);
        const xp = x0 + 8 * s, lp = 0.7 + 1.0 * P / 20; arrow(V(xp, lp + 0.1, 0), down, lp + 0.1, C.orange, 0.26, 0.16);
        arrow(V(x0 + 0.1, -0.85, 0), up, 0.4 + 0.9 * RA / 40, C.good, 0.2, 0.12); arrow(V(-x0 - 0.1, -0.85, 0), up, 0.4 + 0.9 * RB / 40, C.good, 0.2, 0.12);
        const xv = [], yv = []; const pushv = (x, v) => { xv.push(x0 + x * s); yv.push(Vs * v); };
        for (let i = 0; i <= 16; i++) { const x = 8 * i / 16; pushv(x, RA - w * x); } for (let i = 0; i <= 8; i++) { const x = 8 + 2 * i / 8; pushv(x, RA - w * x - P); }
        shifted(-2.4, () => diagram(xv, yv, C.good));
        dot(x0 + xz * s, 0, 0, 0.11, C.gold); dot(x0 + xz * s, -2.4, 0.13, 0.09, C.gold); ln([[x0 + xz * s, 0, 0], [x0 + xz * s, -2.4, 0.13]], C.gold);
        note = tx(`Düzgün yük w = ${f2(w)} kN/m ve x = 8 m'de P = ${f2(P)} kN: yeşil kesme diyagramı P noktasında sıçrar; V = 0 olan x = ${f2(xz)} m'de (altın nokta) moment maksimumdur. R_A = ${f2(RA)}, R_B = ${f2(RB)} kN.`, `Uniform load w = ${f2(w)} kN/m plus P = ${f2(P)} kN at x = 8 m: the green shear diagram jumps at P; the moment is maximum where V = 0, at x = ${f2(xz)} m (gold dot). R_A = ${f2(RA)}, R_B = ${f2(RB)} kN.`);
      } else if (scn === 3) {
        const k = g(0), b = g(1), Xb = 0.75 * b, H = 0.5 + 2.4 * Math.sqrt(k * b * b / 144), A = k * b ** 3 / 3, xb = 3 * b / 4, yb = 3 * k * b * b / 10;
        world.position.set(-Xb / 2, -H / 2, 0);
        const N = 32, curve = [], pts = [[0, 0]]; for (let i = 0; i <= N; i++) { const t = i / N; curve.push([Xb * t, H * t * t]); pts.push([Xb * t, H * t * t]); } pts.push([Xb, 0]);
        plate(pts, C.accent, 0.4, 0.4); ln(curve.map((q) => [q[0], q[1], 0.21]), C.accent); ln([[0, 0, 0.21], [Xb + 0.3, 0, 0.21]], C.sub); ln([[0, 0, 0.21], [0, H + 0.3, 0.21]], C.sub);
        const tt = 0.45; add(mesh(new THREE.BoxGeometry(Xb / 25, H * tt * tt, 0.5), C.orange), Xb * tt, H * tt * tt / 2, 0);
        const cx = Xb * 0.75, cy = H * 0.3; dot(cx, cy, 0.3, 0.11, C.gold); ln([[cx, 0, 0.3], [cx, cy, 0.3]], C.gold); ln([[0, cy, 0.3], [cx, cy, 0.3]], C.gold);
        note = tx(`y = ${f2(k)}x² eğrisi altındaki alan (A = kb³/3 = ${f2(A)}) ince düşey şeritlerden (turuncu: dA = y dx) oluşur; altın nokta ağırlık merkezi x̄ = 3b/4 = ${f2(xb)}, ȳ = 3kb²/10 = ${f2(yb)} (yükseklik görsel için ölçeklendi).`, `The area under y = ${f2(k)}x² (A = kb³/3 = ${f2(A)}) is built from thin vertical strips (orange: dA = y dx); the gold dot is the centroid x̄ = 3b/4 = ${f2(xb)}, ȳ = 3kb²/10 = ${f2(yb)} (height scaled for display).`);
      } else if (scn === 4) {
        const b = g(0), h = g(1), sc = 3.4 / 180, bw = b * sc, hh = h * sc, N = 14, I = b * h ** 3 / 12;
        world.position.x = -bw / 2 - 0.5; plate([[-bw / 2, -hh / 2], [bw / 2, -hh / 2], [bw / 2, hh / 2], [-bw / 2, hh / 2]], C.accent, 0.12, 0.2);
        for (let i = 0; i < N; i++) { const y = -hh / 2 + hh * (i + 0.5) / N, t = Math.abs(y) / (hh / 2); add(mesh(new THREE.BoxGeometry(bw, hh / N * 0.88, 0.2), hsl(1 - t), { transparent: true, opacity: 0.85 }), 0, y, 0); }
        ln([[-bw / 2 - 0.3, 0, 0.2], [bw / 2 + 1.9, 0, 0.2]], C.orange);
        const x0 = bw / 2 + 0.35, prof = []; for (let i = 0; i <= 30; i++) { const y = -hh / 2 + hh * i / 30, t = y / (hh / 2); prof.push([x0 + 1.4 * t * t, y]); }
        plate([[x0, -hh / 2]].concat(prof).concat([[x0, hh / 2]]), C.purple, 0.5, 0.2); ln(prof.map((q) => [q[0], q[1], 0.11]), C.purple);
        note = tx(`Dikdörtgen ${f2(b)}×${f2(h)} mm: renkli yatay şeritler dA = b dy; mor profil y² ağırlığını gösterir (nötr eksenden uzak şeritler çok katkı verir): I = bh³/12 = ${f2(I)} mm⁴.`, `Rectangle ${f2(b)}×${f2(h)} mm: coloured horizontal strips dA = b dy; the purple profile is the y² weight (strips far from the neutral axis contribute most): I = bh³/12 = ${f2(I)} mm⁴.`);
      } else if (scn === 5) {
        const P = g(0), L = g(1), EI = g(2), Ls = 0.75 * L, x0 = -Ls / 2, dmax = P * L ** 3 / (3 * EI), dv = 0.25 + 1.55 * Math.pow(nz(dmax / 0.324), 0.35), hm = 0.3 + 0.9 * P * L / 108;
        world.position.y = 0.2; wall(x0, 2.4, C); add(gh(new THREE.BoxGeometry(Ls, 0.3, 0.7), C.sub, 0.2), 0, -0.15, 0);
        const pts = []; for (let i = 0; i <= 40; i++) { const xi = i / 40; pts.push(V(x0 + Ls * xi, -dv * (3 * xi * xi - xi ** 3) / 2, 0)); } tube(pts, 0.08, C.accent);
        const tip = pts[40]; arrow(V(tip.x, tip.y + 0.5 + 0.9 * P / 18, 0), down, 0.5 + 0.9 * P / 18, C.orange, 0.25, 0.15);
        const base = 1.3, tri = [[x0, base], [x0, base + hm], [-x0, base]]; plate(tri, C.purple, 0.4, 0.3); outline(tri, C.purple, 0.16);
        note = tx(`Ankastre kiriş: mor üçgen M(x) = P(L − x) (duvarda en büyük); iki kez integre edilince eğri (mavi) çıkar. Uç sehim δ = PL³/(3EI) = ${f2(dmax * 1000)} mm (sehim görsel için abartılmıştır).`, `Cantilever: the purple triangle is M(x) = P(L − x) (largest at the wall); integrating it twice gives the curve (blue). Tip deflection δ = PL³/(3EI) = ${f2(dmax * 1000)} mm (deflection exaggerated for display).`);
      } else if (scn === 6) {
        const E = g(0), ey = g(1), sy = E * ey, sx = 0.75, ex = ey * sx, eyy = sy * 2.8 / 800, X = 4.5 * sx;
        world.position.set(-X / 2, -1.4, 0);
        ln([[0, 0, 0], [X + 0.3, 0, 0]], C.sub); ln([[0, 0, 0], [0, 3.1, 0]], C.sub);
        plate([[0, 0], [ex, 0], [ex, eyy]], C.orange, 0.6, 0.3);
        ln([[0, 0, 0.16], [ex, eyy, 0.16], [X, eyy, 0.16]], C.accent);
        ln([[ex, 0, 0.17], [ex, eyy, 0.17]], C.gold); ln([[0, eyy, 0.17], [ex, eyy, 0.17]], C.gold);
        const xe = Math.min(X, ex + 0.9); ln([[ex, 0, 0.17], [xe, 0, 0.17]], C.good); ln([[xe, 0, 0.17], [xe, eyy * xe / ex, 0.17]], C.good);
        dot(ex, eyy, 0.17, 0.09, C.gold);
        add(mesh(new THREE.BoxGeometry(1.0 + 1.2 * ey / 4, 0.2, 0.2), C.accent, { transparent: true, opacity: 0.8 }), X / 2, 3.35, 0);
        note = tx(`Gerilme–birim şekil değiştirme: doğrunun eğimi (yeşil üçgen) E = ${f2(E)} GPa; akma gerilmesi σy = E·εy = ${f2(sy)} MPa. Turuncu üçgenin alanı birim hacim enerjisi u = ½E·εy² = ${f2(E * ey * ey / 2)} kJ/m³.`, `Stress–strain curve: the slope of the line (green triangle) is E = ${f2(E)} GPa; yield stress σy = E·εy = ${f2(sy)} MPa. The area of the orange triangle is the strain-energy density u = ½E·εy² = ${f2(E * ey * ey / 2)} kJ/m³.`);
      } else if (scn === 7) {
        const c = g(0), M = g(1), hOpt = c / 3, hmax = c / 2, Sf = (h) => (c - 2 * h) * h * h / 6, S0 = Sf(hOpt), Hh = 0.8 + 1.8 * (c / 270) ** 3, Xw = 3.2;
        world.position.set(-0.4, -1.1, 0);
        const N = 40, cv = [[0, 0]]; for (let i = 1; i <= N; i++) cv.push([Xw * i / N, Hh * Sf(hmax * i / N) / S0]);
        plate(cv, C.accent, 0.35, 0.3); ln(cv.map((q) => [q[0], q[1], 0.16]), C.accent); ln([[0, 0, 0.16], [Xw + 0.3, 0, 0.16]], C.sub);
        const xo = Xw * hOpt / hmax; ln([[xo, 0, 0.17], [xo, Hh, 0.17]], C.gold); dot(xo, Hh, 0.17, 0.1, C.gold);
        const sig = M * 1e6 / S0, sc = 2.0 / 270, bw = (c - 2 * hOpt) * sc + 0.2, hh = hOpt * sc + 0.2, sx = -2.3, sy = 1.9;
        add(mesh(new THREE.BoxGeometry(bw, hh, 1.2), C.orange, { transparent: true, opacity: 0.7 }), sx, sy, 0);
        const al = 0.2 + 0.7 * Math.min(1, sig / 400); arrow(V(sx - bw / 2 - 0.1, sy + hh / 2, 0.9), right, al, C.bad, 0.1, 0.06); arrow(V(sx + bw / 2 + 0.1, sy - hh / 2, 0.9), V(-1, 0, 0), al, C.good, 0.1, 0.06);
        note = tx(`Kısıt b + 2h = ${f2(c)} mm altında S(h) = (c − 2h)h²/6 eğrisi (mavi); tepe noktası (altın) h = c/3 = ${f2(hOpt)} mm, b = c/3 (kare kesit, solda) ve S = ${f2(S0)} mm³; σ = M/S = ${f2(sig)} MPa.`, `Under b + 2h = ${f2(c)} mm the curve S(h) = (c − 2h)h²/6 (blue) peaks (gold) at h = c/3 = ${f2(hOpt)} mm, b = c/3 (square section, left) with S = ${f2(S0)} mm³; σ = M/S = ${f2(sig)} MPa.`);
      } else if (scn === 8) {
        const w0 = g(0), L = g(1), Ls = 0.75 * L, x0 = -Ls / 2, hl = 0.3 + 1.6 * w0 / 18, N = 20, Vs = 0.9 / 54, Ms = 1.0 / 108;
        world.position.set(0, 1.2, 0); wall(x0, 2.6, C); add(mesh(new THREE.BoxGeometry(Ls, 0.3, 0.7), C.accent, { transparent: true, opacity: 0.75 }), 0, -0.15, 0);
        const tri = [[x0, 0], [x0, hl], [-x0, 0]]; plate(tri, C.accent, 0.22, 0.5); outline(tri, C.accent, 0.26);
        for (let i = 0; i < 12; i++) { const t = i / 12, h = hl * (1 - t); if (h > 0.06) arrow(V(x0 + Ls * t, h, 0), down, h, C.fg, 0.14, 0.08); }
        const xs = [], vs = [], ms = []; for (let i = 0; i <= N; i++) { const t = i / N, xf = L * (1 - t); xs.push(x0 + Ls * t); vs.push(-Vs * w0 * xf * xf / (2 * L)); ms.push(-Ms * w0 * xf ** 3 / (6 * L * L)); }
        shifted(-1.9, () => diagram(xs, vs, C.good)); shifted(-3.7, () => diagram(xs, ms, C.purple));
        note = tx(`Ankastre konsol, duvarda w₀ = ${f2(w0)} kN/m olan üçgen yük (uçta 0): yeşil V(x) ∝ x² (parabol), mor M(x) ∝ x³ (kübik); ikisi de duvarda en büyük (|V| = ${f2(w0 * L / 2)} kN, |M| = ${f2(w0 * L * L / 6)} kN·m).`, `Cantilever with a triangular load that is w₀ = ${f2(w0)} kN/m at the wall (0 at the tip): green V(x) ∝ x² (parabola), purple M(x) ∝ x³ (cubic); both are largest at the wall (|V| = ${f2(w0 * L / 2)} kN, |M| = ${f2(w0 * L * L / 6)} kN·m).`);
      } else if (scn === 9) {
        const w = g(0), L = g(1), EI = g(2), Ls = 0.75 * L, x0 = -Ls / 2, dmax = 5 * w * L ** 4 / (384 * EI), dv = 0.2 + 1.4 * Math.pow(nz(dmax / 0.085), 0.35), hl = 0.3 + 0.6 * w / 8;
        world.position.y = 0.6; support(x0 + 0.05, C, 0); support(-x0 - 0.05, C, 0); add(gh(new THREE.BoxGeometry(Ls, 0.25, 0.7), C.sub, 0.2), 0, -0.125, 0);
        const pts = []; for (let i = 0; i <= 40; i++) { const xi = i / 40; pts.push(V(x0 + Ls * xi, -dv * 3.2 * (xi - 2 * xi ** 3 + xi ** 4), 0)); } tube(pts, 0.08, C.accent);
        for (let i = 0; i <= 10; i++) arrow(V(x0 + Ls * i / 10, hl + 0.3, 0), down, hl, C.fg, 0.12, 0.07); ln([[x0, hl + 0.3, 0], [-x0, hl + 0.3, 0]], C.fg);
        dot(0, -dv, 0, 0.11, C.gold); ln([[-Ls * 0.2, -dv, 0], [Ls * 0.2, -dv, 0]], C.gold); ln([[0, 0, 0], [0, -dv, 0]], C.orange);
        note = tx(`Düzgün yüklü basit mesnetli kiriş: M çift integre edilince sehim eğrisi δ(x) (mavi) çıkar; eğim sıfır (altın teğet) orta noktada, δmax = 5wL⁴/(384EI) = ${f2(dmax * 1000)} mm (görsel için abartılmış).`, `Simply supported beam under uniform load: integrating M twice gives the deflection curve δ(x) (blue); the slope is zero (gold tangent) at midspan, δmax = 5wL⁴/(384EI) = ${f2(dmax * 1000)} mm (exaggerated for display).`);
      } else if (scn === 10) {
        const T0 = g(0), L = g(1), d = g(2), Ls = 1.5 * L, x0 = -Ls / 2, rr = d / 80 * 0.5, J = Math.PI * d ** 4 / 32, phi = T0 * 1e6 * (L * 1000) / (2 * 80e3 * J), pv = 0.15 + 2.2 * Math.pow(nz(phi / 0.65), 0.4), hT = 0.3 + 1.0 * T0 / 8;
        world.position.set(0, -0.3, 0); wall(x0, 2.2, C);
        const cyl = gh(new THREE.CylinderGeometry(rr, rr, Ls, 40, 1, true), C.accent, 0.22); cyl.rotation.z = Math.PI / 2; add(cyl, 0, 0, 0);
        for (let k = 0; k < 6; k++) { const th = 2 * Math.PI * k / 6, ps = []; for (let i = 0; i <= 30; i++) { const xi = i / 30, a = th + pv * (2 * xi - xi * xi); ps.push([x0 + Ls * xi, rr * Math.cos(a), rr * Math.sin(a)]); } ln(ps, k === 0 ? C.orange : C.accent); }
        const ring = []; for (let i = 0; i <= 40; i++) { const a = 2 * Math.PI * i / 40; ring.push([-x0, rr * Math.cos(a), rr * Math.sin(a)]); } ln(ring, C.fg);
        const yb = rr + 0.35, tri = [[x0, yb], [x0, yb + hT], [-x0, yb]]; plate(tri, C.purple, 0.4, 0.3); outline(tri, C.purple, 0.16);
        note = tx(`Mil dx dilimlerinden oluşur; her dilim dφ = T(x)dx/(GJ) döner. Mor üçgen T(x) = T₀(1 − x/L), altındaki alan toplam dönmedir: φ = ${f2(phi)} rad = ${f2(phi * 180 / Math.PI)}° (turuncu çizgi dönmeyi abartılı gösterir).`, `The shaft is made of slices dx; each twists by dφ = T(x)dx/(GJ). The purple triangle is T(x) = T₀(1 − x/L); its area gives the total twist φ = ${f2(phi)} rad = ${f2(phi * 180 / Math.PI)}° (the orange line shows the twist exaggerated).`);
      } else if (scn === 11) {
        const h = g(0), b = g(1), N = 24, A = h * b / 6, xb = b / 2, yb = 2 * h / 5, s = fit(b / 2, h / 2, 0, Math.max(b, h));
        const up2 = [], lo = []; for (let i = 0; i <= N; i++) { const x = b * i / N; up2.push([x, h / b * x]); lo.push([x, h / b / b * x * x]); }
        plate(up2.concat(lo.slice().reverse()), C.accent, 0.5, 0.15 / s); ln(up2.map((q) => [q[0], q[1], 0.08 / s]), C.good); ln(lo.map((q) => [q[0], q[1], 0.08 / s]), C.purple);
        const xs = 0.4 * b, y1 = h / b * xs, y2 = h / b / b * xs * xs; add(mesh(new THREE.BoxGeometry(b / 30, y1 - y2, 0.12 / s), C.orange), xs, (y1 + y2) / 2, 0);
        dot(xb, yb, 0.1 / s, 0.1 / s, C.gold); ln([[0, yb, 0.1 / s], [xb, yb, 0.1 / s], [xb, 0, 0.1 / s]], C.gold);
        note = tx(`İki eğri arası alan (A = hb/6 = ${f2(A)} cm²): yeşil doğru üstte, mor parabol altta; turuncu şerit dA = (y₁ − y₂)dx. Altın nokta ağırlık merkezi x̄ = b/2 = ${f2(xb)}, ȳ = 2h/5 = ${f2(yb)} cm.`, `The area between two curves (A = hb/6 = ${f2(A)} cm²): the green line is on top, the purple parabola below; the orange strip is dA = (y₁ − y₂)dx. The gold dot is the centroid x̄ = b/2 = ${f2(xb)}, ȳ = 2h/5 = ${f2(yb)} cm.`);
      } else if (scn === 12) {
        const w = g(0), h1 = g(1), h2 = g(2), H = h2 + 1, rg = 9.81, c = 0.45, F = rg * w * (h2 * h2 - h1 * h1) / 2, ycp = (2 / 3) * (h2 ** 3 - h1 ** 3) / (h2 * h2 - h1 * h1), zw = w + 1.5, sx = c * h2 + 0.9;
        const s = fit(0, -H / 2, 0, Math.max(H, zw, sx + 1));
        add(gh(new THREE.BoxGeometry(sx, H, zw), C.accent, 0.14), -sx / 2, -H / 2, 0); add(mesh(new THREE.BoxGeometry(0.3, H, zw + 0.6), C.sub, { transparent: true, opacity: 0.4 }), 0.15, -H / 2, 0);
        add(mesh(new THREE.BoxGeometry(0.34, h2 - h1, w), C.accent, { transparent: true, opacity: 0.95 }), 0.15, -(h1 + h2) / 2, 0);
        // pressure prism: trapezoid in the x-y plane, extruded across the gate width (centred on z = 0)
        const tr = [[0, -h1], [0, -h2], [-c * h2, -h2], [-c * h1, -h1]]; plate(tr, C.orange, 0.35, w);
        for (let k = 0; k <= 6; k++) { const y = h1 + (h2 - h1) * k / 6; for (const z of [-w / 3, 0, w / 3]) arrow(V(-c * y, -y, z), right, c * y, C.orange, Math.min(0.25, c * y * 0.4), 0.09); }
        ln([[-sx, 0, zw / 2], [0, 0, zw / 2]], C.sub);
        dot(0, -ycp, 0, 0.12 / s, C.gold); arrow(V(-c * ycp - 1.2, -ycp, 0), right, 1.2, C.good, 0.3, 0.2);
        note = tx(`Basınç derinlikle doğrusal artar (turuncu yamuk prizma); toplam kuvvet F = ∫ρg·y·w dy = ${f2(F)} kN. Altın nokta basınç merkezi: yüzeyden y_cp = ${f2(ycp)} m, kapak ortasından daha derinde.`, `Pressure grows linearly with depth (orange trapezoidal prism); the total force is F = ∫ρg·y·w dy = ${f2(F)} kN. The gold dot is the centre of pressure at y_cp = ${f2(ycp)} m below the surface, deeper than the gate's mid-height.`);
      } else if (scn === 13) {
        const wl = g(0), L = g(1), h = g(2), s = 6.4 / L, Hh = wl * L * L / (8 * h), Tm = Math.sqrt(Hh * Hh + (wl * L / 2) ** 2), a = 4 * h / (L * L), hs = h * s;
        const kk = 8 * h / (L * L), xe = L / 2, arcL = 2 * ((xe / 2) * Math.sqrt(1 + kk * kk * xe * xe) + Math.asinh(kk * xe) / (2 * kk));
        world.position.y = hs / 2 - 0.3;
        const yc = (x) => a * x * x * s - hs; // lowest point at -hs, supports at 0
        const pts = []; for (let i = 0; i <= 60; i++) { const x = -L / 2 + L * i / 60; pts.push(V(x * s, yc(x), 0)); } tube(pts, 0.06, C.orange);
        for (const sg of [-1, 1]) add(mesh(new THREE.BoxGeometry(0.2, hs + 1.2, 0.3), C.sub), sg * 3.2, -hs / 2 + 0.1, 0);
        ln([[-3.2, 0, 0], [3.2, 0, 0]], C.sub);
        const hl = 0.35 + 0.7 * wl / 6; for (let i = 0; i <= 12; i++) { const x = -L / 2 + L * i / 12; ln([[x * s, 0, 0], [x * s, yc(x), 0]], C.sub); arrow(V(x * s, hl + 0.05, 0), down, hl, C.fg, 0.1, 0.06); }
        arrow(V(0, -hs, 0.1), right, 0.5 + 1.2 * Hh / 330, C.good, 0.2, 0.12);
        arrow(V(3.2, 0, 0.1), V(1, 4 * h / L, 0), 0.5 + 1.2 * Tm / 330, C.purple, 0.2, 0.12);
        note = tx(`Parabolik kablo: yatay bileşen H = wL²/(8h) = ${f2(Hh)} kN (yeşil; en alt noktada T = H minimumdur); mesnette teğet boyunca T_max = ${f2(Tm)} kN (mor); yay uzunluğu s ≈ ${f2(arcL)} m > L.`, `Parabolic cable: horizontal component H = wL²/(8h) = ${f2(Hh)} kN (green; T = H is the minimum at the lowest point); along the tangent at the support T_max = ${f2(Tm)} kN (purple); arc length s ≈ ${f2(arcL)} m > L.`);
      } else if (scn === 14) {
        const P = g(0), L = g(1), r = g(2), Ls = 1.5 * L, x0 = -Ls / 2, w0 = 0.6, N = 16, e0 = 0.3 + 0.9 * P / 60, k = (r - 1) / L;
        world.position.y = -0.5;
        const wid = (x) => w0 * (1 + k * x); const tp = [[x0, -w0 / 2], [-x0, -wid(L) / 2], [-x0, wid(L) / 2], [x0, w0 / 2]]; plate(tp, C.accent, 0.3, 0.3); outline(tp, C.accent, 0.16);
        for (let i = 0; i < N; i++) { const x = L * (i + 0.5) / N, t = (i + 0.5) / N; add(mesh(new THREE.BoxGeometry(Ls / N * 0.12, wid(x), 0.34), C.fg, { transparent: true, opacity: 0.6 }), x0 + Ls * t, 0, 0); }
        const al = 0.6 + 0.9 * P / 60; arrow(V(x0, 0, 0), V(-1, 0, 0), al, C.orange, 0.25, 0.16); arrow(V(-x0, 0, 0), V(1, 0, 0), al, C.orange, 0.25, 0.16);
        const yb = 1.3, prof = []; for (let i = 0; i <= 30; i++) { const t = i / 30; prof.push([x0 + Ls * t, e0 / (1 + k * L * t)]); }
        plate([[x0, yb]].concat(prof.map((q) => [q[0], q[1] + yb])).concat([[-x0, yb]]), C.orange, 0.45, 0.3); ln(prof.map((q) => [q[0], q[1] + yb, 0.16]), C.orange);
        const xi = 0.45, ie = e0 / (1 + k * L * xi); add(mesh(new THREE.BoxGeometry(Ls / 40 * 1.6, ie, 0.34), C.gold), x0 + Ls * xi, yb + ie / 2, 0); ln([[x0, yb, 0.16], [-x0, yb, 0.16]], C.sub);
        const dmm = P * 1000 * (L * 1000) * Math.log(r) / ((r - 1) * 200e3 * 200);
        note = tx(`Alanı doğrusal artan çubuk (A₁/A₀ = ${f2(r)}); turuncu eğri birim uzama ε(x) = P/(E·A(x)) (kalın uçta küçük). Eğrinin altındaki alan toplam uzamadır: δ = ∫ε dx = ${f2(dmm)} mm.`, `Bar whose area grows linearly (A₁/A₀ = ${f2(r)}); the orange curve is the strain ε(x) = P/(E·A(x)) (smaller at the thick end). The area under it is the total elongation: δ = ∫ε dx = ${f2(dmm)} mm.`);
      } else {
        const D = g(0), M = g(1), b = D / Math.sqrt(3), h = D * Math.sqrt(2 / 3), Rr = D / 400 * 1.5, sc = Rr / (D / 2), S0 = b * h * h / 6, sig = M * 1e6 / S0, Xw = 3.0, Hh = 0.8 + 1.4 * (D / 400) ** 3;
        world.position.set(-1.0, -0.9, 0);
        const lg = gh(new THREE.CylinderGeometry(Rr, Rr, 1.2, 48, 1, false), C.good, 0.2); lg.rotation.x = Math.PI / 2; add(lg, -1.2, 1.6, 0);
        add(mesh(new THREE.BoxGeometry(b * sc, h * sc, 1.25), C.orange, { transparent: true, opacity: 0.85 }), -1.2, 1.6, 0);
        const al = 0.2 + 0.6 * Math.min(1, sig / 60); arrow(V(-1.2 + b * sc / 2 + 0.05, 1.6 + h * sc / 2, 0.7), down, al, C.bad, 0.1, 0.07); arrow(V(-1.2 + b * sc / 2 + 0.05, 1.6 - h * sc / 2, 0.7), up, al, C.good, 0.1, 0.07);
        const N = 40, cv = [[0.9, 0]]; for (let i = 1; i < N; i++) { const bb = D * i / N; cv.push([0.9 + Xw * i / N, Hh * (bb * (D * D - bb * bb) / 6) / (D ** 3 / (9 * Math.sqrt(3)))]); } cv.push([0.9 + Xw, 0]);
        plate(cv, C.accent, 0.35, 0.3); ln(cv.map((q) => [q[0], q[1], 0.16]), C.accent); ln([[0.9, 0, 0.16], [Xw + 1.2, 0, 0.16]], C.sub);
        const xo = 0.9 + Xw / Math.sqrt(3); ln([[xo, 0, 0.17], [xo, Hh, 0.17]], C.gold); dot(xo, Hh, 0.17, 0.1, C.gold);
        note = tx(`Kütükten (yeşil daire) kesilen dikdörtgen b² + h² = D²; S(b) = b(D² − b²)/6 eğrisi (mavi) b = D/√3 = ${f2(b)} mm'de tepe yapar (altın), h = ${f2(h)} mm; S = ${f2(S0)} mm³, σ = M/S = ${f2(sig)} MPa.`, `The rectangle cut from the log (green circle) obeys b² + h² = D²; the curve S(b) = b(D² − b²)/6 (blue) peaks (gold) at b = D/√3 = ${f2(b)} mm, h = ${f2(h)} mm; S = ${f2(S0)} mm³; σ = M/S = ${f2(sig)} MPa.`);
      }
      return note;
    };
    return { update: upd };
  };
  const d = Topics.get('engineering').find((x) => x.id === 'engStatics'); if (d) d.view3d = { build: builder, dist: 10 };
})();
