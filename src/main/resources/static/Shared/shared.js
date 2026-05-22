const API = 'https://sklinaw.onrender.com/api';
const ADMIN_API = 'https://sklinaw.onrender.com/admin';

// Token management
let authToken = localStorage.getItem('auth_token');

function setAuthToken(token) {
    if (token) {
        localStorage.setItem('auth_token', token);
    } else {
        localStorage.removeItem('auth_token');
    }
}

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

// ── Authenticated Fetch Wrapper (Token-based) ────────────────────────────────
async function authFetch(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${API}${url}`;
    
    // Get token directly from localStorage - THIS IS THE KEY FIX
    const token = localStorage.getItem('auth_token');
    
    console.log('authFetch - URL:', fullUrl);
    console.log('authFetch - Token exists:', !!token);
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.error('No token found in localStorage!');
    }
    
    const mergedOptions = {
        ...options,
        credentials: 'omit',
        headers: headers
    };
    
    try {
        const response = await fetch(fullUrl, mergedOptions);
        
        if (response.status === 401 || response.status === 403) {
            console.warn('Auth failed for URL:', url, 'Status:', response.status);
            const publicPages = ['public.html', 'index.html', 'Login', 'signup.html', 'home.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (!publicPages.includes(currentPage) && !Session.name) {
                Toast.show('Session expired. Please login again.', true);
                Session.clear();
                localStorage.removeItem('auth_token');
                setTimeout(() => {
                    window.location.href = '/Councilor/Log-in/Login';
                }, 1500);
            }
            throw new Error('Unauthorized');
        }
        
        return response;
    } catch (error) {
        console.error('Auth fetch error:', error);
        throw error;
    }
}

async function ngrokFetch(url, options = {}) {
    const defaultHeaders = {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
    };
    
    const mergedOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    return fetch(url, mergedOptions);
}

// ── Session with Role Management (Token-based) ────────────────────────────────
const Session = {
  get name() {
    return localStorage.getItem('sk_name') || '';
  },
  get barangay() {
    return localStorage.getItem('sk_barangay') || '';
  },
  get privilege() {
    return localStorage.getItem('sk_privilege') || '';
  },
  get userId() {
    return localStorage.getItem('sk_user_id') || '';
  },
  get userType() {
    return localStorage.getItem('sk_user_type') || '';
  },
  get token() {
    return localStorage.getItem('auth_token') || '';
  },
  getPrivilege() {
    return this.privilege;
  },
  getUserType() {
    return this.userType;
  },
  getName() {
    return this.name;
  },
  getBarangay() {
    return this.barangay;
  },
  isAdmin() {
    return this.privilege === 'ADMIN' || this.userType === 'developer';
  },
  isChairman() {
    return this.privilege === 'CHAIRMAN';
  },
  isTreasurer() {
    return this.privilege === 'TREASURER';
  },
  isCouncilor() {
    return !this.privilege || this.privilege === '';
  },
  isDeveloper() {
    return this.userType === 'developer' || this.privilege === 'DEVELOPER';
  },
  canAccess(view) {
    switch(view) {
      case 'admin':
        return this.isAdmin() || this.isDeveloper();
      case 'chairman':
        return this.isChairman() || this.isAdmin();
      case 'treasurer':
        return this.isTreasurer() || this.isAdmin();
      case 'councilor':
        return true;
      default:
        return false;
    }
  },
  getRoleTitle() {
    if (this.isDeveloper()) return 'Developer';
    if (this.isAdmin()) return 'Administrator';
    if (this.isChairman()) return 'Chairman';
    if (this.isTreasurer()) return 'Treasurer';
    return 'Councilor';
  },
  set(name, barangay, privilege = '', userId = null, token = null) {
    localStorage.setItem('sk_name', name);
    localStorage.setItem('sk_barangay', barangay);
    localStorage.setItem('sk_privilege', privilege || '');
    if (userId) localStorage.setItem('sk_user_id', userId);
    if (token) setAuthToken(token);
  },
  setUserType(userType) {
    localStorage.setItem('sk_user_type', userType);
  },
  clear() {
    localStorage.removeItem('sk_name');
    localStorage.removeItem('sk_barangay');
    localStorage.removeItem('sk_privilege');
    localStorage.removeItem('sk_user_id');
    localStorage.removeItem('sk_user_type');
    setAuthToken(null);
  }
};

// ── Check if Current Page is Public ────────────────────────────────
function isPublicPage() {
  const publicPages = [
    'public.html', 
    'index.html', 
    'feedback.html', 
    'Login', 
    'signup.html',
    'home.html'
  ];
  const currentPage = window.location.pathname.split('/').pop();
  return publicPages.includes(currentPage);
}

// ── Authentication Check (Token-based) ────────────────────────────────
async function checkAuth() {
  // Skip auth check for public pages
  if (isPublicPage()) {
    return true;
  }
  
  const token = authToken || Session.token;
  if (!token) {
    return false;
  }
  
  try {
    const response = await fetch(`${API}/check-auth`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401 || response.status === 403) {
      return false;
    }
    
    const sessionData = await response.json();
    return sessionData.authenticated === true;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

// ── Protect Page Based on Role ────────────────────────────────
async function protectPage(requiredView) {
  // Skip protection for public pages
  if (isPublicPage()) {
    return true;
  }
  
  // Check if user is logged in
  if (!Session.name) {
    Toast.show('Please login to access this page', true);
    setTimeout(() => {
      window.location.href = '/Councilor/Log-in/Login';
    }, 1500);
    return false;
  }
  
  // Verify session with server
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    Toast.show('Session expired. Please login again.', true);
    Session.clear();
    setTimeout(() => {
      window.location.href = '/Councilor/Log-in/Login';
    }, 1500);
    return false;
  }
  
  // Check role-based access
  if (!Session.canAccess(requiredView)) {
    Toast.show('You do not have permission to access this page', true);
    setTimeout(() => {
      window.location.href = getDefaultRedirect();
    }, 2000);
    return false;
  }
  
  return true;
}

// ── Get Default Redirect Based on Role ────────────────────────────────
function getDefaultRedirect() {
  if (Session.isAdmin() || Session.isDeveloper()) {
    return '/Admin/Approval/admin';
  } else {
    return '/Councilor/Dashboard/Dashboard';
  }
}

// ── User Info Loader ────────────────────────────────
async function loadUserInfo() {
  try {
    const userName = Session.name;
    const userBarangay = Session.barangay;
    
    if (!userName || isPublicPage()) {
      console.warn('No user logged in or public page');
      updateUserDisplay('Guest', 'Not logged in', '?', '');
      return;
    }
    
    const roleTitle = Session.getRoleTitle();
    const displayRole = roleTitle + (userBarangay ? ` (${userBarangay})` : '');
    
    updateUserDisplay(userName, displayRole, getUserInitials(userName), roleTitle);
    
  } catch (error) {
    console.error('Error loading user info:', error);
    updateUserDisplay(Session.name || 'Guest', 'Councilor', getUserInitials(Session.name), '');
  }
}

function getUserInitials(name) {
  if (!name || name === 'Loading…' || name === '—' || name === 'Guest') return '?';
  return name.charAt(0).toUpperCase();
}

function updateUserDisplay(name, roleDisplay, avatarText, roleType) {
  const nameEl = document.getElementById('nameEl');
  const roleEl = document.getElementById('roleEl');
  const avatarEl = document.getElementById('avatarEl');
  
  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = roleDisplay;
  if (avatarEl) avatarEl.textContent = avatarText;
  
  const greetNameEl = document.getElementById('dash-greet-name');
  const greetSubEl = document.getElementById('dash-greet-sub');
  
  if (greetNameEl) greetNameEl.textContent = name;
  if (greetSubEl) greetSubEl.textContent = roleDisplay;
  
  updateTopbarDate();
  showRoleSpecificElements(roleType);
}

function showRoleSpecificElements(roleType) {
  const roleClass = roleType ? roleType.toLowerCase() : '';
  
  document.querySelectorAll('.role-specific').forEach(el => {
    el.style.display = 'none';
  });
  
  if (roleClass) {
    const elementsToShow = document.querySelectorAll(`.role-${roleClass}`);
    elementsToShow.forEach(el => {
      el.style.display = 'block';
    });
  }
}

function updateTopbarDate() {
  const dateEl = document.getElementById('dash-today');
  if (dateEl) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-PH', options);
  }
}

// ── Role-Based Navigation Items ────────────────────────────────
function setupRoleBasedNavigation() {
  const navItems = document.querySelectorAll('[data-role]');
  navItems.forEach(item => {
    const requiredRole = item.dataset.role;
    if (Session.canAccess(requiredRole)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// ── Logout Function (Token-based) ────────────────────────────────
async function logout() {
  const token = authToken || Session.token;
  
  try {
    if (token) {
      await fetch(`${API}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).catch(err => console.warn('Logout notification failed:', err));
    }
    
    Session.clear();
    Toast.show('Logged out successfully');
    
    setTimeout(() => {
      window.location.href = '/Councilor/Log-in/Login';
    }, 500);
  } catch (error) {
    console.error('Logout error:', error);
    Session.clear();
    window.location.href = '/Councilor/Log-in/Login';
  }
}

// ── NAVIGATION ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!isPublicPage()) {
    loadUserInfo();
    setupRoleBasedNavigation();
  }
  
  const buttons = document.querySelectorAll('.nav-item[data-page]');
  const currentPage = window.location.pathname.split('/').pop();

  buttons.forEach(btn => {
    const target = btn.dataset.page;

    if (target === currentPage) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.setAttribute('type', 'button');

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const current = window.location.pathname.split('/').pop();
      if (current === target) return;
      window.location.href = target;
    });
  });
});

// Export functions for use in other files
window.authFetch = authFetch;
window.Session = Session;
window.Toast = Toast;
window.logout = logout;
window.protectPage = protectPage;
window.checkAuth = checkAuth;
window.setAuthToken = setAuthToken; 