// 3D views for all 16 scenarios of the engineering tab (dynamics): kinematics, projectile, braking, spring work, vibration,
// shaft, power, damped/forced vibration, slider-crank, flywheel, impulse, rocket, cam-follower, rolling cylinder.
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const PI = Math.PI;
  const num = (v, d) => (Number.isFinite(v) ? v : d);
  const cl = (v, lo, hi) => Math.min(hi, Math.max(lo, num(v, lo)));
  const f2 = (v) => (Math.round(num(v, 0) * 100) / 100).toString();
  const f1 = (v) => (Math.round(num(v, 0) * 10) / 10).toString();
  const f0 = (v) => Math.round(num(v, 0)).toString();

  const builder = ({ THREE, world, C, V3 }) => {
    V3 = V3 || View3D.V3;
    const col = (c) => new THREE.Color(c);
    const P = (x, y, z) => new THREE.Vector3(x, y, z || 0);
    const arrow = (from, dir, len, color) => { const L = Math.max(len, 0.08); return new THREE.ArrowHelper(dir.clone().normalize(), from, L, col(color).getHex(), Math.min(0.22, L * 0.6), 0.11); };
    const tube = (pts, color, r) => { const cu = new THREE.CatmullRomCurve3(pts.map((q) => (q.isVector3 ? q : P(q[0], q[1], q[2])))); return new THREE.Mesh(new THREE.TubeGeometry(cu, Math.max(8, pts.length * 2), r || 0.03, 6), V3.mat(color)); };
    const bar = (a, b, rad, color) => { const d = b.clone().sub(a), L = Math.max(d.length(), 1e-4); const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, L, 12), V3.mat(color)); m.quaternion.setFromUnitVectors(P(0, 1, 0), d.clone().normalize()); m.position.copy(a.clone().add(b).multiplyScalar(0.5)); return m; };
    const dot = (x, y, z, color, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r || 0.09, 16, 12), V3.mat(color)); m.position.set(x, y, z || 0); return m; };
    const box = (w, h, d, color, x, y, z, opts) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), V3.mat(color, opts)); m.position.set(x, y, z || 0); return m; };
    const frame = (w, h, d, color, x, y, z) => { const m = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: col(color) })); m.position.set(x, y, z || 0); return m; };
    const spring = (x0, x1, y, z, rad, turns, color) => { const pts = [], N = Math.max(40, turns * 14); for (let i = 0; i <= N; i++) { const t = i / N; pts.push(P(x0 + (x1 - x0) * t, y + rad * Math.cos(2 * PI * turns * t), z + rad * Math.sin(2 * PI * turns * t))); } return tube(pts, color, 0.03); };
    // filled area between the curve pts=[[x,y]..] and the line y = base, as thin extruded slices
    const fillArea = (pts, base, color, op, depth, z0, hi) => {
      const out = []; const add = (xa, ya, xb, yb) => {
        if (Math.abs(xb - xa) < 1e-7 || (Math.abs(ya - base) < 1e-9 && Math.abs(yb - base) < 1e-9)) return;
        const sh = new THREE.Shape(); sh.moveTo(xa, base);
        if (Math.abs(ya - base) > 1e-9) sh.lineTo(xa, ya);
        if (Math.abs(yb - base) > 1e-9) sh.lineTo(xb, yb);
        sh.lineTo(xb, base);
        const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2);
        const m = new THREE.Mesh(g, V3.mat(color, { transparent: true, opacity: op, side: THREE.DoubleSide })); m.position.z = z0 || 0; out.push(m);
      };
      for (let i = 0; i < pts.length - 1; i++) {
        const [xa, ya] = pts[i], [xb, yb] = pts[i + 1]; if (hi && !hi(xa, xb)) continue;
        if ((ya - base) * (yb - base) < 0) { const xc = xa + (xb - xa) * (base - ya) / (yb - ya); add(xa, ya, xc, base); add(xc, base, xb, yb); } else add(xa, ya, xb, yb);
      }
      return out;
    };
    const addAll = (arr) => arr.forEach((m) => world.add(m));
    const sampleN = (f, a, b, n) => { const r = []; for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; r.push([x, f(x)]); } return r; };
    const axes = (x0, x1, y0, y1, z, color) => { world.add(V3.line([[x0, y0, z], [x1, y0, z]], color)); world.add(V3.line([[x0, y0, z], [x0, y1, z]], color)); };
    // plot panel: fn over [0,T] mapped to x in [xa,xb], y = yb + H*fn/max|fn|
    const panel = (fn, T, xa, xb, yb, H, z, color, opt) => {
      opt = opt || {}; let mx = 1e-9, mn = 0; for (let i = 0; i <= 60; i++) { const v = fn(T * i / 60); mx = Math.max(mx, v); mn = Math.min(mn, v); }
      const sc = H / Math.max(mx, -mn), X = (t) => xa + (xb - xa) * t / T, pts = sampleN(fn, 0, T, 60).map(([t, v]) => [X(t), yb + sc * v]);
      axes(xa, xb, yb, yb + H * 1.15, z, C.sub);
      if (opt.fill) addAll(fillArea(pts, yb, opt.fill, 0.55, opt.depth || 0.2, z));
      world.add(tube(pts.map(([x, y]) => [x, y, z]), color, 0.035));
      return { X, Y: (v) => yb + sc * v };
    };

    const S = {};
    // ---- 1. s = a t^3 + b t^2 + c t : s-t graph with tangent (v), particle on a track with v and a arrows ----
    S[0] = (p) => {
      const [a, b, c, T] = [p[0], p[1], p[2], p[3]], s = (t) => a * t * t * t + b * t * t + c * t, v = (t) => 3 * a * t * t + 2 * b * t + c, ac = (t) => 6 * a * t + 2 * b;
      const St = Math.max(s(T), 1e-6), X = (t) => -2.5 + 5 * t / T, Y = (q) => -0.2 + 2.2 * q / St;
      axes(-2.5, 2.7, -0.2, 2.3, 0, C.sub);
      world.add(tube(sampleN(s, 0, T, 50).map(([t, q]) => [X(t), Y(q), 0]), C.accent, 0.04));
      const sl = v(T) * (2.2 / St) / (5 / T), dx = 1.0; world.add(V3.line([[X(T) - dx, Y(St) - sl * dx, 0], [X(T) + 0.3, Y(St) + sl * 0.3, 0]], C.good));
      world.add(dot(X(T), Y(St), 0, C.gold, 0.1));
      const yt = -1.8; world.add(V3.line([[-2.5, yt, 0], [2.5, yt, 0]], C.sub));
      for (let k = 0; k <= T; k++) world.add(dot(-2.5 + 5 * s(k) / St, yt, 0, C.sub, 0.05));
      const px = 2.4; world.add(box(0.45, 0.35, 0.5, C.orange, px, yt + 0.2, 0));
      const tot = v(T) + ac(T) * T + 1e-9, lv = 0.5 + 1.3 * v(T) / tot, la = 0.5 + 1.3 * ac(T) * T / tot;
      world.add(arrow(P(px, yt + 0.65, 0), P(1, 0, 0), lv * 0.6, C.good)); world.add(arrow(P(px, yt + 0.95, 0), P(1, 0, 0), la * 0.6, C.orange));
      return tx(`Mavi eğri s(t); yeşil teğetin eğimi v = ${f1(v(T))} m/s (t = ${f0(T)} s). Altta parçacık konumu s = ${f1(s(T))} m; ok uzunlukları v (yeşil) ve a = ${f1(ac(T))} m/s² (turuncu) için şematiktir.`, `The blue curve is s(t); the slope of the green tangent is v = ${f1(v(T))} m/s (t = ${f0(T)} s). Below, the particle is at s = ${f1(s(T))} m; arrow lengths are schematic for v (green) and a = ${f1(ac(T))} m/s² (orange).`);
    };
    // ---- 2. a(t) -> v(t) -> s(t) stacked ----
    S[1] = (p) => {
      const [q, pp, v0, T] = [p[0], p[1], p[2], p[3]], a = (t) => q + pp * t, v = (t) => v0 + q * t + pp * t * t / 2, s = (t) => v0 * t + q * t * t / 2 + pp * t * t * t / 6;
      const pa = panel(a, T, -2.5, 2.5, -2.3, 1.1, 1.7, C.orange, { fill: C.orange });
      const pv = panel(v, T, -2.5, 2.5, -0.55, 1.1, 0, C.good, { fill: C.good });
      const ps = panel(s, T, -2.5, 2.5, 1.2, 1.1, -1.7, C.accent);
      [[pa, 1.7, -2.3, a], [pv, 0, -0.55, v], [ps, -1.7, 1.2, s]].forEach(([pl, z, yb, fn]) => { world.add(V3.line([[pl.X(T), yb, z], [pl.X(T), pl.Y(fn(T)), z]], C.gold)); world.add(dot(pl.X(T), pl.Y(fn(T)), z, C.gold, 0.08)); });
      return tx(`Turuncu alan Δv = ∫a dt, yeşil alan Δs = ∫v dt. t = ${f0(T)} s: v = ${f1(v(T))} m/s, s = ${f1(s(T))} m (her panel kendi en büyük değerine göre ölçekli).`, `The orange area is Δv = ∫a dt, the green area Δs = ∫v dt. At t = ${f0(T)} s: v = ${f1(v(T))} m/s, s = ${f1(s(T))} m (each panel scaled to its own maximum).`);
    };
    // ---- 3. projectile ----
    S[2] = (p) => {
      const vx = p[0], vy = p[1], tf = vy / 5, R = vx * tf, H = vy * vy / 20, sc = Math.min(5.6 / Math.max(R, 1e-6), 2.6 / Math.max(H, 1e-6)), x0 = -R * sc / 2;
      const pts = sampleN((t) => vy * t - 5 * t * t, 0, tf, 50).map(([t, y]) => [x0 + vx * t * sc, -1.5 + y * sc, 0]);
      world.add(tube(pts, C.accent, 0.04)); world.add(box(7, 0.06, 2, C.sub, 0, -1.53, 0, { transparent: true, opacity: 0.5 }));
      world.add(dot(x0, -1.5, 0, C.gold, 0.1)); world.add(dot(x0 + R * sc, -1.5, 0, C.gold, 0.1));
      const ax = x0 + vx * (tf / 2) * sc, ay = -1.5 + H * sc; world.add(dot(ax, ay, 0, C.orange, 0.1));
      world.add(V3.line([[ax, -1.5, 0], [ax, ay, 0]], C.orange)); world.add(V3.line([[x0, -1.9, 0], [x0 + R * sc, -1.9, 0]], C.good));
      const k = 1.6 / Math.max(vx, vy);
      world.add(arrow(P(x0, -1.5, 0), P(vx, 0, 0), vx * k, C.good)); world.add(arrow(P(x0, -1.5, 0), P(0, vy, 0), vy * k, C.orange));
      world.add(arrow(P(x0, -1.5, 0), P(vx, vy, 0), Math.hypot(vx, vy) * k, C.purple));
      return tx(`Maksimum yükseklik H = ${f1(H)} m (turuncu çizgi), menzil R = ${f1(R)} m (yeşil çubuk), uçuş süresi ${f1(2 * tf)} s. Yatay hız sabit, düşey hız her saniye 10 m/s azalır.`, `Maximum height H = ${f1(H)} m (orange line), range R = ${f1(R)} m (green bar), flight time ${f1(2 * tf)} s. Horizontal speed is constant; vertical speed drops by 10 m/s each second.`);
    };
    // ---- 4. braking: v-t triangle and car on road ----
    S[3] = (p) => {
      const v0 = p[0] / 3.6, a = p[1], ts = v0 / a, s = v0 * v0 / (2 * a);
      const W = 4.4, Hh = 1.6, x0 = -2.2, yb = 0.2;
      axes(x0, x0 + W + 0.3, yb, yb + Hh + 0.3, 0, C.sub);
      world.add(V3.line([[x0, yb + Hh, 0], [x0 + W, yb, 0]], C.accent));
      addAll(fillArea(sampleN((t) => yb + Hh * (1 - t), 0, 1, 20).map(([t, y]) => [x0 + W * t, y]), yb, C.orange, 0.55, 0.3, 0));
      world.add(dot(x0 + W, yb, 0, C.gold, 0.08));
      const yr = -1.6, Ls = 6, ps = Math.min(Ls, Ls * s / 230), car = (x, c, o) => { const g = new THREE.Group(); g.add(box(0.9, 0.3, 0.5, c, 0, 0.2, 0, o)); g.add(box(0.5, 0.25, 0.46, c, -0.05, 0.45, 0, o)); g.position.set(x, yr, 0); return g; };
      world.add(box(Ls + 1.2, 0.05, 1.2, C.sub, 0, yr - 0.03, 0, { transparent: true, opacity: 0.5 }));
      world.add(car(-3, C.accent, { transparent: true, opacity: 0.35 })); world.add(car(-3 + ps, C.orange));
      world.add(V3.line([[-3, yr - 0.4, 0], [-3 + ps, yr - 0.4, 0]], C.good)); world.add(box(0.05, 0.9, 0.05, C.bad, -3 + ps + 0.55, yr + 0.4, 0));
      return tx(`Turuncu üçgen v–t doğrusunun altındaki alan = fren mesafesi s = v₀²/(2a) = ${f1(s)} m; durma süresi ${f1(ts)} s. Altta araç bu mesafeyi alır (yol ölçeği 230 m).`, `The orange triangle is the area under the v–t line = braking distance s = v₀²/(2a) = ${f1(s)} m; stopping time ${f1(ts)} s. Below, the car covers that distance (road scale: 230 m).`);
    };
    // ---- 5. spring work ----
    S[4] = (p) => {
      const k = p[0], x1 = p[1], x2 = p[2], xs = 9, xn = -1.7, Fm = k * 0.5;
      world.add(box(0.2, 1.2, 1.2, C.sub, -3.3, -1.6, 0)); const xe = xn + x2 * xs;
      world.add(spring(-3.2, xe, -1.6, 0, 0.22, 12, C.accent)); world.add(box(0.5, 0.5, 0.5, C.orange, xe + 0.25, -1.6, 0));
      [[0, C.sub], [x1, C.good], [x2, C.bad]].forEach(([x, c]) => world.add(V3.line([[xn + x * xs, -2.4, 0], [xn + x * xs, -0.4, 0]], c)));
      const yb = -0.2, H = 2.2, Y = (x) => yb + H * k * x / Fm; axes(xn, xn + 0.55 * xs, yb, yb + H + 0.3, 0, C.sub);
      const pts = sampleN((x) => Y(x), 0, x2, 24).map(([x, y]) => [xn + x * xs, y]);
      addAll(fillArea(pts, yb, C.accent, 0.25, 0.3, 0, (a) => a < xn + x1 * xs - 1e-9)); addAll(fillArea(pts, yb, C.orange, 0.7, 0.3, 0, (a) => a >= xn + x1 * xs - 1e-9));
      world.add(V3.line([[xn, yb, 0], [xn + x2 * xs, Y(x2), 0]], C.good));
      return tx(`Turuncu alan W = ∫F dx = ½k(x₂² − x₁²) = ${f1(0.5 * k * (x2 * x2 - x1 * x1))} J (x₁ = ${f2(x1)} → x₂ = ${f2(x2)} m); yay aynı x ekseninde gösterilmiştir.`, `The orange area is W = ∫F dx = ½k(x₂² − x₁²) = ${f1(0.5 * k * (x2 * x2 - x1 * x1))} J (x₁ = ${f2(x1)} → x₂ = ${f2(x2)} m); the spring is drawn on the same x axis.`);
    };
    // ---- 6. spring-mass free vibration ----
    S[5] = (p) => {
      const m = p[0], w = p[1], A = p[2], xs = 12, e = 0.2, side = 0.35 + 0.25 * Math.cbrt(m / 4);
      world.add(box(0.2, 1.2, 1.2, C.sub, -3.3, -1.7, 0)); world.add(box(7, 0.05, 1.2, C.sub, 0, -2.05, 0, { transparent: true, opacity: 0.4 }));
      const xb = e + A * xs; world.add(spring(-3.2, xb - side / 2, -1.7, 0, 0.22, 10, C.accent)); world.add(box(side, side, side, C.orange, xb, -1.7 + side / 2 - 0.2, 0));
      world.add(box(side, side, side, C.sub, e - A * xs, -1.7 + side / 2 - 0.2, 0, { transparent: true, opacity: 0.2 }));
      world.add(V3.line([[e, -2.4, 0], [e, -0.2, 0]], C.good)); world.add(V3.line([[e + A * xs, -2.4, 0], [e + A * xs, -0.2, 0]], C.bad)); world.add(V3.line([[e - A * xs, -2.4, 0], [e - A * xs, -0.2, 0]], C.bad));
      const T = 2 * PI / w * 1.5, ya = 0.5;
      panel((t) => A * Math.cos(w * t), T, -3, 3, ya, 0.7, 1, C.orange);
      panel((t) => -A * w * Math.sin(w * t), T, -3, 3, ya, 0.7, 0, C.good);
      panel((t) => -A * w * w * Math.cos(w * t), T, -3, 3, ya, 0.7, -1, C.purple);
      return tx(`Blok x = A cos ωt ile salınır (A = ${f2(A)} m). Turuncu: x, yeşil: v = −Aω sin ωt (maks ${f2(A * w)} m/s), mor: a = −ω²x (maks ${f2(A * w * w)} m/s²); k = mω² = ${f1(m * w * w)} N/m. Her eğri kendi genliğine göre ölçeklidir.`, `The block moves as x = A cos ωt (A = ${f2(A)} m). Orange: x, green: v = −Aω sin ωt (max ${f2(A * w)} m/s), purple: a = −ω²x (max ${f2(A * w * w)} m/s²); k = mω² = ${f1(m * w * w)} N/m. Each curve is scaled to its own amplitude.`);
    };
    // ---- 7. rotating shaft: helix of the mark, disc, omega arrow ----
    S[6] = (p) => {
      const a = p[0], b = p[1], T = p[2], th = (t) => a * t * t + b * t, w = (t) => 2 * a * t + b, rpm = w(T) * 60 / (2 * PI), R = 0.9;
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.3, 40), V3.ghost(C.accent, 0.3)); cyl.rotation.z = PI / 2; cyl.position.x = 2.0; world.add(cyl);
      world.add(bar(P(-2.5, 0, 0), P(2.4, 0, 0), 0.07, C.sub));
      const pts = []; for (let i = 0; i <= 160; i++) { const t = T * i / 160, ang = th(t); pts.push(P(-2.5 + 4.5 * t / T, R * Math.cos(ang), R * Math.sin(ang))); } world.add(tube(pts, C.orange, 0.035));
      const aT = th(T), ex = 2.0, mk = P(ex, R * Math.cos(aT), R * Math.sin(aT)); world.add(bar(P(ex, 0, 0), mk, 0.035, C.gold)); world.add(dot(mk.x, mk.y, mk.z, C.gold, 0.09));
      const tg = P(0, -Math.sin(aT), Math.cos(aT)), lw = 0.4 + 0.8 * w(T) / (w(T) + 2 * a * T * 0.5 + 1e-9); world.add(arrow(mk, tg, lw, C.good));
      world.add(arrow(P(-2.5, 0, 0), P(1, 0, 0), 0.8, C.purple));
      return tx(`Turuncu sarmal, işaretin θ(t) açısını zaman boyunca gösterir (ω arttıkça sarım sıklaşır, α = ${f1(2 * a)} rad/s²). t = ${f0(T)} s: ω = ${f1(w(T))} rad/s = ${f0(rpm)} dev/dk; yeşil ok teğetsel hızdır.`, `The orange helix traces the mark's angle θ(t) in time (it tightens as ω grows, α = ${f1(2 * a)} rad/s²). At t = ${f0(T)} s: ω = ${f1(w(T))} rad/s = ${f0(rpm)} rpm; the green arrow is the tangential velocity.`);
    };
    // ---- 8. power P(t) = P0 + kt, energy = area ----
    S[7] = (p) => {
      const P0 = p[0], k = p[1], T = p[2], Pf = (t) => P0 + k * t, E = P0 * T + k * T * T / 2, Pa = E / T;
      const pl = panel(Pf, T, -2.5, 2.5, -1.8, 3, 0, C.accent, { fill: C.accent, depth: 0.6 });
      world.add(box(5, pl.Y(Pa) - pl.Y(0), 0.8, C.orange, 0, (pl.Y(Pa) + pl.Y(0)) / 2, -0.7, { transparent: true, opacity: 0.35 }));
      world.add(V3.line([[-2.5, pl.Y(Pa), 0.4], [2.5, pl.Y(Pa), 0.4]], C.orange));
      return tx(`Mavi levha P–t doğrusunun altındaki alan: E = ∫P dt = ${f1(E)} kJ. Turuncu dikdörtgen aynı alanı veren ortalama güçtür (P_ort = ${f1(Pa)} kW).`, `The blue slab is the area under the P–t line: E = ∫P dt = ${f1(E)} kJ. The orange rectangle with the same area has the average power P_avg = ${f1(Pa)} kW.`);
    };
    // ---- 9. damped vibration: decaying helix in (t, x, e^-st sin) ----
    S[8] = (p) => {
      const A = p[0], sg = p[1], wd = p[2], wn = Math.hypot(sg, wd), phi = Math.atan(sg / wd), t1 = (PI - phi) / wd, Ts = Math.min(3.5 / sg, 7 * PI / wd), sc = 1.7 / A, X = (t) => -2.6 + 5.2 * t / Ts;
      const xf = (t) => A * Math.exp(-sg * t) * Math.cos(wd * t), zf = (t) => A * Math.exp(-sg * t) * Math.sin(wd * t);
      world.add(V3.line([[-2.6, 0, 0], [2.7, 0, 0]], C.sub));
      world.add(V3.lathe(sampleN((t) => A * Math.exp(-sg * t) * sc, 0, Ts, 40).map(([t, r]) => [r, X(t)]), V3.ghost(C.accent, 0.12), 'x'));
      const N = 220, pts = [], flat = []; for (let i = 0; i <= N; i++) { const t = Ts * i / N; pts.push(P(X(t), xf(t) * sc, zf(t) * sc)); flat.push(P(X(t), xf(t) * sc, -2)); }
      world.add(tube(pts, C.orange, 0.03)); world.add(tube(flat, C.good, 0.025));
      const env = (sgn) => sampleN((t) => sgn * A * Math.exp(-sg * t) * sc, 0, Ts, 40).map(([t, y]) => [X(t), y, -2]); world.add(V3.line(env(1), C.sub)); world.add(V3.line(env(-1), C.sub));
      if (t1 < Ts) { world.add(dot(X(t1), xf(t1) * sc, zf(t1) * sc, C.gold, 0.1)); world.add(dot(X(t1), xf(t1) * sc, -2, C.gold, 0.08)); }
      return tx(`Turuncu sarmal x = A e^(−σt) cos ω_d t ile e^(−σt) sin ω_d t'nin birlikte çizimidir; yeşil iz x(t) grafiği, gri çizgiler ±A e^(−σt) zarfıdır. İlk uç nokta t₁ = ${f2(t1)} s (altın), ζ = ${f2(sg / wn)}, δ = ${f2(sg * 2 * PI / wd)}.`, `The orange helix plots x = A e^(−σt) cos ω_d t together with e^(−σt) sin ω_d t; the green trace is the x(t) graph and the grey lines are the ±A e^(−σt) envelope. First extremum at t₁ = ${f2(t1)} s (gold), ζ = ${f2(sg / wn)}, δ = ${f2(sg * 2 * PI / wd)}.`);
    };
    // ---- 10. resonance: family of M(r, zeta) curves, problem curve highlighted ----
    S[9] = (p) => {
      const F0 = p[0], k = p[1], z0 = p[2], Mf = (r, z) => 1 / Math.sqrt((1 - r * r) * (1 - r * r) + 4 * z * z * r * r), Y = (M) => -1.7 + Math.min(M, 5.6) * 0.75, X = (r) => -2.6 + r * 5.2 / 3, Z = (z) => -2 + 4 * z / 0.7;
      axes(-2.6, 2.8, -1.7, 2.5, -2, C.sub); world.add(V3.line([[-2.6, -1.7, -2], [-2.6, -1.7, 2.2]], C.sub));
      [0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.7].forEach((z) => { if (Math.abs(z - z0) < 1e-6) return; world.add(V3.line(sampleN((r) => Mf(r, z), 0, 3, 90).map(([r, M]) => [X(r), Y(M), Z(z)]), C.sub)); });
      world.add(tube(sampleN((r) => Mf(r, z0), 0, 3, 120).map(([r, M]) => [X(r), Y(M), Z(z0)]), C.orange, 0.04));
      const peak = z0 < 0.7071, rp = peak ? Math.sqrt(1 - 2 * z0 * z0) : 0, Mx = Mf(rp, z0);
      world.add(dot(X(rp), Y(Mx), Z(z0), C.gold, 0.11)); world.add(V3.line([[X(rp), Y(0), Z(z0)], [X(rp), Y(Mx), Z(z0)]], C.gold)); world.add(V3.line([[X(1), Y(0), -2], [X(1), Y(0), 2.2]], C.bad));
      return tx(`Turuncu eğri verilen ζ = ${f2(z0)} için M(r); gri eğriler diğer ζ değerleri (derinlik ekseni). Altın nokta tepe: r_p = ${f2(rp)}, M_max = ${f2(Mx)}, X_max = ${f2(F0 / k * Mx)} mm; kırmızı çizgi r = 1.`, `The orange curve is M(r) for the given ζ = ${f2(z0)}; grey curves are other ζ values (depth axis). The gold dot is the peak: r_p = ${f2(rp)}, M_max = ${f2(Mx)}, X_max = ${f2(F0 / k * Mx)} mm; the red line is r = 1.`);
    };
    // ---- 11. slider-crank ----
    S[10] = (p) => {
      const r = p[0], n = p[1], N = p[2], thd = p[3], th = thd * PI / 180, w = N * 2 * PI / 60, l = n * r, sc = 4.4 / (r * (1 + n)), ox = -2.6;
      const sq = Math.sqrt(Math.max(l * l - r * r * Math.sin(th) * Math.sin(th), 1e-9)), xp = r * Math.cos(th) + sq;
      const v = -r * w * (Math.sin(th) + r * Math.sin(2 * th) / (2 * sq)) / 1000, ac = -r * w * w * (Math.cos(th) + Math.cos(2 * th) / n) / 1000;
      const pin = P(ox + r * Math.cos(th) * sc, r * Math.sin(th) * sc, 0), pis = P(ox + xp * sc, 0, 0), ct = P(ox, 0, 0);
      const ring = []; for (let i = 0; i <= 64; i++) ring.push([ox + r * sc * Math.cos(2 * PI * i / 64), r * sc * Math.sin(2 * PI * i / 64), 0]); world.add(V3.line(ring, C.sub));
      world.add(bar(ct, pin, 0.07, C.accent)); world.add(bar(pin, pis, 0.05, C.purple)); world.add(dot(ox, 0, 0, C.sub, 0.12)); world.add(dot(pin.x, pin.y, 0, C.gold, 0.1));
      world.add(box(0.5, 0.75, 0.6, C.orange, pis.x + 0.25, 0, 0));
      const cw = 3.4 - (pis.x - ox) + 0.5; if (cw > 0.2) world.add(frame(cw, 1.0, 0.7, C.fg, pis.x + 0.5 + cw / 2 - 0.25, 0, 0));
      const vmax = r * w / 1000, amax = r * w * w * (1 + 1 / n) / 1000, ax = pis.x + 0.25;
      world.add(arrow(P(ax, 0.7, 0), P(v < 0 ? -1 : 1, 0, 0), 1.4 * Math.abs(v) / vmax + 0.1, C.good)); world.add(arrow(P(ax, -0.7, 0), P(ac < 0 ? -1 : 1, 0, 0), 1.4 * Math.abs(ac) / amax + 0.1, C.bad));
      world.add(V3.line([[ox + r * sc, -1.3, 0], [pis.x, -1.3, 0]], C.good));
      return tx(`θ = ${f0(thd)}°: krank (mavi), biyel (mor), piston konumu x = ${f1(xp)} mm. Yeşil ok hız v = ${f2(v)} m/s, kırmızı ok ivme a = ${f1(ac)} m/s² (oklar v_max = ${f2(vmax)} ve a_max = ${f1(amax)} değerlerine göre ölçekli).`, `θ = ${f0(thd)}°: crank (blue), connecting rod (purple), piston position x = ${f1(xp)} mm. The green arrow is the velocity v = ${f2(v)} m/s, the red arrow the acceleration a = ${f1(ac)} m/s² (arrows scaled to v_max = ${f2(vmax)} and a_max = ${f1(amax)}).`);
    };
    // ---- 12. flywheel ----
    S[11] = (p) => {
      const A = p[0], Nr = p[1], Cs = p[2] / 100, w = Nr * 2 * PI / 60, dE = A, I = dE / (Cs * w * w), lg = Math.log10(Math.max(I, 1e-3)), R = 0.7 + 0.7 * cl((lg + 1.4) / 2.0, 0, 1);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.35, 48), V3.mat(C.accent, { transparent: true, opacity: 0.7 })); disc.rotation.x = PI / 2; disc.position.set(-2.2, 0, 0); world.add(disc);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.0, 16), V3.mat(C.sub)); hub.rotation.x = PI / 2; hub.position.set(-2.2, 0, 0); world.add(hub);
      for (let i = 0; i < 4; i++) world.add(V3.line([[-2.2, 0, 0.2], [-2.2 + R * Math.cos(i * PI / 2), R * Math.sin(i * PI / 2), 0.2]], C.fg));
      const x0 = -0.6, W = 3.8, Hh = 1.2 * A / 300, X = (th) => x0 + W * th / PI, base = -1.5, y0 = base + 0.9;
      axes(x0, x0 + W + 0.2, base, base + 1.9, 0.6, C.sub);
      const Tc = sampleN((th) => A * Math.sin(2 * th), 0, PI, 60).map(([th, t]) => [X(th), y0 + 0.5 * Hh * t / A]);
      world.add(tube(Tc.map((q) => [q[0], q[1], 0.6]), C.orange, 0.035)); world.add(V3.line([[x0, y0, 0.6], [x0 + W, y0, 0.6]], C.sub));
      addAll(fillArea(Tc, y0, C.orange, 0.5, 0.2, 0.6));
      const e0 = base + 1.9, Ep = sampleN((th) => A * (1 - Math.cos(2 * th)) / 2, 0, PI, 60).map(([th, e]) => [X(th), e0 + Hh * e / A]);
      world.add(tube(Ep.map((q) => [q[0], q[1], -0.8]), C.good, 0.035)); world.add(V3.line([[x0, e0, -0.8], [x0 + W, e0, -0.8]], C.sub));
      world.add(V3.line([[X(PI / 2), e0, -0.8], [X(PI / 2), e0 + Hh, -0.8]], C.gold)); world.add(dot(X(PI / 2), e0 + Hh, -0.8, C.gold, 0.09));
      return tx(`Turuncu: T(θ) = A sin 2θ (alan = iş); yeşil: E(θ) = ∫T dθ, tepesi θ = 90°'de ΔE = ${f0(dE)} J (altın). Gereken volan I = ΔE/(Cs·ω²) = ${f2(I)} kg·m²: disk yarıçapı I ile büyür (şematik).`, `Orange: T(θ) = A sin 2θ (area = work); green: E(θ) = ∫T dθ, peaking at θ = 90° with ΔE = ${f0(dE)} J (gold). The required flywheel I = ΔE/(Cs·ω²) = ${f2(I)} kg·m²: the disc radius grows with I (schematic).`);
    };
    // ---- 13. impulse: F(t) half sine area, body with v0 -> v1 ----
    S[12] = (p) => {
      const F0 = p[0], T = p[1] / 1000, m = p[2], v0 = p[3], J = 2 * F0 * T / PI, v1 = v0 + J / m, Fa = J / T;
      const W = 1.5 + 3.5 * T / 0.06, x0 = -W / 2, yb = 0.4, H = 2.0 * F0 / 3000, X = (t) => x0 + W * t / T;
      axes(x0 - 0.1, x0 + W + 0.3, yb, yb + 2.4, 0, C.sub);
      const pts = sampleN((t) => F0 * Math.sin(PI * t / T), 0, T, 40).map(([t, f]) => [X(t), yb + H * f / F0]);
      addAll(fillArea(pts, yb, C.accent, 0.55, 0.4, 0)); world.add(tube(pts.map((q) => [q[0], q[1], 0]), C.accent, 0.035));
      world.add(V3.line([[x0, yb + H * Fa / F0, 0.3], [x0 + W, yb + H * Fa / F0, 0.3]], C.orange)); world.add(dot(X(T / 2), yb + H, 0, C.gold, 0.09));
      const side = 0.4 + 0.3 * Math.cbrt(m / 30), ky = -1.5 + side / 2; world.add(box(7, 0.05, 1.4, C.sub, 0, -1.5, 0, { transparent: true, opacity: 0.4 }));
      world.add(box(side, side, side, C.orange, -3.0, ky, 0)); world.add(arrow(P(-3 + side / 2, ky, 0), P(1, 0, 0), 0.12 * v0 + 0.1, C.good));
      world.add(box(side, side, side, C.orange, 0.2, ky, 0)); world.add(arrow(P(0.2 + side / 2, ky, 0), P(1, 0, 0), Math.min(0.12 * v1, 2.9), C.purple));
      return tx(`Mavi alan itme J = ∫F dt = ${f1(J)} N·s; turuncu çizgi ortalama kuvvet (${f0(Fa)} N), altın nokta ${f0(F0)} N tepe. Altta blok hızı ${f1(v0)} → ${f1(v1)} m/s (ok uzunluğu hızla orantılı).`, `The blue area is the impulse J = ∫F dt = ${f1(J)} N·s; the orange line is the average force (${f0(Fa)} N), the gold dot the ${f0(F0)} N peak. Below, the block speed goes ${f1(v0)} → ${f1(v1)} m/s (arrow length ∝ speed).`);
    };
    // ---- 14. rocket: altitude-time path with burn and coast, v(t) curve ----
    S[13] = (p) => {
      const u = p[0], mu = p[1], Tb = p[2], m0 = p[3], g = 10, N = 120, vf = (t) => { const m = Math.max(m0 - mu * t, 1e-3); return u * Math.log(m0 / m) - g * t; };
      const hs = [0]; for (let i = 1; i <= N; i++) { const t0 = Tb * (i - 1) / N, t1 = Tb * i / N; hs.push(hs[i - 1] + 0.5 * (vf(t0) + vf(t1)) * (t1 - t0)); }
      const vb = vf(Tb), hb = hs[N], tc = Math.max(vb, 0) / g, hc = vb > 0 ? vb * vb / (2 * g) : 0, Hm = Math.max(hb + hc, 1e-6), Tt = Tb + tc;
      const X = (t) => -2.8 + 5.2 * t / Tt, Y = (h) => -1.8 + 3.4 * h / Hm;
      axes(-2.8, 2.6, -1.8, 1.9, 0, C.sub);
      world.add(tube(hs.map((h, i) => [X(Tb * i / N), Y(h), 0]), C.orange, 0.04));
      if (tc > 1e-3) world.add(tube(sampleN((t) => hb + vb * t - 5 * t * t, 0, tc, 30).map(([t, h]) => [X(Tb + t), Y(h), 0]), C.accent, 0.04));
      world.add(V3.line([[X(Tb), -1.8, 0], [X(Tb), Y(hb), 0]], C.gold)); world.add(dot(X(Tb), Y(hb), 0, C.gold, 0.1));
      const rk = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.7, 16), V3.mat(C.fg)); const nose = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 16), V3.mat(C.bad)); nose.position.y = 0.5; rk.add(body); rk.add(nose);
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 12), V3.mat(C.orange)); fl.rotation.x = PI; fl.position.y = -0.55; rk.add(fl); rk.position.set(X(Tb), Y(hb) + 0.5, 0.3); world.add(rk);
      const vm = Math.max(vb, 1e-6), vv = sampleN(vf, 0, Tb, 40).map(([t, v]) => [X(t), -1.8 + 1.6 * Math.max(v, 0) / vm, -1.2]); world.add(tube(vv, C.good, 0.03)); axes(-2.8, X(Tb), -1.8, -0.1, -1.2, C.sub);
      return tx(`Turuncu: yanma sırasında yükseklik h(t) = ∫v dt (yanma sonu ${f0(hb)} m, hız ${f0(vb)} m/s); mavi: atalet yükselişi, +${f0(hc)} m; tepe ${f0(hb + hc)} m. Yeşil arka eğri v(t) = u·ln(m₀/m) − gt.`, `Orange: height during burn h(t) = ∫v dt (${f0(hb)} m at burnout, speed ${f0(vb)} m/s); blue: coasting rise, +${f0(hc)} m; apex ${f0(hb + hc)} m. The green back curve is v(t) = u·ln(m₀/m) − gt.`);
    };
    // ---- 15. cam-follower: cycloidal profile ----
    S[14] = (p) => {
      const h = p[0], bt = p[1] * PI / 180, xi = p[3] / 100, Rb = 1.0, hs = 0.9 * h / 30, cx = -1.2, cy = -0.7;
      const sf = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x - Math.sin(2 * PI * x) / (2 * PI)), prof = (psi) => { const q = ((psi % (2 * PI)) + 2 * PI) % (2 * PI); if (q <= bt) return Rb + hs * sf(q / bt); if (q <= 2 * bt) return Rb + hs * sf((2 * bt - q) / bt); return Rb; };
      const sh = new THREE.Shape(); for (let i = 0; i <= 240; i++) { const psi = 2 * PI * i / 240, r = prof(psi), a = PI / 2 - psi; const x = r * Math.cos(a), y = r * Math.sin(a); if (i === 0) sh.moveTo(x, y); else if (i < 240) sh.lineTo(x, y); }
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false }); g.translate(0, 0, -0.2);
      const cam = new THREE.Mesh(g, V3.mat(C.accent, { transparent: true, opacity: 0.75 })); cam.rotation.z = xi * bt; cam.position.set(cx, cy, 0); world.add(cam);
      world.add(dot(cx, cy, 0.25, C.sub, 0.1)); const yt = cy + Rb + hs * sf(xi);
      world.add(bar(P(cx, yt, 0), P(cx, yt + 1.5, 0), 0.05, C.fg)); world.add(dot(cx, yt, 0, C.orange, 0.09)); world.add(V3.line([[cx - 0.5, cy + Rb, 0.3], [cx + 0.5, cy + Rb, 0.3]], C.sub));
      world.add(V3.line([[cx + 0.3, cy + Rb, 0.35], [cx + 0.3, yt, 0.35]], C.good));
      const dx = 1.2, W = 2.1, yb = -2.0, Hh = 1.8; axes(dx, dx + W + 0.2, yb, yb + Hh + 0.3, 0, C.sub);
      world.add(tube(sampleN(sf, 0, 1, 40).map(([q, s]) => [dx + W * q, yb + Hh * s, 0]), C.orange, 0.03));
      world.add(tube(sampleN((q) => (1 - Math.cos(2 * PI * q)) / 2, 0, 1, 40).map(([q, s]) => [dx + W * q, yb + Hh * s * 0.7, 0.3]), C.good, 0.025));
      world.add(dot(dx + W * xi, yb + Hh * sf(xi), 0, C.gold, 0.09)); world.add(V3.line([[dx + W * xi, yb, 0], [dx + W * xi, yb + Hh * sf(xi), 0]], C.gold));
      return tx(`Kam (mavi) θ = ${f0(p[3])}% β kadar dönmüş; izleyici ucu s = ${f2(h * sf(xi))} mm yükselmiştir (yeşil çizgi). Sağda s(θ) sikloidal eğrisi (turuncu) ve v ∝ 1 − cos 2πξ (yeşil): başta ve sonda v = 0.`, `The cam (blue) has turned θ = ${f0(p[3])}% of β; the follower tip has risen s = ${f2(h * sf(xi))} mm (green line). Right: the cycloidal s(θ) (orange) and v ∝ 1 − cos 2πξ (green): v = 0 at start and end.`);
    };
    // ---- 16. cylinder rolling on an incline ----
    S[15] = (p) => {
      const bd = p[0], L = p[1], m = p[2], b = bd * PI / 180, u = P(-Math.cos(b), Math.sin(b), 0), n = P(Math.sin(b), Math.cos(b), 0), B = P(2.4, -1.9, 0), len = 5.2, us = 0.75, r = 0.25 + 0.2 * (m - 10) / 20;
      const pl = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 1.4), V3.mat(C.sub, { transparent: true, opacity: 0.6 })); pl.rotation.z = PI - b; pl.position.copy(B.clone().add(u.clone().multiplyScalar(len / 2)).sub(n.clone().multiplyScalar(0.05))); world.add(pl);
      const dist = Math.min(L * us, len - 0.3), place = (d) => B.clone().add(u.clone().multiplyScalar(d)).add(n.clone().multiplyScalar(r));
      const cyl = (c, o, rot) => { const g = new THREE.Group(), m1 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.9, 32), V3.mat(c, o)); m1.rotation.x = PI / 2; g.add(m1); g.add(V3.line([[0, 0, 0.46], [r * Math.cos(rot), r * Math.sin(rot), 0.46]], C.fg)); return g; };
      const c0 = cyl(C.orange, { transparent: true, opacity: 0.3 }, PI / 2); c0.position.copy(place(dist)); world.add(c0);
      const c1 = cyl(C.orange, undefined, PI / 2 - dist / r); c1.position.copy(place(0)); world.add(c1);
      world.add(V3.line([place(dist), place(0)].map((q) => q.clone().add(n.clone().multiplyScalar(0.9))), C.gold));
      const a = 2 / 3 * 10 * Math.sin(b), f = 0.5 * m * a, ctr = place(dist / 2);
      world.add(arrow(ctr.clone().add(n.clone().multiplyScalar(r + 0.3)), u.clone().negate(), 0.2 * a + 0.1, C.good)); world.add(arrow(B.clone().add(u.clone().multiplyScalar(dist / 2)).add(n.clone().multiplyScalar(0.05)).add(P(0, 0, 0.8)), u, 1.2 * f / 90 + 0.1, C.bad));
      world.add(arrow(ctr.clone().add(n.clone().multiplyScalar(r + 0.7)), u.clone().negate(), 0.2 * 10 * Math.sin(b) + 0.1, C.sub));
      const vb = Math.sqrt(4 / 3 * 10 * L * Math.sin(b));
      return tx(`Dolu silindir ${f0(bd)}° eğimde ${f1(L)} m kaymadan yuvarlanarak iner (soluk: başlangıç). Yeşil ok a = ⅔g sinβ = ${f2(a)} m/s², gri ok kayan blok g sinβ (daha uzun); kırmızı: sürtünme f = ma/2 = ${f1(f)} N. Alt hız ${f2(vb)} m/s.`, `The solid cylinder rolls ${f1(L)} m down the ${f0(bd)}° incline without slipping (faded: start). Green arrow a = ⅔g sinβ = ${f2(a)} m/s², grey arrow the sliding block g sinβ (longer); red: friction f = ma/2 = ${f1(f)} N. Speed at the bottom ${f2(vb)} m/s.`);
    };

    const RANGES = { 0: [[1, 3], [1, 4], [2, 10], [1, 4]], 1: [[1, 6], [1, 9], [0, 10], [2, 6]], 2: [[5, 30], [5, 30]], 3: [[20, 120], [1, 8]], 4: [[100, 600], [0, 0.2], [0.25, 0.5]], 5: [[1, 4], [1, 6], [0.04, 0.15]], 6: [[0.5, 5], [0, 10], [1, 6]], 7: [[1, 10], [0.5, 4], [3, 10]], 8: [[5, 30], [0.5, 3], [3, 8]], 9: [[50, 300], [5, 30], [0.05, 0.3]], 10: [[30, 80], [2.5, 5], [300, 1800], [0, 180]], 11: [[50, 300], [300, 1800], [1, 6]], 12: [[500, 3000], [10, 60], [5, 30], [0, 10]], 13: [[1500, 3000], [30, 60], [5, 20], [1500, 3000]], 14: [[5, 30], [45, 120], [100, 900], [10, 90]], 15: [[15, 60], [1, 6], [5, 30]] };
    return { update(p) {
      world.position.set(0, 0, 0); world.scale.setScalar(1);
      const scn = cl(Math.round(num(p && p.scn, 0)), 0, 15), rg = RANGES[scn], pp = rg.map(([lo, hi], i) => cl(p && p.p ? p.p[i] : lo, lo, hi));
      if (scn === 4 && pp[2] <= pp[1]) pp[2] = pp[1] + 0.1;
      if (scn === 13) pp[3] = Math.max(pp[3], pp[1] * pp[2] * 1.2 + 1);
      return S[scn](pp) || '';
    } };
  };
  const d = Topics.get('engineering').find((x) => x.id === 'engDynamics'); if (d) d.view3d = { build: builder, dist: 10 };
})();
