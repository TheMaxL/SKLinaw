// ==================== DOM Elements ====================
const loginForm = {
    nameInput: document.getElementById('login-name'),
    passwordInput: document.getElementById('login-password'),
    loginBtn: document.getElementById('login-btn'),
    alertDiv: document.getElementById('login-alert')
};

// ==================== Helper Functions ====================
function togglePw() {
    const inp = loginForm.passwordInput;
    if (inp) {
        inp.type = inp.type === 'password' ? 'text' : 'password';
    }
}

function storeUserSession(data) {
    localStorage.setItem('sk_name', data.name);
    localStorage.setItem('sk_barangay', data.barangay || '');
    localStorage.setItem('sk_privilege', data.privilege || '');
    localStorage.setItem('sk_user_id', data.id || '');
    localStorage.setItem('sk_user_type', data.userType || 'councilor');
    
    console.log('Session stored:', {
        name: localStorage.getItem('sk_name'),
        privilege: localStorage.getItem('sk_privilege'),
        userType: localStorage.getItem('sk_user_type')
    });
}

function getRedirectUrl(privilege, userType) {
    // Admin/Developer redirect
    if (privilege === 'ADMIN' || userType === 'developer') {
        return '/Admin/Approval/admin';
    }
    
    // Role-based redirect
    switch (privilege) {
        default:
            return '/Councilor/Dashboard/Dashboard';
    }
}

function clearFormAndFocus() {
    if (loginForm.nameInput) loginForm.nameInput.value = '';
    if (loginForm.passwordInput) loginForm.passwordInput.value = '';
    if (loginForm.nameInput) loginForm.nameInput.focus();
}

function showError(message) {
    setAlert('login-alert', message);
    flashError('login-name');
    flashError('login-password');
}

// ==================== Dev Mode Fallback (Backend Unavailable) ====================
function handleDevModeFallback(name) {
    console.warn('Using development fallback - backend not available');
    
    if (name.toLowerCase() === 'admin') {
        localStorage.setItem('sk_name', name);
        localStorage.setItem('sk_barangay', 'Admin');
        localStorage.setItem('sk_privilege', 'ADMIN');
        localStorage.setItem('sk_user_type', 'developer');
        window.location.href = '/Admin/Approval/admin';
    } else if (name) {
        localStorage.setItem('sk_name', name);
        localStorage.setItem('sk_barangay', 'Lahug');
        localStorage.setItem('sk_privilege', '');
        localStorage.setItem('sk_user_type', 'councilor');
        window.location.href = '/Councilor/Dashboard/dashboard';
    } else {
        setAlert('login-alert', '⚠️ Could not connect to server. Please try again.');
    }
}

// ==================== Main Login Function ====================
async function submitLogin() {
    const name = loginForm.nameInput?.value.trim();
    const password = loginForm.passwordInput?.value;
    const btn = loginForm.loginBtn;

    // Reset alert
    hideAlert('login-alert');
    
    // Validate inputs
    if (!name || !password) {
        setAlert('login-alert', 'Please fill in all fields.');
        return;
    }

    // Show loading state
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Logging in…';
    }

    try {
        const response = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            credentials: 'include',
            body: JSON.stringify({ name, password })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
        if (data.status === 'SUCCESS') {
            // Store user session
            storeUserSession(data);
            
            // Get redirect URL and navigate
            const redirectUrl = getRedirectUrl(data.privilege, data.userType);
            window.location.href = redirectUrl;
            
        } else if (data.status === 'INVALID') {
            showError('Invalid name or password. Please try again.');
            clearFormAndFocus();
        } else {
            setAlert('login-alert', 'Server error. Please try again.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        handleDevModeFallback(name);
    } finally {
        // Reset button state
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Log In';
        }
    }
}

// ==================== Event Listeners ====================
// Enter key support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitLogin();
    }
});

// Optional: Clear alert when user starts typing
if (loginForm.nameInput) {
    loginForm.nameInput.addEventListener('input', () => hideAlert('login-alert'));
}
if (loginForm.passwordInput) {
    loginForm.passwordInput.addEventListener('input', () => hideAlert('login-alert'));
}