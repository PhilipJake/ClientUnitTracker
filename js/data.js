const DATA = {
  async fetchUnits() {
    const config = window.GS_CONFIG || {};
    const sheetId = config.sheetId;
    const gid = config.gid;

    if (!sheetId || sheetId === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE') {
      throw new Error('Add your Google Sheet ID in gs/config.js before loading the app.');
    }

    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid || '0'}`;
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Google Sheet request failed with status ${response.status}.`);
    }

    const csvText = await response.text();
    return parseCsv(csvText);
  }
};

function parseCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvRow(lines[0]).map((header) => normalizeHeader(header));
  const rows = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = parseCsvRow(lines[index]);
    if (values.length === 0 || values.every((value) => !String(value).trim())) {
      continue;
    }

    const row = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] || '';
    });

    const normalized = normalizeRow(row);
    if (normalized.unitCode || normalized.clientName || normalized.status) {
      rows.push(normalized);
    }
  }

  return rows;
}

function parseCsvRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeRow(rawRow) {
  const row = {};

  Object.entries(rawRow).forEach(([key, value]) => {
    row[key] = String(value || '').trim();
  });

  const unitCode = findValue(row, ['unit code', 'unitcode']);
  const clientName = findValue(row, ['client name', 'clientname']);
  const unitPrice = findValue(row, ['unit price', 'price']);
  const specs = findValue(row, ['specs', 'processor', 'storage size', 'storage']);
  const uploadedBranch = findValue(row, ['uploaded branch', 'uploadedbranch', 'branch']);
  const currentLocation = findValue(row, ['current location', 'currentlocation', 'location']);
  const dateReceived = findValue(row, ['date received', 'datereceived', 'received date']);
  const dateReleased = findValue(row, ['date released', 'datereleased', 'released date']);
  const status = findValue(row, ['status']);

  return {
    unitCode: unitCode || '',
    clientName: clientName || '',
    unitPrice: unitPrice || '',
    specs: specs || '',
    uploadedBranch: uploadedBranch || '',
    currentLocation: currentLocation || '',
    dateReceived: dateReceived || '',
    dateReleased: dateReleased || '',
    status: status || 'Unknown',
  };
}

function findValue(row, keys) {
  for (const key of keys) {
    if (row[key]) {
      return row[key];
    }
  }

  return '';
}
