const backdrop = document.getElementById('unitModalBackdrop');
const openBtn = document.getElementById('openUnitModalBtn');
const closeBtn = document.getElementById('closeUnitModalBtn');
const cancelBtn = document.getElementById('cancelUnitModalBtn');
const unitForm = document.getElementById('unitForm');
const unitSubmitButton = document.getElementById('saveUnitButton');
const unitRegistryTableBody = document.getElementById('unitRegistryTableBody');
const unitModalTitle = document.getElementById('unitModalTitle');
const messageModalBackdrop = document.getElementById('messageModalBackdrop');
const messageModalBody = document.getElementById('messageModalBody');
const closeMessageModalBtn = document.getElementById('closeMessageModalBtn');
const okMessageModalBtn = document.getElementById('okMessageModalBtn');
const unitSearchInput = document.querySelector('.search-box input');
let activeEditCode = '';
let pendingConfirmAction = null;
let registryRowsCache = [];

function showPopupMessage(message, onConfirm = null) {
  if (!messageModalBackdrop || !messageModalBody) return alert(message);

  pendingConfirmAction = onConfirm || null;
  messageModalBody.textContent = message;
  messageModalBackdrop.classList.add('visible');
  messageModalBackdrop.setAttribute('aria-hidden', 'false');

  if (okMessageModalBtn) {
    okMessageModalBtn.textContent = onConfirm ? 'Yes' : 'OK';
  }
}

function closePopupMessage() {
  if (!messageModalBackdrop) return;
  pendingConfirmAction = null;
  if (okMessageModalBtn) {
    okMessageModalBtn.textContent = 'OK';
  }
  messageModalBackdrop.classList.remove('visible');
  messageModalBackdrop.setAttribute('aria-hidden', 'true');
}

function openUnitModal(mode = 'create', unit = null) {
  if (!backdrop) return;

  if (mode === 'edit' && unit) {
    activeEditCode = String(unit.unitCode || unit.code || '').trim();
    unitForm.dataset.mode = 'edit';
    if (unitModalTitle) unitModalTitle.textContent = 'Edit Unit';
    if (unitSubmitButton) unitSubmitButton.textContent = 'Update Unit';
    populateUnitForm(unit);

    const unitPriceField = unitForm.elements.namedItem('unitPrice');
    if (unitPriceField) {
      unitPriceField.hidden = false;
      unitPriceField.disabled = true;
      unitPriceField.setAttribute('readonly', 'readonly');
      unitPriceField.style.background = '#f4f6f8';
      unitPriceField.style.cursor = 'not-allowed';
    }

    const role = localStorage.getItem('unitflowRole');
    const savedBranch = String(unit.uploadedBranch || unit.branchLocation || unit.currentLocation || '').trim();
    const branchField = unitForm.elements.namedItem('branchLocation');

    if (branchField && savedBranch) {
      branchField.value = savedBranch;
      if (role === 'Branch Head Admin' || ['Super Admin', 'Main Head Admin', 'Office'].includes(role || '')) {
        branchField.setAttribute('readonly', 'readonly');
      }
    }
  } else {
    activeEditCode = '';
    unitForm.dataset.mode = 'create';
    if (unitModalTitle) unitModalTitle.textContent = 'Add Unit';
    if (unitSubmitButton) unitSubmitButton.textContent = 'Save Unit';
    unitForm.reset();

    const unitPriceField = unitForm.elements.namedItem('unitPrice');
    if (unitPriceField) {
      unitPriceField.hidden = false;
      unitPriceField.disabled = false;
      unitPriceField.removeAttribute('readonly');
      unitPriceField.style.background = '';
      unitPriceField.style.cursor = '';
    }

    const role = localStorage.getItem('unitflowRole');
    const assignedBranch = String(localStorage.getItem('unitflowBranch') || '').trim();
    if (role === 'Branch Head Admin' && assignedBranch) {
      const branchField = unitForm.elements.namedItem('branchLocation');
      if (branchField) {
        branchField.value = assignedBranch;
        branchField.setAttribute('readonly', 'readonly');
      }
    }
  }

  backdrop.classList.add('visible');
  backdrop.setAttribute('aria-hidden', 'false');
}

function closeUnitModal() {
  if (!backdrop) return;
  backdrop.classList.remove('visible');
  backdrop.setAttribute('aria-hidden', 'true');
  activeEditCode = '';
  if (unitForm) {
    unitForm.dataset.mode = 'create';
    unitForm.reset();
  }
  if (unitModalTitle) unitModalTitle.textContent = 'Add Unit';
  if (unitSubmitButton) unitSubmitButton.textContent = 'Save Unit';
}

function populateUnitForm(unit) {
  if (!unitForm) return;

  const inclusionValues = String(unit.inclusion || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const inclusionOptions = unitForm.querySelectorAll('input[name="inclusionOption"]');
  inclusionOptions.forEach((input) => {
    input.checked = inclusionValues.includes(input.value);
  });

  const inclusionHidden = document.getElementById('inclusion');
  if (inclusionHidden) {
    inclusionHidden.value = inclusionValues.join(', ');
  }

  const fields = {
    unitCode: unit.unitCode || unit.code || '',
    unitSpecs: unit.unitSpecs || unit.specs || '',
    unitBrand: unit.unitBrand || unit.brand || '',
    clientName: unit.clientName || '',
    warranty: unit.warranty || '',
    datePurchase: unit.dateReceived || unit.datePurchase || '',
    dateReturn: unit.dateReleased || unit.dateReturn || '',
    unitProblem: unit.unitProblem || unit.problem || '',
    status: unit.status || '',
    branchLocation: unit.branchLocation || unit.currentLocation || unit.uploadedBranch || '',
    currentLocation: unit.currentLocation || unit.branchLocation || unit.uploadedBranch || '',
    uploadedBranch: unit.uploadedBranch || unit.branchLocation || '',
    unitPrice: unit.unitPrice || ''
  };

  Object.entries(fields).forEach(([key, value]) => {
    const field = unitForm.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  });
}

function syncInclusionField() {
  const options = unitForm.querySelectorAll('input[name="inclusionOption"]');
  const selectedValues = Array.from(options)
    .filter((input) => input.checked)
    .map((input) => input.value.trim())
    .filter(Boolean);

  const hiddenInput = document.getElementById('inclusion');
  if (hiddenInput) {
    hiddenInput.value = selectedValues.join(', ');
  }
}

function normalizeSavedUnitPayload(form) {
  const hidden = form.elements.namedItem('inclusion');
  const raw = Object.fromEntries(new FormData(form).entries());
  raw.inclusion = String(hidden ? hidden.value : '').trim();

  const role = localStorage.getItem('unitflowRole');
  const assignedBranch = String(localStorage.getItem('unitflowBranch') || '').trim();
  const branchFromRecord = String(raw.uploadedBranch || raw.branchLocation || raw.currentLocation || '').trim();

  if (role === 'Branch Head Admin' && assignedBranch) {
    raw.branchLocation = assignedBranch;
    raw.uploadedBranch = assignedBranch;
    raw.currentLocation = assignedBranch;
  } else if (branchFromRecord) {
    raw.branchLocation = branchFromRecord;
    raw.uploadedBranch = branchFromRecord;
    raw.currentLocation = branchFromRecord;
  }

  const branchLocation = String(raw.branchLocation || '').trim();
  const uploadedBranch = String(raw.uploadedBranch || raw.branchLocation || '').trim();
  const currentLocation = String(raw.currentLocation || raw.branchLocation || '').trim();
  const dateReceived = String(raw.datePurchase || raw.dateReceived || '').trim();
  const dateReleased = String(raw.dateReturn || raw.dateReleased || '').trim();

  return {
    action: 'units',
    unitCode: String(raw.unitCode || '').trim(),
    clientName: String(raw.clientName || '').trim(),
    unitBrand: String(raw.unitBrand || '').trim(),
    unitSpecs: String(raw.unitSpecs || '').trim(),
    unitPrice: String(raw.unitPrice || '').trim(),
    status: String(raw.status || '').trim(),
    branchLocation,
    currentLocation,
    dateReceived,
    dateReleased,
    warranty: String(raw.warranty || '').trim(),
    unitProblem: String(raw.unitProblem || '').trim(),
    inclusion: String(raw.inclusion || '').trim(),
    uploadedBranch
  };
}

async function saveUnitToSheet(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const config = window.GS_CONFIG || {};
  const sheetId = config.sheetId || '';
  const appScriptUrl = config.appScriptUrl || '';
  const role = localStorage.getItem('unitflowRole');
  const assignedBranch = String(localStorage.getItem('unitflowBranch') || '').trim();

  if (!sheetId || sheetId === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE') {
    showPopupMessage('Please update the Google Sheet ID in gs/config.js before saving.');
    return;
  }

  if (!appScriptUrl || appScriptUrl === 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
    showPopupMessage('Please deploy the Apps Script and paste its Web App URL into gs/config.js before saving.');
    return;
  }

  if (role === 'Branch Head Admin' && !assignedBranch) {
    showPopupMessage('This Branch Head Admin account has no assigned branch. Please assign a branch before adding a unit.');
    return;
  }

  const payload = normalizeSavedUnitPayload(form);
  const requestAction = form.dataset.mode === 'edit' ? 'updateUnit' : 'units';
  const body = new URLSearchParams({
    ...payload,
    action: requestAction,
    originalUnitCode: activeEditCode || payload.unitCode || ''
  }).toString();

  try {
    const response = await fetch(appScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || (result && result.ok === false)) {
      const message = result && result.error ? result.error : await response.text().catch(() => '');
      throw new Error(message || `HTTP ${response.status}`);
    }

    showPopupMessage(form.dataset.mode === 'edit' ? 'Unit updated successfully to Google Sheets.' : 'Unit saved successfully to Google Sheets.');
    form.reset();
    closeUnitModal();

    if (typeof loadRegistryUnits === 'function') {
      await loadRegistryUnits();
      await DATA.fetchUnits();
    }
  } catch (error) {
    console.error('Save unit failed:', error);
    showPopupMessage('Save failed. Please confirm the Apps Script web app URL and Google Sheet ID are correct.');
  }
}

function initUnitModal() {
  if (openBtn) {
    openBtn.addEventListener('click', () => openUnitModal('create'));
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeUnitModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeUnitModal);
  }

  if (closeMessageModalBtn) {
    closeMessageModalBtn.addEventListener('click', closePopupMessage);
  }

  if (okMessageModalBtn) {
    okMessageModalBtn.addEventListener('click', async () => {
      if (pendingConfirmAction) {
        const action = pendingConfirmAction;
        pendingConfirmAction = null;
        okMessageModalBtn.textContent = 'OK';
        await action();
      }
      closePopupMessage();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        closeUnitModal();
      }
    });
  }

  if (messageModalBackdrop) {
    messageModalBackdrop.addEventListener('click', (event) => {
      if (event.target === messageModalBackdrop) {
        closePopupMessage();
      }
    });
  }

  if (unitForm) {
    const inclusionOptions = unitForm.querySelectorAll('input[name="inclusionOption"]');

    inclusionOptions.forEach((option) => {
      option.addEventListener('change', () => {
        syncInclusionField();
      });
    });

    unitForm.addEventListener('submit', saveUnitToSheet);
  }

  if (unitSearchInput) {
    unitSearchInput.addEventListener('input', () => {
      renderRegistryTable(registryRowsCache);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && backdrop && backdrop.classList.contains('visible')) {
      closeUnitModal();
    }
  });

  if (unitRegistryTableBody) {
    unitRegistryTableBody.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const row = button.closest('tr');
      const unitCode = (row && row.dataset.unitCode) ? row.dataset.unitCode : (row && row.cells && row.cells[0] ? row.cells[0].textContent.trim() : '');

      if (!unitCode || !row) return;

      if (button.classList.contains('edit')) {
        const rows = await DATA.fetchUnits();
        const unit = rows.find((item) => String(item.unitCode || '').trim() === unitCode) || rows.find((item) => String(item.code || '').trim() === unitCode) || rows.find((item) => String(item.unitCode || item.code || '').trim().toLowerCase() === unitCode.toLowerCase());
        if (unit) {
          openUnitModal('edit', unit);
        } else {
          showPopupMessage('Unit not found in the live spreadsheet.');
        }
      }

      if (button.classList.contains('delete')) {
        const appScriptUrl = window.GS_CONFIG ? window.GS_CONFIG.appScriptUrl : '';
        if (!appScriptUrl) {
          showPopupMessage('Please configure the Apps Script URL before deleting a unit.');
          return;
        }

        showPopupMessage(`Delete unit ${unitCode}?`, async () => {
          try {
            const response = await fetch(appScriptUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
              },
              body: new URLSearchParams({ action: 'deleteUnit', unitCode }).toString()
            });

            const result = await response.json().catch(() => null);

            if (!response.ok || (result && result.ok === false)) {
              const message = result && result.error ? result.error : await response.text().catch(() => '');
              throw new Error(message || `HTTP ${response.status}`);
            }

            showPopupMessage('Unit deleted successfully.');
            if (typeof loadRegistryUnits === 'function') {
              await loadRegistryUnits();
            }
          } catch (error) {
            console.error('Delete unit failed:', error);
            showPopupMessage('Delete failed. Please confirm the Apps Script URL is correct.');
          }
        });
      }
    });
  }

  if (typeof loadRegistryUnits === 'function') {
    loadRegistryUnits();
  }
}

async function loadRegistryUnits() {
  if (!unitRegistryTableBody) return;

  try {
    const rows = await DATA.fetchUnits();
    registryRowsCache = Array.isArray(rows) ? rows : [];
    renderRegistryTable(registryRowsCache);
  } catch (error) {
    console.error(error);
    unitRegistryTableBody.innerHTML = '<tr><td colspan="14" class="empty-state">Unable to load live spreadsheet data.</td></tr>';
  }
}

function renderRegistryTable(rows) {
  if (!unitRegistryTableBody) return;

  const searchTerm = String(unitSearchInput ? unitSearchInput.value : '').trim().toLowerCase();
  const filteredRows = !searchTerm
    ? rows
    : rows.filter((unit) => {
        const unitCode = String(unit.unitCode || unit.code || '').trim().toLowerCase();
        const clientName = String(unit.clientName || '').trim().toLowerCase();
        return unitCode.includes(searchTerm) || clientName.includes(searchTerm);
      });

  if (!filteredRows.length) {
    unitRegistryTableBody.innerHTML = '<tr><td colspan="14" class="empty-state">No matching units found.</td></tr>';
    return;
  }

  const currentRole = localStorage.getItem('unitflowRole');

  unitRegistryTableBody.innerHTML = filteredRows
    .map((unit) => {
      const code = unit.unitCode || '—';
      const specs = unit.specs || '—';
      const price = unit.unitPrice || '—';
      const brand = unit.unitBrand || unit.unitBrandName || unit.brand || '—';
      const client = unit.clientName || '—';
      const warranty = unit.warranty || '—';
      const datePurchase = formatDateDisplay(unit.dateReceived || unit.datePurchase || '');
      const dateReturn = formatDateDisplay(unit.dateReleased || unit.dateReturn || '');
      const runningDays = computeRunningDays(unit.dateReleased || unit.dateReturn || unit.dateReceived) || '—';
      const problem = unit.unitProblem || unit.problem || '—';
      const status = unit.status || 'Unknown';
      const branch = unit.uploadedBranch || unit.branchLocation || unit.currentLocation || '—';
      const inclusion = unit.inclusion || '—';
      const isOfficeRole = currentRole === 'Office';

      return `
        <tr data-unit-code="${escapeHtml(code)}">
          <td>${escapeHtml(code)}</td>
          <td>${escapeHtml(specs)}</td>
          <td>${escapeHtml(price ? formatCurrency(price) : '—')}</td>
          <td>${escapeHtml(brand)}</td>
          <td>${escapeHtml(client)}</td>
          <td>${escapeHtml(warranty)}</td>
          <td>${escapeHtml(datePurchase)}</td>
          <td>${escapeHtml(dateReturn)}</td>
          <td>${escapeHtml(runningDays)}</td>
          <td>${escapeHtml(problem)}</td>
          <td><span class="badge ${statusClass(status)}">${escapeHtml(status)}</span></td>
          <td><span class="branch-tag ${branchClass(branch)}">${escapeHtml(branch)}</span></td>
          <td>${escapeHtml(inclusion)}</td>
          <td class="table-actions">
            ${isOfficeRole ? '<span class="view-only">View only</span>' : '<button class="edit">Edit</button><button class="delete">Delete</button>'}
          </td>
        </tr>
      `;
    })
    .join('');
}

function computeRunningDays(dateValue) {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  return String(Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24))));
}

function formatDateDisplay(value) {
  if (!value) return '—';

  const trimmed = String(value).trim();
  if (!trimmed) return '—';

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function statusClass(status) {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized.includes('urgent')) return 'urgent';
  if (normalized.includes('observation')) return 'observation';
  if (normalized.includes('released')) return 'released';
  if (normalized.includes('returned')) return 'returned';
  if (normalized.includes('pending')) return 'pending-return';

  return 'in-stock';
}

function branchClass(branch) {
  const normalized = String(branch || '').toLowerCase();

  if (normalized.includes('bnb')) return 'bnb';
  if (normalized.includes('ez')) return 'ez';
  if (normalized.includes('1lr')) return 'one-lr';

  return 'bnb';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUnitModal);
} else {
  initUnitModal();
}

function formatCurrency(value) {
  const cleaned = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(cleaned)) return value || '—';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(cleaned);
}
