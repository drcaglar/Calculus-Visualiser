// App shell: chapter sidebar, topic tab strip, top strip (language/theme), and mounting.
const CHAPTERS = [
  { id: 'numbers', icon: '🔢', c1: '#2563eb', c2: '#0ea5e9', title: () => I18N.tx('Sayılar ve Kartezyen', 'Numbers & Cartesian') },
  { id: 'functions', icon: '📈', c1: '#ea580c', c2: '#f59e0b', title: () => I18N.tx('Fonksiyonlar', 'Functions') },
  { id: 'trig', icon: '🌀', c1: '#7c3aed', c2: '#d946ef', title: () => I18N.tx('Trigonometri', 'Trigonometry') },
  { id: 'limits', icon: '🎯', c1: '#e11d48', c2: '#fb7185', title: () => I18N.tx('Limitler ve Süreklilik', 'Limits & Continuity') },
  { id: 'derivatives', icon: '📐', c1: '#4f46e5', c2: '#818cf8', title: () => I18N.tx('Türev', 'Derivatives') },
  { id: 'applications', icon: '🧭', c1: '#0891b2', c2: '#22d3ee', title: () => I18N.tx('Türevin Uygulamaları', 'Applications of Derivatives') },
  { id: 'integrals', icon: '∫', c1: '#059669', c2: '#34d399', title: () => I18N.tx('İntegraller', 'Integrals') },
  { id: 'calc2', icon: '∬', c1: '#b45309', c2: '#f59e0b', title: () => I18N.tx('İntegral Uygulamaları ve Diferansiyel Denklemler', 'Integral Applications and Differential Equations') },
  { id: 'series', icon: '∑', c1: '#be185d', c2: '#f472b6', title: () => I18N.tx('Diziler, Seriler, Parametrik ve Kutupsal', 'Sequences, Series, Parametric and Polar') },
  { id: 'calc3', icon: '∇', c1: '#0e7490', c2: '#22d3ee', title: () => I18N.tx('Çok Değişkenli Kalkülüs', 'Multivariable Calculus') },
  { id: 'engineering', icon: '⚙️', c1: '#475569', c2: '#94a3b8', title: () => I18N.tx('Mühendislik Uygulamaları', 'Engineering Applications') },
  { id: 'examall', icon: '📝', c1: '#a16207', c2: '#eab308', title: () => I18N.tx('Sınav Oluşturucu', 'Exam Creator') },
  { id: 'about', icon: '©', c1: '#0f766e', c2: '#14b8a6', title: () => I18N.tx('Program Hakkında', 'About') },
];

let selectedChapter = 0;
let selectedTab = 0;
let mounted = null; // { destroy() } of whatever is currently in #topicHost

function mountTopic(def, chapterTitleFn) {
  const host = document.getElementById('topicHost');
  if (mounted) { mounted.destroy(); mounted = null; }
  host.innerHTML = '';
  if (def.type === 'quiz') {
    mounted = mountQuiz(host, chapterTitleFn, def.generators, CHAPTERS[selectedChapter].id);
  } else if (def.type === 'examset') {
    mounted = mountExamSet(host, chapterTitleFn, def.chapterId);
  } else if (def.type === 'soon') {
    mounted = Soon.mount(host, def);
  } else if (def.type === 'intro') {
    mounted = Intro.mount(host, def);
  } else if (def.type === 'about') {
    mounted = mountAbout(host);
  } else {
    mounted = mountWorkedExample(host, def);
  }
}

function enterApp(ch, tab) {
  selectedChapter = ch;
  selectedTab = tab || 0;
  renderNav();
  renderTabs();
}

function goHome() {
  if (mounted) { mounted.destroy(); mounted = null; }
  document.getElementById('topicHost').innerHTML = '';
  Home.show();
}

function renderNav() {
  const navEl = document.getElementById('chapterNav');
  navEl.innerHTML = '';
  const homeBtn = document.createElement('div');
  homeBtn.className = 'nav-item';
  homeBtn.style.setProperty('--ch', '#64748b');
  homeBtn.innerHTML = '<span class="ni">🏠</span><span></span>';
  homeBtn.lastChild.textContent = I18N.tx('Ana Sayfa', 'Home');
  homeBtn.addEventListener('click', goHome);
  navEl.appendChild(homeBtn);
  CHAPTERS.forEach((ch, i) => {
    const item = document.createElement('div');
    item.className = 'nav-item' + (i === selectedChapter ? ' selected' : '');
    item.style.setProperty('--ch', ch.c1);
    item.style.setProperty('--ch2', ch.c2);
    item.innerHTML = '<span class="ni"></span><span></span>';
    item.firstChild.textContent = ch.icon;
    item.lastChild.textContent = ch.title();
    item.addEventListener('click', () => {
      if (selectedChapter === i) return;
      selectedChapter = i;
      selectedTab = 0;
      renderNav();
      renderTabs();
    });
    navEl.appendChild(item);
  });
}

function renderTabs() {
  const tabStrip = document.getElementById('tabStrip');
  tabStrip.innerHTML = '';
  tabStrip.setAttribute('role', 'tablist');
  const chapter = CHAPTERS[selectedChapter];
  const topics = Topics.get(chapter.id);
  if (topics.length === 0) {
    document.getElementById('topicHost').innerHTML =
      `<div style="padding:24px;color:var(--subtle-fg);">${I18N.tx('Bu bölüm henüz eklenmedi.', 'This chapter has not been added yet.')}</div>`;
    return;
  }
  if (selectedTab >= topics.length) selectedTab = 0;
  topics.forEach((def, i) => {
    const item = document.createElement('div');
    item.className = 'tab-item' + (i === selectedTab ? ' selected' : '');
    item.textContent = def.tabTitle();
    item.setAttribute('role', 'tab');
    item.setAttribute('aria-selected', i === selectedTab ? 'true' : 'false');
    item.tabIndex = i === selectedTab ? 0 : -1;
    const pick = () => {
      if (selectedTab === i) return;
      selectedTab = i;
      renderTabs();
      const sel = tabStrip.querySelector('.tab-item.selected'); if (sel) sel.focus();
    };
    item.addEventListener('click', pick);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const j = Math.max(0, Math.min(topics.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
        if (j !== i) { selectedTab = j; renderTabs(); const sel = tabStrip.querySelector('.tab-item.selected'); if (sel) sel.focus(); }
      }
    });
    tabStrip.appendChild(item);
  });
  mountTopic(topics[selectedTab], chapter.title);
}

// ---- collapsible menus + fullscreen ----
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
function applyCollapse() {
  const navC = lsGet('cv.navCollapsed') === '1', tabsC = lsGet('cv.tabsCollapsed') === '1';
  document.getElementById('chapterNav').classList.toggle('collapsed', navC);
  document.getElementById('tabStrip').classList.toggle('collapsed', tabsC);
  document.getElementById('navBtn').classList.toggle('off', navC);
  document.getElementById('tabsBtn').classList.toggle('off', tabsC);
  setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
}
function toggleCollapse(key) { lsSet(key, lsGet(key) === '1' ? '0' : '1'); applyCollapse(); }
function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement; }
function toggleFullscreen() {
  const el = document.documentElement;
  if (fsElement()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
  else { (el.requestFullscreen || el.webkitRequestFullscreen).call(el); }
}

// prev/next topic (used by the slide tools in the right-hand column and the arrow keys)
window.AppNav = {
  step(d) {
    const topics = Topics.get(CHAPTERS[selectedChapter].id);
    const n = selectedTab + d;
    if (n < 0 || n >= topics.length) return;
    selectedTab = n; renderTabs();
  },
  goto(id) { const i = Topics.get(CHAPTERS[selectedChapter].id).findIndex((d) => d.id === id); if (i >= 0) { selectedTab = i; renderTabs(); } },
  next() { this.step(1); },
  prev() { this.step(-1); },
};

function applyTopStripTexts() {
  document.getElementById('navBtn').title = I18N.tx('Sol menüyü aç/kapat', 'Show/hide chapter menu');
  document.getElementById('tabsBtn').title = I18N.tx('Sekmeleri aç/kapat', 'Show/hide tabs');
  document.getElementById('fsBtn').title = I18N.tx('Tam ekran aç/kapat (F11)', 'Toggle fullscreen (F11)');
  document.getElementById('langBtn').textContent = I18N.get() ? 'TR | en' : 'tr | EN';
  document.getElementById('themeBtn').textContent = I18N.tx('Tema Değiştir', 'Toggle Theme');
  const badge = document.getElementById('copyrightBadge');
  if (badge) {
    badge.textContent = I18N.tx(
      '© 2026 Dr. Halil Emre ÇAĞLAR — CC BY-NC-ND 4.0 (bazı hakları saklıdır)',
      '© 2026 Dr. Halil Emre ÇAĞLAR — CC BY-NC-ND 4.0 (some rights reserved)'
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navBtn').addEventListener('click', () => toggleCollapse('cv.navCollapsed'));
  document.getElementById('tabsBtn').addEventListener('click', () => toggleCollapse('cv.tabsCollapsed'));
  const fsBtn = document.getElementById('fsBtn');
  if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) fsBtn.style.display = 'none';
  fsBtn.addEventListener('click', toggleFullscreen);
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, () => {
    fsBtn.classList.toggle('off', !!fsElement()); setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
  }));
  document.addEventListener('keydown', (e) => { if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); } });
  applyCollapse();
  document.getElementById('langBtn').addEventListener('click', () => I18N.toggle());
  document.getElementById('themeBtn').addEventListener('click', () => Theme.toggle());

  document.getElementById('appTitle').addEventListener('click', (e) => { if (e.target.id === 'appTitle' || e.target.closest('#appTitle')) goHome(); });
  I18N.onChange(() => {
    applyTopStripTexts();
    if (Home.active()) { Home.render(); return; }
    renderNav(); renderTabs();
  });
  applyTopStripTexts();
  renderNav();
  Home.show();
});
