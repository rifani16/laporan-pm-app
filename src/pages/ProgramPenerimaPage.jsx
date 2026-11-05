import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import Pagination from '../components/Common/Pagination';
import DetailSalurModal from '../components/Features/Penyaluran/DetailSalurModal';
import EditSalurModal from '../components/Features/Penyaluran/EditSalurModal';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import ExportExcelButton from '../components/Common/ExportExcelButton';
import DateRangeFilter from '../components/Common/DateRangeFilter';
import { formatTanggal, inDateRange, indexKegiatan } from '../services/kegiatan';

const EXPORT_COLUMNS = [
  { header: 'ID Salur', value: s => s['ID SALUR'], width: 16 },
  { header: 'Tanggal', value: s => s.TANGGAL, width: 12 },
  { header: 'ID Kegiatan', value: s => s['ID KEGIATAN'], width: 12 },
  { header: 'Kegiatan', value: s => s.NAMA_KEGIATAN, width: 30 },
  { header: 'ID PM', value: s => s['ID PM'], width: 16 },
  { header: 'Nama Penerima', value: s => s['NAMA PENERIMA'], width: 28 },
  { header: 'NIK Penerima', value: s => s['NIK PENERIMA'], width: 20 },
  { header: 'Nama PM Utama', value: s => s.NAMA_PM_UTAMA, width: 28 },
  { header: 'Daerah', value: s => s.DAERAH, width: 18 },
  { header: 'Alamat', value: s => s.ALAMAT, width: 36 },
  { header: 'Program', value: s => s['PROGRAM'], width: 22 },
  { header: 'Bentuk Penerimaan', value: s => s['BENTUK PENERIMAAN'], width: 18 },
  { header: 'Jumlah Penerimaan (Rp)', value: s => s['JUMLAH PENERIMAAN'], number: true, width: 20 },
  { header: 'Keterangan', value: s => s['KETERANGAN'], width: 30 },
  { header: 'Diinput Oleh', value: s => s['DIINPUT OLEH'], width: 14 },
  { header: 'Diinput Pada', value: s => s['DIINPUT PADA'], width: 17 },
  { header: 'Diubah Oleh', value: s => s['DIUBAH OLEH'], width: 14 },
  { header: 'Diubah Pada', value: s => s['DIUBAH PADA'], width: 17 }
];

export default function ProgramPenerimaPage() {
  const { salurData, masterData, refData, kegiatanList, updateSalur, deleteSalur } = useData();
  const [searchParams] = useSearchParams();
  const { isSuperAdmin, seesAllDaerah, userDaerah } = useAuth();
  const { showToast } = useToast();
  const [filterProgram, setFilterProgram] = useState('semua');
  const [filterDaerah, setFilterDaerah] = useState('semua');
  const [filterKegiatan, setFilterKegiatan] = useState(() => searchParams.get('kegiatan') || 'semua');
  const [periode, setPeriode] = useState({ dari: '', sampai: '' });
  const [searchNama, setSearchNama] = useState('');
  const [displayMode, setDisplayMode] = useState('penerima'); // 'penerima' | 'pm_utama'
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const activeFilterDaerah = !seesAllDaerah && userDaerah ? userDaerah : filterDaerah;

  const masterById = useMemo(
    () => new Map(masterData.map(master => [master['ID PM'], master])),
    [masterData]
  );

  const kegiatanById = useMemo(() => indexKegiatan(kegiatanList), [kegiatanList]);

  const enrichedSalur = useMemo(() => {
    return salurData.map(s => {
      const master = masterById.get(s['ID PM']);
      const kegiatan = kegiatanById.get(String(s['ID KEGIATAN'] || ''));
      return {
        ...s,
        NAMA_KEGIATAN: kegiatan ? kegiatan['NAMA KEGIATAN'] : '',
        TANGGAL: kegiatan ? kegiatan.TANGGAL : '',
        NAMA_PM_UTAMA: master ? master['NAMA PM'] : '',
        DAERAH: s['DAERAH'] || (master ? master['DAERAH'] : ''),
        ALAMAT: s['ALAMAT'] || (master ? master['ALAMAT'] : '')
      };
    });
  }, [salurData, masterById, kegiatanById]);

  const filteredData = useMemo(() => {
    const normalizedSearch = searchNama.trim().toLowerCase();
    return enrichedSalur.filter(item => {
      const matchProgram = filterProgram === 'semua' || item['PROGRAM'] === filterProgram;
      const matchKegiatan = filterKegiatan === 'semua'
        || (filterKegiatan === 'tanpa' ? !item['ID KEGIATAN'] : String(item['ID KEGIATAN']) === filterKegiatan);
      const matchTanggal = inDateRange(item.TANGGAL, periode.dari, periode.sampai);
      const matchDaerah = activeFilterDaerah === 'semua' || item['DAERAH'] === activeFilterDaerah;
      const namaPenerima = String(item['NAMA PENERIMA'] || '');
      const matchNama = !normalizedSearch ||
        item.NAMA_PM_UTAMA.toLowerCase().includes(normalizedSearch) ||
        namaPenerima.toLowerCase().includes(normalizedSearch);
      return matchProgram && matchKegiatan && matchTanggal && matchDaerah && matchNama;
    });
  }, [enrichedSalur, filterProgram, filterKegiatan, periode, activeFilterDaerah, searchNama]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const idSalur = deleteTarget['ID SALUR'];
    setDeletingId(idSalur);
    try {
      const result = await deleteSalur(idSalur);
      if (result?.success) {
        showToast('Data penyaluran berhasil dihapus', 'success');
        setDeleteTarget(null);
        if (paginatedData.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
      } else {
        showToast('Gagal menghapus penyaluran: ' + (result?.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const hasPeriode = Boolean(periode.dari || periode.sampai);
  const hasActiveFilter = filterProgram !== 'semua' || filterKegiatan !== 'semua' || hasPeriode
    || (seesAllDaerah && activeFilterDaerah !== 'semua') || Boolean(searchNama);

  const resetFilters = () => {
    setFilterProgram('semua');
    setFilterKegiatan('semua');
    setPeriode({ dari: '', sampai: '' });
    setFilterDaerah('semua');
    setSearchNama('');
    setDisplayMode('penerima');
    setCurrentPage(1);
  };

  const programList = ['semua', ...(refData.program || [])];
  const daerahList = seesAllDaerah
    ? ['semua', ...(refData.daerah || [])]
    : [userDaerah || 'semua'];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Penerima per Program</h1>

      <div className="flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow">
        <div className="flex-1 min-w-40">
          <label htmlFor="filter-program" className="mb-1.5 block text-sm font-medium">Program</label>
          <select id="filter-program" className="min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm" value={filterProgram} onChange={e => handleFilterChange(setFilterProgram, e.target.value)}>
            {programList.map(p => <option key={p} value={p}>{p === 'semua' ? 'Semua Program' : p}</option>)}
          </select>
        </div>
        <div className="flex-[1.25] min-w-48">
          <label htmlFor="filter-kegiatan" className="mb-1.5 block text-sm font-medium">Kegiatan</label>
          <select id="filter-kegiatan" className="min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm" value={filterKegiatan} onChange={e => handleFilterChange(setFilterKegiatan, e.target.value)}>
            <option value="semua">Semua Kegiatan</option>
            <option value="tanpa">Tanpa kegiatan (data lama)</option>
            {[...kegiatanList]
              .sort((a, b) => String(b.TANGGAL).localeCompare(String(a.TANGGAL)))
              .map(k => <option key={k['ID KEGIATAN']} value={k['ID KEGIATAN']}>{formatTanggal(k.TANGGAL)} · {k['NAMA KEGIATAN']}</option>)}
          </select>
        </div>
        <DateRangeFilter dari={periode.dari} sampai={periode.sampai} onChange={value => handleFilterChange(setPeriode, value)} />
        <div className="flex-1 min-w-40">
          <label htmlFor="filter-daerah" className="mb-1.5 block text-sm font-medium">Daerah</label>
          <select
            id="filter-daerah"
            className="min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-600"
            value={activeFilterDaerah}
            onChange={e => handleFilterChange(setFilterDaerah, e.target.value)}
            disabled={!seesAllDaerah}
          >
            {daerahList.map(d => <option key={d} value={d}>{d === 'semua' ? 'Semua Daerah' : d}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-44">
          <label htmlFor="filter-tampilan-nama" className="mb-1.5 block text-sm font-medium">Tampilkan Nama</label>
          <select
            id="filter-tampilan-nama"
            className="min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm"
            value={displayMode}
            onChange={e => setDisplayMode(e.target.value)}
          >
            <option value="penerima">Nama Penerima</option>
            <option value="pm_utama">Nama PM Utama</option>
          </select>
        </div>
        <div className="flex-[1.25] min-w-48">
          <label htmlFor="filter-nama-pm" className="mb-1.5 block text-sm font-medium">Cari Nama PM</label>
          <input
            id="filter-nama-pm"
            type="text"
            placeholder="Ketik nama PM..."
            className="min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm"
            value={searchNama}
            onChange={e => { setSearchNama(e.target.value); setCurrentPage(1); }}
          />
        </div>
        {(hasActiveFilter || displayMode !== 'penerima') && (
          <button onClick={resetFilters} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Reset filter</button>
        )}
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600" aria-live="polite">
            Menampilkan {filteredData.length} dari {enrichedSalur.length} transaksi
            {hasPeriode && '. Transaksi tanpa kegiatan tidak ikut saat filter tanggal dipakai.'}
          </p>
          <ExportExcelButton
            fileName={filterProgram === 'semua' ? 'penyaluran' : `penyaluran-${filterProgram}`}
            rows={filteredData}
            columns={EXPORT_COLUMNS}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">No</th>
                <th className="p-2 text-left">
                  {displayMode === 'pm_utama' ? 'Nama PM Utama' : 'Penerima Penyaluran'}
                </th>
                <th className="p-2 text-left">Kegiatan</th>
                <th className="p-2 text-left">Daerah</th>
                <th className="p-2 text-left">Program</th>
                <th className="p-2 text-right">Jumlah Penerimaan</th>
                <th className={`p-2 text-center ${isSuperAdmin ? 'w-48 min-w-48' : 'w-32 min-w-32'}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, idx) => {
                const isPmUtamaMode = displayMode === 'pm_utama';
                const mainName = isPmUtamaMode
                  ? (item.NAMA_PM_UTAMA || item['NAMA PENERIMA'] || '-')
                  : (item['NAMA PENERIMA'] || item.NAMA_PM_UTAMA || '-');

                const subName = isPmUtamaMode
                  ? (item['NAMA PENERIMA'] && item['NAMA PENERIMA'] !== item.NAMA_PM_UTAMA ? `Penerima: ${item['NAMA PENERIMA']}` : null)
                  : (item.NAMA_PM_UTAMA && item.NAMA_PM_UTAMA !== item['NAMA PENERIMA'] ? `PM utama: ${item.NAMA_PM_UTAMA}` : null);

                return (
                  <tr key={item['ID SALUR']} className="border-b">
                    <td className="p-2">{startIndex + idx + 1}</td>
                    <td className="p-2">
                      <p className="font-medium">{mainName}</p>
                      {subName && (
                        <p className="text-xs text-gray-500">{subName}</p>
                      )}
                    </td>
                    <td className="p-2">
                      {item.NAMA_KEGIATAN ? (
                        <>
                          <p>{item.NAMA_KEGIATAN}</p>
                          <p className="text-xs text-gray-500">{formatTanggal(item.TANGGAL)}</p>
                        </>
                      ) : <span className="text-gray-500">Tanpa kegiatan</span>}
                    </td>
                    <td className="p-2">{item.DAERAH || '-'}</td>
                    <td className="p-2">{item['PROGRAM']}</td>
                    <td className="p-2 text-right numeric">Rp {Number(item['JUMLAH PENERIMAAN'] || 0).toLocaleString('id-ID')}</td>
                    <td className={`p-2 text-right ${isSuperAdmin ? 'w-48 min-w-48' : 'w-32 min-w-32'}`}>
                      <div className="flex flex-wrap justify-end gap-1">
                        <button onClick={() => setDetailItem(item)} className="min-h-11 whitespace-nowrap rounded-lg px-2 font-medium text-gray-700 hover:bg-gray-100">Detail</button>
                        {isSuperAdmin && (
                          <button onClick={() => setEditItem(item)} className="min-h-11 whitespace-nowrap rounded-lg px-2 font-medium text-teal-700 hover:bg-teal-50">Edit</button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            disabled={deletingId === item['ID SALUR']}
                            className="min-h-11 whitespace-nowrap rounded-lg px-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === item['ID SALUR'] ? 'Menghapus...' : 'Hapus'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="p-4 text-center text-gray-600">
              {hasActiveFilter ? (
                <>
                  Tidak ada penyaluran yang cocok dengan filter.{' '}
                  <button onClick={resetFilters} className="font-medium text-teal-700 underline hover:text-teal-800">Reset filter</button>
                </>
              ) : (
                <>
                  Belum ada penyaluran tercatat.{' '}
                  {isSuperAdmin && <Link to="/salur" className="font-medium text-teal-700 underline hover:text-teal-800">Input penyaluran</Link>}
                </>
              )}
            </div>
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </div>

      {detailItem && <DetailSalurModal data={detailItem} masterData={masterData} onClose={() => setDetailItem(null)} />}
      {editItem && <EditSalurModal data={editItem} onClose={() => setEditItem(null)} onSave={updateSalur} />}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={deleteTarget ? `Hapus penyaluran untuk “${deleteTarget['NAMA PENERIMA'] || deleteTarget.NAMA_PM_UTAMA || '-'}”?` : ''}
        detail={deleteTarget ? `Program: ${deleteTarget['PROGRAM'] || '-'} · ID: ${deleteTarget['ID SALUR']}` : ''}
        loading={Boolean(deletingId)}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
