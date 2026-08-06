/* ============================================================
   GO.VARLIN — MOBILE REDESIGN ENHANCEMENTS
   Pairs with mobile-redesign.css. Only touches behaviour that
   existing scripts (main.js / slider.js) don't already cover:
   pausing the auto-scrolling marquee while a touch is in progress.
   Hamburger menu, dropdown, testimonial swipe, FAQ accordion,
   etc. are already handled by main.js / slider.js and are left
   untouched.
   ============================================================ */
(function () {
  var track = document.getElementById('marqueeTrack');
  if (!track) return;

  var pause = function () { track.classList.add('mr-paused'); };
  var resume = function () { track.classList.remove('mr-paused'); };

  track.addEventListener('touchstart', pause, { passive: true });
  track.addEventListener('touchend', resume, { passive: true });
  track.addEventListener('touchcancel', resume, { passive: true });
})();
