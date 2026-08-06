/* ============================================================
   GO.VARLIN LMS — COURSE PLAYER JS
   Right-panel tabs (Notes/Resources/Discussion/Instructor) and
   Mark as Complete, which should update LessonProgress + the
   parent Enrollment.progress_pct on the backend.
   ============================================================ */

(function () {
  /* ---------- Tabs ---------- */
  document.querySelectorAll('.player-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.player-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.player-tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`[data-tab-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });

  /* ---------- Mark as complete ---------- */
  const completeBtn = document.getElementById('markCompleteBtn');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      const lessonId = completeBtn.dataset.lesson;
      // TODO: POST /dashboard/course-player/lesson/<id>/complete/
      // Backend should upsert LessonProgress(completed=True) and recompute
      // Enrollment.progress_pct = completed_lessons / total_lessons * 100.
      const status = document.getElementById('completionStatus');
      if (status) status.textContent = '✅ Completed';
      completeBtn.textContent = 'Completed';
      completeBtn.disabled = true;
      console.log('[course-player] mark complete', lessonId);
    });
  }
})();
