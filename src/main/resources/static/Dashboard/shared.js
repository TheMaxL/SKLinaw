const API = 'http://localhost:8085/api';

// ── Toast ──────────────────────────────────
const Toast = {
  el: document.getElementById('global-toast'),
  timer: null,
  show(msg, isError = false) {
    if (!this.el) return;
    this.el.textContent = msg;
    this.el.className = 'toast show' + (isError ? ' toast-error' : '');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('show'), 3500);
  }
};

// ── Helpers ────────────────────────────────
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtDate(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return s;
  }
}

function fmtDateShort(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return s;
  }
}

function setAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert alert-${type} show`;
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'alert';
}

function flashError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--error)';
  setTimeout(() => (el.style.borderColor = ''), 2000);
}

// ── Session ────────────────────────────────
const Session = {
  get name() {
    return localStorage.getItem('sk_name') || '';
  },
  get barangay() {
    return localStorage.getItem('sk_barangay') || 'Lahug';
  },
  get isAdmin() {
    return localStorage.getItem('sk_admin') === 'true';
  },
  set(name, barangay, isAdmin = false) {
    localStorage.setItem('sk_name', name);
    localStorage.setItem('sk_barangay', barangay);
    localStorage.setItem('sk_admin', isAdmin ? 'true' : 'false');
  },
  clear() {
    localStorage.removeItem('sk_name');
    localStorage.removeItem('sk_barangay');
    localStorage.removeItem('sk_admin');
  }
};

// ── NAVIGATION (FINAL FIXED VERSION) ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.nav-item[data-page]');
  const currentPage = window.location.pathname.split('/').pop();

  buttons.forEach(btn => {
    const target = btn.dataset.page;

    // ✅ Set active state
    if (target === currentPage) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    // ✅ Prevent form submission behavior
    btn.setAttribute('type', 'button');

    // ✅ Attach safe click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const current = window.location.pathname.split('/').pop();

      // 🚫 Prevent infinite reload loop
      if (current === target) return;

      // ✅ Navigate (relative path = safer)
      window.location.href = target;
    });
  });
});