// Display order of the Calculus II tabs: techniques of integration, applications, differential equations, then quiz and question set.
(function () {
  const ORDER = ['intro', 'parts', 'trigInt', 'trigSub', 'partialFractions', 'numericInt', 'improper', 'volumes', 'shells', 'arcSurface', 'work', 'centroid',
    'fluidForce', 'probDensity', 'slopeField', 'separable', 'linear1', 'deApps', 'autonomous'];
  const list = Topics.get('calc2');
  const rank = (d) => { const i = ORDER.indexOf(d.id || d.type); return i >= 0 ? i : (d.type === 'quiz' ? 1000 : d.type === 'examset' ? 1001 : 500); };
  list.sort((a, b) => rank(a) - rank(b));
})();
