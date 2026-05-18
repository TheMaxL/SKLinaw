const PAGE_SIZE = 10;

const session = {
  name:     localStorage.getItem('sk_name') || 'Councilor',
  barangay: localStorage.getItem('sk_barangay') || '',
  privilege: localStorage.getItem('sk_privilege') || ''
};

// Update sidebar
const nameEl = document.getElementById('nameEl');
const avatarEl = document.getElementById('avatarEl');
const roleEl = document.getElementById('roleEl');

if (nameEl) nameEl.textContent = session.name;
if (avatarEl) avatarEl.textContent = session.name.charAt(0).toUpperCase();
if (roleEl) roleEl.textContent = session.privilege || 'Councilor';

let allExpenses      = [];
let filteredExpenses = [];
let activePage       = 1;
let activeCommittee  = 'all';
let sortField        = 'date';
let sortDir          = 'desc';

async function init() {
  try {
    const res = await fetch(`${API}/getExpenses?barangay=${encodeURIComponent(session.barangay)}`, {
      credentials: 'include'
    });
    const text = await res.text();
    
    if (text === 'ERROR') {
      console.error('Failed to load expenses');
      allExpenses = [];
    } else {
      allExpenses = JSON.parse(text);
    }
    
    // If no expenses in DB, show empty state (no demo data!)
    if (!allExpenses.length) {
      console.log('No expenses found in database');
    }
    
    buildSummary();
    buildCommitteeTabs();
    applyFilters();
    
  } catch (e) {
    console.error('Error loading expenses:', e);
    allExpenses = [];
    buildSummary();
    buildCommitteeTabs();
    applyFilters();
  }
}

function buildSummary() {
  const total    = allExpenses.length;
  const amount   = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const projects = allExpenses.filter(e => e.type === 'PROJECT').length;
  const payments = allExpenses.filter(e => e.type === 'PAYMENT').length;
  
  document.getElementById('sumTotal').textContent = total;
  document.getElementById('sumAmount').textContent = '₱' + amount.toLocaleString('en-PH');
  document.getElementById('sumProjects').textContent = projects;
  document.getElementById('sumPayments').textContent = payments;
}

function buildCommitteeTabs() {
  const committees = [...new Set(allExpenses.map(e => e.committeeName).filter(c => c))];
  const tabsEl = document.getElementById('committeeTabs');
  const allCount = allExpenses.length;

  if (!tabsEl) return;
  
  tabsEl.innerHTML =
    `<button class="ctab active" onclick="setCommittee('all', this)">
       All <span class="ctab-count">${allCount}</span>
     </button>` +
    committees.map(c => {
      const count = allExpenses.filter(e => e.committeeName === c).length;
      return `<button class="ctab" onclick="setCommittee('${esc(c)}', this)">
        ${esc(c)} <span class="ctab-count">${count}</span>
      </button>`;
    }).join('');
}

function setCommittee(committee, btn) {
  activeCommittee = committee;
  document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  activePage = 1;
  applyFilters();
}

function sortBy(field, btn) {
  if (sortField === field) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortField = field;
    sortDir = field === 'amount' ? 'desc' : 'asc';
  }
  // Update sort button states
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  const arrowMap = { date: 'Date', amount: 'Amount', name: 'Name' };
  const arrowEl = document.getElementById(`arrow${arrowMap[field]}`);
  if (arrowEl) arrowEl.textContent = sortDir === 'asc' ? '↑' : '↓';
  
  applyFilters();
}

function applyFilters() {
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const type = document.getElementById('typeFilter')?.value || '';

  let rows = [...allExpenses];

  // Committee filter
  if (activeCommittee !== 'all') {
    rows = rows.filter(e => e.committeeName === activeCommittee);
  }

  // Type filter
  if (type) {
    rows = rows.filter(e => e.type === type);
  }

  // Search
  if (search) {
    rows = rows.filter(e =>
      (e.description || '').toLowerCase().includes(search) ||
      (e.committeeName || '').toLowerCase().includes(search) ||
      (e.councilorName || '').toLowerCase().includes(search)
    );
  }

  // Sort
  rows = [...rows].sort((a, b) => {
    let valA, valB;
    if (sortField === 'date') {
      valA = new Date(a.date || 0);
      valB = new Date(b.date || 0);
    } else if (sortField === 'amount') {
      valA = a.amount || 0;
      valB = b.amount || 0;
    } else if (sortField === 'name') {
      valA = (a.description || '').toLowerCase();
      valB = (b.description || '').toLowerCase();
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  filteredExpenses = rows;
  activePage = 1;
  renderTable();
  renderPagination();
}

function renderTable() {
  const tbody = document.getElementById('expenseBody');
  if (!tbody) return;
  
  const start = (activePage - 1) * PAGE_SIZE;
  const page = filteredExpenses.slice(start, start + PAGE_SIZE);

  if (!filteredExpenses.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No expenses found. Approved projects will appear here.</td></tr>`;
    return;
  }

  tbody.innerHTML = page.map((e, i) => `
    <tr style="animation-delay:${i * 0.035}s">
      <td class="td-name">${esc(e.description)}</td>
      <td><span class="td-committee">${esc(e.committeeName)}</span></td>
      <td class="td-muted">${esc(e.councilorName)}</td>
      <td><span class="type-pill type-${e.type}">${e.type}</span></td>
      <td class="td-muted">${fmtDate(e.date)}</td>
      <td class="td-amount">₱${(e.amount || 0).toLocaleString('en-PH')}</td>
    </tr>
  `).join('');
}

function renderPagination() {
  const total = filteredExpenses.length;
  const pages = Math.ceil(total / PAGE_SIZE);
  const pgEl = document.getElementById('pagination');
  const infoEl = document.getElementById('paginationInfo');
  const btnsEl = document.getElementById('pageButtons');

  if (!pgEl) return;
  
  if (pages <= 1) {
    pgEl.style.display = 'none';
    return;
  }
  pgEl.style.display = 'flex';

  const start = (activePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(activePage * PAGE_SIZE, total);
  if (infoEl) infoEl.textContent = `Showing ${start}–${end} of ${total} entries`;

  let btns = `<button class="page-btn" onclick="goPage(${activePage - 1})" ${activePage === 1 ? 'disabled' : ''}>←</button>`;
  for (let i = 1; i <= pages; i++) {
    btns += `<button class="page-btn ${i === activePage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  btns += `<button class="page-btn" onclick="goPage(${activePage + 1})" ${activePage === pages ? 'disabled' : ''}>→</button>`;
  if (btnsEl) btnsEl.innerHTML = btns;
}

function goPage(n) {
  const pages = Math.ceil(filteredExpenses.length / PAGE_SIZE);
  if (n < 1 || n > pages) return;
  activePage = n;
  renderTable();
  renderPagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function logout() {
  localStorage.removeItem('sk_name');
  localStorage.removeItem('sk_barangay');
  localStorage.removeItem('sk_privilege');
  window.location.href = '../Log-in/login';
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

// Make functions global
window.setCommittee = setCommittee;
window.sortBy = sortBy;
window.goPage = goPage;
window.logout = logout;
window.applyFilters = applyFilters;

// Initialize
init();