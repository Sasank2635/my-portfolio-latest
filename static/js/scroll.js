/*
 * scroll.js — GTA-VI-inspired scroll system:
 *   1) smooth momentum scrolling (Lenis, loaded from CDN before this file)
 *   2) parallax depth on [data-speed] layers
 *   3) hero scrub — the hero sinks, fades, and scales as you scroll past it
 *
 * Disabled under prefers-reduced-motion: native scroll + CSS reveals remain.
 */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── 1. Smooth momentum scrolling ──────────────────────── */
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Smooth-scroll in-page anchor links (nav, hero buttons).
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href.length > 1) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            lenis.scrollTo(target, { offset: -70 });
          }
        }
      });
    });
  }

  /* ── 2 & 3. Parallax + hero scrub ──────────────────────── */
  const layers = [...document.querySelectorAll('[data-speed]')].map((el) => ({
    el,
    speed: parseFloat(el.dataset.speed) || 0,
  }));
  const heroContent = document.querySelector('.hero-content');
  const heroImage = document.querySelector('.hero-image');

  function update() {
    const y = window.scrollY;
    const vh = window.innerHeight || 1;

    // Parallax layers drift slower than the page → depth.
    for (const l of layers) {
      l.el.style.transform = `translate3d(0, ${(y * l.speed).toFixed(1)}px, 0)`;
    }

    // Hero scrub across the first ~85% of a viewport.
    const hp = Math.min(Math.max(y / (vh * 0.85), 0), 1);
    if (heroContent) {
      heroContent.style.opacity = (1 - hp).toFixed(3);
      heroContent.style.transform =
        `translate3d(0, ${(hp * 60).toFixed(1)}px, 0) scale(${(1 - hp * 0.07).toFixed(3)})`;
    }
    if (heroImage) {
      heroImage.style.opacity = Math.max(1 - hp * 1.1, 0).toFixed(3);
      heroImage.style.transform =
        `translate3d(0, ${(hp * 90).toFixed(1)}px, 0) scale(${(1 - hp * 0.1).toFixed(3)})`;
    }
  }

  if (lenis) {
    lenis.on('scroll', update);
  } else {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => { update(); ticking = false; });
      }
    }, { passive: true });
  }
  window.addEventListener('resize', update);
  update();
})();
