/**
 * particles.js — Cosmic starfield with depth, twinkle, and shooting stars.
 *
 * Design:
 *  - 3 parallax depth layers (far/mid/near) for genuine space feel
 *  - Per-star twinkle (sinusoidal alpha drift)
 *  - Subtle parallax follows pointer (very small offset, not jarring)
 *  - Rare shooting stars across the canvas
 *  - DPR-aware crisp rendering, capped at 2 for perf
 *  - Auto-throttles count on mobile/tablet
 *  - Respects prefers-reduced-motion (renders static field, no loop)
 *  - Pauses when tab hidden (saves CPU/battery)
 */

(function () {
  'use strict';

  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Per-device star budget
  function targetStarCount() {
    const w = window.innerWidth;
    if (w < 640)  return 70;
    if (w < 1100) return 130;
    return 210;
  }

  // Layer config — far layer is dimmest and slowest
  const LAYERS = [
    { speed: 0.04, sizeMin: 0.4, sizeMax: 0.9, alphaMin: 0.25, alphaMax: 0.55, parallax: 0.6 },
    { speed: 0.08, sizeMin: 0.6, sizeMax: 1.3, alphaMin: 0.40, alphaMax: 0.75, parallax: 1.4 },
    { speed: 0.16, sizeMin: 0.8, sizeMax: 1.9, alphaMin: 0.55, alphaMax: 1.00, parallax: 2.6 },
  ];

  // Koenigsegg Aurora palette — cool whites, ice blues, signature aurora.
  // No warm tones — keep it cold and precise.
  const PALETTES = [
    [236, 240, 245], // ghost white (majority)
    [236, 240, 245],
    [236, 240, 245],
    [205, 220, 235], // pale steel
    [180, 205, 225], // colder pale
    [111, 195, 223], // ice cyan accent
    [111, 195, 223],
    [ 43, 108, 176], // aurora blue (rare)
  ];

  let width = 0, height = 0;
  let stars = [];
  let shooting = [];
  let pointer = { x: 0, y: 0, has: false };
  let parallax = { x: 0, y: 0 };
  let rafId = null;
  let lastShootAt = 0;

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function pickColor() { return PALETTES[(Math.random() * PALETTES.length) | 0]; }

  function createStar() {
    const layer = LAYERS[(Math.random() * LAYERS.length) | 0];
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * layer.speed,
      vy: (Math.random() - 0.5) * layer.speed,
      r: rand(layer.sizeMin, layer.sizeMax),
      base: rand(layer.alphaMin, layer.alphaMax),
      twPhase: Math.random() * Math.PI * 2,
      twSpeed: rand(0.4, 1.2),
      color: pickColor(),
      px: layer.parallax,
    };
  }

  function createShootingStar() {
    // Travels diagonally across visible area
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -60 : width + 60;
    const startY = rand(0, height * 0.6);
    const angle = fromLeft ? rand(0.18, 0.42) : Math.PI - rand(0.18, 0.42);
    const speed = rand(7, 11);
    return {
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: rand(50, 80),
      trail: 14,
    };
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = targetStarCount();
    while (stars.length < target) stars.push(createStar());
    while (stars.length > target) stars.pop();
  }

  function step(t) {
    const time = t * 0.001;

    // Smooth parallax interpolation
    if (pointer.has) {
      const tx = (pointer.x / width  - 0.5) * 12;
      const ty = (pointer.y / height - 0.5) * 12;
      parallax.x += (tx - parallax.x) * 0.04;
      parallax.y += (ty - parallax.y) * 0.04;
    } else {
      parallax.x *= 0.96;
      parallax.y *= 0.96;
    }

    ctx.clearRect(0, 0, width, height);

    // Stars
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x += s.vx;
      s.y += s.vy;

      // Wrap
      if (s.x < -4) s.x = width + 4;
      else if (s.x > width + 4) s.x = -4;
      if (s.y < -4) s.y = height + 4;
      else if (s.y > height + 4) s.y = -4;

      // Twinkle: alpha drifts gently around base
      const tw = 0.6 + 0.4 * Math.sin(time * s.twSpeed + s.twPhase);
      const alpha = Math.max(0, Math.min(1, s.base * tw));

      const dx = s.x + parallax.x * s.px;
      const dy = s.y + parallax.y * s.px;

      // Glow halo for brighter near-layer stars
      if (s.r > 1.4) {
        const g = ctx.createRadialGradient(dx, dy, 0, dx, dy, s.r * 4);
        g.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha * 0.35})`);
        g.addColorStop(1, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(dx, dy, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha})`;
      ctx.beginPath();
      ctx.arc(dx, dy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shooting stars — gated by time and rarity
    if (t - lastShootAt > 4200 && Math.random() < 0.012 && shooting.length < 2) {
      shooting.push(createShootingStar());
      lastShootAt = t;
    }
    for (let i = shooting.length - 1; i >= 0; i--) {
      const m = shooting[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life++;

      const fade = 1 - m.life / m.maxLife;
      if (fade <= 0 || m.x < -120 || m.x > width + 120 || m.y > height + 120) {
        shooting.splice(i, 1);
        continue;
      }

      const tx = m.x - m.vx * m.trail;
      const ty = m.y - m.vy * m.trail;
      const grad = ctx.createLinearGradient(tx, ty, m.x, m.y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, `rgba(232,240,255,${0.85 * fade})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      // Bright head
      ctx.fillStyle = `rgba(255,255,255,${fade})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(step);
  }

  function start() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(step);
  }

  function stop() {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  function renderStaticOnce() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${s.base})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Pointer parallax — throttled via rAF reads (we just store latest)
  function onPointerMove(e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.has = true;
  }
  function onPointerLeave() {
    pointer.has = false;
  }

  // Init
  resize();

  if (reduceMotion) {
    renderStaticOnce();
  } else {
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseleave', onPointerLeave, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); }, 120);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });

    start();
  }
})();
