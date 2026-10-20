// Every quiz / exam generator of every chapter: a numeric level 1..3, exactly 4 distinct options, a valid correct index, no bad tokens,
// 60 seeds x 2 languages.   node tests/quiz_pools.js [chapter]
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
let fails = 0, n = 0;
for (const c of CH) {
  const pool = run(`(window.ExamPools && window.ExamPools['${c}']) || []`, 'pool');
  if (!pool.length) { console.log('no pool for ' + c); continue; }
  pool.forEach((g, gi) => {
    if (!(g.level >= 1 && g.level <= 3)) { fails++; console.log('FAIL', c, 'pool#' + gi, 'generator has no level 1..3'); }
    for (const lang of ['tr', 'en']) {
      for (let sd = 1; sd <= 60; sd++) {
        setLang(lang); n++;
        try {
          const q = g(rngOf(sd)), opts = q.options || [];
          const txt = [q.topic, q.text, ...opts, ...(q.solution || []), ...(q.wrongNotes || [])].join(' ');
          const why = !q.text ? 'no text' : opts.length !== 4 ? 'options: ' + opts.length : new Set(opts.map(String)).size !== 4 ? 'duplicate options'
            : !(q.correctIndex >= 0 && q.correctIndex < 4) ? 'bad correctIndex'
            : ((lang === 'tr' && /undefined/.test(txt)) || /NaN|Infinity|\[object/.test(txt)) ? 'bad token in text' : '';
          if (why) { fails++; console.log('FAIL', c, 'pool#' + gi, lang, 'seed', sd, why, '::', String(q.text).slice(0, 70)); break; }
        } catch (e) { fails++; console.log('FAIL', c, 'pool#' + gi, lang, 'seed', sd, 'exception', e.message); break; }
      }
    }
  });
}
console.log('quiz_pools: ' + n + ' questions checked, failures ' + fails);
process.exitCode = fails ? 1 : 0;
