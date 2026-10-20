// 2D animations for the "Başlangıç" tabs. Each: { kind:'2d', title, caption, draw(ctx, W, H, t, C, K) }.
const IntroAnims2D = (function () {
  const T = (a, b) => [a, b];
  const f2 = (v) => (Math.round(v * 100) / 100).toFixed(2).replace('-', '−');
  const PI = Math.PI;

  const numberLine = {
    kind: '2d', title: T('Sayı doğrusu ve mutlak değer', 'Number line and absolute value'),
    caption: T('Nokta gezerken |x|, sıfıra olan uzaklıktır; mavi bölge |x| < 2 aralığıdır.', 'As the point moves, |x| is its distance from zero; the blue band is |x| < 2.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.axes(ctx, W, H, -6.5, 6.5, -1.4, 1.4, C, { grid: false });
      const x = 4.6 * Math.sin(t * 0.6);
      ctx.fillStyle = C.accent + '33'; ctx.fillRect(ax.X(-2), ax.Y(0.5), ax.X(2) - ax.X(-2), ax.Y(-0.5) - ax.Y(0.5));
      for (let k = -6; k <= 6; k++) { K.seg(ctx, ax, k, -0.08, k, 0.08, C.sub, 1.5); K.text(ctx, String(k).replace('-', '−'), ax.X(k), ax.Y(-0.28), C.sub, 12, 'center'); }
      K.seg(ctx, ax, 0, 0.35, x, 0.35, C.orange, 4);
      K.dot(ctx, ax, x, 0, C.accent, 8);
      K.text(ctx, 'x = ' + f2(x) + '     |x| = ' + f2(Math.abs(x)), W / 2, 26, C.fg, 16, 'center');
      K.text(ctx, '|x| < 2', ax.X(0), ax.Y(0.75), C.accent, 13, 'center');
    },
  };
  const cartesian = {
    kind: '2d', title: T('Kartezyen düzlemde uzaklık ve eğim', 'Distance and slope in the Cartesian plane'),
    caption: T('P noktası hareket eder; d = √(Δx² + Δy²), m = Δy/Δx ve M orta noktadır.', 'Point P moves; d = √(Δx² + Δy²), m = Δy/Δx and M is the midpoint.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.eq(ctx, W, H, 4.6, C);
      const Q = [-3, -2], P = [3.2 * Math.cos(t * 0.5), 2.4 * Math.sin(t * 0.5) + 0.8];
      const dx = P[0] - Q[0], dy = P[1] - Q[1], d = Math.hypot(dx, dy), m = Math.abs(dx) < 1e-6 ? NaN : dy / dx;
      K.seg(ctx, ax, Q[0], Q[1], P[0], Q[1], C.good, 2, [6, 4]); K.seg(ctx, ax, P[0], Q[1], P[0], P[1], C.good, 2, [6, 4]);
      K.seg(ctx, ax, Q[0], Q[1], P[0], P[1], C.accent, 3);
      K.dot(ctx, ax, Q[0], Q[1], C.sub, 6); K.dot(ctx, ax, P[0], P[1], C.accent, 7); K.dot(ctx, ax, (P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2, C.orange, 6);
      K.text(ctx, 'P', ax.X(P[0]) + 8, ax.Y(P[1]) - 8, C.accent, 14); K.text(ctx, 'Q', ax.X(Q[0]) - 18, ax.Y(Q[1]) + 4, C.sub, 14); K.text(ctx, 'M', ax.X((P[0] + Q[0]) / 2) + 8, ax.Y((P[1] + Q[1]) / 2) - 8, C.orange, 14);
      K.text(ctx, 'd = ' + f2(d) + '    m = ' + (Number.isFinite(m) ? f2(m) : '∞'), 14, 24, C.fg, 15);
    },
  };
  const transform = {
    kind: '2d', title: T('Grafik dönüşümleri: y = a(x − h)² + k', 'Graph transformations: y = a(x − h)² + k'),
    caption: T('Kesikli eğri y = x² ana grafiğidir; a ölçekler, h yatay, k dikey kaydırır.', 'The dashed curve is the parent y = x²; a scales, h shifts horizontally, k vertically.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.eq(ctx, W, H, 5, C);
      const a = 1 + 0.7 * Math.sin(t * 0.9), h = 2 * Math.sin(t * 0.55), k = 1.8 * Math.cos(t * 0.4);
      ctx.setLineDash([6, 5]); K.plot(ctx, ax, (x) => x * x, C.sub, 2); ctx.setLineDash([]);
      K.plot(ctx, ax, (x) => a * (x - h) * (x - h) + k, C.accent, 3.2);
      K.dot(ctx, ax, h, k, C.orange, 6);
      K.text(ctx, 'a = ' + f2(a) + '   h = ' + f2(h) + '   k = ' + f2(k), 14, 24, C.fg, 15);
    },
  };
  const inverse = {
    kind: '2d', title: T('Ters fonksiyon: y = x doğrusuna göre yansıma', 'Inverse function: reflection in the line y = x'),
    caption: T('(a, f(a)) noktasının yansıması (f(a), a) ters fonksiyonun grafiğindedir.', 'The reflection of (a, f(a)) is (f(a), a) and lies on the graph of the inverse.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.eq(ctx, W, H, 4.2, C), f = (x) => x * x * x / 4 + x / 2;
      const inv = (y) => { let lo = -6, hi = 6; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (f(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };
      K.seg(ctx, ax, -9, -9, 9, 9, C.sub, 1.5, [6, 5]);
      K.plot(ctx, ax, f, C.accent, 3); K.plot(ctx, ax, inv, C.good, 3);
      const a = 2.2 * Math.sin(t * 0.7), b = f(a);
      K.seg(ctx, ax, a, b, b, a, C.orange, 2, [4, 4]); K.dot(ctx, ax, a, b, C.accent, 6); K.dot(ctx, ax, b, a, C.good, 6);
      K.text(ctx, 'f', ax.X(2.4), ax.Y(f(2.4)) - 8, C.accent, 15); K.text(ctx, 'f⁻¹', ax.X(f(2.2)) + 6, ax.Y(2.2) + 14, C.good, 15);
      K.text(ctx, '(' + f2(a) + ', ' + f2(b) + ')  ↔  (' + f2(b) + ', ' + f2(a) + ')', 14, 24, C.fg, 15);
    },
  };
  const unitCircle = {
    kind: '2d', title: T('Birim çember ve sinüs dalgası', 'Unit circle and the sine wave'),
    caption: T('Çember üzerinde dönen noktanın yüksekliği sin θ, yatay konumu cos θ; sağda sinüs dalgası çizilir.', 'The height of the rotating point is sin θ and its horizontal position cos θ; the sine wave is traced on the right.'),
    draw(ctx, W, H, t, C, K) {
      const cx = W * 0.25, cy = H / 2, r = Math.min(H * 0.34, W * 0.18), th = (t * 0.9) % (2 * PI);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, cy); ctx.lineTo(W - 8, cy); ctx.moveTo(cx, 8); ctx.lineTo(cx, H - 8); ctx.stroke();
      ctx.strokeStyle = C.sub; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * PI); ctx.stroke();
      const px = cx + r * Math.cos(th), py = cy - r * Math.sin(th), x0 = W * 0.52, sx = (W * 0.44) / (2 * PI);
      ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, -th, true); ctx.stroke();
      ctx.strokeStyle = C.orange; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
      ctx.strokeStyle = C.good; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, cy); ctx.stroke();
      ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.beginPath();
      for (let u = 0; u <= th + 1e-9; u += 0.04) { const x = x0 + u * sx, y = cy - r * Math.sin(u); if (u === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      const hx = x0 + th * sx; ctx.setLineDash([5, 4]); ctx.strokeStyle = C.good; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(hx, py); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(px, py, 7, 0, 2 * PI); ctx.fill(); ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(hx, py, 6, 0, 2 * PI); ctx.fill();
      K.text(ctx, 'θ = ' + f2(th) + ' rad     sin θ = ' + f2(Math.sin(th)) + '     cos θ = ' + f2(Math.cos(th)), 14, 24, C.fg, 15);
    },
  };
  const radian = {
    kind: '2d', title: T('Radyan: yay uzunluğu / yarıçap', 'Radian: arc length / radius'),
    caption: T('Yarıçap uzunluğunda bir yay 1 radyanlık açı keser; tam tur 2π ≈ 6,28 yarıçaptır.', 'An arc as long as the radius subtends 1 radian; a full turn is 2π ≈ 6.28 radii.'),
    draw(ctx, W, H, t, C, K) {
      const cx = W / 2, cy = H / 2 + 8, r = Math.min(H * 0.36, W * 0.22), th = ((t * 0.7) % (2 * PI)) + 0.001;
      ctx.strokeStyle = C.sub; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * PI); ctx.stroke();
      ctx.strokeStyle = C.orange; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r, 0, -th, true); ctx.stroke();
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * Math.cos(th), cy - r * Math.sin(th)); ctx.stroke();
      for (let i = 1; i <= Math.floor(th); i++) { const a = i; ctx.fillStyle = C.good; ctx.beginPath(); ctx.arc(cx + r * Math.cos(a), cy - r * Math.sin(a), 5, 0, 2 * PI); ctx.fill(); }
      K.text(ctx, 'θ = ' + f2(th) + ' rad = ' + Math.round(th * 180 / PI) + '°    s = r·θ = ' + f2(th) + ' r', W / 2, 26, C.fg, 15, 'center');
    },
  };
  const hole = (x) => x + 1;
  const approach = {
    kind: '2d', title: T('Limit: x → 1 iken f(x) neye yaklaşır?', 'Limit: what does f(x) approach as x → 1?'),
    caption: T('f(x) = (x² − 1)/(x − 1) x = 1\'de tanımsızdır, ama iki taraftan yaklaşırken değer 2\'ye gider.', 'f(x) = (x² − 1)/(x − 1) is undefined at x = 1, yet from both sides the value goes to 2.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.axes(ctx, W, H, -1, 3.4, -0.6, 4.2, C);
      K.plot(ctx, ax, hole, C.accent, 3); K.dot(ctx, ax, 1, 2, C.accent, 7, true);
      const d = 1.4 * Math.pow(0.5, (t * 0.9) % 7);
      [[1 - d, C.good], [1 + d, C.orange]].forEach(([x, col]) => {
        K.seg(ctx, ax, x, 0, x, hole(x), col, 1.5, [4, 4]); K.seg(ctx, ax, x, hole(x), -1, hole(x), col, 1.5, [4, 4]); K.dot(ctx, ax, x, hole(x), col, 6);
      });
      K.text(ctx, 'x = ' + (1 - d).toFixed(4) + ' → f = ' + hole(1 - d).toFixed(4) + '        x = ' + (1 + d).toFixed(4) + ' → f = ' + hole(1 + d).toFixed(4), 14, 24, C.fg, 14);
    },
  };
  const epsDelta = {
    kind: '2d', title: T('ε–δ: hata payı ve yaklaşma bandı', 'ε–δ: tolerance and the approach band'),
    caption: T('Yatay bant L ± ε, dikey bant a ± δ. ε küçüldükçe uygun bir δ bulunabilir.', 'The horizontal band is L ± ε, the vertical band a ± δ. As ε shrinks a suitable δ can still be found.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.axes(ctx, W, H, -1, 3.4, -0.6, 4.2, C), eps = 0.55 + 0.4 * Math.sin(t * 0.8);
      ctx.fillStyle = C.good + '33'; ctx.fillRect(0, ax.Y(2 + eps), W, ax.Y(2 - eps) - ax.Y(2 + eps));
      ctx.fillStyle = C.orange + '33'; ctx.fillRect(ax.X(1 - eps), 0, ax.X(1 + eps) - ax.X(1 - eps), H);
      K.plot(ctx, ax, hole, C.accent, 3); K.dot(ctx, ax, 1, 2, C.accent, 7, true);
      K.text(ctx, 'ε = ' + f2(eps) + '     δ = ' + f2(eps), 14, 24, C.fg, 15);
    },
  };
  const secant = {
    kind: '2d', title: T('Kesenden teğete: türevin tanımı', 'From secant to tangent: the definition of the derivative'),
    caption: T('h → 0 iken kesenin eğimi (f(a+h) − f(a))/h teğetin eğimi f′(a)\'ya yaklaşır.', 'As h → 0 the secant slope (f(a+h) − f(a))/h approaches the tangent slope f′(a).'),
    draw(ctx, W, H, t, C, K) {
      const f = (x) => 0.25 * x * x * x - x + 0.4, fp = (x) => 0.75 * x * x - 1, ax = K.eq(ctx, W, H, 3.2, C), a = 0.8;
      K.plot(ctx, ax, f, C.accent, 3);
      const h = 2.2 * Math.pow(0.5, (t * 0.8) % 7), m = (f(a + h) - f(a)) / h;
      K.plot(ctx, ax, (x) => f(a) + fp(a) * (x - a), C.sub, 1.6);
      K.plot(ctx, ax, (x) => f(a) + m * (x - a), C.orange, 2.6);
      K.dot(ctx, ax, a, f(a), C.fg, 6); K.dot(ctx, ax, a + h, f(a + h), C.orange, 6);
      K.text(ctx, 'h = ' + h.toFixed(3) + '     ' + (tx2()) + ' = ' + m.toFixed(3) + '     f′(a) = ' + fp(a).toFixed(3), 14, 24, C.fg, 14);
    },
  };
  const tx2 = () => (I18N.get() ? 'kesen eğimi' : 'secant slope');
  const fprime = {
    kind: '2d', title: T('Türev fonksiyonu f′ nasıl çizilir?', 'How the derivative function f′ is drawn'),
    caption: T('Üstte f ve noktadaki teğet; altta teğetin eğimi, f′ grafiğini çizer.', 'Top: f and the tangent at the point; bottom: the tangent slope traces the graph of f′.'),
    draw(ctx, W, H, t, C, K) {
      const f = (x) => 0.25 * x * x * x - x, fp = (x) => 0.75 * x * x - 1, x0 = -3 + ((t * 0.7) % 6);
      const h = H / 2;
      ctx.save(); let ax = K.axes(ctx, W, h, -3, 3, -2.4, 2.4, C); K.plot(ctx, ax, f, C.accent, 3);
      const m = fp(x0); K.plot(ctx, ax, (x) => f(x0) + m * (x - x0), C.orange, 2.4, x0 - 1.2, x0 + 1.2); K.dot(ctx, ax, x0, f(x0), C.orange, 6);
      K.text(ctx, 'f', 10, 18, C.accent, 14); ctx.restore();
      ctx.save(); ctx.translate(0, h); ax = K.axes(ctx, W, h, -3, 3, -2.4, 3.2, C);
      K.plot(ctx, ax, fp, C.good, 3, -3, x0); K.dot(ctx, ax, x0, m, C.good, 6); K.text(ctx, 'f′', 10, 18, C.good, 14);
      K.text(ctx, 'x = ' + f2(x0) + '   f′(x) = ' + f2(m), W - 12, 18, C.fg, 13, 'right'); ctx.restore();
      ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(W, h); ctx.stroke();
    },
  };
  const sign = {
    kind: '2d', title: T('Artan–azalan ve ekstremum noktaları', 'Increasing–decreasing and extreme points'),
    caption: T('f′ > 0 iken eğri yeşil (artan), f′ < 0 iken kırmızı (azalan); teğet yataylaştığında kritik nokta vardır.', 'Where f′ > 0 the curve is green (increasing), where f′ < 0 red (decreasing); a horizontal tangent marks a critical point.'),
    draw(ctx, W, H, t, C, K) {
      const f = (x) => x * x * x / 3 - x, fp = (x) => x * x - 1, ax = K.axes(ctx, W, H, -3, 3, -2, 2, C);
      for (let i = 0; i < 300; i++) { const x = -3 + 6 * i / 300, x2 = x + 0.02; ctx.strokeStyle = fp(x) >= 0 ? C.good : C.bad; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(ax.X(x), ax.Y(f(x))); ctx.lineTo(ax.X(x2), ax.Y(f(x2))); ctx.stroke(); }
      const x0 = 2.6 * Math.sin(t * 0.6), m = fp(x0);
      K.plot(ctx, ax, (x) => f(x0) + m * (x - x0), C.orange, 2.4, x0 - 1, x0 + 1); K.dot(ctx, ax, x0, f(x0), C.orange, 6);
      K.dot(ctx, ax, -1, f(-1), C.fg, 5, true); K.dot(ctx, ax, 1, f(1), C.fg, 5, true);
      K.text(ctx, 'f′(x) = ' + f2(m) + (Math.abs(m) < 0.15 ? '  ← kritik / critical' : ''), 14, 24, C.fg, 15);
    },
  };
  const newton = {
    kind: '2d', title: T('Newton yöntemi: teğetlerle kök bulma', 'Newton\'s method: finding a root with tangents'),
    caption: T('f(x) = x² − 2; her adımda teğet x-eksenini kestiği yere iner: xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ). Kök √2 ≈ 1,4142.', 'f(x) = x² − 2; at each step the tangent drops to where it meets the x-axis: xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ). The root is √2 ≈ 1.4142.'),
    draw(ctx, W, H, t, C, K) {
      const f = (x) => x * x - 2, fp = (x) => 2 * x, ax = K.axes(ctx, W, H, -0.6, 3.6, -3, 7.5, C);
      K.plot(ctx, ax, f, C.accent, 3);
      const stage = Math.floor(t / 1.6) % 7; let x = 3.2;
      for (let n = 0; n < stage; n++) { const nx = x - f(x) / fp(x); K.seg(ctx, ax, x, 0, x, f(x), C.sub, 1.2, [4, 4]); K.plot(ctx, ax, (u) => f(x) + fp(x) * (u - x), n === stage - 1 ? C.orange : C.sub, n === stage - 1 ? 2.6 : 1.2, nx - 0.4, x + 0.4); K.dot(ctx, ax, nx, 0, C.good, 5); x = nx; }
      K.dot(ctx, ax, x, 0, C.good, 7);
      K.text(ctx, 'n = ' + stage + '     xₙ = ' + x.toFixed(6), 14, 24, C.fg, 15);
    },
  };
  const optimize = {
    kind: '2d', title: T('Optimizasyon: açık kutunun en büyük hacmi', 'Optimization: the largest open box'),
    caption: T('12×12 cm\'lik kartonun köşelerinden x kenarlı kareler kesilip kutu katlanıyor; hacim V(x) = x(12 − 2x)². Sağdaki grafikte V′(x) = 0 olan x = 2 noktası en büyük hacmi (128 cm³) verir.', 'Squares of side x are cut from the corners of a 12×12 cm sheet and the box is folded; the volume is V(x) = x(12 − 2x)². On the right, the point where V′(x) = 0, x = 2, gives the largest volume (128 cm³).'),
    draw(ctx, W, H, t, C, K) {
      const x = 3 + 2.9 * Math.sin(t * 0.6), V = (u) => u * (12 - 2 * u) * (12 - 2 * u);
      const px = Math.min(W * 0.4, H * 0.72) / 12, ox = W * 0.04, oy = H * 0.16;
      ctx.fillStyle = C.accent + '44'; ctx.fillRect(ox, oy, 12 * px, 12 * px);
      ctx.fillStyle = C.bad + '66';
      [[0, 0], [12 - x, 0], [0, 12 - x], [12 - x, 12 - x]].forEach(([a, b]) => ctx.fillRect(ox + a * px, oy + b * px, x * px, x * px));
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.strokeRect(ox, oy, 12 * px, 12 * px);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = C.sub; ctx.beginPath();
      ctx.moveTo(ox + x * px, oy); ctx.lineTo(ox + x * px, oy + 12 * px); ctx.moveTo(ox + (12 - x) * px, oy); ctx.lineTo(ox + (12 - x) * px, oy + 12 * px);
      ctx.moveTo(ox, oy + x * px); ctx.lineTo(ox + 12 * px, oy + x * px); ctx.moveTo(ox, oy + (12 - x) * px); ctx.lineTo(ox + 12 * px, oy + (12 - x) * px); ctx.stroke(); ctx.setLineDash([]);
      K.text(ctx, 'x = ' + f2(x), ox, oy - 10, C.bad, 14);
      ctx.save(); ctx.translate(W * 0.5, 0);
      const ax = K.axes(ctx, W * 0.48, H, -0.3, 6.3, -12, 150, C);
      K.plot(ctx, ax, V, C.accent, 3, 0, 6); K.dot(ctx, ax, 2, 128, C.good, 7); K.text(ctx, 'max: x = 2, V = 128', ax.X(2) + 10, ax.Y(128) - 8, C.good, 13);
      K.seg(ctx, ax, x, 0, x, V(x), C.orange, 1.6, [4, 4]); K.dot(ctx, ax, x, V(x), C.orange, 6);
      K.text(ctx, 'V(x) = ' + f2(V(x)) + ' cm³', 10, 22, C.fg, 14); ctx.restore();
    },
  };
  const riemann = {
    kind: '2d', title: T('Riemann toplamı: dikdörtgen sayısı artınca alan', 'Riemann sum: area as the rectangles multiply'),
    caption: T('n arttıkça dikdörtgenlerin toplam alanı, eğrinin altındaki gerçek alana (belirli integrale) yaklaşır.', 'As n grows the total area of the rectangles approaches the true area under the curve (the definite integral).'),
    draw(ctx, W, H, t, C, K) {
      const f = (x) => 0.25 * x * x + 0.5, ax = K.axes(ctx, W, H, -0.5, 4.6, -0.5, 5.2, C), exact = 64 / 12 + 2, n = Math.max(2, Math.floor(2 + ((t * 2.2) % 38)));
      const dx = 4 / n; let s = 0;
      for (let i = 0; i < n; i++) { const x = i * dx, y = f(x + dx / 2); s += y * dx; ctx.fillStyle = C.accent + '55'; ctx.strokeStyle = C.accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.rect(ax.X(x), ax.Y(y), ax.X(x + dx) - ax.X(x), ax.Y(0) - ax.Y(y)); ctx.fill(); ctx.stroke(); }
      K.plot(ctx, ax, f, C.orange, 3, 0, 4);
      K.text(ctx, 'n = ' + n + '     Σ ≈ ' + s.toFixed(4) + '     ∫ = ' + exact.toFixed(4), 14, 24, C.fg, 15);
    },
  };
  const springMass = {
    kind: '2d', title: T('Yay–kütle sistemi: konum x(t)', 'Spring–mass system: position x(t)'),
    caption: T('Sönümlü salınımda hız v = x′ ve ivme a = x″ türevlerle bulunur; mühendislikte titreşim analizinin temelidir.', 'In a damped oscillation the velocity v = x′ and acceleration a = x″ come from derivatives; this is the basis of vibration analysis.'),
    draw(ctx, W, H, t, C, K) {
      const tt = t % 12, z = 0.12, w = 3, x = (u) => Math.exp(-z * u) * Math.cos(w * u), top = H * 0.4, wallX = 24, base = H * 0.22, sc = Math.min(W * 0.2, 90);
      const bx = W * 0.4 + sc * x(tt);
      ctx.fillStyle = C.sub; ctx.fillRect(wallX - 8, base - 28, 8, 56);
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(wallX, base);
      const n = 12, x1 = bx - 30; for (let i = 1; i <= n; i++) ctx.lineTo(wallX + (x1 - wallX) * i / n, base + (i % 2 ? -12 : 12)); ctx.lineTo(bx - 30, base); ctx.lineTo(bx, base); ctx.stroke();
      ctx.fillStyle = C.orange; ctx.fillRect(bx, base - 22, 44, 44);
      const gy = H * 0.72, gh = H * 0.22; ctx.strokeStyle = C.sub; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(30, gy); ctx.lineTo(W - 10, gy); ctx.stroke();
      ctx.strokeStyle = C.good; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let u = 0; u <= tt; u += 0.03) { const px = 30 + (u / 12) * (W - 50), py = gy - gh * x(u); if (u === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke();
      K.text(ctx, 'x(t) = e^(−ζt)·cos(ωt)', 14, 22, C.fg, 14); K.text(ctx, 't = ' + tt.toFixed(1) + ' s', W - 12, 22, C.fg, 14, 'right');
    },
  };
  const slopeField = {
    kind: '2d', title: T('Eğim alanı ve Euler yöntemi: y′ = x − y', 'Slope field and Euler\'s method: y′ = x − y'),
    caption: T('Her noktadaki küçük çizgi çözümün eğimini gösterir; Euler yöntemi bu eğimleri adım adım izler (turuncu), kesikli çizgi tam çözümdür.', 'Each little segment shows the slope of the solution there; Euler\'s method follows those slopes step by step (orange), the dashed line is the exact solution.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.eq(ctx, W, H, 4, C, { grid: false });
      for (let x = Math.ceil(ax.x0); x <= ax.x1; x += 0.5) for (let y = -4; y <= 4; y += 0.5) { const m = x - y, L = 0.18 / Math.sqrt(1 + m * m); K.seg(ctx, ax, x - L, y - m * L, x + L, y + m * L, C.sub, 1.2); }
      const x0 = -4.5, y0 = 2, Cc = (y0 - (x0 - 1)) * Math.exp(x0);
      ctx.setLineDash([7, 5]); K.plot(ctx, ax, (x) => x - 1 + Cc * Math.exp(-x), C.accent, 2.2, x0, ax.x1); ctx.setLineDash([]);
      const h = 0.35, steps = Math.min(Math.floor(((t * 3) % 40)), Math.floor((ax.x1 - x0) / h)); let x = x0, y = y0;
      ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax.X(x), ax.Y(y));
      for (let i = 0; i < steps; i++) { y += h * (x - y); x += h; ctx.lineTo(ax.X(x), ax.Y(y)); } ctx.stroke(); K.dot(ctx, ax, x, y, C.orange, 6);
      K.text(ctx, 'h = ' + h + '    n = ' + steps, 14, 24, C.fg, 15);
    },
  };
  const intervalLine = {
    kind: '2d', title: T('Aralık gösterimi ve eşitsizlik', 'Interval notation and inequalities'),
    caption: T('Mavi bölge a ile b arasındaki sayılardır; uçlar dolu nokta ise aralığa dahildir, boş nokta ise dahil değildir.', 'The blue band holds the numbers between a and b; a filled end belongs to the interval, a hollow end does not.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.axes(ctx, W, H, -6.5, 6.5, -1.4, 1.4, C, { grid: false });
      const a = -3 + 1.8 * Math.sin(t * 0.5), b = 2.2 + 1.6 * Math.cos(t * 0.4), cl = Math.sin(t * 0.35) > 0, cr = Math.cos(t * 0.3) > 0;
      ctx.fillStyle = C.accent + '33'; ctx.fillRect(ax.X(a), ax.Y(0.45), ax.X(b) - ax.X(a), ax.Y(-0.45) - ax.Y(0.45));
      for (let k = -6; k <= 6; k++) { K.seg(ctx, ax, k, -0.07, k, 0.07, C.sub, 1.5); K.text(ctx, String(k).replace('-', '−'), ax.X(k), ax.Y(-0.3), C.sub, 12, 'center'); }
      K.seg(ctx, ax, a, 0, b, 0, C.accent, 4); K.dot(ctx, ax, a, 0, C.accent, 8, !cl); K.dot(ctx, ax, b, 0, C.accent, 8, !cr);
      K.text(ctx, (cl ? '[' : '(') + f2(a) + ', ' + f2(b) + (cr ? ']' : ')') + '     ' + f2(a) + (cl ? ' ≤ ' : ' < ') + 'x' + (cr ? ' ≤ ' : ' < ') + f2(b), W / 2, 26, C.fg, 16, 'center');
    },
  };
  const lineSlope = {
    kind: '2d', title: T('Doğru denklemi ve eğim: y = mx + b', 'Equation of a line and its slope: y = mx + b'),
    caption: T('m eğimdir (1 birim sağa gidince yükselme), b y-eksenini kestiği yerdir; kesikli doğru ona dik olandır (eğimi −1/m).', 'm is the slope (the rise per unit run), b is where the line meets the y-axis; the dashed line is the perpendicular one (slope −1/m).'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.eq(ctx, W, H, 4.6, C), m = 1.8 * Math.sin(t * 0.5), b = 1.4 * Math.cos(t * 0.33);
      K.plot(ctx, ax, (x) => m * x + b, C.accent, 3.2);
      if (Math.abs(m) > 0.25) { ctx.setLineDash([6, 5]); K.plot(ctx, ax, (x) => -x / m + b, C.sub, 2); ctx.setLineDash([]); }
      K.seg(ctx, ax, 0, b, 1, b, C.good, 2.5); K.seg(ctx, ax, 1, b, 1, b + m, C.orange, 2.5); K.dot(ctx, ax, 0, b, C.fg, 6);
      K.text(ctx, 'y = ' + f2(m) + 'x ' + (b < 0 ? '− ' : '+ ') + f2(Math.abs(b)) + '     m = ' + f2(m) + '   b = ' + f2(b), 14, 24, C.fg, 15);
    },
  };
  const composite = {
    kind: '2d', title: T('Bileşke fonksiyon: f(g(x))', 'Composite function: f(g(x))'),
    caption: T('Soldaki grafik x\'i u = g(x)\'e çevirir, sağdaki grafik u\'yu f(u)\'ya çevirir; ikisi arka arkaya uygulanınca f(g(x)) elde edilir.', 'The left graph turns x into u = g(x), the right graph turns u into f(u); applying them one after the other gives f(g(x)).'),
    draw(ctx, W, H, t, C, K) {
      const g = (x) => 0.5 * x + 1, f = (u) => 0.4 * u * u - 1, x = 3 * Math.sin(t * 0.6), u = g(x), y = f(u), w = W / 2;
      ctx.save(); let ax = K.axes(ctx, w, H, -4, 4, -3, 5, C); K.plot(ctx, ax, g, C.good, 3); K.seg(ctx, ax, x, 0, x, u, C.orange, 1.6, [4, 4]); K.dot(ctx, ax, x, u, C.good, 6); K.text(ctx, 'u = g(x)', 10, 20, C.good, 14); ctx.restore();
      ctx.save(); ctx.translate(w, 0); ax = K.axes(ctx, w, H, -4, 4, -3, 5, C); K.plot(ctx, ax, f, C.accent, 3); K.seg(ctx, ax, u, 0, u, y, C.orange, 1.6, [4, 4]); K.dot(ctx, ax, u, y, C.accent, 6); K.text(ctx, 'y = f(u)', 10, 20, C.accent, 14); ctx.restore();
      K.text(ctx, 'x = ' + f2(x) + '  →  u = ' + f2(u) + '  →  y = ' + f2(y), W / 2, H - 10, C.fg, 15, 'center');
      ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w, H); ctx.stroke();
    },
  };
  const expLog = {
    kind: '2d', title: T('Üstel ve logaritma: y = aˣ ve y = logₐ x', 'Exponential and logarithm: y = aˣ and y = logₐ x'),
    caption: T('Taban a değişirken aˣ ile logₐ x grafikleri hep y = x doğrusuna göre birbirinin yansımasıdır; ikisi de (0, 1) ve (1, 0) noktalarından geçer.', 'As the base a changes, the graphs of aˣ and logₐ x remain mirror images in the line y = x; they pass through (0, 1) and (1, 0).'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.eq(ctx, W, H, 4.4, C), a = 2.4 + 1.2 * Math.sin(t * 0.5);
      K.seg(ctx, ax, -9, -9, 9, 9, C.sub, 1.4, [6, 5]);
      K.plot(ctx, ax, (x) => Math.pow(a, x), C.accent, 3); K.plot(ctx, ax, (x) => (x > 0 ? Math.log(x) / Math.log(a) : NaN), C.good, 3);
      K.dot(ctx, ax, 0, 1, C.orange, 6); K.dot(ctx, ax, 1, 0, C.orange, 6);
      K.text(ctx, 'a = ' + f2(a), 14, 24, C.fg, 15); K.text(ctx, 'aˣ', ax.X(2.2), ax.Y(Math.pow(a, 2.2)) + 14, C.accent, 15); K.text(ctx, 'logₐ x', ax.X(3.2) + 4, ax.Y(Math.log(3.2) / Math.log(a)) + 18, C.good, 14);
    },
  };
  const sineParams = {
    kind: '2d', title: T('Sinüs grafiği: y = A·sin(B(x − C)) + D', 'The sine graph: y = A·sin(B(x − C)) + D'),
    caption: T('A genliği, B sıklığı (periyot 2π/B), C yatay kaymayı, D orta çizgiyi değiştirir; kesikli eğri y = sin x\'tir.', 'A changes the amplitude, B the frequency (period 2π/B), C the horizontal shift and D the midline; the dashed curve is y = sin x.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.axes(ctx, W, H, -2 * PI, 2 * PI, -3.4, 3.4, C), A = 1.6 + 0.8 * Math.sin(t * 0.5), B = 1.3 + 0.7 * Math.sin(t * 0.37), Cc = 1.2 * Math.sin(t * 0.3), D = 0.8 * Math.cos(t * 0.45);
      ctx.setLineDash([6, 5]); K.plot(ctx, ax, Math.sin, C.sub, 2); ctx.setLineDash([]);
      K.plot(ctx, ax, (x) => A * Math.sin(B * (x - Cc)) + D, C.accent, 3.2); K.seg(ctx, ax, -9, D, 9, D, C.orange, 1.4, [4, 4]);
      K.text(ctx, 'A = ' + f2(A) + '  B = ' + f2(B) + '  C = ' + f2(Cc) + '  D = ' + f2(D), 14, 24, C.fg, 14);
    },
  };
  const tanAsym = {
    kind: '2d', title: T('Tanjant: dikey asimptota yakınlaşması', 'Tangent: approaching a vertical asymptote'),
    caption: T('x, π/2\'ye soldan yaklaşırken tan x sınırsızca büyür; x = π/2 + kπ doğruları dikey asimptotlardır.', 'As x approaches π/2 from the left, tan x grows without bound; the lines x = π/2 + kπ are vertical asymptotes.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.axes(ctx, W, H, -4.8, 4.8, -6, 6, C);
      [-3 * PI / 2, -PI / 2, PI / 2, 3 * PI / 2].forEach((x) => K.seg(ctx, ax, x, -9, x, 9, C.bad, 1.4, [5, 5]));
      K.plot(ctx, ax, Math.tan, C.accent, 3);
      const d = 0.9 * Math.exp(-((t * 0.8) % 7) * 0.7) + 0.003, x = PI / 2 - d, y = Math.tan(x);
      K.seg(ctx, ax, x, 0, x, Math.max(-6, Math.min(6, y)), C.orange, 1.6, [4, 4]); K.dot(ctx, ax, x, Math.max(-6, Math.min(6, y)), C.orange, 6);
      K.text(ctx, 'x = π/2 − ' + d.toFixed(3) + '     tan x = ' + y.toFixed(2), 14, 24, C.fg, 14);
    },
  };
  const jump = {
    kind: '2d', title: T('Tek taraflı limitler: sıçrama', 'One-sided limits: a jump'),
    caption: T('Soldan yaklaşınca f(x) 2\'ye, sağdan yaklaşınca 0\'a gider; iki taraf farklı olduğu için x = 1\'de limit yoktur.', 'From the left f(x) goes to 2, from the right to 0; because the two sides differ, the limit at x = 1 does not exist.'),
    draw(ctx, W, H, t, C, K) {
      const f = (x) => (x < 1 ? x + 1 : x - 1), ax = K.axes(ctx, W, H, -1, 3.4, -1, 3.2, C);
      K.plot(ctx, ax, f, C.accent, 3, -1, 1 - 1e-6); K.plot(ctx, ax, f, C.accent, 3, 1, 3.4); K.dot(ctx, ax, 1, 2, C.accent, 7, true); K.dot(ctx, ax, 1, 0, C.accent, 7);
      const d = 1.3 * Math.pow(0.5, (t * 0.9) % 7), xl = 1 - d, xr = 1 + d;
      K.seg(ctx, ax, xl, 0, xl, f(xl), C.good, 1.5, [4, 4]); K.dot(ctx, ax, xl, f(xl), C.good, 6); K.seg(ctx, ax, xr, 0, xr, f(xr), C.orange, 1.5, [4, 4]); K.dot(ctx, ax, xr, f(xr), C.orange, 6);
      K.text(ctx, 'lim x→1⁻ = ' + f2(f(xl)) + '        lim x→1⁺ = ' + f2(f(xr)), 14, 24, C.fg, 14);
    },
  };
  const atInf = {
    kind: '2d', title: T('Sonsuzda limit ve yatay asimptot', 'Limit at infinity and a horizontal asymptote'),
    caption: T('f(x) = (2x + 1)/(x − 1) ifadesinde x büyüdükçe değer 2\'ye yaklaşır; y = 2 yatay asimptottur.', 'For f(x) = (2x + 1)/(x − 1) the value approaches 2 as x grows; y = 2 is a horizontal asymptote.'),
    draw(ctx, W, H, t, C, K) {
      const f = (x) => (2 * x + 1) / (x - 1), ax = K.axes(ctx, W, H, -2, 24, -3, 9, C);
      K.seg(ctx, ax, -2, 2, 24, 2, C.bad, 1.5, [6, 5]); K.seg(ctx, ax, 1, -3, 1, 9, C.sub, 1.2, [4, 4]);
      K.plot(ctx, ax, f, C.accent, 3, 1.2, 24); K.plot(ctx, ax, f, C.accent, 3, -2, 0.85);
      const x = 3 + 20 * (1 - Math.exp(-((t * 0.6) % 8) * 0.6));
      K.dot(ctx, ax, x, f(x), C.orange, 6); K.seg(ctx, ax, x, 2, x, f(x), C.orange, 1.5, [4, 4]);
      K.text(ctx, 'x = ' + x.toFixed(1) + '     f(x) = ' + f(x).toFixed(3) + '     → 2', 14, 24, C.fg, 14);
    },
  };
  const productRule = {
    kind: '2d', title: T('Çarpım kuralı: (u·v)′ = u′v + uv′', 'Product rule: (u·v)′ = u′v + uv′'),
    caption: T('Dikdörtgenin alanı u·v\'dir; x biraz artınca alan, turuncu şerit (u′v·dx) ve yeşil şerit (uv′·dx) kadar artar, köşedeki küçük kare ihmal edilir.', 'The rectangle has area u·v; when x grows a little the area gains the orange strip (u′v·dx) and the green strip (uv′·dx); the tiny corner square is negligible.'),
    draw(ctx, W, H, t, C, K) {
      const x = (t * 0.6) % 6, u = 2 + Math.sin(x), v = 1 + 0.45 * x, du = Math.cos(x) * 0.6, dv = 0.45 * 0.6, k = Math.min(W * 0.14, H * 0.2), ox = W * 0.18, oy = H - 40;
      ctx.fillStyle = C.accent + '55'; ctx.fillRect(ox, oy - v * k, u * k, v * k); ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.strokeRect(ox, oy - v * k, u * k, v * k);
      ctx.fillStyle = C.orange + 'aa'; ctx.fillRect(ox + u * k, oy - v * k, du * k, v * k);
      ctx.fillStyle = C.good + 'aa'; ctx.fillRect(ox, oy - (v + dv) * k, u * k, dv * k);
      ctx.fillStyle = C.sub + 'aa'; ctx.fillRect(ox + u * k, oy - (v + dv) * k, du * k, dv * k);
      K.text(ctx, 'u = ' + f2(u), ox + u * k / 2, oy + 18, C.accent, 14, 'center'); K.text(ctx, 'v = ' + f2(v), ox - 8, oy - v * k / 2, C.accent, 14, 'right');
      K.text(ctx, 'ΔA ≈ u′v·dx + uv′·dx = ' + f2(du * v + u * dv), 14, 24, C.fg, 14);
    },
  };
  const chainDemo = {
    kind: '2d', title: T('Zincir kuralı: eğimler çarpılır', 'The chain rule: slopes multiply'),
    caption: T('y = sin(x²/2) iç içe iki fonksiyondur: u = x²/2 ve y = sin u. Teğetin eğimi, dış türev cos u ile iç türev x\'in çarpımıdır.', 'y = sin(x²/2) is two functions nested: u = x²/2 and y = sin u. The tangent slope is the outer derivative cos u times the inner derivative x.'),
    draw(ctx, W, H, t, C, K) {
      const f = (x) => Math.sin(x * x / 2), ax = K.axes(ctx, W, H, -3.4, 3.4, -2, 2, C), x0 = 2.6 * Math.sin(t * 0.5), u = x0 * x0 / 2, m = Math.cos(u) * x0;
      K.plot(ctx, ax, f, C.accent, 3); K.plot(ctx, ax, (x) => f(x0) + m * (x - x0), C.orange, 2.4, x0 - 0.8, x0 + 0.8); K.dot(ctx, ax, x0, f(x0), C.orange, 6);
      K.text(ctx, 'u = ' + f2(u) + '   cos u = ' + f2(Math.cos(u)) + '   u′ = x = ' + f2(x0), 14, 24, C.fg, 14);
      K.text(ctx, 'dy/dx = cos u · x = ' + f2(m), 14, 44, C.orange, 14);
    },
  };
  const concavity = {
    kind: '2d', title: T('Konkavlık ve büküm noktası', 'Concavity and the inflection point'),
    caption: T('f″ > 0 olan yerde eğri yukarı bükey (mavi), f″ < 0 olan yerde aşağı bükey (turuncu); renk değiştiği x = 0 büküm noktasıdır.', 'Where f″ > 0 the curve is concave up (blue), where f″ < 0 concave down (orange); the colour change at x = 0 is the inflection point.'),
    draw(ctx, W, H, t, C, K) {
      const f = (x) => x * x * x / 3 - 2 * x, ax = K.axes(ctx, W, H, -3, 3, -4, 4, C);
      for (let i = 0; i < 300; i++) { const x = -3 + 6 * i / 300, x2 = x + 0.02; ctx.strokeStyle = x >= 0 ? C.accent : C.orange; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(ax.X(x), ax.Y(f(x))); ctx.lineTo(ax.X(x2), ax.Y(f(x2))); ctx.stroke(); }
      const x0 = 2.7 * Math.sin(t * 0.5), m = x0 * x0 - 2;
      K.plot(ctx, ax, (x) => f(x0) + m * (x - x0), C.sub, 2, x0 - 1.1, x0 + 1.1); K.dot(ctx, ax, x0, f(x0), C.fg, 6); K.dot(ctx, ax, 0, 0, C.good, 6, true);
      K.text(ctx, 'f″(x) = 2x = ' + f2(2 * x0) + (x0 >= 0 ? '  → ∪' : '  → ∩'), 14, 24, C.fg, 15);
    },
  };
  const ladder = {
    kind: '2d', title: T('Bağıntılı hızlar: kayan merdiven', 'Related rates: the sliding ladder'),
    caption: T('5 m\'lik merdivenin ayağı kayarken x² + y² = 25 ifadesinin zamana göre türevi, x·x′ + y·y′ = 0 verir; ayak hızı ile üst uç hızı birbirine bağlıdır.', 'As the foot of a 5 m ladder slides, differentiating x² + y² = 25 in time gives x·x′ + y·y′ = 0; the speeds of the foot and the top are linked.'),
    draw(ctx, W, H, t, C, K) {
      const ax = K.axes(ctx, W, H, -1, 7, -1, 6, C, { grid: false });
      const x = 3 + 1.6 * Math.sin(t * 0.5), xd = 0.8 * Math.cos(t * 0.5), y = Math.sqrt(25 - x * x), yd = -x * xd / y;
      ctx.fillStyle = C.sub + '55'; ctx.fillRect(ax.X(-0.2), ax.Y(6), ax.X(0) - ax.X(-0.2), ax.Y(0) - ax.Y(6));
      K.seg(ctx, ax, 0, 0, 7, 0, C.sub, 2); K.seg(ctx, ax, 0, y, x, 0, C.orange, 5); K.dot(ctx, ax, x, 0, C.accent, 7); K.dot(ctx, ax, 0, y, C.good, 7);
      K.seg(ctx, ax, x, 0.35, x + xd * 0.9, 0.35, C.accent, 3); K.seg(ctx, ax, 0.35, y, 0.35, y + yd * 0.9, C.good, 3);
      K.text(ctx, 'x = ' + f2(x) + '  x′ = ' + f2(xd) + '  m/s     y = ' + f2(y) + '  y′ = ' + f2(yd) + '  m/s', 14, 24, C.fg, 14);
    },
  };
  const cooling = {
    kind: '2d', title: T('Newton soğuma yasası: T(t)', 'Newton\'s law of cooling: T(t)'),
    caption: T('Sıcak parça ortama soğur: T(t) = Tₐ + (T₀ − Tₐ)e^(−kt). Teğetin eğimi soğuma hızı dT/dt = −k(T − Tₐ)\'dır ve fark azaldıkça küçülür.', 'A hot part cools towards its surroundings: T(t) = Tₐ + (T₀ − Tₐ)e^(−kt). The tangent slope is the cooling rate dT/dt = −k(T − Tₐ), shrinking as the difference falls.'),
    draw(ctx, W, H, t, C, K) {
      const Ta = 25, T0 = 95, k = 0.35, f = (x) => Ta + (T0 - Ta) * Math.exp(-k * x), ax = K.axes(ctx, W, H, 0, 10, 0, 100, C);
      K.seg(ctx, ax, 0, Ta, 10, Ta, C.sub, 1.4, [5, 5]); K.plot(ctx, ax, f, C.accent, 3, 0, 10);
      const x0 = (t * 0.7) % 9, m = -k * (f(x0) - Ta);
      K.plot(ctx, ax, (x) => f(x0) + m * (x - x0), C.orange, 2.4, Math.max(0, x0 - 1.6), Math.min(10, x0 + 1.6)); K.dot(ctx, ax, x0, f(x0), C.orange, 6);
      K.text(ctx, 't = ' + f2(x0) + ' s    T = ' + f2(f(x0)) + ' °C    dT/dt = ' + f2(m) + ' °C/s', 14, 24, C.fg, 14);
    },
  };
  return { intervalLine, lineSlope, composite, expLog, sineParams, tanAsym, jump, atInf, productRule, chainDemo, concavity, ladder, cooling, optimize, numberLine, cartesian, transform, inverse, unitCircle, radian, approach, epsDelta, secant, fprime, sign, newton, riemann, springMass, slopeField };
})();
if (typeof module !== 'undefined') module.exports = IntroAnims2D;
