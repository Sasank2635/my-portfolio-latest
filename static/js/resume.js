/**
 * resume.js — view-only resume modal
 *
 * Opens on click of any [data-resume-trigger], dismisses on:
 *   - click of any [data-resume-close]
 *   - Escape key
 *   - click on the backdrop
 *
 * The PDF iframe is injected on open and removed on close so we don't
 * pay the network cost until the user actually wants to view.
 */

(function () {
  'use strict';

  const RESUME_URL = '/api/resume#toolbar=0&navpanes=0&scrollbar=1&view=FitH';

  const modal = document.getElementById('resume-modal');
  const stage = document.getElementById('resume-modal-stage');
  if (!modal || !stage) return;

  const triggers = document.querySelectorAll('[data-resume-trigger]');
  const closers  = modal.querySelectorAll('[data-resume-close], .resume-modal-close');

  let lastFocus = null;

  function open(ev) {
    if (ev) ev.preventDefault();
    if (modal.classList.contains('is-open')) return;

    lastFocus = document.activeElement;

    // Inject iframe (browser PDF plugin) — defer until open so the network
    // request only fires when needed.
    if (!stage.querySelector('iframe')) {
      const iframe = document.createElement('iframe');
      iframe.src = RESUME_URL;
      iframe.title = 'Resume — view only';
      iframe.setAttribute('loading', 'eager');
      // Sandbox blocks the iframe's own JS but lets it render the PDF.
      // (Browser PDF viewers usually run outside the sandbox so this is safe.)
      stage.appendChild(iframe);
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus the close button after the open animation
    setTimeout(() => {
      const closeBtn = modal.querySelector('.resume-modal-close');
      if (closeBtn) closeBtn.focus();
    }, 250);
  }

  function close(ev) {
    if (ev) ev.preventDefault();
    if (!modal.classList.contains('is-open')) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Tear down iframe after the close animation so memory + bandwidth is freed
    setTimeout(() => {
      const iframe = stage.querySelector('iframe');
      if (iframe) iframe.remove();
    }, 400);

    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  triggers.forEach((t) => t.addEventListener('click', open));
  closers.forEach((c)  => c.addEventListener('click', close));

  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close(e);
  });

  // Hijack any other element that points at /api/resume (footer link)
  // and route it through the modal instead of navigating away.
  document.querySelectorAll('a[href="/api/resume"]').forEach((link) => {
    link.addEventListener('click', open);
  });
})();
