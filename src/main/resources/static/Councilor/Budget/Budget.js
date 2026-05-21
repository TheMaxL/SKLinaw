console.log('Budget.js loaded - checking auth...')

const userPrivilege = localStorage.getItem('sk_privilege') || '';
const userBarangay = localStorage.getItem('sk_barangay') || '';

const COLORS = [
  '#0BBFB5','#F59E0B','#6366F1','#10B981',
  '#EC4899','#3B82F6','#F97316','#8B5CF6',
];

const userPrivilege = Session.privilege;
const userBarangay = Session.barangay;

// Role check - Treasurer or Chairman can edit
const canEditBudget = session.privilege === 'CHAIRMAN' || session.privilege === 'TREASURER' || session.privilege === 'ADMIN';

// Update sidebar
if (document.getElementById('nameEl')) {
  document.getElementById('nameEl').textContent = session.name;
  document.getElementById('avatarEl').textContent = session.name.charAt(0).toUpperCase();
  document.getElementById('barangayLabel').textContent = Session.barangay;
}

// Show read-only guard if not treasurer/chairman
const roleGuard = document.getElementById('roleGuard');
if (roleGuard && !canEditBudget) {
  roleGuard.style.display = 'flex';
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.disabled = true;
}

let committees = [];

async function init() {
  await loadCommittees();
  await loadCurrentBudget();
}

async function loadCommittees() {
  const container = document.getElementById('allocRows');
  if (container) {
    container.innerHTML = '<div class="loading-placeholder">Loading committees...</div>';
  }
  
  try {
    const res = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(Session.barangay)}`, {
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Failed to fetch committees');
    
    const data = await res.json();
    committees = data.map((c, i) => ({ 
      name: c.committeeName, 
      color: COLORS[i % COLORS.length] 
    }));
    
    renderAllocRows();
    updatePreview();
  } catch (e) {
    console.error('Error loading committees:', e);
    if (container) {
      container.innerHTML = '<div class="error-message">Failed to load committees. Please refresh the page.</div>';
    }
  }
}

async function loadCurrentBudget() {
  const panel = document.getElementById('currentBudgetPanel');
  if (panel) {
    panel.innerHTML = '<div style="color:var(--muted)">Loading budget...</div>';
  }
  
  try {
    const res = await fetch(`${API}/getBudget?barangay=${encodeURIComponent(Session.barangay)}`, {
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Failed to fetch budget');
    
    const data = await res.json();
    renderCurrentBudget(data);

    // Pre-fill form with existing values
    const totalBudgetInput = document.getElementById('totalBudget');
    if (totalBudgetInput && data.totalBudget) {
      totalBudgetInput.value = data.totalBudget;
    }
    
    if (data.committees) {
      data.committees.forEach(c => {
        const input = document.querySelector(`.alloc-input[data-name="${CSS.escape(c.committeeName)}"]`);
        if (input && input.value !== c.allocated) {
          input.value = c.allocated || 0;
        }
      });
    }
    updatePreview();
  } catch (e) {
    console.error('Error loading budget:', e);
    if (panel) {
      panel.innerHTML = '<div style="color:var(--muted)">No budget set yet.</div>';
    }
  }
}

function renderAllocRows() {
  const container = document.getElementById('allocRows');
  if (!container) return;
  
  if (committees.length === 0) {
    container.innerHTML = '<div class="no-data">No committees found. Please create committees first.</div>';
    return;
  }
  
  container.innerHTML = committees.map((c, i) => `
    <div class="alloc-row" id="row-${i}">
      <div class="alloc-name">
        <div class="alloc-dot" style="background:${c.color}"></div>
        ${esc(c.name)}
      </div>
      <div class="alloc-input-wrap">
        <span class="pfx">₱</span>
        <input class="alloc-input" type="number" min="0" step="0.01"
               data-name="${esc(c.name)}" data-idx="${i}"
               placeholder="0.00"
               oninput="updatePreview()"/>
      </div>
      <div class="alloc-pct" id="pct-${i}">0%</div>
    </div>
  `).join('');
}

function addCommitteeRow() {
  // Committees must be created through the Committees page, not here
  showAlert('Committees can only be created by the Chairman on the Committees page.', 'error');
}

function onTotalChange() { 
  updatePreview(); 
}

function updatePreview() {
  const total = parseFloat(document.getElementById('totalBudget')?.value) || 0;
  const inputs = document.querySelectorAll('.alloc-input');
  let totalAlloc = 0;

  inputs.forEach((inp) => {
    const val = parseFloat(inp.value) || 0;
    totalAlloc += val;
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
    const pctEl = document.getElementById(`pct-${inp.dataset.idx}`);
    if (pctEl) pctEl.textContent = pct + '%';
    inp.classList.toggle('over', val > total && total > 0);
  });

  // Remaining banner
  const remaining = total - totalAlloc;
  const banner = document.getElementById('remainingBanner');
  const remVal = document.getElementById('remainingVal');
  if (remVal) {
    remVal.textContent = (remaining < 0 ? '-' : '') + '₱' + Math.abs(remaining).toLocaleString('en-PH');
    remVal.classList.toggle('over', remaining < 0);
  }
  if (banner) banner.classList.toggle('over', remaining < 0);

  // Progress bars preview
  const barsEl = document.getElementById('previewBars');
  if (barsEl) {
    barsEl.innerHTML = committees.map((c, i) => {
      const inp = document.querySelector(`.alloc-input[data-idx="${i}"]`);
      const val = parseFloat(inp?.value) || 0;
      const pct = total > 0 ? Math.min((val / total) * 100, 100) : 0;
      return `
        <div class="pbar-row">
          <div class="pbar-header">
            <span class="pbar-name">${esc(c.name)}</span>
            <span class="pbar-pct">${pct.toFixed(1)}%</span>
          </div>
          <div class="pbar-track">
            <div class="pbar-fill" style="width:${pct}%; background:${c.color}"></div>
          </div>
        </div>`;
    }).join('');
  }

  // Preview total
  const previewTotal = document.getElementById('previewTotal');
  if (previewTotal) {
    previewTotal.textContent = '₱' + (total/1000).toFixed(0) + 'K';
  }
  
  drawPreviewPie(committees.map((c, i) => {
    const inp = document.querySelector(`.alloc-input[data-idx="${i}"]`);
    return { value: parseFloat(inp?.value) || 0, color: c.color };
  }));
}

function drawPreviewPie(slices) {
  const canvas = document.getElementById('piePreview');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const size = 180;
  canvas.width = canvas.height = size;
  const cx = size/2, cy = size/2, outerR = 78, innerR = 48;

  ctx.clearRect(0, 0, size, size);
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  let angle = -Math.PI / 2;

  slices.forEach(sl => {
    const sweep = (sl.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = sl.color;
    ctx.fill();
    angle += sweep;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#142322';
  ctx.fill();

  // Gaps
  angle = -Math.PI / 2;
  slices.forEach(sl => {
    const sweep = (sl.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
    ctx.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
    ctx.strokeStyle = '#142322';
    ctx.lineWidth = 2;
    ctx.stroke();
    angle += sweep;
  });
}

function renderCurrentBudget(data) {
  const el = document.getElementById('currentBudgetPanel');
  if (!el) return;
  
  const coms = data.committees || [];
  if (!data.totalBudget || data.totalBudget === 0) {
    el.innerHTML = '<span style="color:var(--muted)">No budget set yet.</span>';
    return;
  }
  
  el.innerHTML = `
    <div style="font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;color:var(--teal);margin-bottom:4px">
      ₱${(data.totalBudget||0).toLocaleString('en-PH')}
    </div>
    <div style="font-size:0.75rem;color:var(--muted);margin-bottom:1rem">Current total budget</div>
    ${coms.map((c, i) => `
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:5px">
        <span style="display:flex;align-items:center;gap:5px">
          <span style="width:8px;height:8px;border-radius:2px;background:${COLORS[i%COLORS.length]};display:inline-block"></span>
          ${esc(c.committeeName)}
        </span>
        <span style="font-family:'Syne',sans-serif;font-weight:700;color:var(--teal)">₱${(c.allocated||0).toLocaleString('en-PH')}</span>
      </div>`).join('')}
  `;
}

async function saveBudget() {
  if (!canEditBudget) {
    showAlert('You do not have permission to edit the budget.', 'error');
    return;
  }
  
  const total = parseFloat(document.getElementById('totalBudget').value) || 0;
  const inputs = document.querySelectorAll('.alloc-input');

  if (total <= 0) {
    showAlert('Please enter a valid total budget.', 'error');
    return;
  }

  const allocations = {};
  let totalAlloc = 0;
  inputs.forEach(inp => {
    const val = parseFloat(inp.value) || 0;
    if (val > 0) { 
      allocations[inp.dataset.name] = val; 
      totalAlloc += val; 
    }
  });

  if (totalAlloc > total) {
    showAlert(`Total allocations (₱${totalAlloc.toLocaleString('en-PH')}) exceed the total budget.`, 'error');
    return;
  }

  const btn = document.getElementById('saveBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving…';
  }

  try {
    const res = await fetch(`${API}/setBudget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        barangay: Session.barangay, 
        totalBudget: total, 
        allocations 
      })
    });
    const text = await res.text();

    if (text === 'SUCCESS') {
      showAlert('Budget saved successfully!', 'success');
      await loadCurrentBudget();
    } else if (text.startsWith('NO_HEAD_ASSIGNED:')) {
      showAlert(`Committee "${text.split(':')[1]}" has no head assigned. Assign a head first.`, 'error');
    } else {
      showAlert('Failed: ' + text, 'error');
    }
  } catch (e) {
    console.error('Error saving budget:', e);
    showAlert('Could not connect to server.', 'error');
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = 'Save Budget';
  }
}

function resetForm() {
  document.getElementById('totalBudget').value = '';
  document.querySelectorAll('.alloc-input').forEach(inp => inp.value = '');
  updatePreview();
  const alertMsg = document.getElementById('alertMsg');
  if (alertMsg) alertMsg.className = 'alert';
  showAlert('Form reset.', 'success');
}

function showAlert(msg, type) {
  const el = document.getElementById('alertMsg');
  if (!el) return;
  el.textContent = msg;
  el.className = `alert ${type} show`;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (type === 'success') setTimeout(() => el.classList.remove('show'), 4000);
}

function logout() {
  localStorage.removeItem('sk_name');
  localStorage.removeItem('sk_barangay');
  localStorage.removeItem('sk_privilege');
  window.location.href = '../Log-in/login';
}

function esc(s) { 
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
}

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!localStorage.getItem('sk_name')) {
    window.location.href = '/Councilor/Log-in/Login';
    return;
  }
  
  try {
    const response = await fetch('https://sklinaw.onrender.com/api/check-auth', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    
    if (!data.authenticated) {
      localStorage.clear();
      window.location.href = '/Councilor/Log-in/Login';
      return;
    }
    
    // User is authenticated, update UI
    const nameEl = document.getElementById('nameEl');
    const roleEl = document.getElementById('roleEl');
    const avatarEl = document.getElementById('avatarEl');
    
    if (nameEl) nameEl.textContent = localStorage.getItem('sk_name');
    if (roleEl) roleEl.textContent = userPrivilege || 'Councilor';
    if (avatarEl) avatarEl.textContent = (localStorage.getItem('sk_name') || '?').charAt(0).toUpperCase();
    
  } catch (error) {
    console.error('Auth check error:', error);
    window.location.href = '/Councilor/Log-in/Login';
  }
});

// Make functions global for onclick handlers
window.saveBudget = saveBudget;
window.resetForm = resetForm;
window.onTotalChange = onTotalChange;
window.updatePreview = updatePreview;
window.addCommitteeRow = addCommitteeRow;
window.logout = logout;

// Start the app
init();