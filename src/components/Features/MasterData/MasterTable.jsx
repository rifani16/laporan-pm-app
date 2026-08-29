import { useState } from 'react';
import EditModal from './EditModal';
import DetailPmModal from './DetailPmModal';
import Pagination from '../../Common/Pagination';
import { useToast } from '../../../hooks/useToast';

export default function MasterTable({ data, onUpdate, onDelete, currentPage, onPageChange, rowsPerPage = 10 }) {
  const { showToast } = useToast();
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginated = data.slice(startIndex, startIndex + rowsPerPage);

  const handleDelete = async (pm) => {
    const idPm = pm['ID PM'];
    const confirmed = window.confirm(
      `Hapus PM "${pm['NAMA PM']}" (${idPm})?\n\nTindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setDeletingId(idPm);
    try {
      const result = await onDelete(idPm);
      if (result?.success) {
        showToast('Data PM berhasil dihapus', 'success');
        if (paginated.length === 1 && currentPage > 1) onPageChange(currentPage - 1);
      } else {
        showToast('Gagal menghapus PM: ' + (result?.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* tabel sama seperti sebelumnya */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">No</th>
              <th className="p-2 text-left">Nama PM</th>
              <th className="p-2 text-left">Daerah</th>
              <th className="p-2 text-left">Total Penerimaan</th>
              <th className="p-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((pm, idx) => (
              <tr key={pm['ID PM']} className="border-b">
                <td className="p-2">{startIndex + idx + 1}</td>
                <td className="p-2 font-medium">{pm['NAMA PM']}</td>
                <td className="p-2">{pm['DAERAH'] || '-'}</td>
                <td className="p-2">Rp {(pm['TOTAL PENERIMAAN'] || 0).toLocaleString()}</td>
                <td className="p-2">
                  <div className="flex flex-col sm:flex-row gap-1">
                    <button onClick={() => setDetailItem(pm)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Detail</button>
                    <button onClick={() => setEditItem(pm)} className="bg-teal-600 text-white px-2 py-1 rounded text-xs">Edit</button>
                    <button
                      onClick={() => handleDelete(pm)}
                      disabled={deletingId === pm['ID PM']}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                    >
                      {deletingId === pm['ID PM'] ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSave={onUpdate} />}
      {detailItem && <DetailPmModal pm={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
}
