function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} tidak ditemukan`);

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = formatCellValue(row[index]);
    });
    return item;
  });
}

// Sel tanggal dikirim sebagai teks di zona waktu script, supaya tidak bergeser sehari di browser.
function formatCellValue(value) {
  if (!(value instanceof Date)) return value;
  const timeZone = Session.getScriptTimeZone();
  const time = Utilities.formatDate(value, timeZone, 'HH:mm');
  return Utilities.formatDate(value, timeZone, time === '00:00' ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm');
}

function getOrCreateSheet(name, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  ensureColumns(sheet, headers);
  return sheet;
}

// Tambah header yang belum ada di ujung kanan; header yang sudah ada tidak diubah.
function ensureColumns(sheet, names) {
  const lastColumn = sheet.getLastColumn();
  const headers = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  const missing = names.filter(name => !headers.includes(name));
  if (missing.length) sheet.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]);
  return headers.concat(missing);
}

function getRefData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.REF);
  if (!sheet) return { asnaf: [], program: [], daerah: [] };

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return { asnaf: [], program: [], daerah: [] };

  const headers = rows[0];
  const asnafIndex = headers.indexOf('Asnaf');
  const programIndex = headers.indexOf('Program');
  const daerahIndex = headers.indexOf('Daerah');
  const asnaf = new Set();
  const program = new Set();
  const daerah = new Set();

  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    if (asnafIndex !== -1 && row[asnafIndex]) asnaf.add(row[asnafIndex]);
    if (programIndex !== -1 && row[programIndex]) program.add(row[programIndex]);
    if (daerahIndex !== -1 && row[daerahIndex]) daerah.add(row[daerahIndex]);
  }

  return {
    asnaf: Array.from(asnaf),
    program: Array.from(program),
    daerah: Array.from(daerah)
  };
}
