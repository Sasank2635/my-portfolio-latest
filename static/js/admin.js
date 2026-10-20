/*
 * admin.js — testimonial moderation UI.
 * The admin token is kept only in sessionStorage and sent as the
 * X-Admin-Token header on every API call. No data loads without it.
 */
(function () {
  const KEY = 'portfolio_admin_token';
  const $ = (id) => document.getElementById(id);

  const loginBox = $('admin-login');
  const dash = $('admin-dash');
  const loginForm = $('admin-login-form');
  const tokenInput = $('admin-token');
  const loginStatus = $('admin-login-status');

  const getToken = () => sessionStorage.getItem(KEY) || '';

  async function api(path, opts = {}) {
    return fetch(path, {
      ...opts,
      headers: { ...(opts.headers || {}), 'X-Admin-Token': getToken() },
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function makeCard(t, isPending) {
    const el = document.createElement('div');
    el.className = 'admin-item';
    el.innerHTML =
      '<blockquote>' + escapeHtml(t.message) + '</blockquote>' +
      '<div class="admin-item-meta">' + escapeHtml(t.name) + ' · ' + escapeHtml(t.role) +
      '<span class="admin-item-date">' + escapeHtml((t.created_at || '').slice(0, 10)) + '</span></div>' +
      '<div class="admin-item-actions"></div>';
    const actions = el.querySelector('.admin-item-actions');
    if (isPending) {
      const ap = document.createElement('button');
      ap.className = 'btn-approve';
      ap.textContent = 'Approve';
      ap.onclick = () => approve(t.id);
      actions.appendChild(ap);
    }
    const del = document.createElement('button');
    del.className = 'btn-delete';
    del.textContent = 'Delete';
    del.onclick = () => remove(t.id);
    actions.appendChild(del);
    return el;
  }

  async function load() {
    const res = await api('/api/testimonials/all');
    if (res.status === 403) { logout(); return; }
    const data = await res.json();
    const items = data.testimonials || [];
    const pending = items.filter((t) => t.status === 'pending');
    const approved = items.filter((t) => t.status === 'approved');

    const pl = $('pending-list');
    const al = $('approved-list');
    pl.innerHTML = '';
    al.innerHTML = '';
    $('pending-count').textContent = pending.length;
    $('approved-count').textContent = approved.length;

    pending.forEach((t) => pl.appendChild(makeCard(t, true)));
    approved.forEach((t) => al.appendChild(makeCard(t, false)));
    if (!pending.length) pl.innerHTML = '<p class="admin-empty">Nothing pending 🎉</p>';
    if (!approved.length) al.innerHTML = '<p class="admin-empty">No published testimonials yet.</p>';
  }

  async function approve(id) {
    await api('/api/testimonials/' + id + '/approve', { method: 'POST' });
    load();
  }

  async function remove(id) {
    if (!window.confirm('Delete this testimonial permanently?')) return;
    await api('/api/testimonials/' + id, { method: 'DELETE' });
    load();
  }

  function showDash() {
    loginBox.hidden = true;
    dash.hidden = false;
    load();
  }

  function logout() {
    sessionStorage.removeItem(KEY);
    dash.hidden = true;
    loginBox.hidden = false;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    sessionStorage.setItem(KEY, tokenInput.value.trim());
    loginStatus.textContent = 'Checking…';
    loginStatus.className = 'form-status';
    const res = await api('/api/testimonials/all');
    if (res.ok) {
      loginStatus.textContent = '';
      tokenInput.value = '';
      showDash();
    } else {
      sessionStorage.removeItem(KEY);
      loginStatus.textContent = 'Invalid token.';
      loginStatus.className = 'form-status error';
    }
  });

  $('admin-refresh').addEventListener('click', load);
  $('admin-logout').addEventListener('click', logout);

  // Resume an existing session without re-entering the token.
  if (getToken()) showDash();
})();
