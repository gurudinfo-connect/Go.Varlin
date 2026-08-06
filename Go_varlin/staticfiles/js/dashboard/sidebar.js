/* ============================================================
   GO.VARLIN LMS — SIDEBAR JS
   Mobile sidebar open/close. Active-state highlighting is handled
   server-side via {% if active_page == ... %} in base_dashboard.html.
   ============================================================ */

(function () {
  const sidebar = document.getElementById('lmsSidebar');
  const toggle = document.getElementById('sidebarToggle');
  if (!sidebar || !toggle) return;

  toggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  document.addEventListener('click', (e) => {
    if (!sidebar.classList.contains('open')) return;
    if (sidebar.contains(e.target) || toggle.contains(e.target)) return;
    sidebar.classList.remove('open');
  });
})();
