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
    const text = await res.text();

    if (text === 'SUCCESS') {
      Session.set(name, Session.barangay || 'Lahug', name.toLowerCase() === 'admin');
      location.href = Session.isAdmin ? 'admin.html' : 'dashboard.html';
    } else {
      setAlert('login-alert', 'Invalid name or password. Please try again.');
      flashError('login-name');
      flashError('login-password');
    }
  } catch {
    // Dev preview — no backend
    if (name.toLowerCase() === 'admin') {
      Session.set(name, 'Admin', true);
      location.href = 'admin.html';
    } else if (name) {
      Session.set(name, 'Lahug', false);
      location.href = 'dashboard.html';
    } else {
      setAlert('login-alert', '⚠️ Could not connect to server.');
    }
  }

  btn.disabled  = false;
  btn.innerHTML = 'Log In';
}

// Enter key support
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') submitLogin();
});
