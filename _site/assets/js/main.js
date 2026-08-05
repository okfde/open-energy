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

  // Mirrors the widths set in _pages.scss (.hero-slideshow__slide). Computed
  // arithmetically instead of read from the live DOM, since the active slide's
  // box is mid-transition (width/height) when a new index becomes active —
  // offsetLeft/offsetWidth would be unreliable while that's animating.
  var ACTIVE_WIDTH_PERCENT = 70;
  var INACTIVE_WIDTH_PERCENT = 15;
  var GAP_PERCENT = 1.5;

  function center() {
    slides.forEach(function (slideEl, index) {
      slideEl.classList.toggle('is-active', index === activeIndex);
    });

    var centerPercent = 0;
    for (var i = 0; i <= activeIndex; i++) {
      var widthPercent = i === activeIndex ? ACTIVE_WIDTH_PERCENT : INACTIVE_WIDTH_PERCENT;
      centerPercent += i === activeIndex ? widthPercent / 2 : widthPercent + GAP_PERCENT;
    }

    var offsetPercent = 50 - centerPercent;
    var offsetPx = (offsetPercent / 100) * viewport.clientWidth;
    track.style.transform = 'translateX(' + offsetPx + 'px)';
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

(function () {
  var filterBar = document.querySelector('[data-category-filter]');
  if (!filterBar) return;

  var buttons = Array.prototype.slice.call(filterBar.querySelectorAll('[data-category]'));
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-category-item]'));
  if (!buttons.length || !items.length) return;

  var activeCategory = null;

  function applyFilter() {
    items.forEach(function (item) {
      var matches = !activeCategory || item.getAttribute('data-category-item') === activeCategory;
      item.classList.toggle('is-category-hidden', !matches);
    });
    buttons.forEach(function (button) {
      var isActive = button.getAttribute('data-category') === activeCategory;
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var category = button.getAttribute('data-category');
      activeCategory = activeCategory === category ? null : category;
      applyFilter();
    });
  });
})();
