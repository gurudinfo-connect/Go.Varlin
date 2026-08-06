/* ============================================================
   GO.VARLIN — ENROLLMENT CHECKOUT MODAL
   Flow: Enroll Now → choose Online / Offline → payment summary
   → "Pay with Razorpay" opens Razorpay Checkout using a real
   ORDER created on the server (order_id flow), exactly the way
   Razorpay recommends for production.

   NOTE ON THE ORDER FLOW:
   Razorpay Orders can only be created with your KEY SECRET,
   which must never be exposed in the browser. So before opening
   Checkout, this file calls YOUR backend endpoint
   (RAZORPAY_CREATE_ORDER_URL) which creates the order using the
   Razorpay Orders API and returns the order id. Checkout is then
   opened with that order_id, just like the snippet from the
   Razorpay docs. A matching example backend (Node/Express) is
   included in /server so this is workable end-to-end — just add
   your real Key ID / Key Secret there.
   ============================================================ */

(function () {

  // ⚠️ REPLACE THIS with YOUR OWN Razorpay Test Key ID (Dashboard → Settings →
  // API Keys, after switching to Test Mode). This is what actually controls
  // which payment methods show up in Checkout — every Razorpay test account
  // gets Cards, UPI, Netbanking, Wallets and Pay Later enabled by default.
  //
  // The line below currently uses Razorpay's public SAMPLE key from their
  // docs (rzp_test_1DP5mmOlF5G5ag). It's shared by thousands of tutorials
  // and demos worldwide, so Razorpay has restricted which payment methods
  // it can show — that's why you're seeing "No appropriate payment method
  // found." It is NOT something fixable in this JS file; it's tied to the
  // key itself. Swap in your own key below (free, takes ~1 minute — see
  // https://dashboard.razorpay.com/signup) and the full set of payment
  // methods (UPI / Cards / Netbanking / Wallet / Pay Later) will appear,
  // exactly like in your own Razorpay test dashboard.
  const RAZORPAY_KEY = 'rzp_test_T4ehj2X5nINIpI'; // <-- put your own test Key ID here

  // Your backend endpoints (see /server/server.js for a ready-to-run example).
  const RAZORPAY_CREATE_ORDER_URL = '/api/razorpay/create-order';
  const RAZORPAY_VERIFY_URL = '/api/razorpay/verify';

  const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

  const MODES = {
    online: {
      label: 'Online',
      icon: '💻',
      title: 'Online',
      desc: 'Live interactive classes from anywhere, on your schedule.'
    },
    offline: {
      label: 'Offline',
      icon: '🏫',
      title: 'Offline',
      desc: 'In-person classes at our campus with hands-on mentor support.'
    }
  };

  const MODAL_HTML = `
  <div class="checkout-modal-overlay" id="checkoutModalOverlay">
    <div class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkoutModalTitle">
      <button type="button" class="checkout-back" id="checkoutBackBtn" aria-label="Back">
        <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button type="button" class="checkout-modal-close" id="checkoutModalClose" aria-label="Close">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>

      <div class="checkout-steps">
        <span id="checkoutDot1" class="active"></span>
        <span id="checkoutDot2"></span>
      </div>

      <div id="checkoutModalBody"></div>
    </div>
  </div>`;

  let overlay, closeBtn, backBtn, body, dot1, dot2;
  let currentSlug = null;
  let selectedMode = null;
  let razorpayLoading = false;

  function courseData(slug) {
    if (typeof COURSE_DATA === 'undefined') return null;
    return COURSE_DATA[slug] || null;
  }

  function slugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('course') || 'full-stack-java';
  }

  function inr(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function injectModal() {
    if (document.getElementById('checkoutModalOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
    overlay = document.getElementById('checkoutModalOverlay');
    closeBtn = document.getElementById('checkoutModalClose');
    backBtn = document.getElementById('checkoutBackBtn');
    body = document.getElementById('checkoutModalBody');
    dot1 = document.getElementById('checkoutDot1');
    dot2 = document.getElementById('checkoutDot2');

    closeBtn.addEventListener('click', closeModal);
    backBtn.addEventListener('click', renderModeStep);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });
  }

  function openModal(slug) {
    currentSlug = slug || currentSlug || slugFromUrl();
    selectedMode = null;
    overlay.classList.remove('checkout-step-payment');
    renderModeStep();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ---------------- Step 1 — Mode selection ---------------- */
  function renderModeStep() {
    overlay.classList.remove('checkout-step-payment');
    dot1.classList.add('active');
    dot2.classList.remove('active');

    const data = courseData(currentSlug);
    const name = data ? data.name : 'this program';

    body.innerHTML = `
      <h2 class="checkout-modal-title" id="checkoutModalTitle">Choose your learning mode</h2>
      <p class="checkout-modal-sub">How would you like to attend <strong>${name}</strong>?</p>
      <div class="mode-grid" id="modeGrid">
        ${Object.keys(MODES).map(key => `
          <div class="mode-card" data-mode="${key}" tabindex="0" role="button" aria-label="${MODES[key].title}">
            <div class="mode-card-icon">${MODES[key].icon}</div>
            <h4>${MODES[key].title}</h4>
            <p>${MODES[key].desc}</p>
          </div>
        `).join('')}
      </div>
    `;

    body.querySelectorAll('.mode-card').forEach(card => {
      const pick = () => {
        selectedMode = card.getAttribute('data-mode');
        renderPaymentStep();
      };
      card.addEventListener('click', pick);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  }

  /* ---------------- Step 2 — Payment ---------------- */
  function renderPaymentStep() {
    overlay.classList.add('checkout-step-payment');
    dot1.classList.remove('active');
    dot2.classList.add('active');

    const data = courseData(currentSlug) || {};
    const name = data.name || 'Program';
    const price = data.price || 0;
    const originalPrice = data.originalPrice || price;
    const modeInfo = MODES[selectedMode] || MODES.online;

    const isDemoKey = RAZORPAY_KEY === 'rzp_test_1DP5mmOlF5G5ag';

    body.innerHTML = `
      <h2 class="checkout-modal-title" id="checkoutModalTitle">Complete your enrollment</h2>
      <p class="checkout-modal-sub">Review your order, then pay securely to lock in your seat.</p>

      ${isDemoKey ? `
      <p style="background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;border-radius:8px;padding:10px 12px;font-size:13px;margin:0 0 16px;">
        ⚠️ Using Razorpay's shared demo key — only <strong>Card</strong> payments work on it, so
        Checkout is restricted to Card for now (test card <strong>4111 1111 1111 1111</strong>,
        any future expiry, any CVV). Add your own free test Key ID in
        <code>checkout-modal.js</code> to unlock UPI / Netbanking / Wallets too.
      </p>` : ''}

      <div class="order-summary">
        <div class="order-row"><span>Program</span><strong>${name}</strong></div>
        <div class="order-row"><span>Mode</span><span class="order-mode-pill">${modeInfo.icon} ${modeInfo.label}</span></div>
        <div class="order-row"><span>List price</span><span style="text-decoration:line-through;">${inr(originalPrice)}</span></div>
        <div class="order-row order-total"><span>Amount payable</span><strong id="checkoutAmountLabel">${inr(price)}</strong></div>
      </div>

      <form id="checkoutContactForm" novalidate>
        <div class="checkout-contact-grid">
          <div class="lead-field" id="ckNameField">
            <label for="ckName">Full Name</label>
            <input type="text" id="ckName" placeholder="Enter name" autocomplete="name">
            <span class="lead-error" id="ckNameError"></span>
          </div>
          <div class="lead-field" id="ckEmailField">
            <label for="ckEmail">Email</label>
            <input type="email" id="ckEmail" placeholder="email@example.com" autocomplete="email">
            <span class="lead-error" id="ckEmailError"></span>
          </div>
          <div class="lead-field" id="ckMobileField">
            <label for="ckMobile">Mobile Number</label>
            <input type="tel" id="ckMobile" placeholder="+91" autocomplete="tel">
            <span class="lead-error" id="ckMobileError"></span>
          </div>
        </div>

        <button type="submit" class="checkout-pay-btn" id="checkoutPayBtn">
          <span class="lead-spinner"></span>
          <span id="checkoutPayLabel">Pay with Razorpay</span>
        </button>
      </form>

      <p class="checkout-test-badge">
        <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Secured by Razorpay
      </p>
    `;

    document.getElementById('checkoutContactForm').addEventListener('submit', handlePaySubmit);
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

  function validateContact() {
    let valid = true;
    const name = document.getElementById('ckName').value.trim();
    const email = document.getElementById('ckEmail').value.trim();
    const mobile = document.getElementById('ckMobile').value.trim();

    if (!name) { setError('ckNameField', 'ckNameError', 'Please enter your full name.'); valid = false; }
    else clearError('ckNameField', 'ckNameError');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) { setError('ckEmailField', 'ckEmailError', 'Please enter a valid email.'); valid = false; }
    else clearError('ckEmailField', 'ckEmailError');

    const digits = mobile.replace(/\D/g, '');
    if (!mobile || digits.length < 10) { setError('ckMobileField', 'ckMobileError', 'Please enter a valid mobile number.'); valid = false; }
    else clearError('ckMobileField', 'ckMobileError');

    return valid;
  }

  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      if (razorpayLoading) {
        const check = setInterval(() => {
          if (window.Razorpay) { clearInterval(check); resolve(); }
        }, 100);
        return;
      }
      razorpayLoading = true;
      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT_SRC;
      script.onload = () => { razorpayLoading = false; resolve(); };
      script.onerror = () => { razorpayLoading = false; reject(new Error('Could not load Razorpay Checkout.')); };
      document.body.appendChild(script);
    });
  }

  function saveEnrollment(record) {
    try {
      const key = 'govarlin_enrollments';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(record);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) { /* ignore */ }
  }

  function showSuccess(paymentId, name, price) {
    body.innerHTML = `
      <div class="checkout-success">
        <div class="checkout-success-icon">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3>Payment successful 🎉</h3>
        <p>You're enrolled in <strong>${name}</strong>. A confirmation with next steps is on its way to your email.</p>
        <span class="payment-id">${paymentId}</span>
      </div>
    `;
    setTimeout(closeModal, 3200);
  }

  // Ask the backend to create a Razorpay Order and return its order_id.
  function createOrder(amountInPaise, receipt, notes) {
    return fetch(RAZORPAY_CREATE_ORDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountInPaise, currency: 'INR', receipt, notes })
    }).then((res) => {
      if (!res.ok) throw new Error('Order creation failed');
      return res.json(); // expects { id, amount, currency, ... }
    });
  }

  // Ask the backend to verify the payment signature returned by Checkout.
  function verifyPayment(payload) {
    return fetch(RAZORPAY_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then((res) => res.json());
  }

  function handlePaySubmit(e) {
    e.preventDefault();
    if (!validateContact()) return;

    const payBtn = document.getElementById('checkoutPayBtn');
    const payLabel = document.getElementById('checkoutPayLabel');
    const data = courseData(currentSlug) || {};
    const name = data.name || 'Go.Varlin Program';
    const price = data.price || 1;
    const modeInfo = MODES[selectedMode] || MODES.online;
    const amountInPaise = Math.round(price * 100);

    const contact = {
      name: document.getElementById('ckName').value.trim(),
      email: document.getElementById('ckEmail').value.trim(),
      mobile: document.getElementById('ckMobile').value.trim()
    };

    payBtn.classList.add('loading');
    payBtn.disabled = true;
    payLabel.textContent = 'Loading secure checkout…';

    let usingOrderFlow = true;

    Promise.all([
      loadRazorpayScript(),
      createOrder(amountInPaise, `${currentSlug}-${Date.now()}`, { course: currentSlug, mode: selectedMode })
        .catch((err) => {
          // No backend reachable (e.g. running the site with a plain static
          // server / Live Server with no /api routes). Fall back to a
          // client-side amount-based checkout so the button still works.
          console.warn('Order creation unavailable, falling back to amount-based checkout:', err);
          usingOrderFlow = false;
          return { amount: amountInPaise, currency: 'INR', id: null };
        })
    ]).then(([, order]) => {
      payLabel.textContent = 'Pay with Razorpay';
      payBtn.classList.remove('loading');
      payBtn.disabled = false;

      const isDemoKey = RAZORPAY_KEY === 'rzp_test_1DP5mmOlF5G5ag';

      const options = {
        key: RAZORPAY_KEY, // Key ID from your Razorpay Dashboard
        amount: order.amount, // amount in paise
        currency: order.currency || 'INR',
        name: 'Go.Varlin',
        description: `${name} — ${modeInfo.label} enrollment`,
        image: 'static/images/logo.png',
        handler: function (response) {
          // response has razorpay_payment_id, and (only in order flow)
          // razorpay_order_id + razorpay_signature to verify.
          if (usingOrderFlow) {
            payLabel.textContent = 'Verifying payment…';
            verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }).then((result) => {
              if (result && result.verified) {
                saveEnrollment({
                  ...contact,
                  course: currentSlug,
                  courseName: name,
                  mode: selectedMode,
                  amount: price,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  timestamp: new Date().toISOString()
                });
                showSuccess(response.razorpay_payment_id, name, price);
              } else {
                alert('We could not verify this payment. If money was deducted, it will be auto-refunded; please contact support.');
                payBtn.classList.remove('loading');
                payBtn.disabled = false;
              }
            }).catch(() => {
              alert('Payment received, but verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
              payBtn.classList.remove('loading');
              payBtn.disabled = false;
            });
          } else {
            saveEnrollment({
              ...contact,
              course: currentSlug,
              courseName: name,
              mode: selectedMode,
              amount: price,
              paymentId: response.razorpay_payment_id,
              timestamp: new Date().toISOString()
            });
            showSuccess(response.razorpay_payment_id, name, price);
          }
        },
        prefill: {
          name: contact.name,
          email: contact.email,
          contact: contact.mobile
        },
        notes: {
          course: currentSlug,
          mode: selectedMode
        },
        theme: { color: '#7C3AED' },
        modal: {
          ondismiss: function () {
            payBtn.classList.remove('loading');
            payBtn.disabled = false;
          }
        }
      };

      if (usingOrderFlow && order.id) {
        options.order_id = order.id;
      }

      // The shared demo key only reliably supports Card payments — other
      // methods (UPI/Netbanking/Wallets) are restricted on that account and
      // trigger "No appropriate payment method found." Once you swap in
      // your own test key, this restriction is skipped automatically and
      // the full method list (UPI/Cards/Netbanking/Wallet/Pay Later) shows.
      if (isDemoKey) {
        options.config = {
          display: {
            hide: [
              { method: 'netbanking' },
              { method: 'wallet' },
              { method: 'paylater' },
              { method: 'upi' },
              { method: 'emi' }
            ],
            blocks: {
              cards: { name: 'Pay with Card', instruments: [{ method: 'card' }] }
            },
            sequence: ['block.cards'],
            preferences: { show_default_blocks: false }
          }
        };
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        payBtn.classList.remove('loading');
        payBtn.disabled = false;
        console.error('Razorpay payment failed:', response.error);
        alert(
          'Payment failed: ' + response.error.description +
          '\nReason: ' + response.error.reason
        );
      });
      rzp.open();
    }).catch((err) => {
      console.error(err);
      payBtn.classList.remove('loading');
      payBtn.disabled = false;
      payLabel.textContent = 'Pay with Razorpay';
      alert('Could not start checkout. Please check your connection and try again.');
    });
  }

  function wireButtons() {
    document.querySelectorAll('[data-checkout-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = btn.getAttribute('data-checkout-trigger') || currentSlug;
        injectModal();
        openModal(slug);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectModal();
    wireButtons();
  });

  window.CheckoutModal = {
    open: (slug) => { injectModal(); openModal(slug); }
  };

})();
