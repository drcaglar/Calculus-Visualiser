// Canvas-based graphing engine mirroring Controls/GraphCanvas.vb + Core/QuizPlot.vb (MiniPlot).
// A GraphCanvas owns collections of "plottable" primitives (functions, parametric curves,
// segments, markers, guide lines, regions, filled areas). A topic module calls canvas.clear(),
// adds primitives for the current problem, then canvas.render() (the worked-example framework
// does the clear()+render() around each topic's draw(canvas, problem) call).

function niceStep(range) {
  const raw = range / 6;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return nice * mag;
}

// Mirrors VB's ":0.##" format - up to 2 decimals, no trailing zeros.
function fmt2(v) {
  if (!isFinite(v)) return String(v);
  let s = v.toFixed(2);
  s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (s === '-0') s = '0';
  return s;
}

class GraphCanvas {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.worldMinX = -10;
    this.worldMaxX = 10;
    this.worldMinY = -6;
    this.worldMaxY = 6;
    this.clear();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvasEl.parentElement);
    this._resize();
  }

  setViewport(minX, maxX, minY, maxY) {
    if (maxX <= minX) maxX = minX + 1;
    if (maxY <= minY) maxY = minY + 1;
    // `_raw` is the viewport the topic asked for; the user's zoom/pan is stored relative to the EFFECTIVE base
    // (`_base` = raw, optionally widened to the canvas aspect in fit-to-window mode and re-centred on the point of
    // interest). The user's view survives redraws (slider moves) but resets when the topic asks for a clearly
    // different raw viewport (e.g. a new example).
    if (this.centerOrigin) {
      // FIXED CARTESIAN SYSTEM: the origin is always in the middle of the window and the scale is constant, so sliders
      // move the points / lines / areas ON the coordinate system and never move the system itself. The window only
      // grows (in nice 1-2-5 steps, symmetric about the origin) when the content would not fit; it never shrinks.
      const nice = (v) => { if (!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; const s = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((q) => q >= m - 1e-9); return s * p; };
      const X = nice(Math.max(Math.abs(minX), Math.abs(maxX))), Y = nice(Math.max(Math.abs(minY), Math.abs(maxY)));
      if (!this.lockScale) this.lockScale = { X, Y };
      else { this.lockScale.X = Math.max(this.lockScale.X, X); this.lockScale.Y = Math.max(this.lockScale.Y, Y); }
      minX = -this.lockScale.X; maxX = this.lockScale.X; minY = -this.lockScale.Y; maxY = this.lockScale.Y;
    }
    const r = this._raw;
    const same = r && Math.abs(r[0] - minX) < 1e-9 && Math.abs(r[1] - maxX) < 1e-9 && Math.abs(r[2] - minY) < 1e-9 && Math.abs(r[3] - maxY) < 1e-9;
    this._raw = [minX, maxX, minY, maxY];
    if (!same || !this._uv) this._uv = { z: 1, px: 0, py: 0 };
    this._applyBase();
  }

  _effectiveBase() {
    let [x0, x1, y0, y1] = this._raw;
    if (this._fit && this.canvas.clientWidth > 0 && this.canvas.clientHeight > 0) {
      const ar = this.canvas.clientWidth / this.canvas.clientHeight, bw = x1 - x0, bh = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      if (ar > bw / bh) { const w = bh * ar; x0 = cx - w / 2; x1 = cx + w / 2; }
      else { const h = bw / ar; y0 = cy - h / 2; y1 = cy + h / 2; }
    }
    if (this._focus) {
      const bw = x1 - x0, bh = y1 - y0;
      x0 = this._focus.x - bw / 2; x1 = x0 + bw; y0 = this._focus.y - bh / 2; y1 = y0 + bh;
    }
    return [x0, x1, y0, y1];
  }

  _applyBase() {
    if (!this._raw) return;
    const base = this._effectiveBase();
    this._base = base;
    const bw = base[1] - base[0], bh = base[3] - base[2], uv = this._uv;
    const cx = (base[0] + base[1]) / 2 + uv.px * bw, cy = (base[2] + base[3]) / 2 + uv.py * bh;
    this.worldMinX = cx - bw / uv.z / 2;
    this.worldMaxX = cx + bw / uv.z / 2;
    this.worldMinY = cy - bh / uv.z / 2;
    this.worldMaxY = cy + bh / uv.z / 2;
    this._syncZoomUi();
  }

  // Centre the view on the point being asked for / investigated (called by the framework after draw()).
  setFocus(x, y) {
    const f = (x == null || y == null || !isFinite(x) || !isFinite(y)) ? null : { x, y };
    const changed = (!!f !== !!this._focus) || (f && this._focus && (f.x !== this._focus.x || f.y !== this._focus.y));
    this._focus = f;
    if (changed) this._applyBase();
  }

  // ---- user interaction: wheel/pinch zoom, drag pan, double-click reset, +/- buttons ----
  _setView(minX, maxX, minY, maxY) {
    const b = this._base;
    if (!b) return;
    const bw = b[1] - b[0], bh = b[3] - b[2];
    const w = maxX - minX;
    if (!(w > 0)) return;
    let z = bw / w;
    z = Math.max(0.02, Math.min(500, z));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    this._uv = { z, px: (cx - (b[0] + b[1]) / 2) / bw, py: (cy - (b[2] + b[3]) / 2) / bh };
    this._applyBase();
    this.render();
  }

  _zoomAt(factor, sx, sy) {
    const p = this.screenToWorld(sx, sy);
    const w = (this.worldMaxX - this.worldMinX) / factor, h = (this.worldMaxY - this.worldMinY) / factor;
    const fx = (sx / this.canvas.clientWidth), fy = 1 - (sy / this.canvas.clientHeight);
    this._setView(p.x - fx * w, p.x + (1 - fx) * w, p.y - fy * h, p.y + (1 - fy) * h);
  }

  dispose() {
    if (this._escFull) document.removeEventListener('keydown', this._escFull);
    document.body.classList.remove('gz-lock');
    this._ro.disconnect();
  }

  resetView() { this._uv = { z: 1, px: 0, py: 0 }; if (this._raw) { this._applyBase(); this.render(); } }

  _syncZoomUi() {
    if (!this._resetBtn) return;
    const uv = this._uv;
    this._resetBtn.style.display = uv && (Math.abs(uv.z - 1) > 1e-6 || Math.abs(uv.px) > 1e-9 || Math.abs(uv.py) > 1e-9) ? '' : 'none';
  }

  enableInteraction() {
    const cv = this.canvas, host = cv.parentElement;
    cv.style.touchAction = 'none';
    cv.style.cursor = 'grab';
    const ptrs = new Map();
    let last = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const dist = () => { const a = [...ptrs.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };
    const mid = () => { const a = [...ptrs.values()]; return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, pos(e));
      last = ptrs.size === 2 ? { d: dist(), m: mid() } : null;
      cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId), cur = pos(e);
      ptrs.set(e.pointerId, cur);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (ptrs.size === 1) {
        const dx = (cur.x - prev.x) / w * (this.worldMaxX - this.worldMinX);
        const dy = (cur.y - prev.y) / h * (this.worldMaxY - this.worldMinY);
        this._setView(this.worldMinX - dx, this.worldMaxX - dx, this.worldMinY + dy, this.worldMaxY + dy);
      } else if (ptrs.size === 2 && last) {
        const d = dist(), m = mid();
        const dx = (m.x - last.m.x) / w * (this.worldMaxX - this.worldMinX);
        const dy = (m.y - last.m.y) / h * (this.worldMaxY - this.worldMinY);
        this._setView(this.worldMinX - dx, this.worldMaxX - dx, this.worldMinY + dy, this.worldMaxY + dy);
        if (last.d > 0) this._zoomAt(d / last.d, m.x, m.y);
        last = { d, m };
      }
    });
    const up = (e) => { ptrs.delete(e.pointerId); last = ptrs.size === 2 ? { d: dist(), m: mid() } : null; if (!ptrs.size) cv.style.cursor = 'grab'; };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = pos(e);
      const k = e.deltaMode === 1 ? 30 : 1;
      this._zoomAt(Math.exp(-e.deltaY * k * 0.0015), p.x, p.y);
    }, { passive: false });
    cv.addEventListener('dblclick', () => this.resetView());

    const bar = document.createElement('div');
    bar.className = 'gz-ctrl';
    const mk = (txt, title, fn) => { const b = document.createElement('button'); b.textContent = txt; b.title = title; b.addEventListener('click', (e) => { e.stopPropagation(); fn(); }); bar.appendChild(b); return b; };
    const fsb = mk('⛶', 'Fit to window', () => {});
    const setFull = (on) => {
      host.classList.toggle('gz-full', on);
      document.body.classList.toggle('gz-lock', on);
      this._fit = on;
      fsb.textContent = on ? '✕' : '⛶';
      fsb.title = on ? 'Close (Esc)' : 'Fit to window';
      this._applyBase();
      this.render();
      host.dispatchEvent(new CustomEvent('gzfull', { bubbles: true, detail: { on } }));
      setTimeout(() => { this._resize(); }, 30);
    };
    fsb.addEventListener('click', (e) => { e.stopPropagation(); setFull(!host.classList.contains('gz-full')); });
    this._escFull = (e) => { if (e.key === 'Escape' && host.classList.contains('gz-full')) setFull(false); };
    document.addEventListener('keydown', this._escFull);
    this._setFull = setFull;
    mk('+', 'Zoom in', () => this._zoomAt(1.5, cv.clientWidth / 2, cv.clientHeight / 2));
    mk('−', 'Zoom out', () => this._zoomAt(1 / 1.5, cv.clientWidth / 2, cv.clientHeight / 2));
    this._resetBtn = mk('⟲', 'Reset view', () => this.resetView());
    this._resetBtn.style.display = 'none';
    host.appendChild(bar);
    this._zoomBar = bar;
  }

  clear() {
    this.functions = [];
    this.parametric = [];
    this.segments = [];
    this.markers = [];
    this.guideLines = [];
    this.regions = [];
    this.filledAreas = [];
    // Reset to the default every clear(), so one topic's Venn-diagram-style `canvas.showGridAndAxes = false`
    // (set inside its own draw()) never leaks into another topic mounted afterwards.
    this.showGridAndAxes = true;
  }

  // Plain-text description of the drawing (for screen readers: aria-label of the canvas); lists labelled curves and marked points.
  describe() {
    const tx = (tr, en) => (window.I18N ? I18N.tx(tr, en) : en);
    const r2 = (v) => String(Math.round(v * 100) / 100).replace('-', '−');
    const parts = [tx('Kartezyen grafik', 'Cartesian graph') + ' x ∈ [' + r2(this.worldMinX) + ', ' + r2(this.worldMaxX) + '], y ∈ [' + r2(this.worldMinY) + ', ' + r2(this.worldMaxY) + '].'];
    const curves = this.functions.length + this.parametric.length;
    if (curves) {
      const names = this.functions.filter((f) => f.label).map((f) => f.label);
      parts.push(tx(`${curves} eğri`, `${curves} curve(s)`) + (names.length ? ': ' + names.slice(0, 4).join('; ') : '') + '.');
    }
    if (this.filledAreas.length) parts.push(tx(`${this.filledAreas.length} boyalı alan.`, `${this.filledAreas.length} shaded area(s).`));
    if (this.segments.length) parts.push(tx(`${this.segments.length} doğru parçası.`, `${this.segments.length} line segment(s).`));
    const mk = this.markers.slice(0, 6).map((m) => (m.label ? m.label + ' ' : '') + '(' + r2(m.x) + ', ' + r2(m.y) + ')');
    if (mk.length) parts.push(tx('İşaretli noktalar: ', 'Marked points: ') + mk.join(', ') + (this.markers.length > 6 ? ' …' : '') + '.');
    return parts.join(' ');
  }
  addFunction(f) { this.functions.push(Object.assign({ color: this.accent(), thickness: 2.5, dashed: false, colorBySlope: false, label: '' }, f)); }
  addParametric(p) { this.parametric.push(Object.assign({ tMin: 0, tMax: 2 * Math.PI, samples: 360, color: this.accent(), thickness: 2, dashed: false }, p)); }
  addSegment(s) { this.segments.push(Object.assign({ color: this.gray(), thickness: 2, dashed: false }, s)); }
  addMarker(m) { this.markers.push(Object.assign({ color: this.gold(), shape: 'circle', label: '', radius: 5, hollow: false }, m)); }
  addGuideLine(g) { this.guideLines.push(Object.assign({ color: this.gray(), label: '' }, g)); }
  addRegion(r) { this.regions.push(Object.assign({ color: this._withAlpha(this.accent(), 0.16) }, r)); }
  addFilledArea(a) { this.filledAreas.push(Object.assign({ color: this._withAlpha(this.accent(), 0.35), samples: 120 }, a)); }

  // Fixed marker/accent colours, independent of theme (mirrors System.Drawing.Color.* literals used across the VB app).
  accent() { return Theme.palette().accent; }
  gray() { return '#888c96'; }
  gold() { return '#e0b400'; }
  green() { return '#3cb371'; }
  blue() { return '#1e90ff'; }
  purple() { return '#9370db'; }
  orange() { return '#ff8c42'; }
  red() { return '#dc5050'; }

  _withAlpha(cssColor, alpha) {
    // Handles hex colours (#rrggbb) and named/var-resolved colours by drawing through a scratch canvas is overkill;
    // instead rely on rgba() when we can parse a hex, else fall back to globalAlpha at fill time.
    const m = /^#([0-9a-f]{6})$/i.exec(cssColor.trim());
    if (m) {
      const r = parseInt(m[1].substr(0, 2), 16), g = parseInt(m[1].substr(2, 2), 16), b = parseInt(m[1].substr(4, 2), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return { base: cssColor, alpha };
  }

  worldToScreen(wx, wy) {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    let sx = (wx - this.worldMinX) / (this.worldMaxX - this.worldMinX) * w;
    let sy = h - (wy - this.worldMinY) / (this.worldMaxY - this.worldMinY) * h;
    const LIMIT = 100000;
    sx = Math.max(-LIMIT, Math.min(LIMIT, isFinite(sx) ? sx : 0));
    sy = Math.max(-LIMIT, Math.min(LIMIT, isFinite(sy) ? sy : 0));
    return { x: sx, y: sy };
  }

  screenToWorld(px, py) {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const wx = this.worldMinX + (px / w) * (this.worldMaxX - this.worldMinX);
    const wy = this.worldMinY + (1 - py / h) * (this.worldMaxY - this.worldMinY);
    return { x: wx, y: wy };
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(50, this.canvas.parentElement.clientWidth);
    const h = Math.max(50, this.canvas.parentElement.clientHeight);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this._fit) this._applyBase();
    this.render();
  }

  _setStroke(ctx, color, alpha) {
    if (typeof color === 'object') {
      ctx.strokeStyle = color.base;
      ctx.globalAlpha = color.alpha;
    } else {
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    }
  }
  _setFill(ctx, color, alpha) {
    if (typeof color === 'object') {
      ctx.fillStyle = color.base;
      ctx.globalAlpha = color.alpha;
    } else {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const palette = Theme.palette();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = palette.graphBackground;
    ctx.fillRect(0, 0, w, h);
    if (w < 20 || h < 20) return;

    const sx = (x) => this.worldToScreen(x, 0).x;
    const sy = (y) => this.worldToScreen(0, y).y;

    // grid
    const stepX = niceStep(this.worldMaxX - this.worldMinX);
    const stepY = niceStep(this.worldMaxY - this.worldMinY);
    if (this.showGridAndAxes) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = palette.grid;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      for (let x = Math.ceil(this.worldMinX / stepX) * stepX; x <= this.worldMaxX + 1e-9; x += stepX) {
        ctx.moveTo(sx(x) + 0.5, 0);
        ctx.lineTo(sx(x) + 0.5, h);
      }
      for (let y = Math.ceil(this.worldMinY / stepY) * stepY; y <= this.worldMaxY + 1e-9; y += stepY) {
        ctx.moveTo(0, sy(y) + 0.5);
        ctx.lineTo(w, sy(y) + 0.5);
      }
      ctx.stroke();
    }

    // regions (drawn under everything else, above grid)
    for (const r of this.regions) {
      this._setFill(ctx, r.color);
      const x1 = sx(r.xMin), x2 = sx(r.xMax);
      ctx.fillRect(Math.min(x1, x2), 0, Math.abs(x2 - x1), h);
      ctx.globalAlpha = 1;
    }

    // filled areas: between the curve `evaluator` and the lower boundary `baseEvaluator` (default: the x-axis, y = 0),
    // over xMin..xMax - use baseEvaluator for "area between two curves"
    // Undefined / infinite points are NOT shaded: the area is drawn in separate pieces over the intervals where the function exists.
    const val = (fn, x) => { let y; try { y = fn(x); } catch (e) { y = NaN; } return Number.isFinite(y) && Math.abs(y) < 1e7 ? y : NaN; };
    for (const a of this.filledAreas) {
      this._setFill(ctx, a.color);
      const n = a.samples, top = [], low = [], xs = [];
      for (let i = 0; i <= n; i++) {
        const x = a.xMin + (a.xMax - a.xMin) * i / n;
        xs.push(x); top.push(val(a.evaluator, x)); low.push(a.baseEvaluator ? val(a.baseEvaluator, x) : 0);
      }
      const ok = (i) => Number.isFinite(top[i]) && Number.isFinite(low[i]);
      for (let i = 0; i <= n;) {
        if (!ok(i)) { i++; continue; }
        let j = i; while (j + 1 <= n && ok(j + 1)) j++;
        ctx.beginPath();
        ctx.moveTo(sx(xs[i]), sy(low[i]));
        for (let k = i; k <= j; k++) ctx.lineTo(sx(xs[k]), sy(top[k]));
        for (let k = j; k >= i; k--) ctx.lineTo(sx(xs[k]), sy(low[k]));
        ctx.closePath();
        ctx.fill();
        i = j + 1;
      }
      ctx.globalAlpha = 1;
    }

    // axes
    const axisX = (this.worldMinX <= 0 && this.worldMaxX >= 0) ? sx(0) : 0;
    const axisY = (this.worldMinY <= 0 && this.worldMaxY >= 0) ? sy(0) : h;
    if (this.showGridAndAxes) {
      ctx.strokeStyle = palette.axis;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, axisY); ctx.lineTo(w, axisY);
      ctx.moveTo(axisX, 0); ctx.lineTo(axisX, h);
      ctx.stroke();

      // tick labels
      ctx.fillStyle = palette.foreground;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.globalAlpha = 1;
      for (let x = Math.ceil(this.worldMinX / stepX) * stepX; x <= this.worldMaxX + 1e-9; x += stepX) {
        if (Math.abs(x) > stepX * 0.01) {
          ctx.fillText(fmt2(x), sx(x) - 6, Math.min(axisY + 14, h - 4));
        }
      }
      for (let y = Math.ceil(this.worldMinY / stepY) * stepY; y <= this.worldMaxY + 1e-9; y += stepY) {
        if (Math.abs(y) > stepY * 0.01) {
          ctx.fillText(fmt2(y), Math.min(axisX + 4, w - 26), sy(y) + 4);
        }
      }
    }

    // guide lines
    for (const g of this.guideLines) {
      ctx.strokeStyle = g.color;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      if (g.axis === 'vertical') {
        ctx.moveTo(sx(g.position), 0); ctx.lineTo(sx(g.position), h);
      } else {
        ctx.moveTo(0, sy(g.position)); ctx.lineTo(w, sy(g.position));
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (g.label) {
        ctx.fillStyle = g.color;
        if (g.axis === 'vertical') ctx.fillText(g.label, sx(g.position) + 4, 14);
        else ctx.fillText(g.label, 4, sy(g.position) - 4);
      }
    }

    // functions
    let curveIndex = 0;
    for (const f of this.functions) {
      if (f.visible === false) continue;
      ctx.lineWidth = f.thickness;
      ctx.setLineDash(f.dashed ? [7, 5] : []);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (f.colorBySlope) {
        this._drawColorBySlope(ctx, f, sx, sy);
      } else {
        ctx.strokeStyle = f.color;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        let drawing = false, prevY = 0;
        const n = 2000;
        for (let i = 0; i <= n; i++) {
          const x = this.worldMinX + (this.worldMaxX - this.worldMinX) * i / n;
          let y;
          try { y = f.evaluator(x); } catch (e) { y = NaN; }
          const ok = isFinite(y) && Math.abs(y) < 1e7;
          if (ok) {
            const p = this.worldToScreen(x, y);
            // a jump of more than 80 % of the window height between two neighbouring samples is a pole or a jump: lift the pen
            if (drawing && Math.abs(p.y - prevY) > 0.8 * h) drawing = false;
            if (!drawing) { ctx.moveTo(p.x, p.y); drawing = true; } else { ctx.lineTo(p.x, p.y); }
            prevY = p.y;
          } else {
            drawing = false;
          }
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      if (f.label) {
        ctx.fillStyle = f.color;
        ctx.font = 'italic 11px "Segoe UI", sans-serif';
        ctx.fillText(f.label, 6, 16 + curveIndex * 15);
      }
      curveIndex++;
    }

    // parametric curves
    for (const p of this.parametric) {
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 1;
      ctx.lineWidth = p.thickness;
      ctx.setLineDash(p.dashed ? [7, 5] : []);
      ctx.beginPath();
      for (let i = 0; i <= p.samples; i++) {
        const t = p.tMin + (p.tMax - p.tMin) * i / p.samples;
        const pt = this.worldToScreen(p.xOfT(t), p.yOfT(t));
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // segments
    for (const s of this.segments) {
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = 1;
      ctx.lineWidth = s.thickness;
      ctx.setLineDash(s.dashed ? [7, 5] : []);
      const p1 = this.worldToScreen(s.x1, s.y1), p2 = this.worldToScreen(s.x2, s.y2);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // markers
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    for (const m of this.markers) {
      const p = this.worldToScreen(m.x, m.y);
      const r = m.radius;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.6;
      if (m.hollow) {
        ctx.fillStyle = palette.graphBackground;
        this._drawShape(ctx, p, r, m.shape, true);
        ctx.strokeStyle = m.color;
        this._drawShape(ctx, p, r, m.shape, false);
      } else {
        ctx.fillStyle = m.color;
        this._drawShape(ctx, p, r, m.shape, true);
        ctx.strokeStyle = palette.axis;
        this._drawShape(ctx, p, r, m.shape, false);
      }
      if (m.label) {
        ctx.fillStyle = palette.foreground;
        ctx.fillText(m.label, p.x + r + 4, p.y - r - 4);
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawShape(ctx, p, r, shape, fill) {
    ctx.beginPath();
    if (shape === 'square') {
      ctx.rect(p.x - r, p.y - r, 2 * r, 2 * r);
    } else if (shape === 'diamond') {
      ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x + r, p.y); ctx.lineTo(p.x, p.y + r); ctx.lineTo(p.x - r, p.y); ctx.closePath();
    } else {
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    }
    if (fill) ctx.fill(); else ctx.stroke();
  }

  _drawColorBySlope(ctx, f, sx, sy) {
    const n = 1200;
    const h = 0.0005 * (this.worldMaxX - this.worldMinX);
    let prev = null;
    for (let i = 0; i < n; i++) {
      const x0 = this.worldMinX + (this.worldMaxX - this.worldMinX) * i / n;
      const x1 = this.worldMinX + (this.worldMaxX - this.worldMinX) * (i + 1) / n;
      let y0, y1, slope;
      try {
        y0 = f.evaluator(x0);
        y1 = f.evaluator(x1);
        slope = (f.evaluator(x0 + h) - f.evaluator(x0 - h)) / (2 * h);
      } catch (e) { y0 = y1 = slope = NaN; }
      if (!isFinite(y0) || !isFinite(y1) || !isFinite(slope)) { prev = null; continue; }
      const t = Math.max(-1, Math.min(1, slope / 3));
      // negative slope -> warm (orange), positive -> cool (blue), near zero -> gray
      let color;
      if (t < 0) color = this._lerpColor('#ff8c42', '#9aa2b1', -t);
      else color = this._lerpColor('#9aa2b1', '#3aa0ff', t);
      const p0 = this.worldToScreen(x0, y0), p1 = this.worldToScreen(x1, y1);
      if (Math.abs(p1.y - p0.y) > 0.8 * this.canvas.clientHeight) continue; // pole / jump
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  }

  _lerpColor(a, b, t) {
    const pa = this._hex(a), pb = this._hex(b);
    const r = Math.round(pa.r + (pb.r - pa.r) * t);
    const g = Math.round(pa.g + (pb.g - pa.g) * t);
    const bl = Math.round(pa.b + (pb.b - pa.b) * t);
    return `rgb(${r},${g},${bl})`;
  }
  _hex(c) {
    const m = /^#([0-9a-f]{6})$/i.exec(c);
    return m ? { r: parseInt(m[1].substr(0, 2), 16), g: parseInt(m[1].substr(2, 2), 16), b: parseInt(m[1].substr(4, 2), 16) } : { r: 128, g: 128, b: 128 };
  }
}
