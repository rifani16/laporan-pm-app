const MASTER_EDITABLE_FIELDS = [
  'NAMA PM', 'NIK', 'NAMA PM ALT', 'NIK ALT', 'NO KK', 'ALAMAT',
  'DAERAH', 'NO HP', 'ASNAF', 'PEKERJAAN', 'CATATAN'
];

function handleMasterAction(action, data) {
  if (action === 'EDIT_MASTER') {
    editMasterRecord(data);
    invalidateMasterCache();
    return successResponse('Master data berhasil diperbarui');
  }

  if (action === 'TAMBAH_MASTER') {
    const newId = addMasterRecord(data);
    invalidateMasterCache();
    return successResponse('Data PM baru berhasil ditambahkan', { idPm: newId });
  }

  if (action === 'HAPUS_MASTER') {
    deleteMasterRecord(data);
    invalidateMasterCache();
    return successResponse('Data PM berhasil dihapus');
  }

  return null;
}

function validatePmData(data, isNew = true) {
  if (isNew && !data['NAMA PM']) throw new Error('NAMA PM wajib diisi');
  if (data.NIK && !/^\d{16}$/.test(data.NIK)) throw new Error('NIK harus 16 digit angka');
  if (data['NIK ALT'] && !/^\d{16}$/.test(data['NIK ALT'])) throw new Error('NIK ALT harus 16 digit angka');
  if (data['NO KK'] && !/^\d{16}$/.test(data['NO KK'])) throw new Error('NO KK harus 16 digit angka');
  if (data['JUMLAH PENERIMAAN'] && isNaN(Number(data['JUMLAH PENERIMAAN']))) {
    throw new Error('JUMLAH PENERIMAAN harus angka');
  }
}

function withScriptLock(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw new Error('Sistem sedang memproses data lain. Silakan coba lagi.');
  }
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function editMasterRecord(data) {
  validatePmData(data, false);
  withScriptLock(() => editMasterRow(data));
}

function editMasterRow(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.MASTER);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idColumn = headers.indexOf('ID PM') + 1;
  if (idColumn === 0) throw new Error('Kolom ID PM tidak ditemukan');
  if (sheet.getLastRow() < 2) throw new Error('ID PM tidak ditemukan');

  const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
  const rows = dataRange.getValues();
  let targetRow = null;

  for (let index = 0; index < rows.length; index++) {
    if (String(rows[index][idColumn - 1]).trim() === String(data['ID PM']).trim()) {
      targetRow = index + 2;
      break;
    }
  }
  if (!targetRow) throw new Error('ID PM tidak ditemukan');

  const rowRange = sheet.getRange(targetRow, 1, 1, sheet.getLastColumn());
  const rowValues = rowRange.getValues()[0];
  for (const field of MASTER_EDITABLE_FIELDS) {
    const column = headers.indexOf(field) + 1;
    if (column > 0 && data[field] !== undefined) {
      rowValues[column - 1] = data[field];
    }
  }

  rowRange.setValues([rowValues]);
}

function addMasterRecord(data) {
  validatePmData(data, true);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw new Error('Sistem sedang memproses data lain. Silakan coba lagi.');
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.MASTER);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let lastIdNumber = 0;
    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      const idColumn = headers.indexOf('ID PM') + 1;
      const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues().flat();
      for (const id of ids) {
        const match = String(id).match(/KS-2026-(\d+)/);
        if (match) lastIdNumber = Math.max(lastIdNumber, parseInt(match[1], 10));
      }
    }

    const newId = `KS-2026-${(lastIdNumber + 1).toString().padStart(5, '0')}`;
    const newRow = headers.map(header => {
      if (header === 'ID PM') return newId;
      // Whitelist yang sama dengan edit, supaya add tidak bisa mengisi kolom lain.
      return MASTER_EDITABLE_FIELDS.includes(header) && data[header] !== undefined ? data[header] : '';
    });

    sheet.appendRow(newRow);
    return newId;
  } finally {
    lock.releaseLock();
  }
}

function deleteMasterRecord(data) {
  const idPm = data['ID PM'];
  if (!idPm) throw new Error('ID PM wajib diisi');
  withScriptLock(() => deleteMasterRow(idPm));
}

function deleteMasterRow(idPm) {

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = spreadsheet.getSheetByName(SHEET_NAMES.MASTER);
  const salurSheet = spreadsheet.getSheetByName(SHEET_NAMES.SALUR);
  if (!masterSheet) throw new Error(`Sheet ${SHEET_NAMES.MASTER} tidak ditemukan`);
  if (!salurSheet) throw new Error(`Sheet ${SHEET_NAMES.SALUR} tidak ditemukan`);

  const salurLastRow = salurSheet.getLastRow();
  const salurLastColumn = salurSheet.getLastColumn();
  if (salurLastRow > 1) {
    const salurHeaders = salurSheet
      .getRange(1, 1, 1, salurLastColumn)
      .getValues()[0];
    const idPmColumn = salurHeaders.indexOf('ID PM');
    if (idPmColumn === -1) {
      throw new Error('Kolom ID PM tidak ditemukan pada sheet SALUR');
    }

    const salurRows = salurSheet
      .getRange(2, 1, salurLastRow - 1, salurLastColumn)
      .getValues();
    const hasTransaction = salurRows.some(row => (
      String(row[idPmColumn]).trim() === String(idPm).trim()
    ));
    if (hasTransaction) {
      throw new Error(
        'PM masih memiliki riwayat penyaluran. Hapus data penerimaan/program terlebih dahulu.'
      );
    }
  }

  const masterLastRow = masterSheet.getLastRow();
  const masterLastColumn = masterSheet.getLastColumn();
  if (masterLastRow < 2) throw new Error('Data PM kosong');

  const headers = masterSheet
    .getRange(1, 1, 1, masterLastColumn)
    .getValues()[0];
  const idColumn = headers.indexOf('ID PM');
  if (idColumn === -1) throw new Error('Kolom ID PM tidak ditemukan');

  const ids = masterSheet
    .getRange(2, idColumn + 1, masterLastRow - 1, 1)
    .getValues()
    .flat();
  const index = ids.findIndex(id => String(id).trim() === String(idPm).trim());
  if (index === -1) throw new Error('ID PM tidak ditemukan');

  masterSheet.deleteRow(index + 2);
}
