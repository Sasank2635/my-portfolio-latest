/**
 * resume.js — view-only resume modal with PDF.js renderer
 *
 * Renders the resume PDF page-by-page to <canvas> elements inside the
 * modal. Bypasses the browser's native PDF viewer entirely — so there
 * is no download button anywhere in the chrome and iOS Safari renders
 * the same as desktop / Android.
 *
 * Lazy-loads PDF.js from CDN on first open so we don't pay the network
 * cost until the user actually clicks "View Resume".
 *
 * Dismisses on: [data-resume-close] click, Escape key, backdrop click.
 */

(function () {
  'use strict';

  const RESUME_URL = '/api/resume';

  // PDF.js v3.11 — stable UMD build, exposes window.pdfjsLib
  const PDFJS_LIB    = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const modal = document.getElementById('resume-modal');
  const stage = document.getElementById('resume-modal-stage');
  if (!modal || !stage) return;

  const triggers = document.querySelectorAll('[data-resume-trigger]');
  const closers  = modal.querySelectorAll('[data-resume-close], .resume-modal-close');

  let lastFocus    = null;
  let pdfPromise   = null;  // cached PDF document promise
  let libPromise   = null;  // cached library loader promise
  let renderToken  = 0;     // bumped on each open() to abort stale renders

  /**
   * Lazy-loads PDF.js once. Returns the same promise on subsequent calls.
   */
  function loadPdfJs() {
    if (libPromise) return libPromise;
    libPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PDFJS_LIB;
      s.async = true;
      s.onload = () => {
        if (!window.pdfjsLib) return reject(new Error('PDF.js failed to expose pdfjsLib'));
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(s);
    });
    return libPromise;
  }

  /**
   * Renders every page of the resume PDF into the stage. Cancellable
   * via renderToken — if the modal is closed while a render is in
   * flight, we bail out cleanly.
   */
  async function renderPdf(myToken) {
    showStatus('Loading PDF.js…');

    let pdfjsLib;
    try {
      pdfjsLib = await loadPdfJs();
    } catch (err) {
      showError('Could not load PDF library.');
      return;
    }

    if (myToken !== renderToken) return;

    showStatus('Fetching resume…');

    if (!pdfPromise) {
      pdfPromise = pdfjsLib.getDocument(RESUME_URL).promise.catch((err) => {
        pdfPromise = null;
        throw err;
      });
    }

    let pdf;
    try {
      pdf = await pdfPromise;
    } catch (err) {
      showError('Could not fetch the resume.');
      return;
    }

    if (myToken !== renderToken) return;

    // Clear status / previous render
    clearStage();

    // Render at a scale that matches the modal width for crispness on hi-DPI
    const stageWidth = stage.clientWidth || 800;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (myToken !== renderToken) return;

      let page;
      try {
        page = await pdf.getPage(pageNum);
      } catch (err) {
        // Skip a failed page, keep going
        continue;
      }

      // Compute scale so the page width fills the stage minus padding
      const baseViewport = page.getViewport({ scale: 1 });
      const targetWidth  = Math.max(320, stageWidth - 32);
      const scale = (targetWidth / baseViewport.width) * dpr;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.className = 'resume-page';
      canvas.width  = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width  = (viewport.width  / dpr) + 'px';
      canvas.style.height = (viewport.height / dpr) + 'px';

      const ctx = canvas.getContext('2d', { alpha: false });

      try {
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        continue;
      }

      if (myToken !== renderToken) return;
      stage.appendChild(canvas);
    }

    if (myToken === renderToken && !stage.querySelector('.resume-page')) {
      showError('No pages rendered.');
    }
  }

  function showStatus(text) {
    clearStage();
    const el = document.createElement('div');
    el.className = 'resume-status';
    el.innerHTML = `
      <span class="resume-status-pulse" aria-hidden="true"></span>
      <span class="resume-status-text">${text}</span>
    `;
    stage.appendChild(el);
  }

  function showError(text) {
    clearStage();
    const el = document.createElement('div');
    el.className = 'resume-status resume-status-error';
    el.innerHTML = `
      <span class="resume-status-text">${text}</span>
      <a href="${RESUME_URL}" target="_blank" rel="noopener" class="resume-status-fallback">Open in new tab →</a>
    `;
    stage.appendChild(el);
  }

  function clearStage() {
    while (stage.firstChild) stage.removeChild(stage.firstChild);
  }

  function open(ev) {
    if (ev) ev.preventDefault();
    if (modal.classList.contains('is-open')) return;

    lastFocus = document.activeElement;
    renderToken++;
    const myToken = renderToken;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Kick off PDF render after the open animation begins so the
    // scale-in feels immediate
    setTimeout(() => { renderPdf(myToken); }, 80);

    setTimeout(() => {
      const closeBtn = modal.querySelector('.resume-modal-close');
      if (closeBtn) closeBtn.focus();
    }, 280);
  }

  function close(ev) {
    if (ev) ev.preventDefault();
    if (!modal.classList.contains('is-open')) return;

    renderToken++; // abort any in-flight render
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Tear down rendered pages after the close animation
    setTimeout(() => { clearStage(); }, 400);

    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  triggers.forEach((t) => t.addEventListener('click', open));
  closers.forEach((c)  => c.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close(e);
  });

  // Intercept any link pointing at /api/resume (e.g. the footer link)
  document.querySelectorAll('a[href="/api/resume"]').forEach((link) => {
    link.addEventListener('click', open);
  });

  // Re-render on resize (so the canvases stay crisp at the new width)
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (!modal.classList.contains('is-open')) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderToken++;
      renderPdf(renderToken);
    }, 250);
  }, { passive: true });
})();
