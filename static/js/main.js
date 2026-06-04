/**
 * main.js — App bootstrap
 * Handles: scroll reveal, counter animation, nav auto-hide, cursor glow,
 * magnetic buttons, card spotlight, project carousel drag.
 */

const isTouchDevice = () => window.matchMedia('(hover: none)').matches;
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  if (!isTouchDevice() && !prefersReducedMotion()) {
    initCursorGlow();
    initMagneticButtons();
    initCardSpotlight();
  }
  initScrollReveal();
  initCounterAnimation();
  initNavAutoHide();
  initCarouselDrag();
});

/* ── Cursor Glow ────────────────────────────────────────── */
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let glowX = mouseX, glowY = mouseY;
  const lerp = 0.12; // higher = snappier, lower = silkier; 0.12 is the sweet spot

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  function animate() {
    glowX += (mouseX - glowX) * lerp;
    glowY += (mouseY - glowY) * lerp;
    // translate3d is cheaper than left/top — no layout reflow
    glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(animate);
  }
  animate();
}

/* ── Magnetic Buttons ───────────────────────────────────── */
/* On hover, the button drifts toward the cursor with lerp,
   reads as polished, slightly sentient interactivity. */
function initMagneticButtons() {
  const buttons = document.querySelectorAll(
    '.btn-primary, .btn-ghost, .btn-submit'
  );

  buttons.forEach((btn) => {
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let rafId = null;
    let active = false;
    const strength = 0.35;  // how much the button moves toward cursor (0–1)
    const lerp = 0.18;

    function loop() {
      currentX += (targetX - currentX) * lerp;
      currentY += (targetY - currentY) * lerp;
      btn.style.transform =
        `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      if (active || Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
        btn.style.transform = '';
      }
    }

    btn.addEventListener('mouseenter', () => {
      active = true;
      btn.style.willChange = 'transform';
      if (!rafId) rafId = requestAnimationFrame(loop);
    });

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = (e.clientX - cx) * strength;
      targetY = (e.clientY - cy) * strength;
    });

    btn.addEventListener('mouseleave', () => {
      active = false;
      targetX = 0;
      targetY = 0;
      // Allow loop to settle back to 0 then stop itself
      setTimeout(() => { btn.style.willChange = ''; }, 400);
    });
  });
}

/* ── Card Spotlight ─────────────────────────────────────── */
/* Tracks mouse inside cards and sets --mx / --my CSS variables.
   CSS uses these to position a soft radial highlight. */
function initCardSpotlight() {
  const cards = document.querySelectorAll(
    '.skill-group, .about-card, .project-card, .timeline-item'
  );

  cards.forEach((card) => {
    let rafId = null;
    let pending = false;
    let lastX = 0, lastY = 0;

    function apply() {
      card.style.setProperty('--mx', lastX + 'px');
      card.style.setProperty('--my', lastY + 'px');
      // Legacy support for existing --mouse-x / --mouse-y on project-card
      card.style.setProperty('--mouse-x', lastX + 'px');
      card.style.setProperty('--mouse-y', lastY + 'px');
      pending = false;
    }

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      if (!pending) {
        pending = true;
        requestAnimationFrame(apply);
      }
    }, { passive: true });
  });
}

/* ── Scroll Reveal (IntersectionObserver) ───────────────── */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      // Trigger a touch earlier so the reveal feels in-sync with scroll,
      // not lagging behind the viewport edge.
      threshold: 0.08,
      rootMargin: '0px 0px -80px 0px'
    }
  );

  reveals.forEach((el) => observer.observe(el));
}

/* ── Counter Animation ──────────────────────────────────── */
function initCounterAnimation() {
  const metrics = document.querySelectorAll('.metric-value');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1800; // longer = more sophisticated pacing
        const startTime = performance.now();

        function step(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          // Ease-out quart — slows down more luxuriously than cubic
          const eased = 1 - Math.pow(1 - progress, 4);
          el.textContent = Math.floor(eased * target) + suffix;
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = target + suffix; // pin final value
          }
        }

        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  metrics.forEach((m) => observer.observe(m));
}

/* ── Nav Auto-Hide on Scroll ────────────────────────────── */
function initNavAutoHide() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  let lastScroll = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const current = window.scrollY;

      if (current > lastScroll && current > 80) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }

      lastScroll = current;
      ticking = false;
    });
  }, { passive: true });
}

/* ── Project Carousel Drag-to-Scroll ────────────────────── */
function initCarouselDrag() {
  const track = document.getElementById('projects-track');
  if (!track) return;

  let isDown = false;
  let startX, scrollLeft;
  let hasDragged = false;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    hasDragged = false;
    track.classList.add('dragging');
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener('mouseleave', () => {
    isDown = false;
    track.classList.remove('dragging');
  });

  track.addEventListener('mouseup', () => {
    isDown = false;
    track.classList.remove('dragging');
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) hasDragged = true;
    track.scrollLeft = scrollLeft - walk;
  });

  track.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);
}
