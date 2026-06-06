import { useState } from 'react';
import { useData } from '../hooks/useData';
import MasterTable from '../components/Features/MasterData/MasterTable';
import TambahPmModal from '../components/Features/MasterData/TambahPmModal';

export default function MasterDataPage() {
  const { masterData, updateMaster, loading, refreshData, refData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [filterDaerah, setFilterDaerah] = useState('semua');

  const filteredMaster = filterDaerah === 'semua'
    ? masterData
    : masterData.filter(pm => pm['DAERAH'] === filterDaerah);

  const daerahList = ['semua', ...(refData.daerah || [])];

  if (loading) return <div className="text-center py-10">Memuat data master...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Data Penerima Manfaat</h1>
      
      {/* Filter dan tombol dalam satu baris responsif */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <select
          className="border rounded px-3 py-1 text-sm bg-white flex-1 min-w-[120px]"
          value={filterDaerah}
          onChange={e => setFilterDaerah(e.target.value)}
        >
          {daerahList.map(d => (
            <option key={d} value={d}>{d === 'semua' ? 'Semua Daerah' : d}</option>
          ))}
        </select>
        <button
          onClick={() => setShowModal(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 text-sm whitespace-nowrap"
        >
          + Tambah PM
        </button>
      </div>
      
      <MasterTable data={filteredMaster} onUpdate={updateMaster} />
      {showModal && (
        <TambahPmModal
          onClose={() => setShowModal(false)}
          onSuccess={refreshData}
        />
      )}
    </div>
  );
}