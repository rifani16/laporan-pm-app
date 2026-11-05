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

const SALUR_EXTRA_COLUMNS = ['ID KEGIATAN', 'DIINPUT OLEH', 'DIINPUT PADA', 'DIUBAH OLEH', 'DIUBAH PADA'];

function validateSalurData(data, isNew = true) {
  if (isNew && !data['ID PM']) throw new Error('ID PM wajib diisi');
  if (isNew && !data['ID KEGIATAN']) throw new Error('Pilih kegiatan penyaluran');
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
    const kegiatan = requireOpenKegiatan(data['ID KEGIATAN']);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.SALUR);
    const headers = ensureColumns(sheet, SALUR_EXTRA_COLUMNS);
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
    const record = {
      ...data,
      'ID SALUR': newId,
      'ID KEGIATAN': kegiatan['ID KEGIATAN'],
      PROGRAM: kegiatan.PROGRAM,
      'DIINPUT OLEH': data.actor,
      'DIINPUT PADA': new Date(),
      'DIUBAH OLEH': '',
      'DIUBAH PADA': ''
    };
    const newRow = headers.map(header => record[header] ?? '');

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
  const headers = ensureColumns(sheet, SALUR_EXTRA_COLUMNS);
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
  const col = header => headers.indexOf(header);

  // Program mengikuti kegiatan. Pindah kegiatan hanya ke kegiatan yang belum Selesai,
  // dan transaksi yang sudah masuk kegiatan tidak bisa dilepas lagi.
  const currentKegiatan = String(rowValues[col('ID KEGIATAN')] || '').trim();
  const nextKegiatan = data['ID KEGIATAN'] !== undefined ? String(data['ID KEGIATAN']).trim() : currentKegiatan;
  if (currentKegiatan && !nextKegiatan) {
    throw new Error('Transaksi yang sudah masuk kegiatan tidak bisa dilepas dari kegiatan');
  }
  let program = data.PROGRAM;
  if (nextKegiatan) {
    const found = nextKegiatan === currentKegiatan ? findKegiatan(nextKegiatan) : null;
    program = (found ? found.record : requireOpenKegiatan(nextKegiatan)).PROGRAM;
  }

  // ID PM sengaja tidak bisa diubah: transaksi tidak boleh dipindah ke PM lain.
  const values = {
    'NAMA PENERIMA': data['NAMA PENERIMA'],
    'NIK PENERIMA': data['NIK PENERIMA'],
    'DAERAH': data['DAERAH'],
    'PROGRAM': program,
    'JUMLAH PENERIMAAN': data['JUMLAH PENERIMAAN'] !== undefined ? Number(data['JUMLAH PENERIMAAN']) || 0 : undefined,
    'BENTUK PENERIMAAN': data['BENTUK PENERIMAAN'],
    'KETERANGAN': data['KETERANGAN'],
    'ID KEGIATAN': nextKegiatan,
    'DIUBAH OLEH': data.actor,
    'DIUBAH PADA': new Date()
  };
  for (const [header, value] of Object.entries(values)) {
    if (col(header) !== -1 && value !== undefined) rowValues[col(header)] = value;
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
