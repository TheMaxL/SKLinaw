// Feedback.js - Public page with optional authentication for feedback submission

// Use absolute URLs to Render backend
const API = 'https://sklinaw.onrender.com/api';
const ADMIN_API = 'https://sklinaw.onrender.com/admin';

let currentBarangay = '';
let currentProjectId = null;
let currentProjectName = '';
let currentRating = 0;

// Helper function to get auth token (if user is logged in)
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// Helper function for authenticated fetch (used when user wants to submit feedback with their name)
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers: headers
    });
    
    return response;
}

async function loadBarangays() {
  console.log('Loading barangays from public endpoint...');
  
  try {
    const response = await fetch(`${API}/public/getBarangays`);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const barangays = await response.json();
    console.log('Barangays loaded:', barangays);
    
    const select = document.getElementById('barangaySelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">— Select a barangay —</option>';
    barangays.forEach(barangay => {
      select.innerHTML += `<option value="${escapeHtml(barangay)}">${escapeHtml(barangay)}</option>`;
    });
    
    if (barangays.length === 1) {
      select.value = barangays[0];
      loadCommittees(barangays[0]);
    }
    
  } catch (error) {
    console.error('Error loading barangays:', error);
    showToast('Could not load barangays.', true);
    
    const select = document.getElementById('barangaySelect');
    if (select) {
      select.innerHTML = '<option value="">— Select a barangay —</option>' +
        '<option value="Lahug">Lahug</option>' +
        '<option value="Pajac">Pajac</option>';
    }
  }
}

function initRatingStars() {
  const stars = document.querySelectorAll('#feedbackModal .star');
  console.log('Initializing stars, found:', stars.length);
  
  stars.forEach(star => {
    star.removeEventListener('click', handleStarClick);
    star.addEventListener('click', handleStarClick);
  });
}

function handleStarClick() {
  const rating = parseInt(this.dataset.rating);
  currentRating = rating;
  
  const ratingInput = document.getElementById('feedbackRating');
  if (ratingInput) ratingInput.value = rating;
  
  const stars = document.querySelectorAll('#feedbackModal .star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
      star.textContent = '★';
    } else {
      star.classList.remove('active');
      star.textContent = '☆';
    }
  });
  
  console.log('Rating set to:', rating);
}

async function loadCommittees(barangay) {
  const sel = document.getElementById('committeeSelect');
  if (!sel) return;
  
  sel.innerHTML = '<option value="">All committees</option>';
  if (!barangay) return;

  try {
    const res = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(barangay)}`);
    if (!res.ok) throw new Error('Failed to fetch committees');
    
    const data = await res.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      sel.innerHTML = '<option value="">No committees found</option>';
      return;
    }
    
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.committeeName || c.name;
      opt.textContent = c.committeeName || c.name;
      sel.appendChild(opt);
    });
  } catch (e) {
    console.error('Error loading committees:', e);
    sel.innerHTML = '<option value="">Error loading committees</option>';
  }
}

async function loadProjectComments(projectId) {
  try {
    const response = await fetch(`${API}/getProjectComments?projectId=${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    
    const comments = await response.json();
    return comments;
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
}

async function loadProjectScore(projectId) {
  try {
    const response = await fetch(`${API}/getProjectScore?projectId=${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch score');
    
    const scoreData = await response.json();
    return scoreData;
  } catch (error) {
    console.error('Error loading project score:', error);
    return { average: 0, totalVotes: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
}

async function loadProjects() {
  const barangaySelect = document.getElementById('barangaySelect');
  const committeeSelect = document.getElementById('committeeSelect');
  const searchInput = document.getElementById('searchInput');
  
  const barangay = barangaySelect ? barangaySelect.value : '';
  const committee = committeeSelect ? committeeSelect.value : '';
  const search = searchInput ? searchInput.value.toLowerCase() : '';

  if (!barangay) {
    showToast('Please select a barangay first.', true);
    return;
  }

  currentBarangay = barangay;
  const listEl = document.getElementById('projectList');
  if (listEl) {
    listEl.innerHTML = `<div class="loader"><span></span><span></span><span></span></div>`;
  }
  
  const statsBar = document.getElementById('statsBar');
  const listLabel = document.getElementById('listLabel');
  
  if (statsBar) statsBar.style.display = 'none';
  if (listLabel) listLabel.style.display = 'none';

  try {
    let allProjects = [];

    if (committee) {
      const res = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(barangay)}&committeeName=${encodeURIComponent(committee)}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      allProjects = Array.isArray(data) ? data.map(p => ({ ...p, committeeName: committee })) : [];
    } else {
      const cRes = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(barangay)}`);
      if (!cRes.ok) throw new Error('Failed to fetch committees');
      const committees = await cRes.json();

      for (const c of committees) {
        const committeeName = c.committeeName || c.name;
        const pRes = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(barangay)}&committeeName=${encodeURIComponent(committeeName)}`);
        if (pRes.ok) {
          const projects = await pRes.json();
          if (Array.isArray(projects)) {
            projects.forEach(p => allProjects.push({ ...p, committeeName: committeeName }));
          }
        }
      }
    }

    let visible = allProjects.filter(p => p.status === 'APPROVED');

    if (search) {
      visible = visible.filter(p =>
        (p.projectName || '').toLowerCase().includes(search) ||
        (p.purpose || '').toLowerCase().includes(search)
      );
    }

    renderStats(visible);
    await renderProjectsWithComments(visible);

  } catch (e) {
    console.error('Error loading projects:', e);
    if (listEl) {
      listEl.innerHTML = `<div class="empty-state"><p>⚠️ Could not connect to the server.</p></div>`;
    }
    showToast('Could not load projects.', true);
  }
}

function renderStats(projects) {
  const total = projects.length;
  const cost = projects.reduce((sum, p) => sum + (p.totalCost || 0), 0);

  const statTotal = document.getElementById('statTotal');
  const statCost = document.getElementById('statCost');
  const statsBar = document.getElementById('statsBar');
  const listLabel = document.getElementById('listLabel');
  
  if (statTotal) statTotal.textContent = total;
  if (statCost) statCost.textContent = '₱' + cost.toLocaleString('en-PH');
  if (statsBar) statsBar.style.display = 'grid';
  if (listLabel) listLabel.style.display = 'block';
}

async function renderProjectsWithComments(projects) {
  const listEl = document.getElementById('projectList');
  if (!listEl) return;
  
  if (projects.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/>
        </svg>
        <p>No published projects found for this selection.</p>
      </div>`;
    return;
  }

  let html = '';
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const commentContainerId = `comments-${p.id}`;
    const comments = await loadProjectComments(p.id);
    const ratingData = await loadProjectScore(p.id);
    
    html += `
      <div class="project-card" data-project-id="${p.id}" style="animation-delay:${i * 0.05}s">
        <div class="project-header" onclick="toggleCard(this.parentElement)">
          <div class="project-title-block">
            <div class="project-name">${escapeHtml(p.projectName)}</div>
            <div class="project-meta">
              <span>📁 ${escapeHtml(p.committeeName || '')}</span>
              <span>👤 ${escapeHtml(p.councilorName || '')}</span>
              <span>📅 ${formatDate(p.createdAt)}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.6rem;flex-shrink:0">
            <div class="project-cost">₱${(p.totalCost || 0).toLocaleString('en-PH')}</div>
            <div class="status-pill status-${p.status}">${p.status}</div>
          </div>
        </div>
        <div class="project-details">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Purpose</label>
              <p>${escapeHtml(p.purpose || '—')}</p>
            </div>
            <div class="detail-item">
              <label>Total Cost</label>
              <p>₱${(p.totalCost || 0).toLocaleString('en-PH')}</p>
            </div>
            <div class="detail-item">
              <label>Committee</label>
              <p>${escapeHtml(p.committeeName || '—')}</p>
            </div>
            <div class="detail-item">
              <label>Submitted by</label>
              <p>${escapeHtml(p.councilorName || '—')}</p>
            </div>
          </div>
          
          <div class="rating-section">
            <div class="rating-header">
              <h4>⭐ Community Rating</h4>
              <span class="average-rating">${ratingData.average ? ratingData.average.toFixed(1) : '0.0'} / 5</span>
            </div>
            <div class="rating-stars-display">
              ${renderRatingStars(ratingData.average || 0)}
            </div>
            <div class="rating-count">Based on ${ratingData.totalVotes || 0} rating(s)</div>
          </div>
          
          <div class="comments-section">
            <div class="comments-header">
              <h4>💬 Community Feedback</h4>
              <button class="btn-feedback-small" onclick="openFeedbackModal(${p.id}, '${escapeHtml(p.projectName)}')">
                + Add Feedback
              </button>
            </div>
            <div class="comments-list" id="${commentContainerId}">
              ${renderCommentsHtml(comments)}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  listEl.innerHTML = html;
}

function renderRatingStars(averageRating) {
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHtml = '';
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '★';
  }
  if (hasHalfStar) {
    starsHtml += '½';
  }
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '☆';
  }
  return `<span class="rating-stars">${starsHtml}</span>`;
}

function renderCommentsHtml(comments) {
  if (!comments || comments.length === 0) {
    return '<div class="no-comments">No feedback yet. Click "+ Add Feedback" to share your thoughts!</div>';
  }
  
  return comments.map(c => `
    <div class="comment-item">
      <div class="comment-header">
        <span class="comment-name">${escapeHtml(c.authorName || 'Anonymous')}</span>
        <span class="comment-date">${formatDate(c.createdAt)}</span>
      </div>
      <div class="comment-message">${escapeHtml(c.message)}</div>
    </div>
  `).join('');
}

function toggleCard(card) {
  card.classList.toggle('open');
}

function openFeedbackModal(projectId, projectName) {
  currentProjectId = projectId;
  currentProjectName = projectName;
  currentRating = 0;
  
  const modal = document.getElementById('feedbackModal');
  const projectNameSpan = document.getElementById('feedbackProjectName');
  
  if (projectNameSpan) {
    projectNameSpan.textContent = `Project: ${projectName}`;
  }
  
  const feedbackName = document.getElementById('feedbackName');
  const feedbackMessage = document.getElementById('feedbackMessage');
  const ratingInput = document.getElementById('feedbackRating');
  
  if (feedbackName) feedbackName.value = '';
  if (feedbackMessage) feedbackMessage.value = '';
  if (ratingInput) ratingInput.value = '0';
  
  const stars = document.querySelectorAll('#feedbackModal .star');
  stars.forEach(star => {
    star.classList.remove('active');
    star.textContent = '☆';
  });
  
  if (modal) modal.style.display = 'flex';
  
  setTimeout(() => {
    initRatingStars();
  }, 100);
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedbackModal');
  if (modal) modal.style.display = 'none';
  currentProjectId = null;
  currentProjectName = null;
  currentRating = 0;
}

async function submitFeedback() {
  const messageInput = document.getElementById('feedbackMessage');
  const message = messageInput ? messageInput.value.trim() : '';
  
  if (!message) {
    showToast('Please enter your feedback.', true);
    return;
  }
  
  if (!currentProjectId) {
    showToast('Error: No project selected.', true);
    return;
  }
  
  const nameInput = document.getElementById('feedbackName');
  const name = nameInput ? nameInput.value.trim() : '';
  const rating = currentRating;
  
  const feedbackData = {
    projectId: currentProjectId,
    barangay: currentBarangay,
    authorName: name || 'Anonymous',
    message: message,
    rating: rating,
    reaction: ''
  };
  
  console.log('Submitting feedback:', feedbackData);
  
  try {
    // Use fetchWithAuth for submission (will include token if user is logged in)
    const response = await fetchWithAuth(`${API}/submitProjectComment`, {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    });
    
    const result = await response.text();
    console.log('Server response:', result);
    
    if (result === 'SUCCESS') {
      if (rating > 0) {
        showToast('Thank you for your feedback and rating!');
      } else {
        showToast('Thank you for your feedback!');
      }
      closeFeedbackModal();
      
      // Refresh the projects to show updated rating
      await loadProjects();
      
    } else if (result === 'EMPTY_MESSAGE') {
      showToast('Please enter a message.', true);
    } else if (result === 'MESSAGE_TOO_LONG') {
      showToast('Message is too long (max 500 characters).', true);
    } else {
      showToast('Error submitting feedback: ' + result, true);
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showToast('Could not submit feedback: ' + error.message, true);
  }
}

async function loadProjectRating(projectId) {
  try {
    const response = await fetch(`${API}/getProjectRating?projectId=${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch rating');
    
    const ratingData = await response.json();
    return ratingData;
  } catch (error) {
    console.error('Error loading project rating:', error);
    return { average: 0, totalVotes: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(str) {
  if (!str) return '—';
  try { 
    return new Date(str).toLocaleDateString('en-PH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch { 
    return str; 
  }
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  
  const barangaySelect = document.getElementById('barangaySelect');
  const loadBtn = document.getElementById('loadBtn');
  const searchInput = document.getElementById('searchInput');
  
  console.log('barangaySelect found:', !!barangaySelect);
  console.log('loadBtn found:', !!loadBtn);
  
  if (barangaySelect) {
    const oldListener = barangaySelect.onchange;
    barangaySelect.onchange = null;
    
    barangaySelect.addEventListener('change', (e) => {
      const selectedBarangay = e.target.value;
      console.log('=== BARANGAY CHANGED ===');
      console.log('Selected barangay:', selectedBarangay);
      if (selectedBarangay) {
        loadCommittees(selectedBarangay);
      } else {
        const committeeSelect = document.getElementById('committeeSelect');
        if (committeeSelect) {
          committeeSelect.innerHTML = '<option value="">All committees</option>';
        }
      }
    });
    
    if (barangaySelect.value) {
      console.log('Initial barangay value:', barangaySelect.value);
      loadCommittees(barangaySelect.value);
    }
  }
  
  if (loadBtn) {
    const newLoadBtn = loadBtn.cloneNode(true);
    loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);
    
    newLoadBtn.addEventListener('click', loadProjects);
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const cards = document.querySelectorAll('.project-card');
      const q = this.value.toLowerCase();
      cards.forEach(card => {
        const name = card.querySelector('.project-name')?.textContent.toLowerCase() || '';
        card.style.display = (!q || name.includes(q)) ? '' : 'none';
      });
    });
  }
  
  initRatingStars();
  loadBarangays(); 
});

window.openFeedbackModal = openFeedbackModal;
window.closeFeedbackModal = closeFeedbackModal;
window.submitFeedback = submitFeedback;
window.toggleCard = toggleCard;