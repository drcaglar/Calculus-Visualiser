// Registers the "Soru Seti (40)" tab in each chapter that has an exam pool (window.ExamPools filled by the quiz banks).
['numbers', 'functions', 'trig', 'limits', 'derivatives', 'applications', 'engineering', 'integrals'].forEach((chapterId) => {
  if (Topics.get(chapterId).some((d) => d.type === 'examset')) return; // already added by Assessment.register
  Topics.register(chapterId, {
    type: 'examset',
    chapterId,
    tabTitle: () => I18N.tx('Soru Seti', 'Question Set'),
  });
});

// "Sınav Oluşturucu": one more chapter whose single tab mixes the topics of all chapters into one exam
Topics.register('examall', { type: 'examset', chapterId: 'all', tabTitle: () => I18N.tx('Karma Sınav Hazırla', 'Build a Mixed Exam') });
