const API = "http://localhost:8080/admin";

let allAccounts = [];
let activeTab   = 'pending';

document.addEventListener('DOMContentLoaded', () => {
  if (!Session.isAdmin) { location.href = 'login.html'; return; }

  // Tab buttons
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      renderTable();
    });
  });

  document.getElementById('refresh-btn').addEventListener('click', loadAll);

  document.getElementById('logout-btn').addEventListener('click', () => {
    Session.clear();
    Toast.show('Logged out.');
    setTimeout(() => location.href = 'index.html', 800);
  });

  loadAll();
});

async function loadAll() {
  document.getElementById('admin-table-body').innerHTML =
    '<tr class="loader-row"><td colspan="5"><div class="loader"><span></span><span></span><span></span></div></td></tr>';

  try {
    const res = await fetch(`${API}/users`);
    if (!res.ok) throw new Error("Failed to fetch");

    allAccounts = await res.json();

  } catch (err) {
    console.error(err);

    // Dev preview fallback
    allAccounts = [
      { id: 1, name: 'Juan Dela Cruz',  barangay: 'Lahug',   photo: 'proof1.jpg', approved: 0 },
      { id: 2, name: 'Maria Santos',    barangay: 'Apas',    photo: 'proof2.jpg', approved: 1 },
      { id: 3, name: 'Pedro Reyes',     barangay: 'Banilad', photo: 'proof3.jpg', approved: 0 },
    ];
  }

  renderStats();
  renderTable();
}

function renderStats() {
  const pending  = allAccounts.filter(a => a.approved === 0).length;
  const approved = allAccounts.filter(a => a.approved === 1).length;

  document.getElementById('admin-stat-pending').textContent  = pending;
  document.getElementById('admin-stat-approved').textContent = approved;
  document.getElementById('admin-stat-total').textContent    = allAccounts.length;
  document.getElementById('admin-pending-badge').textContent = pending;
}

function renderTable() {
  const tbody = document.getElementById('admin-table-body');

  let rows = allAccounts;
  if (activeTab === 'pending')  rows = allAccounts.filter(a => a.approved === 0);
  if (activeTab === 'approved') rows = allAccounts.filter(a => a.approved === 1);

  if (!rows.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No accounts in this category.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((a, i) => `
    <tr style="animation-delay:${i * 0.05}s">
      <td class="name-cell">${esc(a.name)}</td>
      <td style="color:var(--muted)">${esc(a.barangay)}</td>
      <td>
        ${a.photo
          ? `<a href="http://localhost:8080/uploads/${esc(a.photo)}" target="_blank" style="color:var(--teal);font-size:0.8rem">📎 ${esc(a.photo)}</a>`
          : '<span style="color:var(--muted);font-size:0.8rem">No file</span>'}
      </td>
      <td><span class="pill ${a.approved === 1 ? 'pill-approved' : 'pill-pending'}">${a.approved === 1 ? 'Approved' : 'Pending'}</span></td>
      <td>
        <div class="action-cell">
          ${a.approved === 0
            ? `<button class="btn btn-success btn-sm" onclick="approveAccount(${a.id})">✓ Approve</button>
               <button class="btn btn-danger btn-sm"  onclick="rejectAccount(${a.id})">✗ Reject</button>`
            : '<span style="color:var(--muted);font-size:0.78rem">—</span>'}
        </div>
      </td>
    </tr>`).join('');
}

async function approveAccount(id) {
  try {
    const res = await fetch(`${API}/users/${id}/approve`, {
      method: 'POST'
    });

    if (!res.ok) throw new Error("Approve failed");

  } catch (err) {
    console.error(err);
  }

  // Update UI locally
  const acc = allAccounts.find(a => a.id === id);
  if (acc) acc.approved = 1;

  renderStats();
  renderTable();
  Toast.show('Account approved successfully.');
}

async function rejectAccount(id) {
  if (!confirm('Are you sure you want to reject this account?')) return;

  try {
    const res = await fetch(`${API}/users/${id}/reject`, {
      method: 'POST'
    });

    if (!res.ok) throw new Error("Reject failed");

  } catch (err) {
    console.error(err);
  }

  // Remove from UI
  allAccounts = allAccounts.filter(a => a.id !== id);

  renderStats();
  renderTable();
  Toast.show('Account rejected.');
}