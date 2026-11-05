function handlePenyaluranAction(action, data) {
  if (action === 'TAMBAH_SALUR') {
    const newId = addSalurRecord(data);
    invalidateMasterCache();
    return successResponse('Transaksi penyaluran berhasil disimpan', { idSalur: newId });
  }

  if (action === 'EDIT_SALUR') {
    editSalurRecord(data);
    invalidateMasterCache();
    return successResponse('Data penyaluran berhasil diperbarui');
  }

  if (action === 'HAPUS_PM_PROGRAM') {
    const result = deletePmProgram(data);
    invalidateMasterCache();
    return successResponse('Data penerimaan PM pada program berhasil dihapus', result);
  }

  return null;
}

function validateSalurData(data, isNew = true) {
  if (isNew && !data['ID PM']) throw new Error('ID PM wajib diisi');
  if (isNew && !data['PROGRAM']) throw new Error('PROGRAM wajib diisi');
  if (data['NIK PENERIMA'] && !/^\d{16}$/.test(String(data['NIK PENERIMA']))) {
    throw new Error('NIK PENERIMA harus 16 digit angka');
  }
  if (data['JUMLAH PENERIMAAN'] !== undefined && data['JUMLAH PENERIMAAN'] !== '') {
    const amount = Number(data['JUMLAH PENERIMAAN']);
    if (isNaN(amount) || amount < 0) throw new Error('JUMLAH PENERIMAAN harus angka >= 0');
  }
}

function addSalurRecord(data) {
  validateSalurData(data, true);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw new Error('Sistem sedang memproses data lain. Silakan coba lagi.');
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.SALUR);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let lastIdNumber = 0;
    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      const idColumn = headers.indexOf('ID SALUR') + 1;
      const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues().flat();
      for (const id of ids) {
        const match = String(id).match(/TX-2026-(\d+)/);
        if (match) lastIdNumber = Math.max(lastIdNumber, parseInt(match[1], 10));
      }
    }

    const newId = `TX-2026-${(lastIdNumber + 1).toString().padStart(5, '0')}`;
    const newRow = headers.map(header => {
      if (header === 'ID SALUR') return newId;
      return data[header] !== undefined ? data[header] : '';
    });

    sheet.appendRow(newRow);
    return newId;
  } finally {
    lock.releaseLock();
  }
}

function editSalurRecord(data) {
  validateSalurData(data, false);
  withScriptLock(() => editSalurRow(data));
}

function editSalurRow(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.SALUR);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idColumn = headers.indexOf('ID SALUR');
  if (idColumn === -1) throw new Error('Kolom ID SALUR tidak ditemukan');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('ID SALUR tidak ditemukan');
  const ids = sheet.getRange(2, idColumn + 1, lastRow - 1, 1).getValues().flat();
  let targetRow = null;
  for (let index = 0; index < ids.length; index++) {
    if (String(ids[index]).trim() === String(data['ID SALUR']).trim()) {
      targetRow = index + 2;
      break;
    }
  }
  if (!targetRow) throw new Error('ID SALUR tidak ditemukan');

  const rowRange = sheet.getRange(targetRow, 1, 1, sheet.getLastColumn());
  const rowValues = rowRange.getValues()[0];
  const fieldMapping = {
    'ID PM': 'ID PM',
    'NAMA PENERIMA': 'NAMA PENERIMA',
    'NIK PENERIMA': 'NIK PENERIMA',
    'DAERAH': 'DAERAH',
    'PROGRAM': 'PROGRAM',
    'JUMLAH PENERIMAAN': 'JUMLAH PENERIMAAN',
    'BENTUK PENERIMAAN': 'BENTUK PENERIMAAN',
    'KETERANGAN': 'KETERANGAN'
  };

  for (const [field, headerName] of Object.entries(fieldMapping)) {
    const columnIndex = headers.indexOf(headerName);
    if (columnIndex !== -1 && data[field] !== undefined) {
      let value = data[field];
      if (field === 'JUMLAH PENERIMAAN') value = Number(value) || 0;
      rowValues[columnIndex] = value;
    }
  }

  rowRange.setValues([rowValues]);
}

function deletePmProgram(data) {
  const idSalur = data['ID SALUR'];
  if (!idSalur) throw new Error('ID SALUR wajib diisi');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw new Error('Sistem sedang memproses data lain. Silakan coba lagi.');
  }

  try {
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SHEET_NAMES.SALUR);
    if (!sheet) throw new Error(`Sheet ${SHEET_NAMES.SALUR} tidak ditemukan`);
    if (sheet.getLastRow() < 2) throw new Error('Data penyaluran kosong');

    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const idColumn = headers.indexOf('ID SALUR');
    if (idColumn === -1) throw new Error('Kolom ID SALUR tidak ditemukan');

    const ids = sheet
      .getRange(2, idColumn + 1, sheet.getLastRow() - 1, 1)
      .getValues()
      .flat();
    const rowIndex = ids.findIndex(
      id => String(id).trim() === String(idSalur).trim()
    );
    if (rowIndex === -1) throw new Error('ID SALUR tidak ditemukan');

    sheet.deleteRow(rowIndex + 2);
    return { idSalur };
  } finally {
    lock.releaseLock();
  }
}
