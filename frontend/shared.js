const API = 'http://localhost:8080/api';

// ── Toast ──────────────────────────────────
const Toast = {
  el:    document.getElementById('global-toast'),
  timer: null,
  show(msg, isError = false) {
    this.el.textContent = msg;
    this.el.className   = 'toast show' + (isError ? ' toast-error' : '');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('show'), 3500);
  }
};

// ── Helpers ────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtDate(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }); }
  catch { return s; }
}
function fmtDateShort(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-PH', { month:'short', day:'numeric' }); }
  catch { return s; }
}
function setAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className   = `alert alert-${type} show`;
}
function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'alert';
}
function flashError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--error)';
  setTimeout(() => el.style.borderColor = '', 2000);
}

// ── Session ────────────────────────────────
const Session = {
  get name()     { return localStorage.getItem('sk_name')     || ''; },
  get barangay() { return localStorage.getItem('sk_barangay') || 'Lahug'; },
  get isAdmin()  { return localStorage.getItem('sk_admin')    === 'true'; },
  set(name, barangay, isAdmin = false) {
    localStorage.setItem('sk_name',     name);
    localStorage.setItem('sk_barangay', barangay);
    localStorage.setItem('sk_admin',    isAdmin ? 'true' : 'false');
  },
  clear() {
    localStorage.removeItem('sk_name');
    localStorage.removeItem('sk_barangay');
    localStorage.removeItem('sk_admin');
  }
};
