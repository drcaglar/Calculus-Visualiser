// RH: text -> HTML with the maths typeset (KaTeX via Typeset); plain escaped text when KaTeX is not available.
const RH = (s) => (typeof Typeset !== 'undefined' && typeof katex !== 'undefined' ? Typeset.html(s) : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
// Renders the "Sınav (Quiz)" tab: 10 multiple-choice questions (one per topic, random), immediate
// feedback with the wrong-answer note, a step-by-step solution revealed gradually, and a results
// screen with a per-topic breakdown. Mirrors Modules/Preliminaries/QuizControl.vb, simplified for
// this HTML preview: no name field/timer persistence and no print/export (the desktop app keeps
// those - this preview is only meant to show the interactive teaching content).

const QUESTION_COUNT = 10;
const QUIZ_SAVED = new WeakMap(); // generators -> state, so the quiz survives switching tabs

function mountQuiz(host, chapterTitle, generators, chapterId) {
  const rng = new Rng();
  const CODE = chapterCode(chapterId);
  let seed = null, keyOnly = false;
  const quizId = () => CODE + '-' + Rng.idOf(seed);
  let questions = [];
  let chosen = [];
  let current = 0;
  let revealCount = 1;
  let seconds = 0;
  let timerHandle = null;
  const sv = QUIZ_SAVED.get(generators);
  if (sv) { questions = sv.questions; chosen = sv.chosen; current = sv.current; seconds = sv.seconds; revealCount = sv.revealCount; seed = sv.seed; keyOnly = !!sv.keyOnly; }

  host.innerHTML = `<div class="quiz-root" data-role="root"></div>`;
  const root = host.querySelector('[data-role="root"]');

  function render() {
    if (questions.length === 0) renderIntro();
    else if (current < questions.length) renderQuestion();
    else renderResults();
  }

  function renderIntro() {
    root.innerHTML = `
      <h2 data-role="title"></h2>
      <p data-role="desc" style="color:var(--subtle-fg); line-height:1.6;"></p>
      <button class="flat-btn primary" data-role="start"></button>
      <div class="quiz-idbox"><div class="quiz-idbox-t" data-role="idT"></div>
        <div class="quiz-idrow"><input class="quiz-idin" data-role="idIn" type="text" maxlength="9" autocomplete="off" spellcheck="false">
        <button class="flat-btn" data-role="idOpen"></button> <button class="flat-btn" data-role="idKey"></button></div>
        <div class="quiz-idmsg" data-role="idMsg" role="status" aria-live="polite"></div></div>
      <div data-role="hist"></div>
    `;
    root.querySelector('[data-role="title"]').textContent = I18N.tx(`${chapterTitle()} — Sınav`, `${chapterTitle()} — Quiz`);
    root.querySelector('[data-role="desc"]').textContent = I18N.tx(
      `Bu bölümde ${QUESTION_COUNT} soruluk bir test çözersin. Her soru farklı bir konudan gelir ve sorular her seferinde değişir. Her cevaptan sonra adım adım çözüm gösterilir.`,
      `You'll take a ${QUESTION_COUNT}-question test for this chapter. Each question comes from a different topic and the numbers change every time. A step-by-step solution is shown after each answer.`
    );
    root.querySelector('[data-role="start"]').textContent = I18N.tx('Sınavı Başlat', 'Start Quiz');
    root.querySelector('[data-role="start"]').addEventListener('click', () => start());
    const idIn = root.querySelector('[data-role="idIn"]'), idMsg = root.querySelector('[data-role="idMsg"]');
    root.querySelector('[data-role="idT"]').textContent = I18N.tx('Sınav numarası ile geri çağır (örn. ' + CODE + '-K7M2P):', 'Recall a quiz by its number (e.g. ' + CODE + '-K7M2P):');
    idIn.setAttribute('aria-label', I18N.tx('Sınav numarası', 'Quiz number'));
    root.querySelector('[data-role="idOpen"]').textContent = I18N.tx('Sınavı aç', 'Open quiz');
    root.querySelector('[data-role="idKey"]').textContent = I18N.tx('Cevap anahtarı', 'Answer key');
    const parseId = () => {
      const t = idIn.value.trim().toUpperCase().replace(/^#/, '');
      const m = /^(?:([A-Z0-9]{3})-)?([0-9A-Z]{1,5})$/.exec(t);
      if (!m) { idMsg.textContent = I18N.tx('Numara biçimi geçersiz.', 'The number format is not valid.'); return null; }
      if (m[1] && m[1] !== CODE) { idMsg.textContent = I18N.tx(`Bu numara başka bir bölüme ait (${m[1]}). Ait olduğu bölümün Sınav sekmesinde açalım.`, `This number belongs to another chapter (${m[1]}). Let's open it in that chapter's Quiz tab.`); return null; }
      return Rng.parseId(m[2]);
    };
    root.querySelector('[data-role="idOpen"]').addEventListener('click', () => { const sd = parseId(); if (sd === null) return; const h = SetHistory.find(CODE + '-' + Rng.idOf(sd)); if (h && h.chosen) openHistory(h); else start(sd); });
    root.querySelector('[data-role="idKey"]').addEventListener('click', () => { const sd = parseId(); if (sd === null) return; keyOnly = true; startSet(sd); chosen = new Array(questions.length).fill(-1); current = questions.length; render(); });
    const hist = SetHistory.list('quiz', CODE).slice(0, 8);
    const hh = root.querySelector('[data-role="hist"]');
    if (hist.length) {
      hh.innerHTML = '<div class="quiz-idbox-t"></div>';
      hh.firstChild.textContent = I18N.tx('Önceki sınavlarımız (bu tarayıcıda):', 'Our previous quizzes (in this browser):');
      hist.forEach((h) => {
        const row = document.createElement('div'); row.className = 'quiz-hist-row';
        row.innerHTML = '<b></b> <span></span> <button type="button" class="flat-btn"></button>';
        row.querySelector('b').textContent = h.id;
        row.querySelector('span').textContent = h.score + ' / ' + h.total + ' — ' + fmtDate(h.date);
        row.querySelector('button').textContent = I18N.tx('Aç', 'Open');
        row.querySelector('button').addEventListener('click', () => openHistory(h));
        hh.appendChild(row);
      });
    }
  }

  function startSet(sd) {
    seed = typeof sd === 'number' ? sd : Rng.newSeed();
    rng.reseed(seed);
    questions = generateSet(rng, QUESTION_COUNT, generators);
  }

  function openHistory(h) {
    keyOnly = false;
    startSet(h.seed);
    chosen = (h.chosen || []).slice(0, questions.length);
    while (chosen.length < questions.length) chosen.push(-1);
    seconds = h.seconds || 0;
    current = questions.length;
    render();
  }

  function start(sd) {
    keyOnly = false;
    startSet(sd);
    chosen = new Array(questions.length).fill(-1);
    current = 0;
    seconds = 0;
    revealCount = 1;
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = setInterval(() => { seconds++; updateTimerLabel(); }, 1000);
    render();
  }

  function updateTimerLabel() {
    const el = root.querySelector('[data-role="timer"]');
    if (el) el.textContent = formatTime(seconds);
  }

  function formatTime(s) {
    const m = Math.floor(s / 60), r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  function renderQuestion() {
    const q = questions[current];
    root.innerHTML = `
      <div class="quiz-top-row">
        <span data-role="progress" class="quiz-progress"></span>
        <span style="flex:1"></span>
        <span data-role="timer" style="color:var(--subtle-fg)"></span>
      </div>
      <div class="quiz-question" data-role="qtext"></div>
      <div data-role="options"></div>
      <div data-role="graphHost"></div>
      <div data-role="feedback"></div>
      <div data-role="stepsHost"></div>
      <div class="quiz-actions" data-role="actions"></div>
    `;
    root.querySelector('[data-role="progress"]').textContent =
      I18N.tx(`Soru ${current + 1} / ${questions.length}   —   Konu: ${q.topic}   —   No: ${quizId()}`, `Question ${current + 1} / ${questions.length}   —   Topic: ${q.topic}   —   No: ${quizId()}`);
    root.querySelector('[data-role="qtext"]').innerHTML = RH(q.text);
    updateTimerLabel();

    if (chosen[current] >= 0) revealCount = q.solution.length; else revealCount = 1;
    if (q.plot) {
      const graphHost = root.querySelector('[data-role="graphHost"]');
      graphHost.style.cssText = 'width:340px;height:240px;margin:6px 0 14px;border:1px solid var(--border);border-radius:8px;overflow:hidden;';
      const c = document.createElement('canvas');
      graphHost.appendChild(c);
      const gc = new GraphCanvas(c);
      applyPlotSpec(gc, q.plot);
    }

    const optionsHost = root.querySelector('[data-role="options"]');
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.innerHTML = `${String.fromCharCode(65 + i)}) ` + RH(opt);
      btn.addEventListener('click', () => answer(i));
      optionsHost.appendChild(btn);
    });
    if (chosen[current] >= 0) showFeedback(chosen[current]); else renderActions(false);
  }

  // Draws a lightweight PlotSpec-style object (curves/points/segments) - see js/topics quiz banks
  // for the shape; kept intentionally small since only some questions carry a graph.
  function applyPlotSpec(gc, spec) {
    gc.setViewport(spec.xMin, spec.xMax, spec.yMin, spec.yMax);
    (spec.curves || []).forEach((c) => gc.addFunction({ evaluator: c.f, color: c.dashed ? gc.gray() : gc.accent(), dashed: !!c.dashed }));
    (spec.points || []).forEach((p) => gc.addMarker({ x: p.x, y: p.y, label: p.label || '', hollow: !!p.hollow }));
    (spec.segments || []).forEach((s) => gc.addSegment({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }));
    gc.render();
  }

  function answer(i) {
    chosen[current] = i;
    revealCount = 1;
    showFeedback(i);
  }

  function showFeedback(i) {
    const q = questions[current];
    const buttons = root.querySelectorAll('.quiz-option');
    buttons.forEach((b, idx) => {
      b.disabled = true;
      if (idx === q.correctIndex) b.classList.add('correct');
      else if (idx === i) b.classList.add('wrong');
    });

    const fb = root.querySelector('[data-role="feedback"]');
    const ok = i === q.correctIndex;
    fb.innerHTML = `<div class="quiz-feedback ${ok ? 'correct' : 'wrong'}">${ok ? I18N.tx('✔ Doğru!', '✔ Correct!') : I18N.tx(`✘ Yanlış. Doğru cevap: ${q.correctLetterOf ? '' : ''}${String.fromCharCode(65 + q.correctIndex)}`, `✘ Wrong. Correct answer: ${String.fromCharCode(65 + q.correctIndex)}`)}</div>`;
    if (!ok && q.wrongNotes && q.wrongNotes[i]) {
      const note = document.createElement('div');
      note.className = 'quiz-note';
      note.innerHTML = RH(I18N.tx(`Neden yanlış? Seçtiğin ${String.fromCharCode(65 + i)} şıkkı: `, `Why wrong? Your choice ${String.fromCharCode(65 + i)}: `) + q.wrongNotes[i]);
      fb.appendChild(note);
    }

    renderStepsBlock(q.solution);

    renderActions(true);
  }

  // Back / next buttons: going back shows the earlier question exactly as answered (nothing is regenerated).
  function renderActions(answered) {
    const actions = root.querySelector('[data-role="actions"]');
    actions.innerHTML = '';
    if (current > 0) {
      const backBtn = document.createElement('button');
      backBtn.className = 'flat-btn';
      backBtn.textContent = I18N.tx('← Önceki soru', '← Previous question');
      backBtn.addEventListener('click', () => { current--; render(); });
      actions.appendChild(backBtn);
    }
    if (answered) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'flat-btn primary';
      nextBtn.textContent = current === questions.length - 1 ? I18N.tx('Sonuçları gör', 'See results') : I18N.tx('Sonraki soru →', 'Next question →');
      nextBtn.addEventListener('click', () => { current++; render(); });
      actions.appendChild(nextBtn);
    }
  }

  function renderStepsBlock(steps) {
    const host2 = root.querySelector('[data-role="stepsHost"]');
    function draw() {
      const n = Math.max(1, Math.min(revealCount, steps.length));
      host2.innerHTML = `
        <div class="we-steps-header" style="margin-top:10px;">
          <h3 style="margin:0;font-size:14px;">${I18N.tx('Çözüm', 'Solution')}</h3>
          <button class="flat-btn" data-role="qNext">${I18N.tx('Sonraki adım ▸', 'Next step ▸')}</button>
          <button class="flat-btn" data-role="qAll">${I18N.tx('Hepsini göster', 'Show all')}</button>
          <span class="we-steps-counter">${I18N.tx('Adım', 'Step')} ${n} / ${steps.length}</span>
        </div>
        <div data-role="qStepsList"></div>
      `;
      const list = host2.querySelector('[data-role="qStepsList"]');
      for (let i = 0; i < n; i++) {
        const card = document.createElement('div');
        card.className = 'we-step-card';
        card.innerHTML = RH(`${i + 1}. ${steps[i]}`);
        list.appendChild(card);
      }
      const nextBtn = host2.querySelector('[data-role="qNext"]');
      nextBtn.disabled = n >= steps.length;
      nextBtn.addEventListener('click', () => { revealCount++; draw(); });
      host2.querySelector('[data-role="qAll"]').addEventListener('click', () => { revealCount = steps.length; draw(); });
    }
    draw();
  }

  function renderResults() {
    if (timerHandle) clearInterval(timerHandle);
    let score = 0;
    questions.forEach((q, i) => { if (chosen[i] === q.correctIndex) score++; });
    const weak = questions.filter((q, i) => chosen[i] !== q.correctIndex).map((q) => q.topic);

    if (!keyOnly && seed !== null) SetHistory.add({ kind: 'quiz', ch: CODE, id: quizId(), seed, chosen: chosen.slice(), seconds, score, total: questions.length });
    root.innerHTML = `
      <h2 data-role="scoreLine"></h2>
      <div class="quiz-idline" data-role="idLine"></div>
      <div data-role="rows"></div>
      <p data-role="advice" style="margin-top:14px; font-weight:600;"></p>
      <button class="flat-btn primary" data-role="restart"></button>
    `;
    root.querySelector('[data-role="scoreLine"]').textContent = keyOnly
      ? I18N.tx(`Cevap anahtarı — ${quizId()}`, `Answer key — ${quizId()}`)
      : I18N.tx(`Sonuç: ${score} / ${questions.length}   (süre ${formatTime(seconds)})`, `Result: ${score} / ${questions.length}   (time ${formatTime(seconds)})`);
    root.querySelector('[data-role="idLine"]').textContent = I18N.tx(`Sınav numarası: ${quizId()} — bu numarayla aynı sorular ve cevap anahtarı daha sonra geri çağrılabilir.`, `Quiz number: ${quizId()} — with this number the same questions and the answer key can be recalled later.`);
    const rows = root.querySelector('[data-role="rows"]');
    questions.forEach((q, i) => {
      const ok = chosen[i] === q.correctIndex;
      const row = document.createElement('div');
      row.className = 'quiz-result-row';
      row.style.color = ok ? 'var(--good)' : 'var(--bad)';
      row.textContent = `${ok ? '✔' : '✘'}  ${q.topic}`;
      rows.appendChild(row);
    });
    root.querySelector('[data-role="advice"]').textContent = weak.length === 0
      ? I18N.tx('Harika! Tüm konular yerinde.', 'Great! All topics are solid.')
      : I18N.tx(`Biraz daha çalışabileceğimiz konular: ${weak.join(', ')}`, `Topics you should study more: ${weak.join(', ')}`);
    const keyBtn = document.createElement('button'); keyBtn.className = 'flat-btn'; keyBtn.type = 'button';
    const keyBox = document.createElement('div'); keyBox.className = 'quiz-key'; keyBox.style.display = keyOnly ? 'block' : 'none';
    keyBtn.textContent = I18N.tx('Cevap anahtarı ve çözümler', 'Answer key and solutions');
    keyBtn.addEventListener('click', () => { keyBox.style.display = keyBox.style.display === 'none' ? 'block' : 'none'; });
    questions.forEach((qq, i) => {
      const it = document.createElement('div'); it.className = 'quiz-key-item';
      const L = (k) => String.fromCharCode(65 + k) + ') ' + qq.options[k];
      it.innerHTML = '<div class="quiz-key-q"></div><div class="quiz-key-a"></div><div class="quiz-key-s"></div>';
      it.querySelector('.quiz-key-q').innerHTML = RH(`${i + 1}. ${qq.text}`);
      it.querySelector('.quiz-key-a').innerHTML = RH(I18N.tx('Doğru cevap: ', 'Correct answer: ') + L(qq.correctIndex)) + (!keyOnly && chosen[i] >= 0 && chosen[i] !== qq.correctIndex ? ' &nbsp;|&nbsp; ' + RH(I18N.tx('Bizim cevabımız: ', 'Our answer: ') + L(chosen[i])) : '') + (!keyOnly && chosen[i] < 0 ? ' &nbsp;|&nbsp; ' + I18N.tx('boş', 'blank') : '');
      it.querySelector('.quiz-key-s').innerHTML = (qq.solution || []).map((s, k) => '<div>' + RH(`${k + 1}. ${s}`) + '</div>').join('');
      keyBox.appendChild(it);
    });
    root.querySelector('[data-role="advice"]').after(keyBtn, keyBox);
    const restart = root.querySelector('[data-role="restart"]');
    restart.textContent = I18N.tx('Yeni Sınav', 'New Quiz');
    restart.addEventListener('click', () => { questions = []; render(); });
  }

  const offLang = I18N.onChange(render);

  if (questions.length && current < questions.length) timerHandle = setInterval(() => { seconds++; updateTimerLabel(); }, 1000);
  render();

  return {
    destroy() {
      QUIZ_SAVED.set(generators, { questions, chosen, current, seconds, revealCount, seed, keyOnly });
      offLang();
      if (timerHandle) clearInterval(timerHandle);
    },
  };
}
