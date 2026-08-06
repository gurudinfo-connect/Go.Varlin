/* ============================================================
   GO.VARLIN LMS — PRACTICE JS
   Filter chips are handled generically in dashboard.js.
   This file covers bookmarking a problem.
   ============================================================ */

(function () {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-bookmark]');
    if (!btn) return;
    const problemId = btn.dataset.bookmark;
    // TODO: POST /dashboard/practice/<id>/bookmark/ toggling PracticeAttempt.bookmarked
    btn.classList.toggle('primary');
    console.log('[practice] toggle bookmark', problemId);
  });
})();
