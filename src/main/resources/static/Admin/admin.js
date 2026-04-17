async function loadUsers() {
    try {
        const res = await fetch('/admin/users');
        let users = await res.json();

        const filterEl = document.getElementById('filter');
        const filter = filterEl ? filterEl.value : 'All';

        if (filter !== 'All') {
            users = users.filter(u => {
                return (u.approved === 0 && filter === 'Pending') ||
                       (u.approved === 1 && filter === 'Approved') ||
                       (u.approved === 2 && filter === 'Rejected');
            });
        }

        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        users.forEach(u => {
            const statusText = u.approved === 0 ? 'Pending' : u.approved === 1 ? 'Approved' : 'Rejected';
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${u.id}</td>
              <td>${u.name}</td>
              <td>${u.barangay}</td>
              <td>${statusText}</td>
              <td>
                <button onclick="approveUser(${u.id}, '${u.name}')">✔ Approve</button>
                <button onclick="rejectUser(${u.id}, '${u.name}')">✘ Reject</button>
              </td>
            `;
            tbody.appendChild(tr);
        });

        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = 'List refreshed.';
    } catch (err) {
        console.error('Error loading users:', err);
    }
}

async function approveUser(id, name) {
    try {
        await fetch(`/admin/users/${id}/approve`, { method: 'POST' });
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = `✔ ${name} has been approved.`;
        loadUsers();
    } catch (err) {
        console.error('Error approving user:', err);
    }
}

async function rejectUser(id, name) {
    try {
        await fetch(`/admin/users/${id}/reject`, { method: 'POST' });
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = `✘ ${name} has been rejected.`;
        loadUsers();
    } catch (err) {
        console.error('Error rejecting user:', err);
    }
}

// Event listeners
const filterEl = document.getElementById('filter');
if (filterEl) filterEl.addEventListener('change', loadUsers);

const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) refreshBtn.addEventListener('click', loadUsers);

// Initial load
loadUsers();