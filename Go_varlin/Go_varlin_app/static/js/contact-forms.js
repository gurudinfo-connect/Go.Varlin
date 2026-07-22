/* ============================================================
   GO.VARLIN — CONTACT / HIRE CONNECT FORMS
   Lightweight client-side validation + success state swap.
   No backend wired up: this only simulates a submission.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  function wireForm(formId, successId, successTitle, successText){
    const form = document.getElementById(formId);
    const success = document.getElementById(successId);
    if (!form || !success) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;
      form.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()){
          valid = false;
          field.style.borderColor = '#EF4444';
        } else {
          field.style.borderColor = 'transparent';
        }
      });
      if (!valid) return;

      const btn = form.querySelector('button[type="submit"]');
      const label = btn.querySelector('span');
      const originalLabel = label ? label.textContent : '';
      if (label) label.textContent = 'Sending…';
      btn.disabled = true;

      setTimeout(() => {
        form.classList.add('is-hidden');
        success.querySelector('h4').textContent = successTitle;
        success.querySelector('p').textContent = successText;
        success.classList.add('show');
        if (label){ label.textContent = originalLabel; }
        btn.disabled = false;
      }, 900);
    });
  }

  wireForm(
    'contactForm',
    'contactSuccess',
    'Message sent!',
    'Thanks for reaching out — our team will get back to you within 2 hours.'
  );

  wireForm(
    'hireForm',
    'hireSuccess',
    'Request received!',
    'Our placement team will contact you within 24 hours to discuss your hiring needs.'
  );

});
