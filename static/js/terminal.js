/**
 * terminal.js — Terminal typing animation
 *
 * Types out commands one-by-one into the hero terminal element,
 * with realistic delay and cursor blinking.
 */

(function () {
  'use strict';

  const container = document.getElementById('terminal-lines');
  if (!container) return;

  // Commands to type out (HTML supported for coloring)
  const COMMANDS = [
    { text: '# Deploy pipeline v3.2', cls: 'cmt' },
    { prompt: true, text: 'kubectl apply <span class="flag">-f</span> <span class="str">deployment.yaml</span>' },
    { prompt: true, text: 'docker build <span class="flag">-t</span> <span class="str">agent-core:latest</span> .' },
    { prompt: true, text: 'terraform plan <span class="flag">-var-file</span>=<span class="str">prod.tfvars</span>' },
    { prompt: true, text: 'python <span class="str">agent.py</span> <span class="flag">--mode</span> autonomous' },
    { prompt: true, text: 'pytest <span class="flag">-v</span> <span class="str">tests/</span>', suffix: ' <span class="ok">✓ 142 passed</span>' },
    { prompt: true, text: 'git push origin main', suffix: ' <span class="ok">→ deployed</span>' },
  ];

  const CHAR_DELAY = 30;    // ms per character
  const LINE_DELAY = 400;   // ms between lines
  const SUFFIX_DELAY = 300; // ms before showing suffix

  let currentLine = 0;

  function createLine() {
    const div = document.createElement('div');
    div.style.minHeight = '1.5em';
    container.appendChild(div);
    return div;
  }

  async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function typeLine(cmd) {
    const lineEl = createLine();

    if (cmd.cls) {
      // Non-prompt line (comment) — type as plain text
      const plain = cmd.text;
      let output = '';
      for (let i = 0; i < plain.length; i++) {
        output += plain[i];
        lineEl.innerHTML = `<span class="${cmd.cls}">${output}<span class="typing-cursor">█</span></span>`;
        await sleep(CHAR_DELAY * 0.6);
      }
      lineEl.innerHTML = `<span class="${cmd.cls}">${plain}</span>`;
    } else {
      // Prompt line — type character by character (strip HTML for typing)
      const stripped = cmd.text.replace(/<[^>]*>/g, '');
      let charIndex = 0;
      lineEl.innerHTML = `<span class="cmd">$</span> <span class="typing-cursor">█</span>`;
      await sleep(200);

      for (let i = 0; i < stripped.length; i++) {
        charIndex++;
        const partial = stripped.substring(0, charIndex);
        lineEl.innerHTML = `<span class="cmd">$</span> ${partial}<span class="typing-cursor">█</span>`;
        await sleep(CHAR_DELAY);
      }

      // Replace with full colored HTML
      lineEl.innerHTML = `<span class="cmd">$</span> ${cmd.text}`;

      // Show suffix if any
      if (cmd.suffix) {
        await sleep(SUFFIX_DELAY);
        lineEl.innerHTML += cmd.suffix;
      }
    }
  }

  async function runTerminal() {
    // Wait for page load animations
    await sleep(1800);

    for (let i = 0; i < COMMANDS.length; i++) {
      await typeLine(COMMANDS[i]);
      await sleep(LINE_DELAY);
    }

    // Final blinking cursor
    const cursorLine = createLine();
    cursorLine.innerHTML = `<span class="cmd">$</span> <span class="typing-cursor">█</span>`;
  }

  runTerminal();
})();
