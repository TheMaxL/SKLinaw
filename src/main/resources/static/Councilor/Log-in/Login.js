function togglePw() {
  const inp = document.getElementById('login-password');
  inp.type  = inp.type === 'password' ? 'text' : 'password';
}

async function submitLogin() {
  const name = document.getElementById('login-name').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  hideAlert('login-alert');
  if (!name || !password) {
    setAlert('login-alert', 'Please fill in all fields.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Logging in…';

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    
    const data = await res.json();
    console.log('Login response:', data); // Debug
    
    if (data.status === 'SUCCESS') {
      // Store ALL data correctly
      localStorage.setItem('sk_name', data.name);
      localStorage.setItem('sk_barangay', data.barangay);
      localStorage.setItem('sk_privilege', data.privilege || '');
      
      console.log('Stored - Name:', localStorage.getItem('sk_name'));
      console.log('Stored - Barangay:', localStorage.getItem('sk_barangay'));
      console.log('Stored - Privilege:', localStorage.getItem('sk_privilege'));
      
      // ✅ Redirect ALL users to Dashboard first
      // The Dashboard will then show appropriate options based on privilege
      window.location.href = '/Councilor/Dashboard/dashboard.html';
  } else if (data.status === 'INVALID') {
        setAlert('login-alert', 'Invalid name or password. Please try again.');
        flashError('login-name');
        flashError('login-password');
    } else {
        setAlert('login-alert', 'Server error. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    setAlert('login-alert', '⚠️ Could not connect to server.');
  }

  btn.disabled = false;
  btn.innerHTML = 'Log In';
}

async function handleLogin(name, password) {
  const response = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
  });
  
  const result = await response.text();
  
  if (result === "SUCCESS") {
      // Store user info in session
      Session.set(name, barangay, false);
      
      // Fetch additional user info if needed
      await loadUserInfo();
      
      // Redirect to dashboard
      window.location.href = 'dashboard.html';
  } else {
      Toast.show('Invalid credentials', true);
  }
}

// Enter key support
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') submitLogin();
});
