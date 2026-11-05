import { useState } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import MasterTable from '../components/Features/MasterData/MasterTable';
import TambahPmModal from '../components/Features/MasterData/TambahPmModal';
import ExportExcelButton from '../components/Common/ExportExcelButton';

const EXPORT_COLUMNS = [
  { header: 'ID PM', value: pm => pm['ID PM'], width: 16 },
  { header: 'Nama PM', value: pm => pm['NAMA PM'], width: 28 },
  { header: 'NIK', value: pm => pm['NIK'], width: 20 },
  { header: 'Nama PM Alt', value: pm => pm['NAMA PM ALT'], width: 24 },
  { header: 'NIK Alt', value: pm => pm['NIK ALT'], width: 20 },
  { header: 'No KK', value: pm => pm['NO KK'], width: 20 },
  { header: 'No HP', value: pm => pm['NO HP'], width: 16 },
  { header: 'Alamat', value: pm => pm['ALAMAT'], width: 36 },
  { header: 'Daerah', value: pm => pm['DAERAH'], width: 18 },
  { header: 'Asnaf', value: pm => pm['ASNAF'], width: 14 },
  { header: 'Pekerjaan', value: pm => pm['PEKERJAAN'], width: 18 },
  { header: 'Program Diterima', value: pm => (pm['PENERIMAAN PROGRAM'] === '-' ? '' : pm['PENERIMAAN PROGRAM']), width: 30 },
  { header: 'Total Penerimaan (Rp)', value: pm => pm['TOTAL PENERIMAAN'], number: true, width: 20 },
  { header: 'Catatan', value: pm => pm['CATATAN'], width: 30 }
];

export default function MasterDataPage() {
  const { masterData, updateMaster, deleteMaster, loading, refData } = useData();
  const { isSuperAdmin, userDaerah } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [filterDaerah, setFilterDaerah] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const activeFilterDaerah = !isSuperAdmin && userDaerah ? userDaerah : filterDaerah;

  const filteredMaster = masterData
    .filter(pm => activeFilterDaerah === 'semua' || pm['DAERAH'] === activeFilterDaerah)
    .filter(pm => {
      if (!searchTerm.trim()) return true;
      const nama = (pm['NAMA PM'] || '').toLowerCase();
      return nama.includes(searchTerm.toLowerCase());
    });

  const daerahList = isSuperAdmin
    ? ['semua', ...(refData.daerah || [])]
    : [userDaerah || 'semua'];

  const handleFilterChange = (e) => {
    setFilterDaerah(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const hasActiveFilter = (isSuperAdmin && activeFilterDaerah !== 'semua') || Boolean(searchTerm);

  const resetFilters = () => {
    setFilterDaerah('semua');
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (loading && masterData.length === 0) {
    return <div className="text-center py-10">Memuat data master...</div>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Data Penerima Manfaat</h1>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter daerah"
          className="min-h-11 flex-1 min-w-[140px] rounded-lg border bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-600"
          value={activeFilterDaerah}
          onChange={handleFilterChange}
          disabled={!isSuperAdmin}
        >
          {daerahList.map(d => (
            <option key={d} value={d}>
              {d === 'semua' ? 'Semua Daerah' : d}
            </option>
          ))}
        </select>
        <input
          aria-label="Cari nama PM"
          type="search"
          placeholder="Cari nama PM..."
          className="min-h-11 flex-1 min-w-[180px] rounded-lg border bg-white px-3 py-2 text-sm"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {hasActiveFilter && (
          <button
            onClick={resetFilters}
            className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Reset filter
          </button>
        )}
        <ExportExcelButton fileName="daftar-pm" rows={filteredMaster} columns={EXPORT_COLUMNS} />
        <button
          onClick={() => setShowModal(true)}
          className="min-h-11 whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          + Tambah PM
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-600" aria-live="polite">
        Menampilkan {filteredMaster.length} PM
      </p>
      <MasterTable
        data={filteredMaster}
        emptyState={hasActiveFilter ? (
          <>
            Tidak ada PM yang cocok dengan pencarian atau filter.{' '}
            <button onClick={resetFilters} className="font-medium text-teal-700 underline hover:text-teal-800">Reset filter</button>
          </>
        ) : (
          'Belum ada data PM. Tambahkan lewat tombol "+ Tambah PM" di atas.'
        )}
        onUpdate={updateMaster}
        onDelete={deleteMaster}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
      />
      {showModal && <TambahPmModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
