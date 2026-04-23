function togglePw() {
  const inp = document.getElementById('login-password');
  inp.type  = inp.type === 'password' ? 'text' : 'password';
}

async function submitLogin() {
  const name     = document.getElementById('login-name').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');

  hideAlert('login-alert');
  if (!name || !password) {
    setAlert('login-alert', 'Please fill in all fields.');
    return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Logging in…';

  try {
    const res  = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    
    const data = await res.json();  // Parse as JSON instead of text
    
    if (data.status === 'SUCCESS') {
        // ✅ CORRECT: Use the barangay from the response
        Session.set(data.name, data.barangay, name.toLowerCase() === 'admin');
        location.href = Session.isAdmin ? '../Admin/admin.html' : '../Dashboard/dashboard.html';

    } else if (data.status === 'INVALID') {
        setAlert('login-alert', 'Invalid name or password. Please try again.');
        flashError('login-name');
        flashError('login-password');

    } else {
        setAlert('login-alert', 'Server error. Please try again.');
    }
  } catch {
    // Dev preview — no backend
    if (name.toLowerCase() === 'admin') {
      Session.set(name, 'Admin', true);
      location.href = '/Councilor/Admin/admin.html';
    } else if (name) {
      Session.set(name, 'Lahug', false);
      location.href = '/Councilor/Dashboard/dashboard.html';
    } else {
      setAlert('login-alert', '⚠️ Could not connect to server.');
    }
  }

  btn.disabled  = false;
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
