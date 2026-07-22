/* ============================================================
   GO.VARLIN — ACCESS CURRICULUM MODAL
   Injects the lead-capture modal, wires it to any button with
   [data-lead-download], validates the form, then triggers the
   correct course brochure download.
   ============================================================ */

(function () {

  const MODAL_HTML = `
  <div class="lead-modal-overlay" id="leadModalOverlay">
    <div class="lead-modal" role="dialog" aria-modal="true" aria-labelledby="leadModalTitle">
      <button type="button" class="lead-modal-close" id="leadModalClose" aria-label="Close">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>

      <div id="leadModalBody">
        <h2 class="lead-modal-title" id="leadModalTitle">Access Curriculum</h2>
        <p class="lead-modal-sub">Enter your details to receive the professional roadmap.</p>

        <form id="leadForm" novalidate>
          <div class="lead-field" id="leadNameField">
            <label for="leadName">Full Name</label>
            <input type="text" id="leadName" name="name" placeholder="Enter name" autocomplete="name">
            <span class="lead-error" id="leadNameError"></span>
          </div>

          <div class="lead-field" id="leadEmailField">
            <label for="leadEmail">Email Address</label>
            <input type="email" id="leadEmail" name="email" placeholder="email@example.com" autocomplete="email">
            <span class="lead-error" id="leadEmailError"></span>
          </div>

          <div class="lead-field" id="leadMobileField">
            <label for="leadMobile">Mobile Number</label>
            <input type="tel" id="leadMobile" name="mobile" placeholder="+91" autocomplete="tel">
            <span class="lead-error" id="leadMobileError"></span>
          </div>

          <div class="lead-field" id="leadCourseField">
            <label for="leadCourse">Select Course</label>
            <select id="leadCourse" name="course"></select>
          </div>

          <button type="submit" class="lead-submit-btn" id="leadSubmitBtn">
            <span class="lead-spinner"></span>
            <span id="leadSubmitLabel">Submit &amp; Download PDF</span>
          </button>
        </form>
      </div>
    </div>
  </div>`;

  let overlay, closeBtn, form, courseSelect, submitBtn, submitLabel, modalBody;
  let currentSlug = null;

  function injectModal() {
    if (document.getElementById('leadModalOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
    overlay = document.getElementById('leadModalOverlay');
    closeBtn = document.getElementById('leadModalClose');
    form = document.getElementById('leadForm');
    courseSelect = document.getElementById('leadCourse');
    submitBtn = document.getElementById('leadSubmitBtn');
    submitLabel = document.getElementById('leadSubmitLabel');
    modalBody = document.getElementById('leadModalBody');

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
    if (typeof COURSE_DATA === 'undefined') return;
    courseSelect.innerHTML = Object.keys(COURSE_DATA)
      .map((slug) => `<option value="${slug}">${COURSE_DATA[slug].name}</option>`)
      .join('');
  }

  function openModal(slug) {
    currentSlug = slug || currentSlug || Object.keys(COURSE_DATA || {})[0];
    if (courseSelect && currentSlug) courseSelect.value = currentSlug;
    resetFormView();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('leadName')?.focus(), 300);
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function resetFormView() {
    if (!form) return;
    form.classList.remove('is-hidden');
    form.reset();
    ['leadNameField', 'leadEmailField', 'leadMobileField'].forEach((id) => {
      document.getElementById(id)?.classList.remove('has-error');
    });
    ['leadNameError', 'leadEmailError', 'leadMobileError'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    submitLabel.textContent = 'Submit & Download PDF';
    const success = document.getElementById('leadSuccessView');
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
    const name = document.getElementById('leadName').value.trim();
    const email = document.getElementById('leadEmail').value.trim();
    const mobile = document.getElementById('leadMobile').value.trim();

    if (!name) {
      setError('leadNameField', 'leadNameError', 'Please enter your full name.');
      valid = false;
    } else {
      clearError('leadNameField', 'leadNameError');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      setError('leadEmailField', 'leadEmailError', 'Please enter a valid email address.');
      valid = false;
    } else {
      clearError('leadEmailField', 'leadEmailError');
    }

    const digits = mobile.replace(/\D/g, '');
    if (!mobile || digits.length < 10) {
      setError('leadMobileField', 'leadMobileError', 'Please enter a valid mobile number.');
      valid = false;
    } else {
      clearError('leadMobileField', 'leadMobileError');
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
      /* localStorage unavailable — fail silently, download still proceeds */
    }
  }

  function triggerDownload(slug) {
    const data = (typeof COURSE_DATA !== 'undefined') ? COURSE_DATA[slug] : null;
    const name = data ? data.name : slug;
    const link = document.createElement('a');
    link.href = `static/brochures/${slug}-brochure.pdf`;
    link.download = `Go.Varlin - ${name} Brochure.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function showSuccess(courseName) {
    form.classList.add('is-hidden');
    const successHtml = `
      <div class="lead-success" id="leadSuccessView">
        <div class="lead-success-icon">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3>You're all set!</h3>
        <p>Your ${courseName} curriculum PDF is downloading now.<br>We've also emailed a copy of the roadmap to you.</p>
      </div>`;
    modalBody.insertAdjacentHTML('beforeend', successHtml);
    setTimeout(closeModal, 2400);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const slug = courseSelect.value;
    const lead = {
      name: document.getElementById('leadName').value.trim(),
      email: document.getElementById('leadEmail').value.trim(),
      mobile: document.getElementById('leadMobile').value.trim(),
      course: slug,
      courseName: (COURSE_DATA[slug] || {}).name || slug,
      timestamp: new Date().toISOString()
    };

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    submitLabel.textContent = 'Submitting…';

    setTimeout(() => {
      saveLead(lead);
      triggerDownload(slug);
      showSuccess(lead.courseName);
    }, 500);
  }

  function wireButtons() {
    document.querySelectorAll('[data-lead-download]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slug = btn.getAttribute('data-lead-download') || currentSlug;
        openModal(slug);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectModal();
    wireButtons();
  });

  // Expose for pages that resolve the course slug dynamically (e.g. course-details.js)
  window.LeadModal = {
    open: (slug) => {
      injectModal();
      openModal(slug);
    }
  };

})();
