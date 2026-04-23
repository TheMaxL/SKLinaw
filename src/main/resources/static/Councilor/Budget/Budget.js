const API = 'http://localhost:8085/api';

  const COLORS = [
    '#0BBFB5','#F59E0B','#6366F1','#10B981',
    '#EC4899','#3B82F6','#F97316','#8B5CF6',
  ];

  const session = {
    name:        localStorage.getItem('sk_name')      || 'Treasurer',
    barangay:    localStorage.getItem('sk_barangay')  || 'Lahug',
    isTreasurer: localStorage.getItem('sk_role')      === 'treasurer'
  };

  document.getElementById('nameEl').textContent      = session.name;
  document.getElementById('avatarEl').textContent    = session.name.charAt(0).toUpperCase();
  document.getElementById('barangayLabel').textContent = session.barangay;

  // Show read-only guard if not treasurer
  // (In production, check role from server; here we trust localStorage)
  // document.getElementById('roleGuard').style.display = session.isTreasurer ? 'none' : 'flex';

  let committees = [];   // { name, color, allocInput }

  async function init() {
    await loadCommittees();
    await loadCurrentBudget();
    await loadExpenses();
  }

  async function loadCommittees() {
    try {
      const res  = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(session.barangay)}`);
      const data = await res.json();
      committees = data.map((c, i) => ({ name: c.committeeName, color: COLORS[i % COLORS.length] }));
    } catch (e) {
      // Demo committees
      committees = [
        { name: 'Sports',      color: COLORS[0] },
        { name: 'Education',   color: COLORS[1] },
        { name: 'Environment', color: COLORS[2] },
        { name: 'Health',      color: COLORS[3] },
      ];
    }
    renderAllocRows();
    updatePreview();
  }

  async function loadCurrentBudget() {
    try {
      const res  = await fetch(`${API}/getBudget?barangay=${encodeURIComponent(session.barangay)}`);
      const data = await res.json();
      renderCurrentBudget(data);

      // Pre-fill form with existing values
      if (data.totalBudget) {
        document.getElementById('totalBudget').value = data.totalBudget;
      }
      (data.committees || []).forEach(c => {
        const input = document.querySelector(`.alloc-input[data-name="${CSS.escape(c.committeeName)}"]`);
        if (input) { input.value = c.allocated || 0; }
      });
      updatePreview();
    } catch (e) {
      document.getElementById('currentBudgetPanel').textContent = 'No budget set yet.';
    }
  }

  function renderAllocRows() {
    const container = document.getElementById('allocRows');
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
    const input = document.getElementById('newCommName');
    const name  = input.value.trim();
    if (!name) return;
    if (committees.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      showAlert('Committee already exists.', 'error'); return;
    }
    committees.push({ name, color: COLORS[committees.length % COLORS.length] });
    input.value = '';
    renderAllocRows();
    updatePreview();
  }

  function onTotalChange() { updatePreview(); }

  function updatePreview() {
    const total    = parseFloat(document.getElementById('totalBudget').value) || 0;
    const inputs   = document.querySelectorAll('.alloc-input');
    let totalAlloc = 0;

    inputs.forEach((inp, i) => {
      const val = parseFloat(inp.value) || 0;
      totalAlloc += val;
      const pct  = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
      const pctEl = document.getElementById(`pct-${inp.dataset.idx}`);
      if (pctEl) pctEl.textContent = pct + '%';
      inp.classList.toggle('over', val > total && total > 0);
    });

    // Remaining banner
    const remaining = total - totalAlloc;
    const banner    = document.getElementById('remainingBanner');
    const remVal    = document.getElementById('remainingVal');
    remVal.textContent = (remaining < 0 ? '-' : '') + '₱' + Math.abs(remaining).toLocaleString('en-PH');
    remVal.classList.toggle('over', remaining < 0);
    banner.classList.toggle('over', remaining < 0);

    // Progress bars preview
    const barsEl = document.getElementById('previewBars');
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

    // Pie
    document.getElementById('previewTotal').textContent = '₱' + (total/1000).toFixed(0) + 'K';
    drawPreviewPie(committees.map((c, i) => {
      const inp = document.querySelector(`.alloc-input[data-idx="${i}"]`);
      return { value: parseFloat(inp?.value) || 0, color: c.color };
    }));
  }

  function drawPreviewPie(slices) {
    const canvas = document.getElementById('piePreview');
    const ctx    = canvas.getContext('2d');
    const size   = 180;
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
    const el   = document.getElementById('currentBudgetPanel');
    const coms = data.committees || [];
    if (!data.totalBudget) { el.innerHTML = '<span style="color:var(--muted)">No budget set yet.</span>'; return; }
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
    const total    = parseFloat(document.getElementById('totalBudget').value) || 0;
    const inputs   = document.querySelectorAll('.alloc-input');

    if (total <= 0) { showAlert('Please enter a valid total budget.', 'error'); return; }

    const allocations = {};
    let totalAlloc = 0;
    inputs.forEach(inp => {
      const val = parseFloat(inp.value) || 0;
      if (val > 0) { allocations[inp.dataset.name] = val; totalAlloc += val; }
    });

    if (totalAlloc > total) {
      showAlert(`Total allocations (₱${totalAlloc.toLocaleString('en-PH')}) exceed the total budget.`, 'error');
      return;
    }

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving…';

    try {
      const res  = await fetch(`${API}/setBudget`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ barangay: session.barangay, totalBudget: total, allocations })
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
      showAlert('Could not connect to server.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = 'Save Budget';
  }

  function resetForm() {
    document.getElementById('totalBudget').value = '';
    document.querySelectorAll('.alloc-input').forEach(inp => inp.value = '');
    updatePreview();
    document.getElementById('alertMsg').className = 'alert';
  }

  function showAlert(msg, type) {
    const el = document.getElementById('alertMsg');
    el.textContent = msg;
    el.className = `alert ${type} show`;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'success') setTimeout(() => el.classList.remove('show'), 4000);
  }

  function logout() {
    localStorage.removeItem('sk_name');
    localStorage.removeItem('sk_barangay');
    localStorage.removeItem('sk_role');
    window.location.href = '../Log-in/login.html';
  }

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ── EXPENSES ──────────────────────────────────────────────────────────────
  let allExpenses = [];
  let activeCommittee = 'all';

  async function loadExpenses() {
    try {
      const res  = await fetch(`${API}/getExpenses?barangay=${encodeURIComponent(session.barangay)}`);
      const data = await res.json();
      allExpenses = Array.isArray(data) ? data : [];
    } catch (e) {
      allExpenses = [
        { id:1, description:'Basketball Court Renovation', committeeName:'Sports',      councilorName:'Juan Dela Cruz', amount:85000,  date:'2025-03-01', type:'PROJECT' },
        { id:2, description:'Uniform Purchase',            committeeName:'Sports',      councilorName:'Juan Dela Cruz', amount:12000,  date:'2025-03-15', type:'PAYMENT' },
        { id:3, description:'School Supplies Drive',       committeeName:'Education',   councilorName:'Maria Santos',   amount:45000,  date:'2025-02-20', type:'PROJECT' },
        { id:4, description:'Tutorial Program',            committeeName:'Education',   councilorName:'Maria Santos',   amount:18000,  date:'2025-03-10', type:'PAYMENT' },
        { id:5, description:'Tree Planting Activity',      committeeName:'Environment', councilorName:'Pedro Reyes',    amount:15000,  date:'2025-01-28', type:'PROJECT' },
        { id:6, description:'Medical Mission',             committeeName:'Health',      councilorName:'Ana Gomez',      amount:60000,  date:'2025-02-14', type:'PROJECT' },
      ];
    }
    buildCommitteeFilters();
    renderExpenses();
    document.getElementById('expensesSection').style.display = 'block';
  }

  function buildCommitteeFilters() {
    const committees = [...new Set(allExpenses.map(e => e.committeeName))];
    const filtersEl  = document.getElementById('committeeFilters');
    filtersEl.innerHTML =
      `<button class="filter-btn active" onclick="setCommitteeFilter('all', this)">All</button>` +
      committees.map(c => `<button class="filter-btn" onclick="setCommitteeFilter('${esc(c)}', this)">${esc(c)}</button>`).join('');
  }

  function setCommitteeFilter(committee, btn) {
    activeCommittee = committee;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderExpenses();
  }

  function filterExpenses() { renderExpenses(); }

  function renderExpenses() {
    const search = document.getElementById('expSearch').value.toLowerCase();
    let rows = allExpenses;
    if (activeCommittee !== 'all') rows = rows.filter(e => e.committeeName === activeCommittee);
    if (search) rows = rows.filter(e =>
      e.description.toLowerCase().includes(search) ||
      e.committeeName.toLowerCase().includes(search) ||
      e.councilorName.toLowerCase().includes(search)
    );
    const tbody = document.getElementById('expenseTableBody');
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="exp-empty">No expenses found.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((e, i) => `
      <tr style="animation-delay:${i*0.04}s">
        <td class="exp-name">${esc(e.description)}</td>
        <td><span class="exp-committee">${esc(e.committeeName)}</span></td>
        <td style="color:var(--muted);font-size:0.78rem">${esc(e.councilorName)}</td>
        <td><span class="type-pill type-${e.type}">${e.type}</span></td>
        <td style="color:var(--muted);font-size:0.78rem">${fmtDate(e.date)}</td>
        <td class="exp-amount" style="text-align:right">₱${(e.amount||0).toLocaleString('en-PH')}</td>
      </tr>`).join('');
  }

  function fmtDate(s) {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }); }
    catch { return s; }
  }

  init();