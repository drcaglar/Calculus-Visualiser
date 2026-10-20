// Translation audit: every tab, quiz/exam generator, challenge card and link text is produced in Turkish and English for the same seeds.
// FAIL: the two languages give the same long text (untranslated), the English text contains Turkish letters, or the Turkish text is mostly English words.
//   node tests/lang_audit.js [chapter]
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(__dirname, 'harness_modes.js'), 'utf8');
const pre = src.slice(src.indexOf('const noop'), src.indexOf("const dir = path.join(ROOT, 'js/topics', chapter);")).replace(/run\(`class SeededRng[\s\S]*?'seeded'\);/, '');
const { run, rd } = new Function('fs', 'path', 'vm', 'ROOT', 'chapter', 'mode', 'arg', pre + '\nreturn { run, rd };')(fs, path, vm, ROOT, 'x', 'x');
const only = process.argv[2];
const CH = ['numbers', 'functions', 'trig', 'limits', 'derivatives', 'applications', 'integrals', 'calc2', 'engineering'].filter((c) => !only || c === only);
const kits = { trig: ['js/topics/trig/trigKit.js'], functions: ['js/topics/functions/fnKit.js'] };
['js/core/assessment.js', 'js/core/typeset.js'].forEach((f) => { try { run(rd(f), f); } catch (e) { /* optional */ } });
run('var CHAPTERS = ' + JSON.stringify(CH.map((id) => ({ id }))) + '.map((c) => ({ id: c.id, title: () => c.id }));', 'chapters');
run('document.createTextNode = () => ({}); document.getElementById = () => null;', 'domfix');
for (const c of CH) {
  (kits[c] || []).forEach((f) => run(rd(f), f));
  const dir = path.join(ROOT, 'js/topics', c);
  fs.readdirSync(dir).filter((f) => f.endsWith('.js') && !(kits[c] || []).some((k) => k.endsWith(f))).sort().forEach((f) => {
    try { run(rd('js/topics/' + c + '/' + f), c + '/' + f); } catch (e) { console.log('LOAD ERROR', c + '/' + f, e.message); process.exitCode = 1; }
  });
}
run(rd('js/core/examSet.js'), 'examSet');
const setLang = (lang) => run('(function(){ if (I18N.get() !== ' + (lang === 'tr') + ') I18N.toggle(); })()', 'lang');
const rngOf = (s) => run('new SeededRng(' + (s * 7919 + 13) + ')', 'rng');
const TR_CH = /[çğıöşüÇĞİÖŞÜ]/;
const EN_WORDS = /\b(the|and|of|is|are|with|for|that|this|then|from|where|when|which|find|let's)\b/gi;
let fails = 0, n = 0;
const seen = new Set();
function judge(what, tr, en) {
  tr = String(tr == null ? '' : tr); en = String(en == null ? '' : en);
  n++;
  const letters = (s) => (s.match(/[A-Za-zçğıöşüÇĞİÖŞÜ]/g) || []).length;
  const key = what + '|' + tr.slice(0, 40);
  const bad = (msg) => { if (seen.has(key + msg)) return; seen.add(key + msg); fails++; process.exitCode = 1; console.log('FAIL', what, '-', msg, '::', (msg.startsWith('English') ? en.slice(Math.max(0, en.search(TR_CH) - 45), en.search(TR_CH) + 45) : tr).replace(/\s+/g, ' ').slice(0, 110)); };
  const MATHW = /^(sin|cos|tan|cot|sec|csc|log|exp|arcsin|arccos|arctan|sinh|cosh|tanh|lim|max|min|sqrt|ln|mod|det|vol|int|sum)$/i;
  const realWords = (tr.match(/[A-Za-zçğıöşüÇĞİÖŞÜ]{4,}/g) || []).filter((w) => !MATHW.test(w));
  if (tr === en && realWords.length >= 3) bad('untranslated (TR = EN)');
  { const m = en.replace(/\(Turkish:[^)]*\)/g, '').match(TR_CH); if (m) bad('English text has Turkish letter ' + m[0] + ' at ' + en.indexOf(m[0])); }
  const words = (tr.match(/[A-Za-zçğıöşüÇĞİÖŞÜ]+/g) || []).length, ew = (tr.match(EN_WORDS) || []).length;
  if (words >= 12 && ew / words > 0.12) bad('Turkish text looks English (' + ew + '/' + words + ' English words)');
}
for (const c of CH) {
  const defs = run(`Topics.get('${c}')`, 'get').filter((d) => !d.type || d.type === 'quiz');
  for (const def of defs) {
    if (def.type === 'quiz') continue;
    for (let sd = 1; sd <= 8; sd++) {
      try {
        setLang('tr'); const pa = def.createProblem(rngOf(sd)); setLang('en'); const pb = def.createProblem(rngOf(sd));
        const pairs = [];
        const both = (name, f) => { setLang('tr'); const a = f(pa); setLang('en'); const b = f(pb); pairs.push([name, a, b]); };
        both('title', () => def.tabTitle());
        both('concept', (p) => def.concept(p));
        if (def.problemStatement) both('statement', (p) => def.problemStatement(p));
        both('steps', (p) => (def.solveSteps(p) || []).join('\n'));
        if (def.challenge) { both('challenge prompt', (p) => def.challenge.prompt(p)); if (def.challenge.hint) both('challenge hint', (p) => def.challenge.hint(p, 0)); }
        pairs.forEach(([nm, a, b]) => judge(c + '/' + def.id + ' ' + nm, a, b));
      } catch (e) { fails++; process.exitCode = 1; console.log('FAIL', c + '/' + def.id, 'seed', sd, e.message); break; }
    }
  }
  const pool = run(`(window.ExamPools && window.ExamPools['${c}']) || []`, 'pool');
  pool.forEach((g, gi) => {
    for (let sd = 1; sd <= 4; sd++) {
      try {
        setLang('tr'); const a = g(rngOf(sd)); setLang('en'); const b = g(rngOf(sd));
        judge(c + ' pool#' + gi + ' topic', a.topic, b.topic); judge(c + ' pool#' + gi + ' text', a.text, b.text);
        judge(c + ' pool#' + gi + ' solution', (a.solution || []).join('\n'), (b.solution || []).join('\n'));
        (a.wrongNotes || []).forEach((w, i) => { if (w && !/^\s*$/.test(w)) judge(c + ' pool#' + gi + ' note', w, (b.wrongNotes || [])[i]); });
      } catch (e) { fails++; process.exitCode = 1; console.log('FAIL', c, 'pool#' + gi, 'seed', sd, e.message); break; }
    }
  });
}
console.log('lang_audit: ' + n + ' text pairs checked, failures ' + fails);
