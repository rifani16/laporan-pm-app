import { useId } from 'react';
import { formatTanggal, isOpenKegiatan } from '../../../services/kegiatan';

// Hanya kegiatan yang belum Selesai bisa dipilih; kegiatan transaksi saat ini tetap tampil walau Selesai.
export default function KegiatanSelect({ kegiatanList, value, onChange, allowNone = false }) {
  const id = useId();
  const options = kegiatanList
    .filter(k => isOpenKegiatan(k) || String(k['ID KEGIATAN']) === value)
    .sort((a, b) => String(b.TANGGAL).localeCompare(String(a.TANGGAL)));
  const selected = kegiatanList.find(k => String(k['ID KEGIATAN']) === value);

  if (options.length === 0 && !allowNone) {
    return (
      <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Belum ada kegiatan berjalan. Buat kegiatan dulu di menu Kegiatan Penyaluran.
      </p>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">Kegiatan penyaluran</label>
      <select id={id} className="min-h-11 w-full rounded-lg border bg-white p-2" value={value} onChange={e => onChange(e.target.value)} required={!allowNone}>
        <option value="">{allowNone ? 'Tanpa kegiatan (data lama)' : 'Pilih kegiatan'}</option>
        {options.map(k => (
          <option key={k['ID KEGIATAN']} value={k['ID KEGIATAN']}>
            {formatTanggal(k.TANGGAL)} · {k['NAMA KEGIATAN']}{k.STATUS === 'Selesai' ? ' (Selesai)' : ''}
          </option>
        ))}
      </select>
      {selected && (
        <p className="mt-1 text-sm text-gray-600">
          Program: <span className="font-medium text-gray-800">{selected.PROGRAM}</span>
          {selected.DAERAH && <> · Daerah: {selected.DAERAH}</>}
        </p>
      )}
    </div>
  );
}
