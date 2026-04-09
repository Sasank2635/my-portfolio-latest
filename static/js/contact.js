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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Gather data
    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    // Basic client-side validation
    if (!name || !email || !message) {
      showStatus('error', 'Please fill in all fields.');
      return;
    }

    if (message.length < 10) {
      showStatus('error', 'Message must be at least 10 characters.');
      return;
    }

    // Submit
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    hideStatus();

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showStatus('success', data.message);
        form.reset();
      } else {
        showStatus('error', data.detail || data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      showStatus('error', 'Network error. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  function showStatus(type, msg) {
    statusEl.textContent = msg;
    statusEl.className = 'form-status ' + type;
  }

  function hideStatus() {
    statusEl.className = 'form-status';
    statusEl.textContent = '';
  }
})();
