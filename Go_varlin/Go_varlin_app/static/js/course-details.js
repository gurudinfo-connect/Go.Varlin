/* ============================================================
   GO.VARLIN — COURSE-DETAILS.JS
   Reads ?course=<slug> and renders COURSE_DATA + SITE_DATA
   into the premium Course Details page.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Brand icon map (Simple Icons CDN + favicon fallback) ---------- */
  const SI = 'si';     // Simple Icons slug -> https://cdn.simpleicons.org/<slug>
  const DOM = 'dom';   // Domain -> Google favicon service (no key, no rate limit)
  const RAW = 'raw';   // Inline hand-drawn SVG (for brands missing from Simple Icons, e.g. MS Office apps)
  const RAW_SVG = {
    excel: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="24" rx="2" fill="#185C37"/><rect x="2" y="4" width="20" height="24" rx="2" fill="#21A366" opacity=".001"/><path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" fill="#107C41"/><path d="M13 4h13a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H13V4z" fill="#21A366"/><path d="M13 4h9v6h-9V4zM22 17h-9v-6h9v6zM22 23h-9v-6h9v6z" fill="#33C481"/><path d="M13 4h9v6h-9z" fill="#107C41" opacity=".25"/><path fill="#fff" d="M6.4 12.2h2.3l1.65 2.9 1.7-2.9h2.25l-2.75 4.3 2.85 4.3h-2.35l-1.75-2.95-1.75 2.95H6.35l2.8-4.35z"/></svg>`,
    powerbi: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect x="13" y="4" width="7" height="24" rx="1.4" fill="#F2C811"/><rect x="4" y="12" width="7" height="16" rx="1.4" fill="#F2C811" opacity=".75"/><rect x="22" y="8" width="7" height="20" rx="1.4" fill="#CA9B02"/></svg>`,
    sql: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><ellipse cx="16" cy="8" rx="12" ry="5" fill="#0072C6"/><path d="M4 8v16c0 2.76 5.37 5 12 5s12-2.24 12-5V8" fill="none" stroke="#0072C6" stroke-width="0"/><path d="M4 8v6.4c0 2.76 5.37 5 12 5s12-2.24 12-5V8c0 2.76-5.37 5-12 5S4 10.76 4 8z" fill="#0091DA"/><path d="M4 14.4v6.4c0 2.76 5.37 5 12 5s12-2.24 12-5v-6.4c0 2.76-5.37 5-12 5s-12-2.24-12-5z" fill="#00A1F1"/><path d="M4 20.8V24c0 2.76 5.37 5 12 5s12-2.24 12-5v-3.2c0 2.76-5.37 5-12 5s-12-2.24-12-5z" fill="#59B4D9"/></svg>`,
  };
  const ICON_MAP = {
    // languages / frameworks
    'Python':[SI,'python'], 'Java':[SI,'java'], 'JavaScript':[SI,'javascript'], 'HTML':[SI,'html5'],
    'HTML, CSS & JS':[SI,'html5'], 'CSS':[SI,'css3'], 'TypeScript':[SI,'typescript'],
    'Django':[SI,'django'], 'Flask':[SI,'flask'], 'Spring':[SI,'spring'], 'Spring Boot':[SI,'springboot'],
    'Hibernate':[SI,'hibernate'], 'Bootstrap':[SI,'bootstrap'], 'React':[SI,'react'], 'Redux':[SI,'redux'],
    'Node.js':[SI,'nodedotjs'],
    // AI / ML
    'LangChain':[SI,'langchain'], 'LangGraph':[SI,'langgraph'], 'Ollama':[SI,'ollama'],
    'HuggingFace':[SI,'huggingface'], 'Hugging Face':[SI,'huggingface'], 'TensorFlow':[SI,'tensorflow'],
    'Scikit Learn':[SI,'scikitlearn'], 'Keras':[SI,'keras'], 'PyTorch':[SI,'pytorch'],
    'NumPy':[SI,'numpy'], 'Pandas':[SI,'pandas'], 'OpenCV':[SI,'opencv'],
    'OpenAI API':[DOM,'openai.com'], 'ChatGPT':[DOM,'openai.com'], 'Gemini':[DOM,'gemini.google.com'],
    'Claude':[SI,'claude'], 'Pinecone':[DOM,'pinecone.io'], 'FAISS':[DOM,'ai.meta.com'],
    'Model Context Protocol':[SI,'modelcontextprotocol'],
    // databases
    'MySQL':[SI,'mysql'], 'MongoDB':[SI,'mongodb'], 'PostgreSQL':[SI,'postgresql'], 'SQLite':[SI,'sqlite'],
    'SQL':[RAW,'sql'], 'Redis':[SI,'redis'],
    // tools / IDEs
    'Git':[SI,'git'], 'GitHub':[SI,'github'], 'GitHub Copilot':[SI,'githubcopilot'],
    'VS Code':[DOM,'code.visualstudio.com'], 'PyCharm':[SI,'pycharm'], 'IntelliJ IDEA':[SI,'intellijidea'],
    'Postman':[SI,'postman'], 'Docker':[SI,'docker'], 'AWS':[DOM,'aws.amazon.com'],
    'Render':[SI,'render'], 'Vercel':[SI,'vercel'], 'Netlify':[SI,'netlify'],
    'Excel':[RAW,'excel'], 'Power BI':[RAW,'powerbi'], 'Tableau':[DOM,'tableau.com'],
    'Prompt Engineering':[DOM,'openai.com'],
  };
  function brandIcon(name, className){
    const meta = ICON_MAP[name];
    const initials = name.replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase() || '•';
    if(!meta) return `<span class="${className} logo-fallback">${initials}</span>`;
    if(meta[0] === RAW) return `<span class="${className} logo-rawwrap">${RAW_SVG[meta[1]]}</span>`;
    const src = meta[0] === SI
      ? `https://cdn.simpleicons.org/${meta[1]}`
      : `https://www.google.com/s2/favicons?domain=${meta[1]}&sz=64`;
    return `<span class="${className} logo-imgwrap">
      <img src="${src}" alt="${name}" loading="lazy" onerror="this.parentElement.classList.add('logo-fallback');this.parentElement.textContent='${initials}';">
    </span>`;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('course') || 'full-stack-java';
  const data = COURSE_DATA[slug] || COURSE_DATA['full-stack-java'];
  const site = typeof SITE_DATA !== 'undefined' ? SITE_DATA : {};
  const inr = n => '₹' + Number(n).toLocaleString('en-IN');

  /* ---------- Meta ---------- */
  document.title = data.name + ' Curriculum — Go.Varlin';

  /* ---------- Hero ---------- */
  const bcCategory = document.getElementById('bcCategory');
  const courseName = document.getElementById('courseName');
  const courseDesc = document.getElementById('courseDesc');
  const courseChips = document.getElementById('courseChips');
  const ctaTitle = document.getElementById('ctaTitle');

  if (bcCategory) bcCategory.textContent = data.category;
  if (courseDesc) courseDesc.textContent = data.description;
  if (ctaTitle) ctaTitle.textContent = `Ready to become a ${data.name} Developer?`;

  if (courseName){
    const titleWrap = courseName.parentElement;
    const words = data.name.split(' ');
    const lastWord = words.pop();
    titleWrap.innerHTML = `${words.join(' ')} <span class="text-gradient">${lastWord}</span>`;
  }

  /* ---------- Header badge row ---------- */
  const headerBadgeRow = document.getElementById('headerBadgeRow');
  if (headerBadgeRow){
    headerBadgeRow.innerHTML = `
      <span class="hb hb-label">${data.headerLabel || data.name.toUpperCase()}</span>
      ${data.genAI ? '<span class="hb hb-ai">✨ Gen AI Included</span>' : ''}
      <span class="hb hb-open"><span class="dot"></span> ${data.batchStatus || 'Batch Open'}</span>
    `;
  }

  /* ---------- Info strip: duration / eligibility / batch ---------- */
  const headerInfoStrip = document.getElementById('headerInfoStrip');
  if (headerInfoStrip){
    headerInfoStrip.innerHTML = `
      <div class="info-item"><span class="info-icon">⏱</span><span class="info-text"><strong>${data.duration}</strong><span>Duration</span></span></div>
      <div class="info-item"><span class="info-icon">🎓</span><span class="info-text"><strong>${data.eligibility || 'Any Branch'}</strong><span>Eligibility</span></span></div>
      <div class="info-item"><span class="info-icon">🟢</span><span class="info-text"><strong>${data.batchStatus || 'Batch Open'}</strong><span>Batch Status</span></span></div>
    `;
  }

  /* ---------- Trust row: stars / rating / students / placement ---------- */
  const trustRow = document.getElementById('trustRow');
  if (trustRow){
    trustRow.innerHTML = `
      <span class="trust-item"><span class="trust-stars">★★★★★</span> ${(data.headerRating || data.rating).toFixed(1)} Rating</span>
      <span class="trust-item">${data.headerStudents || (data.students + '+')} <span class="trust-mute">Students</span></span>
      <span class="trust-item">${data.headerPlacement || '100% Placement Assistance'}</span>
    `;
  }

  /* ---------- Demo video button ---------- */
  const watchDemoBtn = document.getElementById('watchDemoVideo');
  if (watchDemoBtn){
    if (data.demoVideo){
      watchDemoBtn.classList.remove('is-hidden');
      watchDemoBtn.addEventListener('click', () => {
        if (window.VideoModal) window.VideoModal.open(data.demoVideo, data.name + ' — Course Demo');
      });
    } else {
      watchDemoBtn.classList.add('is-hidden');
    }
  }

  if (courseChips){
    courseChips.innerHTML = `
      <span class="cdet-chip cdet-chip-highlight">⏱ ${data.duration}</span>
      <span class="cdet-chip cdet-chip-highlight">🧪 ${data.projects}</span>
      <span class="cdet-chip cdet-chip-highlight">🎯 ${data.level}</span>
    ` + data.chips.map(c => `<span class="cdet-chip">${c}</span>`).join('');
  }

  /* ---------- Enroll / sticky sidebar ---------- */
  const enrollBadge = document.getElementById('enrollBadge');
  const enrollRatingNum = document.getElementById('enrollRatingNum');
  const enrollStars = document.getElementById('enrollStars');
  const enrollReviews = document.getElementById('enrollReviews');
  const enrollStudents = document.getElementById('enrollStudents');
  const enrollPrice = document.getElementById('enrollPrice');
  const enrollPriceOriginal = document.getElementById('enrollPriceOriginal');
  const enrollDiscount = document.getElementById('enrollDiscount');
  const enrollDuration = document.getElementById('enrollDuration');
  const enrollProjects = document.getElementById('enrollProjects');
  const enrollBatchStart = document.getElementById('enrollBatchStart');
  const enrollLanguage = document.getElementById('enrollLanguage');
  const stickyPrice = document.getElementById('stickyPrice');

  if (data.price){
    if (enrollBadge) enrollBadge.textContent = data.badge || 'Bestseller';
    if (enrollRatingNum) enrollRatingNum.textContent = data.rating.toFixed(1);
    if (enrollStars) enrollStars.textContent = '★★★★★';
    if (enrollReviews) enrollReviews.textContent = `(${data.reviews.toLocaleString('en-IN')} ratings)`;
    if (enrollStudents) enrollStudents.textContent = data.students.toLocaleString('en-IN');
    if (enrollPrice) enrollPrice.textContent = inr(data.price);
    if (enrollPriceOriginal) enrollPriceOriginal.textContent = inr(data.originalPrice);
    if (enrollDiscount){
      const pct = Math.round((1 - data.price / data.originalPrice) * 100);
      enrollDiscount.textContent = `${pct}% off`;
    }
    if (enrollDuration) enrollDuration.textContent = data.duration;
    if (enrollProjects) enrollProjects.textContent = data.projects;
    if (enrollBatchStart) enrollBatchStart.textContent = data.batchStarts || 'Announced soon';
    if (enrollLanguage) enrollLanguage.textContent = data.language || 'English';
    if (stickyPrice) stickyPrice.textContent = inr(data.price);
  }

  /* ---------- Course Overview: audience + job roles ---------- */
  const audienceGrid = document.getElementById('audienceGrid');
  if (audienceGrid && site.audience){
    audienceGrid.innerHTML = site.audience.map((a, i) => `
      <div class="audience-card" data-aos="fade-up" data-aos-delay="${i * 60}">
        <div class="audience-icon">${a.icon}</div>
        <h4>${a.label}</h4>
        <p>${a.desc}</p>
      </div>
    `).join('');
  }

  const jobRolesGrid = document.getElementById('jobRolesGrid');
  if (jobRolesGrid && data.jobRoles){
    jobRolesGrid.innerHTML = data.jobRoles.map((role, i) => `
      <div class="job-role-item" data-aos="fade-up" data-aos-delay="${i * 60}">
        <span class="jr-num">${String(i + 1).padStart(2,'0')}</span>${role}
      </div>
    `).join('');
  }

  /* ---------- Syllabus Timeline ---------- */
  const timelineList = document.getElementById('timelineList');
  if (timelineList && data.modules){
    timelineList.innerHTML = data.modules.map((mod, i) => `
      <div class="timeline-item${i === 0 ? ' open' : ''}" data-aos="fade-up" data-aos-delay="${i * 60}">
        <span class="timeline-dot"></span>
        <div class="timeline-card">
          <button class="timeline-head">
            <span class="timeline-phase">Phase ${i + 1}</span>
            <span class="timeline-title"><strong>${mod.title}</strong><em>${mod.weeks}</em></span>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="timeline-body">
            <div class="timeline-topics">${mod.topics.map(t => `<span>${t}</span>`).join('')}</div>
          </div>
        </div>
      </div>
    `).join('');

    const items = timelineList.querySelectorAll('.timeline-item');
    items.forEach(item => {
      const head = item.querySelector('.timeline-head');
      const body = item.querySelector('.timeline-body');
      if (item.classList.contains('open')) body.style.maxHeight = body.scrollHeight + 'px';
      head.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        items.forEach(other => {
          if (other !== item && other.classList.contains('open')){
            other.classList.remove('open');
            other.querySelector('.timeline-body').style.maxHeight = null;
          }
        });
        item.classList.toggle('open', !isOpen);
        body.style.maxHeight = !isOpen ? body.scrollHeight + 'px' : null;
      });
    });

    /* Scroll-driven timeline fill + dot activation */
    const timelineFill = document.getElementById('timelineFill');
    const timelineWrap = document.querySelector('.timeline-wrap');
    const updateTimeline = () => {
      if (!timelineWrap || !timelineFill) return;
      const rect = timelineWrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height;
      const progressed = Math.min(Math.max(vh * 0.75 - rect.top, 0), total);
      const pct = total > 0 ? (progressed / total) * 100 : 0;
      timelineFill.style.height = pct + '%';
      items.forEach(item => {
        const r = item.getBoundingClientRect();
        if (r.top < vh * 0.8) item.classList.add('in-view');
      });
    };
    window.addEventListener('scroll', updateTimeline, { passive:true });
    window.addEventListener('resize', updateTimeline);
    updateTimeline();
  }

  /* ---------- Tools covered ---------- */
  const toolsGrid = document.getElementById('toolsGrid');
  if (toolsGrid && data.toolsCovered){
    toolsGrid.innerHTML = data.toolsCovered.map((tool, i) => `
      <div class="tool-card" data-aos="zoom-in" data-aos-delay="${(i % 8) * 40}">
        ${brandIcon(tool, 'tool-logo')}
        <span>${tool}</span>
      </div>
    `).join('');
  }

  /* ---------- AI tools ---------- */
  const aiToolsGrid = document.getElementById('aiToolsGrid');
  if (aiToolsGrid && site.aiTools){
    aiToolsGrid.innerHTML = site.aiTools.map((tool, i) => `
      <span class="ai-tool-chip" data-aos="fade-up" data-aos-delay="${(i % 6) * 50}">${brandIcon(tool, 'ai-tool-icon')}${tool}</span>
    `).join('');
  }

  /* ---------- Skills you'll master ---------- */
  const skillsGrid = document.getElementById('skillsGrid');
  if (skillsGrid && data.skills){
    skillsGrid.innerHTML = data.skills.map((skill, i) => `
      <div class="skill-pill" data-aos="fade-up" data-aos-delay="${(i % 8) * 40}">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg>${skill}
      </div>
    `).join('');
  }

  /* ---------- Real projects ---------- */
  const projectsGrid = document.getElementById('projectsGrid');
  if (projectsGrid && data.realProjects){
    projectsGrid.innerHTML = data.realProjects.map((p, i) => `
      <div class="project-card" data-aos="fade-up" data-aos-delay="${(i % 6) * 60}">
        <div class="project-card-top"><span class="project-dot"></span><h4>${p.name}</h4></div>
        <div class="project-tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
        <div class="project-card-foot">
          <span>⭐ Project</span><span>🍴 Deployable</span>
        </div>
      </div>
    `).join('');
  }

  /* ---------- Certification ---------- */
  const certVisualImg = document.getElementById('certVisualImg');
  const certTitle = document.getElementById('certTitle');
  const certPoints = document.getElementById('certPoints');
  const certDownloadBtn = document.getElementById('certDownloadBtn');
  const staticBase = window.STATIC_BASE || '/static/';
  if (site.certification){
    if (certTitle) certTitle.textContent = site.certification.title;
    if (certPoints) certPoints.innerHTML = site.certification.points.map(pt => `<li>${pt}</li>`).join('');
  }
  if (data.certificateImage && certVisualImg){
    certVisualImg.src = `${staticBase}images/${data.certificateImage}`;
    certVisualImg.alt = `${data.name} sample certificate`;
  }
  if (certDownloadBtn){
    certDownloadBtn.addEventListener('click', () => {
      if (data.certificateImage){
        const a = document.createElement('a');
        a.href = `${staticBase}images/${data.certificateImage}`;
        a.download = `${slug}-sample-certificate.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else if (window.LeadModal) {
        window.LeadModal.open(slug);
      }
    });
  }

  /* ---------- Hiring partners marquee ---------- */
  const PARTNER_ICONS = {
    'Accenture'   :{type:'si', slug:'accenture', color:'A100FF'},
    'Infosys'     :{type:'si', slug:'infosys',   color:'007CC3'},
    'Wipro'       :{type:'si', slug:'wipro'},
    'TCS'         :{type:'si', slug:'tcs',       color:'0F2B5B'},
    'HCL'         :{type:'si', slug:'hcl'},
    'Persistent'  :{type:'si', slug:'persistent'},
    'Google'      :{type:'si', slug:'google',    color:'4285F4'},
    'Amazon'      :{type:'mono', initials:'A', bg:'#FF9900'},
    'IBM'         :{type:'mono', initials:'IBM', bg:'#054ADA'},
    'Oracle'      :{type:'mono', initials:'O', bg:'#F80000'},
    'Microsoft'   :{type:'ms'},
    'Deloitte'    :{type:'mono', initials:'D', bg:'#0F0F0F'},
    'Cognizant'   :{type:'mono', initials:'C', bg:'#0033A0'},
    'Capgemini'   :{type:'mono', initials:'CG', bg:'#0070AD'},
    'KPMG'        :{type:'mono', initials:'K', bg:'#00338D'},
    'Tech Mahindra':{type:'mono', initials:'TM', bg:'#E4002B'},
    'Zeta'        :{type:'mono', initials:'Z', bg:'#1B1B3A'},
    'Empuraan'    :{type:'mono', initials:'E', bg:'#64748B'},
  };
  const MS_SQUARES_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
  </svg>`;
  function partnerLogo(name){
    const meta = PARTNER_ICONS[name];
    if (!meta) return `<span class="partner-badge">${name.slice(0,1).toUpperCase()}</span>`;
    if (meta.type === 'ms') return `<span class="partner-badge partner-badge-ms">${MS_SQUARES_SVG}</span>`;
    if (meta.type === 'si'){
      const src = `https://cdn.simpleicons.org/${meta.slug}${meta.color ? '/' + meta.color : ''}`;
      return `<span class="partner-badge partner-badge-si">
        <img src="${src}" alt="${name}" loading="lazy" onerror="this.parentElement.outerHTML='<span class=&quot;partner-badge&quot; style=&quot;background:#64748B&quot;>${name.slice(0,1).toUpperCase()}</span>';">
      </span>`;
    }
    return `<span class="partner-badge" style="background:${meta.bg}">${meta.initials}</span>`;
  }
  const partnersTrack = document.getElementById('partnersTrack');
  if (partnersTrack && site.hiringPartners){
    const logos = site.hiringPartners.map(name => `
      <div class="partner-logo">
        ${partnerLogo(name)}
        <span class="partner-name">${name}</span>
      </div>
    `).join('');
    partnersTrack.innerHTML = logos + logos; /* duplicated for seamless infinite scroll */
  }

  /* ---------- Placement assistance ---------- */
  const placementGrid = document.getElementById('placementGrid');
  if (placementGrid && site.placementFeatures){
    placementGrid.innerHTML = site.placementFeatures.map((f, i) => `
      <div class="placement-card" data-aos="fade-up" data-aos-delay="${(i % 3) * 60}">
        <span class="placement-icon">${f.icon}</span><h4>${f.label}</h4>
      </div>
    `).join('');
  }

  /* ---------- Why choose Go.Varlin ---------- */
  const whyGrid = document.getElementById('whyGrid');
  if (whyGrid && site.whyChooseUs){
    whyGrid.innerHTML = site.whyChooseUs.map((w, i) => `
      <div class="why-card" data-aos="zoom-in" data-aos-delay="${(i % 4) * 50}">
        <div class="why-icon">${w.icon}</div><h4>${w.label}</h4>
      </div>
    `).join('');
  }

  /* ---------- Learning journey roadmap ---------- */
  const journeyRoad = document.getElementById('journeyRoad');
  if (journeyRoad && site.learningJourney){
    journeyRoad.innerHTML = site.learningJourney.map((step, i) => `
      ${i > 0 ? '<svg class="journey-arrow" viewBox="0 0 24 24" width="22" height="22"><path d="M9 6l6 6-6 6"/></svg>' : ''}
      <div class="journey-step" data-aos="zoom-in" data-aos-delay="${i * 70}">
        <div class="journey-num">${i + 1}</div><span>${step}</span>
      </div>
    `).join('');
  }

  /* ---------- Student benefits ---------- */
  const benefitsGrid = document.getElementById('benefitsGrid');
  if (benefitsGrid && site.studentBenefits){
    benefitsGrid.innerHTML = site.studentBenefits.map((b, i) => `
      <div class="benefit-card" data-aos="fade-up" data-aos-delay="${(i % 4) * 60}">
        <div class="benefit-icon">${b.icon}</div><h4>${b.label}</h4>
      </div>
    `).join('');
  }

  /* ---------- Related Programs ---------- */
  const otherCoursesGrid = document.getElementById('otherCoursesGrid');
  if (otherCoursesGrid){
    const otherSlugs = Object.keys(COURSE_DATA).filter(key => key !== slug);
    otherCoursesGrid.innerHTML = otherSlugs.map((key, i) => {
      const c = COURSE_DATA[key];
      return `
        <a class="related-item" href="/course-details/?course=${key}" data-aos="fade-up" data-aos-delay="${i * 60}">
          <span class="related-icon">${c.icon}</span>
          <span class="related-text">
            <span class="related-title">${c.name}</span>
            <span class="related-desc">${c.tagline} · ${c.duration}</span>
          </span>
          <svg class="related-arrow" viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6"/></svg>
        </a>
      `;
    }).join('');
  }

  /* ---------- FAQ accordion ---------- */
  const faqList = document.getElementById('faqList');
  if (faqList && data.faqs){
    faqList.innerHTML = data.faqs.map((f, i) => `
      <div class="faq-item" data-aos="fade-up" data-aos-delay="${(i % 6) * 40}">
        <button class="faq-q"><span>${f.q}</span><svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 9l6 6 6-6"/></svg></button>
        <div class="faq-a"><p>${f.a}</p></div>
      </div>
    `).join('');

    faqList.querySelectorAll('.faq-item').forEach(item => {
      const q = item.querySelector('.faq-q');
      const a = item.querySelector('.faq-a');
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqList.querySelectorAll('.faq-item.open').forEach(other => {
          if (other !== item){
            other.classList.remove('open');
            other.querySelector('.faq-a').style.maxHeight = null;
          }
        });
        item.classList.toggle('open', !isOpen);
        a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
      });
    });
  }

  /* ---------- Sync all "download brochure / curriculum" buttons ---------- */
  const enrollDownloadBtn = document.getElementById('enrollDownload');
  if (enrollDownloadBtn){
    enrollDownloadBtn.setAttribute('data-lead-download', slug);
    enrollDownloadBtn.addEventListener('click', () => {
      if (window.LeadModal){
        window.LeadModal.open(slug);
      } else if (data.brochure){
        window.open(`${staticBase}brochures/${data.brochure}.pdf`, '_blank');
      }
    });
  }

  /* ---------- Re-init AOS after dynamic content injection ---------- */
  if (window.AOS) setTimeout(() => AOS.refreshHard(), 60);

});
