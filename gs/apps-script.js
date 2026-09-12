function doGet() {
  return HtmlService.createHtmlOutput('Client Unit Tracker Apps Script is running.');
}

function doPost(e) {
  const sheetName = 'Units';
  const spreadsheetId = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';

  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];

  const headers = [
    'Unit Code',
    'Client Name',
    'Unit Price',
    'Specs',
    'Uploaded Branch',
    'Current Location',
    'Date Received',
    'Date Released',
    'Status'
  ];

  const values = e && e.parameter ? e.parameter : {};
  const row = [
    values.unitCode || '',
    values.clientName || '',
    values.unitPrice || '',
    values.specs || '',
    values.uploadedBranch || '',
    values.currentLocation || '',
    values.dateReceived || '',
    values.dateReleased || '',
    values.status || 'In Stock'
  ];

  const lastRow = sheet.getLastRow();
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];

  if (lastRow === 0) {
    sheet.appendRow(headers);
  } else {
    const hasHeader = firstRow.some((cell) => String(cell).trim() === 'Unit Code');
    if (!hasHeader) {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  sheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }));
}
