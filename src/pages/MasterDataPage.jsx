import { useState } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import MasterTable from '../components/Features/MasterData/MasterTable';
import TambahPmModal from '../components/Features/MasterData/TambahPmModal';

export default function MasterDataPage() {
  const { masterData, updateMaster, deleteMaster, loading, refData } = useData();
  const { isSuperAdmin, userDaerah } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [filterDaerah, setFilterDaerah] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const activeFilterDaerah = !isSuperAdmin && userDaerah ? userDaerah : filterDaerah;

  const filteredMaster = (masterData || [])
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

  const resetFilters = () => {
    setFilterDaerah('semua');
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (loading && (!masterData || masterData.length === 0)) {
    return <div className="text-center py-10">Memuat data master...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold">Data Penerima Manfaat</h1>
        {!isSuperAdmin && userDaerah && (
          <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full font-medium w-fit">
            Wilayah: {userDaerah}
          </span>
        )}
      </div>

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
        {((isSuperAdmin && activeFilterDaerah !== 'semua') || searchTerm) && (
          <button
            onClick={resetFilters}
            className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Reset filter
          </button>
        )}
        <button
          onClick={() => setShowModal(true)}
          className="min-h-11 whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 active:scale-[0.98]"
        >
          + Tambah PM
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-600" aria-live="polite">
        Menampilkan {filteredMaster.length} PM
      </p>
      <MasterTable
        data={filteredMaster}
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
