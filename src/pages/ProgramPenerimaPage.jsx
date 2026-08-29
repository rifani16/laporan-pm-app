import { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import Pagination from '../components/Common/Pagination';
import DetailSalurModal from '../components/Features/Penyaluran/DetailSalurModal';
import EditSalurModal from '../components/Features/Penyaluran/EditSalurModal';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import { useToast } from '../hooks/useToast';

export default function ProgramPenerimaPage() {
  const { salurData, masterData, refData, updateSalur, deleteSalur } = useData();
  const { showToast } = useToast();
  const [filterProgram, setFilterProgram] = useState('semua');
  const [filterDaerah, setFilterDaerah] = useState('semua');
  const [searchNama, setSearchNama] = useState(''); // State pencarian nama PM
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const rowsPerPage = 10;

  const masterById = useMemo(
    () => new Map(masterData.map(master => [master['ID PM'], master])),
    [masterData]
  );

  const enrichedSalur = useMemo(() => {
    return salurData.map(s => {
      const master = masterById.get(s['ID PM']);
      return {
        ...s,
        NAMA_PM_UTAMA: master ? master['NAMA PM'] : '',
        DAERAH: s['DAERAH'] || (master ? master['DAERAH'] : ''),
        ALAMAT: s['ALAMAT'] || (master ? master['ALAMAT'] : '')
      };
    });
  }, [salurData, masterById]);

  const filteredData = useMemo(() => {
    const normalizedSearch = searchNama.trim().toLowerCase();
    return enrichedSalur.filter(item => {
      const matchProgram = filterProgram === 'semua' || item['PROGRAM'] === filterProgram;
      const matchDaerah = filterDaerah === 'semua' || item['DAERAH'] === filterDaerah;
      const namaPenerima = String(item['NAMA PENERIMA'] || '');
      const matchNama = !normalizedSearch ||
        item.NAMA_PM_UTAMA.toLowerCase().includes(normalizedSearch) ||
        namaPenerima.toLowerCase().includes(normalizedSearch);
      return matchProgram && matchDaerah && matchNama;
    });
  }, [enrichedSalur, filterProgram, filterDaerah, searchNama]);

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

  const resetFilters = () => {
    setFilterProgram('semua');
    setFilterDaerah('semua');
    setSearchNama('');
    setCurrentPage(1);
  };

  const programList = ['semua', ...(refData.program || [])];
  const daerahList = ['semua', ...(refData.daerah || [])];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Penerima per Program</h1>
      <div className="flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow">
        <div className="flex-1 min-w-44">
          <label htmlFor="filter-program" className="block text-sm font-medium">Program</label>
          <select id="filter-program" className="min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm" value={filterProgram} onChange={e => handleFilterChange(setFilterProgram, e.target.value)}>
            {programList.map(p => <option key={p} value={p}>{p === 'semua' ? 'Semua Program' : p}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-44">
          <label htmlFor="filter-daerah" className="block text-sm font-medium">Daerah</label>
          <select id="filter-daerah" className="min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm" value={filterDaerah} onChange={e => handleFilterChange(setFilterDaerah, e.target.value)}>
            {daerahList.map(d => <option key={d} value={d}>{d === 'semua' ? 'Semua Daerah' : d}</option>)}
          </select>
        </div>
        <div className="flex-[1.25] min-w-52">
          <label htmlFor="filter-nama-pm" className="block text-sm font-medium">Cari Nama PM</label>
          <input
            id="filter-nama-pm"
            type="text"
            placeholder="Ketik nama PM..."
            className="min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm"
            value={searchNama}
            onChange={e => { setSearchNama(e.target.value); setCurrentPage(1); }}
          />
        </div>
        {(filterProgram !== 'semua' || filterDaerah !== 'semua' || searchNama) && (
          <button onClick={resetFilters} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Reset filter</button>
        )}
        <p className="w-full text-sm text-gray-600" aria-live="polite">
          Menampilkan {filteredData.length} dari {enrichedSalur.length} transaksi
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">No</th>
                <th className="p-2 text-left">Penerima Penyaluran</th>
                <th className="p-2 text-left">Daerah</th>
                <th className="p-2 text-left">Program</th>
                <th className="p-2 text-right">Jumlah Penerimaan</th>
                <th className="w-40 min-w-40 p-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, idx) => (
                <tr key={item['ID SALUR']} className="border-b">
                  <td className="p-2">{startIndex + idx + 1}</td>
                  <td className="p-2">
                    <p className="font-medium">{item['NAMA PENERIMA'] || item.NAMA_PM_UTAMA || '-'}</p>
                    {item['NAMA PENERIMA'] && item['NAMA PENERIMA'] !== item.NAMA_PM_UTAMA && (
                      <p className="text-xs text-gray-500">PM utama: {item.NAMA_PM_UTAMA || '-'}</p>
                    )}
                  </td>
                  <td className="p-2">{item.DAERAH || '-'}</td>
                  <td className="p-2">{item['PROGRAM']}</td>
                  <td className="p-2 text-right numeric">Rp {Number(item['JUMLAH PENERIMAAN'] || 0).toLocaleString('id-ID')}</td>
                  <td className="w-40 min-w-40 p-2 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <button onClick={() => setDetailItem(item)} className="whitespace-nowrap rounded-md bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Detail</button>
                      <button onClick={() => setEditItem(item)} className="whitespace-nowrap rounded-md bg-teal-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-teal-700">Edit</button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        disabled={deletingId === item['ID SALUR']}
                        className="whitespace-nowrap rounded-md bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === item['ID SALUR'] ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && <div className="p-4 text-center text-gray-500">Tidak ada data untuk filter ini.</div>}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
