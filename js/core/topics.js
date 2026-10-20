// Registry topic modules add themselves to (js/topics/numbers/*.js, js/topics/functions/*.js).
// Registration order is display order.
const Topics = (() => {
  const byChapter = {};
  function register(chapterId, def) {
    def._chapter = chapterId;
    (byChapter[chapterId] = byChapter[chapterId] || []).push(def);
  }
  function get(chapterId) {
    return byChapter[chapterId] || [];
  }
  return { register, get };
})();
