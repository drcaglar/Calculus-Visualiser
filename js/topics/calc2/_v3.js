// 3D views (View3D) of the Hesap II tabs. Each builder: ({ THREE, world, V3 }) -> { update(problem, C) } and is attached as spec.view3d.
const Calc2V3 = (function () {
  const K = Calc2, { pEval, simpson, N2 } = K;
  const tx = K.tx;
  const isDisk = (r) => r.g.length === 1 && r.g[0] === 0;
  const fit = (world, c, span) => { const s = 3.4 / Math.max(span, 1e-6); world.scale.setScalar(s); world.position.set(-c[0] * s, -c[1] * s, -c[2] * s); return s; };
  const maxF = (r) => { let m = 1; for (let i = 0; i <= 40; i++) m = Math.max(m, pEval(r.f, r.a + (r.b - r.a) * i / 40)); return m; };

  const volumes = ({ THREE, world, V3 }) => ({ update(p, C) {
    const r = p.reg, f = (x) => pEval(r.f, x), g = (x) => pEval(r.g, x), x0 = K.at(p), M = maxF(r);
    const s = fit(world, [(r.a + r.b) / 2, 0, 0], Math.max(r.b - r.a, 2 * M));
    if (p.mode === 0) {
      world.add(V3.lathe(V3.sample(f, r.a, r.b, 48).map(([x, y]) => [y, x]), V3.ghost(C.accent, 0.3), 'x'));
      if (!isDisk(r)) world.add(V3.lathe(V3.sample(g, r.a, r.b, 48).map(([x, y]) => [y, x]), V3.ghost(C.good, 0.35), 'x'));
      const ring = new THREE.Mesh(new THREE.RingGeometry(Math.max(g(x0), 0.001), f(x0), 64), V3.mat(C.orange, { side: THREE.DoubleSide }));
      ring.rotation.y = Math.PI / 2; ring.position.x = x0; world.add(ring);
      world.add(V3.axisLine(Math.max(Math.abs(r.a), Math.abs(r.b)) + 1, C.sub, 'x'));
    } else {
      const N = 22, dx = (r.b - r.a) / N;
      world.add(V3.line(V3.sample(f, r.a, r.b, 60).map(([x, y]) => [x, y, 0]), C.accent)); world.add(V3.line(V3.sample(g, r.a, r.b, 60).map(([x, y]) => [x, y, 0]), C.good));
      for (let i = 0; i < N; i++) {
        const x = r.a + (i + 0.5) * dx, w = f(x) - g(x), hl = Math.abs(x - x0) < dx / 2 + 1e-9, col = hl ? C.orange : new THREE.Color().setHSL(0.58 - 0.12 * i / N, 0.7, 0.55).getStyle();
        let m;
        if (p.mode === 1) { m = new THREE.Mesh(new THREE.BoxGeometry(dx * 0.9, w, w), V3.mat(col, { transparent: true, opacity: hl ? 0.95 : 0.5 })); m.position.set(x, (f(x) + g(x)) / 2, w / 2); }
        else {
          const sh = new THREE.Shape(); sh.absarc(0, 0, w / 2, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(0, -w / 2);
          const geo = new THREE.ExtrudeGeometry(sh, { depth: dx * 0.9, bevelEnabled: false }); geo.translate(0, 0, -dx * 0.45);
          m = new THREE.Mesh(geo, V3.mat(col, { transparent: true, opacity: hl ? 0.95 : 0.5 })); m.rotation.y = Math.PI / 2; m.position.set(x, (f(x) + g(x)) / 2, 0);
        }
        world.add(m);
      }
    }
    return tx('Dilim konumu kaydırıcıyla değişir; turuncu dilim seçili kesittir.', 'The slider moves the highlighted (orange) slice.');
  } });

  const shells = ({ THREE, world, V3 }) => ({ update(p, C) {
    const r = p.reg, b = r.b, L = p.mode === 0 ? 0 : p.mode === 1 ? -1 : b + 1, rad = (x) => Math.abs(x - L), f = (x) => pEval(r.f, x), g = (x) => pEval(r.g, x), x0 = K.at(p), M = maxF(r);
    const maxR = Math.max(rad(r.a), rad(r.b));
    fit(world, [0, M / 2, 0], Math.max(2 * maxR, M));
    const top = V3.sample(f, r.a, r.b, 48).map(([x, y]) => [rad(x), y]), bot = V3.sample(g, r.a, r.b, 48).map(([x, y]) => [rad(x), y]).reverse();
    world.add(V3.lathe(top.concat(bot).concat([top[0]]), V3.ghost(C.accent, 0.3)));
    world.add(V3.line(top.map(([x, y]) => [x, y, 0]).concat(bot.map(([x, y]) => [x, y, 0])).concat([[top[0][0], top[0][1], 0]]), C.accent));
    world.add(V3.axisLine(M + 0.6, C.purple));
    const rho = rad(x0), h = f(x0) - g(x0), cyl = new THREE.Mesh(new THREE.CylinderGeometry(rho, rho, h, 56, 1, true), V3.mat(C.orange, { side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    cyl.position.y = (f(x0) + g(x0)) / 2; world.add(cyl);
    return tx('Mor çizgi dönme ekseni; turuncu silindir seçili kabuk (yarıçap r, yükseklik h).', 'The purple line is the axis; the orange cylinder is the selected shell (radius r, height h).');
  } });

  const arcSurface = ({ THREE, world, V3 }) => ({ update(p, C) {
    const c = p.reg, f = (x) => c.f(x), x0 = K.at(p), x1 = Math.min(c.b, x0 + 0.4);
    let M = 1; for (let i = 0; i <= 40; i++) M = Math.max(M, c.f(c.a + (c.b - c.a) * i / 40));
    fit(world, [(c.a + c.b) / 2, 0, 0], Math.max(c.b - c.a, 2 * M));
    world.add(V3.lathe(V3.sample(f, c.a, c.b, 60).map(([x, y]) => [y, x]), V3.ghost(p.mode === 1 ? C.accent : C.purple, p.mode === 1 ? 0.35 : 0.12), 'x'));
    const pts = V3.sample(f, c.a, c.b, 80).map(([x, y]) => new THREE.Vector3(x, y, 0));
    world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.03, 8), V3.mat(C.orange)));
    if (p.mode === 1 && x1 > x0) { const band = new THREE.Mesh(new THREE.CylinderGeometry(f(x1), f(x0), x1 - x0, 48, 1, true), V3.mat(C.good, { side: THREE.DoubleSide })); band.rotation.z = -Math.PI / 2; band.position.x = (x0 + x1) / 2; world.add(band); }
    world.add(V3.axisLine(Math.max(Math.abs(c.a), Math.abs(c.b)) + 1, C.sub, 'x'));
    return p.mode === 1 ? tx('Yeşil bant, ds uzunluklu küçük bir koni kesitidir; alanı ≈ 2π·f·ds.', 'The green band is a small frustum of length ds; its area is ≈ 2π·f·ds.') : tx('Turuncu eğri uzunluğu ölçülen yay; soluk yüzey, aynı eğrinin dönmüş hali.', 'The orange curve is the arc being measured; the faint surface is the same curve revolved.');
  } });

  const work = ({ THREE, world, V3 }) => ({ update(p, C) {
    const s = p.reg, y0 = K.at(p);
    world.scale.setScalar(1); world.position.set(0, 0, 0);
    if (s.type === 0) {
      const L0 = 1.2, len = L0 + 2.0 * (y0 / Math.max(s.b, 1e-9)), pts = [], N = 160, coils = 12;
      for (let i = 0; i <= N; i++) { const t = i / N; pts.push(new THREE.Vector3(len * t, 0.28 * Math.cos(2 * Math.PI * coils * t), 0.28 * Math.sin(2 * Math.PI * coils * t))); }
      world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.035, 6), V3.mat(C.accent)));
      const blk = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), V3.mat(C.orange)); blk.position.x = len + 0.35; world.add(blk);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 1.6), V3.mat(C.sub)); wall.position.x = -0.08; world.add(wall);
      world.position.x = -1.8; world.scale.setScalar(1);
      return tx(`Uzama x = ${N2(y0)} m; yay kuvveti F = k·x. İş, F–x grafiğinin altındaki alandır.`, `Stretch x = ${N2(y0)} m; spring force F = k·x. The work is the area under the F–x graph.`);
    }
    if (s.type === 1) {
      const hang = (s.L - y0) / s.L * 3.6;
      world.scale.setScalar(1); world.position.set(0, 0, 0);
      const pul = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 32), V3.mat(C.sub)); pul.rotation.x = Math.PI / 2; pul.position.set(0, 1.9, 0); world.add(pul);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, Math.max(hang, 0.01), 12), V3.mat(C.orange)); rope.position.set(0.4, 1.9 - hang / 2, 0); world.add(rope);
      const pulled = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6 - hang + 0.01, 12), V3.mat(C.good)); pulled.position.set(-0.4, 1.9 - (3.6 - hang) / 2, 0); world.add(pulled);
      return tx(`Çekilen uzunluk y = ${N2(y0)} m (yeşil); sarkan kısım (turuncu) azaldıkça kuvvet düşer.`, `Pulled length y = ${N2(y0)} m (green); as the hanging part (orange) shrinks the force drops.`);
    }
    const dims = s.type === 2 ? [s.l, s.H, s.w] : [2 * s.R, s.H, 2 * s.R], sc = 3.4 / Math.max(dims[0], dims[1], dims[2]), H = dims[1] * sc, yy = (y0 / (s.type === 2 ? s.H : s.H)) * H;
    world.scale.setScalar(1); world.position.set(0, -H / 2, 0);
    let tank, water, slab;
    if (s.type === 2) {
      tank = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(dims[0] * sc, H, dims[2] * sc)), new THREE.LineBasicMaterial({ color: new THREE.Color(C.fg) })); tank.position.y = H / 2;
      water = new THREE.Mesh(new THREE.BoxGeometry(dims[0] * sc, H, dims[2] * sc), V3.ghost(C.accent, 0.18)); water.position.y = H / 2;
      slab = new THREE.Mesh(new THREE.BoxGeometry(dims[0] * sc, 0.06, dims[2] * sc), V3.mat(C.orange, { transparent: true, opacity: 0.9 })); slab.position.y = yy;
    } else {
      const R = s.R * sc;
      tank = new THREE.Mesh(new THREE.CylinderGeometry(R, 0.001, H, 48, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.fg), wireframe: true })); tank.position.y = H / 2;
      water = new THREE.Mesh(new THREE.CylinderGeometry(R, 0.001, H, 48, 1, true), V3.ghost(C.accent, 0.18)); water.position.y = H / 2;
      slab = new THREE.Mesh(new THREE.CylinderGeometry(R * y0 / s.H, R * y0 / s.H, 0.06, 48), V3.mat(C.orange, { transparent: true, opacity: 0.9 })); slab.position.y = yy;
    }
    world.add(tank); world.add(water); world.add(slab);
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, yy, 0), Math.max(H - yy, 0.05), new THREE.Color(C.good).getHex(), 0.2, 0.14); world.add(arrow);
    return tx(`Turuncu tabaka y = ${N2(y0)} m yüksekliğinde; yeşil ok kaldırma mesafesi (H − y).`, `The orange slab is at height y = ${N2(y0)} m; the green arrow is the lifting distance (H − y).`);
  } });

  const centroid = ({ THREE, world, V3 }) => ({ update(p, C) {
    const r = p.reg, f = (x) => pEval(r.f, x), g = (x) => pEval(r.g, x), M = maxF(r);
    const A = simpson((x) => f(x) - g(x), r.a, r.b), xb = simpson((x) => x * (f(x) - g(x)), r.a, r.b) / A, yb = simpson((x) => (f(x) * f(x) - g(x) * g(x)) / 2, r.a, r.b) / A;
    const s = fit(world, [(r.a + r.b) / 2, M / 2, 0], Math.max(r.b - r.a, M * (p.mode === 1 ? 2 : 1)));
    const sh = new THREE.Shape(), top = V3.sample(f, r.a, r.b, 40), bot = V3.sample(g, r.a, r.b, 40).reverse();
    sh.moveTo(top[0][0], top[0][1]); top.forEach(([x, y]) => sh.lineTo(x, y)); bot.forEach(([x, y]) => sh.lineTo(x, y));
    const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.12 / s, bevelEnabled: false }), V3.mat(C.accent, { transparent: true, opacity: 0.8 })); plate.position.z = -0.06 / s; world.add(plate);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09 / s, 20, 16), V3.mat(C.gold)); dot.position.set(xb, yb, 0); world.add(dot);
    if (p.mode === 1) {
      world.add(V3.lathe(V3.sample(f, r.a, r.b, 48).map(([x, y]) => [y, x]), V3.ghost(C.purple, 0.15), 'x'));
      if (!isDisk(r)) world.add(V3.lathe(V3.sample(g, r.a, r.b, 48).map(([x, y]) => [y, x]), V3.ghost(C.purple, 0.15), 'x'));
      const ring = []; for (let i = 0; i <= 64; i++) { const a = 2 * Math.PI * i / 64; ring.push([xb, yb * Math.cos(a), yb * Math.sin(a)]); } world.add(V3.line(ring, C.orange));
      world.add(V3.axisLine(Math.max(Math.abs(r.a), Math.abs(r.b)) + 1, C.sub, 'x'));
    }
    return p.mode === 1 ? tx(`Altın nokta ağırlık merkezi; turuncu halka onun çizdiği çember (yarıçap ȳ = ${N2(yb)}): V = 2π·ȳ·A.`, `The gold dot is the centroid; the orange ring is the circle it traces (radius ȳ = ${N2(yb)}): V = 2π·ȳ·A.`)
      : tx(`Altın nokta ağırlık merkezi (x̄ = ${N2(xb)}, ȳ = ${N2(yb)}).`, `The gold dot is the centre of mass (x̄ = ${N2(xb)}, ȳ = ${N2(yb)}).`);
  } });

  return { volumes, shells, arcSurface, work, centroid };
})();
