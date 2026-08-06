/* ============================================================
   GO.VARLIN — SLIDER.JS
   Swiper.js testimonial carousel
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  if (window.Swiper){
    new Swiper('.testi-swiper', {
      loop: true,
      grabCursor: true,
      spaceBetween: 24,
      slidesPerView: 1,
      autoplay: {
        delay: 4500,
        disableOnInteraction: false
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      navigation: {
        nextEl: '.testi-next',
        prevEl: '.testi-prev'
      },
      breakpoints: {
        760: { slidesPerView: 2 },
        1100: { slidesPerView: 3 }
      }
    });
  }

});
