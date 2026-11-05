function handleProgramAction(action, data) {
  if (action === 'TAMBAH_PROGRAM') {
    const result = addProgramRecord(data);
    return successResponse('Program berhasil ditambahkan', result);
  }

  if (action === 'EDIT_PROGRAM') {
    const result = editProgramRecord(data);
    invalidateMasterCache();
    return successResponse('Program berhasil diperbarui', result);
  }

  if (action === 'HAPUS_PROGRAM') {
    const result = deleteProgramRecord(data);
    return successResponse('Program berhasil dihapus', result);
  }

  return null;
}

function addProgramRecord(data) {
  const name = validateProgramName(data.name);
  const lock = getProgramLock();

  try {
    const context = getProgramSheetContext();
    const duplicate = context.values.some(
      value => normalizeProgramName(value) === normalizeProgramName(name)
    );
    if (duplicate) throw new Error('Nama program sudah tersedia');

    const emptyIndex = context.values.findIndex(value => !String(value).trim());
    const targetRow = emptyIndex === -1 ? context.lastRow + 1 : emptyIndex + 2;
    context.sheet.getRange(targetRow, context.programColumn + 1).setValue(name);

    return { name };
  } finally {
    lock.releaseLock();
  }
}

function editProgramRecord(data) {
  const oldName = validateProgramName(data.oldName, 'Nama program lama');
  const newName = validateProgramName(data.newName, 'Nama program baru');
  const oldKey = normalizeProgramName(oldName);
  const newKey = normalizeProgramName(newName);
  const lock = getProgramLock();

  try {
    const context = getProgramSheetContext();
    const targetIndex = context.values.findIndex(
      value => normalizeProgramName(value) === oldKey
    );
    if (targetIndex === -1) throw new Error('Program tidak ditemukan');

    const duplicate = context.values.some((value, index) => (
      index !== targetIndex && normalizeProgramName(value) === newKey
    ));
    if (duplicate) throw new Error('Nama program sudah tersedia');

    context.sheet
      .getRange(targetIndex + 2, context.programColumn + 1)
      .setValue(newName);

    const updatedTransactions = replaceProgramInSheet(SHEET_NAMES.SALUR, oldKey, newName);
    replaceProgramInSheet(SHEET_NAMES.KEGIATAN, oldKey, newName);
    return { oldName, newName, updatedTransactions };
  } finally {
    lock.releaseLock();
  }
}

function deleteProgramRecord(data) {
  const name = validateProgramName(data.name);
  const nameKey = normalizeProgramName(name);
  const lock = getProgramLock();

  try {
    const context = getProgramSheetContext();
    const targetIndex = context.values.findIndex(
      value => normalizeProgramName(value) === nameKey
    );
    if (targetIndex === -1) throw new Error('Program tidak ditemukan');

    const usageCount = countProgramUsage(SHEET_NAMES.SALUR, nameKey);
    if (usageCount > 0) {
      throw new Error(`Program masih digunakan oleh ${usageCount} transaksi`);
    }
    const kegiatanCount = countProgramUsage(SHEET_NAMES.KEGIATAN, nameKey);
    if (kegiatanCount > 0) {
      throw new Error(`Program masih digunakan oleh ${kegiatanCount} kegiatan`);
    }

    // Hanya kosongkan sel Program. Jangan hapus baris karena kolom REF lain
    // (Asnaf/Daerah) dapat berisi data yang tidak berkaitan.
    context.sheet
      .getRange(targetIndex + 2, context.programColumn + 1)
      .clearContent();

    return { name };
  } finally {
    lock.releaseLock();
  }
}

function getProgramLock() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw new Error('Sistem sedang memproses data lain. Silakan coba lagi.');
  }
  return lock;
}

function validateProgramName(value, label) {
  const fieldLabel = label || 'Nama program';
  const name = String(value || '').trim();
  if (!name) throw new Error(`${fieldLabel} wajib diisi`);
  if (name.length > 100) throw new Error(`${fieldLabel} maksimal 100 karakter`);
  return name;
}

function normalizeProgramName(value) {
  return String(value || '').trim().toLocaleLowerCase();
}

function getProgramSheetContext() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_NAMES.REF);
  if (!sheet) throw new Error(`Sheet ${SHEET_NAMES.REF} tidak ditemukan`);
  if (sheet.getLastColumn() < 1) throw new Error('Header sheet REF tidak ditemukan');

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  const programColumn = headers.indexOf('Program');
  if (programColumn === -1) throw new Error('Kolom Program tidak ditemukan pada sheet REF');

  const lastRow = Math.max(sheet.getLastRow(), 1);
  const values = lastRow > 1
    ? sheet.getRange(2, programColumn + 1, lastRow - 1, 1).getValues().flat()
    : [];

  return { sheet, programColumn, lastRow, values };
}

// Sheet KEGIATAN bisa belum ada; anggap tidak ada pemakaian.
function getProgramColumnContext(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return { range: null, values: [] };

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  const programColumn = headers.indexOf('PROGRAM');
  if (programColumn === -1) throw new Error(`Kolom PROGRAM tidak ditemukan pada sheet ${sheetName}`);

  const range = sheet.getRange(2, programColumn + 1, sheet.getLastRow() - 1, 1);
  return { range, values: range.getValues() };
}

function countProgramUsage(sheetName, nameKey) {
  const context = getProgramColumnContext(sheetName);
  return context.values.reduce((count, row) => (
    normalizeProgramName(row[0]) === nameKey ? count + 1 : count
  ), 0);
}

function replaceProgramInSheet(sheetName, oldKey, newName) {
  const context = getProgramColumnContext(sheetName);
  if (!context.range) return 0;

  let updated = 0;
  const nextValues = context.values.map(row => {
    if (normalizeProgramName(row[0]) !== oldKey) return row;
    updated += 1;
    return [newName];
  });

  if (updated > 0) context.range.setValues(nextValues);
  return updated;
}
