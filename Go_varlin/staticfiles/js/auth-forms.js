/* ============================================================
   GO.VARLIN — SIGN UP / SIGN IN FORMS
   Client-side validation, password visibility toggle, password
   strength meter, and a simulated submit -> success state swap.
   No backend wired up.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Password show/hide ---------- */
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.classList.toggle('is-visible', !showing);
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });

  /* ---------- Password strength meter (signup only) ---------- */
  const pw = document.getElementById('suPassword');
  const strengthBars = document.querySelectorAll('#pwStrength span');
  const strengthLabel = document.getElementById('pwStrengthLabel');
  const strengthColors = ['#EF4444', '#F59E0B', '#38BDF8', '#14B8A6'];
  const strengthText = ['Weak — add numbers, symbols or length.', 'Fair — try mixing cases and symbols.', 'Good — almost a strong password.', 'Strong password.'];

  function scorePassword(value){
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return Math.min(score, 4);
  }

  if (pw && strengthBars.length){
    pw.addEventListener('input', () => {
      const value = pw.value;
      const score = value ? scorePassword(value) : 0;
      strengthBars.forEach((bar, i) => {
        bar.style.background = i < score ? strengthColors[Math.max(score - 1, 0)] : 'var(--border)';
      });
      if (strengthLabel){
        strengthLabel.textContent = value ? strengthText[Math.max(score - 1, 0)] : 'Use 8+ characters with a mix of letters and numbers.';
      }
    });
  }

  /* ---------- Shared field-level validation helpers ---------- */
  function setFieldError(field, message){
    const wrap = field.closest('.auth-field');
    if (!wrap) return;
    const errorEl = wrap.querySelector('.auth-error');
    if (message){
      wrap.classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
    } else {
      wrap.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
    }
  }

  function isValidEmail(value){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /* ---------- Sign Up form ---------- */
  const signupForm = document.getElementById('signupForm');
  if (signupForm){
    const successBox = document.getElementById('signupSuccess');

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const name = signupForm.querySelector('#suName');
      const email = signupForm.querySelector('#suEmail');
      const password = signupForm.querySelector('#suPassword');
      const confirm = signupForm.querySelector('#suConfirm');

      if (!name.value.trim()){
        setFieldError(name, 'Please enter your full name.'); valid = false;
      } else setFieldError(name, '');

      if (!email.value.trim() || !isValidEmail(email.value.trim())){
        setFieldError(email, 'Please enter a valid email address.'); valid = false;
      } else setFieldError(email, '');

      if (!password.value || password.value.length < 8){
        setFieldError(password, 'Password must be at least 8 characters.'); valid = false;
      } else setFieldError(password, '');

      if (!confirm.value || confirm.value !== password.value){
        setFieldError(confirm, 'Passwords do not match.'); valid = false;
      } else setFieldError(confirm, '');

      if (!valid) return;

      const btn = signupForm.querySelector('button[type="submit"]');
      const label = btn.querySelector('span:last-child');
      const originalLabel = label ? label.textContent : '';
      if (label) label.textContent = 'Creating account…';
      btn.classList.add('loading');
      btn.disabled = true;

      setTimeout(() => {
        signupForm.classList.add('is-hidden');
        document.querySelector('.auth-social-row').classList.add('is-hidden');
        document.querySelector('.auth-divider').classList.add('is-hidden');
        if (successBox) successBox.classList.add('show');
        if (label) label.textContent = originalLabel;
        btn.classList.remove('loading');
        btn.disabled = false;

        /* Create the local session so Sign In can pick up this learner. */
        try {
          localStorage.setItem('govarlin-session', JSON.stringify({
            name: name.value.trim(),
            email: email.value.trim(),
            joined: new Date().toISOString()
          }));
        } catch (e) { /* ignore storage errors */ }
      }, 900);
    });
  }

  /* ---------- Sign In form ---------- */
  const signinForm = document.getElementById('signinForm');
  if (signinForm){
    const successBox = document.getElementById('signinSuccess');

    signinForm.addEventListener('submit', (e) => {
      // e.preventDefault();
      let valid = true;

      const email = signinForm.querySelector('#siEmail');
      const password = signinForm.querySelector('#siPassword');

      if (!email.value.trim() || !isValidEmail(email.value.trim())) {
        setFieldError(email, 'Please enter a valid email address.');
        valid = false;
      }

      if (!password.value){
        setFieldError(password, 'Please enter your password.'); valid = false;
      } else setFieldError(password, '');

      if (!valid) return;

      const btn = signinForm.querySelector('button[type="submit"]');
      const label = btn.querySelector('span:last-child');
      const originalLabel = label ? label.textContent : '';
      if (label) label.textContent = 'Signing in…';
      btn.classList.add('loading');
      btn.disabled = true;

    });
  }

});
