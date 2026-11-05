function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} tidak ditemukan`);

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });
    return item;
  });
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
