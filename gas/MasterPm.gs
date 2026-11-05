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

const NIK_FIELDS = ['NIK', 'NIK ALT'];

// Satu NIK hanya boleh dipakai satu PM, baik sebagai NIK maupun NIK ALT.
function assertNikUnique(headers, rows, niks, ownIdPm) {
  const col = name => headers.indexOf(name);
  for (const row of rows) {
    const idPm = String(row[col('ID PM')]).trim();
    if (ownIdPm && idPm === ownIdPm) continue;
    for (const field of NIK_FIELDS) {
      const existing = col(field) === -1 ? '' : String(row[col(field)] || '').trim();
      if (existing && niks.includes(existing)) {
        throw new Error(`NIK ${existing} sudah terdaftar di ID PM ${idPm} (daerah ${row[col('DAERAH')] || '-'})`);
      }
    }
  }
}

function assertNikPairDistinct(nik, nikAlt) {
  if (nik && nik === nikAlt) throw new Error('NIK dan NIK ALT tidak boleh sama');
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

  // Hanya NIK yang berubah yang dicek, supaya duplikat lama tidak memblokir edit kolom lain.
  const current = rows[targetRow - 2];
  const currentNik = field => String(current[headers.indexOf(field)] || '').trim();
  const finalNik = field => (data[field] !== undefined ? String(data[field]).trim() : currentNik(field));
  assertNikPairDistinct(finalNik('NIK'), finalNik('NIK ALT'));
  const changedNiks = NIK_FIELDS
    .filter(field => finalNik(field) && finalNik(field) !== currentNik(field))
    .map(finalNik);
  assertNikUnique(headers, rows, changedNiks, String(data['ID PM']).trim());

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
    const [headers, ...rows] = sheet.getDataRange().getValues();
    const nik = String(data['NIK'] || '').trim();
    const nikAlt = String(data['NIK ALT'] || '').trim();
    assertNikPairDistinct(nik, nikAlt);
    assertNikUnique(headers, rows, [nik, nikAlt].filter(Boolean));

    let lastIdNumber = 0;
    const idColumn = headers.indexOf('ID PM');
    for (const row of rows) {
      const match = String(row[idColumn]).match(/KS-2026-(\d+)/);
      if (match) lastIdNumber = Math.max(lastIdNumber, parseInt(match[1], 10));
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

// Jalankan manual dari editor Apps Script untuk melihat NIK yang sudah terlanjur dobel.
function auditNikDobel() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.MASTER);
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const owners = new Map();
  for (const row of rows) {
    for (const field of NIK_FIELDS) {
      const nik = headers.indexOf(field) === -1 ? '' : String(row[headers.indexOf(field)] || '').trim();
      if (nik) owners.set(nik, [...(owners.get(nik) || []), row[headers.indexOf('ID PM')]]);
    }
  }
  const dobel = [...owners].filter(([, ids]) => ids.length > 1);
  console.log(dobel.length ? dobel.map(([nik, ids]) => `${nik}: ${ids.join(', ')}`).join('\n') : 'Tidak ada NIK dobel.');
}
