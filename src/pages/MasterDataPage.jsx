import { useState } from 'react';
import { useData } from '../hooks/useData';
import MasterTable from '../components/Features/MasterData/MasterTable';
import TambahPmModal from '../components/Features/MasterData/TambahPmModal';

export default function MasterDataPage() {
  const { masterData, updateMaster, loading, refreshData, refData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [filterDaerah, setFilterDaerah] = useState('semua');

  // Filter data master berdasarkan daerah (case-sensitive, tapi pastikan nilai 'semua' menampilkan semua)
  const filteredMaster = filterDaerah === 'semua'
    ? masterData
    : masterData.filter(pm => pm['DAERAH'] === filterDaerah);

  const daerahList = ['semua', ...(refData.daerah || [])];

  if (loading) return <div className="text-center py-10">Memuat data master...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Data Penerima Manfaat</h1>
        <div className="flex gap-2">
          <select
            className="border rounded px-3 py-1 text-sm bg-white"
            value={filterDaerah}
            onChange={e => setFilterDaerah(e.target.value)}
          >
            {daerahList.map(d => (
              <option key={d} value={d}>
                {d === 'semua' ? 'Semua Daerah' : d}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
          >
            + Tambah PM
          </button>
        </div>
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