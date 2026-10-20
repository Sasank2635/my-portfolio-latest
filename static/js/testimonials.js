/*
 * testimonials.js — opens the submission modal and posts the form to
 * /api/testimonials (server stores it as pending for review).
 */
(function () {
  const modal = document.getElementById('testimonial-modal');
  const form = document.getElementById('testimonial-form');
  const status = document.getElementById('testimonial-status');

  function openModal() {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const first = modal.querySelector('input:not(.hp-field), textarea');
    if (first) setTimeout(() => first.focus(), 60);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-testimonial-open]').forEach((b) =>
    b.addEventListener('click', openModal)
  );
  document.querySelectorAll('[data-testimonial-close]').forEach((b) =>
    b.addEventListener('click', closeModal)
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  if (!form) return;

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    setStatus('Sending…', '');

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus(body.message || 'Thank you! Submitted for review.', 'success');
        form.reset();
        setTimeout(closeModal, 1800);
      } else if (res.status === 429) {
        setStatus('Too many submissions. Please try again later.', 'error');
      } else if (res.status === 422) {
        setStatus('Please check your entries and try again.', 'error');
      } else {
        setStatus((body && body.detail) || 'Something went wrong.', 'error');
      }
    } catch (err) {
      setStatus('Network error. Please try again.', 'error');
    }
  });
})();
