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

    if (text !== 'INVALID' && text !== 'ERROR') {
        const barangay = text;

        Session.set(name, barangay, name.toLowerCase() === 'admin');
        location.href = Session.isAdmin ? '/Admin/admin.html' : '/Dashboard/dashboard.html';

        } else if (text === 'INVALID') {
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
      location.href = '/Admin/admin.html';
    } else if (name) {
      Session.set(name, 'Lahug', false);
      location.href = '/Dashboard/dashboard.html';
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
