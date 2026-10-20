# Calculus Visualiser — HTML edition: developer guide

Bilingual (Turkish / English) interactive Calculus program. Plain HTML/CSS/vanilla JS: no framework, no package manager, no build step
for development. The app is fully offline (KaTeX 0.16.11 and Three.js are bundled in `lib/`).

* **Source of truth:** `index.html` + `css/` + `js/` + `lib/`.
* **Deliverable:** `CalculusVisualiser_Web.html`, a single file generated from the source (all scripts, styles and KaTeX fonts inlined).
  It is rebuilt after every change (copy the old file to the backup folder first). Never edit it by hand: edit the sources and rebuild.
* Serve the folder over http while developing (e.g. `python -m http.server 8766`); `file://` is not supported by the in-app browser pane.
  When a browser keeps showing old scripts, force a reload (the pane caches scripts aggressively).

## Chapters and tabs

`js/main.js` holds `CHAPTERS` (order = home page order): numbers, functions, trig, limits, derivatives, applications, integrals, calc2, series,
calc3, engineering, about. Each chapter is a list of **tabs** registered with `Topics.register(chapterId, def)`; `def.type` decides the tab kind:

| `def.type`      | tab                                                                 | module                              |
|-----------------|---------------------------------------------------------------------|-------------------------------------|
| (none)          | worked example (concept + graph + controls + step-by-step solution) | `js/core/workedExample.js`          |
| `intro`         | "Başlangıç": chapter summary + 2D/3D animations (always first tab)  | `js/core/intro.js`, `js/topics/intro/`|
| `quiz`          | 10-question quiz                                                    | `js/core/quizUI.js`                 |
| `examset`       | printable question set + answer key (PDF via print)                 | `js/core/examSet.js`                |
| `soon`          | placeholder "Yakında"                                               | `js/topics/soon.js`                 |
| `about`         | About / licence page                                                | `js/core/aboutUI.js`                |

## Folder layout

```
index.html                  shell + ONE <script> tag per file (load order matters, see below)
css/style.css, css/home.css theme variables, layout, all component styles (home.css is appended to, newest rules win)
js/core/                    framework (rng, i18n, theme, graph, typeset, workedExample, intro, view3d, quiz*, examSet, assessment, ...)
js/topics/<chapter>/        one file per tab (+ quizBank.js); engineering also has assumptions.js and zz3d_*.js
js/topics/intro/            Başlangıç tabs: anims2d.js, anims3d.js, content.js
js/topics/v3attach.js       attaches 3D views to existing 2D tabs
js/home.js, js/main.js      home page, chapter sidebar, tab strip, routing (AppNav.goto(chapterId))
lib/katex, lib/three        third-party (see THIRD_PARTY_NOTICES.md)
tests/                      automated checks (node tests/run.js)
tools/bundle.js             builds CalculusVisualiser_Web.html from the sources
```

**Load order** (the only fragile part): `js/core/*.js` first (rng, i18n, topics, graph, typeset, ... then workedExample), then topic files
chapter by chapter, `quizBank.js` last in each chapter, `examSetTabs.js`/`v3attach.js`/`soon.js`/intro content after the topics they use,
`js/home.js` and `js/main.js` last. A topic file uses globals from earlier files, so adding a file means adding its `<script>` line in the
right place. `assumptions.js` must precede the engineering tabs, `trigKit.js`/`fnKit.js` precede their chapter's topics.

## Worked-example tab contract

```js
(function () {
  function createProblem(rng) { /* plain mutable object */ }
  function solveSteps(problem) { /* string[] - the step-by-step solution */ }
  function draw(canvas, problem) { /* canvas.addFunction / addMarker / ... */ }

  Topics.register('derivatives', {
    id: 'myTopic',                                     // unique, camelCase
    tabTitle: () => I18N.tx('Türkçe Başlık', 'English Title'),
    concept: (problem) => I18N.tx('çok satırlı konu metni', 'multi-line topic text'),
    problemStatement: (problem) => I18N.tx('...', '...'),   // the QUESTION, never the answer
    createProblem, solveSteps, draw,
    // optional hooks (all bilingual through I18N.tx):
    buildControls, focus, drawSchematic, links, view3d, challenge, _test,
  });
})();
```

Every on-screen text goes through `I18N.tx('Türkçe', 'English')` with both branches properly written. `tx` is evaluated at render time, so a
language switch re-renders everything.

* **`buildControls(rightCol, getProblem, helpers)`**: `helpers.addSlider({caption, min, max, step, get, set})`, `addCheckbox`, `addRadioGroup`,
  `addSelect`, `refresh()`, `regenerate()`. `getProblem()` always returns the current problem; sliders mutate it in place.
* **`focus(problem) → {x, y}`**: point the graph window is centred on. The Cartesian window is fixed and centred (see `graph.js`); the framework probes
  every slider position once so the window already fits the whole example.
* **`drawSchematic(schem, problem)`**: second canvas with a labelled engineering sketch (`js/core/schematic.js`).
* **`links`**: `[{ match: /regex/, make: (rng, current) => problem }]`. Every concept line that matches `match` (in BOTH languages) gets a
  "▶ Soru" button which loads an example of that method. `{ match, tab: 'otherTabId' }` jumps to another tab instead. Every method named in the
  concept text should have a link; if no problem type exists yet, add one.
* **`view3d`**: `{ build({ THREE, world, C }) → { update(problem) } }`. Adds a "3B / 2B" button; builders use the `View3D.V3` helpers.
* **`challenge`** (predict-then-check card): `{ title?, prompt(p), target(p), tol(p), hint?(p, guess), format?(v) }`. The student types a number
  before opening the solution; the program judges it within `tol`, gives a hint after a miss and reveals the answer after three misses.
  Place a `challenge` where a numeric prediction is natural (Riemann sum, tangent slope, limit value, Newton step).
* **`_test`**: object with the internal functions needed by `tests/` for independent numeric checks (see Tests).
* Typeset maths: plain-text maths in concept, statement and steps (`x²`, `√x`, `a/b`, `∫ₐᵇ`, `⇒`) is typeset with KaTeX automatically by
  `js/core/typeset.js` (`Typeset.segments/isEquation/toTex/html`). Only pure-maths stretches are converted. Run the tests after changing it.
* Concept text: headings are lines in CAPITALS (numbered and bold automatically), run-in headings such as `TANIM:` also work.

### `GraphCanvas` (`js/core/graph.js`)

```js
canvas.setViewport(xMin, xMax, yMin, yMax);
canvas.addFunction({ evaluator, color, thickness, dashed, label });
canvas.addParametric({ xOfT, yOfT, tMin, tMax });
canvas.addSegment({ x1, y1, x2, y2, color, dashed });
canvas.addMarker({ x, y, color, shape, radius, label, hollow });
canvas.addGuideLine({ axis, position, color, label });
canvas.addRegion({ xMin, xMax, color });
canvas.addFilledArea({ evaluator, baseEvaluator?, xMin, xMax, color, samples });
```

Do not call `clear()` / `render()` yourself. **Evaluators must never throw and must return `NaN` outside the domain.** The curve is drawn with 2000
samples and the pen is lifted at `NaN`, at poles and at jumps; filled areas are drawn in pieces and never shade where the function is undefined.
`canvas.describe()` returns a text description of the drawing, used as the canvas `aria-label` (screen readers).
`fmt2(x)` formats like VB's `0.##` (up to 2 decimals, no trailing zeros).

### Random numbers and problem IDs

`js/core/rng.js`: `nextInt(minIncl, maxExcl)`, `nextDouble()`, `pick(array)`, `nonZeroInt(lo, hi)`. After `reseed(n)` the stream is reproducible
(mulberry32). The worked-example framework gives every "New Example" a seed; its 5-character ID (`Rng.idOf(seed)`, e.g. `#K7M2P`) is shown in the
problem card and can be typed back to get the same problem again. Therefore **`createProblem(rng)` must take all its randomness from `rng`**
(never `Math.random`) and must not depend on anything that changes between calls except the tab's own module-level settings (for example the selected
engineering scenario). Do not create your own `new Rng()` for problem generation.

## Quiz and question set ("Assessment")

New chapter: after registering its topics call once
`Assessment.register('chapterId', [generator, ...], [extraExamOnlyGenerator, ...]);` — this adds the Quiz tab, the Question-Set tab and the exam pool.
A generator is `(rng) => question`, built with `makeQuestion(topic, text, correct, wrongs, solutionLines, rng, wrongNotes?, plot?)`
(`js/core/quizEngine.js`) or the shortcut `Assessment.num(topic, text, correctNumber, solutionLines, rng, {unit, level, wrongs, notes, plot})`.
`intWrongs(correct, ...specific)` gives your specific wrong values plus filler; the filler is rebalanced so the correct answer is not always the middle
option. `wrongNotes[i]` is the one-sentence diagnosis of the specific mistake behind wrong option *i*. Printed PDFs use 12 pt and the answer key shows
only the correct option. Each tab remembers its last example/quiz/set when you switch tabs (`WE_SAVED`, `QUIZ_SAVED`, `EXAM_SAVED`).

Quiz and question-set numbers: a quiz is `CODE-SEED` (CODE = first three letters of the chapter id, SEED = `Rng.idOf(seed)`); a question set is
`CODE-SEED-SIZE-MASK` (MASK = hex bitmask of the selected topic groups, in pool order). The same number recreates the same questions and key, so generators
must take all randomness from the `rng` they receive. Finished quizzes (with the chosen answers) and created sets are kept in `localStorage` through
`SetHistory` (`js/core/quizEngine.js`). Adding or reordering topic groups of a chapter changes what old set numbers mean: append new groups at the end.

The **Exam Creator** (chapter `examall`, one tab, `chapterId: 'all'`) is the same `mountExamSet` engine over the union of all `window.ExamPools`: topic groups are
named `ChapterTitle: topic`, nothing is selected by default, sizes go up to 100 and the set number is `ALL-SEED-SIZE-MASK` with a BigInt hex mask. Pools of a new
chapter must be added to `EXAM_ALL` in `js/core/examSet.js`. `tests/exam_all.js` checks mixing, determinism of the number and the error cases.

## Başlangıç (intro) tabs

`Intro.register('chapterId', { title, bullets: [[tr, en], ...], anims: [anim, ...] })`; the tab is always first. Animations live in
`js/topics/intro/anims2d.js` (canvas, helper kit `Intro.K`) and `anims3d.js` (Three.js); `content.js` assigns four to each chapter.
Frames are capped (about 36 fps) and WebGL scenes are created lazily; keep an animation under a few ms per frame.

## Engineering tabs

Four tabs (statics, dynamics, materials/manufacturing, thermo-fluid), 16 scenarios each. A scenario is a case in `createProblem`/`solveSteps`
with its title, a schematic and (in `zz3d_*.js`) a 3D scene. **Every scenario's solution ends with a "Varsayımlar ve birimler / Assumptions and
units" line**, added from `js/topics/engineering/assumptions.js` (`EngAssume.data[tab][scenarioNumber] = [tr, en]`; the tab wraps its `solveSteps`
with `EngAssume.wrap`). Adding a scenario means adding its assumptions row; the audit fails otherwise.

## Tests

```
node tests/run.js              # everything
node tests/run.js engineering  # one chapter
```

`run.js` runs, per chapter, in separate processes (a stub DOM, no browser needed):

* `harness_check.js <chapter> check`: generates hundreds of examples per tab in both languages; fails on exceptions, `undefined`/`NaN`/`Infinity`
  in text (TR), empty steps, non-finite drawing coordinates, broken controls.
* `harness_modes.js <chapter> links`: every "▶ Soru" link matches a concept line in both languages and produces a valid, drawable problem.
* `harness_modes.js <chapter> challenge`: prompt/target/tolerance of every predict-then-check card.
* `harness_modes.js <chapter> numeric`: independent numeric cross-checks through the `_test` hooks (derivative vs central difference, Riemann sums vs
  the exact integral, limits vs evaluation next to the point, Newton step vs manual step, and that the solution text contains the computed value).
* `harness_modes.js engineering units`: every scenario has the assumptions line and a unit; `3d`: every 3D scene builds and renders frames.
* `core_rng.js`: seeded Rng reproducibility and ID round trip.

After changing core code, run at least the affected chapter; after changing `typeset.js` or `workedExample.js` run everything. Visual layout, keyboard
focus and the real browser behaviour are NOT covered: check those by hand.

## Accessibility conventions

Canvases carry `role="img"` and an `aria-label` (statement + `canvas.describe()`); sliders have an `aria-label` and `aria-valuetext`; tabs are real
`role="tab"` elements operable with Tab/Enter/Arrow keys; focus is shown with `:focus-visible`; correct/wrong answers carry a symbol (✔ / ✘), not only a
colour; feedback areas use `aria-live`. Keep these when adding new controls.

## Rebuilding the single file

```
node tools/bundle.js . CalculusVisualiser_Web.html
```

The bundler inlines every local `<script src>`, `<link rel=stylesheet>` and the KaTeX fonts. It must report `0 font urls left`. Back up the previous
`CalculusVisualiser_Web.html` before overwriting.
