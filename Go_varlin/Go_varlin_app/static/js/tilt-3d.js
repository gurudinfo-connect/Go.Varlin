/* ============================================================
   TILT-3D
   Adds pointer-driven CSS-3D tilt, layered depth (translateZ)
   and a glare sheen to card-like elements across the site.
   Pairs with static/css/depth-3d.css.

   - Pure CSS 3D transforms (perspective / rotateX / rotateY /
     translateZ). No canvas, no WebGL.
   - Auto-picks up cards that already exist on page load, and
     also watches for cards injected later (course-details.html
     renders most of its content from course-data.js after load).
   - Respects prefers-reduced-motion and disables itself on
     touch-only devices (no hover / no fine pointer).
   ============================================================ */
(function(){
  "use strict";

  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NO_HOVER = window.matchMedia && window.matchMedia('(hover: none)').matches;
  if (REDUCED_MOTION || NO_HOVER) return;

  /* Card-like selectors across the public pages. Anything matching
     gets .tilt-3d + pointer tracking. Selectors are additive and
     safe to run on any page — unmatched ones simply select nothing. */
  const SELECTORS = [
    '.course-card', '.feature-card', '.stat-card', '.testi-card',
    '.compare-card', '.chart-card', '.exp-glass-card', '.faq-item',
    '.hub-avatar-stack', '.float-card', '.enroll-card',
    '.cdet-stat', '.audience-card', '.job-role-item', '.tool-card',
    '.skill-pill', '.project-card', '.placement-card', '.why-card',
    '.benefit-card', '.related-item', '.timeline-card'
  ].join(',');

  /* Inner elements within a tilted card that should pop forward
     on hover, mapped to a translateZ depth in px. First matching
     selector inside a card wins. */
  const DEPTH_MAP = [
    ['.course-icon, .feature-icon, .audience-icon, .why-icon, .benefit-icon, .placement-icon', 34],
    ['.course-tag, .stat-suffix, .jr-num, .related-icon', 22],
    ['h3, h4, .stat-num', 18],
  ];

  const MAX_TILT = 12;      // degrees
  const MAX_LIFT = 14;      // px translateY on hover
  const MAX_TZ = 18;        // px translateZ on hover

  function applyDepthLayers(card){
    DEPTH_MAP.forEach(([sel, z]) => {
      card.querySelectorAll(sel).forEach(el => {
        if (!el.hasAttribute('data-depth')){
          el.setAttribute('data-depth', String(z));
          el.style.setProperty('--depth-z', z + 'px');
        }
      });
    });
  }

  function resetDepthLayers(card){
    card.querySelectorAll('[data-depth]').forEach(el => {
      el.style.setProperty('--depth-z', '0px');
    });
  }

  function popDepthLayers(card){
    card.querySelectorAll('[data-depth]').forEach(el => {
      el.style.setProperty('--depth-z', el.getAttribute('data-depth') + 'px');
    });
  }

  function initCard(card){
    if (card.dataset.tiltInit) return;
    card.dataset.tiltInit = '1';
    card.classList.add('tilt-3d');
    applyDepthLayers(card);

    let raf = null;
    let targetRX = 0, targetRY = 0;

    function onMove(e){
      const rect = card.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;
      const x = point.clientX - rect.left;
      const y = point.clientY - rect.top;
      const px = Math.min(1, Math.max(0, x / rect.width));
      const py = Math.min(1, Math.max(0, y / rect.height));

      targetRY = (px - 0.5) * MAX_TILT;       // left/right -> rotateY
      targetRX = -(py - 0.5) * MAX_TILT;      // up/down -> rotateX

      card.style.setProperty('--mx', (px * 100) + '%');
      card.style.setProperty('--my', (py * 100) + '%');
      card.style.setProperty('--shine-opacity', '1');

      if (!raf){
        raf = requestAnimationFrame(() => {
          card.style.setProperty('--rx', targetRX.toFixed(2) + 'deg');
          card.style.setProperty('--ry', targetRY.toFixed(2) + 'deg');
          card.style.setProperty('--ty', -MAX_LIFT + 'px');
          card.style.setProperty('--tz', MAX_TZ + 'px');
          raf = null;
        });
      }
    }

    function onEnter(){
      card.classList.add('tilt-active', 'tilt-hovered');
      popDepthLayers(card);
    }

    function onLeave(){
      card.classList.remove('tilt-active');
      card.classList.remove('tilt-hovered');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--ty', '0px');
      card.style.setProperty('--tz', '0px');
      card.style.setProperty('--shine-opacity', '0');
      resetDepthLayers(card);
    }

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointerleave', onLeave);
  }

  function scan(root){
    (root || document).querySelectorAll(SELECTORS).forEach(initCard);
  }

  /* ---------- Hero laptop: whole-viewport tilt ---------- */
  function initHeroTilt(){
    const hero = document.getElementById('home');
    const laptop = hero && hero.querySelector('.laptop-mock');
    if (!hero || !laptop) return;

    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      const rx = 8 - (py - 0.5) * 14;   // base tilt +/- range
      const ry = -14 + (px - 0.5) * 20;
      laptop.style.setProperty('--hero-rx', rx.toFixed(2) + 'deg');
      laptop.style.setProperty('--hero-ry', ry.toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', () => {
      laptop.style.setProperty('--hero-rx', '8deg');
      laptop.style.setProperty('--hero-ry', '-14deg');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    scan(document);
    initHeroTilt();

    /* course-details.html (and any future page) injects most of
       its card grids client-side via innerHTML after fetch/build.
       Watch for that and wire up new cards as they land. */
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations){
        if (m.addedNodes && m.addedNodes.length){
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1) scan(node);
          });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
