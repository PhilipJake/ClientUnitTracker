window.GS_CONFIG = {
  sheetId: 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE',
  gid: '0',
  refreshMs: 15000,
  sheetName: 'Units'
};

window.GS_CONFIG.sheetUrl = `https://docs.google.com/spreadsheets/d/${window.GS_CONFIG.sheetId}/export?format=csv&gid=${window.GS_CONFIG.gid}`;
