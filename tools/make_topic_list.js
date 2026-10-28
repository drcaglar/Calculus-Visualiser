// Writes KONULAR.txt: every chapter, tab and the sub-topics taught in each tab (Turkish with the English title in brackets).
// The list is built from the real tab definitions, so it always matches the program.   node tools/make_topic_list.js [output.txt]
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const out = process.argv[2] || path.join(ROOT, 'KONULAR.txt');
const src = fs.readFileSync(path.join(ROOT, 'tests', 'harness_modes.js'), 'utf8');
const pre = src.slice(src.indexOf('const noop'), src.indexOf("const dir = path.join(ROOT, 'js/topics', chapter);")).replace(/run\(`class SeededRng[\s\S]*?'seeded'\);/, '');
const { run, rd } = new Function('fs', 'path', 'vm', 'ROOT', 'chapter', 'mode', 'arg', pre + '\nreturn { run, rd };')(fs, path, vm, ROOT, 'x', 'x');

// chapters (order and titles) straight from js/main.js
const mainSrc = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');
const CHAPTERS = [...mainSrc.matchAll(/\{ id: '(\w+)', icon: '[^']*', c1: '[^']*', c2: '[^']*', title: \(\) => I18N\.tx\('([^']*)', '([^']*)'\) \}/g)].map((m) => ({ id: m[1], tr: m[2], en: m[3] }));

['js/core/assessment.js', 'js/core/typeset.js', 'js/core/schematic.js'].forEach((f) => { try { run(rd(f), f); } catch (e) { /* optional */ } });
run('document.createTextNode = () => ({}); document.getElementById = () => null;', 'domfix');
const kits = { trig: ['js/topics/trig/trigKit.js'], functions: ['js/topics/functions/fnKit.js'] };
const TOPIC_DIRS = CHAPTERS.map((c) => c.id).filter((id) => fs.existsSync(path.join(ROOT, 'js/topics', id)) && id !== 'intro');
for (const c of TOPIC_DIRS) {
  (kits[c] || []).forEach((f) => run(rd(f), f));
  fs.readdirSync(path.join(ROOT, 'js/topics', c)).filter((f) => f.endsWith('.js') && !(kits[c] || []).some((k) => k.endsWith(f))).sort().forEach((f) => {
    try { run(rd('js/topics/' + c + '/' + f), c + '/' + f); } catch (e) { console.log('load problem', c + '/' + f, e.message); }
  });
}
try { run(rd('js/topics/soon.js'), 'soon'); } catch (e) { console.log('load problem soon.js', e.message); }
// Başlangıç (intro) tabs: summary bullets
let introBullets = {};
try {
  ['js/core/intro.js', 'js/topics/intro/anims2d.js', 'js/topics/intro/anims3d.js'].forEach((f) => run(rd(f), f));
  run(`(function(){ const real = Intro.register; Intro.register = function (ch, d) { window.__intro = window.__intro || {}; window.__intro[ch] = d.bullets; return real.apply(this, arguments); }; })();`, 'hook');
  run(rd('js/topics/intro/content.js'), 'content');
  introBullets = run('window.__intro || {}', 'bullets');
} catch (e) { console.log('intro bullets not available:', e.message); }
try { run(rd('js/topics/examSetTabs.js'), 'examTabs'); } catch (e) { /* optional */ }
// the same ordering step the program applies to Calculus II
try { run(rd('js/topics/calc2/zzorder.js'), 'order'); } catch (e) { /* optional */ }

run(rd('js/core/examSet.js'), 'examSet');
const setLang = (lang) => run('(function(){ if (I18N.get() !== ' + (lang === 'tr') + ') I18N.toggle(); })()', 'lang');
const rngOf = (s) => run('new SeededRng(' + (s * 7919 + 13) + ')', 'rng');
const heading = (l) => {
  const t = l.trim();
  if (t.length < 4 || t.length > 110 || /^[-─•]/.test(t) || /^\d+\)/.test(t)) return false;
  if (!/[a-zçğıöşü]/.test(t.replace(/\([^)]*\)/g, '')) && t.length >= 6 && /^[A-ZÇĞİÖŞÜ0-9]/.test(t) && !/[=•]/.test(t)) return true; // CAPITAL HEADING
  return /^[A-ZÇĞİÖŞÜ0-9][A-ZÇĞİÖŞÜ0-9 ()\-'/,.]{3,60}:/.test(t); // run-in heading such as "YÖNTEM 1: ..."
};
const pretty = (s, lang) => {
  const low = (x) => x.toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en');
  let t = s.trim().replace(/[.:]$/, '');
  const m = /^([A-ZÇĞİÖŞÜ0-9 ()\-'/,.]{3,60}):\s*(.*)$/.exec(t);
  if (m) { const h = m[1].charAt(0) + low(m[1].slice(1)); t = m[2] && m[2].length <= 45 ? h + ': ' + m[2] : h; }
  else if (!/[a-zçğıöşü]/.test(t)) t = t.charAt(0) + low(t.slice(1));
  return t.length > 110 ? t.slice(0, 107) + '...' : t;
};
function headings(def) {
  try {
    setLang('tr'); const tr = String(def.concept(def.createProblem(rngOf(1)))).split('\n').filter(heading).map((l) => l.trim());
    setLang('en'); const en = String(def.concept(def.createProblem(rngOf(1)))).split('\n').filter(heading).map((l) => l.trim());
    return tr.map((t, i) => ({ tr: t, en: en.length === tr.length ? en[i] : '' }));
  } catch (e) { console.log('no headings for', def.id, ':', e.message); return []; }
}
const both = (f) => { setLang('tr'); const a = f(); setLang('en'); const b = f(); return a === b ? a : a + '  (' + b + ')'; };

const L = [];
const stats = { chapters: 0, tabs: 0, soon: 0 };
const BAR = '='.repeat(72), SUB = '-'.repeat(72);
L.push('CALCULUS VISUALISER: TÜM KONULAR / ALL TOPICS');
L.push('Dr. Halil Emre ÇAĞLAR · ' + new Date().toISOString().slice(0, 10));
L.push('Her sekme için: Türkçe başlık (English title); altında sekmede işlenen alt konular.');
L.push('"Yakında" işaretli sekmelerin içeriği henüz hazır değildir.');
L.push('');
let chNo = 0;
for (const ch of CHAPTERS) {
  let defs = run(`Topics.get('${ch.id}')`, 'get').slice();
  const rank = (d) => (d.type === 'intro' ? 0 : d.type === 'quiz' ? 2 : d.type === 'examset' ? 3 : 1);
  defs = defs.map((d, i) => [d, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map((x) => x[0]);
  if (!defs.length && ch.id !== 'examall') continue;
  chNo++; stats.chapters++;
  L.push(BAR); L.push(chNo + '. ' + ch.tr.toLocaleUpperCase('tr') + '  (' + ch.en + ')'); L.push(BAR);
  let tabNo = 0;
  for (const def of defs) {
    tabNo++; stats.tabs++;
    const title = both(() => def.tabTitle());
    if (def.type === 'soon') {
      stats.soon++;
      L.push(chNo + '.' + tabNo + '  ' + title + '   [YAKINDA / COMING SOON]');
      L.push('      Planlanan: ' + def.plan[0]);
      L.push('');
      continue;
    }
    if (def.type === 'quiz') { L.push(chNo + '.' + tabNo + '  ' + title + '   [10 soruluk test, bölümün her konusundan bir soru]'); L.push(''); continue; }
    if (def.type === 'examset') { L.push(chNo + '.' + tabNo + '  ' + title + '   [konu seçerek yazdırılabilir soru kâğıdı + cevap anahtarı]'); L.push(''); continue; }
    if (def.type === 'about') { L.push(chNo + '.' + tabNo + '  ' + title + '   [telif, lisans, kaynaklar]'); L.push(''); continue; }
    if (def.type === 'intro') {
      L.push(chNo + '.' + tabNo + '  ' + title + '   [bölüme giriş: özet + 2B/3B animasyonlar]');
      (introBullets[ch.id] || []).forEach((b) => L.push('      - ' + b[0] + '  (' + b[1] + ')'));
      L.push(''); continue;
    }
    L.push(chNo + '.' + tabNo + '  ' + title);
    const hs = headings(def);
    hs.forEach((h) => L.push('      - ' + pretty(h.tr, 'tr') + (h.en && pretty(h.en, 'en') !== pretty(h.tr, 'tr') ? '  (' + pretty(h.en, 'en') + ')' : '')));
    if (!hs.length) L.push('      (konu anlatımında ayrı başlık yok)');
    L.push('');
  }
}
L.push(SUB);
L.push('ÖZET: ' + stats.chapters + ' bölüm, ' + stats.tabs + ' sekme (' + stats.soon + ' tanesi "Yakında").');
const pools = run(`Object.keys(window.ExamPools || {}).map((k) => k + ': ' + window.ExamPools[k].length).join(', ')`, 'pools');
L.push('Soru havuzu (bölüm: soru üreteci sayısı): ' + pools);
fs.writeFileSync(out, '﻿' + L.join('\r\n') + '\r\n', 'utf8');
console.log('written ' + out + ' (' + L.length + ' lines, ' + stats.chapters + ' chapters, ' + stats.tabs + ' tabs)');
