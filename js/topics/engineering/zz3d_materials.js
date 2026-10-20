// 3D views for all 16 scenarios of the engineering tab (materials & manufacturing).
// Every scene = a "3D graph board" at the back (curve + extruded area under it, markers, guides) driven by p.p[]
// plus, in front, a physical picture of the same example (melt pool, scan tracks, bar, billet, specimen, spring, bearing, ...).
(function () {
  let V3 = null; const tx = (a, b) => I18N.tx(a, b);
  const fin = (v) => typeof v === 'number' && isFinite(v);
  const cl = (v, a, b) => (fin(v) ? Math.max(a, Math.min(b, v)) : a);
  const g = (v) => { if (!fin(v)) return '0'; const a = Math.abs(v); return String(a >= 100 ? Math.round(v) : a >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100); };

  const builder = ({ THREE, world, C, V3: V3arg }) => {
    V3 = V3arg || View3D.V3;
    const col = (c) => new THREE.Color(c);
    const mix = (c1, c2, t) => col(c1).lerp(col(c2), cl(t, 0, 1));
    const solid = (c, o) => V3.mat(c, o);
    const add = (m, x, y, z) => { m.position.set(x || 0, y || 0, z || 0); world.add(m); return m; };
    const box = (w, h, d, mat, x, y, z) => add(new THREE.Mesh(new THREE.BoxGeometry(Math.max(w, 1e-3), Math.max(h, 1e-3), Math.max(d, 1e-3)), mat), x, y, z);
    const edges = (w, h, d, c, x, y, z) => add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: col(c) })), x, y, z);
    const sphere = (r, mat, x, y, z) => add(new THREE.Mesh(new THREE.SphereGeometry(Math.max(r, 1e-3), 24, 16), mat), x, y, z);
    const arrow = (dir, org, len, c) => { const a = new THREE.ArrowHelper(new THREE.Vector3(dir[0], dir[1], dir[2]).normalize(), new THREE.Vector3(org[0], org[1], org[2]), Math.max(len, 0.25), col(c), 0.18, 0.1); world.add(a); return a; };
    const helix = (len, r, coils, tr, mat, x, y, z) => {
      const pts = [], N = 160;
      for (let i = 0; i <= N; i++) { const t = i / N; pts.push(new THREE.Vector3(len * t, r * Math.cos(2 * Math.PI * coils * t), r * Math.sin(2 * Math.PI * coils * t))); }
      return add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, tr, 6), mat), x, y, z);
    };

    // ---------- 3D graph board ----------
    // o: f, xr, yr, area{fu?,f2?,x0,x1,col}, curves[{f,col}], markers[{x,y,col}], vlines[], hlines[], tangent{x,y,s}
    function board(o) {
      const W = 6, H = 2.5, y0 = 0.15, zc = -1.6, D = 0.5, zf = zc + D / 2 + 0.01;
      const [xa, xb] = o.xr, [ya, yb] = o.yr;
      const X = (x) => -W / 2 + W * (x - xa) / (xb - xa);
      const Y = (y) => y0 + H * cl((y - ya) / (yb - ya), 0, 1.04);
      const runs = (f, a, b, n) => {
        const out = []; let cur = [];
        for (let i = 0; i <= n; i++) {
          const x = a + (b - a) * i / n; let y; try { y = f(x); } catch (e) { y = NaN; }
          if (fin(y) && y >= ya - (yb - ya) * 0.02 && y <= yb + (yb - ya) * 0.04) cur.push([x, y]); else { if (cur.length > 1) out.push(cur); cur = []; }
        }
        if (cur.length > 1) out.push(cur); return out;
      };
      const tube = (pts, c, r) => { if (pts.length < 2) return; const v = pts.map(([x, y]) => new THREE.Vector3(X(x), Y(y), zf)); world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v), Math.max(8, v.length * 2), r, 6), solid(c))); };
      const poly = (up, lo, c, op) => {
        if (up.length < 2) return;
        const sh = new THREE.Shape(); sh.moveTo(X(up[0][0]), Y(up[0][1]));
        for (let i = 1; i < up.length; i++) sh.lineTo(X(up[i][0]), Y(up[i][1]));
        for (let i = lo.length - 1; i >= 0; i--) sh.lineTo(X(lo[i][0]), Y(lo[i][1]));
        const geo = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false }); geo.translate(0, 0, zc - D / 2);
        world.add(new THREE.Mesh(geo, V3.mat(c, { transparent: true, opacity: op, depthWrite: op > 0.6 })));
      };
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), V3.ghost(C.sub, 0.08)); wall.position.set(0, y0 + H / 2, zc - D / 2 - 0.005); world.add(wall);
      world.add(V3.line([[-W / 2, y0, zf], [W / 2, y0, zf]], C.sub)); world.add(V3.line([[-W / 2, y0, zf], [-W / 2, y0 + H, zf]], C.sub));
      const n = 120;
      runs(o.f, xa, xb, n).forEach((r) => poly(r, [[r[0][0], ya], [r[r.length - 1][0], ya]], C.accent, 0.16));
      if (o.area) {
        const a = o.area, fu = a.fu || o.f, up = [], lo = [];
        for (let i = 0; i <= 60; i++) { const x = a.x0 + (a.x1 - a.x0) * i / 60, yu = fu(x), yl = a.f2 ? a.f2(x) : ya; if (fin(yu) && fin(yl)) { up.push([x, Math.min(yu, yb)]); lo.push([x, Math.max(yl, ya)]); } }
        poly(up, lo, a.col || C.orange, 0.8);
      }
      (o.curves || []).forEach((c) => runs(c.f, xa, xb, n).forEach((r) => tube(r, c.col, 0.025)));
      runs(o.f, xa, xb, n).forEach((r) => tube(r, C.accent, 0.04));
      (o.vlines || []).forEach((x) => { if (fin(x) && x >= xa && x <= xb) world.add(V3.line([[X(x), y0, zf], [X(x), y0 + H, zf]], C.sub)); });
      (o.hlines || []).forEach((y) => { if (fin(y) && y >= ya && y <= yb) world.add(V3.line([[-W / 2, Y(y), zf], [W / 2, Y(y), zf]], C.sub)); });
      if (o.tangent) {
        const t = o.tangent, pts = [];
        for (let i = 0; i <= 40; i++) { const x = xa + (xb - xa) * i / 40, y = t.y + t.s * (x - t.x); if (fin(y) && y >= ya && y <= yb) pts.push([X(x), Y(y), zf + 0.01]); }
        if (pts.length > 1) world.add(V3.line(pts, C.good));
      }
      (o.markers || []).forEach((m) => { if (fin(m.x) && fin(m.y)) sphere(0.1, solid(m.col || C.gold), X(m.x), Y(m.y), zf + 0.04); });
    }

    // ---------- scenarios ----------
    const S = [];

    S[0] = (x) => { // melt-pool depth: parabola d(P) and a melt-pool cross-section
      const a = x[0] / 1000, p0 = x[1], b = 2 * a * p0, dm = a * p0 * p0;
      board({ f: (v) => -a * v * v + b * v, xr: [0, 2.1 * p0], yr: [0, 1.25 * dm], vlines: [p0], hlines: [dm], markers: [{ x: p0, y: dm }] });
      const top = -0.5, d = 0.15 + 1.0 * cl(dm / 360, 0, 1), rx = 0.5 + 0.7 * cl((p0 - 100) / 200, 0, 1);
      box(4, 1.5, 2.2, V3.ghost(C.sub, 0.3), 0, top - 0.75, 0.8); edges(4, 1.5, 2.2, C.sub, 0, top - 0.75, 0.8);
      const pool = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), solid(C.orange, { side: THREE.DoubleSide }));
      pool.scale.set(rx, d, rx * 0.9); add(pool, 0, top, 0.8);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 24), solid(C.bad)); cone.rotation.x = Math.PI; add(cone, 0, top + 0.37, 0.8);
      world.add(V3.line([[0, top + 0.72, 0.8], [0, top + 1.2, 0.8]], C.bad));
      return tx(`Arkada d(P) parabolü; önde eriyik havuzu kesiti (derinlik ${g(dm)} µm en iyi P₀ = ${g(p0)} W'ta en büyüktür).`, `Back: the parabola d(P); front: the melt-pool section (depth ${g(dm)} µm, largest at the best power P₀ = ${g(p0)} W).`);
    };

    S[1] = (x) => { // E = P/(v h t) rational; scan tracks
      const pw = x[0], h = x[1] / 1000, t = x[2] / 1000, em = x[3], vmax = pw / (em * h * t);
      const E = (v) => (v <= 0 ? NaN : pw / (h * t * v));
      board({ f: E, xr: [0, 2.2 * vmax], yr: [0, 3 * em], area: { x0: vmax, x1: 2.2 * vmax, col: C.bad }, hlines: [em], vlines: [vmax], markers: [{ x: vmax, y: em }] });
      const hN = 0.2 + 0.4 * cl((x[1] - 80) / 40, 0, 1), tN = 0.1 + 0.25 * cl((x[2] - 30) / 20, 0, 1), top = -1.1;
      box(4, 0.5, 2.4, solid(C.sub), 0, top - 0.25 - tN, 0.8); box(4, tN, 2.4, V3.ghost(C.gold, 0.5), 0, top - tN / 2, 0.8);
      for (let i = -2; i <= 2; i++) { const cyl = new THREE.Mesh(new THREE.CylinderGeometry(hN * 0.42, hN * 0.42, 2.4, 14), solid(C.orange)); cyl.rotation.x = Math.PI / 2; add(cyl, i * hN, top, 0.8); }
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 20), solid(C.bad)); cone.rotation.x = Math.PI; add(cone, 0, top + 0.4, 0.8);
      return tx(`E = P/(v·h·t) hiperbolu; kırmızı bölge v > ${g(vmax)} mm/s (E < E_min). Önde: tarama izleri aralığı h ve katman kalınlığı t.`, `E = P/(v·h·t) hyperbola; red region v > ${g(vmax)} mm/s (E < E_min). Front: scan tracks with hatch spacing h and layer thickness t.`);
    };

    S[2] = (x) => { // V = k v^(3/2), bead
      const sv = x[0], k = x[1], s1 = x[2], v0 = sv * sv, v1 = s1 * s1, vmax = Math.max(v0, v1) * 1.25, ymax = k * Math.pow(vmax, 1.5), y1 = k * s1 * s1 * s1, sl = 1.5 * k * s1;
      board({ f: (v) => (v < 0 ? NaN : k * Math.pow(v, 1.5)), xr: [0, vmax], yr: [0, ymax], tangent: { x: v1, y: y1, s: sl }, markers: [{ x: v0, y: k * Math.pow(v0, 1.5), col: C.purple }, { x: v1, y: y1 }] });
      const R = 0.2 + 0.8 * Math.cbrt(cl(y1 / 1080, 0, 1)), top = -1.3;
      box(4, 0.4, 2.2, solid(C.sub), 0, top - 0.2, 0.8);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), solid(C.orange)); bead.scale.set(R, R * 0.6, R * 1.6); add(bead, 0, top, 0.8);
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), solid(C.gold)); wire.rotation.x = 0.5; add(wire, 0, top + R * 0.6 + 0.4, 0.6);
      return tx(`V = k·v^(3/2) eğrisi ve teğeti (V′ = ${g(sl)}); önde biriken kaynak damlası V(v₁) = ${g(y1)} mm³ ile ölçeklidir.`, `The curve V = k·v^(3/2) with its tangent (V′ = ${g(sl)}); front: the deposited bead sized by V(v₁) = ${g(y1)} mm³.`);
    };

    S[3] = (x) => { // thermal expansion error
      const l0 = x[0], al = x[1] * 1e-6, dt = x[2], er = (v) => l0 * (Math.exp(al * v) - 1 - al * v), top = er(1.2 * dt);
      board({ f: er, xr: [0, 1.2 * dt], yr: [0, Math.max(top * 1.2, 1e-9)], vlines: [dt], markers: [{ x: dt, y: er(dt) }] });
      const len = 1.2 + 1.8 * cl(l0 / 500, 0, 1), eps = Math.exp(al * dt) - 1, eLin = len * al * dt * 8, eEx = len * eps * 8, x0 = -2.4, cap = Math.max(eEx - eLin, 0.03);
      box(0.2, 2.4, 1, solid(C.sub), x0 - 0.1, -1.5, 0.8);
      box(len, 0.45, 0.6, solid(C.accent, { transparent: true, opacity: 0.6 }), x0 + len / 2, -0.8, 0.8);
      box(len + eLin, 0.45, 0.6, solid(C.orange), x0 + (len + eLin) / 2, -1.6, 0.8);
      box(cap, 0.45, 0.6, solid(C.bad), x0 + len + eLin + cap / 2, -1.6, 0.8);
      world.add(V3.line([[x0 + len, -0.5, 1.2], [x0 + len, -2.1, 1.2]], C.sub));
      return tx(`Arkada hata = L₀(e^(αΔT) − 1 − αΔT) = ${g(er(dt))} mm. Önde: mavi soğuk çubuk, turuncu doğrusal genleşme, kırmızı artık hata (hepsi ×8 büyütülmüş).`, `Back: error = L₀(e^(αΔT) − 1 − αΔT) = ${g(er(dt))} mm. Front: blue cold bar, orange linear expansion, red leftover error (all ×8 exaggerated).`);
    };

    S[4] = (x) => { // cooling T = Tm e^(-kt)
      const tm = x[0], k = x[1], t = x[2], tv = tm * Math.exp(-k * t), rate = -k * tv, xmax = Math.max(t * 1.7, 4 / k);
      board({ f: (v) => tm * Math.exp(-k * v), xr: [0, xmax], yr: [0, 1.15 * tm], tangent: { x: t, y: tv, s: rate }, vlines: [t], markers: [{ x: t, y: tv }] });
      const fr = cl(tv / tm, 0, 1), cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.6, 36), solid(mix(C.accent, C.bad, fr)));
      cyl.rotation.z = Math.PI / 2; add(cyl, 0, -1.55, 0.8);
      const gh = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 2.7, 36), V3.ghost(C.bad, 0.18)); gh.rotation.z = Math.PI / 2; add(gh, 0, -1.55, 0.8);
      return tx(`T(t) = T_m·e^(−kt); yeşil teğetin eğimi dT/dt = ${g(rate)} °C/s. Önde: t = ${g(t)} s'de külçe ${g(tv)} °C (renk = sıcaklık, soluk kırmızı = T_m).`, `T(t) = T_m·e^(−kt); the green tangent slope is dT/dt = ${g(rate)} °C/s. Front: the billet at t = ${g(t)} s is ${g(tv)} °C (colour = temperature, faint red = T_m).`);
    };

    S[5] = (x) => { // Basquin S-N, log-log line
      const a = x[0], b = x[1], r = x[2] / 100, m = x[3], la = Math.log10(a), f = Math.pow(1 - r, -1 / b), m1 = m + Math.log10(f);
      board({ f: (v) => la - b * v, xr: [3, 8.5], yr: [la - b * 8.5 - 0.15, la - b * 3 + 0.15], vlines: [m, m1], hlines: [la - b * m, la - b * m1], markers: [{ x: m, y: la - b * m, col: C.purple }, { x: m1, y: la - b * m1 }] });
      const pts = [[0, -2.7], [0.5, -2.7], [0.5, -2.2], [0.26, -1.8], [0.26, -1.0], [0.5, -0.6], [0.5, -0.3], [0, -0.3]];
      const spec = V3.lathe(pts, solid(C.sub)); spec.position.set(-1.6, 0, 0.8); world.add(spec);
      arrow([0, 1, 0], [-1.6, -0.3, 0.8], 0.6, C.bad); arrow([0, -1, 0], [-1.6, -2.7, 0.8], 0.6, C.bad);
      const h0 = (m - 3) * 0.3, h1 = (m1 - 3) * 0.3;
      box(0.5, h0, 0.5, solid(C.purple), 0.4, -2.8 + h0 / 2, 0.8); box(0.5, h1, 0.5, solid(C.gold), 1.3, -2.8 + h1 / 2, 0.8);
      return tx(`log S – log N doğrusu (eğim −b). Önde: yorulma numunesi ve ömür çubukları: log N₀ = ${g(m)} (mor), gerilim %${g(x[2])} azalınca log N₁ = ${g(m1)} (altın, ×${g(f)}).`, `The log S – log N line (slope −b). Front: a fatigue specimen and life bars: log N₀ = ${g(m)} (purple), after a ${g(x[2])} % stress cut log N₁ = ${g(m1)} (gold, ×${g(f)}).`);
    };

    S[6] = (x) => { // C = a/t + b t, layer stack
      const ts = x[0], b = x[1], a = b * ts * ts, cm = 2 * b * ts;
      board({ f: (v) => (v <= 0 ? NaN : a / v + b * v), xr: [0, 2.6 * ts], yr: [0, 2.3 * cm], curves: [{ f: (v) => (v <= 0 ? NaN : a / v), col: C.purple }, { f: (v) => b * v, col: C.bad }], vlines: [ts], markers: [{ x: ts, y: cm }] });
      const lay = 0.05 + 0.2 * cl(ts / 80, 0, 1), n = Math.max(1, Math.min(40, Math.floor(1.6 / lay)));
      for (let i = 0; i < n; i++) box(2.4, lay * 0.9, 1.6, solid(mix(C.accent, C.orange, i / Math.max(1, n - 1))), 0, -2.8 + lay * (i + 0.5), 0.8);
      return tx(`Maliyet U eğrisi: a/t (mor) + b·t (kırmızı), minimum t* = ${g(ts)} µm. Önde: sabit yükseklikli parçada ${n} katman.`, `U-shaped cost: a/t (purple) + b·t (red), minimum at t* = ${g(ts)} µm. Front: a fixed-height part built from ${n} layers.`);
    };

    S[7] = (x) => { // Taylor V T^n = C, turning
      const v0 = x[0], t0 = x[1], n = x[2], pc = x[3] / 100, v1 = v0 * (1 + pc), t1 = t0 * Math.pow(1 + pc, -1 / n), sl = -t0 / (n * v0), tf = (v) => (v <= 0 ? NaN : t0 * Math.pow(v0 / v, 1 / n));
      board({ f: tf, xr: [0.6 * v0, 1.5 * v0], yr: [0, tf(0.6 * v0) * 1.05], tangent: { x: v0, y: t0, s: sl }, markers: [{ x: v0, y: t0, col: C.purple }, { x: v1, y: t1 }] });
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 40), solid(C.sub)); cyl.rotation.z = Math.PI / 2; add(cyl, 0, -1.55, 0.8);
      box(0.9, 0.25, 0.5, solid(C.gold), 0.4, -0.55, 0.8);
      const wear = cl(0.12 * t0 / Math.max(t1, 1e-6), 0.05, 0.5); box(0.3, wear * 0.4, 0.5, solid(C.bad), 0.0, -0.74, 0.8);
      add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 20, Math.PI * 1.5), solid(C.orange)), 1.0, -0.4, 0.8);
      arrow([0, 0, 1], [-1.0, -0.7, 1.6], 0.5 + 0.8 * cl(v1 / 230, 0, 1), C.good);
      return tx(`V·T^n = C eğrisi (T, V'nin azalan fonksiyonu); teğet −T/(nV) eğimli. Hız %${g(x[3])} artınca takım ömrü ${g(t0)} → ${g(t1)} dk; önde torna: kırmızı alan aşınma.`, `The curve V·T^n = C (tool life falls with speed); tangent slope −T/(nV). With speed +${g(x[3])} % tool life goes ${g(t0)} → ${g(t1)} min; front: turning, the red patch is tool wear.`);
    };

    S[8] = (x) => { // stress-strain, integral
      const su = x[0], xu = x[1], x1 = x[2], eu = xu / 100, E = 2 * su / eu, c = su / (eu * eu), sg = (v) => E * (v / 100) - c * (v / 100) * (v / 100), sg1 = sg(x1), tg1 = E - 2 * c * (x1 / 100);
      board({ f: sg, xr: [0, 1.7 * xu], yr: [0, 1.3 * su], area: { x0: 0, x1: x1, col: C.orange }, curves: [{ f: (v) => E * v / 100, col: C.sub }], tangent: { x: x1, y: sg1, s: tg1 / 100 }, vlines: [x1], markers: [{ x: xu, y: su, col: C.purple }, { x: x1, y: sg1 }] });
      const stretch = 1 + 4 * x1 / 100, base = [[0, -1.8], [0.5, -1.8], [0.5, -1.3], [0.26, -0.9], [0.26, 0.9], [0.5, 1.3], [0.5, 1.8], [0, 1.8]];
      const sp = V3.lathe(base.map(([rr, h]) => [rr, h * stretch]), solid(mix(C.accent, C.orange, sg1 / su)), 'x'); sp.position.set(0, -1.6, 0.8); world.add(sp);
      const gh = V3.lathe(base, V3.ghost(C.sub, 0.2), 'x'); gh.position.set(0, -1.6, 0.8); world.add(gh);
      arrow([1, 0, 0], [1.8 * stretch, -1.6, 0.8], 0.6, C.bad); arrow([-1, 0, 0], [-1.8 * stretch, -1.6, 0.8], 0.6, C.bad);
      return tx(`σ–ε eğrisi; turuncu alan ∫₀^ε₁ σ dε (depolanan enerji), yeşil teğet E_t = ${g(tg1)} MPa. Önde numune ε₁ = %${g(x1)} (uzama ×4 abartılı; soluk = ilk boy).`, `The σ–ε curve; the orange area is ∫₀^ε₁ σ dε (stored energy), green tangent E_t = ${g(tg1)} MPa. Front: the specimen at ε₁ = ${g(x1)} % (stretch exaggerated ×4; faint = original length).`);
    };

    S[9] = (x) => { // first-order step response
      const Y = x[0], tau = x[1], t1 = x[2], y1 = Y * (1 - Math.exp(-t1 / tau)), t95 = tau * Math.log(20), xm = Math.max(5 * tau, 1.2 * t1), f = (v) => Y * (1 - Math.exp(-v / tau));
      board({ f, xr: [0, xm], yr: [0, 1.25 * Y], area: { x0: 0, x1: xm, fu: () => Y, f2: f, col: C.orange }, tangent: { x: 0, y: 0, s: Y / tau }, hlines: [Y], markers: [{ x: t95, y: 0.95 * Y, col: C.purple }, { x: t1, y: y1 }] });
      const th = 1.8, fr = cl(y1 / Y, 0, 1);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, th, 20), V3.ghost(C.sub, 0.25)), 0, -1.7, 0.8);
      const hh = Math.max(th * fr, 0.02); box(0.18, hh, 0.18, solid(mix(C.accent, C.bad, fr)), 0, -2.6 + hh / 2, 0.8);
      sphere(0.34, solid(mix(C.accent, C.bad, fr)), 0, -2.75, 0.8);
      box(0.6, 0.03, 0.03, solid(C.purple), 0, -2.6 + th * 0.95, 0.8);
      return tx(`y(t) = Y(1 − e^(−t/τ)); turuncu alan Y ile yanıt arasındaki ∫(Y−y)dt = Y·τ. Önde termometre t₁ = ${g(t1)} s'de ${g(y1)} °C (mor çizgi = %95).`, `y(t) = Y(1 − e^(−t/τ)); the orange area between Y and the response is ∫(Y−y)dt = Y·τ. Front: the thermometer at t₁ = ${g(t1)} s reads ${g(y1)} °C (purple tick = 95 %).`);
    };

    S[10] = (x) => { // second-order step response
      const z = x[0], wn = x[1], A = x[2], q = Math.sqrt(1 - z * z), sg = z * wn, wd = wn * q, tp = Math.PI / wd, mp = Math.exp(-Math.PI * z / q), ts = 4 / sg;
      const yf = (v) => (v < 0 ? NaN : A * (1 - Math.exp(-sg * v) * (Math.cos(wd * v) + sg / wd * Math.sin(wd * v))));
      board({ f: yf, xr: [0, Math.max(3.2 * tp, 1.3 * ts)], yr: [0, A * (1 + mp) * 1.25], hlines: [A], vlines: [tp], markers: [{ x: tp, y: A * (1 + mp) }] });
      const pos = (mm) => -0.4 + mm * 0.5, xT = pos(A), xP = pos(A * (1 + mp)), L = Math.max(xP - 0.5 + 2.7, 0.3);
      box(0.2, 1.6, 1.2, solid(C.sub), -2.8, -1.7, 0.8);
      helix(L, 0.22, 9, 0.025, solid(C.accent), -2.7, -1.45, 0.8);
      const dmp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, L, 12), solid(C.sub)); dmp.rotation.z = Math.PI / 2; add(dmp, -2.7 + L / 2, -2.05, 0.8);
      box(1, 1, 1, V3.ghost(C.good, 0.3), xT, -1.7, 0.8); edges(1, 1, 1, C.good, xT, -1.7, 0.8);
      box(1, 1, 1, solid(C.orange), xP, -1.7, 0.8);
      return tx(`Basamak yanıtı: tepe t_p = ${g(tp)} s'de aşım %${g(100 * mp)} (y′ = 0). Önde kütle–yay–sönümleyici: yeşil çerçeve hedef A = ${g(A)} mm, turuncu kütle tepe konumu.`, `Step response: the peak at t_p = ${g(tp)} s has ${g(100 * mp)} % overshoot (y′ = 0). Front: mass–spring–damper: the green frame is the target A = ${g(A)} mm, the orange mass is at its peak position.`);
    };

    S[11] = (x) => { // milling cost
      const vs = x[0], b = x[1], B = b / 10000, a = 2 * b * vs * vs * vs / 10000, cm = 3 * B * vs * vs;
      board({ f: (v) => (v <= 0 ? NaN : a / v + B * v * v), xr: [0, 2 * vs], yr: [0, 2.3 * cm], curves: [{ f: (v) => (v <= 0 ? NaN : a / v), col: C.purple }, { f: (v) => B * v * v, col: C.bad }], vlines: [vs], markers: [{ x: vs, y: cm }] });
      box(3.2, 1, 1.6, solid(C.sub), 0, -2.45, 0.8);
      const R = 0.75, cy = -1.2, cut = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.6, 40), solid(C.accent, { transparent: true, opacity: 0.7 })); cut.rotation.x = Math.PI / 2; add(cut, 0, cy, 0.8);
      for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, t = box(0.2, 0.12, 1.6, solid(C.gold), R * Math.cos(an), cy + R * Math.sin(an), 0.8); t.rotation.z = an; }
      arrow([1, 0, 0], [-0.7, cy + R + 0.2, 1.7], 0.5 + 0.9 * cl(vs / 150, 0, 1), C.good);
      return tx(`Maliyet C(V) = A/V + B·V²: mor A/V, kırmızı B·V², minimum V* = ${g(vs)} m/dk. Önde silindirik freze kesici (yeşil ok = kesme hızı).`, `Cost C(V) = A/V + B·V²: purple A/V, red B·V², minimum at V* = ${g(vs)} m/min. Front: a slab milling cutter (green arrow = cutting speed).`);
    };

    S[12] = (x) => { // bearing life L=(C/P)^3
      const cc = x[0], pp = x[1], r = x[2] / 100, L = Math.pow(cc / pp, 3), Lp = -3 * L / pp, L1 = L * Math.pow(1 + r, -3), lf = (v) => (v <= 0 ? NaN : Math.pow(cc / v, 3));
      board({ f: lf, xr: [0.4 * pp, 1.7 * pp], yr: [0, lf(0.6 * pp) * 1.05], tangent: { x: pp, y: L, s: Lp }, markers: [{ x: pp, y: L, col: C.purple }, { x: pp * (1 + r), y: L1 }] });
      const sc = 0.75, cy = -1.5, z = 0.8;
      const ring = (r0, r1, c) => { const m = V3.lathe([[r0, -0.2], [r1, -0.2], [r1, 0.2], [r0, 0.2], [r0, -0.2]], c); m.rotation.x = Math.PI / 2; m.scale.setScalar(sc); m.position.set(0, cy, z); world.add(m); };
      ring(1.3, 1.7, solid(C.sub)); ring(0.6, 0.95, solid(C.accent));
      for (let i = 0; i < 9; i++) { const an = i * 2 * Math.PI / 9; sphere(0.2 * sc, solid(C.gold), 1.12 * sc * Math.cos(an), cy + 1.12 * sc * Math.sin(an), z); }
      const al = 0.5 + 0.9 * cl(pp / 10, 0, 1);
      arrow([0, -1, 0], [0, cy + 0.95 * sc + al + 0.1, z], al, C.bad);
      return tx(`L = (C/P)³ eğrisi; yeşil teğet eğimi dL/dP = ${g(Lp)}. Yük %${g(x[2])} artınca ömür ${g(L)} → ${g(L1)} (10⁶ dev). Önde bilyalı rulman; ok = yük P.`, `The curve L = (C/P)³; green tangent slope dL/dP = ${g(Lp)}. With the load +${g(x[2])} % life goes ${g(L)} → ${g(L1)} (10⁶ rev). Front: a ball bearing; the arrow is the load P.`);
    };

    S[13] = (x) => { // hardening spring, stored energy
      const k = x[0], cc = x[1], d = x[2], ff = (v) => k * v + cc * v * v * v, Fd = ff(d), kt = k + 3 * cc * d * d, fm = ff(1.5 * d), W = k * d * d / 2 + cc * Math.pow(d, 4) / 4;
      board({ f: ff, xr: [0, 1.5 * d], yr: [0, fm * 1.05], area: { x0: 0, x1: d, col: C.orange }, curves: [{ f: (v) => k * v, col: C.sub }], tangent: { x: d, y: Fd, s: kt }, vlines: [d], markers: [{ x: d, y: Fd }] });
      const len = 3.0 - 1.6 * cl(d / 5, 0, 1), x0 = -2.2, al = 0.4 + 0.9 * cl(Fd / 5250, 0, 1);
      box(0.2, 1.6, 1.2, solid(C.sub), x0 - 0.1, -1.7, 0.8);
      helix(len, 0.3, 9, 0.04, solid(C.accent), x0, -1.7, 0.8);
      box(0.15, 1.2, 1, solid(C.gold), x0 + len + 0.08, -1.7, 0.8);
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 10), solid(C.sub)); bolt.rotation.z = Math.PI / 2; add(bolt, x0 + 1.6, -1.7, 0.8);
      arrow([-1, 0, 0], [x0 + len + 0.2 + al, -1.7, 0.8], al, C.bad);
      return tx(`F = kx + cx³ ve eğri altındaki turuncu alan W = ∫₀^δ F dx = ${g(W)} N·mm. Önde: δ = ${g(d)} mm sıkışmış sertleşen yay.`, `F = kx + cx³ with the orange area W = ∫₀^δ F dx = ${g(W)} N·mm. Front: the hardening spring compressed by δ = ${g(d)} mm.`);
    };

    S[14] = (x) => { // shaft torque cycle
      const tp = x[0], n = x.length > 1 ? x[1] : 600, tm = tp / Math.PI, th1 = Math.asin(1 / Math.PI);
      board({ f: (v) => (v < 0 || v > 2 * Math.PI ? NaN : (v <= Math.PI ? tp * Math.sin(v) : 0)), xr: [0, 2 * Math.PI], yr: [0, 1.25 * tp], area: { x0: 0, x1: Math.PI, col: C.orange }, hlines: [tm], markers: [{ x: th1, y: tm, col: C.purple }, { x: Math.PI - th1, y: tm, col: C.purple }, { x: Math.PI / 2, y: tp }] });
      const R = 0.7 + 0.5 * cl(tp / 300, 0, 1), cy = -1.55, z = 0.8;
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 12), solid(C.sub)); sh.rotation.x = Math.PI / 2; add(sh, 0, cy, z);
      const half = (s, l, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.3, 40, 1, false, s, l), solid(c, { side: THREE.DoubleSide })); m.rotation.x = Math.PI / 2; add(m, 0, cy, z); };
      half(0, Math.PI, C.orange); half(Math.PI, Math.PI, C.sub);
      const sweep = Math.PI * (0.3 + 1.2 * cl((n - 300) / 900, 0, 1));
      add(new THREE.Mesh(new THREE.TorusGeometry(R + 0.2, 0.03, 8, 40, sweep), solid(C.good)), 0, cy, z + 0.3);
      return tx(`T(θ) yarım sinüs: turuncu alan çevrim işi ∫T dθ = ${g(2 * tp)} N·m, ortalama T = ${g(tm)} N·m. Önde volan: turuncu yarı güç strokunu, yeşil yay ${g(n)} dev/dk'yı gösterir.`, `T(θ) half sine: the orange area is the cycle work ∫T dθ = ${g(2 * tp)} N·m, mean T = ${g(tm)} N·m. Front: the flywheel: the orange half is the power stroke, the green arc length shows ${g(n)} rpm.`);
    };

    S[15] = (x) => { // Paris law life integral
      const ds = x[0], a0 = x[1], ac = x[2], f = (a) => (a <= 0 ? NaN : (a0 / a) * (a0 / a));
      board({ f, xr: [0, ac * 1.3], yr: [0, 1.15], area: { x0: a0, x1: ac, col: C.orange }, vlines: [a0, ac], markers: [{ x: a0, y: 1, col: C.purple }, { x: ac, y: f(ac) }] });
      const Wd = 3.4, Hh = 2.2, cy = -1.55, z = 0.8, cr = (a) => cl(a, 0, 30) / 30 * 3.0, l0 = Math.max(cr(a0), 0.03), lc = Math.max(cr(ac), l0 + 0.03);
      box(Wd, Hh, 0.2, solid(C.sub), 0, cy, z);
      box(lc, 0.07, 0.24, V3.ghost(C.bad, 0.6), -Wd / 2 + lc / 2, cy, z);
      box(l0, 0.07, 0.26, solid(C.purple), -Wd / 2 + l0 / 2, cy, z);
      const al = 0.4 + 0.8 * cl(ds / 120, 0, 1);
      arrow([0, 1, 0], [0.3, cy + Hh / 2, z], al, C.bad); arrow([0, -1, 0], [0.3, cy - Hh / 2, z], al, C.bad);
      return tx(`Entegrand 1/(K′a²) ~ (a₀/a)²; turuncu alan a₀ = ${g(a0)}'dan a_c = ${g(ac)} mm'ye N_f ile orantılıdır. Önde Δσ = ${g(ds)} MPa'lı levha: mor ilk çatlak, kırmızı kritik çatlak.`, `The integrand 1/(K′a²) ~ (a₀/a)²; the orange area from a₀ = ${g(a0)} to a_c = ${g(ac)} mm is proportional to N_f. Front: a plate under Δσ = ${g(ds)} MPa: purple initial crack, red critical crack.`);
    };

    return { update(p) {
      world.position.set(0, 0, 0); world.scale.setScalar(1);
      const x = (p && p.p ? Array.prototype.slice.call(p.p) : []).map((v) => (fin(v) ? v : 1));
      while (x.length < 5) x.push(1);
      const scn = p && fin(p.scn) ? Math.max(0, Math.min(15, Math.floor(p.scn))) : 0;
      return S[scn](x);
    } };
  };

  const d = Topics.get('engineering').find((x) => x.id === 'engMaterials'); if (d) d.view3d = { build: builder, dist: 11 };
})();
