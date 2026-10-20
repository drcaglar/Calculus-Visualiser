// Calculus II quiz and question-set pool: every tab file of this chapter pushes its generators into window.Calc2Quiz
// (main = one per topic for the 10-question quiz, extra = exam-only pool); this file registers them as the chapter's Quiz and Question Set tabs.
(function () {
  const Q = window.Calc2Quiz || { main: [], extra: [] };
  if (!Q.main.length) return;
  Assessment.register('calc2', Q.main, Q.extra);
})();
