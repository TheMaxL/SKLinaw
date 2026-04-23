const API      = 'http://localhost:8085/api';
const BARANGAY = 'Lahug'; // ← update to match your client's barangay
const PAGE_SIZE = 15;

const session = {
  name:     localStorage.getItem('sk_name')     || 'Councilor',
  barangay: localStorage.getItem('sk_barangay') || BARANGAY,
  role:     localStorage.getItem('sk_role')     || 'councilor'
};

document.getElementById('nameEl').textContent   = session.name;
document.getElementById('avatarEl').textContent = session.name.charAt(0).toUpperCase();
document.getElementById('roleEl').textContent   = session.role;

let allExpenses      = [];
let filteredExpenses = [];
let activePage       = 1;
let activeCommittee  = 'all';
let sortField        = 'date';
let sortDir          = 'desc';

async function init() {
  try {
    const res  = await fetch(`${API}/getExpenses?barangay=${encodeURIComponent(session.barangay)}`);
    const data = await res.json();
    allExpenses = Array.isArray(data) ? data : [];
  } catch (e) {
    // Demo data
    allExpenses = [
      { id:1,  description:'Basketball Court Renovation', committeeName:'Sports',      councilorName:'Juan Dela Cruz', amount:85000,  date:'2025-03-01', type:'PROJECT'  },
      { id:2,  description:'Uniform Purchase',            committeeName:'Sports',      councilorName:'Juan Dela Cruz', amount:12000,  date:'2025-03-15', type:'PAYMENT'  },
      { id:3,  description:'School Supplies Drive',       committeeName:'Education',   councilorName:'Maria Santos',   amount:45000,  date:'2025-02-20', type:'PROJECT'  },
      { id:4,  description:'Tutorial Program',            committeeName:'Education',   councilorName:'Maria Santos',   amount:18000,  date:'2025-03-10', type:'PAYMENT'  },
      { id:5,  description:'Tree Planting Activity',      committeeName:'Environment', councilorName:'Pedro Reyes',    amount:15000,  date:'2025-01-28', type:'PROJECT'  },
      { id:6,  description:'Medical Mission Supplies',    committeeName:'Health',      councilorName:'Ana Gomez',      amount:60000,  date:'2025-02-14', type:'PROJECT'  },
      { id:7,  description:'Livelihood Training',         committeeName:'Livelihood',  councilorName:'Carlos Tan',     amount:20000,  date:'2025-02-28', type:'PROJECT'  },
      { id:8,  description:'Medicine Restock',            committeeName:'Health',      councilorName:'Ana Gomez',      amount:8500,   date:'2025-03-05', type:'PAYMENT'  },
      { id:9,  description:'Sports Equipment',            committeeName:'Sports',      councilorName:'Juan Dela Cruz', amount:22000,  date:'2025-01-15', type:'PAYMENT'  },
      { id:10, description:'Scholarship Fund',            committeeName:'Education',   councilorName:'Maria Santos',   amount:50000,  date:'2025-03-20', type:'PROJECT'  },
    ];
  }

  buildSummary();
  buildCommitteeTabs();
  applyFilters();
}

function buildSummary() {
  const total    = allExpenses.length;
  const amount   = allExpenses.reduce((s, e) => s + (e.amount||0), 0);
  const projects = allExpenses.filter(e => e.type === 'PROJECT').length;
  const payments = allExpenses.filter(e => e.type === 'PAYMENT').length;
  document.getElementById('sumTotal').textContent    = total;
  document.getElementById('sumAmount').textContent   = '₱' + amount.toLocaleString('en-PH');
  document.getElementById('sumProjects').textContent = projects;
  document.getElementById('sumPayments').textContent = payments;
}

function buildCommitteeTabs() {
  const committees = [...new Set(allExpenses.map(e => e.committeeName))];
  const tabsEl     = document.getElementById('committeeTabs');
  const allCount   = allExpenses.length;

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
  btn.classList.add('active');
  activePage = 1;
  applyFilters();
}

function sortBy(field, btn) {
  if (sortField === field) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortField = field;
    sortDir   = field === 'amount' ? 'desc' : 'asc';
  }
  // Update sort button states
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['Date','Amount','Name'].forEach(f => {
    const el = document.getElementById(`arrow${f}`);
    if (el) el.textContent = '↕';
  });
  const arrowMap = { date:'Date', amount:'Amount', name:'Name' };
  const arrowEl  = document.getElementById(`arrow${arrowMap[field]}`);
  if (arrowEl) arrowEl.textContent = sortDir === 'asc' ? '↑' : '↓';
  applyFilters();
}

function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const type   = document.getElementById('typeFilter').value;

  let rows = allExpenses;

  // Committee filter
  if (activeCommittee !== 'all') rows = rows.filter(e => e.committeeName === activeCommittee);

  // Type filter
  if (type) rows = rows.filter(e => e.type === type);

  // Search
  if (search) rows = rows.filter(e =>
    e.description.toLowerCase().includes(search) ||
    e.committeeName.toLowerCase().includes(search) ||
    e.councilorName.toLowerCase().includes(search)
  );

  // Sort
  rows = [...rows].sort((a, b) => {
    let valA, valB;
    if (sortField === 'date')   { valA = new Date(a.date||0); valB = new Date(b.date||0); }
    if (sortField === 'amount') { valA = a.amount||0;         valB = b.amount||0; }
    if (sortField === 'name')   { valA = a.description||'';   valB = b.description||''; }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  filteredExpenses = rows;
  activePage = 1;
  renderTable();
  renderPagination();
}

function renderTable() {
  const tbody = document.getElementById('expenseBody');
  const start = (activePage - 1) * PAGE_SIZE;
  const page  = filteredExpenses.slice(start, start + PAGE_SIZE);

  if (!filteredExpenses.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No expenses match your filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = page.map((e, i) => `
    <tr style="animation-delay:${i*0.035}s">
      <td class="td-name">${esc(e.description)}</td>
      <td><span class="td-committee">${esc(e.committeeName)}</span></td>
      <td class="td-muted">${esc(e.councilorName)}</td>
      <td><span class="type-pill type-${e.type}">${e.type}</span></td>
      <td class="td-muted">${fmtDate(e.date)}</td>
      <td class="td-amount">₱${(e.amount||0).toLocaleString('en-PH')}</td>
    </tr>`).join('');
}

function renderPagination() {
  const total = filteredExpenses.length;
  const pages = Math.ceil(total / PAGE_SIZE);
  const pgEl  = document.getElementById('pagination');
  const infoEl= document.getElementById('paginationInfo');
  const btnsEl= document.getElementById('pageButtons');

  if (pages <= 1) { pgEl.style.display = 'none'; return; }
  pgEl.style.display = 'flex';

  const start = (activePage - 1) * PAGE_SIZE + 1;
  const end   = Math.min(activePage * PAGE_SIZE, total);
  infoEl.textContent = `Showing ${start}–${end} of ${total} entries`;

  let btns = `<button class="page-btn" onclick="goPage(${activePage-1})" ${activePage===1?'disabled':''}>←</button>`;
  for (let i = 1; i <= pages; i++) {
    btns += `<button class="page-btn ${i===activePage?'active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  btns += `<button class="page-btn" onclick="goPage(${activePage+1})" ${activePage===pages?'disabled':''}>→</button>`;
  btnsEl.innerHTML = btns;
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
  localStorage.removeItem('sk_role');
  window.location.href = '../Log-in/login.html';
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtDate(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }); }
  catch { return s; }
}

init();