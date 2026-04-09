/**
 * particles.js — Interactive particle network
 *
 * Features:
 *  - Floating particles with subtle motion
 *  - Connection lines between nearby particles
 *  - Mouse repulsion effect
 *  - Responsive canvas sizing
 *  - Performance: requestAnimationFrame + distance culling
 */

(function () {
  'use strict';

  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Config
  const CONFIG = {
    particleCount: 100,
    maxSpeed: 0.35,
    particleMinSize: 0.6,
    particleMaxSize: 1.6,
    connectionDistance: 130,
    mouseRepelRadius: 160,
    mouseRepelForce: 0.015,
    particleColor: [0, 232, 176],   // --accent RGB
    lineColor: [124, 106, 239],      // --accent2 RGB
    lineMaxOpacity: 0.12,
    particleMaxOpacity: 0.5,
  };

  let width, height;
  let particles = [];
  let mouse = { x: -9999, y: -9999 };
  let animationId;

  // ── Resize ──────────────────────────────────────────────
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    // Adjust particle count for mobile
    const target = width < 768 ? 50 : CONFIG.particleCount;
    while (particles.length < target) particles.push(createParticle());
    while (particles.length > target) particles.pop();
  }

  // ── Particle Factory ───────────────────────────────────
  function createParticle() {
    return {
      x: Math.random() * (width || window.innerWidth),
      y: Math.random() * (height || window.innerHeight),
      vx: (Math.random() - 0.5) * CONFIG.maxSpeed * 2,
      vy: (Math.random() - 0.5) * CONFIG.maxSpeed * 2,
      size: Math.random() * (CONFIG.particleMaxSize - CONFIG.particleMinSize) + CONFIG.particleMinSize,
      opacity: Math.random() * CONFIG.particleMaxOpacity + 0.1,
    };
  }

  // ── Update ─────────────────────────────────────────────
  function update() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Mouse repulsion
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseRepelRadius && dist > 0) {
        p.x -= dx * CONFIG.mouseRepelForce;
        p.y -= dy * CONFIG.mouseRepelForce;
      }

      // Wrap edges
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
    }
  }

  // ── Draw ───────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, width, height);

    const pc = CONFIG.particleColor;
    const lc = CONFIG.lineColor;

    // Connections (only check upper triangle)
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionDistance) {
          const alpha = CONFIG.lineMaxOpacity * (1 - dist / CONFIG.connectionDistance);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${lc[0]},${lc[1]},${lc[2]},${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pc[0]},${pc[1]},${pc[2]},${p.opacity})`;
      ctx.fill();
    }
  }

  // ── Animation Loop ─────────────────────────────────────
  function loop() {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // ── Events ─────────────────────────────────────────────
  window.addEventListener('resize', () => {
    resize();
  });

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // ── Init ───────────────────────────────────────────────
  resize();
  loop();
})();
