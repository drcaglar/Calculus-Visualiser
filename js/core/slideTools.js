// Slide tools for the right-hand column (ported from the AMP/LAMP reader toolbar): topic navigation, text size,
// full screen / presentation mode, ink (pen, highlighter, laser, eraser + colours), spotlight, black/white screen
// and a lecture timer. Every group is collapsible and the open/closed state (and text size) is remembered.
// Usage: SlideTools.mount(containerEl, { host: topicHostEl }) -> { retext(), destroy() }

const SlideTools = (function () {
  const tx = (a, b) => I18N.tx(a, b);
  const KEY = 'cv.tools';
  const INK = { tool: null, color: '#e8453c', strokes: [], cv: null, raf: 0, host: null };
  let spotEl = null;
  let mounted = null; // current instance { root, host }

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } }
  const state = load();
  if (!state.closed) state.closed = ['g3', 'g4', 'g5']; // ink, lecture tools and timer start collapsed
  state.fs = state.fs || 1;

  function applyFs() { document.documentElement.style.setProperty('--fs', String(state.fs)); }
  applyFs();

  function toast(msg) {
    let t = document.getElementById('cvToast');
    if (!t) { t = document.createElement('div'); t.id = 'cvToast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toast._h); toast._h = setTimeout(() => t.classList.remove('on'), 1600);
  }

  // ---------- ink ----------
  function setTool(t) {
    INK.tool = t;
    document.querySelectorAll('.st-root .tl').forEach((b) => b.classList.toggle('pri', b.dataset.t === t));
    if (INK.cv) { INK.cv.style.pointerEvents = t ? 'auto' : 'none'; INK.cv.style.cursor = t === 'erase' ? 'cell' : t ? 'crosshair' : 'default'; }
  }
  function inkLayer(host) {
    if (INK.cv) { INK.cv.remove(); INK.cv = null; }
    cancelAnimationFrame(INK.raf);
    INK.strokes = []; INK.host = host;
    const cv = document.createElement('canvas');
    cv.className = 'st-inkcv';
    host.appendChild(cv);
    INK.cv = cv;
    inkSize();
    setTool(INK.tool);
    const pos = (e) => { const r = cv.getBoundingClientRect(), k = cv.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; };
    let cur = null;
    cv.onpointerdown = (e) => {
      if (!INK.tool || inLocked(e.clientX, e.clientY)) return;
      cv.setPointerCapture(e.pointerId);
      const p = pos(e);
      if (INK.tool === 'erase') { eraseAt(p); cur = { erase: true }; return; }
      cur = { t: INK.tool, c: INK.color, pts: [p], born: performance.now() };
      INK.strokes.push(cur); inkDraw();
    };
    cv.onpointermove = (e) => {
      if (!cur) return;
      const p = pos(e);
      if (cur.erase) { eraseAt(p); return; }
      cur.pts.push(p);
      if (cur.t === 'laser') cur.pts = cur.pts.slice(-40);
      inkDraw();
    };
    cv.onpointerup = () => { if (cur && cur.t === 'laser') cur.end = performance.now(); cur = null; };
  }
  // The tools work in the graph area, the topic text and the solution - NOT in the question / controls column (.we-col-right).
  function lockedRects() {
    const el = document.querySelector('.we-col-right');
    if (!el) return [];
    const parts = getComputedStyle(el).display === 'contents' ? [...el.children] : [el]; // narrow layout: the column has no box of its own
    return parts.map((n) => n.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
  }
  function inLocked(x, y) { return lockedRects().some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom); }
  function inkSize() {
    const cv = INK.cv; if (!cv) return;
    const p = cv.parentElement;
    cv.style.width = '0px'; cv.style.height = '0px';
    const W = p.scrollWidth, H = p.scrollHeight;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cv.width = W; cv.height = H;
    inkDraw();
  }
  function eraseAt([x, y]) { INK.strokes = INK.strokes.filter((s) => !s.pts.some(([a, b]) => Math.hypot(a - x, b - y) < 18)); inkDraw(); }
  function inkDraw() {
    const cv = INK.cv; if (!cv) return;
    const c = cv.getContext('2d'), now = performance.now();
    c.clearRect(0, 0, cv.width, cv.height);
    const lr = lockedRects();
    if (lr.length) { const cr = cv.getBoundingClientRect(), k = cv.width / (cr.width || 1); c.save(); c.beginPath(); c.rect(0, 0, cv.width, cv.height); lr.forEach((r) => c.rect((r.left - cr.left) * k, (r.top - cr.top) * k, r.width * k, r.height * k)); c.clip('evenodd'); }
    INK.strokes = INK.strokes.filter((s) => !(s.t === 'laser' && s.end && now - s.end > 700));
    INK.strokes.forEach((s) => {
      if (s.pts.length < 1) return;
      c.save(); c.lineCap = c.lineJoin = 'round';
      if (s.t === 'hl') { c.globalAlpha = 0.28; c.lineWidth = 22; c.strokeStyle = s.c; }
      else if (s.t === 'laser') { c.globalAlpha = s.end ? Math.max(0, 1 - (now - s.end) / 700) : 1; c.lineWidth = 5; c.strokeStyle = '#ff2a2a'; c.shadowColor = '#ff2a2a'; c.shadowBlur = 14; }
      else { c.lineWidth = 3.2; c.strokeStyle = s.c; }
      c.beginPath();
      s.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      if (s.pts.length === 1) c.lineTo(s.pts[0][0] + 0.1, s.pts[0][1]);
      c.stroke(); c.restore();
    });
    if (lr.length) c.restore();
    cancelAnimationFrame(INK.raf);
    if (INK.strokes.some((s) => s.t === 'laser')) INK.raf = requestAnimationFrame(inkDraw);
  }

  // ---------- spotlight / blank ----------
  function spotClip() {
    if (!spotEl) return;
    const rs = lockedRects();
    spotEl.style.clipPath = rs.length ? `path(evenodd, 'M0 0H${innerWidth}V${innerHeight}H0Z ${rs.map((r) => `M${r.left} ${r.top}H${r.right}V${r.bottom}H${r.left}Z`).join(' ')}')` : '';
  }
  function toggleSpot(force) {
    const on = force == null ? !spotEl : force;
    if (on && !spotEl) {
      spotEl = document.createElement('div'); spotEl.className = 'st-spot';
      spotEl.style.setProperty('--x', innerWidth / 2 + 'px'); spotEl.style.setProperty('--y', innerHeight / 2 + 'px');
      document.body.appendChild(spotEl);
      spotClip();
    } else if (!on && spotEl) { spotEl.remove(); spotEl = null; }
    const b = document.querySelector('.st-root #st-spot'); if (b) b.classList.toggle('pri', !!spotEl);
  }
  document.addEventListener('mousemove', (e) => { if (spotEl) { spotClip(); spotEl.style.setProperty('--x', e.clientX + 'px'); spotEl.style.setProperty('--y', e.clientY + 'px'); } });
  document.addEventListener('wheel', (e) => {
    if (spotEl && e.shiftKey) { e.preventDefault(); const r = Math.max(60, Math.min(400, (parseFloat(spotEl.style.getPropertyValue('--r')) || 140) - e.deltaY * 0.3)); spotEl.style.setProperty('--r', r + 'px'); }
  }, { passive: false });
  function blank(col) {
    const o = document.createElement('div'); o.className = 'st-blank'; o.style.background = col; document.body.appendChild(o);
    const close = () => { o.remove(); document.removeEventListener('keydown', k, true); };
    const k = (e) => { e.stopPropagation(); e.preventDefault(); close(); };
    o.onclick = close; setTimeout(() => document.addEventListener('keydown', k, true), 50);
  }

  // ---------- timer ----------
  const TIMER = {
    t0: 0, acc: 0, run: false, iv: 0, cd: 0,
    fmt(ms) { const s = Math.max(0, Math.round(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); },
    now() { return this.acc + (this.run ? Date.now() - this.t0 : 0); },
    tick() {
      const v = document.getElementById('st-tmv'); if (!v) return;
      const el = this.now();
      if (this.cd) { const left = this.cd * 60000 - el; v.textContent = (left < 0 ? '−' : '') + this.fmt(Math.abs(left)); v.classList.toggle('over', left < 0); v.classList.toggle('warn', left >= 0 && left < 120000); }
      else { v.textContent = this.fmt(el); v.classList.remove('over', 'warn'); }
    },
    toggle() {
      if (this.run) { this.acc = this.now(); this.run = false; clearInterval(this.iv); }
      else { this.t0 = Date.now(); this.run = true; this.iv = setInterval(() => this.tick(), 250); }
      this.tick();
      const g = document.getElementById('st-tmgo'); if (g) g.textContent = this.run ? '❚❚' : '▶';
    },
    reset() { this.acc = 0; this.t0 = Date.now(); this.tick(); },
  };

  // ---------- presentation ----------
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function toggleFullscreen() {
    const el = document.documentElement;
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else if (el.requestFullscreen || el.webkitRequestFullscreen) { (el.requestFullscreen || el.webkitRequestFullscreen).call(el); }
  }
  function togglePresent() {
    const on = !document.body.classList.contains('present');
    document.body.classList.toggle('present', on);
    if (on) { state.prevFs = state.fs; state.fs = Math.max(state.fs, 1.25); applyFs(); toast(tx('Sunum modu: çıkmak için Esc ya da ▣', 'Presentation mode: press Esc or ▣ to leave')); if (!fsEl()) toggleFullscreen(); }
    else { state.fs = state.prevFs || 1; applyFs(); if (fsEl()) toggleFullscreen(); }
    save(state); window.dispatchEvent(new Event('resize'));
  }

  // ---------- global keys ----------
  document.addEventListener('keydown', (e) => {
    if (!mounted || /input|textarea|select/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 's') toggleSpot();
    else if (k === 'b') blank('#000');
    else if (k === 'w') blank('#fff');
    else if (k === 'f') togglePresent();
    else if (k === 'p') setTool(INK.tool === 'pen' ? null : 'pen');
    else if (k === 'h') setTool(INK.tool === 'hl' ? null : 'hl');
    else if (k === 'l') setTool(INK.tool === 'laser' ? null : 'laser');
    else if (k === 'e') setTool(INK.tool === 'erase' ? null : 'erase');
    else if (e.key === 'ArrowRight' && window.AppNav) window.AppNav.next();
    else if (e.key === 'ArrowLeft' && window.AppNav) window.AppNav.prev();
    else if (e.key === 'Escape') {
      if (INK.tool) setTool(null);
      toggleSpot(false);
      if (document.body.classList.contains('present')) togglePresent();
    }
  });
  window.addEventListener('resize', () => inkSize());
  document.addEventListener('fullscreenchange', () => {
    if (!fsEl() && document.body.classList.contains('present')) { document.body.classList.remove('present'); state.fs = state.prevFs || 1; applyFs(); save(state); }
    const b = document.querySelector('.st-root #st-fsb span'); if (b) b.textContent = fsEl() ? tx('Tam ekrandan çık', 'Exit full screen') : tx('Tam ekran', 'Full screen');
  });

  // ---------- UI ----------
  function build(inst) {
    const root = inst.root;
    const COLORS = ['#e8453c', '#16a34a', '#e0b400', '#2a6fdb', '#8b5cf6'];
    root.innerHTML =
      '<div class="st-head"><span class="st-title"></span><span class="st-chev">▾</span></div>' +
      '<div class="st-body">' +
      '<div class="sg"><div class="sl" data-k="nav"></div><div class="two"><button class="btn" id="st-pv"></button><button class="btn pri" id="st-nx"></button></div></div>' +
      '<div class="sg"><div class="sl" data-k="size"></div><div class="two"><button class="btn" id="st-fsm" title="A−">A−</button><button class="btn" id="st-fsp" title="A+">A+</button></div></div>' +
      '<div class="sg"><div class="sl" data-k="view"></div><div class="two"><button class="btn" id="st-fsb">⛶ <span></span></button><button class="btn" id="st-prb">▣ <span></span></button></div></div>' +
      '<div class="sg ink"><div class="sl" data-k="ink"></div><div class="two">' +
      '<button class="btn tl" data-t="pen" title="P"></button><button class="btn tl" data-t="hl" title="H"></button>' +
      '<button class="btn tl" data-t="laser" title="L"></button><button class="btn tl" data-t="erase" title="E"></button></div>' +
      '<div class="cols">' + COLORS.map((c) => '<button class="sw" data-c="' + c + '" style="background:' + c + '"></button>').join('') + '</div>' +
      '<button class="btn" id="st-clr"></button></div>' +
      '<div class="sg"><div class="sl" data-k="lect"></div><div class="two">' +
      '<button class="btn" id="st-spot" title="S"></button><button class="btn" id="st-blk" title="B"></button><button class="btn" id="st-wht" title="W"></button></div></div>' +
      '<div class="sg timer"><div class="sl" data-k="timer"></div><div class="tm" id="st-tmv">00:00</div>' +
      '<div class="two"><button class="btn" id="st-tmgo">▶</button><button class="btn" id="st-tmrs">↺</button><select id="st-tmcd"></select></div></div>' +
      '</div>';
    const q = (s) => root.querySelector(s);
    const txt = () => {
      q('.st-title').textContent = tx('🧰 Araçlar', '🧰 Tools');
      const L = {
        nav: tx('Konular arasında', 'Between topics'), size: tx('Yazı boyutu', 'Text size'), view: tx('Görünüm', 'View'),
        ink: tx('Çizim (konu değişince silinir)', 'Ink (clears when the topic changes)'), lect: tx('Ders araçları', 'Lecture tools'), timer: tx('Zamanlayıcı', 'Timer'),
      };
      root.querySelectorAll('.sl').forEach((el) => { el.textContent = L[el.dataset.k]; });
      q('#st-pv').textContent = '◀ ' + tx('Önceki', 'Previous'); q('#st-nx').textContent = tx('Sonraki', 'Next') + ' ▶';
      q('#st-fsb span').textContent = fsEl() ? tx('Tam ekrandan çık', 'Exit full screen') : tx('Tam ekran', 'Full screen');
      q('#st-prb span').textContent = tx('Sunum', 'Present');
      const T = { pen: tx('✎ Kalem', '✎ Pen'), hl: tx('▬ Vurgula', '▬ Highlight'), laser: tx('◉ Lazer', '◉ Laser'), erase: tx('⌫ Silgi', '⌫ Eraser') };
      root.querySelectorAll('.tl').forEach((b) => { b.textContent = T[b.dataset.t]; });
      q('#st-clr').textContent = '🗑 ' + tx('Temizle', 'Clear');
      q('#st-spot').textContent = '◐ ' + tx('Spot ışık', 'Spotlight'); q('#st-blk').textContent = '■ ' + tx('Siyah', 'Black'); q('#st-wht').textContent = '□ ' + tx('Beyaz', 'White');
      const sel = q('#st-tmcd'), cur = sel.value;
      sel.innerHTML = '<option value="0">' + tx('Kronometre', 'Stopwatch') + '</option>' + [5, 10, 15, 20, 30, 45].map((m) => '<option value="' + m + '">' + m + ' ' + tx('dk', 'min') + '</option>').join('');
      sel.value = cur || String(TIMER.cd || 0);
    };
    txt();
    q('#st-pv').onclick = () => window.AppNav && window.AppNav.prev();
    q('#st-nx').onclick = () => window.AppNav && window.AppNav.next();
    const setFs = (d) => { state.fs = Math.round(Math.min(1.8, Math.max(0.7, state.fs + d)) * 10) / 10; applyFs(); save(state); toast(Math.round(state.fs * 100) + ' %'); inkSize(); };
    q('#st-fsm').onclick = () => setFs(-0.1); q('#st-fsp').onclick = () => setFs(0.1);
    q('#st-fsb').onclick = toggleFullscreen; q('#st-prb').onclick = togglePresent;
    root.querySelectorAll('.tl').forEach((b) => { b.onclick = () => setTool(INK.tool === b.dataset.t ? null : b.dataset.t); });
    root.querySelectorAll('.sw').forEach((b) => { b.onclick = () => { INK.color = b.dataset.c; root.querySelectorAll('.sw').forEach((x) => x.classList.toggle('on', x === b)); if (!INK.tool || INK.tool === 'erase') setTool('pen'); }; });
    const first = [...root.querySelectorAll('.sw')].find((b) => b.dataset.c === INK.color) || q('.sw'); first.classList.add('on');
    q('#st-clr').onclick = () => { INK.strokes = []; inkDraw(); };
    q('#st-spot').onclick = () => toggleSpot(); q('#st-blk').onclick = () => blank('#000'); q('#st-wht').onclick = () => blank('#fff');
    q('#st-tmgo').onclick = () => TIMER.toggle(); q('#st-tmv').onclick = () => TIMER.toggle(); q('#st-tmrs').onclick = () => TIMER.reset();
    q('#st-tmcd').onchange = (e) => { TIMER.cd = +e.target.value; TIMER.reset(); };
    TIMER.tick();
    // collapsible: the whole panel (header) and each group (label); state is remembered
    const closed = new Set(state.closed);
    const persist = () => { state.closed = [...closed]; save(state); };
    if (closed.has('all')) root.classList.add('closed');
    q('.st-head').onclick = () => { root.classList.toggle('closed'); root.classList.contains('closed') ? closed.add('all') : closed.delete('all'); persist(); };
    [...root.querySelectorAll('.sg')].forEach((g, i) => {
      const key = 'g' + i;
      g.classList.add('coll'); if (closed.has(key)) g.classList.add('closed');
      g.querySelector('.sl').onclick = () => { g.classList.toggle('closed'); g.classList.contains('closed') ? closed.add(key) : closed.delete(key); persist(); };
    });
    inst.txt = txt;
  }

  function mount(container, opts) {
    const root = document.createElement('div');
    root.className = 'st-root card';
    container.appendChild(root);
    const inst = { root, host: opts && opts.host };
    build(inst);
    mounted = inst;
    if (inst.host) { inst.host.style.position = 'relative'; inkLayer(inst.host); }
    return {
      retext() { inst.txt(); },
      resizeInk: inkSize,
      destroy() {
        if (mounted === inst) { mounted = null; }
        toggleSpot(false);
        if (INK.cv) { INK.cv.remove(); INK.cv = null; }
        cancelAnimationFrame(INK.raf);
        root.remove();
      },
    };
  }

  return { mount, toast };
})();
