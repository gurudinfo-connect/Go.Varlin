/* ============================================================
   GO.VARLIN — DEMO / PREVIEW VIDEO MODAL
   Injects a lightweight video-player modal and wires it to any
   button with [data-video-demo="path/to/video.mp4"].
   ============================================================ */

(function () {

  const MODAL_HTML = `
  <div class="video-modal-overlay" id="videoModalOverlay">
    <div class="video-modal" role="dialog" aria-modal="true" aria-labelledby="videoModalTitle">
      <div class="video-modal-head">
        <h3 id="videoModalTitle">Course Preview</h3>
        <button type="button" class="video-modal-close" id="videoModalClose" aria-label="Close">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div class="video-modal-body">
        <video 
        id="videoModalPlayer"
            controls
            playsinline
            preload="metadata"
            controlsList="nodownload"
            disablePictureInPicture
        ></video>
      </div>
    </div>
  </div>`;

  let overlay, closeBtn, player, titleEl;

  function injectModal() {

    if (document.getElementById('videoModalOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
    overlay = document.getElementById('videoModalOverlay');
    closeBtn = document.getElementById('videoModalClose');
    player = document.getElementById('videoModalPlayer');
    player.controls = true;
    player.setAttribute("controlsList", "nodownload");
    player.setAttribute("disablePictureInPicture", "");
    player.setAttribute("playsinline", "");
    player.preload = "metadata";
    player.pause();
    titleEl = document.getElementById('videoModalTitle');

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });
  }

  function openModal(src, title) {
    if (titleEl) titleEl.textContent = title || 'Course Preview';
    if (player) {
      player.removeAttribute("src");
      player.load();

      player.src = src;
      player.load();
      player.currentTime = 0;
    }
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(async () => {
    try {
        await player.play();
    } catch (err) {
        console.log("Autoplay blocked");
    }
}, 300);
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (player) {
      player.pause();
      player.removeAttribute('src');
      player.load();
    }
  }

  function wireButtons() {
    document.querySelectorAll('[data-video-demo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        injectModal();
        const src = btn.getAttribute('data-video-demo');
        const title = btn.getAttribute('data-video-title');
        openModal(src, title);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectModal();
    wireButtons();
  });

  // Expose for pages/scripts that resolve buttons dynamically
  window.VideoModal = {
    open: (src, title) => {
      injectModal();
      openModal(src, title);
    }
  };

})();
