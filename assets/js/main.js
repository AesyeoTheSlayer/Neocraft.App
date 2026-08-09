(function () {
  'use strict';

  function cube() {
    return '<svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2 30 9 16 16 2 9Z" fill="#5dd45d"/><path d="M2 9 16 16v14L2 23Z" fill="#6b4a2f"/><path d="M30 9 16 16v14l14-7Z" fill="#8a6440"/></svg>';
  }

  function buildHeader() {
    var root = document.querySelector('[data-site-header]');
    if (!root) return;
    var page = location.pathname.split('/').pop() || 'index.html';
    var onHome = page === 'index.html';
    var onProject = page === 'project.html';
    var onUpdates = page === 'updates.html' || page.indexOf('update-') === 0;
    function current(active) { return active ? ' aria-current="page"' : ''; }
    root.innerHTML =
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<header class="nav"><div class="nav__inner">' +
      '<a class="brand" href="index.html">' + cube() + '<span class="brand__text">Neo<span>Craft</span></span><span class="brand__tag">Rust/WASM</span></a>' +
      '<button class="nav__toggle" type="button" aria-expanded="false" aria-controls="navlinks" aria-label="Toggle navigation"><span></span></button>' +
      '<nav class="nav__links" id="navlinks" aria-label="Main">' +
      '<a href="index.html"' + current(onHome) + '>Home</a>' +
      '<a href="project.html"' + current(onProject) + '>Project</a>' +
      '<a href="updates.html"' + current(onUpdates) + '>Updates</a>' +
      '<a href="signup.html"' + current(page === 'signup.html' || page === 'confirmed.html') + '>Get updates</a>' +
      '<a href="contact.html"' + current(page === 'contact.html') + '>Contact</a>' +
      '</nav>' +
      '</div></header>';
  }

  function buildFooter() {
    var root = document.querySelector('[data-site-footer]');
    if (!root) return;
    root.innerHTML =
      '<footer class="footer"><div class="wrap"><div class="footer__bottom">' +
      '<p class="footer__legal mb-0">NeoCraft is an independent, unofficial project. It is not affiliated with or endorsed by Mojang Studios or Microsoft.</p>' +
      '<nav class="footer__links" aria-label="Footer"><a href="project.html">Project</a><a href="updates.html">Updates</a><a href="signup.html">Get updates</a><a href="contact.html">Contact</a><a href="privacy.html">Privacy</a></nav>' +
      '</div></div></footer>';
  }

  function initNav() {
    var nav = document.querySelector('.nav');
    var toggle = document.querySelector('.nav__toggle');
    var links = document.querySelector('.nav__links');
    if (!nav || !toggle || !links) return;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      links.classList.toggle('is-open', !open);
    });
    links.addEventListener('click', function () {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && links.classList.contains('is-open')) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    function onScroll() { nav.classList.toggle('is-scrolled', scrollY > 8); }
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }

  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px', threshold: 0 });
    items.forEach(function (item) { observer.observe(item); });
  }

  function boot() { buildHeader(); buildFooter(); initNav(); initReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
