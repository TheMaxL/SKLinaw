document.addEventListener('DOMContentLoaded', function() {
  const navButtons = document.querySelectorAll('.pv-nav-item');
  const contentArea = document.querySelector('.pv-content-area');
  
  const committeeContainer = document.createElement('div');
  committeeContainer.className = 'committee-container';
  committeeContainer.style.display = 'none';
  
  const committeeItems = [
    'ACTIVE CITIZENSHIP',
    'AGRICULTURE',
    'ECONOMIC',
    'EDUCATION',
    'ENVIRONMENT',
    'GLOBAL MOBILITY',
    'GOVERNANCE',
    'HEALTH',
    'PEACE-BUILDING AND SECURITY', 
    'SOCIAL INCLUSION AND EQUITY',
    'TREASURY',
    'SECRETARIAT'
  ];
  
  committeeItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'committee-btn';
    btn.textContent = item;
    
    btn.addEventListener('click', function() {
      showCommitteeDetail(item);
    });
    
    committeeContainer.appendChild(btn);
  });
  
  contentArea.appendChild(committeeContainer);
  
  function showCommitteeDetail(committeeName) {
    contentArea.innerHTML = '';
    
    const detailContainer = document.createElement('div');
    detailContainer.className = 'detail-container';
    
    const header = document.createElement('div');
    header.className = 'detail-header';
    header.innerHTML = `
      <div class="detail-committee-name">${committeeName}</div>
    `;

    const tabsRow = document.createElement('div');
    tabsRow.className = 'detail-tabs';
    tabsRow.innerHTML = `
      <button class="detail-tab active" data-tab="projects">PROJECTS/ACTIVITIES</button>
      <button class="detail-tab" data-tab="implementation">IMPLEMENTATION/DOCUMENTATIONS</button>
      <button class="detail-tab" data-tab="receipts">RECEIPTS</button>
    `;
    
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    
    // Projects content
    const projectsDiv = document.createElement('div');
    projectsDiv.className = 'tab-pane active';
    projectsDiv.id = 'projectsContent';
    projectsDiv.innerHTML = `
      <h2>📋 PROJECTS & ACTIVITIES</h2>
      <ul>
        <li>Youth Leadership Summit 2026</li>
        <li>Community Outreach Program</li>
        <li>Skills Training Workshop</li>
        <li>Barangay Consultation Meeting</li>
        <li>Annual Planning Session</li>
      </ul>
    `;
    
    // Implementation content
    const implementationDiv = document.createElement('div');
    implementationDiv.className = 'tab-pane';
    implementationDiv.id = 'implementationContent';
    implementationDiv.style.display = 'none';
    implementationDiv.innerHTML = `
      <h2>📄 IMPLEMENTATION & DOCUMENTATIONS</h2>
      <ul>
        <li>Project Proposal.pdf</li>
        <li>Accomplishment Report Q1 2026</li>
        <li>Attendance Sheets.xlsx</li>
        <li>Documentation Photos.zip</li>
        <li>Evaluation Forms.pdf</li>
      </ul>
    `;
    
    // Receipts content
    const receiptsDiv = document.createElement('div');
    receiptsDiv.className = 'tab-pane';
    receiptsDiv.id = 'receiptsContent';
    receiptsDiv.style.display = 'none';
    receiptsDiv.innerHTML = `
      <h2>💰 RECEIPTS</h2>
      <ul>
        <li>Official Receipt #00123 - Supplies</li>
        <li>Official Receipt #00124 - Food</li>
        <li>Liquidation Report.pdf</li>
        <li>Disbursement Voucher #26-01</li>
        <li>Bank Deposit Slip - March</li>
      </ul>
    `;
    
    tabContent.appendChild(projectsDiv);
    tabContent.appendChild(implementationDiv);
    tabContent.appendChild(receiptsDiv);
    
    // Back button
    const backSection = document.createElement('div');
    backSection.className = 'back-section';
    backSection.innerHTML = `
      <button class="back-btn">
        <span class="back-arrow">←</span> BACK TO COMMITTEES
      </button>
    `;
    
    // Assemble detail view
    detailContainer.appendChild(header);
    detailContainer.appendChild(tabsRow);
    detailContainer.appendChild(tabContent);
    detailContainer.appendChild(backSection);
    
    contentArea.appendChild(detailContainer);
    
    // Add tab switching functionality
    const tabs = detailContainer.querySelectorAll('.detail-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        tabs.forEach(t => t.classList.remove('active'));

        this.classList.add('active');
        
        const panes = detailContainer.querySelectorAll('.tab-pane');
        panes.forEach(pane => pane.style.display = 'none');
        
        const tabName = this.getAttribute('data-tab');
        if (tabName === 'projects') {
          projectsDiv.style.display = 'block';
        } else if (tabName === 'implementation') {
          implementationDiv.style.display = 'block';
        } else if (tabName === 'receipts') {
          receiptsDiv.style.display = 'block';
        }
      });
    });
    
    // Back button 
    const backBtn = detailContainer.querySelector('.back-btn');
    backBtn.addEventListener('click', function() {
      contentArea.innerHTML = '';
      contentArea.appendChild(committeeContainer);
      committeeContainer.style.display = 'grid';
    });
  }
  
  navButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      contentArea.innerHTML = '';
      
      if (btn.textContent === 'COMMITTEE SELECTION') {
        contentArea.appendChild(committeeContainer);
        committeeContainer.style.display = 'grid';
      } else if (btn.textContent === 'ANNOUNCEMENTS') {
        const placeholder = document.createElement('div');
        placeholder.style.padding = '32px';
        placeholder.style.color = '#fff';
        placeholder.style.fontSize = '1.5em';
        placeholder.textContent = 'ANNOUNCEMENTS CONTENT';
        contentArea.appendChild(placeholder);
      } else if (btn.textContent === 'GENERAL INFORMATION') {
        const placeholder = document.createElement('div');
        placeholder.style.padding = '32px';
        placeholder.style.color = '#fff';
        placeholder.style.fontSize = '1.5em';
        placeholder.textContent = 'GENERAL INFORMATION CONTENT';
        contentArea.appendChild(placeholder);
      }
    });
  });
});