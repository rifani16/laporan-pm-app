import { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import Pagination from '../components/Common/Pagination';
import DetailSalurModal from '../components/Features/Penyaluran/DetailSalurModal';
import EditSalurModal from '../components/Features/Penyaluran/EditSalurModal';

export default function ProgramPenerimaPage() {
  const { salurData, masterData, refData, updateSalur } = useData();
  const [filterProgram, setFilterProgram] = useState('semua');
  const [filterDaerah, setFilterDaerah] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const rowsPerPage = 10;

  const enrichedSalur = useMemo(() => {
    return salurData.map(s => {
      const master = masterData.find(m => m['ID PM'] === s['ID PM']);
      return {
        ...s, // ini sudah menyertakan JUMLAH_PENERIMAAN
        'NAMA PM': master ? master['NAMA PM'] : s['NAMA PM'],
        'DAERAH': s['DAERAH'] || (master ? master['DAERAH'] : ''),
        'ALAMAT': s['ALAMAT'] || (master ? master['ALAMAT'] : ''),
        'NIK': s['NIK'] || (master ? master['NIK'] : '')
      };
    });
  }, [salurData, masterData]);

  const filteredData = useMemo(() => {
    return enrichedSalur.filter(item => {
      const matchProgram = filterProgram === 'semua' || item['PROGRAM'] === filterProgram;
      const matchDaerah = filterDaerah === 'semua' || item['DAERAH'] === filterDaerah;
      return matchProgram && matchDaerah;
    });
  }, [enrichedSalur, filterProgram, filterDaerah]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const programList = ['semua', ...(refData.program || [])];
  const daerahList = ['semua', ...(refData.daerah || [])];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Penerima per Program</h1>
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium">Program</label>
          <select
            className="border rounded px-3 py-1 text-sm w-48 bg-white"
            value={filterProgram}
            onChange={e => handleFilterChange(setFilterProgram, e.target.value)}
          >
            {programList.map(p => <option key={p} value={p}>{p === 'semua' ? 'Semua Program' : p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Daerah</label>
          <select
            className="border rounded px-3 py-1 text-sm w-48 bg-white"
            value={filterDaerah}
            onChange={e => handleFilterChange(setFilterDaerah, e.target.value)}
          >
            {daerahList.map(d => <option key={d} value={d}>{d === 'semua' ? 'Semua Daerah' : d}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">No</th>
                <th className="p-2 text-left">Nama Penerima</th>
                <th className="p-2 text-left">Daerah</th>
                <th className="p-2 text-left">Program</th>
                <th className="p-2 text-left">Jumlah Penerimaan</th>
                <th className="p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, idx) => (
                <tr key={item['ID SALUR']} className="border-b">
                  <td className="p-2">{startIndex + idx + 1}</td>
                  <td className="p-2 font-medium">{item['NAMA PM']}</td>
                  <td className="p-2">{item['DAERAH'] || '-'}</td>
                  <td className="p-2">{item['PROGRAM']}</td>
                  <td className="p-2">Rp {(item['JUMLAH PENERIMAAN'] || 0).toLocaleString()}</td>
                  <td className="p-2 space-x-1">
                    <button
                      onClick={() => setDetailItem(item)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => setEditItem(item)}
                      className="bg-teal-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && <div className="p-4 text-center text-gray-500">Tidak ada data untuk filter ini.</div>}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {detailItem && <DetailSalurModal data={detailItem} onClose={() => setDetailItem(null)} />}
      {editItem && <EditSalurModal data={editItem} onClose={() => setEditItem(null)} onSave={updateSalur} />}
    </div>
  );
}