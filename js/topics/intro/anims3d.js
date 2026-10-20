// 3D (Three.js) animations for the "Başlangıç" tabs. Each: { kind:'3d', title, caption, init({THREE, scene, world, camera, C}) -> { update(t) } }.
const IntroAnims3D = (function () {
  const T = (a, b) => [a, b];
  const mat = (THREE, color, opts) => new THREE.MeshPhongMaterial(Object.assign({ color: new THREE.Color(color), shininess: 40 }, opts || {}));

  const disks = {
    kind: '3d', title: T('Dönel cisim: disklerle hacim', 'Solid of revolution: volume by disks'),
    caption: T('Eğri y-ekseni etrafında dönerek cismi oluşturur; ince disklerin hacimleri toplanır, disk sayısı arttıkça toplam hacme yaklaşılır: V = π∫ r(y)² dy.', 'The curve spins about the y-axis to form the solid; the volumes of thin disks are added and the sum approaches the true volume as the disks multiply: V = π∫ r(y)² dy.'),
    init({ THREE, world, C }) {
      const L = 4, r = (y) => 0.6 + 0.55 * Math.sqrt(y), N = 40;
      const pts = []; for (let i = 0; i <= 40; i++) { const y = L * i / 40; pts.push(new THREE.Vector2(r(y), y - L / 2)); }
      world.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 56), mat(THREE, C.accent, { transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })));
      const prof = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y, 0))), new THREE.LineBasicMaterial({ color: new THREE.Color(C.orange) })); world.add(prof);
      world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -L / 2 - 0.4, 0), new THREE.Vector3(0, L / 2 + 0.4, 0)]), new THREE.LineBasicMaterial({ color: new THREE.Color(C.sub) })));
      const geo = new THREE.CylinderGeometry(1, 1, 1, 44), ds = [];
      for (let i = 0; i < N; i++) { const m = new THREE.Mesh(geo, mat(THREE, i % 2 ? C.good : '#22c55e')); m.visible = false; world.add(m); ds.push(m); }
      return { update(t) {
        const n = 3 + Math.floor((t * 3) % 28), dy = L / n;
        ds.forEach((d, i) => { if (i < n) { const y = (i + 0.5) * dy; d.visible = true; d.position.y = y - L / 2; d.scale.set(r(y), dy * 0.92, r(y)); } else d.visible = false; });
      } };
    },
  };
  const shells = {
    kind: '3d', title: T('Silindirik kabuklar', 'Cylindrical shells'),
    caption: T('Eğrinin altındaki bölge y-ekseni etrafında döner; iç içe ince silindir kabuklar eklenir: V = 2π∫ x·f(x) dx.', 'The region under the curve spins about the y-axis; thin nested cylindrical shells are added: V = 2π∫ x·f(x) dx.'),
    init({ THREE, world, C }) {
      const R = 3, f = (x) => 3 - 0.3 * x * x, N = 18, y0 = -1.5;
      const prof = []; for (let i = 0; i <= 40; i++) { const x = R * i / 40; prof.push(new THREE.Vector3(x, f(x) + y0, 0)); }
      world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(prof), new THREE.LineBasicMaterial({ color: new THREE.Color(C.orange) })));
      world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y0 - 0.2, 0), new THREE.Vector3(0, y0 + 3.4, 0)]), new THREE.LineBasicMaterial({ color: new THREE.Color(C.sub) })));
      const geo = new THREE.CylinderGeometry(1, 1, 1, 56, 1, true), ss = [];
      for (let i = 0; i < N; i++) { const m = new THREE.Mesh(geo, mat(THREE, new THREE.Color().setHSL(0.55 + 0.25 * i / N, 0.7, 0.55), { side: THREE.DoubleSide, transparent: true, opacity: 0.8 })); m.visible = false; world.add(m); ss.push(m); }
      return { update(t) {
        const n = 2 + Math.floor((t * 2.5) % (N - 1));
        ss.forEach((s, i) => { if (i < n) { const x = (i + 0.5) * R / N; s.visible = true; s.scale.set(x, f(x), x); s.position.y = f(x) / 2 + y0; } else s.visible = false; });
      } };
    },
  };
  const beam = {
    kind: '3d', title: T('Yük altında ankastre kiriş', 'Cantilever beam under load'),
    caption: T('Yayılı yük arttıkça kiriş eğilir. Eğilme eğrisi yükün integrallenmesiyle bulunur: yük → kesme kuvveti → moment → eğim → çökme.', 'The beam bends as the distributed load grows. The deflection comes from repeated integration: load → shear → moment → slope → deflection.'),
    init({ THREE, world, C }) {
      const Lb = 6, geo = new THREE.BoxGeometry(Lb, 0.5, 0.9, 60, 2, 2), pos = geo.attributes.position, orig = Float32Array.from(pos.array);
      const b = new THREE.Mesh(geo, mat(THREE, C.accent)); world.add(b);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 2.2), mat(THREE, C.sub)); wall.position.x = -Lb / 2 - 0.15; world.add(wall);
      const arrows = []; for (let i = 0; i < 9; i++) { const a = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(-Lb / 2 + (i + 0.5) * Lb / 9, 1.8, 0), 1, new THREE.Color(C.orange).getHex(), 0.25, 0.18); world.add(a); arrows.push(a); }
      const s = (x) => x * x * (6 * Lb * Lb - 4 * Lb * x + x * x) / (3 * Math.pow(Lb, 4));
      return { update(t) {
        const w = 0.5 + 0.5 * Math.sin(t * 0.9);
        for (let i = 0; i < pos.count; i++) { const x = orig[i * 3] + Lb / 2; pos.setY(i, orig[i * 3 + 1] - 1.5 * w * s(x)); }
        pos.needsUpdate = true; geo.computeVertexNormals();
        arrows.forEach((a, i) => { const x = (i + 0.5) * Lb / 9, len = 0.3 + 1.2 * w; a.setLength(len, 0.25, 0.18); a.position.y = 0.25 - 1.5 * w * s(x) + len; });
      } };
    },
  };
  const riemannBars = {
    kind: '3d', title: T('Riemann toplamı: eğrinin altında üç boyutlu çubuklar', 'Riemann sum: 3D bars under the curve'),
    caption: T('f(x) = x²/4 + 0,5 eğrisinin [0, 4] altındaki alan ince çubuklarla doldurulur; çubuk sayısı n arttıkça toplam hacim (alan × derinlik) gerçek integrale yaklaşır.', 'The area under f(x) = x²/4 + 0.5 on [0, 4] is filled with thin bars; as the number n of bars grows, their total volume (area × depth) approaches the true integral.'),
    init({ THREE, world, C }) {
      const f = (x) => 0.25 * x * x + 0.5, N = 40, depth = 1.4, g = new THREE.Group(); g.position.set(-2, -1.4, 0); world.add(g);
      const geo = new THREE.BoxGeometry(1, 1, 1), bars = [];
      for (let i = 0; i < N; i++) { const m = new THREE.Mesh(geo, mat(THREE, C.accent, { transparent: true, opacity: 0.85 })); m.visible = false; g.add(m); bars.push(m); }
      const pts = []; for (let i = 0; i <= 60; i++) { const x = 4 * i / 60; pts.push(new THREE.Vector3(x, f(x), depth / 2)); }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: new THREE.Color(C.orange) })));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.3, 0, depth / 2), new THREE.Vector3(4.5, 0, depth / 2)]), new THREE.LineBasicMaterial({ color: new THREE.Color(C.sub) })));
      return { update(t) {
        const n = 2 + Math.floor((t * 2.2) % 38), dx = 4 / n;
        bars.forEach((b, i) => { if (i < n) { const h = f((i + 0.5) * dx); b.visible = true; b.scale.set(dx * 0.96, h, depth); b.position.set((i + 0.5) * dx, h / 2, 0); } else b.visible = false; });
      } };
    },
  };
  const slices = {
    kind: '3d', title: T('Kesiti kare olan cisim', 'A solid with square cross-sections'),
    caption: T('Tabanı eğri ile x-ekseni arasındaki bölge olan cismin x-eksenine dik kesitleri karedir; kare dilimlerin hacimleri toplanır: V = ∫ A(x) dx.', 'The base is the region between the curve and the x-axis and every cross-section perpendicular to the x-axis is a square; adding up the slice volumes gives V = ∫ A(x) dx.'),
    init({ THREE, world, C }) {
      const f = (x) => 1.6 * Math.sin(Math.PI * x / 4) + 0.4, N = 40, g = new THREE.Group(); g.position.set(-2, -0.9, -0.9); world.add(g);
      const geo = new THREE.BoxGeometry(1, 1, 1), sl = [];
      for (let i = 0; i < N; i++) { const m = new THREE.Mesh(geo, mat(THREE, new THREE.Color().setHSL(0.08 + 0.12 * i / N, 0.85, 0.55), { transparent: true, opacity: 0.9 })); m.visible = false; g.add(m); sl.push(m); }
      const pts = []; for (let i = 0; i <= 60; i++) { const x = 4 * i / 60; pts.push(new THREE.Vector3(x, 0, f(x))); }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: new THREE.Color(C.accent) })));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(4, 0, 0)]), new THREE.LineBasicMaterial({ color: new THREE.Color(C.sub) })));
      return { update(t) {
        const n = 3 + Math.floor((t * 2.5) % 37), dx = 4 / n;
        sl.forEach((m, i) => { if (i < n) { const s = f((i + 0.5) * dx); m.visible = true; m.scale.set(dx * 0.9, s, s); m.position.set((i + 0.5) * dx, s / 2, s / 2); } else m.visible = false; });
      } };
    },
  };
  const antiFamily = {
    kind: '3d', title: T('Ters türev: eğri ailesi y = F(x) + C', 'Antiderivative: the family y = F(x) + C'),
    caption: T('F(x) = x²/4 − x ile bulunan eğrinin her C değeri için bir kopyası vardır; hepsinin türevi aynıdır, bu yüzden ters türev bir eğri ailesidir. Turuncu eğri sırayla seçili C\'yi gösterir.', 'Every value of C gives a copy of F(x) = x²/4 − x; they all have the same derivative, so an antiderivative is a whole family of curves. The orange curve cycles through C.'),
    init({ THREE, world, C }) {
      const F = (x) => x * x / 4 - x, N = 9, ls = [], g = new THREE.Group(); g.position.set(-2, 0, 0); world.add(g);
      for (let i = 0; i < N; i++) { const c = (i - 4) * 0.7, pts = []; for (let k = 0; k <= 40; k++) { const x = 4 * k / 40; pts.push(new THREE.Vector3(x, F(x) + c, (i - 4) * 0.45)); } const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: new THREE.Color(C.accent) })); g.add(l); ls.push(l); }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(4.4, 0, 0)]), new THREE.LineBasicMaterial({ color: new THREE.Color(C.sub) })));
      return { update(t) { const a = Math.floor(t * 1.5) % N; ls.forEach((l, i) => l.material.color.set(i === a ? C.orange : C.accent)); } };
    },
  };
  const betweenStrips = {
    kind: '3d', title: T('İki eğri arasındaki alan', 'The area between two curves'),
    caption: T('Üst eğri f ile alt eğri g arasındaki bölge ince şeritlerle doldurulur; her şeridin yüksekliği f(x) − g(x)\'tir ve şerit sayısı arttıkça toplam alan integrale yaklaşır.', 'The region between the upper curve f and the lower curve g is filled with thin strips; each strip has height f(x) − g(x) and as the strips multiply their total area approaches the integral.'),
    init({ THREE, world, C }) {
      const f = (x) => 3 - 0.2 * (x - 2) * (x - 2), g = (x) => 0.5 * x, N = 40, depth = 1.2, grp = new THREE.Group(); grp.position.set(-2, -1.4, 0); world.add(grp);
      const geo = new THREE.BoxGeometry(1, 1, 1), bars = [];
      for (let i = 0; i < N; i++) { const m = new THREE.Mesh(geo, mat(THREE, C.accent, { transparent: true, opacity: 0.85 })); m.visible = false; grp.add(m); bars.push(m); }
      const mk = (fn, col) => { const pts = []; for (let i = 0; i <= 60; i++) { const x = 4 * i / 60; pts.push(new THREE.Vector3(x, fn(x), depth / 2)); } grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: new THREE.Color(col) }))); };
      mk(f, C.orange); mk(g, C.good);
      return { update(t) {
        const n = 2 + Math.floor((t * 2.2) % 38), dx = 4 / n;
        bars.forEach((b, i) => { if (i < n) { const x = (i + 0.5) * dx, h = f(x) - g(x); b.visible = true; b.scale.set(dx * 0.96, h, depth); b.position.set(x, (f(x) + g(x)) / 2, 0); } else b.visible = false; });
      } };
    },
  };
  const washers = {
    kind: '3d', title: T('Rondela (halka) yöntemi', 'The washer method'),
    caption: T('İki eğri arasındaki bölge eksen etrafında dönünce içi boş bir cisim oluşur; her kesit bir halkadır (alan π(R² − r²)), halkalar toplanınca hacim bulunur.', 'The region between two curves revolves into a hollow solid; every slice is a ring (area π(R² − r²)) and adding the rings gives the volume.'),
    init({ THREE, world, C }) {
      const L = 4, R = (y) => 1.6 + 0.25 * y, r = (y) => 0.6 + 0.1 * y, N = 20, rings = [];
      const po = [], pi = []; for (let i = 0; i <= 30; i++) { const y = L * i / 30; po.push(new THREE.Vector2(R(y), y - L / 2)); pi.push(new THREE.Vector2(r(y), y - L / 2)); }
      world.add(new THREE.Mesh(new THREE.LatheGeometry(po, 56), mat(THREE, C.accent, { transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })));
      world.add(new THREE.Mesh(new THREE.LatheGeometry(pi, 56), mat(THREE, C.bad, { transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })));
      for (let i = 0; i < N; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.5, 1, 56), mat(THREE, i % 2 ? C.good : '#22c55e', { side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.visible = false; world.add(m); rings.push(m); }
      return { update(t) {
        const n = 3 + Math.floor((t * 2.5) % 17), dy = L / n;
        rings.forEach((m, i) => { if (i < n) { const y = (i + 0.5) * dy; m.visible = true; m.geometry.dispose(); m.geometry = new THREE.RingGeometry(r(y), R(y), 56); m.position.y = y - L / 2; } else m.visible = false; });
      } };
    },
  };
  const pumping = {
    kind: '3d', title: T('Sıvı pompalama: tabaka tabaka iş', 'Pumping a liquid: work layer by layer'),
    caption: T('Konik tanktaki su ince tabakalara bölünür; her tabaka kendi derinliğinden tankın üstüne kaldırılır, dolayısıyla derindeki tabaka daha çok iş gerektirir. Toplam iş, tabaka işlerinin integralidir.', 'The water in the conical tank is cut into thin layers; each layer is lifted from its own depth to the top, so deeper layers need more work. The total work is the integral of the layer works.'),
    init({ THREE, world, C }) {
      const H = 3.2, R = 1.6, N = 14, dy = H / N, slabs = [];
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(R, 0.001, H, 48, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.fg), wireframe: true })); tank.position.y = -0.2; world.add(tank);
      for (let j = 0; j < N; j++) { const yy = H - (j + 0.5) * dy, rr = R * yy / H; const m = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, dy * 0.85, 40), mat(THREE, new THREE.Color().setHSL(0.55 - 0.15 * j / N, 0.7, 0.55), { transparent: true, opacity: 0.85 })); m.userData = { y0: yy - H / 2 - 0.2 + H / 2 - H / 2 }; m.position.y = yy - H / 2 - 0.2; world.add(m); slabs.push({ m, y: yy - H / 2 - 0.2 }); }
      const top = H / 2 - 0.2 + 0.7;
      return { update(t) {
        const s = Math.floor(t * 0.9) % (N + 2), f = (t * 0.9) % 1;
        slabs.forEach((o, j) => { if (j < s) o.m.visible = false; else { o.m.visible = true; o.m.position.y = j === s ? o.y + (top - o.y) * f : o.y; } });
      } };
    },
  };
  const pipeFlow = {
    kind: '3d', title: T('Borudaki akış: hız profili', 'Flow in a pipe: the velocity profile'),
    caption: T('Laminer akışta hız borunun eksenine yaklaştıkça artar ve duvarda sıfırdır: u(r) = u₀(1 − r²/R²). Okların uç noktaları bir paraboloit oluşturur; debi bu hız dağılımının integralidir.', 'In laminar flow the speed grows towards the axis and is zero at the wall: u(r) = u₀(1 − r²/R²). The arrow tips trace a paraboloid; the flow rate is the integral of this speed distribution.'),
    init({ THREE, world, C }) {
      const R = 1.2, Lp = 5, arrows = [];
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(R, R, Lp, 48, 1, true), mat(THREE, C.accent, { transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })); pipe.rotation.z = Math.PI / 2; world.add(pipe);
      for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const y = i * R / 4.3, z = j * R / 4.3, r2 = (y * y + z * z) / (R * R); if (r2 > 1) continue; const a = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-Lp / 2 + 0.2, y, z), 1, new THREE.Color(C.orange).getHex(), 0.12, 0.07); world.add(a); arrows.push({ a, u: 2.4 * (1 - r2) }); }
      return { update(t) { const k = 0.8 + 0.2 * Math.sin(t * 1.5); arrows.forEach((o) => o.a.setLength(Math.max(o.u * k, 0.05), 0.12, 0.07)); } };
    },
  };
  return { disks, shells, beam, riemannBars, slices, antiFamily, betweenStrips, washers, pumping, pipeFlow };
})();
if (typeof module !== 'undefined') module.exports = IntroAnims3D;
