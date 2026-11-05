export const KEGIATAN_STATUS = ['Rencana', 'Berjalan', 'Selesai'];

export const isOpenKegiatan = (kegiatan) => kegiatan.STATUS !== 'Selesai';

export const indexKegiatan = (list) => new Map(list.map(k => [String(k['ID KEGIATAN']), k]));

// Tanggal transaksi = tanggal kegiatannya. Tanpa kegiatan berarti tanpa tanggal,
// jadi transaksi itu tidak ikut begitu filter tanggal dipakai.
export function inDateRange(tanggal, dari, sampai) {
  if (!dari && !sampai) return true;
  if (!tanggal) return false;
  const day = String(tanggal).slice(0, 10);
  return (!dari || day >= dari) && (!sampai || day <= sampai);
}

export function formatTanggal(tanggal) {
  const match = String(tanggal || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '-';
  const [, year, month, day] = match.map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const formatRupiah = (value) => `Rp ${(Number(value) || 0).toLocaleString('id-ID')}`;

// Kolom DAERAH kegiatan berisi satu atau lebih daerah, dipisah koma.
export const parseDaerahList = (value) => String(value || '').split(',').map(d => d.trim()).filter(Boolean);
