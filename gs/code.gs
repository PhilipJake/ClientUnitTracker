const SPREADSHEET_ID = '1tmUvhVy490c2j6io2czia9cOenVZ-NkyncDEgudmuLA';

function doGet() {
  return HtmlService.createHtmlOutput('Client Unit Tracker Apps Script is running.');
}

function doPost(e) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const values = e && e.parameter ? e.parameter : {};
  const action = String(values.action || 'units').toLowerCase();

  if (action === 'deleteunit') {
    return deleteUnitRow(spreadsheet, values.unitCode || values.code || '');
  }

  if (action === 'updateunit') {
    return updateUnitRow(spreadsheet, values);
  }

  if (action === 'deletebranch') {
    return deleteBranchRow(spreadsheet, values.branchName || values.name || '');
  }

  if (action === 'updatebranch') {
    return updateBranchRow(spreadsheet, values);
  }

  if (action === 'updateaccountbranch') {
    return updateAccountBranchRow(spreadsheet, values);
  }

  let sheetName = 'Units';
  if (action === 'accounts') {
    sheetName = 'Accounts';
  } else if (action === 'branches') {
    sheetName = 'Branches';
  }

  const sheet = ensureSheet(spreadsheet, sheetName);
  const headers = getHeadersForAction(action);
  const row = buildRowForAction(action, values);

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeader = firstRow.some((cell) => String(cell).trim() === headers[0]);

  if (!hasHeader) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  sheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    action,
    sheetName,
    inserted: row
  })).setMimeType(ContentService.MimeType.JSON);
}

function getCodeColumnIndex(headerRow) {
  const normalizedHeaders = (headerRow || []).map((header) => String(header).trim().toLowerCase());
  const matchIndex = normalizedHeaders.findIndex((header) => ['code', 'unit code', 'unitcode'].includes(header));
  return matchIndex;
}

function deleteUnitRow(spreadsheet, unitCode) {
  if (!unitCode) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Missing unit code' })).setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = spreadsheet.getSheetByName('Units') || spreadsheet.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0] || [];
  const codeIndex = getCodeColumnIndex(headerRow);

  if (codeIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Code column not found' })).setMimeType(ContentService.MimeType.JSON);
  }

  for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
    if (String(data[rowIndex][codeIndex] || '').trim() === String(unitCode).trim()) {
      sheet.deleteRow(rowIndex + 1);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, action: 'deleteUnit', deletedCode: unitCode })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Unit not found' })).setMimeType(ContentService.MimeType.JSON);
}

function deleteBranchRow(spreadsheet, branchName) {
  if (!branchName) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Missing branch name' })).setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = spreadsheet.getSheetByName('Branches') || spreadsheet.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0] || [];
  const nameIndex = (headerRow || []).findIndex((header) => String(header).trim().toLowerCase().includes('branch name'));

  if (nameIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Branch name column not found' })).setMimeType(ContentService.MimeType.JSON);
  }

  for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
    if (String(data[rowIndex][nameIndex] || '').trim() === String(branchName).trim()) {
      sheet.deleteRow(rowIndex + 1);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, action: 'deleteBranch', deletedName: branchName })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Branch not found' })).setMimeType(ContentService.MimeType.JSON);
}

function updateUnitRow(spreadsheet, values) {
  const sheet = spreadsheet.getSheetByName('Units') || spreadsheet.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0] || [];
  const codeIndex = getCodeColumnIndex(headerRow);
  const targetCode = String(values.originalUnitCode || values.unitCode || '').trim();

  if (codeIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Code column not found' })).setMimeType(ContentService.MimeType.JSON);
  }

  const rowToWrite = buildRowForAction('units', values);

  for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
    const currentCode = String(data[rowIndex][codeIndex] || '').trim();
    if (currentCode === targetCode) {
      const targetRange = sheet.getRange(rowIndex + 1, 1, 1, rowToWrite.length);
      targetRange.setValues([rowToWrite]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, action: 'updateUnit', updatedCode: targetCode })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Unit not found for update' })).setMimeType(ContentService.MimeType.JSON);
}

function updateBranchRow(spreadsheet, values) {
  const sheet = spreadsheet.getSheetByName('Branches') || spreadsheet.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0] || [];
  const nameIndex = (headerRow || []).findIndex((header) => String(header).trim().toLowerCase().includes('branch name'));
  const targetName = String(values.originalBranchName || values.branchName || '').trim();

  if (nameIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Branch name column not found' })).setMimeType(ContentService.MimeType.JSON);
  }

  const rowToWrite = buildRowForAction('branches', values);

  for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
    const currentName = String(data[rowIndex][nameIndex] || '').trim();
    if (currentName === targetName) {
      const targetRange = sheet.getRange(rowIndex + 1, 1, 1, rowToWrite.length);
      targetRange.setValues([rowToWrite]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, action: 'updateBranch', updatedName: targetName })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Branch not found for update' })).setMimeType(ContentService.MimeType.JSON);
}

function updateAccountBranchRow(spreadsheet, values) {
  const sheet = spreadsheet.getSheetByName('Accounts') || spreadsheet.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0] || [];
  const branchIndex = (headerRow || []).findIndex((header) => String(header).trim().toLowerCase().includes('branch'));
  const fullNameIndex = (headerRow || []).findIndex((header) => String(header).trim().toLowerCase().includes('full name'));
  const targetName = String(values.fullName || values.name || values.username || '').trim();

  if (branchIndex === -1 || fullNameIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Accounts branch fields not found' })).setMimeType(ContentService.MimeType.JSON);
  }

  const targetBranch = String(values.branch || values.branchName || values.accountBranch || '').trim();
  if (!targetName || !targetBranch) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Missing account name or branch' })).setMimeType(ContentService.MimeType.JSON);
  }

  for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
    const currentName = String(data[rowIndex][fullNameIndex] || '').trim();
    if (currentName === targetName) {
      sheet.getRange(rowIndex + 1, branchIndex + 1).setValue(targetBranch);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, action: 'updateAccountBranch', fullName: targetName, branch: targetBranch })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Account not found for branch update' })).setMimeType(ContentService.MimeType.JSON);
}

function ensureSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const desiredHeaders = getHeadersForAction(sheetName.toLowerCase() === 'accounts' ? 'accounts' : sheetName.toLowerCase() === 'branches' ? 'branches' : 'units');
  const headerRange = sheet.getRange(1, 1, 1, desiredHeaders.length);
  const firstRow = headerRange.getValues()[0];
  const isEmpty = firstRow.every((cell) => String(cell).trim() === '');

  if (isEmpty) {
    headerRange.setValues([desiredHeaders]);
  }

  sheet.setFrozenRows(1);
  sheet.setTabColor(getTabColor(sheetName));

  return sheet;
}

function getHeadersForAction(action) {
  switch (String(action || 'units').toLowerCase()) {
    case 'accounts':
      return ['Username', 'Password', 'Account Type', 'Full Name', 'Email', 'Branch', 'Status', 'Created At'];
    case 'branches':
      return ['Branch Type', 'Location', 'Branch Name', 'Head Admin', 'Status'];
    case 'units':
    default:
      return [
        'Code',
        'Client Name',
        'Unit Brand',
        'Unit Specs',
        'Unit Price',
        'Status',
        'Branch Location',
        'Current Location',
        'Date Received',
        'Date Released',
        'Warranty',
        'Unit Problem',
        'Inclusion',
        'Uploaded Branch'
      ];
  }
}

function buildRowForAction(action, values) {
  switch (String(action || 'units').toLowerCase()) {
    case 'accounts':
      return [
        values.username || '',
        values.password || '',
        values.accountType || '',
        values.fullName || '',
        values.email || '',
        values.branch || values.accountBranch || values.branchName || values.branchLocation || '',
        values.status || 'Active',
        values.createdAt || new Date().toISOString()
      ];
    case 'branches':
      return [
        values.branchType || values.branchCode || '',
        values.location || '',
        values.branchName || '',
        values.manager || values.headAdmin || '',
        values.status || 'Active'
      ];
    case 'units':
    default:
      return [
        values.unitCode || '',
        values.clientName || '',
        values.unitBrand || '',
        values.unitSpecs || '',
        values.unitPrice || '',
        values.status || '',
        values.branchLocation || '',
        values.currentLocation || values.branchLocation || '',
        values.dateReceived || values.datePurchase || '',
        values.dateReleased || values.dateReturn || '',
        values.warranty || '',
        values.unitProblem || '',
        values.inclusion || '',
        values.uploadedBranch || values.branchLocation || ''
      ];
  }
}

function getTabColor(sheetName) {
  switch (sheetName) {
    case 'Units':
      return '#1a73e8';
    case 'Accounts':
      return '#34a853';
    case 'Branches':
      return '#f7b500';
    default:
      return '#5f6368';
  }
}
