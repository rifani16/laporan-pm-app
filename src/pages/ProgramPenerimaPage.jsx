import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useToast } from '@/hooks/useToast';
import Pagination from "@/components/Common/Pagination";

// Modal Detail Transaksi
const DetailSalurModal = ({ item, onClose }) => {
  if (!item) return null;
  const jumlah = Number(item['JUMLAH PENERIMAAN']) || 0;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Detail Transaksi</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="space-y-2">
          <p><span className="font-semibold">ID Salur:</span> {item['ID SALUR']}</p>
          <p><span className="font-semibold">Nama Penerima:</span> {item['NAMA PM']}</p>
          <p><span className="font-semibold">Daerah:</span> {item['DAERAH']}</p>
          <p><span className="font-semibold">Program:</span> {item['PROGRAM']}</p>
          <p><span className="font-semibold">Bentuk Penerimaan:</span> {item['BENTUK PENERIMAAN'] || '-'}</p>
          <p><span className="font-semibold">Jumlah:</span> Rp {jumlah.toLocaleString()}</p>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-teal-600 text-white rounded">Tutup</button>
        </div>
      </div>
    </div>
  );
};

// Modal Edit Transaksi
const EditSalurModal = ({ item, onClose, onSave, showToast }) => {
  const { refData } = useData();
  const [form, setForm] = useState({
    PROGRAM: item?.PROGRAM || '',
    BENTUK_PENERIMAAN: item?.['BENTUK PENERIMAAN'] || '',
    JUMLAH_PENERIMAAN: item?.JUMLAH_PENERIMAAN || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.PROGRAM || !form.JUMLAH_PENERIMAAN) {
      showToast('Program dan Jumlah wajib diisi', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await onSave(item['ID SALUR'], form);
      if (result.success) {
        showToast('Transaksi berhasil diperbarui', 'success');
        onClose();
      } else {
        showToast('Gagal: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-5">
        <h2 className="text-xl font-bold mb-4">Edit Transaksi</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Program</label>
            <select
              className="w-full border rounded p-2"
              value={form.PROGRAM}
              onChange={e => setForm({ ...form, PROGRAM: e.target.value })}
            >
              <option value="">Pilih Program</option>
              {refData.program.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Bentuk Penerimaan</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={form.BENTUK_PENERIMAAN}
              onChange={e => setForm({ ...form, BENTUK_PENERIMAAN: e.target.value })}
              placeholder="Uang, Barang"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Jumlah Penerimaan (Rp)</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={form.JUMLAH_PENERIMAAN}
              onChange={e => setForm({ ...form, JUMLAH_PENERIMAAN: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">Batal</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-teal-600 text-white rounded">
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProgramPenerimaPage() {
  const { salurData, masterData, refData, updateSalur } = useData();
  const { showToast } = useToast();
  const [filterProgram, setFilterProgram] = useState('semua');
  const [filterDaerah, setFilterDaerah] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const rowsPerPage = 10;

  const enrichedSalur = useMemo(() => {
    return salurData.map(s => {
      const master = masterData.find(m => m['ID PM'] === s['ID PM']);
      // Pastikan jumlah adalah angka, default 0 jika undefined/null
      const jumlah = Number(s['JUMLAH PENERIMAAN']) || 0;
      return {
        ...s,
        'NAMA PM': master ? master['NAMA PM'] : s['NAMA PM'],
        'DAERAH': s['DAERAH'] || (master ? master['DAERAH'] : ''),
        'JUMLAH_PENERIMAAN': jumlah
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

  const handleEditSalur = async (idSalur, updatedData) => {
    return await updateSalur(idSalur, updatedData);
  };

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
              {paginatedData.map((item, idx) => {
                const jumlah = item['JUMLAH_PENERIMAAN'] ?? 0;
                return (
                  <tr key={item['ID SALUR']} className="border-b">
                    <td className="p-2">{startIndex + idx + 1}</td>
                    <td className="p-2 font-medium">{item['NAMA PM']}</td>
                    <td className="p-2">{item['DAERAH'] || '-'}</td>
                    <td className="p-2">{item['PROGRAM']}</td>
                    <td className="p-2">Rp {jumlah.toLocaleString()}</td>
                    <td className="p-2 space-x-1">
                      <button
                        onClick={() => setDetailItem(item)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => setEditItem(item)}
                        className="bg-teal-600 text-white px-2 py-1 rounded text-xs hover:bg-teal-700"
                      >
                        Edit
                      </button>
                    </td>
                   </tr>
                );
              })}
            </tbody>
          </table>
          {filteredData.length === 0 && <div className="p-4 text-center text-gray-500">Tidak ada data untuk filter ini.</div>}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {detailItem && <DetailSalurModal item={detailItem} onClose={() => setDetailItem(null)} />}
      {editItem && <EditSalurModal item={editItem} onClose={() => setEditItem(null)} onSave={handleEditSalur} showToast={showToast} />}
    </div>
  );
}