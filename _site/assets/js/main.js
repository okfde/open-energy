(function () {
  var toggle = document.querySelector('[data-nav-toggle]');
  var menu = document.querySelector('[data-mobile-nav]');

  if (!toggle || !menu) return;

  function isOpen() {
    return menu.classList.contains('is-open');
  }

  function openMenu() {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    if (isOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) closeMenu();
  });
})();

(function () {
  var viewport = document.querySelector('[data-hero-slideshow]');
  var track = document.querySelector('[data-hero-slideshow-track]');

  if (!viewport || !track) return;

  var slides = Array.prototype.slice.call(track.children);
  var activeIndex = 0;
  var intervalMs = 3000;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function center() {
    var slide = slides[activeIndex];
    var offset = viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2);
    track.style.transform = 'translateX(' + offset + 'px)';

    slides.forEach(function (slideEl, index) {
      slideEl.classList.toggle('is-active', index === activeIndex);
    });
  }

  function next() {
    activeIndex = (activeIndex + 1) % slides.length;
    center();
  }

  center();
  window.addEventListener('resize', center);

  if (!reduceMotion) {
    setInterval(next, intervalMs);
  }
})();
