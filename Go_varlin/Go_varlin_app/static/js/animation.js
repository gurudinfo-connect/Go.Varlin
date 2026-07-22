/* ============================================================
   GO.VARLIN — ANIMATION.JS
   AOS init + GSAP scroll-triggered flourishes
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- AOS ---------- */
  if (window.AOS){
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60
    });
    // AOS calculates element offsets on init, before web fonts/images finish
    // loading — that can shift layout enough that below-the-fold elements
    // never cross the "in view" threshold, leaving them stuck at opacity:0
    // forever (since once:true). Re-measure once everything has settled.
    window.addEventListener('load', () => setTimeout(() => AOS.refreshHard(), 200));
  }

  /* ---------- GSAP hero entrance (independent of ScrollTrigger) ---------- */
  // This sequence only needs core GSAP. It used to be nested inside the
  // "gsap && ScrollTrigger" block below, which meant a single flaky CDN
  // request for ScrollTrigger.min.js could silently skip the entire hero
  // reveal, leaving the headline/stats/visual invisible. Runs on its own now.
  if (window.gsap){
    gsap.timeline({ delay: 0.3 })
      .from('.hero-badge', { opacity: 0, y: 16, duration: 0.6, ease: 'power3.out' })
      .from('.hero-title', { opacity: 0, y: 26, duration: 0.7, ease: 'power3.out' }, '-=0.3')
      .from('.hero-sub', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .from('.hero-actions', { opacity: 0, y: 16, duration: 0.6, ease: 'power3.out' }, '-=0.35')
      .from('.hero-stats', { opacity: 0, y: 16, duration: 0.6, ease: 'power3.out' }, '-=0.35')
      .from('.hero-visual', { opacity: 0, x: 40, duration: 0.9, ease: 'power3.out' }, '-=0.9');
  }

  /* ---------- GSAP scroll-triggered flourishes (need ScrollTrigger) ---------- */
  if (window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);

    /* Section headings text reveal */
    gsap.utils.toArray('.section-head h2').forEach(el => {
      gsap.from(el, {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    /* Parallax on hero blobs */
    gsap.to('.blob-1', {
      y: 80,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.blob-2', {
      y: -60,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    /* CTA scale-in */
    gsap.from('.cta-inner', {
      scale: 0.94,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.cta-inner', start: 'top 85%' }
    });

    /* Learning experience image reveal */
    gsap.from('.exp-image', {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: '.experience', start: 'top 75%' }
    });
  }

});
