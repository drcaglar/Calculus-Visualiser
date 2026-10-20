// "Başlangıç / Getting started" tab of every chapter: a very short summary of what the chapter covers + 2D animations and/or
// 3D (Three.js) animations. No questions, sliders or step-by-step solutions here.
//   Intro.register('chapterId', { title:[tr,en], bullets:[[tr,en],...], anims:[ anim, ... ] })   (tab is placed FIRST)
// anim (2D): { kind:'2d', title:[tr,en], caption:[tr,en], draw(ctx, W, H, t, C, K) }
// anim (3D): { kind:'3d', title:[tr,en], caption:[tr,en], init({ THREE, scene, world, camera, C }) -> { update(t) } }
// t = animation seconds (speed applied). C = theme colours. K = small drawing helpers (below).
const Intro = (function () {
  const tx = (a, b) => I18N.tx(a, b);
  const pick = (p) => (Array.isArray(p) ? tx(p[0], p[1]) : String(p));

  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const g = (n, d) => (cs.getPropertyValue(n) || '').trim() || d;
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    return { dark, bg: g('--graph-bg', dark ? '#0f1117' : '#ffffff'), fg: g('--fg', dark ? '#e6e9f2' : '#1f2937'), sub: dark ? '#8b93a7' : '#6b7280', grid: dark ? '#262b3a' : '#e5e7eb',
      accent: g('--accent', '#2563eb'), good: g('--good', '#16a34a'), warn: '#f59e0b', bad: '#ef4444', purple: '#8b5cf6', orange: '#f97316' };
  }

  // ---- 2D helpers ----
  const K = {
    axes(ctx, W, H, x0, x1, y0, y1, C, opt) {
      opt = opt || {};
      const X = (x) => ((x - x0) / (x1 - x0)) * W, Y = (y) => H - ((y - y0) / (y1 - y0)) * H;
      ctx.lineWidth = 1; ctx.strokeStyle = C.grid; ctx.fillStyle = C.sub; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      if (opt.grid !== false) {
        for (let x = Math.ceil(x0); x <= x1; x++) { ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), H); ctx.stroke(); }
        for (let y = Math.ceil(y0); y <= y1; y++) { ctx.beginPath(); ctx.moveTo(0, Y(y)); ctx.lineTo(W, Y(y)); ctx.stroke(); }
      }
      ctx.strokeStyle = C.sub; ctx.lineWidth = 1.5;
      if (y0 <= 0 && y1 >= 0) { ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke(); }
      if (x0 <= 0 && x1 >= 0) { ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke(); }
      return { X, Y, x0, x1, y0, y1, W, H };
    },
    eq(ctx, W, H, yr, C, opt) { return K.axes(ctx, W, H, -yr * W / H, yr * W / H, -yr, yr, C, opt); }, // equal x / y scale
    plot(ctx, ax, f, color, w, a, b) {
      ctx.strokeStyle = color; ctx.lineWidth = w || 2.5; ctx.beginPath();
      let pen = false, py = 0; const lo = a === undefined ? ax.x0 : a, hi = b === undefined ? ax.x1 : b;
      for (let k = 0; k <= 900; k++) {
        const x = lo + (hi - lo) * k / 900, y = f(x);
        if (!Number.isFinite(y) || Math.abs(y) > 1e4) { pen = false; continue; }
        const sy = ax.Y(y);
        if (pen && Math.abs(sy - py) > 0.8 * ax.H) pen = false; // pole / jump: lift the pen
        if (pen) ctx.lineTo(ax.X(x), sy); else { ctx.moveTo(ax.X(x), sy); pen = true; }
        py = sy;
      }
      ctx.stroke();
    },
    seg(ctx, ax, x1, y1, x2, y2, color, w, dash) {
      ctx.strokeStyle = color; ctx.lineWidth = w || 2; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(ax.X(x1), ax.Y(y1)); ctx.lineTo(ax.X(x2), ax.Y(y2)); ctx.stroke(); ctx.setLineDash([]);
    },
    dot(ctx, ax, x, y, color, r, hollow) {
      ctx.beginPath(); ctx.arc(ax.X(x), ax.Y(y), r || 5, 0, 2 * Math.PI);
      if (hollow) { ctx.fillStyle = ctx.canvas.__bg || '#000'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); } else { ctx.fillStyle = color; ctx.fill(); }
    },
    text(ctx, s, x, y, color, size, align) { ctx.fillStyle = color; ctx.font = (size || 13) + 'px sans-serif'; ctx.textAlign = align || 'left'; ctx.fillText(s, x, y); },
    fill(ctx, ax, f, a, b, color, g) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(ax.X(a), ax.Y(g ? g(a) : 0));
      for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200; ctx.lineTo(ax.X(x), ax.Y(f(x))); }
      for (let i = 200; i >= 0; i--) { const x = a + (b - a) * i / 200; ctx.lineTo(ax.X(x), ax.Y(g ? g(x) : 0)); }
      ctx.closePath(); ctx.fill();
    },
  };

  function mount(host, def) {
    host.innerHTML = '<div class="in-root"><h2 class="in-title"></h2><ul class="in-list"></ul><div class="in-anims"></div></div>';
    const root = host.querySelector('.in-root');
    const cards = [];
    let raf = 0, last = performance.now(), dead = false;

    function build() {
      cards.forEach((c) => c.dispose && c.dispose());
      cards.length = 0;
      root.querySelector('.in-title').textContent = pick(def.title);
      const ul = root.querySelector('.in-list'); ul.innerHTML = '';
      def.bullets.forEach((b) => { const li = document.createElement('li'); li.innerHTML = typeof Typeset !== 'undefined' && typeof katex !== 'undefined' ? Typeset.html(pick(b)) : pick(b); ul.appendChild(li); });
      const box = root.querySelector('.in-anims'); box.innerHTML = '';
      def.anims.forEach((a) => box.appendChild(makeCard(a)));
    }

    function makeCard(a) {
      const card = document.createElement('div'); card.className = 'in-card';
      card.innerHTML = '<div class="in-head"><b class="in-atitle"></b><span class="in-badge"></span><span style="flex:1"></span><button class="flat-btn in-play" type="button"></button>' +
        '<label class="in-speed"></label><input class="in-spd" type="range" min="0.25" max="3" step="0.05" value="1"></div><div class="in-body"><div class="in-cvwrap"><canvas></canvas></div><div class="in-side"><div class="in-sidehead"></div><div class="in-cap"></div></div></div>';
      card.querySelector('.in-atitle').textContent = pick(a.title);
      card.querySelector('.in-badge').textContent = a.kind === '3d' ? '3D' : '2D';
      card.querySelector('.in-cap').textContent = pick(a.caption || '') + (a.kind === '3d' ? '  ' + tx('(Fareyle sürükleyerek döndürebilir, tekerlekle yakınlaştırabiliriz.)', '(Drag to rotate, wheel to zoom.)') : '');
      card.querySelector('.in-speed').textContent = tx('Hız', 'Speed');
      card.querySelector('.in-sidehead').textContent = tx('Animasyonda ne görüyoruz?', 'What do we see in the animation?');
      const playBtn = card.querySelector('.in-play'), spd = card.querySelector('.in-spd'), cv = card.querySelector('canvas'), wrap = card.querySelector('.in-cvwrap');
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', pick(a.title) + (a.caption ? ' — ' + pick(a.caption) : ''));
      playBtn.setAttribute('aria-label', pick(a.title)); spd.setAttribute('aria-label', tx('Hız', 'Speed') + ' — ' + pick(a.title));
      const st = { t: 0, run: true, speed: 1, cv, wrap, a, ctx: null, three: null, upd: null, C: colors() };
      const setLabel = () => { playBtn.textContent = st.run ? tx('⏸ Duraklat', '⏸ Pause') : tx('▶ Oynat', '▶ Play'); };
      setLabel();
      playBtn.addEventListener('click', () => { st.run = !st.run; setLabel(); });
      spd.addEventListener('input', () => { st.speed = parseFloat(spd.value); });
      if (a.kind === '3d') init3d(st); else st.ctx = cv.getContext('2d');
      st.dispose = () => { if (st.three) { st.three.ro.disconnect(); st.three.renderer.dispose(); } };
      cards.push(st);
      return card;
    }

    function init3d(st) {
      if (typeof THREE === 'undefined') { st.wrap.textContent = 'Three.js not loaded'; return; }
      let renderer;
      try { renderer = new THREE.WebGLRenderer({ canvas: st.cv, antialias: true }); } catch (e) { st.wrap.innerHTML = '<div class="in-cap" style="padding:20px">' + tx('Bu tarayıcıda 3B (WebGL) kullanılamıyor.', '3D (WebGL) is not available in this browser.') + '</div>'; return; }
      const scene = new THREE.Scene(), world = new THREE.Group();
      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(4, 6, 5); scene.add(dl);
      scene.add(world);
      const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 100);
      const view = { yaw: 0.6, pitch: 0.35, dist: 9, auto: true };
      const placeCam = () => { camera.position.set(view.dist * Math.cos(view.pitch) * Math.sin(view.yaw), view.dist * Math.sin(view.pitch), view.dist * Math.cos(view.pitch) * Math.cos(view.yaw)); camera.lookAt(0, 0, 0); };
      const ro = new ResizeObserver(() => { const w = st.wrap.clientWidth, h = st.wrap.clientHeight; if (w && h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); } });
      ro.observe(st.wrap);
      let drag = null;
      st.cv.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY]; view.auto = false; st.cv.setPointerCapture(e.pointerId); });
      st.cv.addEventListener('pointermove', (e) => { if (!drag) return; view.yaw -= (e.clientX - drag[0]) * 0.008; view.pitch = Math.max(-1.3, Math.min(1.3, view.pitch + (e.clientY - drag[1]) * 0.008)); drag = [e.clientX, e.clientY]; });
      st.cv.addEventListener('pointerup', () => { drag = null; });
      st.cv.addEventListener('wheel', (e) => { e.preventDefault(); view.dist = Math.max(3, Math.min(25, view.dist * (1 + e.deltaY * 0.001))); }, { passive: false });
      st.three = { renderer, scene, camera, world, view, ro, placeCam };
      st.upd = st.a.init({ THREE, scene, world, camera, C: st.C, view });
      renderer.setClearColor(new THREE.Color(st.C.bg), 1);
    }

    let lastDraw = 0;
    function frame(now) {
      if (dead) return;
      if (now - lastDraw < 28) { raf = requestAnimationFrame(frame); return; } // ~35 fps cap: several WebGL cards on one page
      lastDraw = now;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      cards.forEach((st) => {
        const r = st.wrap.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight || !r.width) return;
        if (st.run) st.t += dt * st.speed;
        if (st.a.kind === '3d') {
          if (!st.three) return;
          const w = st.wrap.clientWidth, h = st.wrap.clientHeight;
          if (w && h && (st.sw !== w || st.sh !== h)) { st.three.renderer.setSize(w, h, false); st.three.camera.aspect = w / h; st.three.camera.updateProjectionMatrix(); st.sw = w; st.sh = h; }
          const v = st.three.view; if (v.auto && st.run) v.yaw += dt * 0.25 * st.speed;
          st.three.placeCam();
          if (st.upd && st.upd.update) st.upd.update(st.t);
          st.three.renderer.render(st.three.scene, st.three.camera);
        } else {
          const dpr = window.devicePixelRatio || 1, W = Math.round(r.width), H = Math.round(r.height);
          if (st.cv.width !== W * dpr || st.cv.height !== H * dpr) { st.cv.width = W * dpr; st.cv.height = H * dpr; }
          const c = st.ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0); st.C = colors(); c.canvas.__bg = st.C.bg;
          c.fillStyle = st.C.bg; c.fillRect(0, 0, W, H);
          try { st.a.draw(c, W, H, st.t, st.C, K); } catch (e) { /* keep animating */ }
        }
      });
      raf = requestAnimationFrame(frame);
    }

    build();
    raf = requestAnimationFrame(frame);
    const offLang = I18N.onChange(build);
    const offTheme = typeof Theme !== 'undefined' && Theme.onChange ? Theme.onChange(() => { cards.forEach((st) => { st.C = colors(); if (st.three) st.three.renderer.setClearColor(new THREE.Color(st.C.bg), 1); }); }) : null;
    return { destroy() { dead = true; cancelAnimationFrame(raf); offLang(); if (offTheme) offTheme(); cards.forEach((c) => c.dispose && c.dispose()); } };
  }

  // register the tab; it is always the FIRST tab of its chapter
  function register(chapterId, def) {
    const d = { id: 'intro', type: 'intro', tabTitle: () => tx('Başlangıç', 'Getting Started'), title: def.title, bullets: def.bullets, anims: def.anims };
    Topics.register(chapterId, d);
    const arr = Topics.get(chapterId);
    arr.splice(arr.indexOf(d), 1); arr.unshift(d);
  }
  return { register, mount, K, colors };
})();
