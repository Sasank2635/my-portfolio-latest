/**
 * main.js — App bootstrap
 * Handles: scroll reveal, counter animation, nav auto-hide, cursor glow,
 * project card mouse tracking.
 */

const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

document.addEventListener('DOMContentLoaded', () => {
  if (!isTouchDevice()) initCursorGlow();
  initScrollReveal();
  initCounterAnimation();
  initNavAutoHide();
  // initProjectCardMouseTrack(); — removed (radial-gradient on mousemove causes repaints)
  initCarouselDrag();
});

/* ── Cursor Glow ────────────────────────────────────────── */
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth follow with lerp
  function animate() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';
    requestAnimationFrame(animate);
  }
  animate();
}

/* ── Scroll Reveal (IntersectionObserver) ───────────────── */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // only animate once
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
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
        const duration = 1500; // ms
        const startTime = performance.now();

        function step(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(step);
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
  });
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

  // Prevent link clicks firing after a drag
  track.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);
}

/* ── Project Card Mouse Tracking (radial highlight) ─────── */
function initProjectCardMouseTrack() {
  const cards = document.querySelectorAll('.project-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
    });
  });
}
