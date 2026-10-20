// Assessment "booklet": everything a chapter needs for its Quiz tab, its Question-Set (exam PDF) tab and the exam pool,
// in ONE call. Use it for every new chapter:
//
//   Assessment.register('myChapter', [genA, genB, ...], extraGenerators /* optional, more exam-only questions */);
//
// A generator is (rng) => question. Build questions with makeQuestion(...) (quizEngine.js) or with the shortcut below:
//
//   Assessment.num(topic, text, correctNumber, solutionLines, rng, { unit: 'm', level: 1..3, wrongs: [..] /* optional */ })
//
// Texts may contain plain maths (x², √x, a/b, ∫ₐᵇ ...): quiz screen, solution and the exam / answer-key PDFs typeset it
// with KaTeX automatically (Typeset.html). The exam tab prints the questions + an answer key with only the correct option.
const Assessment = (function () {
  const tx = (a, b) => I18N.tx(a, b);
  function register(chapterId, generators, extra) {
    Topics.register(chapterId, { type: 'quiz', tabTitle: () => tx('Sınav (Quiz)', 'Quiz'), generators });
    window.ExamPools = window.ExamPools || {};
    window.ExamPools[chapterId] = generators.concat(extra || []);
    Topics.register(chapterId, { type: 'examset', chapterId, tabTitle: () => tx('Soru Seti', 'Question Set') });
  }
  // numeric multiple choice: wrong options are built from typical slips (double, half, +1, -1, sign) unless given
  function num(topic, text, correct, solution, rng, opts) {
    opts = opts || {};
    const u = opts.unit ? ' ' + opts.unit : '';
    const f = (v) => String(fmt2(v)).replace('-', '−') + u;
    const wr = (opts.wrongs && opts.wrongs.length ? opts.wrongs : [correct * 2, correct / 2, correct + 1, correct - 1, -correct, correct * 3]).filter((v) => Math.abs(v - correct) > 1e-9);
    return makeQuestion(topic, text, f(correct), wr.map(f), solution, rng, opts.notes, opts.plot);
  }
  return { register, num };
})();
