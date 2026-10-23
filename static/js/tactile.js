/*
 * tactile.js — physical micro-interactions:
 *   1) subtle 3D tilt on cards that follows the cursor
 *   2) material "ripple" on button clicks
 * Both respect prefers-reduced-motion.
 */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 3D hover tilt ─────────────────────────────────────── */
  const canHover = window.matchMedia('(hover: hover)').matches;
  if (!reduce && canHover) {
    const MAX = 11; // max tilt in degrees — pronounced 3D effect
    const cards = document.querySelectorAll(
      '.project-card, .about-card, .skill-group, .exp-card'
    );

    cards.forEach((card) => {
      let raf = null;

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.12s ease-out';
      });

      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;  // -0.5 … 0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const rotY = (px * MAX).toFixed(2);
          const rotX = (-py * MAX).toFixed(2);
          card.style.transform =
            `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px) scale(1.02)`;
        });
      });

      card.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = '';
      });
    });
  }

  /* ── Material ripple on click ──────────────────────────── */
  const RIPPLE = '.btn, .btn-submit, .btn-resume, .btn-approve, .btn-delete,' +
    ' .testimonial-cta, .btn-ghost-sm';

  document.querySelectorAll(RIPPLE).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (e.clientX - r.left - size / 2) + 'px';
      span.style.top = (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(span);
      span.addEventListener('animationend', () => span.remove());
    });
  });
})();
