// 3D view for worked-example tabs: a "3B / 2B" button in the graph corner switches the graph area to a Three.js scene of the same example.
//   topic def:  view3d: { build({ THREE, world, C }) -> { update(problem) } }    (update() is called on every change of the example / sliders)
//   builders use V3 helpers below; the scene is rebuilt from scratch in update() (small scenes, so this is cheap).
const View3D = (function () {
  const tx = (a, b) => I18N.tx(a, b);

  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const g = (n, d) => (cs.getPropertyValue(n) || '').trim() || d;
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    return { dark, bg: g('--graph-bg', dark ? '#0f1117' : '#ffffff'), fg: dark ? '#e6e9f2' : '#1f2937', sub: dark ? '#8b93a7' : '#6b7280',
      accent: g('--accent', '#2563eb'), good: g('--good', '#16a34a'), orange: '#f97316', bad: '#ef4444', purple: '#8b5cf6', gold: '#eab308' };
  }

  // ---- helpers for the builders ----
  const V3 = {
    mat(color, o) { return new THREE.MeshPhongMaterial(Object.assign({ color: new THREE.Color(color), shininess: 35, transparent: false }, o || {})); },
    ghost(color, op) { return V3.mat(color, { transparent: true, opacity: op === undefined ? 0.25 : op, side: THREE.DoubleSide, depthWrite: false }); },
    line(points, color) { return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2] || 0)))), new THREE.LineBasicMaterial({ color: new THREE.Color(color) })); },
    // surface of revolution of the closed/open polyline pts=[[r,h],...] about the axis (default: y axis; axis:'x' turns it along x)
    lathe(pts, mat, axis) { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map((q) => new THREE.Vector2(Math.max(q[0], 0), q[1])), 56), mat); if (axis === 'x') m.rotation.z = -Math.PI / 2; return m; },
    axisLine(len, color, axis) { const a = axis === 'x' ? [[-len, 0, 0], [len, 0, 0]] : [[0, -len, 0], [0, len, 0]]; return V3.line(a, color); },
    sample(f, a, b, n) { const out = []; for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; out.push([x, f(x)]); } return out; },
    clear(g) { while (g.children.length) { const c = g.children.pop(); if (c.geometry) c.geometry.dispose(); } },
  };

  function mount(col, def, getProblem, boardBtn) {
    const spec = def.view3d;
    const wrap = document.createElement('div'); wrap.className = 'we-v3d';
    const cv = document.createElement('canvas'); wrap.appendChild(cv); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', I18N.tx('3B model (fareyle döndürülebilir)', '3D model (drag to rotate)'));
    const note = document.createElement('div'); note.className = 'we-v3d-note'; wrap.appendChild(note);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'we-3d-btn';
    col.appendChild(wrap); col.appendChild(btn);
    let on = false, raf = 0, built = null, three = null, C = colors();
    const label = () => { btn.textContent = on ? tx('2B', '2D') : tx('3B', '3D'); btn.title = on ? tx('2B grafiğe dön', 'Back to the 2D graph') : tx('3B görünüme çevir', 'Switch to the 3D view'); btn.setAttribute('aria-label', btn.title); };

    function ensure() {
      if (three) return true;
      if (typeof THREE === 'undefined') { note.textContent = 'Three.js not loaded'; return false; }
      let renderer; try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); } catch (e) { note.textContent = tx('Bu tarayıcıda 3B (WebGL) kullanılamıyor.', '3D (WebGL) is not available in this browser.'); return false; }
      const scene = new THREE.Scene(), world = new THREE.Group();
      scene.add(new THREE.AmbientLight(0xffffff, 0.8)); const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(4, 6, 5); scene.add(dl); scene.add(world);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
      const view = { yaw: 0.7, pitch: 0.4, dist: spec.dist || 10, auto: false };
      let drag = null;
      cv.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', (e) => { if (!drag) return; view.yaw -= (e.clientX - drag[0]) * 0.008; view.pitch = Math.max(-1.4, Math.min(1.4, view.pitch + (e.clientY - drag[1]) * 0.008)); drag = [e.clientX, e.clientY]; });
      cv.addEventListener('pointerup', () => { drag = null; });
      cv.addEventListener('wheel', (e) => { e.preventDefault(); view.dist = Math.max(3, Math.min(40, view.dist * (1 + e.deltaY * 0.001))); }, { passive: false });
      three = { renderer, scene, camera, world, view, sw: 0, sh: 0 };
      built = spec.build({ THREE, world, C, V3, view });
      return true;
    }
    function update() {
      if (!on || !three) return;
      C = colors(); three.renderer.setClearColor(new THREE.Color(C.bg), 1);
      V3.clear(three.world);
      note.textContent = '';
      try { const msg = built.update(getProblem(), C); if (msg) note.textContent = msg; } catch (e) { note.textContent = String(e.message || e); }
    }
    function frame() {
      if (!on) return;
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (three && w && h) {
        if (three.sw !== w || three.sh !== h) { three.renderer.setSize(w, h, false); three.camera.aspect = w / h; three.camera.updateProjectionMatrix(); three.sw = w; three.sh = h; }
        const v = three.view; three.camera.position.set(v.dist * Math.cos(v.pitch) * Math.sin(v.yaw), v.dist * Math.sin(v.pitch), v.dist * Math.cos(v.pitch) * Math.cos(v.yaw)); three.camera.lookAt(0, 0, 0);
        three.renderer.render(three.scene, three.camera);
      }
      raf = requestAnimationFrame(frame);
    }
    btn.addEventListener('click', () => {
      on = !on; col.classList.toggle('v3d-on', on); label();
      if (on) { if (!ensure()) { return; } update(); raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf);
    });
    label();
    return { update, destroy() { on = false; cancelAnimationFrame(raf); if (three) three.renderer.dispose(); } };
  }
  return { mount, V3, colors };
})();
