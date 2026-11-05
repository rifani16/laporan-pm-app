const KEGIATAN_HEADERS = [
  'ID KEGIATAN', 'NAMA KEGIATAN', 'PROGRAM', 'TANGGAL', 'LOKASI', 'SUMBER DANA',
  'ANGGARAN', 'PENANGGUNG JAWAB', 'STATUS', 'KETERANGAN'
];
const KEGIATAN_STATUS = ['Rencana', 'Berjalan', 'Selesai'];
const KEGIATAN_TEXT_FIELDS = ['NAMA KEGIATAN', 'LOKASI', 'SUMBER DANA', 'PENANGGUNG JAWAB', 'KETERANGAN'];

function handleKegiatanAction(action, data) {
  if (action === 'TAMBAH_KEGIATAN') {
    const idKegiatan = withScriptLock(() => addKegiatan(data));
    return successResponse('Kegiatan berhasil ditambahkan', { idKegiatan });
  }
  if (action === 'EDIT_KEGIATAN') {
    withScriptLock(() => editKegiatan(data));
    invalidateMasterCache();
    return successResponse('Kegiatan berhasil diperbarui');
  }
  if (action === 'HAPUS_KEGIATAN') {
    withScriptLock(() => deleteKegiatan(data));
    return successResponse('Kegiatan berhasil dihapus');
  }
  return null;
}

// Realisasi dan jumlah penerima dihitung dari seluruh transaksi, lintas daerah.
function listKegiatan(salurRows) {
  if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.KEGIATAN)) return [];
  const totals = new Map();
  for (const salur of salurRows) {
    const id = String(salur['ID KEGIATAN'] || '').trim();
    if (!id) continue;
    if (!totals.has(id)) totals.set(id, { realisasi: 0, penerima: new Set() });
    const total = totals.get(id);
    total.realisasi += Number(salur['JUMLAH PENERIMAAN']) || 0;
    if (salur['ID PM']) total.penerima.add(salur['ID PM']);
  }
  return getSheetData(SHEET_NAMES.KEGIATAN)
    .filter(kegiatan => String(kegiatan['ID KEGIATAN'] || '').trim())
    .map(kegiatan => {
      const total = totals.get(String(kegiatan['ID KEGIATAN']).trim());
      return {
        ...kegiatan,
        REALISASI: total ? total.realisasi : 0,
        'JUMLAH PENERIMA': total ? total.penerima.size : 0
      };
    });
}

function findKegiatan(id) {
  const target = String(id || '').trim();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.KEGIATAN);
  if (!target || !sheet) return null;
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const index = rows.findIndex(row => String(row[headers.indexOf('ID KEGIATAN')]).trim() === target);
  if (index === -1) return null;
  const record = {};
  headers.forEach((header, column) => { record[header] = rows[index][column]; });
  return { sheet, headers, rowNumber: index + 2, record };
}

// Transaksi baru hanya boleh masuk kegiatan yang belum Selesai.
function requireOpenKegiatan(id) {
  const found = findKegiatan(id);
  if (!found) throw new Error('Pilih kegiatan penyaluran yang terdaftar');
  if (found.record.STATUS === 'Selesai') {
    throw new Error('Kegiatan sudah selesai, transaksi baru tidak bisa ditambahkan');
  }
  return found.record;
}

function countKegiatanTransactions(id) {
  return getSheetData(SHEET_NAMES.SALUR)
    .filter(salur => String(salur['ID KEGIATAN'] || '').trim() === id)
    .length;
}

function isValidIsoDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validateKegiatan(data) {
  const values = {};
  for (const field of KEGIATAN_TEXT_FIELDS) values[field] = String(data[field] || '').trim();
  if (!values['NAMA KEGIATAN']) throw new Error('Nama kegiatan wajib diisi');

  const program = String(data.PROGRAM || '').trim();
  if (!getRefData().program.map(String).includes(program)) throw new Error('Pilih program yang terdaftar');

  const tanggal = String(data.TANGGAL || '').trim();
  if (!isValidIsoDate(tanggal)) throw new Error('Tanggal penyaluran tidak valid');

  const anggaranText = String(data.ANGGARAN ?? '').trim();
  const anggaran = anggaranText === '' ? '' : Number(anggaranText);
  if (anggaran !== '' && (!Number.isFinite(anggaran) || anggaran < 0)) {
    throw new Error('Anggaran harus angka >= 0');
  }

  const status = String(data.STATUS || 'Rencana');
  if (!KEGIATAN_STATUS.includes(status)) throw new Error('Status kegiatan tidak valid');

  return { ...values, PROGRAM: program, TANGGAL: tanggal, ANGGARAN: anggaran, STATUS: status };
}

function addKegiatan(data) {
  const values = validateKegiatan(data);
  const sheet = getOrCreateSheet(SHEET_NAMES.KEGIATAN, KEGIATAN_HEADERS);
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const idColumn = headers.indexOf('ID KEGIATAN');
  const lastNumber = rows.reduce((max, row) => {
    const match = String(row[idColumn]).match(/^KG-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  const idKegiatan = `KG-${String(lastNumber + 1).padStart(5, '0')}`;
  const record = { ...values, 'ID KEGIATAN': idKegiatan };
  sheet.appendRow(headers.map(header => record[header] ?? ''));
  return idKegiatan;
}

function editKegiatan(data) {
  const found = findKegiatan(data['ID KEGIATAN']);
  if (!found) throw new Error('Kegiatan tidak ditemukan');
  const values = validateKegiatan(data);
  const id = String(found.record['ID KEGIATAN']).trim();
  const programChanged = normalizeProgramName(values.PROGRAM) !== normalizeProgramName(found.record.PROGRAM);
  if (programChanged && countKegiatanTransactions(id) > 0) {
    throw new Error('Program tidak bisa diganti karena kegiatan sudah punya transaksi');
  }
  const record = { ...found.record, ...values };
  found.sheet
    .getRange(found.rowNumber, 1, 1, found.headers.length)
    .setValues([found.headers.map(header => record[header] ?? '')]);
}

function deleteKegiatan(data) {
  const found = findKegiatan(data['ID KEGIATAN']);
  if (!found) throw new Error('Kegiatan tidak ditemukan');
  const count = countKegiatanTransactions(String(found.record['ID KEGIATAN']).trim());
  if (count > 0) throw new Error(`Kegiatan masih punya ${count} transaksi`);
  found.sheet.deleteRow(found.rowNumber);
}
