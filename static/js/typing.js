/*
 * typing.js — types out the hero headline character by character.
 * Keeps the existing .line / .gradient markup (so the purple gradient still
 * applies) and reserves the final height up front so nothing jumps.
 * Skipped under prefers-reduced-motion (headline shows instantly).
 */
(function () {
  const h1 = document.querySelector('.hero h1');
  if (!h1) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const START_DELAY = 500;
  const CHAR_MS = 55;
  const LINE_PAUSE = 220;
  const CARET_LINGER = 2200;

  const parts = [];
  const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.nodeValue.trim()) continue;
    parts.push({
      node,
      text: node.nodeValue,
      line: node.parentElement.closest('.line') || node.parentElement,
    });
  }
  if (!parts.length) return;

  // Screen readers get the full headline, not the half-typed one.
  h1.setAttribute('aria-label', parts.map((p) => p.text.trim()).join(' '));
  h1.style.minHeight = h1.offsetHeight + 'px';
  h1.classList.add('typewriter');
  parts.forEach((p) => { p.node.nodeValue = ''; });

  const caret = document.createElement('span');
  caret.className = 'type-caret';
  caret.setAttribute('aria-hidden', 'true');

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function run() {
    await sleep(START_DELAY);
    for (const part of parts) {
      part.line.appendChild(caret);
      for (let i = 1; i <= part.text.length; i++) {
        part.node.nodeValue = part.text.slice(0, i);
        await sleep(CHAR_MS);
      }
      await sleep(LINE_PAUSE);
    }
    h1.style.minHeight = '';
    setTimeout(() => caret.remove(), CARET_LINGER);
  }

  run();
})();
