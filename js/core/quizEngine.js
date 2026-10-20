// Question-building helpers mirroring Modules/Preliminaries/QuizBank.vb (Make/IntWrongs/Shuffle/GenerateSet).
// A "question generator" is a function (rng) => QuizQuestion. Each chapter exposes an array of them
// (one per topic); GenerateSet picks `count` distinct generators at random and calls each once.

function shuffleArr(arr, rng) {
  for (let i = arr.length - 1; i >= 1; i--) {
    const j = rng.nextInt(0, i + 1);
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

// Builds a QuizQuestion from the correct answer, candidate wrong answers (deduplicated, first 3
// distinct ones kept) and, optionally, one diagnostic note per wrong answer explaining the typical
// mistake that produces it (shown after the student picks it). plot is an optional PlotSpec-like
// object (see graph.js) drawn beside the question; leave undefined for none.
function makeQuestion(topic, text, correct, wrongs, solution, rng, wrongNotes, plot) {
  const notes = wrongNotes || [];
  const generic = I18N.tx(
    'Bu seçenek, işlem sırasında yapılan bir hesap ya da işaret hatasından gelmiş olabilir; adımları tekrar kontrol et.',
    'This option may come from an arithmetic or sign slip while working; re-check the steps.'
  );
  const pairs = [];
  let i = 0;
  if (wrongs && wrongs.fillerStart !== undefined && Number.isFinite(wrongs.base)) wrongs = balanceFillers(wrongs, rng);
  for (const w of wrongs) {
    const note = (i < notes.length && notes[i]) ? notes[i] : generic;
    i++;
    if (w !== correct && !pairs.some((p) => p[0] === w)) pairs.push([w, note]);
    if (pairs.length === 3) break;
  }
  pairs.push([correct, '']);
  shuffleArr(pairs, rng);
  const options = pairs.map((p) => p[0]);
  return {
    topic, text, options,
    correctIndex: options.indexOf(correct),
    solution,
    wrongNotes: pairs.map((p) => p[1]),
    plot: plot || null,
  };
}

// Mirrors IntWrongs: a handful of specific wrong values plus correct±1..3 as filler.
function intWrongs(correct, ...specific) {
  const result = specific.map((v) => String(v));
  for (const d of [1, -1, 2, -2, 3, -3]) result.push(String(correct + d));
  result.fillerStart = specific.length; // makeQuestion replaces the filler by a balanced random set (see balanceFillers)
  result.base = correct;
  return result;
}

// Filler distractors without a pattern: the correct value is NOT always the "middle" of a cluster correct±1..3.
// Specific (misconception) wrongs are kept first; the missing ones are drawn at random below/above the correct value so the
// correct answer lands at a random rank (lowest, 2nd, 3rd or highest) among the four options.
function balanceFillers(wrongs, rng) {
  const c = wrongs.base, spec = [], seen = new Set([String(c)]);
  for (const w of wrongs.slice(0, wrongs.fillerStart)) { const k = String(w); if (!seen.has(k)) { seen.add(k); spec.push(k); } }
  const need = Math.max(0, 3 - spec.length);
  if (need === 0) return spec;
  const val = (w) => Number(String(w).replace('−', '-'));
  const nums = spec.map(val).filter(Number.isFinite);
  const belowSpec = nums.filter((v) => v < c).length;
  const target = rng.nextInt(0, 4); // wrongs that should lie below the correct value
  const needBelow = Math.max(0, Math.min(need, target - belowSpec));
  const needAbove = need - needBelow;
  const below = [c - 1, c - 2, c - 3, c - 4, c - 5, c - 6, c - 10], above = [c + 1, c + 2, c + 3, c + 4, c + 5, c + 6, c + 10];
  [-c, 2 * c].forEach((v) => { if (v < c) below.push(v); else if (v > c) above.push(v); });
  const pick = (arr, k) => {
    const pool = shuffleArr(arr.filter((v) => !seen.has(String(v))), rng), out = [];
    for (const v of pool) { if (out.length >= k) break; if (!seen.has(String(v))) { seen.add(String(v)); out.push(String(v)); } }
    return out;
  };
  const extra = pick(below, needBelow).concat(pick(above, needAbove));
  // if one side ran out (should not happen) fill from the other side
  if (extra.length < need) extra.push(...pick(below.concat(above), need - extra.length));
  return spec.concat(shuffleArr(extra, rng));
}

function generateSet(rng, count, generators) {
  const order = shuffleArr(generators.map((_, i) => i), rng);
  const n = Math.min(count, order.length);
  const result = [];
  for (let i = 0; i < n; i++) result.push(generators[order[i]](rng));
  return result;
}


// History of finished quizzes and created question sets (this browser only): lets a student come back later and reopen a quiz
// (with the answers given) or a question set by its number. Never throws: storage may be blocked.
const SetHistory = (function () {
  const KEY = 'cv_set_history_v1', MAX = 60;
  const all = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const put = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, MAX))); } catch (e) { /* ignore */ } };
  return {
    list(kind, ch) { return all().filter((x) => x.kind === kind && x.ch === ch); },
    find(id) { return all().find((x) => x.id === id) || null; },
    add(entry) { const a = all().filter((x) => x.id !== entry.id); a.unshift(Object.assign({ date: Date.now() }, entry)); put(a); },
  };
})();
const fmtDate = (t) => { const d = new Date(t), p = (n) => String(n).padStart(2, '0'); return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };

// Three-character chapter code used in quiz and question-set numbers (calc2/calc3 would both start with CAL).
const chapterCode = (id) => ({ calc2: 'CL2', calc3: 'CL3', series: 'SER', all: 'ALL' }[id] || String(id || 'QUZ').slice(0, 3).toUpperCase());
