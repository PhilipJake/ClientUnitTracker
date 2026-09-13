const UI = {
  summaryCards: document.getElementById('summaryCards'),
  unitTableBody: document.getElementById('unitTableBody'),
  branchPulseList: document.getElementById('branchPulseList'),
  syncStatus: document.getElementById('syncStatus')
};

function renderSummary(units) {
  const total = units.length;
  const activeTracking = units.filter((unit) => {
    const status = normalizeStatus(unit.status);
    return status === 'in stock' || status === 'assigned';
  }).length;
  const needsAttention = units.filter((unit) => {
    const status = normalizeStatus(unit.status);
    return status.includes('return') || status.includes('pending') || status.includes('released');
  }).length;
  const branches = new Set(units.map((unit) => unit.uploadedBranch).filter(Boolean)).size;

  const cards = [
    { label: 'Total units', value: total, dark: true, icon: '◫', meta: 'From last month' },
    { label: 'Active tracking', value: activeTracking, dark: false, icon: '◉', meta: 'Currently in service' },
    { label: 'Needs attention', value: needsAttention, dark: false, icon: '!', meta: 'Due for an update' },
    { label: 'Branches', value: branches, dark: false, icon: '⌂', meta: 'Across your workspace' }
  ];

  UI.summaryCards.innerHTML = cards
    .map(
      (card) => `
        <div class="summary-card ${card.dark ? 'dark' : ''}">
          <div class="card-top">
            <span>${escapeHtml(card.label)}</span>
            <span class="card-icon">${card.icon}</span>
          </div>
          <div>
            <div class="card-value">${card.value}</div>
            <div class="card-meta ${card.dark ? '' : 'trend-up'}">${card.meta}</div>
          </div>
        </div>
      `
    )
    .join('');
}

function renderTable(units) {
  if (!units.length) {
    UI.unitTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No matching records found.</td>
      </tr>
    `;
    return;
  }

  UI.unitTableBody.innerHTML = units
    .slice(0, 5)
    .map(
      (unit) => `
        <tr>
          <td>${escapeHtml(unit.unitCode || '—')}</td>
          <td>${escapeHtml(unit.clientName || '—')}</td>
          <td>${escapeHtml(unit.specs || '—')}</td>
          <td>${escapeHtml(formatCurrency(unit.unitPrice))}</td>
          <td><span class="badge ${statusClass(unit.status)}">${escapeHtml(unit.status || 'Unknown')}</span></td>
          <td>${escapeHtml(unit.currentLocation || '—')}</td>
        </tr>
      `
    )
    .join('');
}

function renderBranchPulse(units) {
  const branchCounts = {};

  units.forEach((unit) => {
    const branch = unit.uploadedBranch || 'Unknown';
    branchCounts[branch] = (branchCounts[branch] || 0) + 1;
  });

  const entries = Object.entries(branchCounts).slice(0, 5);

  if (!entries.length) {
    UI.branchPulseList.innerHTML = '<div class="empty-state">No branches available.</div>';
    return;
  }

  const maxCount = Math.max(...entries.map(([, value]) => value), 1);

  UI.branchPulseList.innerHTML = entries
    .map(([branch, count]) => {
      const percentage = Math.max(20, Math.round((count / maxCount) * 100));
      return `
        <div class="branch-row">
          <div class="branch-head">
            <span>${escapeHtml(branch)}</span>
            <span>${count}</span>
          </div>
          <div class="branch-bar">
            <div class="branch-fill" style="width: ${percentage}%;"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function buildBranchOptions(units) {
  const uniqueBranches = [...new Set(units.map((unit) => unit.uploadedBranch).filter(Boolean))].sort();
  return uniqueBranches;
}

function setSyncStatus(message, isLive = true) {
  UI.syncStatus.textContent = message;
  const dot = UI.syncStatus.parentElement.querySelector('.dot');
  if (dot) {
    dot.classList.toggle('live', isLive);
  }
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function statusClass(status) {
  const normalized = normalizeStatus(status);

  if (normalized.includes('in stock')) return 'in-stock';
  if (normalized.includes('assigned')) return 'assigned';
  if (normalized.includes('released')) return 'released';
  if (normalized.includes('returned')) return 'returned';
  if (normalized.includes('pending')) return 'pending-return';

  return 'in-stock';
}

function formatCurrency(value) {
  const cleaned = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(cleaned)) return value || '—';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(cleaned);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
