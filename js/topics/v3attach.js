// Attaches 3D views (View3D) to existing tabs of other chapters: unit circle (helix), conic sections (cone cut by a plane),
// engineering statics (loaded beam) and thermo-fluid (pipe flow, pipe wall, hydrostatic gate).
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const V3 = View3D.V3;
  const find = (ch, id) => Topics.get(ch).find((d) => d.id === id);
  const arrow = (THREE, from, dir, len, color, hl, hw) => new THREE.ArrowHelper(dir.clone().normalize(), from, Math.max(len, 0.02), new THREE.Color(color).getHex(), hl === undefined ? 0.18 : hl, hw === undefined ? 0.1 : hw);

  // ---- trig: unit circle as the shadow of a helix ----
  const helix = ({ THREE, world }) => ({ update(p, C) {
    const th = (p.deg || 0) * Math.PI / 180, k = 0.28, W = 1.7; world.position.set(0, 0, 0); world.scale.setScalar(1);
    const ring = []; for (let i = 0; i <= 96; i++) { const a = 2 * Math.PI * i / 96; ring.push([Math.cos(a), -2.2, Math.sin(a)]); } world.add(V3.line(ring, C.sub));
    const hx = [], sw = [], cw = []; for (let i = 0; i <= 240; i++) { const t = -2 * Math.PI + 4 * Math.PI * i / 240; hx.push([Math.cos(t), k * t, Math.sin(t)]); sw.push([-W, k * t, Math.sin(t)]); cw.push([Math.cos(t), k * t, -W]); }
    world.add(V3.line(hx, C.accent)); world.add(V3.line(sw, C.orange)); world.add(V3.line(cw, C.good));
    const P = new THREE.Vector3(Math.cos(th), k * th, Math.sin(th));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), V3.mat(C.gold)); dot.position.copy(P); world.add(dot);
    world.add(V3.line([P, new THREE.Vector3(-W, P.y, P.z)], C.orange)); world.add(V3.line([P, new THREE.Vector3(P.x, P.y, -W)], C.good));
    world.add(V3.line([[0, -2.2, 0], [Math.cos(th), -2.2, Math.sin(th)]], C.gold));
    return tx(`θ = ${(p.deg || 0).toFixed(0)}°: sarmal yukarı doğru dönen noktadır; turuncu gölge sin θ, yeşil gölge cos θ dalgasıdır.`, `θ = ${(p.deg || 0).toFixed(0)}°: the helix is the rotating point lifted along time; the orange shadow is the sin θ wave, the green one the cos θ wave.`);
  } });

  // ---- numbers/functions: conic sections ----
  const conic = (kind) => ({ THREE, world }) => ({ update(p, C) {
    let m = 0, c = 1.8;
    if (kind === 'ellipse') { const a = Math.max(p.a, p.b), b = Math.min(p.a, p.b), e = Math.sqrt(Math.max(0, 1 - (b / a) * (b / a))); m = e / Math.sqrt(2 - e * e); c = 1.8; }
    if (kind === 'parabola') { m = 1; c = 1.4; }
    world.position.set(0, 0, 0); world.scale.setScalar(1);
    world.add(V3.lathe([[0, 0], [3.5, 3.5]], V3.ghost(C.accent, 0.22))); world.add(V3.lathe([[0, 0], [3.5, -3.5]], V3.ghost(C.accent, 0.12)));
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), V3.ghost(C.orange, 0.22)); pl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-m, 1, 0).normalize()); pl.position.set(0, c, 0); world.add(pl);
    let run = []; const flush = () => { if (run.length > 1) world.add(V3.line(run, C.good)); run = []; };
    for (let i = 0; i <= 400; i++) { const ph = 2 * Math.PI * i / 400, den = 1 - m * Math.cos(ph), t = c / den; if (den <= 1e-6 || t < 0 || t > 3.4) { flush(); continue; } run.push([t * Math.cos(ph), t, t * Math.sin(ph)]); }
    if (kind !== 'parabola') run.push(run[0] || [0, 0, 0]); flush();
    world.add(V3.axisLine(4, C.sub));
    const nm = { circle: tx('çember', 'circle'), ellipse: tx('elips', 'ellipse'), parabola: tx('parabol', 'parabola') }[kind];
    return tx(`Koniyi düzlemle keserek ${nm} elde edilir (yeşil eğri). Düzlemin eğimi eğrinin türünü belirler.`, `Cutting the cone with a plane gives the ${nm} (green curve). The tilt of the plane decides the type of curve.`);
  } });

  // ---- engineering statics: loaded beam (scenarios 1 and 2) ----
  const beam = ({ THREE, world }) => ({ update(p, C) {
    world.position.set(0, 0, 0); world.scale.setScalar(1);
    if (p.scn > 1) return tx('Bu senaryo için 3B görünüm henüz yok.', 'There is no 3D view for this scenario yet.');
    const L = 6, tri = p.scn === 0;
    const b = new THREE.Mesh(new THREE.BoxGeometry(L, 0.35, 0.8), V3.mat(C.accent)); b.position.set(0, 0, 0); world.add(b);
    const sup = (x) => { const m = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 4), V3.mat(C.sub)); m.position.set(x, -0.42, 0); m.rotation.y = Math.PI / 4; world.add(m); };
    sup(-L / 2 + 0.2); sup(L / 2 - 0.2);
    const n = 13; for (let i = 0; i <= n; i++) { const x = -L / 2 + L * i / n, h = tri ? 1.6 * (i / n) : 0.9; if (h > 0.05) world.add(arrow(THREE, new THREE.Vector3(x, 0.18 + h, 0), new THREE.Vector3(0, -1, 0), h, C.fg)); }
    const xr = tri ? L / 2 - L / 3 : 0, hr = tri ? 2.3 : 1.6; // resultant: triangle -> 2L/3 from the zero end
    world.add(arrow(THREE, new THREE.Vector3(tri ? -L / 2 + 2 * L / 3 : 0, 0.18 + hr + 0.4, 0), new THREE.Vector3(0, -1, 0), hr + 0.4, C.orange, 0.25, 0.16));
    return tx(tri ? 'Üçgen yük (boyuttan bağımsız şema): bileşke (turuncu) üçgenin ağırlık merkezinde, sıfır uçtan 2L/3 uzaklıkta.' : 'Düzgün yük (şema): bileşke (turuncu) açıklığın ortasında, W = w·L.', tri ? 'Triangular load (schematic): the resultant (orange) acts at the centroid of the triangle, 2L/3 from the zero end.' : 'Uniform load (schematic): the resultant (orange) acts at mid-span, W = w·L.');
  } });

  // ---- engineering thermo-fluid: pipe flow (10), pipe wall (11), hydrostatic gate (16) ----
  const thermo = ({ THREE, world }) => ({ update(p, C) {
    world.position.set(0, 0, 0); world.scale.setScalar(1);
    if (p.scn === 9) {
      const R = 1.2, Lp = 5; const pipe = new THREE.Mesh(new THREE.CylinderGeometry(R, R, Lp, 48, 1, true), V3.ghost(C.accent, 0.2)); pipe.rotation.z = Math.PI / 2; world.add(pipe);
      for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const y = i * R / 4.3, z = j * R / 4.3, r2 = (y * y + z * z) / (R * R); if (r2 > 1) continue; const u = 2.4 * (1 - r2); world.add(arrow(THREE, new THREE.Vector3(-Lp / 2 + 0.2, y, z), new THREE.Vector3(1, 0, 0), u + 0.05, C.orange, 0.12, 0.07)); }
      const prof = []; for (let i = -20; i <= 20; i++) { const y = R * i / 20; prof.push([-Lp / 2 + 0.2 + 2.4 * (1 - (y * y) / (R * R)), y, 0]); } world.add(V3.line(prof, C.good));
      return tx('Laminer akışta hız profili parabolik (paraboloit): u(r) = u₀(1 − r²/R²); duvarda sıfır, eksende en büyük.', 'In laminar flow the velocity profile is parabolic (a paraboloid): u(r) = u₀(1 − r²/R²); zero at the wall, maximum on the axis.');
    }
    if (p.scn === 10) {
      const Ri = 0.8, Ro = 1.6, Lp = 3.4;
      const o = new THREE.Mesh(new THREE.CylinderGeometry(Ro, Ro, Lp, 56, 1, true), V3.ghost(C.accent, 0.25)); const i = new THREE.Mesh(new THREE.CylinderGeometry(Ri, Ri, Lp, 56, 1, true), V3.ghost(C.bad, 0.3)); world.add(o); world.add(i);
      for (let k = 0; k < 16; k++) { const a = 2 * Math.PI * k / 16, d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); [-1, 0, 1].forEach((y) => world.add(arrow(THREE, d.clone().multiplyScalar(Ri), d, 0.8 * (Ri / Ri) * 0.9, C.orange, 0.12, 0.07).translateY(y))); }
      return tx('Silindirik duvarda ısı akışı radyal doğrultudadır; alan 2πrL büyüdüğü için ısı akısı dışa doğru azalır (T, ln r ile değişir).', 'Heat flows radially through the cylindrical wall; because the area 2πrL grows outward the flux drops (T varies with ln r).');
    }
    if (p.scn === 15) {
      const gate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 2), V3.mat(C.accent)); gate.rotation.z = -0.35; world.add(gate);
      const water = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 2), V3.ghost(C.accent, 0.16)); water.position.set(-1.55, 0.2, 0); world.add(water);
      for (let k = 0; k <= 8; k++) { const y = 1.2 - 2.4 * k / 8, depth = 1.4 - y; world.add(arrow(THREE, new THREE.Vector3(-0.3 - 1.7 * 0 - depth * 0.55, y, 0), new THREE.Vector3(1, 0, 0), depth * 0.55 + 0.05, C.orange, 0.12, 0.07)); }
      return tx('Basınç derinlikle doğrusal artar (p = ρgh); kapağa etkiyen toplam kuvvet bu üçgen basınç dağılımının integralidir.', 'Pressure grows linearly with depth (p = ρgh); the total force on the gate is the integral of this triangular pressure distribution.');
    }
    return tx('Bu senaryo için 3B görünüm henüz yok.', 'There is no 3D view for this scenario yet.');
  } });

  // ---- functions: hyperbolic functions -> catenary and catenoid (cosh as a shape), point of the unit hyperbola ----
  const catenoid = ({ THREE, world }) => ({ update(p, C) {
    const a = p.a || 1.5, t = Math.max(-2.5, Math.min(2.5, p.t === undefined ? 1 : p.t)), X = 2.4, f = (x) => a * Math.cosh(x / a);
    world.position.set(0, 0, 0); world.scale.setScalar(1);
    let M = 0; for (let i = 0; i <= 30; i++) M = Math.max(M, f(-X + 2 * X * i / 30)); const s = 2.6 / Math.max(M, 1);
    world.scale.setScalar(s);
    world.add(V3.lathe(V3.sample(f, -X, X, 60).map(([x, y]) => [y, x]), V3.ghost(C.accent, 0.3), 'x'));
    world.add(V3.line(V3.sample(f, -X, X, 80).map(([x, y]) => [x, y, 0]), C.orange));
    world.add(V3.axisLine(X + 0.5, C.sub, 'x'));
    const ring = []; for (let i = 0; i <= 64; i++) { const th = 2 * Math.PI * i / 64; ring.push([t, f(t) * Math.cos(th), f(t) * Math.sin(th)]); } world.add(V3.line(ring, C.good));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08 / s, 16, 12), V3.mat(C.gold)); dot.position.set(t, f(t), 0); world.add(dot);
    return tx(`Zincir eğrisi y = a·cosh(x/a) (turuncu) x ekseni etrafında dönerse katenoit yüzeyi oluşur; yeşil halka x = ${t.toFixed(2)} kesiti (yarıçap a·cosh(t/a)).`, `The catenary y = a·cosh(x/a) (orange) revolved about the x-axis gives the catenoid; the green ring is the section at x = ${t.toFixed(2)} (radius a·cosh(t/a)).`);
  } });

  const put = (ch, id, builder, dist) => { const d = find(ch, id); if (d) d.view3d = { build: builder, dist: dist || 9 }; };
  put('trig', 'unitCircle', helix, 10);
  put('numbers', 'circle', conic('circle'), 11);
  put('numbers', 'parabola', conic('parabola'), 11);
  put('functions', 'ellipse', conic('ellipse'), 11);
  put('functions', 'hyperbolic', catenoid, 9);
  put('engineering', 'engStatics', beam, 11);
  put('engineering', 'engThermoFluid', thermo, 9);
})();
