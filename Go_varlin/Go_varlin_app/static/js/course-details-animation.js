/* ============================================================
   GO.VARLIN — COURSE-DETAILS-ANIMATION.JS (fast, dependency-free)
   Replaces the previous GSAP + ScrollTrigger + AOS setup, which
   pulled in 3 external libraries and did double scroll-position
   polling — the main reason this page loaded/felt slow.

   The hero's entrance is handled entirely in CSS (see
   course-details.css → "LIGHTWEIGHT ANIMATIONS"), so it paints
   immediately with zero JS cost. This script only owns the tiny
   bit of work that genuinely needs JS: revealing the below-the-
   fold [data-aos] elements (43 of them, injected dynamically by
   course-details.js) as they scroll into view, using a single
   native IntersectionObserver instead of a third-party library.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const targets = document.querySelectorAll('[data-aos]');

  // Respect reduced-motion / very low-end devices: skip all JS-driven motion
  // and just show everything — CSS already handles this via the
  // prefers-reduced-motion media query, this just mirrors it in JS so we
  // don't bother setting up observers/scroll listeners for nothing.
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    // Skip all motion, but still show final content instantly (no animation, no scroll polling).
    targets.forEach(el => el.classList.add('in-view'));
    document.querySelectorAll('[data-aos-stagger] > *').forEach(el => el.classList.add('stagger-in'));
    document.querySelectorAll('.cdet-stat .stat-num[data-count]').forEach(el => {
      if (el.textContent.trim() === '0') el.textContent = el.getAttribute('data-count');
    });
    return;
  }

  const hasIO = 'IntersectionObserver' in window;

  if (!hasIO) {
    // Very old browser fallback: just show everything immediately, for every
    // feature below (not just [data-aos]), then bail — no observers to set up.
    targets.forEach(el => el.classList.add('in-view'));
    document.querySelectorAll('[data-aos-stagger] > *').forEach(el => el.classList.add('stagger-in'));
    document.querySelectorAll('.cdet-stat .stat-num[data-count]').forEach(el => {
      if (el.textContent.trim() === '0') el.textContent = el.getAttribute('data-count');
    });
    return;
  }

  if (targets.length) {

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.getAttribute('data-aos-delay') || '0', 10);
      if (delay) {
        el.style.transitionDelay = Math.min(delay, 400) + 'ms';
      }
      el.classList.add('in-view');
      observer.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => observer.observe(el));

  // Belt-and-braces: never leave anything permanently invisible.
  setTimeout(() => {
    targets.forEach(el => el.classList.add('in-view'));
  }, 1500);

  } // end [data-aos] block

  /* --------------------------------------------------------------
     Staggered grid reveal — tools/skills/projects/why/placement/
     benefits/related/faq cards. Grids are populated by
     course-details.js which runs before this file, so children
     already exist by the time we get here. One observer watches
     the *container*; when it enters view we stagger its children
     via transition-delay (CSS animates opacity/transform — cheap).
     -------------------------------------------------------------- */
  const staggerContainers = document.querySelectorAll('[data-aos-stagger]');
  if (staggerContainers.length) {
    const revealOne = (child, i) => {
      child.style.transitionDelay = Math.min(i * 55, 500) + 'ms';
      child.classList.add('stagger-in');
    };
    const revealAll = (container) => {
      Array.from(container.children).forEach(revealOne);
    };

    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const container = entry.target;
        revealAll(container);
        container.dataset.staggerReady = '1';
        staggerObserver.unobserve(container);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    staggerContainers.forEach(c => staggerObserver.observe(c));

    // Safety net: if course-details.js injects cards into a grid *after*
    // that grid already scrolled into view and got revealed (e.g. an
    // async data fetch that resolves late), those late cards would
    // otherwise stay at opacity:0 forever. Watch for that and reveal
    // them the moment they land.
    if ('MutationObserver' in window) {
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          const container = m.target;
          if (container.dataset.staggerReady !== '1') return;
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1 || node.classList.contains('stagger-in')) return;
            revealOne(node, Array.from(container.children).indexOf(node));
          });
        });
      });
      staggerContainers.forEach(c => mutationObserver.observe(c, { childList: true }));
    }

    // Belt-and-braces: whatever exists by now, reveal it — and again a bit
    // later in case data loaded slowly, catching anything the observers missed.
    setTimeout(() => staggerContainers.forEach(revealAll), 1800);
    setTimeout(() => staggerContainers.forEach(revealAll), 4000);
  }

  /* --------------------------------------------------------------
     Animated stat counters (94% / 50+ / 120+ / 1:1). Guarded so it
     only runs once per element and never fights another script.
     -------------------------------------------------------------- */
  const statEls = document.querySelectorAll('.cdet-stat .stat-num[data-count]');
  if (statEls.length) {
    const animateCount = (el) => {
      // Only ever act once, and only if nothing else has already populated this number.
      if (el.dataset.counted === '1' || el.textContent.trim() !== '0') return;
      el.dataset.counted = '1';
      const target = parseFloat(el.getAttribute('data-count')) || 0;
      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
        el.textContent = Math.round(target * eased);
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target;
          el.closest('.cdet-stat')?.classList.add('counted');
        }
      };
      requestAnimationFrame(step);
    };
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    statEls.forEach(el => statObserver.observe(el));
  }

  /* --------------------------------------------------------------
     Single rAF-batched scroll loop driving:
       1) the top reading-progress bar
       2) the syllabus timeline's scroll-fill accent line
     One 'scroll' listener, one requestAnimationFrame per frame —
     avoids the double scroll-polling that made the old GSAP/
     ScrollTrigger setup slow.
     -------------------------------------------------------------- */
  const progressBar = document.getElementById('pageScrollProgress');
  const timelineWrap = document.querySelector('.timeline-wrap');
  const timelineFill = document.getElementById('timelineFill');

  if (progressBar || (timelineWrap && timelineFill)) {
    let scrollTicking = false;

    const updateOnScroll = () => {
      if (progressBar) {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - doc.clientHeight;
        const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
        progressBar.style.width = pct + '%';
      }
      if (timelineWrap && timelineFill) {
        const rect = timelineWrap.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height + vh * 0.5;
        const passed = vh * 0.85 - rect.top;
        const pct = Math.min(100, Math.max(0, (passed / total) * 100));
        timelineFill.style.height = pct + '%';
      }
      scrollTicking = false;
    };

    updateOnScroll();
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(updateOnScroll);
        scrollTicking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', updateOnScroll);
  }

});
