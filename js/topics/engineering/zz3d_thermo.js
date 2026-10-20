// 3D views for all 16 scenarios of the engineering tab engThermoFluid (overrides the 3 scenes of v3attach.js).
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const G = 9.81, GAM = 1.4;
  const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const nz = (v, d) => (Number.isFinite(v) ? v : d);
  const f2 = (v) => String(Math.round(nz(v, 0) * 100) / 100);

  const builder = ({ THREE, world, C, V3 }) => {
    const col = (c) => new THREE.Color(c);
    const tcol = (f) => new THREE.Color().setHSL(0.66 * (1 - cl(nz(f, 0), 0, 1)), 0.8, 0.5).getStyle();
    const arrow = (from, dir, len, color, hl, hw) => new THREE.ArrowHelper(dir.clone().normalize(), from, Math.max(len, 0.05), col(color).getHex(), Math.min(hl === undefined ? 0.2 : hl, Math.max(len, 0.05) * 0.9), hw === undefined ? 0.1 : hw);
    const ball = (x, y, z, r, color) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), V3.mat(color)); m.position.set(x, y, z || 0); return m; };
    const L3 = (pts, color) => V3.line(pts.map((q) => [q[0], q[1], q[2] || 0]), color);
    // graph box: x in [a,b] -> [X0,X0+W], y in [y0,y1] -> [Y0,Y0+H]
    const box = (a, b, y0, y1, W, H, X0, Y0) => ({ X: (x) => X0 + W * (x - a) / (b - a || 1), Y: (y) => Y0 + H * (y - y0) / (y1 - y0 || 1), W, H, X0, Y0 });
    const axes = (g) => { world.add(L3([[g.X0, g.Y0], [g.X0 + g.W + 0.2, g.Y0]], C.sub)); world.add(L3([[g.X0, g.Y0], [g.X0, g.Y0 + g.H + 0.2]], C.sub)); };
    // solid plate between a polyline (screen coords) and the baseline yb, z in [z0,z1]
    const mk = (sh, z0, z1, color, op) => {
      const geo = new THREE.ExtrudeGeometry(sh, { depth: Math.max(z1 - z0, 0.02), bevelEnabled: false }); geo.translate(0, 0, z0);
      return new THREE.Mesh(geo, op ? V3.mat(color, { transparent: true, opacity: op }) : V3.mat(color));
    };
    const area = (pts, yb, z0, z1, color, op) => {
      const sh = new THREE.Shape(); sh.moveTo(pts[0][0], yb); pts.forEach((q) => sh.lineTo(q[0], q[1])); sh.lineTo(pts[pts.length - 1][0], yb); sh.lineTo(pts[0][0], yb);
      return mk(sh, z0, z1, color, op);
    };
    const polyArea = (pts, z0, z1, color, op) => {
      const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); pts.forEach((q) => sh.lineTo(q[0], q[1])); sh.lineTo(pts[0][0], pts[0][1]);
      return mk(sh, z0, z1, color, op);
    };
    const curve = (f, a, b, n, g) => { const o = []; for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; o.push([g.X(x), g.Y(nz(f(x), 0))]); } return o; };
    const reset = () => { world.position.set(0, 0, 0); world.scale.setScalar(1); };
    // slab of n slices coloured by tf(u), u in [0,1] across the thickness
    const slab = (xa, xb, h, d, n, tf) => { const dx = (xb - xa) / n; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(dx * 1.001, h, d), V3.mat(tcol(tf((i + 0.5) / n)), { transparent: true, opacity: 0.85 })); m.position.set(xa + dx * (i + 0.5), 0, 0); world.add(m); } };

    // shared cost-vs-size scene (indices 7 and 14)
    const costScene = (f1, fp, a, b, xs, ring, c1, c2) => {
      const fs = (x) => f1(x) + fp(x);
      let ymax = 0; for (let i = 0; i <= 60; i++) ymax = Math.max(ymax, fs(a + (b - a) * i / 60));
      ymax = Math.max(Math.min(ymax, 2.2 * fs(xs)), 1e-9); const g = box(a, b, 0, ymax, 5.4, 2.8, -3.2, -1.7); axes(g);
      const clip = (f) => (x) => Math.min(f(x), ymax);
      world.add(area(curve(clip(fs), a, b, 80, g), g.Y0, -0.12, 0.12, C.orange, 0.45));
      world.add(L3(curve(clip(fs), a, b, 80, g), C.orange)); world.add(L3(curve(clip(f1), a, b, 60, g).map((q) => [q[0], q[1], 0.3]), c1)); world.add(L3(curve(clip(fp), a, b, 60, g).map((q) => [q[0], q[1], -0.3]), c2));
      const v = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), V3.ghost(C.gold, 0.25)); v.scale.set(0.9, 2.8, 1); v.rotation.y = Math.PI / 2; v.position.set(g.X(xs), g.Y0 + 1.4, 0); world.add(v);
      world.add(ball(g.X(xs), g.Y(Math.min(fs(xs), ymax)), 0, 0.14, C.gold));
      const rin = 0.22, rr = rin + 0.55 * cl(ring, 0, 1);
      const rg = new THREE.Mesh(new THREE.RingGeometry(rin, rr + 0.02, 40), V3.mat(C.accent, { side: THREE.DoubleSide })); rg.position.set(2.5, 1.7, 0.2); world.add(rg);
      const core = new THREE.Mesh(new THREE.CircleGeometry(rin, 32), V3.mat(C.bad, { side: THREE.DoubleSide })); core.position.set(2.5, 1.7, 0.2); world.add(core);
    };

    const upd = {
      0(x) { // Newton cooling: T(t) and slope at t
        const Ta = x[0], T0 = x[1], k = x[2], t = x[3], Tm = 24;
        const f = (s) => Ta + (T0 - Ta) * Math.exp(-k * s); const g = box(0, Tm, Ta - 5, 105, 6, 3, -3, -1.5); axes(g);
        world.add(area(curve(f, 0, Tm, 60, g), g.Y(Ta), -0.2, 0.2, C.accent, 0.55)); world.add(L3(curve(f, 0, Tm, 60, g), C.accent));
        world.add(L3([[g.X(0), g.Y(Ta)], [g.X(Tm), g.Y(Ta)]], C.good)); const T = f(t), sl = -k * (T - Ta) * (g.H / 110) / (g.W / Tm);
        world.add(ball(g.X(t), g.Y(T), 0, 0.14, C.gold)); world.add(L3([[g.X(t), g.Y(Ta)], [g.X(t), g.Y(T)]], C.gold));
        world.add(L3([[g.X(t) - 0.9, g.Y(T) - sl * 0.9], [g.X(t) + 0.9, g.Y(T) + sl * 0.9]], C.orange));
        const blk = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), V3.mat(tcol((T - Ta) / (T0 - Ta + 1e-9)))); blk.position.set(g.X(t), g.Y(T) + 0.55, 0); world.add(blk);
        return tx(`Mavi levha T(t) = Tₐ + (T₀ − Tₐ)e^(−kt) eğrisinin altındaki alandır; yeşil çizgi ortam sıcaklığı, altın nokta t = ${f2(t)} dk anı (T = ${f2(T)} °C), turuncu doğru o andaki teğet (soğuma hızı).`, `The blue plate lies under T(t) = Tₐ + (T₀ − Tₐ)e^(−kt); the green line is the ambient temperature, the gold dot is t = ${f2(t)} min (T = ${f2(T)} °C) and the orange line is the tangent there (cooling rate).`);
      },
      1(x) { // time to reach a target
        const T0 = x[0], Tt = x[1], k = Math.max(x[2], 1e-3), ts = Math.log(Math.max((T0 - 20) / Math.max(Tt - 20, 1e-6), 1.0001)) / k, Tm = ts * 1.5;
        const f = (s) => 20 + (T0 - 20) * Math.exp(-k * s); const g = box(0, Tm, 15, T0 + 5, 6, 3, -3, -1.5); axes(g);
        world.add(area(curve(f, 0, Tm, 60, g), g.Y(20), -0.2, 0.2, C.accent, 0.55)); world.add(L3(curve(f, 0, Tm, 60, g), C.accent));
        const hp = new THREE.Mesh(new THREE.PlaneGeometry(g.W, 0.7), V3.ghost(C.orange, 0.3)); hp.rotation.x = Math.PI / 2; hp.position.set(g.X0 + g.W / 2, g.Y(Tt), 0); world.add(hp);
        world.add(L3([[g.X(ts), g.Y(20)], [g.X(ts), g.Y(Tt)]], C.gold)); world.add(ball(g.X(ts), g.Y(Tt), 0, 0.15, C.gold));
        return tx(`Turuncu yatay düzlem hedef sıcaklık T* = ${f2(Tt)} °C; soğuma eğrisi ona t = ${f2(ts)} dk'da ulaşır (altın nokta).`, `The orange horizontal plane is the target T* = ${f2(Tt)} °C; the cooling curve reaches it at t = ${f2(ts)} min (gold dot).`);
      },
      2(x) { // wall conduction
        const Th = x[0], Tc = x[1], L = x[2], k = x[3], q = k * (Th - Tc) / L, w = 1.6 + 7 * L;
        slab(-w / 2, w / 2, 1.5, 1.4, 16, (u) => 1 - u);
        const yy = (u) => 1.0 + 1.1 * (Th + (Tc - Th) * u - 20) / 180; const pr = []; for (let i = 0; i <= 20; i++) { const u = i / 20; pr.push([-w / 2 + w * u, yy(u), 0.9]); }
        world.add(L3(pr, C.orange)); world.add(area(pr, 0.8, 0.8, 1.0, C.orange, 0.35));
        const len = 0.5 + 1.2 * cl(q / 3600, 0, 1);
        [-0.4, 0, 0.4].forEach((z) => [-0.35, 0.35].forEach((y) => world.add(arrow(new THREE.Vector3(-w / 2 - len - 0.1, y, z), new THREE.Vector3(1, 0, 0), len, C.bad, 0.2, 0.12))));
        return tx(`Duvar L = ${f2(L)} m: renk sıcaklığı (kırmızı sıcak yüz, mavi soğuk yüz), turuncu şerit T(x) doğrusal profilidir; oklar q = k·ΔT/L = ${f2(q)} W/m² ısı akısını gösterir.`, `Wall L = ${f2(L)} m: colour is temperature (red hot face, blue cold face), the orange ribbon is the linear profile T(x); the arrows show the heat flux q = k·ΔT/L = ${f2(q)} W/m².`);
      },
      3(x) { // variable specific heat: volume = m * area under c(T)
        const m = x[0], a = x[1], b = x[2] / 1000, T2 = Math.max(x[3], 21), c = (T) => a + b * T, Q = m * (a * (T2 - 20) + b / 2 * (T2 * T2 - 400));
        const g = box(0, 320, 0, 3.8, 5.6, 2.8, -3, -1.5); axes(g); const d = 0.25 * m;
        world.add(area(curve(c, 20, T2, 60, g), g.Y(0), -d / 2, d / 2, C.accent, 0.6)); world.add(L3(curve(c, 20, T2, 60, g).map((q) => [q[0], q[1], d / 2]), C.orange));
        world.add(L3([[g.X(T2), g.Y(0), -d / 2], [g.X(T2), g.Y(c(T2)), -d / 2]], C.gold));
        return tx(`c(T) eğrisinin altındaki alan (T = 20…${f2(T2)} °C) kütle m = ${f2(m)} kg ile derinliğe uzatılmıştır: hacim ∝ Q = m∫c dT ≈ ${f2(Q)} kJ.`, `The area under c(T) (T = 20…${f2(T2)} °C) is extruded in depth by the mass m = ${f2(m)} kg: the volume is Q = m∫c dT ≈ ${f2(Q)} kJ.`);
      },
      4(x) { // Torricelli tank
        const h0 = x[0], A = Math.max(x[1], 0.1), a = x[2] / 1e4, R = 0.5 * Math.sqrt(A), H = 0.35 * h0 + 0.3, v = Math.sqrt(2 * G * h0), rate = a / A * v;
        world.position.y = -H / 2;
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 40, 1, true), V3.ghost(C.fg, 0.12)); tank.position.y = H / 2; world.add(tank);
        const w = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.99, R * 0.99, H * 0.95, 40), V3.ghost(C.accent, 0.35)); w.position.y = H * 0.95 / 2; world.add(w);
        const hole = Math.sqrt(a) * 1.4 + 0.04; const hl = new THREE.Mesh(new THREE.CylinderGeometry(hole, hole, 0.08, 20), V3.mat(C.bad)); hl.rotation.z = Math.PI / 2; hl.position.set(R, 0.1, 0); world.add(hl);
        const L = 0.5 + 1.6 * Math.sqrt(h0 / 9); world.add(arrow(new THREE.Vector3(R + 0.05, 0.1, 0), new THREE.Vector3(1, 0, 0), L, C.orange, 0.22, 0.14));
        const jet = []; for (let i = 0; i <= 20; i++) { const s = L * i / 20; jet.push([R + 0.05 + s, 0.1 - 0.35 * s * s / (L * L + 1e-9), 0]); } world.add(L3(jet, C.accent));
        world.add(arrow(new THREE.Vector3(0, H * 0.95, 0), new THREE.Vector3(0, -1, 0), cl(0.4 + 1.6 * rate / 0.9, 0.3, H * 0.6), C.good, 0.18, 0.12));
        world.add(L3([[-R, H * 0.95, 0], [R, H * 0.95, 0]], C.gold));
        return tx(`Tank h₀ = ${f2(h0)} m, A = ${f2(A)} m²; delikten turuncu ok Torricelli hızı v = √(2gh) = ${f2(v)} m/s ile çıkar, yeşil ok seviye düşüş hızı dh/dt = −(a/A)v = −${f2(rate)} m/s.`, `Tank h₀ = ${f2(h0)} m, A = ${f2(A)} m²; the orange arrow is the Torricelli jet v = √(2gh) = ${f2(v)} m/s, the green arrow is the level fall rate dh/dt = −(a/A)v = −${f2(rate)} m/s.`);
      },
      5(x) { // pipe flow rate = volume of the velocity paraboloid
        const vm = x[0], Rp = x[1], R = 0.6 + 7 * Rp, hh = 2.6 * cl(vm / 4, 0.05, 1.2), Q = Math.PI * Rp * Rp * vm / 2 * 1000;
        world.position.y = -1.1;
        const pts = []; for (let i = 0; i <= 30; i++) { const r = R * i / 30; pts.push([r, hh * (1 - (r * r) / (R * R))]); }
        world.add(V3.lathe(pts.concat([[0, 0]]), V3.ghost(C.accent, 0.4)));
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(R, R, hh, 40, 1, true), V3.ghost(C.fg, 0.1)); cyl.position.y = hh / 2; world.add(cyl);
        const rs = 0.6 * R, sh = hh * (1 - 0.36), shell = new THREE.Mesh(new THREE.CylinderGeometry(rs + 0.06, rs + 0.06, sh, 40, 1, true), V3.mat(C.orange, { side: THREE.DoubleSide, transparent: true, opacity: 0.85 })); shell.position.y = sh / 2; world.add(shell);
        const cir = []; for (let i = 0; i <= 64; i++) { const a = 2 * Math.PI * i / 64; cir.push([R * Math.cos(a), 0, R * Math.sin(a)]); } world.add(L3(cir, C.sub));
        return tx(`Paraboloit yüzey v(r) = v_max(1 − r²/R²) profilidir; altındaki hacim debi Q = ∫v·2πr dr = ${f2(Q)} L/s (silindirin yarısı). Turuncu silindirik kabuk 2πr·dr halkasıdır.`, `The paraboloid surface is the profile v(r) = v_max(1 − r²/R²); the volume under it is the flow Q = ∫v·2πr dr = ${f2(Q)} L/s (half the cylinder). The orange cylindrical shell is the 2πr·dr ring.`);
      },
      6(x) { // isothermal expansion: p-V hyperbola, area = work, piston-cylinder
        const n = x[0], T = x[1], V1 = Math.max(x[2], 1), r = Math.max(x[3], 1.01), V2 = V1 * r, p1 = n * 8.314 * T / (V1 / 1000), W = n * 8.314 * T * Math.log(r);
        const g = box(0, V2 * 1.05, 0, p1 * 1.1, 5.6, 2.0, -3, -0.7); axes(g); const f = (V) => n * 8.314 * T / (V / 1000);
        world.add(area(curve(f, V1, V2, 60, g), g.Y(0), -0.25, 0.25, C.accent, 0.6)); world.add(L3(curve(f, V1, V2, 60, g), C.accent));
        world.add(L3([[g.X(V1), g.Y0], [g.X(V1), g.Y(p1)]], C.gold)); world.add(ball(g.X(V1), g.Y(p1), 0, 0.12, C.gold)); world.add(ball(g.X(V2), g.Y(f(V2)), 0, 0.12, C.gold));
        const Lc = 5.6, Lx = Lc * V1 / V2, yc = -1.6;
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, Lc, 36, 1, true), V3.ghost(C.fg, 0.14)); cyl.rotation.z = Math.PI / 2; cyl.position.set(-3 + Lc / 2, yc, 0); world.add(cyl);
        const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, Lc, 36), V3.ghost(tcol((T - 300) / 400 * 0.8 + 0.1), 0.35)); gas.rotation.z = Math.PI / 2; gas.position.set(-3 + Lc / 2, yc, 0); world.add(gas);
        const pis = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 30), V3.mat(C.sub)); pis.rotation.z = Math.PI / 2; pis.position.set(-3 + Lc, yc, 0); world.add(pis);
        const p0 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 30), V3.mat(C.good, { transparent: true, opacity: 0.6 })); p0.rotation.z = Math.PI / 2; p0.position.set(-3 + Lx, yc, 0); world.add(p0);
        world.add(arrow(new THREE.Vector3(-3.45, yc + 0.9, 0), new THREE.Vector3(1, 0, 0), 0.3 + 1.2 * cl(W / 21000, 0, 1), C.bad, 0.2, 0.12));
        return tx(`İzotermal genleşme: p = nRT/V hiperbolünün V₁ = ${f2(V1)} L → V₂ = ${f2(V2)} L arası altındaki mavi alan W = nRT·ln(V₂/V₁) = ${f2(W / 1000)} kJ; silindirde yeşil levha başlangıç, gri piston son konum; kırmızı ok içeri giren ısı Q = W.`, `Isothermal expansion: the blue area under p = nRT/V from V₁ = ${f2(V1)} L to V₂ = ${f2(V2)} L is W = nRT·ln(V₂/V₁) = ${f2(W / 1000)} kJ; in the cylinder the green plate is the start, the grey piston the end; the red arrow is the heat input Q = W.`);
      },
      7(x) { // cheapest insulation thickness
        const a = Math.max(x[0], 0.1), b = Math.max(x[1], 1), xs = Math.max(Math.sqrt(b / a) - 2, 0.01), xm = Math.max(2 * xs + 2, 6);
        costScene((s) => a * s, (s) => b / (s + 2), 0, xm, xs, xs / xm, C.good, C.bad);
        return tx(`Turuncu eğri toplam maliyet C(x) = a·x + b/(x + 2); yeşil çizgi yalıtım, kırmızı çizgi ısı kaybı maliyeti. Altın düzlem en ucuz kalınlık x* = ${f2(xs)} cm; sağ üstteki halka bu kalınlığı gösterir.`, `The orange curve is the total cost C(x) = a·x + b/(x + 2); the green line is insulation cost, the red line heat-loss cost. The gold plane is the cheapest thickness x* = ${f2(xs)} cm; the ring at top right shows that thickness.`);
      },
      8(x) { // Otto cycle p-V
        const g1 = GAM, p1 = x[0], V1 = Math.max(x[1], 0.1), r = Math.max(x[2], 1.5), rho = Math.max(x[3], 1.1), V2 = V1 / r, p2 = p1 * Math.pow(r, g1), p3 = rho * p2, K1 = p1 * Math.pow(V1, g1), K2 = p3 * Math.pow(V2, g1);
        const g = box(0, V1 * 1.05, 0, p3 * 1.05, 5.6, 3.0, -3, -1.5); axes(g);
        const comp = [], ex = []; for (let i = 0; i <= 30; i++) { const V = V1 + (V2 - V1) * i / 30; comp.push([g.X(V), g.Y(K1 / Math.pow(V, g1))]); } for (let i = 0; i <= 30; i++) { const V = V2 + (V1 - V2) * i / 30; ex.push([g.X(V), g.Y(K2 / Math.pow(V, g1))]); }
        world.add(area(ex, g.Y(0), 0.3, 0.42, C.good, 0.35)); world.add(area(comp, g.Y(0), -0.42, -0.3, C.bad, 0.35));
        const loop = comp.concat(ex); world.add(polyArea(loop, -0.15, 0.15, C.accent)); world.add(L3(loop.concat([loop[0]]), C.fg));
        const p4 = K2 / Math.pow(V1, g1); [[V1, p1], [V2, p2], [V2, p3], [V1, p4]].forEach((s, i) => world.add(ball(g.X(s[0]), g.Y(s[1]), 0.2, 0.13, [C.orange, C.gold, C.bad, C.purple][i])));
        const W12 = K1 * (Math.pow(V2, 1 - g1) - Math.pow(V1, 1 - g1)) / (1 - g1), W34 = K2 * (Math.pow(V1, 1 - g1) - Math.pow(V2, 1 - g1)) / (1 - g1), Wn = W12 + W34, eta = 1 - Math.pow(r, 1 - g1);
        return tx(`Mavi levha çevrimin p–V alanıdır (net iş W = ${f2(Wn)} kPa·L, η = ${f2(eta * 100)} %); yeşil levha genleşme (3→4), kırmızı levha sıkıştırma (1→2) altındaki alandır, fark net iştir.`, `The blue plate is the p–V area of the cycle (net work W = ${f2(Wn)} kPa·L, η = ${f2(eta * 100)} %); the green plate is the area under expansion (3→4), the red under compression (1→2); their difference is the net work.`);
      },
      9(x) { // laminar pipe flow
        const mu = Math.max(x[0], 1) / 1000, Gp = x[1], Rm = x[2] / 1000, um = Gp * Rm * Rm / (4 * mu), tw = Gp * Rm / 2, Q = Math.PI * Gp * Math.pow(Rm, 4) / (8 * mu);
        const R = 0.6 + 70 * Rm, Lp = 5, ul = 0.15 + 2.5 * cl(um / 2, 0, 1);
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(R, R, Lp, 48, 1, true), V3.ghost(C.accent, 0.2)); pipe.rotation.z = Math.PI / 2; world.add(pipe);
        for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const y = i * R / 3.3, z = j * R / 3.3, r2 = (y * y + z * z) / (R * R); if (r2 > 1) continue; world.add(arrow(new THREE.Vector3(-Lp / 2, y, z), new THREE.Vector3(1, 0, 0), ul * (1 - r2) + 0.05, C.orange, 0.1, 0.06)); }
        const pr = []; for (let i = -20; i <= 20; i++) { const y = R * i / 20; pr.push([-Lp / 2 + ul * (1 - y * y / (R * R)), y, 0]); } world.add(L3(pr, C.good));
        const tl = 0.2 + 0.8 * cl(tw / 4, 0, 1); [1, -1].forEach((s) => world.add(arrow(new THREE.Vector3(0.3, s * R, 0), new THREE.Vector3(1, 0, 0), tl, C.bad, 0.12, 0.08)));
        return tx(`Poiseuille akışı: yeşil parabol u(r) = u_max(1 − r²/R²) profili (u_max = ${f2(um)} m/s), kırmızı oklar duvar kayma gerilmesi τ_w = −μ·du/dr = ${f2(tw)} Pa; debi Q = ${f2(Q * 1e6)} mL/s.`, `Poiseuille flow: the green parabola is the profile u(r) = u_max(1 − r²/R²) (u_max = ${f2(um)} m/s), the red arrows are the wall shear stress τ_w = −μ·du/dr = ${f2(tw)} Pa; flow rate Q = ${f2(Q * 1e6)} mL/s.`);
      },
      10(x) { // cylindrical pipe wall
        const Ti = x[0], To = x[1], ri = Math.max(x[2], 0.5), t = Math.max(x[3], 0.5), k = x[4], ro = ri + t, s = 1.9 / ro, Ri = ri * s, Ro = ro * s, Lp = 3.0, ln = Math.log(ro / ri), Q = 2 * Math.PI * k * (Ti - To) / ln;
        const N = 14, Tr = (r) => (Ti - (Ti - To) * Math.log(r / ri) / ln - To) / Math.max(Ti - To, 1e-9);
        for (let i = 0; i < N; i++) {
          const r0 = ri + t * i / N, r1 = ri + t * (i + 1) / N, rm = (r0 + r1) / 2, a = r0 * s, b = r1 * s, cc = tcol(Tr(rm));
          world.add(new THREE.Mesh(new THREE.CylinderGeometry(b, b, Lp, 48, 1, true, 0, Math.PI * 1.5), V3.mat(cc, { side: THREE.DoubleSide })));
          const m2 = new THREE.Mesh(new THREE.RingGeometry(a, b, 48, 1, 0, Math.PI * 1.5), V3.mat(cc, { side: THREE.DoubleSide })); m2.rotation.x = Math.PI / 2; m2.position.y = Lp / 2; world.add(m2);
        }
        world.add(new THREE.Mesh(new THREE.CylinderGeometry(Ri, Ri, Lp, 40, 1, true), V3.ghost(C.bad, 0.15)));
        for (let kk = 0; kk < 4; kk++) {
          const a = Math.PI * 1.75 + 0.35 + kk * 0.25, d = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
          world.add(arrow(d.clone().multiplyScalar(Ri), d, 0.7, C.orange, 0.15, 0.09)); world.add(arrow(d.clone().multiplyScalar(Ro + 0.05), d, 0.7 * ri / ro, C.orange, 0.1, 0.06));
        }
        const pr = []; for (let i = 0; i <= 24; i++) { const r = ri + t * i / 24; pr.push([r * s, Lp / 2 + 0.2 + 0.9 * Tr(r), 0]); } world.add(L3(pr, C.good));
        return tx(`Duvar ısı akışı radyal (iç oklar uzun, dış oklar kısa: akı 1/r ile azalır); kesit renkleri T(r) = Tᵢ − (Tᵢ − T_o)·ln(r/rᵢ)/ln(rₒ/rᵢ); yeşil çizgi ln r profili, Q/L = ${f2(Q)} W/m.`, `Heat flow is radial (long inner arrows, short outer ones: flux falls like 1/r); the layer colours are T(r) = Tᵢ − (Tᵢ − T_o)·ln(r/rᵢ)/ln(rₒ/rᵢ); the green line is the ln r profile, Q/L = ${f2(Q)} W/m.`);
      },
      11(x) { // wall with k(T)
        const k0 = x[0], be = Math.max(x[1] / 1000, 1e-6), Th = x[2], Tc = x[3], L = x[4], q = (k0 / L) * ((Th - Tc) + be / 2 * (Th * Th - Tc * Tc));
        const Tx = (xx) => (-1 + Math.sqrt(Math.max(0, 1 + 2 * be * (Th + be * Th * Th / 2 - q * xx / k0)))) / be, nrm = (xx) => cl((Tx(xx) - Tc) / Math.max(Th - Tc, 1e-9), 0, 1.2);
        const w = 1.6 + 10 * L; slab(-w / 2, w / 2, 1.4, 1.4, 18, (u) => nrm(u * L)); world.position.y = -0.8;
        const pr = [], lin = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pr.push([-w / 2 + w * u, 1.0 + 1.4 * nrm(u * L), 0.9]); lin.push([-w / 2 + w * u, 1.0 + 1.4 * (1 - u), 0.9]); }
        world.add(L3(pr, C.orange)); world.add(L3(lin, C.sub)); world.add(area(pr, 0.75, 0.8, 1.0, C.orange, 0.35));
        world.add(arrow(new THREE.Vector3(-w / 2 - 1.1, 0, 0), new THREE.Vector3(1, 0, 0), 1.0, C.bad, 0.2, 0.12));
        return tx(`k = k₀(1 + βT) olduğundan sıcaklık profili doğrusal değil: turuncu eğri gerçek T(x), gri çizgi sabit k için doğrusal profildir; q = ${f2(q)} W/m² her kesitte aynıdır.`, `Because k = k₀(1 + βT) the profile is not linear: the orange curve is the true T(x), the grey line is the constant-k straight profile; q = ${f2(q)} W/m² is the same at every section.`);
      },
      12(x) { // lumped capacitance
        const m = x[0], c = x[1], hA = Math.max(x[2], 1), Ti = x[3], tm = x[4], Tinf = 20, tau = m * c / hA, Tm = 1200, ts = tm * 60;
        const f = (s) => Tinf + (Ti - Tinf) * Math.exp(-s / tau); const g = box(0, Tm, 0, 125, 5.2, 2.8, -2.6, -1.5); axes(g);
        world.add(L3(curve(f, 0, Tm, 80, g), C.accent)); world.add(area(curve(f, 0, ts, 60, g), g.Y(Tinf), -0.22, 0.22, C.orange, 0.6));
        world.add(L3([[g.X(0), g.Y(Tinf)], [g.X(Tm), g.Y(Tinf)]], C.good)); world.add(ball(g.X(ts), g.Y(f(ts)), 0, 0.14, C.gold)); world.add(L3([[g.X(ts), g.Y(Tinf)], [g.X(ts), g.Y(f(ts))]], C.gold));
        if (tau <= Tm) world.add(L3([[g.X(0), g.Y(Ti)], [g.X(tau), g.Y(Tinf)]], C.purple));
        const blk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), V3.mat(tcol((f(ts) - Tinf) / Math.max(Ti - Tinf, 1)))); blk.position.set(-3.1, 1.9, 0); world.add(blk);
        return tx(`Motor bloğu T(t) = T∞ + (Tᵢ − T∞)e^(−t/τ), τ = mc/hA = ${f2(tau)} s; turuncu levha t = ${f2(tm)} dk'ya kadar atılan ısıyı (∫hA(T − T∞)dt) gösterir, mor çizgi zaman sabiti teğetidir; blok rengi o andaki sıcaklık.`, `Engine block T(t) = T∞ + (Tᵢ − T∞)e^(−t/τ), τ = mc/hA = ${f2(tau)} s; the orange plate is the heat removed up to t = ${f2(tm)} min (∫hA(T − T∞)dt), the purple line is the time-constant tangent; the block colour is the temperature at that instant.`);
      },
      13(x) { // solar collector P = Pm sin(pi t/T)
        const Pm = x[0], T = Math.max(x[1], 1), m = Math.max(x[2], 1), E = 2 * Pm * T / Math.PI, dT = E * 3600 / (m * 4.18), P = (t) => Pm * Math.sin(Math.PI * t / T);
        const g = box(0, 12, 0, 4.2, 4.8, 2.6, -3.4, -1.5); axes(g);
        world.add(area(curve(P, 0, T, 60, g), g.Y(0), -0.25, 0.25, C.gold, 0.7)); world.add(L3(curve(P, 0, T, 60, g), C.orange));
        world.add(L3([[g.X(T / 2), g.Y(0)], [g.X(T / 2), g.Y(Pm)]], C.bad));
        const H = 1.5 + 0.8 * cl((m - 500) / 1000, 0, 1), Rr = 0.55;
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(Rr, Rr, H, 36), V3.mat(tcol(cl(dT / 60, 0, 1)), { transparent: true, opacity: 0.85 })); tank.position.set(2.6, -1.5 + H / 2, 0); world.add(tank);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(Rr * 1.04, Rr * 1.04, H, 36, 1, true), V3.ghost(C.fg, 0.15)); rim.position.copy(tank.position); world.add(rim);
        return tx(`Altın levha P(t) = P_max·sin(πt/T) yarım sinüsünün altındaki alan: E = ∫P dt = ${f2(E)} kWh; sağdaki depo (m = ${f2(m)} kg) bu enerjiyle ΔT ≈ ${f2(dT)} K ısınır (renk).`, `The gold plate under the half-sine P(t) = P_max·sin(πt/T) is E = ∫P dt = ${f2(E)} kWh; the tank at right (m = ${f2(m)} kg) warms by ΔT ≈ ${f2(dT)} K with it (colour).`);
      },
      14(x) { // most economical pipe diameter
        const a = Math.max(x[0], 1), B = Math.max(x[1], 1) * 1e6, Ds = Math.pow(5 * B / a, 1 / 6), xa = 0.4 * Ds, xb = 2 * Ds;
        costScene((D) => a * D, (D) => B / Math.pow(D, 5), xa, xb, Ds, (Ds - xa) / (xb - xa), C.good, C.bad);
        return tx(`Turuncu eğri toplam maliyet C(D) = a·D + B/D⁵; yeşil çizgi boru, kırmızı çizgi pompalama maliyeti. Altın düzlem en ekonomik çap D* = ${f2(Ds)} cm; sağ üstteki halka bu çapı gösterir.`, `The orange curve is the total cost C(D) = a·D + B/D⁵; the green line is pipe cost, the red line pumping cost. The gold plane is the most economical diameter D* = ${f2(Ds)} cm; the ring at top right shows that diameter.`);
      },
      15(x) { // hydrostatic inclined gate
        const w = x[0], s1 = x[1], Lg = Math.max(x[2], 0.5), th = x[3] * Math.PI / 180, s2 = s1 + Lg, sn = Math.sin(th), cs = Math.cos(th), sc = 3.2 / Math.max(s2, 2), zw = Math.max(w * sc * 0.8, 0.3);
        const M = (Math.pow(s2, 3) - Math.pow(s1, 3)) / 3, F = (s2 * s2 - s1 * s1) / 2, scp = M / Math.max(F, 1e-9), Fk = 9.81 * w * sn * F;
        const P = (s) => [s * cs * sc, -s * sn * sc], X1 = s2 * cs * sc + 1.0;
        world.position.set(-X1 / 2, s2 * sn * sc / 2, 0);
        world.add(polyArea([[0, 0], [X1, 0], [X1, -s2 * sn * sc], [s2 * cs * sc, -s2 * sn * sc]], -zw / 2, zw / 2, C.accent, 0.18));
        const a = P(s1), b = P(s2), gl = Math.hypot(b[0] - a[0], b[1] - a[1]), gate = new THREE.Mesh(new THREE.BoxGeometry(gl, 0.1, zw), V3.mat(C.orange));
        gate.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0); gate.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]); world.add(gate);
        world.add(L3([[-0.4, 0], [X1, 0]], C.accent));
        const nw = new THREE.Vector3(sn, cs, 0), dir = nw.clone().multiplyScalar(-1);
        for (let k = 0; k <= 8; k++) { const s = s1 + Lg * k / 8, pt = P(s), len = Math.max(s * sn * sc * 0.55, 0.08); world.add(arrow(new THREE.Vector3(pt[0] + nw.x * len, pt[1] + nw.y * len, 0), dir, len, C.bad, Math.min(0.15, len * 0.8), 0.08)); }
        const pc = P(scp), pg = P((s1 + s2) / 2); world.add(ball(pc[0], pc[1], zw / 2 + 0.05, 0.12, C.gold)); world.add(ball(pg[0], pg[1], zw / 2 + 0.05, 0.1, C.good));
        return tx(`Eğik kapak (θ = ${f2(x[3])}°): kırmızı oklar derinlikle doğrusal artan basıncı gösterir; F = ∫ρg·s·sinθ·w ds = ${f2(Fk)} kN. Yeşil nokta kapak ağırlık merkezi, altın nokta basınç merkezi (daha aşağıda, s = ${f2(scp)} m).`, `Inclined gate (θ = ${f2(x[3])}°): the red arrows show pressure growing linearly with depth; F = ∫ρg·s·sinθ·w ds = ${f2(Fk)} kN. The green dot is the gate centroid, the gold dot the centre of pressure (lower, at s = ${f2(scp)} m).`);
      },
    };

    return { update(p) {
      reset();
      const scn = cl(Math.round(nz(p && p.scn, 0)), 0, 15), x = [0, 1, 2, 3, 4].map((i) => nz(p && p.p && p.p[i], 1));
      return upd[scn](x);
    } };
  };
  const d = Topics.get('engineering').find((z) => z.id === 'engThermoFluid'); if (d) d.view3d = { build: builder, dist: 10 };
})();
