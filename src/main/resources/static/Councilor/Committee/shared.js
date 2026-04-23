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
  get userId() {
    return localStorage.getItem('sk_user_id') || '';
  },
  set(name, barangay, isAdmin = false, userId = null) {
    localStorage.setItem('sk_name', name);
    localStorage.setItem('sk_barangay', barangay);
    localStorage.setItem('sk_admin', isAdmin ? 'true' : 'false');
    if (userId) {
      localStorage.setItem('sk_user_id', userId);
    }
  },
  clear() {
    localStorage.removeItem('sk_name');
    localStorage.removeItem('sk_barangay');
    localStorage.removeItem('sk_admin');
    localStorage.removeItem('sk_user_id');
  }
};

// ── User Info Loader ────────────────────────────────
async function loadUserInfo() {
  try {
    // Get user info from session
    const userName = Session.name;
    const userBarangay = Session.barangay;
    
    if (!userName) {
      console.warn('No user logged in');
      updateUserDisplay('Guest', 'Not logged in', '?');
      return;
    }
    
    // Try to fetch user details from server
    const response = await fetch(`${API}/getUserInfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userName,
        barangay: userBarangay
      })
    });
    
    if (response.ok) {
      const userData = await response.json();
      updateUserDisplay(userData.name, userData.role || 'Councilor', getUserInitials(userData.name));
    } else {
      // Fallback to session data
      updateUserDisplay(userName, 'Councilor', getUserInitials(userName));
    }
  } catch (error) {
    console.error('Error loading user info:', error);
    // Fallback to session data
    updateUserDisplay(Session.name, 'Councilor', getUserInitials(Session.name));
  }
}

function getUserInitials(name) {
  if (!name || name === 'Loading…' || name === '—') return '?';
  return name.charAt(0).toUpperCase();
}

function updateUserDisplay(name, role, avatarText) {
  // Update sidebar footer elements
  const nameEl = document.getElementById('nameEl');
  const roleEl = document.getElementById('roleEl');
  const avatarEl = document.getElementById('avatarEl');
  
  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role;
  if (avatarEl) avatarEl.textContent = avatarText;
  
  // Update topbar greeting elements
  const greetNameEl = document.getElementById('dash-greet-name');
  const greetSubEl = document.getElementById('dash-greet-sub');
  
  if (greetNameEl) greetNameEl.textContent = name;
  if (greetSubEl) greetSubEl.textContent = role;
  
  // Update topbar date
  updateTopbarDate();
}

function updateTopbarDate() {
  const dateEl = document.getElementById('dash-today');
  if (dateEl) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-PH', options);
  }
}

// ── Logout Function ────────────────────────────────
async function logout() {
  try {
    // Clear session
    Session.clear();
    
    // Optional: Notify server about logout
    await fetch(`${API}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).catch(err => console.warn('Logout notification failed:', err));
    
    // Redirect to login page
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if server call fails
    window.location.href = 'login.html';
  }
}

// ── NAVIGATION (FINAL FIXED VERSION) ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Load user info when page loads
  loadUserInfo();
  
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