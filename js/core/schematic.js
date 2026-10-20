// Schematic: a small 2D "engineering sketch" canvas used beside the x-y graph in the Engineering chapter.
// Virtual space is 100 x 100 units, origin at the BOTTOM-LEFT, y pointing UP (like a textbook figure); the
// canvas is always square. A topic implements `drawSchematic(sc, problem)`; the framework calls sc.clear()
// before and sc.render() after, so a schematic always follows the current problem / slider values.
//
// Colours are theme aware: sc.c.ink (outline/text), sc.c.fill (soft body fill), sc.c.accent, sc.c.steel,
// sc.c.fluid, sc.c.heat, sc.c.load, sc.c.good, sc.c.grid ... Every primitive takes an optional opts object.

class Schematic {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.ops = [];
    this.c = this._palette();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvasEl.parentElement);
    this._resize();
  }

  // ---------- lifecycle ----------
  clear() { this.ops = []; this.c = this._palette(); }
  render() {
    const ctx = this.ctx, w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.c.bg;
    ctx.fillRect(0, 0, w, h);
    this._k = Math.min(w, h) / 100;
    this._ox = (w - 100 * this._k) / 2;
    this._oy = (h + 100 * this._k) / 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.ops.forEach((fn) => { try { ctx.save(); fn(); ctx.restore(); } catch (e) { ctx.restore(); } });
    ctx.restore();
  }
  destroy() { this._ro.disconnect(); }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(50, this.canvas.parentElement.clientWidth);
    const h = Math.max(50, this.canvas.parentElement.clientHeight);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }

  _palette() {
    const p = Theme.palette();
    const dark = Theme.isDark();
    return {
      bg: p.graphBackground,
      ink: p.foreground,
      sub: p.subtleForeground,
      grid: p.grid,
      accent: p.accent,
      fill: dark ? 'rgba(160,175,200,0.16)' : 'rgba(80,100,140,0.12)',
      steel: dark ? '#9aa7bd' : '#5d6b85',
      steelDark: dark ? '#6c7a93' : '#3f4c66',
      fluid: dark ? '#4aa3ff' : '#1e7fe0',
      fluidSoft: dark ? 'rgba(74,163,255,0.35)' : 'rgba(30,127,224,0.30)',
      heat: dark ? '#ff7a59' : '#e0452a',
      cold: dark ? '#6ec1ff' : '#2f86d6',
      load: dark ? '#ffb454' : '#d9730d',
      good: p.good,
      bad: p.bad,
      gold: '#e0b400',
      green: '#3cb371',
      purple: '#9370db',
    };
  }

  // ---------- coordinate helpers ----------
  X(x) { return this._ox + x * this._k; }
  Y(y) { return this._oy - y * this._k; }
  S(n) { return n * this._k; }
  _add(fn) { this.ops.push(fn); return this; }
  _stroke(o, dflt) {
    const ctx = this.ctx;
    ctx.strokeStyle = (o && o.color) || (dflt || this.c.ink);
    ctx.lineWidth = Math.max(1, this.S((o && o.w) || 0.6));
    ctx.setLineDash(o && o.dash ? o.dash.map((d) => this.S(d)) : []);
  }

  // ---------- basic shapes ----------
  line(x1, y1, x2, y2, o) {
    return this._add(() => {
      const ctx = this.ctx; this._stroke(o);
      ctx.beginPath(); ctx.moveTo(this.X(x1), this.Y(y1)); ctx.lineTo(this.X(x2), this.Y(y2)); ctx.stroke();
    });
  }
  poly(pts, o) {
    o = o || {};
    return this._add(() => {
      const ctx = this.ctx;
      ctx.beginPath();
      pts.forEach((p, i) => { if (i === 0) ctx.moveTo(this.X(p[0]), this.Y(p[1])); else ctx.lineTo(this.X(p[0]), this.Y(p[1])); });
      if (o.close !== false) ctx.closePath();
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
      if (o.stroke !== false) { this._stroke(o); ctx.stroke(); }
    });
  }
  // x, y = bottom-left corner
  rect(x, y, w, h, o) {
    return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], Object.assign({ fill: this._fillDefault() }, o));
  }
  _fillDefault() { return this.c ? this.c.fill : 'rgba(128,140,170,0.15)'; }
  circle(cx, cy, r, o) {
    o = o || {};
    return this._add(() => {
      const ctx = this.ctx;
      ctx.beginPath(); ctx.arc(this.X(cx), this.Y(cy), this.S(r), 0, Math.PI * 2);
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
      if (o.stroke !== false) { this._stroke(o); ctx.stroke(); }
    });
  }
  // angles in degrees, counter-clockwise from +x (textbook convention)
  arc(cx, cy, r, a0, a1, o) {
    o = o || {};
    return this._add(() => {
      const ctx = this.ctx; this._stroke(o);
      ctx.beginPath();
      ctx.arc(this.X(cx), this.Y(cy), this.S(r), -a0 * Math.PI / 180, -a1 * Math.PI / 180, true);
      ctx.stroke();
    });
  }
  text(x, y, str, o) {
    o = o || {};
    return this._add(() => {
      const ctx = this.ctx;
      ctx.fillStyle = o.color || this.c.ink;
      ctx.font = `${o.bold ? '700 ' : ''}${Math.max(9, this.S(o.size || 3.6))}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = o.align || 'center';
      ctx.textBaseline = o.base || 'middle';
      if (o.rot) { ctx.translate(this.X(x), this.Y(y)); ctx.rotate(-o.rot * Math.PI / 180); ctx.fillText(String(str), 0, 0); }
      else ctx.fillText(String(str), this.X(x), this.Y(y));
    });
  }
  title(str) { return this.text(50, 96, str, { size: 4.2, bold: true }); }

  // ---------- arrows, dimensions ----------
  arrow(x1, y1, x2, y2, o) {
    o = o || {};
    return this._add(() => {
      const ctx = this.ctx, col = o.color || this.c.load;
      this._stroke(o, col); ctx.lineWidth = Math.max(1.5, this.S(o.w || 0.9));
      const ax = this.X(x1), ay = this.Y(y1), bx = this.X(x2), by = this.Y(y2);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      const ang = Math.atan2(by - ay, bx - ax), hl = this.S(o.head || 2.6);
      ctx.setLineDash([]); ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.lineTo(bx - hl * Math.cos(ang - 0.4), by - hl * Math.sin(ang - 0.4));
      ctx.lineTo(bx - hl * Math.cos(ang + 0.4), by - hl * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
    });
  }
  // dimension line between two points with end ticks and a label (offset: perpendicular shift in units)
  dim(x1, y1, x2, y2, label, o) {
    o = o || {};
    const off = o.offset == null ? 0 : o.offset;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L * off, ny = dx / L * off;
    const a = [x1 + nx, y1 + ny], b = [x2 + nx, y2 + ny];
    if (off !== 0) { this.line(x1, y1, a[0], a[1], { color: this.c ? this.c.sub : undefined, w: 0.25 }); this.line(x2, y2, b[0], b[1], { color: this.c ? this.c.sub : undefined, w: 0.25 }); }
    this._add(() => { this._stroke({ w: 0.35, color: this.c.sub }); });
    this.arrow(a[0], a[1], b[0], b[1], { color: this.c ? this.c.sub : undefined, w: 0.35, head: 1.8 });
    this.arrow(b[0], b[1], a[0], a[1], { color: this.c ? this.c.sub : undefined, w: 0.35, head: 1.8 });
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    return this.text(mx + (o.tx || 0), my + (o.ty == null ? 2.6 : o.ty), label, { size: o.size || 3.1, color: o.color || this.c && this.c.ink });
  }
  // label with a small leader line to a point
  callout(x, y, tx, ty, str, o) {
    this.line(x, y, tx, ty, { color: this.c ? this.c.sub : undefined, w: 0.25 });
    return this.text(tx, ty, str, Object.assign({ size: 3.1 }, o));
  }

  // ---------- supports and ground ----------
  ground(x1, x2, y) {
    this.line(x1, y, x2, y, { w: 0.8 });
    for (let x = x1; x < x2; x += 3) this.line(x, y, x - 2.4, y - 2.8, { w: 0.35, color: this.c ? this.c.sub : undefined });
    return this;
  }
  pinSupport(x, y) {
    this.poly([[x, y], [x - 3, y - 5], [x + 3, y - 5]], { fill: this._fillDefault() });
    return this.ground(x - 5, x + 5, y - 5);
  }
  rollerSupport(x, y) {
    this.poly([[x, y], [x - 3, y - 4], [x + 3, y - 4]], { fill: this._fillDefault() });
    this.circle(x - 1.6, y - 5.2, 1.2); this.circle(x + 1.6, y - 5.2, 1.2);
    return this.ground(x - 5, x + 5, y - 6.4);
  }
  // wall on the left (side='L') or right (side='R') or floor (side='B') with hatching
  fixedSupport(x, y, side, len) {
    len = len || 16; side = side || 'L';
    if (side === 'B') { this.ground(x - len / 2, x + len / 2, y); return this; }
    const s = side === 'L' ? -1 : 1;
    this.line(x, y - len / 2, x, y + len / 2, { w: 1 });
    for (let t = -len / 2; t < len / 2; t += 3) this.line(x, y + t, x + s * 3, y + t + 2.8, { w: 0.35, color: this.c ? this.c.sub : undefined });
    return this;
  }

  // ---------- mechanical components ----------
  // zig-zag spring from (x1,y1) to (x2,y2)
  spring(x1, y1, x2, y2, coils, amp, o) {
    coils = coils || 7; amp = amp == null ? 2.4 : amp;
    return this._add(() => {
      const ctx = this.ctx; this._stroke(o, this.c.steel); ctx.lineWidth = Math.max(1.5, this.S(0.7));
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      const lead = Math.min(L * 0.15, 4), body = L - 2 * lead;
      ctx.beginPath(); ctx.moveTo(this.X(x1), this.Y(y1));
      ctx.lineTo(this.X(x1 + ux * lead), this.Y(y1 + uy * lead));
      const n = coils * 2;
      for (let i = 1; i <= n; i++) {
        const t = lead + body * (i - 0.5) / n, sgn = i % 2 ? 1 : -1;
        ctx.lineTo(this.X(x1 + ux * t + nx * amp * sgn), this.Y(y1 + uy * t + ny * amp * sgn));
      }
      ctx.lineTo(this.X(x1 + ux * (L - lead)), this.Y(y1 + uy * (L - lead)));
      ctx.lineTo(this.X(x2), this.Y(y2));
      ctx.stroke();
    });
  }
  // dashpot (damper) from (x1,y1) to (x2,y2), drawn along x or y
  damper(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const P = (t, s) => [x1 + ux * t + nx * s, y1 + uy * t + ny * s];
    const a = P(L * 0.35, 0), b = P(L * 0.62, 0);
    this.line(x1, y1, a[0], a[1], { w: 0.8 }); this.line(b[0], b[1], x2, y2, { w: 0.8 });
    const c1 = P(L * 0.3, 2.6), c2 = P(L * 0.3, -2.6), c3 = P(L * 0.62, -2.6), c4 = P(L * 0.62, 2.6);
    this.poly([c1, c2, c3, c4].map((p) => p), { close: false, w: 0.7 });
    const d1 = P(L * 0.5, 1.9), d2 = P(L * 0.5, -1.9);
    this.line(d1[0], d1[1], d2[0], d2[1], { w: 0.9 });
    const e = P(L * 0.5, 0); this.line(a[0], a[1], e[0], e[1], { w: 0.0001 });
    return this;
  }
  mass(x, y, w, h, label, o) {
    this.rect(x, y, w, h, Object.assign({ fill: this.c ? this.c.fill : undefined, w: 0.8 }, o));
    if (label) this.text(x + w / 2, y + h / 2, label, { size: 3.4, bold: true });
    return this;
  }
  // beam drawn as a thick bar from (x1,y) to (x2,y) of thickness t (centred on y)
  beam(x1, x2, y, t, o) { return this.rect(x1, y - t / 2, x2 - x1, t, Object.assign({ w: 0.8 }, o)); }
  // evenly spaced arrows for a distributed load; hFn(x) gives arrow length (units) at x
  distLoad(x1, x2, yBase, hFn, o) {
    o = o || {};
    const n = o.n || Math.max(4, Math.round((x2 - x1) / 4)), col = o.color || (this.c && this.c.load);
    const top = [];
    for (let i = 0; i <= n; i++) {
      const x = x1 + (x2 - x1) * i / n, h = typeof hFn === 'function' ? hFn(x) : hFn;
      top.push([x, yBase + h]);
      if (h > 0.8) this.arrow(x, yBase + h, x, yBase, { color: col, w: 0.5, head: 1.8 });
    }
    return this.poly(top, { close: false, color: col, w: 0.6 });
  }
  // fluid-filled tank: x,y bottom-left, w,h box, fill fraction 0..1
  tank(x, y, w, h, frac, o) {
    o = o || {};
    frac = Math.max(0, Math.min(1, frac));
    this.rect(x, y, w, h * frac, { fill: this.c ? this.c.fluidSoft : undefined, stroke: false });
    this.line(x, y + h * frac, x + w, y + h * frac, { color: this.c ? this.c.fluid : undefined, w: 0.6 });
    return this.poly([[x, y + h], [x, y], [x + w, y], [x + w, y + h]], { close: false, w: 0.9 });
  }
  // pipe segment between two points with a wall thickness t
  pipe(x1, y1, x2, y2, t, o) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * t / 2, ny = dx / L * t / 2;
    return this.poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], Object.assign({ fill: this._fillDefault() }, o));
  }
  // flow arrows along a line
  flow(x1, y1, x2, y2, n, o) {
    n = n || 3;
    for (let i = 0; i < n; i++) {
      const a = (i + 0.2) / n, b = (i + 0.7) / n;
      this.arrow(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b, Object.assign({ color: this.c ? this.c.fluid : undefined, w: 0.5, head: 1.8 }, o));
    }
    return this;
  }
  // gear (simple toothed circle)
  gear(cx, cy, r, teeth, rot, o) {
    teeth = teeth || 12; rot = rot || 0;
    const pts = [], ro = r, ri = r * 0.82;
    for (let i = 0; i < teeth; i++) {
      const a0 = rot + 360 / teeth * i, a1 = a0 + 360 / teeth * 0.25, a2 = a0 + 360 / teeth * 0.5, a3 = a0 + 360 / teeth * 0.75;
      [[a0, ri], [a1, ro], [a2, ro], [a3, ri]].forEach(([a, rr]) => pts.push([cx + rr * Math.cos(a * Math.PI / 180), cy + rr * Math.sin(a * Math.PI / 180)]));
    }
    this.poly(pts, Object.assign({ fill: this._fillDefault(), w: 0.6 }, o));
    return this.circle(cx, cy, r * 0.2, { w: 0.6 });
  }
  // piston-cylinder: x,y bottom-left of cylinder, w,h inner size, pistonY = piston position (0..h)
  pistonCylinder(x, y, w, h, pistonY, o) {
    this.rect(x, y, w, pistonY, { fill: this.c ? this.c.fluidSoft : undefined, stroke: false });
    this.poly([[x, y + h], [x, y], [x + w, y], [x + w, y + h]], { close: false, w: 1 });
    this.rect(x + 0.6, y + pistonY, w - 1.2, 2.6, { fill: this.c ? this.c.steel : undefined, w: 0.6 });
    return this.line(x + w / 2, y + pistonY + 2.6, x + w / 2, y + h + 8, { w: 1.1 });
  }
  // a small stress element square with normal/shear arrows is better composed by the topic; this draws a
  // thermometer-like bar (value 0..1) used for temperatures
  gauge(x, y, w, h, frac, color, label) {
    frac = Math.max(0, Math.min(1, frac));
    this.rect(x, y, w, h, { fill: 'rgba(0,0,0,0)', w: 0.7 });
    this.rect(x, y, w, h * frac, { fill: color || (this.c && this.c.heat), stroke: false });
    if (label) this.text(x + w / 2, y - 3, label, { size: 3 });
    return this;
  }
}
