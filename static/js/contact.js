/**
 * contact.js — Contact form handler
 *
 * Submits the form via fetch() to /api/contact
 * and displays success/error feedback.
 */

(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('.btn-submit');
  const statusEl = document.getElementById('form-status');
  const originalBtnText = submitBtn.textContent;

  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Dismiss the soft keyboard on Android/iOS so the user actually sees
    // the status message that appears below the button.
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    // Gather data
    const name    = form.querySelector('[name="name"]').value.trim();
    const email   = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    // Client-side validation
    if (!name || !email || !message) {
      showStatus('error', 'Please fill in all fields.');
      return;
    }
    if (name.length < 2) {
      showStatus('error', 'Name must be at least 2 characters.');
      return;
    }
    if (message.length < 10) {
      showStatus('error', `Message must be at least 10 characters (currently ${message.length}).`);
      return;
    }

    // Submit state
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    hideStatus();

    // 12-second timeout so the button doesn't hang forever on a stalled connection
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, message }),
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        // Non-JSON response (proxy error page, etc.)
      }

      if (res.ok && data && data.success) {
        showStatus('success', data.message || 'Message sent successfully.');
        launchEnvelope(submitBtn);
        form.reset();
      } else {
        const msg = (data && (data.detail || data.message)) ||
                    `Server returned ${res.status}. Please try again.`;
        showStatus('error', msg);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err && err.name === 'AbortError') {
        showStatus('error', 'Request timed out. Check your connection and try again.');
      } else {
        showStatus('error', 'Network error. Check your connection and try again.');
      }
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  function showStatus(type, msg) {
    statusEl.textContent = msg;
    statusEl.className = 'form-status ' + type;
    // Make sure the message is visible — on Android the keyboard often
    // covers anything below the submit button without this scroll.
    requestAnimationFrame(() => {
      try {
        statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (_) {
        statusEl.scrollIntoView();
      }
    });
  }

  function hideStatus() {
    statusEl.className = 'form-status';
    statusEl.textContent = '';
  }

  /**
   * Launches an SVG envelope from the given anchor element (the submit
   * button) toward the top of the viewport, with a short trail of sparkles.
   * Auto-cleans up when the flight ends.
   */
  function launchEnvelope(anchor) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = anchor.getBoundingClientRect();
    const mx = rect.left + rect.width  / 2;
    const my = rect.top  + rect.height / 2;

    const stage = document.createElement('div');
    stage.className = 'mail-launch-stage';

    const env = document.createElement('div');
    env.className = 'mail-envelope';
    env.style.setProperty('--mx', mx + 'px');
    env.style.setProperty('--my', my + 'px');
    // Koenigsegg-style hypercar silhouette — FRONT on the RIGHT (driving direction)
    // Long sloping hood drops down to the front-right, cabin set back, short tail on the left
    env.innerHTML = `
      <svg viewBox="0 0 160 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="mlg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#22d3ee"/>
            <stop offset="55%" stop-color="#1d8cf0"/>
            <stop offset="100%" stop-color="#0e1018"/>
          </linearGradient>
          <linearGradient id="mlgGlass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#f7faff" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.8"/>
          </linearGradient>
        </defs>

        <!-- Ground shadow -->
        <ellipse cx="80" cy="69" rx="68" ry="2.2" fill="#000" opacity="0.55"/>

        <!-- Main body — short tail on left, roof apex behind centre, long hood sloping down to right -->
        <path d="M 6 48
                 Q 8 40, 18 36
                 L 38 30
                 Q 60 22, 88 22
                 L 96 22
                 Q 118 24, 136 32
                 L 152 44
                 Q 156 47, 154 50
                 Q 154 57, 146 58
                 L 14 58
                 Q 4 58, 6 48 Z"
              fill="#0e1018" stroke="url(#mlg)" stroke-width="1.6" stroke-linejoin="round"/>

        <!-- Greenhouse / canopy: rear window on the left rising into roof, windshield on the right sloping down -->
        <path d="M 36 34
                 Q 56 20, 86 20
                 L 96 20
                 Q 116 22, 130 34
                 L 36 34 Z"
              fill="url(#mlgGlass)" stroke="#22d3ee" stroke-width="1"/>
        <!-- Roof highlight strip -->
        <path d="M 50 22 Q 72 16, 96 18"
              fill="none" stroke="#f7faff" stroke-width="0.8" opacity="0.6"/>

        <!-- Signature LED light strip along the flank -->
        <path d="M 14 46 L 148 48" stroke="#22d3ee" stroke-width="0.9" opacity="0.95"/>

        <!-- FRONT headlight on the RIGHT — pointing forward into drive direction -->
        <path d="M 150 38 L 158 44 L 150 50 Z" fill="#f7faff"/>
        <circle cx="152" cy="44" r="2" fill="#f7faff">
          <animate attributeName="opacity" values="1;0.5;1" dur="0.9s" repeatCount="indefinite"/>
        </circle>

        <!-- REAR taillight on the LEFT — pulsing amber -->
        <rect x="5" y="42" width="6" height="3" rx="1" fill="#f59e0b">
          <animate attributeName="opacity" values="1;0.4;1" dur="0.6s" repeatCount="indefinite"/>
        </rect>

        <!-- Door split line (set back of centre) -->
        <path d="M 84 34 L 84 56" stroke="#22d3ee" stroke-width="0.5" opacity="0.5"/>

        <!-- REAR wheel (left side) -->
        <circle cx="36" cy="58" r="11" fill="#0e1018" stroke="url(#mlg)" stroke-width="1.4"/>
        <circle cx="36" cy="58" r="6"  fill="#1a2030"/>
        <circle cx="36" cy="58" r="2.2" fill="#22d3ee"/>
        <path d="M 24 56 Q 36 44, 48 56" fill="none" stroke="url(#mlg)" stroke-width="1.2"/>

        <!-- FRONT wheel (right side) -->
        <circle cx="125" cy="58" r="11" fill="#0e1018" stroke="url(#mlg)" stroke-width="1.4"/>
        <circle cx="125" cy="58" r="6"  fill="#1a2030"/>
        <circle cx="125" cy="58" r="2.2" fill="#22d3ee"/>
        <path d="M 113 56 Q 125 44, 137 56" fill="none" stroke="url(#mlg)" stroke-width="1.2"/>
      </svg>`;

    // Flame plume that flickers below the rocket
    const flame = document.createElement('div');
    flame.className = 'mail-flame';
    env.appendChild(flame);

    stage.appendChild(env);

    // Sparkle trail — 8 dots that drift upward with a small spread
    const trailCount = 8;
    for (let i = 0; i < trailCount; i++) {
      const s = document.createElement('div');
      s.className = 'mail-spark';
      s.style.setProperty('--sx', mx + 'px');
      s.style.setProperty('--sy', my + 'px');
      s.style.setProperty('--sxOff', ((Math.random() - 0.5) * 80) + 'px');
      s.style.setProperty('--syOff', (-180 - Math.random() * 140) + 'px');
      s.style.setProperty('--sd', (0.15 + i * 0.08) + 's');
      stage.appendChild(s);
    }

    document.body.appendChild(stage);

    // Cleanup after the envelope flight ends (animation is 2.1s)
    env.addEventListener('animationend', (ev) => {
      if (ev.animationName === 'mailLiftOff') stage.remove();
    });
    // Belt-and-suspenders cleanup
    setTimeout(() => stage.remove(), 3000);
  }
})();
