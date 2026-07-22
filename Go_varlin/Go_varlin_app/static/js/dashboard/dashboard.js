/* ============================================================
   GO.VARLIN LMS — DASHBOARD CORE JS
   Shared across every dashboard page: dark mode, course switcher,
   search, profile edit, settings toggles.
   Endpoints marked TODO are where this wires into Django views —
   swap the stub for a real fetch() once the API routes exist.
   ============================================================ */

(function () {
  function csrfToken () {
    const el = document.querySelector('[name=csrfmiddlewaretoken]');
    return el ? el.value : '';
  }

  /* ---------- Dark mode ---------- */
  const themeToggle = document.getElementById('darkModeToggle');
  const settingsThemeToggle = document.getElementById('settingsThemeToggle');
  function applyTheme (dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('govarlin-lms-theme', dark ? 'dark' : 'light');
    if (settingsThemeToggle) settingsThemeToggle.checked = dark;
  }
  const savedTheme = localStorage.getItem('govarlin-lms-theme');
  if (savedTheme) applyTheme(savedTheme === 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(!isDark);
      // TODO: persist to UserSettings.dark_mode via /dashboard/settings/update/
    });
  }
  if (settingsThemeToggle) {
    settingsThemeToggle.addEventListener('change', (e) => applyTheme(e.target.checked));
  }

  /* ---------- Settings notification toggles ---------- */
  ['settingsEmailToggle', 'settingsSmsToggle', 'settingsPushToggle'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      // TODO: POST { field: id, value: el.checked } to /dashboard/settings/update/
      console.log('[settings]', id, el.checked);
    });
  });

  /* ---------- Current course switcher ---------- */
  const switcher = document.getElementById('courseSwitcher');
  if (switcher) {
    switcher.addEventListener('change', (e) => {
      // TODO: set active course in session, e.g. /dashboard/switch-course/<slug>/
      console.log('[course-switch]', e.target.value);
    });
  }

  /* ---------- Search ---------- */
  const searchInput = document.getElementById('lmsSearchInput');
  if (searchInput) {
    let t;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(t);
      t = setTimeout(() => {
        // TODO: GET /dashboard/search/?q=... and render a results dropdown
        console.log('[search]', e.target.value);
      }, 250);
    });
  }

  /* ---------- Generic filter chip groups (practice / assignments / community / calendar / notifications) ---------- */
  document.querySelectorAll('.filter-group').forEach((group) => {
    const key = group.dataset.filter;
    group.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        applyFilters();
      });
    });
  });

  function applyFilters () {
    const activeFilters = {};
    document.querySelectorAll('.filter-group').forEach((group) => {
      const active = group.querySelector('.filter-chip.active');
      if (active) activeFilters[group.dataset.filter] = active.dataset.value;
    });
    const rows = document.querySelectorAll('[data-kind], [data-status], [data-category], [data-read], [data-difficulty], [data-solved]');
    rows.forEach((row) => {
      let visible = true;
      Object.entries(activeFilters).forEach(([key, val]) => {
        if (val === 'all') return;
        const attr = row.dataset[key === 'status' ? 'status' : key];
        if (attr !== undefined && attr !== val) visible = false;
      });
      row.style.display = visible ? '' : 'none';
    });
  }

  /* ---------- Profile edit ---------- */
  const editBtn = document.getElementById('profileEditToggle');
  const saveBtn = document.getElementById('profileSaveBtn');
  const profileForm = document.getElementById('profileForm');
  if (editBtn && profileForm) {
    editBtn.addEventListener('click', () => {
      profileForm.querySelectorAll('input, textarea').forEach((f) => (f.disabled = false));
      editBtn.classList.add('is-hidden');
      saveBtn.classList.remove('is-hidden');
    });
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // TODO: real submit — this form already POSTs to the profile view with enctype multipart/form-data
      profileForm.querySelectorAll('input, textarea').forEach((f) => (f.disabled = true));
      editBtn.classList.remove('is-hidden');
      saveBtn.classList.add('is-hidden');
    });
  }

  /* ---------- Delete account confirm ---------- */
  const deleteBtn = document.getElementById('deleteAccountBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('This permanently deletes your account, enrollments and history. Continue?')) {
        // TODO: POST to /dashboard/settings/delete-account/
        console.log('[settings] delete account confirmed');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', applyFilters);
})();
