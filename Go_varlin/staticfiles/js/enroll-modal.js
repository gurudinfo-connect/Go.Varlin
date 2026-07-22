/* ============================================================
   GO.VARLIN — ENROLL / CONTACT POPUP (Welcome page)
   Injects a lead-capture modal (reuses css/lead-modal.css styles),
   wired to any element with [data-enroll-trigger]. Collects
   name, email, mobile and course interest so the team can call
   the lead back — no navigation, no file download.
   ============================================================ */

(function () {

  const MODAL_HTML = `
  <div class="lead-modal-overlay" id="enrollModalOverlay">
    <div class="lead-modal" role="dialog" aria-modal="true" aria-labelledby="enrollModalTitle">
      <button type="button" class="lead-modal-close" id="enrollModalClose" aria-label="Close">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>

      <div id="enrollModalBody">
        <h2 class="lead-modal-title" id="enrollModalTitle">Enroll Your Interest</h2>
        <p class="lead-modal-sub">Share your details and our admissions team will call you back to help you get started.</p>

        <form id="enrollForm" novalidate>
          <div class="lead-field" id="enrollNameField">
            <label for="enrollName">Full Name</label>
            <input type="text" id="enrollName" name="name" placeholder="Enter name" autocomplete="name">
            <span class="lead-error" id="enrollNameError"></span>
          </div>

          <div class="lead-field" id="enrollEmailField">
            <label for="enrollEmail">Email Address</label>
            <input type="email" id="enrollEmail" name="email" placeholder="email@example.com" autocomplete="email">
            <span class="lead-error" id="enrollEmailError"></span>
          </div>

          <div class="lead-field" id="enrollMobileField">
            <label for="enrollMobile">Mobile Number</label>
            <input type="tel" id="enrollMobile" name="mobile" placeholder="+91" autocomplete="tel">
            <span class="lead-error" id="enrollMobileError"></span>
          </div>

          <div class="lead-field" id="enrollCourseField">
            <label for="enrollCourse">Interested Course</label>
            <select id="enrollCourse" name="course"></select>
          </div>

          <button type="submit" class="lead-submit-btn" id="enrollSubmitBtn">
            <span class="lead-spinner"></span>
            <span id="enrollSubmitLabel">Notify My Team</span>
          </button>
        </form>
      </div>
    </div>
  </div>`;

  let overlay, closeBtn, form, courseSelect, submitBtn, submitLabel, modalBody;
  let currentSlug = null;

  function injectModal() {
    if (document.getElementById('enrollModalOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
    overlay = document.getElementById('enrollModalOverlay');
    closeBtn = document.getElementById('enrollModalClose');
    form = document.getElementById('enrollForm');
    courseSelect = document.getElementById('enrollCourse');
    submitBtn = document.getElementById('enrollSubmitBtn');
    submitLabel = document.getElementById('enrollSubmitLabel');
    modalBody = document.getElementById('enrollModalBody');

    populateCourses();

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });
    form.addEventListener('submit', handleSubmit);
  }

  function populateCourses() {
    if (typeof COURSE_DATA === 'undefined') {
      courseSelect.innerHTML = '<option value="general">Not sure yet — advise me</option>';
      return;
    }
    courseSelect.innerHTML = Object.keys(COURSE_DATA)
      .map((slug) => `<option value="${slug}">${COURSE_DATA[slug].name}</option>`)
      .join('') + '<option value="general">Not sure yet — advise me</option>';
  }

  function openModal(slug) {
    currentSlug = slug || currentSlug;
    if (courseSelect && currentSlug) courseSelect.value = currentSlug;
    resetFormView();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('enrollName')?.focus(), 300);
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function resetFormView() {
    if (!form) return;
    form.classList.remove('is-hidden');
    form.reset();
    ['enrollNameField', 'enrollEmailField', 'enrollMobileField'].forEach((id) => {
      document.getElementById(id)?.classList.remove('has-error');
    });
    ['enrollNameError', 'enrollEmailError', 'enrollMobileError'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    submitLabel.textContent = 'Notify My Team';
    const success = document.getElementById('enrollSuccessView');
    if (success) success.remove();
  }

  function setError(fieldId, errorId, message) {
    document.getElementById(fieldId)?.classList.add('has-error');
    const el = document.getElementById(errorId);
    if (el) el.textContent = message;
  }

  function clearError(fieldId, errorId) {
    document.getElementById(fieldId)?.classList.remove('has-error');
    const el = document.getElementById(errorId);
    if (el) el.textContent = '';
  }

  function validate() {
    let valid = true;
    const name = document.getElementById('enrollName').value.trim();
    const email = document.getElementById('enrollEmail').value.trim();
    const mobile = document.getElementById('enrollMobile').value.trim();

    if (!name) {
      setError('enrollNameField', 'enrollNameError', 'Please enter your full name.');
      valid = false;
    } else {
      clearError('enrollNameField', 'enrollNameError');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      setError('enrollEmailField', 'enrollEmailError', 'Please enter a valid email address.');
      valid = false;
    } else {
      clearError('enrollEmailField', 'enrollEmailError');
    }

    const digits = mobile.replace(/\D/g, '');
    if (!mobile || digits.length < 10) {
      setError('enrollMobileField', 'enrollMobileError', 'Please enter a valid mobile number.');
      valid = false;
    } else {
      clearError('enrollMobileField', 'enrollMobileError');
    }

    return valid;
  }

  function saveLead(lead) {
    try {
      const key = 'govarlin_leads';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(lead);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      /* localStorage unavailable — fail silently */
    }
  }

  function showSuccess() {
    form.classList.add('is-hidden');
    const successHtml = `
      <div class="lead-success" id="enrollSuccessView">
        <div class="lead-success-icon">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3>Thanks — you're on our list!</h3>
        <p>Our admissions team has your details and will reach out shortly to help you enroll.</p>
      </div>`;
    modalBody.insertAdjacentHTML('beforeend', successHtml);
    setTimeout(closeModal, 2600);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const slug = courseSelect.value;
    const lead = {
      name: document.getElementById('enrollName').value.trim(),
      email: document.getElementById('enrollEmail').value.trim(),
      mobile: document.getElementById('enrollMobile').value.trim(),
      course: slug,
      courseName: (typeof COURSE_DATA !== 'undefined' && COURSE_DATA[slug]) ? COURSE_DATA[slug].name : slug,
      source: 'welcome-page',
      timestamp: new Date().toISOString()
    };

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    submitLabel.textContent = 'Submitting…';

    setTimeout(() => {
      saveLead(lead);
      showSuccess();
    }, 700);
  }

  function wireButtons() {
    document.querySelectorAll('[data-enroll-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = btn.getAttribute('data-enroll-trigger') || currentSlug;
        injectModal();
        openModal(slug);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectModal();
    wireButtons();
  });

  window.EnrollModal = {
    open: (slug) => {
      injectModal();
      openModal(slug);
    }
  };

})();
