import { useState } from 'react';
import { useData } from '../hooks/useData';
import MasterTable from '../components/Features/MasterData/MasterTable';
import TambahPmModal from '../components/Features/MasterData/TambahPmModal';

export default function MasterDataPage() {
  const { masterData, updateMaster, loading, refreshData, refData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [filterDaerah, setFilterDaerah] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaster = (masterData || [])
    .filter(pm => filterDaerah === 'semua' || pm['DAERAH'] === filterDaerah)
    .filter(pm => {
      if (!searchTerm.trim()) return true;
      const nama = (pm['NAMA PM'] || '').toLowerCase();
      return nama.includes(searchTerm.toLowerCase());
    });

  const daerahList = ['semua', ...(refData.daerah || [])];

  const handleFilterChange = (e) => {
    setFilterDaerah(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Hanya tampilkan loading jika belum ada data sama sekali
  if (loading && (!masterData || masterData.length === 0)) {
    return <div className="text-center py-10">Memuat data master...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Data Penerima Manfaat</h1>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className="border rounded px-3 py-1 text-sm bg-white flex-1 min-w-[120px]" value={filterDaerah} onChange={handleFilterChange}>
          {daerahList.map(d => <option key={d} value={d}>{d === 'semua' ? 'Semua Daerah' : d}</option>)}
        </select>
        <input type="text" placeholder="Cari nama PM..." className="border rounded px-3 py-1 text-sm flex-1 min-w-[150px]" value={searchTerm} onChange={handleSearchChange} />
        <button onClick={() => setShowModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap">+ Tambah PM</button>
      </div>
      <MasterTable data={filteredMaster} onUpdate={updateMaster} currentPage={currentPage} onPageChange={setCurrentPage} />
      {showModal && <TambahPmModal onClose={() => setShowModal(false)} onSuccess={refreshData} />}
    </div>
  );
}