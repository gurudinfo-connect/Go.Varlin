/* ============================================================
   GO.VARLIN — MAIN.JS
   Nav behaviour, theme toggle, mobile menu, counters,
   marquee, particles, FAQ accordion, cursor glow, ripple
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Page loader ---------- */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('done'), 500);
  });
  // fallback in case load event is delayed
  setTimeout(() => loader.classList.add('done'), 2500);

  /* ---------- AOS fail-safe ---------- */
  // If the AOS or GSAP CDN scripts are slow, blocked (ad-blocker/corporate
  // proxy) or race against web-font loading, [data-aos] elements can be left
  // permanently at opacity:0 since AOS only reveals them once, on its own
  // schedule. This guarantees every animated element is visible no matter
  // what happens with those third-party scripts.
  setTimeout(() => {
    document.querySelectorAll('[data-aos]').forEach(el => el.classList.add('aos-animate'));
  }, 2000);

  /* ---------- Sticky navbar ---------- */
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');

  /* ---------- Nav sliding pill indicator ---------- */
  const navLinksWrap = document.getElementById('navLinks');
  const navIndicator = document.getElementById('navIndicator');
  let restIndicator = () => {};
  if (navLinksWrap && navIndicator){
    const navItems = [...navLinksWrap.querySelectorAll(':scope > a')];

    const moveIndicatorTo = (el) => {
      if (!el) return;
      navIndicator.style.left = el.offsetLeft + 'px';
      navIndicator.style.width = el.offsetWidth + 'px';
      navLinksWrap.classList.add('indicator-ready');
    };

    restIndicator = () => {
      const active = navLinksWrap.querySelector(':scope > a.active');
      if (active) moveIndicatorTo(active);
      else navLinksWrap.classList.remove('indicator-ready');
    };

    navItems.forEach(item => {
      item.addEventListener('mouseenter', () => moveIndicatorTo(item));
    });
    navLinksWrap.addEventListener('mouseleave', restIndicator);
    window.addEventListener('resize', restIndicator);
    setTimeout(restIndicator, 400);
  }

  /* ---------- Active nav link on scroll ---------- */
  // Only treat pure in-page anchors ("#id") as scroll-spy targets — links that
  // point to another page (e.g. "index.html#contact") are left untouched.
  const navLinks = document.querySelectorAll('.nav-links a');
  const anchorLinks = [...navLinks].filter(l => (l.getAttribute('href') || '').startsWith('#'));
  const sections = anchorLinks.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);

  function updateActiveNav(){
    if (!sections.length) return;
    let current = sections[0];
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 140) current = sec;
    });
    anchorLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + current.id);
    });
    restIndicator();
  }

  const onScroll = () => {
    if (navbar){
      if (window.scrollY > 40) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }

    if (backToTop){
      if (window.scrollY > 600) backToTop.classList.add('show');
      else backToTop.classList.remove('show');
    }

    updateActiveNav();
  };
  window.addEventListener('scroll', onScroll);
  onScroll();

  if (backToTop){
    backToTop.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
  }

  /* ---------- Mobile menu ---------- */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const backdrop = document.createElement('div');
  backdrop.className = 'menu-backdrop';
  document.body.appendChild(backdrop);

  function toggleMenu(open){
    hamburger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  hamburger.addEventListener('click', () => toggleMenu(!mobileMenu.classList.contains('open')));
  backdrop.addEventListener('click', () => toggleMenu(false));
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- Desktop courses dropdown (click/tap toggle) ---------- */
  const coursesDropToggle = document.getElementById('coursesDropToggle');
  if (coursesDropToggle){
    const dropWrap = coursesDropToggle.closest('.nav-dropdown');
    coursesDropToggle.setAttribute('aria-expanded', 'false');

    const closeDrop = () => {
      dropWrap.classList.remove('open');
      coursesDropToggle.setAttribute('aria-expanded', 'false');
    };

    coursesDropToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropWrap.classList.toggle('open');
      coursesDropToggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!dropWrap.contains(e.target)) closeDrop();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrop();
    });

    dropWrap.querySelectorAll('.nav-dropdown-menu a').forEach(a => {
      a.addEventListener('click', closeDrop);
    });
  }

  /* ---------- Mobile courses accordion ---------- */
  const mobileCoursesToggle = document.getElementById('mobileCoursesToggle');
  if (mobileCoursesToggle){
    mobileCoursesToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileCoursesToggle.closest('.mobile-courses').classList.toggle('open');
    });
  }

  /* ---------- Search toggle ---------- */
  const searchToggle = document.getElementById('searchToggle');
  const searchBox = document.getElementById('searchBox');
  if (searchToggle && searchBox){
    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      searchBox.classList.toggle('open');
      if (searchBox.classList.contains('open')) searchBox.querySelector('input').focus();
    });
    document.addEventListener('click', (e) => {
      if (!searchBox.contains(e.target) && e.target !== searchToggle) searchBox.classList.remove('open');
    });
  }

  /* ---------- Dark mode toggle ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('govarlin-theme');
  if (savedTheme === 'dark') root.setAttribute('data-theme','dark');

  if (themeToggle){
    themeToggle.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      if (isDark){ root.removeAttribute('data-theme'); localStorage.setItem('govarlin-theme','light'); }
      else { root.setAttribute('data-theme','dark'); localStorage.setItem('govarlin-theme','dark'); }
      document.dispatchEvent(new CustomEvent('govarlin-theme-change', { detail: { dark: !isDark } }));
    });
  }

  /* ---------- Button press feedback (simple, contained — no ripple blob) ---------- */
  document.querySelectorAll('.btn-anim').forEach(btn => {
    btn.addEventListener('click', function(){
      this.classList.remove('btn-press');
      // restart the animation even on rapid repeat clicks
      void this.offsetWidth;
      this.classList.add('btn-press');
    });
    btn.addEventListener('animationend', function(){
      this.classList.remove('btn-press');
    });
  });

  /* ---------- Marquee: duplicate logo set for seamless loop ---------- */
  const marqueeTrack = document.getElementById('marqueeTrack');
  if (marqueeTrack && !marqueeTrack.dataset.doubled){
    marqueeTrack.innerHTML += marqueeTrack.innerHTML;
    marqueeTrack.dataset.doubled = 'true';
  }

  /* ---------- Hero typed rotating phrase ---------- */
  const heroTyped = document.getElementById('heroTyped');
  if (heroTyped){
    const phrases = ['With Industry Experts', 'With Real-World Projects', 'With Guaranteed Placement', 'With 1:1 Mentorship'];
    let pIndex = 0, charIndex = phrases[0].length, deleting = false;
    heroTyped.textContent = phrases[0];

    function typeTick(){
      const current = phrases[pIndex];
      if (!deleting){
        charIndex++;
        if (charIndex > current.length){
          deleting = true;
          setTimeout(typeTick, 1800);
          return;
        }
      } else {
        charIndex--;
        if (charIndex < 0){
          deleting = false;
          pIndex = (pIndex + 1) % phrases.length;
          charIndex = 0;
        }
      }
      heroTyped.textContent = phrases[pIndex].slice(0, charIndex);
      setTimeout(typeTick, deleting ? 35 : 55);
    }
    setTimeout(typeTick, 2400);
  }

  /* ---------- Cursor glow ---------- */
  const glow = document.getElementById('cursorGlow');
  let mx = window.innerWidth/2, my = window.innerHeight/2, gx = mx, gy = my;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function animateGlow(){
    gx += (mx - gx) * 0.12;
    gy += (my - gy) * 0.12;
    glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%,-50%)`;
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  /* ---------- Number counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold:0.4 });
  counters.forEach(c => counterObserver.observe(c));

  function animateCounter(el){
    const target = parseInt(el.getAttribute('data-count'), 10);
    const duration = 1600;
    const start = performance.now();
    function tick(now){
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Progress bars / horizontal bars ---------- */
  const progressEls = document.querySelectorAll('[data-progress]');
  const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const val = entry.target.getAttribute('data-progress');
        entry.target.style.width = val + '%';
        progressObserver.unobserve(entry.target);
      }
    });
  }, { threshold:0.4 });
  progressEls.forEach(p => progressObserver.observe(p));

  /* ---------- Timeline progress + active dots ---------- */
  const timeline = document.getElementById('timeline');
  const timelineProgress = document.getElementById('timelineProgress');
  const timelineItems = document.querySelectorAll('.timeline-item');
  if (timeline){
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          timelineProgress.style.width = '100%';
          timelineItems.forEach((item, i) => {
            setTimeout(() => item.classList.add('active'), i * 160);
          });
          timelineObserver.unobserve(entry.target);
        }
      });
    }, { threshold:0.3 });
    timelineObserver.observe(timeline);
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item){
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
    });
  });

  /* ---------- FAQ search ---------- */
  const faqSearch = document.getElementById('faqSearch');
  if (faqSearch){
    faqSearch.addEventListener('input', () => {
      const term = faqSearch.value.toLowerCase();
      document.querySelectorAll('.faq-item').forEach(item => {
        const text = item.querySelector('.faq-q').textContent.toLowerCase();
        item.classList.toggle('hidden', term.length > 0 && !text.includes(term));
      });
    });
  }

  /* ---------- Course card staggered reveal (tilt-in) ---------- */
  const revealCards = document.querySelectorAll('[data-reveal="tilt-in"]');
  if (revealCards.length){
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          const idx = parseInt(entry.target.getAttribute('data-reveal-index') || '0', 10);
          setTimeout(() => entry.target.classList.add('in-view'), idx * 110);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold:0.2 });
    revealCards.forEach(card => revealObserver.observe(card));
    // Safety net: guarantee visibility even if IO never fires for some reason.
    setTimeout(() => revealCards.forEach(c => c.classList.add('in-view')), 3000);
  }

  /* ---------- Card tilt effect ---------- */
  document.querySelectorAll('.course-card, .feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.015)`;

      // Drive the mouse-tracking spotlight gradient (see .course-card::after in style.css)
      if (card.classList.contains('course-card')){
        card.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--my', `${(y / rect.height) * 100}%`);
      }
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ---------- Particles (hero canvas) ---------- */
  const canvas = document.getElementById('particles');
  if (canvas){
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resize(){
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    }
    function initParticles(){
      const count = Math.min(60, Math.floor(canvas.width / 22));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.6,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        o: Math.random() * 0.4 + 0.15
      }));
    }
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(37,99,235,${p.o})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    resize(); initParticles(); draw();
    window.addEventListener('resize', () => { resize(); initParticles(); });
  }

});

/* ============================================================
   NOTE: Sign In / Dashboard nav state used to be faked here with
   a localStorage "session" that had nothing to do with real login,
   which is why the navbar always showed Sign In / Create Account
   even after a real Django login. The navbar is now rendered
   server-side per page using {% if user.is_authenticated %}, so
   this script is no longer needed and has been removed.
   ============================================================ */
