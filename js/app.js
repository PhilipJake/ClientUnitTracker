const state = {
  allUnits: [],
  filters: {
    search: '',
    status: 'all',
    branch: 'all'
  }
};

async function loadUnits() {
  try {
    setSyncStatus('Syncing…');
    const rows = await DATA.fetchUnits();
    state.allUnits = rows;

    renderSummary(rows);
    renderTable(rows);
    renderBranchPulse(rows);
    setSyncStatus('Live sync', true);
  } catch (error) {
    console.error(error);
    setSyncStatus('Could not load live data', false);
    renderSummary([]);
    renderTable([]);
    UI.branchPulseList.innerHTML = '<div class="empty-state">Unable to load live spreadsheet data.</div>';
  }
}

function startPolling() {
  const intervalMs = window.GS_CONFIG?.refreshMs || 15000;
  setInterval(() => {
    loadUnits();
  }, intervalMs);
}

document.addEventListener('DOMContentLoaded', () => {
  loadUnits();
  startPolling();
});
