import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Dialog from '../components/Common/Dialog';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import DateRangeFilter from '../components/Common/DateRangeFilter';
import ExportExcelButton from '../components/Common/ExportExcelButton';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { KEGIATAN_STATUS, formatRupiah, formatTanggal, inDateRange } from '../services/kegiatan';

const inputClass = 'mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100 disabled:text-gray-600';
const STATUS_STYLES = {
  Rencana: 'bg-gray-100 text-gray-700',
  Berjalan: 'bg-amber-50 text-amber-800',
  Selesai: 'bg-green-50 text-green-800'
};

const persen = (k) => (Number(k.ANGGARAN) > 0 ? `${Math.round((Number(k.REALISASI) / Number(k.ANGGARAN)) * 100)}%` : '-');

const EXPORT_COLUMNS = [
  { header: 'ID Kegiatan', value: k => k['ID KEGIATAN'], width: 12 },
  { header: 'Tanggal', value: k => k.TANGGAL, width: 12 },
  { header: 'Nama Kegiatan', value: k => k['NAMA KEGIATAN'], width: 32 },
  { header: 'Program', value: k => k.PROGRAM, width: 20 },
  { header: 'Lokasi', value: k => k.LOKASI, width: 24 },
  { header: 'Sumber Dana', value: k => k['SUMBER DANA'], width: 18 },
  { header: 'Anggaran (Rp)', value: k => k.ANGGARAN, number: true, width: 18 },
  { header: 'Realisasi (Rp)', value: k => k.REALISASI, number: true, width: 18 },
  { header: 'Realisasi (%)', value: persen, width: 12 },
  { header: 'Jumlah Penerima', value: k => k['JUMLAH PENERIMA'], number: true, width: 14 },
  { header: 'Penanggung Jawab', value: k => k['PENANGGUNG JAWAB'], width: 22 },
  { header: 'Status', value: k => k.STATUS, width: 12 },
  { header: 'Keterangan', value: k => k.KETERANGAN, width: 30 }
];

function KegiatanFormDialog({ kegiatan, programOptions, sumberDanaOptions, saving, onSubmit, onClose }) {
  const isNew = !kegiatan;
  const hasTransactions = Number(kegiatan?.['JUMLAH PENERIMA']) > 0;
  const [form, setForm] = useState({
    'ID KEGIATAN': kegiatan?.['ID KEGIATAN'] || '',
    'NAMA KEGIATAN': kegiatan?.['NAMA KEGIATAN'] || '',
    PROGRAM: kegiatan?.PROGRAM || '',
    TANGGAL: kegiatan?.TANGGAL || '',
    LOKASI: kegiatan?.LOKASI || '',
    'SUMBER DANA': kegiatan?.['SUMBER DANA'] || '',
    ANGGARAN: kegiatan?.ANGGARAN ?? '',
    'PENANGGUNG JAWAB': kegiatan?.['PENANGGUNG JAWAB'] || '',
    STATUS: kegiatan?.STATUS || 'Rencana',
    KETERANGAN: kegiatan?.KETERANGAN || ''
  });
  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const field = (label, name, props = {}) => (
    <label className="block text-sm font-medium text-gray-800">
      {label}
      <input value={form[name]} onChange={change(name)} disabled={saving} className={inputClass} {...props} />
    </label>
  );

  return (
    <Dialog title={isNew ? 'Tambah Kegiatan' : 'Edit Kegiatan'} onClose={onClose} closeDisabled={saving} maxWidth="max-w-xl">
      <form onSubmit={event => { event.preventDefault(); onSubmit(form); }} className="space-y-4">
        {field('Nama kegiatan', 'NAMA KEGIATAN', { required: true, maxLength: 150, 'data-autofocus': true })}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-800">
            Program
            <select value={form.PROGRAM} onChange={change('PROGRAM')} disabled={saving || hasTransactions} required className={inputClass}>
              <option value="">Pilih program</option>
              {programOptions.map(program => <option key={program} value={program}>{program}</option>)}
            </select>
            {hasTransactions && <span className="mt-1 block text-xs font-normal text-gray-600">Tidak bisa diganti karena sudah ada transaksi.</span>}
          </label>
          {field('Tanggal penyaluran', 'TANGGAL', { type: 'date', required: true })}
          {field('Lokasi', 'LOKASI', { maxLength: 150 })}
          <label className="block text-sm font-medium text-gray-800">
            Sumber dana
            <input value={form['SUMBER DANA']} onChange={change('SUMBER DANA')} disabled={saving} list="sumber-dana-options" maxLength={100} placeholder="Contoh: Zakat" className={inputClass} />
            <datalist id="sumber-dana-options">
              {sumberDanaOptions.map(option => <option key={option} value={option} />)}
            </datalist>
          </label>
          {field('Anggaran (Rp)', 'ANGGARAN', { type: 'number', min: 0, step: 1, inputMode: 'numeric' })}
          {field('Penanggung jawab', 'PENANGGUNG JAWAB', { maxLength: 100 })}
          <label className="block text-sm font-medium text-gray-800">
            Status
            <select value={form.STATUS} onChange={change('STATUS')} disabled={saving} className={inputClass}>
              {KEGIATAN_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <span className="mt-1 block text-xs font-normal text-gray-600">Kegiatan Selesai tidak bisa menerima transaksi baru.</span>
          </label>
        </div>
        <label className="block text-sm font-medium text-gray-800">
          Keterangan
          <textarea value={form.KETERANGAN} onChange={change('KETERANGAN')} disabled={saving} rows={2} maxLength={500} className={inputClass} />
        </label>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Batal</button>
          <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50">
            {saving ? 'Menyimpan...' : isNew ? 'Tambah Kegiatan' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export default function KegiatanPage() {
  const { kegiatanList, refData, loading, createKegiatan, updateKegiatan, deleteKegiatan } = useData();
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterProgram, setFilterProgram] = useState('semua');
  const [periode, setPeriode] = useState({ dari: '', sampai: '' });
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => kegiatanList
    .filter(k => filterStatus === 'semua' || k.STATUS === filterStatus)
    .filter(k => filterProgram === 'semua' || k.PROGRAM === filterProgram)
    .filter(k => inDateRange(k.TANGGAL, periode.dari, periode.sampai))
    .sort((a, b) => String(b.TANGGAL).localeCompare(String(a.TANGGAL))),
  [kegiatanList, filterStatus, filterProgram, periode]);

  const sumberDanaOptions = useMemo(
    () => [...new Set(kegiatanList.map(k => k['SUMBER DANA']).filter(Boolean))],
    [kegiatanList]
  );

  const save = async (request) => {
    setSaving(true);
    try {
      const result = await request();
      if (!result.success) throw new Error(result.error || 'Permintaan gagal');
      showToast(result.message || 'Berhasil disimpan');
      setEditing(null);
      setDeleteTarget(null);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (form) => save(() => (editing.kegiatan ? updateKegiatan(form) : createKegiatan(form)));
  const hasFilter = filterStatus !== 'semua' || filterProgram !== 'semua' || periode.dari || periode.sampai;
  const resetFilters = () => {
    setFilterStatus('semua');
    setFilterProgram('semua');
    setPeriode({ dari: '', sampai: '' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kegiatan Penyaluran</h1>
          <p className="mt-1 text-sm text-gray-600">Setiap transaksi penyaluran dicatat di bawah satu kegiatan.</p>
        </div>
        {isSuperAdmin && (
          <button type="button" onClick={() => setEditing({ kegiatan: null })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700">
            <Plus size={18} aria-hidden="true" />
            Tambah Kegiatan
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow">
        <div className="min-w-36 flex-1">
          <label htmlFor="filter-status-kegiatan" className="block text-sm font-medium">Status</label>
          <select id="filter-status-kegiatan" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm">
            <option value="semua">Semua Status</option>
            {KEGIATAN_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <div className="min-w-40 flex-1">
          <label htmlFor="filter-program-kegiatan" className="block text-sm font-medium">Program</label>
          <select id="filter-program-kegiatan" value={filterProgram} onChange={e => setFilterProgram(e.target.value)} className="min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm">
            <option value="semua">Semua Program</option>
            {refData.program.map(program => <option key={program} value={program}>{program}</option>)}
          </select>
        </div>
        <DateRangeFilter dari={periode.dari} sampai={periode.sampai} onChange={setPeriode} />
        {hasFilter && (
          <button type="button" onClick={resetFilters} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Reset filter</button>
        )}
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600" aria-live="polite">Menampilkan {filtered.length} dari {kegiatanList.length} kegiatan</p>
          <ExportExcelButton fileName="kegiatan-penyaluran" rows={filtered} columns={EXPORT_COLUMNS} />
        </div>
      </div>

      <section className="rounded-xl bg-white shadow-sm" aria-label="Daftar kegiatan">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 text-left font-semibold">Tanggal</th>
                <th className="p-3 text-left font-semibold">Kegiatan</th>
                <th className="p-3 text-left font-semibold">Program</th>
                <th className="p-3 text-left font-semibold">Sumber Dana</th>
                <th className="p-3 text-right font-semibold">Anggaran</th>
                <th className="p-3 text-right font-semibold">Realisasi</th>
                <th className="p-3 text-right font-semibold">Penerima</th>
                <th className="p-3 text-left font-semibold">Status</th>
                <th className="p-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(k => (
                <tr key={k['ID KEGIATAN']} className="border-t border-gray-100 align-top">
                  <td className="whitespace-nowrap p-3">{formatTanggal(k.TANGGAL)}</td>
                  <td className="p-3">
                    <p className="font-medium text-gray-900">{k['NAMA KEGIATAN']}</p>
                    <p className="text-xs text-gray-500">{[k.LOKASI, k['PENANGGUNG JAWAB'] && `PJ: ${k['PENANGGUNG JAWAB']}`].filter(Boolean).join(' · ') || k['ID KEGIATAN']}</p>
                  </td>
                  <td className="p-3">{k.PROGRAM}</td>
                  <td className="p-3">{k['SUMBER DANA'] || '-'}</td>
                  <td className="numeric whitespace-nowrap p-3 text-right">{k.ANGGARAN === '' ? '-' : formatRupiah(k.ANGGARAN)}</td>
                  <td className="numeric whitespace-nowrap p-3 text-right">
                    {formatRupiah(k.REALISASI)}
                    <span className="block text-xs text-gray-500">{persen(k)}</span>
                  </td>
                  <td className="numeric p-3 text-right">{Number(k['JUMLAH PENERIMA']).toLocaleString('id-ID')}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[k.STATUS] || STATUS_STYLES.Rencana}`}>{k.STATUS}</span>
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1">
                      <Link to={`/program-penerima?kegiatan=${encodeURIComponent(k['ID KEGIATAN'])}`} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-2 font-medium text-gray-700 hover:bg-gray-100">Penerima</Link>
                      {isSuperAdmin && (
                        <>
                          <button type="button" onClick={() => setEditing({ kegiatan: k })} className="min-h-11 whitespace-nowrap rounded-lg px-2 font-medium text-teal-700 hover:bg-teal-50">Edit</button>
                          <button
                            type="button"
                            onClick={() => (Number(k['JUMLAH PENERIMA']) > 0 ? showToast('Kegiatan yang sudah punya transaksi tidak bisa dihapus', 'error') : setDeleteTarget(k))}
                            className="min-h-11 whitespace-nowrap rounded-lg px-2 font-medium text-red-700 hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-600">
            {kegiatanList.length === 0
              ? (isSuperAdmin ? 'Belum ada kegiatan. Tambahkan lewat tombol "Tambah Kegiatan" di atas.' : 'Belum ada kegiatan penyaluran.')
              : 'Tidak ada kegiatan yang cocok dengan filter.'}
          </p>
        )}
        {loading && kegiatanList.length === 0 && <p className="p-8 text-center text-sm text-gray-500">Memuat kegiatan...</p>}
      </section>

      {editing && (
        <KegiatanFormDialog
          kegiatan={editing.kegiatan}
          programOptions={refData.program}
          sumberDanaOptions={sumberDanaOptions}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Kegiatan"
        message={deleteTarget ? `Hapus kegiatan “${deleteTarget['NAMA KEGIATAN']}”?` : ''}
        detail={deleteTarget ? `${formatTanggal(deleteTarget.TANGGAL)} · ${deleteTarget.PROGRAM}` : ''}
        loading={saving}
        onConfirm={() => save(() => deleteKegiatan(deleteTarget['ID KEGIATAN']))}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
