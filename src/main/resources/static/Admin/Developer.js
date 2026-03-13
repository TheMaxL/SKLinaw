async function loadUsers() {
    const res = await fetch('/admin/users');
    let users = await res.json();
    const filter = document.getElementById('filter').value;

    if (filter !== 'All') {
        users = users.filter(u => {
            return (u.approved === 0 && filter==='Pending') ||
                   (u.approved === 1 && filter==='Approved') ||
                   (u.approved === 2 && filter==='Rejected');
        });
    }

    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    users.forEach(u => {
        const statusText = u.approved === 0 ? 'Pending' : u.approved === 1 ? 'Approved' : 'Rejected';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${u.id}</td>
          <td>${u.username}</td>
          <td>${u.barangay}</td>
          <td>${statusText}</td>
          <td>
            <button class="approve" onclick="approveUser(${u.id}, '${u.username}')">✔ Approve</button>
            <button class="reject" onclick="rejectUser(${u.id}, '${u.username}')">✘ Reject</button>
          </td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('status').textContent = 'List refreshed.';
}

async function approveUser(id, username) {
    await fetch(`/admin/users/${id}/approve`, { method: 'POST' });
    document.getElementById('status').textContent = `✔ ${username} has been approved.`;
    loadUsers();
}

async function rejectUser(id, username) {
    await fetch(`/admin/users/${id}/reject`, { method: 'POST' });
    document.getElementById('status').textContent = `✘ ${username} has been rejected.`;
    loadUsers();
}

document.getElementById('filter').addEventListener('change', loadUsers);
document.getElementById('refreshBtn').addEventListener('click', loadUsers);

// Initial load
loadUsers();