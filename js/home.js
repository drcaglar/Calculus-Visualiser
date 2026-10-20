// Welcome page: animated background (floating math symbols + flowing waves), chapter cards, cursor-follow glow.
const Home = (function () {
  const SYMS = ['∫', 'π', '√', 'Σ', 'sin x', 'cos x', 'f(x)', 'dy/dx', 'lim', '∞', 'Δx', 'θ', 'x²', 'e^x', 'ln x', 'tan x', '∂', 'a²+b²', 'f⁻¹', '∮'];
  let raf = 0, mx = 0.5, my = 0.5, built = false, cleanupWaves = null;

  function buildBg() {
    const bg = document.getElementById('homeBg');
    bg.innerHTML = '<canvas></canvas>';
    const n = window.innerWidth < 700 ? 16 : 30;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.textContent = SYMS[i % SYMS.length];
      s.style.left = (Math.random() * 96).toFixed(1) + '%';
      s.style.top = (Math.random() * 94).toFixed(1) + '%';
      s.style.fontSize = (16 + Math.random() * 38).toFixed(0) + 'px';
      s.style.animationDuration = (9 + Math.random() * 14).toFixed(1) + 's';
      s.style.animationDelay = (-Math.random() * 14).toFixed(1) + 's';
      s.dataset.depth = (0.3 + Math.random() * 1.2).toFixed(2);
      bg.appendChild(s);
    }
  }

  function startWaves() {
    const cv = document.querySelector('#homeBg canvas');
    if (!cv) return null;
    const ctx = cv.getContext('2d');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function size() { const r = window.devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; ctx.setTransform(r, 0, 0, r, 0, 0); }
    size();
    window.addEventListener('resize', size);
    const waves = [
      { a: 38, f: 0.006, s: 0.6, y: 0.78, c: '#2563eb' },
      { a: 30, f: 0.009, s: -0.8, y: 0.84, c: '#9333ea' },
      { a: 24, f: 0.013, s: 1.1, y: 0.9, c: '#ea580c' },
      { a: 50, f: 0.004, s: 0.35, y: 0.7, c: '#0d9488' },
    ];
    const start = performance.now();
    function frame(now) {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.lineWidth = 2;
      waves.forEach((w, k) => {
        ctx.beginPath();
        ctx.strokeStyle = w.c;
        ctx.globalAlpha = 0.3;
        const yOff = (my - 0.5) * 15 * (k + 1);
        for (let x = 0; x <= innerWidth; x += 6) {
          const y = innerHeight * w.y + yOff + w.a * Math.sin(x * w.f + t * w.s + (mx - 0.5) * 2 * k);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    if (reduce) frame(start); else raf = requestAnimationFrame(frame);
    return () => window.removeEventListener('resize', size);
  }

  function onMove(e) {
    mx = e.clientX / innerWidth; my = e.clientY / innerHeight;
    document.querySelectorAll('#homeBg span').forEach((s) => {
      const d = parseFloat(s.dataset.depth);
      s.style.transform = 'translate(' + ((mx - 0.5) * 36 * d) + 'px,' + ((my - 0.5) * 36 * d) + 'px)';
    });
  }

  const CARDS = [
    { id: 'numbers', ch: 0, icon: '🔢', g: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)',
      sub: () => I18N.tx('Sayı kümeleri, eşitsizlikler, doğru, çember, parabol', 'Number sets, inequalities, lines, circles, parabolas') },
    { id: 'functions', ch: 1, icon: '📈', g: 'linear-gradient(135deg,#ea580c,#f59e0b)',
      sub: () => I18N.tx('Fonksiyon gezgini, dönüşümler, ters fonksiyon, elips', 'Function explorer, transformations, inverse, ellipse') },
    { id: 'trig', ch: 2, icon: '🌀', g: 'linear-gradient(135deg,#7c3aed,#d946ef)',
      sub: () => I18N.tx('Radyan, birim çember, özdeşlikler, ters trig. fonksiyonlar', 'Radians, unit circle, identities, inverse trig functions') },
    { id: 'limits', ch: 3, icon: '🎯', g: 'linear-gradient(135deg,#e11d48,#fb7185)',
      sub: () => I18N.tx('Değişim hızı, limit kuralları, ε–δ, süreklilik, asimptotlar', 'Rates of change, limit laws, ε–δ, continuity, asymptotes') },
    { id: 'derivatives', ch: 4, icon: '📐', g: 'linear-gradient(135deg,#4f46e5,#818cf8)',
      sub: () => I18N.tx('Teğet, türev kuralları, zincir kuralı, kapalı türev, trig. türevler', 'Tangent, differentiation rules, chain rule, implicit and trig derivatives') },
    { id: 'applications', ch: 5, icon: '🧭', g: 'linear-gradient(135deg,#0891b2,#22d3ee)',
      sub: () => I18N.tx("Ekstremum, optimizasyon, bağıntılı hızlar, Newton, L'Hôpital", "Extrema, optimization, related rates, Newton, L'Hôpital") },
    { id: 'integrals', ch: 6, icon: '∫', g: 'linear-gradient(135deg,#059669,#34d399)',
      sub: () => I18N.tx('Alan, Riemann toplamları, Analizin Temel Teoremi', 'Area, Riemann sums, the Fundamental Theorem of Calculus') },
    { id: 'calc2', ch: 7, icon: '∬', g: 'linear-gradient(135deg,#b45309,#f59e0b)',
      sub: () => I18N.tx('Hacim, yay uzunluğu, iş, ağırlık merkezi, integral teknikleri, diferansiyel denklemler', 'Volumes, arc length, work, centroids, integration techniques, differential equations') },
    { id: 'series', ch: 8, icon: '∑', g: 'linear-gradient(135deg,#be185d,#f472b6)',
      sub: () => I18N.tx('Diziler, seriler, Taylor, parametrik eğriler, kutupsal koordinatlar (hazırlanıyor)', 'Sequences, series, Taylor, parametric curves, polar coordinates (in preparation)') },
    { id: 'calc3', ch: 9, icon: '∇', g: 'linear-gradient(135deg,#0e7490,#22d3ee)',
      sub: () => I18N.tx('Vektörler, yüzeyler, kısmi türev, çoklu integral, vektör analizi: 2B ve 3B (hazırlanıyor)', 'Vectors, surfaces, partial derivatives, multiple integrals, vector calculus: 2D and 3D (in preparation)') },
    { id: 'engineering', ch: 10, icon: '⚙️', g: 'linear-gradient(135deg,#475569,#94a3b8)',
      sub: () => I18N.tx('Statik, dinamik, ısı-akışkan ve malzeme uygulamaları', 'Statics, dynamics, thermo-fluid and materials applications') },
    { id: 'examall', ch: 11, icon: '📝', g: 'linear-gradient(135deg,#a16207,#eab308)',
      sub: () => I18N.tx('Tüm bölümlerden konu seçip yazdırılabilir karma sınav ve cevap anahtarı hazırlayın', 'Pick topics from any chapter and build a printable mixed exam with an answer key') },
  ];

  function render() {
    const root = document.getElementById('homeContent');
    const tx = I18N.tx;
    const cards = CARDS.map((c) => {
      const topics = Topics.get(c.id);
      const shown = topics.slice(0, 6);
      const chips = shown.map((d, i) => '<button class="hchip" data-ch="' + c.ch + '" data-tab="' + i + '"><span class="ic">' + c.icon + '</span> ' + d.tabTitle() + '</button>').join('') +
        (topics.length > shown.length ? '<button class="hchip more" data-ch="' + c.ch + '" data-tab="0">' + tx('Tümü', 'All') + ' (' + topics.length + ') →</button>' : '');
      return '<div class="hcard" data-ch="' + c.ch + '" style="background:' + c.g + '"><h2><span class="ic">' + c.icon + '</span>' + CHAPTERS[c.ch].title() + '</h2><p>' + c.sub() + '</p><div class="hchips">' + chips + '</div></div>';
    }).join('');
    root.innerHTML =
      '<div class="home-top"><button id="hLang">' + (I18N.get() ? 'TR | en' : 'tr | EN') + '</button><button id="hTheme">' + tx('Tema Değiştir', 'Toggle Theme') + '</button><button id="hFs" title="' + tx('Tam ekran aç/kapat (F11)', 'Toggle fullscreen (F11)') + '" aria-label="' + tx('Tam ekran', 'Fullscreen') + '">⛶</button></div>' +
      '<div class="home-hero"><h1>Calculus Visualiser</h1>' +
      '<div class="lead">' + tx('Matematik için etkileşimli görsel öğrenme: grafikler, canlı kaydırıcılar, adım adım çözümler ve sınavlar.', 'Interactive visual learning for Calculus: graphs, live sliders, step-by-step solutions and quizzes.') + '</div>' +
      '<div class="author">' + tx('Hazırlayan: Dr. Halil E. ÇAĞLAR', 'Prepared by: Dr. Halil E. ÇAĞLAR') + '</div>' +
      '<div><a class="li-link" href="https://www.linkedin.com/in/halilemrecaglar" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg> ' + tx('LinkedIn’de bağlantı kurun', 'Connect on LinkedIn') + '</a> ' + '<a class="li-link sc-link" href="https://scholar.google.com/citations?user=eKfCX88AAAAJ&hl=' + (I18N.get() ? 'tr' : 'en') + '" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3zm-6 9.7V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.3l-6 3.3-6-3.3z"/></svg> ' + tx('Google Scholar profili', 'Google Scholar profile') + '</a></div></div>' +
      '<div class="hbig">' + cards + '</div>' +
      '<div class="hsmall"><div class="hcard wide" data-ch="' + (CHAPTERS.length - 1) + '" style="background:linear-gradient(135deg,#0f766e,#14b8a6)"><div><h2><span class="ic">©</span>' + CHAPTERS[CHAPTERS.length - 1].title() +
      '</h2><p>' + tx('Telif hakkı, kullanım koşulları ve yasal bilgiler', 'Copyright, terms of use and legal information') + '</p></div><span class="ic" style="font-size:28px">→</span></div></div>' +
      '<div class="home-foot">© 2026 Dr. Halil Emre ÇAĞLAR — ' + tx('Bazı hakları saklıdır', 'Some rights reserved') + ' · <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noopener license">CC BY-NC-ND 4.0</a></div>';
    root.querySelector('#hLang').addEventListener('click', () => I18N.toggle());
    root.querySelector('#hTheme').addEventListener('click', () => Theme.toggle());
    const hFs = root.querySelector('#hFs');
    if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) hFs.style.display = 'none';
    else hFs.addEventListener('click', () => toggleFullscreen());
    root.querySelectorAll('.hchip').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); go(+b.dataset.ch, +b.dataset.tab); }));
    root.querySelectorAll('.hcard').forEach((c) => {
      c.addEventListener('click', () => go(+c.dataset.ch, 0));
      c.addEventListener('mousemove', (e) => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    });
  }

  function go(ch, tab) { hide(); enterApp(ch, tab); }

  function show() {
    document.body.classList.add('on-home');
    if (!built) { buildBg(); built = true; }
    render();
    if (!cleanupWaves) cleanupWaves = startWaves();
    document.addEventListener('mousemove', onMove);
    document.getElementById('homeView').scrollTop = 0;
  }
  function hide() {
    document.body.classList.remove('on-home');
    cancelAnimationFrame(raf); raf = 0;
    if (cleanupWaves) { cleanupWaves(); cleanupWaves = null; }
    document.removeEventListener('mousemove', onMove);
  }
  function active() { return document.body.classList.contains('on-home'); }
  return { show, hide, render, active };
})();
