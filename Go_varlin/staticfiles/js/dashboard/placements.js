/* ============================================================
   GO.VARLIN LMS — PLACEMENT HUB JS
   Apply / withdraw job applications.
   ============================================================ */

(function () {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-apply]');
    if (!btn || btn.disabled) return;
    const jobId = btn.dataset.apply;
    const applied = btn.classList.contains('done');
    // TODO: POST /dashboard/placements/<id>/apply/ (toggle Application row)
    if (applied) {
      btn.classList.remove('done'); btn.classList.add('primary'); btn.textContent = 'Apply Now';
    } else {
      btn.classList.remove('primary'); btn.classList.add('done'); btn.textContent = '✓ Applied';
    }
    console.log('[placements] toggle application', jobId);
  });

  const bookMockBtn = document.getElementById('bookMockBtn');
  if (bookMockBtn) {
    bookMockBtn.addEventListener('click', () => {
      // TODO: POST /dashboard/placements/mock-interview/book/
      alert('Mock interview booking flow goes here.');
    });
  }
})();
